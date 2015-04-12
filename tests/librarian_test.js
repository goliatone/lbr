'use strict';
var assert = require('chai').assert;
var fs = require('fs');
var path = require('path');
var equal = require('assert-dir-equal');
var fixture = path.resolve.bind(path, __dirname, 'fixtures');

var Librarian = require('../');

describe('Librarian', function(){

    var NOOP = function(){};

    it('should expose constructor', function(){
        assert.isFunction(Librarian);
    });

    it('should not require new keyword', function(){
        var l = Librarian();
        assert.instanceOf(l, Librarian);
    });

    it('should have a DEFAULTS object', function(){
        assert.isObject(Librarian.DEFAULTS);
    });

    it('should take an options object', function(){
        var options = {directory:'my-directory'};
        var l = Librarian(options);
        assert.ok(l.directory(), 'my-directory');
    });

    it('should take a single string argument that will be the working directory', function(){
        //this might change!
        var l = Librarian('my-directory');
        assert.ok(l.directory(), 'my-directory');
    });

    xdescribe('#use', function(){
        it('should add plugin to stack', function(){
            var l = Librarian();
            l.use(NOOP);
            assert.equal(l.plugins.length, 1);
        });
    });

    describe('#directory', function(){

        it('should set a working directory by default equal to process.env.PWD', function(){
            var l = Librarian();
            assert.equal(l.directory(), process.env.PWD);
        });

        it('should set the working directory', function(){
            var l = Librarian({directory:'dir'});
            assert.ok(l.directory(), 'dir');
        });

        it('should respect absolute directories', function(){
            var l = Librarian({directory:'/dir'});
            assert.ok(l.directory(), '/dir');
        });
    });

    describe('#source', function(){
        it('should set a "source" directory in DEFAULTS', function(){
            var l = Librarian();
            assert.ok(l.source(), Librarian.DEFAULTS.source);
        });

        it('should set the "source" directory', function(){
            var l = Librarian({source:'dir'});
            assert.ok(l.directory(), 'dir');
        });

        it('should get full path of source directory', function(){
            var l = Librarian();
            var absoluteBuildPath = path.join(process.env.PWD, '/build');
            assert.ok(l.source(), absoluteBuildPath);
        });

        it('should respect absolute directories', function(){
            var l = Librarian({source:'/dir'});
            assert.ok(l.source(), '/dir');
        });

        it('should throw on non strings', function(){
            var l = Librarian();
            assert.throws(function(){
                l.source(23);
            });
        });
    });

    describe('#destination', function(){
        it('should set a destination directory in DEFAULTS', function(){
            var l = Librarian();
            assert.ok(l.destination(), Librarian.DEFAULTS.destination);
        });

        it('should get full path of destination directory', function(){
            var l = Librarian();
            var absoluteBuildPath = path.join(process.env.PWD, '/build');
            assert.ok(l.destination(), absoluteBuildPath);
        });

        it('should respect absolute directories', function(){
            var l = Librarian({destination:'/dir'});
            assert.ok(l.destination(), '/dir');
        });

        it('should throw on non strings', function(){
            var l = Librarian();
            assert.throws(function(){
                l.destination(23);
            });
        });
    });

    describe('#clean', function(){
        it('should set the "clean" default used in DEFAULTS', function(){
            var l = Librarian();
            assert.equal(l.clean(), Librarian.DEFAULTS.clean);
        });

        it('should set the "clean" option', function(){
            var l = Librarian();
            l.clean(false);
            assert.equal(l.clean(), false);
        });

        it('should throw on on boolean', function(){
            var l = Librarian();
            assert.throws(function(){
                l.clean(23);
            });
        });
    });

    describe('#frontmatter', function(){
        it('should set the "frontmatter" default used in DEFAULTS', function(){
            var l = Librarian();
            assert.equal(l.frontmatter(), Librarian.DEFAULTS.frontmatter);
        });

        it('should initialize the "frontmatter" option', function(){
            var l = Librarian({frontmatter: true});
            assert.equal(l.frontmatter(), true)
        });

        it('should set the "frontmatter"', function(){
            var l = Librarian();
            l.frontmatter(true);
            assert.equal(l.frontmatter(), true)
        });

        it('should throw on on boolean', function(){
            var l = Librarian();
            assert.throws(function(){
                l.frontmatter(23);
            });
        });
    });

    describe('#metadata', function(){
        it('should set the "metadata" default used in DEFAULTS', function(){
            var l = Librarian();
            assert.deepEqual(l.metadata(), Librarian.DEFAULTS.metadata);
        });

        it('should initialize the "metadata" option', function(){
            var meta = {
                user: 'goliatone',
                url:'http://goliatone.com'
            };

            var l = Librarian({metadata: meta});
            assert.deepEqual(l.metadata(), meta);
        });

        it('should get "metadata"', function(){
            var l = Librarian();
            assert.deepEqual(l.metadata(), {});
        });

        it('should set "metadata" clone', function(){
            var meta = {
                user: 'goliatone',
                url:'http://goliatone.com'
            };
            var l = Librarian();
            l.metadata(meta);
            assert.notEqual(l.metadata(), meta);
            assert.deepEqual(l.metadata(), meta);
        });
    });

    describe('#attributes', function(){
        it('should set the "attributes" default used in DEFAULTS', function(){
            var l = Librarian();
            assert.deepEqual(l._attributes, Librarian.DEFAULTS.attributes);
        });

        it('should initialize the "attributes" option', function(){
            var attributes = ['stats', 'content'];
            var l = Librarian({attributes: attributes});
            assert.ok(l.attributes(), attributes);
        });

        it('should get "attributes" option', function(){
            var l = Librarian();
            assert.deepEqual(l.attributes(), Librarian.DEFAULTS.attributes);
        });

        it('should set "attributes" option', function(){
            var l = Librarian();
            var attributes = ['stats', 'content'];
            l.attributes(attributes);
            assert.ok(l.attributes(), attributes);
        });
    });

    describe('#path', function(){
        it('should return a path relative to the working directory', function(){
            var l = Librarian({source:'test/tmp'});
            var rel = l.path('one', 'two', 'three');
            assert.ok(rel, '/test/tmp/one/two/three');
        });
    });

    describe('#read', function(){
        it('should read from a source directory', function(done){
            var l = Librarian({
                directory: fixture('read')
            });
            var stats = fs.statSync(fixture('read/src/index.md'));

            l.read(function(err, files){
                if(err) return done(err);
                assert.ok(files, {
                    'index.md': {
                        title: 'A Title',
                        contents: new Buffer('body'),
                        mode: stats.mode.toString(8).slice(-4),
                        stats:stats,
                        isUtf8: true
                    }
                });
                done();
            });
        });

        it('should read from a provided directory', function(done){
            var l = Librarian({
                directory: fixture('read-dir')
            });
            var stats = fs.statSync(fixture('read-dir/dir/index.md'));
            var dir = fixture('read-dir/dir');
            l.read(dir, function(err, files){
                if(err) done(err);
                assert.ok(files, {
                    'index.md': {
                        title: 'A Title',
                        contents: new Buffer('body'),
                        mode: stats.mode.toString(8).slice(-4),
                        stats:stats,
                        isUtf8: true
                    }
                });
            });
            done();
        });

        it('should preserve an existing file mode', function(done){
            var l = Librarian({
                directory: fixture('read-mode')
            });
            var stats = fs.statSync(fixture('read-mode/src/bin'));

            l.read(function(err, files){
                if(err) done(err);
                assert.ok(files, {
                    'bin': {
                        contents: new Buffer('echo test'),
                        mode: stats.mode.toString(8).slice(-4),
                        stats: stats,
                        isUtf8: false
                    }
                });
            });
            done();
        });

        describe('should expose isUtf8 "metadata" property', function(){
            it('should be false for binary files', function(done){
                var l = Librarian({
                    directory: fixture('read-isUtf8-false')
                });

                l.read(function(err, files){
                    if(err) done(err);
                    assert.isFalse(files['image.png'].isUtf8);
                });
                done();
            });

            it('should be true for text files', function(done){
                var l = Librarian({
                    directory: fixture('read-isUtf8-true')
                });

                l.read(function(err, files){
                    if(err) done(err);
                    assert.isTrue(files['index.md'].isUtf8);
                });
                done();
            });
        });

        it('should expose attributes in each file "metadata"', function(done){
            var l = Librarian({
                directory: fixture('expose-attributes')
            });
            l.read(function(err, files){
                if(err) done(err);
                var file = files['index.md'];
                Librarian.DEFAULTS.attributes.map(function(attr){
                    assert.property(file, attr, attr);
                });
            });
            done();
        });

        it('should not parse front-matter if "frontmatter" is false', function(done){
            var l = Librarian({
                directory: fixture('read-frontmatter'),
                frontmatter: false
            });
            l.read(function(err, files){
                if(err) done(err);
                assert.isUndefined(files['index.md'].title);
            });
            done();
        });
    });

    describe('#write', function(){
        it('should write to a destination directory', function(done){
            var l = Librarian({
                directory: fixture('write')
            });
            var files = {'index.md':{contents: new Buffer('body')}};
            l.write(files, function(err){
                if(err) return done(err);
                equal(fixture('write/build'), fixture('write/expected'));
                done();
            });
        });

        it('should write to a provided directory', function(done){
            var l = Librarian({
                directory: fixture('write-dir')
            });
            var files = {'index.md':{contents: new Buffer('body')}};
            var dir = fixture('write-dir/out');
            l.write(files, dir, function(err){
                if(err) return done(err);
                equal(fixture('write-dir/out'), fixture('write-dir/expected'));
                done();
            });
        });
    });
});