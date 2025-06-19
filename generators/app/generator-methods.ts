/**
 * Module de génération de code pour Spring-Fullstack-Speed
 * Ce module contient toutes les méthodes nécessaires pour générer les différentes parties du projet
 */

import chalk from "chalk";
import fs from "fs";
import path from "path";

/**
 * Interface pour les données de template partagées entre les méthodes
 */
export interface TemplateData {
  appName: string;
  packageName: string;
  buildTool: string;
  frontendFramework: string;
  database: string;
  includeAuth: boolean;
  authType?: string;
  additionalFeatures: string[];
  springBootVersion: string;
  javaVersion: string;
  javaPackagePath: string;
  [key: string]: any; // Permet d'ajouter des propriétés supplémentaires
}

/**
 * Génère la structure du projet
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
export function generateProjectStructure(generator: any, templateData: TemplateData) {
  generator.log(chalk.blue("Génération de la structure du projet..."));
  // Création du fichier .gitignore
  generator.fs.copy(
    generator.templatePath("gitignore"),
    generator.destinationPath(".gitignore")
  );
}

/**
 * Génère le README du projet
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
export function generateReadme(generator: any, templateData: TemplateData) {
  generator.log(chalk.blue("Génération du README..."));
  generator.fs.copyTpl(
    generator.templatePath("README.md.ejs"),
    generator.destinationPath("README.md"),
    templateData
  );
}

/**
 * Génère la classe principale de l'application
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
export function generateMainApplication(generator: any, templateData: TemplateData) {
  generator.log(chalk.blue("Génération de l'application principale..."));
  const mainPath = `src/main/java/${templateData.javaPackagePath}`;
  const className = templateData.appName
    .split("-")
    .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

  generator.fs.copyTpl(
    generator.templatePath("Application.java.ejs"),
    generator.destinationPath(`${mainPath}/${className}Application.java`),
    {
      ...templateData,
      className
    }
  );
}

/**
 * Génère les fichiers de configuration de l'application
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
export function generateApplicationProperties(generator: any, templateData: TemplateData) {
  generator.log(chalk.blue("Génération des fichiers de configuration..."));

  // Génération du fichier application.properties
  generator.fs.copyTpl(
    generator.templatePath("application.properties.ejs"),
    generator.destinationPath("src/main/resources/application.properties"),
    {
      ...templateData,
      environment: "default"
    }
  );

  // Génération des fichiers de propriétés par environnement
  generator.fs.copyTpl(
    generator.templatePath("application.properties.ejs"),
    generator.destinationPath("src/main/resources/application-dev.properties"),
    {
      ...templateData,
      environment: "dev"
    }
  );

  generator.fs.copyTpl(
    generator.templatePath("application.properties.ejs"),
    generator.destinationPath("src/main/resources/application-prod.properties"),
    {
      ...templateData,
      environment: "prod"
    }
  );
}

/**
 * Génère les répertoires de base du projet
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
export function generateBaseDirectories(generator: any, templateData: TemplateData) {
  generator.log(chalk.blue("Création des répertoires de base..."));

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
    generator.fs.write(
      generator.destinationPath(`${dir}/.gitkeep`),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );
  });
}

/**
 * Génère les fichiers Docker si demandé
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
export function generateDockerFiles(generator: any, templateData: TemplateData) {
  generator.log(chalk.blue("Génération des fichiers Docker..."));

  // Génération des fichiers Docker
  generator.fs.copyTpl(
    generator.templatePath("docker/Dockerfile.ejs"),
    generator.destinationPath("Dockerfile"),
    templateData
  );

  generator.fs.copyTpl(
    generator.templatePath("docker/docker-compose.yml.ejs"),
    generator.destinationPath("docker-compose.yml"),
    templateData
  );
}

/**
 * Génère les fichiers de build (Maven ou Gradle)
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 * @param buildTool Type d'outil de build ('maven' ou 'gradle')
 */
