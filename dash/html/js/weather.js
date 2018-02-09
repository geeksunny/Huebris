'use strict';

import Data from './weatherData.js';

// TODO: Move this client-side code in with the server-side code for this feature
// TODO: UiFeature base class, getExports() function for constructing UI code exports;
// TODO: importDependencies() creates import statements for dependencies for client side OR uses node's require statements for server side
class Weather {
    constructor() {
        this._iconMap = Data.iconMap;
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
        let _data = new Data(data);
        let ui = this.ui;

        ui.city.innerText = _data.city;

        ui.timeCalculatedText.innerText = _data.timeCalculatedString;
        let hours = _data.timeCalculated.getHours();
        if (hours >= 12) {
            hours -= 12;
        }
        this._changeIcon(ui.timeCalculatedIcon, 'time', hours, 'wi-time-');

        ui.sunrise.innerText = _data.sunriseString;
        ui.sunset.innerText = _data.sunsetString;

        // TODO: Handle multiple conditions ?
        let condition = _data.conditions[0];
        ui.condition.innerText = condition.main;
        let conditionIcon = this._getIcon(_data.daytime, condition.id);
        if (!conditionIcon) {
            conditionIcon = 'wi-na';
        }
        this._changeIcon(ui.icon, 'icon', conditionIcon);

        ui.temperature.innerText = _data.temperatureString;
        ui.cloudiness.innerText = _data.cloudinessString;
        ui.humidity.innerText = _data.humidityString;
        ui.pressure.innerText = _data.pressureString;

        this._changeIcon(ui.windDirectionIcon, 'degree', _data.wind.deg, 'towards-', '-deg');
        ui.windSpeedText.innerText = _data.windSpeedString;
        ui.windDirectionText.innerText = _data.windDirectionString;
    }

    _changeIcon(elem, key, icon, prefix = '', suffix = '') {
        elem.classList.remove(`${prefix}${elem.dataset[key]}${suffix}`);
        elem.classList.add(`${prefix}${icon}${suffix}`);
        elem.dataset[key] = icon;
    }

    _getIcon(daytime, id) {
        let group = daytime ? 'day' : 'night';
        return (this._iconMap[group][id]) ? this._iconMap[group][id] : this._iconMap.default[id];
    }

}

export default Weather;