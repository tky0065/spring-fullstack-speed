/**
 * Générateur pour la commande 'sfs doctor'
 * Effectue des diagnostics sur le projet et propose des corrections
 */

import { BaseGenerator } from "../base-generator.js";
import chalk from "chalk";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { createSpinner, displaySectionTitle, displaySectionEnd, success, error, info } from "../../utils/cli-ui.js";
import { withKeyboardInput, showNavigableMenu } from "../../utils/cli-navigation.js";
import { validateJavaPackageName } from "../../utils/validation.js";
import boxen from "boxen";

// Interface pour les options du générateur
interface DoctorOptions {
  fix?: boolean;
  verbose?: boolean;
}

// Interface pour un problème détecté
interface Issue {
  id: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  details?: string;
  fixable?: boolean;
  fix?: () => Promise<void>;
}

/**
 * Générateur pour diagnostiquer et réparer les problèmes de projet
 */
export default class DoctorGenerator extends BaseGenerator {
  // Déclaration des options avec les types corrects
  declare options: any;

  // Propriétés internes
  projectDetails: any = {};
  issues: Issue[] = [];

  constructor(args: string[], options: any) {
    super(args, options);

    // Définition des options de la commande
    this.option("fix", {
      type: Boolean,
      description: "Tente de corriger automatiquement les problèmes",
      default: false
    });

    this.option("verbose", {
      type: Boolean,
      description: "Affiche des informations détaillées",
      default: false
    });
  }

  /**
   * Initialisation du générateur
   */
  async initializing() {
    displaySectionTitle("Diagnostic de projet Spring-Fullstack");

    // Vérifier que nous sommes dans un projet
    if (!this.isProjectDirectory()) {
      this.log(chalk.yellow("⚠️ Ce répertoire ne semble pas contenir un projet Spring Boot. Le diagnostic sera limité."));
    }

    // Détecter les détails du projet
    await this.detectProjectDetails();

    this.log(chalk.gray("Projet détecté :"));
    if (this.projectDetails.name) {
      this.log(chalk.gray(`- Nom: ${this.projectDetails.name}`));
    }
    if (this.projectDetails.packageName) {
      this.log(chalk.gray(`- Package: ${this.projectDetails.packageName}`));
    }
    if (this.projectDetails.buildTool) {
      this.log(chalk.gray(`- Outil de build: ${this.projectDetails.buildTool}`));
    }
    if (this.projectDetails.springBootVersion) {
      this.log(chalk.gray(`- Version Spring Boot: ${this.projectDetails.springBootVersion}`));
    }
  }

