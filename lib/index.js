/*
 * librarian
 * https://github.com/goliatone/lbr
 *
 * Ripped off from Metalsmith:
 * https://github.com/segmentio/metalsmith
 */
var assert = require('./assert-is');
var absolute = require('absolute');
var clone = require('clone');
var matter = require('gray-matter');
var fs = require('co-fs-extra');
var Mode = require('stat-mode');
var path = require('path');
var readdir = require('recursive-readdir');
var rm = require('rimraf');
var thunkify = require('thunkify');
var unyield = require('unyield');
var utf8 = require('is-utf8');
var Ware = require('ware');
var extend = require('gextend');

/**
 * Thunkify
 */
rm = thunkify(rm);
readdir = thunkify(readdir);

var DEFAULTS = {
    directory: process.env.PWD,
    metadata: {},
    source: 'src',
    destination: 'build',
    clean: true,
    frontmatter: true,
    debug: false,
    attributes: ['contents', 'isUtf8', 'mode', 'stats']
};


/**
 * Create a new Librarian instance
 * @param {Object} options Configuration object.
 */
function Librarian(options){
    if(! (this instanceof Librarian)) return new Librarian(options);

    if(typeof options === 'string') options = {directory: options};
    options = extend({}, DEFAULTS, options);



    this.plugins = [];
    //TODO: Figure out how to do regular strategy
    Object.keys(DEFAULTS).map(function(key){
        this[key].call(this, options[key]);
        delete options[key];
    }, this);

    extend(this, options);
}

Librarian.DEFAULTS = DEFAULTS;

/**
 * Add a `plugin` to the middleware stack
 * @param  {Function|Array} plugin
 * @return {this}
 */
Librarian.prototype.use = function(plugin){
    this.plugins.push(plugin);
    return this;
};


/**
 * Build the current settings to the destination
 * directory.
 * @return {Object} Files object.
 */
Librarian.prototype.build = unyield(function*(){
    var dest = this.destination();

    //PRE
    if(this.clean()) yield rm(dest);

    //COLLECT
    var files = yield this.read();

    //TRANSFORM
    files = yield this.run(files);

    //SAVE METADATA OBJECT.
    if(this.debug()) yield this.debugBuild(files);

    //POST
    yield this.write(files);

    return files;
});

/**
 * Run collected files through plugin stack.
 * @param   {Object}    files
 * @return  {Object}
 */
Librarian.prototype.run = unyield(function*(files, plugins){
    var ware = new Ware(plugins || this.plugins);
    var run = thunkify(ware.run.bind(ware));
    var res = yield run(files, this);
    return res[0];
});

/**
 * Read a dictionary of files from a `dir`,
 * parsing frontmatter. If no directory is
 * provided, it will default to the source
 * directory.
 *
 * @param   {String}    dir (optional)
 * @return  {Object}
 */
Librarian.prototype.read = unyield(function*(dir){
    dir = dir || this.source();
    var read = this.readFile.bind(this);
    var paths = yield readdir(dir);
    var files = yield paths.map(read);

    return paths.reduce(function(memo, file, i){
        file = path.relative(dir, file);
        memo[file] = files[i];
        return memo;
    }, {});
});

/**
 * Read a `file` by path. If the path is
 * not absolute, it will be resolved
 * relative to the source directory.
 *
 * @param   {String}    path
 * @return  {Object}
 */
Librarian.prototype.readFile = unyield(function*(filepath){

    if(!absolute(filepath)) filepath = path.resolve(this.source(), filepath);

    try {
        var frontmatter = this.frontmatter();
        var stats = yield fs.stat(filepath);
        var buffer = yield fs.readFile(filepath);
        var file = {};

        file.contents = buffer;
        file.isUtf8 = utf8(file.contents);
        //TODO: Remove frontmatter dep. Make a pre compile hook
        if(frontmatter && file.isUtf8){
            var parsed;
            try {
                parsed = matter(file.contents.toString());
            } catch(e) {
                var err = new Error('Invalid frontmatter in file at: ' + filepath);
                err.code = 'invalid_frontmatter';
                throw err;
            }

            file = parsed.data;
            //we should not need this. We should use attributes.
            file.isUtf8 = true;
            file.contents = new Buffer(parsed.content);
        }

        file.mode = Mode(stats).toOctal();
        file.stats = stats;
    } catch(e) {
        if (e.code == 'invalid_frontmatter') throw e;
        e.message = 'Failed to read file at: ' + filepath + '\n\n' + e.message;
        e.code = 'failed_read';
        throw e;
    }

    return file;
});


