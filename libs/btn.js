const DashButton = require('dash-button');
const tools = require('./tools');

const config = {
    buttons: {
        debounce: 500,    //500ms
        cooldown: 300000  //5 minutes
    }
};


class Button {
    constructor(name, mac, callback = null, startListening = false) {
        if (tools.isEmpty(mac)) {
            throw 'MAC address required!';
        }
        this._mac = mac;
        this._name = (!tools.isEmpty(name)) ? name : `btn-${mac.replace(':', '')}`;
        this._dashButton = new DashButton(this._mac);

        // TODO: add support for promises
        if (callback instanceof Function) {
            this._callback = callback;
        } else {
            const parent = this;
            this._callback = () => {
                console.log(`Click detected from ${parent.name}`);
            };
        }

        // TODO: readdress debounce, test shorter values
        // With the blinking red light response, the button takes about 7.5s to become ready again after press.
        this._debounce = 7500;
        this._lastClick = 0;

        this._subscription = null;
        if (startListening) {
            this.listen();
        }
    }

    get mac() {
        return this._mac;
    }

    get name() {
        return this._name;
    }

    // todo: getter and/or setter for callbacks?

    listen(callback) {
        if (callback instanceof Function) {
            this._callback = callback;
        }
        this._subscription = this._dashButton.addListener(this._onClick());
        console.log(`Listening for ${this._name}`);
    }

    stop() {
        if (this._subscription !== null) {
            this._subscription.remove();
        }
    }

    _onClick() {
        // todo: readdress debounce code, clean up
        const parent = this;
        return () => {
            let now = Date.now();
            console.log(``);    // TODO!!!!!!!!!!!!!!!!!!!
            if (now <= (parent._lastClick + parent._debounce)) {
                console.log('BOUNCE REJECTED!');
                return;
            }
            parent._lastClick = now;
            parent._callback();
        };
    }
}


class ButtonConfig {
    // TODO: Class that defines configuration for Buttons? Is this necessary?
    constructor() {
        // name, mac?, ???
    }
}


class ClickPattern {
    // TODO: Class that defines sequence and timing of button presses to perform specific actions
    constructor() {
        //
    }
}


class ButtonGroup {
    // TODO: Class to handle distributing configuration settings to multiple Btns
    constructor() {
        //
    }
}


module.exports = {
    Button: Button,
    //BtnGroup: BtnGroup
};