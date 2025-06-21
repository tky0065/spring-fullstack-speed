#!/usr/bin/env node

/**
 * Script de tests des cas limites pour Spring-Fullstack-Speed
 * Ce script teste les cas d'erreur et les cas limites
 */

const path = require('path');
const spawn = require('cross-spawn');
const fs = require('fs-extra');
const chalk = require('chalk');

// Chemin vers le dossier temporaire de test
const TEST_DIR = path.join(process.cwd(), 'test-edge-cases-output');

console.log(chalk.blue('🧪 Démarrage des tests de cas limites et d\'erreurs...'));

// Supprimer le dossier de test s'il existe déjà
if (fs.existsSync(TEST_DIR)) {
    console.log(chalk.yellow('🗑️  Nettoyage du dossier de test précédent...'));
    fs.removeSync(TEST_DIR);
}

// Créer le dossier de test
fs.mkdirSync(TEST_DIR);

// Définition des cas limites à tester
const edgeCases = [
    {
        name: 'invalid-entity-name',
        description: 'Test avec un nom d\'entité invalide (caractères spéciaux)',
        command: 'node',
        args: [
            path.join(process.cwd(), 'cli.js'),
            'entity',
            '--name=User@Invalid',
            '--fields=name:string'
        ],
        expectedErrorCode: 1,
        expectedErrorMessage: 'nom d\'entité invalide'
    },
    {
        name: 'invalid-field-type',
        description: 'Test avec un type de champ invalide',
        command: 'node',
        args: [
            path.join(process.cwd(), 'cli.js'),
            'entity',
            '--name=Product',
            '--fields=price:currency'
        ],
        expectedErrorCode: 1,
        expectedErrorMessage: 'type de champ invalide'
    },
    {
        name: 'missing-required-param',
        description: 'Test avec un paramètre requis manquant',
        command: 'node',
        args: [
            path.join(process.cwd(), 'cli.js'),
            'entity',
            '--fields=name:string'
        ],
        expectedErrorCode: 1,
        expectedErrorMessage: 'paramètre requis'
    },
    {
        name: 'non-existing-entity',
        description: 'Test de génération de DTOs pour une entité inexistante',
        steps: [
            {
                command: 'node',
                args: [
                    path.join(process.cwd(), 'cli.js'),
                    'app',
                    '--name=TestApp',
                    '--package=com.test',
                    '--db=h2',
                    '--build=maven'
                ],
                expectSuccess: true
            },
            {
                command: 'node',
                args: [
                    path.join(process.cwd(), 'cli.js'),
                    'dtos',
                    '--entity=NonExistingEntity'
                ],
                expectedErrorCode: 1,
                expectedErrorMessage: 'entité inexistante'
            }
        ]
    },
    {
        name: 'empty-fields',
        description: 'Test de création d\'entité sans champs',
        command: 'node',
        args: [
            path.join(process.cwd(), 'cli.js'),
            'entity',
            '--name=EmptyEntity',
            '--fields='
        ],
        expectedErrorCode: 1,
        expectedErrorMessage: 'champs vides'
    },
    {
        name: 'invalid-frontend-framework',
        description: 'Test avec un framework frontend invalide',
        command: 'node',
        args: [
            path.join(process.cwd(), 'cli.js'),
            'app',
            '--name=InvalidFrontend',
            '--package=com.test',
            '--db=h2',
            '--frontend=svelte'
        ],
        expectedErrorCode: 1,
        expectedErrorMessage: 'framework frontend non supporté'
    },
    {
        name: 'reserved-entity-name',
        description: 'Test avec un nom d\'entité réservé',
        command: 'node',
        args: [
            path.join(process.cwd(), 'cli.js'),
            'entity',
            '--name=Class',
            '--fields=name:string'
        ],
        expectedErrorCode: 1,
        expectedErrorMessage: 'nom réservé'
    }
];

