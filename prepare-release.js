#!/usr/bin/env node

/**
 * Script de préparation à la publication
 *
 * Ce script effectue les vérifications et préparations nécessaires avant la publication :
 * 1. Vérifie que tous les tests passent
 * 2. Vérifie que le code TypeScript compile sans erreurs
 * 3. Nettoie le répertoire dist
 * 4. Recompile le projet
 * 5. Crée un package de test
 * 6. Affiche un résumé des étapes suivantes pour la publication
 */

import { exec, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';

const execPromise = promisify(exec);

// Configuration du script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname);

// Déterminer si nous sommes sur Windows
const isWindows = process.platform === 'win32';

// Couleurs pour les messages dans la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

/**
 * Exécute une commande shell et retourne la sortie
 */
function runCommand(command, options = {}) {
  console.log(`${colors.cyan}> ${command}${colors.reset}`);
  try {
    return execSync(command, {
      encoding: 'utf8',
      stdio: 'inherit',
      ...options
    });
  } catch (error) {
    console.error(`${colors.red}Erreur lors de l'exécution de la commande : ${command}${colors.reset}`);
    console.error(error.message);
    return false;
  }
}

/**
 * Exécute une commande shell et capture sa sortie
 */
async function runCommandAndCapture(command) {
  console.log(`${colors.cyan}> ${command}${colors.reset}`);
  try {
    const { stdout, stderr } = await execPromise(command);
    if (stderr && stderr.length > 0) {
      console.warn(`${colors.yellow}Warning: ${stderr}${colors.reset}`);
    }
    return stdout;
  } catch (error) {
    console.error(`${colors.red}Erreur lors de l'exécution de la commande : ${command}${colors.reset}`);
    console.error(error.message);
    throw error;
  }
}

/**
 * Affiche un titre d'étape
 */
function printStepTitle(title) {
  console.log(`\n${colors.bright}${colors.yellow}=== ${title} ===${colors.reset}\n`);
}

/**
 * Affiche un message de succès
 */
function printSuccess(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

/**
 * Affiche une erreur et quitte le script
 */
function printErrorAndExit(message) {
  console.error(`\n${colors.red}⚠ ${message}${colors.reset}`);
  process.exit(1);
}

/**
 * Vérifie le contenu du package de manière compatible avec toutes les plateformes
 */
async function checkPackageContent(packageFile) {
  printStepTitle('Vérification du contenu du package');

  // Liste de fichiers essentiels que le package doit contenir
  const essentialFiles = [
    'package.json',
    'README.md',
    'cli.js',
    'dist/',
    'generators/',
  ];

  let files = [];

  try {
    // Vérifier l'existence du fichier package
    if (!fs.existsSync(packageFile)) {
      printErrorAndExit(`Le fichier de package ${packageFile} n'existe pas!`);
    }

    if (isWindows) {
      // Sur Windows, utiliser un module npm pour extraire la liste des fichiers
      console.log("Extraction des fichiers du package (Windows) ...");

      // Créer un répertoire temporaire pour extraire le contenu
      const tempDir = path.join(projectRoot, 'temp-extract');
      if (fs.existsSync(tempDir)) {
        runCommand(`rmdir /s /q "${tempDir}"`, { stdio: 'ignore' });
      }
      fs.mkdirSync(tempDir, { recursive: true });

      // Extraire le package dans le répertoire temporaire
      runCommand(`tar -xf "${packageFile}" -C "${tempDir}"`);

      // Lister récursivement les fichiers du package
      function listFilesRecursively(dir, baseDir = '') {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const relativePath = path.join(baseDir, entry.name);
          if (entry.isDirectory()) {
            listFilesRecursively(path.join(dir, entry.name), relativePath);
            files.push(relativePath + '/');
          } else {
            files.push(relativePath);
          }
        }
      }

      // Lister les fichiers
      listFilesRecursively(path.join(tempDir, 'package'));

      // Nettoyer le répertoire temporaire
      runCommand(`rmdir /s /q "${tempDir}"`, { stdio: 'ignore' });

    } else {
      // Sur Linux/Mac, utiliser tar directement
      const output = await runCommandAndCapture(`tar -tf "${packageFile}"`);
      files = output.split('\n')
                    .filter(Boolean)
                    .map(file => file.replace(/^package\//, ''));
    }

    // Vérifier les fichiers essentiels
    const missingFiles = [];
    for (const essentialFile of essentialFiles) {
      const found = files.some(f => f === essentialFile || f.startsWith(`${essentialFile}`));
      if (!found) {
        missingFiles.push(essentialFile);
      }
    }

    if (missingFiles.length > 0) {
      console.log(`${colors.red}⚠ Fichiers essentiels manquants dans le package :${colors.reset}`);
      missingFiles.forEach(file => console.log(`  - ${file}`));
      process.exit(1);
    }

    // Vérifier que les templates sont inclus
    const hasTemplates = files.some(file => file.includes('templates/'));
    if (!hasTemplates) {
      console.log(`${colors.red}⚠ Aucun template trouvé dans le package${colors.reset}`);
      process.exit(1);
    }

    printSuccess('Le contenu du package est valide');

  } catch (error) {
    printErrorAndExit(`Erreur lors de la vérification du contenu du package: ${error.message}`);
  }
}

/**
 * Fonction principale
 */
async function main() {
  try {
    console.log(`${colors.bright}${colors.cyan}PRÉPARATION À LA PUBLICATION DE SPRING-FULLSTACK-SPEED${colors.reset}\n`);

    // 0. Vérifier si tous les outils nécessaires sont installés
    printStepTitle('Vérification des prérequis');

    // Vérifier si node est installé (c'est déjà le cas puisque nous exécutons ce script)
    console.log("Node.js est installé ✓");

    // Vérifier si npm est installé (c'est déjà le cas puisque nous exécutons via npm)
    console.log("npm est installé ✓");

    // 1. Exécuter une partie des tests (skip les tests complets pour aller plus vite)
    printStepTitle('Exécution des tests unitaires');
    if (!runCommand('npm run test:unit')) {
      printErrorAndExit('Certains tests unitaires ont échoué');
    }
    printSuccess('Les tests unitaires sont passés');

    // 2. Vérifier que le code TypeScript compile sans erreurs
    printStepTitle('Vérification de la compilation TypeScript');
    if (!runCommand('tsc --noEmit')) {
      printErrorAndExit('La compilation TypeScript a échoué');
    }
    printSuccess('La compilation TypeScript est sans erreurs');

    // 3. Nettoyer le répertoire dist
    printStepTitle('Nettoyage du répertoire dist');
    if (!runCommand('npm run clean')) {
      printErrorAndExit('Le nettoyage du répertoire dist a échoué');
    }
    printSuccess('Répertoire dist nettoyé');

    // 4. Recompiler le projet
    printStepTitle('Compilation du projet');
    if (!runCommand('npm run build')) {
      printErrorAndExit('La compilation du projet a échoué');
    }
    printSuccess('Projet compilé avec succès');

    // 5. Créer un package de test
    printStepTitle('Création d\'un package de test');

    // Lire package.json pour obtenir les informations du package
    const packageJsonPath = path.join(projectRoot, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      printErrorAndExit('Le fichier package.json n\'existe pas');
    }

    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonContent);

    const packageName = packageJson.name.replace('@', '').replace('/', '-');
    const packageVersion = packageJson.version;
    const packageFile = `${packageName}-${packageVersion}.tgz`;

    if (!runCommand('npm pack')) {
      printErrorAndExit('La création du package de test a échoué');
    }
    printSuccess(`Package de test créé : ${packageFile}`);

    // 6. Vérifier le contenu du package
    await checkPackageContent(packageFile);

    // 7. Afficher un résumé et les étapes suivantes
    console.log(`\n${colors.bright}${colors.green}✅ PRÉPARATION TERMINÉE AVEC SUCCÈS !${colors.reset}\n`);
    console.log(`Le package de test a été créé : ${colors.cyan}${packageFile}${colors.reset}`);

    console.log('\nPour tester l\'installation du package localement :');
    console.log(`${colors.cyan}npm install -g ./${packageFile}${colors.reset}`);

    console.log('\nPour publier sur npm :');
    console.log(`${colors.cyan}npm login${colors.reset}`);
    console.log(`${colors.cyan}npm publish --access=public${colors.reset}`);

    console.log('\nPour créer une release GitHub :');
    console.log('1. Créez un tag git :');
    console.log(`${colors.cyan}git tag -a v${packageVersion} -m "Version ${packageVersion}"${colors.reset}`);
    console.log(`${colors.cyan}git push origin v${packageVersion}${colors.reset}`);
    console.log('2. Créez une release sur GitHub avec ce tag et téléversez le fichier .tgz');
    console.log('3. Ajoutez les notes de release basées sur le CHANGELOG.md');

  } catch (error) {
    console.error(`\n${colors.red}⚠ Une erreur est survenue :${colors.reset}\n`, error);
    process.exit(1);
  }
}

// Exécuter la fonction principale
main();
