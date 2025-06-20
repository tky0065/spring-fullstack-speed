/**
 * Générateur pour la commande 'sfs serve'
 * Lance un serveur de développement avec configuration optimisée et rechargement automatique
 */

import { BaseGenerator } from "../base-generator.js";
import chalk from "chalk";
import path from "path";
import fs from "fs";
import { createSpinner, displaySectionTitle } from "../../utils/cli-ui.js";
import { withKeyboardInput } from "../../utils/cli-navigation.js";
import { spawn } from "child_process";
import portfinder from "portfinder";
import boxen from "boxen";

// Interface pour les options du générateur
interface ServeOptions {
  backend?: boolean;
  frontend?: boolean;
  port?: number;
  profiles?: string;
  watch?: boolean;
  open?: boolean;
}

/**
 * Générateur pour lancer un serveur de développement
 */
export default class ServeGenerator extends BaseGenerator {
  // Déclaration des options avec les types corrects
  declare options: any;

  // Propriétés internes
  projectDetails: any = {};
  backendProcess: any = null;
  frontendProcess: any = null;

  constructor(args: string[], options: any) {
    super(args, options);

    // Définition des options de la commande
    this.option("backend", {
      type: Boolean,
      description: "Lance uniquement le serveur backend",
      default: false
    });

    this.option("frontend", {
      type: Boolean,
      description: "Lance uniquement le serveur frontend",
      default: false
    });

    this.option("port", {
      type: Number,
      description: "Port du serveur backend (par défaut: 8080)",
      alias: "p"
    });

    this.option("profiles", {
      type: String,
      description: "Profils Spring à activer (par défaut: dev)",
      default: "dev"
    });

    this.option("watch", {
      type: Boolean,
      description: "Active le rechargement automatique",
      default: true
    });

    this.option("open", {
      type: Boolean,
      description: "Ouvre le navigateur automatiquement",
      default: false
    });
  }

  /**
   * Initialisation du générateur
   */
  async initializing() {
    displaySectionTitle("Lancement du serveur de développement");

    // Vérifier que nous sommes dans un projet valide
    if (!this.isValidProject()) {
      this.log(chalk.red("❌ Ce n'est pas un projet Spring-Fullstack valide. Exécutez cette commande à la racine d'un projet généré par Spring-Fullstack."));
      process.exit(1);
      return;
    }

    // Détecter les détails du projet
    await this.detectProjectDetails();

    // Vérifier les ports disponibles
    if (!this.options.port) {
      this.options.port = await portfinder.getPortPromise({ port: 8080 });
    }

    const frontendPort = await portfinder.getPortPromise({ port: 3000 });
    this.projectDetails.frontendPort = frontendPort;
  }

  /**
   * Détecte les détails du projet
   */
  async detectProjectDetails() {
    // Déterminer l'outil de build
    this.projectDetails.hasMaven = fs.existsSync(path.join(process.cwd(), "pom.xml"));
    this.projectDetails.hasGradle = fs.existsSync(path.join(process.cwd(), "build.gradle")) ||
                                  fs.existsSync(path.join(process.cwd(), "build.gradle.kts"));

    // Déterminer le framework frontend
    const packageJsonPath = path.join(process.cwd(), "package.json");
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

      if (packageJson.dependencies) {
        if (packageJson.dependencies.react) {
          this.projectDetails.frontendFramework = "React";
        } else if (packageJson.dependencies.vue) {
          this.projectDetails.frontendFramework = "Vue";
        } else if (packageJson.dependencies["@angular/core"]) {
          this.projectDetails.frontendFramework = "Angular";
        }
      }

      this.projectDetails.frontendScripts = packageJson.scripts || {};
    }

    // Vérifier la présence de certains fichiers
    this.projectDetails.hasDockerCompose = fs.existsSync(path.join(process.cwd(), "docker-compose.yml")) ||
                                          fs.existsSync(path.join(process.cwd(), "docker-compose.yaml"));

    // Déterminer si le projet utilise Spring Dev Tools
    this.projectDetails.hasDevTools = this.checkDependency("spring-boot-devtools");

