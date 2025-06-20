/**
 * Script pour tester tous les générateurs de Spring-Fullstack-Speed
 * Ce script vérifie chaque générateur en exécutant une commande de génération simple
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const testDir = path.join(os.tmpdir(), 'sfs-generator-test');
const cliPath = path.join(__dirname, '..', 'cli.js');

// Structure colorée pour la console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Exécute une commande shell avec Node
 */
function execute(command, cwd = process.cwd()) {
  console.log(`${colors.blue}Exécution: ${command}${colors.reset}`);
  try {
    const output = execSync(command, { encoding: 'utf8', cwd, stdio: 'pipe' });
    return { success: true, output };
  } catch (error) {
    return { success: false, error: error.message, stderr: error.stderr, stdout: error.stdout };
  }
}

/**
 * Prépare le dossier de test
 */
function prepareTestDirectory() {
  console.log(`${colors.cyan}Préparation du répertoire de test: ${testDir}${colors.reset}`);

  // Supprimer le répertoire s'il existe
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }

  // Créer le répertoire
  fs.mkdirSync(testDir, { recursive: true });
}

/**
 * Définition des tests pour chaque générateur
 */
const generatorTests = [
  {
    name: 'Générateur app (application principale)',
    command: `node "${cliPath}" app test-app --skip-install`,
    dir: testDir,
    validate: () => fs.existsSync(path.join(testDir, 'test-app')) &&
                   fs.existsSync(path.join(testDir, 'test-app', 'pom.xml'))
  },
  {
    name: 'Générateur entity (entité JPA)',
    command: `node "${cliPath}" entity Product --package com.example.product`,
    dir: path.join(testDir, 'test-app'),
    validate: () => fs.existsSync(path.join(testDir, 'test-app', 'src/main/java/com/example/product/Product.java'))
  },
  {
    name: 'Générateur dtos (objets de transfert de données)',
    command: `node "${cliPath}" dtos Product --package com.example.product`,
    dir: path.join(testDir, 'test-app'),
    validate: () => fs.existsSync(path.join(testDir, 'test-app', 'src/main/java/com/example/product/dto/ProductDTO.java'))
  },
  {
    name: 'Générateur crud (opérations CRUD)',
    command: `node "${cliPath}" crud Product --package com.example.product`,
    dir: path.join(testDir, 'test-app'),
    validate: () => fs.existsSync(path.join(testDir, 'test-app', 'src/main/java/com/example/product/controller/ProductController.java'))
  },
  {
    name: 'Générateur module (module d\'application)',
    command: `node "${cliPath}" module payment --package com.example.payment`,
    dir: path.join(testDir, 'test-app'),
    validate: () => fs.existsSync(path.join(testDir, 'test-app', 'src/main/java/com/example/payment/PaymentService.java'))
  }
];

/**
 * Exécuter tous les tests de générateurs
 */
async function runAllTests() {
  console.log(`${colors.magenta}=== Test de tous les générateurs Spring-Fullstack-Speed ===${colors.reset}`);

  prepareTestDirectory();

  let successCount = 0;
  const results = [];

  for (const test of generatorTests) {
    console.log(`\n${colors.cyan}=== Test du ${test.name} ===${colors.reset}`);

    const result = execute(test.command, test.dir);

    if (result.success) {
      // Vérifier si les fichiers attendus ont été générés
      if (test.validate()) {
        console.log(`${colors.green}✓ ${test.name} a généré les fichiers attendus${colors.reset}`);
        successCount++;
        results.push({ name: test.name, success: true });
      } else {
        console.log(`${colors.red}✗ ${test.name} n'a pas généré les fichiers attendus${colors.reset}`);
        results.push({ name: test.name, success: false, error: 'Fichiers attendus non générés' });
      }
    } else {
      console.log(`${colors.red}✗ ${test.name} a échoué lors de l'exécution${colors.reset}`);
      console.log(`${colors.red}Erreur: ${result.error}${colors.reset}`);
      if (result.stdout) console.log(`Sortie: ${result.stdout}`);
      if (result.stderr) console.log(`Erreur: ${result.stderr}`);
      results.push({ name: test.name, success: false, error: result.error });
    }
  }

  // Afficher un résumé des résultats
  console.log(`\n${colors.magenta}=== Résumé des tests ===${colors.reset}`);

  results.forEach(result => {
    const statusSymbol = result.success ? '✓' : '✗';
    const statusColor = result.success ? colors.green : colors.red;
    console.log(`${statusColor}${statusSymbol} ${result.name}${colors.reset}`);
  });

  console.log(`\n${colors.cyan}Tests réussis: ${successCount}/${generatorTests.length}${colors.reset}`);

  if (successCount === generatorTests.length) {
    console.log(`${colors.green}Tous les générateurs fonctionnent correctement !${colors.reset}`);
  } else {
    console.log(`${colors.red}Certains générateurs ont échoué. Voir les détails ci-dessus.${colors.reset}`);
    process.exit(1);
  }
}

// Exécuter les tests
runAllTests().catch(err => {
  console.error(`${colors.red}Erreur lors de l'exécution des tests:${colors.reset}`, err);
  process.exit(1);
});
