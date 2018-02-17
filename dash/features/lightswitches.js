const { ClientFeature, ServerFeature } = require('./features');
const Switches = require('../../switch');
const tools = require('../../libs/tools');

const huejay = require('huejay');


class Lightswitch {
    constructor(name) {
        // todo: throw if empty (or use default name?)
        this._name = name;
    }

    get ui() {
        return this._elems;
    }

    set ui(parentNode) {
        let elems = {};
        let name = this._name;

        elems[name] = { title: parentNode.querySelector(`${name}-title`) };
        let buttons = parentNode.querySelectorAll(`[data-group=${name}] p`);
        buttons.forEach((switchNode, switchIndex, switchList) => {
            let action = switchNode.dataset.action;
            elems[name][action] = { label: switchNode.querySelector('span') };
            // TODO: Add a wrapper function for getting this SVG via get property?
            let icon = switchNode.querySelector('i, svg');
            if (icon) {
                elems[name][action].iconParent = icon.parentNode;
            }
        });

        this._elems = elems;
    }
}

class LightswitchesClient extends ClientFeature {
    constructor(data) {
        super(data);
        this._switches = {};
    }

    create(name) {
        // TODO: Check if already registered and throw (or return null?)
        this._switches[name] = new Lightswitch(name);
        return this.get(name);
    }

    get(name) {

    }

    get ui() {
        return this._elems;
    }

    set ui(parentNode) {
        return super.ui = parentNode;
    }
}

class Lightswitches extends ServerFeature {
    _verify(data) {
        return data instanceof Object;
    }

    /*
    this._switches[group][name] = switch;
    ex. this._switches.livingroom.toggle = GroupToggleSwitch()
     */

    _setup(data, featureManager) {
        let hueClient = new huejay.Client(data.credentials);
        this._switches = {};
        let props;
        for (let groupIndex in props = Object.getOwnPropertyNames(data.switches)) {
            let group = props[groupIndex];
            let groupSwitches = data.switches[group];
            this._switches[group] = {};
            for (let i in groupSwitches) {
                let groupSwitch = groupSwitches[i];
                try {
                    let {type, options} = groupSwitch;
                    options.client = hueClient;
                    options.callback = (item, argument) => {
                        console.log(`CALLBACK CALLED FOR (${group}, ${options.name}, ${argument})`);
                        featureManager._broadcast('updateLightswitch',
                            { group: group, name: options.name, argument: argument, item: item });
                    };
                    this._switches[group][options.name] = new Switches[type](options);
                } catch (err) {
                    console.log('ERROR INITIALIZING SWITCH FROM CONFIG: '+groupSwitch);
                    console.log(err);
                }
            }
        }
        return Object.getOwnPropertyNames(this._switches).length > 0;
    }

    register(socket, event, callback) {
        let parent = this;
        let _callback = (data) => {
            let {type, group, action} = data;
            console.log(`Lightswitch invoked. TYPE: ${type} | GROUP: ${group} | ACTION: ${action}`);

            if (action === 'request') {
                let targets = (typeof group === 'undefined') ? Object.getOwnPropertyNames(parent._switches) : [ group ];
                targets.forEach((_group, _groupIndex, _groupList) => {
                    tools.forEach(parent._switches[_group], (_switch, _switchKey, _switchList) => {
                        _switch.exec(action)();
                    });
                });
            } else {
                let _switch = parent._switches[group][type];
                _switch.exec(action)();
            }
            if (callback) {
                callback(data);
            }
        };
        return super.register(socket, event, _callback);
    }

    unregister(mac) {
        // TODO: Rewrite this when dash button switches share a mac address index instead of iterating until success
        for (let i in this._switches.dashButtons) {
            let button = this._switches.dashButtons[i];
            let result = button.unregisterButton(mac);
            if (result) {
                return true;
            }
        }
        return false;
    }

    update(socket) {
        tools.forEach(this._switches, (groups, group) => {
            tools.forEach(groups, (_switch, name) => {
                _switch.exec('request')();
            });
        });
    }
}

module.exports = { name: 'Lightswitches', server: Lightswitches };