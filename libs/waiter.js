const WAIT_INTERVAL = 500;          // 0.5s
const WAIT_TIMEOUT_DEFAULT = 60000; // 60s


function Waiter() {
    this._interval = WAIT_INTERVAL;
    this._timeout = WAIT_TIMEOUT_DEFAULT;
    this._waitFor = undefined;
    this._afterwards = undefined;
}

Waiter.create = function() {
    return new Waiter();
};

Waiter.sleep = function(ms) {
    // TODO: Verify if this logic is OK for 'await'!
    // if (typeof ms !== "number" || ms < 1) {
    //     return;
    // }
    return new Promise(resolve => setTimeout(resolve, ms));
};

Waiter.prototype.timeout = function(timeout) {
    if (typeof timeout === "number") {
        this._timeout = timeout;
    }
    return this;
};

Waiter.prototype.interval = function(interval) {
    if (typeof interval === "number") {
        this._interval = interval;
    }
    return this;
};

Waiter.prototype.waitFor = function(callback) {
    if (typeof callback === "function") {
        this._waitFor = callback;
    }
    return this;
};

Waiter.prototype.afterwards = function(callback) {
    if (typeof callback === "function") {
        this._afterwards = callback;
    }
    return this;
};

Waiter.prototype.go = async function() {
    // minimum requirement = timeout+interval. if no callbacks provided, just wait the entire timeout duration
    let timedout = true;
    if (typeof this._waitFor === "function") {
        const max = this._timeout / this._interval;
        for (let i = 0; i < max; i++) {
            await Waiter.sleep(this._interval);
            let result = this._waitFor();
            if (result === true) {
                timedout = false;
                break;
            }
        }
    } else {
        await Waiter.sleep(this._timeout);
        timedout = false;
    }
    if (typeof this._afterwards === "function") {
        this._afterwards(timedout);    // TODO: Document this parameter -- OR REMOVE!!
    }
};

module.exports = Waiter;