export function generateMavenOrGradle(generator: any, templateData: TemplateData, buildTool: string = 'maven') {
  generator.log(chalk.blue(`Génération des fichiers de build (${buildTool.toUpperCase()})...`));

  if (buildTool.toLowerCase() === "maven") {
    generator.fs.copyTpl(
      generator.templatePath("pom.xml.ejs"),
      generator.destinationPath("pom.xml"),
      templateData
    );
    generator.fs.copy(
      generator.templatePath("mvnw.ejs"),
      generator.destinationPath("mvnw")
    );
    generator.fs.copy(
      generator.templatePath("mvnw.cmd.ejs"),
      generator.destinationPath("mvnw.cmd")
    );
  } else {
    generator.fs.copyTpl(
      generator.templatePath("build.gradle.kts.ejs"),
      generator.destinationPath("build.gradle.kts"),
      templateData
    );
    generator.fs.copyTpl(
      generator.templatePath("settings.gradle.kts.ejs"),
      generator.destinationPath("settings.gradle.kts"),
      templateData
    );
    generator.fs.copy(
      generator.templatePath("gradlew.ejs"),
      generator.destinationPath("gradlew")
    );
    generator.fs.copy(
      generator.templatePath("gradlew.bat.ejs"),
      generator.destinationPath("gradlew.bat")
    );
  }
}

