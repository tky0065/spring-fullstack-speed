/**
 * Module pour gérer les menus de sélection interactifs
 * Ce module fournit des fonctions pour créer des menus de sélection avancés
 */
import inquirer from "inquirer";
import chalk from "chalk";
import { getPresets, displaySuccess, displayError } from "./questions.js";

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
const KEYBOARD_SHORTCUT = chalk.yellow.bold;

/**
 * Affiche un écran d'accueil avec les options de démarrage
 * @returns La sélection de l'utilisateur
 */
export async function showWelcomeMenu(): Promise<string> {
  // Vérifier si on est en environnement de test
  const isTestEnv = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID;

  if (isTestEnv) {
    // En mode test, retourner directement une valeur par défaut sans attendre d'interaction
    console.log(chalk.yellow("[TEST MODE] Skipping interactive welcome menu, using 'quickstart' as default"));
    return "quickstart";
  }

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
 * Affiche le menu de sélection des presets
 * @returns Le preset sélectionné
 */
export async function showPresetMenu() {
  // Vérifier si on est en environnement de test
  const isTestEnv = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID;

  if (isTestEnv) {
    // En mode test, retourner directement une valeur par défaut sans attendre d'interaction
    console.log(chalk.yellow("[TEST MODE] Skipping interactive preset menu, using 'quickstart' as default"));
    return "quickstart";
  }

  const presets = getPresets();
  const presetChoices = Object.entries(presets).map(([key, preset]) => {
    return {
      name: `${MENU_OPTION_TITLE(preset.appName)} - ${MENU_OPTION_DESC(getPresetDescription(key))}`,
      value: key
    };
  });

  const { presetChoice } = await inquirer.prompt({
    type: "list",
    name: "presetChoice",
    message: "Choisissez un preset:",
    choices: [
      ...presetChoices,
      new inquirer.Separator(MENU_SEPARATOR),
      {
        name: `${MENU_OPTION_TITLE("← Retour")} - ${MENU_OPTION_DESC("Revenir au menu principal")}`,
        value: "back"
      }
    ],
    pageSize: 10
  });

  return presetChoice;
}

/**
 * Obtient une description lisible pour un preset donné
 * @param presetKey Clé du preset
 * @returns Description du preset
 */
function getPresetDescription(presetKey: string): string {
  const descriptions: Record<string, string> = {
    basic: "Application Spring Boot basique avec Thymeleaf et H2",
    fullstack: "Application fullstack avec React, PostgreSQL et Docker",
    microservice: "Microservice avec MongoDB, Kafka et support Kubernetes",
    minimal: "Application Spring Boot minimale sans frontend",
    quickstart: "Application minimale prête à l'emploi, configuration rapide"
  };

  return descriptions[presetKey] || "Configuration personnalisée";
}

/**
 * Affiche un menu de confirmation avant la génération du projet
 * @param config La configuration du projet à confirmer
 * @returns True si confirmé, false sinon
 */
export async function showConfirmationMenu(config: Record<string, any>): Promise<boolean> {
  // Vérifier si on est en environnement de test
  const isTestEnv = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID;

  if (isTestEnv) {
    // En mode test, retourner directement true sans attendre d'interaction
    console.log(chalk.yellow("[TEST MODE] Skipping confirmation menu, automatically confirming"));
    return true;
  }

  console.log(MENU_SEPARATOR);
  console.log(MENU_TITLE("📋 RÉSUMÉ DE LA CONFIGURATION"));
  console.log(MENU_SEPARATOR);

  // Afficher les détails de configuration de manière formatée
  Object.entries(config).forEach(([key, value]) => {
    if (key === 'additionalFeatures' && Array.isArray(value)) {
      console.log(`${chalk.cyan(key)}: ${chalk.green(value.join(', '))}`);
    } else if (key === 'oauth2Providers' && Array.isArray(value)) {
      console.log(`${chalk.cyan(key)}: ${chalk.green(value.join(', '))}`);
    } else {
      console.log(`${chalk.cyan(key)}: ${chalk.green(String(value))}`);
    }
  });

  console.log(MENU_SEPARATOR);
  const { confirmed } = await inquirer.prompt({
    type: "confirm",
    name: "confirmed",
    message: "Voulez-vous générer le projet avec cette configuration?",
    default: true
  });

  return confirmed;
}

/**
 * Affiche un menu de sélection de commandes pour les outils additionnels
 * @returns La commande sélectionnée
 */
export async function showToolsMenu(): Promise<string> {
  const { toolCommand } = await inquirer.prompt({
    type: "list",
    name: "toolCommand",
    message: "Sélectionnez une commande:",
    choices: [
      {
        name: `${MENU_OPTION_TITLE("sfs add")} - ${MENU_OPTION_DESC("Ajouter des composants au projet")}`,
        value: "add"
      },
      {
        name: `${MENU_OPTION_TITLE("sfs generate entity")} - ${MENU_OPTION_DESC("Générer une entité et son CRUD")}`,
        value: "entity"
      },
      {
        name: `${MENU_OPTION_TITLE("sfs generate dtos")} - ${MENU_OPTION_DESC("Générer des DTOs pour les entités")}`,
        value: "dtos"
      },
      new inquirer.Separator(MENU_SEPARATOR),
      {
        name: `${MENU_OPTION_TITLE("Quitter")} - ${MENU_OPTION_DESC("Revenir au terminal")}`,
        value: "exit"
      }
    ],
    pageSize: 10
  });

  return toolCommand;
}

/**
 * Affiche un menu de sélection d'entités pour la génération CRUD
 * @param entities Liste des entités disponibles
 * @returns L'entité sélectionnée
 */
export async function showEntitySelectionMenu(entities: string[]): Promise<string> {
  if (entities.length === 0) {
    displayError("Aucune entité trouvée dans le projet!");
    return "";
  }

  const entityChoices = entities.map(entity => ({
    name: entity,
    value: entity
  }));

  const { selectedEntity } = await inquirer.prompt({
    type: "list",
    name: "selectedEntity",
    message: "Sélectionnez une entité pour la génération de CRUD:",
    choices: [
      ...entityChoices,
      new inquirer.Separator(MENU_SEPARATOR),
      {
        name: `${MENU_OPTION_TITLE("Créer nouvelle entité")} - ${MENU_OPTION_DESC("Définir une nouvelle entité")}`,
        value: "new"
      },
      {
        name: `${MENU_OPTION_TITLE("← Retour")} - ${MENU_OPTION_DESC("Revenir au menu précédent")}`,
        value: "back"
      }
    ],
    pageSize: 12
  });

  return selectedEntity;
}

/**
 * Menu pour sélectionner des composants à ajouter au projet
 * @returns Liste des composants sélectionnés
 */
export async function showAddComponentsMenu(): Promise<string[]> {
  const { components } = await inquirer.prompt({
    type: "checkbox",
    name: "components",
    message: "Sélectionnez les composants à ajouter:",
    choices: [
      { name: "Security (Spring Security, Auth, Login)", value: "security" },
      { name: "Swagger UI (Documentation API)", value: "swagger" },
      { name: "Redis (Cache)", value: "redis" },
      { name: "WebSocket (Communication temps réel)", value: "websocket" },
      { name: "File Upload (Gestion des fichiers)", value: "fileupload" },
      { name: "Email (Service d'envoi d'emails)", value: "email" },
      { name: "Monitoring (Actuator, Prometheus)", value: "monitoring" },
      { name: "Internationalization (i18n)", value: "i18n" }
    ],
    pageSize: 10
  });

  return components;
}

/**
 * Affiche l'aide contextuelle avec navigation par touches
 * @param context Le contexte actuel pour afficher l'aide appropriée
 */
export function showContextualHelp(context: string) {
  console.log(MENU_SEPARATOR);
  console.log(MENU_TITLE("💡 AIDE CONTEXTUELLE"));
  console.log(MENU_SEPARATOR);

  const helpContent: Record<string, string[]> = {
    "main": [
      "Utilisez les " + KEYBOARD_SHORTCUT("flèches ↑↓") + " pour naviguer entre les options",
      "Appuyez sur " + KEYBOARD_SHORTCUT("Entrée") + " pour sélectionner une option",
      "Appuyez sur " + KEYBOARD_SHORTCUT("Ctrl+C") + " à tout moment pour quitter"
    ],
    "project": [
      "Nom de l'application: nom du dossier du projet (ex: my-spring-app)",
      "Nom du package: format Java standard (ex: com.example.app)",
      "Outil de build: Maven utilise pom.xml, Gradle utilise build.gradle"
    ],
    "database": [
      "H2: parfait pour le développement et les tests",
      "MySQL/PostgreSQL: bases relationnelles pour production",
      "MongoDB: base NoSQL orientée document"
    ],
    "frontend": [
      "React/Vue: génère un frontend séparé avec API REST",
      "Angular: utilise la nouvelle API Signal d'Angular",
      "Thymeleaf/JTE: templates intégrés au backend"
    ],
    "auth": [
      "JWT: authentification stateless avec tokens",
      "OAuth2: permet l'auth via Google, GitHub, etc.",
      "Session: auth traditionnelle avec cookies"
    ]
  };

  if (helpContent[context]) {
    helpContent[context].forEach(item => {
      console.log(`• ${item}`);
    });
  } else {
    console.log("• Pas d'aide disponible pour ce contexte");
  }

  console.log(MENU_SEPARATOR);
  console.log("Appuyez sur " + KEYBOARD_SHORTCUT("une touche") + " pour continuer...");
  // En production, on utiliserait process.stdin.once('data', () => {}) pour attendre une touche
}

/**
 * Affiche un menu de progression avec une barre de progression
 * @param step Étape actuelle
 * @param total Nombre total d'étapes
 * @param message Message à afficher
 */
export function showProgressBar(step: number, total: number, message: string) {
  const width = 40;
  const completed = Math.floor((step / total) * width);
  const remaining = width - completed;

  const bar = chalk.green('█'.repeat(completed)) + chalk.gray('░'.repeat(remaining));
  const percentage = Math.floor((step / total) * 100);

  console.log(`${bar} ${chalk.cyan(percentage + '%')} - ${message}`);
}

/**
 * Menu de navigation avec touches de raccourci
 * @returns La commande de navigation choisie
 */
export async function showNavigationMenu(): Promise<string> {
  console.log(MENU_SEPARATOR);
  console.log(MENU_TITLE("Utilisez les raccourcis clavier pour naviguer plus rapidement"));
  console.log(MENU_SEPARATOR);

  const { navCommand } = await inquirer.prompt({
    type: "list",
    name: "navCommand",
    message: "Navigation:",
    choices: [
      {
        name: `${KEYBOARD_SHORTCUT("N")} ${MENU_OPTION_TITLE("Suivant")} - Continuer à l'étape suivante`,
        value: "next"
      },
      {
        name: `${KEYBOARD_SHORTCUT("P")} ${MENU_OPTION_TITLE("Précédent")} - Revenir à l'étape précédente`,
        value: "prev"
      },
      {
        name: `${KEYBOARD_SHORTCUT("H")} ${MENU_OPTION_TITLE("Aide")} - Afficher l'aide contextuelle`,
        value: "help"
      },
      {
        name: `${KEYBOARD_SHORTCUT("Q")} ${MENU_OPTION_TITLE("Quitter")} - Annuler la génération`,
        value: "quit"
      }
    ]
  });

  return navCommand;
}

/**
 * Menu de sélection des fonctionnalités supplémentaires
 * @param features Liste des fonctionnalités disponibles
 * @returns Liste des fonctionnalités sélectionnées
 */
export async function showFeaturesSelectionMenu(features: any[]): Promise<string[]> {
  // Vérifier si on est en environnement de test
  const isTestEnv = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID;

  if (isTestEnv) {
    // En mode test, retourner un ensemble de fonctionnalités par défaut
    console.log(chalk.yellow("[TEST MODE] Skipping features selection menu, using default features"));
    // Sélectionner les 2 premières fonctionnalités ou retourner un tableau vide si aucune
    return features && features.length > 0
      ? features.slice(0, 2).map(f => typeof f === 'object' && f.value ? f.value : f)
      : [];
  }

  console.log(MENU_SEPARATOR);
  console.log(MENU_TITLE("🧩 SÉLECTION DES FONCTIONNALITÉS"));
  console.log(MENU_SEPARATOR);

  const { selectedFeatures } = await inquirer.prompt({
    type: "checkbox",
    name: "selectedFeatures",
    message: "Sélectionnez les fonctionnalités à ajouter:",
    choices: features,
    pageSize: 15
  });

  return selectedFeatures;
}

/**
 * Menu de sélection du type d'authentification
 * @returns Type d'authentification sélectionné
 */
export async function showAuthSelectionMenu(): Promise<string> {
  // Vérifier si on est en environnement de test
  const isTestEnv = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID;

  if (isTestEnv) {
    // En mode test, retourner directement une valeur par défaut sans attendre d'interaction
    console.log(chalk.yellow("[TEST MODE] Skipping auth selection menu, using 'JWT' as default"));
    return "JWT";
  }

  console.log(MENU_SEPARATOR);
  console.log(MENU_TITLE("🔐 CONFIGURATION DE L'AUTHENTIFICATION"));
  console.log(MENU_SEPARATOR);

  const { authType } = await inquirer.prompt({
    type: "list",
    name: "authType",
    message: "Sélectionnez le type d'authentification:",
    choices: [
      {
        name: `${MENU_OPTION_TITLE("JWT")} - ${MENU_OPTION_DESC("Authentification avec JSON Web Tokens")}`,
        value: "JWT"
      },
      {
        name: `${MENU_OPTION_TITLE("OAuth2")} - ${MENU_OPTION_DESC("Authentification avec providers externes (Google, GitHub...)")}`,
        value: "OAuth2"
      },
      {
        name: `${MENU_OPTION_TITLE("Session")} - ${MENU_OPTION_DESC("Authentification traditionnelle avec sessions")}`,
        value: "Session"
      },
      {
        name: `${MENU_OPTION_TITLE("Keycloak")} - ${MENU_OPTION_DESC("Intégration avec Keycloak")}`,
        value: "Keycloak"
      },
      {
        name: `${MENU_OPTION_TITLE("Aucune")} - ${MENU_OPTION_DESC("Pas d'authentification")}`,
        value: "None"
      }
    ],
    pageSize: 10
  });

  // Si OAuth2 est sélectionné, proposer de choisir les providers
  if (authType === "OAuth2") {
    const { oauth2Providers } = await inquirer.prompt({
      type: "checkbox",
      name: "oauth2Providers",
      message: "Sélectionnez les providers OAuth2:",
      choices: [
        { name: "Google", value: "google" },
        { name: "GitHub", value: "github" },
        { name: "Facebook", value: "facebook" },
        { name: "Microsoft", value: "microsoft" },
        { name: "LinkedIn", value: "linkedin" }
      ],
      default: ["google", "github"],
      pageSize: 8
    });

    return authType + "-" + oauth2Providers.join(",");
  }

  return authType;
}
