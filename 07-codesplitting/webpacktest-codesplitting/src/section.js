import _ from 'lodash';
import {helperA} from './helpers/helpers.simple.js';

console.log('EXTRA CONSOLE SECTION');
console.log(_.join(['Lodash', 'says', 'hi', 'from', 'section.js!'], ' '));
helperA();

import(/* webpackChunkName: "helpers.lazy" */ './helpers/helpers.lazy.js').then((module) => {
  module.helperLazyB();
}).catch((error) => {
  console.log('An error occurred while loading helperLazyB', error);
});