// Fonction pour exécuter une commande et capturer la sortie
function runCommand(command, args, options = {}) {
    console.log(chalk.cyan(`Exécution de: ${command} ${args.join(' ')}`));

    return new Promise((resolve) => {
        const child = spawn(command, args, {
            stdio: ['ignore', 'pipe', 'pipe'],
            ...options
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        child.on('close', (code) => {
            resolve({
                code,
                stdout,
                stderr
            });
        });
    });
}

// Fonction pour exécuter un test de cas limite
async function runEdgeCase(edgeCase) {
    console.log(chalk.blue(`\n🧪 Test du cas limite: ${edgeCase.name}`));
    console.log(chalk.blue(`📝 ${edgeCase.description}`));

    // Créer un dossier spécifique pour ce cas limite
    const caseDir = path.join(TEST_DIR, edgeCase.name);
    fs.mkdirSync(caseDir, { recursive: true });
    process.chdir(caseDir);

    try {
        // Si le cas limite a plusieurs étapes
        if (edgeCase.steps) {
            for (const step of edgeCase.steps) {
                const result = await runCommand(step.command, step.args);

                // Si on attend un succès pour cette étape
                if (step.expectSuccess) {
                    if (result.code !== 0) {
                        console.error(chalk.red(`❌ Étape qui devrait réussir a échoué avec le code: ${result.code}`));
                        console.error(chalk.red(`Sortie d'erreur: ${result.stderr}`));
                        return false;
                    }
                }
                // Sinon, on attend une erreur spécifique
                else {
                    if (result.code === 0) {
                        console.error(chalk.red(`❌ Étape qui devrait échouer a réussi`));
                        return false;
                    }

                    // Vérifier que le message d'erreur contient ce qu'on attend
                    const output = result.stderr || result.stdout;
                    if (step.expectedErrorMessage && !output.toLowerCase().includes(step.expectedErrorMessage.toLowerCase())) {
                        console.error(chalk.red(`❌ Message d'erreur attendu non trouvé: ${step.expectedErrorMessage}`));
                        console.error(chalk.yellow(`Message reçu: ${output}`));
                        return false;
                    }

                    // Vérifier le code d'erreur si spécifié
                    if (step.expectedErrorCode !== undefined && result.code !== step.expectedErrorCode) {
                        console.error(chalk.red(`❌ Code d'erreur ${step.expectedErrorCode} attendu, reçu: ${result.code}`));
                        return false;
                    }
                }
            }

            console.log(chalk.green(`✅ Test ${edgeCase.name} réussi`));
            return true;
        }
        // Cas simple avec une seule commande
        else {
            const result = await runCommand(edgeCase.command, edgeCase.args);

            // On attend une erreur dans la majorité des cas limites
            if (result.code === 0) {
                console.error(chalk.red(`❌ La commande qui devrait échouer a réussi`));
                return false;
            }

            // Vérifier que le message d'erreur contient ce qu'on attend
            const output = result.stderr || result.stdout;
            if (edgeCase.expectedErrorMessage && !output.toLowerCase().includes(edgeCase.expectedErrorMessage.toLowerCase())) {
                console.error(chalk.red(`❌ Message d'erreur attendu non trouvé: ${edgeCase.expectedErrorMessage}`));
                console.error(chalk.yellow(`Message reçu: ${output}`));
                return false;
            }

            // Vérifier le code d'erreur si spécifié
            if (edgeCase.expectedErrorCode !== undefined && result.code !== edgeCase.expectedErrorCode) {
                console.error(chalk.red(`❌ Code d'erreur ${edgeCase.expectedErrorCode} attendu, reçu: ${result.code}`));
                return false;
            }

            console.log(chalk.green(`✅ Test ${edgeCase.name} réussi`));
            return true;
        }
    } catch (error) {
        console.error(chalk.red(`❌ Erreur lors de l'exécution du test ${edgeCase.name}:`), error);
        return false;
    }
}

// Fonction principale
async function runTests() {
    console.log(chalk.blue(`\n🧪 Exécution de ${edgeCases.length} tests de cas limites...`));

    const results = {};

    for (const edgeCase of edgeCases) {
        try {
            const success = await runEdgeCase(edgeCase);
            results[edgeCase.name] = success;
        } catch (error) {
            console.error(chalk.red(`❌ Erreur lors du test de ${edgeCase.name}:`), error);
            results[edgeCase.name] = false;
        }
    }

    // Afficher les résultats
    console.log(chalk.blue('\n📊 Résultats des tests de cas limites:'));
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
        console.log(chalk.green('\n🎉 Tous les tests de cas limites ont réussi!'));
        process.exit(0);
    } else {
        console.log(chalk.red('\n❌ Certains tests de cas limites ont échoué.'));
        process.exit(1);
    }
}

// Exécuter les tests
runTests().catch((error) => {
    console.error(chalk.red('❌ Erreur fatale dans le script de test:'), error);
    process.exit(1);
});
