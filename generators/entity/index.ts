/**
 * Générateur pour la commande 'sfs generate entity'
 * Permet de générer des entités et les composants associés (repository, service, controller)
 */

import { BaseGenerator } from "../base-generator.js";
import chalk from "chalk";
import path from "path";
import fs from "fs";
import pluralize from "pluralize";

export default class EntityGenerator extends BaseGenerator {
  declare answers: any;
  declare projectConfig: any;
  declare entityFields: any[];

  constructor(args: string | string[], options: any) {
    super(args, options);

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

    this.option("microservice", {
      type: Boolean,
      alias: "m",
      description: "Générer une architecture de microservice pour cette entité",
      default: false
    });

    this.option("dto", {
      type: Boolean,
      alias: "d",
      description: "Générer un DTO pour cette entité",
      default: true
    });

    this.option("skipService", {
      type: Boolean,
      alias: "ss",
      description: "Ne pas générer de service pour cette entité",
      default: false
    });

    this.option("skipController", {
      type: Boolean,
      alias: "sc",
      description: "Ne pas générer de contrôleur pour cette entité",
      default: false
    });

    this.entityFields = [];
  }

  initializing() {
    this.log(chalk.blue("SFS Generate Entity - Génération d'entités et composants associés"));

    // Vérifier si nous sommes dans un projet Spring-Fullstack
    try {
      if (fs.existsSync('.sfs-config.json')) {
        this.projectConfig = JSON.parse(fs.readFileSync('.sfs-config.json', 'utf8'));
        this.log(chalk.green("Projet Spring-Fullstack détecté!"));
      } else {
        // Tentative de détection en cherchant des fichiers caractéristiques
        const hasPomXml = fs.existsSync('pom.xml');
        const hasGradle = fs.existsSync('build.gradle') || fs.existsSync('build.gradle.kts');
        const hasApplication = fs.existsSync('src/main/java');

        if (!(hasPomXml || hasGradle) || !hasApplication) {
          this.log(chalk.red("⚠️ Ce répertoire ne semble pas contenir un projet Spring-Fullstack."));
          this.log(chalk.yellow("Exécutez cette commande dans un projet généré par Spring-Fullstack-Speed."));
          process.exit(1);
        }

        // Créer une configuration minimale basée sur la détection
        this.projectConfig = {
          buildTool: hasPomXml ? "Maven" : "Gradle",
          packageName: this._detectPackageName(),
          createdWithSfs: false
        };

        this.log(chalk.yellow("Projet Spring Boot détecté, mais pas de fichier de configuration SFS."));
        this.log(chalk.yellow("Une configuration minimale sera utilisée."));
      }
    } catch (error) {
      this.log(chalk.red("⚠️ Erreur lors de la lecture de la configuration: " + error));
      process.exit(1);
    }
  }

  async prompting() {
    // Utiliser as any pour éviter les erreurs TypeScript lors de l'accès aux propriétés
    const opts = this.options as any;

    // Questions de base pour l'entité
    const entityQuestions: any[] = [];

    if (!opts.entityName) {
      entityQuestions.push({
        type: "input",
        name: "entityName",
        message: "Quel est le nom de l'entité à générer?",
        validate: (input: string) => {
          if (!input || input.trim() === '') {
            return "Le nom de l'entité ne peut pas être vide";
          }
          if (!/^[A-Z][a-zA-Z0-9]*$/.test(input)) {
            return "Le nom de l'entité doit commencer par une majuscule et ne contenir que des lettres et chiffres";
          }
          return true;
        }
      });
    }

    if (!opts.package) {
      entityQuestions.push({
        type: "input",
        name: "packageName",
        message: "Dans quel package voulez-vous générer l'entité?",
        default: `${this.projectConfig.packageName}.domain`
      });
    }

    if (entityQuestions.length > 0) {
      const entityAnswers = await this.prompt(entityQuestions);
      this.answers = {
        ...entityAnswers,
        entityName: opts.entityName || entityAnswers.entityName,
        packageName: opts.package || entityAnswers.packageName
      };
    } else {
      this.answers = {
        entityName: opts.entityName,
        packageName: opts.package
      };
    }

    // Options pour la génération
    if (!opts.microservice && !opts.skipService && !opts.skipController && !opts.dto) {
      const optionsQuestions: any[] = [
        {
          type: "confirm",
          name: "generateDto",
          message: "Voulez-vous générer un DTO pour cette entité?",
          default: true
        },
        {
          type: "confirm",
          name: "generateService",
          message: "Voulez-vous générer un service pour cette entité?",
          default: true
        },
        {
          type: "confirm",
          name: "generateController",
          message: "Voulez-vous générer un contrôleur REST pour cette entité?",
          default: true
        },
        {
          type: "confirm",
          name: "microserviceArchitecture",
          message: "Voulez-vous utiliser une architecture de microservice?",
          default: false
        }
      ];

      const optionsAnswers = await this.prompt(optionsQuestions);
      this.answers = {
        ...this.answers,
        ...optionsAnswers
      };
    } else {
      this.answers.generateDto = opts.dto !== false;
      this.answers.generateService = !opts.skipService;
      this.answers.generateController = !opts.skipController;
      this.answers.microserviceArchitecture = !!opts.microservice;
    }

    // Configuration de la table
    const tableQuestions: any[] = [
      {
        type: "input",
        name: "tableName",
        message: "Nom de la table en base de données:",
        default: this._toSnakeCase(pluralize.plural(this.answers.entityName))
      }
    ];

    const tableAnswers = await this.prompt(tableQuestions);
    this.answers = { ...this.answers, ...tableAnswers };

    // Définition des champs de l'entité
    await this._promptForFields();

    // Affichage du résumé
    this._displayEntitySummary();
  }

