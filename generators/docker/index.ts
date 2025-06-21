/**
 * Générateur Docker pour Spring-Fullstack-Speed
 * Permet de générer des configurations Docker pour un projet Spring Boot existant
 */

import { BaseGenerator } from "../base-generator.js";
import chalk from "chalk";
import path from "path";
import fs from "fs";

// Styles visuels constants
const STEP_PREFIX = chalk.bold.blue("➤ ");
const SECTION_DIVIDER = chalk.gray("────────────────────────────────────────────");
const INFO_COLOR = chalk.yellow;
const SUCCESS_COLOR = chalk.green;
const ERROR_COLOR = chalk.red;

export default class DockerGenerator extends BaseGenerator {
  declare options: any;
  declare answers: any;

  constructor(args: string | string[], options: any) {
    super(args, options);

    // Options pour le générateur Docker
    this.option("app-name", {
      description: "Nom de l'application pour la configuration Docker",
      type: String,
    });

    this.option("frontend", {
      description: "Inclure la configuration pour le frontend",
      type: Boolean,
      default: true,
    });

    this.option("database", {
      description: "Type de base de données (mysql, postgres, mongodb)",
      type: String,
    });
  }

  initializing() {
    this.log(SECTION_DIVIDER);
    this.log(chalk.bold.blue("🐳 GÉNÉRATEUR DOCKER SPRING FULLSTACK"));
    this.log(SECTION_DIVIDER);
    this.log(INFO_COLOR("Ce générateur va créer des configurations Docker pour votre projet Spring Boot"));
    this.log("");
  }

  async prompting() {
    // Utiliser as any pour éviter les erreurs TypeScript lors de l'accès aux propriétés
    const opts = this.options as any;

    // Détection de l'existance d'un projet Spring Boot
    const hasPomXml = fs.existsSync(path.join(process.cwd(), 'pom.xml'));
    const hasGradleFile = fs.existsSync(path.join(process.cwd(), 'build.gradle')) ||
                         fs.existsSync(path.join(process.cwd(), 'build.gradle.kts'));

    if (!hasPomXml && !hasGradleFile) {
      this.log(ERROR_COLOR("⚠️ Aucun fichier pom.xml ou build.gradle trouvé. Ce ne semble pas être un projet Spring Boot."));
      this.log(INFO_COLOR("Vous pouvez continuer, mais la configuration pourrait nécessiter des ajustements manuels."));
    }

    // Détection du frontend
    const hasFrontendFolder = fs.existsSync(path.join(process.cwd(), 'frontend'));

    // Déterminer le type de base de données à partir de application.properties ou application.yml
    let detectedDatabase = this._detectDatabaseType();

    const prompts: any = [
      {
        type: "input",
        name: "appName",
        message: chalk.cyan("Quel est le nom de votre application?"),
        default: opts["app-name"] || path.basename(process.cwd()),
        validate: (input: string) => {
          if (!input || input.trim() === "") {
            return "Le nom de l'application est obligatoire.";
          }
          return true;
        },
      },
      {
        type: "confirm",
        name: "includeFrontend",
        message: chalk.cyan("Voulez-vous inclure la configuration Docker pour le frontend?"),
        default: opts["frontend"] !== undefined ? opts["frontend"] : hasFrontendFolder,
        when: () => hasFrontendFolder,
      },
      {
        type: "list",
        name: "databaseType",
        message: chalk.cyan("Quel type de base de données souhaitez-vous utiliser?"),
        default: opts["database"] || detectedDatabase || "mysql",
        choices: [
          { name: "MySQL", value: "mysql" },
          { name: "PostgreSQL", value: "postgres" },
          { name: "MongoDB", value: "mongodb" },
          { name: "H2 (embarquée, pas besoin de Docker)", value: "h2" },
          { name: "Aucune base de données", value: "none" }
        ],
      },
      {
        type: "confirm",
        name: "includeNginx",
        message: chalk.cyan("Voulez-vous ajouter un serveur Nginx pour le frontend?"),
        default: true,
        when: (answers: any) => answers.includeFrontend || opts["frontend"],
      },
      {
        type: "confirm",
        name: "includeCompose",
        message: chalk.cyan("Voulez-vous générer des fichiers docker-compose?"),
        default: true,
      },
    ];

    this.answers = await this.prompt(prompts);
  }

