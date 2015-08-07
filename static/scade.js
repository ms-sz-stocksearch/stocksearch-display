(function(exports){
    'use strict';

    var frameFuncs = [];

    var frame = function(){
        var ts = Date.now();
        for(var i=0; i<frameFuncs.length; i++) frameFuncs[i].frame(ts);
        requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);

    var getTime = function(){
        return new Date().getTime();
    };

    // subjects
    var createSubject = function(initVal, applyVal){
        var anis = [];
        var curVal = initVal;

        var setVal = function(val){
            abort();
            curVal = val;
        };

        var add = function(options){
            var startTime = options.startTime;
            var duration = options.duration || 0;
            var fromVal = options.fromVal;
            var toVal = ( options.toVal === undefined ? initVal : options.toVal );
            var timing = options.timing || timing.linear();
            var val = timing.val;
            var initProgress = timing.progress;
            var oncancel = options.cancel || function(){};
            var onstart = options.start || function(){};
            var onabort = options.abort || function(){};
            var onend = options.end || function(){};

            if(startTime === undefined) {
                if(anis.length) {
                    startTime = anis[anis.length-1].startTime + anis[anis.length-1].duration;
                } else {
                    startTime = getTime();
                }
            } else {
                abort(startTime);
            }
            if(fromVal !== undefined) {
                startTime -= duration * initProgress(curVal, fromVal, toVal);
            }

            anis.push({
                startTime: startTime,
                duration: duration,
                fromVal: fromVal || undefined,
                toVal: toVal,
                val: val,
                initProgress: initProgress,
                cancel: oncancel,
                start: onstart,
                abort: onabort,
                end: onend,
                started: false,
                aborted: false,
                cancelled: false
            });
        };

        var abort = function(time){
            if(time === undefined) time = getTime();
            for(var i=0; i<anis.length; i++) {
                var ani = anis[i];
                if(ani.startTime + ani.duration <= time) continue;
                if(ani.startTime < time) {
                    ani.aborted = true;
                    ani.duration = time - ani.startTime;
                } else {
                    ani.cancelled = true;
                    ani.startTime = time;
                    ani.duration = 0;
                }
            }
        };

        var skip = function(duration){
            for(var i=0; i<anis.length; i++) {
                anis[i].startTime -= duration;
            }
        };

        var frame = function(time){
            for(var i=0; i<anis.length; i++) {
                var ani = anis[i];
                if(ani.startTime > time) break;
                if(ani.cancelled) {
                    ani.cancel();
                    continue;
                }
                if(ani.aborted) {
                    ani.abort();
                    continue;
                }
                if(!ani.started) {
                    if(ani.fromVal === undefined) ani.fromVal = curVal;
                    ani.started = true;
                    ani.start();
                }
                if(ani.startTime + ani.duration <= time) {
                    curVal = ani.toVal;
                    applyVal(curVal);
                    ani.end();
                } else {
                    curVal = ani.val( (time - ani.startTime) / ani.duration, ani.fromVal, ani.toVal );
                    applyVal(curVal);
                    break;
                }
            }
            anis.splice(0, i);
        };

        var frameObj = {
            frame: frame
        };
        frameFuncs.push(frameObj);
        var destroy = function(){
            for(var i=0; i<frameFuncs.length; i++) {
                if(frameObj === frameFuncs[i]) {
                    frameFuncs.splice(i, 1);
                    break;
                }
            }
        };

        return {
            setVal: setVal,
            add: add,
            abort: abort,
            skip: skip,
            destroy: destroy
        };
    };

    // timing functions
    var timing = {};
    timing.linear = function(){
        return {
            val: function(progress, a, b){
                return a + progress * (b-a);
            },
            progress: function(val, a, b){
                return (val-a) / (b-a);
            }
        };
    };
    timing.cubicBezier = function(x1, y1, x2, y2){
        var solve = function(x1, y1, x2, y2, x){
            // solve cubic bizier between 0 and 1, get y for x
            var max = 1;
            var min = 0;
            var mid = 0.5;
            var rmid = 0.5;
            for(var depth=24; depth; depth--) {
                var midX = 3 * rmid * rmid * mid * x1 + 3 * rmid * mid * mid * x2 + mid * mid * mid;
                if(midX < x) min = mid;
                else max = mid;
                mid = (max + min) / 2;
                rmid = 1 - mid;
            }
            var midY = 3 * rmid * rmid * mid * y1 + 3 * rmid * mid * mid * y2 + mid * mid * mid;
            return midY;
        };
        return {
            val: function(progress, a, b){
                return a + solve(x1, y1, x2, y2, progress) * (b-a);
            },
            progress: function(val, a, b){
                return solve(y1, x1, y2, x2, (val-a) / (b-a));
            }
        };
    };

    exports.scade = {
        getTime: getTime,
        createSubject: createSubject,
        timing: timing
    };
})(window);
