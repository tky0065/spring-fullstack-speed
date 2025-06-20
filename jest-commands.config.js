/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: false,
    }]
  },
  testMatch: [
    '**/generators/__tests__/commands.test.ts'
  ],
  verbose: true,
  transformIgnorePatterns: [
    'node_modules/(?!(chalk|strip-ansi|ansi-regex|ansi-styles)/)',
  ],
};

