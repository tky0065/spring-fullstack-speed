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

// Assurez-vous d'exporter correctement la classe pour qu'elle soit compatible avec CommonJS et ESM
export class EntityGenerator extends BaseGenerator {
  // Utiliser une approche différente pour la déclaration des options
  declare options: any; // Type any pour contourner le problème de compatibilité
  declare answers: EntityGeneratorAnswers;
  declare projectConfig: ProjectConfig | undefined;
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

  initializing() {
    this.log(SECTION_DIVIDER);
    this.log(chalk.bold.blue("🧩 GÉNÉRATEUR D'ENTITÉS SPRING FULLSTACK"));
    this.log(SECTION_DIVIDER);
    this.log(HELP_COLOR("Ce générateur va créer une entité Java avec tous les composants associés"));
    this.log("");

    // Charger la configuration du projet si disponible
    this.projectConfig = this._loadProjectConfig();

    // Vérifier si un projet existe dans le dossier courant
    if (!this.projectConfig) {
      this.log(ERROR_COLOR("❌ Aucun projet Spring Boot n'a été détecté dans ce dossier."));
      this.log(INFO_COLOR("💡 Assurez-vous d'être dans un projet Spring Boot créé avec SFS avant d'utiliser cette commande."));
      // Continuer tout de même pour l'utilisateur
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

  // Ajouter une méthode privée pour valider le nom d'entité
  private _validateEntityName(input: string): boolean | string {
    if (!input) return "Le nom de l'entité est requis";
    if (!/^[A-Z][a-zA-Z0-9]*$/.test(input)) {
      return "Le nom de l'entité doit commencer par une majuscule (PascalCase) et ne contenir que des lettres et des chiffres";
    }
    return true;
  }

  // Ajouter une méthode privée pour charger la configuration du projet
  private _loadProjectConfig(): ProjectConfig | undefined {
    try {
      // Rechercher un fichier pom.xml ou build.gradle pour inférer la configuration du projet
      const pomExists = fs.existsSync(path.join(process.cwd(), 'pom.xml'));
      const gradleExists = fs.existsSync(path.join(process.cwd(), 'build.gradle')) ||
        fs.existsSync(path.join(process.cwd(), 'build.gradle.kts'));

      if (!pomExists && !gradleExists) {
        return undefined;
      }

      // Configuration par défaut complète
      return {
        appName: path.basename(process.cwd()),
        packageName: "com.example.app", // Valeur par défaut à remplacer par une détection réelle
        buildTool: pomExists ? "maven" : "gradle",
        database: "h2", // Valeur par défaut
        frontendFramework: "none", // Valeur par défaut
        authEnabled: false, // Valeur par défaut
        authType: "none", // Valeur par défaut optionnelle
        features: [] // Tableau vide pour les fonctionnalités
      };
    } catch (error) {
      this.log(chalk.red(`Erreur lors du chargement de la configuration: ${error}`));
      return undefined;
    }
  }

  async prompting() {
    this.log(chalk.cyan("Démarrage du processus de création d'entité..."));

    // Préparer les réponses avec les options CLI ou les valeurs par défaut
    const opts = this.options;
    const answers: Partial<EntityGeneratorAnswers> = {
      entityName: opts.entityName,
      packageName: opts.package || (this.projectConfig?.packageName ? `${this.projectConfig.packageName}.domain` : undefined),
      // Ajouter d'autres valeurs par défaut si nécessaire...
    };

    // Ne procéder aux questions que si le mode interactif est activé (par défaut)
    if (opts.interactive !== false) {
      // Questions pour l'entité
      this.log(chalk.bold.blue("\n🏗️ PARAMÈTRES DE L'ENTITÉ"));

      // Utiliser le typage générique pour résoudre le problème de compatibilité
      const entityQuestions: Array<any> = [
        {
          type: "input",
          name: "entityName",
          message: "Nom de l'entité (PascalCase):",
          default: answers.entityName || "Example",
          validate: this._validateEntityName
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
      ];

      // Lancer les questions avec le typage corrigé
      Object.assign(answers, await this.prompt(entityQuestions as any));

      // Vous pouvez ajouter d'autres séries de questions ici...
    }

    // Stocker les réponses pour une utilisation ultérieure
    this.answers = answers as EntityGeneratorAnswers;
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
      const { addMoreFields } = await this.prompt<{ addMoreFields: boolean }>({
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

  /**
   * Génère les fichiers pour l'entité et ses composants associés
   */
  writing() {
    const { entityName, packageName, generateRepository, generateService, generateController, generateDto, auditable } = this.answers;

    if (!entityName) {
      this.displayError("Nom de l'entité non défini. Génération annulée.");
      return;
    }

    // Créer le chemin du package pour les fichiers Java
    const packagePath = packageName.replace(/\./g, '/');
    const mainDir = `src/main/java/${packagePath}`;

    // Préparer les données communes pour les templates
    const templateData = {
      entityName,
      packageName,
      fields: this.entityFields,
      auditable,
      dateTimeImport: this.hasDateTimeFields(),
      bigDecimalImport: this.hasBigDecimalFields(),
    };

    this.log("");
    this.log(STEP_PREFIX + chalk.bold("GÉNÉRATION DES FICHIERS"));
    this.log(SECTION_DIVIDER);

    try {
      // Créer les répertoires nécessaires
      this.ensureDirectoryExists(mainDir);
      const entityDir = `${mainDir}/entity`;
      this.ensureDirectoryExists(entityDir);

      // Générer le fichier d'entité
      this.renderTemplate(
        'entity/Entity.java.ejs',
        `${entityDir}/${entityName}.java`,
        templateData
      );
      this.displaySuccess(`Entité ${entityName}.java générée`);

      // Générer le Repository si demandé
      if (generateRepository) {
        const repositoryPackageName = packageName.replace(/\.entity$|\.domain$/, '.repository');
        const repositoryPackagePath = repositoryPackageName.replace(/\./g, '/');
        const repositoryDir = `src/main/java/${repositoryPackagePath}`;
        this.ensureDirectoryExists(repositoryDir);

        this.renderTemplate(
          'repository/Repository.java.ejs',
          `${repositoryDir}/${entityName}Repository.java`,
          {
            ...templateData,
            packageName: repositoryPackageName,
            entityPackageName: packageName
          }
        );
        this.displaySuccess(`Repository ${entityName}Repository.java généré`);
      }

      // Générer le Service si demandé
      if (generateService) {
        const servicePackageName = packageName.replace(/\.entity$|\.domain$/, '.service');
        const servicePackagePath = servicePackageName.replace(/\./g, '/');
        const serviceDir = `src/main/java/${servicePackagePath}`;
        this.ensureDirectoryExists(serviceDir);

        // Interface du service
        this.renderTemplate(
          'service/Service.java.ejs',
          `${serviceDir}/${entityName}Service.java`,
          {
            ...templateData,
            packageName: servicePackageName,
            entityPackageName: packageName,
            repositoryPackageName: packageName.replace(/\.entity$|\.domain$/, '.repository')
          }
        );

        // Implémentation du service
        this.renderTemplate(
          'service/ServiceImpl.java.ejs',
          `${serviceDir}/${entityName}ServiceImpl.java`,
          {
            ...templateData,
            packageName: servicePackageName,
            entityPackageName: packageName,
            repositoryPackageName: packageName.replace(/\.entity$|\.domain$/, '.repository')
          }
        );
        this.displaySuccess(`Service ${entityName}Service.java et implémentation générés`);
      }

      // Générer le Controller si demandé
      if (generateController) {
        const controllerPackageName = packageName.replace(/\.entity$|\.domain$/, '.controller');
        const controllerPackagePath = controllerPackageName.replace(/\./g, '/');
        const controllerDir = `src/main/java/${controllerPackagePath}`;
        this.ensureDirectoryExists(controllerDir);

        this.renderTemplate(
          'controller/Controller.java.ejs',
          `${controllerDir}/${entityName}Controller.java`,
          {
            ...templateData,
            packageName: controllerPackageName,
            entityPackageName: packageName,
            servicePackageName: packageName.replace(/\.entity$|\.domain$/, '.service'),
            dtoPackageName: packageName.replace(/\.entity$|\.domain$/, '.dto'),
            useDto: generateDto,
            entityNamePlural: pluralize(entityName),
            entityNameLower: entityName.charAt(0).toLowerCase() + entityName.slice(1)
          }
        );
        this.displaySuccess(`Controller ${entityName}Controller.java généré`);
      }

      // Générer le DTO si demandé
      if (generateDto) {
        const dtoPackageName = packageName.replace(/\.entity$|\.domain$/, '.dto');
        const dtoPackagePath = dtoPackageName.replace(/\./g, '/');
        const dtoDir = `src/main/java/${dtoPackagePath}`;
        this.ensureDirectoryExists(dtoDir);

        this.renderTemplate(
          'dto/EntityDTO.java.ejs',
          `${dtoDir}/${entityName}DTO.java`,
          {
            ...templateData,
            packageName: dtoPackageName,
            entityPackageName: packageName
          }
        );
        this.displaySuccess(`DTO ${entityName}DTO.java généré`);
      }

      // Génération réussie
      this.log("");
      this.log(SUCCESS_COLOR(`✅ Génération de l'entité ${entityName} et de ses composants terminée avec succès!`));

    } catch (error) {
      this.displayError(`Erreur lors de la génération des fichiers: ${error}`);
    }
  }

  /**
   * Vérifie si l'entité a des champs de type date/heure
   */
  hasDateTimeFields(): boolean {
    return this.entityFields.some(field =>
      ['LocalDate', 'LocalDateTime', 'LocalTime', 'ZonedDateTime', 'Instant', 'Date'].includes(field.type)
    );
  }

  /**
   * Vérifie si l'entité a des champs de type BigDecimal
   */
  hasBigDecimalFields(): boolean {
    return this.entityFields.some(field => field.type === 'BigDecimal');
  }

  /**
   * Assure que le répertoire existe
   */
  ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      this.log(chalk.yellow(`📁 Création du répertoire: ${dirPath}`));
    }
  }

  /**
   * Render un template EJS et écrit le résultat dans un fichier
   */
  renderTemplate(templatePath: string, destPath: string, data: any): void {
    this.fs.copyTpl(
      this.templatePath(templatePath),
      this.destinationPath(destPath),
      data
    );
  }
}

// Exporter également en tant que default pour compatibilité avec le système de modules ESM
export default EntityGenerator;

// Assurer la compatibilité avec CommonJS
module.exports = EntityGenerator;
module.exports.default = EntityGenerator;
