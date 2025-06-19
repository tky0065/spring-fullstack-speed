import { BaseGenerator } from "../base-generator.js";
import chalk from "chalk";

/**
 * Générateur de DTOs (Data Transfer Objects)
 * Permet de générer automatiquement les classes DTO correspondant aux entités
 */
export default class DtosGenerator extends BaseGenerator {
  declare answers: any;

  constructor(args: string | string[], options: any) {
    super(args, options);

    // Options pour le générateur de DTOs
    this.option("entity-name", {
      description: "Nom de l'entité pour laquelle générer des DTOs",
      type: String,
    });

    this.option("package-name", {
      description: "Nom du package pour les DTOs",
      type: String,
    });
  }

  initializing() {
    this.log("Initialisation du générateur de DTOs...");
  }

  async prompting() {
    // Utiliser as any pour éviter les erreurs TypeScript lors de l'accès aux propriétés
    const opts = this.options as any;

    const prompts: any = [
      {
        type: "input",
        name: "entityName",
        message: "Pour quelle entité souhaitez-vous générer des DTOs?",
        default: opts["entity-name"],
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
        message: "Dans quel package voulez-vous créer ces DTOs?",
        default: opts["package-name"] || "com.example.dto",
        validate: (input: string) => {
          if (/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/.test(input)) {
            return true;
          }
          return "Le nom du package doit être un nom de package Java valide.";
        },
      },
      {
        type: "checkbox",
        name: "dtoTypes",
        message: "Quels types de DTOs souhaitez-vous générer?",
        choices: [
          { name: "DTO de création (Create)", value: "create", checked: true },
          { name: "DTO de mise à jour (Update)", value: "update", checked: true },
          { name: "DTO de réponse (Response)", value: "response", checked: true },
          { name: "DTO de recherche (Search)", value: "search", checked: false },
          { name: "DTO de liste (List)", value: "list", checked: false },
        ],
      },
      {
        type: "confirm",
        name: "addValidation",
        message: "Voulez-vous ajouter des validations aux DTOs?",
        default: true,
      },
      {
        type: "confirm",
        name: "generateMapper",
        message: "Voulez-vous générer un mapper entre l'entité et les DTOs?",
        default: true,
      },
    ];

    this.answers = await this.prompt(prompts);
  }

  configuring() {
    this.log("Configuration des DTOs...");
    // Logique de configuration ici
  }

  writing() {
    this.log("Génération des fichiers pour les DTOs...");

    // Code de génération des fichiers à implémenter
    this.log(chalk.yellow("Cette fonctionnalité sera implémentée dans une prochaine tâche."));
  }

  end() {
    this.log(chalk.green(`🚀 DTOs pour l'entité ${this.answers.entityName} générés avec succès!`));

    if (this.answers.generateMapper) {
      this.log(chalk.green(`✅ Mapper généré pour faciliter la conversion entre l'entité et les DTOs.`));
    }

    this.log(chalk.blue("Prochaines étapes recommandées:"));
    this.log(`1. Adapter les DTOs générés selon les besoins spécifiques de votre application`);
    this.log(`2. Intégrer les DTOs dans vos controllers et services`);
  }
}
