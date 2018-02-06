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

    removeIndex(index, array) {
        let item = array[index];
        array.splice(index, 1);
        return item;
    },

    removeIndexes(indexes, array) {
        indexes.sort();
        let results = [];
        for (let i in indexes) {
            results.push(this.removeIndex(index - i, array));
        }
        return results;
    },

    findAndRemove(array, finder, multiple = false) {
        let indexes = [];
        for (let i in array) {
            let item = array[i];
            console.log(`Item: ${item}`);
            console.log(`Item mac: ${item.mac}`);
            if (finder(item)) {
                if (multiple) {
                    indexes.push(i);
                } else {
                    return this.removeIndex(i, array);
                }
            }
        }
        return (indexes.length) ? this.removeIndexes(indexes, array) : null;
    },

    removeFromArray(value, array) {
        let i = array.indexOf(value);
        return (i !== -1) ? this.removeIndex(i, array) : null;
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
