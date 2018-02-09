const imu = require('nodeimu');
const pi = require('node-raspi');

let IMU = null;
try {
    IMU = new imu.IMU();
} catch (err) {
    console.log("Thermostat hardware not found!");
}


class Thermostat {
    constructor() {
        this._initialized = IMU !== null;
        this._inFarenheit = false;
        this._cpuTemperature = 0;
        this._ambientTemperature = 0;
        this._pressure = 0;
        this._humidity = 0;
        this._timeout = 0;
        this._callback = null;
        this._timeoutJob = null;
    }

    static toFarenheit(celsius) {
        return (((celsius / 5) * 9) + 32);
    }

    update() {
        return new Promise((resolve, reject) => {
            if (!this.initialized) {
                reject('Thermostat is not initialized!');
                return;
            }
            IMU.getValue((err, data) => {
                if (err != null) {
                    reject(err);
                } else {
                    let {
                        temperature:hatTemp,
                        pressure:hatPressure,
                        humidity:hatHumidity,
                        temperatureFromPressure:hatTempFromPressure,
                        temperatureFromHumidity:hatTempFromHumidity
                    } = data;
                    this._pressure = hatPressure;
                    this._humidity = hatHumidity;

                    this._cpuTemperature = pi.getThrm();
                    this._ambientTemperature =
                        ((hatTemp + hatTempFromPressure + hatTempFromHumidity) / 3) - (this._cpuTemperature / 5);

                    resolve(this.readings);
                }
            });
        });
    }

    start(immediate = true, timeout = null, callback = null, restart = false) {
        if (!this.initialized) {
             throw 'Thermostat is not initialized!';
        }
        if (this._timeoutJob !== null) {
            if (restart) {
                this.stop();
            } else {
                throw "A timeout job is already started and must first be stopped.";
            }
        }
        if (timeout !== null) {
            this.timeout = timeout;
        }
        if (callback != null) {
            this.callback = callback;
        }
        if (immediate) {
            this._exec()();
        }
        try {
            this._timeoutJob = setInterval(this._exec(), this.timeout);
            return true;
        } catch (err) {
            return false;
        }
    }

    stop() {
        if (this._timeoutJob !== null) {
            clearInterval(this._timeoutJob);
            this._timeoutJob = null;
        }
    }

    _exec() {
        let parent = this;
        return () => {
            parent.update().then((readings) => {
                // TODO: Revisit this to ensure promises work here.
                parent.callback(readings);
            }).catch((err) => {
                parent.callback(this.readings); // CPU Temp will still be sent.
                console.log("Error encountered while executing callback.");
                console.log(err);
            });
        };
    }

    get initialized() {
        return this._initialized;
    }

    get temperature() {
        if (!this._initialized) {
            return null;
        }
        return (this._inFarenheit) ? Thermostat.toFarenheit(this._ambientTemperature) : this._ambientTemperature;
    }

    get temperatureFormatted() {
        if (!this._initialized) {
            return null;
        }
        let label = (this._inFarenheit) ? "F" : "C";
        return `${this.temperature.toFixed(1)} °${label}`;
    }

    get pressure() {
        if (!this._initialized) {
            return null;
        }
        return this._pressure;
    }

    get humidity() {
        if (!this._initialized) {
            return null;
        }
        return this._humidity;
    }

    get cpuTemperature() {
        return this._cpuTemperature;
    }

    set farenheit(inFarenheit) {
        this._inFarenheit = inFarenheit;
    }

    get farenheit() {
        return this._inFarenheit;
    }

    set timeout(timeout) {
        if (timeout <= 0) {
            throw "Timeout must be a postive number!";
        }
        this._timeout = timeout;
    }

    get timeout() {
        return this._timeout;
    }

    set callback(callback) {
        if (!(callback instanceof Function || callback instanceof Promise)) {
            throw "Callback must be a function or Promise";
        }
        this._callback = callback;
    }

    get callback() {
        return this._callback;
    }

    get readings() {
        return {
            temperature: this.temperature,
            temperatureFormatted: this.temperatureFormatted,
            farenheit: this.farenheit,
            pressure: this.pressure,
            humidity: this.humidity,
            cpuTemperature: this.cpuTemperature
        }
    }
}

module.exports = new Thermostat();