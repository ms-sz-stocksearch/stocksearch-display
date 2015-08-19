'use strict';

var http = require('http');
var express = require('express');
var io = require('socket.io');
var fs = require('fs');
var path = require('path');

var app = express();
var httpd = http.createServer(app);
io = io(httpd, {path: '/~/socket'});

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
io.on('connection', function(socket){
    socket.on('search', function(data){
        // results
        require( './io/results.js' )(data.query, function(res){
            io.emit('results', {
                qid: data.qid,
                data: res
            });
            // answer
            if(res.stock_code || data.query.match(/^[0-9]{6}$/)) {
                require( './io/answer.js' )(res.stock_code || data.query, function(res){
                    io.emit('answer', {
                        qid: data.qid,
                        data: res
                    });
                });
            } else {
                io.emit('answer', {
                    qid: data.qid,
                    data: {}
                });
            }
        });
        // sidebar
        require( './io/sidebar.js' )(data.query, function(res){
            io.emit('sidebar', {
                qid: data.qid,
                data: res
            });
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
