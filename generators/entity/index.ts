/**
 * Générateur pour la commande 'sfs generate entity'
 * Permet de générer des entités et les composants associés (repository, service, controller)
 */

import { BaseGenerator } from "../base-generator.js";
import chalk from "chalk";
import path from "path";
import fs from "fs";
import pluralize from "pluralize";
import inquirer from "inquirer";
import { EntityField, EntityGeneratorOptions, EntityGeneratorAnswers, ProjectConfig } from "../types.js";

// Styles visuels constants
const STEP_PREFIX = chalk.bold.blue("➤ ");
const SECTION_DIVIDER = chalk.gray("────────────────────────────────────────────");
const INFO_COLOR = chalk.yellow;
const SUCCESS_COLOR = chalk.green;
const ERROR_COLOR = chalk.red;
const HELP_COLOR = chalk.gray.italic;

// Types disponibles pour les champs d'entité
const FIELD_TYPES = [
  { name: "String - Texte", value: "String" },
  { name: "Integer - Nombre entier", value: "Integer" },
  { name: "Long - Nombre entier long", value: "Long" },
  { name: "Float - Nombre décimal", value: "Float" },
  { name: "Double - Nombre décimal précis", value: "Double" },
  { name: "Boolean - Vrai/Faux", value: "Boolean" },
  { name: "Date - Date", value: "LocalDate" },
  { name: "DateTime - Date et heure", value: "LocalDateTime" },
  { name: "Time - Heure", value: "LocalTime" },
  { name: "Enum - Liste de valeurs fixes", value: "Enum" },
  { name: "BigDecimal - Nombre décimal pour calculs précis", value: "BigDecimal" },
  { name: "byte[] - Tableau d'octets (fichiers, images)", value: "byte[]" },
  { name: "UUID - Identifiant universel unique", value: "UUID" }
];

// Validateurs
function validateFieldName(input: string): boolean | string {
  if (!input) return "Le nom du champ est requis";
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(input)) {
    return "Le nom du champ doit commencer par une lettre et ne contenir que des lettres, chiffres et underscores";
  }
  if (["id", "class", "abstract", "interface", "enum"].includes(input.toLowerCase())) {
    return `'${input}' est un mot réservé Java`;
  }
  return true;
}

function validateEnumValues(input: string): boolean | string {
  if (!input) return "Les valeurs d'enum sont requises";
  const values = input.split(',').map(v => v.trim());
  for (const value of values) {
    if (!/^[A-Z][A-Z0-9_]*$/.test(value)) {
      return `'${value}' n'est pas valide. Les valeurs d'enum doivent être en MAJUSCULES et ne contenir que des lettres, chiffres et underscores`;
    }
  }
  return true;
}

export default class EntityGenerator extends BaseGenerator {
  // Utiliser une approche différente pour la déclaration des options
  declare options: any; // Type any pour contourner le problème de compatibilité
  declare answers: EntityGeneratorAnswers;
  declare projectConfig: ProjectConfig;
  // Initialiser les tableaux vides directement
  entityFields: EntityField[] = [];

  constructor(args: string | string[], opts: any) {
    super(args, opts);

    this.argument("entityName", {
      type: String,
      required: false,
      description: "Nom de l'entité à générer",
    });

    this.option("package", {
      type: String,
      alias: "p",
      description: "Package de base pour l'entité (ex: com.example.domain)",
    });

    this.option("interactive", {
      type: Boolean,
      default: true,
      description: "Mode interactif avec questions",
    });

    this.option("skip-repository", {
      type: Boolean,
      default: false,
      description: "Ne pas générer de repository",
    });

    this.option("skip-service", {
      type: Boolean,
      default: false,
      description: "Ne pas générer de service",
    });

    this.option("skip-controller", {
      type: Boolean,
      default: false,
      description: "Ne pas générer de controller",
    });

    this.option("skip-dto", {
      type: Boolean,
      default: false,
      description: "Ne pas générer de DTO",
    });
  }

  async initializing() {
    this.log(SECTION_DIVIDER);
    this.log(chalk.bold.blue("🧩 GÉNÉRATEUR D'ENTITÉS SPRING FULLSTACK"));
    this.log(SECTION_DIVIDER);
    this.log(HELP_COLOR("Ce générateur va créer une entité Java avec tous les composants associés"));
    this.log("");

    try {
      this.projectConfig = await this.readProjectConfig();

      if (!this.projectConfig) {
        this.log(ERROR_COLOR("❌ Impossible de trouver la configuration du projet. Assurez-vous d'être dans un projet Spring Fullstack."));
        process.exit(1);
      }
    } catch (error) {
      this.log(ERROR_COLOR(`❌ Erreur lors de l'initialisation: ${error}`));
      process.exit(1);
    }
  }