  async _promptForFields() {
    this.entityFields = [];
    let addMoreFields = true;

    this.log(chalk.cyan('\nDéfinition des champs de l\'entité:'));
    this.log(chalk.yellow('Note: Un champ ID sera automatiquement généré\n'));

    while (addMoreFields) {
      const fieldQuestions: any = [
        {
          type: "input",
          name: "fieldName",
          message: "Nom du champ:",
          validate: (input: string) => {
            if (!input || input.trim() === '') {
              return "Le nom du champ ne peut pas être vide";
            }
            if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(input)) {
              return "Le nom du champ doit commencer par une lettre et ne contenir que des lettres et chiffres";
            }
            return true;
          }
        },
        {
          type: "list",
          name: "fieldType",
          message: "Type de données:",
          choices: [
            { name: "String - Chaîne de caractères", value: "String" },
            { name: "Integer - Nombre entier", value: "Integer" },
            { name: "Long - Nombre entier long", value: "Long" },
            { name: "Double - Nombre à virgule flottante", value: "Double" },
            { name: "BigDecimal - Nombre décimal précis", value: "BigDecimal" },
            { name: "Boolean - Valeur booléenne", value: "Boolean" },
            { name: "LocalDate - Date", value: "LocalDate" },
            { name: "LocalDateTime - Date et heure", value: "LocalDateTime" },
            { name: "Enum - Énumération", value: "Enum" },
            { name: "Many-to-One - Relation plusieurs-vers-un", value: "ManyToOne" },
            { name: "One-to-Many - Relation un-vers-plusieurs", value: "OneToMany" },
            { name: "Many-to-Many - Relation plusieurs-vers-plusieurs", value: "ManyToMany" }
          ]
        }
      ];

      const fieldAnswers = await this.prompt(fieldQuestions);

      // Questions supplémentaires selon le type
      let additionalAnswers = {};

      if (fieldAnswers.fieldType === 'String') {
        const stringQuestions: any = {
          type: "input",
          name: "maxLength",
          message: "Longueur maximale:",
          default: "255",
          validate: (input: string) => {
            const num = parseInt(input);
            return (!isNaN(num) && num > 0) || "La longueur doit être un nombre positif";
          }
        };
        additionalAnswers = await this.prompt(stringQuestions);
      } else if (fieldAnswers.fieldType === 'Enum') {
        const enumQuestions: any = [
          {
            type: "input",
            name: "enumName",
            message: "Nom de l'énumération:",
            default: `${fieldAnswers.fieldName.charAt(0).toUpperCase() + fieldAnswers.fieldName.slice(1)}Type`,
            validate: (input: string) => {
              if (!input || input.trim() === '') {
                return "Le nom de l'énumération ne peut pas être vide";
              }
              if (!/^[A-Z][a-zA-Z0-9]*$/.test(input)) {
                return "Le nom de l'énumération doit commencer par une majuscule";
              }
              return true;
            }
          },
          {
            type: "input",
            name: "enumValues",
            message: "Valeurs de l'énumération (séparées par des virgules):",
            validate: (input: string) => {
              if (!input || input.trim() === '') {
                return "Les valeurs de l'énumération ne peuvent pas être vides";
              }
              return true;
            }
          }
        ];
        additionalAnswers = await this.prompt(enumQuestions);
      } else if (['ManyToOne', 'OneToMany', 'ManyToMany'].includes(fieldAnswers.fieldType)) {
        const relationQuestions: any = [
          {
            type: "input",
            name: "relatedEntity",
            message: "Nom de l'entité en relation:",
            validate: (input: string) => {
              if (!input || input.trim() === '') {
                return "Le nom de l'entité ne peut pas être vide";
              }
              if (!/^[A-Z][a-zA-Z0-9]*$/.test(input)) {
                return "Le nom de l'entité doit commencer par une majuscule";
              }
              return true;
            }
          }
        ];

        if (fieldAnswers.fieldType === 'ManyToMany') {
          relationQuestions.push({
            type: "confirm",
            name: "relationOwner",
            message: "Cette entité est-elle propriétaire de la relation?",
            default: true
          });
        }

        additionalAnswers = await this.prompt(relationQuestions);
      }

      // Questions communes pour tous les champs
      const commonQuestions: any = [
        {
          type: "confirm",
          name: "required",
          message: "Ce champ est-il obligatoire?",
          default: true
        },
        {
          type: "confirm",
          name: "unique",
          message: "Ce champ doit-il être unique?",
          default: false
        }
      ];

      const commonAnswers = await this.prompt(commonQuestions);

      // Ajouter le champ à la liste
      this.entityFields.push({
        ...fieldAnswers,
        ...additionalAnswers,
        ...commonAnswers,
        columnName: this._toSnakeCase(fieldAnswers.fieldName)
      });

      // Demander si l'utilisateur veut ajouter d'autres champs
      const addMoreQuestion: any = {
        type: "confirm",
        name: "addMore",
        message: "Voulez-vous ajouter un autre champ?",
        default: true
      };

      const { addMore } = await this.prompt(addMoreQuestion);
      addMoreFields = addMore;
    }
  }

  _displayEntitySummary() {
    this.log(chalk.green.bold('\n📋 Résumé de l\'entité:'));
    this.log(chalk.cyan('Nom de l\'entité: ') + chalk.yellow(this.answers.entityName));
    this.log(chalk.cyan('Nom de la table: ') + chalk.yellow(this.answers.tableName));
    this.log(chalk.cyan('Package: ') + chalk.yellow(this.answers.packageName));

    this.log(chalk.cyan('\nChamps:'));
    this.log(chalk.cyan('- id: Long (Généré automatiquement)'));

    this.entityFields.forEach(field => {
      let fieldDescription = `- ${field.fieldName}: ${field.fieldType}`;

      if (field.fieldType === 'String' && field.maxLength) {
        fieldDescription += ` (max: ${field.maxLength})`;
      } else if (field.fieldType === 'Enum') {
        fieldDescription += ` (${field.enumName}: ${field.enumValues})`;
      } else if (['ManyToOne', 'OneToMany', 'ManyToMany'].includes(field.fieldType)) {
        fieldDescription += ` (→ ${field.relatedEntity})`;
        if (field.fieldType === 'ManyToMany') {
          fieldDescription += field.relationOwner ? ' (propriétaire)' : ' (non-propriétaire)';
        }
      }

      if (field.required) fieldDescription += ' [Obligatoire]';
      if (field.unique) fieldDescription += ' [Unique]';

      this.log(chalk.cyan(fieldDescription));
    });

    this.log(chalk.cyan('\nComposants à générer:'));
    this.log(chalk.cyan('- Entité: ') + chalk.yellow(this.answers.entityName));
    this.log(chalk.cyan('- Repository: ') + chalk.yellow(`${this.answers.entityName}Repository`));

    if (this.answers.generateService) {
      this.log(chalk.cyan('- Service: ') + chalk.yellow(`${this.answers.entityName}Service`));
    }

    if (this.answers.generateController) {
      this.log(chalk.cyan('- Controller: ') + chalk.yellow(`${this.answers.entityName}Controller`));
    }

    if (this.answers.generateDto) {
      this.log(chalk.cyan('- DTO: ') + chalk.yellow(`${this.answers.entityName}DTO`));
    }

    if (this.answers.microserviceArchitecture) {
      this.log(chalk.cyan('\nArchitecture: ') + chalk.yellow('Microservice'));
    } else {
      this.log(chalk.cyan('\nArchitecture: ') + chalk.yellow('Monolithique'));
    }
  }

  configuring() {
    // Traitement et validation des données avant la génération
  }

  writing() {
    const { entityName, packageName, tableName } = this.answers;

    // Générer l'entité
    this._generateEntity();

    // Générer le repository
    this._generateRepository();

    // Générer le DTO si demandé
    if (this.answers.generateDto) {
      this._generateDTO();
    }

    // Générer le service si demandé
    if (this.answers.generateService) {
      this._generateService();
    }

    // Générer le controller si demandé
    if (this.answers.generateController) {
      this._generateController();
    }

    // Générer les énumérations nécessaires
    this._generateEnums();
  }

  _generateEntity() {
    const { entityName, packageName, tableName } = this.answers;
    const entityPackagePath = packageName.replace(/\./g, '/');
    const filePath = `src/main/java/${entityPackagePath}/${entityName}.java`;

    this.log(chalk.blue(`Génération de l'entité ${entityName} dans ${filePath}...`));

    // Imports nécessaires
    let imports = new Set([
      'jakarta.persistence.*',
      'lombok.AllArgsConstructor',
      'lombok.Builder',
      'lombok.Data',
      'lombok.NoArgsConstructor',
      'java.io.Serializable',
      'java.time.LocalDateTime'
    ]);

    // Ajouter des imports selon les types de champs
    this.entityFields.forEach(field => {
      if (field.fieldType === 'LocalDate') {
        imports.add('java.time.LocalDate');
      } else if (field.fieldType === 'BigDecimal') {
        imports.add('java.math.BigDecimal');
      } else if (['OneToMany', 'ManyToMany'].includes(field.fieldType)) {
        imports.add('java.util.Set');
        imports.add('java.util.HashSet');
      }
    });

    // Génération des imports
    let importsCode = Array.from(imports).map(imp => `import ${imp};`).join('\n');

    // Génération des champs de l'entité
    let fieldsCode = this.entityFields.map(field => {
      let code = '';

      // Annotations de colonne
      if (['ManyToOne', 'OneToMany', 'ManyToMany'].includes(field.fieldType)) {
        if (field.fieldType === 'ManyToOne') {
          code += `    @ManyToOne\n`;
          code += `    @JoinColumn(name = "${field.columnName}_id"${field.required ? '' : ', nullable = true'})\n`;
        } else if (field.fieldType === 'OneToMany') {
          code += `    @OneToMany(mappedBy = "${this._toLowerCamelCase(entityName)}")\n`;
        } else if (field.fieldType === 'ManyToMany') {
          if (field.relationOwner) {
            code += `    @ManyToMany\n`;
            code += `    @JoinTable(\n`;
            code += `        name = "${tableName}_${this._toSnakeCase(pluralize.plural(field.relatedEntity))}",\n`;
            code += `        joinColumns = @JoinColumn(name = "${this._toSnakeCase(entityName)}_id"),\n`;
            code += `        inverseJoinColumns = @JoinColumn(name = "${this._toSnakeCase(field.relatedEntity)}_id")\n`;
            code += `    )\n`;
          } else {
            code += `    @ManyToMany(mappedBy = "${this._toLowerCamelCase(pluralize.plural(entityName))}")\n`;
          }
        }
      } else {
        let columnOptions:any = [];

        columnOptions.push(`name = "${field.columnName}"`);

        if (field.required) {
          columnOptions.push('nullable = false');
        }

        if (field.unique) {
          columnOptions.push('unique = true');
        }

        if (field.fieldType === 'String' && field.maxLength) {
          columnOptions.push(`length = ${field.maxLength}`);
        }

        code += `    @Column(${columnOptions.join(', ')})\n`;
      }

      // Type de champ
      let fieldType = field.fieldType;

      if (['ManyToOne', 'OneToMany', 'ManyToMany'].includes(field.fieldType)) {
        if (field.fieldType === 'ManyToOne') {
          fieldType = field.relatedEntity;
        } else if (field.fieldType === 'OneToMany' || field.fieldType === 'ManyToMany') {
          fieldType = `Set<${field.relatedEntity}>`;
        }
      } else if (field.fieldType === 'Enum') {
        fieldType = field.enumName;
      }

      code += `    private ${fieldType} ${field.fieldName}`;

      // Valeurs par défaut pour les collections
      if (['OneToMany', 'ManyToMany'].includes(field.fieldType)) {
        code += ` = new HashSet<>()`;
      }

      code += ';\n';
      return code;
    }).join('\n');

    // Génération du code de l'entité
    let entityCode = `package ${packageName};

${importsCode}

/**
 * ${entityName}
 * Entité JPA représentant la table ${tableName}
 */
@Entity
@Table(name = "${tableName}")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ${entityName} implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    
${fieldsCode}
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}`;

    this.fs.write(filePath, entityCode);
  }

  _generateRepository() {
    const { entityName, packageName } = this.answers;
    const repoPackageName = packageName.replace(/\.domain|\.entity|\.model/, '.repository');
    const repoPackagePath = repoPackageName.replace(/\./g, '/');
    const filePath = `src/main/java/${repoPackagePath}/${entityName}Repository.java`;

    this.log(chalk.blue(`Génération du repository ${entityName}Repository dans ${filePath}...`));

    const repositoryCode = `package ${repoPackageName};

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ${packageName}.${entityName};

/**
 * Repository pour ${entityName}
 */
@Repository
public interface ${entityName}Repository extends JpaRepository<${entityName}, Long> {
    
    // TODO: Ajouter des méthodes de requête personnalisées
    
}`;

    this.fs.write(filePath, repositoryCode);
  }

  _generateDTO() {
    const { entityName, packageName } = this.answers;
    const dtoPackageName = packageName.replace(/\.domain|\.entity|\.model/, '.dto');
    const dtoPackagePath = dtoPackageName.replace(/\./g, '/');
    const filePath = `src/main/java/${dtoPackagePath}/${entityName}DTO.java`;

    this.log(chalk.blue(`Génération du DTO ${entityName}DTO dans ${filePath}...`));

    // Imports nécessaires
    let imports = new Set([
      'lombok.AllArgsConstructor',
      'lombok.Builder',
      'lombok.Data',
      'lombok.NoArgsConstructor',
      'java.io.Serializable'
    ]);

    // Ajouter des imports selon les types de champs
    this.entityFields.forEach(field => {
      if (field.fieldType === 'LocalDate') {
        imports.add('java.time.LocalDate');
      } else if (field.fieldType === 'LocalDateTime') {
        imports.add('java.time.LocalDateTime');
      } else if (field.fieldType === 'BigDecimal') {
        imports.add('java.math.BigDecimal');
      }
    });

    // Import de l'entité pour la méthode de conversion
    imports.add(`${packageName}.${entityName}`);

    // Génération des imports
    let importsCode = Array.from(imports).map(imp => `import ${imp};`).join('\n');

    // Génération des champs du DTO
    let fieldsCode = this.entityFields.map(field => {
      let fieldType = field.fieldType;

      if (['ManyToOne', 'OneToMany', 'ManyToMany'].includes(field.fieldType)) {
        if (field.fieldType === 'ManyToOne') {
          return `    private Long ${field.fieldName}Id;`;
        } else {
          // Pour les relations OneToMany et ManyToMany, on n'inclut pas ces champs dans le DTO de base
          return null;
        }
      } else if (field.fieldType === 'Enum') {
        fieldType = field.enumName;
      }

      return `    private ${fieldType} ${field.fieldName};`;
    }).filter(Boolean).join('\n');

    // Méthodes de conversion
    const fromEntityMethod = `    /**
     * Convertit une entité en DTO
     * @param entity l'entité à convertir
     * @return le DTO correspondant
     */
    public static ${entityName}DTO fromEntity(${entityName} entity) {
        if (entity == null) {
            return null;
        }
        
        ${entityName}DTOBuilder builder = ${entityName}DTO.builder()
            .id(entity.getId())${this.entityFields.map(field => {
              if (['ManyToOne', 'OneToMany', 'ManyToMany'].includes(field.fieldType)) {
                if (field.fieldType === 'ManyToOne') {
                  return `\n            .${field.fieldName}Id(entity.get${field.fieldName.charAt(0).toUpperCase() + field.fieldName.slice(1)}() != null ? entity.get${field.fieldName.charAt(0).toUpperCase() + field.fieldName.slice(1)}().getId() : null)`;
                } else {
                  return '';
                }
              } else {
                return `\n            .${field.fieldName}(entity.get${field.fieldName.charAt(0).toUpperCase() + field.fieldName.slice(1)}())`;
              }
            }).filter(Boolean).join('')};
            
        return builder.build();
    }`;

    const toEntityMethod = `    /**
     * Convertit ce DTO en entité
     * @return l'entité correspondante
     */
    public ${entityName} toEntity() {
        ${entityName}Builder builder = ${entityName}.builder()
            .id(this.id)${this.entityFields.map(field => {
              if (['ManyToOne', 'OneToMany', 'ManyToMany'].includes(field.fieldType)) {
                // Pour les relations, on ne gère pas la conversion ici
                return '';
              } else {
                return `\n            .${field.fieldName}(this.${field.fieldName})`;
              }
            }).filter(Boolean).join('')};
            
        return builder.build();
    }`;

    // Génération du code du DTO
    const dtoCode = `package ${dtoPackageName};

${importsCode}

/**
 * DTO pour ${entityName}
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ${entityName}DTO implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    private Long id;
    
${fieldsCode}
    
${fromEntityMethod}
    
${toEntityMethod}
}`;

    this.fs.write(filePath, dtoCode);
  }

  _generateService() {
    const { entityName, packageName } = this.answers;
    const servicePackageName = packageName.replace(/\.domain|\.entity|\.model/, '.service');
    const servicePackagePath = servicePackageName.replace(/\./g, '/');

    // Générer l'interface du service
    const interfacePath = `src/main/java/${servicePackagePath}/${entityName}Service.java`;

    this.log(chalk.blue(`Génération du service ${entityName}Service dans ${interfacePath}...`));

    // Imports pour l'interface
    const interfaceImports = this.answers.generateDto
      ? `import ${packageName.replace(/\.domain|\.entity|\.model/, '.dto')}.${entityName}DTO;`
      : `import ${packageName}.${entityName};`;

    const dataType = this.answers.generateDto ? `${entityName}DTO` : entityName;

    const interfaceCode = `package ${servicePackageName};

import java.util.List;
import java.util.Optional;
${interfaceImports}

/**
 * Service pour ${entityName}
 */
public interface ${entityName}Service {
    
    /**
     * Récupère toutes les instances
     * @return Liste des instances
     */
    List<${dataType}> findAll();
    
    /**
     * Récupère une instance par son ID
     * @param id ID de l'instance
     * @return L'instance trouvée, ou empty si non trouvée
     */
    Optional<${dataType}> findById(Long id);
    
    /**
     * Crée une nouvelle instance
     * @param data Les données pour créer l'instance
     * @return L'instance créée
     */
    ${dataType} save(${dataType} data);
    
    /**
     * Met à jour une instance existante
     * @param id ID de l'instance
     * @param data Les nouvelles données
     * @return L'instance mise à jour
     */
    ${dataType} update(Long id, ${dataType} data);
    
    /**
     * Supprime une instance
     * @param id ID de l'instance à supprimer
     */
    void delete(Long id);
}`;

    this.fs.write(interfacePath, interfaceCode);

    // Générer l'implémentation du service
    const implPath = `src/main/java/${servicePackagePath}/impl/${entityName}ServiceImpl.java`;

    this.log(chalk.blue(`Génération de l'implémentation du service ${entityName}ServiceImpl dans ${implPath}...`));

    // Imports pour l'implémentation
    let implImports = new Set([
      'org.springframework.stereotype.Service',
      'lombok.RequiredArgsConstructor',
      'java.util.List',
      'java.util.Optional',
      'java.util.stream.Collectors',
      `${servicePackageName}.${entityName}Service`,
      `${packageName.replace(/\.domain|\.entity|\.model/, '.repository')}.${entityName}Repository`,
      `${packageName}.${entityName}`
    ]);

    if (this.answers.generateDto) {
      implImports.add(`${packageName.replace(/\.domain|\.entity|\.model/, '.dto')}.${entityName}DTO`);
    }

    // Génération des imports
    const implImportsCode = Array.from(implImports).map(imp => `import ${imp};`).join('\n');

    // Logique de service différente selon le cas avec ou sans DTO
    let serviceLogic = '';

    if (this.answers.generateDto) {
      serviceLogic = `    @Override
    public List<${entityName}DTO> findAll() {
        return repository.findAll().stream()
                .map(${entityName}DTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    @Override
    public Optional<${entityName}DTO> findById(Long id) {
        return repository.findById(id)
                .map(${entityName}DTO::fromEntity);
    }
    
    @Override
    public ${entityName}DTO save(${entityName}DTO dto) {
        ${entityName} entity = dto.toEntity();
        entity = repository.save(entity);
        return ${entityName}DTO.fromEntity(entity);
    }
    
    @Override
    public ${entityName}DTO update(Long id, ${entityName}DTO dto) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("${entityName} with id " + id + " not found");
        }
        
        ${entityName} entity = dto.toEntity();
        entity.setId(id);
        entity = repository.save(entity);
        return ${entityName}DTO.fromEntity(entity);
    }
    
    @Override
    public void delete(Long id) {
        repository.deleteById(id);
    }`;
    } else {
      serviceLogic = `    @Override
    public List<${entityName}> findAll() {
        return repository.findAll();
    }
    
    @Override
    public Optional<${entityName}> findById(Long id) {
        return repository.findById(id);
    }
    
    @Override
    public ${entityName} save(${entityName} entity) {
        return repository.save(entity);
    }
    
    @Override
    public ${entityName} update(Long id, ${entityName} entity) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("${entityName} with id " + id + " not found");
        }
        
        entity.setId(id);
        return repository.save(entity);
    }
    
    @Override
    public void delete(Long id) {
        repository.deleteById(id);
    }`;
    }

    const implCode = `package ${servicePackageName}.impl;

${implImportsCode}

/**
 * Implémentation du service pour ${entityName}
 */
@Service
@RequiredArgsConstructor
public class ${entityName}ServiceImpl implements ${entityName}Service {

    private final ${entityName}Repository repository;
    
${serviceLogic}
}`;

    // Créer le répertoire impl s'il n'existe pas
    const implDir = path.dirname(implPath);
    if (!fs.existsSync(implDir)) {
      fs.mkdirSync(implDir, { recursive: true });
    }

    this.fs.write(implPath, implCode);
  }

  _generateController() {
    const { entityName, packageName } = this.answers;
    const controllerPackageName = packageName.replace(/\.domain|\.entity|\.model/, '.controller');
    const controllerPackagePath = controllerPackageName.replace(/\./g, '/');
    const filePath = `src/main/java/${controllerPackagePath}/${entityName}Controller.java`;

    this.log(chalk.blue(`Génération du controller ${entityName}Controller dans ${filePath}...`));

    // Imports
    let imports = new Set([
      'org.springframework.web.bind.annotation.*',
      'org.springframework.http.ResponseEntity',
      'lombok.RequiredArgsConstructor',
      'java.util.List'
    ]);

    const servicePackageName = packageName.replace(/\.domain|\.entity|\.model/, '.service');
    imports.add(`${servicePackageName}.${entityName}Service`);

    if (this.answers.generateDto) {
      imports.add(`${packageName.replace(/\.domain|\.entity|\.model/, '.dto')}.${entityName}DTO`);
    } else {
      imports.add(`${packageName}.${entityName}`);
    }

    // Génération des imports
    const importsCode = Array.from(imports).map(imp => `import ${imp};`).join('\n');

    // Type de données utilisé
    const dataType = this.answers.generateDto ? `${entityName}DTO` : entityName;

    // Chemin de base du contrôleur
    const basePath = `/api/${this._toLowerCamelCase(pluralize.plural(entityName))}`;

    // Génération du code du contrôleur
    const controllerCode = `package ${controllerPackageName};

${importsCode}

/**
 * REST Controller pour ${entityName}
 */
@RestController
@RequestMapping("${basePath}")
@RequiredArgsConstructor
public class ${entityName}Controller {
    
    private final ${entityName}Service service;
    
    /**
     * Récupère toutes les instances
     * @return Liste des instances
     */
    @GetMapping
    public ResponseEntity<List<${dataType}>> getAll() {
        List<${dataType}> items = service.findAll();
        return ResponseEntity.ok(items);
    }
    
    /**
     * Récupère une instance par son ID
     * @param id ID de l'instance
     * @return L'instance trouvée
     */
    @GetMapping("/{id}")
    public ResponseEntity<${dataType}> getById(@PathVariable Long id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Crée une nouvelle instance
     * @param data Les données pour créer l'instance
     * @return L'instance créée
     */
    @PostMapping
    public ResponseEntity<${dataType}> create(@RequestBody ${dataType} data) {
        ${dataType} created = service.save(data);
        return ResponseEntity.ok(created);
    }
    
    /**
     * Met à jour une instance existante
     * @param id ID de l'instance
     * @param data Les nouvelles données
     * @return L'instance mise à jour
     */
    @PutMapping("/{id}")
    public ResponseEntity<${dataType}> update(@PathVariable Long id, @RequestBody ${dataType} data) {
        try {
            ${dataType} updated = service.update(id, data);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Supprime une instance
     * @param id ID de l'instance à supprimer
     * @return Réponse vide
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}`;

    // Créer le répertoire controller s'il n'existe pas
    const controllerDir = path.dirname(filePath);
    if (!fs.existsSync(controllerDir)) {
      fs.mkdirSync(controllerDir, { recursive: true });
    }

    this.fs.write(filePath, controllerCode);
  }

  _generateEnums() {
    // Chercher les champs de type Enum et générer les fichiers d'énumération
    const enumFields = this.entityFields.filter(field => field.fieldType === 'Enum');
    const { packageName } = this.answers;

    for (const field of enumFields) {
      const enumName = field.enumName;
      const enumPackageName = `${packageName}.enums`;
      const enumPackagePath = enumPackageName.replace(/\./g, '/');
      const filePath = `src/main/java/${enumPackagePath}/${enumName}.java`;

      this.log(chalk.blue(`Génération de l'énumération ${enumName} dans ${filePath}...`));

      // Convertir les valeurs en format énumération
      const enumValues = field.enumValues.split(',')
        .map(value => value.trim())
        .map(value => value.toUpperCase().replace(/\s+/g, '_'))
        .join(',\n    ');

      const enumCode = `package ${enumPackageName};

/**
 * Énumération pour ${enumName}
 */
public enum ${enumName} {
    ${enumValues}
}`;

      // Créer le répertoire enums s'il n'existe pas
      const enumsDir = path.dirname(filePath);
      if (!fs.existsSync(enumsDir)) {
        fs.mkdirSync(enumsDir, { recursive: true });
      }

      this.fs.write(filePath, enumCode);
    }
  }

  end() {
    this.log(chalk.green.bold(`\n✅ L'entité ${this.answers.entityName} et ses composants associés ont été générés avec succès!`));

    if (this.answers.generateController) {
      this.log(chalk.cyan(`\nAPI REST disponible à l'adresse: `) +
                chalk.yellow(`http://localhost:8080/api/${this._toLowerCamelCase(pluralize.plural(this.answers.entityName))}`));
    }

    this.log(chalk.yellow("\nPensez à adapter les relations et les conversions DTO selon vos besoins spécifiques."));
  }

  // Méthodes privées utilitaires

  /**
   * Détecte automatiquement le package principal du projet
   * @returns Le nom du package détecté ou un package par défaut
   */
  _detectPackageName() {
    try {
      // Recherche dans les fichiers Java pour trouver le package
      const javaFiles = this._findJavaFiles('src/main/java');
      if (javaFiles.length > 0) {
        const content = fs.readFileSync(javaFiles[0], 'utf8');
        const packageMatch = content.match(/package\s+([\w.]+);/);
        if (packageMatch && packageMatch[1]) {
          return packageMatch[1].split('.').slice(0, 2).join('.');
        }
      }
    } catch (error) {
      this.log(chalk.yellow("Impossible de détecter automatiquement le package. Utilisation du package par défaut."));
    }
    return 'com.example.app';
  }

  /**
   * Trouve les fichiers Java dans un répertoire
   * @param dir Le répertoire à explorer
   * @returns Liste des chemins de fichiers Java
   */
  _findJavaFiles(dir) {
    let results: string[] = [];
    if (!fs.existsSync(dir)) return results;

    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        results = results.concat(this._findJavaFiles(filePath));
      } else if (file.endsWith('.java')) {
        results.push(filePath);
      }
    }

    return results;
  }

  /**
   * Convertit une chaîne en snake_case
   * @param str La chaîne à convertir
   * @returns La chaîne en snake_case
   */
  _toSnakeCase(str) {
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[\s-]+/g, '_')
      .toLowerCase();
  }

  /**
   * Convertit une chaîne en camelCase
   * @param str La chaîne à convertir
   * @returns La chaîne en camelCase
   */
  _toLowerCamelCase(str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }
}