  /**
   * Détecte les détails du projet
   */
  async detectProjectDetails() {
    // Déterminer l'outil de build et les détails du projet
    if (fs.existsSync(path.join(process.cwd(), "pom.xml"))) {
      this.projectDetails.buildTool = "Maven";

      try {
        const pomContent = fs.readFileSync(path.join(process.cwd(), "pom.xml"), "utf8");

        // Extraire le nom du projet
        const nameMatch = pomContent.match(/<artifactId>(.*?)<\/artifactId>/);
        if (nameMatch) {
          this.projectDetails.name = nameMatch[1];
        }

        // Extraire le package
        const groupIdMatch = pomContent.match(/<groupId>(.*?)<\/groupId>/);
        if (groupIdMatch) {
          this.projectDetails.packageName = groupIdMatch[1];
        }

        // Extraire la version de Spring Boot
        const springBootMatch = pomContent.match(/<spring-boot\.version>(.*?)<\/spring-boot\.version>/);
        if (springBootMatch) {
          this.projectDetails.springBootVersion = springBootMatch[1];
        } else {
          const parentMatch = pomContent.match(/<parent>[\s\S]*?<version>(.*?)<\/version>/);
          if (parentMatch) {
            this.projectDetails.springBootVersion = parentMatch[1];
          }
        }
      } catch (err) {
        if (this.options.verbose) {
          this.log(chalk.red(`Erreur lors de la lecture de pom.xml: ${err}`));
        }
      }

    } else if (fs.existsSync(path.join(process.cwd(), "build.gradle")) ||
              fs.existsSync(path.join(process.cwd(), "build.gradle.kts"))) {

      const isKotlinDSL = fs.existsSync(path.join(process.cwd(), "build.gradle.kts"));
      this.projectDetails.buildTool = isKotlinDSL ? "Gradle (Kotlin DSL)" : "Gradle";

      try {
        const gradlePath = isKotlinDSL ?
          path.join(process.cwd(), "build.gradle.kts") :
          path.join(process.cwd(), "build.gradle");

        const gradleContent = fs.readFileSync(gradlePath, "utf8");

        // Extraire la version de Spring Boot
        const springBootMatch = gradleContent.match(/spring-boot['"]\s*version\s*['"]([^'"]+)['"]/);
        if (springBootMatch) {
          this.projectDetails.springBootVersion = springBootMatch[1];
        }

        // Pour gradle, le nom du projet est généralement dans settings.gradle
        if (fs.existsSync(path.join(process.cwd(), isKotlinDSL ? "settings.gradle.kts" : "settings.gradle"))) {
          const settingsPath = isKotlinDSL ?
            path.join(process.cwd(), "settings.gradle.kts") :
            path.join(process.cwd(), "settings.gradle");

          const settingsContent = fs.readFileSync(settingsPath, "utf8");
          const rootProjectMatch = settingsContent.match(/rootProject\.name\s*=\s*['"](.*)['"]/);

          if (rootProjectMatch) {
            this.projectDetails.name = rootProjectMatch[1];
          }
        }
      } catch (err) {
        if (this.options.verbose) {
          this.log(chalk.red(`Erreur lors de la lecture des fichiers gradle: ${err}`));
        }
      }
    }

    // Trouver le package Java principal
    try {
      this.findJavaPackage();
    } catch (err) {
      if (this.options.verbose) {
        this.log(chalk.red(`Erreur lors de la détection du package Java: ${err}`));
      }
    }

    // Détecter d'autres caractéristiques du projet
    this.projectDetails.hasDocker = fs.existsSync(path.join(process.cwd(), "Dockerfile")) ||
                                   fs.existsSync(path.join(process.cwd(), "docker-compose.yml"));

    this.projectDetails.hasTests = fs.existsSync(path.join(process.cwd(), "src", "test"));

    // Détecter la configuration git
    this.projectDetails.hasGit = fs.existsSync(path.join(process.cwd(), ".git"));

    // Détecter le frontend
    this.projectDetails.hasFrontend = fs.existsSync(path.join(process.cwd(), "package.json")) ||
                                     fs.existsSync(path.join(process.cwd(), "frontend"));
  }

  /**
   * Trouve le package Java principal du projet
   */
  private findJavaPackage() {
    const srcMainJava = path.join(process.cwd(), "src", "main", "java");

    if (!fs.existsSync(srcMainJava)) {
      return;
    }

    // Rechercher une classe avec @SpringBootApplication
    const findApplicationClass = (dir: string): string | null => {
      const files = fs.readdirSync(dir);

      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          const result = findApplicationClass(fullPath);
          if (result) return result;
        }
        else if (file.endsWith(".java")) {
          const content = fs.readFileSync(fullPath, "utf8");
          if (content.includes("@SpringBootApplication")) {
            // Extraire le package de la première ligne (package com.example;)
            const packageMatch = content.match(/package\s+([\w.]+);/);
            if (packageMatch) {
              return packageMatch[1];
            }
          }
        }
      }

      return null;
    };

    const packageName = findApplicationClass(srcMainJava);
    if (packageName) {
      this.projectDetails.packageName = packageName;
    }
  }

  /**
   * Vérifie si le répertoire actuel est un projet
   */
  private isProjectDirectory(): boolean {
    // Vérifier la présence de fichiers caractéristiques d'un projet
    return fs.existsSync(path.join(process.cwd(), "pom.xml")) ||
           fs.existsSync(path.join(process.cwd(), "build.gradle")) ||
           fs.existsSync(path.join(process.cwd(), "build.gradle.kts"));
  }

  /**
   * Exécute les vérifications sur le projet
   */
  async diagnose() {
    const spinner = createSpinner({
      text: "Exécution des diagnostics...",
      color: "primary"
    });

    spinner.start();

    try {
      // Vérifications de l'environnement
      await this.checkEnvironment();

      // Vérifications de la structure du projet
      await this.checkProjectStructure();

      // Vérifications de la configuration
      await this.checkConfiguration();

      // Vérifications des dépendances
      await this.checkDependencies();

      // Vérifications du code
      await this.checkCode();

      // Vérifications des tests
      await this.checkTests();

      spinner.succeed("Diagnostics terminés");
    } catch (err) {
      spinner.fail(`Erreur lors du diagnostic: ${err}`);
      if (this.options.verbose) {
        console.error(err);
      }
    }
  }

  /**
   * Vérifie l'environnement de développement
   */
  private async checkEnvironment() {
    // Vérifier Java
    try {
      const javaVersion = execSync("java -version 2>&1").toString();
      const versionMatch = javaVersion.match(/version "(.*?)"/);

      if (versionMatch) {
        const version = versionMatch[1];

        // Vérifier la version de Java
        if (version.startsWith("1.7") || version.startsWith("1.6")) {
          this.issues.push({
            id: "java-version",
            level: "error",
            message: `Version Java obsolète: ${version}`,
            details: "Spring Boot 2.x+ nécessite Java 8+, et Spring Boot 3.x nécessite Java 17+",
            fixable: false
          });
        } else if (this.projectDetails.springBootVersion &&
                   this.projectDetails.springBootVersion.startsWith("3.") &&
                   !version.startsWith("17") &&
                   !version.startsWith("21")) {
          this.issues.push({
            id: "java-version-spring-boot-3",
            level: "warning",
            message: `Version Java non optimale pour Spring Boot 3.x: ${version}`,
            details: "Spring Boot 3.x recommande Java 17+ pour des performances optimales",
            fixable: false
          });
        }
      }
    } catch (err) {
      this.issues.push({
        id: "java-not-found",
        level: "error",
        message: "Java n'est pas installé ou n'est pas dans le PATH",
        details: "Installez un JDK (Java Development Kit) et assurez-vous qu'il est dans votre PATH",
        fixable: false
      });
    }

    // Vérifier Maven/Gradle selon l'outil de build utilisé
    if (this.projectDetails.buildTool === "Maven") {
      try {
        execSync("mvn --version");
      } catch (err) {
        this.issues.push({
          id: "maven-not-found",
          level: "warning",
          message: "Maven n'est pas installé ou n'est pas dans le PATH",
          details: "Le wrapper Maven sera utilisé, mais l'installation de Maven peut être préférable",
          fixable: false
        });
      }
    } else if (this.projectDetails.buildTool && this.projectDetails.buildTool.includes("Gradle")) {
      try {
        execSync("gradle --version");
      } catch (err) {
        this.issues.push({
          id: "gradle-not-found",
          level: "warning",
          message: "Gradle n'est pas installé ou n'est pas dans le PATH",
          details: "Le wrapper Gradle sera utilisé, mais l'installation de Gradle peut être préférable",
          fixable: false
        });
      }
    }

    // Vérifier Node.js si projet frontend
    if (this.projectDetails.hasFrontend) {
      try {
        const nodeVersion = execSync("node --version").toString().trim();

        // Vérifier la version de Node.js
        const versionNumber = nodeVersion.replace('v', '').split('.').map(Number)[0];

        if (versionNumber < 14) {
          this.issues.push({
            id: "node-version",
            level: "warning",
            message: `Version Node.js obsolète: ${nodeVersion}`,
            details: "Les frameworks frontend modernes recommandent Node.js 14+",
            fixable: false
          });
        }
      } catch (err) {
        this.issues.push({
          id: "node-not-found",
          level: "warning",
          message: "Node.js n'est pas installé ou n'est pas dans le PATH",
          details: "Nécessaire pour le développement frontend",
          fixable: false
        });
      }
    }

    // Vérifier l'espace disque
    try {
      const stats = fs.statfsSync(process.cwd());
      const freeSpace = stats.bfree * stats.bsize;
      const freeSpaceGB = freeSpace / (1024 * 1024 * 1024);

      if (freeSpaceGB < 1) {
        this.issues.push({
          id: "disk-space",
          level: "warning",
          message: `Espace disque limité: ${freeSpaceGB.toFixed(2)} GB disponibles`,
          details: "Le manque d'espace disque peut causer des problèmes lors du build",
          fixable: false
        });
      }
    } catch (err) {
      // Ignorer les erreurs de vérification d'espace disque
    }
  }

  /**
   * Vérifie la structure du projet
   */
  private async checkProjectStructure() {
    // Vérifier la présence des répertoires essentiels
    const essentialDirs = [
      ["src", "main", "java"],
      ["src", "main", "resources"],
      ["src", "test"]
    ];

    for (const dirPath of essentialDirs) {
      const fullPath = path.join(process.cwd(), ...dirPath);
      if (!fs.existsSync(fullPath)) {
        this.issues.push({
          id: `missing-dir-${dirPath.join('/')}`,
          level: "warning",
          message: `Répertoire ${dirPath.join('/')} manquant`,
          details: `Ce répertoire est généralement présent dans un projet Spring Boot`,
          fixable: true,
          fix: async () => {
            fs.mkdirSync(fullPath, { recursive: true });
            this.log(chalk.green(`✓ Répertoire ${dirPath.join('/')} créé`));
          }
        });
      }
    }

    // Vérifier le .gitignore
    const gitignorePath = path.join(process.cwd(), ".gitignore");
    if (!fs.existsSync(gitignorePath)) {
      this.issues.push({
        id: "missing-gitignore",
        level: "warning",
        message: "Fichier .gitignore manquant",
        details: "Un fichier .gitignore est recommandé pour éviter de committer des fichiers inutiles",
        fixable: true,
        fix: async () => {
          // Créer un .gitignore basique pour Spring Boot
          const gitignoreContent = `
# Compiled class file
*.class

# Log files
*.log
logs/

# BlueJ files
*.ctxt

# Mobile Tools for Java (J2ME)
.mtj.tmp/

# Package Files #
*.jar
*.war
*.nar
*.ear
*.zip
*.tar.gz
*.rar

# virtual machine crash logs
hs_err_pid*

# Maven
target/
!.mvn/wrapper/maven-wrapper.jar
!**/src/main/**/target/
!**/src/test/**/target/

# Gradle
.gradle
build/
!gradle/wrapper/gradle-wrapper.jar
!**/src/main/**/build/
!**/src/test/**/build/

# STS / Eclipse
.apt_generated
.classpath
.factorypath
.project
.settings
.springBeans
.sts4-cache

# IntelliJ IDEA
.idea
*.iws
*.iml
*.ipr
out/
!**/src/main/**/out/
!**/src/test/**/out/

# NetBeans
/nbproject/private/
/nbbuild/
/dist/
/nbdist/
/.nb-gradle/

# VS Code
.vscode/

# Environments
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Node.js
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
package-lock.json
yarn.lock

# Frontend build
/src/main/resources/static/
`;

          fs.writeFileSync(gitignorePath, gitignoreContent.trim());
          this.log(chalk.green("✓ Fichier .gitignore créé"));
        }
      });
    }

    // Vérifier la présence des wrappers Maven ou Gradle
    if (this.projectDetails.buildTool === "Maven") {
      const mvnwPath = path.join(process.cwd(), process.platform === "win32" ? "mvnw.cmd" : "mvnw");

      if (!fs.existsSync(mvnwPath)) {
        this.issues.push({
          id: "missing-maven-wrapper",
          level: "warning",
          message: "Wrapper Maven manquant",
          details: "Le wrapper Maven permet d'exécuter Maven sans l'installer",
          fixable: true,
          fix: async () => {
            try {
              // Créer le wrapper Maven
              execSync("mvn -N io.takari:maven:wrapper", { stdio: "inherit" });
              this.log(chalk.green("✓ Wrapper Maven créé"));
            } catch (err) {
              this.log(chalk.red(`⚠️ Impossible de créer le wrapper Maven: ${err}`));
            }
          }
        });
      }
    } else if (this.projectDetails.buildTool && this.projectDetails.buildTool.includes("Gradle")) {
      const gradlewPath = path.join(process.cwd(), process.platform === "win32" ? "gradlew.bat" : "gradlew");

      if (!fs.existsSync(gradlewPath)) {
        this.issues.push({
          id: "missing-gradle-wrapper",
          level: "warning",
          message: "Wrapper Gradle manquant",
          details: "Le wrapper Gradle permet d'exécuter Gradle sans l'installer",
          fixable: true,
          fix: async () => {
            try {
              // Créer le wrapper Gradle
              execSync("gradle wrapper", { stdio: "inherit" });
              this.log(chalk.green("✓ Wrapper Gradle créé"));
            } catch (err) {
              this.log(chalk.red(`⚠️ Impossible de créer le wrapper Gradle: ${err}`));
            }
          }
        });
      }
    }

    // Vérifier la présence d'un README.md
    const readmePath = path.join(process.cwd(), "README.md");
    if (!fs.existsSync(readmePath)) {
      this.issues.push({
        id: "missing-readme",
        level: "info",
        message: "Fichier README.md manquant",
        details: "Un README aide les autres développeurs à comprendre votre projet",
        fixable: true,
        fix: async () => {
          // Créer un README basique
          const readmeContent = `# ${this.projectDetails.name || "Spring Boot Application"}

## Description

Ce projet est une application Spring Boot.

## Prérequis

- Java ${this.projectDetails.springBootVersion && this.projectDetails.springBootVersion.startsWith("3.") ? "17" : "8"}+
- ${this.projectDetails.buildTool || "Maven/Gradle"}
${this.projectDetails.hasFrontend ? "- Node.js 14+" : ""}

## Installation

\`\`\`bash
# Cloner le dépôt
git clone <URL_DU_DEPOT>
cd ${this.projectDetails.name || "application"}

# Construire le projet
${this.projectDetails.buildTool === "Maven" ? "mvn clean install" : "./gradlew build"}
\`\`\`

## Exécution

\`\`\`bash
${this.projectDetails.buildTool === "Maven" ? "mvn spring-boot:run" : "./gradlew bootRun"}
\`\`\`

## Fonctionnalités

- À compléter...

## Structure du projet

\`\`\`
src/
├── main/
│   ├── java/          # Code source Java
│   └── resources/     # Ressources et configuration
└── test/              # Tests
\`\`\`
`;

          fs.writeFileSync(readmePath, readmeContent);
          this.log(chalk.green("✓ Fichier README.md créé"));
        }
      });
    }
  }

  /**
   * Vérifie la configuration du projet
   */
  private async checkConfiguration() {
    // Vérifier le fichier application.properties ou application.yml
    const propPath = path.join(process.cwd(), "src", "main", "resources", "application.properties");
    const ymlPath = path.join(process.cwd(), "src", "main", "resources", "application.yml");

    if (!fs.existsSync(propPath) && !fs.existsSync(ymlPath)) {
      this.issues.push({
        id: "missing-app-config",
        level: "error",
        message: "Fichier de configuration Spring Boot manquant",
        details: "application.properties ou application.yml est requis pour la configuration de Spring Boot",
        fixable: true,
        fix: async () => {
          // Créer un fichier application.properties basique
          const content = `# Configuration Spring Boot
spring.application.name=${this.projectDetails.name || 'application'}

# Configuration du serveur
server.port=8080

# Configuration de la base de données (à personnaliser)
# spring.datasource.url=jdbc:h2:mem:testdb
# spring.datasource.username=sa
# spring.datasource.password=password
# spring.jpa.hibernate.ddl-auto=update

# Configuration des logs
logging.level.root=INFO
logging.level.${this.projectDetails.packageName || 'com.example'}=DEBUG

# Configuration des profils
spring.profiles.active=dev
`;
          fs.writeFileSync(propPath, content);
          this.log(chalk.green("✓ Fichier application.properties créé"));
        }
      });
    } else {
      // Si le fichier existe, vérifier des configurations essentielles
      try {
        const configPath = fs.existsSync(propPath) ? propPath : ymlPath;
        const content = fs.readFileSync(configPath, "utf8");

        if (!content.includes("server.port") && !content.includes("server:") && !content.includes("port:")) {
          this.issues.push({
            id: "missing-server-port",
            level: "info",
            message: "Configuration du port serveur manquante",
            details: "Il est recommandé de définir explicitement server.port pour éviter les conflits",
            fixable: false
          });
        }

        if (!content.includes("spring.application.name") && !content.includes("application:") && !content.includes("name:")) {
          this.issues.push({
            id: "missing-app-name",
            level: "info",
            message: "Nom d'application manquant",
            details: "spring.application.name est recommandé pour l'identification dans les logs et pour Spring Cloud",
            fixable: false
          });
        }
      } catch (err) {
        if (this.options.verbose) {
          this.log(chalk.red(`Erreur lors de la lecture du fichier de configuration: ${err}`));
        }
      }
    }

    // Vérifier les profils de configuration
    const devConfigPath = path.join(process.cwd(), "src", "main", "resources", "application-dev.properties");
    const prodConfigPath = path.join(process.cwd(), "src", "main", "resources", "application-prod.properties");
    const devYmlPath = path.join(process.cwd(), "src", "main", "resources", "application-dev.yml");
    const prodYmlPath = path.join(process.cwd(), "src", "main", "resources", "application-prod.yml");

    if (!fs.existsSync(devConfigPath) && !fs.existsSync(devYmlPath) &&
        !fs.existsSync(prodConfigPath) && !fs.existsSync(prodYmlPath)) {
      this.issues.push({
        id: "missing-profiles",
        level: "warning",
        message: "Profils de configuration manquants",
        details: "Il est recommandé d'utiliser des profils Spring (dev, prod) pour différentes configurations",
        fixable: false
      });
    }
  }

  /**
   * Vérifie les dépendances du projet
   */
  private async checkDependencies() {
    // Vérifier les dépendances Maven ou Gradle
    if (this.projectDetails.buildTool === "Maven") {
      const pomPath = path.join(process.cwd(), "pom.xml");
      if (fs.existsSync(pomPath)) {
        try {
          const pomContent = fs.readFileSync(pomPath, "utf8");

          // Vérifier les dépendances essentielles
          if (!pomContent.includes("spring-boot-starter-web")) {
            this.issues.push({
              id: "missing-web-starter",
              level: "info",
              message: "Dépendance spring-boot-starter-web manquante",
              details: "Cette dépendance est nécessaire pour les applications Web Spring Boot",
              fixable: false
            });
          }

          if (!pomContent.includes("spring-boot-starter-test")) {
            this.issues.push({
              id: "missing-test-starter",
              level: "warning",
              message: "Dépendance spring-boot-starter-test manquante",
              details: "Cette dépendance est recommandée pour les tests d'applications Spring Boot",
              fixable: false
            });
          }

          // Vérifier les vulnérabilités connues (simulé ici)
          if (this.projectDetails.springBootVersion &&
              (this.projectDetails.springBootVersion.startsWith("1.") ||
               this.projectDetails.springBootVersion.startsWith("2.0") ||
               this.projectDetails.springBootVersion.startsWith("2.1"))) {
            this.issues.push({
              id: "vulnerable-spring-boot",
              level: "error",
              message: `Spring Boot ${this.projectDetails.springBootVersion} a des vulnérabilités connues`,
              details: "Mettez à jour vers une version plus récente de Spring Boot",
              fixable: false
            });
          }

        } catch (err) {
          if (this.options.verbose) {
            this.log(chalk.red(`Erreur lors de la lecture de pom.xml: ${err}`));
          }
        }
      }
    } else if (this.projectDetails.buildTool && this.projectDetails.buildTool.includes("Gradle")) {
      const isKotlinDSL = this.projectDetails.buildTool.includes("Kotlin");
      const gradlePath = path.join(process.cwd(), isKotlinDSL ? "build.gradle.kts" : "build.gradle");

      if (fs.existsSync(gradlePath)) {
        try {
          const gradleContent = fs.readFileSync(gradlePath, "utf8");

          // Vérifier les dépendances essentielles
          if (!gradleContent.includes("spring-boot-starter-web")) {
            this.issues.push({
              id: "missing-web-starter",
              level: "info",
              message: "Dépendance spring-boot-starter-web manquante",
              details: "Cette dépendance est nécessaire pour les applications Web Spring Boot",
              fixable: false
            });
          }

          if (!gradleContent.includes("spring-boot-starter-test")) {
            this.issues.push({
              id: "missing-test-starter",
              level: "warning",
              message: "Dépendance spring-boot-starter-test manquante",
              details: "Cette dépendance est recommandée pour les tests d'applications Spring Boot",
              fixable: false
            });
          }

        } catch (err) {
          if (this.options.verbose) {
            this.log(chalk.red(`Erreur lors de la lecture du fichier gradle: ${err}`));
          }
        }
      }
    }

    // Si c'est un projet frontend, vérifier package.json
    if (this.projectDetails.hasFrontend) {
      const packageJsonPath = path.join(process.cwd(), "package.json");

      if (fs.existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

          // Vérifier les scripts essentiels
          if (!packageJson.scripts || !packageJson.scripts.build) {
            this.issues.push({
              id: "missing-build-script",
              level: "warning",
              message: "Script de build manquant dans package.json",
              details: "Un script 'build' est généralement nécessaire pour les applications frontend",
              fixable: false
            });
          }

          // Vérifier les dépendances obsolètes (ex: React)
          if (packageJson.dependencies && packageJson.dependencies.react) {
            const reactVersion = packageJson.dependencies.react.replace(/[^0-9.]/g, '');
            const majorVersion = parseInt(reactVersion.split('.')[0]);

            if (majorVersion < 16) {
              this.issues.push({
                id: "obsolete-react",
                level: "warning",
                message: `Version obsolète de React (v${reactVersion})`,
                details: "La version de React est obsolète. Envisagez une mise à jour.",
                fixable: false
              });
            }
          }
        } catch (err) {
          if (this.options.verbose) {
            this.log(chalk.red(`Erreur lors de la lecture de package.json: ${err}`));
          }
        }
      }
    }
  }

