/**
 * Script de diagnostic pour les tests - Version simplifiée
 * Écrit les résultats dans un fichier pour faciliter la consultation
 */
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Fichier de sortie pour les résultats
const outputFile = path.join(__dirname, 'test-diagnostic-results.txt');

// Fonction pour écrire dans le fichier de log et la console
function log(message) {
  fs.appendFileSync(outputFile, message + '\n');
  console.log(message);
}

// Nettoyer le fichier de résultats précédent
if (fs.existsSync(outputFile)) {
  fs.unlinkSync(outputFile);
}

log('=== Diagnostic des tests Spring-Fullstack-Speed ===');
log(`Date: ${new Date().toISOString()}`);
log(`Node version: ${process.version}`);
log('');

// 1. Vérifier la structure du projet
log('=== Vérification de la structure du projet ===');
try {
  const generators = fs.readdirSync(path.join(__dirname, 'generators'));
  log(`Générateurs trouvés: ${generators.join(', ')}`);
} catch (error) {
  log(`Erreur lors de la lecture des générateurs: ${error.message}`);
}
log('');

// 2. Fixer les variables d'environnement pour les tests
log('=== Configuration de l\'environnement de test ===');
process.env.NODE_ENV = 'test';
process.env.JEST_WORKER_ID = '1';
require('events').EventEmitter.defaultMaxListeners = 25;
log('Variables d\'environnement configurées pour les tests');
log('Limite d\'écouteurs d\'événements augmentée à 25');
log('');

// 3. Exécuter les tests simples
log('=== Exécution des tests simples ===');
try {
  const testResult = execSync('node --experimental-vm-modules node_modules/jest/bin/jest.js --testMatch "**/generators/__tests__/cli-ui.test.ts" --no-watchman --detectOpenHandles', { encoding: 'utf8' });
  log('Résultat des tests simples:');
  log(testResult);
} catch (error) {
  log('Erreur lors des tests simples:');
  log(error.message);
  // Continuer malgré l'erreur
}
log('');

// 4. Vérification du mock d'inquirer
log('=== Configuration du mock d\'inquirer ===');
try {
  const inquirerMockCode = `
  // Test simple du mock d'inquirer
  const inquirer = require('inquirer');
  const originalPrompt = inquirer.prompt;
  
  // Remplacer la méthode prompt par un mock
  inquirer.prompt = jest.fn().mockImplementation(() => {
    return Promise.resolve({
      startOption: 'quickstart',
      confirmed: true
    });
  });
  
  // Vérifier que le mock fonctionne
  inquirer.prompt([{ type: 'list', name: 'test', choices: ['a', 'b'] }])
    .then(answers => console.log('Mock d\'inquirer fonctionne:', answers))
    .catch(err => console.error('Erreur avec le mock d\'inquirer:', err));
  `;

  // Écrire ce code dans un fichier temporaire
  const tempFile = path.join(__dirname, 'temp-inquirer-test.js');
  fs.writeFileSync(tempFile, inquirerMockCode);

  // Exécuter le test
  log('Test du mock d\'inquirer:');
  const inquirerTestResult = execSync(`node -e "jest.mock = (module, factory) => factory(); ${inquirerMockCode}"`, { encoding: 'utf8' });
  log(inquirerTestResult);

  // Nettoyer
  if (fs.existsSync(tempFile)) {
    fs.unlinkSync(tempFile);
  }
} catch (error) {
  log('Erreur lors du test du mock d\'inquirer:');
  log(error.message);
}
log('');

log('=== Fin du diagnostic ===');
log(`Les résultats complets sont disponibles dans: ${outputFile}`);
