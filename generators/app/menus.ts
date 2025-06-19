/**
 * Module pour gérer les menus de sélection interactifs
 * Ce module fournit des fonctions pour créer des menus de sélection avancés
 */
import inquirer from "inquirer";
import chalk from "chalk";
import { getPresets } from "./questions.js";

// Importer les types Yeoman pour éviter les erreurs de typage
import Generator from "yeoman-generator";
type PromptQuestion = Parameters<Generator["prompt"]>[0];

// Styles visuels
const MENU_TITLE = chalk.bold.blue;
const MENU_SUBTITLE = chalk.cyan.italic;
const MENU_OPTION_TITLE = chalk.green.bold;
const MENU_OPTION_DESC = chalk.white;
const MENU_KEY = chalk.yellow;
const MENU_SEPARATOR = chalk.gray("────────────────────────────────────────────");

/**
 * Affiche un écran d'accueil avec les options de démarrage
 * @returns La sélection de l'utilisateur
 */
export async function showWelcomeMenu(): Promise<string> {
  console.log(MENU_SEPARATOR);
  console.log(MENU_TITLE("🚀 SPRING FULLSTACK SPEED GENERATOR"));
  console.log(MENU_SUBTITLE("Générez rapidement des applications fullstack Java modernes"));
  console.log(MENU_SEPARATOR);

  const { startOption } = await inquirer.prompt({
    type: "list",
    name: "startOption",
    message: "Comment souhaitez-vous commencer?",
    choices: [
      {
        name: `${MENU_OPTION_TITLE("Mode interactif")} - ${MENU_OPTION_DESC("Configuration guidée étape par étape")}`,
        value: "interactive"
      },
      {
        name: `${MENU_OPTION_TITLE("Utiliser un preset")} - ${MENU_OPTION_DESC("Configuration prédéfinie")}`,
        value: "preset"
      },
      {
        name: `${MENU_OPTION_TITLE("Mode quickstart")} - ${MENU_OPTION_DESC("Application minimale prête à l'emploi")}`,
        value: "quickstart"
      }
    ],
    pageSize: 10
  });

  return startOption;
}

/**
 * Présente les presets disponibles avec leur description détaillée
 * @returns Le preset sélectionné
 */
export async function showPresetMenu(): Promise<string> {
  const presets = getPresets();

  // Détails des presets pour affichage
  const presetDescriptions: Record<string, string> = {
    basic: "Application simple avec Thymeleaf et base H2, idéale pour les débutants",
    full: "Application complète avec React, PostgreSQL et toutes les fonctionnalités",
    "api-only": "API RESTful sans frontend, avec PostgreSQL et documentation Swagger",
    quickstart: "Application minimale prête à l'emploi avec React et H2"
  };

  console.log(MENU_SEPARATOR);
  console.log(MENU_TITLE("📋 CONFIGURATIONS PRÉDÉFINIES"));
  console.log(MENU_SUBTITLE("Sélectionnez un modèle d'application prédéfini"));
  console.log(MENU_SEPARATOR);

  // Création de choix enrichis avec description
  const presetChoices = Object.keys(presets).map(key => {
    const preset = presets[key as keyof typeof presets];
    return {
      name: `${MENU_OPTION_TITLE(key)} - ${MENU_OPTION_DESC(presetDescriptions[key as keyof typeof presetDescriptions])}
      ${chalk.dim(`• Frontend: ${preset.frontendFramework}`)}
      ${chalk.dim(`• Base de données: ${preset.database}`)}
      ${chalk.dim(`• Auth: ${preset.includeAuth ? preset.authType : "Non"}`)}`,
      value: key
    };
  });

  // Ajout d'une option pour revenir au menu précédent
  presetChoices.push({
    name: `${chalk.yellow("⬅️ Retour")} - Revenir au menu principal`,
    value: "back"
  });

  const { selectedPreset } = await inquirer.prompt({
    type: "list",
    name: "selectedPreset",
    message: "Sélectionnez une configuration prédéfinie:",
    choices: presetChoices,
    pageSize: 10
  });

  return selectedPreset;
}

/**
 * Menu pour sélectionner les fonctionnalités supplémentaires avec descriptions détaillées
 * @param baseChoices Les choix de base à présenter
 * @returns Les fonctionnalités sélectionnées
 */
