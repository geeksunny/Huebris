const tools = require('../libs/tools');
const api = require('openweather-apis');


/** CONFIG EXAMPLE **/
// let config = {
//     "appId": "abcdefg1234567",
//     "lang": "en",
//     "cityId": "4887398",
//     // coordinates: { 41.90326, -87.631429 },   // alternative to cityId. cityId is preferred.
//     // zipCode: '60610',                        // alternative to cityId. cityId is preferred.
//     "units": "imperial"
// };


const MINIMUM_UPDATE_INTERVAL = 600000; // 10 minutes, recommended / preferred minimum interval
const MAXIMUM_DAILY = 16;



const parseIconMap = () => {
    const parser = require('./weather-icon-parser');
    return parser.parse();
};

class Data {
    constructor(data) {
        // TODO: Add option for rounding values in formatted strings
        // this.units = units;  // TODO: Add code for passing in value for `units`
        if (data) {
            Object.getOwnPropertyNames(data).forEach((key) => {
                this[key] = data[key];
            });
        }
    }

    parseWeather(json) {
        this._cityId = json.id;
        this._cityName = json.name;
        this._country = json.sys.country;
        this._sunrise = json.sys.sunrise;
        this._sunset = json.sys.sunset;
        this._timeCalculated = json.dt;
        this._conditions = json.weather;        // [{id main description icon}]
        this._temperature = json.main.temp;
        this._pressure = json.main.pressure;
        this._humidity = json.main.humidity;
        this._wind = json.wind;                 // {speed, deg}
        this._cloudiness = json.clouds.all;
        this._precipitation = {
            rain: (json.rain) ? json.rain['3h'] : null,
            snow: (json.snow) ? json.snow['3h'] : null
        };
        this._coordinates = json.coord;         // {lat, lon}
        // TODO: parse these values?
        // json.main.temp_min
        // json.main.temp_max
        // json.main.sea_level (pressure)
        // json.main.grnd_level (pressure)
    }

    parseForecast(json) {
        throw "Not implemented!";
    }

    parseDailyForecast(json) {
        throw "Not implemented!";
    }

    _temperatureSuffix(lowercase = false) {
        // TODO: Make `lowercase` a configuration option
        // TODO: Add configurable string templates for formatted values OR setter for suffixes
        switch (this.units) {
            case 'imperial':
            default:
                return (lowercase) ? 'f' : 'F';
            case 'metric':
                return (lowercase) ? 'c' : 'C';
            case 'internal':
                return (lowercase) ? 'k' : 'K';
        }
    }

    _speedSuffix(/*lowercase = false*/) {
        // TODO: Fill this out
        return "mph";
    }


    get cityId() {
        return this._cityId;
    }

    get city() {
        // TODO: Add a geocoding library for "City, State Zip" data
        return this._cityName;
    }

    get sunrise() {
        return new Date(this._sunrise * 1000);
    }

    get sunset() {
        return new Date(this._sunset * 1000);
    }

    get daytime() {
        let now = Date.now();
        let sunrise = this._sunrise * 1000;
        let sunset = this._sunset * 1000;
        return now >= sunrise && now < sunset;
        // todo: use tools.withinRange when import system worked out for client side
        // return tools.withinRange(Date.now(), this._sunrise * 1000, this._sunset * 1000);
    }

    get timeCalculated() {
        return new Date(this._timeCalculated * 1000);
    }

    get sunriseString() {
        // TODO: Make time string format configurable. this.timeOptions = {'hour':'numeric','minute':'numeric'} ??
        return this.sunrise.toLocaleTimeString('en-US', {'hour':'numeric','minute':'numeric'});
    }

    get sunsetString() {
        // TODO: Make time string format configurable. this.timeOptions = {'hour':'numeric','minute':'numeric'} ??
        return this.sunset.toLocaleTimeString('en-US', {'hour':'numeric','minute':'numeric'});
    }

    get timeCalculatedString() {
        // TODO: Make time string format configurable. this.timeOptions = {'hour':'numeric','minute':'numeric'} ??
        // TODO: "Yesterday" for timeCalculated being before midnight
        return this.timeCalculated.toLocaleTimeString('en-US', {'hour':'numeric','minute':'numeric'});
    }

    get conditions() {
        return this._conditions;
    }

    get temperature() {
        return this._temperature;
    }

    get temperatureString() {
        return `${this._temperature.toFixed(0)}° ${this._temperatureSuffix()}`;
    }

    get pressure() {
        return this._pressure;
    }

    get pressureString() {
        return `${this._pressure}hPa`;
    }

    get humidity() {
        return this._humidity;
    }

    get humidityString() {
        return `${this._humidity}%`;
    }

    get wind() {
        return this._wind;
    }

    get windSpeedString() {
        return `${this._wind.speed} ${this._speedSuffix()}`;
    }

    get windDirectionString() {
        let directions = [
            { deg: 0, name: 'North' },
            { deg: 90, name: 'East' },
            { deg: 180, name: 'South' },
            { deg: 270, name: 'West' },
            { deg: 360, name: 'North' }
        ];

        let degrees = parseInt(this.wind.deg);
        let initial = parseInt(degrees / 90);
        let interim = (degrees % 90);
        let secondary = parseInt(interim / 45);
        let _interim = (interim % 45);

        let primaryName = directions[initial].name, direction = primaryName;
        let secondaryName;
        if (secondary) {
            secondaryName = directions[initial+secondary].name;
            if (initial % 2) {
                let swap = primaryName;
                primaryName = secondaryName;
                secondaryName = swap;
            }
            direction = `${primaryName}-${secondaryName}`;
        }
        return direction;
    }

