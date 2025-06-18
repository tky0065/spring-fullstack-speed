import { BaseGenerator } from "../base-generator.js";
import Generator from "yeoman-generator";
import chalk from "chalk";
import yosay from "yosay";

export default class AppGenerator extends BaseGenerator {
  declare answers: any;

  constructor(args: string | string[], options: any) {
    super(args, options);

    // Options pour le générateur principal
    this.option("skip-welcome-message", {
      description: "Passer le message de bienvenue",
      type: Boolean,
      default: false,
    });

    this.option("skip-install", {
      description: "Passer l'installation des dépendances",
      type: Boolean,
      default: false,
    });
  }

  initializing() {
    this.log("Initialisation du générateur SFS (Spring-Fullstack-Speed)...");
  }

  async prompting() {
    if (!this.options["skip-welcome-message"]) {
      this.log(
        yosay(
          `Bienvenue dans le générateur ${chalk.red(
            "Spring-Fullstack-Speed"
          )}!`
        )
      );
    }

    // Définition des questions avec le type any pour contourner l'erreur de typage
    const prompts: any = [
      {
        type: "input",
        name: "appName",
        message: "Quel est le nom de votre application?",
        default: "sfs-app",
      },
      {
        type: "input",
        name: "packageName",
        message: "Quel est le nom du package Java?",
        default: "com.example.app",
        validate: (input: string) => {
          if (/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/.test(input)) {
            return true;
          }
          return "Le nom du package doit être un nom de package Java valide.";
        },
      },
      {
        type: "list",
        name: "buildTool",
        message: "Quel outil de build voulez-vous utiliser?",
        choices: ["Maven", "Gradle"],
        default: "Maven",
      },
      {
        type: "list",
        name: "frontendFramework",
        message: "Quel framework frontend voulez-vous utiliser?",
        choices: [
          "React avec Inertia.js",
          "Vue.js avec Inertia.js",
          "Angular standalone",
          "Thymeleaf",
          "JTE",
          "Aucun (API seulement)",
        ],
        default: "React avec Inertia.js",
      },
      {
        type: "list",
        name: "database",
        message: "Quelle base de données voulez-vous utiliser?",
        choices: ["MySQL", "PostgreSQL", "MongoDB", "H2"],
        default: "PostgreSQL",
      },
      {
        type: "confirm",
        name: "includeAuth",
        message: "Voulez-vous inclure l'authentification?",
        default: true,
      },
      {
        type: "checkbox",
        name: "additionalFeatures",
        message: "Quelles fonctionnalités supplémentaires souhaitez-vous?",
        choices: [
          { name: "OpenAPI/Swagger", value: "openapi", checked: true },
          { name: "Docker", value: "docker", checked: true },
          { name: "Tests unitaires", value: "tests", checked: true },
          { name: "WebSocket", value: "websocket", checked: false },
          { name: "Redis Cache", value: "redis", checked: false },
        ],
      },
    ];

    this.answers = await this.prompt(prompts);
  }

  configuring() {
    this.log("Configuration en cours...");
    // Code pour configurer le projet
  }

  writing() {
    this.log("Génération des fichiers...");
    // Code pour générer les fichiers
  }

  install() {
    if (!this.options["skip-install"]) {
      this.log("Installation des dépendances...");
      // Code pour installer les dépendances
    }
  }

  end() {
    this.log(chalk.green("🚀 Application générée avec succès!"));
    this.log(`
Prochaines étapes:
1. Accédez à votre application: ${chalk.yellow(`cd ${this.answers.appName}`)}
2. Démarrez l'application: ${chalk.yellow(
      this.answers.buildTool === "Maven"
        ? "./mvnw spring-boot:run"
        : "./gradlew bootRun"
    )}
3. Accédez à votre application dans le navigateur: ${chalk.blue(
      "http://localhost:8080"
    )}
    `);
  }
}
