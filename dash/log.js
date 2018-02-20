const chalk = require('chalk');
const tools = require('../libs/tools');
const util = require('util');


class Color {
    constructor(text, title) {
        this._text = text;
        this._title = title;
    }

    static create(r, g, b) {
        return new Color(
            chalk.rgb(r, g, b),
            // TODO: revisit text color inversion math for title color
            chalk.bgRgb(r, g, b).rgb(255-r, 255-g, 255-b)
        );
    }

    static random() {
        let vals = [];
        [1,2,3].forEach((_, i) => {
            vals.push(Math.floor(Math.random() * 255));
        });
        return Color.create(vals[0], vals[1], vals[2]);
    }

    text(text) {
        return this._text(text);
    }

    title(title) {
        // return this._title.inverse(title);
        return this._title(title);
    }
}

const Colors = {
    _: {},
    get: (key) => {
        return Colors._[key];
    },
    new: (key) => {
        Colors._[key] = Color.random();
        return Colors._[key];
    },
    Error: new Color(chalk.red, chalk.bgRed),
    Log: new Color(chalk.green, chalk.bgGreen),
    Warn: new Color(chalk.yellow, chalk.bgYellow),
    Info: new Color(chalk.blue, chalk.bgBlue)
    /* Other colors available for use */
    // Color(chalk.magenta, chalk.bgMagenta.white),
    // Color(chalk.cyan, chalk.bgCyan.white),
    // Color(chalk.white, chalk.bgWhite.black),
    // Color(chalk.redBright, chalk.bgRedBright.white),
    // Color(chalk.greenBright, chalk.bgGreenBright.white),
    // Color(chalk.yellowBright, chalk.bgYellowBright.white),
    // Color(chalk.blueBright, chalk.bgBlueBright.white),
    // Color(chalk.magentaBright, chalk.bgMagentaBright.white),
    // Color(chalk.cyanBright, chalk.bgCyanBright.white)
};

let INSTANCE;

class Log {
    constructor() {
        this._stdout = process.stdout.write;
        this._stderr = process.stderr.write;
        this._console = {};
        // TODO: Add configuration options for silent operation (no console output), disabling colors, tag width, etc
        this._tagWidth = 23;
        this._autoExpandWidth = true;
        this.hook();
    }

    static demo() {
        Array(30).forEach((_, i) => {
            let title = `Random Color ${i}`;
            let text = 'This is a log message to demonstrate a random color!';
            let color = Color.random();
            let msg = `${color.title(title)} :: ${color.text(text)}`;
            this._log(msg);
        });
    }

    _addTag(tag) {
        if (this._autoExpandWidth && tag.length >= this._tagWidth) {
            this._tagWidth = tag.length + 2;
        }
        return Colors.new(tag);
    }

    _tagColor(tag) {
        let color = Colors.get(tag);
        if (!color) {
            color = this._addTag(tag);
        }
        return color;
    }

    _title(tag, color, silent = false) {
        if (silent) {
            tag = '';
        }
        return color.title(`${Array(this._tagWidth - tag.length).join(' ')}${tag} `);
    }

    hook() {
        const logger = this;

        ['log', 'warn', 'info', 'error'].forEach((method) => {
            this._console[method] = console[method];
            let logger;
            switch (method) {
                case 'log':
                case 'info':
                    logger = this.log;
                    break;
                case 'warn':
                case 'error':
                    logger = this.error;
            }
            console[method] = (data, ...args) => {
                logger(method, data, args);
            };
        });

        process.stdout.write = (function(write) {
            return function(string, encoding, fd) {
                logger.stdout(string);
            }
        })(process.stdout.write);

        process.stderr.write = (function(write) {
            return function(string, encoding, fd) {
                logger.stderr(string);
            }
        })(process.stderr.write);

        ['unhandledRejection', 'uncaughtException'].forEach((event) => {
            // TODO: store existing event handlers (if necessary) and release our handlers in unhook()
            process.on(event, (err) => {
                logger.error(event, err.stack);
            })
        });
    }

    unhook() {
        process.stdout.write = this._stdout;
        process.stderr.write = this._stderr;
        this._console.forEach((_orig, key) => {
            console[key] = _orig;
        });
    }

    _prepareMsg(tag, msg, ...args) {
        let _msg = (!tools.isEmpty(args)) ? util.format(msg, args) : msg;
        let lines = [];
        _msg.split('\n').forEach((line, index) => {
            let color = this._tagColor(tag);
            lines.push(`${this._title(tag, color, index !== 0)}  ${color.text(line)}\n`);
        });
        return lines;
    }

    log(tag, msg, ...args) {
        INSTANCE._prepareMsg(tag, msg, args).forEach((line) => {
            INSTANCE._stdout.apply(process.stdout, [line]);
        });
    }

    error(tag, msg, ...args) {
        INSTANCE._prepareMsg(tag, msg, args).forEach((line) => {
            INSTANCE._stderr.apply(process.stderr, [line]);
        });
    }

    stdout(msg) {
        this.log('stdout', msg);
    }

    stderr(msg) {
        this.error('stderr', msg);
    }

    logger(tag) {
        return (msg) => {
            this.log(tag, msg);
        };
    }
}

INSTANCE = new Log();


module.exports = INSTANCE;