/**
 * Générateur pour la commande 'sfs serve'
 * Lance un serveur de développement avec configuration optimisée et rechargement automatique
 */

import { BaseGenerator } from "../base-generator.js";
import chalk from "chalk";
import path from "path";
import fs from "fs";
import { createSpinner, displaySectionTitle, displaySectionEnd } from "../../utils/cli-ui.js";
import { spawn, execSync } from "child_process";
import portfinder from "portfinder";
import boxen from "boxen";
import * as net from "net";
import { platform } from "os";

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
  private projectType: 'maven' | 'gradle' | 'unknown' = 'unknown';
  private hasFrontend: boolean = false;
  private frontendType: string | null = null;
  private childProcesses: any[] = [];
  private backendPort: number = 8080;
  private frontendPort: number = 4200;
  private isWindows: boolean = platform() === 'win32';

  constructor(args: string[], options: any) {
    super(args, options);

    // Options pour la ligne de commande
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
      description: "Port pour le serveur backend",
      default: 8080
    });

    this.option("profiles", {
      type: String,
      description: "Profils Spring à activer (séparés par des virgules)",
      default: "dev"
    });

    this.option("watch", {
      type: Boolean,
      description: "Active le rechargement automatique",
      default: true
    });

    this.option("open", {
      type: Boolean,
      description: "Ouvre automatiquement l'application dans le navigateur",
      default: true
    });
  }

  /**
   * Initialisation: détection de la configuration du projet
   */
  async initializing() {
    displaySectionTitle("Démarrage du serveur de développement");

    // Vérification préalable
    await this.detectProjectType();

    // Validation des options
    if (this.options.backend && this.options.frontend) {
      this.log(chalk.yellow("⚠️ Les options --backend et --frontend ne peuvent pas être utilisées simultanément. Les deux serveurs seront lancés."));
      this.options.backend = false;
      this.options.frontend = false;
    }

    // Trouver des ports disponibles
    this.backendPort = this.options.port || 8080;
    this.frontendPort = await this.findAvailablePort(this.backendPort === 4200 ? 4201 : 4200);

    // Afficher la configuration
    this.log(chalk.blue("Configuration du serveur de développement :"));
    this.log(chalk.gray(`- Type de projet : ${this.projectType}`));

    if (!this.options.frontend) {
      this.log(chalk.gray(`- Backend : activé (port ${this.backendPort})`));
      this.log(chalk.gray(`- Profils Spring : ${this.options.profiles}`));
    } else {
      this.log(chalk.gray(`- Backend : désactivé`));
    }

    if (this.hasFrontend && !this.options.backend) {
      this.log(chalk.gray(`- Frontend : activé (port ${this.frontendPort})`));
      this.log(chalk.gray(`- Type de frontend : ${this.frontendType || "Non détecté"}`));
    } else if (this.hasFrontend) {
      this.log(chalk.gray(`- Frontend : désactivé`));
    } else {
      this.log(chalk.gray(`- Frontend : non détecté`));
    }

    this.log(chalk.gray(`- Rechargement automatique : ${this.options.watch ? "activé" : "désactivé"}`));
  }

  /**
   * Détecte le type de projet et la présence d'un frontend
   */
  async detectProjectType() {
    // Vérifier si c'est un projet Maven
    if (fs.existsSync(path.join(process.cwd(), "pom.xml"))) {
      this.projectType = "maven";
    }
    // Vérifier si c'est un projet Gradle
    else if (fs.existsSync(path.join(process.cwd(), "build.gradle")) ||
             fs.existsSync(path.join(process.cwd(), "build.gradle.kts"))) {
      this.projectType = "gradle";
    }
    // Si aucun des deux, c'est un projet inconnu
    else {
      this.projectType = "unknown";
      this.log(chalk.red("❌ Erreur: Le répertoire actuel ne contient pas de projet Spring Boot."));
      process.exit(1);
    }

    // Détecter le frontend
    if (fs.existsSync(path.join(process.cwd(), "frontend"))) {
      this.hasFrontend = true;

      // Détecter le type de frontend
      if (fs.existsSync(path.join(process.cwd(), "frontend", "angular.json"))) {
        this.frontendType = "Angular";
      }
      else if (fs.existsSync(path.join(process.cwd(), "frontend", "package.json"))) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), "frontend", "package.json"), "utf8"));
          if (packageJson.dependencies?.react) {
            this.frontendType = "React";
          }
          else if (packageJson.dependencies?.vue) {
            this.frontendType = "Vue";
          }
          else {
            this.frontendType = "Node.js";
          }
        } catch (e) {
          this.frontendType = "Node.js";
        }
      }
    }
  }

  /**
   * Exécution principale: lancement des serveurs
   */
  async prompting() {
    // Démarrer les serveurs en fonction des options
    if (!this.options.frontend) {
      // Démarrer le backend s'il n'est pas explicitement désactivé
      await this.startBackend();
    }

    if (this.hasFrontend && !this.options.backend) {
      // Démarrer le frontend s'il existe et n'est pas explicitement désactivé
      await this.startFrontend();
    }

    // Afficher le tableau de bord
    this.displayDashboard();

    // Attendre et intercepter CTRL+C pour l'arrêt propre
    this.log(chalk.gray("\nAppuyez sur CTRL+C pour arrêter les serveurs..."));

    // Installer le gestionnaire pour l'arrêt propre
    process.on('SIGINT', () => this.cleanupAndExit());
    process.on('SIGTERM', () => this.cleanupAndExit());
  }

  /**
   * Démarre le serveur backend Spring Boot
   */
  async startBackend() {
    this.log(chalk.blue("\n🚀 Démarrage du serveur backend..."));
    const spinner = createSpinner({
      text: "Initialisation du serveur backend...",
      color: "info",
      spinner: "dots"
    });

    try {
      // Construire les arguments de ligne de commande pour Spring Boot
      let command;
      let args: string[] = [];
      let env = { ...process.env };

      // Configurer les profils Spring
      env.SPRING_PROFILES_ACTIVE = this.options.profiles;

      if (this.projectType === "maven") {
        // Construire la commande Maven pour Spring Boot
        command = this.isWindows ? "mvn.cmd" : "mvn";
        args = [
          "spring-boot:run",
          `-Dspring-boot.run.jvmArguments="-Dserver.port=${this.backendPort}"`,
          `-Dspring-boot.run.profiles=${this.options.profiles}`
        ];

        // Option de rechargement automatique pour Maven
        if (this.options.watch) {
          args.push("-Dspring-boot.run.fork=false");
        }
      }
      else if (this.projectType === "gradle") {
        // Construire la commande Gradle pour Spring Boot
        command = this.isWindows ?
          (fs.existsSync(path.join(process.cwd(), "gradlew.bat")) ? "gradlew.bat" : "gradle.bat") :
          (fs.existsSync(path.join(process.cwd(), "gradlew")) ? "./gradlew" : "gradle");

        args = [
          "bootRun",
          `--args='--server.port=${this.backendPort}'`
        ];

        // Option de profil pour Gradle
        if (this.options.profiles) {
          args.push(`-Pspring.profiles.active=${this.options.profiles}`);
        }
      }

      // Lancer le processus backend
      const backendProcess = spawn(command, args, {
        cwd: process.cwd(),
        env,
        shell: true,
        stdio: 'pipe'
      });

      // Stocker la référence au processus pour le nettoyage
      this.childProcesses.push({
        name: "backend",
        process: backendProcess,
        port: this.backendPort
      });

      // Gérer la sortie du processus
      backendProcess.stdout.on('data', (data) => {
        const output = data.toString();

        // Détecter les messages importants
        if (output.includes("Started") && output.includes("in") && output.includes("seconds")) {
          spinner.succeed(`Serveur Spring Boot démarré sur http://localhost:${this.backendPort}`);

          // Ouvrir le navigateur si demandé et si c'est le premier démarrage
          if (this.options.open && !this.options.frontend) {
            this.openBrowser(`http://localhost:${this.backendPort}`);
          }
        }

        // Afficher la sortie en mode détaillé
        if (this.options.verbose) {
          this.log(chalk.gray("[Backend] ") + output.trim());
        }
      });

      backendProcess.stderr.on('data', (data) => {
        const errorOutput = data.toString();

        // Afficher toujours les erreurs
        if (errorOutput.toLowerCase().includes("error")) {
          spinner.fail("Erreur lors du démarrage du serveur Spring Boot");
          this.log(chalk.red("[Backend] ") + errorOutput.trim());
        } else if (this.options.verbose) {
          this.log(chalk.yellow("[Backend] ") + errorOutput.trim());
        }
      });

      backendProcess.on('close', (code) => {
        if (code !== 0 && code !== null) {
          spinner.fail(`Le serveur backend s'est arrêté avec le code: ${code}`);
        }
      });

    } catch (error: any) {
      spinner.fail("Erreur lors du démarrage du serveur backend");
      this.log(chalk.red(`Erreur: ${error.message}`));
    }
  }

  /**
   * Démarre le serveur frontend de développement
   */
  async startFrontend() {
    this.log(chalk.blue("\n🌐 Démarrage du serveur frontend..."));
    const spinner = createSpinner({
      text: "Initialisation du serveur frontend...",
      color: "info",
      spinner: "dots"
    });

    try {
      // Vérifier si les dépendances sont installées
      if (!fs.existsSync(path.join(process.cwd(), "frontend", "node_modules"))) {
        spinner.text = "Installation des dépendances frontend...";

        const hasYarn = fs.existsSync(path.join(process.cwd(), "frontend", "yarn.lock"));
        const installCommand = hasYarn ? "yarn" : "npm install";

        try {
          execSync(installCommand, {
            cwd: path.join(process.cwd(), "frontend"),
            stdio: this.options.verbose ? 'inherit' : 'pipe'
          });
        } catch (error) {
          spinner.fail("Échec de l'installation des dépendances frontend");
          throw new Error("Impossible d'installer les dépendances frontend. Essayez d'exécuter npm install ou yarn manuellement.");
        }
      }

      // Déterminer la commande de démarrage en fonction du type de frontend
      let command: string;
      let args: string[] = [];
      let env = { ...process.env, NODE_ENV: "development" };

      if (this.frontendType === "Angular") {
        command = this.isWindows ? "npx.cmd" : "npx";
        args = [
          "ng",
          "serve",
          "--port", this.frontendPort.toString(),
          "--host", "0.0.0.0"
        ];

        // Ajouter le proxy si le backend est en cours d'exécution
        if (!this.options.frontend) {
          if (fs.existsSync(path.join(process.cwd(), "frontend", "proxy.conf.json"))) {
            args.push("--proxy-config", "proxy.conf.json");
          } else {
            // Créer une configuration de proxy par défaut
            const proxyConfig = {
              "/api": {
                "target": `http://localhost:${this.backendPort}`,
                "secure": false,
                "changeOrigin": true
              }
            };

            fs.writeFileSync(
              path.join(process.cwd(), "frontend", "proxy.conf.json"),
              JSON.stringify(proxyConfig, null, 2)
            );

            args.push("--proxy-config", "proxy.conf.json");
          }
        }

        // Ouvrir dans le navigateur si demandé
        if (this.options.open) {
          args.push("--open");
        }
      }
      else if (this.frontendType === "React" || this.frontendType === "Vue") {
        const hasYarn = fs.existsSync(path.join(process.cwd(), "frontend", "yarn.lock"));
        command = this.isWindows ? (hasYarn ? "yarn.cmd" : "npm.cmd") : (hasYarn ? "yarn" : "npm");

        // Pour React/Vue, utiliser le script start
        args = hasYarn ? ["start"] : ["run", "start"];

        // Configurer le port pour React
        if (this.frontendType === "React") {
          global.env.PORT = this.frontendPort.toString();
        }

        // Pour le proxy dans React, vérifier si le backend est lancé
        if (!this.options.frontend && this.frontendType === "React") {
          // Créer un fichier .env dans le répertoire frontend avec la configuration du proxy
          fs.writeFileSync(
            path.join(process.cwd(), "frontend", ".env.local"),
            `REACT_APP_API_URL=http://localhost:${this.backendPort}/api\n`
          );
        }
      }
      else {
        // Utiliser une commande générique pour les autres types de frontend
        const hasYarn = fs.existsSync(path.join(process.cwd(), "frontend", "yarn.lock"));
        command = this.isWindows ? (hasYarn ? "yarn.cmd" : "npm.cmd") : (hasYarn ? "yarn" : "npm");
        args = hasYarn ? ["dev"] : ["run", "dev"];
      }

      // Lancer le processus frontend
      const frontendProcess = spawn(command, args, {
        cwd: path.join(process.cwd(), "frontend"),
        env,
        shell: true,
        stdio: 'pipe'
      });

      // Stocker la référence au processus pour le nettoyage
      this.childProcesses.push({
        name: "frontend",
        process: frontendProcess,
        port: this.frontendPort
      });

      // Gérer la sortie du processus
      frontendProcess.stdout.on('data', (data) => {
        const output = data.toString();

        // Détecter quand le serveur est prêt
        if (output.includes("Compiled") || output.includes("compiled") ||
            output.includes("running at") || output.includes("localhost")) {
          spinner.succeed(`Serveur frontend démarré sur http://localhost:${this.frontendPort}`);
        }

        // Afficher les messages en mode détaillé
        if (this.options.verbose) {
          this.log(chalk.gray("[Frontend] ") + output.trim());
        }
      });

      frontendProcess.stderr.on('data', (data) => {
        const errorOutput = data.toString();

        // Afficher les erreurs critiques
        if (errorOutput.toLowerCase().includes("error")) {
          spinner.fail("Erreur détectée dans le serveur frontend");
          this.log(chalk.red("[Frontend] ") + errorOutput.trim());
        } else if (this.options.verbose) {
          this.log(chalk.yellow("[Frontend] ") + errorOutput.trim());
        }
      });

      frontendProcess.on('close', (code) => {
        if (code !== 0 && code !== null) {
          spinner.fail(`Le serveur frontend s'est arrêté avec le code: ${code}`);
        }
      });

    } catch (error: any) {
      spinner.fail("Erreur lors du démarrage du serveur frontend");
      this.log(chalk.red(`Erreur: ${error.message}`));
    }
  }

  /**
   * Affiche un tableau de bord interactif avec les URLs et commandes disponibles
   */
  displayDashboard() {
    const servicesRunning :any = [];

    if (!this.options.frontend) {
      servicesRunning.push(`${chalk.green('✓')} Backend (Spring Boot): ${chalk.cyan(`http://localhost:${this.backendPort}`)}`);

      // Ajouter l'URL Swagger si disponible
      servicesRunning.push(`  └─ API Documentation: ${chalk.cyan(`http://localhost:${this.backendPort}/swagger-ui.html`)}`);

      // Ajouter l'URL Actuator si disponible
      if (this.checkActuatorEnabled()) {
        servicesRunning.push(`  └─ Monitoring (Actuator): ${chalk.cyan(`http://localhost:${this.backendPort}/actuator`)}`);
      }
    }

    if (this.hasFrontend && !this.options.backend) {
      servicesRunning.push(`${chalk.green('✓')} Frontend (${this.frontendType}): ${chalk.cyan(`http://localhost:${this.frontendPort}`)}`);
    }

    const dashboardBox = boxen(
      `${chalk.bold('🚀 Serveurs en cours d\'exécution')}\n\n` +
      servicesRunning.join('\n') +
      '\n\n' +
      `${chalk.yellow('ℹ')} Utilisez ${chalk.bold('CTRL+C')} pour arrêter les serveurs`,
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'blue',
        backgroundColor: '#000'
      }
    );

    this.log(dashboardBox);
  }

  /**
   * Vérifie si Spring Boot Actuator est activé
   */
  checkActuatorEnabled() {
    // Vérifier dans le pom.xml ou build.gradle
    try {
      if (this.projectType === 'maven') {
        const pomContent = fs.readFileSync(path.join(process.cwd(), 'pom.xml'), 'utf8');
        return pomContent.includes('spring-boot-starter-actuator');
      } else if (this.projectType === 'gradle') {
        const gradlePath = fs.existsSync(path.join(process.cwd(), 'build.gradle.kts'))
          ? path.join(process.cwd(), 'build.gradle.kts')
          : path.join(process.cwd(), 'build.gradle');

        const gradleContent = fs.readFileSync(gradlePath, 'utf8');
        return gradleContent.includes('spring-boot-starter-actuator');
      }
    } catch (e) {
      // En cas d'erreur, supposer qu'Actuator n'est pas activé
    }
    return false;
  }

  /**
   * Arrête proprement tous les processus enfants et sort
   */
  cleanupAndExit() {
    this.log(chalk.yellow("\n🛑 Arrêt des serveurs en cours..."));

    // Arrêter chaque processus
    this.childProcesses.forEach(childProc => {
      try {
        if (this.isWindows) {
          // Sous Windows, trouver et tuer le processus par port
          execSync(`FOR /F "tokens=5" %P IN ('netstat -ano ^| find "LISTENING" ^| find "${childProc.port}"') DO taskkill /F /PID %P`);
        } else {
          // Sous Unix/Linux/Mac
          childProc.process.kill('SIGTERM');
        }
      } catch (e) {
        // Ignorer les erreurs lors de l'arrêt
      }
    });

    // Afficher le message de fin
    displaySectionEnd();
    this.log(chalk.green("✓ Serveurs arrêtés avec succès."));

    // Sortir proprement
    process.exit(0);
  }

  /**
   * Trouve un port disponible en commençant par le port fourni
   */
  async findAvailablePort(startPort: number): Promise<number> {
    return new Promise(resolve => {
      portfinder.getPort({ port: startPort }, (err, port) => {
        resolve(port);
      });
    });
  }

  /**
   * Vérifie si un port est déjà utilisé
   */
  isPortInUse(port: number): Promise<boolean> {
    return new Promise(resolve => {
      const server = net.createServer();

      server.once('error', () => {
        // Le port est déjà utilisé
        resolve(true);
      });

      server.once('listening', () => {
        // Le port est libre, fermer le serveur
        server.close();
        resolve(false);
      });

      server.listen(port);
    });
  }

  /**
   * Ouvre le navigateur avec l'URL spécifiée
   */
  openBrowser(url: string) {
    try {
      // Déterminer la commande d'ouverture selon la plateforme
      let command;

      switch (process.platform) {
        case 'darwin':
          command = `open "${url}"`;
          break;
        case 'win32':
          command = `start "" "${url}"`;
          break;
        default:
          // Linux and others
          command = `xdg-open "${url}"`;
          break;
      }

      execSync(command, { stdio: 'ignore' });
    } catch (e) {
      // Ignorer les erreurs lors de l'ouverture du navigateur
      this.log(chalk.yellow(`⚠️ Impossible d'ouvrir automatiquement le navigateur. Accédez manuellement à ${url}`));
    }
  }
}
