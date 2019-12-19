// helpers.simple.js

import {join as _join} from 'lodash'; // normally 'lodash-es' should be used

export function helperA () {
  console.log('I am simple helper A');
  // Vendor test
  console.log(_join(['Lodash', 'says', 'hi', 'from', 'helpers.simple.js', 'A', '!'], ' '));
}

export function helperB () {
  console.log('I am simple helper B');
  // Vendor test
  console.log(_join(['Lodash', 'says', 'hi', 'from', 'helpers.simple.js', 'B', '!'], ' '));
}
