const { ClientFeature, ServerFeature } = require('./features');


// TODO: ClientFeature class for UI updating
class ThermometerClient extends ClientFeature {

    get ui() {
        return this._elems;
    }

    set ui(parentNode) {
        this._elems = {
            thermostat: parentNode.querySelector('#thermostat-value')
        };
    }
}

class ThermometerServer extends ServerFeature {
    // TODO: Build in feature for keeping history of readings
    _verify(data) {
        return data instanceof Object;
    }

    _setup(data) {
        this._thermostat = require('../thermostat');
        this._thermostat.farenheit = data.farenheit;
        this._thermostat.timeout = data.timeout;
        this._thermostat.callback = (readings) => {
            console.log(`Broadcasting updated thermostat readings. ${JSON.stringify(readings)}`);
            this.manager._broadcast("updateThermostat", readings);
        };
        try {
            return this._thermostat.start();
        } catch (err) {
            return false;
        }
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

    unregister(data) {
        // TODO
    }

    update(socket) {
        socket.emit('updateThermostat', this._thermostat.readings);
    }
}

module.exports = { name: 'Thermometer', server: ThermometerServer };