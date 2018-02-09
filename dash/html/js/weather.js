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
        elems.sunrise = parentNode.querySelector('#sunrise');
        elems.sunset = parentNode.querySelector('#sunset');
        elems.timeCalculated = parentNode.querySelector('#timeCalculated');
        elems.icon = parentNode.querySelector('#weather-icon');
        elems.condition = parentNode.querySelector('#condition');
        elems.temperature = parentNode.querySelector('#temperature');
        elems.cloudiness = parentNode.querySelector('#cloudiness');
        elems.humidity = parentNode.querySelector('#humidity');
        elems.pressure = parentNode.querySelector('#pressure');
        elems.windIconParent = parentNode.querySelector('#wind-parent');
        elems.windIcon = parentNode.querySelector('#wind-icon');
        elems.windText = parentNode.querySelector('#wind-text');
        this._elems = elems;
    }

    update(data) {
        let _data = new Data(data);
        let ui = this.ui;

        ui.city.innerText = _data.city;
        ui.sunrise.innerText = _data.sunriseString;
        ui.sunset.innerText = _data.sunsetString;
        ui.timeCalculated.innerText = _data.timeCalculatedString;

        // TODO: Handle multiple conditions ?
        let condition = _data.conditions[0];
        ui.condition.innerText = condition.main;
        // TODO: Add functionality for alternative icons for day/night + all options within each desc
        let conditionIcon = this._getIcon(_data.daytime, condition.id);
        if (!conditionIcon) {
            conditionIcon = 'wi-wu-unknown';
        }
        for (let i = 0; i < ui.icon.classList.length; i++) {
            let _class = ui.icon.classList[i];
            if (_class.startsWith('wi-')) {
                ui.icon.classList.remove(_class);
                break;
            }
        }
        ui.icon.classList.add(conditionIcon);

        ui.temperature.innerText = _data.temperatureString;
        ui.cloudiness.innerText = _data.cloudinessString;
        ui.humidity.innerText = _data.humidityString;
        ui.pressure.innerText = _data.pressureString;

        // TODO: Wind ICON
        // ui.windIcon
        ui.windText.innerText = _data.windString;
        // TODO: Print the direction string next to speed
    }

    _getIcon(daytime, id) {
        let group = daytime ? 'day' : 'night';
        return (this._iconMap[group][id]) ? this._iconMap[group][id] : this._iconMap.default[id];
    }

}

export default Weather;