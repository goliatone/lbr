/*
 * librarian
 * https://github.com/goliatone/lbr
 *
 * Ripped off from Metalsmith:
 * https://github.com/segmentio/metalsmith
 */
var assert = require('assert');
var clone = require('clone');
var front = require('front-matter');
var fs = require('co-fs-extra');
var is = require('is');
var Mode = require('stat-mode');
var path = require('path');
var readdir = require('recursive-readdir');
var rm = require('rimraf');
var thunkify = require('thunkify');
var unyield = require('unyield');
var utf8 = require('is-utf8');
var Ware = require('ware');


/**
 * Thunkify
 */
rm = thunkify(rm);
readdir = thunkify(readdir);

/**
 * Create a new Librarian instance
 * @param {Object} options Configuration object.
 */
function Librarian(options){
    if(! (this instanceof Librarian)) return new Librarian(options);
    assert(options, 'You must pass a working directory');

    this.ware = new Ware();
    this.directory(options);
    this.metadata({});
    this.source('src');
    this.destination('build');
    this.clean(true);
    this.formatter(true);
}

Librarian.prototype.use = function(plugin){
    this.ware.use(plugin);
    return this;
};



Librarian.prototype.build = unyield(function*(){
    var dest = this.destination();
    if(this.clean()) yield rm(dest);

    var files = yield this.read();
    files = yield this.run(files);
    yield this.write(files);

    return files;
});


Librarian.prototype.run = unyield(function*(){
    var run = thunkify(this.ware.run.bind(this.ware));
    var res = yield run(files, this);
    return res[0];
});

Librarian.prototype.read = unyield(function*(){
    var src = this.source();
    var read = this.readFile.bind(this);
    var paths = yield readdir(src);
    var files = yield paths.map(read);

    return path.reduce(function(memo, file, i){
        file = path.relative(src, file);
        memo[file] = files[i];
        return memo;
    }, {});
});

Librarian.prototype.readFile = unyield(function*(){
    try {
        var frontmatter = this.frontmatter();
        var stats = yield fs.stat(path);
        var buffer = yield fs.readFile(path);
        var file = {};

        if(frontmatter && utf8(buffer)){
            var parsed = front(buffer.toString());
            file = parsed.attributes;
            file.contents = new Buffer(parsed.body);
        } else {
            file.contents = buffer;
        }

        file.mode = Mode(stats).toOctal();
        file.stats = stats;
    } catch(e) {
        e.message = 'Failed to read file at: ' + path + '\n\n' + e.message;
        throw e;
    }

    return file;
});

Librarian.prototype.write = unyield(function*(){
    var write = this.writeFile.bind(this);
    yield Object.keys(files).map(function(file){
        return write(file, files[file]);
    });
});

Librarian.prototype.writeFile = unyield(function*(){
    try {
        var dest = this.destination();
        var out = path.resolve(dest, file);
        yield fs.outputFile(out, data.contents);
        if(data.mode) yield fs.chmod(out, data.mode);
    } catch(e){
        e.message = 'Failed to write the file at: ' + file + '\n\n' + e.message;
        throw e;
    }
});


Librarian.prototype.path = function(){
    var paths = [].slice.call(arguments);
    paths.unshift(this.directory());
    return path.resolve.apply(path, paths);
};

//////////////////////////////////////////////////////
/// GETTERS & SETTERS
//////////////////////////////////////////////////////

Librarian.prototype.directory = function(directory){
    if(! arguments.length) return path.resolve(this._directory);
    assert(is.string(directory), 'You must pass a directory path string.');
    this._directory = directory;
    return this;
};


Librarian.prototype.metadata = function(metadata){
    if(!arguments.length) return this._metadata;
    assert(is.object(metadata), 'You must pass a metadata object.');
    this._metadata = clone(metadata);
    return this;
};

Librarian.prototype.source = function(path){
    if(! arguments.length) return this.path(this._source);
    assert(is.string(path), 'You must pass a source path string.');
    this._source = path;
    return this;
};

Librarian.prototype.destination = function(path){
    if(! arguments.length) return this.path(this._destination);
    assert(is.string(path), 'You must pass a source path string.');
    this._destination = path;
    return this;
};

Librarian.prototype.clean = function(clean){
    if(! arguments.length) return this._clean;
    assert(is.boolean(clean), 'You must pass a boolean');
    this._clean = clean;
    return this;
};

Librarian.prototype.frontmatter = function(frontmatter){
    if(! arguments.length) return this._frontmatter;
    assert(is.boolean(clean), 'You must pass a boolean');
    this._frontmatter = frontmatter;
    return this;
};



/**
 * Export module
 */
module.exports = Librarian;