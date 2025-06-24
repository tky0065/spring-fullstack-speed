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
      authType: "OAuth2",
      additionalFeatures: ["openapi", "tests", "docker", "monitoring"],
      springBootVersion: "3.1.0",
    },
    microservice: {
      appName: "sfs-microservice",
      packageName: "com.example.service",
      buildTool: "Maven",
      frontendFramework: "Aucun (API seulement)",
      database: "MongoDB",
      includeAuth: true,
      authType: "JWT",
      additionalFeatures: ["openapi", "tests", "docker", "kubernetes", "messaging"],
      springBootVersion: "3.1.0",
    },
    quickstart: {
      appName: "sfs-quickstart",
      packageName: "com.example.demo",
      buildTool: "Maven",
      frontendFramework: "Thymeleaf",
      database: "H2",
      includeAuth: false,
      authType: "None",
      additionalFeatures: ["openapi"],
      springBootVersion: "3.1.0",
      javaVersion: "21"
    }
  };
}

/**
 * Génère les questions de base pour le projet
 * @returns Liste des questions de base
 */
export function getBasicQuestions(): YeomanQuestion[] {
  return [
    {
      type: "input",
      name: "appName",
      message: "Nom de l'application:",
      validate: validateProjectName,
      default: "spring-fullstack-app"
    },
    {
      type: "input",
      name: "packageName",
      message: "Nom du package Java:",
      validate: validateJavaPackageName,
      default: "com.example.app"
    },
    {
      type: "list",
      name: "buildTool",
      message: "Outil de build:",
      choices: ["Maven", "Gradle"],
      default: "Maven"
    },
    {
      type: "list",
      name: "javaVersion",
      message: "Version de Java:",
      choices: ["24","21", "17"],
      default: "21"
    },
    {
      type: "list",
      name: "springBootVersion",
      message: "Version de Spring Boot:",
      choices: ["3.1.0", "3.0.0", "2.7.0"],
      default: "3.1.0"
    }
  ];
}

/**
 * Génère les questions liées au frontend
 * @returns Liste des questions pour le frontend
 */
export function getFrontendQuestions(): YeomanQuestion[] {
  return [
    {
      type: "list",
      name: "frontendFramework",
      message: "Framework frontend:",
      choices: [
        "React",
        "Vue.js",
        "Angular",
        "Thymeleaf",
        "JTE",
        "Aucun (API seulement)"
      ],
      default: "React"
    }
  ];
}

/**
 * Génère les questions liées à l'API et à la base de données
 * @returns Liste des questions pour l'API et la base de données
 */
export function getApiDbQuestions(): YeomanQuestion[] {
  return [
    {
      type: "list",
      name: "database",
      message: "Base de données:",
      choices: ["H2", "MySQL", "PostgreSQL", "MongoDB"],
      default: "H2"
    },
    {
      type: "confirm",
      name: "includeAuth",
      message: "Ajouter l'authentification?",
      default: true
    }
  ];
}

/**
 * Génère les questions liées aux fonctionnalités additionnelles
 * @param context Le contexte actuel (réponses précédentes)
 * @returns Liste des questions pour les fonctionnalités additionnelles
 */
export function getFeaturesQuestions(context: Record<string, any> = {}): YeomanQuestion[] {
  const features = [
    { name: "OpenAPI/Swagger", value: "openapi" },
    { name: "Tests unitaires & intégration", value: "tests" },
    { name: "Docker", value: "docker" },
    { name: "Kubernetes", value: "kubernetes" },
    { name: "Monitoring (Actuator, Prometheus)", value: "monitoring" },
    { name: "Cache (Redis)", value: "cache" },
    { name: "Messaging (Kafka/RabbitMQ)", value: "messaging" },
  ];

  // Adaptation des fonctionnalités selon le contexte
  if (context.frontendFramework !== "Aucun (API seulement)") {
    features.push({ name: "CORS configuré", value: "cors" });
  }

  if (context.database === "MongoDB") {
    features.push({ name: "MongoDB Reactive", value: "mongo-reactive" });
  }

  return [
    {
      type: "checkbox",
      name: "additionalFeatures",
      message: "Fonctionnalités supplémentaires:",
      choices: features,
      default: ["openapi", "tests"]
    }
  ];
}

/**
 * Génère les choix de fonctionnalités selon le contexte
 * @param context Le contexte actuel (réponses précédentes)
 * @returns Liste des choix de fonctionnalités
 */
export function buildFeatureChoices(context: Record<string, any> = {}): any[] {
  const features = [
    { name: "OpenAPI/Swagger", value: "openapi" },
    { name: "Tests unitaires & intégration", value: "tests" },
    { name: "Docker", value: "docker" },
    { name: "Kubernetes", value: "kubernetes" },
    { name: "Monitoring (Actuator, Prometheus)", value: "monitoring" },
    { name: "Cache (Redis)", value: "cache" },
    { name: "Messaging (Kafka/RabbitMQ)", value: "messaging" },
  ];

  // Adaptation des fonctionnalités selon le contexte
  if (context.frontendFramework !== "Aucun (API seulement)") {
    features.push({ name: "CORS configuré", value: "cors" });
  }

  if (context.database === "MongoDB") {
    features.push({ name: "MongoDB Reactive", value: "mongo-reactive" });
  }

  return features;
}

/**
 * Affiche un résumé des choix de configuration
 * @param config La configuration à afficher
 */
export function displaySummary(config: Record<string, any>) {
  console.log("\n" + SECTION_DIVIDER);
  console.log(chalk.bold.green(" RÉSUMÉ DE LA CONFIGURATION "));
  console.log(SECTION_DIVIDER);

  // Afficher les détails de configuration
  console.log(`${chalk.cyan("Nom de l'application:")} ${chalk.green(config.appName)}`);
  console.log(`${chalk.cyan("Package Java:")} ${chalk.green(config.packageName)}`);
  console.log(`${chalk.cyan("Outil de build:")} ${chalk.green(config.buildTool)}`);
  console.log(`${chalk.cyan("Framework frontend:")} ${chalk.green(config.frontendFramework)}`);
  console.log(`${chalk.cyan("Base de données:")} ${chalk.green(config.database)}`);
  console.log(`${chalk.cyan("Authentification:")} ${chalk.green(config.includeAuth ? config.authType || "Oui" : "Non")}`);

  if (config.additionalFeatures && config.additionalFeatures.length > 0) {
    console.log(`${chalk.cyan("Fonctionnalités supplémentaires:")} ${chalk.green(config.additionalFeatures.join(", "))}`);
  }

  console.log(SECTION_DIVIDER);
}

/**
 * Génère une question de confirmation
 * @returns Question de confirmation
 */
export function getConfirmationQuestion(): YeomanQuestion {
  return {
    type: "confirm",
    name: "confirmConfig",
    message: "Confirmer cette configuration?",
    default: true
  };
}

/**
 * Affiche un message d'erreur
 * @param message Le message d'erreur à afficher
 */
export function displayError(message: string) {
  console.log(ERROR_COLOR(message));
}

/**
 * Affiche un message de succès
 * @param message Le message de succès à afficher
 */
export function displaySuccess(message: string) {
  console.log(SUCCESS_COLOR(message));
}

/**
 * Affiche un message d'aide
 * @param message Le message d'aide à afficher
 */
export function displayHelpMessage(message: string) {
  console.log(HELP_COLOR(message));
}
