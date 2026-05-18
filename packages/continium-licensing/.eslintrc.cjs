module.exports = {
  extends: ["@continium/eslint-config/library.js"],
  parserOptions: {
    project: "tsconfig.json",
    tsconfigRootDir: __dirname,
  },
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["@/modules/ee/*", "@/modules/ee", "*/modules/ee/*"],
            message: "@continium/licensing is original Continium code and must not import from Formbricks EE.",
          },
        ],
      },
    ],
  },
};
