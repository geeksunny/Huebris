const aggregation = require('aggregation/es6');
const huejay = require('huejay');
const credentials = require('./huebris');
const hueClient = new huejay.Client(credentials);


/**
 *
 * {
 *    client: hueClient,    // required
 *    name: name,           // required
 *    mac: mac,             // required
 *    ids: [                // required
 *        '8'
 *    ],
 *    colors: [
 *        'color obj'
 *    ],
 *    scenes: [
 *        'scene'
 *    ],
 *    states: [
 *        'state'
 *    ]
 * };
 *
 */

// TODO: Move DashButton stuff to a subclass; Create another subclass for use on dashboard
class Switch {
    constructor(options) {
        this.name = options.name;
        this.hueClient = options.client;
        this.ids = options.ids;
        this.button = new Btn(options.name, options.mac, this.exec(), true);
    };

    exec() {
        const parent = this;
        return () => {
            for (let id in parent.ids) {
                let item = parent.ids[id];
                let api = parent.getApi(parent.hueClient);
                api.getById(item).then(item => {
                    console.log('Performing action');
                    parent.performAction(item);
                    api.save(item);
                }).then(item => {
                    console.log('Action performed');
                }).catch(reason => {
                    console.log('ERROR --');
                    console.log(JSON.stringify(reason));
                });
            }
        };
    }

    getApi(hueClient) {}
    performAction(item) {}
}

/** ~~~~~~~~~~ **/

class Action {
    initializer(options) {}
    performAction(obj) {}
}

class Toggle extends Action {
    initializer(options) {
        super.initializer(options);
    }

    performAction(obj) {
        obj.on = !obj.on;
    }
}

class Cycler extends Action {
    // TODO: Works on dimming, scenes, etc
    initializer(options) {
        super.initializer(options);
        this.index = 0;
        this.items = options.items;
    }

    performAction(obj) {
        // TODO: sets item, increments index
    }
}

class Dimmer extends Cycler {

    initializer(options) {
        return super.initializer(options);
    }

    performAction(obj) {
        return super.performAction(obj);
    }
}

/** ~~~~~~~~~~ **/

class HueAdapter {
    initializer(options) {}
    getApi(hueClient) {}
}

class Light extends HueAdapter {
    initializer(options) {
        super.initializer(options);
    }

    getApi(hueClient) {
        return hueClient.lights;
    }
}

class Group extends HueAdapter {
    initializer(options) {
        super.initializer(options);
    }

    getApi(hueClient) {
        return hueClient.groups;
    }
}

/** ~~~~~~~~~~ **/

class LightToggleSwitch extends aggregation(Switch, Light, Toggle) {}
class GroupToggleSwitch extends aggregation(Switch, Group, Toggle) {}

class LightDimmerSwitch extends aggregation(Switch, Light, Dimmer) {}
class GroupDimmerSwitch extends aggregation(Switch, Group, Dimmer) {}

/** ~~~~~~~~~~ **/

const Btn = require('./libs/btn').Btn;
const SWITCH_MAC_ADDR = '18:74:2e:8b:84:ab';    // Nerf

let lSwitch = new LightToggleSwitch({
    client: hueClient,
    name: 'nerf button toggle switch',
    mac: SWITCH_MAC_ADDR,
    ids: ['8']
});
console.log('Switch created.');