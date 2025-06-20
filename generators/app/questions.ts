/**
 * Module de questions pour la génération de projets
 * Ce module contient toutes les questions interactives posées à l'utilisateur
 * lors de la génération d'un nouveau projet.
 */

import chalk from "chalk";
import { validateJavaPackageName, validateProjectName } from "../../utils/validation.js";
import Generator from "yeoman-generator";

// Type pour les questions de prompt compatible avec Yeoman Generator
export type YeomanQuestion = Parameters<Generator["prompt"]>[0];

// Constantes pour améliorer l'affichage CLI
const STEP_PREFIX = chalk.bold.blue("➤ ");
const OPTION_PREFIX = chalk.cyan("○ ");
const SELECTED_PREFIX = chalk.green("● ");
const SECTION_DIVIDER = chalk.gray("────────────────────────────────────────────");
const INFO_COLOR = chalk.yellow;
const SUCCESS_COLOR = chalk.green;
const ERROR_COLOR = chalk.red;
const HELP_COLOR = chalk.gray.italic;

/**
 * Affiche l'en-tête d'une étape
 * @param step Numéro de l'étape
 * @param title Titre de l'étape
 * @param total Nombre total d'étapes
 */
export function displayStepHeader(step: number, title: string, total: number) {
  console.log("\n" + SECTION_DIVIDER);
  console.log(`${STEP_PREFIX} ${chalk.bold(`ÉTAPE ${step}/${total}: ${title}`)}`);
  console.log(SECTION_DIVIDER + "\n");
}

/**
 * Préparation des presets (configurations prédéfinies)
 * @returns Objet contenant les différents presets disponibles
 */
export function getPresets() {
  return {
    basic: {
      appName: "sfs-basic",
      packageName: "com.example.basic",
      buildTool: "Maven",
      frontendFramework: "Thymeleaf",
      database: "H2",
      includeAuth: true,
      authType: "JWT",
      additionalFeatures: ["openapi", "tests"],
      springBootVersion: "3.1.0",
    },
    fullstack: {
      appName: "sfs-fullstack",
      packageName: "com.example.fullstack",
      buildTool: "Gradle",
      frontendFramework: "React",
      database: "PostgreSQL",
      includeAuth: true,
      authType: "JWT+OAuth2",
      additionalFeatures: ["openapi", "tests", "docker"],
      springBootVersion: "3.1.5",
    },
    microservice: {
      appName: "sfs-microservice",
      packageName: "com.example.microservice",
      buildTool: "Gradle",
      frontendFramework: "none",
      database: "MongoDB",
      includeAuth: true,
      authType: "JWT",
      additionalFeatures: ["openapi", "tests", "docker", "kubernetes", "kafka"],
      springBootVersion: "3.2.0",
    },
    minimal: {
      appName: "sfs-minimal",
      packageName: "com.example.minimal",
      buildTool: "Maven",
      frontendFramework: "none",
      database: "H2",
      includeAuth: false,
      additionalFeatures: [],
      springBootVersion: "3.1.0",
    }
  };
}

/**
 * Affiche un message d'aide contextuelle
 * @param message Le message d'aide à afficher
 */
export function displayHelpMessage(message: string) {
  console.log(HELP_COLOR(`💡 ${message}`));
}

/**
 * Affiche un message de succès
 * @param message Le message de succès à afficher
 */
export function displaySuccess(message: string) {
  console.log(SUCCESS_COLOR(`✓ ${message}`));
}

/**
 * Affiche un message d'erreur
 * @param message Le message d'erreur à afficher
 */
export function displayError(message: string) {
  console.log(ERROR_COLOR(`✗ ${message}`));
}

/**
 * Génère une question de confirmation avec style personnalisé
 * @param name Nom de la question
 * @param message Message à afficher
 * @param defaultValue Valeur par défaut (true/false)
 * @returns Question formattée pour yeoman-generator
 */
export function createConfirmQuestion(name: string, message: string, defaultValue: boolean = true): YeomanQuestion {
  return {
    type: 'confirm',
    name,
    message: chalk.cyan(message),
    default: defaultValue
  };
}

/**
 * Génère une question avec validation des réponses
 * @param name Nom de la question
 * @param message Message à afficher
 * @param defaultValue Valeur par défaut
 * @param validator Fonction de validation
 * @returns Question formattée pour yeoman-generator
 */
export function createValidatedQuestion(
  name: string,
  message: string,
  defaultValue: string = '',
  validator?: (input: string) => boolean | string
): YeomanQuestion {
  return {
    type: 'input',
    name,
    message: chalk.cyan(message),
    default: defaultValue,
    validate: validator
  };
}

/**
 * Génère les questions de base pour la configuration du projet
 * @returns Liste de questions pour yeoman-generator
 */
export function getProjectQuestions(): YeomanQuestion[] {
  return [
    createValidatedQuestion('appName', 'Nom de l\'application:', 'my-spring-app', validateProjectName),
    createValidatedQuestion('packageName', 'Nom du package Java:', 'com.example.app', validateJavaPackageName),
    {
      type: 'list',
      name: 'buildTool',
      message: chalk.cyan('Outil de build:'),
      choices: ['Maven', 'Gradle'],
      default: 'Maven'
    },
    {
      type: 'list',
      name: 'springBootVersion',
      message: chalk.cyan('Version de Spring Boot:'),
      choices: ['3.0.0', '3.1.0', '3.1.5', '3.2.0'],
      default: '3.1.5'
    }
  ];
}

