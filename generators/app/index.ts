import { BaseGenerator } from "../base-generator.js";
import Generator from "yeoman-generator";
import chalk from "chalk";
import yosay from "yosay";

export default class AppGenerator extends BaseGenerator {
  declare answers: any;

  constructor(args: string | string[], options: any) {
    super(args, options);

    // Options pour le générateur principal
    this.option("skip-welcome-message", {
      description: "Passer le message de bienvenue",
      type: Boolean,
      default: false,
    });

    this.option("skip-install", {
      description: "Passer l'installation des dépendances",
      type: Boolean,
      default: false,
    });
  }

  initializing() {
    this.log("Initialisation du générateur SFS (Spring-Fullstack-Speed)...");
  }

  async prompting() {
    if (!this.options["skip-welcome-message"]) {
      this.log(
        yosay(
          `Bienvenue dans le générateur ${chalk.red(
            "Spring-Fullstack-Speed"
          )}!`
        )
      );
    }

    // Définition des questions avec le type any pour contourner l'erreur de typage
    const prompts: any = [
      {
        type: "input",
        name: "appName",
        message: "Quel est le nom de votre application?",
        default: "sfs-app",
      },
      {
        type: "input",
        name: "packageName",
        message: "Quel est le nom du package Java?",
        default: "com.example.app",
        validate: (input: string) => {
          if (/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/.test(input)) {
            return true;
          }
          return "Le nom du package doit être un nom de package Java valide.";
        },
      },
      {
        type: "list",
        name: "buildTool",
        message: "Quel outil de build voulez-vous utiliser?",
        choices: ["Maven", "Gradle"],
        default: "Maven",
      },
      {
        type: "list",
        name: "frontendFramework",
        message: "Quel framework frontend voulez-vous utiliser?",
        choices: [
          "React avec Inertia.js",
          "Vue.js avec Inertia.js",
          "Angular standalone",
          "Thymeleaf",
          "JTE",
          "Aucun (API seulement)",
        ],
        default: "React avec Inertia.js",
      },
      {
        type: "list",
        name: "database",
        message: "Quelle base de données voulez-vous utiliser?",
        choices: ["MySQL", "PostgreSQL", "MongoDB", "H2"],
        default: "PostgreSQL",
      },
      {
        type: "confirm",
        name: "includeAuth",
        message: "Voulez-vous inclure l'authentification?",
        default: true,
      },
      {
        type: "checkbox",
        name: "additionalFeatures",
        message: "Quelles fonctionnalités supplémentaires souhaitez-vous?",
        choices: [
          { name: "OpenAPI/Swagger", value: "openapi", checked: true },
          { name: "Docker", value: "docker", checked: true },
          { name: "Tests unitaires", value: "tests", checked: true },
          { name: "WebSocket", value: "websocket", checked: false },
          { name: "Redis Cache", value: "redis", checked: false },
        ],
      },
    ];

    this.answers = await this.prompt(prompts);
  }

  configuring() {
    this.log("Configuration en cours...");
    // Code pour configurer le projet
  }

  writing() {
    const templateData = {
      appName: this.answers.appName || 'sfs-app',
      packageName: this.answers.packageName || 'com.example.app',
      buildTool: this.answers.buildTool || 'Maven',
      frontendFramework: this.answers.frontendFramework || 'Aucun (API seulement)',
      database: this.answers.database || 'H2',
      includeAuth: this.answers.includeAuth !== undefined ? this.answers.includeAuth : true,
      additionalFeatures: this.answers.additionalFeatures || [],
      javaPackagePath: (this.answers.packageName || 'com.example.app').replace(/\./g, '/'),
    };

    // Génération du projet en fonction des réponses
    this._generateProjectStructure(templateData);

    if (templateData.buildTool.toLowerCase() === 'maven') {
      this._generateMavenOrGradle(templateData, 'maven');
    } else {
      this._generateMavenOrGradle(templateData, 'gradle');
    }

    this._generateReadme(templateData);
    this._generateMainApplication(templateData);

    // Génération des configurations par environnement
    this._generateApplicationProperties(templateData);

    // Génération des répertoires de base du projet
    this._generateBaseDirectories(templateData);

    if (templateData.additionalFeatures.includes('docker')) {
      this._generateDockerFiles(templateData);
    }

    // Génération frontend si nécessaire
    if (templateData.frontendFramework !== 'Aucun (API seulement)') {
      this._generateFrontend(templateData);
    }
  }

  _generateProjectStructure(templateData: any) {
    this.log("Génération de la structure du projet...");
    // Création du fichier .gitignore
    this.fs.copy(
      this.templatePath("gitignore"),
      this.destinationPath(".gitignore")
    );
  }

  _generateReadme(templateData: any) {
    // Génération du README.md
    this.fs.copyTpl(
      this.templatePath("README.md.ejs"),
      this.destinationPath("README.md"),
      templateData
    );
  }

