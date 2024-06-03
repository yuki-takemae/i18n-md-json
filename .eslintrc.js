module.exports = {
  root: true,

  env: {
    browser: true,
    es6: true,
    node: true
  },

  extends: ['plugin:vue/vue3-recommended', 'plugin:vuetify/base', 'eslint:recommended', '@vue/prettier'],

  rules: {
    'prettier/prettier': [
      'error',
      {
        printWidth: 120,
        semi: false,
        singleQuote: true,
        skipStrings: true,
        useTabs: false,
        trailingComma: 'none',
        arrowParens: 'always',
        htmlWhitespaceSensitivity: 'ignore',
        singleAttributePerLine: true
      }
    ],
    'no-import-assign': 'off',
    'no-multiple-empty-lines': [2, { max: 2 }],
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    // 同名変数定義許容
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'vue/html-self-closing': [
      'error',
      {
        html: {
          void: 'always'
        }
      }
    ]
  }
}
