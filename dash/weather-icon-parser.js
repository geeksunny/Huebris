const postcss = require('postcss');
const path = require('path');
const fs = require('fs');


module.exports = {
    parse() {
        return new Promise(((resolve, reject) => {
            let names = [];
            const plugin = postcss.plugin('parseClasses', () => {
                // TODO: Feed in template regex as plugin option
                return (css) => {
                    css.walkRules(/wi-owm(?:-(\w*))?(?:-(\d\d\d))/g, (rule) => {
                        let name = rule.selector.replace(/\.|:before/g, '');
                        name.split(' ').forEach((_name) => {
                            names.push(_name);
                        });
                    });
                };
            });

            fs.readFile(file, (err, css) => {
                if (err) {
                    reject(err);
                }
                const file = path.join(__dirname, '/bower_components/weather-icons/css/weather-icons.css');

                postcss([plugin]).process(css).then((result) => {
                    let map;
                    names.forEach((icon) => {
                        let match = /wi-owm(?:-(\w*))?(?:-(\d\d\d))/g.exec(icon);
                        let group = (match[1]) ? match[1] : 'default';
                        let id = match[2];

                        if (typeof map[group] === 'undefined') {
                            map[group] = {};
                        }
                        map[group][id] = icon;
                    });
                    resolve(map);
                });
            });
        }));
    }
};