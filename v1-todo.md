# Spring-Fullstack-Speed v1.0 - Liste des tâches pour la publication

## 🚧 Tâches à accomplir avant la publication de la version 1.0
  ## si une tache est déjà faite, cochez la case correspondante
    ## soit sure que ca marcha avant de cocher la case (build, test, etc.) pour Comandes on sur environment windows
## IMPORTANT : Tu est sur windows, donc utilise les commandes adaptées pour windows, et pas celles de linux/mac
# NOTE IMPORTANT :
* IMPORTANT *  ## AVANT DE COMMENCER UNE TÂCHE FAIT `tree -a generators (linux,marc)` `tree .\generators\ /f  (windows)`  Pour vérifier la structure du projet pour éviter les erreurs de structure. et la duplication de code

## 📋 Vérification et finalisation

### Codebase
- [x] Vérifier que tous les générateurs sont fonctionnels et produisent du code valide
- [x] Résoudre les problèmes de compilation TypeScript (particulièrement les erreurs d'ESM)
- [x] Éliminer les warnings et les erreurs non critiques
- [x] Vérifier la cohérence des options entre tous les générateurs
- [x] S'assurer que les générateurs respectent les mêmes conventions de nommage et de structure
- [x] Vérifier la compatibilité des templates avec les dernières versions des frameworks

### Tests
- [x] Finaliser et exécuter tous les tests unitaires pour chaque générateur
- [x] Ajouter des tests d'intégration pour s'assurer que les différentes combinaisons fonctionnent
- [x] Exécuter des tests end-to-end qui simulent des cas d'utilisation réels
- [x] Vérifier que les tests couvrent les cas limites et les erreurs potentielles
- [x] Exécuter les tests sur différentes plateformes (Windows, Linux, macOS)

### Documentation
- [x] Finaliser la documentation utilisateur (tutoriels, guides, exemples)
- [x] Créer un guide de démarrage rapide (Quick Start Guide)
- [x] Documenter toutes les commandes et options disponibles
- [x] Préparer une documentation détaillée pour chaque générateur
- [x] Ajouter des exemples illustrant les cas d'utilisation les plus courants
- [x] Mettre à jour le fichier README.md principal
- [ ] Créer un site de documentation (optionnel - avec GitBook ou Docusaurus)

### Préparation à la publication
- [x] Définir la stratégie de versionnement (SemVer recommandé)
- [x] Mettre à jour le numéro de version dans package.json à 1.0.0
- [x] Préparer le CHANGELOG.md pour documenter les changements
- [x] Vérifier que toutes les dépendances sont à jour et compatibles
- [x] S'assurer que le package.json est complet (nom, description, keywords, auteur, licence, etc.)
- [x] Vérifier que le fichier .npmignore/.gitignore est correctement configuré
- [x] Préparer les métadonnées pour npm (description, tags, etc.)
- [x] Créer un script de build pour la préparation de la version de production

## 🚀 Publication

### Packaging et Distribution
- [ ] Exécuter une version d'essai de la publication avec `npm pack`
- [ ] Vérifier le contenu du package généré pour s'assurer qu'il est complet
- [ ] Préparer un script d'installation pour les utilisateurs (`npm install -g @enokdev/spring-fullstack-speed`)
- [ ] Tester l'installation et l'utilisation du package depuis npm

### Publication npm
- [ ] Créer un compte npm si ce n'est pas déjà fait
- [ ] S'authentifier avec `npm login`
- [ ] Publier avec `npm publish --access=public` (ou privé selon la stratégie)
- [ ] Vérifier la publication sur le registre npm

### GitHub
- [ ] Créer une release GitHub correspondant à la version 1.0.0
- [ ] Ajouter des notes de release détaillées
- [ ] Préparer des assets pour la release (si nécessaire)
- [ ] Taguer le commit de release avec `v1.0.0`

## �� Marketing et Communication

### Annonce et Promotion
- [ ] Préparer un article de blog ou un post pour annoncer la sortie
- [ ] Créer des exemples de démonstration pour showcases
- [ ] Préparer des screenshots ou des GIFs démontrant les fonctionnalités
- [ ] Partager sur les réseaux sociaux et les communautés pertinentes (Reddit, HN, Twitter, etc.)
- [ ] Contacter des influenceurs ou des blogs tech qui pourraient être intéressés

### Support
- [ ] Mettre en place un système pour les issues et les PR sur GitHub
- [ ] Créer un canal de communication pour les questions d'utilisateurs (Discord, Slack, etc.)
- [ ] Pr��parer des réponses aux questions fréquemment posées (FAQ)

## 🔄 Post-lancement

### Suivi et Amélioration
- [ ] Surveiller les retours des utilisateurs et les issues GitHub
- [ ] Planifier les corrections de bugs et les améliorations mineures pour v1.0.1
- [ ] Commencer à planifier les fonctionnalités pour la v1.1.0
- [ ] Collecter des statistiques d'utilisation (si applicable)
- [ ] Évaluer les domaines qui nécessitent plus de documentation ou d'exemples

### Maintenance continue
- [ ] Établir un calendrier pour les mises à jour de dépendances
- [ ] Mettre en place des tests de régression automatisés
- [ ] Créer une roadmap publique pour les futures fonctionnalités
- [ ] Définir un processus pour accepter les contributions de la communauté

---

## ⚠️ Points d'attention particuliers

1. **Résoudre les problèmes de compilation** observés lors des tests du générateur unifié
2. **Vérifier la compatibilité avec Node.js 20+** qui est mentionné dans le planning comme requis
3. **Tester tous les générateurs** pour s'assurer qu'ils sont fonctionnels avant la publication
4. **Assurer une expérience utilisateur cohérente** à travers tous les générateurs
5. **Documenter clairement les prérequis** (versions de Java, Node.js, etc.)






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
      // Continuer tout de même pour l'utilisateur
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
        packageName: "com.example.fullstack", // Valeur par défaut à remplacer par une détection réelle
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
    
    // Déterminer le package de base de manière robuste
    const basePackage = opts.package 
      || (this.projectConfig?.packageName ? `${this.projectConfig.packageName}` : 'com.example.fullstack');
    
    const answers: Partial<EntityGeneratorAnswers> = {
      entityName: opts.entityName,
      packageName: basePackage,
      // Ajouter d'autres valeurs par défaut si nécessaire...
    };

    this.log(INFO_COLOR(`[DEBUG] prompting() - basePackage initialisé à: '${basePackage}'`));

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
* Génère les fichiers pour l'entité et ses composants associés
  */
  // Utilitaire pour obtenir le package complet sans doublon
  getSubPackage(base: string | undefined, sub: string) {
  this.log(INFO_COLOR(`[DEBUG getSubPackage] ENTREE: base='${base}', sub='${sub}'`));
  // Validation stricte du paramètre base
  if (!base || typeof base !== "string" || base.trim() === '' || base === 'undefined') {
  this.log(ERROR_COLOR(`[BUG] getSubPackage: base packageName est undefined ou invalide (valeur: '${base}')`));
  this.log(ERROR_COLOR(`[DEBUG] getSubPackage - this.answers: ${JSON.stringify(this.answers)}`));
  this.log(ERROR_COLOR(`[DEBUG] getSubPackage - this.options: ${JSON.stringify(this.options)}`));
  // Tentative de récupération d'urgence
  const fallbackPackage = this.answers?.packageName ||
  this.options.package
  || (this.projectConfig?.packageName ? `${this.projectConfig.packageName}` : 'com.example.fullstack');
  this.log(ERROR_COLOR(`[RECOVERY] Tentative de récupération avec le package: '${fallbackPackage}'`));
  if (fallbackPackage && typeof fallbackPackage === 'string' && fallbackPackage !== 'undefined') {
  this.log(SUCCESS_COLOR(`[RECOVERY] Package de secours trouvé: '${fallbackPackage}'`));
  base = fallbackPackage;
  } else {
  this.log(ERROR_COLOR(`[RECOVERY] Utilisation du package par défaut`));
  base = 'com.example.fullstack';
  }
  }
  // Validation stricte du paramètre sub
  if (!sub || typeof sub !== 'string' || sub.trim() === '' || sub === 'undefined') {
  this.log(ERROR_COLOR(`[FATAL] getSubPackage: sub packageName est undefined ou invalide (valeur: '${sub}')`));
  throw new Error("Le sous-package (sub) ne doit jamais être undefined ou vide dans getSubPackage. Corrigez l'appelant.");
  }
  // Nettoyage et validation
  base = base.trim();
  if (base.length === 0) {
  this.log(ERROR_COLOR(`[BUG] getSubPackage: base packageName est vide après nettoyage`));
  base = 'com.example.fullstack';
  }
  const result = base.endsWith(`.${sub}`) ? base : `${base}.${sub}`;
  this.log(INFO_COLOR(`[DEBUG getSubPackage] SORTIE: '${result}'`));
  return result;
  }

async writing() {
// Sauvegarder les réponses avant askForFields
const packageNameBackup = this.answers?.packageName || this.options.package || 'com.example.fullstack';

    // S'assurer que les champs sont bien définis avant de générer
    if (!this.entityFields || this.entityFields.length === 0) {
      this.log(INFO_COLOR("[DEBUG] writing() - Appel automatique de askForFields() car entityFields est vide"));
      await this.askForFields();
    }
    
    // Restaurer packageName s'il a été perdu
    if (!this.answers?.packageName || this.answers.packageName === 'undefined') {
      this.log(ERROR_COLOR(`[DEBUG] writing() - packageName perdu après askForFields, restauration: '${packageNameBackup}'`));
      if (!this.answers) {
        this.answers = {} as EntityGeneratorAnswers;
      }
      this.answers.packageName = packageNameBackup;
    }
    
    // Log complet pour debug
    this.log(INFO_COLOR(`[DEBUG] writing() - this.answers: ${JSON.stringify(this.answers)}`));

    // CORRECTION : Extraire et sécuriser la valeur de packageName
    // juste avant la génération des sous-packages
    const entityName = this.answers.entityName;
    const packageName = this.answers.packageName || packageNameBackup;

    this.log(INFO_COLOR(`[DEBUG] Utilisation de packageName: '${packageName}'`));
    if (!packageName || packageName === 'undefined') {
      this.displayError("[FATAL] packageName est toujours indéfini malgré la restauration de sauvegarde");
      return;
    }

    // Correction : s'assurer que sub n'est jamais undefined
    let entityPackage, repositoryPackage, servicePackage, controllerPackage, dtoPackage;
    try {
      entityPackage = this.getSubPackage(packageName, 'entity');
      repositoryPackage = this.getSubPackage(packageName, 'repository');
      servicePackage = this.getSubPackage(packageName, 'service');
      controllerPackage = this.getSubPackage(packageName, 'controller');
      dtoPackage = this.getSubPackage(packageName, 'dto');
    } catch (e) {
      this.displayError(`[FATAL] Erreur lors de la génération des sous-packages : ${e}`);
      return;
    }

    // Sécurisation des chemins
    const entityDir = `src/main/java/${entityPackage.replace(/\./g, '/')}`;
    const repositoryDir = `src/main/java/${repositoryPackage.replace(/\./g, '/')}`;
    const serviceDir = `src/main/java/${servicePackage.replace(/\./g, '/')}`;
    const controllerDir = `src/main/java/${controllerPackage.replace(/\./g, '/')}`;
    const dtoDir = `src/main/java/${dtoPackage.replace(/\./g, '/')}`;

    this.log(INFO_COLOR(`[DEBUG] entityDir = ${entityDir}`));
    this.log(INFO_COLOR(`[DEBUG] repositoryDir = ${repositoryDir}`));
    this.log(INFO_COLOR(`[DEBUG] serviceDir = ${serviceDir}`));
    this.log(INFO_COLOR(`[DEBUG] controllerDir = ${controllerDir}`));
    this.log(INFO_COLOR(`[DEBUG] dtoDir = ${dtoDir}`));

    // Préparer les données communes pour les templates
    const templateData = {
      entityName,
      packageName: entityPackage,
      fields: this.entityFields,
      auditable: this.answers.auditable,
      dateTimeImport: this.hasDateTimeFields(),
      bigDecimalImport: this.hasBigDecimalFields(),
    };

    this.log("");
    this.log(STEP_PREFIX + chalk.bold("GÉNÉRATION DES FICHIERS"));
    this.log(SECTION_DIVIDER);

    try {
      // Entity
      this.log(INFO_COLOR(`[DEBUG] writing() - entityDir: '${entityDir}'`));
      this.ensureDirectoryExists(entityDir);
      this.renderTemplate(
        'entity/Entity.java.ejs',
        `${entityDir}/${entityName}.java`,
        templateData
      );
      this.displaySuccess(`Entité ${entityName}.java générée`);

      // Repository
      if (this.answers.generateRepository) {
        this.ensureDirectoryExists(repositoryDir);
        this.renderTemplate(
          'entity/Repository.java.ejs',
          `${repositoryDir}/${entityName}Repository.java`,
          {
            ...templateData,
            packageName: repositoryPackage,
            entityPackageName: entityPackage
          }
        );
        this.displaySuccess(`Repository ${entityName}Repository.java généré`);
      }

      // Service
      if (this.answers.generateService) {
        this.ensureDirectoryExists(serviceDir);
        this.renderTemplate(
          'entity/Service.java.ejs',
          `${serviceDir}/${entityName}Service.java`,
          {
            ...templateData,
            packageName: servicePackage,
            entityPackageName: entityPackage,
            repositoryPackageName: repositoryPackage
          }
        );
        this.renderTemplate(
          'entity/ServiceImpl.java.ejs',
          `${serviceDir}/${entityName}ServiceImpl.java`,
          {
            ...templateData,
            packageName: servicePackage,
            entityPackageName: entityPackage,
            repositoryPackageName: repositoryPackage
          }
        );
        this.displaySuccess(`Service ${entityName}Service.java et implémentation générés`);
      }

      // Controller
      if (this.answers.generateController) {
        this.ensureDirectoryExists(controllerDir);
        this.renderTemplate(
          'entity/Controller.java.ejs',
          `${controllerDir}/${entityName}Controller.java`,
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
        );
        this.displaySuccess(`Controller ${entityName}Controller.java généré`);
      }

      // DTO
      if (this.answers.generateDto) {
        this.ensureDirectoryExists(dtoDir);
        this.renderTemplate(
          'entity/EntityDTO.java.ejs',
          `${dtoDir}/${entityName}DTO.java`,
          {
            ...templateData,
            packageName: dtoPackage,
            entityPackageName: entityPackage
          }
        );
        this.displaySuccess(`DTO ${entityName}DTO.java généré`);
      }

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
  this.log(INFO_COLOR(`[DEBUG ensureDirectoryExists] dirPath: '${dirPath}'`));

    if (!dirPath || typeof dirPath !== 'string' || dirPath.trim() === '' || dirPath === 'undefined') {
      this.log(ERROR_COLOR(`[BUG] Chemin de dossier invalide passé à ensureDirectoryExists: '${dirPath}'`));
      this.log(ERROR_COLOR(`[DEBUG] Stack trace:`));
      console.error(new Error().stack);
      
      // NE PAS PLANTER - juste retourner
      this.log(ERROR_COLOR(`[RECOVERY] Erreur ignorée pour continuer la génération`));
      return;
    }
    
    const cleanPath = dirPath.trim();
    if (!fs.existsSync(cleanPath)) {
      fs.mkdirSync(cleanPath, { recursive: true });
      this.log(chalk.yellow(`📁 Création du répertoire: ${cleanPath}`));
    } else {
      this.log(INFO_COLOR(`📁 Répertoire existe: ${cleanPath}`));
    }
}

/**
* Render un template EJS et écrit le résultat dans un fichier
  */
  renderTemplate(templatePath: string, destPath: string, data: any): void {
  if (!templatePath || typeof templatePath !== 'string' || templatePath === 'undefined') {
  throw new Error(`[FATAL] renderTemplate: templatePath invalide: '${templatePath}'`);
  }
  if (!destPath || typeof destPath !== 'string' || destPath === 'undefined') {
  throw new Error(`[FATAL] renderTemplate: destPath invalide: '${destPath}'`);
  }
  this.fs.copyTpl(
  this.templatePath(templatePath),
  this.destinationPath(destPath),
  data
  );
  }
  }

// Exporter également en tant que default pour compatibilité avec le système de modules ESM
export default EntityGenerator;









