const { ServerFeature } = require('./features');
const tools = require('../../libs/tools');
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


/* Shared Code */
const parseIconMap = () => {
    // TODO: Move the weather-icon-parser code into this file
    const parser = require('../weather-icon-parser');
    return parser.parse();
};

class Direction {
    constructor(options = Direction.DefaultOptions) {
        let _options = Direction.customizeOptions(options);
        let {strings, hyphenate, tertiaryPrefix, useTertiary} = _options;
        this.strings = strings;
        this.hyphenate = hyphenate;
        this.tertiaryPrefix = tertiaryPrefix;
        this.useTertiary = useTertiary;
    }

    static get DefaultOptions() {
        return {
            strings: Direction.Strings,
            hyphenate: false,
            tertiaryPrefix: '',
            useTertiary: true
        }
    }

    static get Strings() {
        return {north: 'N', east: 'E', south: 'S', west: 'W'};
    }

    static customizeOptions(options) {
        let result = Direction.DefaultOptions;
        for (let key in options) {
            // noinspection JSUnfilteredForInLoop
            result[key] = options[key];
        }
        return result;
    }

    static toDirections(degrees, options = Direction.DefaultOptions) {
        // TODO: Logic for options.useTertiary
        let {strings} = Direction.customizeOptions(options);
        let directions = [ strings.north, strings.east, strings.south, strings.west, strings.north ];

        // noinspection JSCheckFunctionSignatures
        let pos = parseInt((degrees / 22.5) + .5) % 16;
        // noinspection JSCheckFunctionSignatures
        let major = parseInt(pos / 4);
        // noinspection JSCheckFunctionSignatures
        let minor = parseInt((pos % 4) / 2);
        // noinspection JSCheckFunctionSignatures
        let fine = parseInt((pos % 4) % 2);

        let _pos = (minor * 2) + fine;
        if (_pos) {
            let secondary = (major % 2)
                ? [directions[major + 1], directions[major]]
                : [directions[major], directions[major + 1]];
            if (fine) {
                secondary.unshift(directions[major + minor]);   // Push primary direction to front of results
            }
            return secondary;
        }
        return [directions[major]];
    }

    static toDirection(degrees, options = Direction.DefaultOptions) {
        let {hyphenate, tertiaryPrefix} = Direction.customizeOptions(options);
        let directions = this.toDirections(degrees, options);
        if (directions.length > 1) {
            if (hyphenate) {
                console.log('hyphenating');
                directions[directions.length - 1] = `-${directions[directions.length - 1]}`;
            }
            if (tertiaryPrefix && directions.length % 2) {
                directions[0] = `${directions[0]}${tertiaryPrefix}`;
            }
        }
        return directions.join('');
    }

    get strings() {
        return this._strings;
    }

    set strings(strings) {
        this._strings = {north: strings.north, east: strings.east, south: strings.south, west: strings.west};
    }

    get hyphenate() {
        return this._hyphenate;
    }

    set hyphenate(hyphenate) {
        this._hyphenate = hyphenate;
    }

    get tertiaryPrefix() {
        return this._tertiaryPrefix;
    }

    set tertiaryPrefix(prefix) {
        this._tertiaryPrefix = prefix;
    }

    get useTertiary() {
        return this._useTertiary;
    }

    set useTertiary(useTertiary) {
        this._useTertiary = useTertiary;
    }

    get options() {
        return {
            strings: this.strings,
            hyphenate: this.hyphenate,
            tertiaryPrefix: this.tertiaryPrefix,
            useTertiary: this.useTertiary
        }
    }

    toDirections(degrees) {
        return Direction.toDirections(degrees, this.options);
    }

    toDirection(degrees) {
        return Direction.toDirection(degrees, this.options);
    }
}

