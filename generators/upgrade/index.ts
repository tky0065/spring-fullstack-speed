/**
 * Générateur pour la commande 'sfs upgrade'
 * Permet de mettre à jour un projet Spring-Fullstack existant vers une version plus récente
 * ou d'actualiser les dépendances et frameworks vers leurs dernières versions
 */

import { BaseGenerator } from "../base-generator.js";
import chalk from "chalk";
import path from "path";
import fs from "fs";
import { execSync, spawn } from "child_process";
import { createSpinner, displaySectionTitle, displaySectionEnd } from "../../utils/cli-ui.js";
import boxen from "boxen";
import semver from "semver";

// Interface pour les options du générateur
interface UpgradeOptions {
  dependencies?: boolean;
  springBoot?: boolean;
  frontend?: boolean;
  force?: boolean;
  skipConfirm?: boolean;
  verbose?: boolean;
}

// Version actuellement supportées
const SUPPORTED_VERSIONS = {
  springBoot: ["2.7.0", "3.0.0", "3.1.0", "3.2.0"],
  java: ["11", "17", "21"],
  node: ["16.0.0", "18.0.0", "20.0.0"],
  angular: ["15.0.0", "16.0.0", "17.0.0"],
  react: ["17.0.0", "18.0.0", "19.0.0"],
  vue: ["3.0.0", "3.3.0", "3.4.0"]
};

// Types d'évolutions possibles
const UpgradeType = {
  MINOR: "minor",
  MAJOR: "major",
  PATCH: "patch",
  DEPENDENCIES: "dependencies",
  SECURITY: "security"
} as const;

/**
 * Générateur pour mettre à jour les projets Spring-Fullstack
 */
export default class UpgradeGenerator extends BaseGenerator {
  // Déclaration des options avec les types corrects
  declare options: any;

  // Propriétés internes
  private projectType: 'maven' | 'gradle' | 'unknown' = 'unknown';
  private hasFrontend: boolean = false;
  private frontendType: string | null = null;
  private projectDetails: any = {
    springBootVersion: "",
    javaVersion: "",
    nodeVersion: "",
    frontendVersion: "",
    dependencies: []
  };
  private upgradePlan: any[] = [];

  constructor(args: string[], options: any) {
    super(args, options);

    // Options pour la ligne de commande
    this.option("dependencies", {
      type: Boolean,
      description: "Mettre à jour uniquement les dépendances",
      default: false,
      alias: "d"
    });

    this.option("spring-boot", {
      type: Boolean,
      description: "Mettre à jour uniquement Spring Boot",
      default: false,
      alias: "s"
    });

    this.option("frontend", {
      type: Boolean,
      description: "Mettre à jour uniquement le frontend",
      default: false,
      alias: "f"
    });

    this.option("force", {
      type: Boolean,
      description: "Forcer la mise à jour même si des incompatibilités sont détectées",
      default: false
    });

    this.option("skip-confirm", {
      type: Boolean,
      description: "Ignorer les confirmations",
      default: false,
      alias: "y"
    });

    this.option("verbose", {
      type: Boolean,
      description: "Afficher des informations détaillées",
      default: false,
      alias: "v"
    });
  }

  /**
   * Initialisation du générateur
   */
  async initializing() {
    displaySectionTitle("Mise à jour de projet Spring-Fullstack");

    // Vérifier qu'on est dans un projet existant
    if (!this.isSpringFullstackProject()) {
      this.log(chalk.red("❌ Ce répertoire ne semble pas contenir un projet Spring-Fullstack."));
      this.log(chalk.yellow("Assurez-vous d'exécuter cette commande à la racine d'un projet généré par Spring-Fullstack."));
      process.exit(1);
    }

    // Analyser le projet actuel
    await this.detectProjectType();
    await this.analyzeProject();

    // Afficher les informations du projet
    this.displayProjectInfo();
  }

  /**
   * Vérifier si c'est un projet Spring-Fullstack
   */
  isSpringFullstackProject() {
    // Vérifier des marqueurs qui indiquent un projet Spring-Fullstack
    const hasMavenOrGradle = fs.existsSync(path.join(process.cwd(), "pom.xml")) ||
                            fs.existsSync(path.join(process.cwd(), "build.gradle")) ||
                            fs.existsSync(path.join(process.cwd(), "build.gradle.kts"));

    const hasSpringBootApp = fs.existsSync(path.join(process.cwd(), "src", "main", "java")) &&
                             fs.existsSync(path.join(process.cwd(), "src", "main", "resources"));

    return hasMavenOrGradle && hasSpringBootApp;
  }

