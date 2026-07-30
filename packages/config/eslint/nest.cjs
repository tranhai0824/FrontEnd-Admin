module.exports = {
  extends: ["./base.cjs"],
  parserOptions: {
    sourceType: "module",
  },
  env: {
    node: true,
    jest: true,
  },
  rules: {
    "@typescript-eslint/consistent-type-imports": "off",
  },
};
