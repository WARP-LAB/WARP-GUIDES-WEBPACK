/* global __DEVELOPMENT__ */
'use strict';

import _ from 'lodash';
import './index.global.scss';
import {helperA} from './helpers/helpers.simple.js';

if (__DEVELOPMENT__) {
  console.log('I\'m in development!');
}

const greetings = {
  yesterday: 'Hello World!',
  today: 'Hello new JS!'
};

const myArrowFunction = () => {
  // Test Array.find polyfill
  const arr = [5, 12, 8, 130, 44];
  const found = arr.find(function (element) {
    return element > 10;
  });
  console.log('Found elements', found);
  // Spread test
  const someObject = {x: 11, y: 12};
  const {x} = someObject;
  console.log('x value', x);
  const objectCloneTestViaSpread = {...someObject};
  console.log('objectCloneTestViaSpread', objectCloneTestViaSpread);
  // Vendor test
  console.log(_.join(['Lodash', 'says', 'hi', 'from', 'index.js!'], ' '));
  // Chunk test
  console.log('EXTRA CONSOLE LOGZZZZZ');

  const div = document.querySelector('.app');
  const {today} = greetings;
  div.innerHTML = `<h1>${today}</h1><p>Lorem ipsum.</p>`;
  div.classList.add('some-class');
  console.log('Hello JS!');
  helperA();
};

myArrowFunction();
