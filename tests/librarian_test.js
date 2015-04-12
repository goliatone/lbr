'use strict';
var assert = require('chai').assert;
var path = require('path');
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

        it('should set the "frontmatter" option', function(){
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

        it('should set the "metadata" option', function(){
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
});