/**
 * Write a dictionary of `files` to a
 * destination `dir`. If no directory is
 * provided, it will default to the
 * destination directory.
 *
 * @param   {Object}    files
 * @param   {String}    dir (optional)
 */
Librarian.prototype.write = unyield(function*(files, dir){
    dir = dir || this.destination();

    var write = this.writeFile.bind(this);

    yield Object.keys(files).map(function(key){
        var file = path.resolve(dir, key);
        return write(file, files[key]);
    });
});

/**
 * Write a `file` by path with `data`.
 * If the path is not absolute, it will be
 * resolved relative to the destination
 * directory.
 *
 * @param   {String}    file
 * @param   {Object}    data
 */
Librarian.prototype.writeFile = unyield(function*(file, data){
    var dest = this.destination();
    if (!absolute(file)) file = path.resolve(dest, file);

    try {
        yield fs.outputFile(file, data.contents);
        if(data.mode) yield fs.chmod(file, data.mode);
    } catch(e){
        e.message = 'Failed to write the file at: ' + file + '\n\n' + e.message;
        e.code = 'write_file';
        throw e;
    }
});

Librarian.prototype.path = function(){
    var paths = [].slice.call(arguments);
    paths.unshift(this.directory());
    return path.resolve.apply(path, paths);
};

Librarian.prototype.debugBuild = unyield(function*(files){
    var out = {};
    yield Object.keys(files).map(function(key){
        var file =  clone(files[key]);
        if(file.isUtf8) file.contents = file.contents.toString();
        out[key] = file;
    });
    yield fs.writeFile('lbr_debug.json', JSON.stringify(out, null, 4));
});

//////////////////////////////////////////////////////
/// GETTERS & SETTERS
//////////////////////////////////////////////////////

/**
 * Get or set the working `directory`.
 *
 * @param   {Object}    directory
 * @return  {Object|this}
 */
Librarian.prototype.directory = function(directory){
    if(! arguments.length) return path.resolve(this._directory);
    assert.isString(directory, 'You must pass a directory path string.');
    this._directory = directory;
    return this;
};

/**
 * Get or set the global `metadata` to pass to templates.
 *
 * @param   {Object}    metadata
 * @return  {Object|this}
 */
Librarian.prototype.metadata = function(metadata){
    if(!arguments.length) return this._metadata;
    assert.isObject(metadata, 'You must pass a metadata object.');
    this._metadata = clone(metadata);
    return this;
};

/**
 * Get or set the source directory.
 *
 * @param   {String} path
 * @return  {String|this}
 */
Librarian.prototype.source = function(path){
    if(! arguments.length) return this.path(this._source);
    assert.isString(path, 'You must pass a source path string.');
    this._source = path;
    return this;
};

/**
 * Get or set the destination directory.
 *
 * @param   {String}    path
 * @return  {String|this}
 */
Librarian.prototype.destination = function(path){
    if(! arguments.length) return this.path(this._destination);
    assert.isString(path);
    this._destination = path;
    return this;
};

/**
 * Get or set whether the destination
 * directory will be removed before writing.
 *
 * @param   {Boolean}   clean
 * @return  {Boolean|this}
 */
Librarian.prototype.clean = function(clean){
    if(! arguments.length) return this._clean;
    assert.isBoolean(clean);
    this._clean = clean;
    return this;
};

/**
 * Optionally turn off frontmatter parsing.
 *
 * @param   {Boolean}   frontmatter
 * @return  {Boolean|this}
 */
Librarian.prototype.frontmatter = function(frontmatter){
    if(! arguments.length) return this._frontmatter;
    assert.isBoolean(frontmatter);
    this._frontmatter = frontmatter;
    return this;
};

/**
 * Base attributes for each file object.
 * If your plugin needs to override the
 * base file object you want to use this
 * array. Also if your plugin adds an
 * attribute it should be added here.
 *
 * @param   {Array}     attributes
 * @return  {Boolean|this}
 */
Librarian.prototype.attributes = function(attributes){
    if(! arguments.length) return this._attributes;
    assert.isArray(attributes);
    this._attributes = attributes;
    return this;
};

/**
 * Optionally turn off frontmatter parsing.
 *
 * @param   {Boolean}     frontmatter
 * @return  {Boolean|this}
 */
Librarian.prototype.debug = function(debug){
    if(! arguments.length) return this._debug;
    assert.isBoolean(debug);
    this._debug = debug;
    return this;
};



/**
 * Export module
 */
module.exports = Librarian;