class Data {
    constructor(data) {
        // TODO: Add option for rounding values in formatted strings
        // this.units = units;  // TODO: Add code for passing in value for `units`

        if (data) {
            Object.getOwnPropertyNames(data).forEach((key) => {
                this[key] = data[key];
            });
        }

        this._direction = new Direction();
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

    // TODO: get windDirectionAbbrev, E, NE, ENE, etc
    get windDirectionString() {
        return this._direction.toDirection(parseInt(this.wind.deg));
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


/* Client Code */
class WeatherClient {
    constructor() {
        // Icon map is generated by server
        this._iconMap = Data.ICON_MAP;
        console.log(this._iconMap);
    }

    static changeIcon(elem, key, icon, prefix = '', suffix = '') {
        elem.classList.remove(`${prefix}${elem.dataset[key]}${suffix}`);
        elem.classList.add(`${prefix}${icon}${suffix}`);
        elem.dataset[key] = icon;
    }

    get ui() {
        return this._elems;
    }

    set ui(parentNode) {
        let elems = {};
        elems.city = parentNode.querySelector('#city');
        elems.timeCalculatedText = parentNode.querySelector('#time-calculated-text');
        elems.timeCalculatedIcon = parentNode.querySelector('#time-calculated-icon');
        elems.sunrise = parentNode.querySelector('#sunrise');
        elems.sunset = parentNode.querySelector('#sunset');
        elems.icon = parentNode.querySelector('#weather-icon');
        elems.condition = parentNode.querySelector('#condition');
        elems.temperature = parentNode.querySelector('#temperature');
        elems.cloudiness = parentNode.querySelector('#cloudiness');
        elems.humidity = parentNode.querySelector('#humidity');
        elems.pressure = parentNode.querySelector('#pressure');
        elems.windSpeedText = parentNode.querySelector('#wind-speed-text');
        elems.windDirectionIcon = parentNode.querySelector('#wind-direction-icon');
        elems.windDirectionText = parentNode.querySelector('#wind-direction-text');
        this._elems = elems;
    }

    update(data) {
        let _data = new Data.Data(data);
        let ui = this.ui;

        ui.city.innerText = _data.city;

        ui.timeCalculatedText.innerText = _data.timeCalculatedString;
        let hours = _data.timeCalculated.getHours() % 12;
        if (!hours) {
            hours = 12;
        }
        WeatherClient.changeIcon(ui.timeCalculatedIcon, 'time', hours, 'wi-time-');

        ui.sunrise.innerText = _data.sunriseString;
        ui.sunset.innerText = _data.sunsetString;

        // TODO: Handle multiple conditions ?
        let condition = _data.conditions[0];
        ui.condition.innerText = condition.main;
        let conditionIcon = this._getIcon(_data.daytime, condition.id);
        if (!conditionIcon) {
            conditionIcon = 'wi-na';
        }
        WeatherClient.changeIcon(ui.icon, 'icon', conditionIcon);

        ui.temperature.innerText = _data.temperatureString;
        ui.cloudiness.innerText = _data.cloudinessString;
        ui.humidity.innerText = _data.humidityString;
        ui.pressure.innerText = _data.pressureString;

        WeatherClient.changeIcon(ui.windDirectionIcon, 'degree', parseInt(_data.wind.deg), 'towards-', '-deg');
        ui.windSpeedText.innerText = _data.windSpeedString;
        ui.windDirectionText.innerText = _data.windDirectionString;
    }

    _getIcon(daytime, id) {
        let group = daytime ? 'day' : 'night';
        return (this._iconMap[group][id]) ? this._iconMap[group][id] : this._iconMap.default[id];
    }

}


/* Server Code */
// TODO: Only Weather and Hourly is supported by the free API key. This is the initial focus.
// TODO: Implement weather alert info into server & client
// TODO: Impement moon cycle into server & client
class WeatherServer extends ServerFeature {

    register(socket, event, callback) {
        return super.register(socket, event, callback);
    }

    unregister(data) {
        // TODO
    }

    update(socket) {
        this._update().then((data) => {
            socket.emit('updateWeather', data);
        }).catch((err) => {
            socket.emit('updateWeather', {error: err});
        });
    }

    _verify(data) {
        return data instanceof Object;
    }

    _setup(config, featureManager) {
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
        return true;
    }

    _setupClientFeature() {
        // TODO: Start updateIntervals here? Or wait until first client registration?
        return parseIconMap().then((map) => {
            this._iconMap = map;
            return true;
        }).catch((err) => {
            console.log(`Encountered error while parsing Weather Icon Map: ${err}`);
            return false;
        });
    }

    get isDataFresh() {
        return !(this._lastUpdate + this._updateInterval <= Date.now());
    }

    get canBeForced() {
        return (Date.now() - this._lastUpdate) <= MINIMUM_UPDATE_INTERVAL;
    }

    _update(force = false) {
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

module.exports = { name: 'Weather', client: WeatherClient, server: WeatherServer };