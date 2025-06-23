/**
 * Générateur pour la commande 'sfs generate entity'
 * Permet de générer des entités et les composants associés (repository, service, controller)
 */

import { BaseGenerator } from "../base-generator.js";
import chalk from "chalk";
import path from "path";
import fs from "fs";
import pluralize from "pluralize";
import { EntityField, EntityGeneratorAnswers, ProjectConfig } from "../types.js";

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

/**
 * Générateur d'entités Spring avec composants associés
 */
export class EntityGenerator extends BaseGenerator {
  // Déclarations pour le typechecking
  declare options: any;
  declare answers: EntityGeneratorAnswers;
  declare projectConfig: ProjectConfig | undefined;

  // Initialiser les tableaux vides
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
      default: "com.example.fullstack",
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
    }
  }

  /**
   * Affiche un message d'aide contextuelle
   */
  displayHelpMessage(message: string) {
    if (message) {
      this.log(HELP_COLOR(`💡 ${message}`));
    }
  }

  /**
   * Affiche un message de succès
   */
  displaySuccess(message: string) {
    if (message) {
      this.log(SUCCESS_COLOR(`✅ ${message}`));
    }
  }

  /**
   * Affiche un message d'erreur
   */
  displayError(message: string) {
    if (message) {
      this.log(ERROR_COLOR(`❌ ${message}`));
    }
  }

  // Méthode privée pour valider le nom d'entité
  private _validateEntityName(input: string): boolean | string {
    if (!input) return "Le nom de l'entité est requis";
    if (!/^[A-Z][a-zA-Z0-9]*$/.test(input)) {
      return "Le nom de l'entité doit commencer par une majuscule (PascalCase) et ne contenir que des lettres et des chiffres";
    }
    return true;
  }

  // Méthode privée pour charger la configuration du projet
  private _loadProjectConfig(): ProjectConfig | undefined {
    try {
      // Rechercher un fichier pom.xml ou build.gradle pour inférer la configuration du projet
      const pomExists = fs.existsSync(path.join(process.cwd(), 'pom.xml'));
      const gradleExists = fs.existsSync(path.join(process.cwd(), 'build.gradle')) ||
        fs.existsSync(path.join(process.cwd(), 'build.gradle.kts'));

      if (!pomExists && !gradleExists) {
        return undefined;
      }

      // Configuration par défaut
      return {
        appName: path.basename(process.cwd()),
        packageName: "com.example.fullstack", // Valeur par défaut
        buildTool: pomExists ? "maven" : "gradle",
        database: "h2", // Valeur par défaut
        frontendFramework: "none", // Valeur par défaut
        authEnabled: false,
        authType: "none",
        features: []
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

    // Déterminer le package de base de manière robuste
    const basePackage = opts.package
      || (this.projectConfig?.packageName ? `${this.projectConfig.packageName}` : 'com.example.fullstack');

    const answers: Partial<EntityGeneratorAnswers> = {
      entityName: opts.entityName,
      packageName: basePackage,
    };

    // Ne procéder aux questions que si le mode interactif est activé (par défaut)
    if (opts.interactive !== false) {
      // Questions pour l'entité
      this.log(chalk.bold.blue("\n🏗️ PARAMÈTRES DE L'ENTITÉ"));

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
          default: () => basePackage,
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

      // Lancer les questions
      Object.assign(answers, await this.prompt(entityQuestions));
    }

    // Stocker les réponses pour une utilisation ultérieure
    this.answers = answers as EntityGeneratorAnswers;
  }

  /**
   * Demander à l'utilisateur de définir les champs de l'entité
   */
  async askForFields() {
    this.entityFields = [];

    // Debug : afficher les réponses actuelles pour vérifier la présence de packageName
    this.log(INFO_COLOR(`[DEBUG askForFields] this.answers = ${JSON.stringify(this.answers)}`));

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
          when: (answers) => answers.type === "Enum",
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
          when: (answers) => answers.type === "String",
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
          when: (answers) => answers.type === "String",
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
          when: (answers) => ["Integer", "Long", "Float", "Double", "BigDecimal"].includes(answers.type ?? ""),
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
          when: (answers) => ["Integer", "Long", "Float", "Double", "BigDecimal"].includes(answers.type ?? ""),
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
   * Utilitaire robuste pour obtenir le package complet sans risque d'erreur
   */
  getSubPackage(base: string | undefined, sub: string | undefined): string {
    // Validation et correction du paramètre base
    let baseValue = base || '';
    if (!base || base === 'undefined') {
      baseValue = this.answers?.packageName ||
             this.options.package ||
             (this.projectConfig?.packageName ? this.projectConfig.packageName : 'com.example.fullstack');
    }

    // Validation et correction du paramètre sub
    let subValue = sub || 'entity';
    if (!sub || sub === 'undefined') {
      // rien
    }

    // Nettoyage final (maintenant sûr car baseValue et subValue ne peuvent pas être undefined)
    baseValue = baseValue.trim();
    subValue = subValue.trim();

    // Construction du résultat
    const result = baseValue.endsWith(`.${subValue}`) ? baseValue : `${baseValue}.${subValue}`;
    return result;
  }

  async writing() {
    try {
      this.log(chalk.blue("Génération des fichiers en cours..."));

      // S'assurer que les champs sont bien définis
      if (!this.entityFields || this.entityFields.length === 0) {
        await this.askForFields();
      }

      // Récupérer et sécuriser les informations importantes
      const entityName = this.answers.entityName || 'Example';
      const packageName = this.answers.packageName || 'com.example.fullstack';

      // Définir directement les packages sans utiliser getSubPackage
      const entityPackage = `${packageName}.entity`;
      const repositoryPackage = `${packageName}.repository`;
      const servicePackage = `${packageName}.service`;
      const controllerPackage = `${packageName}.controller`;
      const dtoPackage = `${packageName}.dto`;

      // Générer les chemins des répertoires
      const basePath = "src/main/java";
      const entityPath = entityPackage.replace(/\./g, '/');
      const repositoryPath = repositoryPackage.replace(/\./g, '/');
      const servicePath = servicePackage.replace(/\./g, '/');
      const controllerPath = controllerPackage.replace(/\./g, '/');
      const dtoPath = dtoPackage.replace(/\./g, '/');

      // Chemins complets des répertoires
      const entityDir = path.join(basePath, entityPath);
      const repositoryDir = path.join(basePath, repositoryPath);
      const serviceDir = path.join(basePath, servicePath);
      const controllerDir = path.join(basePath, controllerPath);
      const dtoDir = path.join(basePath, dtoPath);

      // Création des répertoires de manière sécurisée
      this._createDirectorySafely(entityDir);
      if (this.answers.generateRepository) {
        this._createDirectorySafely(repositoryDir);
      }
      if (this.answers.generateService) {
        this._createDirectorySafely(serviceDir);
      }
      if (this.answers.generateController) {
        this._createDirectorySafely(controllerDir);
      }
      if (this.answers.generateDto) {
        this._createDirectorySafely(dtoDir);
      }

      // Trouver les chemins des templates
      const templatesDir = this.templatePath();
      const entityTemplate = path.join(templatesDir, 'Entity.java.ejs');
      const repositoryTemplate = path.join(templatesDir, 'Repository.java.ejs');
      const serviceTemplate = path.join(templatesDir, 'Service.java.ejs');
      const serviceImplTemplate = path.join(templatesDir, 'ServiceImpl.java.ejs');
      const controllerTemplate = path.join(templatesDir, 'Controller.java.ejs');
      const dtoTemplate = path.join(templatesDir, 'EntityDTO.java.ejs');

      // Préparer les données pour les templates
      const templateData = {
        entityName,
        packageName: entityPackage,
        fields: this.entityFields,
        auditable: this.answers.auditable,
        dateTimeImport: this.hasDateTimeFields(),
        bigDecimalImport: this.hasBigDecimalFields(),
      };

      // Fonction sécurisée pour générer les fichiers
      const generateFile = (sourcePath, targetPath, data) => {
        try {
          if (!fs.existsSync(sourcePath)) {
            return false;
          }

          // Assurer que le répertoire parent existe
          const targetDir = path.dirname(targetPath);
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }

          // S'assurer que toutes les variables requises par les templates existent
          const safeData = {
            ...data,
            imports: data.imports || [],
            validators: data.validators || [],
            annotations: data.annotations || [],
            constructorItems: data.constructorItems || [],
            gettersSetters: data.gettersSetters || []
          };

          // Utiliser fs.copyFileSync pour copier physiquement le template vers un fichier temporaire
          const tempFile = path.join(targetDir, `temp_${Date.now()}.ejs`);
          fs.copyFileSync(sourcePath, tempFile);

          // Puis utiliser this.fs.copyTpl qui est plus fiable pour le rendu
          this.fs.copyTpl(tempFile, targetPath, safeData);

          // Supprimer le fichier temporaire
          if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
          }

          return true;
        } catch (error) {
          return false;
        }
      };

      this.log("");
      this.log(STEP_PREFIX + chalk.bold("GÉNÉRATION DES FICHIERS"));
      this.log(SECTION_DIVIDER);

      // Générer l'entité
      const entityFilePath = path.join(entityDir, `${entityName}.java`);
      if (generateFile(entityTemplate, entityFilePath, templateData)) {
        this.displaySuccess(`Entité ${entityName}.java générée`);
      }

      // Repository
      if (this.answers.generateRepository) {
        const repositoryFilePath = path.join(repositoryDir, `${entityName}Repository.java`);
        if (generateFile(
          repositoryTemplate,
          repositoryFilePath,
          {
            ...templateData,
            packageName: repositoryPackage,
            entityPackageName: entityPackage
          }
        )) {
          this.displaySuccess(`Repository ${entityName}Repository.java généré`);
        }
      }

      // Service
      if (this.answers.generateService) {
        const serviceFilePath = path.join(serviceDir, `${entityName}Service.java`);
        if (generateFile(
          serviceTemplate,
          serviceFilePath,
          {
            ...templateData,
            packageName: servicePackage,
            entityPackageName: entityPackage,
            repositoryPackageName: repositoryPackage
          }
        )) {
          this.displaySuccess(`Service ${entityName}Service.java généré`);
        }

        const serviceImplFilePath = path.join(serviceDir, `${entityName}ServiceImpl.java`);
        if (generateFile(
          serviceImplTemplate,
          serviceImplFilePath,
          {
            ...templateData,
            packageName: servicePackage,
            entityPackageName: entityPackage,
            repositoryPackageName: repositoryPackage
          }
        )) {
          this.displaySuccess(`Implémentation ${entityName}ServiceImpl.java générée`);
        }
      }

      // Controller
      if (this.answers.generateController) {
        const controllerFilePath = path.join(controllerDir, `${entityName}Controller.java`);
        if (generateFile(
          controllerTemplate,
          controllerFilePath,
          {
            ...templateData,
            packageName: controllerPackage,
            entityPackageName: entityPackage,
            servicePackageName: servicePackage,
            dtoPackageName: dtoPackage,
            useDto: this.answers.generateDto,
            entityNamePlural: pluralize(entityName),
            entityNameLower: entityName.charAt(0).toLowerCase() + entityName.slice(1)
          }
        )) {
          this.displaySuccess(`Controller ${entityName}Controller.java généré`);
        }
      }

      // DTO
      if (this.answers.generateDto) {
        const dtoFilePath = path.join(dtoDir, `${entityName}DTO.java`);
        if (generateFile(
          dtoTemplate,
          dtoFilePath,
          {
            ...templateData,
            packageName: dtoPackage,
            entityPackageName: entityPackage
          }
        )) {
          this.displaySuccess(`DTO ${entityName}DTO.java généré`);
        }
      }

      this.log("");
      this.log(SUCCESS_COLOR(`✅ Génération de l'entité ${entityName} et de ses composants terminée avec succès!`));
    } catch (error:any) {
      this.displayError(`Erreur lors de la génération des fichiers: ${error}`);
      this.log(ERROR_COLOR(`Stack trace: ${error.stack}`));
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
   * Méthode sécurisée pour créer un répertoire - remplace ensureDirectoryExists
   * @param dirPath Chemin du répertoire à créer
   * @private
   */
  private _createDirectorySafely(dirPath: string): void {
    try {
      if (!dirPath) {
        this.log(INFO_COLOR(`[SÉCURITÉ] Tentative de création d'un répertoire avec un chemin vide ou undefined`));
        return;
      }

      const cleanPath = dirPath.trim();
      if (!fs.existsSync(cleanPath)) {
        fs.mkdirSync(cleanPath, { recursive: true });
        this.log(chalk.yellow(`📁 Création du répertoire: ${cleanPath}`));
      } else {
        this.log(INFO_COLOR(`📁 Répertoire existe déjà: ${cleanPath}`));
      }
    } catch (error) {
      // Log mais ne plante pas l'application
      this.log(ERROR_COLOR(`[ERREUR] Impossible de créer le répertoire ${dirPath}: ${error}`));
      // Les erreurs de création de répertoire ne doivent pas arrêter la génération de fichiers
    }
  }

  /**
   * Résout correctement un chemin de template pour éviter les erreurs undefined
   */
  resolveTemplatePath(relPath: string): string | null {
    // Assurons-nous que le chemin n'est jamais undefined
    if (!relPath) {
     // this.log(ERROR_COLOR(`[ERREUR] Chemin de template invalide: ${relPath}`));
      return null;
    }

    try {
      // Utiliser les méthodes de Yeoman pour résoudre le chemin
      const templatePath = this.templatePath(relPath);

      // Vérifier si le template existe
      if (this.fs.exists(templatePath)) {
        return templatePath;
      } else {
        // Tentative de récupération avec chemin absolu
        const alternativePath = path.join(
          __dirname,
          'templates',
          relPath.replace(/^entity\//, '')
        );

        if (fs.existsSync(alternativePath)) {
          return alternativePath;
        }

        this.log(ERROR_COLOR(`[ERREUR] Template introuvable: ${relPath}, ni à ${alternativePath}`));
        return null;
      }
    } catch (error) {
      this.log(ERROR_COLOR(`[ERREUR] Erreur lors de la résolution du chemin ${relPath}: ${error}`));
      return null;
    }
  }

  /**
   * Render un template EJS et écrit le résultat dans un fichier avec gestion robuste des erreurs
   * Cette méthode a été neutralisée pour éviter les erreurs avec templatePath undefined
   */
  renderTemplate(templatePath: string, destPath: string, data: any): void {
    //this.log(INFO_COLOR(`[DEBUG] renderTemplate ignoré - nous utilisons la méthode générative directe à la place`));

    // Ne rien faire si les paramètres sont invalides - ceci évite l'erreur fatale
    if (!templatePath || !destPath) {
    //  this.log(INFO_COLOR(`[INFO] Appel à renderTemplate ignoré (paramètres invalides) - utiliser writing() à la place`));
      // Ne pas lancer d'erreur pour éviter le plantage complet du générateur
      return;
    }

    // Si les paramètres sont valides, essayer de générer le fichier avec la méthode qui fonctionne
    try {
      const resolvedTemplatePath = this.resolveTemplatePath(templatePath);
      if (resolvedTemplatePath) {
        this._generateFile(resolvedTemplatePath, destPath, data);
      }
    } catch (error) {
      this.log(ERROR_COLOR(`[AVERTISSEMENT] renderTemplate - problème ignoré: ${error}`));
      // Ne pas propager l'erreur pour éviter le plantage
    }
  }

  /**
   * Méthode privée pour générer un fichier à partir d'un template
   * Extrait de la méthode writing() qui fonctionne correctement
   */
  private _generateFile(sourcePath: string, targetPath: string, data: any): boolean {
    try {
      this.log(INFO_COLOR(`[DEBUG] Génération de fichier: ${targetPath}`));
      if (!fs.existsSync(sourcePath)) {
        this.log(ERROR_COLOR(`[ERREUR] Le template n'existe pas: ${sourcePath}`));
        return false;
      }

      // Assurer que le répertoire parent existe
      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // S'assurer que toutes les variables requises par les templates existent
      const safeData = {
        ...data,
        // Initialiser les variables manquantes pour éviter les erreurs ReferenceError
        imports: data.imports || [],
        validators: data.validators || [],
        annotations: data.annotations || [],
        constructorItems: data.constructorItems || [],
        gettersSetters: data.gettersSetters || []
      };

      // Utiliser fs.copyFileSync pour copier physiquement le template vers un fichier temporaire
      const tempFile = path.join(targetDir, `temp_${Date.now()}.ejs`);
      fs.copyFileSync(sourcePath, tempFile);

      // Puis utiliser this.fs.copyTpl qui est plus fiable pour le rendu
      this.fs.copyTpl(tempFile, targetPath, safeData);

      // Supprimer le fichier temporaire
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }

      this.log(SUCCESS_COLOR(`✅ Fichier généré avec succès: ${targetPath}`));
      return true;
    } catch (error) {
      this.log(ERROR_COLOR(`[ERREUR] Échec de génération de ${targetPath}: ${error}`));
      return false;
    }
  }
}

// Exporter également en tant que default pour compatibilité avec le système de modules ESM
export default EntityGenerator;
