#!/usr/bin/env node

/**
 * Script de test d'intégration pour Spring-Fullstack-Speed
 * Ce script teste différentes combinaisons de générateurs ensemble
 */

const path = require('path');
const spawn = require('cross-spawn');
const fs = require('fs-extra');
const chalk = require('chalk');

// Chemin vers le dossier temporaire de test
const TEST_DIR = path.join(process.cwd(), 'test-integration-output');

console.log(chalk.blue('🧪 Démarrage des tests d\'intégration...'));

// Supprimer le dossier de test s'il existe déjà
if (fs.existsSync(TEST_DIR)) {
    console.log(chalk.yellow('🗑️  Nettoyage du dossier de test précédent...'));
    fs.removeSync(TEST_DIR);
}

// Créer le dossier de test
fs.mkdirSync(TEST_DIR);

// Liste des combinaisons à tester
const combinations = [
    {
        name: 'app-entity-dto',
        steps: [
            {
                generator: 'app',
                options: ['--name=TestApp', '--package=com.test', '--db=h2', '--build=maven', '--frontend=react']
            },
            {
                generator: 'entity',
                options: ['--name=Product', '--fields=name:string,price:number,description:string']
            },
            {
                generator: 'dtos',
                options: ['--entity=Product']
            }
        ]
    },
    {
        name: 'app-crud-module',
        steps: [
            {
                generator: 'app',
                options: ['--name=CrudApp', '--package=com.test.crud', '--db=mysql', '--build=gradle', '--frontend=vue']
            },
            {
                generator: 'entity',
                options: ['--name=Customer', '--fields=firstName:string,lastName:string,email:string,phone:string']
            },
            {
                generator: 'crud',
                options: ['--entity=Customer']
            },
            {
                generator: 'module',
                options: ['--name=CustomerManagement', '--entities=Customer']
            }
        ]
    },
    {
        name: 'app-search-notification',
        steps: [
            {
                generator: 'app',
                options: ['--name=SearchApp', '--package=com.test.search', '--db=postgresql', '--build=maven', '--frontend=angular']
            },
            {
                generator: 'entity',
                options: ['--name=Article', '--fields=title:string,content:string,author:string,publishDate:date']
            },
            {
                generator: 'search',
                options: ['--entity=Article']
            },
            {
                generator: 'notification',
                options: ['--type=email', '--entity=Article']
            }
        ]
    }
];

// Fonction pour exécuter une commande
function runCommand(command, args) {
    console.log(chalk.cyan(`Exécution de: ${command} ${args.join(' ')}`));
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, { stdio: 'inherit' });
        child.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`La commande a échoué avec le code: ${code}`));
            } else {
                resolve();
            }
        });
    });
}

// Fonction pour exécuter une étape de génération
async function runStep(step, workDir) {
    console.log(chalk.green(`\n🔧 Exécution du générateur: ${step.generator}`));

    const generatorPath = path.join(process.cwd(), 'cli.js');
    const args = [step.generator, ...step.options];

    try {
        process.chdir(workDir);
        await runCommand('node', [generatorPath, ...args]);
        return true;
    } catch (error) {
        console.error(chalk.red(`❌ Erreur lors de l'exécution du générateur ${step.generator}:`), error);
        return false;
    }
}

// Fonction pour vérifier les fichiers générés
function checkGeneratedFiles(combinationDir, combination) {
    console.log(chalk.blue(`\n🔍 Vérification des fichiers générés pour ${combination.name}...`));

    let success = true;

    // Liste des fichiers essentiels en fonction des générateurs utilisés
    const expectedFiles = [];

    // App génère toujours ces fichiers
    expectedFiles.push('pom.xml', 'build.gradle', 'src/main/java');

    // En fonction des combinaisons spécifiques, ajouter d'autres fichiers à vérifier
    if (combination.name === 'app-entity-dto') {
        expectedFiles.push(
            'src/main/java/com/test/entity/Product.java',
            'src/main/java/com/test/dto/ProductDTO.java',
            'src/main/java/com/test/repository/ProductRepository.java'
        );
    } else if (combination.name === 'app-crud-module') {
        expectedFiles.push(
            'src/main/java/com/test/crud/entity/Customer.java',
            'src/main/java/com/test/crud/controller/CustomerController.java',
            'src/main/java/com/test/crud/service/CustomerService.java'
        );
    } else if (combination.name === 'app-search-notification') {
        expectedFiles.push(
            'src/main/java/com/test/search/entity/Article.java',
            'src/main/java/com/test/search/service/ArticleSearchService.java',
            'src/main/java/com/test/search/controller/ArticleSearchController.java'
        );
    }

    // Vérifier l'existence des fichiers attendus
    for (const file of expectedFiles) {
        const filePath = path.join(combinationDir, file);
        if (!fs.existsSync(filePath)) {
            console.error(chalk.red(`❌ Fichier manquant: ${file}`));
            success = false;
        } else {
            console.log(chalk.green(`✅ Fichier trouvé: ${file}`));
        }
    }

    return success;
}

// Fonction pour exécuter un test de combinaison
async function testCombination(combination) {
    console.log(chalk.blue(`\n🚀 Test de la combinaison: ${combination.name}`));

    // Créer un dossier spécifique pour cette combinaison
    const combinationDir = path.join(TEST_DIR, combination.name);
    fs.mkdirSync(combinationDir, { recursive: true });

    // Exécuter chaque étape
    let allStepsSucceeded = true;
    for (const step of combination.steps) {
        const success = await runStep(step, combinationDir);
        if (!success) {
            allStepsSucceeded = false;
            break;
        }
    }

    // Vérifier les fichiers générés si toutes les étapes ont réussi
    if (allStepsSucceeded) {
        const filesExist = checkGeneratedFiles(combinationDir, combination);
        return filesExist;
    }

    return false;
}

// Fonction principale
async function runTests() {
    console.log(chalk.blue(`\n🧪 Exécution de ${combinations.length} tests d'intégration...`));

    const results = {};

    for (const combination of combinations) {
        try {
            const success = await testCombination(combination);
            results[combination.name] = success;
        } catch (error) {
            console.error(chalk.red(`❌ Erreur lors du test de ${combination.name}:`), error);
            results[combination.name] = false;
        }
    }

    // Afficher les résultats
    console.log(chalk.blue('\n📊 Résultats des tests d\'intégration:'));
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
        console.log(chalk.green('\n🎉 Tous les tests d\'intégration ont réussi!'));
        process.exit(0);
    } else {
        console.log(chalk.red('\n❌ Certains tests d\'intégration ont échoué.'));
        process.exit(1);
    }
}

// Exécuter les tests
runTests().catch((error) => {
    console.error(chalk.red('❌ Erreur fatale dans le script de test:'), error);
    process.exit(1);
});
