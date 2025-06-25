#!/usr/bin/env node
/**
 * Script pour générer un changelog basé sur les commits Git
 * Utilisé indépendamment ou dans le cadre du processus de publication
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
  const result = spawnSync(command, args, {
    stdio: 'pipe',
    ...options,
    encoding: 'utf8'
  });

  if (result.error) {
    console.error(`Erreur lors de l'exécution de la commande: ${result.error.message}`);
    process.exit(1);
  }

  return result;
}

// Lire le package.json
function readPackageJson() {
  const packageJsonPath = path.join(rootDir, 'package.json');
  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
}

// Obtenir le tag Git de la dernière version
function getLatestTag() {
  const result = execCommand('git', ['tag', '--sort=-creatordate']);
  if (result.status !== 0) {
    console.warn('Impossible de récupérer les tags Git. Utilisation de HEAD~50 comme point de départ.');
    return 'HEAD~50';
  }

  const tags = result.stdout.trim().split('\n');
  return tags.length > 0 ? tags[0] : 'HEAD~50';
}

// Catégoriser les commits
function categorizeCommits(commits) {
  const categories = {
    'feat': { title: '### Nouvelles fonctionnalités', items: [] },
    'fix': { title: '### Corrections de bugs', items: [] },
    'docs': { title: '### Documentation', items: [] },
    'style': { title: '### Style', items: [] },
    'refactor': { title: '### Refactoring', items: [] },
    'perf': { title: '### Performances', items: [] },
    'test': { title: '### Tests', items: [] },
    'build': { title: '### Build', items: [] },
    'ci': { title: '### CI', items: [] },
    'chore': { title: '### Tâches diverses', items: [] },
    'other': { title: '### Autres', items: [] }
  };

  commits.forEach(commit => {
    const match = commit.match(/^([a-z]+)(\([\w-]+\))?:(.+)$/);
    if (match) {
      const [, type, scope, message] = match;
      const scopeText = scope ? ` ${scope}` : '';
      const formattedMessage = `- ${message.trim()}${scopeText}`;

      if (categories[type]) {
        categories[type].items.push(formattedMessage);
      } else {
        categories.other.items.push(formattedMessage);
      }
    } else {
      categories.other.items.push(`- ${commit}`);
    }
  });

  return Object.values(categories)
    .filter(category => category.items.length > 0)
    .map(category => `${category.title}\n\n${category.items.join('\n')}`).join('\n\n');
}

// Générer le changelog
async function generateChangelog(version, fromTag) {
  console.log(`\nGénération du changelog depuis ${fromTag || 'le dernier tag'}...`);

  const range = fromTag ? `${fromTag}..HEAD` : '';
  const result = execCommand('git', ['log', range, '--pretty=format:%s', '--no-merges']);

  if (result.status !== 0) {
    console.error('Erreur lors de la récupération des commits.');
    process.exit(1);
  }

  const commits = result.stdout.trim().split('\n').filter(Boolean);
  if (commits.length === 0) {
    console.warn('Aucun commit trouvé pour générer le changelog.');
    return '';
  }

  const today = new Date().toISOString().split('T')[0];

  const categorizedCommits = categorizeCommits(commits);
  return `## [${version}] - ${today}\n\n${categorizedCommits}`;
}

// Mettre à jour le CHANGELOG.md
async function updateChangelog(changelogEntry) {
  const changelogPath = path.join(rootDir, 'CHANGELOG.md');

  if (fs.existsSync(changelogPath)) {
    let changelog = fs.readFileSync(changelogPath, 'utf8');

    // Trouver l'endroit où insérer la nouvelle entrée (après le titre)
    const insertPosition = changelog.indexOf('\n## ');

    if (insertPosition !== -1) {
      changelog = changelog.slice(0, insertPosition) + '\n\n' + changelogEntry + changelog.slice(insertPosition);
    } else {
      changelog += '\n\n' + changelogEntry;
    }

    fs.writeFileSync(changelogPath, changelog);
  } else {
    // Créer un nouveau changelog si inexistant
    const changelog = `# Changelog\n\nTous les changements notables apportés à ce projet seront documentés dans ce fichier.\n\n${changelogEntry}`;
    fs.writeFileSync(changelogPath, changelog);
  }

  console.log(`\nChangelog mis à jour dans ${changelogPath}`);
}

// Point d'entrée principal
async function main() {
  try {
    const currentVersion = readPackageJson().version;
    console.log(`\n📝 Générateur de Changelog pour Spring-Fullstack-Speed v${currentVersion}`);

    const rl = createInterface();

    const latestTag = getLatestTag();
    console.log(`\nDernier tag détecté: ${latestTag}`);

    const question = (query) => new Promise(resolve => rl.question(query, resolve));

    const fromTag = await question('\nTag de départ (vide pour utiliser le dernier tag): ');
    const targetVersion = await question(`\nVersion cible (vide pour utiliser ${currentVersion}): `);

    const version = targetVersion || currentVersion;
    const startingPoint = fromTag || latestTag;

    rl.close();

    const changelogEntry = await generateChangelog(version, startingPoint);

    if (!changelogEntry) {
      console.log('\n❌ Impossible de générer le changelog. Processus interrompu.');
      process.exit(1);
    }

    // Afficher un aperçu
    console.log('\nAperçu du changelog généré:');
    console.log('--------------------------------------');
    console.log(changelogEntry);
    console.log('--------------------------------------');

    // Demander confirmation
    const confirm = await question('\nSouhaitez-vous mettre à jour le fichier CHANGELOG.md? (o/n): ');
    if (confirm.toLowerCase() === 'o') {
      await updateChangelog(changelogEntry);
      console.log('\n✅ CHANGELOG.md mis à jour avec succès!');
    } else {
      console.log('\n❌ Mise à jour du CHANGELOG.md annulée.');
    }

  } catch (error) {
    console.error(`\n❌ Erreur: ${error.message}`);
    process.exit(1);
  }
}

// Vérifier si le script est appelé directement ou importé
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
