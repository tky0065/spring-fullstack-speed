/**
 * Générateur pour la commande 'sfs test'
 * Permet d'exécuter les tests d'un projet Spring Boot et d'afficher les résultats
 */

import { BaseGenerator } from "../base-generator.js";
import chalk from "chalk";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { createSpinner, displaySectionTitle, displaySectionEnd, success, error, info } from "../../utils/cli-ui.js";

/**
 * Interface pour les options du générateur
 */
interface TestOptions {
  pattern?: string;
  skipUnitTests?: boolean;
  skipIntegrationTests?: boolean;
  coverage?: boolean;
  verbose?: boolean;
}

/**
 * Générateur pour exécuter et gérer les tests du projet
 */
export default class TestGenerator extends BaseGenerator {
  // Déclaration des options avec types
  declare options: any;

  // Propriétés internes
  private projectType: 'maven' | 'gradle' | 'unknown' = 'unknown';
  private testResults: any = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    duration: 0
  };

  constructor(args: string[], options: any) {
    super(args, options);

    // Options pour la ligne de commande
    this.option("pattern", {
      type: String,
      description: "Pattern pour sélectionner les tests à exécuter (ex: com.example.*Test)",
      default: ""
    });

    this.option("skip-unit", {
      type: Boolean,
      description: "Ignorer les tests unitaires",
      default: false
    });

    this.option("skip-integration", {
      type: Boolean,
      description: "Ignorer les tests d'intégration",
      default: false
    });

    this.option("coverage", {
      type: Boolean,
      description: "Générer un rapport de couverture de code",
      default: false
    });

    this.option("verbose", {
      type: Boolean,
      description: "Afficher plus de détails",
      default: false
    });
  }

  /**
   * Initialisation : détection du type de projet
   */
  async initializing() {
    displaySectionTitle("Exécution des Tests Spring Boot");

    // Vérifier le type de projet (Maven ou Gradle)
    if (fs.existsSync(path.join(process.cwd(), "pom.xml"))) {
      this.projectType = "maven";
      this.log(chalk.gray("Projet Maven détecté"));
    } else if (
      fs.existsSync(path.join(process.cwd(), "build.gradle")) ||
      fs.existsSync(path.join(process.cwd(), "build.gradle.kts"))
    ) {
      this.projectType = "gradle";
      this.log(chalk.gray("Projet Gradle détecté"));
    } else {
      this.log(chalk.red("Aucun projet Maven ou Gradle n'a été détecté dans ce répertoire."));
      process.exit(1);
    }

    // Afficher les options sélectionnées
    this.log(chalk.gray("Options:"));
    if (this.options.pattern) {
      this.log(chalk.gray(`- Pattern de test: ${this.options.pattern}`));
    }
    if (this.options.skipUnit) {
      this.log(chalk.gray(`- Tests unitaires ignorés`));
    }
    if (this.options.skipIntegration) {
      this.log(chalk.gray(`- Tests d'intégration ignorés`));
    }
    if (this.options.coverage) {
      this.log(chalk.gray(`- Génération du rapport de couverture activée`));
    }
  }

  /**
   * Exécution des tests
   */
  async prompting() {
    if (this.options.skipUnit && this.options.skipIntegration) {
      this.log(chalk.yellow("⚠️ Tous les tests sont ignorés. Aucun test ne sera exécuté."));
      return;
    }

    const spinner = createSpinner({
      text: "Exécution des tests...",
      color: "primary"
    });

    spinner.start();

    try {
      if (this.projectType === "maven") {
        await this.runMavenTests();
      } else if (this.projectType === "gradle") {
        await this.runGradleTests();
      }

      spinner.succeed(`Tests terminés: ${this.testResults.passed} réussis, ${this.testResults.failed} échoués, ${this.testResults.skipped} ignorés`);
    } catch (err: any) {
      spinner.fail(`Erreur lors de l'exécution des tests: ${err.message}`);
      if (this.options.verbose) {
        console.error(err);
      }
    }
  }

  /**
   * Exécute les tests avec Maven
   */
  private async runMavenTests(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Construire la commande Maven
      const mvnCmd = global.process.platform === "win32" ? "mvn.cmd" : "mvn";

      // Construire les arguments Maven
      const args = ["test"];

      // Ajouter les options en fonction des paramètres
      if (this.options.coverage) {
        args.push("jacoco:report");
      }

      // Construire les options de test
      const testOptions:any = [];
      if (this.options.skipUnit) {
        testOptions.push("-Dskip.unit.tests=true");
      }
      if (this.options.skipIntegration) {
        testOptions.push("-Dskip.integration.tests=true");
      }
      if (this.options.pattern) {
        testOptions.push(`-Dtest=${this.options.pattern}`);
      }

      // Ajouter les options à la commande
      args.push(...testOptions);

      // Ajouter des options de sortie pour faciliter l'analyse des résultats
      args.push("-Dsurefire.useFile=false");

      // Mode détaillé si demandé
      if (this.options.verbose) {
        this.log(chalk.dim(`$ ${mvnCmd} ${args.join(' ')}`));
      }

      // Exécuter Maven
      const process = spawn(mvnCmd, args, {
        stdio: this.options.verbose ? "inherit" : "pipe",
        shell: true
      });

      let output = "";
      if (!this.options.verbose) {
        process.stdout?.on("data", (data) => {
          output += data.toString();
          this.parseTestProgress(data.toString());
        });

        process.stderr?.on("data", (data) => {
          output += data.toString();
        });
      }

      process.on("close", (code) => {
        if (code === 0) {
          this.parseTestResults(output);
          resolve();
        } else {
          // Enregistrer quand même les résultats des tests si disponibles
          this.parseTestResults(output);
          reject(new Error(`Échec des tests avec le code de sortie ${code}`));
        }
      });
    });
  }

  /**
   * Exécute les tests avec Gradle
   */
  private async runGradleTests(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Construire la commande Gradle
      const gradleCmd = global.process.platform === "win32" ? "gradlew.bat" : "./gradlew";

      // Construire les arguments Gradle
      const args:any = [];

      // Sélectionner les tests à exécuter
      if (this.options.skipUnit && !this.options.skipIntegration) {
        args.push("integrationTest");
      } else if (!this.options.skipUnit && this.options.skipIntegration) {
        args.push("test");
      } else {
        args.push("check");
      }

      // Ajouter l'option de couverture si demandée
      if (this.options.coverage) {
        args.push("jacocoTestReport");
      }

      // Filtrer les tests si un pattern est spécifié
      if (this.options.pattern) {
        args.push(`--tests ${this.options.pattern}`);
      }

      // Mode détaillé si demandé
      if (this.options.verbose) {
        this.log(chalk.dim(`$ ${gradleCmd} ${args.join(' ')}`));
      }

      // Exécuter Gradle
      const process = spawn(gradleCmd, args, {
        stdio: this.options.verbose ? "inherit" : "pipe",
        shell: true
      });

      let output = "";
      if (!this.options.verbose) {
        process.stdout?.on("data", (data) => {
          output += data.toString();
          this.parseTestProgress(data.toString());
        });

        process.stderr?.on("data", (data) => {
          output += data.toString();
        });
      }

      process.on("close", (code) => {
        if (code === 0) {
          this.parseTestResults(output);
          resolve();
        } else {
          // Enregistrer quand même les résultats des tests si disponibles
          this.parseTestResults(output);
          reject(new Error(`Échec des tests avec le code de sortie ${code}`));
        }
      });
    });
  }

  /**
   * Analyse le flux de sortie pour afficher la progression des tests
   */
  private parseTestProgress(output: string): void {
    // Maven regex
    const mvnTestStartMatch = output.match(/Running ([a-zA-Z0-9_.]+)/);
    if (mvnTestStartMatch) {
      if (!this.options.verbose) {
        process.stdout.write(".");
      }
    }

    // Gradle regex
    const gradleTestMatch = output.match(/([a-zA-Z0-9_.]+) > .* PASSED|FAILED|SKIPPED/);
    if (gradleTestMatch) {
      if (!this.options.verbose) {
        process.stdout.write(".");
      }
    }
  }

  /**
   * Analyse les résultats des tests pour extraire les statistiques
   */
  private parseTestResults(output: string): void {
    if (this.projectType === "maven") {
      // Analyser les résultats Maven
      const resultsMatch = output.match(/Tests run: (\d+), Failures: (\d+), Errors: (\d+), Skipped: (\d+)/);
      if (resultsMatch) {
        this.testResults.total = parseInt(resultsMatch[1], 10);
        const failures = parseInt(resultsMatch[2], 10);
        const errors = parseInt(resultsMatch[3], 10);
        this.testResults.failed = failures + errors;
        this.testResults.skipped = parseInt(resultsMatch[4], 10);
        this.testResults.passed = this.testResults.total - this.testResults.failed - this.testResults.skipped;
      }

      // Durée des tests Maven
      const timeMatch = output.match(/Total time: ([0-9.]+) ([a-z]+)/);
      if (timeMatch) {
        this.testResults.duration = `${timeMatch[1]} ${timeMatch[2]}`;
      }
    } else if (this.projectType === "gradle") {
      // Analyser les résultats Gradle
      const resultsMatch = output.match(/(\d+) tests completed, (\d+) failed(, (\d+) skipped)?/);
      if (resultsMatch) {
        const total = parseInt(resultsMatch[1], 10);
        const failed = parseInt(resultsMatch[2], 10);
        const skipped = resultsMatch[4] ? parseInt(resultsMatch[4], 10) : 0;

        this.testResults.total = total;
        this.testResults.failed = failed;
        this.testResults.skipped = skipped;
        this.testResults.passed = total - failed - skipped;
      }

      // Durée des tests Gradle
      const timeMatch = output.match(/Total time: ([0-9.]+)s/);
      if (timeMatch) {
        this.testResults.duration = `${timeMatch[1]} secondes`;
      }
    }
  }

  /**
   * Affiche le rapport de couverture si demandé
   */
  private displayCoverageReport(): void {
    let coveragePath = "";

    if (this.projectType === "maven") {
      coveragePath = path.join(process.cwd(), "target", "site", "jacoco", "index.html");
    } else if (this.projectType === "gradle") {
      coveragePath = path.join(process.cwd(), "build", "reports", "jacoco", "test", "html", "index.html");
    }

    if (fs.existsSync(coveragePath)) {
      this.log(chalk.cyan(`\n📊 Rapport de couverture de code disponible à : ${coveragePath}`));
    } else {
      this.log(chalk.yellow(`\n⚠️ Aucun rapport de couverture n'a été trouvé. Vérifiez que JaCoCo est configuré correctement.`));
    }
  }

  /**
   * Méthode finale : affichage des résultats
   */
  async writing() {
    if (this.testResults.total === 0) {
      this.log(chalk.yellow("\n⚠️ Aucun test n'a été exécuté."));
      return;
    }

    // Afficher les résultats détaillés
    this.log("\n" + chalk.bold.underline("📋 Résumé des Tests"));
    this.log(chalk.green(`✓ Tests réussis: ${this.testResults.passed}`));
    if (this.testResults.failed > 0) {
      this.log(chalk.red(`✗ Tests échoués: ${this.testResults.failed}`));
    } else {
      this.log(chalk.gray(`✗ Tests échoués: 0`));
    }
    this.log(chalk.gray(`○ Tests ignorés: ${this.testResults.skipped}`));
    this.log(chalk.bold(`Total: ${this.testResults.total} tests`));

    if (this.testResults.duration) {
      this.log(chalk.gray(`⏱️ Durée: ${this.testResults.duration}`));
    }

    // Afficher le rapport de couverture si demandé
    if (this.options.coverage) {
      this.displayCoverageReport();
    }

    // Afficher des conseils en fonction des résultats
    if (this.testResults.failed > 0) {
      this.log("\n" + chalk.yellow("Conseils pour résoudre les tests échoués:"));
      this.log(chalk.gray("- Examinez les messages d'erreur dans les logs détaillés"));
      this.log(chalk.gray("- Utilisez l'option --verbose pour voir les logs détaillés"));
      this.log(chalk.gray("- Exécutez un test spécifique avec --pattern=com.example.MonTest"));
      this.log(chalk.gray("- Vérifiez les dépendances dans pom.xml ou build.gradle"));
    }

    // Afficher la section de fin
    displaySectionEnd();
  }
}
