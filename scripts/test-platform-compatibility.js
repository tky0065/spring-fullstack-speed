#!/usr/bin/env node

/**
 * Script pour vérifier la compatibilité multi-plateforme de Spring-Fullstack-Speed
 * Ce script vérifie si le code est compatible avec différentes plateformes
 */

const chalk = require('chalk');
const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const { execSync } = require('child_process');
const { spawn } = require('cross-spawn');

// Récupération des informations sur la plateforme
const platform = os.platform();
const arch = os.arch();
const nodeVersion = process.version;

console.log(chalk.blue('🧪 Vérification de la compatibilité multi-plateforme...'));
console.log(chalk.cyan(`Plateforme: ${platform}`));
console.log(chalk.cyan(`Architecture: ${arch}`));
console.log(chalk.cyan(`Version Node.js: ${nodeVersion}`));

// Liste des problèmes potentiels de compatibilité à vérifier
const compatibilityChecks = [
    {
        name: 'Chemins de fichiers',
        check: checkFilePaths,
        description: 'Vérifier que les chemins de fichiers sont compatibles avec Windows/Linux/macOS'
    },
    {
        name: 'Scripts shell',
        check: checkShellScripts,
        description: 'Vérifier que les scripts shell sont utilisés correctement (avec extensions conditionnelles)'
    },
    {
        name: 'Commandes système',
        check: checkSystemCommands,
        description: 'Vérifier que les commandes système sont abstraites pour fonctionner sur toutes les plateformes'
    },
    {
        name: 'Encodage de fichiers',
        check: checkFileEncoding,
        description: 'Vérifier que l\'encodage des fichiers est compatible avec toutes les plateformes'
    }
];

// Fonction pour exécuter les vérifications
async function runCompatibilityChecks() {
    console.log(chalk.blue('\n📋 Exécution des vérifications de compatibilité...'));

    const results = {};
    let allChecksPassed = true;

    for (const check of compatibilityChecks) {
        console.log(chalk.cyan(`\n🔍 Vérification: ${check.name}`));
        console.log(chalk.gray(`   ${check.description}`));

        try {
            const result = await check.check();
            results[check.name] = {
                success: result.success,
                details: result.details
            };

            if (result.success) {
                console.log(chalk.green(`✅ ${check.name}: SUCCÈS`));
            } else {
                console.log(chalk.red(`❌ ${check.name}: ÉCHEC`));
                console.log(chalk.yellow(`   Problèmes détectés: ${result.details}`));
                allChecksPassed = false;
            }
        } catch (error) {
            console.error(chalk.red(`❌ Erreur lors de la vérification ${check.name}:`), error);
            results[check.name] = {
                success: false,
                details: error.message
            };
            allChecksPassed = false;
        }
    }

    return {
        allChecksPassed,
        results
    };
}

// Vérifie l'utilisation des chemins de fichiers
async function checkFilePaths() {
    console.log(chalk.gray('   Recherche de problèmes dans les chemins de fichiers...'));

    const problems = [];
    const filesToCheck = getAllJsFiles(['generators', 'utils', 'scripts']);

    for (const file of filesToCheck) {
        const content = fs.readFileSync(file, 'utf8');

        // Vérifier les séparateurs de chemin codés en dur
        if (content.includes('\\\\') || /[^\\]\\[^\\]/.test(content)) {
            problems.push(`${file}: Utilisation de séparateurs de chemin Windows (\\)`);
        }

        // Vérifier l'absence de path.join/path.resolve pour les chemins
        if ((content.includes('"/') || content.includes('\'/') || content.includes('./')) &&
            !content.includes('path.join') && !content.includes('path.resolve')) {
            problems.push(`${file}: Chemins relatifs sans path.join/path.resolve`);
        }
    }

    return {
        success: problems.length === 0,
        details: problems.join('\n')
    };
}

// Vérifie l'utilisation des scripts shell
async function checkShellScripts() {
    console.log(chalk.gray('   Recherche de problèmes dans les scripts shell...'));

    const problems = [];
    const filesToCheck = getAllJsFiles(['generators', 'utils', 'scripts']);

    for (const file of filesToCheck) {
        const content = fs.readFileSync(file, 'utf8');

        // Vérifier les extensions de scripts shell codées en dur
        if (content.includes('.sh') && !content.includes('process.platform === \'win32\'') &&
            !content.includes('os.platform()')) {
            problems.push(`${file}: Extension de script shell .sh sans vérification de plateforme`);
        }

        // Vérifier les commandes spécifiques à bash
        if ((content.includes('bash ') || content.includes('sh ')) &&
            !content.includes('process.platform === \'win32\'')) {
            problems.push(`${file}: Appel à bash/sh sans alternative Windows`);
        }
    }

    return {
        success: problems.length === 0,
        details: problems.join('\n')
    };
}

