/**
 * Module de questions pour la génération de projets
 * Ce module contient toutes les questions interactives posées à l'utilisateur
 * lors de la génération d'un nouveau projet.
 */

import chalk from "chalk";
import { validateJavaPackageName, validateProjectName } from "../../utils/validation.js";

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
      javaVersion: "17",
    },
    full: {
      appName: "sfs-full",
      packageName: "com.example.full",
      buildTool: "Gradle",
      frontendFramework: "React avec openapi",
      database: "PostgreSQL",
      includeAuth: true,
      authType: "JWT+OAuth2",
      additionalFeatures: ["openapi", "docker", "tests", "websocket", "redis", "monitoring"],
      springBootVersion: "3.1.0",
      javaVersion: "17",
    },
    "api-only": {
      appName: "sfs-api",
      packageName: "com.example.api",
      buildTool: "Maven",
      frontendFramework: "Aucun (API seulement)",
      database: "PostgreSQL",
      includeAuth: true,
      authType: "JWT",
      additionalFeatures: ["openapi", "docker", "tests"],
      springBootVersion: "3.1.0",
      javaVersion: "17",
    },
    quickstart: {
      appName: "sfs-quickstart",
      packageName: "com.example.sfs",
      buildTool: "Maven",
      frontendFramework: "React avec openapi",
      database: "H2",
      includeAuth: true,
      authType: "JWT",
      additionalFeatures: ["openapi", "docker", "tests"],
      springBootVersion: "3.1.0",
      javaVersion: "17",
    }
  };
}

/**
 * Questions de base pour la configuration du projet
 * @returns Tableau de questions
 */
export function getBasicQuestions() {
  return [
    {
      type: "input",
      name: "appName",
      message: "Quel est le nom de votre application?",
      default: "sfs-app",
      validate: (input: string) => validateProjectName(input)
    },
    {
      type: "input",
      name: "packageName",
      message: "Quel est le nom du package Java?",
      default: "com.example.app",
      validate: (input: string) => validateJavaPackageName(input)
    },
    {
      type: "list",
      name: "buildTool",
      message: "Quel outil de build voulez-vous utiliser?",
      choices: [
        { name: "Maven", value: "Maven" },
        { name: "Gradle", value: "Gradle" }
      ],
      default: "Maven",
    },
    {
      type: "list",
      name: "springBootVersion",
      message: "Quelle version de Spring Boot voulez-vous utiliser?",
      choices: [
        { name: "3.1.x (Dernière stable)", value: "3.1.0" },
        { name: "3.0.x", value: "3.0.6" },
        { name: "2.7.x (LTS)", value: "2.7.12" }
      ],
      default: "3.1.0",
    },
    {
      type: "list",
      name: "javaVersion",
      message: "Quelle version de Java voulez-vous utiliser?",
      choices: [
        { name: "Java 17 (LTS)", value: "17" },
        { name: "Java 21 (LTS, Spring Boot 3+ uniquement)", value: "21" },
        { name: "Java 11 (LTS)", value: "11" },
        { name: "Java 8 (Spring Boot 2.7 uniquement)", value: "8" }
      ],
      default: "17"
    }
  ];
}

/**
 * Questions pour la sélection du frontend
 * @returns Tableau de questions
 */
export function getFrontendQuestions() {
  return [
    {
      type: "list",
      name: "frontendFramework",
      message: "Quel framework frontend voulez-vous utiliser?",
      choices: [
        { name: "React avec openapi", value: "React avec openapi" },
        { name: "Vue.js avec openapi", value: "Vue.js avec openapi" },
        { name: "Angular standalone", value: "Angular standalone" },
        { name: "Thymeleaf (rendu côté serveur)", value: "Thymeleaf" },
        { name: "JTE (rendu côté serveur)", value: "JTE" },
        { name: "Aucun (API seulement)", value: "Aucun (API seulement)" }
      ],
      default: "React avec openapi",
    }
  ];
}

/**
 * Questions pour la configuration de l'API et de la base de données
 * @returns Tableau de questions
 */
