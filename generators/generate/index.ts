/**
 * Générateur unifié pour la commande 'sfs generate'
 * Ce générateur sert de point d'entrée pour orchestrer les différents sous-générateurs:
 * - entity: génération d'entités Java
 * - dtos: génération de DTOs associés aux entités
 * - crud: génération complète de fonctionnalités CRUD
 */

import { BaseGenerator } from "../base-generator.js";
import chalk from "chalk";
import path from "path";
import { fileURLToPath } from "url";
import inquirer from "inquirer";

// Styles visuels constants
const STEP_PREFIX = chalk.bold.blue("➤ ");
const SECTION_DIVIDER = chalk.gray("────────────────────────────────────────────");
const INFO_COLOR = chalk.yellow;
const SUCCESS_COLOR = chalk.green;
const ERROR_COLOR = chalk.red;
const HELP_COLOR = chalk.gray.italic;

// Résolution des chemins pour ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default class GenerateGenerator extends BaseGenerator {
  // Options spécifiques au générateur
  private generateType: string | undefined;
  private entityName: string | undefined;
  private packageName: string | undefined;
  declare options: any;

  constructor(args: string[], options: {[key: string]: any}) {
    super(args, options);

    // Définition des options de la ligne de commande
    this.argument("type", { type: String, required: false, description: "Type de génération (entity, dtos, crud)" });
    this.argument("name", { type: String, required: false, description: "Nom de l'entité à générer" });

    this.option("package", {
      type: String,
      description: "Nom du package Java (ex: com.example.domain)"
    });

    this.option("interactive", {
      type: Boolean,
      default: true,
      description: "Mode interactif pour la configuration"
    });
  }

  initializing() {
    this.log(SECTION_DIVIDER);
    this.log(chalk.bold.green(" Spring Fullstack Speed - Générateur Unifié "));
    this.log(SECTION_DIVIDER);

    this.generateType = this.options.type || this.args[0];
    this.entityName = this.options.name || this.args[1];
    this.packageName = this.options.package;
  }

  async prompting() {
    // Si le type de génération n'est pas spécifié, demander à l'utilisateur
    if (!this.generateType) {
      const answers = await this.prompt([
        {
          type: "list",
          name: "generateType",
          message: "Que souhaitez-vous générer?",
          choices: [
            { name: "Entité Java (entity)", value: "entity" },
            { name: "DTOs pour une entité existante (dtos)", value: "dtos" },
            { name: "CRUD complet (entity + dtos + API REST)", value: "crud" }
          ]
        }
      ]);

      this.generateType = answers.generateType;
    }

    // Si le nom de l'entité n'est pas spécifié et mode interactif, demander à l'utilisateur
    if (!this.entityName && this.options.interactive) {
      const answers = await this.prompt([
        {
          type: "input",
          name: "entityName",
          message: "Nom de l'entité à générer:",
          validate: (input: string) => {
            if (!input) return "Le nom de l'entité est requis";
            if (!/^[A-Z][a-zA-Z0-9]*$/.test(input)) {
              return "Le nom de l'entité doit commencer par une majuscule et ne contenir que des lettres et chiffres";
            }
            return true;
          }
        }
      ]);

      this.entityName = answers.entityName;
    }

    // Si le package n'est pas spécifié et mode interactif, demander à l'utilisateur
    if (!this.packageName && this.options.interactive) {
      const answers = await this.prompt([
        {
          type: "input",
          name: "packageName",
          message: "Nom du package Java:",
          default: "com.example.domain",
          validate: (input: string) => {
            if (!input) return "Le nom du package est requis";
            if (!/^[a-z][a-z0-9_]*(\.[a-z0-9_]+)*$/.test(input)) {
              return "Format de package invalide (ex: com.example.domain)";
            }
            return true;
          }
        }
      ]);

      this.packageName = answers.packageName;
    }
  }

  async configuring() {
    if (!this.generateType || !this.entityName) {
      this.log(ERROR_COLOR("Configuration incomplète. Type de génération et nom d'entité requis."));
      return;
    }

    if (!this.entityName) {
      this.log(ERROR_COLOR("Nom de l'entité non spécifié. Utilisation: sfs generate [entity|dtos|crud] [nom]"));
      process.exit(1);
    }
  }

  async default() {
    this.log(STEP_PREFIX + `Préparation de la génération de type '${this.generateType}' pour l'entité '${this.entityName}'`);

    // Les options doivent être passées directement, pas dans un objet imbriqué
    const generatorOptions = {
      entityName: this.entityName,
      package: this.packageName,
      interactive: this.options.interactive,
      skipInstall: this.options.skipInstall
    };

    const dtosOptions = {
      ...generatorOptions,
      entityClass: this.entityName as string
    };

    switch (this.generateType) {
      case 'entity':
        try {
          await this.composeWith(require.resolve('../entity'), generatorOptions);
        } catch (error) {
          this.log(ERROR_COLOR(`Erreur lors de la composition avec le générateur entity: ${error}`));
        }
        break;

      case 'dtos':
        try {

          await this.composeWith(require.resolve('../dtos'), dtosOptions);

        } catch (error) {
          this.log(ERROR_COLOR(`Erreur lors de la composition avec le générateur dtos: ${error}`));
        }
        break;

      case 'crud':
        try {
          // On génère d'abord l'entité
          await this.composeWith(require.resolve('../entity'), generatorOptions);

          // Puis les DTOs
          await this.composeWith(require.resolve('../dtos'), dtosOptions);

          // Et enfin le CRUD
          await this.composeWith(require.resolve('../crud'), dtosOptions);
        } catch (error) {
          this.log(ERROR_COLOR(`Erreur lors de la génération CRUD: ${error}`));
        }
        break;

      default:
        this.log(ERROR_COLOR(`Type de génération '${this.generateType}' non reconnu. Utilisation: sfs generate [entity|dtos|crud] [nom]`));
        process.exit(1);
    }
  }

  end() {
    this.log(SECTION_DIVIDER);
    this.log(SUCCESS_COLOR(`Génération de type '${this.generateType}' pour l'entité '${this.entityName}' terminée avec succès!`));

    // Afficher un message d'aide selon le type de génération
    if (this.generateType === 'entity') {
      this.log(HELP_COLOR("Astuce: Générez maintenant des DTOs pour cette entité avec: sfs generate dtos " + this.entityName));
    } else if (this.generateType === 'dtos') {
      this.log(HELP_COLOR("Astuce: Générez maintenant un CRUD complet pour cette entité avec: sfs generate crud " + this.entityName));
    }

    this.log(SECTION_DIVIDER);
  }
}
