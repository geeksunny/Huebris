const path = require('path');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const tools = require('../libs/tools');
const WeatherApi = require('./weather');


/* Server Configuration */
const huebris = require('../huebris');
/* Command line arguments */
const optionDefinitions = [
    { name: 'hostnames', type: String, multiple: true, defaultOption: true, defaultValue: '' }
];
const options = require('command-line-args')(optionDefinitions);
console.log(options);


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

    update(socket) {
        // TODO: document override purpose
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
    _setup(data) {}

    get enabled() {
        return this._enabled;
    }

    get running() {
        return this._running;
    }
}

class Weather extends Feature {
    update(socket) {
        // TODO: Add ability to force a refresh
        this._weather.update().then((data) => {
            socket.emit('updateWeather', data);
        }).catch((err) => {
            socket.emit('updateWeather', {error: err});
        });
    }

    _verify(data) {
        return data instanceof Object;
    }

    _setup(data) {
        this._weather = new WeatherApi.Weather(data);
    }
}


/* Client */
app.use(express.static('html'));
app.use('/css', express.static(path.join(__dirname, '/bower_components/weather-icons/css')));
app.use('/font', express.static(path.join(__dirname, '/bower_components/weather-icons/font')));
app.use('/css/bulma.css', express.static(path.join(__dirname, '/node_modules/bulma/css/bulma.css')));

WeatherApi.parseIconMap().then((map) => {
    app.use('/js/weatherData.js', (req, res) => {
        // TODO: Serve UI's Weather feature class here as well. export both classes.
        res.set('Content-Type', 'application/JavaScript');
        res.send(`'use strict';
        
        const ICON_MAP = ${JSON.stringify(map)};
        
        ${WeatherApi.Data.toString()}
        
        export default { Data, ICON_MAP };`);
    });
}).catch((err) => {
    console.log(err);
});

/* Features */
const { FeatureManager } = require('./features/features');
const featureMgr = new FeatureManager(io);

const Lightswitches = require('./features/lightswitches');
featureMgr.register(Lightswitches, huebris.lightswitches);

const Thermometer = require('./features/thermometer');
let thermo = featureMgr.register(Thermometer, huebris.thermostat);

const features = {
    thermostat: thermo,
    lightswitch: featureMgr.getFeature(Lightswitches.name),
    weather: new Weather(huebris.weather)
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
const CLIENTS = {}; // { `UUID`: `clientIP` }'

function broadcast(event, data) {
    io.emit(event, data);
}

function newUuid() {
    return require('uuid/v4')();
}

io.on('connection', (socket) => {
    // TODO: Add log functions/class to manage client activity logs
    console.log(`Client connected! IP: ${socket.handshake.address}`);

    socket.on('uuid', (uuid, ack) => {
        if (tools.isEmpty(uuid)) {
            console.log(`Creating new UUID!`);
            uuid = newUuid();
            ack(uuid);
        }
        CLIENTS[uuid] = socket.handshake.address;
        console.log(`UUID ${uuid} registered with ${JSON.stringify(CLIENTS[uuid])}`);
    });

    socket.emit('features', getFeatureList());

    socket.on('requestAll', (data) => {
        console.log('Performing full feature data refresh');
        tools.forEach(features, (feature, name) => {
            console.log('Refreshing data for '+name);
            feature.update(socket, true);
        });
    });

    /* Thermostat */
    features.thermostat.register(socket, 'thermostat');

    /* Lightswitches */
    features.lightswitch.register(socket, 'lightswitch');
});

options.hostnames.forEach(((hostname) => {
    http.listen({
        host: hostname,
        port: 3000
    }, () => {
        console.log(`Server listening on ${hostname}:3000`);
    })
}));