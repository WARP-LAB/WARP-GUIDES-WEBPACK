'use strict';

import './site.global.scss';
import {helperA} from './helpers.js';

if(__DEVELOPMENT__) {
  console.log('I\'m in development!');
}

const greetings = {
  yesterday: 'Hello World!',
  today: 'Hello new JS!'
};

const myArrowFunction = () => {
  const div = document.querySelector('.app');
  const {today} = greetings;
  div.innerHTML = `<h1>${today}</h1><p>Lorem ipsum.</p>`;
  div.classList.add('some-class');
  console.log('Hello JS!');
  helperA();

  // Test Array.find polyfill
  const arr = [5, 12, 8, 130, 44];
  let found = arr.find(function(element) {
    return element > 10;
  });
  console.log('Found elements', found);
};

myArrowFunction();
