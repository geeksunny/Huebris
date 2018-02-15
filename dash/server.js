const path = require('path');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const tools = require('../libs/tools');


/* Server Configuration */
const huebris = require('../huebris');
/* Command line arguments */
const optionDefinitions = [
    { name: 'hostnames', type: String, multiple: true, defaultOption: true, defaultValue: '' }
];
const options = require('command-line-args')(optionDefinitions);


/* Client */
app.use(express.static('html'));
app.use('/css', express.static(path.join(__dirname, '/bower_components/weather-icons/css')));
app.use('/font', express.static(path.join(__dirname, '/bower_components/weather-icons/font')));
app.use('/css/bulma.css', express.static(path.join(__dirname, '/node_modules/bulma/css/bulma.css')));

/* Features */
const { ServerFeatureManager } = require('./features/features');
const featureMgr = new ServerFeatureManager(io, app);

const Lightswitches = require('./features/lightswitches');
let lightswitches = featureMgr.register(Lightswitches, huebris.lightswitches);

const Thermometer = require('./features/thermometer');
let thermo = featureMgr.register(Thermometer, huebris.thermostat);

const Weather = require('./features/weather');
let weather = featureMgr.register(Weather, huebris.weather);

const features = featureMgr.features;
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


/* Logger */
const Log = require('./log').logger('Server');


/* Server */
const CLIENTS = {}; // { `UUID`: `clientIP` }'

function broadcast(event, data) {
    io.emit(event, data);
}

function newUuid() {
    return require('uuid/v4')();
}

io.on('connection', (socket) => {
    Log(`Client connected! IP: ${socket.handshake.address}`);

    socket.on('uuid', (uuid, ack) => {
        if (tools.isEmpty(uuid)) {
            console.log(`Creating new UUID!`);
            uuid = newUuid();
            ack(uuid);
        }
        CLIENTS[uuid] = socket.handshake.address;
        Log(`UUID ${uuid} registered with ${JSON.stringify(CLIENTS[uuid])}`);
        console.log();
    });

    socket.emit('features', getFeatureList());

    socket.on('requestAll', (data) => {
        Log('Performing full feature data refresh');
        tools.forEach(features, (feature, name) => {
            Log('Refreshing data for '+name);
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
        Log(`Server listening on ${hostname}:3000`);
    })
}));