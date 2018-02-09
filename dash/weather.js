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


class Data {
    // TODO: Share this class with client
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

    static get iconMap() {
        // TODO: Move for future use
        const prep = (map) => {
            let _map = {};
            map.forEach((icon) => {
                let match = /wi-owm(?:-(\w*))?(?:-(\d\d\d))/g.exec(icon);
                let group = (match[1]) ? match[1] : 'default';
                let id = match[2];

                if (typeof _map[group] === 'undefined') {
                    _map[group] = {};
                }
                _map[group][id] = icon;
            });
            return _map;
        };
        // TODO: Move this array to a local json file, send prepared map to client
        // TODO??? See if the css file can be parsed for all .wi-owm-### classes. Will remove the need for a local json file
        // https://erikflowers.github.io/weather-icons/api-list.html
        // https://openweathermap.org/weather-conditions
        //  Open Weather Map, Last updated: Feb 8, 2018
        return prep([
            'wi-owm-200',
            'wi-owm-201',
            'wi-owm-202',
            'wi-owm-210',
            'wi-owm-211',
            'wi-owm-212',
            'wi-owm-221',
            'wi-owm-230',
            'wi-owm-231',
            'wi-owm-232',
            'wi-owm-300',
            'wi-owm-301',
            'wi-owm-302',
            'wi-owm-310',
            'wi-owm-311',
            'wi-owm-312',
            'wi-owm-313',
            'wi-owm-314',
            'wi-owm-321',
            'wi-owm-500',
            'wi-owm-501',
            'wi-owm-502',
            'wi-owm-503',
            'wi-owm-504',
            'wi-owm-511',
            'wi-owm-520',
            'wi-owm-521',
            'wi-owm-522',
            'wi-owm-531',
            'wi-owm-600',
            'wi-owm-601',
            'wi-owm-602',
            'wi-owm-611',
            'wi-owm-612',
            'wi-owm-615',
            'wi-owm-616',
            'wi-owm-620',
            'wi-owm-621',
            'wi-owm-622',
            'wi-owm-701',
            'wi-owm-711',
            'wi-owm-721',
            'wi-owm-731',
            'wi-owm-741',
            'wi-owm-761',
            'wi-owm-762',
            'wi-owm-771',
            'wi-owm-781',
            'wi-owm-800',
            'wi-owm-801',
            'wi-owm-802',
            'wi-owm-803',
            'wi-owm-804',
            'wi-owm-900',
            'wi-owm-901',
            'wi-owm-902',
            'wi-owm-903',
            'wi-owm-904',
            'wi-owm-905',
            'wi-owm-906',
            'wi-owm-957',
            'wi-owm-day-200',
            'wi-owm-day-201',
            'wi-owm-day-202',
            'wi-owm-day-210',
            'wi-owm-day-211',
            'wi-owm-day-212',
            'wi-owm-day-221',
            'wi-owm-day-230',
            'wi-owm-day-231',
            'wi-owm-day-232',
            'wi-owm-day-300',
            'wi-owm-day-301',
            'wi-owm-day-302',
            'wi-owm-day-310',
            'wi-owm-day-311',
            'wi-owm-day-312',
            'wi-owm-day-313',
            'wi-owm-day-314',
            'wi-owm-day-321',
            'wi-owm-day-500',
            'wi-owm-day-501',
            'wi-owm-day-502',
            'wi-owm-day-503',
            'wi-owm-day-504',
            'wi-owm-day-511',
            'wi-owm-day-520',
            'wi-owm-day-521',
            'wi-owm-day-522',
            'wi-owm-day-531',
            'wi-owm-day-600',
            'wi-owm-day-601',
            'wi-owm-day-602',
            'wi-owm-day-611',
            'wi-owm-day-612',
            'wi-owm-day-615',
            'wi-owm-day-616',
            'wi-owm-day-620',
            'wi-owm-day-621',
            'wi-owm-day-622',
            'wi-owm-day-701',
            'wi-owm-day-711',
            'wi-owm-day-721',
            'wi-owm-day-731',
            'wi-owm-day-741',
            'wi-owm-day-761',
            'wi-owm-day-762',
            'wi-owm-day-781',
            'wi-owm-day-800',
            'wi-owm-day-801',
            'wi-owm-day-802',
            'wi-owm-day-803',
            'wi-owm-day-804',
            'wi-owm-day-900',
            'wi-owm-day-902',
            'wi-owm-day-903',
            'wi-owm-day-904',
            'wi-owm-day-906',
            'wi-owm-day-957',
            'wi-owm-night-200',
            'wi-owm-night-201',
            'wi-owm-night-202',
            'wi-owm-night-210',
            'wi-owm-night-211',
            'wi-owm-night-212',
            'wi-owm-night-221',
            'wi-owm-night-230',
            'wi-owm-night-231',
            'wi-owm-night-232',
            'wi-owm-night-300',
            'wi-owm-night-301',
            'wi-owm-night-302',
            'wi-owm-night-310',
            'wi-owm-night-311',
            'wi-owm-night-312',
            'wi-owm-night-313',
            'wi-owm-night-314',
            'wi-owm-night-321',
            'wi-owm-night-500',
            'wi-owm-night-501',
            'wi-owm-night-502',
            'wi-owm-night-503',
            'wi-owm-night-504',
            'wi-owm-night-511',
            'wi-owm-night-520',
            'wi-owm-night-521',
            'wi-owm-night-522',
            'wi-owm-night-531',
            'wi-owm-night-600',
            'wi-owm-night-601',
            'wi-owm-night-602',
            'wi-owm-night-611',
            'wi-owm-night-612',
            'wi-owm-night-615',
            'wi-owm-night-616',
            'wi-owm-night-620',
            'wi-owm-night-621',
            'wi-owm-night-622',
            'wi-owm-night-701',
            'wi-owm-night-711',
            'wi-owm-night-721',
            'wi-owm-night-731',
            'wi-owm-night-741',
            'wi-owm-night-761',
            'wi-owm-night-762',
            'wi-owm-night-781',
            'wi-owm-night-800',
            'wi-owm-night-801',
            'wi-owm-night-802',
            'wi-owm-night-803',
            'wi-owm-night-804',
            'wi-owm-night-900',
            'wi-owm-night-902',
            'wi-owm-night-903',
            'wi-owm-night-904',
            'wi-owm-night-906',
            'wi-owm-night-957',
        ]);
    }

    get iconName() {
        switch (this._conditions[0].description) {
            case 'snow-wind':
                return
        }
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
        return `${this._temperature}° ${this._temperatureSuffix()}`;
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
        // TODO: Return string based on `this._wind.deg`. ie `north`, `east by south-east`, etc
        // TODO: add in precision argument for using 'XXX by XXX-XXX' string
        return "North";
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
    Data: Data
};