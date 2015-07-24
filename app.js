'use strict';

var http = require('http');
var express = require('express');
var io = require('socket.io');
var fs = require('fs');

var app = express();
var httpd = http.createServer(app);
io = io(httpd);

app.use(function(req, res){
    // TODO
});

io.on('connection', function(socket){
    // TODO
});

httpd.listen(2080);
