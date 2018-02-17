const { ClientFeature } = require('./features');


class Clock extends ClientFeature {
    constructor(seconds = false, militaryTime = false, callback = null) {
        this._time = null;
        this._day = null;
        this._date = null;

        this._timeOptions = {
            hour12: !militaryTime,
            hour: '2-digit',
            minute: '2-digit'
        };
        this.seconds = seconds;

        this._dayOptions = {
            weekday: 'long'
        };
        this._dateOptions = {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        };

        this._callback = null;
        if (callback) {
            this.callback = callback;
        }
        this._timeoutJob = null;
    }

    get ui() {
        return this._elems;
    }

    set ui(parentNode) {
        this._elems = {
            time: parentNode.querySelector('#clock-time'),
            day: parentNode.querySelector('#clock-day'),
            date: parentNode.querySelector('#clock-date')
        };
        this.start((time) => {
            this._update(time);
        });
    }

    _update(data) {
        let {time, day, date} = this._elems;
        time.innerText = data.time;
        if (data.day) {
            day.innerText = data.day;
        }
        if (data.date) {
            date.innerText = data.date;
        }
    }

    start(callback) {
        if (callback) {
            this.callback = callback;
        }
        if (this._callback === null) {
            throw "Clock callback required to start ticking.";
        }
        if (this._timeoutJob === null) {
            let timeout = (this._seconds) ? 1000 : 60000;

            // Begin the interval on the next second/minute
            let timeToFirstTimeout = timeout - (Date.now() % timeout);
            if (timeToFirstTimeout) {
                let parent = this;
                setTimeout(() => {
                    parent._timeoutJob = setInterval(Clock._onTick(parent), timeout);
                    Clock._onTick(parent)();
                }, timeToFirstTimeout);
            } else {
                this._timeoutJob = setInterval(Clock._onTick(this), timeout);
            }

            // Execute the initial tick;
            Clock._onTick(this)();
        }
    }

    stop() {
        if (this._timeoutJob !== null) {
            clearInterval(this._timeoutJob);
            this._timeoutJob = null;
        }
    }

    static _onTick(parent) {
        return () => {
            let now = new Date();
            parent._time = now.toLocaleTimeString('en-US', parent._timeOptions);
            let update = { time: parent._time };

            // TODO: check if date needs updating
            parent._day = now.toLocaleDateString('en-US', parent._dayOptions);
            update.day = parent._day;
            parent._date = now.toLocaleDateString('en-US', parent._dateOptions);
            update.date = parent._date;

            parent._callback(update);
        };
    }

    get time() {
        return {
            time: this._time,
            day: this._day,
            date: this._date
        };
    }

    set callback(callback) {
        if (!(callback instanceof Function)) {
            throw "Callback must be a function";
        }
        this._callback = callback;
    }

    set seconds(showSeconds) {
        // TODO: Update any existing timeoutInterval
        this._seconds = showSeconds;
        if (showSeconds) {
            this._timeOptions.second = '2-digit';
        } else {
            delete this._timeOptions.second;
        }
    }
}
