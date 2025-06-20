/**
 * Générateur pour la commande 'sfs migrate'
 * Permet de gérer les migrations de base de données pour les projets Spring Boot
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
interface MigrateOptions {
  profile?: string;
  create?: string;
  clean?: boolean;
  repair?: boolean;
  verbose?: boolean;
}

/**
 * Générateur pour gérer les migrations de base de données
 */
export default class MigrateGenerator extends BaseGenerator {
  // Déclaration des options avec types
  declare options: any;

  // Propriétés internes
  private projectType: 'maven' | 'gradle' | 'unknown' = 'unknown';
  private migrationTool: 'flyway' | 'liquibase' | 'unknown' = 'unknown';
  private profile: string = 'dev';
  private migrationResults: any = {
    success: false,
    migrationsExecuted: 0,
    duration: 0,
  };
  private dbInfo: any = {
    type: 'unknown',
    url: '',
    schema: ''
  };

  constructor(args: string[], options: any) {
    super(args, options);

    // Options pour la ligne de commande
    this.option("profile", {
      type: String,
      description: "Profil à utiliser pour la configuration de la base de données (dev, prod)",
      default: "dev"
    });

    this.option("create", {
      type: String,
      description: "Créer un nouveau fichier de migration avec le nom spécifié",
      default: ""
    });

    this.option("clean", {
      type: Boolean,
      description: "Nettoyer la base de données (⚠️ Supprime toutes les données!)",
      default: false
    });

    this.option("repair", {
      type: Boolean,
      description: "Réparer les métadonnées de migration (si corrompues)",
      default: false
    });

    this.option("verbose", {
      type: Boolean,
      description: "Afficher plus de détails pendant les migrations",
      default: false
    });
  }

  /**
   * Initialisation : détection du type de projet et de l'outil de migration
   */
  async initializing() {
    displaySectionTitle("Migrations de base de données");

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

    // Définir le profil
    this.profile = this.options.profile || 'dev';

    // Détecter l'outil de migration utilisé
    await this.detectMigrationTool();

    // Extraire les informations de base de données
    await this.extractDatabaseInfo();

    // Afficher les informations détectées
    this.log(chalk.gray("Informations de migration:"));
    this.log(chalk.gray(`- Profil: ${this.profile}`));
    this.log(chalk.gray(`- Outil de migration: ${this.migrationTool}`));
    this.log(chalk.gray(`- Base de données: ${this.dbInfo.type} (${this.dbInfo.url || 'URL non détectée'})`));

    if (this.options.clean) {
      this.log(chalk.yellow.bold("⚠️  ATTENTION: L'option --clean va supprimer toutes les données de votre base de données!"));
    }
  }

  /**
   * Détecte l'outil de migration utilisé dans le projet
   */
  private async detectMigrationTool(): Promise<void> {
    // Vérifier le fichier pom.xml ou build.gradle pour les dépendances
    let dependencyFile = '';
    if (this.projectType === 'maven') {
      dependencyFile = path.join(process.cwd(), "pom.xml");
    } else {
      dependencyFile = fs.existsSync(path.join(process.cwd(), "build.gradle.kts"))
        ? path.join(process.cwd(), "build.gradle.kts")
        : path.join(process.cwd(), "build.gradle");
    }

    if (fs.existsSync(dependencyFile)) {
      const content = fs.readFileSync(dependencyFile, 'utf8');

      if (content.includes('flyway') || fs.existsSync(path.join(process.cwd(), "src", "main", "resources", "db", "migration"))) {
        this.migrationTool = 'flyway';
      } else if (content.includes('liquibase') || fs.existsSync(path.join(process.cwd(), "src", "main", "resources", "db", "changelog"))) {
        this.migrationTool = 'liquibase';
      } else {
        this.migrationTool = 'unknown';
        this.log(chalk.yellow("Aucun outil de migration n'a été détecté. Les opérations seront limitées."));
      }
    }
  }

