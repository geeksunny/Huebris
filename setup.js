const chalk = require('chalk');
const clear = require('clear');
const CLI = require('clui');
const inquirer = require('inquirer');
const figlet = require('figlet');
const Spinner = CLI.Spinner;
const files = require('./libs/files');
const HueApi = require('node-hue-api');
const Stepper = require('./libs/stepper');
const RESULT = Stepper.RESULT;


// TODO: Rewrite using huejay library - https://github.com/sqmk/huejay
// TODO: Make this a command-line parameter.
// TODO: Add config testing, prompt on existing file
const CONFIG_FILE_PATH = './huebris.json';


const Config = function(filePath = null) {
    this.bridge = null;
    this.devname = null;
    this.username = null;

    if (filePath) {
        this.load(filePath);
    }
};

Config.prototype.load = function(filePath) {
    let cfg = files.readFileAsJSON(filePath);
    if (cfg) {
        this.bridge = cfg.bridge;
        this.devname = cfg.devname;
        this.username = cfg.username;
    }
};

Config.prototype.save = function(filePath) {
    return files.saveObjectAsJSONFile(this, filePath, true);
};


const ourConfig = new Config();

let steps = [
    {
        action: init,
        validate: null
    },
    {   // 1) Scan for bridges
        action: searchForBridges,
        validate: validateSearchForBridges
    },
    {   // 2) Register with bridge
        action: registerWithBridge,
        validate: validateRegisterWithBridge
    },
    {   // 3) Save config file
        action: saveConfigToFile,
        validate: null
    }
];

/********/

function init() {
    // Set current working directory
    files.getCurrentDirectoryBase();
    // Start UI
    clear();
    console.log(
        chalk.yellow(
            figlet.textSync('Huebris', {horizontalLayout: 'full'})
        )
    );
    // if (files.fileExists(CONFIG_FILE_PATH)) {
    //     // TODO: prompt for overwrite or exit
    // }
}


/**
 * Search for Hue bridges and prompt for user selection.
 * @returns {String} The IP address of the selected bridge.
 */
async function searchForBridges() {
    let bridge = null;
    let status = new Spinner('Searching for Hue bridges...');
    const onAnswer = function(answer) {
        // console.log('onAnswer executed');
        return new Promise(((resolve, reject) => {
            bridge = answer.bridge;
            resolve();
        }));
    };
    const onResult = async function(results) {
        status.stop();
        // console.log(JSON.stringify(results));
        //  TODO: if results is empty, RED TEXT message and prompt for re-scan.
        let questions = [{
            name: 'bridge',
            message: 'Select the bridge you\'d like to configure.',
            type: 'list',
            choices: function () {
                const choices = [];
                for (i in results) {
                    let item = results[i];
                    let add = {
                        name: item.id+' ('+item.ipaddress+')',
                        short: item.id,
                        value: item
                    };
                    choices.push(add);
                }
                choices.push(
                    new inquirer.Separator(),
                    {
                        name: 'Re-scan for bridges',
                        value: RESULT.repeat
                    },
                    {
                        name: 'Cancel & exit',
                        value: RESULT.exit
                    }
                );
                return choices;
            }
        }];
        await inquirer.prompt(questions).then(onAnswer).catch(onFailure);
    };
    const onFailure = function() {
        status.stop();
        // console.log('searchForBridges.onFailure invoked.');
    };
    status.start();
    await HueApi.nupnpSearch().then(onResult).catch(onFailure);
    return bridge;
}

function validateSearchForBridges(result) {
    if (result === null) {
        return RESULT.exitError;
    }
    ourConfig.bridge = result;
    return RESULT.continue;
}


async function registerWithBridge(bridge) {
    //
    const os = require('os');
    let hue = new HueApi.HueApi(); // TODO: Should this be moved up one level?
    let registrationResult = null;
    const onResult = function(result) {
        // console.log('registerWithBridge.onResult executed');
        // console.log('result: '+JSON.stringify(result));
        return new Promise((resolve, reject) => {
            registrationResult.username = result;
            resolve();
        });
    };
    const onFailure = function(err) {
        // console.log('registerWithBridge.onFailure invoked.');
        // console.log('reason: '+JSON.stringify(err));
        // TODO: Does this need to be wrapped in a promise?
        registrationResult = RESULT.repeat;
    };
    const onAnswer = async function(answer) {
        // console.log('registerWithBridge.onAnswer executed');
        // TODO: Should the devname be saved for re-tries?
        registrationResult = { devname: answer.device_desc };
        await hue.registerUser(bridge.ipaddress, answer.device_desc).then(onResult).catch(onFailure);
    };
    let questions = [{
        name: 'device_desc',
        message: 'Define a name for this Hue client.',
        type: 'input',
        default: 'Huebris Client '+os.hostname(),
        validate: function(answer) {
            return (!answer.length) ? "This value cannot be blank." : true;
        }
    },{
        name: 'wait',
        message: 'Please press the link button on the Hue hub and then press enter.',
        type: 'input'
    }];
    await inquirer.prompt(questions).then(onAnswer);
    return registrationResult;
}

function validateRegisterWithBridge(result) {
    if (result === null) {
        return RESULT.exitError;
    }
    // TODO: Wrap this in try/catch
    ourConfig.devname = result.devname;
    ourConfig.username = result.username;
    return RESULT.continue;
}


async function saveConfigToFile() {
    console.log("Saving configuration to "+CONFIG_FILE_PATH);
    let success = ourConfig.save(CONFIG_FILE_PATH);
    console.log("Save success: "+success);
    return RESULT.continue;
}


(async function() {
    await new Stepper(steps).run();
    console.log("Finished.");
})();
