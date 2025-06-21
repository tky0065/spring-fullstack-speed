#!/usr/bin/env node

/**
 * Script de tests end-to-end pour Spring-Fullstack-Speed
 * Ce script simule des cas d'utilisation réels de l'outil
 */

const path = require('path');
const spawn = require('cross-spawn');
const fs = require('fs-extra');
const chalk = require('chalk');
const { execSync } = require('child_process');

// Chemin vers le dossier temporaire de test
const TEST_DIR = path.join(process.cwd(), 'test-e2e-output');

console.log(chalk.blue('🧪 Démarrage des tests end-to-end...'));

// Supprimer le dossier de test s'il existe déjà
if (fs.existsSync(TEST_DIR)) {
    console.log(chalk.yellow('🗑️  Nettoyage du dossier de test précédent...'));
    fs.removeSync(TEST_DIR);
}

// Créer le dossier de test
fs.mkdirSync(TEST_DIR);

// Définition des cas d'utilisation à tester
const useCases = [
    {
        name: 'e2e-react-mysql',
        description: 'Application React avec MySQL, entité User et authentification JWT',
        steps: [
            // Génération de l'application
            {
                type: 'command',
                label: 'Génération application',
                command: 'node',
                args: [
                    path.join(process.cwd(), 'cli.js'),
                    'app',
                    '--name=ReactMySQLApp',
                    '--package=com.example.reactmysql',
                    '--db=mysql',
                    '--build=maven',
                    '--frontend=react'
                ]
            },
            // Génération des entités
            {
                type: 'command',
                label: 'Génération entité User',
                command: 'node',
                args: [
                    path.join(process.cwd(), 'cli.js'),
                    'entity',
                    '--name=User',
                    '--fields=username:string,email:string,firstName:string,lastName:string,active:boolean'
                ]
            },
            // Génération des DTOs
            {
                type: 'command',
                label: 'Génération DTOs',
                command: 'node',
                args: [
                    path.join(process.cwd(), 'cli.js'),
                    'dtos',
                    '--entity=User'
                ]
            },
            // Génération des opérations CRUD
            {
                type: 'command',
                label: 'Génération CRUD',
                command: 'node',
                args: [
                    path.join(process.cwd(), 'cli.js'),
                    'crud',
                    '--entity=User'
                ]
            },
            // Vérification des fichiers et structure
            {
                type: 'verify',
                label: 'Vérification des fichiers générés',
                files: [
                    'pom.xml',
                    'src/main/java/com/example/reactmysql/entity/User.java',
                    'src/main/java/com/example/reactmysql/dto/UserDTO.java',
                    'src/main/java/com/example/reactmysql/controller/UserController.java',
                    'src/main/resources/application.properties'
                ]
            },
            // Compilation du projet Java
            {
                type: 'build',
                label: 'Compilation du projet Java',
                command: process.platform === 'win32' ? 'mvnw.cmd' : './mvnw',
                args: ['clean', 'compile'],
                successMessage: 'BUILD SUCCESS'
            },
            // Test d'exécution
            {
                type: 'build',
                label: 'Test de l\'exécution du projet (compilation uniquement)',
                command: process.platform === 'win32' ? 'mvnw.cmd' : './mvnw',
                args: ['package', '-DskipTests'],
                successMessage: 'BUILD SUCCESS'
            }
        ]
    },
    {
        name: 'e2e-angular-postgresql',
        description: 'Application Angular avec PostgreSQL et recherche full-text',
        steps: [
            // Génération de l'application
            {
                type: 'command',
                label: 'Génération application',
                command: 'node',
                args: [
                    path.join(process.cwd(), 'cli.js'),
                    'app',
                    '--name=AngularPostgresApp',
                    '--package=com.example.angularpostgres',
                    '--db=postgresql',
                    '--build=gradle',
                    '--frontend=angular'
                ]
            },
            // Génération des entités
            {
                type: 'command',
                label: 'Génération entité Product',
                command: 'node',
                args: [
                    path.join(process.cwd(), 'cli.js'),
                    'entity',
                    '--name=Product',
                    '--fields=name:string,description:string,price:number,category:string,tags:string'
                ]
            },
            // Génération des opérations CRUD
            {
                type: 'command',
                label: 'Génération CRUD',
                command: 'node',
                args: [
                    path.join(process.cwd(), 'cli.js'),
                    'crud',
                    '--entity=Product'
                ]
            },
            // Ajout fonctionnalité de recherche
            {
                type: 'command',
                label: 'Ajout fonctionnalité de recherche',
                command: 'node',
                args: [
                    path.join(process.cwd(), 'cli.js'),
                    'search',
                    '--entity=Product'
                ]
            },
            // Vérification des fichiers et structure
            {
                type: 'verify',
                label: 'Vérification des fichiers générés',
                files: [
                    'build.gradle',
                    'gradlew',
                    'src/main/java/com/example/angularpostgres/entity/Product.java',
                    'src/main/java/com/example/angularpostgres/controller/ProductController.java',
                    'src/main/java/com/example/angularpostgres/repository/ProductRepository.java',
                    'src/main/java/com/example/angularpostgres/service/ProductService.java',
                    'src/main/java/com/example/angularpostgres/controller/ProductSearchController.java',
                    'src/main/resources/application.properties'
                ]
            },
            // Compilation du projet Java
            {
                type: 'build',
                label: 'Compilation du projet Java',
                command: process.platform === 'win32' ? 'gradlew.bat' : './gradlew',
                args: ['compileJava'],
                successMessage: 'BUILD SUCCESSFUL'
            }
        ]
    }
];