    // Vérifier si on a un frontend séparé
    this.projectDetails.hasFrontendDir = fs.existsSync(path.join(process.cwd(), "frontend"));
  }

  /**
   * Vérifie si le répertoire actuel est un projet valide
   */
  private isValidProject(): boolean {
    // Vérifier la présence des fichiers caractéristiques d'un projet Spring Boot
    const pomExists = fs.existsSync(path.join(process.cwd(), "pom.xml"));
    const gradleExists = fs.existsSync(path.join(process.cwd(), "build.gradle")) ||
                        fs.existsSync(path.join(process.cwd(), "build.gradle.kts"));
    const srcMainJavaExists = fs.existsSync(path.join(process.cwd(), "src", "main", "java"));

    return (pomExists || gradleExists) && srcMainJavaExists;
  }

  /**
   * Vérifie si une dépendance est présente dans le pom.xml ou build.gradle
   */
  private checkDependency(artifactId: string): boolean {
    if (this.projectDetails.hasMaven) {
      const pomContent = fs.readFileSync(path.join(process.cwd(), "pom.xml"), "utf8");
      return pomContent.includes(artifactId);
    } else if (this.projectDetails.hasGradle) {
      const gradlePath = fs.existsSync(path.join(process.cwd(), "build.gradle"))
        ? path.join(process.cwd(), "build.gradle")
        : path.join(process.cwd(), "build.gradle.kts");

      const gradleContent = fs.readFileSync(gradlePath, "utf8");
      return gradleContent.includes(artifactId);
    }

    return false;
  }

  /**
   * Invite l'utilisateur à choisir les options de lancement
   */
  async prompting() {
    // Si ni --backend ni --frontend sont spécifiés, demander à l'utilisateur
    if (!this.options.backend && !this.options.frontend) {
      await withKeyboardInput(async () => {
        const answers = await this.prompt({
          type: 'list',
          name: 'target',
          message: chalk.cyan('Que souhaitez-vous lancer?'),
          choices: [
            { name: 'Backend et Frontend (si disponible)', value: 'both' },
            { name: 'Backend uniquement', value: 'backend' },
            { name: 'Frontend uniquement', value: 'frontend' }
          ],
          default: 'both'
        });

        if (answers.target === 'backend') {
          this.options.backend = true;
        } else if (answers.target === 'frontend') {
          this.options.frontend = true;
        } else {
          // Par défaut, lancer les deux si disponibles
          this.options.backend = true;
          this.options.frontend = this.projectDetails.hasFrontendDir || this.projectDetails.frontendFramework;
        }
      });
    }

    // Si l'utilisateur a demandé le frontend mais qu'il n'y en a pas
    if (this.options.frontend && !this.projectDetails.hasFrontendDir && !this.projectDetails.frontendFramework) {
      this.log(chalk.yellow("⚠️ Aucun projet frontend détecté. Seul le backend sera lancé."));
      this.options.frontend = false;
      this.options.backend = true;
    }

    // Demander le port si non spécifié
    if (this.options.backend && !this.options.port) {
      await withKeyboardInput(async () => {
        const portAnswer = await this.prompt({
          type: 'input',
          name: 'port',
          message: chalk.cyan('Port du serveur backend:'),
          default: this.options.port || 8080,
          validate: (input: string) => {
            const port = parseInt(input);
            if (isNaN(port) || port < 1 || port > 65535) {
              return 'Veuillez entrer un numéro de port valide (1-65535)';
            }
            return true;
          }
        });

        this.options.port = parseInt(portAnswer.port);
      });
    }

    // Demander les profils Spring si backend
    if (this.options.backend && !this.options.profiles) {
      await withKeyboardInput(async () => {
        const profilesAnswer = await this.prompt({
          type: 'input',
          name: 'profiles',
          message: chalk.cyan('Profils Spring à activer (séparés par des virgules):'),
          default: 'dev'
        });

        this.options.profiles = profilesAnswer.profiles;
      });
    }
  }

  /**
   * Lance les serveurs de développement
   */
  async running() {
    // Afficher un résumé de la configuration
    this.log("\n" + chalk.blue("Configuration:"));
    if (this.options.backend) {
      this.log(`- Backend: ${chalk.green("✓")} (Port: ${this.options.port}, Profils: ${this.options.profiles})`);
    }
    if (this.options.frontend) {
      this.log(`- Frontend: ${chalk.green("✓")} (Port: ${this.projectDetails.frontendPort}, Framework: ${this.projectDetails.frontendFramework || "Standard"})`);
    }
    this.log(`- Rechargement automatique: ${this.options.watch ? chalk.green("✓") : chalk.red("✗")}`);
    this.log(`- Ouverture automatique du navigateur: ${this.options.open ? chalk.green("✓") : chalk.red("✗")}`);

    // Demander confirmation
    await withKeyboardInput(async () => {
      const confirmAnswer = await this.prompt({
        type: 'confirm',
        name: 'confirm',
        message: chalk.cyan('Démarrer les serveurs avec cette configuration?'),
        default: true
      });

      if (!confirmAnswer.confirm) {
        this.log(chalk.yellow("❌ Opération annulée par l'utilisateur."));
        process.exit(0);
      }
    });

    // Lancer les serveurs
    try {
      if (this.options.backend) {
        await this.startBackendServer();
      }

      if (this.options.frontend) {
        await this.startFrontendServer();
      }

      // Afficher les URL des serveurs
      await this.displayServerInfo();

      // Attacher au processus
      this.attachShutdownHandlers();

      // Ouvrir le navigateur si demandé
      if (this.options.open) {
        this.openBrowser();
      }

      // Attendre que l'utilisateur arrête le serveur
      this.log(chalk.gray("\nAppuyez sur Ctrl+C pour arrêter les serveurs..."));

    } catch (error) {
      this.log(chalk.red(`❌ Erreur lors du démarrage des serveurs: ${error}`));
      this.cleanupProcesses();
      process.exit(1);
    }
  }

  /**
   * Démarre le serveur backend Spring Boot
   */
  private async startBackendServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      const spinner = createSpinner({
        text: "Démarrage du serveur Spring Boot...",
        color: "primary"
      });

      spinner.start();

      // Construire la commande selon l'outil de build
      let command: string;
      let args: string[] = [];

      if (this.projectDetails.hasMaven) {
        command = process.platform === "win32" ? "mvnw.cmd" : "./mvnw";
        args = ["spring-boot:run", `-Dspring-boot.run.profiles=${this.options.profiles}`, `-Dserver.port=${this.options.port}`];

        if (!fs.existsSync(path.join(process.cwd(), command))) {
          command = process.platform === "win32" ? "mvn.cmd" : "mvn";
        }
      } else {
        command = process.platform === "win32" ? "gradlew.bat" : "./gradlew";
        args = ["bootRun", `--args=--spring.profiles.active=${this.options.profiles} --server.port=${this.options.port}`];

        if (!fs.existsSync(path.join(process.cwd(), command))) {
          command = process.platform === "win32" ? "gradle.bat" : "gradle";
        }
      }

      // Ajouter des arguments supplémentaires
      if (this.options.watch && this.projectDetails.hasDevTools) {
        if (this.projectDetails.hasMaven) {
          args.push("-Dspring-boot.run.fork=true");
        }
      }

      // Lancer le processus
      this.backendProcess = spawn(command, args, {
        stdio: "pipe",
        cwd: process.cwd(),
        shell: true
      });

      let serverStarted = false;

      this.backendProcess.stdout.on("data", (data) => {
        const output = data.toString();

        // Vérifier si le serveur a démarré
        if (output.includes("Started") && output.includes("in") && !serverStarted) {
          serverStarted = true;
          spinner.succeed(`Serveur Spring Boot démarré sur le port ${this.options.port}`);
          resolve();
        }

        // Afficher la sortie sur la console
        process.stdout.write(chalk.cyan("[Backend] ") + output);
      });

      this.backendProcess.stderr.on("data", (data) => {
        const output = data.toString();
        process.stderr.write(chalk.red("[Backend] ") + output);

        // Détecter les erreurs de démarrage
        if (output.includes("ERROR") || output.includes("Exception")) {
          if (!serverStarted) {
            spinner.fail("Erreur lors du démarrage du serveur Spring Boot");
            reject(new Error("Erreur lors du démarrage du serveur Spring Boot"));
          }
        }
      });

      this.backendProcess.on("error", (err) => {
        spinner.fail(`Erreur lors du lancement du processus: ${err.message}`);
        reject(err);
      });

      this.backendProcess.on("exit", (code) => {
        if (code !== 0 && !serverStarted) {
          spinner.fail(`Le serveur s'est arrêté avec le code ${code}`);
          reject(new Error(`Le serveur s'est arrêté avec le code ${code}`));
        } else if (code !== null) {
          this.log(chalk.yellow(`Serveur backend arrêté (code ${code})`));
        }
      });

      // Timeout si le serveur ne démarre pas dans un délai raisonnable
      setTimeout(() => {
        if (!serverStarted) {
          spinner.info("Le serveur prend plus de temps que prévu à démarrer, mais continue en arrière-plan...");
          resolve();
        }
      }, 60000);
    });
  }

  /**
   * Démarre le serveur frontend
   */
  private async startFrontendServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      const spinner = createSpinner({
        text: "Démarrage du serveur frontend...",
        color: "secondary"
      });

      spinner.start();

      // Déterminer la commande à exécuter
      let command = "npm";
      let args = ["run", "start"];
      let cwd = process.cwd();

      // Vérifier si le projet utilise un dossier frontend séparé
      if (this.projectDetails.hasFrontendDir) {
        cwd = path.join(process.cwd(), "frontend");
      }

      // Vérifier si yarn ou pnpm est utilisé
      if (fs.existsSync(path.join(cwd, "yarn.lock"))) {
        command = "yarn";
      } else if (fs.existsSync(path.join(cwd, "pnpm-lock.yaml"))) {
        command = "pnpm";
      }

      // Vérifier si un script spécifique existe
      const packageJsonPath = path.join(cwd, "package.json");
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

        // Pour Angular, utiliser ng serve
        if (this.projectDetails.frontendFramework === "Angular" && packageJson.scripts["serve"]) {
          args = ["run", "serve"];
        }

        // Pour React/Vue avec script dev
        if ((this.projectDetails.frontendFramework === "React" || this.projectDetails.frontendFramework === "Vue") &&
            packageJson.scripts["dev"]) {
          args = ["run", "dev"];
        }
      }

      // Ajouter le port si nécessaire
      if (this.projectDetails.frontendPort) {
        if (this.projectDetails.frontendFramework === "React") {
          process.env.PORT = this.projectDetails.frontendPort.toString();
        } else if (this.projectDetails.frontendFramework === "Vue") {
          args.push("--port", this.projectDetails.frontendPort.toString());
        } else if (this.projectDetails.frontendFramework === "Angular") {
          args.push("--port", this.projectDetails.frontendPort.toString());
        }
      }

      // Lancer le processus
      this.frontendProcess = spawn(command, args, {
        stdio: "pipe",
        cwd,
        shell: true,
        env: { ...process.env }
      });

      let serverStarted = false;

      this.frontendProcess.stdout.on("data", (data) => {
        const output = data.toString();

        // Vérifier si le serveur a démarré
        if ((output.includes("Server running") ||
             output.includes("Compiled successfully") ||
             output.includes("Running") ||
             output.includes("localhost")) && !serverStarted) {
          serverStarted = true;
          spinner.succeed(`Serveur frontend démarré sur le port ${this.projectDetails.frontendPort}`);
          resolve();
        }

        // Afficher la sortie sur la console
        process.stdout.write(chalk.green("[Frontend] ") + output);
      });

      this.frontendProcess.stderr.on("data", (data) => {
        const output = data.toString();

        // Ne pas afficher les avertissements webpack comme des erreurs
        if (output.includes("webpack.Progress") || output.includes("WARNING")) {
          process.stdout.write(chalk.yellow("[Frontend] ") + output);
        } else {
          process.stderr.write(chalk.red("[Frontend] ") + output);
        }

        // Certains frameworks affichent les messages de démarrage sur stderr
        if ((output.includes("server running") ||
             output.includes("localhost:") ||
             output.includes("available on")) && !serverStarted) {
          serverStarted = true;
          spinner.succeed(`Serveur frontend démarré sur le port ${this.projectDetails.frontendPort}`);
          resolve();
        }
      });

      this.frontendProcess.on("error", (err) => {
        spinner.fail(`Erreur lors du lancement du serveur frontend: ${err.message}`);
        reject(err);
      });

      this.frontendProcess.on("exit", (code) => {
        if (code !== 0 && !serverStarted) {
          spinner.fail(`Le serveur frontend s'est arrêté avec le code ${code}`);
          reject(new Error(`Le serveur frontend s'est arrêté avec le code ${code}`));
        } else if (code !== null) {
          this.log(chalk.yellow(`Serveur frontend arrêté (code ${code})`));
        }
      });

      // Timeout si le serveur ne démarre pas dans un délai raisonnable
      setTimeout(() => {
        if (!serverStarted) {
          spinner.info("Le serveur frontend prend plus de temps que prévu à démarrer, mais continue en arrière-plan...");
          resolve();
        }
      }, 60000);
    });
  }

  /**
   * Affiche les informations sur les serveurs en cours d'exécution
   */
  private async displayServerInfo(): Promise<void> {
    let infoText = "";

    if (this.options.backend) {
      infoText += `Backend: ${chalk.cyan(`http://localhost:${this.options.port}`)}\n`;

      // Ajouter les endpoints API et Swagger si disponibles
      infoText += `API: ${chalk.cyan(`http://localhost:${this.options.port}/api`)}\n`;

      if (this.checkDependency("springdoc-openapi") || this.checkDependency("springfox")) {
        infoText += `Swagger UI: ${chalk.cyan(`http://localhost:${this.options.port}/swagger-ui.html`)}\n`;
      }
    }

    if (this.options.frontend) {
      infoText += `Frontend: ${chalk.cyan(`http://localhost:${this.projectDetails.frontendPort}`)}\n`;
    }

    // Ajouter des conseils
    infoText += `\n${chalk.gray("Appuyez sur Ctrl+C pour arrêter les serveurs")}`;

    // Afficher dans une boîte
    const boxContent = boxen(infoText, {
      title: "Serveurs en cours d'exécution",
      titleAlignment: "center",
      padding: 1,
      margin: 1,
      borderColor: "green"
    });

    console.log(boxContent);
  }

  /**
   * Ouvre le navigateur à l'URL appropriée
   */
  private openBrowser(): void {
    let url: string;

    // Privilégier le frontend s'il est disponible
    if (this.options.frontend) {
      url = `http://localhost:${this.projectDetails.frontendPort}`;
    } else {
      url = `http://localhost:${this.options.port}`;
    }

    // Ouvrir le navigateur
    const open = require("open");
    open(url).catch((error: any) => {
      this.log(chalk.yellow(`⚠️ Impossible d'ouvrir automatiquement le navigateur: ${error.message}`));
      this.log(chalk.yellow(`Vous pouvez accéder manuellement à l'application via: ${url}`));
    });
  }

  /**
   * Nettoie les processus en cas d'arrêt
   */
  private cleanupProcesses(): void {
    if (this.backendProcess) {
      this.backendProcess.kill();
    }

    if (this.frontendProcess) {
      this.frontendProcess.kill();
    }
  }

  /**
   * Attache les gestionnaires d'événements pour l'arrêt propre
   */
  private attachShutdownHandlers(): void {
    // Intercepter Ctrl+C et autres signaux
    process.on("SIGINT", () => {
      this.log(chalk.yellow("\nArrêt des serveurs..."));
      this.cleanupProcesses();
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      this.log(chalk.yellow("\nArrêt des serveurs..."));
      this.cleanupProcesses();
      process.exit(0);
    });

    // Gérer les erreurs non gérées
    process.on("uncaughtException", (error) => {
      this.log(chalk.red(`\nErreur non gérée: ${error}`));
      this.cleanupProcesses();
      process.exit(1);
    });
  }
}
