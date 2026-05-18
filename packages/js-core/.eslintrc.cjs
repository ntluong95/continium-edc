module.exports = {
  ignorePatterns: ["coverage/"],
  extends: ["@continium/eslint-config/library.js"],
  parserOptions: {
    project: "tsconfig.json",
    tsconfigRootDir: __dirname,
  },
};
