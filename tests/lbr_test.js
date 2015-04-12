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
    });
});