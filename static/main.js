(function(){
    'use strict';

    var loadingDiv = document.querySelector('#loading');
    var contentDiv = document.querySelector('#content');
    var answerDiv = document.querySelector('#answer');
    var resultsDiv = document.querySelector('#results');
    var searchBox = document.querySelector('#searchbox');
    var searchBoxTitle = document.querySelector('#searchbox .searchbox_title');
    var inputBox = document.querySelector('.searchbox_input input');
    inputBox.focus();

    // input box animation
    var scade = window.scade;
    var inputBoxAni = scade.createSubject(400, function(val){
        searchBox.style.height = val + 'px';
    });
    var searchBoxTitleAni = scade.createSubject(1, function(val){
        searchBoxTitle.style.opacity = val;
        contentDiv.style.opacity = 1-val;
    });
    var showHomePage = function(){
        var ts = scade.getTime();
        hideLoading();
        inputBoxAni.add({
            startTime: ts,
            fromVal: 80,
            toVal: 400,
            duration: 300,
            timing: scade.timing.cubicBezier(0.8, 0.2, 0.2, 0.8)
        });
        searchBoxTitleAni.add({
            startTime: ts,
            fromVal: 0,
            toVal: 1,
            duration: 300,
            timing: scade.timing.cubicBezier(0.2, 0.8, 0, 0),
            end: function(){
                answerDiv.style.display = 'none';
                resultsDiv.style.display = 'none';
            }
        });
    };
    var showResultPage = function(){
        var ts = scade.getTime();
        inputBoxAni.add({
            startTime: ts,
            fromVal: 400,
            toVal: 80,
            duration: 300,
            timing: scade.timing.cubicBezier(0.8, 0.2, 0.2, 0.8)
        });
        searchBoxTitleAni.add({
            startTime: ts,
            fromVal: 1,
            toVal: 0,
            duration: 300,
            timing: scade.timing.cubicBezier(0.8, 0.2, 1, 1)
        });
        showLoading();
        sendQuery();
    };
    inputBox.onkeyup = function(){
        if(inputBox.value) showResultPage();
        else showHomePage();
    };

    // loading animation
    var loadingBlocks = document.querySelectorAll('#loading .loading_block');
    var loadingAni = scade.createSubject(0, function(val){
        for(var i=0; i<loadingBlocks.length; i++) {
            var op = val*2 - i/10;
            if(op > 1) op = 2 - op;
            if(op < 0.4) op = 0.4;
            loadingBlocks[i].style.opacity = op - 0.2;
        }
    });
    var showLoading = function(){
        loadingDiv.style.display = 'block';
        var aniLoop = function(){
            loadingAni.setVal(0);
            loadingAni.add({
                startTime: scade.getTime(),
                toVal: 1,
                duration: 1000,
                timing: scade.timing.linear(),
                end: function(){
                    setTimeout(aniLoop, 0);
                }
            });
        };
        aniLoop();
    };
    var hideLoading = function(){
        loadingAni.abort();
        loadingDiv.style.display = 'none';
    };

    // answer and results animation
    var resultsAni = scade.createSubject(0, function(val){
        answerDiv.style.opacity = val / 0.8;
        resultsDiv.style.opacity = (val - 0.2) / 0.8;
    });

    // TODO send query
    var curQuery = 0;
    var sendQuery = function(){
        var q = new Date().getTime();
        curQuery = q;
        answerDiv.style.display = 'none';
        resultsDiv.style.display = 'none';
        showLoading();
        setTimeout(function(){
            if(curQuery !== q) return;
            hideLoading();
            resultsAni.setVal(0);
            answerDiv.innerHTML = window.tmpl.answer;
            resultsDiv.innerHTML = window.tmpl.results;
            answerDiv.style.display = 'block';
            resultsDiv.style.display = 'block';
            resultsAni.add({
                startTime: scade.getTime(),
                toVal: 1,
                duration: 500,
                timing: scade.timing.linear()
            });
        }, 3000);
    };

})();
