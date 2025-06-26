/**
 * Module de génération de code pour Spring-Fullstack-Speed
 * Ce module contient toutes les méthodes nécessaires pour générer les différentes parties du projet
 */

import chalk from "chalk";
import fs from "fs";
import path from "path";
import { ensureDirectoryExists } from './ensure-dir-exists.js';

/**
 * Interface pour les données de template partagées entre les méthodes
 */
export interface TemplateData {
  appName: string;
  packageName: string;
  buildTool: string;
  frontendFramework: string;
  database: string;
  includeAuth: boolean;
  authType?: string;
  additionalFeatures: string[];
  springBootVersion: string;
  javaVersion: string;
  javaPackagePath: string;
  [key: string]: any; // Permet d'ajouter des propriétés supplémentaires
}

/**
 * Prépare les données du template en s'assurant que tous les champs nécessaires sont définis
 * @param templateData Les données brutes du template
 * @returns TemplateData avec les valeurs calculées et vérifiées
 */
export function prepareTemplateData(templateData: Partial<TemplateData>): TemplateData {
  // S'assurer que packageName est défini
  if (!templateData.packageName) {
    templateData.packageName = 'com.example.demo';
  }

  // Calculer javaPackagePath à partir du packageName (remplacer les points par des slashes)
  templateData.javaPackagePath = templateData.packageName.replace(/\./g, '/');

  // S'assurer que appName est défini et formatté correctement
  if (!templateData.appName) {
    templateData.appName = 'demo';
  }

  // Normaliser appName pour qu'il soit utilisable comme nom de classe
  templateData.appNameFormatted = templateData.appName
    .split(/[-_\s]/)
    .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  return templateData as TemplateData;
}

/**
 * Vérifie si un fichier a bien été généré
 * @param generator Référence au générateur
 * @param filePath Chemin du fichier à vérifier
 * @param errorMessage Message d'erreur à afficher si le fichier n'existe pas
 * @returns boolean Indique si le fichier existe
 */
