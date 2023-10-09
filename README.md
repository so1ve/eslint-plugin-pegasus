# eslint-plugin-pegasus

[![NPM version](https://img.shields.io/npm/v/eslint-plugin-pegasus?color=a1b858&label=)](https://www.npmjs.com/package/eslint-plugin-pegasus)

> TypeScript-friendly rewrite of [eslint-plugin-unicorn](https://github.com/sindresorhus/eslint-plugin-unicorn), uses type-aware linting to reduce false positives.

## 💎 Features

## 📦 Installation

```bash
$ npm install -D eslint-plugin-pegasus
$ yarn add -D eslint-plugin-pegasus
$ pnpm add -D eslint-plugin-pegasus
```

## 📚 Available Rules

<!-- begin auto-generated rules list -->

🔧 Automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/user-guide/command-line-interface#--fix).\
💭 Requires type information.

| Name                                                           | Description                                                              | 🔧  | 💭  |
| :------------------------------------------------------------- | :----------------------------------------------------------------------- | :-- | :-- |
| [prefer-string-slice](docs/rules/prefer-string-slice.md)       | Prefer `String#slice()` over `String#substr()` and `String#substring()`. | 🔧  | 💭  |
| [prefer-top-level-await](docs/rules/prefer-top-level-await.md) | Prefer `.flatMap(…)` over `.map(…).flat()`.                              | 🔧  | 💭  |

<!-- end auto-generated rules list -->

## 📝 License

[MIT](./LICENSE). Made with ❤️ by [Ray](https://github.com/so1ve)