  _generateMainApplication(templateData: any) {
    // Génération de la classe principale de l'application
    const mainPath = `src/main/java/${templateData.javaPackagePath}`;
    const className = templateData.appName
      .split("-")
      .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("");

    this.fs.copyTpl(
      this.templatePath("Application.java.ejs"),
      this.destinationPath(`${mainPath}/${className}Application.java`),
      {
        ...templateData,
        className
      }
    );
  }

  _generateApplicationProperties(templateData: any) {
    // Génération du fichier application.properties
    this.fs.copyTpl(
      this.templatePath("application.properties.ejs"),
      this.destinationPath("src/main/resources/application.properties"),
      {
        ...templateData,
        environment: "default"
      }
    );

    // Génération des fichiers de propriétés par environnement
    this.fs.copyTpl(
      this.templatePath("application.properties.ejs"),
      this.destinationPath("src/main/resources/application-dev.properties"),
      {
        ...templateData,
        environment: "dev"
      }
    );

    this.fs.copyTpl(
      this.templatePath("application.properties.ejs"),
      this.destinationPath("src/main/resources/application-prod.properties"),
      {
        ...templateData,
        environment: "prod"
      }
    );
  }

  _generateBaseDirectories(templateData: any) {
    const mainPath = `src/main/java/${templateData.javaPackagePath}`;
    const testPath = `src/test/java/${templateData.javaPackagePath}`;

    // Création des packages standard
    const directories = [
      `${mainPath}/controller`,
      `${mainPath}/service`,
      `${mainPath}/repository`,
      `${mainPath}/entity`,
      `${mainPath}/config`,
      `${mainPath}/dto`,
      `${mainPath}/exception`,
      `${mainPath}/util`,
      `${testPath}/controller`,
      `${testPath}/service`,
      `${testPath}/repository`,
      "src/main/resources/static",
      "src/main/resources/templates"
    ];

    directories.forEach((dir) => {
      this.fs.write(
        this.destinationPath(`${dir}/.gitkeep`),
        "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
      );
    });
  }

  _generateDockerFiles(templateData: any) {
    // Génération des fichiers Docker
    this.fs.copyTpl(
      this.templatePath("docker/Dockerfile.ejs"),
      this.destinationPath("Dockerfile"),
      templateData
    );

    this.fs.copyTpl(
      this.templatePath("docker/docker-compose.yml.ejs"),
      this.destinationPath("docker-compose.yml"),
      templateData
    );
  }

  _generateFrontend(templateData: any) {
    // Base sur le type de frontend sélectionné
    const frontendType = templateData.frontendFramework.toLowerCase();

    if (frontendType.includes("react")) {
      this._generateReactFrontend(templateData);
    } else if (frontendType.includes("vue")) {
      this._generateVueFrontend(templateData);
    } else if (frontendType.includes("angular")) {
      this._generateAngularFrontend(templateData);
    } else if (frontendType.includes("thymeleaf")) {
      this._generateThymeleafFrontend(templateData);
    } else if (frontendType.includes("jte")) {
      this._generateJTEFrontend(templateData);
    }
  }

  _generateReactFrontend(templateData: any) {
    this.log("Génération du frontend React...");

    // Création du dossier frontend en créant un fichier .gitkeep dans chaque répertoire
    this.fs.write(
      this.destinationPath("frontend/.gitkeep"),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );
    this.fs.write(
      this.destinationPath("frontend/src/.gitkeep"),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );
    this.fs.write(
      this.destinationPath("frontend/src/components/.gitkeep"),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );
    this.fs.write(
      this.destinationPath("frontend/src/pages/.gitkeep"),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );
    this.fs.write(
      this.destinationPath("frontend/src/hooks/.gitkeep"),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );
    this.fs.write(
      this.destinationPath("frontend/src/services/.gitkeep"),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );
    this.fs.write(
      this.destinationPath("frontend/scripts/.gitkeep"),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );

    // Copier les fichiers de configuration
    this.fs.copyTpl(
      this.templatePath("frontend/react/package.json.ejs"),
      this.destinationPath("frontend/package.json"),
      templateData
    );

    this.fs.copyTpl(
      this.templatePath("frontend/react/vite.config.ts.ejs"),
      this.destinationPath("frontend/vite.config.ts"),
      templateData
    );

    this.fs.copyTpl(
      this.templatePath("frontend/react/tsconfig.json.ejs"),
      this.destinationPath("frontend/tsconfig.json"),
      templateData
    );

    this.fs.copyTpl(
      this.templatePath("frontend/react/tsconfig.node.json.ejs"),
      this.destinationPath("frontend/tsconfig.node.json"),
      templateData
    );

    // Copier les fichiers de base
    this.fs.copyTpl(
      this.templatePath("frontend/react/src/App.tsx.ejs"),
      this.destinationPath("frontend/src/App.tsx"),
      templateData
    );

    // Copier les pages de base
    this.fs.copyTpl(
      this.templatePath("frontend/react/src/pages/Home.tsx.ejs"),
      this.destinationPath("frontend/src/pages/Home.tsx"),
      templateData
    );

    // Copier le script de génération d'API
    this.fs.copyTpl(
      this.templatePath("frontend/react/scripts/api-generate.js.ejs"),
      this.destinationPath("frontend/scripts/api-generate.js"),
      templateData
    );

    // Copier le guide d'API
    this.fs.copyTpl(
      this.templatePath("frontend/react/API-GUIDE.md.ejs"),
      this.destinationPath("frontend/API-GUIDE.md"),
      templateData
    );
  }