/**
 * Génère les fichiers d'authentification
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
export function generateAuth(generator: any, templateData: TemplateData) {
  generator.log(chalk.blue(`Génération de l'authentification (${templateData.authType})...`));

  // Structure de base pour l'authentification
  const mainPath = `src/main/java/${templateData.javaPackagePath}`;

  // Création des répertoires pour l'authentification
  generator.fs.mkdirp(`${mainPath}/security`);
  generator.fs.mkdirp(`${mainPath}/security/config`);
  generator.fs.mkdirp(`${mainPath}/security/controller`);
  generator.fs.mkdirp(`${mainPath}/security/service`);
  generator.fs.mkdirp(`${mainPath}/security/model`);
  generator.fs.mkdirp(`${mainPath}/security/repository`);

  // Implémentation spécifique selon le type d'authentification
  switch(templateData.authType) {
    case 'JWT':
      // Génération des fichiers pour JWT
      // À implémenter
      break;
    case 'JWT+OAuth2':
      // Génération des fichiers pour JWT+OAuth2
      // À implémenter
      break;
    case 'Basic':
      // Génération des fichiers pour Basic Auth
      // À implémenter
      break;
    case 'Session':
      // Génération des fichiers pour Session Auth
      // À implémenter
      break;
  }
}

/**
 * Génère les fichiers de configuration OpenAPI
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
export function generateOpenAPI(generator: any, templateData: TemplateData) {
  generator.log(chalk.blue("Génération de la documentation OpenAPI..."));

  const mainPath = `src/main/java/${templateData.javaPackagePath}`;

  // Création du répertoire pour la configuration OpenAPI
  generator.fs.mkdirp(`${mainPath}/config`);

  // À implémenter: génération des fichiers de configuration OpenAPI
}

/**
 * Génère les fichiers de test
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
export function generateTests(generator: any, templateData: TemplateData) {
  generator.log(chalk.blue("Génération des fichiers de test..."));

  // Création des répertoires pour les tests
  const testPath = `src/test/java/${templateData.javaPackagePath}`;
  generator.fs.mkdirp(`${testPath}`);
  generator.fs.mkdirp(`${testPath}/controller`);
  generator.fs.mkdirp(`${testPath}/service`);
  generator.fs.mkdirp(`${testPath}/repository`);

  if (templateData.includeAuth) {
    generator.fs.mkdirp(`${testPath}/security`);
  }

  // À implémenter: génération des fichiers de test
}

/**
 * Dirige vers la méthode de génération de frontend appropriée
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
export function generateFrontend(generator: any, templateData: TemplateData) {
  generator.log(chalk.blue(`Génération du frontend (${templateData.frontendFramework})...`));

  switch(templateData.frontendFramework) {
    case 'React avec openapi':
      generateReactFrontend(generator, templateData);
      break;
    case 'Vue.js avec openapi':
      generateVueFrontend(generator, templateData);
      break;
    case 'Angular standalone':
      generateAngularFrontend(generator, templateData);
      break;
    case 'Thymeleaf':
      generateThymeleafFrontend(generator, templateData);
      break;
    case 'JTE':
      generateJTEFrontend(generator, templateData);
      break;
  }
}

/**
 * Génère un frontend React
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
export function generateReactFrontend(generator: any, templateData: TemplateData) {
  generator.log(chalk.blue("Génération du frontend React..."));

  // Création de la structure de répertoires
  const directories = [
    "frontend",
    "frontend/src",
    "frontend/src/components",
    "frontend/src/pages",
    "frontend/src/hooks",
    "frontend/src/services",
    "frontend/scripts"
  ];

  directories.forEach(dir => {
    generator.fs.write(
      generator.destinationPath(`${dir}/.gitkeep`),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );
  });

  // Copier les fichiers de configuration
  generator.fs.copyTpl(
    generator.templatePath("frontend/react/package.json.ejs"),
    generator.destinationPath("frontend/package.json"),
    templateData
  );

  generator.fs.copyTpl(
    generator.templatePath("frontend/react/vite.config.ts.ejs"),
    generator.destinationPath("frontend/vite.config.ts"),
    templateData
  );

  generator.fs.copyTpl(
    generator.templatePath("frontend/react/tsconfig.json.ejs"),
    generator.destinationPath("frontend/tsconfig.json"),
    templateData
  );

  generator.fs.copyTpl(
    generator.templatePath("frontend/react/tsconfig.node.json.ejs"),
    generator.destinationPath("frontend/tsconfig.node.json"),
    templateData
  );

  // Copier les fichiers de base
  generator.fs.copyTpl(
    generator.templatePath("frontend/react/src/App.tsx.ejs"),
    generator.destinationPath("frontend/src/App.tsx"),
    templateData
  );

  // Copier les pages de base
  generator.fs.copyTpl(
    generator.templatePath("frontend/react/src/pages/Home.tsx.ejs"),
    generator.destinationPath("frontend/src/pages/Home.tsx"),
    templateData
  );

  // Copier le script de génération d'API
  generator.fs.copyTpl(
    generator.templatePath("frontend/react/scripts/api-generate.js.ejs"),
    generator.destinationPath("frontend/scripts/api-generate.js"),
    templateData
  );

  // Copier le guide d'API
  generator.fs.copyTpl(
    generator.templatePath("frontend/react/API-GUIDE.md.ejs"),
    generator.destinationPath("frontend/API-GUIDE.md"),
    templateData
  );
}

/**
 * Génère un frontend Vue.js
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
export function generateVueFrontend(generator: any, templateData: TemplateData) {
  generator.log(chalk.blue("Génération du frontend Vue.js..."));

  // Création de la structure de répertoires
  const directories = [
    "frontend",
    "frontend/src",
    "frontend/src/components",
    "frontend/src/views",
    "frontend/src/services",
    "frontend/src/store"
  ];

  directories.forEach(dir => {
    generator.fs.write(
      generator.destinationPath(`${dir}/.gitkeep`),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );
  });

  // Copier les fichiers de configuration
  generator.fs.copyTpl(
    generator.templatePath("frontend/vue/package.json.ejs"),
    generator.destinationPath("frontend/package.json"),
    templateData
  );

  const viteConfigPath = generator.templatePath("frontend/vue/vite.config.ts.ejs") ||
                         generator.templatePath("frontend/vue/vite.config.js.ejs");

  if (viteConfigPath) {
    generator.fs.copyTpl(
      viteConfigPath,
      generator.destinationPath("frontend/vite.config.ts"),
      templateData
    );
  }

  generator.fs.copyTpl(
    generator.templatePath("frontend/vue/tsconfig.json.ejs"),
    generator.destinationPath("frontend/tsconfig.json"),
    templateData
  );

  // Copier les fichiers de base Vue
  generator.fs.copy(
    generator.templatePath("frontend/vue/src/App.vue.ejs"),
    generator.destinationPath("frontend/src/App.vue")
  );

  // Copier le guide d'API
  generator.fs.copyTpl(
    generator.templatePath("frontend/vue/API-GUIDE.md.ejs"),
    generator.destinationPath("frontend/API-GUIDE.md"),
    templateData
  );
}

/**
 * Génère un frontend Angular
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
export function generateAngularFrontend(generator: any, templateData: TemplateData) {
  generator.log(chalk.blue("Génération du frontend Angular..."));

  // Création de la structure de répertoires
  const directories = [
    "frontend",
    "frontend/src",
    "frontend/src/app",
    "frontend/src/app/components",
    "frontend/src/app/pages",
    "frontend/src/app/services",
    "frontend/src/app/core"
  ];

  directories.forEach(dir => {
    generator.fs.write(
      generator.destinationPath(`${dir}/.gitkeep`),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );
  });

  // Copier les fichiers de configuration
  generator.fs.copyTpl(
    generator.templatePath("frontend/angular/package.json.ejs"),
    generator.destinationPath("frontend/package.json"),
    templateData
  );

  generator.fs.copyTpl(
    generator.templatePath("frontend/angular/angular.json.ejs"),
    generator.destinationPath("frontend/angular.json"),
    templateData
  );

  generator.fs.copyTpl(
    generator.templatePath("frontend/angular/tsconfig.json.ejs"),
    generator.destinationPath("frontend/tsconfig.json"),
    templateData
  );

  // Copier les fichiers de base Angular
  generator.fs.copyTpl(
    generator.templatePath("frontend/angular/src/main.ts.ejs"),
    generator.destinationPath("frontend/src/main.ts"),
    templateData
  );

  generator.fs.copyTpl(
    generator.templatePath("frontend/angular/src/app/app.component.ts.ejs"),
    generator.destinationPath("frontend/src/app/app.component.ts"),
    templateData
  );

  generator.fs.copyTpl(
    generator.templatePath("frontend/angular/src/app/app.component.html.ejs"),
    generator.destinationPath("frontend/src/app/app.component.html"),
    templateData
  );

  generator.fs.copyTpl(
    generator.templatePath("frontend/angular/src/app/app.routes.ts.ejs"),
    generator.destinationPath("frontend/src/app/app.routes.ts"),
    templateData
  );

  // Copier le guide d'API
  generator.fs.copyTpl(
    generator.templatePath("frontend/angular/API-GUIDE.md.ejs"),
    generator.destinationPath("frontend/API-GUIDE.md"),
    templateData
  );
}

/**
 * Génère un frontend Thymeleaf
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
export function generateThymeleafFrontend(generator: any, templateData: TemplateData) {
  generator.log(chalk.blue("Génération du frontend Thymeleaf..."));

  // Création des dossiers nécessaires
  const directories = [
    "src/main/resources/templates",
    "src/main/resources/templates/layouts",
    "src/main/resources/templates/fragments",
    "src/main/resources/static/css",
    "src/main/resources/static/js"
  ];

  directories.forEach(dir => {
    generator.fs.write(
      generator.destinationPath(`${dir}/.gitkeep`),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );
  });

  // Copier les fichiers de base Thymeleaf
  generator.fs.copyTpl(
    generator.templatePath("frontend/thymeleaf/pages/index.html.ejs"),
    generator.destinationPath("src/main/resources/templates/index.html"),
    templateData
  );

  generator.fs.copyTpl(
    generator.templatePath("frontend/thymeleaf/layouts/main.html.ejs"),
    generator.destinationPath("src/main/resources/templates/layouts/main.html"),
    templateData
  );

  generator.fs.copyTpl(
    generator.templatePath("frontend/thymeleaf/pages/home.html.ejs"),
    generator.destinationPath("src/main/resources/templates/home.html"),
    templateData
  );

  // Copier les pages d'authentification si nécessaire
  if (templateData.includeAuth) {
    generator.fs.copyTpl(
      generator.templatePath("frontend/thymeleaf/pages/login.html.ejs"),
      generator.destinationPath("src/main/resources/templates/login.html"),
      templateData
    );
  }
}

/**
 * Génère un frontend JTE
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
export function generateJTEFrontend(generator: any, templateData: TemplateData) {
  generator.log(chalk.blue("Génération du frontend JTE..."));

  // Création des dossiers nécessaires
  const directories = [
    "src/main/jte",
    "src/main/jte/layouts",
    "src/main/jte/pages",
    "src/main/jte/components"
  ];

  directories.forEach(dir => {
    generator.fs.write(
      generator.destinationPath(`${dir}/.gitkeep`),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );
  });

  // Copier les fichiers de base JTE
  generator.fs.copyTpl(
    generator.templatePath("frontend/jte/layouts/main.jte.ejs"),
    generator.destinationPath("src/main/jte/layouts/main.jte"),
    templateData
  );

  generator.fs.copyTpl(
    generator.templatePath("frontend/jte/layouts/default.jte.ejs"),
    generator.destinationPath("src/main/jte/layouts/default.jte"),
    templateData
  );
}
