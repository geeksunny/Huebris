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
            map.forEach((item) => {
                let icon = item[0];
                let desc = item[1];
                let group;
                if (icon.startsWith('wi-owm-day-')) {
                    group = 'day';
                    desc = desc.replace('day-', '');
                } else if (icon.startsWith('wi-owm-night-')) {
                    group = 'night';
                    desc = desc.replace('night-', '');
                } else {
                    group = 'default';
                }
                if (typeof _map[group] === 'undefined') {
                    _map[group] = {};
                }
                if (typeof _map[group][desc] === 'undefined') {
                    _map[group][desc] = [];
                }
                _map[group][desc].push(icon);
            });
            return _map;
        };
        // TODO: Move this array to a local json file, send prepared map to client
        // https://erikflowers.github.io/weather-icons/api-list.html
        //  Open Weather Map, Last updated: Feb 8, 2018
        return prep([
            ['wi-owm-200', 'thunderstorm'],
            ['wi-owm-201', 'thunderstorm'],
            ['wi-owm-202', 'thunderstorm'],
            ['wi-owm-210', 'lightning'],
            ['wi-owm-211', 'lightning'],
            ['wi-owm-212', 'lightning'],
            ['wi-owm-221', 'lightning'],
            ['wi-owm-230', 'thunderstorm'],
            ['wi-owm-231', 'thunderstorm'],
            ['wi-owm-232', 'thunderstorm'],
            ['wi-owm-300', 'sprinkle'],
            ['wi-owm-301', 'sprinkle'],
            ['wi-owm-302', 'rain'],
            ['wi-owm-310', 'rain-mix'],
            ['wi-owm-311', 'rain'],
            ['wi-owm-312', 'rain'],
            ['wi-owm-313', 'showers'],
            ['wi-owm-314', 'rain'],
            ['wi-owm-321', 'sprinkle'],
            ['wi-owm-500', 'sprinkle'],
            ['wi-owm-501', 'rain'],
            ['wi-owm-502', 'rain'],
            ['wi-owm-503', 'rain'],
            ['wi-owm-504', 'rain'],
            ['wi-owm-511', 'rain-mix'],
            ['wi-owm-520', 'showers'],
            ['wi-owm-521', 'showers'],
            ['wi-owm-522', 'showers'],
            ['wi-owm-531', 'storm-showers'],
            ['wi-owm-600', 'snow'],
            ['wi-owm-601', 'snow'],
            ['wi-owm-602', 'sleet'],
            ['wi-owm-611', 'rain-mix'],
            ['wi-owm-612', 'rain-mix'],
            ['wi-owm-615', 'rain-mix'],
            ['wi-owm-616', 'rain-mix'],
            ['wi-owm-620', 'rain-mix'],
            ['wi-owm-621', 'snow'],
            ['wi-owm-622', 'snow'],
            ['wi-owm-701', 'showers'],
            ['wi-owm-711', 'smoke'],
            ['wi-owm-721', 'day-haze'],
            ['wi-owm-731', 'dust'],
            ['wi-owm-741', 'fog'],
            ['wi-owm-761', 'dust'],
            ['wi-owm-762', 'dust'],
            ['wi-owm-771', 'cloudy-gusts'],
            ['wi-owm-781', 'tornado'],
            ['wi-owm-800', 'day-sunny'],
            ['wi-owm-801', 'cloudy-gusts'],
            ['wi-owm-802', 'cloudy-gusts'],
            ['wi-owm-803', 'cloudy-gusts'],
            ['wi-owm-804', 'cloudy'],
            ['wi-owm-900', 'tornado'],
            ['wi-owm-901', 'storm-showers'],
            ['wi-owm-902', 'hurricane'],
            ['wi-owm-903', 'snowflake-cold'],
            ['wi-owm-904', 'hot'],
            ['wi-owm-905', 'windy'],
            ['wi-owm-906', 'hail'],
            ['wi-owm-957', 'strong-wind'],
            ['wi-owm-day-200', 'day-thunderstorm'],
            ['wi-owm-day-201', 'day-thunderstorm'],
            ['wi-owm-day-202', 'day-thunderstorm'],
            ['wi-owm-day-210', 'day-lightning'],
            ['wi-owm-day-211', 'day-lightning'],
            ['wi-owm-day-212', 'day-lightning'],
            ['wi-owm-day-221', 'day-lightning'],
            ['wi-owm-day-230', 'day-thunderstorm'],
            ['wi-owm-day-231', 'day-thunderstorm'],
            ['wi-owm-day-232', 'day-thunderstorm'],
            ['wi-owm-day-300', 'day-sprinkle'],
            ['wi-owm-day-301', 'day-sprinkle'],
            ['wi-owm-day-302', 'day-rain'],
            ['wi-owm-day-310', 'day-rain'],
            ['wi-owm-day-311', 'day-rain'],
            ['wi-owm-day-312', 'day-rain'],
            ['wi-owm-day-313', 'day-rain'],
            ['wi-owm-day-314', 'day-rain'],
            ['wi-owm-day-321', 'day-sprinkle'],
            ['wi-owm-day-500', 'day-sprinkle'],
            ['wi-owm-day-501', 'day-rain'],
            ['wi-owm-day-502', 'day-rain'],
            ['wi-owm-day-503', 'day-rain'],
            ['wi-owm-day-504', 'day-rain'],
            ['wi-owm-day-511', 'day-rain-mix'],
            ['wi-owm-day-520', 'day-showers'],
            ['wi-owm-day-521', 'day-showers'],
            ['wi-owm-day-522', 'day-showers'],
            ['wi-owm-day-531', 'day-storm-showers'],
            ['wi-owm-day-600', 'day-snow'],
            ['wi-owm-day-601', 'day-sleet'],
            ['wi-owm-day-602', 'day-snow'],
            ['wi-owm-day-611', 'day-rain-mix'],
            ['wi-owm-day-612', 'day-rain-mix'],
            ['wi-owm-day-615', 'day-rain-mix'],
            ['wi-owm-day-616', 'day-rain-mix'],
            ['wi-owm-day-620', 'day-rain-mix'],
            ['wi-owm-day-621', 'day-snow'],
            ['wi-owm-day-622', 'day-snow'],
            ['wi-owm-day-701', 'day-showers'],
            ['wi-owm-day-711', 'smoke'],
            ['wi-owm-day-721', 'day-haze'],
            ['wi-owm-day-731', 'dust'],
            ['wi-owm-day-741', 'day-fog'],
            ['wi-owm-day-761', 'dust'],
            ['wi-owm-day-762', 'dust'],
            ['wi-owm-day-781', 'tornado'],
            ['wi-owm-day-800', 'day-sunny'],
            ['wi-owm-day-801', 'day-cloudy-gusts'],
            ['wi-owm-day-802', 'day-cloudy-gusts'],
            ['wi-owm-day-803', 'day-cloudy-gusts'],
            ['wi-owm-day-804', 'day-sunny-overcast'],
            ['wi-owm-day-900', 'tornado'],
            ['wi-owm-day-902', 'hurricane'],
            ['wi-owm-day-903', 'snowflake-cold'],
            ['wi-owm-day-904', 'hot'],
            ['wi-owm-day-906', 'day-hail'],
            ['wi-owm-day-957', 'strong-wind'],
            ['wi-owm-night-200', 'night-alt-thunderstorm'],
            ['wi-owm-night-201', 'night-alt-thunderstorm'],
            ['wi-owm-night-202', 'night-alt-thunderstorm'],
            ['wi-owm-night-210', 'night-alt-lightning'],
            ['wi-owm-night-211', 'night-alt-lightning'],
            ['wi-owm-night-212', 'night-alt-lightning'],
            ['wi-owm-night-221', 'night-alt-lightning'],
            ['wi-owm-night-230', 'night-alt-thunderstorm'],
            ['wi-owm-night-231', 'night-alt-thunderstorm'],
            ['wi-owm-night-232', 'night-alt-thunderstorm'],
            ['wi-owm-night-300', 'night-alt-sprinkle'],
            ['wi-owm-night-301', 'night-alt-sprinkle'],
            ['wi-owm-night-302', 'night-alt-rain'],
            ['wi-owm-night-310', 'night-alt-rain'],
            ['wi-owm-night-311', 'night-alt-rain'],
            ['wi-owm-night-312', 'night-alt-rain'],
            ['wi-owm-night-313', 'night-alt-rain'],
            ['wi-owm-night-314', 'night-alt-rain'],
            ['wi-owm-night-321', 'night-alt-sprinkle'],
            ['wi-owm-night-500', 'night-alt-sprinkle'],
            ['wi-owm-night-501', 'night-alt-rain'],
            ['wi-owm-night-502', 'night-alt-rain'],
            ['wi-owm-night-503', 'night-alt-rain'],
            ['wi-owm-night-504', 'night-alt-rain'],
            ['wi-owm-night-511', 'night-alt-rain-mix'],
            ['wi-owm-night-520', 'night-alt-showers'],
            ['wi-owm-night-521', 'night-alt-showers'],
            ['wi-owm-night-522', 'night-alt-showers'],
            ['wi-owm-night-531', 'night-alt-storm-showers'],
            ['wi-owm-night-600', 'night-alt-snow'],
            ['wi-owm-night-601', 'night-alt-sleet'],
            ['wi-owm-night-602', 'night-alt-snow'],
            ['wi-owm-night-611', 'night-alt-rain-mix'],
            ['wi-owm-night-612', 'night-alt-rain-mix'],
            ['wi-owm-night-615', 'night-alt-rain-mix'],
            ['wi-owm-night-616', 'night-alt-rain-mix'],
            ['wi-owm-night-620', 'night-alt-rain-mix'],
            ['wi-owm-night-621', 'night-alt-snow'],
            ['wi-owm-night-622', 'night-alt-snow'],
            ['wi-owm-night-701', 'night-alt-showers'],
            ['wi-owm-night-711', 'smoke'],
            ['wi-owm-night-721', 'day-haze'],
            ['wi-owm-night-731', 'dust'],
            ['wi-owm-night-741', 'night-fog'],
            ['wi-owm-night-761', 'dust'],
            ['wi-owm-night-762', 'dust'],
            ['wi-owm-night-781', 'tornado'],
            ['wi-owm-night-800', 'night-clear'],
            ['wi-owm-night-801', 'night-alt-cloudy-gusts'],
            ['wi-owm-night-802', 'night-alt-cloudy-gusts'],
            ['wi-owm-night-803', 'night-alt-cloudy-gusts'],
            ['wi-owm-night-804', 'night-alt-cloudy'],
            ['wi-owm-night-900', 'tornado'],
            ['wi-owm-night-902', 'hurricane'],
            ['wi-owm-night-903', 'snowflake-cold'],
            ['wi-owm-night-904', 'hot'],
            ['wi-owm-night-906', 'night-alt-hail'],
            ['wi-owm-night-957', 'strong-wind'],
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
        return `${this._pressure} hPa`;
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

    get windString() {
        return `${this._wind.speed} ${this._speedSuffix()}`;
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