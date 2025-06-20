/**
 * Générateur pour la commande 'sfs add'
 * Permet d'ajouter des composants à un projet Spring-Fullstack existant
 */

import { BaseGenerator } from "../base-generator.js";
import chalk from "chalk";
import path from "path";
import fs from "fs";
import { showAddComponentsMenu } from "../app/menus.js";

// Styles visuels constants
const STEP_PREFIX = chalk.bold.blue("➤ ");
const SECTION_DIVIDER = chalk.gray("────────────────────────────────────────────");
const INFO_COLOR = chalk.yellow;
const SUCCESS_COLOR = chalk.green;
const ERROR_COLOR = chalk.red;
const HELP_COLOR = chalk.gray.italic;

// Types de composants disponibles
const AVAILABLE_COMPONENTS = {
  security: {
    name: "security",
    description: "Spring Security avec JWT et configurations d'authentification",
    dependencies: [
      { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-security" },
      { groupId: "io.jsonwebtoken", artifactId: "jjwt-api", version: "0.11.5" },
      { groupId: "io.jsonwebtoken", artifactId: "jjwt-impl", version: "0.11.5", scope: "runtime" },
      { groupId: "io.jsonwebtoken", artifactId: "jjwt-jackson", version: "0.11.5", scope: "runtime" }
    ],
    files: [
      "security/SecurityConfig.java",
      "security/JwtAuthenticationFilter.java",
      "security/JwtTokenProvider.java",
      "security/UserDetailsServiceImpl.java",
      "security/CustomUserDetails.java",
      "auth/AuthController.java",
      "auth/LoginRequest.java",
      "auth/SignupRequest.java",
      "auth/TokenResponse.java"
    ]
  },
  swagger: {
    name: "swagger",
    description: "Swagger UI pour la documentation API",
    dependencies: [
      { groupId: "org.springdoc", artifactId: "springdoc-openapi-starter-webmvc-ui", version: "2.2.0" }
    ],
    files: [
      "config/OpenApiConfig.java"
    ]
  },
  redis: {
    name: "redis",
    description: "Support de cache Redis",
    dependencies: [
      { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-data-redis" },
      { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-cache" }
    ],
    files: [
      "config/RedisConfig.java",
      "config/CacheConfig.java"
    ]
  },
  websocket: {
    name: "websocket",
    description: "Support WebSocket pour la communication en temps réel",
    dependencies: [
      { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-websocket" }
    ],
    files: [
      "config/WebSocketConfig.java",
      "websocket/WebSocketController.java",
      "websocket/WebSocketMessage.java"
    ]
  },
  fileupload: {
    name: "fileupload",
    description: "Service de téléchargement de fichiers",
    dependencies: [],
    files: [
      "service/FileStorageService.java",
      "controller/FileUploadController.java",
      "config/FileStorageProperties.java",
      "exception/FileStorageException.java"
    ]
  },
  email: {
    name: "email",
    description: "Service d'envoi d'emails",
    dependencies: [
      { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-mail" },
      { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-thymeleaf" }
    ],
    files: [
      "service/EmailService.java",
      "config/EmailConfig.java",
      "model/EmailDetails.java"
    ]
  },
  monitoring: {
    name: "monitoring",
    description: "Monitoring avec Spring Actuator et Prometheus",
    dependencies: [
      { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-actuator" },
      { groupId: "io.micrometer", artifactId: "micrometer-registry-prometheus" }
    ],
    files: [
      "config/ActuatorConfig.java"
    ]
  },
  i18n: {
    name: "i18n",
    description: "Internationalisation avec support multilingue",
    dependencies: [],
    files: [
      "config/LocaleConfig.java",
      "util/LocaleUtils.java"
    ]
  },
};

export default class AddGenerator extends BaseGenerator {
  declare options: any;
  declare answers: any;
  declare projectConfig: any;
  mainJavaDir: string = "";
  mainResourcesDir: string = "";
  buildTool: string = "maven";
  basePackage: string = "";
  selectedComponents: string[] = [];

  constructor(args: string | string[], options: any) {
    super(args, options);
    
    // Définir les arguments comme propriétés sur this.options
    this.argument("componentType", {
      type: String,
      required: false,
      description: "Type de composant à ajouter (security, swagger, redis, etc.)",
    });

    this.option("interactive", {
      type: Boolean,
      default: true,
      description: "Mode interactif avec questions",
    });
  }

  initializing() {
    this.log(SECTION_DIVIDER);
    this.log(chalk.bold.blue("🔧 SFS ADD - AJOUT DE COMPOSANTS"));
    this.log(SECTION_DIVIDER);
    this.log(HELP_COLOR("Ce générateur va ajouter des composants à votre projet Spring Boot existant"));
    this.log("");

    // Vérifier si nous sommes dans un projet Spring-Fullstack ou un projet Spring Boot standard
    try {
      if (fs.existsSync('.yo-rc.json')) {
        const yoConfig = JSON.parse(fs.readFileSync('.yo-rc.json', 'utf8'));
        this.projectConfig = yoConfig['generator-spring-fullstack'] || null;
        if (this.projectConfig) {
          this.log(SUCCESS_COLOR("✅ Projet Spring-Fullstack détecté!"));
          this.basePackage = this.projectConfig.packageName || 'com.example.app';
          this.buildTool = this.projectConfig.buildTool?.toLowerCase() || 'maven';
        }
      }

      // Détection de la structure en cas de projet non généré par notre outil
      if (!this.projectConfig) {
        // Tentative de détection en cherchant des fichiers caractéristiques
        const hasPomXml = fs.existsSync('pom.xml');
        const hasGradle = fs.existsSync('build.gradle') || fs.existsSync('build.gradle.kts');
        const hasApplication = fs.existsSync('src/main/java');

        if (!(hasPomXml || hasGradle) || !hasApplication) {
          this.log(ERROR_COLOR("⚠️ Ce répertoire ne semble pas contenir un projet Spring Boot."));
          this.log(INFO_COLOR("Exécutez cette commande à la racine d'un projet Spring Boot existant."));
          process.exit(1);
        }

        this.buildTool = hasPomXml ? 'maven' : 'gradle';
        this.log(SUCCESS_COLOR(`✅ Projet Spring Boot détecté! (Build tool: ${this.buildTool})`));

        // Essayer de deviner le package de base
        this.basePackage = this._detectBasePackage() || 'com.example.app';
      }

      // Déterminer les chemins des dossiers source
      this.mainJavaDir = this._findMainJavaDir();
      this.mainResourcesDir = this._findMainResourcesDir();

      this.log(INFO_COLOR(`Package de base détecté: ${this.basePackage}`));
      this.log(INFO_COLOR(`Répertoire Java principal: ${this.mainJavaDir}`));

    } catch (error) {
      this.log(ERROR_COLOR(`Erreur lors de l'initialisation: ${error}`));
      process.exit(1);
    }
  }

  async prompting() {
    // Si le componentType est spécifié en ligne de commande et est valide
    if (this.options.componentType && AVAILABLE_COMPONENTS[this.options.componentType]) {
      this.selectedComponents = [this.options.componentType];
      this.log(SUCCESS_COLOR(`Composant sélectionné: ${AVAILABLE_COMPONENTS[this.options.componentType].description}`));
    }
    // Sinon en mode interactif, afficher le menu de sélection des composants
    else if (this.options.interactive) {
      this.log("");
      this.log(STEP_PREFIX + chalk.bold("SÉLECTION DES COMPOSANTS"));
      this.log(SECTION_DIVIDER);

      const componentChoices = Object.keys(AVAILABLE_COMPONENTS).map(key => ({
        name: `${AVAILABLE_COMPONENTS[key].description}`,
        value: key
      }));

      const { components } = await this.prompt({
        type: "checkbox",
        name: "components",
        message: chalk.cyan("Sélectionnez les composants à ajouter:"),
        choices: componentChoices,
        pageSize: 10,
        validate: (input) => {
          if (input.length === 0) {
            return "Vous devez sélectionner au moins un composant";
          }
          return true;
        }
      });

      this.selectedComponents = components;

      if (this.selectedComponents.includes("security")) {
        await this._promptSecurityConfig();
      }

      if (this.selectedComponents.includes("redis")) {
        await this._promptRedisConfig();
      }
    } else {
      this.log(ERROR_COLOR("Aucun composant valide spécifié. Utilisez --interactive pour sélectionner des composants."));
      process.exit(1);
    }

    // Afficher un résumé des composants sélectionnés
    this.log("");
    this.log(STEP_PREFIX + chalk.bold("RÉSUMÉ DES COMPOSANTS SÉLECTIONNÉS"));
    this.log(SECTION_DIVIDER);

    this.selectedComponents.forEach((componentKey) => {
      this.log(SUCCESS_COLOR(`✅ ${AVAILABLE_COMPONENTS[componentKey].description}`));
    });
  }

  /**
   * Questions spécifiques pour la configuration de la sécurité
   */
  async _promptSecurityConfig() {
    const securityAnswers = await this.prompt([
      {
        type: "confirm",
        name: "useJwt",
        message: chalk.cyan("Utiliser JWT pour l'authentification?"),
        default: true
      },
      {
        type: "input",
        name: "jwtSecret",
        message: chalk.cyan("Clé secrète pour JWT:"),
        default: `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
        when: (answers) => answers.useJwt
      },
      {
        type: "input",
        name: "jwtExpirationMs",
        message: chalk.cyan("Durée de validité du token JWT (en millisecondes):"),
        default: "86400000", // 24 heures
        when: (answers) => answers.useJwt,
        validate: (input) => {
          if (isNaN(parseInt(input))) {
            return "Veuillez entrer un nombre valide";
          }
          return true;
        }
      }
    ]);

    this.answers = { ...this.answers, ...securityAnswers };
  }

  /**
   * Questions spécifiques pour la configuration de Redis
   */
  async _promptRedisConfig() {
    const redisAnswers = await this.prompt([
      {
        type: "input",
        name: "redisHost",
        message: chalk.cyan("Hôte Redis:"),
        default: "localhost"
      },
      {
        type: "input",
        name: "redisPort",
        message: chalk.cyan("Port Redis:"),
        default: "6379",
        validate: (input) => {
          if (isNaN(parseInt(input))) {
            return "Veuillez entrer un nombre valide";
          }
          return true;
        }
      }
    ]);

    this.answers = { ...this.answers, ...redisAnswers };
  }

  /**
   * Trouve le répertoire principal Java du projet
   */
  _findMainJavaDir(): string {
    const possiblePaths = [
      path.join(process.cwd(), 'src/main/java'),
      path.join(process.cwd(), 'src/java')
    ];

    for (const dirPath of possiblePaths) {
      if (fs.existsSync(dirPath)) {
        return dirPath;
      }
    }

    return path.join(process.cwd(), 'src/main/java'); // Fallback sur le chemin standard
  }

  /**
   * Trouve le répertoire principal des ressources du projet
   */
  _findMainResourcesDir(): string {
    const possiblePaths = [
      path.join(process.cwd(), 'src/main/resources'),
      path.join(process.cwd(), 'src/resources')
    ];

    for (const dirPath of possiblePaths) {
      if (fs.existsSync(dirPath)) {
        return dirPath;
      }
    }

    return path.join(process.cwd(), 'src/main/resources'); // Fallback sur le chemin standard
  }

  /**
   * Détecte le package de base du projet
   */
  _detectBasePackage(): string {
    try {
      const javaDir = this._findMainJavaDir();
      if (!fs.existsSync(javaDir)) {
        return '';
      }

      // Recherche d'un fichier Application.java ou *Application.java
      const findAppFile = (dir: string, depth = 0): string => {
        if (depth > 5) return ''; // Limite la profondeur de recherche

        const items = fs.readdirSync(dir);

        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stats = fs.statSync(fullPath);

          if (stats.isDirectory()) {
            const result = findAppFile(fullPath, depth + 1);
            if (result) return result;
          } else if (item.endsWith('Application.java')) {
            return fullPath;
          }
        }

        return '';
      };

      const appFile = findAppFile(javaDir);
      if (!appFile) {
        return '';
      }

      // Extraction du package à partir du fichier
      const content = fs.readFileSync(appFile, 'utf8');
      const packageMatch = content.match(/package\s+([^;]+);/);

      if (packageMatch && packageMatch.length > 1) {
        return packageMatch[1].trim();
      }

      return '';
    } catch (error) {
      return '';
    }
  }

  writing() {
    this.log("");
    this.log(STEP_PREFIX + chalk.bold("AJOUT DES COMPOSANTS"));
    this.log(SECTION_DIVIDER);

    // Pour chaque composant sélectionné, ajouter les fichiers et dépendances nécessaires
    for (const componentKey of this.selectedComponents) {
      const component = AVAILABLE_COMPONENTS[componentKey];
      this._addComponent(component);
    }

    // Mettre à jour le fichier pom.xml ou build.gradle avec les dépendances
    this._updateBuildFile();

    // Mettre à jour application.properties avec les nouvelles configurations
    this._updateApplicationProperties();
  }

  /**
   * Ajoute un composant au projet
   */
  _addComponent(component: any) {
    this.log(INFO_COLOR(`Ajout du composant: ${component.description}`));

    // Génération des fichiers du composant
    for (const filePath of component.files) {
      this._addComponentFile(component.name, filePath);
    }

    this.log(SUCCESS_COLOR(`✅ Composant ${component.name} ajouté`));
  }

  /**
   * Ajoute un fichier de composant
   */
  _addComponentFile(componentName: string, filePath: string) {
    // Préparation du contexte pour le template
    const templateData = {
      basePackage: this.basePackage,
      packageName: `${this.basePackage}.${filePath.split('/')[0]}`,
      className: path.basename(filePath, '.java'),
      answers: this.answers || {}
    };

    // Déterminer le chemin du template source
    const templateSourcePath = `add/${componentName}/${filePath}.ejs`;

    // Déterminer le chemin de destination
    const packagePath = this.basePackage.replace(/\./g, '/');
    const destinationPath = path.join(
      this.mainJavaDir,
      packagePath,
      filePath
    );

    // S'assurer que le dossier de destination existe
    const destinationDir = path.dirname(destinationPath);
    if (!fs.existsSync(destinationDir)) {
      fs.mkdirSync(destinationDir, { recursive: true });
    }

    // Générer le fichier à partir du template
    try {
      this.renderEjsTemplate(templateSourcePath, destinationPath, templateData);
      this.log(`   ${INFO_COLOR(`Fichier créé: ${filePath}`)}`);
    } catch (error) {
      this.log(`   ${ERROR_COLOR(`Erreur lors de la génération de ${filePath}: ${error}`)}`);
    }
  }

  /**
   * Met à jour le fichier de build (pom.xml ou build.gradle) avec les dépendances
   */
  _updateBuildFile() {
    this.log(INFO_COLOR("Mise à jour des dépendances..."));

    // Collecter toutes les dépendances nécessaires
    const dependencies :any = [];
    for (const componentKey of this.selectedComponents) {
      dependencies.push(...AVAILABLE_COMPONENTS[componentKey].dependencies);
    }

    if (this.buildTool === 'maven') {
      this._updatePomXml(dependencies);
    } else {
      this._updateGradleBuild(dependencies);
    }

    this.log(SUCCESS_COLOR("✅ Dépendances mises à jour"));
  }

  /**
   * Met à jour le fichier pom.xml avec les nouvelles dépendances
   */
  _updatePomXml(dependencies: any[]) {
    const pomPath = path.join(process.cwd(), 'pom.xml');

    if (!fs.existsSync(pomPath)) {
      this.log(ERROR_COLOR("Fichier pom.xml non trouvé"));
      return;
    }

    try {
      let pomContent = fs.readFileSync(pomPath, 'utf8');

      // Vérifier si chaque dépendance est déjà présente
      for (const dep of dependencies) {
        const dependencyPattern = new RegExp(
          `<dependency>[\\s\\n]*<groupId>${dep.groupId}</groupId>[\\s\\n]*<artifactId>${dep.artifactId}</artifactId>`,
          'i'
        );

        if (!dependencyPattern.test(pomContent)) {
          // La dépendance n'existe pas, l'ajouter
          const dependencyXml = `\t<dependency>\n\t\t<groupId>${dep.groupId}</groupId>\n\t\t<artifactId>${dep.artifactId}</artifactId>` +
            (dep.version ? `\n\t\t<version>${dep.version}</version>` : '') +
            (dep.scope ? `\n\t\t<scope>${dep.scope}</scope>` : '') +
            `\n\t</dependency>`;

          // Ajouter après la dernière dépendance ou créer la section si elle n'existe pas
          if (pomContent.includes("</dependencies>")) {
            pomContent = pomContent.replace("</dependencies>", `${dependencyXml}\n\t</dependencies>`);
          } else if (pomContent.includes("</project>")) {
            pomContent = pomContent.replace(
              "</project>",
              `\t<dependencies>\n${dependencyXml}\n\t</dependencies>\n</project>`
            );
          }
        }
      }

      fs.writeFileSync(pomPath, pomContent);
    } catch (error) {
      this.log(ERROR_COLOR(`Erreur lors de la mise à jour de pom.xml: ${error}`));
    }
  }

  /**
   * Met à jour le fichier build.gradle avec les nouvelles dépendances
   */
  _updateGradleBuild(dependencies: any[]) {
    const gradlePath = fs.existsSync(path.join(process.cwd(), 'build.gradle.kts'))
      ? path.join(process.cwd(), 'build.gradle.kts')
      : path.join(process.cwd(), 'build.gradle');

    if (!fs.existsSync(gradlePath)) {
      this.log(ERROR_COLOR("Fichier build.gradle non trouvé"));
      return;
    }

    try {
      let gradleContent = fs.readFileSync(gradlePath, 'utf8');
      const isKts = gradlePath.endsWith('.kts');
      let dependenciesToAdd :any = [];

      // Vérifier si chaque dépendance est déjà présente
      for (const dep of dependencies) {
        const dependencyPattern = new RegExp(
          `(implementation|compile|runtime|testImplementation|testCompile)\\s*\\(['"]${dep.groupId}:${dep.artifactId}:?[^'"]*['"]\\)`,
          'i'
        );

        if (!dependencyPattern.test(gradleContent)) {
          const scope = dep.scope === 'runtime' ? 'runtimeOnly' :
                       dep.scope === 'test' ? 'testImplementation' :
                       'implementation';

          // Formater la dépendance selon le format du fichier (Kotlin DSL ou Groovy)
          const dependencyStr = isKts
            ? `${scope}("${dep.groupId}:${dep.artifactId}${dep.version ? `:${dep.version}` : ''}")`
            : `${scope} '${dep.groupId}:${dep.artifactId}${dep.version ? `:${dep.version}` : ''}'`;

          dependenciesToAdd.push(dependencyStr);
        }
      }

      // Ajouter les nouvelles dépendances
      if (dependenciesToAdd.length > 0) {
        if (gradleContent.includes("dependencies {")) {
          const dependenciesSection = gradleContent.indexOf("dependencies {") + "dependencies {".length;
          gradleContent = gradleContent.slice(0, dependenciesSection) +
                         '\n\t' + dependenciesToAdd.join('\n\t') + '\n' +
                         gradleContent.slice(dependenciesSection);
        } else {
          gradleContent += '\n\ndependencies {\n\t' + dependenciesToAdd.join('\n\t') + '\n}';
        }
      }

      fs.writeFileSync(gradlePath, gradleContent);
    } catch (error) {
      this.log(ERROR_COLOR(`Erreur lors de la mise à jour de build.gradle: ${error}`));
    }
  }

  /**
   * Met à jour le fichier application.properties avec les configurations des composants
   */
  _updateApplicationProperties() {
    const propertiesPath = path.join(this.mainResourcesDir, 'application.properties');
    const yamlPath = path.join(this.mainResourcesDir, 'application.yml');

    // Déterminer quel fichier de configuration est utilisé
    const configPath = fs.existsSync(yamlPath) ? yamlPath : propertiesPath;
    const isYaml = configPath.endsWith('.yml');

    try {
      let configContent = fs.existsSync(configPath)
        ? fs.readFileSync(configPath, 'utf8')
        : '';

      // Ajouter les configurations spécifiques aux composants
      if (this.selectedComponents.includes('security') && this.answers?.useJwt) {
        if (isYaml) {
          if (!configContent.includes('app:') && !configContent.includes('app.jwt')) {
            configContent += '\n\n# JWT Configuration\napp:\n  jwt:\n' +
                           '    secret: ' + this.answers.jwtSecret + '\n' +
                           '    expiration-ms: ' + this.answers.jwtExpirationMs + '\n';
          }
        } else {
          if (!configContent.includes('app.jwt.secret')) {
            configContent += '\n\n# JWT Configuration\n' +
                           'app.jwt.secret=' + this.answers.jwtSecret + '\n' +
                           'app.jwt.expiration-ms=' + this.answers.jwtExpirationMs + '\n';
          }
        }
      }

      if (this.selectedComponents.includes('redis')) {
        if (isYaml) {
          if (!configContent.includes('spring.data.redis')) {
            configContent += '\n\n# Redis Configuration\nspring:\n  data:\n    redis:\n' +
                           '      host: ' + this.answers.redisHost + '\n' +
                           '      port: ' + this.answers.redisPort + '\n';
          }
        } else {
          if (!configContent.includes('spring.data.redis.host')) {
            configContent += '\n\n# Redis Configuration\n' +
                           'spring.data.redis.host=' + this.answers.redisHost + '\n' +
                           'spring.data.redis.port=' + this.answers.redisPort + '\n';
          }
        }
      }

      // Ajouter d'autres configurations selon les composants sélectionnés

      // S'assurer que le répertoire existe
      if (!fs.existsSync(path.dirname(configPath))) {
        fs.mkdirSync(path.dirname(configPath), { recursive: true });
      }

      fs.writeFileSync(configPath, configContent);
      this.log(SUCCESS_COLOR(`✅ Fichier ${path.basename(configPath)} mis à jour`));

    } catch (error) {
      this.log(ERROR_COLOR(`Erreur lors de la mise à jour de la configuration: ${error}`));
    }
  }

  end() {
    this.log("");
    this.log(SECTION_DIVIDER);
    this.log(SUCCESS_COLOR(`✅ ${this.selectedComponents.length} composant(s) ajouté(s) avec succès!`));

    // Afficher un message sur les étapes suivantes
    this.log(INFO_COLOR("\nÉtapes suivantes suggérées:"));

    if (this.buildTool === 'maven') {
      this.log(`1. Exécutez ${chalk.cyan('mvn clean install')} pour compiler le projet avec les nouvelles dépendances`);
    } else {
      this.log(`1. Exécutez ${chalk.cyan('./gradlew build')} pour compiler le projet avec les nouvelles dépendances`);
    }
    
    this.log(`2. Démarrez l'application avec la commande habituelle`);

    // Afficher des conseils spécifiques selon les composants installés
    if (this.selectedComponents.includes('swagger')) {
      this.log(`3. Accédez à l'interface Swagger UI à l'adresse: ${chalk.cyan('http://localhost:8080/swagger-ui.html')}`);
    }
    
    if (this.selectedComponents.includes('redis')) {
      this.log(`3. Assurez-vous que Redis est en cours d'exécution sur ${chalk.cyan(`${this.answers.redisHost}:${this.answers.redisPort}`)}`);
    }

    this.log(SECTION_DIVIDER);
  }
}
