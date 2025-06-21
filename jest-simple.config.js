/**
 * Configuration Jest simplifiée pour tester un seul fichier
 */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
    }],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(chalk|strip-ansi|ansi-regex|ansi-styles)/)',
  ],
  verbose: true,
  testTimeout: 60000,
  // Désactiver complètement les mocks automatiques
  automock: false,
  // Passer directement la configuration d'environnement au lieu d'utiliser un fichier externe
  globals: {
    'process.env.NODE_ENV': 'test',
    'process.env.JEST_WORKER_ID': '1'
  }
};

