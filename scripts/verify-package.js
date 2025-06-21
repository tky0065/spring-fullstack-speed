#!/usr/bin/env node

/**
 * Script pour vérifier le contenu du package npm généré
 * Ce script effectue un npm pack et analyse le contenu de l'archive tar créée
 */

import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { execSync } from 'child_process';
import tar from 'tar';
import { fileURLToPath } from 'url';

// Obtenir le chemin du répertoire courant en mode ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(chalk.blue('📦 Vérification du contenu du package npm...'));

// Fonction pour exécuter une commande shell
function runCommand(command) {
    console.log(chalk.cyan(`> ${command}`));
    try {
        return execSync(command, { encoding: 'utf8' });
    } catch (error) {
        console.error(chalk.red(`❌ Erreur lors de l'exécution de la commande: ${command}`));
        console.error(chalk.red(error.message));
        process.exit(1);
    }
}

// Dossier temporaire pour extraire le package
const TEMP_DIR = path.join(process.cwd(), 'temp-package-check');

// Nettoyer le dossier temporaire s'il existe déjà
if (fs.existsSync(TEMP_DIR)) {
    fs.removeSync(TEMP_DIR);
}
fs.mkdirSync(TEMP_DIR);

// Créer un package npm
console.log(chalk.blue('\n📦 Création du package npm...'));
const packOutput = runCommand('npm pack --json');
let packageFilename;

try {
    const packResult = JSON.parse(packOutput);
    packageFilename = packResult[0].filename;
    console.log(chalk.green(`✅ Package créé: ${packageFilename}`));
} catch (error) {
    console.error(chalk.red('❌ Impossible de déterminer le nom du fichier package'));
    process.exit(1);
}

// Extraire le package pour analyse
console.log(chalk.blue('\n📂 Extraction du package pour analyse...'));
try {
    execSync(`tar -xf ${packageFilename} -C ${TEMP_DIR}`, { stdio: 'inherit' });
    console.log(chalk.green('✅ Package extrait'));
} catch (error) {
    console.error(chalk.red('❌ Erreur lors de l\'extraction du package'));
    console.error(error);
    process.exit(1);
}

// Analyser le contenu du package
console.log(chalk.blue('\n🔍 Analyse du contenu du package...'));

const packageDir = path.join(TEMP_DIR, 'package');
const requiredFiles = [
    'package.json',
    'README.md',
    'CHANGELOG.md',
    'dist',
    'cli.js'
];

const missingFiles = [];
for (const file of requiredFiles) {
    const filePath = path.join(packageDir, file);
    if (!fs.existsSync(filePath)) {
        missingFiles.push(file);
    }
}

if (missingFiles.length > 0) {
    console.error(chalk.red(`❌ Fichiers requis manquants dans le package: ${missingFiles.join(', ')}`));
} else {
    console.log(chalk.green('✅ Tous les fichiers requis sont présents'));
}

// Vérifier les templates
console.log(chalk.blue('\n🔍 Vérification des templates...'));
const templatesDir = path.join(packageDir, 'generators');

if (fs.existsSync(templatesDir)) {
    const hasTemplates = findTemplateFiles(templatesDir);

    if (hasTemplates) {
        console.log(chalk.green('✅ Templates trouvés'));
    } else {
        console.error(chalk.red('❌ Aucun fichier template (.ejs) trouvé'));
    }
} else {
    console.error(chalk.red('❌ Dossier des générateurs manquant dans le package'));
}

// Fonction récursive pour chercher des fichiers .ejs
function findTemplateFiles(dir) {
    let hasTemplates = false;

    const items = fs.readdirSync(dir);

    for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
            if (findTemplateFiles(itemPath)) {
                hasTemplates = true;
            }
        } else if (item.endsWith('.ejs')) {
            hasTemplates = true;
        }
    }

    return hasTemplates;
}

// Vérifier la taille du package
console.log(chalk.blue('\n📏 Vérification de la taille du package...'));
const stats = fs.statSync(packageFilename);
const sizeInMB = stats.size / (1024 * 1024);

console.log(chalk.cyan(`Taille du package: ${sizeInMB.toFixed(2)} MB`));

if (sizeInMB > 10) {
    console.warn(chalk.yellow('⚠️  Attention: Le package est relativement large (>10MB)'));
    console.warn(chalk.yellow('   Vérifiez s\'il contient des fichiers inutiles ou volumieux'));
} else {
    console.log(chalk.green('✅ Taille du package raisonnable'));
}

// Nettoyer les fichiers temporaires
console.log(chalk.blue('\n🧹 Nettoyage...'));
fs.removeSync(TEMP_DIR);
fs.removeSync(packageFilename);
console.log(chalk.green('✅ Fichiers temporaires supprimés'));

console.log(chalk.green('\n✅ Vérification du package terminée!'));

if (missingFiles.length > 0) {
    console.error(chalk.red('\n❌ Le package n\'est pas prêt pour la publication. Voir les erreurs ci-dessus.'));
    process.exit(1);
} else {
    console.log(chalk.green('\n🎉 Le package est prêt à être publié!'));
}
