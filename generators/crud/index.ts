import { BaseGenerator } from "../base-generator.js";
import chalk from "chalk";
import fs from "fs";
import path from "path";

// Styles visuels constants
const STEP_PREFIX = chalk.bold.blue("➤ ");
const SECTION_DIVIDER = chalk.gray("────────────────────────────────────────────");
const INFO_COLOR = chalk.yellow;
const SUCCESS_COLOR = chalk.green;
const ERROR_COLOR = chalk.red;

/**
 * Générateur de CRUD pour les entités
 * Permet de générer automatiquement les opérations CRUD pour une entité existante
 */
export default class CrudGenerator extends BaseGenerator {
  declare answers: any;
  packageName: string = "";
  entityFile: string | null = null;

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
        validate: (input: string[]) => {
          if (!input || input.length === 0) {
            return "Vous devez sélectionner au moins une opération.";
          }
          return true;
        },
      },
      {
        type: "confirm",
        name: "generateDtos",
        message: "Voulez-vous générer des DTOs pour cette entité?",
        default: true,
      },
    ];

    this.answers = await this.prompt(prompts);

    // Rechercher le fichier de l'entité pour en extraire le package
    this.entityFile = this.findEntityFile(this.answers.entityName);
    if (this.entityFile) {
      const packageName = this.extractPackageName(this.entityFile);
      if (packageName) {
        this.packageName = packageName;
      }
    }

    // Si on ne trouve pas le package, utiliser un package par défaut
    if (!this.packageName) {
      this.packageName = this.findBasePackageName();
    }
  }

  configuring() {
    this.log("Configuration du CRUD...");
  }

  writing() {
    this.log("Génération des fichiers CRUD...");

    const { entityName, operations, generateDtos } = this.answers;

    // Si le DTO est demandé, générer le DTO en premier
    if (generateDtos) {
      this._generateDto(entityName);
    }

    // Générer le repository
    this._generateRepository(entityName);

    // Générer le service
    this._generateService(entityName, operations);

    // Générer le controller
    this._generateController(entityName, operations, generateDtos);
  }

  /**
   * Génère un DTO pour l'entité
   */
  _generateDto(entityName: string) {
    // Préparer les données du template
    const templateData = {
      entityName,
      packageName: `${this.packageName.replace(/\.entity|\.domain/, '.dto')}`,
      className: `${entityName}DTO`,
      fields: this._extractEntityFields(),
      imports: []
    };

    // Créer le répertoire pour le DTO
    const dtoDir = path.join(process.cwd(), 'src/main/java', templateData.packageName.replace(/\./g, '/'));
    this._createDirectoryIfNotExists(dtoDir);

    // Générer le fichier DTO
    const dtoPath = path.join(dtoDir, `${entityName}DTO.java`);

    // Ne pas écraser le fichier s'il existe déjà
    if (!fs.existsSync(dtoPath)) {
      this.renderEjsTemplate('EntityDTO.java.ejs', dtoPath, templateData);
      this.log(SUCCESS_COLOR(`✅ DTO ${entityName}DTO.java généré avec succès`));
    } else {
      this.log(INFO_COLOR(`⚠️ Le fichier ${entityName}DTO.java existe déjà et n'a pas été écrasé.`));
    }
  }

  /**
   * Génère le repository pour l'entité
   */
  _generateRepository(entityName: string) {
    // Préparer les données du template
    const templateData = {
      entityName,
      packageName: `${this.packageName.replace(/\.entity|\.domain|\.model/, '.repository')}`,
      entityPackageName: this.packageName
    };

    // Créer le répertoire pour le repository
    const repositoryDir = path.join(process.cwd(), 'src/main/java', templateData.packageName.replace(/\./g, '/'));
    this._createDirectoryIfNotExists(repositoryDir);

    // Générer le repository
    const repositoryPath = path.join(repositoryDir, `${entityName}Repository.java`);

    // Ne pas écraser le fichier s'il existe déjà
    if (!fs.existsSync(repositoryPath)) {
      this.renderEjsTemplate('Repository.java.ejs', repositoryPath, templateData);
      this.log(SUCCESS_COLOR(`✅ Repository ${entityName}Repository.java généré avec succès`));
    } else {
      this.log(INFO_COLOR(`⚠️ Le fichier ${entityName}Repository.java existe déjà et n'a pas été écrasé.`));
    }
  }

  /**
   * Génère le service pour l'entité avec les opérations CRUD sélectionnées
   */
  _generateService(entityName: string, operations: string[]) {
    // Préparer les données du template
    const templateData = {
      entityName,
      packageName: `${this.packageName.replace(/\.entity|\.domain|\.model/, '.service')}`,
      repositoryPackageName: `${this.packageName.replace(/\.entity|\.domain|\.model/, '.repository')}`,
      entityPackageName: this.packageName,
      dtoPackageName: `${this.packageName.replace(/\.entity|\.domain|\.model/, '.dto')}`,
      operations,
      includeCreate: operations.includes('create'),
      includeRead: operations.includes('read'),
      includeUpdate: operations.includes('update'),
      includeDelete: operations.includes('delete')
    };

    // Créer le répertoire pour le service et son implémentation
    const serviceDir = path.join(process.cwd(), 'src/main/java', templateData.packageName.replace(/\./g, '/'));
    this._createDirectoryIfNotExists(serviceDir);

    // Générer l'interface du service
    const serviceInterfacePath = path.join(serviceDir, `${entityName}Service.java`);

    // Ne pas écraser le fichier s'il existe déjà
    if (!fs.existsSync(serviceInterfacePath)) {
      this.renderEjsTemplate('Service.java.ejs', serviceInterfacePath, templateData);
      this.log(SUCCESS_COLOR(`✅ Service ${entityName}Service.java généré avec succès`));
    } else {
      this.log(INFO_COLOR(`⚠️ Le fichier ${entityName}Service.java existe déjà et n'a pas été écrasé.`));
    }

    // Générer l'implémentation du service
    const serviceImplPath = path.join(serviceDir, `${entityName}ServiceImpl.java`);

    // Ne pas écraser le fichier s'il existe déjà
    if (!fs.existsSync(serviceImplPath)) {
      this.renderEjsTemplate('ServiceImpl.java.ejs', serviceImplPath, templateData);
      this.log(SUCCESS_COLOR(`✅ Service impl ${entityName}ServiceImpl.java généré avec succès`));
    } else {
      this.log(INFO_COLOR(`⚠️ Le fichier ${entityName}ServiceImpl.java existe déjà et n'a pas été écrasé.`));
    }
  }

  /**
   * Génère le contrôleur pour l'entité avec les opérations CRUD sélectionnées
   */
  async _generateController(entityName: string, operations: string[], useDtos: boolean) {
    // Préparer les données du template
    const templateData = {
      entityName,
      packageName: `${this.packageName.replace(/\.entity|\.domain|\.model/, '.controller')}`,
      servicePackageName: `${this.packageName.replace(/\.entity|\.domain|\.model/, '.service')}`,
      entityPackageName: this.packageName,
      dtoPackageName: `${this.packageName.replace(/\.entity|\.domain|\.model/, '.dto')}`,
      operations,
      useDtos,
      includeCreate: operations.includes('create'),
      includeRead: operations.includes('read'),
      includeUpdate: operations.includes('update'),
      includeDelete: operations.includes('delete'),
      lowercaseEntityName: entityName.charAt(0).toLowerCase() + entityName.slice(1)
    };

    // Créer le répertoire pour le controller
    const controllerDir = path.join(process.cwd(), 'src/main/java', templateData.packageName.replace(/\./g, '/'));
    this._createDirectoryIfNotExists(controllerDir);

    // Générer le controller
    const controllerPath = path.join(controllerDir, `${entityName}Controller.java`);

    // Ne pas écraser le fichier s'il existe déjà
    if (!fs.existsSync(controllerPath)) {
      await this.renderEjsTemplate('Controller.java.ejs', controllerPath, templateData);
      this.log(SUCCESS_COLOR(`✅ Controller ${entityName}Controller.java généré avec succès`));
    } else {
      this.log(INFO_COLOR(`⚠️ Le fichier ${entityName}Controller.java existe déjà et n'a pas été écrasé.`));
    }
  }

  /**
   * Utilitaire pour créer un répertoire s'il n'existe pas
   */
  _createDirectoryIfNotExists(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Extrait les champs de l'entité pour générer le DTO
   */
  _extractEntityFields() {
    // Si nous n'avons pas le fichier de l'entité, retourner un tableau vide
    if (!this.entityFile) return [];

    try {
      const content = fs.readFileSync(this.entityFile, 'utf8');
      // Définir explicitement le type du tableau pour éviter l'erreur "not assignable to parameter of type never"
      const fields: Array<{ name: string; type: string; required: boolean }> = [];

      // Pattern pour correspondre aux champs (très simplifié)
      const fieldPattern = /private\s+(\S+)\s+(\S+);/g;
      let match;

      while ((match = fieldPattern.exec(content)) !== null) {
        const type = match[1];
        const name = match[2];

        // Ignorer les champs standard d'audit
        if (name !== 'id' && !name.includes("createdBy") && !name.includes("createdDate") &&
            !name.includes("lastModifiedBy") && !name.includes("lastModifiedDate")) {
          fields.push({
            name,
            type,
            required: content.includes(`@NotNull`) || content.includes(`@NotBlank`),
          });
        }
      }

      return fields;
    } catch (error) {
      this.log(ERROR_COLOR(`Erreur lors de l'extraction des champs: ${error}`));
      return [];
    }
  }

  /**
   * Recherche un fichier d'entité dans le projet
   */
  findEntityFile(entityName: string): string | null {
    try {
      const rootDir = process.cwd();
      const srcDir = path.join(rootDir, 'src/main/java');

      if (!fs.existsSync(srcDir)) {
        return null;
      }

      // Recherche récursive du fichier d'entité
      const findFile = (dir: string, fileName: string): string | null => {
        const items = fs.readdirSync(dir);

        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stats = fs.statSync(fullPath);

          if (stats.isDirectory()) {
            const found = findFile(fullPath, fileName);
            if (found) return found;
          } else if (item === `${fileName}.java`) {
            return fullPath;
          }
        }

        return null;
      };

      return findFile(srcDir, entityName);
    } catch (error) {
      this.log(ERROR_COLOR(`Erreur lors de la recherche de l'entité: ${error}`));
      return null;
    }
  }

  /**
   * Extrait le nom de package à partir du fichier d'entité
   */
  extractPackageName(filePath: string): string | null {
    try {
      if (!filePath) {
        this.log(ERROR_COLOR(`Impossible de trouver le fichier d'entité.`));
        return null;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const packageMatch = content.match(/package\s+([^;]+);/);

      if (packageMatch && packageMatch.length > 1) {
        return packageMatch[1].trim();
      }

      return null;
    } catch (error) {
      this.log(ERROR_COLOR(`Erreur lors de l'extraction du nom de package: ${error}`));
      return null;
    }
  }

  /**
   * Trouve le package de base du projet
   */
  findBasePackageName(): string {
    try {
      // Rechercher le package dans l'application principale
      const mainAppFiles = fs.readdirSync("src/main/java");
      if (mainAppFiles && mainAppFiles.length > 0) {
        // Parcourir récursivement pour trouver un fichier Java contenant "package"
        const findPackageInDir = (dir: string): string | null => {
          const files = fs.readdirSync(dir);

          for (const file of files) {
            const fullPath = path.join(dir, file);
            const stats = fs.statSync(fullPath);

            if (stats.isDirectory()) {
              const result = findPackageInDir(fullPath);
              if (result) return result;
            }
            else if (file.endsWith('.java')) {
              try {
                const content = fs.readFileSync(fullPath, 'utf8');
                const packageMatch = content.match(/package\s+([^;]+);/);
                if (packageMatch && packageMatch.length > 1) {
                  const pkg = packageMatch[1].trim();
                  // Si on trouve un package "entity" ou "domain", c'est probablement ce qu'on veut
                  if (pkg.includes('.entity') || pkg.includes('.domain') || pkg.includes('.model')) {
                    return pkg;
                  }
                  return pkg;
                }
              } catch (e) {
                // Ignorer les erreurs de lecture de fichier
              }
            }
          }
          return null;
        };

        const foundPackage = findPackageInDir('src/main/java');
        if (foundPackage) {
          if (foundPackage.includes('.entity')) {
            return foundPackage;
          }
          if (foundPackage.includes('.domain')) {
            return foundPackage;
          }
          if (foundPackage.includes('.model')) {
            return foundPackage;
          }
          // Si on n'a pas trouvé de package spécifique, essayer d'en construire un
          return foundPackage.split('.').slice(0, -1).join('.') + '.entity';
        }
      }
    } catch (error) {
      this.log(ERROR_COLOR(`Erreur lors de la recherche du package de base: ${error}`));
    }

    return 'com.example.domain';
  }

  end() {
    this.log(chalk.green("🚀 Opérations CRUD générées avec succès pour l'entité " + this.answers.entityName + "!"));
  }
}
