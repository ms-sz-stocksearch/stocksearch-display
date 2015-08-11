'use strict';

var http = require('http');
var iconv = require('iconv-lite');

module.exports = function(query, cb){
    var stockId = query;
    var req = http.get('http://hq.sinajs.cn/list=' + stockId, function(res){
        if(res.statusCode >= 300) return cb({});
        var iconvStream = iconv.decodeStream('gbk');
        res.pipe(iconvStream);
        var text = '';
        iconvStream.on('data', function(chunk){
            text += chunk;
        });
        iconvStream.on('end', function(){
            var slices = text.slice( text.indexOf('=')+2, -2 ).split(',');
            if(slices.length < 12) return cb({});
            cb({
                pic: 'http://image.sinajs.cn/newchart/daily/n/' + stockId + '.gif',
                number: stockId.slice(2),
                name: slices[0],
                open: slices[1],
                closed: slices[2],
                current: slices[3],
                max: slices[4],
                min: slices[5],
                hands: Math.round(slices[8] / 100),
                turnover: Math.round(slices[9] / 10000),
                date: slices[slices.length-3],
                time: slices[slices.length-2],
            });
        });
    });
    req.on('error', function(){
        cb({});
    });
};
