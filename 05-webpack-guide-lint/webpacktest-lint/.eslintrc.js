// keep json compatible key naming and comma trailing!

/* eslint-disable quotes */

module.exports = {
  "plugins": [
    // "standard",
    // "promise",
    // "import",
    "babel"
  ],
  "parser": "babel-eslint",
  "parserOptions": {
    "sourceType": "module",
    "allowImportExportEverywhere": false,
    "codeFrame": true,
    "ecmaVersion": 6,
    "ecmaFeatures": {
      "impliedStrict": true,
      "globalReturn": true,
      "experimentalObjectRestSpread": true
    }
  },
  "env": {
    "browser": true,
    "node": true
  },
  "extends": [
    "eslint-config-standard"
  ],
  "rules": {
    // "off" or 0 - turn the rule off
    // "warn" or 1 - turn the rule on as a warning (doesn’t affect exit code)
    // "error" or 2 - turn the rule on as an error (exit code is 1 when triggered)

    "semi": [2, "always"], // https://eslint.org/docs/rules/semi
    "no-extra-semi": 2, // https://eslint.org/docs/rules/no-extra-semi
    "semi-spacing": [2, {"before": false, "after": true}], // https://eslint.org/docs/rules/semi-spacing
    "generator-star-spacing": 1, // https://eslint.org/docs/rules/generator-star-spacing
    "object-shorthand": 1, // https://eslint.org/docs/rules/object-shorthand
    "arrow-parens": 1, // https://eslint.org/docs/rules/arrow-parens

    "babel/new-cap": 1, // https://github.com/babel/eslint-plugin-babel#rules
    "babel/object-curly-spacing": 1, // https://github.com/babel/eslint-plugin-babel#rules

    "import/extensions": [0, {"js": "always", "json": "always"}] // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/extensions.md
  }
};
