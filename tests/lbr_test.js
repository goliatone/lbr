'use strict';
var assert = require('chai').assert;
var fs = require('fs');
var path = require('path');
var Mode = require('stat-mode');
var rm = require('rimraf').sync;
var equal = require('assert-dir-equal');
var exec = require('child_process').exec;
var fixture = path.resolve.bind(path, __dirname, 'fixtures');

describe.only('LBR', function(){
    var bin = path.resolve(__dirname, '../bin/lbr');

    describe('build', function(){
        it('should throw error without a librarian.json', function(done){
            exec(bin, {cwd: fixture('cli-no-config')}, function(err, stdout){
                assert(err);
                console.log(err.message)
                done();
            });
        });

        it('should grab config from librarian.json', function(done){
            exec(bin, {cwd: fixture('cli-json')}, function(err, stdout){
                if(err) return done(err);
                equal(fixture('cli-json/destination'), fixture('cli-json/expected'));
                done();
            });
        });

        it('should grab config from -c flag', function(done){
            exec(bin + ' -c config.json', {cwd: fixture('cli-alt-json')}, function(err, std){
                if(err) return done(err);
                equal(fixture('cli-alt-json/destination'), fixture('cli-alt-json/expected'));
                done();
            });
        });

        it('should require a plugin', function(done){
            exec(bin, {cwd: fixture('cli-plugin-object')}, function(err, stdout){
                if(err) return done(err);
                equal(fixture('cli-plugin-object/build'), fixture('cli-plugin-object/expected'));
                done();
            });
        });

        it('should require a plugins array', function(done){
            exec(bin, {cwd: fixture('cli-plugin-array')}, function(err, stdout){
                if(err) return done(err);
                equal(fixture('cli-plugin-array/build'), fixture('cli-plugin-array/expected'));
                done();
            });
        });
    });
});