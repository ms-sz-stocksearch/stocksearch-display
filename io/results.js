'use strict';

var http = require('http');

module.exports = function(query, cb){
    var req = http.get('http://172.26.100.226:8081/ranking/search?s=' + encodeURIComponent(query), function(res){
        if(res.statusCode >= 300) return cb({});
        res.setEncoding('utf8');
        var text = '';
        res.on('data', function(chunk){
            text += chunk;
        });
        res.on('end', function(){
            var data = JSON.parse( text.slice(text.indexOf('{')) );
            cb(data);
        });
        res.on('error', function(){
            cb({});
        });
    });
    req.on('error', function(){
        cb({});
    });
};
