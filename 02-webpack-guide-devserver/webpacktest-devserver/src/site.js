'use strict';

require('./site.global.scss');
var helpers = require('./helpers.js');

var div = document.querySelector('.app');
div.innerHTML = '<h1>Hello JS</h1><p>Lorem ipsum.</p>';
console.log('Hello JS!');
helpers.helperA();
