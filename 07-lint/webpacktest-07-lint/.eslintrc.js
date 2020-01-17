// keep json compatible key naming and comma trailing

/* eslint-disable quotes, quote-props */

module.exports = {
  "root": true,
  "extends": [
    "eslint-config-standard"
  ],
  "plugins": [
    // "eslint-plugin-standard",
    // "eslint-plugin-promise",
    // "eslint-plugin-import",
    // "eslint-plugin-node",
    "eslint-plugin-babel"
  ],
  "parser": "babel-eslint",
  // https://eslint.org/docs/user-guide/configuring#specifying-parser-options
  "parserOptions": {
    "ecmaVersion": 6,
    "sourceType": "module",
    "allowImportExportEverywhere": false,
    "codeFrame": true,
    // https://eslint.org/docs/1.0.0/user-guide/configuring#specifying-language-options
    "ecmaFeatures": {
      "globalReturn": true,
      "impliedStrict": true,
      "jsx": true,
      "experimentalObjectRestSpread": true
    }
  },
  "env": {
    "browser": true,
    "node": true
  },
  "rules": {
    // "off" or 0 - turn the rule off
    // "warn" or 1 - turn the rule on as a warning (doesn’t affect exit code)
    // "error" or 2 - turn the rule on as an error (exit code is 1 when triggered)

    // Semicolons
    "semi": [2, "always"], // https://eslint.org/docs/rules/semi
    "no-extra-semi": 2, // https://eslint.org/docs/rules/no-extra-semi
    "semi-spacing": [2, {"before": false, "after": true}], // https://eslint.org/docs/rules/semi-spacing

    // Spacing
    // curly spacing, keep "consistent" with array-bracket-spacing
    "object-curly-spacing": [1, "never"], // https://eslint.org/docs/rules/object-curly-spacing
    "generator-star-spacing": [1, {"before": true, "after": false}], // https://eslint.org/docs/rules/generator-star-spacing

    // Others
    "brace-style": [1, "stroustrup"], // https://eslint.org/docs/rules/brace-style
    "object-shorthand": [1, "always"], // https://eslint.org/docs/rules/object-shorthand
    "arrow-parens": [1, "always"], // https://eslint.org/docs/rules/arrow-parens

    // Babel, https://github.com/babel/eslint-plugin-babel#rules
    "babel/new-cap": 1, // https://github.com/babel/eslint-plugin-babel#rules
    "babel/object-curly-spacing": 1, // https://github.com/babel/eslint-plugin-babel#rules

    // Ensure consistent use of file extension within the import path
    "import/extensions": [0, {"js": "always", "json": "always"}] // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/extensions.md
  }
};