  /**
   * Extrait les informations de la base de données depuis les fichiers de configuration
   */
  private async extractDatabaseInfo(): Promise<void> {
    // Chercher dans application.properties ou application.yml
    const propertiesPath = path.join(process.cwd(), "src", "main", "resources", `application${this.profile !== 'default' ? '-' + this.profile : ''}.properties`);
    const ymlPath = path.join(process.cwd(), "src", "main", "resources", `application${this.profile !== 'default' ? '-' + this.profile : ''}.yml`);
    const defaultPropertiesPath = path.join(process.cwd(), "src", "main", "resources", "application.properties");
    const defaultYmlPath = path.join(process.cwd(), "src", "main", "resources", "application.yml");

    // Chercher d'abord dans le profil spécifique, puis dans les fichiers par défaut
    const configPaths = [propertiesPath, ymlPath, defaultPropertiesPath, defaultYmlPath];

    for (const configPath of configPaths) {
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf8');

        // Extraire l'URL de la base de données
        const urlMatch = content.match(/spring\.datasource\.url\s*=\s*(.+)|url:\s*(.+)/);
        if (urlMatch) {
          let url = urlMatch[1] || urlMatch[2];
          url = url.trim().replace(/"|'/g, '');
          this.dbInfo.url = url;

          // Déterminer le type de base de données à partir de l'URL
          if (url.includes('mysql')) {
            this.dbInfo.type = 'MySQL';
          } else if (url.includes('postgresql') || url.includes('postgres')) {
            this.dbInfo.type = 'PostgreSQL';
          } else if (url.includes('h2')) {
            this.dbInfo.type = 'H2';
          } else if (url.includes('oracle')) {
            this.dbInfo.type = 'Oracle';
          } else if (url.includes('sqlserver')) {
            this.dbInfo.type = 'SQL Server';
          } else if (url.includes('mongodb')) {
            this.dbInfo.type = 'MongoDB';
          } else {
            this.dbInfo.type = 'Inconnu';
          }

          // Extraire le schéma si possible
          const schemaMatch = url.match(/\/([^\/\?]+)(\?|$)/);
          if (schemaMatch) {
            this.dbInfo.schema = schemaMatch[1];
          }

          // Une fois qu'on a trouvé l'URL, on peut sortir
          break;
        }
      }
    }
  }

  /**
   * Exécution de la migration
   */
  async prompting() {
    const startTime = Date.now();

    // Si l'option create est spécifiée, créer un nouveau fichier de migration
    if (this.options.create) {
      await this.createMigration(this.options.create);
      return;
    }

    // Si l'option clean est spécifiée, demander une confirmation
    if (this.options.clean) {
      const answers = await this.prompt([
        {
          type: "confirm",
          name: "confirmClean",
          message: chalk.red("⚠️  Vous êtes sur le point de supprimer TOUTES les données de votre base de données. Êtes-vous sûr?"),
          default: false
        }
      ]);

      if (!answers.confirmClean) {
        this.log(chalk.yellow("Opération annulée."));
        return;
      }
    }

    try {
      // Exécuter les migrations selon l'outil détecté
      if (this.migrationTool === 'flyway') {
        await this.runFlywayMigration();
      } else if (this.migrationTool === 'liquibase') {
        await this.runLiquibaseMigration();
      } else {
        throw new Error("Aucun outil de migration reconnu n'a été détecté dans ce projet.");
      }

      // Calculer la durée totale
      this.migrationResults.duration = (Date.now() - startTime) / 1000;
      this.migrationResults.success = true;

    } catch (err: any) {
      this.migrationResults.duration = (Date.now() - startTime) / 1000;
      this.migrationResults.success = false;

      this.log(chalk.red(`\n✗ Erreur lors de la migration: ${err.message}`));

      if (this.options.verbose && err.stack) {
        this.log(chalk.red(err.stack));
      }

      // Afficher des conseils pour résoudre l'erreur
      this.log(chalk.yellow("\nConseils de résolution:"));
      this.log(chalk.gray("- Vérifiez que votre base de données est accessible"));
      this.log(chalk.gray("- Vérifiez les identifiants dans votre fichier de configuration"));
      this.log(chalk.gray("- Utilisez --verbose pour plus de détails sur l'erreur"));

      if (err.message.includes("checksum") || err.message.includes("corrupted")) {
        this.log(chalk.gray("- Utilisez l'option --repair pour résoudre les problèmes de métadonnées"));
      }
    }
  }

