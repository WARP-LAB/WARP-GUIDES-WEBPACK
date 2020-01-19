// section.js

import {join as _join} from 'lodash';
import {helperA} from 'extras/helpers.simple.js';
import 'section.scss';

// Vendor test
console.log(_join(['Lodash', 'says', 'hi', 'from', 'section.js!'], ' '));

// Module test
helperA();

// Test Array.prototype.find polyfill
const arr = [666, 11];
const found = arr.find(function (el) {
  return el > 10;
});
console.log('Array.prototype.find found elements in section', found);

// Test String.prototype.endsWith polyfill
const question = 'Can you dig it?';
console.log(`Can you dig ${question.endsWith('it?')}`);

// Lazy load something
import(/* webpackChunkName: "helpers.lazy.two" */ 'extras/helpers.lazy.two.js').then((module) => {
  module.helperLazyTwo();
}).catch((error) => {
  console.log('An error occurred while loading helperLazyTwo', error);
});
