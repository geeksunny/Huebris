const aggregation = require('aggregation/es6');
const Btn = require('./libs/btn').Button;
const tools = require('./libs/tools');

const Log = require('./dash/log');
const log = (caller, msg) => {
    Log.log(caller.constructor.name, msg);
};

/**
 *
 * {
 *    client: hueClient,    // required
 *    name: name,           // required
 *    description: desc,
 *    mac: mac,             // required
 *    ids: [                // required
 *        '8'
 *    ],
 *    colors: [
 *        'color obj'
 *    ],
 *    scenes: [
 *        'scene'
 *    ],
 *    states: [
 *        'state'
 *    ]
 * };
 *
 */

class Switch {
    constructor(options) {
        this.name = options.name;
        this.hueClient = options.client;
        this.ids = options.ids;
        this.callback = options.callback;
        this.defaults = options.defaults;
    };

    exec(argument) {
        const parent = this;
        return () => {
            for (let id in parent.ids) {
                let item = parent.ids[id];
                let api = parent.getApi(parent.hueClient);
                api.getById(item).then(item => {
                    log(this, 'Performing action -- argument: '+argument);
                    let changed;
                    switch (argument) {
                        case 'reset':
                            changed = parent.reset(item);
                            break;
                        case 'request':
                            changed = false;
                            break;
                        default:
                            changed = parent.performAction(item, argument);
                    }

                    item.changed = changed;
                    return (changed) ? api.save(item) : item;
                }).then(item => {
                    log(this, 'Action performed? '+((item.changed === true)?'YES':'NO'));
                    if (this.callback) {
                        this.callback(item, argument);
                    }
                }).catch(reason => {
                    log(this, 'EXEC ERROR!');
                    log(this, reason);
                });
            }
        };
    }

    reset(item) {
        if (this.defaults) {
            for (let property in this.defaults) {
                item[property] = this.defaults[property];
            }
            return true;
        }
        return false;
    }

    getApi(hueClient) {}
    performAction(item, argument) {}
}

class DashButtonSwitch extends Switch {
    constructor(options) {
        super(options);
        this.buttons = { _index: [] };
        if (!tools.hasValue(options.buttons)) {
            options.buttons = [];
            if (tools.hasValue(options.macs)) {
                // TODO: combine with 'actions' OR all macs trigger '*'
                let actions = (options.hasOwnProperty('actions')) ? options.actions : {};
                if (!tools.hasValue(actions.all) && tools.hasValue(options.action)) {
                    actions.all = options.action;
                }
                tools.forEach(options.macs, (mac, index) => {
                    let button = {name: options.name, mac: mac};
                    button.action = (tools.hasValue(actions[mac])) ? actions[mac] : actions.all;
                    options.buttons.push(button);
                });
            } else if (tools.hasValue(options.mac)) {
                options.buttons.push({name: options.name, mac: options.mac, action: options.action});
            }
        }
        if (options.buttons) {
            tools.forEach(options.buttons, (option, key) => {
                let {name, mac, action} = option;
                this.registerButton(name, mac, action);
            });
        }
        // TODO: Should a message be logged if no buttons were defined yet?
    }

    /**
     * TODO!!
     * @param name
     * @param mac
     * @param action
     */
    registerButton(name, mac, action) {
        if (this.buttons._index.indexOf(mac) > -1) {
            throw 'This mac is already registered!';
        }
        action = (action) ? action : '*';
        let button = new Btn(name, mac, this.exec(action), true);
        this.buttons._index.push(mac);
        if (!this.buttons.hasOwnProperty(action)) {
            this.buttons[action] = [];
        }
        this.buttons[action].push(button);
    }

    /**
     *
     * @param mac
     * @param action
     * @returns {boolean} True if a button was disabled.
     */
    unregisterButton(mac, action = '*') {
        if (!this.buttons.hasOwnProperty(action)) {
            return false;
        }
        let buttons = this.buttons[action];
        // TODO: try/catch here?
        let button = tools.findAndRemove(buttons, (item) => {
            return item.mac === mac;
        });
        if (button) {
            button.stop();
            tools.removeFromArray(mac, this.buttons._index);
            return true;
        }
        return false;
    }
}

/** ~~~~~~~~~~ **/

class Mixin {
    initializer(options) {
        // TODO: polyfill(?) subclasses' defined functions into further subclasses if not defined
        // Object.getOwnPropertyNames(object) to get object's property names.
        // Probably will require the mixin classes to be generated by functions - OR a map of each class to its name
        // Crawl up the ladder of prototypes until you hit 'Mixin' for finding functions.
        // Might want to add a check for `this.initialized` in `Mixin` to ensure that it was set to true in this function.
        // Maybe there should be `buildMixin(Type)` method at time of class aggregation. A wrapper function could automatically prep the mixins before aggregating. aggregator.js
        // todo-ex: Object.defineProperty(this, 'up', Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Dimmer.prototype), 'up'));
    }
}

class Action extends Mixin {
    initializer(options) {
        //log(this, this.constructor.name);
    }
    performAction(item, argument) {}
}

class Toggle extends Action {
    initializer(options) {
        super.initializer(options);
    }

    performAction(item, argument) {
        item.on = !item.on;
        return true;
    }
}

class Cycler extends Action {
    initializer(options) {
        super.initializer(options);
        this.items = options.items;
        this.repeats = (options.repeats) ? options.repeats : false;
        this.property = options.property;

        // this.index = 0;
        this.index = options.items.length - 1;  // TODO: Temporary fix for picking starting index.
    }

