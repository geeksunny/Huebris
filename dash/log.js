const chalk = require('chalk');
const tools = require('../libs/tools');


class Color {
    constructor(text, bg) {
        this.text = text;
        this.title = bg;
    }
}

const Colors = [
    new Color(chalk.red, chalk.bgRed.white),
    new Color(chalk.green, chalk.bgGreen.white),
    new Color(chalk.yellow, chalk.bgYellow.white),
    new Color(chalk.blue, chalk.bgBlue.white),
    new Color(chalk.magenta, chalk.bgMagenta.white),
    new Color(chalk.cyan, chalk.bgCyan.white),
    new Color(chalk.white, chalk.bgWhite.black),
    new Color(chalk.redBright, chalk.bgRedBright.white),
    new Color(chalk.greenBright, chalk.bgGreenBright.white),
    new Color(chalk.yellowBright, chalk.bgYellowBright.white),
    new Color(chalk.blueBright, chalk.bgBlueBright.white),
    new Color(chalk.magentaBright, chalk.bgMagentaBright.white),
    new Color(chalk.cyanBright, chalk.bgCyanBright.white),
];
tools.shuffle(Colors);

class Log {
    constructor() {
        // TODO: Add configuration options for silent operation (no console output), disabling colors, tag width, etc
        this._tagWidth = 23;
        this._tags = {};
        this._lastColorUsed = -1;
    }

    _demo() {
        Colors.forEach((color, index, list) => {
            let title = 'TITLE';
            let text = 'This is a log message!';
            let msg = `${color.title(title)} :: ${color.text(text)}`;
            console.log(msg);
        });
    }

    _addTag(tag) {
        if (tag.length > this._tagWidth) {
            this._tagWidth = tag.length;
        }
        this._tags[tag] = Colors[++this._lastColorUsed];
        if (this._lastColorUsed === Colors.length - 1) {
            this._lastColorUsed = 0;
        }
    }

    _tagColor(tag) {
        if (!this._tags[tag]) {
            this._addTag(tag);
        }
        return this._tags[tag];
    }

    _title(tag, color) {
        return color.title(`${Array(this._tagWidth - tag.length).join(' ')}${tag} `);
    }

    log(tag, msg) {
        // TODO: Handle multi-line messages with proper indentation
        let color = this._tagColor(tag);
        let _msg = `${this._title(tag, color)} :: ${color.text(msg)}`;
        console.log(_msg);
    }

    logger(tag) {
        return (msg) => {
            this.log(tag, msg);
        };
    }
}


module.exports = new Log();