  /**
   * Exécution des migrations avec Flyway
   */
  private async runFlywayMigration(): Promise<void> {
    const spinner = createSpinner({
      text: "Exécution des migrations Flyway...",
      color: "primary"
    });

    spinner.start();

    // Déterminer la commande à exécuter selon le type de projet
    let command: string;
    let args: string[];

    if (this.projectType === 'maven') {
      command = process.platform === "win32" ? "mvnw.cmd" : "./mvnw";

      args = [
        "flyway:" + (this.options.clean ? "clean" : this.options.repair ? "repair" : "migrate"),
        `-Dflyway.configFiles=src/main/resources/application${this.profile !== 'default' ? '-' + this.profile : ''}.properties`,
        `-Dflyway.url=${this.dbInfo.url}`,
        "-Dflyway.locations=classpath:db/migration"
      ];
    } else {
      command = process.platform === "win32" ? "gradlew.bat" : "./gradlew";

      args = [
        "flyway" + (this.options.clean ? "Clean" : this.options.repair ? "Repair" : "Migrate"),
        `-Pspring.profiles.active=${this.profile}`
      ];
    }

    try {
      // Exécuter la commande
      const { stdout } = await this.execPromise(command, args);

      // Analyser les résultats
      const successMatch = stdout.match(/Successfully applied (\d+) migration/);
      if (successMatch) {
        this.migrationResults.migrationsExecuted = parseInt(successMatch[1], 10);
      }

      if (this.options.clean) {
        spinner.succeed("Base de données nettoyée avec succès");
      } else if (this.options.repair) {
        spinner.succeed("Métadonnées de migration réparées avec succès");
      } else {
        spinner.succeed(`${this.migrationResults.migrationsExecuted} migration(s) appliquée(s) avec succès`);
      }

    } catch (err) {
      spinner.fail("Échec de la migration");
      throw err;
    }
  }

  /**
   * Exécution des migrations avec Liquibase
   */
  private async runLiquibaseMigration(): Promise<void> {
    const spinner = createSpinner({
      text: "Exécution des migrations Liquibase...",
      color: "primary"
    });

    spinner.start();

    // Déterminer la commande à exécuter selon le type de projet
    let command: string;
    let args: string[];

    if (this.projectType === 'maven') {
      command = process.platform === "win32" ? "mvnw.cmd" : "./mvnw";

      args = [
        "liquibase:" + (this.options.clean ? "dropAll" : this.options.repair ? "update" : "update"),
        `-Dliquibase.url=${this.dbInfo.url}`,
        `-Dspring.profiles.active=${this.profile}`
      ];
    } else {
      command = process.platform === "win32" ? "gradlew.bat" : "./gradlew";

      args = [
        this.options.clean ? "liquibaseDropAll" : this.options.repair ? "liquibaseUpdate" : "liquibaseUpdate",
        `-Pspring.profiles.active=${this.profile}`
      ];
    }

    try {
      // Exécuter la commande
      const { stdout } = await this.execPromise(command, args);

      // Analyser les résultats
      const changesMatch = stdout.match(/(\d+) change sets applied/i);
      if (changesMatch) {
        this.migrationResults.migrationsExecuted = parseInt(changesMatch[1], 10);
      }

      if (this.options.clean) {
        spinner.succeed("Base de données nettoyée avec succès");
      } else if (this.options.repair) {
        spinner.succeed("Base de données mise à jour et réparée avec succès");
      } else {
        spinner.succeed(`${this.migrationResults.migrationsExecuted} changeset(s) appliqué(s) avec succès`);
      }

    } catch (err) {
      spinner.fail("Échec de la migration");
      throw err;
    }
  }

