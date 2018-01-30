// TODO: Rewrite using huejay library - https://github.com/sqmk/huejay
const HueApi = require('node-hue-api');
const Waiter = require('./libs/waiter');

const REFRESH_RATE = 5000;  // 5s interval
const DEFAULT_HARDWARE_BULB_COLOR = {
    bri: 254,
    hue: 8418,
    sat: 140
};
const CHANGE_TO_BULB_COLOR = {
    bri: 254,
    hue: 41442,
    sat: 75
};

const config = require('./huebris');
const api = new HueApi.HueApi(config.bridge.ipaddress, config.username);
const lightState = HueApi.lightState;
const bulbs = {};


const Bulb = function(hueLight) {
    this.id = hueLight.id;
    this.color = {
        bri: hueLight.state.bri,
        hue: hueLight.state.hue,
        sat: hueLight.state.sat
    };
    this.checkColor = false;
    this.reachable = hueLight.state.reachable;
};

Bulb.prototype.update = function(hueLight) {
    this.color = {
        bri: hueLight.state.bri,
        hue: hueLight.state.hue,
        sat: hueLight.state.sat
    };
    let newReachable = hueLight.state.reachable;
    this.checkColor = (!this.reachable && newReachable);
    this.reachable = newReachable;
};

Bulb.prototype.needsDefaulting = function() {
    // TODO: Should we ensure that the bulb is set to ON already?
    // && this.checkColor
    return this.color.bri === DEFAULT_HARDWARE_BULB_COLOR.bri &&
        this.color.hue === DEFAULT_HARDWARE_BULB_COLOR.hue &&
        this.color.sat === DEFAULT_HARDWARE_BULB_COLOR.sat;
};


async function setDefaultedColor(bulb) {
    let state = lightState.create()
        .bri(CHANGE_TO_BULB_COLOR.bri)
        .hue(CHANGE_TO_BULB_COLOR.hue)
        .sat(CHANGE_TO_BULB_COLOR.sat);
    await api.setLightState(bulb.id, state).done();
}

function handleLights(result) {
    return new Promise((resolve, reject) => {
        for (let li in result.lights) {
            let hueLight = result.lights[li];
            let id = hueLight.id;
            if (bulbs.hasOwnProperty(id) && bulbs[id]) {
                bulbs[id].update(hueLight);
            } else {
                bulbs[id] = new Bulb(hueLight);
            }
            if (bulbs[id].needsDefaulting()) {
                setDefaultedColor(bulbs[id]);
                bulbs[id].checkColor = false;   // TODO: This should move into setDefaultedColor()
                // TODO: should bulbs be batched when color defaulting happens?
            }
        }
        resolve();
    });
}

function onError(err) {
    return new Promise((resolve, reject) => {
        // todo: print error, stop program
        console.log('onError :: '+err);
        resolve();
    });
}


(async function() {
    while (true) {
        console.log('\n['+Date.now()+'] Running defaulter check.');
        await api.lights()
            .then(handleLights)
            .catch(onError);
        await Waiter.sleep(REFRESH_RATE);
    }
})();