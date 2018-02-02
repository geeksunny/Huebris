const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const Switches = require('../switch');

const huejay = require('huejay');
const credentials = require('../huebris');
const hueClient = new huejay.Client(credentials);


app.use(express.static('html'));
app.get('/css/bulma.css', function(req, res) {
    res.sendFile(__dirname + '/node_modules/bulma/css/bulma.css');
});

io.on('connection', (socket) => {
    console.log('connected');
    let switches = {
        2: new Switches.GroupToggleSwitch({
            name: 'Bedroom',
            client: hueClient,
            ids: [2],
            defaults: {
                brightness: 254,
                hue: 41442,
                saturation: 75,
                on: true
            },
            callback: (item) => {
                console.log('Bedroom callback called!');
                socket.emit('finished', 'toggle', 2);
            }
        }),
        6: new Switches.GroupToggleSwitch({
            name: 'Living Room',
            client: hueClient,
            ids: [6],
            defaults: {
                brightness: 254,
                hue: 41442,
                saturation: 75,
                on: true
            },
            callback: (item) => {
                socket.emit('finished', 'toggle', 6);
                console.log('Living Room callback called!');
            }
        })
    };
    let dimmers = {
        2: new Switches.GroupDimmerSwitch({
            name: 'Bedroom',
            client: hueClient,
            ids: [2],
            callback: (item, argument) => {
                console.log('Bedroom dimmer: '+argument);
                socket.emit('finished', 'dimmer', 2);
            }
        }),
        6: new Switches.GroupDimmerSwitch({
            name: 'Bedroom',
            client: hueClient,
            ids: [6],
            callback: (item, argument) => {
                console.log('Living Room dimmer: '+argument);
                socket.emit('finished', 'dimmer', 6);
            }
        })
    };
    let sceneCyclers = {
        2: new Switches.GroupSceneCyclerSwitch({
            name: 'Bedroom',
            client: hueClient,
            ids: [2],
            // TODO: Make items' values retrieved at init?
            items: [
                "JYENfsx44Oha6OB",  // Read
                "McLj5EnR5zIzsTz",  // Relax
                "qHgAk9tHfL8pyst",  // Concentrate
                "dRBxFnpi5iZLw8O",  // Nightlight
                "7rpnhufF4XxkHOr",  // Energize
                "FEsqa07hXbR-q8V",  // Bright
                "3dFnrWm6q8Z6uYT"   // Dimmed
            ],
            callback: (item, argument) => {
                console.log('Bedroom Scene Cycler called!');
                socket.emit('finished', 'presets', 2);
            }
        }),
        6: new Switches.GroupSceneCyclerSwitch({
            name: 'Living Room',
            client: hueClient,
            ids: [6],
            items: [
                "TDC7v5PhcDwan8n",  // Read
                "h0UA91WTpbHm-YF",  // Relax
                "lx-NwIZlKYyiH7P",  // Concentrate
                "iTsgT8bNmPqrVx3",  // Nightlight
                "bqAXSBw78iuNdRh",  // Energize
                "FpLMQSYYpnyJZIh",  // Bright
                "1o3jcKS3kiCCwRW"   // Dimmed
            ],
            callback: (item, argument) => {
                console.log('Living Room Scene Cycler called!');
                socket.emit('finished', 'presets', 6);
            }
        })
    };

    socket.on('toggle', (group, action) => {
        console.log('Toggle invoked. '+group+' | action: '+action);
        let _switch = switches[group];
        _switch.exec(action)();
    });

    socket.on('dimmer', (group, action) => {
        console.log('Dimmer invoked. '+group+' | action: '+action);
        let _switch = dimmers[group];
        _switch.exec(action)();
    });

    socket.on('presets', (group, action) => {
        console.log('Presets invoked. '+group+' | action: '+action);
        let _switch = sceneCyclers[group];
        _switch.exec(action)();
    })
});

http.listen(3000, function() {
    console.log('listening on *:3000');
});

try {
    let dashButtons = {
        deskToggle: new Switches.LightDashButtonToggleSwitch({
            name: 'Desk Toggle',
            description: 'Nerf button',
            client: hueClient,
            mac: '18:74:2e:8b:84:ab',
            ids: [8]
        })
    };
} catch (err) {
    console.log('DASH BUTTON ERROR! Probably wasn\'t run with sudo.');
    console.log(err);
}