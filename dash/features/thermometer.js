const { ClientFeature, ServerFeature } = require('./features');


const NAME = 'Thermometer';

// TODO: ClientFeature class for UI updating
class ThermometerClient extends ClientFeature {

    get name() {
        return NAME;
    }

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
    get name() {
        return NAME;
    }

    // TODO: Build in feature for keeping history of readings
    _verify(data) {
        return data instanceof Object;
    }

    _setup(data) {
        this._thermostat = require('../thermostat');
        this._thermostat.farenheit = data.farenheit;
        this._thermostat.timeout = data.timeout;
        this._thermostat.callback = (readings) => {
            this.log(`Broadcasting updated thermostat readings. ${JSON.stringify(readings)}`);
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

module.exports = { server: ThermometerServer, client: ThermometerClient };