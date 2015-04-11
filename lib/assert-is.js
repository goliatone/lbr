var is = require('is');
var assert = require('assert');

var _assert = module.exports = {};

for(var method in is){
    if(!is.hasOwnProperty(method)) return
    if(typeof is[method] !== 'function') return

    _assert[methodName(method)] = (function(_method){
        return function(value, message){
            if(is[_method].call(is, value)) return true;
            throw new Error(getMessage(_method, typeof value, message));
        }
    })(method);
}

function methodName(name){
    return 'is' + capitalize(name);
}

function capitalize(name){
    return name.charAt(0).toUpperCase() + name.slice(1);
}

function getMessage(method, type, message){
    if(! message) message = 'Expecting [#method#] type, got [#type#] instead.';
    return message.replace(/#method#/g, method).replace(/#type#/g,type);
}