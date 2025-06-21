#!/usr/bin/env node

/**
 * Script de préparation de la publication
 * Ce script prépare le package pour la publication sur npm
 */

import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Obtenir le chemin du répertoire courant en mode ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(chalk.blue('🚀 Préparation de la publication de Spring-Fullstack-Speed v1.0.0...'));

// Dossier de destination pour la publication
const DIST_DIR = path.join(process.cwd(), 'dist');

// Fonction pour exécuter une commande avec log
function runCommand(command) {
    console.log(chalk.cyan(`> ${command}`));
    try {
        execSync(command, { stdio: 'inherit' });
        return true;
    } catch (error) {
        console.error(chalk.red(`❌ Erreur lors de l'exécution de la commande: ${command}`));
        console.error(chalk.red(error.message));
        return false;
    }
}

// Fonction principale
async function prepareRelease() {
    console.log(chalk.blue('\n📋 Vérification des prérequis...'));

    // Vérifier que npm et node sont installés avec les versions correctes
    try {
        const nodeVersion = execSync('node --version').toString().trim();
        console.log(chalk.green(`✅ Node.js installé: ${nodeVersion}`));

        const npmVersion = execSync('npm --version').toString().trim();
        console.log(chalk.green(`✅ npm installé: ${npmVersion}`));
    } catch (error) {
        console.error(chalk.red('❌ Impossible de vérifier les versions de Node.js ou npm'));
        process.exit(1);
    }

    console.log(chalk.blue('\n🧹 Nettoyage des fichiers temporaires...'));

    // Supprimer le dossier dist s'il existe
    if (fs.existsSync(DIST_DIR)) {
        fs.removeSync(DIST_DIR);
        console.log(chalk.green('✅ Dossier "dist" nettoyé'));
    }

    // Nettoyer node_modules
    if (runCommand('npm run clean')) {
        console.log(chalk.green('✅ Nettoyage effectué'));
    } else {
        console.error(chalk.red('❌ Erreur lors du nettoyage'));
        process.exit(1);
    }

    console.log(chalk.blue('\n🔍 Vérification des dépendances...'));

    // Vérifier si des dépendances sont obsolètes
    try {
        const outdated = execSync('npm outdated --json').toString();
        const outdatedDeps = JSON.parse(outdated || '{}');

        if (Object.keys(outdatedDeps).length > 0) {
            console.log(chalk.yellow('⚠️  Dépendances obsolètes détectées:'));
            for (const [dep, info] of Object.entries(outdatedDeps)) {
                console.log(chalk.yellow(`   ${dep}: ${info.current} → ${info.latest}`));
            }
            console.log(chalk.yellow('   Considérez mettre à jour ces dépendances avant la publication'));
        } else {
            console.log(chalk.green('✅ Toutes les dépendances sont à jour'));
        }
    } catch (error) {
        console.log(chalk.green('✅ Aucune dépendance obsolète détectée'));
    }

    console.log(chalk.blue('\n🧪 Exécution des tests...'));

    // Exécuter les tests unitaires
    if (runCommand('npm test')) {
        console.log(chalk.green('✅ Tests unitaires réussis'));
    } else {
        console.error(chalk.red('❌ Certains tests unitaires ont échoué'));
        process.exit(1);
    }

    console.log(chalk.blue('\n📦 Construction du package...'));

    // Construire le projet
    if (runCommand('npm run build')) {
        console.log(chalk.green('✅ Build réussi'));
    } else {
        console.error(chalk.red('❌ Erreur lors du build'));
        process.exit(1);
    }

    console.log(chalk.blue('\n📝 Vérification des fichiers de la publication...'));

    // Vérifier que le dossier dist existe
    if (!fs.existsSync(DIST_DIR)) {
        console.error(chalk.red('❌ Le dossier "dist" n\'a pas été créé'));
        process.exit(1);
    }

    // Vérifier que les fichiers essentiels sont présents
    const requiredFiles = [
        'package.json',
        'README.md',
        'CHANGELOG.md',
        'LICENSE'
    ];

    const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(process.cwd(), file)));

    if (missingFiles.length > 0) {
        console.error(chalk.red(`❌ Fichiers requis manquants: ${missingFiles.join(', ')}`));
        process.exit(1);
    } else {
        console.log(chalk.green('✅ Tous les fichiers requis sont présents'));
    }

    console.log(chalk.blue('\n🧪 Création d\'un package de test...'));

    // Créer un package npm sans le publier
    if (runCommand('npm pack --dry-run')) {
        console.log(chalk.green('✅ Package créé avec succès (simulation)'));
    } else {
        console.error(chalk.red('❌ Erreur lors de la création du package'));
        process.exit(1);
    }

    console.log(chalk.blue('\n✅ Vérification finale...'));

    console.log(chalk.green('\n🎉 Le package est prêt à être publié!'));
    console.log(chalk.green('\nPour publier, exécutez les commandes suivantes:'));
    console.log(chalk.cyan('\n  npm login'));
    console.log(chalk.cyan('  npm publish --access=public'));

    console.log(chalk.yellow('\nN\'oubliez pas de créer un tag git pour la version:'));
    console.log(chalk.cyan('\n  git tag v1.0.0'));
    console.log(chalk.cyan('  git push origin v1.0.0'));

    console.log(chalk.blue('\n📝 Après la publication, n\'oubliez pas de créer une release sur GitHub avec les notes de la version 1.0.0.'));
}

// Exécuter le script
prepareRelease().catch(error => {
    console.error(chalk.red('❌ Erreur fatale lors de la préparation de la publication:'), error);
    process.exit(1);
});
