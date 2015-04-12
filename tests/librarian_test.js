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
});