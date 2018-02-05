module.exports = {

    isEmpty(obj) {
        if (typeof obj === 'undefined' || obj === null) {
            return true;
        } else if (typeof obj === 'string') {
            return obj.length === 0;
        } else {
            return false;
        }
    },

    median(values) {
        values.sort((a, b) => {
            return a - b;
        });
        let half = Math.floor(values.length / 2);
        if (values.length % 2) {
            return values[half];
        } else {
            return (values[half-1] + values[half]) / 2;
        }
    },

    withinRange(value, min, max) {
        if (min > max) {
            max = [min, min = max][0];
        }
        return value >= min && value <= max;
    },

    forEach(data, callback) {
        if (data instanceof Array) {
            data.forEach(callback);
        } else {
            // TODO: implement `thisArg`, Optional third argument
            //  Value to use as this (i.e the reference Object) when executing callback.
            let keys;
            for (let i in keys = Object.getOwnPropertyNames(data)) {
                let key = keys[i];
                callback(data[key], key, data);
            }
        }
    }

};
