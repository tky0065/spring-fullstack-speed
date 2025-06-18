import { BaseGenerator } from "../base-generator.js";
import chalk from "chalk";

/**
 * Générateur d'entités
 * Permet de créer de nouvelles entités avec leurs repository, service et controller
 */
export default class EntityGenerator extends BaseGenerator {
  declare answers: any;

  constructor(args: string | string[], options: any) {
    super(args, options);

    // Options pour le générateur d'entités
    this.option("entity-name", {
      description: "Nom de l'entité à générer",
      type: String,
    });

    this.option("package-name", {
      description: "Nom du package pour l'entité",
      type: String,
    });
  }

  initializing() {
    this.log("Initialisation du générateur d'entités...");
  }

  async prompting() {
    const prompts: any = [
      {
        type: "input",
        name: "entityName",
        message: "Quel est le nom de l'entité?",
        default: this.options["entity-name"],
        validate: (input: string) => {
          if (!input || input.trim() === "") {
            return "Le nom de l'entité est obligatoire.";
          }
          if (!/^[A-Z][a-zA-Z0-9]*$/.test(input)) {
            return "Le nom de l'entité doit commencer par une majuscule et ne contenir que des lettres et des chiffres.";
          }
          return true;
        },
      },
      {
        type: "input",
        name: "packageName",
        message: "Dans quel package voulez-vous créer cette entité?",
        default: this.options["package-name"] || "com.example.domain",
        validate: (input: string) => {
          if (/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/.test(input)) {
            return true;
          }
          return "Le nom du package doit être un nom de package Java valide.";
        },
      },
      {
        type: "confirm",
        name: "generateRepository",
        message: "Voulez-vous générer un repository pour cette entité?",
        default: true,
      },
      {
        type: "confirm",
        name: "generateService",
        message: "Voulez-vous générer un service pour cette entité?",
        default: true,
      },
      {
        type: "confirm",
        name: "generateController",
        message: "Voulez-vous générer un controller REST pour cette entité?",
        default: true,
      },
    ];

    this.answers = await this.prompt(prompts);
  }

  configuring() {
    this.log("Configuration de l'entité...");
    // Logique de configuration ici
  }

  writing() {
    this.log("Génération des fichiers pour l'entité...");

    // Code de génération des fichiers à implémenter
    this.log(chalk.yellow("Cette fonctionnalité sera implémentée dans une prochaine tâche."));
  }

  end() {
    this.log(chalk.green(`🚀 Entité ${this.answers.entityName} générée avec succès!`));
  }
}
