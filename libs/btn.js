const DashButton = require('dash-button');
const tools = require('./tools');

const config = {
    buttons: {
        debounce: 500,    //500ms
        cooldown: 300000  //5 minutes
    }
};

// TODO: Add debounce time, throttling/cooldown periods, multi-press patterns
const Btn = function(name, mac, callback = null, startListening = false) {
    if (tools.isEmpty(mac)) {
        throw new Error('MAC address required!');
    }
    this.mac = mac;
    this.name = (!tools.isEmpty(name))
        ? name
        : 'btn-' + mac.replace(':', '');
    this.dashButton = new DashButton(this.mac);

    if (typeof callback === 'function') {
        this.callback = callback;
    } else {
        const parent = this;
        this.callback = function() {
            console.log('Click detected from "'+parent.name+'".');
        };
    }

    // this.debounce = config.buttons.debounce;
    this.debounce = 10000;
    this.lastClick = 0;

    this.subscription = null;
    if (startListening) {
        this.listen();
    }
};

Btn.prototype.listen = function(callback) {
    if (typeof callback === 'function') {
        this.callback = callback;
    }
    this.subscription = this.dashButton.addListener(this.onClick());
    console.log("Listening for "+this.name+".");
};

Btn.prototype.stop = function() {
    if (this.subscription !== null) {
        this.subscription.unsubscribe();
    }
};

Btn.prototype.onClick = function() {
    // todo: debounce logic
    const parent = this;
    return function() {
        let now = Date.now();
        console.log(now+' :: BUTTON CLICK DETECTED - Checking against '+(parent.lastClick + parent.debounce));
        if (now <= (parent.lastClick + parent.debounce)) {
            console.log('BOUNCE REJECTED!');
            return;
        }
        parent.lastClick = now;

        parent.callback();
    };
};


const BtnConfig = function() {
    this.name = null;
    this.mac = null;
};


const ClickPattern = function() {
    //
};


const BtnGroup = function() {
    // TODO: Class to handle distributing configuration settings to multiple Btns
};


module.exports = {
    Btn: Btn,
    BtnGroup: BtnGroup
};