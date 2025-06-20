import { BaseGenerator } from "../base-generator.js";
import chalk from "chalk";
import path from "path";
import fs from "fs";
import { DtoGeneratorOptions } from "../types.js";

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
    // Utiliser as any pour éviter les erreurs TypeScript lors de l'accès aux propriétés
    const opts = this.options as any;

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
        type: "input",
        name: "packageName",
        message: chalk.cyan("Dans quel package voulez-vous générer les DTOs?"),
        default: (answers: any) => {
          if (opts["package-name"]) return opts["package-name"];

          // Essayer de déduire le package à partir de l'emplacement de l'entité
          const entityName = answers.entityName || opts["entity-name"] || "";
          if (entityName) {
            const foundEntityPath = this.findEntityFile(entityName);
            if (foundEntityPath) {
              const packagePath = this.extractPackageName(foundEntityPath);
              if (packagePath) {
                this.entityPackageName = packagePath;
                return packagePath.replace('.domain', '.dto');
              }
            }
          }
          return "com.example.dto";
        },
        validate: (input: string) => {
          if (!input || input.trim() === "") {
            return "Le nom du package est obligatoire.";
          }
          if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/.test(input)) {
            return "Format de package invalide (ex: com.example.dto)";
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
          { name: "ModelMapper - Mapping bas�� sur la réflexion à l'exécution", value: "modelmapper" },
          { name: "Manuel - Écrire le code de mapping manuellement", value: "manual" }
        ]
      }
    ];

    this.answers = await this.prompt(prompts);

    // Si l'entité a été trouvée, essayer d'extraire ses champs
    if (this.entityPackageName) {
      this.entityFields = await this.extractEntityFields(this.answers.entityName);
    }

    // Si pas de champs trouvés automatiquement, demander à l'utilisateur
    if (this.entityFields.length === 0) {
      this.log(INFO_COLOR("Impossible d'extraire automatiquement les champs de l'entité."));
      await this.askForEntityFields();
    } else {
      this.log(SUCCESS_COLOR(`✅ ${this.entityFields.length} champs trouvés dans l'entité ${this.answers.entityName}`));
    }
  }

  /**
   * Recherche le fichier d'entité dans le projet
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
   * Extrait les champs à partir du fichier d'entité
   */
  async extractEntityFields(entityName: string): Promise<any[]> {
    try {
      const entityFile = this.findEntityFile(entityName);
      if (!entityFile) return [];

      const content = fs.readFileSync(entityFile, 'utf8');
      const fields: any[] = [];

      // Pattern pour correspondre aux champs (très simplifié)
      const fieldPattern = /private\s+(\S+)\s+(\S+);/g;
      let match;

      while ((match = fieldPattern.exec(content)) !== null) {
        const type = match[1];
        const name = match[2];

        // Ignorer le champ id qui sera géré séparément
        if (name !== 'id' && !name.includes("createdBy") && !name.includes("createdDate") &&
            !name.includes("lastModifiedBy") && !name.includes("lastModifiedDate")) {

          // Essayer de déduire des informations sur les validations
          const required = content.includes(`@NotNull\\s+${name}`) || content.includes(`@NotBlank\\s+${name}`);
          const minLength = (content.match(new RegExp(`@Size\\(min\\s*=\\s*(\\d+).*?\\).*?${name}`)) || [])[1];
          const maxLength = (content.match(new RegExp(`@Size\\(.*?max\\s*=\\s*(\\d+).*?\\).*?${name}`)) || [])[1];

          fields.push({
            name,
            type,
            required,
            minLength: minLength ? parseInt(minLength) : null,
            maxLength: maxLength ? parseInt(maxLength) : null,
            min: null,
            max: null
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
   * Demande à l'utilisateur de définir les champs de l'entité
   */
  async askForEntityFields() {
    this.entityFields = [];

    this.log("");
    this.log(STEP_PREFIX + chalk.bold("DÉFINITION DES CHAMPS DE L'ENTITÉ"));
    this.log(SECTION_DIVIDER);
    this.log(HELP_COLOR("Veuillez définir les champs que vous voulez inclure dans le DTO"));

    let addMore = true;

    while (addMore) {
      const field = await this.prompt([
        {
          type: "input",
          name: "name",
          message: chalk.cyan("Nom du champ:"),
          validate: (input: string) => {
            if (!input) return "Le nom du champ est requis";
            if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(input)) {
              return "Le nom du champ doit commencer par une lettre et ne contenir que des lettres, chiffres et underscores";
            }
            if (["id", "class", "abstract", "interface", "enum"].includes(input.toLowerCase())) {
              return `'${input}' est un mot réservé Java`;
            }
            return true;
          }
        },
        {
          type: "input",
          name: "type",
          message: chalk.cyan("Type de données (String, Integer, LocalDate...):"),
          default: "String",
          validate: (input: string) => {
            if (!input) return "Le type de données est requis";
            return true;
          }
        },
        {
          type: "confirm",
          name: "required",
          message: chalk.cyan("Ce champ est-il requis?"),
          default: true
        }
      ]);

      this.entityFields.push(field);
      this.log(SUCCESS_COLOR(`Champ '${field.name}' ajouté`));

      const { addMoreFields } = await this.prompt({
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
      this.log(`${index + 1}. ${chalk.green(field.name)} : ${chalk.cyan(field.type)} ${field.required ? chalk.yellow('(requis)') : ''}`);
    });
  }

  hasDateFields(): boolean {
    return this.entityFields.some(field =>
      ['LocalDate', 'LocalDateTime', 'LocalTime', 'ZonedDateTime', 'Instant', 'Date'].includes(field.type)
    );
  }

  hasBigDecimalFields(): boolean {
    return this.entityFields.some(field => field.type === 'BigDecimal');
  }

  writing() {
    const { entityName, packageName, mapperFramework } = this.answers;

    // Vérifier si des champs ont été définis
    if (this.entityFields.length === 0) {
      this.log(ERROR_COLOR("Aucun champ défini pour le DTO. Génération annulée."));
      return;
    }

    this.log("");
    this.log(STEP_PREFIX + chalk.bold("GÉNÉRATION DES FICHIERS"));
    this.log(SECTION_DIVIDER);

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

    // Créer les dossiers nécessaires
    const srcMainJavaDir = path.join(process.cwd(), 'src/main/java');
    const packagePath = packageName.replace(/\./g, '/');
    const dtoDir = path.join(srcMainJavaDir, packagePath);
    this.createDirectory(dtoDir);

    // Générer le fichier DTO
    const dtoPath = path.join(dtoDir, `${entityName}DTO.java`);
    this.renderEjsTemplate('EntityDTO.java.ejs', dtoPath, templateData);
    this.log(SUCCESS_COLOR(`✅ DTO ${entityName}DTO.java généré avec succès`));

    // Si ModelMapper est utilisé, générer le code de configuration
    if (mapperFramework === 'modelmapper') {
      this._generateModelMapperConfig(entityName, packageName, templateData);
    }

    // Afficher des informations sur les dépendances à ajouter
    this._showDependencyInfo(mapperFramework);
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
    this.log(SUCCESS_COLOR(`✅ Génération des DTOs pour ${this.answers.entityName} terminée avec succès!`));
    this.log(SECTION_DIVIDER);
  }
}