// Vérifie l'utilisation des commandes système
async function checkSystemCommands() {
    console.log(chalk.gray('   Recherche de commandes système non portables...'));

    const problems = [];
    const filesToCheck = getAllJsFiles(['generators', 'utils', 'scripts']);

    const unixOnlyCommands = ['grep', 'ls', 'cat', 'rm', 'cp', 'mv'];
    const windowsOnlyCommands = ['dir', 'copy', 'del', 'rd', 'md'];

    for (const file of filesToCheck) {
        const content = fs.readFileSync(file, 'utf8');

        // Vérifier les commandes Unix
        for (const cmd of unixOnlyCommands) {
            const regex = new RegExp(`[^a-zA-Z0-9]${cmd}[^a-zA-Z0-9]`);
            if (regex.test(content) && !content.includes('process.platform === \'win32\'') &&
                !content.includes('os.platform()')) {
                problems.push(`${file}: Commande Unix '${cmd}' sans alternative Windows`);
            }
        }

        // Vérifier les commandes Windows
        for (const cmd of windowsOnlyCommands) {
            const regex = new RegExp(`[^a-zA-Z0-9]${cmd}[^a-zA-Z0-9]`);
            if (regex.test(content) && !content.includes('process.platform !== \'win32\'') &&
                !content.includes('os.platform()')) {
                problems.push(`${file}: Commande Windows '${cmd}' sans alternative Unix`);
            }
        }
    }

    return {
        success: problems.length === 0,
        details: problems.join('\n')
    };
}

// Vérifie l'encodage des fichiers
async function checkFileEncoding() {
    console.log(chalk.gray('   Vérification de l\'encodage des fichiers...'));

    const problems = [];
    const filesToCheck = getAllTextFiles();

    for (const file of filesToCheck) {
        try {
            const buffer = fs.readFileSync(file);

            // Vérifier la présence de BOM (Byte Order Mark)
            if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
                problems.push(`${file}: Contient un BOM UTF-8 qui peut causer des problèmes sur certaines plateformes`);
            }

            // Vérifier les fins de ligne mixtes
            const content = buffer.toString('utf8');
            if (content.includes('\r\n') && content.includes('\n') && !content.includes('\r\n\n')) {
                problems.push(`${file}: Contient des fins de ligne mixtes (CRLF et LF)`);
            }
        } catch (error) {
            problems.push(`${file}: Erreur lors de la lecture - ${error.message}`);
        }
    }

    return {
        success: problems.length === 0,
        details: problems.join('\n')
    };
}

// Récupère tous les fichiers JS d'un ensemble de dossiers
function getAllJsFiles(folders) {
    const files = [];

    for (const folder of folders) {
        const folderPath = path.join(process.cwd(), folder);
        if (fs.existsSync(folderPath)) {
            walkDir(folderPath, (filePath) => {
                if (filePath.endsWith('.js') || filePath.endsWith('.ts')) {
                    files.push(filePath);
                }
            });
        }
    }

    return files;
}

// Récupère tous les fichiers texte
function getAllTextFiles() {
    const files = [];
    const textExtensions = ['.js', '.ts', '.json', '.md', '.ejs', '.html', '.css', '.java', '.xml', '.properties', '.yml', '.yaml'];

    walkDir(process.cwd(), (filePath) => {
        const ext = path.extname(filePath).toLowerCase();
        if (textExtensions.includes(ext)) {
            files.push(filePath);
        }
    });

    return files;
}

// Parcourt récursivement un dossier
function walkDir(dir, callback) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            // Ignorer les dossiers node_modules et .git
            if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
                walkDir(filePath, callback);
            }
        } else {
            callback(filePath);
        }
    }
}

// Exécuter les vérifications
runCompatibilityChecks()
    .then(({allChecksPassed}) => {
        if (allChecksPassed) {
            console.log(chalk.green('\n✅ Toutes les vérifications de compatibilité multi-plateforme ont réussi!'));
            process.exit(0);
        } else {
            console.log(chalk.red('\n❌ Des problèmes de compatibilité ont été détectés.'));
            console.log(chalk.yellow('Veuillez corriger ces problèmes pour assurer la compatibilité avec toutes les plateformes.'));
            process.exit(1);
        }
    })
    .catch(error => {
        console.error(chalk.red('❌ Erreur lors de l\'exécution des vérifications:'), error);
        process.exit(1);
    });
