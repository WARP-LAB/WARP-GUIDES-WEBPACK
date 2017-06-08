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

  if (false) {
    console.log('Hello world');
  }

  const div = document.querySelector('.app');
  const {today} = greetings;
  div.innerHTML = `<h1>${today}</h1><p>Lorem ipsum.</p>`;
  div.classList.add('some-class');
  console.log('Hello JS!');
  helperA();
};

myArrowFunction();