  /**
   * Affiche un message d'aide contextuelle
   */
  displayHelpMessage(message: string) {
    this.log(HELP_COLOR(`💡 ${message}`));
  }

  /**
   * Affiche un message de succès
   */
  displaySuccess(message: string) {
    this.log(SUCCESS_COLOR(`✅ ${message}`));
  }

  /**
   * Affiche un message d'erreur
   */
  displayError(message: string) {
    this.log(ERROR_COLOR(`❌ ${message}`));
  }

  /**
   * Récupérer la configuration du projet
   */
  async readProjectConfig() {
    try {
      const configPath = path.join(process.cwd(), '.yo-rc.json');
      if (fs.existsSync(configPath)) {
        const configContent = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configContent);
        return config['generator-spring-fullstack'] || null;
      }
      return null;
    } catch (error) {
      this.log(ERROR_COLOR(`Erreur lors de la lecture de la configuration: ${error}`));
      return null;
    }
  }

  async prompting() {
    if (!this.options.entityName || this.options.interactive) {
      this.log(SECTION_DIVIDER);
      this.log(STEP_PREFIX + chalk.bold("CONFIGURATION DE L'ENTITÉ"));
      this.log(SECTION_DIVIDER);

      // Questions de base pour l'entité
      const answers = await this.prompt<EntityGeneratorAnswers>([
        {
          type: "input",
          name: "entityName",
          message: chalk.cyan("Nom de l'entité:"),
          default: this.options.entityName,
          validate: (input: string) => {
            if (!input) return "Le nom de l'entité est requis";
            if (!/^[A-Z][a-zA-Z0-9]*$/.test(input)) {
              return "Le nom de l'entité doit commencer par une majuscule et ne contenir que des lettres et chiffres";
            }
            return true;
          }
        },
        {
          type: "input",
          name: "packageName",
          message: chalk.cyan("Package:"),
          default: () => this.options.package ||
                       (this.projectConfig ? `${this.projectConfig.packageName}.domain` : "com.example.domain"),
          validate: (input: string) => {
            if (!input) return "Le package est requis";
            if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/.test(input)) {
              return "Format de package invalide (ex: com.example.domain)";
            }
            return true;
          }
        },
        {
          type: "confirm",
          name: "generateRepository",
          message: chalk.cyan("Générer un repository?"),
          default: !this.options.skipRepository
        },
        {
          type: "confirm",
          name: "generateService",
          message: chalk.cyan("Générer un service?"),
          default: !this.options.skipService
        },
        {
          type: "confirm",
          name: "generateController",
          message: chalk.cyan("Générer un controller REST?"),
          default: !this.options.skipController
        },
        {
          type: "confirm",
          name: "generateDto",
          message: chalk.cyan("Générer des DTOs?"),
          default: !this.options.skipDto
        },
        {
          type: "confirm",
          name: "auditable",
          message: chalk.cyan("Ajouter des champs d'audit (createdBy, createdDate, etc.)?"),
          default: true
        }
      ]);

      this.answers = answers;

      // Demander à l'utilisateur de définir les champs de l'entité
      await this.askForFields();
    } else {
      this.answers = {
        entityName: this.options.entityName || '',
        packageName: this.options.package ||
                  (this.projectConfig ? `${this.projectConfig.packageName}.domain` : "com.example.domain"),
        generateRepository: !this.options.skipRepository,
        generateService: !this.options.skipService,
        generateController: !this.options.skipController,
        generateDto: !this.options.skipDto,
        auditable: true
      };

      // En mode non-interactif, on demanderait ici de définir les champs via un fichier JSON ou des arguments
      this.log(HELP_COLOR("Mode non-interactif: utilisez un fichier de définition d'entité ou ajoutez des champs manuellement plus tard."));
    }
  }

  /**
   * Demander à l'utilisateur de définir les champs de l'entité
   */
  async askForFields() {
    this.entityFields = [];

    this.log("");
    this.log(STEP_PREFIX + chalk.bold("DÉFINITION DES CHAMPS"));
    this.log(SECTION_DIVIDER);
    this.displayHelpMessage("Un champ 'id' de type Long sera automatiquement ajouté comme clé primaire");

    let addMore = true;

    while (addMore) {
      interface FieldAnswers {
        name: string;
        type: string;
        enumValues?: string;
        required: boolean;
        minLength?: string;
        maxLength?: string;
        min?: string;
        max?: string;
        unique: boolean;
      }

      const field = await this.prompt<FieldAnswers>([
        {
          type: "input",
          name: "name",
          message: chalk.cyan("Nom du champ:"),
          validate: validateFieldName
        },
        {
          type: "list",
          name: "type",
          message: chalk.cyan("Type de données:"),
          choices: FIELD_TYPES,
          pageSize: 13
        },
        {
          type: "input",
          name: "enumValues",
          message: chalk.cyan("Valeurs d'enum (séparées par des virgules):"),
          when: (answers: FieldAnswers) => answers.type === "Enum",
          validate: validateEnumValues
        },
        {
          type: "confirm",
          name: "required",
          message: chalk.cyan("Ce champ est-il requis?"),
          default: true
        },
        {
          type: "input",
          name: "minLength",
          message: chalk.cyan("Longueur minimale:"),
          default: "",
          when: (answers: FieldAnswers) => answers.type === "String",
          validate: (input: string) => {
            if (!input) return true;
            const num = parseInt(input);
            return isNaN(num) ? "Veuillez entrer un nombre valide" : true;
          }
        },
        {
          type: "input",
          name: "maxLength",
          message: chalk.cyan("Longueur maximale:"),
          default: "",
          when: (answers: FieldAnswers) => answers.type === "String",
          validate: (input: string) => {
            if (!input) return true;
            const num = parseInt(input);
            return isNaN(num) ? "Veuillez entrer un nombre valide" : true;
          }
        },
        {
          type: "input",
          name: "min",
          message: chalk.cyan("Valeur minimale:"),
          default: "",
          when: (answers: FieldAnswers) => ["Integer", "Long", "Float", "Double", "BigDecimal"].includes(answers.type),
          validate: (input: string) => {
            if (!input) return true;
            const num = parseFloat(input);
            return isNaN(num) ? "Veuillez entrer un nombre valide" : true;
          }
        },
        {
          type: "input",
          name: "max",
          message: chalk.cyan("Valeur maximale:"),
          default: "",
          when: (answers: FieldAnswers) => ["Integer", "Long", "Float", "Double", "BigDecimal"].includes(answers.type),
          validate: (input: string) => {
            if (!input) return true;
            const num = parseFloat(input);
            return isNaN(num) ? "Veuillez entrer un nombre valide" : true;
          }
        },
        {
          type: "confirm",
          name: "unique",
          message: chalk.cyan("Ce champ doit-il être unique?"),
          default: false
        }
      ]);

      // Ajouter le champ à la liste
      this.entityFields.push({
        name: field.name,
        type: field.type,
        required: field.required,
        unique: field.unique,
        minLength: field.minLength ? parseInt(field.minLength) : null,
        maxLength: field.maxLength ? parseInt(field.maxLength) : null,
        min: field.min ? parseFloat(field.min) : null,
        max: field.max ? parseFloat(field.max) : null,
        enumValues: field.type === "Enum" && field.enumValues ? field.enumValues.split(',').map((v: string) => v.trim()) : null
      });

      this.displaySuccess(`Champ '${field.name}' ajouté`);

      // Demander si l'utilisateur veut ajouter un autre champ
      const { addMoreFields } = await this.prompt<{addMoreFields: boolean}>({
        type: "confirm",
        name: "addMoreFields",
        message: chalk.cyan("Ajouter un autre champ?"),
        default: true
      });

      addMore = addMoreFields;
    }

    // Afficher un résumé des champs
    this.log("");
    this.log(STEP_PREFIX + chalk.bold("RÉSUMÉ DES CHAMPS"));
    this.log(SECTION_DIVIDER);

    this.entityFields.forEach((field, index) => {
      this.log(`${index + 1}. ${chalk.green(field.name)} : ${chalk.cyan(field.type)} ${field.required ? chalk.yellow('(requis)') : ''} ${field.unique ? chalk.yellow('(unique)') : ''}`);
    });
  }

  writing() {
    if (this.entityFields.length === 0 && this.options.interactive) {
      this.displayError("Aucun champ défini pour l'entité. Génération annulée.");
      return;
    }

    this.log("");
    this.log(STEP_PREFIX + chalk.bold("GÉNÉRATION DES FICHIERS"));
    this.log(SECTION_DIVIDER);

    const entityName = this.answers.entityName;
    const packagePath = this.answers.packageName.replace(/\./g, '/');

    // TODO: Générer ici les fichiers en utilisant les templates
    this.displayHelpMessage(`Génération des fichiers pour l'entité ${entityName}...`);

    // Génération simulée pour le moment
    this.displaySuccess(`Entité ${entityName}.java générée`);
    if (this.answers.generateRepository) {
      this.displaySuccess(`Repository ${entityName}Repository.java généré`);
    }
    if (this.answers.generateService) {
      this.displaySuccess(`Service ${entityName}Service.java généré`);
    }
    if (this.answers.generateController) {
      this.displaySuccess(`Controller ${entityName}Controller.java généré`);
    }
    if (this.answers.generateDto) {
      this.displaySuccess(`DTOs ${entityName}DTO.java générés`);
    }
  }

  end() {
    this.log("");
    this.log(SECTION_DIVIDER);
    this.displaySuccess(`L'entité ${this.answers.entityName} a été créée avec succès!`);
    this.log(SECTION_DIVIDER);
  }
}
