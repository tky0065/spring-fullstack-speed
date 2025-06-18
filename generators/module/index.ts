import { BaseGenerator } from "../base-generator.js";
import chalk from "chalk";

/**
 * Générateur de modules fonctionnels
 * Permet de créer des modules métier complets avec leurs entités, services et controllers
 */
export default class ModuleGenerator extends BaseGenerator {
  declare answers: any;

  constructor(args: string | string[], options: any) {
    super(args, options);

    // Options pour le générateur de modules
    this.option("module-name", {
      description: "Nom du module à générer",
      type: String,
    });

    this.option("package-name", {
      description: "Nom du package racine pour le module",
      type: String,
    });
  }

  initializing() {
    this.log("Initialisation du générateur de modules...");
  }

  async prompting() {
    const prompts: any = [
      {
        type: "input",
        name: "moduleName",
        message: "Quel est le nom du module?",
        default: this.options["module-name"],
        validate: (input: string) => {
          if (!input || input.trim() === "") {
            return "Le nom du module est obligatoire.";
          }
          if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(input)) {
            return "Le nom du module ne doit contenir que des lettres et des chiffres.";
          }
          return true;
        },
      },
      {
        type: "input",
        name: "packageName",
        message: "Dans quel package racine voulez-vous créer ce module?",
        default: this.options["package-name"] || "com.example.modules",
        validate: (input: string) => {
          if (/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/.test(input)) {
            return true;
          }
          return "Le nom du package doit être un nom de package Java valide.";
        },
      },
      {
        type: "checkbox",
        name: "features",
        message: "Quelles fonctionnalités souhaitez-vous inclure dans ce module?",
        choices: [
          { name: "API REST", value: "rest", checked: true },
          { name: "Sécurité et permissions", value: "security", checked: true },
          { name: "CRUD Base", value: "crud", checked: true },
          { name: "Interface utilisateur", value: "ui", checked: false },
          { name: "Tests", value: "tests", checked: true },
        ],
      },
    ];

    this.answers = await this.prompt(prompts);
  }

  configuring() {
    this.log("Configuration du module...");
    // Logique de configuration ici
  }

  writing() {
    this.log("Génération des fichiers pour le module...");

    // Code de génération des fichiers à implémenter
    this.log(chalk.yellow("Cette fonctionnalité sera implémentée dans une prochaine tâche."));
  }

  end() {
    this.log(chalk.green(`🚀 Module ${this.answers.moduleName} généré avec succès!`));
  }
}
