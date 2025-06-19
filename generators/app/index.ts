import { BaseGenerator } from "../base-generator.js";
import chalk from "chalk";
import yosay from "yosay";
import {
  getPresets,
  getBasicQuestions,
  getFrontendQuestions,
  getApiDbQuestions,
  getFeatureQuestions,
  displaySummary,
  getConfirmationQuestion
} from "./questions.js";
import {
  TemplateData,
  generateProjectStructure,
  generateReadme,
  generateMainApplication,
  generateApplicationProperties,
  generateBaseDirectories,
  generateDockerFiles,
  generateFrontend,
  generateAuth,
  generateOpenAPI,
  generateTests,
  generateMavenOrGradle
} from "./generator-methods.js";

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

    // Nouvelle option pour générer un projet avec des valeurs par défaut
    this.option("quick-start", {
      description: "Générer un projet avec des valeurs par défaut",
      type: Boolean,
      default: false,
    });

    // Option pour spécifier un preset (configuration prédéfinie)
    this.option("preset", {
      description: "Utiliser une configuration prédéfinie (basic, full, api-only)",
      type: String,
    });
  }

  initializing() {
    this.log(chalk.blue("Initialisation du générateur SFS (Spring-Fullstack-Speed)..."));
  }

  async prompting() {
    // Utiliser as any pour éviter les erreurs TypeScript lors de l'accès aux propriétés
    const opts = this.options as any;

    if (!opts["skip-welcome-message"]) {
      this.log(
        yosay(
          `Bienvenue dans le générateur ${chalk.red(
            "Spring-Fullstack-Speed"
          )}!`
        )
      );
    }

    const presets = getPresets();

    // Si l'option quick-start est activée, utiliser une configuration par défaut
    if (opts["quick-start"]) {
      this.answers = presets.quickstart;
      this.log(chalk.green("Mode quick-start activé ! Utilisation des valeurs par défaut."));
      return;
    }

    // Si un preset est spécifié, utiliser cette configuration prédéfinie
    if (opts["preset"]) {
      const presetName = opts["preset"].toLowerCase();
      if (presets[presetName]) {
        this.answers = presets[presetName];
        this.log(chalk.green(`Utilisation du preset '${presetName}'`));
        return;
      } else {
        this.log(chalk.yellow(`Preset '${presetName}' inconnu. Utilisation du mode interactif.`));
      }
    }

    // Questions de base
    const basicQuestions: any = getBasicQuestions();
    const basicAnswers = await this.prompt(basicQuestions);
    this.answers = { ...basicAnswers };

    // Questions sur le frontend
    const frontendQuestions: any = getFrontendQuestions();
    const frontendAnswers = await this.prompt(frontendQuestions);
    this.answers = { ...this.answers, ...frontendAnswers };

    // Questions sur l'API et la base de données
    const apiDbQuestions: any = getApiDbQuestions();
    const apiDbAnswers = await this.prompt(apiDbQuestions);
    this.answers = { ...this.answers, ...apiDbAnswers };

    // Questions sur les fonctionnalités supplémentaires
    const featureQuestions: any = getFeatureQuestions(this.answers);
    const featureAnswers = await this.prompt(featureQuestions);
    this.answers = { ...this.answers, ...featureAnswers };

    // Affichage du résumé des choix
    displaySummary(this.answers);

    // Demande de confirmation
    const confirmationQuestion: any = getConfirmationQuestion();
    const { confirmConfig } = await this.prompt(confirmationQuestion);

    if (!confirmConfig) {
      this.log(chalk.red("Génération annulée. Veuillez relancer la commande pour recommencer."));
      process.exit(0);
    }
  }

  configuring() {
    this.log(chalk.blue("Configuration en cours..."));
    // Code pour configurer le projet
  }

  writing() {
    const templateData: TemplateData = {
      appName: this.answers.appName || 'sfs-app',
      packageName: this.answers.packageName || 'com.example.app',
      buildTool: this.answers.buildTool || 'Maven',
      frontendFramework: this.answers.frontendFramework || 'Aucun (API seulement)',
      database: this.answers.database || 'H2',
      includeAuth: this.answers.includeAuth !== undefined ? this.answers.includeAuth : true,
      authType: this.answers.authType || 'JWT',
      additionalFeatures: this.answers.additionalFeatures || [],
      springBootVersion: this.answers.springBootVersion || '3.1.0',
      javaVersion: this.answers.javaVersion || '17',
      javaPackagePath: (this.answers.packageName || 'com.example.app').replace(/\./g, '/'),
    };

    this.log(chalk.green("Génération du projet en cours..."));

    // Génération du projet en utilisant les méthodes importées
    generateProjectStructure(this, templateData);

    // Génération des outils de build
    generateMavenOrGradle(this, templateData, templateData.buildTool.toLowerCase());

    generateReadme(this, templateData);
    generateMainApplication(this, templateData);
    generateApplicationProperties(this, templateData);
    generateBaseDirectories(this, templateData);

    // Générer la configuration Docker si demandée
    if (templateData.additionalFeatures.includes('docker')) {
      generateDockerFiles(this, templateData);
    }

    // Génération frontend si nécessaire
    if (templateData.frontendFramework !== 'Aucun (API seulement)') {
      generateFrontend(this, templateData);
    }

    // Générer l'authentification si demandée
    if (templateData.includeAuth) {
      generateAuth(this, templateData);
    }

    // Générer la documentation OpenAPI si demandée
    if (templateData.additionalFeatures.includes('openapi')) {
      generateOpenAPI(this, templateData);
    }

    // Générer les fichiers de test si demandé
    if (templateData.additionalFeatures.includes('tests')) {
      generateTests(this, templateData);
    }

    this.log(chalk.green.bold("✅ Génération du projet terminée avec succès!"));
  }

  install() {
    if (!this.options["skip-install"]) {
      this.log(chalk.green("Installation des dépendances..."));

      if (this.answers.frontendFramework !== 'Aucun (API seulement)' &&
          this.answers.frontendFramework !== 'Thymeleaf' &&
          this.answers.frontendFramework !== 'JTE') {
        // Installation des dépendances frontend
        this.log(chalk.blue("Installation des dépendances frontend..."));
        this.spawnCommandSync("npm", ["install"], { cwd: "frontend" });
      }

      // Installation des dépendances backend
      this.log(chalk.blue("Compilation du projet backend..."));
      if (this.answers.buildTool === 'Maven') {
        this.spawnCommandSync("./mvnw", ["clean", "compile"], { stdio: "ignore" });
      } else {
        this.spawnCommandSync("./gradlew", ["clean", "compileJava"], { stdio: "ignore" });
      }
    }
  }

  end() {
    this.log(chalk.green.bold("\n🎉 Félicitations! Votre projet Spring-Fullstack a été généré avec succès!"));
    this.log("\nVoici quelques commandes utiles pour démarrer:");

    if (this.answers.buildTool === 'Maven') {
      this.log(chalk.cyan("  ./mvnw spring-boot:run") + " - Démarrer l'application backend");
    } else {
      this.log(chalk.cyan("  ./gradlew bootRun") + " - Démarrer l'application backend");
    }

    if (this.answers.frontendFramework !== 'Aucun (API seulement)' &&
        this.answers.frontendFramework !== 'Thymeleaf' &&
        this.answers.frontendFramework !== 'JTE') {
      this.log(chalk.cyan("  cd frontend && npm run dev") + " - Démarrer le serveur de développement frontend");
    }

    if (this.answers.additionalFeatures.includes('docker')) {
      this.log(chalk.cyan("  docker-compose up") + " - Démarrer l'application avec Docker");
    }

    this.log(chalk.cyan("\nConsultez le README.md pour plus d'informations."));
    this.log(chalk.yellow("\nMerci d'utiliser Spring-Fullstack-Speed! 🚀"));
  }
}
