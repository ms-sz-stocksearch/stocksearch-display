(function(){
    'use strict';

    var content = document.querySelector('#content');
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
        content.style.opacity = 1-val;
    });
    var showHomePage = function(){
        var ts = scade.getTime();
        inputBoxAni.add({
            startTime: ts,
            fromVal: 80,
            toVal: 400,
            duration: 300,
            timing: scade.timing.cubicBezier(.8, .2, .2, .8)
        });
        searchBoxTitleAni.add({
            startTime: ts,
            fromVal: 0,
            toVal: 1,
            duration: 300,
            timing: scade.timing.cubicBezier(.2, .8, 0, 0),
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
            timing: scade.timing.cubicBezier(.8, .2, .2, .8)
        });
        searchBoxTitleAni.add({
            startTime: ts,
            fromVal: 1,
            toVal: 0,
            duration: 300,
            timing: scade.timing.cubicBezier(.8, .2, 1, 1)
        });
        answerDiv.style.display = 'block';
        resultsDiv.style.display = 'block';
    };
    inputBox.onkeyup = function(){
        if(inputBox.value) showResultPage();
        else showHomePage();
    };

    var answerDiv = document.querySelector('#answer');
    var resultsDiv = document.querySelector('#results');
    answerDiv.innerHTML = window.tmpl.answer;
    resultsDiv.innerHTML = window.tmpl.results;
})();
