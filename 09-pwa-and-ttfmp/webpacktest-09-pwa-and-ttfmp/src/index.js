// index.js

/* global __DEVELOPMENT__ */

'use strict';

import {join as _join} from 'lodash';
import 'index.global.scss';
import {helperA} from 'extras/helpers.simple.js';
import myImagePath from 'images/my-js-image.jpg';
import * as OfflinePluginRuntime from 'offline-plugin/runtime'; // eslint-disable-line
if (!__DEVELOPMENT__) {
  OfflinePluginRuntime.install();
}

if (__DEVELOPMENT__) {
  console.log('I\'m in development!');
}

const greetings = {
  yesterday: 'Hello World!',
  today: 'Hello new JS!'
};

const myArrowFunction = () => {
  // Vendor test
  console.log(_join(['Lodash', 'says', 'hi', 'from', 'index.js!'], ' '));

  // Spread test
  const someObject = {x: 11, y: 12};
  const {x} = someObject;
  console.log('x value', x);
  const objectCloneTestViaSpread = {...someObject};
  console.log('objectCloneTestViaSpread', objectCloneTestViaSpread);

  // Test Array.find polyfill
  const arr = [5, 12, 8, 130, 44];
  const found = arr.find(function (el) {
    return el > 10;
  });
  console.log('Array.find found elements', found);

  const div = document.querySelector('.app');
  const {today} = greetings;
  div.innerHTML = `<h1>${today}</h1><p>Lorem ipsum.</p><img src="${myImagePath}" alt="My Image">`;
  div.innerHTML += '<label for="textfield">Enter your text</label>';
  div.innerHTML += '<input id="textfield" type="text" name="testtext" placeholder="Text Here">';
  div.classList.add('some-class');
  console.log('Hello JS!');
  helperA();
};

myArrowFunction();
