(function(){
    'use strict';

    var loadingDiv = document.querySelector('#loading');
    var contentDiv = document.querySelector('#content');
    var answerDiv = document.querySelector('#answer');
    var resultsDiv = document.querySelector('#results');
    var sidebarDiv = document.querySelector('#sidebar');
    var searchBox = document.querySelector('#searchbox');
    var searchBoxTitle = document.querySelector('#searchbox .searchbox_title');
    var inputBox = document.querySelector('.searchbox_input input');

    // input box animation
    var scade = window.scade;
    var inputBoxAni = scade.createSubject(1, function(val){
        var h = document.documentElement.clientHeight / 2;
        searchBox.style.height = (val*(h-80)+80) + 'px';
        inputBox.style.width = (val*240+760) + 'px';
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
            fromVal: 0,
            toVal: 1,
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
    var showResultPage = function(duration){
        var ts = scade.getTime();
        inputBoxAni.add({
            startTime: ts,
            fromVal: 1,
            toVal: 0,
            duration: duration || 300,
            timing: scade.timing.cubicBezier(0.8, 0.2, 0.2, 0.8)
        });
        searchBoxTitleAni.add({
            startTime: ts,
            fromVal: 1,
            toVal: 0,
            duration: duration || 300,
            timing: scade.timing.cubicBezier(0.8, 0.2, 1, 1)
        });
        showLoading();
        sendQuery();
    };
    var applyHashChange = function(){
        location.hash = '#' + inputBox.value;
    };
    var inputEventTobj = null;
    inputBox.onkeyup = function(e){
        if(inputEventTobj) clearTimeout(inputEventTobj);
        inputEventTobj = null;
        if(inputBox.value === curHash.slice(1)) return;
        if(e.keyCode === 13) {
            applyHashChange();
        } else {
            inputEventTobj = setTimeout(applyHashChange, 500);
        }
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
            loadingAni.add({
                startTime: scade.getTime(),
                toVal: 0
            });
            loadingAni.add({
                toVal: 1,
                duration: 1000,
                end: aniLoop
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
        sidebarDiv.style.opacity = (val - 0.1) / 0.8;
        resultsDiv.style.opacity = (val - 0.2) / 0.8;
    });

    // send query
    var socket = window.io.connect('http://' + location.host, {path: '/~/socket'});
    var curQuery = {
        qid: 0,
        answer: null,
        results: null,
        sidebar: null
    };
    var sendQuery = function(){
        var q = String(new Date().getTime() + Math.random());
        curQuery.qid = q;
        curQuery.answer = null;
        curQuery.results = null;
        curQuery.sidebar = null;
        answerDiv.style.display = 'none';
        resultsDiv.style.display = 'none';
        sidebarDiv.style.display = 'none';
        showLoading();
        socket.emit('answer', {
            qid: q,
            query: inputBox.value
        });
        socket.emit('results', {
            qid: q,
            query: inputBox.value
        });
        socket.emit('sidebar', {
            qid: q,
            query: inputBox.value
        });
    };
    socket.on('answer', function(res){
        if(curQuery.qid !== res.qid) return;
        curQuery.answer = res.data;
        receiveQuery();
    });
    socket.on('results', function(res){
        if(curQuery.qid !== res.qid) return;
        curQuery.results = res.data;
        receiveQuery();
    });
    socket.on('sidebar', function(res){
        if(curQuery.qid !== res.qid) return;
        curQuery.sidebar = res.data;
        receiveQuery();
    });
    var receiveQuery = function(){
        if(!curQuery.answer || !curQuery.results || !curQuery.sidebar) return;
        hideLoading();
        resultsAni.setVal(0);
        updateResultsDiv(curQuery);
        answerDiv.style.display = 'block';
        resultsDiv.style.display = 'block';
        sidebarDiv.style.display = 'block';
        resultsAni.add({
            startTime: scade.getTime(),
            toVal: 1,
            duration: 500,
            timing: scade.timing.linear()
        });
    };

    // templating
    var handlebars = window.Handlebars;
    var answerTmpl = handlebars.compile(window.tmpl.answer);
    var resultsTmpl = handlebars.compile(window.tmpl.results);
    var sidebarTmpl = handlebars.compile(window.tmpl.sidebar);
    var updateResultsDiv = function(res){
        answerDiv.innerHTML = answerTmpl(res.answer);
        resultsDiv.innerHTML = resultsTmpl(res.results);
        sidebarDiv.innerHTML = sidebarTmpl(res.sidebar);
    };

    // hash detection
    var curHash = location.hash;
    window.onhashchange = function(e){
        e.preventDefault();
        if(curHash === location.hash) return;
        curHash = location.hash;
        if(curHash.slice(1)) showResultPage();
        else showHomePage();
    };
    inputBox.value = curHash.slice(1);
    inputBox.select();
    inputBox.focus();
    if(inputBox.value) showResultPage(1);

})();
