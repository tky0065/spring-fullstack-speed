/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
    }],
  },
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'generators/**/*.ts',
    'utils/**/*.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/*.d.ts',
  ],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts',
  ],
  verbose: true,
  transformIgnorePatterns: [
    'node_modules/(?!(chalk|strip-ansi|ansi-regex|ansi-styles)/)',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/generators/frontend-tests/templates/',
    '<rootDir>/guidline/',
  ],
  // Utilisation du nouveau fichier de setup compatible ESM
  setupFilesAfterEnv: ['<rootDir>/test-setup.js'],
  // Augmenter le timeout pour les tests plus longs
  testTimeout: 120000,
}
