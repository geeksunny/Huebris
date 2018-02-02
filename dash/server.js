const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const Switches = require('../switch');


app.use(express.static('html'));
app.get('/css/bulma.css', function(req, res) {
    res.sendFile(__dirname + '/node_modules/bulma/css/bulma.css');
});

io.on('connection', (socket) => {
    let switches = {
        2: new Switches.GroupToggleSwitch({
            name: 'Bedroom',
            ids: [2],
            callback: (item) => {
                console.log('Bedroom callback called!');
                socket.emit('finished', 'toggle', 2);
            }
        }),
        6: new Switches.GroupToggleSwitch({
            name: 'Living Room',
            ids: [6],
            callback: (item) => {
                socket.emit('finished', 'toggle', 6);
                console.log('Living Room callback called!');
            }
        })
    };
    let dimmers = {
        2: new Switches.GroupDimmerSwitch({
            name: 'Bedroom',
            ids: [2],
            callback: (item, argument) => {
                console.log('Bedroom dimmer: '+argument);
                socket.emit('finished', 'dimmer', 2);
            }
        }),
        6: new Switches.GroupDimmerSwitch({
            name: 'Bedroom',
            ids: [6],
            callback: (item, argument) => {
                console.log('Bedroom dimmer: '+argument);
                socket.emit('finished', 'dimmer', 6);
            }
        })
    };

    socket.on('toggle', (group) => {
        console.log('Toggle invoked. '+group);
        let _switch = switches[group];
        _switch.exec()();
    });

    socket.on('dimmer', (group, action) => {
        console.log('Dimmer invoked. '+group+' | action: '+action);
        let _switch = dimmers[group];
        _switch.exec(action)();
    });
});

http.listen(3000, function() {
    console.log('listening on *:3000');
});