export function getApiDbQuestions() {
  return [
    {
      type: "list",
      name: "database",
      message: "Quelle base de données voulez-vous utiliser?",
      choices: [
        { name: "PostgreSQL (recommandé pour la production)", value: "PostgreSQL" },
        { name: "MySQL", value: "MySQL" },
        { name: "MongoDB (NoSQL)", value: "MongoDB" },
        { name: "H2 (développement)", value: "H2" }
      ],
      default: "PostgreSQL",
    },
    {
      type: "confirm",
      name: "includeAuth",
      message: "Voulez-vous inclure l'authentification?",
      default: true,
    },
    {
      type: "list",
      name: "authType",
      message: "Quel type d'authentification voulez-vous?",
      choices: [
        { name: "JWT (JSON Web Token)", value: "JWT" },
        { name: "JWT + OAuth2 (Google, GitHub, etc.)", value: "JWT+OAuth2" },
        { name: "Basic Auth", value: "Basic" },
        { name: "Session-based", value: "Session" }
      ],
      default: "JWT",
      when: (answers: any) => answers.includeAuth
    }
  ];
}

/**
 * Crée les choix de fonctionnalités supplémentaires en fonction des réponses précédentes
 * @param answers Les réponses déjà collectées
 * @returns Tableau de choix
 */
export function buildFeatureChoices(answers: any) {
  const choicesFeatures = [
    { name: "OpenAPI/Swagger - Documentation d'API", value: "openapi", checked: true },
    { name: "Docker - Conteneurisation", value: "docker", checked: true },
    { name: "Tests unitaires et d'intégration", value: "tests", checked: true },
    { name: "WebSocket - Communication temps réel", value: "websocket", checked: false }
  ];

  // Ajout conditionnel de fonctionnalités basées sur les réponses précédentes
  if (answers.database === "PostgreSQL" || answers.database === "MySQL") {
    choicesFeatures.push({ name: "Liquibase - Migrations de base de données", value: "liquibase", checked: false });
  }

  if (answers.frontendFramework !== "Aucun (API seulement)") {
    choicesFeatures.push({ name: "PWA - Progressive Web App", value: "pwa", checked: false });
  }

  choicesFeatures.push(
    { name: "Redis Cache - Mise en cache des données", value: "redis", checked: false },
    { name: "Monitoring - Actuator, Micrometer, Prometheus", value: "monitoring", checked: false },
    { name: "Internationalization (i18n)", value: "i18n", checked: false }
  );

  return choicesFeatures;
}

/**
 * Questions pour les fonctionnalités supplémentaires
 * @param answers Les réponses déjà collectées
 * @returns Tableau de questions
 */
export function getFeatureQuestions(answers: any) {
  return [
    {
      type: "checkbox",
      name: "additionalFeatures",
      message: "Quelles fonctionnalités supplémentaires souhaitez-vous?",
      choices: buildFeatureChoices(answers),
      pageSize: 15
    }
  ];
}

/**
 * Affiche un résumé des choix de l'utilisateur
 * @param answers Les réponses collectées
 */
export function displaySummary(answers: any) {
  console.log("\n");
  console.log(chalk.green.bold("📋 Résumé de la configuration:"));
  console.log(chalk.cyan("Nom de l'application: ") + chalk.yellow(answers.appName));
  console.log(chalk.cyan("Package Java: ") + chalk.yellow(answers.packageName));
  console.log(chalk.cyan("Outil de build: ") + chalk.yellow(answers.buildTool));
  console.log(chalk.cyan("Version Spring Boot: ") + chalk.yellow(answers.springBootVersion));
  console.log(chalk.cyan("Version Java: ") + chalk.yellow(answers.javaVersion));
  console.log(chalk.cyan("Frontend: ") + chalk.yellow(answers.frontendFramework));
  console.log(chalk.cyan("Base de données: ") + chalk.yellow(answers.database));
  console.log(chalk.cyan("Authentification: ") + chalk.yellow(answers.includeAuth ? answers.authType : "Non"));
  console.log(chalk.cyan("Fonctionnalités: ") + chalk.yellow(answers.additionalFeatures.join(", ")));
  console.log("\n");
}

/**
 * Question de confirmation finale
 * @returns Question de confirmation
 */
export function getConfirmationQuestion() {
  return [
    {
      type: "confirm",
      name: "confirmConfig",
      message: "Voulez-vous continuer avec cette configuration?",
      default: true
    }
  ];
}
