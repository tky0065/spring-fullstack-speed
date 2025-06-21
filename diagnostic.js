/**
 * Script de diagnostic pour tester l'exécution des tests
 * Ce script vérifie si les tests sont exécutés correctement
 * et capture les éventuelles erreurs
 */

console.log('=== Démarrage du diagnostic des tests ===');
console.log('Date et heure:', new Date().toLocaleString());
console.log('Version Node.js:', process.version);
console.log('Environnement:', process.env.NODE_ENV);

// Définir l'environnement de test
process.env.NODE_ENV = 'test';
process.env.JEST_WORKER_ID = '1';

// Augmenter la limite d'écouteurs d'événements
require('events').EventEmitter.defaultMaxListeners = 25;

// Capturer les rejets non gérés
process.on('unhandledRejection', (reason, promise) => {
  console.error('DIAGNOSTIC ERROR: Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
});

// Importer Jest et exécuter un test spécifique
const { runCLI } = require('jest');

const jestConfig = {
  _: ['generators/__tests__/app.test.ts'], // Seul le test app.test.ts sera exécuté
  detectOpenHandles: true,
  verbose: true,
  forceExit: true,
  runInBand: true, // Exécuter les tests de manière séquentielle
  testTimeout: 120000,
};

console.log('Configuration de Jest:', JSON.stringify(jestConfig, null, 2));
console.log('\nDémarrage des tests...\n');

// Créer un mock d'inquirer pour les tests
jest.mock('inquirer', () => ({
  prompt: jest.fn().mockImplementation(() => Promise.resolve({
    startOption: 'quickstart',
    confirmed: true,
    additionalFeatures: ['docker', 'swagger'],
    buildTool: 'maven'
  }))
}));

// Exécuter Jest avec notre configuration
runCLI(jestConfig, [process.cwd()])
  .then(({ results }) => {
    console.log('\n=== Résultats des tests ===');
    console.log('Tests exécutés:', results.numTotalTests);
    console.log('Tests réussis:', results.numPassedTests);
    console.log('Tests échoués:', results.numFailedTests);
    console.log('Snapshots échoués:', results.snapshot.failure);

    if (results.numFailedTests > 0) {
      console.log('\nDétails des échecs:');
      results.testResults.forEach(testResult => {
        if (testResult.numFailingTests > 0) {
          console.log(`\nFichier: ${testResult.testFilePath}`);
          testResult.testResults.forEach(test => {
            if (test.status === 'failed') {
              console.log(`- ${test.fullName}: ${test.status}`);
              console.log(`  Erreur: ${test.failureMessages.join('\n')}`);
            }
          });
        }
      });
    }

    process.exit(results.success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n=== Erreur lors de l\'exécution des tests ===');
    console.error(error);
    process.exit(1);
  });
