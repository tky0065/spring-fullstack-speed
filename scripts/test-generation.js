#!/usr/bin/env node

/**
 * Script pour tester la génération d'un projet Spring Boot minimal
 * Ce script exécute le générateur avec une configuration minimale et vérifie le résultat
 */

const path = require('path');
const spawn = require('cross-spawn');
const fs = require('fs-extra');
const chalk = require('chalk');

// Chemin vers le dossier temporaire de test
const TEST_DIR = path.join(process.cwd(), 'test-output');

console.log(chalk.blue('🧪 Démarrage du test de génération minimale...'));

// Supprimer le dossier de test s'il existe déjà
if (fs.existsSync(TEST_DIR)) {
    console.log(chalk.yellow('🗑️  Nettoyage du dossier de test précédent...'));
    fs.removeSync(TEST_DIR);
}

// Créer le dossier de test
fs.mkdirSync(TEST_DIR);
process.chdir(TEST_DIR);

console.log(chalk.blue('🚀 Exécution du générateur avec configuration minimale...'));

// Options pour la génération minimale
const options = [
    'yo',
    'spring-fullstack',
    '--appName=test-app',
    '--packageName=com.example.testapp',
    '--database=H2',
    '--frontendFramework=Aucun (API seulement)',
    '--includeAuth=false',
    '--skip-install'
];

// Exécute le générateur
const result = spawn.sync('npx', options, { stdio: 'inherit' });

if (result.status !== 0) {
    console.error(chalk.red('❌ La génération a échoué !'));
    process.exit(1);
}

console.log(chalk.green('✅ La génération s\'est terminée avec succès !'));

// Vérifier la présence des fichiers essentiels
const essentialFiles = [
    'pom.xml',
    'mvnw',
    'src/main/resources/application.yml',
    'src/main/resources/logback-spring.xml',
    'src/main/java/com/example/testapp/TestAppApplication.java',
    'src/main/java/com/example/testapp/entity/BaseEntity.java',
    'src/main/java/com/example/testapp/entity/Example.java',
    'src/main/java/com/example/testapp/repository/ExampleRepository.java',
    'src/main/java/com/example/testapp/service/ExampleService.java',
    'src/main/java/com/example/testapp/controller/ExampleController.java',
    'src/main/java/com/example/testapp/util/LoggingUtils.java',
    'src/main/java/com/example/testapp/util/StringUtils.java',
    'src/main/java/com/example/testapp/util/DateTimeUtils.java',
    'src/main/java/com/example/testapp/util/PaginationUtil.java'
];

console.log(chalk.blue('🔍 Vérification des fichiers essentiels...'));
let allFilesPresent = true;

essentialFiles.forEach(file => {
    const filePath = path.join(TEST_DIR, file);
    if (fs.existsSync(filePath)) {
        console.log(chalk.green(`✅ ${file} - OK`));
    } else {
        console.log(chalk.red(`❌ ${file} - MANQUANT`));
        allFilesPresent = false;
    }
});

if (allFilesPresent) {
    console.log(chalk.green('✅ Tous les fichiers essentiels sont présents !'));
    console.log(chalk.green('✅ Test de génération minimale réussi !'));
} else {
    console.error(chalk.red('❌ Certains fichiers sont manquants. Le test a échoué.'));
    process.exit(1);
}

// Afficher l'emplacement du projet généré
console.log(chalk.blue(`📂 Le projet de test a été généré dans : ${TEST_DIR}`));
console.log(chalk.blue('💡 Vous pouvez explorer le projet généré pour vérifier son contenu.'));
