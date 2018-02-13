
class ServerFeature {
    /**
     * Feature constructor. Do not override.
     * @param data  Feature data
     * @param featureManager    A reference to the FeatureManager this feature is registering with.
     */
    constructor(data) {
        // TODO: Promisify! Call constructors from within a promise chain resolved once setup is complete
        this._enabled = this._verify(data);
    }

    setup(data, featureManager) {
        return new Promise((resolve, reject) => {
            resolve(this.enabled && this._setup(data, featureManager));
        }).then((running) => {
            this._running = running;
            return new Promise((resolve, reject) => {
                if (running) {
                    resolve(this._setupClientFeature().then((featureInitialized) => {
                        this._clientFeatureInitialized = featureInitialized;
                        resolve(featureInitialized);
                    }).catch((err) => {
                        this._clientFeatureInitialized = false;
                        reject(err);
                    }));
                }
            });
        // }).catch((err) => {
        //     // TODO
        });
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

    unregister(data) {
        // TODO!!
    }

    update(socket) {
        // TODO: document override purpose
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
     * Feature setup method that executes if the feature is enabled.
     */
    _setup(data, featureManager) {}

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

    get enabled() {
        return this._enabled;
    }

    get running() {
        return this._running;
    }
}

class FeatureManager {
    /**
     *
     * @param io Current Socket IO connection.
     */
    constructor(io) {
        this._io = io;
        this._features = {};
    }

    _broadcast(event, data) {
        this._io.emit(event, data);
    }

    get features() {
        return this._features;
    }

    getFeature(feature) {
        return this._features[(typeof feature === 'string') ? feature : feature.name];
    }

    register(feature, featureData) {
        let _server = feature.server;
        let _feature = new _server(featureData);
        this._features[feature.name] = _feature;
        _feature.setup(featureData, this).then((hasClientFeature) => {
            if (hasClientFeature) {
                this._io.use(`/js/${feature.name}.js`, (req, res) => {
                    res.set('Content-Type', 'application/JavaScript');
                    res.send(`'use strict';
                    ${_feature.clientJavascript}
                    //export default {}`);
                });
            }
        // }).catch((err) => {
            //     // TODO
        });
        return _feature;
    }

    unregister(feature, data) {
        let _feature = this.getFeature(feature.name);
        _feature.unregister(data);
        delete this._features[feature.name];
    }
}

module.exports = { ServerFeature, FeatureManager };