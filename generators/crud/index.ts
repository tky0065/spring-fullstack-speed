import { BaseGenerator } from "../base-generator.js";
import chalk from "chalk";

/**
 * Générateur de CRUD pour les entités
 * Permet de générer automatiquement les opérations CRUD pour une entité existante
 */
export default class CrudGenerator extends BaseGenerator {
  declare answers: any;

  constructor(args: string | string[], options: any) {
    super(args, options);

    // Options pour le générateur CRUD
    this.option("entity-name", {
      description: "Nom de l'entité pour laquelle générer le CRUD",
      type: String,
    });
  }

  initializing() {
    this.log("Initialisation du générateur CRUD...");
    this.log(`Génération des opérations CRUD pour une entité existante.`);
  }

  async prompting() {
    // Utiliser as any pour éviter les erreurs TypeScript lors de l'accès aux propriétés
    const opts = this.options as any;

    const prompts: any = [
      {
        type: "input",
        name: "entityName",
        message: "Pour quelle entité souhaitez-vous générer les opérations CRUD?",
        default: opts["entity-name"],
        validate: (input: string) => {
          if (!input || input.trim() === "") {
            return "Le nom de l'entité est obligatoire.";
          }
          // Validation simple, à étendre plus tard
          return true;
        },
      },
      {
        type: "checkbox",
        name: "operations",
        message: "Quelles opérations CRUD souhaitez-vous générer?",
        choices: [
          { name: "Create", value: "create", checked: true },
          { name: "Read", value: "read", checked: true },
          { name: "Update", value: "update", checked: true },
          { name: "Delete", value: "delete", checked: true },
        ],
      },
      {
        type: "confirm",
        name: "generateDTO",
        message: "Voulez-vous générer des DTOs pour cette entité?",
        default: true,
      },
    ];

    this.answers = await this.prompt(prompts);
  }

  configuring() {
    this.log("Configuration du CRUD...");
    // Logique de configuration ici
  }

  writing() {
    this.log("Génération des fichiers CRUD...");

    // Code de génération des fichiers à implémenter
    this.log(chalk.yellow("Cette fonctionnalité sera implémentée dans une prochaine tâche."));
  }

  end() {
    this.log(chalk.green(`🚀 Opérations CRUD générées avec succès pour l'entité ${this.answers.entityName}!`));
  }
}
