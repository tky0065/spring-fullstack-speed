/**
 * Générateur unifié pour la commande 'sfs generate'
 * Ce générateur sert de point d'entrée pour orchestrer les différents sous-générateurs:
 * - entity: génération d'entités Java
 * - dtos: génération de DTOs associés aux entités
 * - crud: génération complète de fonctionnalités CRUD
 */

import { BaseGenerator } from "../base-generator.js";
import chalk from "chalk";
import path from "node:path";
import { fileURLToPath } from "node:url";
import inquirer from "inquirer";

// Styles visuels constants
const STEP_PREFIX = chalk.bold.blue("➤ ");
const SECTION_DIVIDER = chalk.gray("────────────────────────────────────────────");
const INFO_COLOR = chalk.yellow;
const SUCCESS_COLOR = chalk.green;
const ERROR_COLOR = chalk.red;
const HELP_COLOR = chalk.gray.italic;

// Résolution des chemins pour ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    try {
      switch (this.generateType) {
        case 'entity':
          // Importation dynamique du générateur d'entités
          const entityGen = await import('../entity/index.js');
          await this.composeWith({
            Generator: entityGen.default,
            path: require.resolve('../entity/index.js')
          }, generatorOptions);
          break;

        case 'dtos':
          // Importation dynamique du générateur de DTOs
          const dtosGen = await import('../dtos/index.js');
          await this.composeWith({
            Generator: dtosGen.default,
            path: require.resolve('../dtos/index.js')
          }, dtosOptions);
          break;

        case 'crud':
          // Pour le CRUD, on génère d'abord l'entité, puis les DTOs, puis le CRUD
          const entityGenForCrud = await import('../entity/index.js');
          await this.composeWith({
            Generator: entityGenForCrud.default,
            path: require.resolve('../entity/index.js')
          }, generatorOptions);

          const dtosGenForCrud = await import('../dtos/index.js');
          await this.composeWith({
            Generator: dtosGenForCrud.default,
            path: require.resolve('../dtos/index.js')
          }, dtosOptions);

          const crudGen = await import('../crud/index.js');
          await this.composeWith({
            Generator: crudGen.default,
            path: require.resolve('../crud/index.js')
          }, dtosOptions);
          break;

        default:
          this.log(ERROR_COLOR(`Type de génération '${this.generateType}' non reconnu. Utilisation: sfs generate [entity|dtos|crud] [nom]`));
          process.exit(1);
      }
    } catch (error) {
      this.log(ERROR_COLOR(`Erreur lors de la génération: ${error}`));
      this.log(ERROR_COLOR((error as Error).stack || 'Aucune trace de pile disponible'));
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
    } else if (this.generateType === 'crud') {
      this.log(HELP_COLOR("Astuce: Vous pouvez maintenant tester votre API avec: sfs serve"));
    }
    
    this.log(SECTION_DIVIDER);
    
    // Affichage d'un résumé des générations effectuées
    this.log(INFO_COLOR("Résumé de la génération:"));
    this.log(`- Type: ${chalk.bold(this.generateType)}`);
    this.log(`- Entité: ${chalk.bold(this.entityName)}`);
    this.log(`- Package: ${chalk.bold(this.packageName)}`);
    
    if (this.generateType === 'crud') {
      this.log(INFO_COLOR("\nPoints d'accès REST générés:"));
      this.log(`- GET    /api/${this.entityName?.toLowerCase()}s - Liste tous les éléments`);
      this.log(`- GET    /api/${this.entityName?.toLowerCase()}s/{id} - Récupère un élément par ID`);
      this.log(`- POST   /api/${this.entityName?.toLowerCase()}s - Crée un nouvel élément`);
      this.log(`- PUT    /api/${this.entityName?.toLowerCase()}s/{id} - Met à jour un élément existant`);
      this.log(`- DELETE /api/${this.entityName?.toLowerCase()}s/{id} - Supprime un élément`);
    }
  }
  
  /**
   * Affiche l'aide contextuelle pour le générateur
   */
  showHelp() {
    this.log(SECTION_DIVIDER);
    this.log(chalk.bold.green(" Spring Fullstack Speed - Aide du générateur unifié "));
    this.log(SECTION_DIVIDER);
    this.log("Utilisation: sfs generate [options]");
    this.log("\nTypes de génération disponibles:");
    this.log("  - entity : Génère une entité Java");
    this.log("  - dtos   : Génère des DTOs pour une entité existante");
    this.log("  - crud   : Génère un CRUD complet (entity + dtos + API REST)");
    
    this.log("\nExemples:");
    this.log("  sfs generate entity Product");
    this.log("  sfs generate dtos User --package=com.example.user");
    this.log("  sfs generate crud Order --no-interactive");
    this.log(SECTION_DIVIDER);
  }
}
