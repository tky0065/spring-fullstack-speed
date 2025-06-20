/**
 * Générateur pour la commande 'sfs test'
 * Permet d'exécuter les tests d'un projet Spring Boot et d'afficher les résultats
 */

import { BaseGenerator } from "../base-generator.js";
import chalk from "chalk";
import path from "path";
import fs from "fs";
import { execSync, spawn } from "child_process";
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
      const mvnCmd = process.platform === "win32" ? "mvn.cmd" : "mvn";
      const mvnWrapper = fs.existsSync(path.join(process.cwd(), "mvnw"))
        ? path.join(process.cwd(), process.platform === "win32" ? "mvnw.cmd" : "mvnw")
        : mvnCmd;

      // Construire les arguments Maven
      const args: string[] = ["test"];

      // Ajouter les options selon les paramètres
      if (this.options.skipUnit) {
        args.push("-DskipUnitTests=true");
      }

      if (this.options.skipIntegration) {
        args.push("-DskipIntegrationTests=true");
      }

      if (this.options.coverage) {
        args.push("jacoco:report");
      }

      if (this.options.pattern) {
        args.push(`-Dtest=${this.options.pattern}`);
      }

      if (this.options.verbose) {
        this.log(chalk.gray(`Exécution de la commande: ${mvnWrapper} ${args.join(' ')}`));
      }

      // Exécuter la commande Maven
      const childProcess = spawn(mvnWrapper, args, {
        stdio: this.options.verbose ? "inherit" : "pipe",
        shell: true
      });

      let output = "";
      let errOutput = "";

      if (!this.options.verbose) {
        childProcess.stdout?.on("data", (data) => {
          output += data.toString();
        });

        childProcess.stderr?.on("data", (data) => {
          errOutput += data.toString();
        });
      }

      childProcess.on("close", (code) => {
        if (code === 0) {
          this.parseTestResults(output);
          resolve();
        } else {
          this.parseTestResults(output);
          reject(new Error(`Tests échoués avec le code d'erreur ${code}`));
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
      const gradleCmd = process.platform === "win32" ? "gradle.bat" : "gradle";
      const gradleWrapper = fs.existsSync(path.join(process.cwd(), "gradlew"))
        ? path.join(process.cwd(), process.platform === "win32" ? "gradlew.bat" : "gradlew")
        : gradleCmd;

      // Construire les arguments Gradle
      const args: string[] = ["test"];

      // Ajouter les options selon les paramètres
      if (this.options.skipUnit) {
        args.push("-PskipUnitTests=true");
      }

      if (this.options.skipIntegration) {
        args.push("-PskipIntegrationTests=true");
      }

      if (this.options.coverage) {
        args.push("jacocoTestReport");
      }

      if (this.options.pattern) {
        // Format pour Gradle est différent de Maven
        args.push(`--tests "${this.options.pattern}"`);
      }

      if (this.options.verbose) {
        this.log(chalk.gray(`Exécution de la commande: ${gradleWrapper} ${args.join(' ')}`));
      }

      // Exécuter la commande Gradle
      const childProcess = spawn(gradleWrapper, args, {
        stdio: this.options.verbose ? "inherit" : "pipe",
        shell: true
      });

      let output = "";
      let errOutput = "";

      if (!this.options.verbose) {
        childProcess.stdout?.on("data", (data) => {
          output += data.toString();
        });

        childProcess.stderr?.on("data", (data) => {
          errOutput += data.toString();
        });
      }

      childProcess.on("close", (code) => {
        if (code === 0) {
          this.parseGradleTestResults(output);
          resolve();
        } else {
          this.parseGradleTestResults(output);
          reject(new Error(`Tests échoués avec le code d'erreur ${code}`));
        }
      });
    });
  }

  /**
   * Parse les résultats des tests Maven
   */
  private parseTestResults(output: string): void {
    // Pour Maven, on cherche la ligne de résultat des tests (variable selon la version de Maven)
    // Exemples:
    // "Tests run: 42, Failures: 0, Errors: 0, Skipped: 2"
    // "Results: Tests run: 10, Failures: 1, Errors: 0, Skipped: 0"

    const mavenResultRegex = /Tests run: (\d+), Failures: (\d+), Errors: (\d+), Skipped: (\d+)/;
    const match = output.match(mavenResultRegex);

    if (match) {
      this.testResults.total = parseInt(match[1], 10);
      // Maven liste les échecs (assertions) et erreurs (exceptions) séparément
      this.testResults.failed = parseInt(match[2], 10) + parseInt(match[3], 10);
      this.testResults.skipped = parseInt(match[4], 10);
      this.testResults.passed = this.testResults.total - this.testResults.failed - this.testResults.skipped;
    } else {
      // Si on ne peut pas extraire les informations exactes, on estime la réussite/échec
      this.testResults.total = output.match(/Running .+Test/g)?.length || 0;
      this.testResults.passed = output.includes("BUILD SUCCESS") ? this.testResults.total : 0;
      this.testResults.failed = output.includes("BUILD FAILURE") ? this.testResults.total - this.testResults.passed : 0;
    }

    // Extraire la durée (si disponible)
    const durationMatch = output.match(/Time elapsed: ([0-9.]+) s/);
    if (durationMatch) {
      this.testResults.duration = parseFloat(durationMatch[1]);
    }
  }

  /**
   * Parse les résultats des tests Gradle
   */
  private parseGradleTestResults(output: string): void {
    // Pour Gradle, le format est différent de Maven
    // Exemples:
    // "36 tests completed, 1 failed, 2 skipped"

    const gradleResultRegex = /(\d+) tests? completed, (\d+) failed, (\d+) skipped/;
    const match = output.match(gradleResultRegex);

    if (match) {
      this.testResults.total = parseInt(match[1], 10) + parseInt(match[2], 10) + parseInt(match[3], 10);
      this.testResults.failed = parseInt(match[2], 10);
      this.testResults.skipped = parseInt(match[3], 10);
      this.testResults.passed = parseInt(match[1], 10);
    } else {
      // Si on ne peut pas extraire les informations exactes, on estime la réussite/échec
      this.testResults.passed = output.includes("BUILD SUCCESSFUL") ? 1 : 0;
      this.testResults.failed = output.includes("BUILD FAILED") ? 1 : 0;
      this.testResults.total = this.testResults.passed + this.testResults.failed;
    }

    // Extraire la durée (si disponible)
    const durationMatch = output.match(/Total time: ([0-9.]+) s/);
    if (durationMatch) {
      this.testResults.duration = parseFloat(durationMatch[1]);
    }
  }

  /**
   * Affichage du rapport de tests
   */
  end() {
    displaySectionEnd();

    // Message pour indiquer la fin des tests
    this.log(chalk.bold.blue("Tests terminés"));

    // Afficher un résumé détaillé des tests
    this.log("\n" + chalk.bold("Résultat des tests:"));
    this.log(`✓ Tests réussis:  ${chalk.green(this.testResults.passed)}`);
    this.log(`✗ Tests échoués:  ${chalk.red(this.testResults.failed)}`);
    this.log(`○ Tests ignorés:  ${chalk.yellow(this.testResults.skipped)}`);
    this.log(`⏱ Temps écoulé:  ${chalk.blue(this.testResults.duration ? `${this.testResults.duration} secondes` : 'Non disponible')}`);

    // Afficher des messages en fonction du résultat
    if (this.testResults.failed > 0) {
      this.log("\n" + chalk.red("Des tests ont échoué! Consultez le rapport complet pour plus de détails."));

      // Suggestion pour les rapports détaillés
      if (this.projectType === "maven") {
        this.log(chalk.gray("Rapport de test disponible dans: target/surefire-reports/"));
      } else if (this.projectType === "gradle") {
        this.log(chalk.gray("Rapport de test disponible dans: build/reports/tests/test/"));
      }
    } else if (this.testResults.total === 0) {
      this.log("\n" + chalk.yellow("Aucun test n'a été exécuté. Assurez-vous que votre projet contient des tests."));
    } else {
      this.log("\n" + chalk.green.bold("Tous les tests ont réussi!"));
    }

    // Afficher des informations sur la couverture de code si demandée
    if (this.options.coverage) {
      this.log("\n" + chalk.bold("Rapport de couverture de code:"));

      if (this.projectType === "maven") {
        this.log(chalk.gray("Rapport de couverture disponible dans: target/site/jacoco/"));
      } else if (this.projectType === "gradle") {
        this.log(chalk.gray("Rapport de couverture disponible dans: build/reports/jacoco/test/html/"));
      }

      // Détection du rapport
      let coveragePath = "";
      if (this.projectType === "maven" && fs.existsSync("target/site/jacoco/")) {
        coveragePath = "target/site/jacoco/index.html";
      } else if (this.projectType === "gradle" && fs.existsSync("build/reports/jacoco/test/html/")) {
        coveragePath = "build/reports/jacoco/test/html/index.html";
      }

      if (fs.existsSync(coveragePath)) {
        this.log(chalk.green(`✓ Rapport de couverture généré avec succès: ${coveragePath}`));
      } else {
        this.log(chalk.yellow("! Le rapport de couverture n'a pas été trouvé. Vérifiez que JaCoCo est correctement configuré."));
      }
    }

    // Ajouter des conseils pour l'amélioration des tests
    if (this.testResults.total > 0 && this.testResults.skipped > this.testResults.total * 0.3) {
      this.log("\n" + chalk.yellow("Conseil: Une grande proportion de tests est ignorée. Envisagez de les activer ou de les supprimer."));
    }

    if (this.testResults.total === 0) {
      this.log("\n" + chalk.yellow("Conseil pour débuter avec les tests:"));
      this.log(chalk.gray("- Créez des tests dans src/test/java"));
      this.log(chalk.gray("- Utilisez JUnit 5 et AssertJ pour des assertions expressives"));
      this.log(chalk.gray("- Pour les tests d'API, considérez Spring MockMvc ou RestAssured"));
    }
  }
}