  _generateVueFrontend(templateData: any) {
    this.log("Génération du frontend Vue.js...");

    // Création du dossier frontend en créant un fichier .gitkeep dans chaque répertoire
    this.fs.write(
      this.destinationPath("frontend/.gitkeep"),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );
    this.fs.write(
      this.destinationPath("frontend/src/.gitkeep"),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );
    this.fs.write(
      this.destinationPath("frontend/src/components/.gitkeep"),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );
    this.fs.write(
      this.destinationPath("frontend/src/views/.gitkeep"),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );
    this.fs.write(
      this.destinationPath("frontend/src/services/.gitkeep"),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );
    this.fs.write(
      this.destinationPath("frontend/src/store/.gitkeep"),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );

    // Copier les fichiers de configuration
    this.fs.copyTpl(
      this.templatePath("frontend/vue/package.json.ejs"),
      this.destinationPath("frontend/package.json"),
      templateData
    );

    this.fs.copyTpl(
      this.templatePath("frontend/vue/vite.config.ts.ejs") || this.templatePath("frontend/vue/vite.config.js.ejs"),
      this.destinationPath("frontend/vite.config.ts"),
      templateData
    );

    this.fs.copyTpl(
      this.templatePath("frontend/vue/tsconfig.json.ejs"),
      this.destinationPath("frontend/tsconfig.json"),
      templateData
    );

    // Copier les fichiers de base Vue
    this.fs.copy(
      this.templatePath("frontend/vue/src/App.vue.ejs"),
      this.destinationPath("frontend/src/App.vue")
    );

    // Copier le guide d'API
    this.fs.copyTpl(
      this.templatePath("frontend/vue/API-GUIDE.md.ejs"),
      this.destinationPath("frontend/API-GUIDE.md"),
      templateData
    );
  }

  _generateAngularFrontend(templateData: any) {
    this.log("Génération du frontend Angular...");

    // Création du dossier frontend en créant un fichier .gitkeep dans chaque répertoire
    this.fs.write(
      this.destinationPath("frontend/.gitkeep"),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );
    this.fs.write(
      this.destinationPath("frontend/src/.gitkeep"),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );
    this.fs.write(
      this.destinationPath("frontend/src/app/.gitkeep"),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );
    this.fs.write(
      this.destinationPath("frontend/src/app/components/.gitkeep"),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );
    this.fs.write(
      this.destinationPath("frontend/src/app/pages/.gitkeep"),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );
    this.fs.write(
      this.destinationPath("frontend/src/app/services/.gitkeep"),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );
    this.fs.write(
      this.destinationPath("frontend/src/app/core/.gitkeep"),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );

    // Copier les fichiers de configuration
    this.fs.copyTpl(
      this.templatePath("frontend/angular/package.json.ejs"),
      this.destinationPath("frontend/package.json"),
      templateData
    );

    this.fs.copyTpl(
      this.templatePath("frontend/angular/angular.json.ejs"),
      this.destinationPath("frontend/angular.json"),
      templateData
    );

    this.fs.copyTpl(
      this.templatePath("frontend/angular/tsconfig.json.ejs"),
      this.destinationPath("frontend/tsconfig.json"),
      templateData
    );

    // Copier les fichiers de base Angular
    this.fs.copyTpl(
      this.templatePath("frontend/angular/src/main.ts.ejs"),
      this.destinationPath("frontend/src/main.ts"),
      templateData
    );

    this.fs.copyTpl(
      this.templatePath("frontend/angular/src/app/app.component.ts.ejs"),
      this.destinationPath("frontend/src/app/app.component.ts"),
      templateData
    );

    this.fs.copyTpl(
      this.templatePath("frontend/angular/src/app/app.component.html.ejs"),
      this.destinationPath("frontend/src/app/app.component.html"),
      templateData
    );

    this.fs.copyTpl(
      this.templatePath("frontend/angular/src/app/app.routes.ts.ejs"),
      this.destinationPath("frontend/src/app/app.routes.ts"),
      templateData
    );

    // Copier le guide d'API
    this.fs.copyTpl(
      this.templatePath("frontend/angular/API-GUIDE.md.ejs"),
      this.destinationPath("frontend/API-GUIDE.md"),
      templateData
    );
  }

