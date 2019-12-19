// helpers.lazy.one.js

import {join as _join} from 'lodash'; // normally 'lodash-es' should be used
import './helpers.lazy.one.scss';

export function helperLazyOne () {
  console.log('I am helper lazy One!');
  console.log(_join(['Lodash', 'says', 'hi', 'from', 'helpers.lazy.one.js', '!'], ' '));
  // console.log(_join(['Lazy', 'one', 'extra', '!'], ' '));
}