  /**
   * Vérifie la qualité du code
   */
  private async checkCode() {
    // Vérifier la présence de fichiers de configuration pour les linters
    const lintConfigs = [
      { file: ".eslintrc.js", name: "ESLint" },
      { file: ".eslintrc.json", name: "ESLint" },
      { file: "tslint.json", name: "TSLint" },
      { file: "checkstyle.xml", name: "Checkstyle" },
      { file: "pmd.xml", name: "PMD" },
      { file: ".editorconfig", name: "EditorConfig" }
    ];

    let hasAnyLinter = false;

    for (const config of lintConfigs) {
      if (fs.existsSync(path.join(process.cwd(), config.file))) {
        hasAnyLinter = true;
        break;
      }
    }

    if (!hasAnyLinter) {
      this.issues.push({
        id: "missing-code-quality-tools",
        level: "warning",
        message: "Aucun outil de qualité du code détecté",
        details: "Envisagez d'utiliser des outils comme ESLint, Checkstyle, PMD ou EditorConfig pour maintenir une qualité de code cohérente",
        fixable: true,
        fix: async () => {
          // Créer un .editorconfig basique
          const editorConfigContent = `root = true

[*]
charset = utf-8
end_of_line = lf
indent_size = 2
indent_style = space
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false

[*.java]
indent_size = 4

[*.{xml,html}]
indent_size = 2
`;
          fs.writeFileSync(path.join(process.cwd(), ".editorconfig"), editorConfigContent);
          this.log(chalk.green("✓ Fichier .editorconfig créé"));
        }
      });
    }

    // Vérifier la documentation du code (JavaDoc)
    if (this.projectDetails.packageName) {
      try {
        const srcMainJava = path.join(process.cwd(), "src", "main", "java");
        if (fs.existsSync(srcMainJava)) {
          let javaFilesWithoutJavadoc = 0;
          let totalJavaFiles = 0;

          // Fonction récursive pour vérifier les fichiers Java
          const checkJavaFiles = (dir: string) => {
            const files = fs.readdirSync(dir);

            for (const file of files) {
              const fullPath = path.join(dir, file);
              const stat = fs.statSync(fullPath);

              if (stat.isDirectory()) {
                checkJavaFiles(fullPath);
              } else if (file.endsWith(".java")) {
                totalJavaFiles++;

                const content = fs.readFileSync(fullPath, "utf8");
                // Vérifier si le fichier contient des commentaires JavaDoc
                if (!content.includes("/**") || !content.includes("*/")) {
                  javaFilesWithoutJavadoc++;
                }
              }
            }
          };

          checkJavaFiles(srcMainJava);

          if (totalJavaFiles > 0 && javaFilesWithoutJavadoc / totalJavaFiles > 0.5) {
            this.issues.push({
              id: "missing-javadoc",
              level: "info",
              message: `Documentation du code insuffisante (${javaFilesWithoutJavadoc}/${totalJavaFiles} fichiers sans JavaDoc)`,
              details: "La documentation du code avec JavaDoc est recommandée pour la maintenabilité",
              fixable: false
            });
          }
        }
      } catch (err) {
        if (this.options.verbose) {
          this.log(chalk.red(`Erreur lors de la vérification de la documentation du code: ${err}`));
        }
      }
    }
  }

