module.exports = {

    isEmpty(obj) {
        if (typeof obj === 'undefined' || obj === null) {
            return true;
        } else if (typeof obj === 'string') {
            return obj.length === 0;
        } else {
            return false;
        }
    }

};
