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
    // Vérifier les fichiers de configuration Spring Boot
    const appPropertiesPath = path.join(process.cwd(), "src", "main", "resources", "application.properties");
    const appYmlPath = path.join(process.cwd(), "src", "main", "resources", "application.yml");

    if (!fs.existsSync(appPropertiesPath) && !fs.existsSync(appYmlPath)) {
      this.issues.push({
        id: "missing-application-properties",
        level: "warning",
        message: "Fichier de configuration Spring Boot manquant",
        details: "application.properties ou application.yml est généralement présent dans un projet Spring Boot",
        fixable: true,
        fix: async () => {
          // Créer un fichier application.properties basique
          const propertiesContent = `# Configuration Spring Boot
spring.application.name=${this.projectDetails.name || "spring-application"}

# Profils actifs
spring.profiles.active=dev

# Configuration du serveur
server.port=8080

# Configuration de la base de données (à personnaliser)
spring.datasource.url=jdbc:h2:mem:testdb
spring.datasource.driverClassName=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=password
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
spring.h2.console.enabled=true

# Configuration JPA
spring.jpa.show-sql=true
spring.jpa.hibernate.ddl-auto=update

# Configuration du logging
logging.level.root=INFO
logging.level.org.springframework.web=INFO
logging.level.com.example=${this.projectDetails.packageName || "com.example"}=DEBUG

# Configuration Actuator
management.endpoints.web.exposure.include=health,info,metrics
`;

          // Créer le répertoire resources s'il n'existe pas
          const resourcesDir = path.join(process.cwd(), "src", "main", "resources");
          if (!fs.existsSync(resourcesDir)) {
            fs.mkdirSync(resourcesDir, { recursive: true });
          }

          fs.writeFileSync(appPropertiesPath, propertiesContent);
          this.log(chalk.green("✓ Fichier application.properties créé"));
        }
      });
    }

    // Vérifier les profils Spring Boot
    const devProfilePath = path.join(process.cwd(), "src", "main", "resources", "application-dev.properties");
    const prodProfilePath = path.join(process.cwd(), "src", "main", "resources", "application-prod.properties");

    if ((fs.existsSync(appPropertiesPath) || fs.existsSync(appYmlPath)) &&
        !fs.existsSync(devProfilePath) &&
        !fs.existsSync(prodProfilePath)) {
      this.issues.push({
        id: "missing-profile-configs",
        level: "info",
        message: "Profils Spring Boot manquants",
        details: "Il est recommandé d'avoir des configurations spécifiques par environnement",
        fixable: true,
        fix: async () => {
          // Créer les fichiers de profils
          const devContent = `# Configuration de développement
spring.jpa.show-sql=true
spring.h2.console.enabled=true
logging.level.${this.projectDetails.packageName || "com.example"}=DEBUG
`;

          const prodContent = `# Configuration de production
spring.jpa.show-sql=false
spring.h2.console.enabled=false
logging.level.${this.projectDetails.packageName || "com.example"}=INFO
`;

          // Créer le répertoire resources s'il n'existe pas
          const resourcesDir = path.join(process.cwd(), "src", "main", "resources");
          if (!fs.existsSync(resourcesDir)) {
            fs.mkdirSync(resourcesDir, { recursive: true });
          }

          fs.writeFileSync(devProfilePath, devContent);
          fs.writeFileSync(prodProfilePath, prodContent);
          this.log(chalk.green("✓ Fichiers de profils application-dev.properties et application-prod.properties créés"));
        }
      });
    }

    // Vérifier le nom du package Java
    if (this.projectDetails.packageName) {
      const isValidPackage = validateJavaPackageName(this.projectDetails.packageName);

      if (isValidPackage !== true) {
        this.issues.push({
          id: "invalid-package-name",
          level: "warning",
          message: `Nom de package Java invalide: ${this.projectDetails.packageName}`,
          details: typeof isValidPackage === 'string' ? isValidPackage : "Le nom du package devrait suivre les conventions Java",
          fixable: false
        });
      }
    }
  }

  /**
   * Vérifie les dépendances du projet
   */
  private async checkDependencies() {
    // Vérifier les dépendances Spring Boot
    if (this.projectDetails.buildTool === "Maven") {
      const pomPath = path.join(process.cwd(), "pom.xml");

      if (fs.existsSync(pomPath)) {
        const pomContent = fs.readFileSync(pomPath, "utf8");

        // Vérifier les dépendances essentielles
        if (!pomContent.includes("spring-boot-starter-web") && !pomContent.includes("spring-boot-starter-webflux")) {
          this.issues.push({
            id: "missing-web-starter",
            level: "info",
            message: "Dépendance spring-boot-starter-web manquante",
            details: "Cette dépendance est nécessaire pour créer une API REST",
            fixable: false
          });
        }

        // Vérifier les dépendances de test
        if (!pomContent.includes("spring-boot-starter-test")) {
          this.issues.push({
            id: "missing-test-starter",
            level: "warning",
            message: "Dépendance spring-boot-starter-test manquante",
            details: "Cette dépendance est recommandée pour les tests",
            fixable: false
          });
        }

        // Vérifier la configuration de Spring Boot
        if (!pomContent.includes("spring-boot-maven-plugin")) {
          this.issues.push({
            id: "missing-boot-plugin",
            level: "warning",
            message: "Plugin spring-boot-maven-plugin manquant",
            details: "Ce plugin est nécessaire pour créer un JAR exécutable",
            fixable: false
          });
        }

        // Vérifier les versions des dépendances
        if (pomContent.includes("<version>") && pomContent.includes("<dependency>") &&
            !pomContent.includes("<dependencyManagement>")) {
          this.issues.push({
            id: "manual-dependency-versions",
            level: "info",
            message: "Versions de dépendances gérées manuellement",
            details: "Il est recommandé d'utiliser dependencyManagement pour gérer les versions",
            fixable: false
          });
        }
      }
    } else if (this.projectDetails.buildTool && this.projectDetails.buildTool.includes("Gradle")) {
      const gradlePath = fs.existsSync(path.join(process.cwd(), "build.gradle.kts"))
        ? path.join(process.cwd(), "build.gradle.kts")
        : path.join(process.cwd(), "build.gradle");

      if (fs.existsSync(gradlePath)) {
        const gradleContent = fs.readFileSync(gradlePath, "utf8");

        // Vérifier les dépendances essentielles
        if (!gradleContent.includes("spring-boot-starter-web") && !gradleContent.includes("spring-boot-starter-webflux")) {
          this.issues.push({
            id: "missing-web-starter",
            level: "info",
            message: "Dépendance spring-boot-starter-web manquante",
            details: "Cette dépendance est nécessaire pour créer une API REST",
            fixable: false
          });
        }

        // Vérifier les dépendances de test
        if (!gradleContent.includes("spring-boot-starter-test")) {
          this.issues.push({
            id: "missing-test-starter",
            level: "warning",
            message: "Dépendance spring-boot-starter-test manquante",
            details: "Cette dépendance est recommandée pour les tests",
            fixable: false
          });
        }

        // Vérifier le plugin Spring Boot
        if (!gradleContent.includes("org.springframework.boot") || !gradleContent.includes("spring-boot-gradle-plugin")) {
          this.issues.push({
            id: "missing-boot-plugin",
            level: "warning",
            message: "Plugin spring-boot-gradle-plugin manquant",
            details: "Ce plugin est nécessaire pour créer un JAR exécutable",
            fixable: false
          });
        }
      }
    }
  }

  /**
   * Vérifie le code source du projet
   */
  private async checkCode() {
    // Vérifier la présence d'une classe principale avec @SpringBootApplication
    const srcMainJava = path.join(process.cwd(), "src", "main", "java");

    if (fs.existsSync(srcMainJava)) {
      let hasApplicationClass = false;

      const checkDir = (dir: string): boolean => {
        const files = fs.readdirSync(dir);

        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            if (checkDir(fullPath)) return true;
          }
          else if (file.endsWith(".java")) {
            try {
              const content = fs.readFileSync(fullPath, "utf8");
              if (content.includes("@SpringBootApplication")) {
                hasApplicationClass = true;
                return true;
              }
            } catch (err) {
              // Ignorer les erreurs de lecture de fichier
            }
          }
        }

        return false;
      };

      if (!checkDir(srcMainJava)) {
        this.issues.push({
          id: "missing-application-class",
          level: "error",
          message: "Classe principale avec @SpringBootApplication manquante",
          details: "Une classe annotée avec @SpringBootApplication est nécessaire pour démarrer l'application",
          fixable: true,
          fix: async () => {
            // Créer une classe Application basique
            let packagePath = "";
            if (this.projectDetails.packageName) {
              packagePath = this.projectDetails.packageName.replace(/\./g, "/");
            } else {
              packagePath = "com/example/application";
            }

            const packageDir = path.join(srcMainJava, packagePath);

            // Créer les répertoires du package s'ils n'existent pas
            fs.mkdirSync(packageDir, { recursive: true });

            // Créer le fichier Application.java
            const className = this.projectDetails.name ?
              this.projectDetails.name.replace(/[^a-zA-Z0-9]/g, "").replace(/^[a-z]/, c => c.toUpperCase()) + "Application" :
              "Application";

            const applicationContent = `package ${this.projectDetails.packageName || "com.example.application"};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Classe principale qui démarre l'application Spring Boot.
 */
@SpringBootApplication
public class ${className} {

    public static void main(String[] args) {
        SpringApplication.run(${className}.class, args);
    }
}
`;

            const applicationPath = path.join(packageDir, `${className}.java`);
            fs.writeFileSync(applicationPath, applicationContent);
            this.log(chalk.green(`✓ Classe ${className}.java créée`));
          }
        });
      }
    }
  }

  /**
   * Vérifie les tests du projet
   */
  private async checkTests() {
    // Vérifier la présence de tests
    const srcTestJava = path.join(process.cwd(), "src", "test", "java");

    if (fs.existsSync(srcTestJava)) {
      let hasTests = false;

      const checkDir = (dir: string): boolean => {
        const files = fs.readdirSync(dir);

        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            if (checkDir(fullPath)) return true;
          }
          else if (file.endsWith("Test.java") || file.endsWith("Tests.java") || file.endsWith("IT.java")) {
            hasTests = true;
            return true;
          }
        }

        return false;
      };

      if (!checkDir(srcTestJava)) {
        this.issues.push({
          id: "missing-tests",
          level: "info",
          message: "Aucun test trouvé",
          details: "Il est recommandé d'avoir des tests pour votre application",
          fixable: true,
          fix: async () => {
            // Créer un test basique
            let packagePath = "";
            if (this.projectDetails.packageName) {
              packagePath = this.projectDetails.packageName.replace(/\./g, "/");
            } else {
              packagePath = "com/example/application";
            }

            const packageDir = path.join(srcTestJava, packagePath);

            // Créer les répertoires du package s'ils n'existent pas
            fs.mkdirSync(packageDir, { recursive: true });

            // Créer le fichier ApplicationTests.java
            const className = this.projectDetails.name ?
              this.projectDetails.name.replace(/[^a-zA-Z0-9]/g, "").replace(/^[a-z]/, c => c.toUpperCase()) + "ApplicationTests" :
              "ApplicationTests";

            const testContent = `package ${this.projectDetails.packageName || "com.example.application"};

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class ${className} {

    @Test
    void contextLoads() {
        // Ce test vérifie que le contexte Spring se charge correctement
    }
}
`;

            const testPath = path.join(packageDir, `${className}.java`);
            fs.writeFileSync(testPath, testContent);
            this.log(chalk.green(`✓ Classe de test ${className}.java créée`));
          }
        });
      }
    }
  }

  /**
   * Affiche les problèmes détectés et propose des corrections
   */
  async report() {
    if (this.issues.length === 0) {
      const boxContent = boxen("✓ Aucun problème détecté dans votre projet!", {
        padding: 1,
        margin: 1,
        borderColor: "green"
      });

      console.log(boxContent);
      return;
    }

    // Trier les problèmes par niveau
    const errors = this.issues.filter(issue => issue.level === "error");
    const warnings = this.issues.filter(issue => issue.level === "warning");
    const infos = this.issues.filter(issue => issue.level === "info");

    // Afficher un résumé
    console.log("\n" + chalk.bold("Résumé des problèmes:"));
    if (errors.length > 0) console.log(chalk.red(`✗ ${errors.length} erreur(s)`));
    if (warnings.length > 0) console.log(chalk.yellow(`⚠️ ${warnings.length} avertissement(s)`));
    if (infos.length > 0) console.log(chalk.blue(`ℹ️ ${infos.length} suggestion(s)`));

    // Afficher les problèmes en détail
    if (errors.length > 0) {
      displaySectionTitle("Erreurs");
      for (let i = 0; i < errors.length; i++) {
        const issue = errors[i];
        console.log(`${chalk.red(`${i+1}. ${issue.message}`)}${issue.fixable ? chalk.green(" (Réparable)") : ""}`);
        if (this.options.verbose && issue.details) {
          console.log(`   ${chalk.gray(issue.details)}`);
        }
      }
    }

    if (warnings.length > 0) {
      displaySectionTitle("Avertissements");
      for (let i = 0; i < warnings.length; i++) {
        const issue = warnings[i];
        console.log(`${chalk.yellow(`${i+1}. ${issue.message}`)}${issue.fixable ? chalk.green(" (Réparable)") : ""}`);
        if (this.options.verbose && issue.details) {
          console.log(`   ${chalk.gray(issue.details)}`);
        }
      }
    }

    if (infos.length > 0 && (this.options.verbose || this.options.fix)) {
      displaySectionTitle("Suggestions");
      for (let i = 0; i < infos.length; i++) {
        const issue = infos[i];
        console.log(`${chalk.blue(`${i+1}. ${issue.message}`)}${issue.fixable ? chalk.green(" (Réparable)") : ""}`);
        if (this.options.verbose && issue.details) {
          console.log(`   ${chalk.gray(issue.details)}`);
        }
      }
    }

    // Si aucun problème ne peut être fixé, sortir
    const fixableIssues = this.issues.filter(issue => issue.fixable);
    if (fixableIssues.length === 0) {
      return;
    }

    // Proposer de corriger les problèmes
    if (this.options.fix) {
      console.log(chalk.cyan("\nCorrection automatique des problèmes..."));

      for (const issue of this.issues) {
        if (issue.fixable && issue.fix) {
          try {
            await issue.fix();
          } catch (err) {
            this.log(chalk.red(`⚠️ Impossible de corriger le problème "${issue.message}": ${err}`));
          }
        }
      }

      this.log(chalk.green("\n✓ Corrections terminées! Vérifiez les modifications apportées."));
    } else {
      console.log(chalk.cyan(`\n${fixableIssues.length} problème(s) peuvent être corrigés automatiquement.`));
      console.log(chalk.gray(`Exécutez la commande avec l'option --fix pour les corriger.`));

      await withKeyboardInput(async () => {
        const fixAnswer = await this.prompt({
          type: 'confirm',
          name: 'fix',
          message: 'Souhaitez-vous corriger ces problèmes maintenant?',
          default: false
        });

        if (fixAnswer.fix) {
          console.log(chalk.cyan("\nCorrection des problèmes..."));

          for (const issue of this.issues) {
            if (issue.fixable && issue.fix) {
              try {
                await issue.fix();
              } catch (err) {
                this.log(chalk.red(`⚠️ Impossible de corriger le problème "${issue.message}": ${err}`));
              }
            }
          }

          this.log(chalk.green("\n✓ Corrections terminées! Vérifiez les modifications apportées."));
        }
      });
    }
  }

  /**
   * Exécution principale du générateur
   */
  async executing() {
    // Exécuter le diagnostic
    await this.diagnose();

    // Afficher les résultats
    await this.report();

    // Afficher des conseils
    if (this.issues.length > 0) {
      displaySectionTitle("Conseils généraux");

      console.log("• Utilisez Spring Initializr (https://start.spring.io/) pour créer de nouveaux projets");
      console.log("• Gardez vos dépendances à jour pour éviter les failles de sécurité");
      console.log("• Écrivez des tests pour votre code");
      console.log("• Utilisez des outils comme SonarQube pour analyser la qualité du code");
      console.log("• Consultez la documentation officielle de Spring Boot");
    }

    displaySectionEnd();
  }

  /**
   * Étape finale
   */
  async end() {
    // Dernières informations
    if (this.issues.length === 0) {
      this.log(chalk.green("\n✓ Votre projet est en bonne santé!"));
    } else {
      const unfixedIssues = this.issues.filter(issue => !issue.fixable).length;

      if (unfixedIssues > 0) {
        this.log(chalk.yellow(`\n⚠️ ${unfixedIssues} problème(s) nécessitent une attention manuelle.`));
      } else if (this.options.fix || await this.getFixedIssuesCount() === this.issues.length) {
        this.log(chalk.green("\n✓ Tous les problèmes ont été corrigés!"));
      }
    }
  }

  /**
   * Obtient le nombre de problèmes qui ont été corrigés
   */
  private async getFixedIssuesCount(): Promise<number> {
    return this.issues.filter(issue => !issue.fixable).length;
  }
}
