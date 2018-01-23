// keep json compatible key naming and comma trailing!

/* eslint-disable quotes */

module.exports = {
  "extends": [
    "stylelint-config-standard"
  ],
  "plugins": [
    "stylelint-scss"
  ],
  "rules": {

    "rule-empty-line-before": "always",

    "block-closing-brace-empty-line-before": null,
    "max-empty-lines": [
      2,
      {
        "ignore": [
          "comments"
        ]
      }
    ],

    // --------------------------------------------
    // RULES FOR SCSS TO WORK (KIND OF)

    "block-opening-brace-space-before": "always",
    "block-closing-brace-newline-after": [
      "always",
      {
        "ignoreAtRules": [
          "if",
          "else"
        ]
      }
    ],

    "at-rule-empty-line-before": [
      "always",
      {
        "ignoreAtRules": [
          "else",
          "import"
        ]
      }
    ],
    "at-rule-name-space-after": "always",

    "at-rule-no-unknown": [
      true,
      {
        "ignoreAtRules": [
          "charset",
          "import",
          "extend",
          "at-root",
          "debug",
          "warn",
          "error",
          "if",
          "else",
          "for",
          "each",
          "while",
          "mixin",
          "include",
          "content",
          "return",
          "function"
        ]
      }
    ],

    "scss/at-else-closing-brace-newline-after": "always-last-in-chain",
    "scss/at-else-closing-brace-space-after": "always-intermediate",
    "scss/at-if-closing-brace-newline-after": "always-last-in-chain",
    "scss/at-if-closing-brace-space-after": "always-intermediate"
  }
};