    get currentItem() {
        log(this, "currentItem: "+this.items[this.index]);
        return this.items[this.index];
    }

    top() {
        if (this.index !== (this.items.length - 1)) {
            this.index = this.items.length - 1;
            return true;
        }
        return false;
    }

    bottom() {
        if (this.index !== 0) {
            this.index = 0;
            return true;
        }
        return false;
    }

    adjust(offset) {
        let next = this.index + offset;
        if (tools.withinRange(next, 0, this.items.length - 1)) {
            this.index = next;
        } else if (this.repeats) {
            if (next < 0) {
                this.index = this.items.length - 1;
            } else {
                this.index = 0;
            }
        } else {
            return false;
        }
        return true;
    }

    up() {
        return this.adjust(+1);
    }

    down() {
        return this.adjust(-1);
    }

    performAction(item, argument) {
        let changed;
        switch (argument) {
            case 'top':
                changed = this.top();
                break;
            case 'bottom':
                changed = this.bottom();
                break;
            case 'up':
                changed = this.up();
                break;
            case 'down':
                changed = this.down();
                break;
        }
        if (changed) {
            item[this.property] = this.currentItem;
            return true;
        }
        return false;
    }
}

class Dimmer extends Cycler {
    initializer(options) {
        // TODO: Alternatively, dimmerPercentageMin/dimmerPercentageMax/dimmerPercentageStep
        this.min = (options.dimmerMin) ? Math.min(1, options.dimmerMin) : 25;
        this.max = (options.dimmerMax) ? Math.max(254, options.dimmerMax) : 254;

        // TODO: dimmerStep could be complimented with dimmerSteps which calculates the other way.
        // TODO: withinRange & default should probably take this.min/this.max into account
        this.dimmerStep = (options.dimmerStep && tools.withinRange(options.dimmerStep, 1, 254))
            ? options.dimmerStep : 25;  // TODO: Should step be stored and/or able to be later changed?

        let steps = Math.round(this.max / this.dimmerStep);
        let level = this.max;
        options.items = [];
        for (let i = steps; i > 0; i--) {
            if (i === 1) {
                level = this.min;
            }
            options.items.unshift(level);
            level -= this.dimmerStep;
        }
        // TODO: Need to determine existing brightness level to know which index to start at ('nice to have') Probably use a promise to poll the hueClient before calling super
        // TODO: call this.exec() with action='request' after initialization to get initial brightness setting

        options.property = 'brightness';
        super.initializer(options);
    }

    performAction(item, argument) {
        return super.performAction(item, argument);
    }

    // TODO: This is a temporary fix for the mixins not inheriting their super-class' methods.
    get currentItem() {
        return super.currentItem;
    }
    top() {
        return super.top();
    }
    bottom() {
        return super.bottom();
    }
    adjust(offset) {
        return super.adjust(offset);
    }
    up() {
        return super.up();
    }
    down() {
        return super.down();
    }
}

class SceneCycler extends Cycler {
    // TODO: Alternatively, reimplement with no ids, only items, and a 'Scene' HueAdapter.
    initializer(options) {
        options.property = 'scene';
        options.repeats = true;
        if (!(options.items instanceof Array)) {
            options.names = [];
            let items = [];
            for (let name in options.items) {
                options.names.push(name);
                items.push(options.items[name]);
            }
            options.items = items;
        }
        super.initializer(options);
    }

    performAction(item, argument) {
        let changed = (argument === 'down') ? this.down() : this.up();
        if (changed) {
            item[this.property] = this.currentItem;
            return true;
        }
        return false;
    }

    // TODO: This is a temporary fix for the mixins not inheriting their super-class' methods.
    get currentItem() {
        return super.currentItem;
    }
    top() {
        return super.top();
    }
    bottom() {
        return super.bottom();
    }
    adjust(offset) {
        return super.adjust(offset);
    }
    up() {
        return super.up();
    }
    down() {
        return super.down();
    }
}

/** ~~~~~~~~~~ **/

class HueAdapter extends Mixin {
    initializer(options) {}
    getApi(hueClient) {}
}

class Light extends HueAdapter {
    initializer(options) {
        super.initializer(options);
    }

    getApi(hueClient) {
        return hueClient.lights;
    }
}

class Group extends HueAdapter {
    initializer(options) {
        super.initializer(options);
    }

    getApi(hueClient) {
        return hueClient.groups;
    }
}

/** ~~~~~~~~~~ **/

module.exports = {
    LightToggleSwitch: class LightToggleSwitch extends aggregation(Switch, Light, Toggle) {},
    GroupToggleSwitch: class GroupToggleSwitch extends aggregation(Switch, Group, Toggle) {},
    LightDimmerSwitch: class LightDimmerSwitch extends aggregation(Switch, Light, Dimmer) {},
    GroupDimmerSwitch: class GroupDimmerSwitch extends aggregation(Switch, Group, Dimmer) {},
    GroupSceneCyclerSwitch: class GroupSceneCyclerSwitch extends aggregation(Switch, Group, SceneCycler) {},
    LightDashButtonToggleSwitch: class LightDashButtonToggleSwitch extends aggregation(DashButtonSwitch, Light, Toggle) {},
    GroupDashButtonToggleSwitch: class GroupDashButtonToggleSwitch extends aggregation(DashButtonSwitch, Group, Toggle) {},
    GroupDashButtonSceneCyclerSwitch: class GroupDashButtonSceneCyclerSwitch extends aggregation(DashButtonSwitch, Group, SceneCycler) {}

};