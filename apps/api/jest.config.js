/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testRegex: ".*\\.spec\\.ts$",
  transform: { "^.+\\.(t|j)s$": "ts-jest" },
  collectCoverageFrom: ["src/**/*.(t|j)s"],
  testEnvironment: "node",
  setupFiles: ["<rootDir>/test/setup.ts"],
  testTimeout: 15000,
  moduleNameMapper: {
    "^@renas/database$": "<rootDir>/../../packages/database/src/index.ts",
    "^@renas/shared$": "<rootDir>/../../packages/shared/src/index.ts",
    "^@renas/validation$": "<rootDir>/../../packages/validation/src/index.ts",
    "^@renas/config$": "<rootDir>/../../packages/config/src/index.ts",
  },
};
