const imu = require('nodeimu');
const pi = require('node-raspi');

const IMU = new imu.IMU();


class Thermostat {
    constructor(farenheit = false) {
        this._farenheit = farenheit;
        this._cpuTemperature = 0;
        this._temperature = 0;
        this._pressure = 0;
        this._humidity = 0;
    }

    static toFarenheit(celsius) {
        return (((celsius / 5) * 9) + 32);
    }

    update() {
        return new Promise((resolve, reject) => {
            IMU.getValue((err, data) => {
                if (err != null) {
                    reject(err);
                } else {
                    // console.log('IMU DATA PROPERTIES :::');
                    // console.log(Object.getOwnPropertyNames(data));
                    // console.log(JSON.stringify(data));

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
                    let ambientTemp =
                        ((hatTemp + hatTempFromPressure + hatTempFromHumidity) / 3) - (this._cpuTemperature / 5);
                    this._temperature = (this._farenheit) ? Thermostat.toFarenheit(ambientTemp) : ambientTemp;

                    let result = {
                        temperature: this._temperature,
                        pressure: this._pressure,
                        humidity: this._humidity,
                        ambientTempC: ambientTemp
                    };
                    console.log(result);
                    resolve(result);
                }
            });
        });
    }

    get temperature() {
        return this._temperature;
    }

    get temperatureFormatted() {
        // TODO: Format this as a string with &deg; and C/F
        return this._temperature;
    }

    get pressure() {
        return this._pressure;
    }

    get humidity() {
        return this._humidity;
    }
}

module.exports = Thermostat;

/** ~~~~~~~~~~ **/

let stat = new Thermostat(true);
stat.update().then(reading => {
    console.log(JSON.stringify(reading));
});