    get precipitation() {
        return this._precipitation;
    }

    get coordinates() {
        return this._coordinates;
    }

    get cloudiness() {
        return this._cloudiness;
    }

    get cloudinessString() {
        return `${this._cloudiness}%`;
    }
}

// TODO: Only Weather and Hourly is supported by the free API key. This is the initial focus.
// TODO: Implement weather alert info into server & client
// TODO: Impement moon cycle into server & client
class Weather {
    constructor(config) {
        this._lastUpdate = 0;
        this._data = new Data();

        // Defaults
        this._updateInterval = MINIMUM_UPDATE_INTERVAL;
        this._hourly = 0;
        this._daily = 0;
        api.setLang('en');

        tools.forEach(config, (value, key, data) => {
            switch (key) {
                case "appId":
                    api.setAPPID(value);
                    break;
                case "updateInterval":
                    this.updateInterval = value;
                    break;
                case "lang":
                    api.setLang(value);
                    break;
                case "cityId":
                    api.setCityId(value);
                    break;
                case "coordinates":
                    api.setCoordinate(value[0], value[1]);
                    break;
                case "zipCode":
                    api.setZipCode(value);
                    break;
                case "units":
                    api.setUnits(value);
                    this._data.units = value;
                    break;
                case "hourly":
                    this.hourly = value;
                    break;
                case "daily":
                    this.daily = value;
                    break;
                default:
                    console.log(`Unexpected configuration value! { ${key}: ${value}`);
            }
        });
    }

    get isDataFresh() {
        return !(this._lastUpdate + this._updateInterval <= Date.now());
    }

    get canBeForced() {
        return (Date.now() - this._lastUpdate) <= MINIMUM_UPDATE_INTERVAL;
    }

    update(force = false) {
        return new Promise((resolve, reject) => {
            if (!force && this.isDataFresh) {
                resolve(this._data);
            } else if (force && !this.canBeForced) {
                reject('Data is too fresh to force a reset!');
            } else {
                this._performUpdate().then(() => {
                    resolve(this._data);
                });
            }
        });
    }

    _performUpdate() {
        return this._updateWeather()
            .then(this._updateForecast())
            .then(this._updateDailyForecast());
    }

    _updateWeather() {
        return this._getWeather().then((value) => {
            this._data.parseWeather(value);
        }).catch((err) => {
            console.log(err);
        });
    }

    _updateForecast() {
        return this._getForecast().then((value) => {
            this._data.parseForecast(value);
        }).catch((err) => {
            console.log(err);
        });
    }

    _updateDailyForecast() {
        return this._getDailyForecast().then((value) => {
            this._data.parseDailyForecast(value);
        }).catch((err) => {
            console.log(err);
        });
    }

    _getWeather() {
        return new Promise((resolve, reject) => {
            api.getAllWeather((err, json) => {
                if (err) {
                    reject(err);
                }
                resolve(json);
            });
        });
    }

    _getForecast() {
        return new Promise((resolve, reject) => {
            if (this._hourly === 0) {
                reject('Trihourly forecast feature is currently disabled.');
                return;
            }
            api.getWeatherForecast((err, json) => {
                if (err) {
                    reject(err);
                }
                resolve(json);
            });
        });
    }

    _getDailyForecast() {
        return new Promise((resolve, reject) => {
            if (this._daily === 0) {
                reject('Daily forecast feature is currently disabled.');
                return;
            }
            api.getWeatherForecastForDays(this._daily, (err, json) => {
                if (err) {
                    reject(err);
                }
                resolve(json);
            });
        });
    }

    get hourly() {
        return this._hourly;
    }

    set hourly(hours) {
        // TODO: Refactor to control trihourly forecast (_getForecast)
        if (!tools.withinRange(hours, 0, MAXIMUM_HOURLY)) {
            throw `Hourly value must be within 0 and ${MAXIMUM_HOURLY}.`;
        }
        this._hourly = hours;
    }

    get daily() {
        return this._daily;
    }

    set daily(days) {
        if (!tools.withinRange(days, 0, MAXIMUM_DAILY)) {
            throw `Daily value must be within 0 and ${MAXIMUM_DAILY}.`;
        }
        this._daily = days;
    }

    get updateInterval() {
        return this._updateInterval;
    }

    set updateInterval(interval) {
        if (interval > MINIMUM_UPDATE_INTERVAL) {
            console.log(`WARNING :: The new update interval value was lower than the minimum! Defaulting to ${MINIMUM_UPDATE_INTERVAL}.`);
            interval = MINIMUM_UPDATE_INTERVAL;
        }
        if (this._updateInterval !== interval) {
            this._updateInterval = interval;
            // TODO: update any existing interval timeout subscriptions with new time.
            // take logic from Clock() for syncing back up
        }
    }

    get readings() {
        return this._data;
    }
}

module.exports = {
    Weather: Weather,
    Data: Data,
    parseIconMap: parseIconMap
};