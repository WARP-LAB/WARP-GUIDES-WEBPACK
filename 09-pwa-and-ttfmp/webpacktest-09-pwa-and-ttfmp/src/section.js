// section.js

import {join as _join} from 'lodash';
import {helperA} from './helpers/helpers.simple.js';
import 'section.global.scss';

// Vendor test
console.log(_join(['Lodash', 'says', 'hi', 'from', 'section.js!'], ' '));

// Module test
helperA();

// Test Array.find polyfill
const arr = [666, 11];
const found = arr.find(function (el) {
  return el > 10;
});
console.log('Array.find found elements', found);

// Test String.prototype.endsWith polyfill
const question = 'Can you dig it?';
console.log(`Can you dig ${question.endsWith('it?')}`);

// Lazy load something
import(/* webpackChunkName: "helpers.lazy", webpackPrefetch: true */ './helpers/helpers.lazy.js').then((module) => {
  module.helperLazyB();
}).catch((error) => {
  console.log('An error occurred while loading helperLazyB', error);
});
