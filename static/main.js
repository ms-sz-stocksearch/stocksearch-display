(function(){
    'use strict';

    var loadingDiv = document.querySelector('#loading');
    var contentDiv = document.querySelector('#content');
    var answerDiv = document.querySelector('#answer');
    var answerBgDiv = document.querySelector('#answer_bg');
    var resultsDiv = document.querySelector('#results');
    var sidebarDiv = document.querySelector('#sidebar');
    var searchBox = document.querySelector('#searchbox');
    var searchBoxTitle = document.querySelector('#searchbox .searchbox_title');
    var inputBox = document.querySelector('.searchbox_input input');

    // input box animation
    var scade = window.scade;
    var inputBoxAni = scade.createSubject(1, function(val){
        var h = document.documentElement.clientHeight * 0.6;
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
            timing: scade.timing.cubicBezier(0.2, 0.8, 0, 0)
        });
        resultsAni.add({
            startTime: ts,
            fromVal: 1,
            toVal: 0,
            duration: 300,
            end: function(){
                answerDiv.style.display = 'none';
                answerBgDiv.style.display = 'none';
                resultsDiv.style.display = 'none';
                sidebarDiv.style.display = 'none';
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
        inputEventTobj = null;
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
        var sqrtVal = Math.sqrt(val / 0.6);
        if(sqrtVal > 1) sqrtVal = 1;
        answerBgDiv.style.opacity = sqrtVal;
        answerBgDiv.style.height = (320 + sqrtVal*80) + 'px';
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
        resultsAni.add({
            startTime: scade.getTime(),
            fromVal: 1,
            toVal: 0,
            duration: 300,
            end: function(){
                answerDiv.style.display = 'none';
                answerBgDiv.style.display = 'none';
                resultsDiv.style.display = 'none';
                sidebarDiv.style.display = 'none';
                showLoading();
            }
        });
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
        if(!res.data.number) {
            receiveQuery();
        } else {
            var img = new Image();
            img.onload = img.onerror = function(){
                curQuery.answer.img = img;
                receiveQuery();
            };
            img.src = res.data.pic + '?t=' + res.qid;
        }
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
        searchHistoryTiming(inputBox.value);
        resultsAni.add({
            startTime: scade.getTime(),
            toVal: 1,
            duration: 500,
            timing: scade.timing.linear(),
            start: function(){
                if(curQuery.answer.number) {
                    answerDiv.style.display = 'block';
                    answerBgDiv.style.display = 'block';
                }
                resultsDiv.style.display = 'block';
                sidebarDiv.style.display = 'block';
            }
        });
    };

    // templating
    var handlebars = window.Handlebars;
    var answerTmpl = handlebars.compile(window.tmpl.answer);
    var resultsTmpl = handlebars.compile(window.tmpl.results);
    var sidebarTmpl = handlebars.compile(window.tmpl.sidebar);
    var updateResultsDiv = function(res){
        if(res.answer.number) {
            answerDiv.innerHTML = answerTmpl(res.answer);
            document.querySelector('#answer .answer_image').appendChild(res.answer.img);
        } else {
            answerDiv.innerHTML = '';
        }
        resultsDiv.innerHTML = resultsTmpl(res.results);
        sidebarDiv.innerHTML = sidebarTmpl(res.sidebar);
        searchHistoryInit();
    };

    // hash detection
    var curHash = location.hash;
    window.onhashchange = function(e){
        e.preventDefault();
        if(curHash === location.hash) return;
        curHash = location.hash;
        if(curHash.slice(1)) showResultPage();
        else showHomePage();
        searchHistoryTiming();
    };
    inputBox.value = curHash.slice(1);
    inputBox.select();
    inputBox.focus();
    if(inputBox.value) showResultPage(1);

    // search history
    var historyDiv = null;
    var searchHistoryLoad = function(){
        var str = localStorage['stocksearch-history'];
        if(!str) return [];
        return JSON.parse(str);
    };
    var searchHistorySave = function(query){
        query = query.replace(/(^\s+|\s+$)/, '');
        var arr = searchHistoryLoad();
        for(var i=0; i<arr.length; i++){
            if(arr[i] === query) {
                arr.splice(i, 1);
                break;
            }
        }
        arr.unshift(query);
        if(arr.length > 10) arr.pop();
        localStorage['stocksearch-history'] = JSON.stringify(arr);
    };
    var searchHistoryAdd = function(query){
        query = query.replace(/(^\s+|\s+$)/, '');
        var item = document.createElement('div');
        item.setAttribute('class', 'sidebar_history_item');
        item.innerHTML = '<a href="#">' + document.createTextNode(query).nodeValue + '</a>';
        item.onclick = function(e){
            e.preventDefault();
            if(inputEventTobj) clearTimeout(inputEventTobj);
            inputBox.value = query;
            location.hash = '#' + encodeURIComponent(query);
        };
        if(historyDiv.childNodes.length > 1) {
            historyDiv.insertBefore( item, historyDiv.childNodes[1] );
        } else {
            historyDiv.appendChild( item );
        }
    };
    var searchHistoryInit = function(){
        historyDiv = document.querySelector('#sidebar .sidebar_history');
        var arr = searchHistoryLoad();
        for(var i=arr.length-1; i>=0; i--) searchHistoryAdd(arr[i]);
    };
    var searchHistoryTobj = null;
    var searchHistoryTiming = function(query){
        if(searchHistoryTobj) clearTimeout(searchHistoryTobj);
        if(!query) {
            searchHistoryTobj = null;
        } else {
            searchHistoryTobj = setTimeout(function(){
                searchHistoryTobj = null;
                searchHistorySave(query);
            }, 5000);
        }
    };

})();
