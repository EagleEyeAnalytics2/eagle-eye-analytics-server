module.exports = {
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    ecmaFeatures: {
      jsx: false,
    },
  },
  env: {
    node: true,
    es6: true,
  },
  rules: {
    indent: "off",
    "comma-dangle": "off",
  },
};
