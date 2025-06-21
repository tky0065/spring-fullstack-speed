/**
 * Configuration Jest spécifique pour les tests des générateurs
 * Optimisée pour fonctionner avec ESM et éviter les problèmes de mock
 */

// Config basée sur celle existante, avec des ajustements
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
  testMatch: [
    "**/generators/__tests__/**/*.ts"
  ],
  verbose: true,
  transformIgnorePatterns: [
    'node_modules/(?!(chalk|strip-ansi|ansi-regex|ansi-styles)/)',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/generators/frontend-tests/templates/',
  ],
  // Désactivation du fichier setup qui cause des problèmes
  // setupFiles: ['<rootDir>/jest.setup.js'],
  // Configuration directe de l'environnement
  testTimeout: 120000,
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  },
  injectGlobals: false
};
