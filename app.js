'use strict';

var http = require('http');
var express = require('express');
var io = require('socket.io');
var fs = require('fs');

var app = express();
var httpd = http.createServer(app);
io = io(httpd);

process.chdir(__dirname);

// templates
var tmpls = {};
fs.readdirSync('static').forEach(function(file){
    if(file.slice(-5) !== '.tmpl') return;
    var tmpl = fs.readFileSync('static/' + file, {encoding: 'utf8'});
    tmpls[file.slice(0, -5)] = tmpl;
});
var tmplsJson = JSON.stringify(tmpls);

// io
var acceptQueries = ['search', 'status'];
io.on('connection', function(socket){
    acceptQueries.forEach(function(query){
        socket.on(query, function(data){
            require( 'io/' + query + '.js' )( data, socket );
        });
    });
});

// serve http static files
app.use('/~', express.static('./static'));
app.get('/', function(req, res){
    res.sendFile('index.html', { root: '.' });
});
app.get('/~/tmpls.js', function(req, res){
    res.send('window.tmpl=' + tmplsJson);
});

httpd.listen(8080);