  /**
   * Créer un nouveau fichier de migration
   */
  private async createMigration(migrationName: string): Promise<void> {
    // Vérifier que le nom est valide (pas de caractères spéciaux)
    if (!/^[a-zA-Z0-9_]+$/.test(migrationName)) {
      this.log(chalk.red("Le nom de la migration ne doit contenir que des lettres, des chiffres et des underscores."));
      return;
    }

    // Générer un timestamp pour le préfixe du fichier
    const timestamp = new Date().toISOString().replace(/[^\d]/g, '').substring(0, 14);

    // Construire le chemin selon l'outil de migration
    let migrationFile: string;
    let migrationContent: string;

    if (this.migrationTool === 'flyway') {
      const migrationDir = path.join(process.cwd(), "src", "main", "resources", "db", "migration");

      // Créer le répertoire s'il n'existe pas
      if (!fs.existsSync(migrationDir)) {
        fs.mkdirSync(migrationDir, { recursive: true });
      }

      // Nom du fichier: V{timestamp}__{nom}.sql
      migrationFile = path.join(migrationDir, `V${timestamp}__${migrationName}.sql`);

      // Contenu par défaut pour une migration SQL Flyway
      migrationContent = `-- Migration: ${migrationName}
-- Date de création: ${new Date().toISOString().split('T')[0]}
-- Description: Ajouter une description ici

-- Ajouter vos instructions SQL ici
-- Exemple: CREATE TABLE exemple (id INT PRIMARY KEY, nom VARCHAR(255) NOT NULL);

`;

    } else if (this.migrationTool === 'liquibase') {
      const changelogDir = path.join(process.cwd(), "src", "main", "resources", "db", "changelog");
      const masterChangelogPath = path.join(changelogDir, "master.xml");

      // Créer les répertoires s'ils n'existent pas
      if (!fs.existsSync(changelogDir)) {
        fs.mkdirSync(changelogDir, { recursive: true });
      }

      // Nom du fichier: {timestamp}_{nom}.xml
      migrationFile = path.join(changelogDir, `${timestamp}_${migrationName}.xml`);

      // Contenu par défaut pour une migration XML Liquibase
      migrationContent = `<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
                        http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.5.xsd">

    <changeSet id="${timestamp}" author="sfs">
        <comment>Migration: ${migrationName}</comment>
        
        <!-- Ajouter vos modifications de schéma ici -->
        <!-- Exemple:
        <createTable tableName="exemple">
            <column name="id" type="int">
                <constraints primaryKey="true" nullable="false"/>
            </column>
            <column name="nom" type="varchar(255)">
                <constraints nullable="false"/>
            </column>
        </createTable>
        -->
        
    </changeSet>

</databaseChangeLog>`;

      // Mettre à jour le fichier master.xml pour inclure cette nouvelle migration
      if (fs.existsSync(masterChangelogPath)) {
        let masterContent = fs.readFileSync(masterChangelogPath, 'utf8');

        // Chercher la balise de fin pour insérer avant
        const endTagIndex = masterContent.lastIndexOf('</databaseChangeLog>');

        if (endTagIndex !== -1) {
          // Construire le chemin relatif pour l'inclusion
          const relativeFilePath = path.basename(migrationFile);

          // Ajouter l'include avant la balise de fin
          const include = `    <include file="db/changelog/${relativeFilePath}" relativeToChangelogFile="false"/>\n`;
          masterContent =
            masterContent.substring(0, endTagIndex) +
            include +
            masterContent.substring(endTagIndex);

          fs.writeFileSync(masterChangelogPath, masterContent, 'utf8');
        }
      } else {
        // Créer un fichier master.xml s'il n'existe pas
        const masterContent = `<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
                        http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.5.xsd">

    <include file="db/changelog/${path.basename(migrationFile)}" relativeToChangelogFile="false"/>

</databaseChangeLog>`;

        fs.writeFileSync(masterChangelogPath, masterContent, 'utf8');
      }

    } else {
      // Outil non détecté, créer un fichier SQL générique
      const sqlDir = path.join(process.cwd(), "src", "main", "resources", "db", "migration");

      // Créer le répertoire s'il n'existe pas
      if (!fs.existsSync(sqlDir)) {
        fs.mkdirSync(sqlDir, { recursive: true });
      }

      migrationFile = path.join(sqlDir, `${timestamp}_${migrationName}.sql`);

      migrationContent = `-- Migration: ${migrationName}
-- Date de création: ${new Date().toISOString().split('T')[0]}
-- Description: Ajouter une description ici

-- Ajouter vos instructions SQL ici
-- Note: Aucun outil de migration n'a été détecté automatiquement.
-- Vous devrez ajouter ce fichier manuellement à votre système de migration.

`;
    }

    // Écrire le fichier de migration
    fs.writeFileSync(migrationFile, migrationContent, 'utf8');

    this.log(chalk.green(`\n✓ Fichier de migration créé: ${migrationFile}`));
    this.log(chalk.gray("Modifier ce fichier pour ajouter vos modifications de schéma."));

    if (this.migrationTool === 'flyway') {
      this.log(chalk.gray("Pour appliquer cette migration, exécutez: sfs migrate"));
    } else if (this.migrationTool === 'liquibase') {
      this.log(chalk.gray("Le fichier master.xml a été mis à jour pour inclure cette migration."));
      this.log(chalk.gray("Pour appliquer cette migration, exécutez: sfs migrate"));
    }
  }

