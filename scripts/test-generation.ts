/**
 * Script pour tester la génération de templates de base
 *
 * Ce script est utilisé pour démontrer et valider les fonctionnalités de génération
 * du framework Spring-Fullstack-Speed. Il génère une application simple en utilisant
 * les templates définis dans le dossier generators/app/templates.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import chalk from 'chalk';
import { generateFile, generateStructure, generateJavaSource } from '../utils/generator-utils.js';
import { DEFAULT_CONFIG } from '../utils/config.js';
import { buildTemplateContext } from '../utils/template-engine.js';
import { ensureDirectoryExists } from '../utils/files.js';

// Configuration des chemins
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..').replace(/dist$/, ''); // Remonte à la racine du projet, même si exécuté depuis dist
const TEMPLATES_DIR = path.join(ROOT_DIR, 'generators', 'app', 'templates');
const OUTPUT_DIR = path.join(ROOT_DIR, '.tmp-test-generation');

/**
 * Génère une application de test simple
 */
async function generateTestApplication() {
  console.log(chalk.blue('=== Génération d\'une application de test ==='));
  console.log(chalk.yellow(`Dossier de sortie: ${OUTPUT_DIR}`));

  // Crée le dossier de sortie s'il n'existe pas, ou le vide s'il existe déjà
  if (fs.existsSync(OUTPUT_DIR)) {
    console.log(chalk.yellow('Le dossier de sortie existe déjà, nettoyage...'));
    fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  }
  ensureDirectoryExists(OUTPUT_DIR);

  // Configuration de l'application
  const appConfig = {
    ...DEFAULT_CONFIG,
    appName: 'test-app',
    packageName: 'com.example.test',
    buildTool: 'Maven',
    frontendFramework: 'React avec Inertia.js',
    database: 'PostgreSQL',
    includeAuth: true,
    additionalFeatures: ['openapi', 'docker', 'tests']
  };

  // Crée le contexte pour les templates
  const context = buildTemplateContext(appConfig);

  // Génère le fichier pom.xml (ou build.gradle)
  try {
    console.log(chalk.green('Génération du fichier de build...'));
    generateFile({
      templatePath: path.join(TEMPLATES_DIR, 'pom.xml.ejs'),
      destinationPath: path.join(OUTPUT_DIR, 'pom.xml'),
      context,
      force: true
    });
  } catch (error) {
    console.error(chalk.red('Erreur lors de la génération du fichier de build:'), error);
    return;
  }

  // Génère le fichier application.properties
  try {
    console.log(chalk.green('Génération du fichier de configuration...'));
    generateFile({
      templatePath: path.join(TEMPLATES_DIR, 'application.properties.ejs'),
      destinationPath: path.join(OUTPUT_DIR, 'src/main/resources/application.properties'),
      context,
      force: true
    });
  } catch (error) {
    console.error(chalk.red('Erreur lors de la génération du fichier de configuration:'), error);
    return;
  }

  // Génère la classe Application.java
  try {
    console.log(chalk.green('Génération de la classe principale...'));
    generateJavaSource({
      templatePath: path.join(TEMPLATES_DIR, 'Application.java.ejs'),
      className: 'Application',
      packageName: appConfig.packageName,
      outputDir: OUTPUT_DIR,
      context: appConfig,
      force: true
    });
  } catch (error) {
    console.error(chalk.red('Erreur lors de la génération de la classe principale:'), error);
    return;
  }

  // Génère les fichiers Docker si demandé
  if (appConfig.additionalFeatures.includes('docker')) {
    try {
      console.log(chalk.green('Génération des fichiers Docker...'));
      generateFile({
        templatePath: path.join(TEMPLATES_DIR, 'docker/Dockerfile.ejs'),
        destinationPath: path.join(OUTPUT_DIR, 'Dockerfile'),
        context,
        force: true
      });

      generateFile({
        templatePath: path.join(TEMPLATES_DIR, 'docker/docker-compose.yml.ejs'),
        destinationPath: path.join(OUTPUT_DIR, 'docker-compose.yml'),
        context,
        force: true
      });
    } catch (error) {
      console.error(chalk.red('Erreur lors de la génération des fichiers Docker:'), error);
      return;
    }
  }

  // Génère des fichiers frontend basés sur le framework choisi
  const frontendFramework = appConfig.frontendFramework;
  let frontendDir;

  if (frontendFramework === 'React avec Inertia.js') {
    frontendDir = 'react';
  } else if (frontendFramework === 'Vue.js avec Inertia.js') {
    frontendDir = 'vue';
  } else if (frontendFramework === 'Angular standalone') {
    frontendDir = 'angular';
  } else if (frontendFramework === 'Thymeleaf') {
    frontendDir = 'thymeleaf';
  } else if (frontendFramework === 'JTE') {
    frontendDir = 'jte';
  }

  if (frontendDir) {
    try {
      console.log(chalk.green(`Génération des fichiers frontend pour ${frontendFramework}...`));
      const frontendTemplateDir = path.join(TEMPLATES_DIR, 'frontend', frontendDir);

      // Génère les fichiers de base
      if (fs.existsSync(path.join(frontendTemplateDir, 'package.json.ejs'))) {
        generateFile({
          templatePath: path.join(frontendTemplateDir, 'package.json.ejs'),
          destinationPath: path.join(OUTPUT_DIR, 'frontend/package.json'),
          context,
          force: true
        });
      }

      // Autres fichiers de configuration frontend
      const configFiles = [
        'vite.config.js.ejs',
        'tailwind.config.js.ejs',
        'tsconfig.json.ejs'
      ];

      configFiles.forEach(configFile => {
        const configFilePath = path.join(frontendTemplateDir, configFile);
        if (fs.existsSync(configFilePath)) {
          generateFile({
            templatePath: configFilePath,
            destinationPath: path.join(OUTPUT_DIR, 'frontend', configFile.replace('.ejs', '')),
            context,
            force: true
          });
        }
      });

      // Génère des pages exemple
      if (frontendDir === 'react' && fs.existsSync(path.join(frontendTemplateDir, 'pages/Home.jsx.ejs'))) {
        generateFile({
          templatePath: path.join(frontendTemplateDir, 'pages/Home.jsx.ejs'),
          destinationPath: path.join(OUTPUT_DIR, 'frontend/src/pages/Home.jsx'),
          context,
          force: true
        });
      } else if (frontendDir === 'vue' && fs.existsSync(path.join(frontendTemplateDir, 'pages/Home.vue.ejs'))) {
        generateFile({
          templatePath: path.join(frontendTemplateDir, 'pages/Home.vue.ejs'),
          destinationPath: path.join(OUTPUT_DIR, 'frontend/src/pages/Home.vue'),
          context,
          force: true
        });
      }

      // Génère les fichiers CSS si présents
      if (fs.existsSync(path.join(frontendTemplateDir, 'styles/main.css.ejs'))) {
        generateFile({
          templatePath: path.join(frontendTemplateDir, 'styles/main.css.ejs'),
          destinationPath: path.join(OUTPUT_DIR, 'frontend/src/styles/main.css'),
          context,
          force: true
        });
      }

    } catch (error) {
      console.error(chalk.red(`Erreur lors de la génération des fichiers frontend pour ${frontendFramework}:`), error);
      return;
    }
  }

  console.log(chalk.green('=== Génération de l\'application de test terminée avec succès ==='));
  console.log(chalk.green(`Les fichiers ont été générés dans le dossier: ${OUTPUT_DIR}`));
  console.log(chalk.blue('Liste des fichiers générés:'));

  // Fonction récursive pour afficher les fichiers générés
  function listFiles(dir, indent = '') {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        console.log(`${indent}${chalk.cyan(file)}/`);
        listFiles(filePath, indent + '  ');
      } else {
        console.log(`${indent}${chalk.white(file)}`);
      }
    });
  }

  listFiles(OUTPUT_DIR);
}

// Exécute la fonction de génération
generateTestApplication().catch(error => {
  console.error(chalk.red('Erreur lors de la génération de l\'application de test:'), error);
  process.exit(1);
});
