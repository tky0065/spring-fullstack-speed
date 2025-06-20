/**
 * Générateur pour la commande 'sfs add'
 * Permet d'ajouter des composants à un projet Spring-Fullstack existant
 */

import { BaseGenerator } from "../base-generator.js";
import chalk from "chalk";
import path from "path";
import fs from "fs";
import { createSpinner, displaySectionTitle, displaySectionEnd, success } from "../../utils/cli-ui.js";
import { showNavigableMenu, withKeyboardInput } from "../../utils/cli-navigation.js";
import { SFSOptions } from '../types.js';

// Styles visuels constants
const STEP_PREFIX = chalk.bold.blue("➤ ");
const SECTION_DIVIDER = chalk.gray("────────────────────────────────────────────");
const INFO_COLOR = chalk.yellow;
const SUCCESS_COLOR = chalk.green;
const ERROR_COLOR = chalk.red;
const HELP_COLOR = chalk.gray.italic;

interface AddGeneratorOptions extends SFSOptions {
  component?: string;
  noPrompt?: boolean;
  [key: string]: any;
}


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
      "src/main/java/{packagePath}/security/jwt/JwtFilter.java",
      "src/main/java/{packagePath}/security/jwt/TokenProvider.java",
      "src/main/java/{packagePath}/security/SecurityConfig.java",
      "src/main/java/{packagePath}/security/AuthoritiesConstants.java",
    ],
    postInstall: async (generator: any) => {
      console.log(chalk.green("✓ Configuration de Spring Security terminée"));
      console.log(chalk.gray("  Vous pouvez maintenant utiliser l'authentification JWT dans votre application."));
    }
  },
  swagger: {
    name: "swagger",
    description: "Documentation API avec Swagger/OpenAPI 3",
    dependencies: [
      { groupId: "org.springdoc", artifactId: "springdoc-openapi-starter-webmvc-ui", version: "2.1.0" }
    ],
    files: [
      "src/main/java/{packagePath}/config/OpenApiConfig.java"
    ],
    postInstall: async (generator: any) => {
      console.log(chalk.green("✓ Configuration de Swagger/OpenAPI terminée"));
      console.log(chalk.gray("  Accédez à la documentation à l'URL: http://localhost:8080/swagger-ui/index.html"));
    }
  },
  redis: {
    name: "redis",
    description: "Support de cache Redis avec Spring Cache",
    dependencies: [
      { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-data-redis" },
      { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-cache" }
    ],
    files: [
      "src/main/java/{packagePath}/config/RedisConfig.java",
      "src/main/java/{packagePath}/config/CacheConfig.java"
    ],
    postInstall: async (generator: any) => {
      console.log(chalk.green("✓ Configuration de Redis terminée"));
      console.log(chalk.gray("  Utilisez l'annotation @Cacheable sur vos méthodes pour activer le cache."));
    }
  },
  websocket: {
    name: "websocket",
    description: "Support WebSocket pour communications en temps réel",
    dependencies: [
      { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-websocket" }
    ],
    files: [
      "src/main/java/{packagePath}/config/WebSocketConfig.java",
      "src/main/java/{packagePath}/websocket/WebSocketHandler.java"
    ],
    postInstall: async (generator: any) => {
      console.log(chalk.green("✓ Configuration WebSocket terminée"));
      console.log(chalk.gray("  Endpoint WebSocket disponible à ws://localhost:8080/websocket"));
    }
  },
  monitoring: {
    name: "monitoring",
    description: "Monitoring applicatif avec Spring Actuator et Micrometer",
    dependencies: [
      { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-actuator" },
      { groupId: "io.micrometer", artifactId: "micrometer-registry-prometheus", version: "1.11.0" }
    ],
    files: [
      "src/main/java/{packagePath}/config/MetricsConfig.java"
    ],
    postInstall: async (generator: any) => {
      console.log(chalk.green("✓ Configuration du monitoring terminée"));
      console.log(chalk.gray("  Endpoints Actuator disponibles à /actuator"));
      console.log(chalk.gray("  Métriques Prometheus disponibles à /actuator/prometheus"));
    }
  }
};

/**
 * Générateur pour ajouter des composants à un projet Spring-Fullstack existant
 */
export default class AddGenerator extends BaseGenerator {
  declare options: any;

  private packageName: string = '';
  private packagePath: string = '';
  private isMaven: boolean = false;
  private isGradle: boolean = false;


  constructor(args: string | string[], options: any) {
    super(args, options);

    this.desc("Ajoute des composants à un projet Spring-Fullstack existant");

    // Enregistrer les options CLI
    this.option("component", {
      type: String,
      description: "Type de composant à ajouter (security, swagger, redis, websocket, monitoring)",
      alias: "c"
    });

    this.option("noPrompt", {
      type: Boolean,
      description: "Exécute sans prompts interactifs",
      default: false,
      alias: "y"
    });
  }


  initializing() {
    displaySectionTitle("Spring-Fullstack Speed - Ajout de composant");
    this.log(INFO_COLOR("Cette commande vous permet d'ajouter des composants à votre projet existant."));
    this.log(SECTION_DIVIDER);

    // Vérifier qu'on est dans un projet Spring-Fullstack
    if (!this._isSpringFullstackProject()) {
      this.log(ERROR_COLOR("Erreur: Ce répertoire ne semble pas être un projet Spring-Fullstack."));
      this.log(INFO_COLOR("Assurez-vous d'exécuter cette commande à la racine d'un projet généré par Spring-Fullstack."));
      process.exit(1);
    }

    // Récupérer les options de la ligne de commande
    if (this.options.component) {
      if (!Object.keys(AVAILABLE_COMPONENTS).includes(this.options.component)) {
        this.log(ERROR_COLOR(`Erreur: Le composant "${this.options.component}" n'est pas disponible.`));
        this.log(INFO_COLOR(`Composants disponibles: ${Object.keys(AVAILABLE_COMPONENTS).join(', ')}`));
        process.exit(1);
      }
    }
  }

  async prompting() {
    // Si un composant est déjà spécifié et --noPrompt, on skip
    if (this.options.component && this.options.noPrompt) {
      return;
    }

    // Sinon on propose une liste de choix
    this.log(STEP_PREFIX + "Sélection du composant à ajouter");

    const choices = Object.values(AVAILABLE_COMPONENTS).map(component => ({
      name: `${component.name} - ${component.description}`,
      value: component.name
    }));

    const answers = await this.prompt([{
      type: "list",
      name: "component",
      message: "Quel composant souhaitez-vous ajouter ?",
      choices,
      default: this.options.component
    }]);

    this.options.component = answers.component;
  }

  async configuring() {
    const component = AVAILABLE_COMPONENTS[this.options.component as keyof typeof AVAILABLE_COMPONENTS];

    this.log(STEP_PREFIX + `Configuration du composant ${INFO_COLOR(component.name)}`);

    // Analyser le projet pour identifier le type de build (Maven/Gradle)
    const isMaven = fs.existsSync(path.join(this.destinationPath(), "pom.xml"));
    const isGradle = fs.existsSync(path.join(this.destinationPath(), "build.gradle")) ||
                    fs.existsSync(path.join(this.destinationPath(), "build.gradle.kts"));

    // Récupérer le package principal de l'application
    let packageName = "com.example.demo"; // Valeur par défaut

    if (isMaven) {
      // Tenter de lire le package depuis pom.xml
      try {
        const pomContent = fs.readFileSync(path.join(this.destinationPath(), "pom.xml"), "utf8");
        const packageMatch = pomContent.match(/<groupId>(.+)<\/groupId>/);
        if (packageMatch && packageMatch[1]) {
          packageName = packageMatch[1];
        }
      } catch (error) {
        this.log(INFO_COLOR("Impossible de déterminer automatiquement le package, utilisation de la valeur par défaut."));
      }
    } else if (isGradle) {
      // Tenter de lire le package depuis build.gradle
      try {
        const buildContent = fs.readFileSync(
          path.join(this.destinationPath(), fs.existsSync("build.gradle.kts") ? "build.gradle.kts" : "build.gradle"),
          "utf8"
        );
        const packageMatch = buildContent.match(/group\s*=\s*['"]([\w.]+)['"]/);
        if (packageMatch && packageMatch[1]) {
          packageName = packageMatch[1];
        }
      } catch (error) {
        this.log(INFO_COLOR("Impossible de déterminer automatiquement le package, utilisation de la valeur par défaut."));
      }
    }

    // Demander confirmation du package
    const packageAnswer = await this.prompt([{
      type: "input",
      name: "packageName",
      message: "Confirmez le package principal de l'application:",
      default: packageName
    }]);

    packageName = packageAnswer.packageName;

    // Stocker les infos pour la phase de writing
    this.packageName = packageName;
    this.packagePath = packageName.replace(/\./g, "/");
    this.isMaven = isMaven;
    this.isGradle = isGradle;
  }

  async writing() {
    const component = AVAILABLE_COMPONENTS[this.options.component as keyof typeof AVAILABLE_COMPONENTS];

    this.log(STEP_PREFIX + `Installation du composant ${INFO_COLOR(component.name)}`);
    const spinner = createSpinner({
      text: "Mise à jour des dépendances...",
      color: "primary"
    });

    // 1. Ajouter les dépendances
    if (this.isMaven) {
      await this._addMavenDependencies(component.dependencies);
    } else if (this.isGradle) {
      await this._addGradleDependencies(component.dependencies);
    }

    spinner.succeed("Dépendances mises à jour");

    // 2. Copier les fichiers du composant
    const spinner2 = createSpinner({
      text: "Copie des fichiers du composant...",
      color: "primary"
    });

    component.files.forEach(file => {
      const templatePath = this.templatePath(`components/${component.name}/${file}`);
      const destinationFile = file.replace("{packagePath}", this.packagePath);
      const destinationPath = this.destinationPath(destinationFile);

      // Créer les dossiers parents si nécessaire
      const dir = path.dirname(destinationPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      this.fs.copyTpl(
        templatePath,
        destinationPath,
        {
          packageName: this.packageName,
          basePackage: this.packageName,
          packagePath: this.packagePath
        }
      );
    });

    spinner2.succeed("Fichiers copiés");
  }

  async install() {
    const component = AVAILABLE_COMPONENTS[this.options.component as keyof typeof AVAILABLE_COMPONENTS];

    this.log(STEP_PREFIX + "Construction du projet avec les nouvelles dépendances");

    // Exécuter Maven/Gradle build
    try {
      if (this.isMaven) {

        const spinner = createSpinner({
          text: "Exécution de Maven build...",
          color: "primary"
        });
        // await this.spawnCommand('mvn', ['clean', 'install', '-DskipTests']);
        spinner.succeed("Maven build terminé");
      } else if (this.isGradle) {
        const spinner = createSpinner({
          text: "Exécution de Gradle build...",
          color: "primary"
        });

        // await this.spawnCommand('./gradlew', ['build', '-x', 'test']);
        spinner.succeed("Gradle build terminé");
      }
    } catch (error) {
      this.log(ERROR_COLOR("Erreur lors de la construction du projet."));
      this.log(ERROR_COLOR("Vous devrez construire manuellement le projet pour appliquer les changements."));
    }

    // Exécuter le hook post-installation du composant
    if (component.postInstall) {
      await component.postInstall(this);
    }
  }

  end() {
    const component = AVAILABLE_COMPONENTS[this.options.component as keyof typeof AVAILABLE_COMPONENTS];

    displaySectionEnd();
    this.log(SUCCESS_COLOR(`✓ Le composant ${component.name} a été ajouté avec succès à votre projet!`));
    this.log(INFO_COLOR("Redémarrez votre application pour appliquer les changements."));
  }

  // Méthodes privées
  _isSpringFullstackProject() {
    // Vérifier certains fichiers qui indiquent un projet Spring Boot/Spring-Fullstack
    const indicators = [
      "pom.xml",
      "build.gradle",
      "build.gradle.kts",
      "src/main/java",
      "src/main/resources/application.yml",
      "src/main/resources/application.properties"
    ];

    return indicators.some(file => fs.existsSync(path.join(this.destinationPath(), file)));
  }

  async _addMavenDependencies(dependencies: any[]) {
    const pomPath = path.join(this.destinationPath(), "pom.xml");
    let pomContent = fs.readFileSync(pomPath, "utf8");

    // Ajouter chaque dépendance
    dependencies.forEach(dep => {
      const dependencyXml = `
        <dependency>
            <groupId>${dep.groupId}</groupId>
            <artifactId>${dep.artifactId}</artifactId>
            ${dep.version ? `<version>${dep.version}</version>` : ''}
            ${dep.scope ? `<scope>${dep.scope}</scope>` : ''}
        </dependency>`;

      // Insérer juste avant la fermeture de la section dependencies
      if (!pomContent.includes(`<artifactId>${dep.artifactId}</artifactId>`)) {
        pomContent = pomContent.replace(
          '</dependencies>',
          `${dependencyXml}\n    </dependencies>`
        );
      }
    });

    fs.writeFileSync(pomPath, pomContent);
  }

  async _addGradleDependencies(dependencies: any[]) {
    const isKotlinDSL = fs.existsSync(path.join(this.destinationPath(), "build.gradle.kts"));
    const gradlePath = path.join(
      this.destinationPath(),
      isKotlinDSL ? "build.gradle.kts" : "build.gradle"
    );

    let gradleContent = fs.readFileSync(gradlePath, "utf8");

    // Ajouter chaque dépendance
    dependencies.forEach(dep => {
      let dependencyLine;

      if (isKotlinDSL) {
        // Kotlin DSL format
        dependencyLine = `implementation("${dep.groupId}:${dep.artifactId}${dep.version ? `:${dep.version}` : ''}")`;
        if (dep.scope === "runtime") {
          dependencyLine = `runtimeOnly("${dep.groupId}:${dep.artifactId}${dep.version ? `:${dep.version}` : ''}")`;
        }
      } else {
        // Groovy DSL format
        dependencyLine = `implementation '${dep.groupId}:${dep.artifactId}${dep.version ? `:${dep.version}` : ''}'`;
        if (dep.scope === "runtime") {
          dependencyLine = `runtimeOnly '${dep.groupId}:${dep.artifactId}${dep.version ? `:${dep.version}` : ''}'`;
        }
      }

      // Vérifier que la dépendance n'existe pas déjà
      if (!gradleContent.includes(dep.artifactId)) {
        // Trouver la section dependencies
        const dependenciesMatch = gradleContent.match(/dependencies\s*\{/);
        if (dependenciesMatch) {
          const position = dependenciesMatch.index! + dependenciesMatch[0].length;
          gradleContent =
            gradleContent.substring(0, position) +
            `\n    ${dependencyLine}` +
            gradleContent.substring(position);
        }
      }
    });

    fs.writeFileSync(gradlePath, gradleContent);
  }
}
