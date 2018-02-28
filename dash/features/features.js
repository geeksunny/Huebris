const Log = require('../log');


// TODO: Consolidate shared code between ClientFeature and ServerFeature into Feature; FeatureManager to work with both types.
class Feature {
    /**
     * Feature constructor. Do not override.
     * @param data  Feature data
     * @param featureManager
     */
    constructor(data, featureManager) {
        // TODO: Promisify! Call constructors from within a promise chain resolved once setup is complete
        this._enabled = this._verify(data);
        this._running = false;
        this._featureManager = featureManager;
        // TODO: Call this.setup(data) here
    }

    get manager() {
        return this._featureManager;
    }

    setup(data) {
        throw "Not implemented!"
    }

    /**
     * Register the feature with the given socket object.
     * @param socket
     * @param event
     * @param callback
     * @returns {boolean}   True if the socket was registered.
     */
    register(socket, event, callback) {
        if (this.running) {
            socket.on(event, callback);
            return true;
        } else {
            console.log(`Feature ${this.constructor.name} is not running!`);
            return false;
        }
    }

    // unregister(data) {
    //     // TODO!! is an unregister() method necessary? What arguments would it need?
    // }

    send(data) {
        this._featureManager.emit('send', {name: this.name, data: data});
    }

    /**
     * Override to define how the feature handles incoming data.
     * @interface
     * @param data
     */
    onReceive(data) { }

    // TODO: request could possibly be eliminated in favor of send?
    request(data) {
        this._featureManager.emit('request', {name: this.name, data: data});
    }

    /**
     * Override to define how the feature handles incoming requests.
     * @interface
     * @param data
     */
    // TODO: request could possibly be eliminated in favor of send?
    onRequest(data) { }

    /**
     * Override this to define the name that the FeatureManager will use to identify by.
     * @interface
     * @returns {string} Feature name
     */
    get name() {
       throw "Not implemented!";
    }

    /**
     * Verify that the feature is enabled. This method must be overridden.
     * @param data          The feature's given dataset.
     * @returns {boolean}   True if the feature is enabled.
     */
    _verify(data) {
        return false;
    }

    /**
     * Feature setup method that executes if the feature is enabled. Override to handle feature setup.
     * @param data  Feature configuration data
     * @private
     */
    _setup(data) {}

    /**
     * @returns {boolean}   True if this feature is enabled.
     */
    get enabled() {
        return this._enabled;
    }

    /**
     * @returns {boolean}   True if this feature is running.
     */
    get running() {
        return this._running;
    }
}

class ClientFeature extends Feature {
    // TODO: ClientFeature should handle creation of UI tiles via templating system
    constructor(data, featureManager) {
        super(data, featureManager);
        // TODO: should uiParentNode be passed into constructor and use to set this.ui?
    }

    refreshUI(update = false) {
        // 
    }

    get ui() {
        //return this._elems;
    }

    set ui(parentNode) {
        // let elems = {};
        // elems.city = parentNode.querySelector('#city');
        // elems.timeCalculatedText = parentNode.querySelector('#time-calculated-text');
        // elems.timeCalculatedIcon = parentNode.querySelector('#time-calculated-icon');
        // this._elems = elems;
    }

}

class ServerFeature extends Feature {
    setup(data) {
        // TODO: Move the general logic into Feature class
        return new Promise((resolve, reject) => {
            resolve(this.enabled && this._setup(data));
        }).then((running) => {
            this._running = running;
            return new Promise((resolve, reject) => {
                if (running) {
                    resolve(this._setupClientFeature().then((featureInitialized) => {
                        this._clientFeatureInitialized = featureInitialized;
                        return featureInitialized;
                    }).catch((err) => {
                        this._clientFeatureInitialized = false;
                        reject(err);
                    }));
                } else {
                    resolve(false);
                }
            });
        // }).catch((err) => {
        //     // TODO
        });
    }

    /**
     * Set up this feature's client feature. Override this if a client feature will be used.
     * @returns {Promise<any>}  A Promise to be resolved once the feature setup is complete.
     * @private
     */
    _setupClientFeature() {
        return new Promise((resolve, reject) => {
            reject('No client feature setup provided.');
        });
    }

    /**
     * Return a string of javascript code to be served to the client.
     * @returns {string}
     */
    get clientJavascript() {
        return '';
    }

    get hasClientFeature() {
        return this._clientFeatureInitialized;
    }
}

class FeatureManager {
    /**
     *
     * @param io Current Socket IO connection.
     * @param featureKey
     */
    constructor(io, featureKey = 'client') {
        this._io = io;
        this._featureKey = featureKey;
        this._features = {};
    }

    _broadcast(event, data) {
        this._io.emit(event, data);
    }

    get featureKey() {
        return this._featureKey;
    }

    get features() {
        return this._features;
    }

    getFeature(feature) {
        return this._features[(typeof feature === 'string') ? feature : feature.name];
    }

    /**
     *
     * @param feature
     * @param featureData
     * @param callback  A function that receives the resulting feature for further processing
     * @returns {Feature}
     */
    register(feature, featureData, callback) {
        let _class = feature[this.featureKey];
        let _feature = new _class(featureData, this);
        this._features[_feature.name] = _feature;
        if (callback) {
            callback(_feature);
        }
        return _feature;
    }

    unregister(feature, data) {
        let _feature = this.getFeature(feature.name);
        _feature.unregister(data);
        delete this._features[feature.name];
    }
}

class ClientFeatureManager extends FeatureManager {
    // TODO: move the logic from html/index.html into here. automate and contain the setup
}

class ServerFeatureManager extends FeatureManager {
    constructor(io, server, featureKey = 'server') {
        super(io, featureKey);
        this._server = server;
    }

    register(feature, featureData, callback) {
        Log.log('ServerFeatureManager', `Registering feature ${feature.name}`);
        let _callback = (_feature) => {
            // TODO: Standardize .setup(data) to return a promise? Or should this.setup be ran inside Feature.constructor?
            _feature.setup(featureData).then((hasClientFeature) => {
                if (hasClientFeature) {
                    this._server.use(`/js/${feature.name}.js`, (req, res) => {
                        res.set('Content-Type', 'application/JavaScript');
                        res.send(`'use strict';
                        ${_feature.clientJavascript}
                        //export default {}`);
                    });
                }
                // }).catch((err) => {
                //     // TODO
            });
            if (callback) {
                callback(_feature);
            }
        };
        return super.register(feature, featureData, _callback);
    }
}

module.exports = { Feature, ServerFeature, ClientFeature, FeatureManager, ServerFeatureManager };