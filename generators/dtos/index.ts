import { BaseGenerator } from "../base-generator.js";
import chalk from "chalk";
import path from "path";
import fs from "fs";


// Styles visuels constants
const STEP_PREFIX = chalk.bold.blue("➤ ");
const SECTION_DIVIDER = chalk.gray("────────────────────────────────────────────");
const INFO_COLOR = chalk.yellow;
const SUCCESS_COLOR = chalk.green;
const ERROR_COLOR = chalk.red;
const HELP_COLOR = chalk.gray.italic;

/**
 * Générateur de DTOs (Data Transfer Objects)
 * Permet de générer automatiquement les classes DTO correspondant aux entités
 */
export default class DtosGenerator extends BaseGenerator {
  declare options: any;
  declare answers: any;
  entityFields: any[] = [];
  entityPackageName: string = "";

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

    this.option("mapper-framework", {
      description: "Framework de mapping à utiliser (mapstruct, modelMapper, manual)",
      type: String,
      default: "mapstruct",
    });
  }

  initializing() {
    this.log(SECTION_DIVIDER);
    this.log(chalk.bold.blue("🔄 GÉNÉRATEUR DE DTOS SPRING FULLSTACK"));
    this.log(SECTION_DIVIDER);
    this.log(HELP_COLOR("Ce générateur va créer des classes DTO pour vos entités Java"));
    this.log("");
  }

  async prompting() {

    const opts = this.options as any;

    // Simplification du prompt pour ne demander que le nom de l'entité
    const prompts: any = [
      {
        type: "input",
        name: "entityName",
        message: chalk.cyan("Pour quelle entité souhaitez-vous générer des DTOs?"),
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
        type: "list",
        name: "mapperFramework",
        message: chalk.cyan("Quel framework de mapping souhaitez-vous utiliser?"),
        default: opts["mapper-framework"] || "mapstruct",
        choices: [
          { name: "MapStruct - Génération automatique de mappers à la compilation", value: "mapstruct" },
          { name: "ModelMapper - Mapping basé sur la réflexion à l'exécution", value: "modelmapper" },
          { name: "Manuel - Écrire le code de mapping manuellement", value: "manual" }
        ]
      }
    ];

    // Obtenir les réponses de l'utilisateur
    const answers = await this.prompt(prompts);
    
    // Rechercher l'entité et extraire son package
    const entityName = answers.entityName;

    if (!entityName) {
      this.log(ERROR_COLOR(`❌ Le nom d'entité est obligatoire pour générer un DTO.`));
      return;
    }

    const entityFile = this.findEntityFile(entityName);
    
    if (!entityFile) {
      this.log(ERROR_COLOR(`❌ L'entité ${entityName}.java n'a pas été trouvée. Impossible de générer le DTO.`));
      // On pourrait arrêter ici avec process.exit(), mais mieux vaut laisser l'utilisateur décider
      return;
    } else {
      // Extraire le package de l'entité
      const entityPackage = this.extractPackageName(entityFile);
      if (entityPackage) {
        this.entityPackageName = entityPackage;
        
        // Définir automatiquement le package dto en se basant sur le package de l'entité
        // Remplacer .entity, .domain ou .model par .dto, ou ajouter .dto si aucun de ces segments n'existe
        let dtoPackage = entityPackage;
        if (dtoPackage.includes(".entity")) {
          dtoPackage = dtoPackage.replace(".entity", ".dto");
        } else if (dtoPackage.includes(".domain")) {
          dtoPackage = dtoPackage.replace(".domain", ".dto");
        } else if (dtoPackage.includes(".model")) {
          dtoPackage = dtoPackage.replace(".model", ".dto");
        } else {
          dtoPackage = `${dtoPackage}.dto`;
        }
        
        // Stocker le package dto dans les réponses
        answers.packageName = dtoPackage;
        
        this.log(SUCCESS_COLOR(`✅ DTO sera généré dans le package: ${dtoPackage}`));
        
        // Extraire automatiquement les champs de l'entité
        this.log(INFO_COLOR("🔍 Extraction automatique des champs de l'entité..."));
        this.entityFields = await this.extractEntityFields(entityName);
        
        if (this.entityFields.length > 0) {
          this.log(SUCCESS_COLOR(`✅ ${this.entityFields.length} champs extraits avec succès!`));
          
          // Afficher les champs détectés
          this.log("");
          this.log(STEP_PREFIX + chalk.bold("CHAMPS DÉTECTÉS AUTOMATIQUEMENT"));
          this.log(SECTION_DIVIDER);
          
          this.entityFields.forEach((field, index) => {
            this.log(`${index + 1}. ${chalk.green(field.name)} : ${chalk.cyan(field.type)} ${field.required ? chalk.yellow('(requis)') : ''}`);
          });
        } else {
          this.log(ERROR_COLOR("❌ Aucun champ n'a pu être extrait automatiquement."));
          // Terminons ici car nous ne voulons plus demander les champs manuellement
          return;
        }
      } else {
        this.log(ERROR_COLOR(`❌ Impossible d'extraire le package de l'entité.`));
        // Définir un package par défaut
        answers.packageName = this.findBasePackageName() + ".dto";
        // Ne demandons plus les champs manuellement
        return;
      }
    }
    
    this.answers = answers;
  }

  /**
   * Recherche le fichier d'entité dans le projet de manière plus efficace et robuste
   */
  findEntityFile(entityName: string): string | null {
    try {
      if (!entityName) {
        // Ne rien faire si pas d'entité, éviter le log parasite
        return null;
      }

      const rootDir = process.cwd();
      const srcDir = path.join(rootDir, 'src/main/java');

      if (!fs.existsSync(srcDir)) {
        this.log(ERROR_COLOR(`❌ Dossier src/main/java non trouvé`));
        return null;
      }

      this.log(INFO_COLOR(`🔍 Recherche de l'entité ${entityName} dans ${srcDir}`));

      // Stratégie 1: Rechercher dans les dossiers entity ou domain (approche rapide)
      const commonEntityDirs = ['entity', 'domain', 'model', 'entities', 'models'];
      let entityFile: string | null = null;

      // Afficher le répertoire de travail actuel pour faciliter le debug
      this.log(INFO_COLOR(`📂 Répertoire de travail actuel: ${rootDir}`));

      // Vérifier si le fichier existe directement dans le répertoire de travail
      const cwdEntityPath = path.join(rootDir, `${entityName}.java`);
      if (fs.existsSync(cwdEntityPath)) {
        this.log(SUCCESS_COLOR(`✅ Entité trouvée dans le répertoire de travail: ${cwdEntityPath}`));
        return cwdEntityPath;
      }

      // Vérifier si le répertoire cible existe dans test-folder-for-cleanup
      let testFolder = path.join(rootDir, 'test-folder-for-cleanup');
      if (fs.existsSync(testFolder)) {
        this.log(INFO_COLOR(`📂 Vérification dans le répertoire de test: ${testFolder}`));

        // Vérifier dans les sous-répertoires courants du projet généré
        testFolder = path.join(testFolder, 'src/main/java');
        if (fs.existsSync(testFolder)) {
          const entityPath = this.searchEntityInDirectory(testFolder, entityName);
          if (entityPath) return entityPath;
        }
      }

      // Recherche récursive mais ciblée
      const findEntityInDir = (dir: string, name: string): string | null => {
        if (!fs.existsSync(dir) || !name) return null;

        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          try {
            const stats = fs.statSync(fullPath);

            // Si c'est un dossier dont le nom correspond aux dossiers typiques pour les entités
            if (stats.isDirectory()) {
              if (commonEntityDirs.includes(item.toLowerCase())) {
                const targetFile = path.join(fullPath, `${name}.java`);
                // Vérification insensible à la casse
                const files = fs.readdirSync(fullPath);
                for (const file of files) {
                  if (file.toLowerCase() === `${name.toLowerCase()}.java`) {
                    const entityFilePath = path.join(fullPath, file);
                    this.log(SUCCESS_COLOR(`✅ Entité trouvée: ${entityFilePath}`));
                    return entityFilePath;
                  }
                }
              }
              // Continuer la recherche en profondeur
              const found = findEntityInDir(fullPath, name);
              if (found) return found;
            }
            // Vérifier directement si le fichier correspond à l'entité
            else if (stats.isFile() && item.toLowerCase() === `${name.toLowerCase()}.java`) {
              this.log(SUCCESS_COLOR(`✅ Entité trouvée: ${fullPath}`));
              return fullPath;
            }
          } catch (err) {
            // Gérer les erreurs potentielles (permissions, etc.)
            this.log(ERROR_COLOR(`⚠️ Erreur lors de l'accès à ${fullPath}: ${err}`));
            continue;
          }
        }
        return null;
      };

      entityFile = findEntityInDir(srcDir, entityName);

      // Stratégie 2 (fallback): Recherche complète si la recherche ciblée a échoué
      if (!entityFile) {
        this.log(INFO_COLOR("⚠️ Entité non trouvée dans les dossiers courants, recherche générale..."));

        const findFileCompleteScan = (dir: string, fileName: string): string | null => {
          if (!dir || !fileName) return null;

          try {
            const items = fs.readdirSync(dir);

            for (const item of items) {
              const fullPath = path.join(dir, item);
              try {
                const stats = fs.statSync(fullPath);

                if (stats.isDirectory()) {
                  const found = findFileCompleteScan(fullPath, fileName);
                  if (found) return found;
                }
                // Recherche insensible à la casse
                else if (stats.isFile() && item.toLowerCase() === `${fileName.toLowerCase()}.java`) {
                  this.log(SUCCESS_COLOR(`✅ Entité trouvée (recherche complète): ${fullPath}`));
                  return fullPath;
                }
              } catch (err) {
                // Gérer les erreurs potentielles (permissions, etc.)
                continue;
              }
            }
          } catch (err) {
            this.log(ERROR_COLOR(`⚠️ Erreur lors de l'accès au répertoire ${dir}: ${err}`));
          }
          return null;
        };

        entityFile = findFileCompleteScan(srcDir, entityName);

        // Si toujours pas trouvé, remonter d'un niveau et chercher dans tout le répertoire du projet
        if (!entityFile) {
          this.log(INFO_COLOR("⚠️ Recherche étendue dans tout le répertoire du projet..."));
          entityFile = findFileCompleteScan(rootDir, entityName);
        }
      }

      if (!entityFile) {
        this.log(ERROR_COLOR(`❌ Impossible de trouver l'entité ${entityName}.java`));
      }

      return entityFile;
    } catch (error) {
      this.log(ERROR_COLOR(`❌ Erreur lors de la recherche de l'entité: ${error}`));
      return null;
    }
  }

  /**
   * Recherche une entité dans un répertoire spécifique
   */
  searchEntityInDirectory(dir: string, entityName: string): string | null {
    try {
      if (!fs.existsSync(dir) || !entityName) return null;

      const searchRecursive = (currentDir: string, name: string): string | null => {
        if (!currentDir || !name) return null;

        const items = fs.readdirSync(currentDir);

        for (const item of items) {
          const fullPath = path.join(currentDir, item);
          try {
            const stats = fs.statSync(fullPath);

            if (stats.isDirectory()) {
              // Recherche récursive
              const result = searchRecursive(fullPath, name);
              if (result) return result;
            } else if (stats.isFile() && item.toLowerCase() === `${name.toLowerCase()}.java`) {
              this.log(SUCCESS_COLOR(`✅ Entité trouvée dans le répertoire spécifique: ${fullPath}`));
              return fullPath;
            }
          } catch (err) {
            // Ignorer les erreurs
            continue;
          }
        }

        return null;
      };

      return searchRecursive(dir, entityName);
    } catch (error) {
      this.log(ERROR_COLOR(`❌ Erreur lors de la recherche de l'entité: ${error}`));
      return null;
    }
  }

  /**
   * Extrait le nom de package à partir du fichier d'entité
   */
  extractPackageName(filePath: string | null): string | null {
    try {
      // Vérification que filePath est bien une chaîne de caractères
      if (!filePath) {
      //  this.log(ERROR_COLOR(`Impossible de trouver le fichier d'entité.`));
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
   * Trouve et extrait le package de base du projet
   */
  findBasePackageName(): string {
    try {
      // Rechercher le package dans l'application principale
      const mainAppDir = path.join(process.cwd(), "src/main/java");
      if (fs.existsSync(mainAppDir)) {
        // Parcourir récursivement pour trouver un fichier Java contenant "package"
        const findPackageInDir = (dir: string): string | null => {
          try {
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
                    return packageMatch[1].trim();
                  }
                } catch (e) {
                  // Ignorer les erreurs de lecture de fichier
                }
              }
            }
          } catch (error) {
            // Ignorer les erreurs d'accès aux répertoires
          }
          return null;
        };

        return findPackageInDir(mainAppDir) || 'com.example';
      }
    } catch (error) {
      this.log(ERROR_COLOR(`Erreur lors de la recherche du package de base: ${error}`));
    }

    return 'com.example';
  }

  /**
   * Extrait les champs à partir du fichier d'entité de façon plus robuste
   */
  async extractEntityFields(entityName: string): Promise<any[]> {
    try {
      if (!entityName) {
        // Ne rien faire si pas d'entité, éviter le log parasite
        return [];
      }

      const entityFile = this.findEntityFile(entityName);
      if (!entityFile) return [];

      const content = fs.readFileSync(entityFile, 'utf8');
      // Définir explicitement le type du tableau
      const fields: Array<{
        name: string;
        type: string;
        required: boolean;
        unique: boolean;
        minLength: number | null;
        maxLength: number | null;
        min: number | null;
        max: number | null;
        enumValues?: string[] | null;
      }> = [];

      // 1. Analyser le contenu Java pour trouver les champs
      
      // Détecter les imports pour les types spéciaux
      const imports: { [key: string]: string } = {};
      const importPattern = /import\s+([^;]+);/g;
      let importMatch;
      while ((importMatch = importPattern.exec(content)) !== null) {
        const importStatement = importMatch[1].trim();
        const lastDot = importStatement.lastIndexOf('.');
        if (lastDot !== -1) {
          const typeName = importStatement.substring(lastDot + 1);
          imports[typeName] = importStatement;
        }
      }
      
      // Pattern amélioré pour correspondre aux champs avec annotations
      // Cette regex essaie de capturer les blocs d'annotations avant la déclaration du champ
      const fieldBlockPattern = /(?:\/\/.*\n|\/\*[\s\S]*?\*\/|\s*@[^(].*\n)*\s*private\s+([^\s<>]+)(?:<[^>]+>)?\s+(\w+)(?:\s*=\s*[^;]+)?;/g;
      let fieldMatch;

      while ((fieldMatch = fieldBlockPattern.exec(content)) !== null) {
        const fieldBlock = fieldMatch[0]; // Le bloc entier contenant annotations + déclaration
        const type = fieldMatch[1];  // Le type du champ
        const name = fieldMatch[2];  // Le nom du champ
        
        // Ignorer les champs spécifiques
        if (name === 'id' || 
            name === 'serialVersionUID' || 
            name.includes("createdBy") || 
            name.includes("createdDate") ||
            name.includes("lastModifiedBy") || 
            name.includes("lastModifiedDate")) {
          continue;
        }
        
        // Analyser les annotations pour déterminer les validations
        const notNullPresent = /@NotNull|@NotEmpty|@NotBlank/.test(fieldBlock);
        const sizePattern = /@Size\s*\((?:[^)]*?min\s*=\s*(\d+))?(?:[^)]*?max\s*=\s*(\d+))?\)/;
        const sizeMatch = fieldBlock.match(sizePattern);
        const minLength = sizeMatch && sizeMatch[1] ? parseInt(sizeMatch[1]) : null;
        const maxLength = sizeMatch && sizeMatch[2] ? parseInt(sizeMatch[2]) : null;
        
        // Rechercher les annotations @Min et @Max
        const minMatch = fieldBlock.match(/@Min\s*\(\s*value\s*=\s*(\d+)\s*\)/);
        const maxMatch = fieldBlock.match(/@Max\s*\(\s*value\s*=\s*(\d+)\s*\)/);
        const min = minMatch ? parseInt(minMatch[1]) : null;
        const max = maxMatch ? parseInt(maxMatch[1]) : null;
        
        // Détecter les annotations d'unicité
        const uniquePresent = /@Column\s*\((?:[^)]*?unique\s*=\s*true)?\)/.test(fieldBlock);

        // Détecter si c'est un champ de type Enum
        let enumValues: string[] | null = null;
        if (type === "Enum" || (imports[type] && imports[type].includes("enum"))) {
            // Essayer de trouver le fichier de l'énumération
            const enumFile = this.findEnumFile(type, imports[type]);
            if (enumFile) {
                // S'assurer que le résultat est bien un tableau de chaînes ou null
                const extractedValues = this.extractEnumValues(enumFile);
                enumValues = Array.isArray(extractedValues) ? extractedValues : null;
            }
        }
        
        fields.push({
          name,
          type,
          required: notNullPresent,
          unique: uniquePresent,
          minLength,
          maxLength,
          min,
          max,
          enumValues
        });
      }
      
      // Si aucun champ n'a été trouvé avec la méthode précise, essayer une approche plus simple
      if (fields.length === 0) {
        this.log(INFO_COLOR("⚠️ Analyse détaillée infructueuse, utilisation de la méthode simple..."));
        
        const simpleFieldPattern = /private\s+([^\s<>]+)(?:<[^>]+>)?\s+(\w+);/g;
        let simpleMatch;
        while ((simpleMatch = simpleFieldPattern.exec(content)) !== null) {
          const type = simpleMatch[1];
          const name = simpleMatch[2];
          
          if (name !== 'id' && name !== 'serialVersionUID' && 
              !name.includes("createdBy") && !name.includes("createdDate") &&
              !name.includes("lastModifiedBy") && !name.includes("lastModifiedDate")) {
            
            fields.push({
              name,
              type,
              required: false,
              unique: false, // Ajout de la propriété unique manquante
              minLength: null,
              maxLength: null,
              min: null,
              max: null,
              enumValues: null // Explicitation de la valeur null pour enumValues
            });
          }
        }
      }

      return fields;
    } catch (error) {
      this.log(ERROR_COLOR(`❌ Erreur lors de l'extraction des champs: ${error}`));
      return [];
    }
  }
  
  /**
   * Recherche le fichier d'une énumération Java
   */
  findEnumFile(enumName: string, importStatement?: string): string | null {
    try {
      if (!enumName) {
        // Ne rien faire si pas d'énum, éviter le log parasite
        return null;
      }

      // Si on a l'importation complète, on peut trouver directement le fichier
      if (importStatement) {
        const packagePath = importStatement.replace(/\./g, path.sep);
        const rootDir = process.cwd();
        const srcDir = path.join(rootDir, 'src/main/java');
        const enumFile = path.join(srcDir, `${packagePath}.java`);
        
        if (fs.existsSync(enumFile)) {
          return enumFile;
        }
      }
      
      // Sinon, faire une recherche similaire à findEntityFile
      return this.findEntityFile(enumName);
    } catch (error) {
      this.log(ERROR_COLOR(`❌ Erreur lors de la recherche de l'enum: ${error}`));
      return null;
    }
  }
  
  /**
   * Extrait les valeurs d'une énumération Java
   */
  extractEnumValues(enumFile: string | null): string[] | null {
    try {
      if (!enumFile) {
        // Ne rien faire si pas de fichier enum, éviter le log parasite
        return null;
      }

      const content = fs.readFileSync(enumFile, 'utf8');
      
      // Rechercher le bloc enum { ... }
      const enumBlockMatch = content.match(/enum\s+\w+\s*{([^}]*)}/);
      if (enumBlockMatch && enumBlockMatch[1]) {
        // Extraire les valeurs de l'énumération
        return enumBlockMatch[1]
          .split(',')
          .map(v => v.trim())
          .filter(v => v && !v.includes('(') && !v.startsWith('//')); // Filtrer les commentaires et constructeurs
      }
      
      return null;
    } catch (error) {
      this.log(ERROR_COLOR(`❌ Erreur lors de l'extraction des valeurs d'enum: ${error}`));
      return null;
    }
  }
  
  /**
   * Crée un répertoire s'il n'existe pas déjà
   */
  createDirectory(dir: string): void {
    try {
      if (!dir) {
        // Ne rien faire si pas de chemin, éviter le log parasite
        return;
      }

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        this.log(INFO_COLOR(`📁 Création du répertoire: ${dir}`));
      }
    } catch (error) {
      this.log(ERROR_COLOR(`❌ Erreur lors de la création du répertoire: ${error}`));
    }
  }

  /**
   * Génère les imports nécessaires pour le DTO
   * @returns Liste des imports nécessaires
   */
  _generateImports(): string[] {
    const imports: string[] = [];

    // Ajouter les imports pour les types spéciaux
    if (this.hasDateFields()) {
      if (this.entityFields.some(field => field.type === 'LocalDate')) {
        imports.push('java.time.LocalDate');
      }
      if (this.entityFields.some(field => field.type === 'LocalDateTime')) {
        imports.push('java.time.LocalDateTime');
      }
      if (this.entityFields.some(field => field.type === 'LocalTime')) {
        imports.push('java.time.LocalTime');
      }
      if (this.entityFields.some(field => field.type === 'ZonedDateTime')) {
        imports.push('java.time.ZonedDateTime');
      }
      if (this.entityFields.some(field => field.type === 'Instant')) {
        imports.push('java.time.Instant');
      }
      if (this.entityFields.some(field => field.type === 'Date')) {
        imports.push('java.util.Date');
      }
    }

    if (this.hasBigDecimalFields()) {
      imports.push('java.math.BigDecimal');
    }

    return imports;
  }

  /**
   * Vérifie si l'entité contient des champs de type Date/Time
   */
  hasDateFields(): boolean {
    const dateTypes = ['LocalDate', 'LocalDateTime', 'LocalTime', 'ZonedDateTime', 'Instant', 'Date'];
    return this.entityFields.some(field => dateTypes.includes(field.type));
  }

  /**
   * Vérifie si l'entité contient des champs de type BigDecimal
   */
  hasBigDecimalFields(): boolean {
    return this.entityFields.some(field => field.type === 'BigDecimal');
  }

  writing() {
    // Vérifier que nous avons des réponses valides
    if (!this.answers || !this.answers.entityName) {
      this.log(ERROR_COLOR("❌ Configuration incomplète. Génération annulée."));
      return;
    }

    const { entityName, packageName, mapperFramework } = this.answers;

    // Vérifier si des champs ont été définis
    if (!this.entityFields || this.entityFields.length === 0) {
      this.log(ERROR_COLOR("❌ Aucun champ défini pour le DTO. Génération annulée."));
      return;
    }

    this.log("");
    this.log(STEP_PREFIX + chalk.bold("GÉNÉRATION DES FICHIERS"));
    this.log(SECTION_DIVIDER);

    try {
      // Préparer les données pour les templates
      const templateData = {
        entityName: entityName,
        packageName: packageName,
        entityPackageName: this.entityPackageName || "com.example.domain",
        fields: this.entityFields,
        hasDateFields: this.hasDateFields(),
        hasBigDecimalFields: this.hasBigDecimalFields(),
        imports: this._generateImports(),
        useMapstruct: mapperFramework === 'mapstruct'
      };

      // Déterminer si le package inclut déjà "dto"
      let finalPackageName = packageName;
      if (!finalPackageName.endsWith(".dto")) {
        finalPackageName = `${finalPackageName}.dto`;
      }

      // Créer les dossiers nécessaires
      const srcMainJavaDir = path.join(process.cwd(), 'src/main/java');
      const packagePath = finalPackageName.replace(/\./g, '/');
      const dtoDir = path.join(srcMainJavaDir, packagePath);
      this.createDirectory(dtoDir);

      // Mettre à jour le nom du package dans les données du template
      templateData.packageName = finalPackageName;

      // Générer le fichier DTO
      const dtoPath = path.join(dtoDir, `${entityName}DTO.java`);

      // Utiliser le template depuis le bon répertoire
      this.fs.copyTpl(
        this.templatePath('EntityDTO.java.ejs'),
        this.destinationPath(dtoPath),
        templateData
      );

      this.log(SUCCESS_COLOR(`✅ DTO ${entityName}DTO.java généré avec succès`));

      // Si ModelMapper est utilisé, générer le code de configuration
      if (mapperFramework === 'modelmapper') {
        this._generateModelMapperConfig(entityName, finalPackageName, templateData);
      }

      // Afficher des informations sur les dépendances à ajouter
      this._showDependencyInfo(mapperFramework);
    } catch (error) {
      this.log(ERROR_COLOR(`❌ Erreur lors de la génération des fichiers: ${error}`));
    }
  }

  /**
   * Génère la configuration pour ModelMapper si ce framework est sélectionné
   */
  _generateModelMapperConfig(entityName: string, packageName: string, templateData: any) {
    // TODO: Générer la classe de configuration ModelMapper
    this.log(INFO_COLOR("La génération de la configuration ModelMapper sera implémentée dans une version future"));
  }

  /**
   * Affiche les informations sur les dépendances à ajouter au projet
   */
  _showDependencyInfo(mapperFramework: string) {
    this.log("");
    this.log(STEP_PREFIX + chalk.bold("DÉPENDANCES REQUISES"));
    this.log(SECTION_DIVIDER);

    if (mapperFramework === 'mapstruct') {
      this.log(INFO_COLOR("Pour utiliser MapStruct, ajoutez ces dépendances à votre pom.xml:"));
      this.log(`
<dependencies>
    <dependency>
        <groupId>org.mapstruct</groupId>
        <artifactId>mapstruct</artifactId>
        <version>1.5.5.Final</version>
    </dependency>
</dependencies>

<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <configuration>
                <annotationProcessorPaths>
                    <path>
                        <groupId>org.mapstruct</groupId>
                        <artifactId>mapstruct-processor</artifactId>
                        <version>1.5.5.Final</version>
                    </path>
                </annotationProcessorPaths>
            </configuration>
        </plugin>
    </plugins>
</build>
`);
    } else if (mapperFramework === 'modelmapper') {
      this.log(INFO_COLOR("Pour utiliser ModelMapper, ajoutez cette dépendance à votre pom.xml:"));
      this.log(`
<dependency>
    <groupId>org.modelmapper</groupId>
    <artifactId>modelmapper</artifactId>
    <version>3.1.1</version>
</dependency>
`);
    }
  }

  end() {
    this.log("");
    this.log(SECTION_DIVIDER);
    if (this.answers && this.answers.entityName) {
      this.log(SUCCESS_COLOR(`✅ Génération des DTOs pour ${this.answers.entityName} terminée avec succès!`));
    } else {
      this.log(ERROR_COLOR("❌ La génération des DTOs n'a pas pu être complétée."));
    }
    this.log(SECTION_DIVIDER);
  }
}
