const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const Switches = require('../switch');

const huejay = require('huejay');
const huebris = require('../huebris');
const hueClient = new huejay.Client(huebris.credentials);


app.use(express.static('html'));
app.use('/css', express.static(path.join(__dirname, '/bower_components/weather-icons/css')));
app.use('/font', express.static(path.join(__dirname, '/bower_components/weather-icons/font')));
app.use('/css/bulma.css', express.static(path.join(__dirname, '/node_modules/bulma/css/bulma.css')));


io.on('connection', (socket) => {
    console.log('connected');

    // TODO: Move this to a spot where it will run only once. Let the callback get socket passed in for immediate use.
    let switches = {};
    for (let group in huebris.switches) {
        let groupSwitches = huebris.switches[group];
        switches[group] = {};
        for (let i in groupSwitches) {
            let groupSwitch = groupSwitches[i];
            try {
                let {type, options} = groupSwitch;
                options.client = hueClient;
                options.callback = (item) => {
                    console.log(`CALLBACK CALLED FOR (${group}, ${options.name})`);
                    socket.emit('finished', group, options.name, item); // TODO: pass action back here; combine data into single object
                };
                switches[group][options.name] = new Switches[type](options);
            } catch (err) {
                console.log('ERROR INITIALIZING SWITCH FROM CONFIG: '+groupSwitch);
                console.log(err);
            }
        }
    }

    socket.on('lightswitch', (data) => {
        let {type, group, action} = data;
        console.log(`Lightswitch invoked. TYPE: ${type} | GROUP: ${group} | ACTION: ${action}`);
        let _switch = switches[group][type];
        _switch.exec(action)();
    });
});

http.listen(3000, function() {
    console.log('listening on *:3000');
});