  /**
   * Vérifie les tests du projet
   */
  private async checkTests() {
    const srcTestJava = path.join(process.cwd(), "src", "test", "java");

    // Vérifier s'il y a des tests
    if (fs.existsSync(srcTestJava)) {
      try {
        let testCount = 0;

        // Fonction récursive pour compter les fichiers de test
        const countTestFiles = (dir: string) => {
          const files = fs.readdirSync(dir);

          for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
              countTestFiles(fullPath);
            } else if (file.endsWith("Test.java") || file.endsWith("Tests.java") || file.endsWith("IT.java")) {
              testCount++;

              // Vérifier le contenu du fichier de test
              const content = fs.readFileSync(fullPath, "utf8");
              if (!content.includes("@Test")) {
                this.issues.push({
                  id: `invalid-test-${file}`,
                  level: "warning",
                  message: `Le fichier de test ${file} ne contient pas d'annotations @Test`,
                  details: "Les fichiers de test doivent contenir des méthodes avec l'annotation @Test",
                  fixable: false
                });
              }
            }
          }
        };

        countTestFiles(srcTestJava);

        if (testCount === 0) {
          this.issues.push({
            id: "no-tests",
            level: "warning",
            message: "Aucun fichier de test trouvé",
            details: "Il est recommandé d'avoir des tests pour votre application",
            fixable: false
          });
        }
      } catch (err) {
        if (this.options.verbose) {
          this.log(chalk.red(`Erreur lors de la vérification des tests: ${err}`));
        }
      }
    } else {
      this.issues.push({
        id: "missing-test-directory",
        level: "warning",
        message: "Répertoire de tests manquant",
        details: "Il est recommandé d'avoir des tests pour votre application",
        fixable: true,
        fix: async () => {
          fs.mkdirSync(path.join(process.cwd(), "src", "test", "java"), { recursive: true });
          this.log(chalk.green("✓ Répertoire de tests créé"));
        }
      });
    }

    // Vérifier la configuration de couverture de code
    const pomPath = path.join(process.cwd(), "pom.xml");
    const gradlePath = path.join(process.cwd(), "build.gradle");
    const gradleKtsPath = path.join(process.cwd(), "build.gradle.kts");

    let hasCoveragePlugin = false;

    if (fs.existsSync(pomPath)) {
      const content = fs.readFileSync(pomPath, "utf8");
      hasCoveragePlugin = content.includes("jacoco") || content.includes("cobertura");
    } else if (fs.existsSync(gradlePath)) {
      const content = fs.readFileSync(gradlePath, "utf8");
      hasCoveragePlugin = content.includes("jacoco") || content.includes("id 'jacoco'");
    } else if (fs.existsSync(gradleKtsPath)) {
      const content = fs.readFileSync(gradleKtsPath, "utf8");
      hasCoveragePlugin = content.includes("jacoco") || content.includes("id(\"jacoco\")");
    }

    if (!hasCoveragePlugin) {
      this.issues.push({
        id: "missing-coverage",
        level: "info",
        message: "Outil de couverture de code manquant",
        details: "JaCoCo ou un autre outil de couverture est recommandé pour suivre la qualité des tests",
        fixable: false
      });
    }
  }

  /**
   * Affiche les problèmes détectés et propose des corrections
   */
  async prompting() {
    // Exécuter les diagnostics
    await this.diagnose();

    // Si aucun problème n'a été détecté
    if (this.issues.length === 0) {
      this.log(boxen(chalk.green.bold("✓ Aucun problème détecté dans votre projet!"), {
        padding: 1,
        margin: 1,
        borderColor: "green",
        title: "Diagnostic SFS"
      }));
      return;
    }

    // Trier les problèmes par niveau de gravité
    const errors = this.issues.filter(i => i.level === "error");
    const warnings = this.issues.filter(i => i.level === "warning");
    const infos = this.issues.filter(i => i.level === "info");

    // Afficher un résumé des problèmes
    this.log(boxen(
      `${chalk.bold("Résultat du diagnostic SFS")}\n\n` +
      `${chalk.red.bold(errors.length)} erreurs\n` +
      `${chalk.yellow.bold(warnings.length)} avertissements\n` +
      `${chalk.blue.bold(infos.length)} suggestions`,
      {
        padding: 1,
        margin: 1,
        borderColor: errors.length > 0 ? "red" : warnings.length > 0 ? "yellow" : "blue",
        title: "Diagnostic SFS"
      }
    ));

    // Si l'option --fix est activée, corriger automatiquement les problèmes fixables
    if (this.options.fix) {
      const fixableIssues = this.issues.filter(i => i.fixable);

      if (fixableIssues.length > 0) {
        this.log(chalk.green(`\nCorrection automatique de ${fixableIssues.length} problèmes...`));

        for (const issue of fixableIssues) {
          this.log(chalk.gray(`Correction de: ${issue.message}`));
          try {
            if (issue.fix) {
              await issue.fix();
            }
          } catch (err) {
            this.log(chalk.red(`Échec de la correction: ${err}`));
          }
        }
      } else {
        this.log(chalk.yellow("\nAucun problème automatiquement corrigible n'a été détecté."));
      }
    }
    // Sinon, afficher les problèmes et proposer des corrections
    else {
      // Afficher d'abord les erreurs
      if (errors.length > 0) {
        displaySectionTitle("ERREURS");
        for (const issue of errors) {
          this.log(chalk.red.bold(`✖ ${issue.message}`));
          this.log(chalk.gray(`  ${issue.details}`));
        }
      }

      // Puis les avertissements
      if (warnings.length > 0) {
        displaySectionTitle("AVERTISSEMENTS");
        for (const issue of warnings) {
          this.log(chalk.yellow.bold(`⚠ ${issue.message}`));
          this.log(chalk.gray(`  ${issue.details}`));
        }
      }

      // Enfin les suggestions
      if (infos.length > 0) {
        displaySectionTitle("SUGGESTIONS");
        for (const issue of infos) {
          this.log(chalk.blue.bold(`ℹ ${issue.message}`));
          this.log(chalk.gray(`  ${issue.details}`));
        }
      }

      // Proposer de corriger les problèmes automatiquement
      const fixableIssues = this.issues.filter(i => i.fixable);

      if (fixableIssues.length > 0) {
        const answer = await this.prompt({
          type: "confirm",
          name: "fix",
          message: `Voulez-vous corriger automatiquement ${fixableIssues.length} problèmes?`,
          default: true
        });

        if (answer.fix) {
          this.log(chalk.green(`\nCorrection de ${fixableIssues.length} problèmes...`));

          for (const issue of fixableIssues) {
            this.log(chalk.gray(`Correction de: ${issue.message}`));
            try {
              if (issue.fix) {
                await issue.fix();
              }
            } catch (err) {
              this.log(chalk.red(`Échec de la correction: ${err}`));
            }
          }

          this.log(chalk.green(`\n✓ ${fixableIssues.length} problèmes corrigés!`));
        }
      }
    }
  }

  /**
   * Étape de fin
   */
  end() {
    displaySectionEnd();

    // Message pour indiquer la fin du diagnostic
    this.log(chalk.bold.blue("Diagnostic terminé"));

    if (this.issues.length > 0) {
      const fixableCount = this.issues.filter(i => i.fixable).length;
      const nonFixableCount = this.issues.length - fixableCount;

      this.log(chalk.yellow(`${nonFixableCount} problèmes non automatiquement corrigibles nécessitent votre attention.`));

      // Afficher des conseils généraux
      this.log("\n" + boxen(
        chalk.bold("Conseils pour améliorer votre projet:") + "\n\n" +
        "• Gardez vos dépendances à jour\n" +
        "• Écrivez des tests unitaires et d'intégration\n" +
        "• Documentez votre code avec JavaDoc\n" +
        "• Utilisez des outils d'analyse statique\n" +
        "• Suivez les bonnes pratiques Spring Boot",
        {
          padding: 1,
          margin: 1,
          borderColor: "blue",
          title: "SFS Tips"
        }
      ));
    } else {
      this.log(chalk.green.bold("✓ Votre projet respecte toutes les bonnes pratiques vérifiées!"));
    }
  }
}
