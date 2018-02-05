const path = require('path');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const Switches = require('../switch');

const huejay = require('huejay');
const huebris = require('../huebris');
const hueClient = new huejay.Client(huebris.credentials);


/* Feature Classes */
class Feature {
    /**
     * Feature constructor. Do not override.
     * @param data  Feature data
     */
    constructor(data) {
        this._enabled = this._verify(data);
        this._running = this.enabled && this._setup(data);
    }

    /**
     * Register the feature with the given socket object.
     * @param socket
     * @param event
     * @param callback
     * @returns {boolean}   True if the socket was registered.
     */
    register(socket, event, callback) {
        if (this.running) {
            socket.on(event, callback);
            return true;
        } else {
            console.log(`Feature ${this.constructor.name} is not running!`);
            return false;
        }
    }

    /**
     * Verify that the feature is enabled. This method must be overridden.
     * @param data          The feature's given dataset.
     * @returns {boolean}   True if the feature is enabled.
     */
    _verify(data) {
        return false;
    }

    /**
     * Feature setup method that executes if the feature is enabled.
     */
    _setup() {}

    get enabled() {
        return this._enabled;
    }

    get running() {
        return this._running;
    }
}

class Lightswitches extends Feature {
    _verify(data) {
        return data instanceof Object;
    }

    _setup(data) {
        this._switches = {};
        let props;
        for (let groupIndex in props = Object.getOwnPropertyNames(data)) {
            let group = props[groupIndex];
            let groupSwitches = data[group];
            this._switches[group] = {};
            for (let i in groupSwitches) {
                let groupSwitch = groupSwitches[i];
                try {
                    let {type, options} = groupSwitch;
                    options.client = hueClient;
                    options.callback = (item) => {
                        console.log(`CALLBACK CALLED FOR (${group}, ${options.name})`);
                        broadcast('updateLightswitch', {group: group, name: options.name, item: item});
                    };
                    this._switches[group][options.name] = new Switches[type](options);
                } catch (err) {
                    console.log('ERROR INITIALIZING SWITCH FROM CONFIG: '+groupSwitch);
                    console.log(err);
                }
            }
        }
        return Object.getOwnPropertyNames(this._switches).length > 0;
    }

    register(socket, event, callback) {
        let parent = this;
        let _callback = (data) => {
            console.log(this._switches);
            let {type, group, action} = data;
            console.log(`Lightswitch invoked. TYPE: ${type} | GROUP: ${group} | ACTION: ${action}`);
            let _switch = parent._switches[group][type];
            _switch.exec(action)();
            if (callback) {
                callback(data);
            }
        };
        return super.register(socket, event, _callback);
    }
}

class Thermometer extends Feature {
    // TODO: Build in feature for keeping history of readings
    _verify(data) {
        return data instanceof Object;
    }

    _setup(data) {
        this._thermostat = require('./thermostat');
        this._thermostat.farenheit = huebris.thermostat.farenheit;
        this._thermostat.timeout = huebris.thermostat.timeout;
        this._thermostat.callback = (readings) => {
            console.log(`Broadcasting updated thermostat readings. ${JSON.stringify(readings)}`);
            broadcast("updateThermostat", readings);
        };
        return this._thermostat.start();
    }

    register(socket, event, callback) {
        let _callback = (data) => {
            socket.emit('updateThermostat', this._thermostat.readings);
            if (callback) {
                callback(data);
            }
        };
        return super.register(socket, event, _callback);
    }
}

/* Client */
app.use(express.static('html'));
app.use('/css', express.static(path.join(__dirname, '/bower_components/weather-icons/css')));
app.use('/font', express.static(path.join(__dirname, '/bower_components/weather-icons/font')));
app.use('/css/bulma.css', express.static(path.join(__dirname, '/node_modules/bulma/css/bulma.css')));


/* Features */
const features = {
    thermostat: new Thermometer(/*huebris.thermostat/*disabled*/),
    lightswitches: new Lightswitches(huebris.switches)
};
function getFeatureList() {
    let list = {};
    let names;
    for (let i in names = Object.getOwnPropertyNames(features)) {
        let feature = features[names[i]];
        if (feature) {
            list[names[i]] = feature.running;
        }
    }
    return list;
}


/* Server */
function broadcast(event, data) {
    io.emit(event, data);
}

io.on('connection', (socket) => {
    console.log('Client connected!');
    socket.emit('features', getFeatureList());

    /* Thermostat */
    features.thermostat.register(socket, 'thermostat');

    /* Lightswitches */
    features.lightswitches.register(socket, 'lightswitch');
});

http.listen(3000, function() {
    console.log('listening on *:3000');
});