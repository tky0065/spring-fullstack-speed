#!/usr/bin/env node
/**
 * Script de publication automatique pour Spring-Fullstack-Speed
 * Ce script automatise le processus de publication d'une nouvelle version:
 * 1. Vérifie que le code est propre (pas de changements non commités)
 * 2. Exécute les tests
 * 3. Met à jour le numéro de version
 * 4. Génère le changelog
 * 5. Construit le package
 * 6. Publie sur npm
 * 7. Crée un tag Git et pousse vers GitHub
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Fonction pour créer une interface readline
function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

// Fonction pour exécuter une commande shell
function execCommand(command, args, options = {}) {
  console.log(`Exécution de: ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    ...options,
    encoding: 'utf8'
  });

  if (result.error) {
    console.error(`Erreur lors de l'exécution de la commande: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`La commande a échoué avec le code: ${result.status}`);
    process.exit(result.status);
  }

  return result;
}

// Vérifier que le repo Git est propre
function checkGitStatus() {
  console.log('\n🔍 Vérification du statut Git...');
  const result = spawnSync('git', ['status', '--porcelain'], { encoding: 'utf8' });

  if (result.stdout.trim() !== '') {
    console.error('❌ Le répertoire de travail n\'est pas propre. Veuillez commiter ou stasher vos changements avant de publier.');
    process.exit(1);
  }

  console.log('✅ Le répertoire de travail est propre.');
}

// Lire le package.json
function readPackageJson() {
  const packageJsonPath = path.join(rootDir, 'package.json');
  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
}

// Mettre à jour la version dans package.json
function updateVersion(version) {
  console.log(`\n📝 Mise à jour de la version à ${version}...`);
  const packageJsonPath = path.join(rootDir, 'package.json');
  const packageJson = readPackageJson();

  const oldVersion = packageJson.version;
  packageJson.version = version;

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`✅ Version mise à jour de ${oldVersion} à ${version}`);
}

// Mettre à jour le CHANGELOG.md
function updateChangelog(version) {
  console.log('\n📝 Mise à jour du CHANGELOG...');
  const changelogPath = path.join(rootDir, 'CHANGELOG.md');

  // Lire les commits depuis la dernière version
  const result = spawnSync('git', ['log', `v${readPackageJson().version}..HEAD`, '--pretty=format:- %s'], { encoding: 'utf8' });
  const commits = result.stdout.trim();

  if (!commits) {
    console.warn('⚠️ Aucun commit trouvé depuis la dernière version.');
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  const changelogEntry = `\n## [${version}] - ${today}\n\n${commits}\n`;

  if (fs.existsSync(changelogPath)) {
    let changelog = fs.readFileSync(changelogPath, 'utf8');

    // Trouver l'emplacement où insérer la nouvelle entrée (après le titre)
    const insertPosition = changelog.indexOf('\n## ');

    if (insertPosition !== -1) {
      changelog = changelog.slice(0, insertPosition) + changelogEntry + changelog.slice(insertPosition);
    } else {
      changelog += changelogEntry;
    }

    fs.writeFileSync(changelogPath, changelog);
  } else {
    // Créer un nouveau changelog si inexistant
    const changelog = `# Changelog\nTous les changements notables apportés à ce projet seront documentés dans ce fichier.\n${changelogEntry}`;
    fs.writeFileSync(changelogPath, changelog);
  }

  console.log('✅ CHANGELOG mis à jour.');
}

// Exécuter les tests
function runTests() {
  console.log('\n🧪 Exécution des tests...');
  execCommand('npm', ['test']);
  console.log('✅ Tests réussis.');
}

// Construire le package
function buildPackage() {
  console.log('\n🔨 Construction du package...');
  execCommand('npm', ['run', 'build']);
  console.log('✅ Package construit.');
}

// Publier sur npm
function publishToNpm(tag) {
  console.log(`\n🚀 Publication sur npm avec le tag '${tag}'...`);
  execCommand('npm', ['publish', `--tag=${tag}`]);
  console.log('✅ Publication sur npm réussie.');
}

// Créer un tag Git et pousser
function createGitTagAndPush(version) {
  console.log('\n🏷️ Création du tag Git...');
  execCommand('git', ['add', 'package.json', 'CHANGELOG.md']);
  execCommand('git', ['commit', '-m', `chore: release version ${version}`]);
  execCommand('git', ['tag', `v${version}`]);

  console.log('\n📤 Poussée des changements et tags...');
  execCommand('git', ['push']);
  execCommand('git', ['push', '--tags']);

  console.log('✅ Tag Git créé et poussé.');
}

// Point d'entrée principal
async function main() {
  try {
    const currentVersion = readPackageJson().version;
    console.log(`\n📦 Publication de Spring-Fullstack-Speed`);
    console.log(`Version actuelle: ${currentVersion}`);

    checkGitStatus();

    const rl = createInterface();

    // Demander le type de version
    console.log('\nType de version:');
    console.log('1) patch (1.0.1 -> 1.0.2)');
    console.log('2) minor (1.0.1 -> 1.1.0)');
    console.log('3) major (1.0.1 -> 2.0.0)');

    const question = (query) => new Promise(resolve => rl.question(query, resolve));

    const versionType = await question('\nChoisissez le type de version (1-3): ');

    // Déterminer la nouvelle version
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    let newVersion;

    switch (versionType) {
      case '1':
        newVersion = `${major}.${minor}.${patch + 1}`;
        break;
      case '2':
        newVersion = `${major}.${minor + 1}.0`;
        break;
      case '3':
        newVersion = `${major + 1}.0.0`;
        break;
      default:
        console.error('❌ Type de version invalide. Arrêt de la publication.');
        process.exit(1);
    }

    // Confirmer la nouvelle version
    const confirmVersion = await question(`\nConfirmez-vous la publication de la version ${newVersion}? (o/n): `);

    if (confirmVersion.toLowerCase() !== 'o') {
      console.log('❌ Publication annulée.');
      process.exit(0);
    }

    // Demander le tag npm (latest, beta, etc.)
    const npmTag = await question('\nTag npm (latest, beta, alpha, etc.): ');

    rl.close();

    // Exécuter le processus de publication
    runTests();
    updateVersion(newVersion);
    updateChangelog(newVersion);
    buildPackage();
    publishToNpm(npmTag);
    createGitTagAndPush(newVersion);

    console.log(`\n🎉 Publication de la version ${newVersion} terminée avec succès!`);

  } catch (error) {
    console.error(`\n❌ Erreur lors de la publication: ${error.message}`);
    process.exit(1);
  }
}

main();
