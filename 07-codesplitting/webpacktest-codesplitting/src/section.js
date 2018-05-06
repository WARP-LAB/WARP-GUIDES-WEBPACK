import _ from 'lodash';
import {helperA} from './helpers/helpers.simple.js';

console.log(_.join(['Lodash', 'says', 'hi', 'from', 'section.js!'], ' '));
helperA();

// Test Array.prototype.find polyfill
const arr = [666, 11];
const found = arr.find(function (el) {
  return el > 10;
});
console.log('Found elements', found);

// Test String.prototype.endsWith polyfill
const question = 'Can you dig it?';
console.log(`Can you dig ${question.endsWith('it?')}`);

// Lazy load something
import(/* webpackChunkName: "helpers.lazy" */ './helpers/helpers.lazy.js').then((module) => {
  module.helperLazyB();
}).catch((error) => {
  console.log('An error occurred while loading helperLazyB', error);
});