  /**
   * Wrapper pour exécuter une commande et retourner stdout/stderr via Promise
   */
  private execPromise(command: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';

      // Afficher la commande en mode verbose
      if (this.options.verbose) {
        this.log(chalk.dim(`$ ${command} ${args.join(' ')}`));
      }

      const childProcess = spawn(command, args, { shell: true });

      childProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;

        if (this.options.verbose) {
          this.log(output);
        }
      });

      childProcess.stderr.on('data', (data) => {
        const error = data.toString();
        stderr += error;

        if (this.options.verbose) {
          this.log(chalk.red(error));
        }
      });

      childProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`La commande a échoué avec le code ${code}: ${stderr || stdout}`));
        }
      });
    });
  }

  /**
   * Méthode finale : affichage des résultats
   */
  async end() {
    // Ne rien faire si on a juste créé un fichier de migration
    if (this.options.create) {
      return;
    }

    if (!this.migrationResults.success) {
      // L'erreur a déjà été affichée dans prompting()
      return;
    }

    // Afficher un résumé de l'opération
    this.log("\n" + chalk.bold.underline("📋 Résumé de Migration"));

    if (this.options.clean) {
      this.log(chalk.green("✓ Base de données nettoyée avec succès"));
    } else if (this.options.repair) {
      this.log(chalk.green("✓ Métadonnées de migration réparées avec succès"));
    } else {
      this.log(chalk.green(`✓ ${this.migrationResults.migrationsExecuted} migration(s) appliquée(s) avec succès`));
    }

    this.log(chalk.gray(`⏱️ Durée: ${this.migrationResults.duration.toFixed(2)} secondes`));
    this.log(chalk.gray(`🛢️ Base de données: ${this.dbInfo.type} (${this.dbInfo.schema || 'schéma non détecté'})`));

    // Afficher les prochaines étapes
    this.log("\n" + chalk.bold.underline("🚀 Prochaines étapes"));

    if (this.options.clean) {
      this.log(chalk.gray("Exécutez `sfs migrate` pour appliquer toutes les migrations"));
    } else if (this.migrationResults.migrationsExecuted === 0 && !this.options.repair) {
      this.log(chalk.gray("Pour créer une nouvelle migration:"));
      this.log(chalk.white("  sfs migrate --create nom_de_la_migration"));
    } else {
      this.log(chalk.gray("Vérifiez que votre application fonctionne correctement avec les migrations appliquées"));
      this.log(chalk.gray("Pour créer une autre migration:"));
      this.log(chalk.white("  sfs migrate --create nom_de_la_migration"));
    }

    // Afficher la section de fin
    displaySectionEnd();
  }
}
