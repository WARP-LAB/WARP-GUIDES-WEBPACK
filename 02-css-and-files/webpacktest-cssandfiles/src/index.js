/* global __DEVELOPMENT__ */
'use strict';

require('./index.global.scss');
var helpers = require('./helpers/helpers.simple.js');

if (__DEVELOPMENT__) {
  console.log('I\'m in development!');
}

var div = document.querySelector('.app');
div.innerHTML = '<h1>Hello JS</h1><p>Lorem ipsum.</p><input type="text" name="testtext" placeholder="Text Here">';
console.log('Hello JS!');
helpers.helperA();