/**
 * Génère les questions pour la configuration de la base de données
 * @returns Liste de questions pour yeoman-generator
 */
export function getDatabaseQuestions(): YeomanQuestion[] {
  return [
    {
      type: 'list',
      name: 'database',
      message: chalk.cyan('Base de données:'),
      choices: [
        { name: 'H2 (en mémoire, idéal pour le développement)', value: 'H2' },
        { name: 'MySQL', value: 'MySQL' },
        { name: 'PostgreSQL', value: 'PostgreSQL' },
        { name: 'MongoDB', value: 'MongoDB' }
      ],
      default: 'H2'
    },
    {
      type: 'input',
      name: 'dbUrl',
      message: chalk.cyan('URL de la base de données:'),
      default: (answers: any) => {
        switch(answers.database) {
          case 'MySQL': return 'jdbc:mysql://localhost:3306/myapp';
          case 'PostgreSQL': return 'jdbc:postgresql://localhost:5432/myapp';
          case 'MongoDB': return 'mongodb://localhost:27017/myapp';
          case 'H2': return 'jdbc:h2:mem:myapp';
          default: return '';
        }
      },
      when: (answers: any) => answers.database !== 'H2'
    },
    {
      type: 'input',
      name: 'dbUsername',
      message: chalk.cyan('Nom d\'utilisateur DB:'),
      default: 'root',
      when: (answers: any) => answers.database !== 'H2'
    },
    {
      type: 'password',
      name: 'dbPassword',
      message: chalk.cyan('Mot de passe DB:'),
      default: '',
      when: (answers: any) => answers.database !== 'H2'
    }
  ];
}

/**
 * Génère les questions pour la configuration du frontend
 * @returns Liste de questions pour yeoman-generator
 */
export function getFrontendQuestions(): YeomanQuestion[] {
  return [
    {
      type: 'list',
      name: 'frontendFramework',
      message: chalk.cyan('Framework frontend:'),
      choices: [
        { name: 'React (avec TypeScript et openapi-generator)', value: 'React' },
        { name: 'Vue.js (avec TypeScript et openapi-generator)', value: 'Vue' },
        { name: 'Angular (avec Signal API et ng-openapi-gen)', value: 'Angular' },
        { name: 'Thymeleaf (templates côté serveur)', value: 'Thymeleaf' },
        { name: 'JTE (templates côté serveur)', value: 'JTE' },
        { name: 'Aucun (API seulement)', value: 'none' }
      ],
      default: 'React'
    },
    {
      type: 'confirm',
      name: 'useTailwind',
      message: chalk.cyan('Utiliser TailwindCSS?'),
      default: true,
      when: (answers: any) => ['React', 'Vue'].includes(answers.frontendFramework)
    }
  ];
}

/**
 * Génère les questions pour la configuration de l'authentification
 * @returns Liste de questions pour yeoman-generator
 */
export function getAuthenticationQuestions(): YeomanQuestion[] {
  return [
    createConfirmQuestion('includeAuth', 'Inclure l\'authentification?'),
    {
      type: 'list',
      name: 'authType',
      message: chalk.cyan('Type d\'authentification:'),
      choices: [
        { name: 'JWT', value: 'JWT' },
        { name: 'JWT + OAuth2 (Google, GitHub, etc.)', value: 'JWT+OAuth2' },
        { name: 'Session (cookie-based)', value: 'Session' }
      ],
      default: 'JWT',
      when: (answers: any) => answers.includeAuth
    },
    {
      type: 'checkbox',
      name: 'oauth2Providers',
      message: chalk.cyan('Fournisseurs OAuth2:'),
      choices: [
        { name: 'Google', value: 'google' },
        { name: 'GitHub', value: 'github' },
        { name: 'Facebook', value: 'facebook' },
        { name: 'Twitter', value: 'twitter' }
      ],
      when: (answers: any) => answers.includeAuth && answers.authType === 'JWT+OAuth2'
    }
  ];
}

/**
 * Génère les questions pour les fonctionnalités additionnelles
 * @returns Liste de questions pour yeoman-generator
 */
export function getFeaturesQuestions(): YeomanQuestion[] {
  return [
    {
      type: 'checkbox',
      name: 'additionalFeatures',
      message: chalk.cyan('Fonctionnalités additionnelles:'),
      choices: [
        { name: 'Documentation API (OpenAPI/Swagger)', value: 'openapi' },
        { name: 'Tests unitaires et d\'intégration', value: 'tests' },
        { name: 'Docker', value: 'docker' },
        { name: 'Kubernetes', value: 'kubernetes' },
        { name: 'Support Redis (cache)', value: 'redis' },
        { name: 'Kafka (messaging)', value: 'kafka' },
        { name: 'Elasticsearch (recherche)', value: 'elasticsearch' },
        { name: 'Monitoring (Actuator, Micrometer)', value: 'monitoring' }
      ],
      default: ['openapi', 'tests']
    }
  ];
}

/**
 * Crée un objet de questions complet pour toutes les étapes du wizard
 * @returns Objet contenant toutes les questions par étape
 */
export function createWizardQuestions() {
  return {
    project: getProjectQuestions(),
    database: getDatabaseQuestions(),
    frontend: getFrontendQuestions(),
    authentication: getAuthenticationQuestions(),
    features: getFeaturesQuestions()
  };
}
