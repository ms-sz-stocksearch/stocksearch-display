(function(){
    'use strict';

    var inputBox = document.querySelector('.searchbox_input input');
    inputBox.focus();

    document.querySelector('#answer').innerHTML = tmpl.answer;
    document.querySelector('#results').innerHTML = tmpl.results;
})();
