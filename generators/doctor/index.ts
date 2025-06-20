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
        if (nameMatch && nameMatch[1]) {
          this.projectDetails.name = nameMatch[1];
        }

        // Extraire le package principal
        const groupIdMatch = pomContent.match(/<groupId>(.*?)<\/groupId>/);
        if (groupIdMatch && groupIdMatch[1]) {
          this.projectDetails.packageName = groupIdMatch[1];
        }

        // Extraire la version de Spring Boot
        const springBootMatch = pomContent.match(/<parent>[\s\S]*?<artifactId>spring-boot-starter-parent<\/artifactId>[\s\S]*?<version>(.*?)<\/version>/);
        if (springBootMatch && springBootMatch[1]) {
          this.projectDetails.springBootVersion = springBootMatch[1];
        }
      } catch (e) {
        // Ignorer les erreurs de parsing
      }
    } else if (fs.existsSync(path.join(process.cwd(), "build.gradle")) || fs.existsSync(path.join(process.cwd(), "build.gradle.kts"))) {
      this.projectDetails.buildTool = fs.existsSync(path.join(process.cwd(), "build.gradle.kts")) ? "Gradle (Kotlin DSL)" : "Gradle";

      try {
        const gradleFilePath = fs.existsSync(path.join(process.cwd(), "build.gradle.kts"))
          ? path.join(process.cwd(), "build.gradle.kts")
          : path.join(process.cwd(), "build.gradle");

        const gradleContent = fs.readFileSync(gradleFilePath, "utf8");

        // Extraire le nom du projet
        const nameMatch = gradleContent.match(/rootProject\.name\s*=\s*["'](.+?)["']/);
        if (nameMatch && nameMatch[1]) {
          this.projectDetails.name = nameMatch[1];
        }

        // Extraire le package principal
        const groupMatch = gradleContent.match(/group\s*=\s*["'](.+?)["']/);
        if (groupMatch && groupMatch[1]) {
          this.projectDetails.packageName = groupMatch[1];
        }

        // Extraire la version de Spring Boot
        const springBootMatch = gradleContent.match(/org\.springframework\.boot['"]\s*version\s*["'](.+?)["']/);
        if (springBootMatch && springBootMatch[1]) {
          this.projectDetails.springBootVersion = springBootMatch[1];
        }
      } catch (e) {
        // Ignorer les erreurs de parsing
      }
    }

    // Détecter la structure du projet
    if (fs.existsSync(path.join(process.cwd(), "src", "main", "java"))) {
      this.projectDetails.hasBackend = true;
    }

    if (fs.existsSync(path.join(process.cwd(), "src", "main", "resources", "static")) ||
        fs.existsSync(path.join(process.cwd(), "frontend"))) {
      this.projectDetails.hasFrontend = true;
    }
  }

  /**
   * Exécute tous les diagnostics
   */
  async runDiagnostics() {

    const spinner = createSpinner({
      text: "Exécution des diagnostics...",
      color: "primary"
    });


    try {
      await this.checkBuildConfiguration();
      await this.checkDependencies();
      await this.checkApplicationProperties();
      await this.checkDatabaseConfiguration();
      await this.checkCodeQuality();
      await this.checkSecurityIssues();
      await this.checkFrontendConfiguration();

      spinner.succeed("Diagnostics terminés");
    } catch (e:any) {
      spinner.fail("Erreur lors des diagnostics");
      this.log(chalk.red(`Erreur: ${e.message}`));
    }
  }

  /**
   * Phase principale d'exécution
   */
  async prompting() {
    // Exécuter les diagnostics
    await this.runDiagnostics();

    // Afficher les résultats
    this.displayIssues();

    // Si l'option fix est activée, tenter de corriger automatiquement
    if (this.options.fix) {
      await this.fixIssues();
    }
    // Sinon, proposer la correction interactive
    else if (this.issues.filter(i => i.fixable).length > 0) {
      const { shouldFix } = await this.prompt({
        type: 'confirm',
        name: 'shouldFix',
        message: 'Voulez-vous tenter de corriger automatiquement les problèmes fixables?',
        default: false
      });

      if (shouldFix) {
        await this.fixIssues();
      }
    }
  }

  /**
   * Vérification de la configuration de build
   */
  async checkBuildConfiguration() {
    // Vérifier la présence du fichier de build
    if (!this.projectDetails.buildTool) {
      this.issues.push({
        id: 'missing-build-config',
        level: 'error',
        message: 'Aucun fichier de configuration de build trouvé (pom.xml ou build.gradle)',
        details: 'Le projet doit contenir un fichier de configuration Maven ou Gradle valide.',
        fixable: false
      });
      return;
    }

    // Vérifier les plugins essentiels
    if (this.projectDetails.buildTool.includes('Maven')) {
      const pomPath = path.join(process.cwd(), "pom.xml");
      const pomContent = fs.readFileSync(pomPath, "utf8");

      if (!pomContent.includes('spring-boot-maven-plugin')) {
        this.issues.push({
          id: 'missing-spring-boot-maven-plugin',
          level: 'warning',
          message: 'spring-boot-maven-plugin manquant',
          details: 'Ce plugin est nécessaire pour créer un JAR exécutable.',
          fixable: true,
          fix: async () => {
            let newPomContent = pomContent;
            // Ajouter le plugin s'il n'existe pas déjà
            if (!newPomContent.includes('<plugins>')) {
              newPomContent = newPomContent.replace('</build>', `  <plugins>
    <plugin>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-maven-plugin</artifactId>
    </plugin>
  </plugins>
</build>`);
            } else if (!newPomContent.includes('spring-boot-maven-plugin')) {
              newPomContent = newPomContent.replace('<plugins>', `<plugins>
    <plugin>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-maven-plugin</artifactId>
    </plugin>`);
            }
            fs.writeFileSync(pomPath, newPomContent);
          }
        });
      }
    } else if (this.projectDetails.buildTool.includes('Gradle')) {
      const isKotlinDSL = this.projectDetails.buildTool.includes('Kotlin');
      const gradlePath = isKotlinDSL
        ? path.join(process.cwd(), "build.gradle.kts")
        : path.join(process.cwd(), "build.gradle");

      const gradleContent = fs.readFileSync(gradlePath, "utf8");

      if (!gradleContent.includes('org.springframework.boot')) {
        this.issues.push({
          id: 'missing-spring-boot-gradle-plugin',
          level: 'warning',
          message: 'Plugin Spring Boot Gradle manquant',
          details: 'Ce plugin est nécessaire pour créer un JAR exécutable.',
          fixable: true,
          fix: async () => {
            let newContent = gradleContent;
            const pluginSection = isKotlinDSL
              ? 'plugins {\n    id("org.springframework.boot") version "2.7.0"\n    id("io.spring.dependency-management") version "1.0.11.RELEASE"\n'
              : 'plugins {\n    id \'org.springframework.boot\' version \'2.7.0\'\n    id \'io.spring.dependency-management\' version \'1.0.11.RELEASE\'\n';

            if (!newContent.includes('plugins {')) {
              newContent = pluginSection + '}\n\n' + newContent;
            } else if (!newContent.includes('org.springframework.boot')) {
              newContent = newContent.replace('plugins {', pluginSection);
            }

            fs.writeFileSync(gradlePath, newContent);
          }
        });
      }
    }
  }

  /**
   * Vérification des dépendances
   */
  async checkDependencies() {
    const appPropertiesPath = path.join(process.cwd(), "src", "main", "resources", "application.properties");
    const appYmlPath = path.join(process.cwd(), "src", "main", "resources", "application.yml");

    // Vérifier si la configuration de base de données est spécifiée sans la dépendance appropriée
    if ((fs.existsSync(appPropertiesPath) || fs.existsSync(appYmlPath))) {
      const configPath = fs.existsSync(appPropertiesPath) ? appPropertiesPath : appYmlPath;
      const configContent = fs.readFileSync(configPath, 'utf8');

      // Vérifier JPA/Hibernate config
      if (configContent.includes('hibernate') || configContent.includes('jpa')) {
        const hasDependency = await this.checkDependencyExists('spring-boot-starter-data-jpa');

        if (!hasDependency) {
          this.issues.push({
            id: 'missing-jpa-dependency',
            level: 'error',
            message: 'Configuration JPA présente mais dépendance manquante',
            details: 'Le projet contient une configuration JPA/Hibernate mais pas la dépendance spring-boot-starter-data-jpa.',
            fixable: true,
            fix: async () => {
              await this.addDependency('org.springframework.boot', 'spring-boot-starter-data-jpa');
            }
          });
        }
      }

      // Vérifier la configuration Web
      if (configContent.includes('server.port') || configContent.includes('server:')) {
        const hasDependency = await this.checkDependencyExists('spring-boot-starter-web');

        if (!hasDependency) {
          this.issues.push({
            id: 'missing-web-dependency',
            level: 'error',
            message: 'Configuration web présente mais dépendance manquante',
            details: 'Le projet contient une configuration web mais pas la dépendance spring-boot-starter-web.',
            fixable: true,
            fix: async () => {
              await this.addDependency('org.springframework.boot', 'spring-boot-starter-web');
            }
          });
        }
      }
    }
  }

  /**
   * Vérification des fichiers de configuration
   */
  async checkApplicationProperties() {
    const appPropertiesPath = path.join(process.cwd(), "src", "main", "resources", "application.properties");
    const appYmlPath = path.join(process.cwd(), "src", "main", "resources", "application.yml");

    // Vérifier si le fichier de configuration existe
    if (!fs.existsSync(appPropertiesPath) && !fs.existsSync(appYmlPath)) {
      this.issues.push({
        id: 'missing-application-config',
        level: 'warning',
        message: 'Fichier de configuration application.properties/yml manquant',
        details: 'Un projet Spring Boot devrait avoir un fichier de configuration.',
        fixable: true,
        fix: async () => {
          const resourcesDir = path.join(process.cwd(), "src", "main", "resources");
          if (!fs.existsSync(resourcesDir)) {
            fs.mkdirSync(resourcesDir, { recursive: true });
          }

          fs.writeFileSync(appYmlPath, `# Configuration Spring Boot
spring:
  application:
    name: ${this.projectDetails.name || 'spring-application'}
  
server:
  port: 8080

# Logging
logging:
  level:
    root: INFO
    ${this.projectDetails.packageName || 'com.example'}: DEBUG
`);
        }
      });
    }
  }

  /**
   * Vérification de la configuration de base de données
   */
  async checkDatabaseConfiguration() {
    // Vérifier si la configuration de base de données est correctement définie
    const appPropertiesPath = path.join(process.cwd(), "src", "main", "resources", "application.properties");
    const appYmlPath = path.join(process.cwd(), "src", "main", "resources", "application.yml");

    if (fs.existsSync(appPropertiesPath) || fs.existsSync(appYmlPath)) {
      const configPath = fs.existsSync(appPropertiesPath) ? appPropertiesPath : appYmlPath;
      const configContent = fs.readFileSync(configPath, 'utf8');

      // Vérifier si des propriétés de base de données sont spécifiées
      const hasDbConfig = configContent.includes('datasource') ||
                          configContent.includes('jdbc:') ||
                          configContent.includes('spring.datasource');

      // Vérifier si JPA est présent, mais sans configuration DB
      const hasJpa = await this.checkDependencyExists('spring-boot-starter-data-jpa');

      if (hasJpa && !hasDbConfig) {
        this.issues.push({
          id: 'missing-db-config',
          level: 'warning',
          message: 'Configuration de base de données manquante pour JPA',
          details: 'JPA est présent mais il n\'y a pas de configuration de datasource.',
          fixable: true,
          fix: async () => {
            // Ajouter une configuration H2 par défaut
            if (configPath.endsWith('.yml')) {
              let ymlContent = fs.readFileSync(configPath, 'utf8');
              const dbConfig = `
spring:
  datasource:
    url: jdbc:h2:mem:testdb
    username: sa
    password: password
    driver-class-name: org.h2.Driver
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
`;
              if (!ymlContent.includes('spring:')) {
                ymlContent = 'spring:\n' + ymlContent;
              }
              if (ymlContent.includes('spring:') && !ymlContent.includes('datasource:')) {
                ymlContent = ymlContent.replace('spring:', 'spring:' + dbConfig);
              }
              fs.writeFileSync(configPath, ymlContent);
            } else {
              let propertiesContent = fs.readFileSync(configPath, 'utf8');
              const dbConfig = `
# Configuration de la base de données
spring.datasource.url=jdbc:h2:mem:testdb
spring.datasource.username=sa
spring.datasource.password=password
spring.datasource.driver-class-name=org.h2.Driver
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
`;
              fs.writeFileSync(configPath, propertiesContent + dbConfig);
            }

            // Ajouter la dépendance H2 si nécessaire
            const hasH2 = await this.checkDependencyExists('h2');
            if (!hasH2) {
              await this.addDependency('com.h2database', 'h2', 'runtime');
            }
          }
        });
      }
    }
  }

  /**
   * Vérification de la qualité du code
   */
  async checkCodeQuality() {
    // Vérifier la présence de tests
    const testDir = path.join(process.cwd(), "src", "test");
    if (!fs.existsSync(testDir) || !fs.readdirSync(testDir, { recursive: true }).length) {
      this.issues.push({
        id: 'missing-tests',
        level: 'warning',
        message: 'Tests unitaires manquants',
        details: 'Aucun test unitaire n\'a été trouvé dans le projet.',
        fixable: false
      });
    }

    // Vérifier la présence de Lombok sans configuration
    const hasLombok = await this.checkDependencyExists('lombok');
    const hasLombokConfig = fs.existsSync(path.join(process.cwd(), "lombok.config"));

    if (hasLombok && !hasLombokConfig) {
      this.issues.push({
        id: 'missing-lombok-config',
        level: 'info',
        message: 'Configuration Lombok manquante',
        details: 'Il est recommandé d\'avoir un fichier lombok.config pour une meilleure configuration.',
        fixable: true,
        fix: async () => {
          fs.writeFileSync(path.join(process.cwd(), "lombok.config"),
`# Configuration Lombok
lombok.addLombokGeneratedAnnotation = true
lombok.anyConstructor.addConstructorProperties = true
lombok.nonNull.exceptionType = IllegalArgumentException
`);
        }
      });
    }
  }

  /**
   * Vérification des problèmes de sécurité
   */
  async checkSecurityIssues() {
    // Vérifier si Spring Security est configuré correctement
    const hasSecurity = await this.checkDependencyExists('spring-boot-starter-security');

    if (hasSecurity) {
      // Vérifier si les fichiers de configuration sont présents
      const securityConfigs = await this.findFiles("**/SecurityConfig*.java");

      if (securityConfigs.length === 0) {
        this.issues.push({
          id: 'missing-security-config',
          level: 'warning',
          message: 'Configuration Spring Security manquante',
          details: 'Spring Security est présent mais aucune classe de configuration n\'a été trouvée.',
          fixable: false
        });
      }
    }

    // Vérifier les identifiants codés en dur
    const appPropertiesPath = path.join(process.cwd(), "src", "main", "resources", "application.properties");
    const appYmlPath = path.join(process.cwd(), "src", "main", "resources", "application.yml");

    if (fs.existsSync(appPropertiesPath) || fs.existsSync(appYmlPath)) {
      const configPath = fs.existsSync(appPropertiesPath) ? appPropertiesPath : appYmlPath;
      const configContent = fs.readFileSync(configPath, 'utf8');

      // Recherche de mots de passe non-cryptés
      if (configContent.match(/(password|secret|key)\s*[:=]\s*[^\s${}][^\n]+/)) {
        this.issues.push({
          id: 'hardcoded-credentials',
          level: 'error',
          message: 'Identifiants codés en dur dans les fichiers de configuration',
          details: 'Les mots de passe et secrets devraient être externalisés ou chiffrés.',
          fixable: false
        });
      }
    }
  }

  /**
   * Vérifier la configuration frontend
   */
  async checkFrontendConfiguration() {
    // Vérifier si le projet a un frontend
    if (this.projectDetails.hasFrontend) {
      // Vérifier le dossier frontend Angular
      if (fs.existsSync(path.join(process.cwd(), "frontend")) &&
          fs.existsSync(path.join(process.cwd(), "frontend", "package.json"))) {

        try {
          const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), "frontend", "package.json"), 'utf8'));

          // Vérifier si le frontend est configuré pour le proxy
          const hasProxyConfig = fs.existsSync(path.join(process.cwd(), "frontend", "proxy.conf.json"));

          if (!hasProxyConfig) {
            this.issues.push({
              id: 'missing-proxy-config',
              level: 'warning',
              message: 'Configuration de proxy frontend manquante',
              details: 'Un frontend Angular devrait avoir une configuration de proxy pour se connecter au backend.',
              fixable: true,
              fix: async () => {
                const proxyConfig = {
                  "/api": {
                    "target": "http://localhost:8080",
                    "secure": false,
                    "changeOrigin": true
                  }
                };

                fs.writeFileSync(
                  path.join(process.cwd(), "frontend", "proxy.conf.json"),
                  JSON.stringify(proxyConfig, null, 2)
                );
              }
            });
          }
        } catch (e) {
          // Ignorer les erreurs de parsing du package.json
        }
      }
    }
  }

  /**
   * Affiche les problèmes détectés
   */
  displayIssues() {
    const errorCount = this.issues.filter(i => i.level === 'error').length;
    const warningCount = this.issues.filter(i => i.level === 'warning').length;
    const infoCount = this.issues.filter(i => i.level === 'info').length;
    const fixableCount = this.issues.filter(i => i.fixable).length;

    this.log(chalk.bold('\nRésumé du diagnostic:'));
    this.log(`${chalk.red(`${errorCount} erreur(s)`)}, ${chalk.yellow(`${warningCount} avertissement(s)`)}, ${chalk.blue(`${infoCount} suggestion(s)`)} - ${chalk.green(`${fixableCount} problème(s) peuvent être corrigé(s) automatiquement`)}\n`);

    if (this.issues.length === 0) {
      this.log(boxen(chalk.green('✓ Félicitations! Aucun problème détecté dans votre projet.'), {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green'
      }));
      return;
    }

    // Afficher les erreurs d'abord
    for (const level of ['error', 'warning', 'info']) {
      const levelIssues = this.issues.filter(i => i.level === level);

      if (levelIssues.length > 0) {
        this.log(chalk.bold(`\n${level === 'error' ? 'Erreurs' : level === 'warning' ? 'Avertissements' : 'Suggestions'}:`));

        levelIssues.forEach((issue, index) => {
          const icon = issue.level === 'error' ? chalk.red('✗') :
                       issue.level === 'warning' ? chalk.yellow('⚠') :
                       chalk.blue('ℹ');

          const fixable = issue.fixable ? chalk.green('[Fixable] ') : '';
          this.log(`${icon} ${fixable}${issue.message}`);

          if (this.options.verbose && issue.details) {
            this.log(chalk.gray(`   └─ ${issue.details}`));
          }
        });
      }
    }
  }

  /**
   * Tente de corriger automatiquement les problèmes
   */
  async fixIssues() {
    const fixableIssues = this.issues.filter(i => i.fixable);

    if (fixableIssues.length === 0) {
      this.log(chalk.yellow("\nAucun problème ne peut être corrigé automatiquement."));
      return;
    }

    this.log(chalk.bold("\nCorrection des problèmes:"));

    for (const issue of fixableIssues) {

      const spinner = createSpinner({
        text: `Correction de ${issue.message}...`,
        color: "primary"
      });

      try {
        await issue.fix!();
        spinner.succeed(`${issue.message} - Corrigé`);
      } catch (e :any) {
        spinner.fail(`Échec de la correction: ${issue.message}`);
        if (this.options.verbose) {
          this.log(chalk.red(`  └─ Erreur: ${e.message}`));
        }
      }
    }
  }

  /**
   * Phase de fin d'exécution
   */
  end() {
    displaySectionEnd();

    // Donner des conseils finaux
    if (this.issues.length === 0) {
      this.log(chalk.green("✓ Votre projet semble être en bonne santé!"));
    } else {
      const unfixedCount = this.issues.filter(i => !i.fixable).length;
      if (unfixedCount > 0) {
        this.log(chalk.yellow(`⚠ ${unfixedCount} problème(s) nécessitent une attention manuelle.`));
        this.log(chalk.gray("  Utilisez l'option --verbose pour obtenir plus de détails sur ces problèmes."));
      }
    }

    this.log(chalk.gray("\nAutres commandes utiles:"));
    this.log(chalk.gray("  sfs add - Ajouter des composants au projet"));
    this.log(chalk.gray("  sfs build - Construire le projet pour la production"));
    this.log(chalk.gray("  sfs test - Exécuter les tests du projet"));
  }

  // Méthodes utilitaires

  /**
   * Vérifie si le répertoire courant est un projet Spring Boot
   */
  isProjectDirectory() {
    return fs.existsSync(path.join(process.cwd(), "pom.xml")) ||
           fs.existsSync(path.join(process.cwd(), "build.gradle")) ||
           fs.existsSync(path.join(process.cwd(), "build.gradle.kts"));
  }

  /**
   * Vérifie si une dépendance existe dans le projet
   */
  async checkDependencyExists(artifactId: string) {
    // Pour Maven
    if (this.projectDetails.buildTool === 'Maven') {
      try {
        const pomContent = fs.readFileSync(path.join(process.cwd(), "pom.xml"), "utf8");
        return pomContent.includes(`<artifactId>${artifactId}</artifactId>`);
      } catch (e) {
        return false;
      }
    }
    // Pour Gradle
    else if (this.projectDetails.buildTool && this.projectDetails.buildTool.includes('Gradle')) {
      try {
        const gradlePath = this.projectDetails.buildTool.includes('Kotlin')
          ? path.join(process.cwd(), "build.gradle.kts")
          : path.join(process.cwd(), "build.gradle");

        const gradleContent = fs.readFileSync(gradlePath, "utf8");
        return gradleContent.includes(artifactId);
      } catch (e) {
        return false;
      }
    }

    return false;
  }

  /**
   * Ajoute une dépendance au projet
   */
  async addDependency(groupId: string, artifactId: string, scope?: string) {
    // Pour Maven
    if (this.projectDetails.buildTool === 'Maven') {
      const pomPath = path.join(process.cwd(), "pom.xml");
      let pomContent = fs.readFileSync(pomPath, "utf8");

      const dependencyXml = `
        <dependency>
            <groupId>${groupId}</groupId>
            <artifactId>${artifactId}</artifactId>
            ${scope ? `<scope>${scope}</scope>` : ''}
        </dependency>`;

      // Insérer juste avant la fermeture de la section dependencies
      pomContent = pomContent.replace(
        '</dependencies>',
        `${dependencyXml}\n    </dependencies>`
      );

      fs.writeFileSync(pomPath, pomContent);
    }
    // Pour Gradle
    else if (this.projectDetails.buildTool && this.projectDetails.buildTool.includes('Gradle')) {
      const isKotlinDSL = this.projectDetails.buildTool.includes('Kotlin');
      const gradlePath = isKotlinDSL
        ? path.join(process.cwd(), "build.gradle.kts")
        : path.join(process.cwd(), "build.gradle");

      let gradleContent = fs.readFileSync(gradlePath, "utf8");
      let dependencyLine;

      if (isKotlinDSL) {
        // Kotlin DSL format
        const scopePrefix = scope ? `${scope}` : 'implementation';
        dependencyLine = `${scopePrefix}("${groupId}:${artifactId}")`;
      } else {
        // Groovy DSL format
        const scopePrefix = scope ? `${scope}` : 'implementation';
        dependencyLine = `${scopePrefix} '${groupId}:${artifactId}'`;
      }

      // Trouver la section dependencies
      const dependenciesMatch = gradleContent.match(/dependencies\s*\{/);
      if (dependenciesMatch) {
        const position = dependenciesMatch.index! + dependenciesMatch[0].length;
        gradleContent =
          gradleContent.substring(0, position) +
          `\n    ${dependencyLine}` +
          gradleContent.substring(position);
      } else {
        gradleContent += `\ndependencies {\n    ${dependencyLine}\n}`;
      }

      fs.writeFileSync(gradlePath, gradleContent);
    }
  }

  /**
   * Recherche des fichiers selon un modèle glob
   */
  async findFiles(pattern: string): Promise<string[]> {
    try {
      // Utiliser glob directement au lieu de this.expand
      const glob = require('glob');
      return new Promise<string[]>((resolve, reject) => {
        glob(pattern, { cwd: process.cwd(), nodir: true }, (err: Error | null, files: string[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(files);
          }
        });
      });
    } catch (e) {
      return [];
    }
  }
}
