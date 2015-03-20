var extend = require('gextend');
var exists = require('fs').existsSync;
var resolve = require('path').resolve;

var DEFAULTS = {
    sort: _sort,
    handler: _handler,
    root: process.cwd(),
    normalize: _normalize,
    load: _load
};

PluginManager.DEFAULTS = DEFAULTS;

function PluginManager(options, plugins) {

    options = extend({}, DEFAULTS, options);

    var root = options.root;
    var sort = options.sort;
    var load = options.load;
    var normalize = options.normalize;

    sort(normalize(plugins)).forEach(function(plugin){
        var id, config, local, npm, mdl;
        for(id in plugin){
            try {
                config = plugin[id];
                local = resolve(root, id);
                npm = resolve(root, 'node_modules', id);
                mdl = null;

                if(exists(local)) mdl = require(local);
                else if(exists(local + '.js')) mdl = require(local);
                else if(exists(npm)) mdl = require(npm);
                else mdl = require(id);

                load(mdl, config, options);
            } catch(e) {
                throw new Error('Failed to require plugin: ' + id + '\n\n' + e.message);
            }
        }
    });
}

function _sort(plugins){
    return plugins;
}

function _normalize(config){
    if(Array.isArray(config)) return config;

    var plugins = [];
    var plugin, key;

    for(key in config){
        plugin = {};
        plugin[key] = config[key];
        plugins.push(plugin);
    }

    return plugins;
}

function _load(mdl, config, options){
    return options.handler(mdl(config));
}

function _handler(fn){
    return fn;
}

/**
 * Expose PluginManager
 */
module.exports = PluginManager;