  _generateThymeleafFrontend(templateData: any) {
    this.log("Génération du frontend Thymeleaf...");

    // Création des dossiers nécessaires en créant un fichier .gitkeep dans chaque répertoire
    this.fs.write(
      this.destinationPath("src/main/resources/templates/.gitkeep"),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );
    this.fs.write(
      this.destinationPath("src/main/resources/templates/layouts/.gitkeep"),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );
    this.fs.write(
      this.destinationPath("src/main/resources/templates/fragments/.gitkeep"),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );
    this.fs.write(
      this.destinationPath("src/main/resources/static/css/.gitkeep"),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );
    this.fs.write(
      this.destinationPath("src/main/resources/static/js/.gitkeep"),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );

    // Copier les fichiers de base Thymeleaf
    this.fs.copyTpl(
      this.templatePath("frontend/thymeleaf/pages/index.html.ejs"),
      this.destinationPath("src/main/resources/templates/index.html"),
      templateData
    );

    this.fs.copyTpl(
      this.templatePath("frontend/thymeleaf/layouts/main.html.ejs"),
      this.destinationPath("src/main/resources/templates/layouts/main.html"),
      templateData
    );

    this.fs.copyTpl(
      this.templatePath("frontend/thymeleaf/pages/home.html.ejs"),
      this.destinationPath("src/main/resources/templates/home.html"),
      templateData
    );

    // Copier les pages d'authentification si nécessaire
    if (templateData.includeAuth) {
      this.fs.copyTpl(
        this.templatePath("frontend/thymeleaf/pages/login.html.ejs"),
        this.destinationPath("src/main/resources/templates/login.html"),
        templateData
      );
    }
  }

  _generateJTEFrontend(templateData: any) {
    this.log("Génération du frontend JTE...");

    // Création des dossiers nécessaires en créant un fichier .gitkeep dans chaque répertoire
    this.fs.write(
      this.destinationPath("src/main/jte/.gitkeep"),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );
    this.fs.write(
      this.destinationPath("src/main/jte/layouts/.gitkeep"),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );
    this.fs.write(
      this.destinationPath("src/main/jte/pages/.gitkeep"),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );
    this.fs.write(
      this.destinationPath("src/main/jte/components/.gitkeep"),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );

    // Copier les fichiers de base JTE
    this.fs.copyTpl(
      this.templatePath("frontend/jte/layouts/main.jte.ejs"),
      this.destinationPath("src/main/jte/layouts/main.jte"),
      templateData
    );

    this.fs.copyTpl(
      this.templatePath("frontend/jte/layouts/default.jte.ejs"),
      this.destinationPath("src/main/jte/layouts/default.jte"),
      templateData
    );
  }

  // Correction de la méthode existante pour accepter templateData
  _generateMavenOrGradle(templateData: any, buildTool: string = 'maven') {
    if (buildTool.toLowerCase() === "maven") {
      this.fs.copyTpl(
        this.templatePath("pom.xml.ejs"),
        this.destinationPath("pom.xml"),
        templateData
      );
      this.fs.copy(
        this.templatePath("mvnw.ejs"),
        this.destinationPath("mvnw")
      );
      this.fs.copy(
        this.templatePath("mvnw.cmd.ejs"),
        this.destinationPath("mvnw.cmd")
      );
    } else {
      this.fs.copyTpl(
        this.templatePath("build.gradle.kts.ejs"),
        this.destinationPath("build.gradle.kts"),
        templateData
      );
      this.fs.copyTpl(
        this.templatePath("settings.gradle.kts.ejs"),
        this.destinationPath("settings.gradle.kts"),
        templateData
      );
      this.fs.copy(
        this.templatePath("gradlew.ejs"),
        this.destinationPath("gradlew")
      );
      this.fs.copy(
        this.templatePath("gradlew.bat.ejs"),
        this.destinationPath("gradlew.bat")
      );
    }
  }

  install() {
    if (!this.options["skip-install"]) {
      this.log("Installation des dépendances...");
      // Code pour installer les dépendances
    }
  }

  end() {
    this.log(chalk.green("🚀 Application générée avec succès!"));
    this.log(`
Prochaines étapes:
1. Accédez à votre application: ${chalk.yellow(`cd ${this.answers.appName}`)}
2. Démarrez l'application: ${chalk.yellow(
      this.answers.buildTool === "Maven"
        ? "./mvnw spring-boot:run"
        : "./gradlew bootRun"
    )}
3. Accédez à votre application dans le navigateur: ${chalk.blue(
      "http://localhost:8080"
    )}
    `);
  }
}
