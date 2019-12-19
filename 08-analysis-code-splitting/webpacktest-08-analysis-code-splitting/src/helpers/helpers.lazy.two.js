// helpers.lazy.two.js

import {join as _join} from 'lodash'; // normally 'lodash-es' should be used
import './helpers.lazy.two.scss';

export function helperLazyTwo () {
  console.log('I am helper lazy Two!');
  console.log(_join(['Lodash', 'says', 'hi', 'from', 'helpers.lazy.two.js', '!'], ' '));
  // console.log(_join(['Lazy', 'two', 'extra', '!'], ' '));
}
