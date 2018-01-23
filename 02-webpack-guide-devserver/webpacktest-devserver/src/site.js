/* global __DEVELOPMENT__ */
'use strict';

require('./site.global.scss');
var helpers = require('./helpers.js');

if (__DEVELOPMENT__) {
  console.log('I\'m in development!');
}

var div = document.querySelector('.app');
if (div !== null) {
  div.innerHTML = '<h1>Hello JS</h1><p>Lorem ipsum.</p>';
}
console.log('Hello JS!');
helpers.helperA();
