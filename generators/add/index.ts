/**
 * Générateur pour la commande 'sfs add'
 * Permet d'ajouter des composants à un projet Spring-Fullstack existant
 */

import { BaseGenerator } from "../base-generator.js";
import chalk from "chalk";
import path from "path";
import fs from "fs";
import { createSpinner, displaySectionTitle, displaySectionEnd, success } from "../../utils/cli-ui.js";
import { showNavigableMenu, withKeyboardInput } from "../../utils/cli-navigation.js";

// Styles visuels constants
const STEP_PREFIX = chalk.bold.blue("➤ ");
const SECTION_DIVIDER = chalk.gray("────────────────────────────────────────────");
const INFO_COLOR = chalk.yellow;
const SUCCESS_COLOR = chalk.green;
const ERROR_COLOR = chalk.red;
const HELP_COLOR = chalk.gray.italic;

// Interface pour les options du générateur
interface AddGeneratorOptions {
  component?: string;
  noPrompt?: boolean;
}

// Types de composants disponibles
const AVAILABLE_COMPONENTS = {
  security: {
    name: "security",
    description: "Spring Security avec JWT et configurations d'authentification",
    dependencies: [
      { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-security" },
      { groupId: "io.jsonwebtoken", artifactId: "jjwt-api", version: "0.11.5" },
      { groupId: "io.jsonwebtoken", artifactId: "jjwt-impl", version: "0.11.5", scope: "runtime" },
      { groupId: "io.jsonwebtoken", artifactId: "jjwt-jackson", version: "0.11.5", scope: "runtime" }
    ],
    files: [
      "src/main/java/{packagePath}/security/jwt/JwtFilter.java",
      "src/main/java/{packagePath}/security/jwt/TokenProvider.java",
      "src/main/java/{packagePath}/security/SecurityConfig.java",
      "src/main/java/{packagePath}/security/AuthoritiesConstants.java",
    ],
    postInstall: async (generator: any) => {
      console.log(chalk.green("✓ Configuration de Spring Security terminée"));
      console.log(chalk.gray("  Vous pouvez maintenant utiliser l'authentification JWT dans votre application."));
    }
  },
  swagger: {
    name: "swagger",
    description: "Documentation API avec Swagger/OpenAPI 3",
    dependencies: [
      { groupId: "org.springdoc", artifactId: "springdoc-openapi-starter-webmvc-ui", version: "2.2.0" }
    ],
    files: [
      "src/main/java/{packagePath}/config/OpenApiConfig.java"
    ],
    postInstall: async (generator: any) => {
      console.log(chalk.green("✓ Configuration de Swagger/OpenAPI terminée"));
      console.log(chalk.gray("  Accédez à la documentation de l'API via: http://localhost:8080/swagger-ui.html"));
    }
  },
  redis: {
    name: "redis",
    description: "Support de cache et sessions avec Redis",
    dependencies: [
      { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-data-redis" },
      { groupId: "org.springframework.session", artifactId: "spring-session-data-redis" }
    ],
    files: [
      "src/main/java/{packagePath}/config/RedisConfig.java",
      "src/main/java/{packagePath}/config/SessionConfig.java"
    ],
    configFiles: [
      "src/main/resources/redis.properties"
    ],
    postInstall: async (generator: any) => {
      console.log(chalk.green("✓ Configuration de Redis terminée"));
      console.log(chalk.gray("  Vérifiez les propriétés dans redis.properties pour configurer la connexion."));
    }
  },
  kafka: {
    name: "kafka",
    description: "Intégration Apache Kafka pour le messaging",
    dependencies: [
      { groupId: "org.springframework.kafka", artifactId: "spring-kafka" }
    ],
    files: [
      "src/main/java/{packagePath}/kafka/KafkaProducerConfig.java",
      "src/main/java/{packagePath}/kafka/KafkaConsumerConfig.java",
      "src/main/java/{packagePath}/kafka/MessageProducer.java",
      "src/main/java/{packagePath}/kafka/MessageConsumer.java"
    ],
    configFiles: [
      "src/main/resources/kafka.properties"
    ],
    postInstall: async (generator: any) => {
      console.log(chalk.green("✓ Configuration de Kafka terminée"));
      console.log(chalk.gray("  Vérifiez les propriétés dans kafka.properties pour configurer les brokers."));
    }
  },
  elasticsearch: {
    name: "elasticsearch",
    description: "Intégration Elasticsearch pour la recherche",
    dependencies: [
      { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-data-elasticsearch" }
    ],
    files: [
      "src/main/java/{packagePath}/search/ElasticsearchConfig.java",
      "src/main/java/{packagePath}/search/SearchService.java"
    ],
    configFiles: [
      "src/main/resources/elasticsearch.properties"
    ],
    postInstall: async (generator: any) => {
      console.log(chalk.green("✓ Configuration d'Elasticsearch terminée"));
    }
  },
  monitoring: {
    name: "monitoring",
    description: "Monitoring avec Spring Actuator, Micrometer et Prometheus",
    dependencies: [
      { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-actuator" },
      { groupId: "io.micrometer", artifactId: "micrometer-registry-prometheus" }
    ],
    files: [
      "src/main/java/{packagePath}/config/MetricsConfig.java"
    ],
    configFiles: [
      "src/main/resources/actuator.properties"
    ],
    postInstall: async (generator: any) => {
      console.log(chalk.green("✓ Configuration du monitoring terminée"));
      console.log(chalk.gray("  Accédez aux métriques via: http://localhost:8080/actuator"));
    }
  },
  notifications: {
    name: "notifications",
    description: "Service de notifications (email, push, templates)",
    dependencies: [
      { groupId: "org.springframework.boot", artifactId: "spring-boot-starter-mail" }
    ],
    files: [
      "src/main/java/{packagePath}/notification/EmailService.java",
      "src/main/java/{packagePath}/notification/NotificationController.java",
      "src/main/java/{packagePath}/notification/dto/EmailDTO.java",
      "src/main/resources/templates/emails/welcome.html"
    ],
    postInstall: async (generator: any) => {
      console.log(chalk.green("✓ Configuration du service de notifications terminée"));
    }
  }
};

/**
 * Générateur pour ajouter des composants à un projet existant
 */
export default class AddGenerator extends BaseGenerator {
  // Déclaration des options avec les types corrects
  declare options: any;
  selectedComponents: string[] = [];
  projectDetails: any = {};

  constructor(args: string[], options: any) {
    super(args, options);
    
    // Définition des options de la commande
    this.option("component", {
      type: String,
      description: "Composant(s) à ajouter (séparés par des virgules)",
      alias: "c"
    });

    this.option("noPrompt", {
      type: Boolean,
      description: "Ne pas afficher de prompt interactif",
      default: false
    });
  }

  /**
   * Initialisation du générateur
   */
  async initializing() {
    displaySectionTitle("Ajout de composants au projet Spring-Fullstack");

    // Vérifier que nous sommes dans un projet Spring-Fullstack
    if (!this.isSpringFullstackProject()) {
      this.log(ERROR_COLOR("❌ Ce n'est pas un projet Spring-Fullstack valide. Exécutez cette commande à la racine d'un projet généré par Spring-Fullstack."));
      // Utiliser this.env.error est déconseillé, utiliser plutôt process.exit
      process.exit(1);
      return;
    }

    // Charger les détails du projet
    await this.loadProjectDetails();

    this.log(INFO_COLOR(`Projet détecté: ${this.projectDetails.name}`));
    this.log(INFO_COLOR(`Package: ${this.projectDetails.packageName}`));
    this.log(INFO_COLOR(`Type de build: ${this.projectDetails.buildTool}`));
    this.log(SECTION_DIVIDER);
  }

  /**
   * Invite l'utilisateur à choisir les composants
   */
  async prompting() {
    // Si des composants sont spécifiés en ligne de commande
    if (this.options.component) {
      const components = this.options.component.split(',');

      // Valider les composants spécifiés
      const invalidComponents = components.filter(
        c => !Object.keys(AVAILABLE_COMPONENTS).includes(c)
      );

      if (invalidComponents.length > 0) {
        this.log(ERROR_COLOR(`❌ Composant(s) invalide(s): ${invalidComponents.join(', ')}\nComposants disponibles: ${Object.keys(AVAILABLE_COMPONENTS).join(', ')}`));
        process.exit(1);
        return;
      }

      this.selectedComponents = components;
    }
    // Sinon, afficher un menu interactif
    else if (!this.options.noPrompt) {
      // Afficher la liste des composants disponibles avec descriptions
      const choices = Object.values(AVAILABLE_COMPONENTS).map(comp => ({
        name: `${comp.name} - ${comp.description}`,
        value: comp.name,
        checked: false
      }));

      await withKeyboardInput(async () => {
        // Utiliser la méthode prompt avec le type correct
        const answers = await this.prompt({
          type: 'checkbox',
          name: 'components',
          message: chalk.bold('Sélectionnez les composants à ajouter:'),
          choices: choices
        });

        this.selectedComponents = answers.components;
      });
    }

    // Si aucun composant sélectionné, afficher l'aide
    if (!this.selectedComponents.length) {
      this.log(ERROR_COLOR("❌ Aucun composant sélectionné. Utilisez --component=<nom> ou sélectionnez-en via le menu interactif."));
      process.exit(1);
      return;
    }

    // Confirmer les choix
    this.log(INFO_COLOR(`Composants à installer: ${this.selectedComponents.join(', ')}`));

    if (!this.options.noPrompt) {
      const confirmationAnswer = await this.prompt({
        type: 'confirm',
        name: 'confirm',
        message: chalk.bold('Voulez-vous continuer?'),
        default: true
      });

      if (!confirmationAnswer.confirm) {
        this.log(INFO_COLOR("❌ Opération annulée par l'utilisateur."));
        process.exit(0);
        return;
      }
    }
  }

  /**
   * Installation des composants sélectionnés
   */
  async writing() {
    for (const componentName of this.selectedComponents) {
      const component = AVAILABLE_COMPONENTS[componentName as keyof typeof AVAILABLE_COMPONENTS];

      if (!component) {
        continue;
      }

      const spinner = createSpinner({
        text: `Installation du composant ${component.name}...`,
        color: 'primary'
      });

      spinner.start();

      try {
        await this.installComponent(component);
        spinner.succeed(`Composant ${component.name} installé avec succès`);
      } catch (err) {
        spinner.fail(`Erreur lors de l'installation du composant ${component.name}`);
        console.error(ERROR_COLOR(`Détails: ${err}`));
      }
    }
  }

  /**
   * Étape finale avec messages de succès et instructions
   */
  async end() {
    if (this.selectedComponents.length > 0) {
      this.log(SUCCESS_COLOR("\n✓ Installation des composants terminée!\n"));

      // Conseils post-installation
      displaySectionTitle("Prochaines étapes");

      if (this.projectDetails.buildTool === "Maven") {
        this.log("• Exécutez " + chalk.cyan("mvn clean install") + " pour compiler votre projet avec les nouvelles dépendances");
      } else {
        this.log("• Exécutez " + chalk.cyan("./gradlew build") + " pour compiler votre projet avec les nouvelles dépendances");
      }

      this.log("• Consultez la documentation des composants ajoutés pour plus d'informations");
      displaySectionEnd();
    }
  }

  /**
   * Vérifie si le répertoire actuel est un projet Spring-Fullstack valide
   */
  private isSpringFullstackProject(): boolean {
    // Vérifier la présence des fichiers caractéristiques d'un projet Spring Boot
    const pomExists = fs.existsSync(path.join(process.cwd(), "pom.xml"));
    const gradleExists = fs.existsSync(path.join(process.cwd(), "build.gradle")) ||
                        fs.existsSync(path.join(process.cwd(), "build.gradle.kts"));
    const applicationClassExists = this.hasSpringBootApplicationClass();

    return (pomExists || gradleExists) && applicationClassExists;
  }

  /**
   * Recherche la classe principale annotée avec @SpringBootApplication
   */
  private hasSpringBootApplicationClass(): boolean {
    // Chercher dans le dossier src/main/java
    const srcMainJava = path.join(process.cwd(), "src", "main", "java");

    if (!fs.existsSync(srcMainJava)) {
      return false;
    }

    // Recherche récursive
    const findApplicationClass = (dir: string): boolean => {
      const files = fs.readdirSync(dir);

      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          const found = findApplicationClass(filePath);
          if (found) return true;
        }
        else if (file.endsWith(".java")) {
          const content = fs.readFileSync(filePath, "utf8");
          if (content.includes("@SpringBootApplication")) {
            return true;
          }
        }
      }

      return false;
    };

    return findApplicationClass(srcMainJava);
  }

  /**
   * Charge les détails du projet à partir des fichiers de configuration
   */
  private async loadProjectDetails() {
    // Déterminer l'outil de build
    if (fs.existsSync(path.join(process.cwd(), "pom.xml"))) {
      this.projectDetails.buildTool = "Maven";
      // Extraire les informations du pom.xml
      const pomContent = fs.readFileSync(path.join(process.cwd(), "pom.xml"), "utf8");
      const groupIdMatch = pomContent.match(/<groupId>(.*?)<\/groupId>/);
      const artifactIdMatch = pomContent.match(/<artifactId>(.*?)<\/artifactId>/);

      if (groupIdMatch && artifactIdMatch) {
        this.projectDetails.packageName = groupIdMatch[1];
        this.projectDetails.name = artifactIdMatch[1];
      }
    } else {
      this.projectDetails.buildTool = "Gradle";
      // Extraire les informations du build.gradle
      // Cette partie est simplifiée et pourrait nécessiter une analyse plus précise
      // des fichiers build.gradle / settings.gradle
      const settingsGradleExists = fs.existsSync(path.join(process.cwd(), "settings.gradle")) ||
                                 fs.existsSync(path.join(process.cwd(), "settings.gradle.kts"));

      if (settingsGradleExists) {
        const settingsContent = fs.readFileSync(
          fs.existsSync(path.join(process.cwd(), "settings.gradle"))
            ? path.join(process.cwd(), "settings.gradle")
            : path.join(process.cwd(), "settings.gradle.kts"),
          "utf8"
        );

        const rootProjectNameMatch = settingsContent.match(/rootProject\.name\s*=\s*['"](.*)['"]/);

        if (rootProjectNameMatch) {
          this.projectDetails.name = rootProjectNameMatch[1];
        }
      }

      // Rechercher le package principal dans la classe Application
      // (Analyse simplifiée)
      const srcMainJava = path.join(process.cwd(), "src", "main", "java");

      if (fs.existsSync(srcMainJava)) {
        const findPackageName = (dir: string): string | null => {
          const files = fs.readdirSync(dir);

          for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
              const found = findPackageName(filePath);
              if (found) return found;
            }
            else if (file.endsWith(".java") && file.includes("Application")) {
              const content = fs.readFileSync(filePath, "utf8");
              const packageMatch = content.match(/package\s+(.*?);/);

              if (packageMatch) {
                return packageMatch[1];
              }
            }
          }

          return null;
        };

        this.projectDetails.packageName = findPackageName(srcMainJava) || "com.example";

        if (!this.projectDetails.name) {
          // Extraire le nom du projet à partir du chemin
          this.projectDetails.name = path.basename(process.cwd());
        }
      }
    }

    // Valeurs par défaut si non trouvées
    if (!this.projectDetails.name) {
      this.projectDetails.name = "spring-application";
    }

    if (!this.projectDetails.packageName) {
      this.projectDetails.packageName = "com.example.application";
    }
  }

  /**
   * Installe un composant dans le projet
   * @param component Définition du composant à installer
   */
  private async installComponent(component: any) {
    // 1. Ajouter les dépendances dans pom.xml ou build.gradle
    await this.addComponentDependencies(component.dependencies);

    // 2. Copier les fichiers du composant
    if (component.files && component.files.length > 0) {
      await this.copyComponentFiles(component.files, component.name);
    }

    // 3. Copier les fichiers de configuration
    if (component.configFiles && component.configFiles.length > 0) {
      await this.copyConfigFiles(component.configFiles, component.name);
    }

    // 4. Exécuter le script post-installation
    if (component.postInstall && typeof component.postInstall === 'function') {
      await component.postInstall(this);
    }
  }

  /**
   * Ajoute les dépendances au fichier de build (pom.xml ou build.gradle)
   * Méthode renommée pour éviter les conflits avec la méthode héritée
   * @param dependencies Liste des dépendances à ajouter
   */
  private async addComponentDependencies(dependencies: any[]) {
    if (!dependencies || dependencies.length === 0) {
      return;
    }

    if (this.projectDetails.buildTool === "Maven") {
      await this.addMavenDependencies(dependencies);
    } else {
      await this.addGradleDependencies(dependencies);
    }
  }

  /**
   * Ajoute des dépendances à un fichier pom.xml
   * @param dependencies Liste des dépendances Maven
   */
  private async addMavenDependencies(dependencies: any[]) {
    const pomPath = path.join(process.cwd(), "pom.xml");

    if (!fs.existsSync(pomPath)) {
      throw new Error("Fichier pom.xml introuvable");
    }

    let pomContent = fs.readFileSync(pomPath, "utf8");

    // Insérer les dépendances avant la balise </dependencies>
    dependencies.forEach(dep => {
      // Vérifier si la dépendance existe déjà
      const depRegex = new RegExp(
        `<artifactId>${dep.artifactId}<\\/artifactId>`,
        'i'
      );

      if (pomContent.match(depRegex)) {
        console.log(INFO_COLOR(`La dépendance ${dep.artifactId} existe déjà, ignorée.`));
        return;
      }

      const depXml = `
        <dependency>
            <groupId>${dep.groupId}</groupId>
            <artifactId>${dep.artifactId}</artifactId>
            ${dep.version ? `<version>${dep.version}</version>` : ''}
            ${dep.scope ? `<scope>${dep.scope}</scope>` : ''}
        </dependency>`;

      pomContent = pomContent.replace('</dependencies>', `${depXml}\n    </dependencies>`);
    });

    fs.writeFileSync(pomPath, pomContent);
  }

  /**
   * Ajoute des dépendances à un fichier build.gradle ou build.gradle.kts
   * @param dependencies Liste des dépendances Gradle
   */
  private async addGradleDependencies(dependencies: any[]) {
    const gradlePath = fs.existsSync(path.join(process.cwd(), "build.gradle"))
      ? path.join(process.cwd(), "build.gradle")
      : path.join(process.cwd(), "build.gradle.kts");

    if (!fs.existsSync(gradlePath)) {
      throw new Error("Fichier build.gradle/build.gradle.kts introuvable");
    }

    let gradleContent = fs.readFileSync(gradlePath, "utf8");
    const isKotlinDSL = gradlePath.endsWith(".kts");

    // Trouver le bloc de dépendances
    if (!gradleContent.includes("dependencies {")) {
      console.error(ERROR_COLOR("Bloc de dépendances introuvable dans le fichier build.gradle"));
      return;
    }

    let depBlock = "dependencies {\n";

    dependencies.forEach(dep => {
      // Formater la dépendance selon le format (Kotlin DSL ou Groovy)
      let depLine;

      if (isKotlinDSL) {
        if (dep.version) {
          depLine = `    implementation("${dep.groupId}:${dep.artifactId}:${dep.version}")`;
        } else {
          depLine = `    implementation("${dep.groupId}:${dep.artifactId}")`;
        }
      } else {
        if (dep.version) {
          depLine = `    implementation '${dep.groupId}:${dep.artifactId}:${dep.version}'`;
        } else {
          depLine = `    implementation '${dep.groupId}:${dep.artifactId}'`;
        }
      }

      // Vérifier si la dépendance existe déjà
      if (gradleContent.includes(dep.artifactId)) {
        console.log(INFO_COLOR(`La dépendance ${dep.artifactId} existe déjà, ignorée.`));
        return;
      }

      depBlock += depLine + "\n";
    });

    // Ajouter les nouvelles dépendances à la fin du bloc
    gradleContent = gradleContent.replace(
      /dependencies\s*\{[^}]*\}/,
      match => match.slice(0, -1) + depBlock.substring("dependencies {\n".length)
    );

    fs.writeFileSync(gradlePath, gradleContent);
  }

  /**
   * Copie les fichiers du composant en remplaçant les variables
   * @param files Liste des fichiers à copier
   * @param componentName Nom du composant
   */
  private async copyComponentFiles(files: string[], componentName: string) {
    // Obtenir le chemin du template pour ce composant
    const componentTemplateDir = this.templatePath(componentName);

    // Créer le chemin du package
    const packagePath = this.projectDetails.packageName.replace(/\./g, "/");

    for (const file of files) {
      // Remplacer la variable {packagePath} par le chemin réel
      const destFile = file.replace("{packagePath}", packagePath);

      // Assurer que le répertoire de destination existe
      const destDir = path.dirname(path.join(process.cwd(), destFile));
      fs.mkdirSync(destDir, { recursive: true });

      // Chemin source du template
      const srcFile = path.join(componentTemplateDir, path.basename(file));

      // Copier le fichier avec templating
      this.fs.copyTpl(
        this.templatePath(srcFile),
        this.destinationPath(destFile),
        {
          packageName: this.projectDetails.packageName,
          basePackage: this.projectDetails.packageName,
          projectName: this.projectDetails.name
        }
      );
    }
  }

  /**
   * Copie les fichiers de configuration du composant
   * @param configFiles Liste des fichiers de configuration
   * @param componentName Nom du composant
   */
  private async copyConfigFiles(configFiles: string[], componentName: string) {
    const configTemplateDir = path.join(this.templatePath(componentName), "config");

    for (const file of configFiles) {
      const destFile = file;

      // Assurer que le répertoire de destination existe
      const destDir = path.dirname(path.join(process.cwd(), destFile));
      fs.mkdirSync(destDir, { recursive: true });

      // Chemin source du template
      const srcFile = path.join(configTemplateDir, path.basename(file));

      // Copier le fichier avec templating
      this.fs.copyTpl(
        this.templatePath(srcFile),
        this.destinationPath(destFile),
        {
          packageName: this.projectDetails.packageName,
          basePackage: this.projectDetails.packageName,
          projectName: this.projectDetails.name
        }
      );
    }
  }
}