export async function showFeaturesSelectionMenu(baseChoices: any[]): Promise<string[]> {
  // Ajouter des descriptions détaillées aux choix
  const enhancedChoices = baseChoices.map(choice => {
    // Si c'est déjà un objet avec name et value
    if (typeof choice === 'object' && choice.name && choice.value) {
      return choice;
    }

    // Si c'est une simple chaîne
    const descriptions: {[key: string]: string} = {
      "openapi": "Documentation d'API interactive avec Swagger UI",
      "docker": "Configuration Docker avec docker-compose pour déploiement facile",
      "tests": "Tests unitaires et d'intégration préconfigurés",
      "websocket": "Support WebSocket pour communication en temps réel",
      "liquibase": "Gestion des migrations de base de données avec Liquibase",
      "pwa": "Progressive Web App pour expérience mobile améliorée",
      "redis": "Cache Redis pour améliorer les performances",
      "monitoring": "Monitoring avec Spring Actuator, Micrometer et Prometheus",
      "i18n": "Support multi-langue (internationalisation)",
      "elasticsearch": "Moteur de recherche avancée avec Elasticsearch"
    };

    const value = typeof choice === 'string' ? choice : choice.value;
    const name = typeof choice === 'string' ? choice : choice.name;
    const checked = typeof choice === 'object' && choice.checked !== undefined ? choice.checked : false;
    const description = descriptions[value] || "";

    return {
      name: `${name}${description ? ` - ${chalk.dim(description)}` : ''}`,
      value,
      checked
    };
  });

  console.log(MENU_SEPARATOR);
  console.log(MENU_TITLE("⚙️ FONCTIONNALITÉS SUPPLÉMENTAIRES"));
  console.log(MENU_SUBTITLE("Sélectionnez les fonctionnalités à inclure dans votre projet"));
  console.log(MENU_SEPARATOR);

  const { selectedFeatures } = await inquirer.prompt({
    type: "checkbox",
    name: "selectedFeatures",
    message: "Sélectionnez les fonctionnalités à ajouter:",
    choices: enhancedChoices,
    pageSize: 15,
    validate: (input: string[]) => {
      if (input.length < 1) {
        return "Sélectionnez au moins une fonctionnalité";
      }
      return true;
    }
  });

  return selectedFeatures;
}

/**
 * Menu pour sélectionner le type d'authentification avec descriptions détaillées
 * @returns Le type d'authentification sélectionné
 */
export async function showAuthSelectionMenu(): Promise<string> {
  const authOptions = [
    {
      name: `${MENU_OPTION_TITLE("JWT (JSON Web Token)")} - ${MENU_OPTION_DESC("Authentification stateless via tokens")}`,
      value: "JWT"
    },
    {
      name: `${MENU_OPTION_TITLE("JWT + OAuth2")} - ${MENU_OPTION_DESC("JWT avec support Google, GitHub, etc.")}`,
      value: "JWT+OAuth2"
    },
    {
      name: `${MENU_OPTION_TITLE("Basic Auth")} - ${MENU_OPTION_DESC("Authentification simple username/password")}`,
      value: "Basic"
    },
    {
      name: `${MENU_OPTION_TITLE("Session")} - ${MENU_OPTION_DESC("Authentification basée sur les sessions")}`,
      value: "Session"
    },
    {
      name: `${MENU_OPTION_TITLE("Aucune")} - ${MENU_OPTION_DESC("Pas d'authentification")}`,
      value: "None"
    }
  ];

  console.log(MENU_SEPARATOR);
  console.log(MENU_TITLE("🔐 CONFIGURATION DE L'AUTHENTIFICATION"));
  console.log(MENU_SUBTITLE("Sélectionnez le type d'authentification pour votre application"));
  console.log(MENU_SEPARATOR);

  const { selectedAuth } = await inquirer.prompt({
    type: "list",
    name: "selectedAuth",
    message: "Type d'authentification:",
    choices: authOptions,
    pageSize: 10
  });

  return selectedAuth;
}

/**
 * Menu de confirmation avec résumé des choix
 * @param config La configuration à confirmer
 * @returns true si confirmé, false sinon
 */
export async function showConfirmationMenu(config: any): Promise<boolean> {
  console.log(MENU_SEPARATOR);
  console.log(MENU_TITLE("📝 RÉSUMÉ DE LA CONFIGURATION"));
  console.log(MENU_SEPARATOR);

  // Affichage des détails de configuration
  console.log(`${chalk.cyan("Nom de l'application:")} ${chalk.yellow(config.appName)}`);
  console.log(`${chalk.cyan("Package Java:")} ${chalk.yellow(config.packageName)}`);
  console.log(`${chalk.cyan("Outil de build:")} ${chalk.yellow(config.buildTool)}`);
  console.log(`${chalk.cyan("Version Java:")} ${chalk.yellow(config.javaVersion)}`);
  console.log(`${chalk.cyan("Version Spring Boot:")} ${chalk.yellow(config.springBootVersion)}`);
  console.log(`${chalk.cyan("Frontend:")} ${chalk.yellow(config.frontendFramework)}`);
  console.log(`${chalk.cyan("Base de données:")} ${chalk.yellow(config.database)}`);
  console.log(`${chalk.cyan("Authentification:")} ${chalk.yellow(config.includeAuth ? config.authType : "Non")}`);

  if (config.additionalFeatures && config.additionalFeatures.length > 0) {
    console.log(`${chalk.cyan("Fonctionnalités:")} ${chalk.yellow(config.additionalFeatures.join(", "))}`);
  }

  console.log(MENU_SEPARATOR);

  const { confirmed } = await inquirer.prompt({
    type: "confirm",
    name: "confirmed",
    message: "Cette configuration vous convient-elle?",
    default: true
  });

  return confirmed;
}