  /**
   * Détecte le type de projet et la présence d'un frontend
   */
  async detectProjectType() {
    // Déterminer le type de build system
    if (fs.existsSync(path.join(process.cwd(), "pom.xml"))) {
      this.projectType = "maven";
    } else if (fs.existsSync(path.join(process.cwd(), "build.gradle")) ||
               fs.existsSync(path.join(process.cwd(), "build.gradle.kts"))) {
      this.projectType = "gradle";
    } else {
      this.projectType = "unknown";
    }

    // Vérifier la présence d'un frontend
    if (fs.existsSync(path.join(process.cwd(), "frontend"))) {
      this.hasFrontend = true;

      // Déterminer le type de frontend
      if (fs.existsSync(path.join(process.cwd(), "frontend", "angular.json"))) {
        this.frontendType = "angular";
      }
      else if (fs.existsSync(path.join(process.cwd(), "frontend", "package.json"))) {
        const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), "frontend", "package.json"), "utf8"));
        if (packageJson.dependencies?.react) {
          this.frontendType = "react";
        }
        else if (packageJson.dependencies?.vue) {
          this.frontendType = "vue";
        }
      }
    }
  }

  /**
   * Analyser le projet pour déterminer les versions actuelles
   */
  async analyzeProject() {
    const spinner = createSpinner({
      text: "Analyse du projet en cours...",
      color: "info"
    });

    try {
      // Analyser la version de Spring Boot
      if (this.projectType === "maven") {
        await this.analyzeMavenProject();
      } else if (this.projectType === "gradle") {
        await this.analyzeGradleProject();
      }

      // Analyser le frontend s'il existe
      if (this.hasFrontend) {
        await this.analyzeFrontendProject();
      }

      spinner.succeed("Analyse du projet terminée");
    } catch (error: any) {
      spinner.fail("Erreur lors de l'analyse du projet");
      this.log(chalk.red(`Erreur: ${error.message}`));
    }
  }

  /**
   * Analyser un projet Maven
   */
  async analyzeMavenProject() {
    const pomPath = path.join(process.cwd(), "pom.xml");
    const pomContent = fs.readFileSync(pomPath, "utf8");

    // Extraire la version de Spring Boot
    const springBootVersionMatch = pomContent.match(/<spring-boot\.version>([^<]+)<\/spring-boot\.version>/) ||
                                  pomContent.match(/<parent>[\s\S]*?<artifactId>spring-boot-starter-parent<\/artifactId>[\s\S]*?<version>([^<]+)<\/version>/);

    if (springBootVersionMatch && springBootVersionMatch[1]) {
      this.projectDetails.springBootVersion = springBootVersionMatch[1];
    }

    // Extraire la version de Java
    const javaVersionMatch = pomContent.match(/<java\.version>([^<]+)<\/java\.version>/) ||
                             pomContent.match(/<maven\.compiler\.source>([^<]+)<\/maven\.compiler\.source>/);

    if (javaVersionMatch && javaVersionMatch[1]) {
      this.projectDetails.javaVersion = javaVersionMatch[1];
    }

    // Analyser les dépendances Maven
    const dependenciesMatches = pomContent.matchAll(/<dependency>[\s\S]*?<groupId>([^<]+)<\/groupId>[\s\S]*?<artifactId>([^<]+)<\/artifactId>[\s\S]*?<version>([^<]+)<\/version>[\s\S]*?<\/dependency>/g);

    for (const match of dependenciesMatches) {
      this.projectDetails.dependencies.push({
        groupId: match[1],
        artifactId: match[2],
        version: match[3]
      });
    }
  }

  /**
   * Analyser un projet Gradle
   */
  async analyzeGradleProject() {
    const gradlePath = fs.existsSync(path.join(process.cwd(), "build.gradle.kts"))
      ? path.join(process.cwd(), "build.gradle.kts")
      : path.join(process.cwd(), "build.gradle");

    const gradleContent = fs.readFileSync(gradlePath, "utf8");

    // Extraire la version Spring Boot
    const springBootVersionMatch = gradleContent.match(/id\s*\(['"]org\.springframework\.boot['"]\)\s*version\s*['"]([^'"]+)['"]/);
    if (springBootVersionMatch && springBootVersionMatch[1]) {
      this.projectDetails.springBootVersion = springBootVersionMatch[1];
    }

    // Extraire la version Java
    const javaVersionMatch = gradleContent.match(/sourceCompatibility\s*=\s*['"]?([^'"\s]+)['"]?/);
    if (javaVersionMatch && javaVersionMatch[1]) {
      this.projectDetails.javaVersion = javaVersionMatch[1].replace("JavaVersion.VERSION_", "").replace("1.", "");
    }

    // Analyser les dépendances est plus complexe pour Gradle à cause des différents formats
    // (Kotlin DSL et Groovy), on se concentrera sur les versions principales
  }

  /**
   * Analyser le frontend s'il existe
   */
  async analyzeFrontendProject() {
    const packageJsonPath = path.join(process.cwd(), "frontend", "package.json");
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

      // Extraire la version de Node (à partir du engines si disponible)
      if (packageJson.engines && packageJson.engines.node) {
        this.projectDetails.nodeVersion = packageJson.engines.node.replace(">=", "").replace("^", "");
      } else {
        // Sinon utiliser la version du système
        try {
          this.projectDetails.nodeVersion = execSync("node -v").toString().trim().replace("v", "");
        } catch (e) {
          this.projectDetails.nodeVersion = "unknown";
        }
      }

      // Extraire la version du framework frontend
      if (this.frontendType === "angular") {
        this.projectDetails.frontendVersion = packageJson.dependencies?.["@angular/core"]?.replace("^", "");
      }
      else if (this.frontendType === "react") {
        this.projectDetails.frontendVersion = packageJson.dependencies?.["react"]?.replace("^", "");
      }
      else if (this.frontendType === "vue") {
        this.projectDetails.frontendVersion = packageJson.dependencies?.["vue"]?.replace("^", "");
      }
    }
  }

  /**
   * Afficher les informations du projet
   */
  displayProjectInfo() {
    this.log(chalk.blue("\n📊 Informations sur le projet actuel:"));
    this.log(chalk.gray(`Type de projet: ${this.projectType}`));

    if (this.projectDetails.springBootVersion) {
      this.log(chalk.gray(`Version de Spring Boot: ${this.projectDetails.springBootVersion}`));
    }

    if (this.projectDetails.javaVersion) {
      this.log(chalk.gray(`Version de Java: ${this.projectDetails.javaVersion}`));
    }

    if (this.hasFrontend) {
      this.log(chalk.gray(`Type de frontend: ${this.frontendType}`));
      if (this.projectDetails.frontendVersion) {
        this.log(chalk.gray(`Version de ${this.frontendType}: ${this.projectDetails.frontendVersion}`));
      }
      if (this.projectDetails.nodeVersion) {
        this.log(chalk.gray(`Version de Node.js: ${this.projectDetails.nodeVersion}`));
      }
    }
  }

  /**
   * Préparation du plan de mise à jour
   */
  async prompting() {
    // Créer le plan de mise à jour
    await this.createUpgradePlan();

    if (this.upgradePlan.length === 0) {
      this.log(chalk.green("\n✅ Votre projet est déjà à jour!"));
      return;
    }

    // Afficher le plan de mise à jour
    this.displayUpgradePlan();

    // Confirmer l'upgrade si l'option skip-confirm n'est pas activée
    if (!this.options.skipConfirm) {
      const { confirmUpgrade } = await this.prompt({
        type: 'confirm',
        name: 'confirmUpgrade',
        message: 'Voulez-vous procéder à la mise à jour?',
        default: true
      });

      if (!confirmUpgrade) {
        this.log(chalk.yellow("\n💡 Mise à jour annulée."));
        process.exit(0);
      }
    }
  }

  /**
   * Créer le plan de mise à jour en fonction des versions actuelles
   */
  async createUpgradePlan() {
    // Option pour ne mettre à jour que les dépendances
    if (this.options.dependencies) {
      this.upgradePlan.push({
        type: UpgradeType.DEPENDENCIES,
        component: "dépendances",
        from: "",
        to: "dernières versions",
        breaking: false,
        description: "Mettre à jour toutes les dépendances vers leurs dernières versions compatibles"
      });
      return;
    }

    // Vérifier les mises à jour pour Spring Boot
    if (!this.options.frontend && this.projectDetails.springBootVersion) {
      const currentVersion = this.projectDetails.springBootVersion;
      const latestMinor = this.getLatestMinorVersion(currentVersion, SUPPORTED_VERSIONS.springBoot);
      const latestMajor = this.getLatestMajorVersion(currentVersion, SUPPORTED_VERSIONS.springBoot);

      if (latestMinor && latestMinor !== currentVersion) {
        this.upgradePlan.push({
          type: UpgradeType.MINOR,
          component: "Spring Boot",
          from: currentVersion,
          to: latestMinor,
          breaking: false,
          description: "Mise à jour mineure de Spring Boot (fonctionnalités nouvelles, compatibilité préservée)"
        });
      }

      if (latestMajor && latestMajor !== currentVersion && latestMajor !== latestMinor) {
        this.upgradePlan.push({
          type: UpgradeType.MAJOR,
          component: "Spring Boot",
          from: currentVersion,
          to: latestMajor,
          breaking: true,
          description: "Mise à jour majeure de Spring Boot (changements importants, peut nécessiter des adaptations)"
        });
      }
    }

    // Vérifier les mises à jour pour le frontend
    if (!this.options.springBoot && this.hasFrontend && this.projectDetails.frontendVersion) {
      const versions = SUPPORTED_VERSIONS[this.frontendType as keyof typeof SUPPORTED_VERSIONS];
      if (versions) {
        const currentVersion = this.projectDetails.frontendVersion;
        const latestMinor = this.getLatestMinorVersion(currentVersion, versions);
        const latestMajor = this.getLatestMajorVersion(currentVersion, versions);

        if (latestMinor && latestMinor !== currentVersion) {
          this.upgradePlan.push({
            type: UpgradeType.MINOR,
            component: this.frontendType!,
            from: currentVersion,
            to: latestMinor,
            breaking: false,
            description: `Mise à jour mineure de ${this.frontendType} (fonctionnalités nouvelles, compatibilité préservée)`
          });
        }

        if (latestMajor && latestMajor !== currentVersion && latestMajor !== latestMinor) {
          this.upgradePlan.push({
            type: UpgradeType.MAJOR,
            component: this.frontendType!,
            from: currentVersion,
            to: latestMajor,
            breaking: true,
            description: `Mise à jour majeure de ${this.frontendType} (changements importants, peut nécessiter des adaptations)`
          });
        }
      }
    }

    // Ajouter la mise à jour des dépendances de sécurité
    this.upgradePlan.push({
      type: UpgradeType.SECURITY,
      component: "dépendances de sécurité",
      from: "",
      to: "patches de sécurité",
      breaking: false,
      description: "Mettre à jour les dépendances avec des correctifs de sécurité"
    });
  }

  /**
   * Afficher le plan de mise à jour
   */
  displayUpgradePlan() {
    this.log(chalk.blue("\n📝 Plan de mise à jour:"));

    this.upgradePlan.forEach((upgrade, index) => {
      const prefix = `${index + 1}. `;
      const upgradeType = upgrade.type === UpgradeType.MAJOR
        ? chalk.red("[MAJEURE]")
        : upgrade.type === UpgradeType.MINOR
          ? chalk.yellow("[MINEURE]")
          : chalk.green("[PATCH]");

      const versionInfo = upgrade.from && upgrade.to
        ? `${upgrade.from} → ${chalk.green(upgrade.to)}`
        : "";

      const message = [
        prefix,
        upgradeType,
        ` ${upgrade.component} `,
        versionInfo,
        `: ${upgrade.description}`
      ].join("");

      this.log(message);

      // Afficher des avertissements pour les mises à jour majeures
      if (upgrade.breaking && !this.options.force) {
        this.log(chalk.yellow(`   ⚠️  Cette mise à jour peut contenir des changements incompatibles. Utilisez --force pour l'appliquer.`));
      }
    });
  }

  /**
   * Executer les mises à jour
   */
  async writing() {
    if (this.upgradePlan.length === 0) {
      return;
    }

    this.log(chalk.blue("\n🔄 Exécution des mises à jour..."));

    // Filtrer les mises à jour en fonction des options et des confirmations
    const upgradesToApply = this.upgradePlan.filter(upgrade => {
      // Ne pas appliquer les mises à jour majeures sans --force
      if (upgrade.breaking && !this.options.force) {
        return false;
      }
      return true;
    });

    // Sauvegarder le projet avant les modifications
    await this.backupProject();

    // Appliquer les mises à jour
    for (const upgrade of upgradesToApply) {
      await this.applyUpgrade(upgrade);
    }
  }

  /**
   * Créer une sauvegarde du projet
   */
  async backupProject() {
    const spinner = createSpinner({
      text: "Création d'une sauvegarde du projet...",
      color: "info"
    });

    try {
      // Créer un dossier de backup s'il n'existe pas
      const backupDir = path.join(process.cwd(), ".sfs-backup");
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
      }

      // Créer un fichier zip de sauvegarde avec la date
      const date = new Date().toISOString().replace(/[:.]/g, "-");
      const backupName = `backup-${date}`;

      // Exclure les dossiers node_modules, target, build et .git
      const excludes = ["--exclude=node_modules", "--exclude=*/node_modules",
                        "--exclude=target", "--exclude=*/target",
                        "--exclude=build", "--exclude=*/build",
                        "--exclude=.git", "--exclude=.sfs-backup"];

      // Créer l'archive
      execSync(`tar -czf "${path.join(backupDir, backupName)}.tar.gz" ${excludes.join(" ")} .`, {
        cwd: process.cwd(),
        stdio: this.options.verbose ? 'inherit' : 'pipe'
      });

      spinner.succeed(`Sauvegarde créée dans .sfs-backup/${backupName}.tar.gz`);
    } catch (error: any) {
      spinner.fail("Erreur lors de la création de la sauvegarde");
      this.log(chalk.yellow(`⚠️ Impossible de créer une sauvegarde: ${error.message}`));
      this.log(chalk.yellow(`⚠️ Continuez à vos propres risques ou annulez (Ctrl+C)`));

      // Demander confirmation pour continuer sans backup
      if (!this.options.skipConfirm) {
        const { continueWithoutBackup } = await this.prompt({
          type: 'confirm',
          name: 'continueWithoutBackup',
          message: 'Voulez-vous continuer sans sauvegarde?',
          default: false
        });

        if (!continueWithoutBackup) {
          process.exit(1);
        }
      }
    }
  }

  /**
   * Appliquer une mise à jour spécifique
   */
  async applyUpgrade(upgrade: any) {
    const spinner = createSpinner({
      text: `Mise à jour de ${upgrade.component}...`,
      color: "info"
    });

    try {
      switch (upgrade.type) {
        case UpgradeType.DEPENDENCIES:
          await this.updateDependencies(spinner);
          break;
        case UpgradeType.SECURITY:
          await this.updateSecurityDependencies(spinner);
          break;
        case UpgradeType.MINOR:
        case UpgradeType.MAJOR:
          if (upgrade.component === "Spring Boot") {
            await this.updateSpringBoot(upgrade.to, spinner);
          } else if (["angular", "react", "vue"].includes(upgrade.component)) {
            await this.updateFrontend(upgrade.component, upgrade.to, spinner);
          }
          break;
      }
    } catch (error: any) {
      spinner.fail(`Erreur lors de la mise à jour de ${upgrade.component}`);
      this.log(chalk.red(`❌ Erreur: ${error.message}`));
    }
  }

  /**
   * Mettre à jour toutes les dépendances
   */
  async updateDependencies(spinner: any) {
    // Mettre à jour les dépendances backend
    if (this.projectType === "maven") {
      spinner.text = "Mise à jour des dépendances Maven...";

      try {
        execSync("mvn versions:use-latest-versions", {
          cwd: process.cwd(),
          stdio: this.options.verbose ? 'inherit' : 'pipe'
        });

        spinner.succeed("Dépendances Maven mises à jour avec succès");
      } catch (error) {
        spinner.fail("Erreur lors de la mise à jour des dépendances Maven");
        throw error;
      }
    } else if (this.projectType === "gradle") {
      spinner.text = "Mise à jour des dépendances Gradle...";

      try {
        const gradleCommand = fs.existsSync(path.join(process.cwd(), "gradlew")) ? "./gradlew" : "gradle";
        execSync(`${gradleCommand} dependencyUpdates`, {
          cwd: process.cwd(),
          stdio: this.options.verbose ? 'inherit' : 'pipe'
        });

        spinner.succeed("Dépendances Gradle analysées - mise à jour manuelle requise");
      } catch (error) {
        spinner.fail("Erreur lors de l'analyse des dépendances Gradle");
        throw error;
      }
    }

    // Mettre à jour les dépendances frontend si présentes
    if (this.hasFrontend) {
      spinner.text = "Mise à jour des dépendances frontend...";

      try {
        // Utiliser npm-check-updates pour mettre à jour le package.json
        const hasYarn = fs.existsSync(path.join(process.cwd(), "frontend", "yarn.lock"));
        const packageManager = hasYarn ? "yarn" : "npm";

        // Installer npm-check-updates si nécessaire
        execSync(`${packageManager} install -g npm-check-updates`, {
          stdio: this.options.verbose ? 'inherit' : 'pipe'
        });

        // Mettre à jour package.json
        execSync("npx ncu -u", {
          cwd: path.join(process.cwd(), "frontend"),
          stdio: this.options.verbose ? 'inherit' : 'pipe'
        });

        // Installer les nouvelles dépendances
        execSync(hasYarn ? "yarn install" : "npm install", {
          cwd: path.join(process.cwd(), "frontend"),
          stdio: this.options.verbose ? 'inherit' : 'pipe'
        });

        spinner.succeed("Dépendances frontend mises à jour avec succès");
      } catch (error) {
        spinner.fail("Erreur lors de la mise à jour des dépendances frontend");
        throw error;
      }
    }
  }

  /**
   * Mettre à jour les dépendances de sécurité
   */
  async updateSecurityDependencies(spinner: any) {
    // Mettre à jour les dépendances de sécurité du backend
    if (this.projectType === "maven") {
      spinner.text = "Analyse des vulnérabilités Maven...";

      try {
        execSync("mvn dependency-check:check", {
          cwd: process.cwd(),
          stdio: this.options.verbose ? 'inherit' : 'pipe'
        });

        spinner.succeed("Analyse des vulnérabilités Maven terminée");
      } catch (error) {
        spinner.warn("L'analyse des vulnérabilités a détecté des problèmes potentiels");
      }
    }

    // Mettre à jour les dépendances de sécurité du frontend
    if (this.hasFrontend) {
      spinner.text = "Analyse des vulnérabilités npm...";

      try {
        const hasYarn = fs.existsSync(path.join(process.cwd(), "frontend", "yarn.lock"));

        if (hasYarn) {
          execSync("yarn audit", {
            cwd: path.join(process.cwd(), "frontend"),
            stdio: this.options.verbose ? 'inherit' : 'pipe'
          });

          // Tenter de corriger automatiquement
          execSync("yarn audit fix", {
            cwd: path.join(process.cwd(), "frontend"),
            stdio: this.options.verbose ? 'inherit' : 'pipe'
          });
        } else {
          execSync("npm audit", {
            cwd: path.join(process.cwd(), "frontend"),
            stdio: this.options.verbose ? 'inherit' : 'pipe'
          });

          // Tenter de corriger automatiquement
          execSync("npm audit fix", {
            cwd: path.join(process.cwd(), "frontend"),
            stdio: this.options.verbose ? 'inherit' : 'pipe'
          });
        }

        spinner.succeed("Dépendances de sécurité frontend corrigées si possible");
      } catch (error) {
        spinner.warn("Des problèmes de sécurité persistent, correction manuelle requise");
      }
    }
  }

  /**
   * Mettre à jour Spring Boot vers une nouvelle version
   */
  async updateSpringBoot(targetVersion: string, spinner: any) {
    spinner.text = `Mise à jour de Spring Boot vers ${targetVersion}...`;

    if (this.projectType === "maven") {
      // Mettre à jour la version de Spring Boot dans le pom.xml
      const pomPath = path.join(process.cwd(), "pom.xml");
      let pomContent = fs.readFileSync(pomPath, "utf8");

      // Mettre à jour la version dans le parent
      pomContent = pomContent.replace(
        /<parent>[\s\S]*?<artifactId>spring-boot-starter-parent<\/artifactId>[\s\S]*?<version>[^<]+<\/version>/g,
        (match) => match.replace(/<version>[^<]+<\/version>/, `<version>${targetVersion}</version>`)
      );

      // Mettre à jour la version dans les propriétés
      pomContent = pomContent.replace(
        /<spring-boot\.version>[^<]+<\/spring-boot\.version>/g,
        `<spring-boot.version>${targetVersion}</spring-boot.version>`
      );

      fs.writeFileSync(pomPath, pomContent);

      // Exécuter un build pour vérifier la compatibilité
      try {
        spinner.text = "Vérification de la compatibilité...";
        execSync("mvn clean compile", {
          cwd: process.cwd(),
          stdio: this.options.verbose ? 'inherit' : 'pipe'
        });

        spinner.succeed(`Spring Boot mis à jour avec succès vers ${targetVersion}`);
      } catch (error) {
        spinner.fail("Des erreurs de compatibilité ont été détectées");
        throw new Error("La mise à jour a échoué en raison de problèmes de compatibilité. Restaurez la sauvegarde si nécessaire.");
      }
    }
    else if (this.projectType === "gradle") {
      // Mettre à jour la version dans le fichier build.gradle ou build.gradle.kts
      const gradlePath = fs.existsSync(path.join(process.cwd(), "build.gradle.kts"))
        ? path.join(process.cwd(), "build.gradle.kts")
        : path.join(process.cwd(), "build.gradle");

      let gradleContent = fs.readFileSync(gradlePath, "utf8");

      // Mettre à jour la version de Spring Boot
      if (gradlePath.endsWith(".kts")) {
        // Kotlin DSL
        gradleContent = gradleContent.replace(
          /id\("org\.springframework\.boot"\)\s+version\s+["'][^"']+["']/g,
          `id("org.springframework.boot") version "${targetVersion}"`
        );
      } else {
        // Groovy DSL
        gradleContent = gradleContent.replace(
          /id\s+['"]org\.springframework\.boot['"]\s+version\s+['"][^'"]+['"]/g,
          `id 'org.springframework.boot' version '${targetVersion}'`
        );
      }

      fs.writeFileSync(gradlePath, gradleContent);

      // Vérifier la compatibilité
      try {
        spinner.text = "Vérification de la compatibilité...";
        const gradleCommand = fs.existsSync(path.join(process.cwd(), "gradlew")) ? "./gradlew" : "gradle";

        execSync(`${gradleCommand} compileJava`, {
          cwd: process.cwd(),
          stdio: this.options.verbose ? 'inherit' : 'pipe'
        });

        spinner.succeed(`Spring Boot mis à jour avec succès vers ${targetVersion}`);
      } catch (error) {
        spinner.fail("Des erreurs de compatibilité ont été détectées");
        throw new Error("La mise à jour a échoué en raison de problèmes de compatibilité. Restaurez la sauvegarde si nécessaire.");
      }
    }
  }

  /**
   * Mettre à jour le framework frontend
   */
  async updateFrontend(framework: string, targetVersion: string, spinner: any) {
    spinner.text = `Mise à jour de ${framework} vers ${targetVersion}...`;

    const frontendDir = path.join(process.cwd(), "frontend");

    if (framework === "angular") {
      try {
        // Installer @angular/cli globalement
        execSync("npm install -g @angular/cli", {
          stdio: this.options.verbose ? 'inherit' : 'pipe'
        });

        // Mettre à jour Angular
        execSync(`ng update @angular/core@${targetVersion} @angular/cli@${targetVersion} --allow-dirty --force`, {
          cwd: frontendDir,
          stdio: this.options.verbose ? 'inherit' : 'pipe'
        });

        spinner.succeed(`Angular mis à jour avec succès vers ${targetVersion}`);
      } catch (error) {
        spinner.fail(`Erreur lors de la mise à jour d'Angular`);
        throw error;
      }
    }
    else if (framework === "react" || framework === "vue") {
      try {
        // Pour React et Vue, mettre à jour les dépendances dans package.json
        const packageJsonPath = path.join(frontendDir, "package.json");
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

        if (framework === "react") {
          packageJson.dependencies.react = `^${targetVersion}`;
          packageJson.dependencies["react-dom"] = `^${targetVersion}`;
        } else {
          packageJson.dependencies.vue = `^${targetVersion}`;
        }

        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

        // Installer les nouvelles dépendances
        const hasYarn = fs.existsSync(path.join(frontendDir, "yarn.lock"));
        execSync(hasYarn ? "yarn install" : "npm install", {
          cwd: frontendDir,
          stdio: this.options.verbose ? 'inherit' : 'pipe'
        });

        spinner.succeed(`${framework.charAt(0).toUpperCase() + framework.slice(1)} mis à jour avec succès vers ${targetVersion}`);
      } catch (error) {
        spinner.fail(`Erreur lors de la mise à jour de ${framework}`);
        throw error;
      }
    }
  }

  /**
   * Installation des dépendances après les mises à jour
   */
  async install() {
    // Vérifier s'il y a eu des mises à jour
    if (this.upgradePlan.length === 0) {
      return;
    }

    this.log(chalk.blue("\n📦 Installation des dépendances après la mise à jour..."));

    // Construire le backend pour vérifier que tout est ok
    const spinner = createSpinner({
      text: "Construction du projet mis à jour...",
      color: "info"
    });

    try {
      if (this.projectType === "maven") {
        execSync("mvn clean install -DskipTests", {
          cwd: process.cwd(),
          stdio: this.options.verbose ? 'inherit' : 'pipe'
        });
      } else if (this.projectType === "gradle") {
        const gradleCommand = fs.existsSync(path.join(process.cwd(), "gradlew")) ? "./gradlew" : "gradle";
        execSync(`${gradleCommand} clean build -x test`, {
          cwd: process.cwd(),
          stdio: this.options.verbose ? 'inherit' : 'pipe'
        });
      }

      spinner.succeed("Projet construit avec succès après la mise à jour");
    } catch (error: any) {
      spinner.fail("Erreur lors de la construction du projet");
      this.log(chalk.red(`❌ Le projet ne compile pas après la mise à jour: ${error.message}`));
      this.log(chalk.yellow("⚠️ Vous devrez peut-être corriger manuellement les erreurs de compatibilité."));
    }
  }

  /**
   * Terminer la mise à jour
   */
  end() {
    displaySectionEnd();

    if (this.upgradePlan.length === 0) {
      this.log(chalk.green("✅ Félicitations! Votre projet est déjà à jour."));
      return;
    }

    this.log(chalk.green("🎉 Mise à jour terminée!"));

    // Afficher un récapitulatif des mises à jour effectuées
    const upgradeSummary = this.upgradePlan
      .map(upgrade => {
        const icon = upgrade.breaking ? "⚠️" : "✅";
        return `${icon} ${upgrade.component}: ${upgrade.from || ""} → ${upgrade.to}`;
      })
      .join("\n");

    const summaryBox = boxen(
      `${chalk.bold('📋 Récapitulatif des mises à jour')}\n\n${upgradeSummary}`,
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green',
        title: 'Spring-Fullstack Upgrade'
      }
    );

    this.log(summaryBox);

    // Conseils post-mise à jour
    this.log(chalk.bold("\n📝 Conseils après la mise à jour:"));
    this.log(chalk.yellow("1. Exécutez les tests pour vérifier que tout fonctionne correctement"));
    this.log(chalk.yellow("2. Consultez les notes de migration pour les changements majeurs"));
    this.log(chalk.yellow("3. Vérifiez la compatibilité avec vos bibliothèques tierces"));

    // Si une sauvegarde a été créée
    const backupDir = path.join(process.cwd(), ".sfs-backup");
    if (fs.existsSync(backupDir)) {
      this.log(chalk.yellow(`\n💾 Une sauvegarde de votre projet a été créée dans ${backupDir}`));
      this.log(chalk.yellow("Pour restaurer la sauvegarde si nécessaire, décompressez l'archive tar.gz"));
    }
  }

  // Méthodes utilitaires

  /**
   * Récupère la dernière version mineure compatible
   */
  getLatestMinorVersion(currentVersion: string, availableVersions: string[]): string | null {
    if (!semver.valid(currentVersion)) {
      return null;
    }

    const currentMajor = semver.major(currentVersion);

    // Filtrer les versions avec le même majeur
    const sameMinorVersions = availableVersions
      .filter(version => semver.valid(version) && semver.major(version) === currentMajor)
      .sort((a, b) => semver.compare(b, a)); // Trier en ordre décroissant

    return sameMinorVersions.length > 0 ? sameMinorVersions[0] : null;
  }

  /**
   * Récupère la dernière version majeure disponible
   */
  getLatestMajorVersion(currentVersion: string, availableVersions: string[]): string | null {
    if (!semver.valid(currentVersion)) {
      return null;
    }

    const currentMajor = semver.major(currentVersion);

    // Filtrer les versions avec un majeur plus grand
    const higherMajorVersions = availableVersions
      .filter(version => semver.valid(version) && semver.major(version) > currentMajor)
      .sort((a, b) => semver.compare(b, a)); // Trier en ordre décroissant

    return higherMajorVersions.length > 0 ? higherMajorVersions[0] : null;
  }
}
