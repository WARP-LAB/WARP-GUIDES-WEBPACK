// index.js

/* global __DEVELOPMENT__ */

'use strict';

import {join as _join} from 'lodash'; // normally 'lodash-es' should be used
import {helperA} from 'extras/helpers.simple.js';
import 'index.global.scss';
import myImage from 'images/my-js-image.jpg';

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

  // Rest/Spread test
  const someObject = {x: 11, y: 12};
  const {x, ...rest} = someObject;
  console.log('rest value', rest);
  const objectCloneTestViaSpread = {...someObject};
  console.log('objectCloneTestViaSpread', objectCloneTestViaSpread);

  // Test Array.prototype.find polyfill
  const arr = [5, 12, 8, 130, 44];
  const found = arr.find(function (el) {
    return el > 10;
  });
  console.log('Array.prototype.find found elements', found);

  const div = document.querySelector('.app');
  const {today} = greetings;
  div.innerHTML = `<h1>${today}</h1><p>Lorem ipsum.</p>`;
  div.innerHTML += `<p><img src="${myImage}" alt="My Image"></p>`;
  div.innerHTML += '<p><label for="textfield">Enter your text</label></p>';
  div.innerHTML += '<p><input id="textfield" type="text" name="testtext" placeholder="Text Here"/></p>';
  div.classList.add('some-class');
  console.log('Hello new JS!');
  helperA();
};

myArrowFunction();

// Lazy load something
import(/* webpackChunkName: "helpers.lazy.one" */ 'extras/helpers.lazy.one.js').then((module) => {
  module.helperLazyOne();
}).catch((error) => {
  console.log('An error occurred while loading helperLazyOne', error);
});