  _detectDatabaseType(): string | null {
    try {
      // Vérifier application.properties
      const propPath = path.join(process.cwd(), 'src/main/resources/application.properties');
      if (fs.existsSync(propPath)) {
        const content = fs.readFileSync(propPath, 'utf8');

        if (content.includes('jdbc:mysql')) return 'mysql';
        if (content.includes('jdbc:postgresql')) return 'postgres';
        if (content.includes('jdbc:h2')) return 'h2';
        if (content.includes('mongodb')) return 'mongodb';
      }

      // Vérifier application.yml
      const ymlPath = path.join(process.cwd(), 'src/main/resources/application.yml');
      if (fs.existsSync(ymlPath)) {
        const content = fs.readFileSync(ymlPath, 'utf8');

        if (content.includes('jdbc:mysql') || content.includes('mysql')) return 'mysql';
        if (content.includes('jdbc:postgresql') || content.includes('postgres')) return 'postgres';
        if (content.includes('jdbc:h2') || content.includes('h2')) return 'h2';
        if (content.includes('mongodb')) return 'mongodb';
      }
    } catch (error) {
      this.log(ERROR_COLOR(`Erreur lors de la détection du type de base de données: ${error}`));
    }

    return null;
  }

  writing() {
    const { appName, databaseType, includeFrontend, includeNginx, includeCompose } = this.answers;

    this.log("");
    this.log(STEP_PREFIX + chalk.bold("GÉNÉRATION DES FICHIERS DOCKER"));
    this.log(SECTION_DIVIDER);

    // Données pour les templates
    const templateData = {
      appName: appName,
      databaseType: databaseType,
      includeFrontend: includeFrontend,
      includeNginx: includeNginx,
      javaVersion: this._detectJavaVersion(),
      nodeVersion: this._detectNodeVersion(),
    };

    // Création des répertoires pour Docker si nécessaire
    const dockerDirs = [
      "docker",
      "docker/dev"
    ];

    if (includeNginx) {
      dockerDirs.push("nginx", "nginx/conf", "nginx/certs", "nginx/logs");
    }

    dockerDirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        this.log(INFO_COLOR(`📁 Création du répertoire: ${dir}`));
      }
    });

    // Génération du Dockerfile pour le backend
    this.fs.copyTpl(
      this.templatePath("backend/Dockerfile.ejs"),
      this.destinationPath("Dockerfile"),
      templateData
    );
    this.log(SUCCESS_COLOR(`✅ Dockerfile backend généré avec succès`));

    // Génération du Dockerfile pour le frontend si nécessaire
    if (includeFrontend) {
      this.fs.copyTpl(
        this.templatePath("frontend/Dockerfile.ejs"),
        this.destinationPath("frontend/Dockerfile"),
        templateData
      );
      this.log(SUCCESS_COLOR(`✅ Dockerfile frontend généré avec succès`));

      // Configuration Nginx si demandée
      if (includeNginx) {
        this.fs.copyTpl(
          this.templatePath("nginx/default.conf.ejs"),
          this.destinationPath("nginx/conf/default.conf"),
          templateData
        );
        this.log(SUCCESS_COLOR(`✅ Configuration Nginx générée avec succès`));
      }
    }

    // Génération des Dockerfiles de développement
    this.fs.copyTpl(
      this.templatePath("dev/Dockerfile.backend.dev.ejs"),
      this.destinationPath("docker/dev/Dockerfile.backend.dev"),
      templateData
    );
    this.log(SUCCESS_COLOR(`✅ Dockerfile backend de développement généré avec succès`));

    if (includeFrontend) {
      this.fs.copyTpl(
        this.templatePath("dev/Dockerfile.frontend.dev.ejs"),
        this.destinationPath("docker/dev/Dockerfile.frontend.dev"),
        templateData
      );
      this.log(SUCCESS_COLOR(`✅ Dockerfile frontend de développement généré avec succès`));
    }

    // Génération des fichiers docker-compose si demandés
    if (includeCompose) {
      this.fs.copyTpl(
        this.templatePath("docker-compose.yml.ejs"),
        this.destinationPath("docker-compose.yml"),
        templateData
      );

      this.fs.copyTpl(
        this.templatePath("docker-compose.dev.yml.ejs"),
        this.destinationPath("docker-compose.dev.yml"),
        templateData
      );

      this.fs.copyTpl(
        this.templatePath("docker-compose.prod.yml.ejs"),
        this.destinationPath("docker-compose.prod.yml"),
        templateData
      );

      this.log(SUCCESS_COLOR(`✅ Fichiers docker-compose générés avec succès`));

      // Génération du fichier .env pour les variables d'environnement Docker
      const envContent = `# Variables d'environnement pour Docker
# Base de données
DB_USERNAME=user
DB_PASSWORD=password
DB_ROOT_PASSWORD=rootpassword

# Ports de l'application
APP_PORT=80
APP_SSL_PORT=443

# Profil Spring
SPRING_PROFILES_ACTIVE=prod

# Options JVM
JAVA_OPTS=-Xmx512m -Xms256m
`;

      this.fs.write(
        this.destinationPath(".env"),
        envContent
      );
      this.log(SUCCESS_COLOR(`✅ Fichier .env généré avec succès`));
    }

    this.log(SUCCESS_COLOR("🐳 Configuration Docker générée avec succès!"));
  }

  _detectJavaVersion(): string {
    try {
      // Vérifier dans pom.xml
      const pomPath = path.join(process.cwd(), 'pom.xml');
      if (fs.existsSync(pomPath)) {
        const content = fs.readFileSync(pomPath, 'utf8');

        // Chercher la version de Java
        const javaMatch = content.match(/<java.version>(\d+)<\/java.version>/);
        if (javaMatch && javaMatch[1]) {
          return javaMatch[1];
        }
      }

      // Si on ne trouve pas, retourner une version par défaut récente
      return "17";
    } catch (error) {
      return "17";
    }
  }

  _detectNodeVersion(): string {
    try {
      // Vérifier dans package.json du frontend
      const pkgPath = path.join(process.cwd(), 'frontend/package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

        if (pkg.engines && pkg.engines.node) {
          return pkg.engines.node.replace(/[^\d.]/g, ''); // Supprimer tous les caractères non numériques sauf le point
        }
      }

      // Si on ne trouve pas, retourner une version par défaut récente
      return "20";
    } catch (error) {
      return "20";
    }
  }

  end() {
    this.log("");
    this.log(SECTION_DIVIDER);
    this.log(SUCCESS_COLOR(`🐳 Configuration Docker générée avec succès!`));
    this.log(SECTION_DIVIDER);

    this.log(INFO_COLOR("Pour utiliser Docker avec votre application:"));
    this.log("");
    this.log("▶️  Démarrer les conteneurs en développement:");
    this.log("   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up");
    this.log("");
    this.log("▶️  Démarrer les conteneurs en production:");
    this.log("   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d");
    this.log("");
    this.log("▶️  Arrêter les conteneurs:");
    this.log("   docker-compose down");
    this.log("");

    if (this.answers.databaseType !== 'h2' && this.answers.databaseType !== 'none') {
      this.log(INFO_COLOR("⚠️  N'oubliez pas de configurer les informations de connexion à la base de données dans application.properties:"));

      if (this.answers.databaseType === 'mysql') {
        this.log(`
# Configuration MySQL
spring.datasource.url=jdbc:mysql://mysql:3306/${this.answers.appName}?useSSL=false
spring.datasource.username=\${DB_USERNAME}
spring.datasource.password=\${DB_PASSWORD}
        `);
      } else if (this.answers.databaseType === 'postgres') {
        this.log(`
# Configuration PostgreSQL
spring.datasource.url=jdbc:postgresql://postgres:5432/${this.answers.appName}
spring.datasource.username=\${DB_USERNAME}
spring.datasource.password=\${DB_PASSWORD}
        `);
      } else if (this.answers.databaseType === 'mongodb') {
        this.log(`
# Configuration MongoDB
spring.data.mongodb.uri=mongodb://\${DB_USERNAME}:\${DB_PASSWORD}@mongodb:27017/${this.answers.appName}
        `);
      }
    }
  }
}
