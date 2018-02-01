'use strict';

// PREFILIGHT HAS TO STAY ES3 COMPATIBLE
// Inline in head.
// This will pause HTML parsing and execute immediately.
// It changes preceding DOM.
// When we hit body CSS state machine will be already setup.

// ############################################################
// Change noscript to script.
document.documentElement.className = document.documentElement.className.replace(/\bnoscript\b/, 'script');

// ############################################################
// Change incapable to capable.
// Normally we try to deploy stuff that works on ES5-ish browsers.
// That means even down to IE9 although that denies usage of many nice tools.
// If somebody asked to deliver IE8 capable solution, then we would have to use different tools.
// As example this CTM will inform us via CSS state machine that we are IE10+.
if ('visibilityState' in document) {
  document.documentElement.className = document.documentElement.className.replace(/\bincapable\b/, 'capable');
}

// ############################################################
// Just say hello.
console.log('I am Preflight');
