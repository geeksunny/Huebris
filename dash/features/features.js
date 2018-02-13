
class ServerFeature {
    /**
     * Feature constructor. Do not override.
     * @param data  Feature data
     * @param featureManager    A reference to the FeatureManager this feature is registering with.
     */
    constructor(data, featureManager) {
        this._enabled = this._verify(data);
        this._running = this.enabled && this._setup(data, featureManager);
        if (this.running) {
            this._clientFeatureInitialized = this._setupClientFeature();
        }
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
     * @returns {boolean}   True if the client feature was initialized.
     * @private
     */
    _setupClientFeature() {
        return false;
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

    getFeature(featureName) {
        return this._features[featureName];
    }

    register(feature, featureData) {
        // TODO: init client here too? Or keep that inside the server class?
        let _server = feature.server;
        let _feature = new _server(featureData, this);
        this._features[feature.name] = _feature;
        return _feature;
    }

    unregister(feature, data) {
        let _feature = this.getFeature(feature.name);
        _feature.unregister(data);
        delete this._features[feature.name];
    }
}

module.exports = { ServerFeature, FeatureManager };