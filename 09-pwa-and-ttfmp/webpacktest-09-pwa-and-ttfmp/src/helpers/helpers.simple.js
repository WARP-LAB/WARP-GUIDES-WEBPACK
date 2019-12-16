import _ from 'lodash';

export function helperA () {
  console.log('I am simple helper A');
  // Vendor test
  console.log(_.join(['Lodash', 'says', 'hi', 'from', 'helpers.simple.js', 'A', '!'], ' '));
}

export function helperB () {
  console.log('I am simple helper B');
  // Vendor test
  console.log(_.join(['Lodash', 'says', 'hi', 'from', 'helpers.simple.js', 'B', '!'], ' '));
}
