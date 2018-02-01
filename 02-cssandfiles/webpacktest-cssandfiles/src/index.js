/* global __DEVELOPMENT__ */
'use strict';

var helpers = require('./helpers/helpers.simple.js');
require('./index.global.scss');

if (__DEVELOPMENT__) {
  console.log('I\'m in development!');
}

var div = document.querySelector('.app');
div.innerHTML = '<h1>Hello JS</h1><p>Lorem ipsum.</p>';
console.log('Hello JS!');
helpers.helperA();