// Fonction pour exécuter une commande shell
function runCommand(command, args, options = {}) {
    console.log(chalk.cyan(`Exécution de: ${command} ${args.join(' ')}`));

    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            stdio: options.captureOutput ? 'pipe' : 'inherit',
            ...options
        });

        let stdout = '';
        let stderr = '';

        if (options.captureOutput) {
            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });
        }

        child.on('close', (code) => {
            if (code !== 0) {
                reject({
                    code,
                    stdout,
                    stderr,
                    message: `La commande a échoué avec le code: ${code}`
                });
            } else {
                resolve({
                    stdout,
                    stderr
                });
            }
        });
    });
}

// Fonction pour vérifier l'existence de fichiers
function verifyFiles(baseDir, files) {
    console.log(chalk.blue(`\n🔍 Vérification des fichiers générés...`));

    const missingFiles = [];

    for (const file of files) {
        const filePath = path.join(baseDir, file);

        if (!fs.existsSync(filePath)) {
            console.error(chalk.red(`❌ Fichier manquant: ${file}`));
            missingFiles.push(file);
        } else {
            console.log(chalk.green(`✅ Fichier trouvé: ${file}`));
        }
    }

    return missingFiles.length === 0;
}

// Fonction pour exécuter une étape de test
async function runStep(step, workDir) {
    console.log(chalk.green(`\n🔧 Exécution de l'étape: ${step.label}`));

    try {
        process.chdir(workDir);

        if (step.type === 'command') {
            await runCommand(step.command, step.args);
            return true;
        }
        else if (step.type === 'verify') {
            return verifyFiles(workDir, step.files);
        }
        else if (step.type === 'build') {
            const result = await runCommand(step.command, step.args, { captureOutput: true });

            // Si un message de succès est attendu, vérifiez qu'il est présent
            if (step.successMessage && !result.stdout.includes(step.successMessage)) {
                console.error(chalk.red(`❌ Message de succès "${step.successMessage}" non trouvé dans la sortie.`));
                return false;
            }

            return true;
        }

        console.error(chalk.red(`❌ Type d'étape inconnu: ${step.type}`));
        return false;

    } catch (error) {
        console.error(chalk.red(`❌ Erreur lors de l'étape ${step.label}:`), error.message || error);

        if (error.stdout) {
            console.error(chalk.yellow('Sortie standard:'));
            console.error(error.stdout.slice(-1000)); // Limiter à 1000 caractères
        }

        if (error.stderr) {
            console.error(chalk.yellow('Sortie d\'erreur:'));
            console.error(error.stderr.slice(-1000)); // Limiter à 1000 caractères
        }

        return false;
    }
}

// Fonction pour exécuter un cas d'utilisation
async function runUseCase(useCase) {
    console.log(chalk.blue(`\n🚀 Test du cas d'utilisation: ${useCase.name}`));
    console.log(chalk.blue(`📝 ${useCase.description}`));

    // Créer un dossier spécifique pour ce cas d'utilisation
    const useCaseDir = path.join(TEST_DIR, useCase.name);
    fs.mkdirSync(useCaseDir, { recursive: true });

    // Exécuter chaque étape
    let allStepsSucceeded = true;

    for (const step of useCase.steps) {
        const success = await runStep(step, useCaseDir);

        if (!success) {
            allStepsSucceeded = false;
            console.error(chalk.red(`❌ Échec à l'étape: ${step.label}`));
            break;
        }
    }

    return allStepsSucceeded;
}

// Fonction principale
async function runTests() {
    console.log(chalk.blue(`\n🧪 Exécution de ${useCases.length} tests end-to-end...`));

    const results = {};

    for (const useCase of useCases) {
        try {
            const success = await runUseCase(useCase);
            results[useCase.name] = success;
        } catch (error) {
            console.error(chalk.red(`❌ Erreur lors du test de ${useCase.name}:`), error);
            results[useCase.name] = false;
        }
    }

    // Afficher les résultats
    console.log(chalk.blue('\n📊 Résultats des tests end-to-end:'));
    let allTestsPassed = true;

    for (const [name, success] of Object.entries(results)) {
        if (success) {
            console.log(chalk.green(`✅ ${name}: SUCCÈS`));
        } else {
            console.log(chalk.red(`❌ ${name}: ÉCHEC`));
            allTestsPassed = false;
        }
    }

    if (allTestsPassed) {
        console.log(chalk.green('\n🎉 Tous les tests end-to-end ont réussi!'));
        process.exit(0);
    } else {
        console.log(chalk.red('\n❌ Certains tests end-to-end ont échoué.'));
        process.exit(1);
    }
}

// Exécuter les tests
runTests().catch((error) => {
    console.error(chalk.red('❌ Erreur fatale dans le script de test:'), error);
    process.exit(1);
});