function checkFileGeneration(generator: any, filePath: string, errorMessage?: string): boolean {
  const fullPath = generator.destinationPath(filePath);
  const fileExists = fs.existsSync(fullPath);

  if (!fileExists && errorMessage) {
    generator.log(chalk.red(`❌ ${errorMessage || `Erreur: Le fichier ${filePath} n'a pas été généré correctement.`}`));
  } else if (fileExists) {
    generator.log(chalk.green(`✅ Fichier généré avec succès: ${filePath}`));
  }

  return fileExists;
}


/**
 * Génère la structure du projet
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
export function generateProjectStructure(generator: any, templateData: TemplateData) {
  // Assurez-vous que les données du template sont complètes
  templateData = prepareTemplateData(templateData);

  generator.log(chalk.blue("Génération de la structure du projet..."));
  // Création du fichier .gitignore
  generator.fs.copy(
    generator.templatePath("gitignore"),
    generator.destinationPath(".gitignore")
  );
}

/**
 * Génère le README du projet
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
export function generateReadme(generator: any, templateData: TemplateData) {
  // Assurez-vous que les données du template sont complètes
  templateData = prepareTemplateData(templateData);

  generator.log(chalk.blue("Génération du README..."));
  generator.fs.copyTpl(
    generator.templatePath("README.md.ejs"),
    generator.destinationPath("README.md"),
    templateData
  );
}

/**
 * Génère la classe principale de l'application
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
export function generateMainApplication(generator: any, templateData: TemplateData) {
  // Assurez-vous que les données du template sont complètes
  templateData = prepareTemplateData(templateData);

  generator.log(chalk.blue("Génération de l'application principale..."));
  const mainPath = `src/main/java/${templateData.javaPackagePath}`;

  // Utiliser le nom de l'application formatté pour le nom de classe
  const className = templateData.appNameFormatted ||
    templateData.appName.charAt(0).toUpperCase() +
    templateData.appName.slice(1).replace(/-([a-z])/g, function(g) { return g[1].toUpperCase(); });

  // S'assurer que le répertoire existe avant d'y écrire
  ensureDirectoryExists(generator, mainPath);

  try {
    // Essayer plusieurs chemins possibles pour le template de l'application
    const possibleTemplatePaths = [
      generator.templatePath("Application.java.ejs"),
      generator.templatePath("src/main/java/com/example/app/Application.java.ejs"),
      generator.templatePath("../app/templates/src/main/java/com/example/app/Application.java.ejs")
    ];

    let templateFound = false;

    for (const templatePath of possibleTemplatePaths) {
      if (fs.existsSync(templatePath)) {
        generator.fs.copyTpl(
          templatePath,
          generator.destinationPath(`${mainPath}/${className}Application.java`),
          {
            ...templateData,
            packageName: templateData.packageName,
            className: className,
            appClassName: className
          }
        );
        templateFound = true;
       // generator.log(chalk.green(`✅ Template Application.java.ejs trouvé à ${templatePath}`));
        break;
      }
    }

    if (!templateFound) {
      throw new Error("Aucun template d'application trouvé");
    }

    // Vérifier que le fichier a été correctement généré
    if (checkFileGeneration(
      generator,
      `${mainPath}/${className}Application.java`,
      `Erreur lors de la génération du fichier ${className}Application.java`
    )) {
      generator.log(chalk.green(`✅ Application principale générée avec le nom ${className}Application.java`));
    }
  } catch (error) {
   // generator.log(chalk.red(`❌ Erreur lors de la génération du fichier principal de l'application: ${error}`));

    // Tentative de récupération: créer un fichier minimal avec le bon package
    try {
      const minimalApplicationContent = `package ${templateData.packageName};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ${className}Application {

    public static void main(String[] args) {
        SpringApplication.run(${className}Application.class, args);
    }
}
`;

      // Utiliser ensureDirectoryExists pour garantir que le répertoire existe
      const dirPath = path.dirname(generator.destinationPath(`${mainPath}/${className}Application.java`));
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      fs.writeFileSync(
        generator.destinationPath(`${mainPath}/${className}Application.java`),
        minimalApplicationContent
      );
      generator.log(chalk.green(`✅ Fichier ${className}Application.java créé avec succès (méthode de secours)`));
      return true; // Indiquer que le fichier a été créé avec succès
    } catch (fallbackError) {
      generator.log(chalk.red(`❌ Impossible de créer même un fichier minimal: ${fallbackError}`));
    }
  }
}

/**
 * Génère les fichiers de configuration de l'application
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
export function generateApplicationProperties(generator: any, templateData: TemplateData) {
  generator.log(chalk.blue("Génération des fichiers de configuration..."));

  // Génération du fichier application.properties
  generator.fs.copyTpl(
    generator.templatePath("application.properties.ejs"),
    generator.destinationPath("src/main/resources/application.properties"),
    {
      ...templateData,
      environment: "default"
    }
  );

  // Génération des fichiers de propriétés par environnement
  generator.fs.copyTpl(
    generator.templatePath("application.properties.ejs"),
    generator.destinationPath("src/main/resources/application-dev.properties"),
    {
      ...templateData,
      environment: "dev"
    }
  );

  generator.fs.copyTpl(
    generator.templatePath("application.properties.ejs"),
    generator.destinationPath("src/main/resources/application-prod.properties"),
    {
      ...templateData,
      environment: "prod"
    }
  );
}

/**
 * Génère les répertoires de base du projet
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
export function generateBaseDirectories(generator: any, templateData: TemplateData) {
  generator.log(chalk.blue("Création des répertoires de base..."));

  try {
    const mainPath = `src/main/java/${templateData.javaPackagePath}`;
    const testPath = `src/test/java/${templateData.javaPackagePath}`;
    const resourcesPath = "src/main/resources";
    const testResourcesPath = "src/test/resources";

    // Liste des packages standard Java
    const mainDirectories = [
      `${mainPath}/controller`,
      `${mainPath}/service`,
      `${mainPath}/repository`,
      `${mainPath}/entity`,
      `${mainPath}/config`,
      `${mainPath}/dto`,
      `${mainPath}/exception`,
      `${mainPath}/util`,
    ];

    // Répertoires de test
    const testDirectories = [
      `${testPath}/controller`,
      `${testPath}/service`,
      `${testPath}/repository`,
    ];

    // Répertoires de ressources
    const resourceDirectories = [
      `${resourcesPath}/static`,
      `${resourcesPath}/static/css`,
      `${resourcesPath}/static/js`,
      `${resourcesPath}/static/img`,
      `${resourcesPath}/templates`,
      `${testResourcesPath}`,
    ];

    // Création des répertoires principaux pour Java
    generator.log(chalk.yellow("📂 Création des répertoires Java..."));
    for (const dir of mainDirectories) {
      ensureDirectoryExists(generator, dir);
      generator.fs.write(
        generator.destinationPath(`${dir}/.gitkeep`),
        "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
      );
    }

    // Création des répertoires de test
    generator.log(chalk.yellow("📂 Création des répertoires de test..."));
    for (const dir of testDirectories) {
      ensureDirectoryExists(generator, dir);
      generator.fs.write(
        generator.destinationPath(`${dir}/.gitkeep`),
        "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
      );
    }

    // Création des répertoires de ressources
    generator.log(chalk.yellow(" Création des répertoires de ressources..."));
    for (const dir of resourceDirectories) {
      ensureDirectoryExists(generator, dir);
      generator.fs.write(
        generator.destinationPath(`${dir}/.gitkeep`),
        "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
      );
    }

    // Génération des classes de base essentielles
    generator.log(chalk.yellow("📄 Génération des classes de base..."));

    // Génération de BaseEntity
    try {
      generator.fs.copyTpl(
        generator.templatePath("src/main/java/com/example/app/entity/BaseEntity.java.ejs"),
        generator.destinationPath(`${mainPath}/entity/BaseEntity.java`),
        templateData
      );
      generator.log(chalk.green("✅ Classe BaseEntity générée avec succès"));
    } catch (error) {
      generator.log(chalk.red(`❌ Erreur lors de la génération de BaseEntity: ${error}`));
    }

    // Génération de BaseRepository
    try {
      generator.fs.copyTpl(
        generator.templatePath("src/main/java/com/example/app/repository/BaseRepository.java.ejs"),
        generator.destinationPath(`${mainPath}/repository/BaseRepository.java`),
        templateData
      );
      generator.log(chalk.green("✅ Interface BaseRepository générée avec succès"));
    } catch (error) {
      generator.log(chalk.red(`❌ Erreur lors de la génération de BaseRepository: ${error}`));
    }

    generator.log(chalk.green("✅ Structure des répertoires créée avec succès."));
  } catch (error) {
    generator.log(chalk.red(`❌ Erreur lors de la création des répertoires: ${error}`));
    generator.log(chalk.yellow("⚠️ Tentative de continuer malgré l'erreur..."));
  }
}


/**
 * Génère les fichiers Maven Wrapper nécessaires
 * @param generator Référence au générateur
 */
function generateMavenWrapper(generator: any) {
  generator.log(chalk.blue("Génération des fichiers Maven Wrapper..."));

  try {
    // Créer le dossier .mvn/wrapper s'il n'existe pas
    ensureDirectoryExists(generator, ".mvn/wrapper");

    // Chemin vers le fichier maven-wrapper.properties dans les templates
    // Correction: utiliser le bon chemin dans le dossier templates
    const wrapperPropertiesTemplatePath = generator.templatePath("maven-wrapper.properties");
    const wrapperJarTemplatePath = generator.templatePath("maven-wrapper.jar");

    // Utiliser les fichiers de templates existants dans le projet
    const altWrapperPropertiesPath = generator.templatePath("../app/templates/maven-wrapper.properties");
    const altWrapperJarPath = generator.templatePath("../app/templates/maven-wrapper.jar");

    // Chemin de destination des fichiers
    const wrapperPropertiesDestPath = generator.destinationPath(".mvn/wrapper/maven-wrapper.properties");
    const wrapperJarDestPath = generator.destinationPath(".mvn/wrapper/maven-wrapper.jar");

    // Vérifier et copier maven-wrapper.properties
    if (fs.existsSync(wrapperPropertiesTemplatePath)) {
      // Utiliser fs.copy au lieu de fs.copyTpl pour éviter tout problème de templating
      try {
        fs.copyFileSync(wrapperPropertiesTemplatePath, wrapperPropertiesDestPath);
        generator.log(chalk.green("✅ Fichier maven-wrapper.properties copié avec succès"));
      } catch (copyError) {
        generator.log(chalk.red(`❌ Erreur lors de la copie de maven-wrapper.properties: ${copyError}`));

        // Solution de secours: créer le fichier manuellement
        const propertiesContent = `distributionUrl=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.5/apache-maven-3.9.5-bin.zip
wrapperUrl=https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar`;

        fs.writeFileSync(wrapperPropertiesDestPath, propertiesContent);
        generator.log(chalk.yellow("⚠️ Fichier maven-wrapper.properties créé manuellement"));
      }
    } else if (fs.existsSync(altWrapperPropertiesPath)) {
      // Essayer avec le chemin alternatif
      try {
        fs.copyFileSync(altWrapperPropertiesPath, wrapperPropertiesDestPath);
        generator.log(chalk.green("✅ Fichier maven-wrapper.properties copié avec succès (chemin alternatif)"));
      } catch (copyError) {
        generator.log(chalk.red(`❌ Erreur lors de la copie de maven-wrapper.properties (chemin alternatif): ${copyError}`));

        // Solution de secours: créer le fichier manuellement
        const propertiesContent = `distributionUrl=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.5/apache-maven-3.9.5-bin.zip
wrapperUrl=https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar`;

        fs.writeFileSync(wrapperPropertiesDestPath, propertiesContent);
        generator.log(chalk.yellow("⚠️ Fichier maven-wrapper.properties créé manuellement"));
      }
    } else {
      generator.log(chalk.red("❌ Fichier maven-wrapper.properties introuvable dans les templates"));

      // Créer un fichier maven-wrapper.properties par défaut
      const propertiesContent = `distributionUrl=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.5/apache-maven-3.9.5-bin.zip
wrapperUrl=https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar`;

      fs.writeFileSync(wrapperPropertiesDestPath, propertiesContent);
      generator.log(chalk.yellow("⚠️ Fichier maven-wrapper.properties par défaut créé"));
    }

    // Vérifier et copier maven-wrapper.jar
    if (fs.existsSync(wrapperJarTemplatePath)) {
      try {
        fs.copyFileSync(wrapperJarTemplatePath, wrapperJarDestPath);
        generator.log(chalk.green("✅ Fichier maven-wrapper.jar copié avec succès"));
      } catch (copyError) {
        generator.log(chalk.red(`❌ Erreur lors de la copie de maven-wrapper.jar: ${copyError}`));
        generator.log(chalk.yellow("⚠️ Le wrapper fonctionnera mais il faudra télécharger le JAR lors de la première exécution"));
      }
    } else if (fs.existsSync(altWrapperJarPath)) {
      // Essayer avec le chemin alternatif
      try {
        fs.copyFileSync(altWrapperJarPath, wrapperJarDestPath);
        generator.log(chalk.green("✅ Fichier maven-wrapper.jar copié avec succès (chemin alternatif)"));
      } catch (copyError) {
        generator.log(chalk.red(`❌ Erreur lors de la copie de maven-wrapper.jar (chemin alternatif): ${copyError}`));
        generator.log(chalk.yellow("⚠️ Le wrapper fonctionnera mais il faudra télécharger le JAR lors de la première exécution"));
      }
    } else {
      generator.log(chalk.yellow("⚠️ Le fichier maven-wrapper.jar n'a pas été trouvé dans les templates"));
      generator.log(chalk.yellow("⚠️ Le wrapper fonctionnera mais il faudra télécharger le JAR lors de la première exécution"));
    }

    // Vérifier que le fichier a été généré avec succès
    if (fs.existsSync(wrapperPropertiesDestPath)) {
      generator.log(chalk.green("✅ Fichiers Maven Wrapper générés avec succès!"));
    } else {
      generator.log(chalk.red("❌ Erreur lors de la génération du fichier maven-wrapper.properties"));
    }
  } catch (error) {
    generator.log(chalk.red(`❌ Erreur lors de la génération des fichiers Maven Wrapper: ${error}`));

    // Tentative de récupération ultime - créer les fichiers nécessaires directement
    try {
      ensureDirectoryExists(generator, ".mvn/wrapper");

      const propertiesContent = `distributionUrl=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.5/apache-maven-3.9.5-bin.zip
wrapperUrl=https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar`;

      fs.writeFileSync(generator.destinationPath(".mvn/wrapper/maven-wrapper.properties"), propertiesContent);
      generator.log(chalk.yellow("⚠️ Fichier maven-wrapper.properties créé par récupération d'urgence"));
    } catch (fallbackError) {
      generator.log(chalk.red(`❌ Échec complet de la génération Maven Wrapper: ${fallbackError}`));
    }
  }
}

/**
 * Génère les fichiers de build (Maven ou Gradle)
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 * @param buildTool Type d'outil de build ('maven' ou 'gradle')
 */
export function generateMavenOrGradle(generator: any, templateData: TemplateData, buildTool: string = 'maven') {
  generator.log(chalk.blue(`Génération des fichiers de build (${buildTool.toUpperCase()})...`));

  try {
    if (buildTool.toLowerCase() === "maven") {
      // 1. Génération du fichier pom.xml
      try {
        const pomTemplate = generator.templatePath("pom.xml.ejs");
        if (fs.existsSync(pomTemplate)) {
          generator.fs.copyTpl(
            pomTemplate,
            generator.destinationPath("pom.xml"),
            templateData
          );
          generator.log(chalk.green("✅ Fichier pom.xml généré avec succès"));
        } else {
          generator.log(chalk.red("❌ Template pom.xml.ejs non trouvé"));
          // Création d'un pom.xml minimal comme solution de secours
          createMinimalPomXml(generator, templateData);
        }
      } catch (pomError) {
        generator.log(chalk.red(`❌ Erreur lors de la génération du pom.xml: ${pomError}`));
        // Création d'un pom.xml minimal comme solution de secours
        createMinimalPomXml(generator, templateData);
      }

      // 2. Génération des scripts mvnw
      try {
        const mvnwTemplate = generator.templatePath("mvnw.ejs");
        const mvnwCmdTemplate = generator.templatePath("mvnw.cmd.ejs");

        if (fs.existsSync(mvnwTemplate)) {
          try {
            // Lire le contenu du template plutôt que simplement copier le fichier
            const mvnwContent = fs.readFileSync(mvnwTemplate, 'utf8');
            // Écrire le contenu dans le fichier de destination
            fs.writeFileSync(generator.destinationPath("mvnw"), mvnwContent, {mode: 0o755});
            generator.log(chalk.green("✅ Script mvnw copié avec succès"));
          } catch (copyError) {
            generator.log(chalk.red(`❌ Erreur lors de la copie de mvnw: ${copyError}`));
          }
        } else {
          generator.log(chalk.red("❌ Template mvnw.ejs non trouvé"));
          // Création d'un script mvnw minimal comme solution de secours
        }

        if (fs.existsSync(mvnwCmdTemplate)) {
          try {
            fs.copyFileSync(mvnwCmdTemplate, generator.destinationPath("mvnw.cmd"));
            generator.log(chalk.green("✅ Script mvnw.cmd copié avec succès"));
          } catch (copyError) {
            generator.log(chalk.red(`❌ Erreur lors de la copie de mvnw.cmd: ${copyError}`));
            // Copie manuelle en tant que solution de secours
            createMinimalMvnwCmdScript(generator);
          }
        } else {
          generator.log(chalk.red("❌ Template mvnw.cmd.ejs non trouvé"));
          // Création d'un script mvnw.cmd minimal comme solution de secours
          createMinimalMvnwCmdScript(generator);
        }
      } catch (mvnwError) {
        generator.log(chalk.red(`❌ Erreur lors de la génération des scripts mvnw: ${mvnwError}`));
        // Création des scripts mvnw minimaux comme solution de secours
        createMinimalMvnwScript(generator);
        createMinimalMvnwCmdScript(generator);
      }

      // Générer les fichiers Maven Wrapper
      generateMavenWrapper(generator);

      // Vérification de la génération des fichiers
      checkFileGeneration(generator, "pom.xml", "Erreur lors de la génération du fichier pom.xml");
      checkFileGeneration(generator, "mvnw", "Erreur lors de la génération du script mvnw");
      checkFileGeneration(generator, "mvnw.cmd", "Erreur lors de la génération du script mvnw.cmd");

    } else {
      // Création des fichiers Gradle
      generator.fs.copyTpl(
        generator.templatePath("build.gradle.kts.ejs"),
        generator.destinationPath("build.gradle.kts"),
        templateData
      );
      generator.fs.copyTpl(
        generator.templatePath("settings.gradle.kts.ejs"),
        generator.destinationPath("settings.gradle.kts"),
        templateData
      );
      generator.fs.copy(
        generator.templatePath("gradlew.ejs"),
        generator.destinationPath("gradlew")
      );
      generator.fs.copy(
        generator.templatePath("gradlew.bat.ejs"),
        generator.destinationPath("gradlew.bat")
      );

      // Vérification de la génération des fichiers
      checkFileGeneration(generator, "build.gradle.kts", "Erreur lors de la génération du fichier build.gradle.kts");
      checkFileGeneration(generator, "settings.gradle.kts", "Erreur lors de la génération du fichier settings.gradle.kts");
      checkFileGeneration(generator, "gradlew", "Erreur lors de la génération du script gradlew");
      checkFileGeneration(generator, "gradlew.bat", "Erreur lors de la génération du script gradlew.bat");
    }

    // Assurer que les scripts ont des permissions d'exécution
    if (process.platform !== 'win32') {
      try {
        if (buildTool.toLowerCase() === "maven") {
          const mvnwPath = generator.destinationPath('mvnw');
          if (fs.existsSync(mvnwPath)) {
            fs.chmodSync(mvnwPath, '755');
            generator.log(chalk.green("✅ Permissions d'exécution configurées pour mvnw"));
          } else {
            generator.log(chalk.yellow("⚠️ Impossible de définir les permissions: mvnw n'existe pas"));
          }
        } else {
          const gradlewPath = generator.destinationPath('gradlew');
          if (fs.existsSync(gradlewPath)) {
            fs.chmodSync(gradlewPath, '755');
            generator.log(chalk.green("✅ Permissions d'exécution configurées pour gradlew"));
          } else {
            generator.log(chalk.yellow("⚠️ Impossible de définir les permissions: gradlew n'existe pas"));
          }
        }
      } catch (error) {
        generator.log(chalk.yellow(`⚠️ Impossible de définir les permissions d'exécution: ${error}`));
      }
    }

    generator.log(chalk.green(`✅ Configuration ${buildTool.toUpperCase()} générée avec succès!`));
  } catch (error) {
    generator.log(chalk.red(`❌ Erreur lors de la génération des fichiers ${buildTool.toUpperCase()}: ${error}`));
    // Tenter de récupérer de l'erreur
    generator.log(chalk.yellow("⚠️ Tentative de récupération..."));
  }
}

/**
 * Crée un fichier pom.xml minimal
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
function createMinimalPomXml(generator: any, templateData: TemplateData) {
  const minimalPomXml = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>${templateData.springBootVersion}</version>
    <relativePath/> <!-- lookup parent from repository -->
  </parent>
  <groupId>${templateData.packageName}</groupId>
  <artifactId>${templateData.appName.toLowerCase().replace(/\s+/g, '-')}</artifactId>
  <version>0.0.1-SNAPSHOT</version>
  <name>${templateData.appName}</name>
  <description>Projet généré avec Spring-Fullstack-Speed</description>
  <properties>
    <java.version>${templateData.javaVersion}</java.version>
  </properties>
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
      <groupId>com.h2database</groupId>
      <artifactId>h2</artifactId>
      <scope>runtime</scope>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-test</artifactId>
      <scope>test</scope>
    </dependency>
  </dependencies>

  <build>
    <plugins>
      <plugin>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-maven-plugin</artifactId>
      </plugin>
    </plugins>
  </build>

</project>`;

  generator.fs.write(
    generator.destinationPath("pom.xml"),
    minimalPomXml
  );
}

/**
 * Crée un script mvnw minimal
 * @param generator Référence au générateur
 */
function createMinimalMvnwScript(generator: any) {
  const minimalMvnwScript = `#!/bin/sh
# ----------------------------------------------------------------------------
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# ----------------------------------------------------------------------------

# Script généré automatiquement par Spring-Fullstack-Speed

if [ -f "$HOME/.mavenrc" ] ; then
  . "$HOME/.mavenrc"
fi

# OS specific support
case "$(uname)" in
  Darwin*) darwin=true ;;
  MSYS* | MINGW*) msys=true ;;
  CYGWIN*) cygwin=true ;;
esac

APP_HOME="$(cd "$(dirname "$0")" && pwd)"

# Télécharge maven-wrapper.jar si nécessaire
if [ ! -e "$APP_HOME"/.mvn/wrapper/maven-wrapper.jar ] ; then
    mkdir -p "$APP_HOME"/.mvn/wrapper
    if [ -n "$MVNW_REPOURL" ] ; then
        wrapperUrl="$MVNW_REPOURL/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar"
    else
        wrapperUrl="https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar"
    fi
    
    echo "Téléchargement de $wrapperUrl ..."
    
    # Pour éviter de télécharger le JAR à chaque exécution, on stocke le chemin où le téléchargement a été fait
    # et on crée un fichier temporaire qui contient le hash du JAR téléchargé
    tmpdir="/tmp/maven-download"
    mkdir -p $tmpdir
    
    # Télécharge le JAR à l'emplacement temporaire
    curl -o "$tmpdir/maven-wrapper.jar" "$wrapperUrl"
    
    # Copie le JAR téléchargé dans le répertoire du wrapper
    cp "$tmpdir/maven-wrapper.jar" "$APP_HOME/.mvn/wrapper/maven-wrapper.jar"
fi

exec java -jar "$APP_HOME/.mvn/wrapper/maven-wrapper.jar" "$@"`;

  generator.fs.write(
    generator.destinationPath("mvnw"),
    minimalMvnwScript
  );
  generator.log(chalk.yellow("⚠️ Script mvnw minimal créé comme solution de secours"));

  // Rendre le script exécutable
  if (process.platform !== 'win32') {
    try {
      fs.chmodSync(generator.destinationPath('mvnw'), '755');
    } catch (error) {
      generator.log(chalk.yellow(`⚠️ Impossible de définir les permissions d'exécution: ${error}`));
    }
  }
}

/**
 * Crée un script mvnw.cmd minimal
 * @param generator Référence au générateur
 */
function createMinimalMvnwCmdScript(generator: any) {
  const minimalMvnwCmdScript = `@REM ----------------------------------------------------------------------------
@REM Licensed to the Apache Software Foundation (ASF) under one
@REM or more contributor license agreements.  See the NOTICE file
@REM distributed with this work for additional information
@REM regarding copyright ownership.  The ASF licenses this file
@REM to you under the Apache License, Version 2.0 (the
@REM "License"); you may not use this file except in compliance
@REM with the License.  You may obtain a copy of the License at
@REM
@REM    http://www.apache.org/licenses/LICENSE-2.0
@REM
@REM ----------------------------------------------------------------------------

@REM Script généré automatiquement par Spring-Fullstack-Speed

@echo off
@setlocal

set MAVEN_PROJECTBASEDIR=%MAVEN_BASEDIR%
if not "%MAVEN_PROJECTBASEDIR%"=="" goto endDetectBaseDir

set EXEC_DIR=%CD%
set WDIR=%EXEC_DIR%
:findBaseDir
if exist "%WDIR%"\\.mvn goto baseDirFound
cd ..
set WDIR=%CD%
goto findBaseDir

:baseDirFound
set MAVEN_PROJECTBASEDIR=%WDIR%
cd "%EXEC_DIR%"

@REM Execute Maven
java -jar %MAVEN_PROJECTBASEDIR%/.mvn/wrapper/maven-wrapper.jar %*

@endlocal
@exit /b %ERRORLEVEL%`;

  generator.fs.write(
    generator.destinationPath("mvnw.cmd"),
    minimalMvnwCmdScript
  );
  generator.log(chalk.yellow("⚠️ Script mvnw.cmd minimal créé comme solution de secours"));
}

/**
 * Génère les services de l'application
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
export function generateServices(generator: any, templateData: TemplateData) {
  generator.log(chalk.blue("Génération des services..."));

  const mainPath = `src/main/java/${templateData.javaPackagePath}`;
  const servicePath = `${mainPath}/service`;

  // Créer le répertoire des services s'il n'existe pas
  ensureDirectoryExists(generator, servicePath);

  // Liste des services à copier
  const services = [
    'ExampleService.java.ejs',
    'SecurityAuditService.java.ejs'
  ];

  // Copier chaque fichier de service
  services.forEach(service => {
    try {
      const templatePath = generator.templatePath(`src/main/java/com/example/app/service/${service}`);

      // Vérifier si le fichier de template existe
      if (fs.existsSync(templatePath)) {
        generator.fs.copyTpl(
          templatePath,
          generator.destinationPath(`${servicePath}/${service.replace('.ejs', '')}`),
          templateData
        );
        generator.log(chalk.green(`✅ Service ${service.replace('.ejs', '')} généré avec succès`));
      } else {
        generator.log(chalk.yellow(`⚠️ Template du service ${service} introuvable`));
      }
    } catch (error) {
      generator.log(chalk.red(`❌ Erreur lors de la génération du service ${service}: ${error}`));
    }
  });
}

/**
 * Génère les repositories de base pour le projet
 * @param generator Référence au générateur Yeoman
 * @param templateData Les données du template
 */
export function generateRepositories(generator: any, templateData: TemplateData) {
  generator.log(chalk.blue('Génération des repositories...'));

  // Chemin du dossier principal Java
  const mainPath = `src/main/java/${templateData.javaPackagePath}`;

  // Chemin vers le répertoire des repositories
  const repositoryPath = `${mainPath}/repository`;

  // Créer le répertoire des repositories s'il n'existe pas
  ensureDirectoryExists(generator, repositoryPath);

  // Liste des repositories à copier
  const repositories = [
    'BaseRepository.java.ejs',
    'ExampleRepository.java.ejs',
    'RoleRepository.java.ejs',
    'UserRepository.java.ejs'
  ];

  // Si la base de données est MongoDB, ajouter le repository MongoDB au lieu de l'ExampleRepository standard
  if (templateData.database === 'MongoDB') {
    // Remplacer ExampleRepository par MongoExampleRepository pour MongoDB
    const index = repositories.indexOf('ExampleRepository.java.ejs');
    if (index !== -1) {
      repositories[index] = 'MongoExampleRepository.java.ejs';
    }
  }

  // Copier chaque fichier de repository
  repositories.forEach(repository => {
    try {
      let templatePath = generator.templatePath(`src/main/java/com/example/app/repository/${repository}`);
      let outputFileName = repository.replace('.ejs', '');

      // Cas spécial pour MongoExampleRepository
      if (repository === 'MongoExampleRepository.java.ejs') {
        outputFileName = 'ExampleRepository.java'; // Renommer en ExampleRepository.java
      }

      // Vérifier si le fichier de template existe
      if (fs.existsSync(templatePath)) {
        generator.fs.copyTpl(
          templatePath,
          generator.destinationPath(`${repositoryPath}/${outputFileName}`),
          templateData
        );
        generator.log(chalk.green(`✅ Repository ${outputFileName} généré avec succès`));
      } else {
        generator.log(chalk.yellow(`⚠️ Template du repository ${repository} introuvable`));
      }
    } catch (error) {
      generator.log(chalk.red(`❌ Erreur lors de la génération du repository ${repository}: ${error}`));
    }
  });
}

/**
 * Génère les classes utilitaires adaptées à la base de données choisie
 * @param generator Référence au générateur
 * @param templateData Les données du template
 */
export function generateUtilities(generator: any, templateData: TemplateData) {
  generator.log(chalk.blue("Génération des classes utilitaires..."));

  const mainPath = `src/main/java/${templateData.javaPackagePath}`;
  const utilPath = `${mainPath}/util`;

  // Créer le répertoire des utilitaires s'il n'existe pas
  ensureDirectoryExists(generator, utilPath);

  // Liste commune des utilitaires à copier pour toutes les bases de données
  const commonUtilFiles = [
    'ApiError.java.ejs',
    'AppUtils.java.ejs',
    'DateTimeUtils.java.ejs',
    'LoggingUtils.java.ejs',
    'StringUtils.java.ejs',
    'PaginationUtil.java.ejs'
  ];

  // Copier les fichiers utilitaires communs
  commonUtilFiles.forEach(utilFile => {
    try {
      const templatePath = generator.templatePath(`src/main/java/com/example/app/util/${utilFile}`);
      if (fs.existsSync(templatePath)) {
        generator.fs.copyTpl(
          templatePath,
          generator.destinationPath(`${utilPath}/${utilFile.replace('.ejs', '')}`),
          templateData
        );
        generator.log(chalk.green(`✅ Utilitaire ${utilFile.replace('.ejs', '')} généré avec succès`));
      } else {
        generator.log(chalk.yellow(`⚠️ Template de l'utilitaire ${utilFile} introuvable`));
      }
    } catch (error) {
      generator.log(chalk.red(`❌ Erreur lors de la génération de l'utilitaire ${utilFile}: ${error}`));
    }
  });

  // Utilitaires spécifiques à la base de données
  if (templateData.database === 'MongoDB') {
    // Utiliser les classes optimisées pour MongoDB
    try {
      generator.fs.copyTpl(
        generator.templatePath('src/main/java/com/example/app/util/MongoOptimizedQueryUtil.java.ejs'),
        generator.destinationPath(`${utilPath}/OptimizedQueryUtil.java`),
        templateData
      );
      generator.log(chalk.green(`✅ Utilitaire MongoOptimizedQueryUtil généré sous le nom OptimizedQueryUtil.java`));
    } catch (error) {
      generator.log(chalk.red(`❌ Erreur lors de la génération de MongoOptimizedQueryUtil: ${error}`));
    }
  } else {
    // Utiliser les classes JPA standard
    try {
      generator.fs.copyTpl(
        generator.templatePath('src/main/java/com/example/app/util/OptimizedQueryUtil.java.ejs'),
        generator.destinationPath(`${utilPath}/OptimizedQueryUtil.java`),
        templateData
      );
      generator.log(chalk.green(`✅ Utilitaire OptimizedQueryUtil généré avec succès`));
    } catch (error) {
      generator.log(chalk.red(`❌ Erreur lors de la génération d'OptimizedQueryUtil: ${error}`));
    }
  }

  // Gérer LazyLoadingUtil en fonction de la base de données
  try {
    generator.fs.copyTpl(
      generator.templatePath('src/main/java/com/example/app/util/LazyLoadingUtil.java.ejs'),
      generator.destinationPath(`${utilPath}/LazyLoadingUtil.java`),
      templateData
    );
    generator.log(chalk.green(`✅ Utilitaire LazyLoadingUtil généré avec succès`));
  } catch (error) {
    generator.log(chalk.red(`❌ Erreur lors de la génération de LazyLoadingUtil: ${error}`));
  }
}
