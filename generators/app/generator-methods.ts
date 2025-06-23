/**
 * Module de génération de code pour Spring-Fullstack-Speed
 * Ce module contient toutes les méthodes nécessaires pour générer les différentes parties du projet
 */

import chalk from "chalk";
import fs from "fs";
import path from "path";

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
 * Assure que le répertoire existe avant d'y écrire un fichier
 * @param generator Référence au générateur
 * @param dirPath Chemin du répertoire à créer
 */
function ensureDirectoryExists(generator: any, dirPath: string): void {
  if (!dirPath || typeof dirPath !== 'string' || dirPath.trim() === '') {
    generator.log && generator.log(chalk.red(`❌ [SECURITE] Chemin de répertoire invalide ou indéfini: '${dirPath}' (appel ignoré)`));
    return;
  }
  const fullPath = generator.destinationPath(dirPath);
  if (!fs.existsSync(fullPath)) {
    generator.log(chalk.yellow(`📁 Création du répertoire: ${dirPath}`));
    fs.mkdirSync(fullPath, { recursive: true });
  }
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
    // Générer la classe d'application principale avec le bon package
    generator.fs.copyTpl(
      generator.templatePath("Application.java.ejs"),
      generator.destinationPath(`${mainPath}/${className}Application.java`),
      {
        ...templateData,
        packageName: templateData.packageName, // S'assurer que le packageName est défini
        className: className
      }
    );

    // Vérifier que le fichier a été correctement généré
    if (checkFileGeneration(
      generator,
      `${mainPath}/${className}Application.java`,
      `Erreur lors de la génération du fichier ${className}Application.java`
    )) {
      generator.log(chalk.green(`✅ Application principale générée avec le nom ${className}Application.java`));
    }
  } catch (error) {
    generator.log(chalk.red(`❌ Erreur lors de la génération du fichier principal de l'application: ${error}`));

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

      generator.fs.write(
        generator.destinationPath(`${mainPath}/${className}Application.java`),
        minimalApplicationContent
      );
      generator.log(chalk.yellow(`⚠️ Création d'un fichier minimal pour ${className}Application.java`));
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
    generator.log(chalk.yellow("��� Création des répertoires de ressources..."));
    for (const dir of resourceDirectories) {
      ensureDirectoryExists(generator, dir);
      generator.fs.write(
        generator.destinationPath(`${dir}/.gitkeep`),
        "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
      );
    }

    generator.log(chalk.green("✅ Structure des répertoires créée avec succès."));
  } catch (error) {
    generator.log(chalk.red(`❌ Erreur lors de la création des répertoires: ${error}`));
    generator.log(chalk.yellow("⚠️ Tentative de continuer malgré l'erreur..."));
  }
}

/**
 * Génère les fichiers Docker si demandé
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
export function generateDockerFiles(generator: any, templateData: TemplateData) {
  generator.log(chalk.blue("Génération des fichiers Docker..."));

  // Création des répertoires nécessaires pour Docker
  const dockerDirs = [
    "docker",
    "docker/dev",
    "nginx",
    "nginx/conf",
    "nginx/certs",
    "nginx/logs"
  ];

  dockerDirs.forEach(dir => {
    generator.fs.write(
      generator.destinationPath(`${dir}/.gitkeep`),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );
  });

  // Génération du Dockerfile pour le backend
  generator.fs.copyTpl(
    generator.templatePath("docker/backend/Dockerfile.ejs"),
    generator.destinationPath("Dockerfile"),
    templateData
  );

  // Génération du Dockerfile pour le frontend (si un frontend est inclus)
  if (templateData.frontendFramework !== 'Aucun (API seulement)') {
    generator.fs.copyTpl(
      generator.templatePath("docker/frontend/Dockerfile.ejs"),
      generator.destinationPath("frontend/Dockerfile"),
      templateData
    );

    // Copie du fichier de configuration Nginx pour le frontend
    generator.fs.copyTpl(
      generator.templatePath("docker/frontend/nginx.conf.ejs"),
      generator.destinationPath("frontend/nginx.conf"),
      templateData
    );
  }

  // Génération des Dockerfiles de développement
  generator.fs.copyTpl(
    generator.templatePath("docker/dev/Dockerfile.backend.dev.ejs"),
    generator.destinationPath("docker/dev/Dockerfile.backend.dev"),
    templateData
  );

  if (templateData.frontendFramework !== 'Aucun (API seulement)') {
    generator.fs.copyTpl(
      generator.templatePath("docker/dev/Dockerfile.frontend.dev.ejs"),
      generator.destinationPath("docker/dev/Dockerfile.frontend.dev"),
      templateData
    );
  }

  // Génération des fichiers docker-compose
  generator.fs.copyTpl(
    generator.templatePath("docker/docker-compose.dev.yml.ejs"),
    generator.destinationPath("docker-compose.dev.yml"),
    templateData
  );

  generator.fs.copyTpl(
    generator.templatePath("docker/docker-compose.prod.yml.ejs"),
    generator.destinationPath("docker-compose.prod.yml"),
    templateData
  );

  // Génération du docker-compose.yml principal (qui étend les autres)
  generator.fs.copyTpl(
    generator.templatePath("docker/docker-compose.yml.ejs"),
    generator.destinationPath("docker-compose.yml"),
    templateData
  );

  // Configuration Nginx (pour production)
  generator.fs.copyTpl(
    generator.templatePath("docker/nginx/default.conf.ejs"),
    generator.destinationPath("nginx/conf/default.conf"),
    templateData
  );

  // Fichier .env pour les variables d'environnement Docker
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

  generator.fs.write(
    generator.destinationPath(".env"),
    envContent
  );

  generator.log(chalk.green("✅ Configuration Docker ajoutée avec succès!"));
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

    // Copier le fichier maven-wrapper.properties
    generator.fs.copyTpl(
      generator.templatePath("maven-wrapper.properties"),
      generator.destinationPath(".mvn/wrapper/maven-wrapper.properties"),
      {}
    );

    // Copier le fichier maven-wrapper.jar
    // Vérification de l'existence du fichier template avant de le copier
    if (fs.existsSync(generator.templatePath("maven-wrapper.jar"))) {
      generator.fs.copy(
        generator.templatePath("maven-wrapper.jar"),
        generator.destinationPath(".mvn/wrapper/maven-wrapper.jar")
      );
    } else {
      generator.log(chalk.yellow("⚠️ Le fichier maven-wrapper.jar n'a pas été trouvé dans les templates."));
    }

    // Vérifier que le fichier a été généré avec succès
    checkFileGeneration(
      generator,
      ".mvn/wrapper/maven-wrapper.properties",
      "Erreur lors de la génération du fichier maven-wrapper.properties"
    );

    generator.log(chalk.green("✅ Fichiers Maven Wrapper générés avec succès!"));
  } catch (error) {
    generator.log(chalk.red(`❌ Erreur lors de la génération des fichiers Maven Wrapper: ${error}`));
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
      // Création du fichier pom.xml
      generator.fs.copyTpl(
        generator.templatePath("pom.xml.ejs"),
        generator.destinationPath("pom.xml"),
        templateData
      );

      // Création des scripts mvnw (s'assurer que chaque fichier est copié individuellement)
      generator.fs.copy(
        generator.templatePath("mvnw"),
        generator.destinationPath("mvnw")
      );

      generator.fs.copy(
        generator.templatePath("mvnw.cmd"),
        generator.destinationPath("mvnw.cmd")
      );

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
          fs.chmodSync(generator.destinationPath('mvnw'), '755');
        } else {
          fs.chmodSync(generator.destinationPath('gradlew'), '755');
        }
        generator.log(chalk.green("✅ Permissions d'exécution configurées pour les scripts"));
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
 * Génère les fichiers d'authentification
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
export function generateAuth(generator: any, templateData: TemplateData) {
  generator.log(chalk.blue(`Génération de l'authentification (${templateData.authType})...`));

  // S'assurer que les données du template sont complètes et que packageName est défini
  templateData = prepareTemplateData(templateData);

  if (!templateData.packageName) {
    generator.log(chalk.red("❌ Erreur: packageName est undefined. Utilisation d'un package par défaut."));
    templateData.packageName = "com.example.app";
  }

  // Structure de base pour l'authentification
  const mainPath = `src/main/java/${templateData.javaPackagePath}`;

  // Création des répertoires pour l'authentification avec .gitkeep
  const securityDirectories = [
    `${mainPath}/security`,
    `${mainPath}/security/config`,
    `${mainPath}/security/controller`,
    `${mainPath}/security/service`,
    `${mainPath}/security/model`,
    `${mainPath}/security/repository`,
    `${mainPath}/security/dto`
  ];

  securityDirectories.forEach((dir) => {
    ensureDirectoryExists(generator, dir);
    generator.fs.write(
      generator.destinationPath(`${dir}/.gitkeep`),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );
  });

  // Implémentation spécifique selon le type d'authentification
  switch(templateData.authType) {
    case 'JWT':
      // Génération des fichiers pour JWT
      try {
        // Log pour le débogage
        generator.log(chalk.yellow(`ℹ️ Génération JWT avec packageName: ${templateData.packageName}`));
        generator.log(chalk.yellow(`ℹ️ javaPackagePath: ${templateData.javaPackagePath}`));

        // 1. Modèles (Entities)
        generator.fs.copyTpl(
          generator.templatePath('auth/jwt/model/User.java.ejs'),
          generator.destinationPath(`${mainPath}/security/model/User.java`),
          {
            packageName: templateData.packageName,
            javaPackagePath: templateData.javaPackagePath
          }
        );

        generator.fs.copyTpl(
          generator.templatePath('auth/jwt/model/Role.java.ejs'),
          generator.destinationPath(`${mainPath}/security/model/Role.java`),
          {
            packageName: templateData.packageName,
            javaPackagePath: templateData.javaPackagePath
          }
        );

        generator.fs.copyTpl(
          generator.templatePath('auth/jwt/model/ERole.java.ejs'),
          generator.destinationPath(`${mainPath}/security/model/ERole.java`),
          {
            packageName: templateData.packageName,
            javaPackagePath: templateData.javaPackagePath
          }
        );

        // 2. DTOs
        generator.fs.copyTpl(
          generator.templatePath('auth/jwt/dto/LoginRequest.java.ejs'),
          generator.destinationPath(`${mainPath}/security/dto/LoginRequest.java`),
          {
            packageName: templateData.packageName,
            javaPackagePath: templateData.javaPackagePath
          }
        );

        generator.fs.copyTpl(
          generator.templatePath('auth/jwt/dto/SignupRequest.java.ejs'),
          generator.destinationPath(`${mainPath}/security/dto/SignupRequest.java`),
          {
            packageName: templateData.packageName,
            javaPackagePath: templateData.javaPackagePath
          }
        );

        generator.fs.copyTpl(
          generator.templatePath('auth/jwt/dto/JwtResponse.java.ejs'),
          generator.destinationPath(`${mainPath}/security/dto/JwtResponse.java`),
          {
            packageName: templateData.packageName,
            javaPackagePath: templateData.javaPackagePath
          }
        );

        generator.fs.copyTpl(
          generator.templatePath('auth/jwt/dto/MessageResponse.java.ejs'),
          generator.destinationPath(`${mainPath}/security/dto/MessageResponse.java`),
          {
            packageName: templateData.packageName,
            javaPackagePath: templateData.javaPackagePath
          }
        );

        // 3. Configuration
        generator.fs.copyTpl(
          generator.templatePath('auth/jwt/config/WebSecurityConfig.java.ejs'),
          generator.destinationPath(`${mainPath}/security/config/WebSecurityConfig.java`),
          {
            packageName: templateData.packageName,
            javaPackagePath: templateData.javaPackagePath
          }
        );

        generator.fs.copyTpl(
          generator.templatePath('auth/jwt/config/JwtAuthEntryPoint.java.ejs'),
          generator.destinationPath(`${mainPath}/security/config/JwtAuthEntryPoint.java`),
          {
            packageName: templateData.packageName,
            javaPackagePath: templateData.javaPackagePath
          }
        );

        // 4. Services
        generator.fs.copyTpl(
          generator.templatePath('auth/jwt/service/JwtUtils.java.ejs'),
          generator.destinationPath(`${mainPath}/security/service/JwtUtils.java`),
          {
            packageName: templateData.packageName,
            javaPackagePath: templateData.javaPackagePath
          }
        );

        generator.fs.copyTpl(
          generator.templatePath('auth/jwt/service/UserDetailsServiceImpl.java.ejs'),
          generator.destinationPath(`${mainPath}/security/service/UserDetailsServiceImpl.java`),
          {
            packageName: templateData.packageName,
            javaPackagePath: templateData.javaPackagePath
          }
        );

        generator.fs.copyTpl(
          generator.templatePath('auth/jwt/service/UserDetailsImpl.java.ejs'),
          generator.destinationPath(`${mainPath}/security/service/UserDetailsImpl.java`),
          {
            packageName: templateData.packageName,
            javaPackagePath: templateData.javaPackagePath
          }
        );

        // 5. Repositories
        generator.fs.copyTpl(
          generator.templatePath('auth/jwt/repository/UserRepository.java.ejs'),
          generator.destinationPath(`${mainPath}/security/repository/UserRepository.java`),
          {
            packageName: templateData.packageName,
            javaPackagePath: templateData.javaPackagePath
          }
        );

        generator.fs.copyTpl(
          generator.templatePath('auth/jwt/repository/RoleRepository.java.ejs'),
          generator.destinationPath(`${mainPath}/security/repository/RoleRepository.java`),
          {
            packageName: templateData.packageName,
            javaPackagePath: templateData.javaPackagePath
          }
        );

        // 6. Controllers
        generator.fs.copyTpl(
          generator.templatePath('auth/jwt/controller/AuthController.java.ejs'),
          generator.destinationPath(`${mainPath}/security/controller/AuthController.java`),
          {
            packageName: templateData.packageName,
            javaPackagePath: templateData.javaPackagePath
          }
        );

        generator.fs.copyTpl(
          generator.templatePath('auth/jwt/controller/TestController.java.ejs'),
          generator.destinationPath(`${mainPath}/security/controller/TestController.java`),
          {
            packageName: templateData.packageName,
            javaPackagePath: templateData.javaPackagePath
          }
        );

        // 7. Vérifier que les fichiers ont été correctement générés
        const securityFilesToCheck = [
          `${mainPath}/security/model/User.java`,
          `${mainPath}/security/model/Role.java`,
          `${mainPath}/security/model/ERole.java`,
          `${mainPath}/security/config/WebSecurityConfig.java`,
          `${mainPath}/security/service/JwtUtils.java`
        ];

        securityFilesToCheck.forEach(file => {
          checkFileGeneration(
            generator,
            file,
            `Erreur lors de la génération du fichier de sécurité: ${file}`
          );
        });

        // 8. Modifier application.properties pour ajouter les propriétés JWT
        generator.fs.append(
          generator.destinationPath('src/main/resources/application.properties'),
          `
# JWT Properties
app.jwt.secret=${templateData.appName}-jwt-secret-key
app.jwt.expirationMs=86400000
`
        );

        generator.log(chalk.green("✅ Configuration d'authentification JWT générée avec succès!"));
      } catch (error) {
        generator.log(chalk.red(`❌ Erreur lors de la génération des fichiers JWT: ${error}`));
      }
      break;

    case 'JWT+OAuth2':
      // Génération des fichiers pour JWT+OAuth2
      // TODO: À implémenter dans la prochaine phase
      break;

    case 'Basic':
      // Génération des fichiers pour Basic Auth
      // TODO: À implémenter dans la prochaine phase
      break;

    case 'Session':
      // Génération des fichiers pour Session Auth
      // TODO: À implémenter dans la prochaine phase
      break;
  }
}

/**
 * Génère les fichiers de configuration OpenAPI
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
export function generateOpenAPI(generator: any, templateData: TemplateData) {
  generator.log(chalk.blue("Génération de la documentation OpenAPI..."));

  const mainPath = `src/main/java/${templateData.javaPackagePath}`;

  // Création du répertoire pour la configuration OpenAPI avec .gitkeep
  generator.fs.write(
    generator.destinationPath(`${mainPath}/config/.gitkeep`),
    "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
  );

  // 1. Copie des fichiers de configuration OpenAPI
  generator.fs.copyTpl(
    generator.templatePath('openapi/OpenApiConfig.java.ejs'),
    generator.destinationPath(`${mainPath}/config/OpenApiConfig.java`),
    templateData
  );

  generator.fs.copyTpl(
    generator.templatePath('openapi/SwaggerUIConfig.java.ejs'),
    generator.destinationPath(`${mainPath}/config/SwaggerUIConfig.java`),
    templateData
  );

  // 2. Génération d'un exemple de contrôleur avec documentation API
  generator.fs.copyTpl(
    generator.templatePath('openapi/ExampleApiController.java.ejs'),
    generator.destinationPath(`${mainPath}/controller/ExampleApiController.java`),
    templateData
  );

  // 3. Ajout des propriétés OpenAPI dans le fichier application.properties
  generator.fs.append(
    generator.destinationPath('src/main/resources/application.properties'),
    `
# OpenAPI Documentation Configuration
springdoc.swagger-ui.path=/swagger-ui.html
springdoc.api-docs.path=/api-docs
springdoc.swagger-ui.operationsSorter=method
springdoc.swagger-ui.tagsSorter=alpha
springdoc.swagger-ui.displayRequestDuration=true
springdoc.writer-with-order-by-keys=true
springdoc.swagger-ui.disable-swagger-default-url=true
`
  );

  // 4. Mise à jour du pom.xml ou build.gradle pour ajouter les dépendances OpenAPI
  if (templateData.buildTool.toLowerCase() === 'maven') {
    // Pour Maven, nous devons ajouter la dépendance springdoc-openapi
    const pomFilePath = generator.destinationPath('pom.xml');

    if (fs.existsSync(pomFilePath)) {
      let pomContent = fs.readFileSync(pomFilePath, 'utf8');

      // Vérifier si la dépendance existe déjà
      if (pomContent.indexOf('springdoc-openapi-starter-webmvc-ui') === -1) {
        // Position juste avant la fin des dépendances
        const dependenciesEndPos = pomContent.indexOf('</dependencies>');

        if (dependenciesEndPos !== -1) {
          const openApiDependency = `
    <!-- OpenAPI/Swagger Documentation -->
    <dependency>
      <groupId>org.springdoc</groupId>
      <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
      <version>2.2.0</version>
    </dependency>`;

          pomContent =
            pomContent.slice(0, dependenciesEndPos) +
            openApiDependency +
            pomContent.slice(dependenciesEndPos);

          fs.writeFileSync(pomFilePath, pomContent);
        }
      }
    }
  } else if (templateData.buildTool.toLowerCase() === 'gradle') {
    // Pour Gradle, nous ajoutons la dépendance dans build.gradle.kts
    const gradleFilePath = generator.destinationPath('build.gradle.kts');

    if (fs.existsSync(gradleFilePath)) {
      let gradleContent = fs.readFileSync(gradleFilePath, 'utf8');

      // Vérifier si la dépendance existe déjà
      if (gradleContent.indexOf('springdoc-openapi-starter-webmvc-ui') === -1) {
        // Position juste avant la fin des dépendances
        const dependenciesPos = gradleContent.indexOf('dependencies {');

        if (dependenciesPos !== -1) {
          const openApiDependency = `
    // OpenAPI/Swagger Documentation
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.2.0")`;

          // Trouver la position après l'ouverture du bloc dependencies
          const afterDependenciesPos = dependenciesPos + 'dependencies {'.length;

          gradleContent =
            gradleContent.slice(0, afterDependenciesPos) +
            openApiDependency +
            gradleContent.slice(afterDependenciesPos);

          fs.writeFileSync(gradleFilePath, gradleContent);
        }
      }
    }
  }

  generator.log(chalk.green("✅ Configuration OpenAPI/Swagger ajoutée avec succès!"));
}

/**
 * Génère les fichiers de test
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
export function generateTests(generator: any, templateData: TemplateData) {
  generator.log(chalk.blue("Génération des fichiers de test..."));

  // Création des répertoires pour les tests avec .gitkeep
  const testPath = `src/test/java/${templateData.javaPackagePath}`;

  const testDirectories = [
    `${testPath}`,
    `${testPath}/controller`,
    `${testPath}/service`,
    `${testPath}/repository`,
  ];

  if (templateData.includeAuth) {
    testDirectories.push(`${testPath}/security`);
  }

  testDirectories.forEach((dir) => {
    generator.fs.write(
      generator.destinationPath(`${dir}/.gitkeep`),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );
  });

  // À implémenter: génération des fichiers de test
}

/**
 * Dirige vers la méthode de génération de frontend appropriée
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
export function generateFrontend(generator: any, templateData: TemplateData) {
  generator.log(chalk.blue(`Génération du frontend (${templateData.frontendFramework})...`));

  switch(templateData.frontendFramework) {
    case 'React avec openapi':
      generateReactFrontend(generator, templateData);
      break;
    case 'Vue.js avec openapi':
      generateVueFrontend(generator, templateData);
      break;
    case 'Angular standalone':
      generateAngularFrontend(generator, templateData);
      break;
    case 'Thymeleaf':
      generateThymeleafFrontend(generator, templateData);
      break;
    case 'JTE':
      generateJTEFrontend(generator, templateData);
      break;
  }
}

/**
 * Génère un frontend React
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
export function generateReactFrontend(generator: any, templateData: TemplateData) {
  generator.log(chalk.blue("Génération du frontend React..."));

  // Création de la structure de répertoires
  const directories = [
    "frontend",
    "frontend/src",
    "frontend/src/components",
    "frontend/src/pages",
    "frontend/src/hooks",
    "frontend/src/services",
    "frontend/scripts"
  ];

  directories.forEach(dir => {
    ensureDirectoryExists(generator, dir);
    generator.fs.write(
      generator.destinationPath(`${dir}/.gitkeep`),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );
  });

  // Copier les fichiers de configuration
  generator.fs.copyTpl(
    generator.templatePath("frontend/react/package.json.ejs"),
    generator.destinationPath("frontend/package.json"),
    templateData
  );

  generator.fs.copyTpl(
    generator.templatePath("frontend/react/vite.config.ts.ejs"),
    generator.destinationPath("frontend/vite.config.ts"),
    templateData
  );

  generator.fs.copyTpl(
    generator.templatePath("frontend/react/tsconfig.json.ejs"),
    generator.destinationPath("frontend/tsconfig.json"),
    templateData
  );

  generator.fs.copyTpl(
    generator.templatePath("frontend/react/tsconfig.node.json.ejs"),
    generator.destinationPath("frontend/tsconfig.node.json"),
    templateData
  );

  // Copier les fichiers de base
  generator.fs.copyTpl(
    generator.templatePath("frontend/react/src/App.tsx.ejs"),
    generator.destinationPath("frontend/src/App.tsx"),
    templateData
  );

  // Copier les pages de base
  generator.fs.copyTpl(
    generator.templatePath("frontend/react/src/pages/Home.tsx.ejs"),
    generator.destinationPath("frontend/src/pages/Home.tsx"),
    templateData
  );

  // Copier le script de génération d'API
  generator.fs.copyTpl(
    generator.templatePath("frontend/react/scripts/api-generate.js.ejs"),
    generator.destinationPath("frontend/scripts/api-generate.js"),
    templateData
  );

  // Copier le guide d'API
  generator.fs.copyTpl(
    generator.templatePath("frontend/react/API-GUIDE.md.ejs"),
    generator.destinationPath("frontend/API-GUIDE.md"),
    templateData
  );
}

/**
 * Génère un frontend Vue.js
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
export function generateVueFrontend(generator: any, templateData: TemplateData) {
  generator.log(chalk.blue("Génération du frontend Vue.js..."));

  try {
    // Création de la structure de répertoires principale
    const directories = [
      "frontend",
      "frontend/src",
      "frontend/src/components",
      "frontend/src/views",
      "frontend/src/pages",
      "frontend/src/services",
      "frontend/src/stores",
      "frontend/src/router",
      "frontend/src/utils",
      "frontend/src/assets",
      "frontend/src/layouts",
      "frontend/public",
      "frontend/scripts",
      "frontend/styles",
      "frontend/tests",
      "frontend/tests/components",
      "frontend/tests/stores"
    ];

    directories.forEach(dir => {
      ensureDirectoryExists(generator, dir);
      generator.fs.write(
        generator.destinationPath(`${dir}/.gitkeep`),
        "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
      );
    });

    // Fonction pour copier un fichier template avec gestion des erreurs
    const safelyCopyTemplate = (templatePath: string, destPath: string, data = templateData) => {
      try {
        const fullTemplatePath = generator.templatePath(templatePath);
        // Vérifier si le template existe
        if (fs.existsSync(fullTemplatePath)) {
          generator.fs.copyTpl(
            fullTemplatePath,
            generator.destinationPath(destPath),
            data
          );
          generator.log(chalk.green(`✅ Fichier généré avec succès: ${destPath}`));
        } else {
          generator.log(chalk.yellow(`⚠️ Template introuvable: ${templatePath}`));
          // Créer un fichier minimal si le template n'existe pas
          createFallbackFile(generator, destPath, templatePath);
        }
      } catch (error) {
        generator.log(chalk.red(`❌ Erreur lors de la génération de ${destPath}: ${error}`));
        // Créer un fichier minimal en cas d'erreur
        createFallbackFile(generator, destPath, templatePath);
      }
    };

    // Copier les fichiers de configuration
    safelyCopyTemplate("frontend/vue/package.json.ejs", "frontend/package.json");
    safelyCopyTemplate("frontend/vue/vite.config.ts.ejs", "frontend/vite.config.ts");
    safelyCopyTemplate("frontend/vue/tsconfig.json.ejs", "frontend/tsconfig.json");
    safelyCopyTemplate("frontend/vue/tsconfig.node.json.ejs", "frontend/tsconfig.node.json");
    safelyCopyTemplate("frontend/vue/tailwind.config.js.ejs", "frontend/tailwind.config.js");

    // Copier les fichiers de base Vue
    safelyCopyTemplate("frontend/vue/src/App.vue.ejs", "frontend/src/App.vue");
    safelyCopyTemplate("frontend/vue/src/main.ts.ejs", "frontend/src/main.ts");

    // Copier les fichiers d'assets et styles
    safelyCopyTemplate("frontend/vue/src/assets/main.css.ejs", "frontend/src/assets/main.css");
    safelyCopyTemplate("frontend/vue/styles/main.css.ejs", "frontend/styles/main.css");

    // Copier les composants UI avec gestion des erreurs
    const uiComponents = ["Button", "Card", "InputField", "Alert"];
    uiComponents.forEach(component => {
      ensureDirectoryExists(generator, `frontend/src/components/ui`);
      safelyCopyTemplate(
        `frontend/vue/src/components/ui/${component}.vue.ejs`,
        `frontend/src/components/ui/${component}.vue`
      );
    });

    // Copier les composants de navigation
    ensureDirectoryExists(generator, `frontend/src/components/navigation`);
    safelyCopyTemplate(
      "frontend/vue/src/components/navigation/Navbar.vue.ejs",
      "frontend/src/components/navigation/Navbar.vue"
    );
    safelyCopyTemplate(
      "frontend/vue/src/components/navigation/Footer.vue.ejs",
      "frontend/src/components/navigation/Footer.vue"
    );

    // Copier les composants de formulaire
    ensureDirectoryExists(generator, `frontend/src/components/forms`);
    safelyCopyTemplate(
      "frontend/vue/src/components/forms/ContactForm.vue.ejs",
      "frontend/src/components/forms/ContactForm.vue"
    );

    // Copier les autres composants
    ensureDirectoryExists(generator, `frontend/src/components/examples`);
    safelyCopyTemplate(
      "frontend/vue/src/components/UsersList.vue.ejs",
      "frontend/src/components/UsersList.vue"
    );
    safelyCopyTemplate(
      "frontend/vue/src/components/examples/ApiExample.vue.ejs",
      "frontend/src/components/examples/ApiExample.vue"
    );

    // Copier les layouts
    safelyCopyTemplate(
      "frontend/vue/src/layouts/MainLayout.vue.ejs",
      "frontend/src/layouts/MainLayout.vue"
    );

    // Copier les pages
    safelyCopyTemplate(
      "frontend/vue/src/pages/Home.vue.ejs",
      "frontend/src/pages/Home.vue"
    );
    safelyCopyTemplate(
      "frontend/vue/src/pages/NotFound.vue.ejs",
      "frontend/src/pages/NotFound.vue"
    );

    // Copier les pages d'authentification
    ensureDirectoryExists(generator, `frontend/src/pages/Auth`);
    const authPages = ["Login", "Register", "ForgotPassword", "ResetPassword"];
    authPages.forEach(page => {
      safelyCopyTemplate(
        `frontend/vue/src/pages/Auth/${page}.vue.ejs`,
        `frontend/src/pages/Auth/${page}.vue`
      );
    });

    // Copier la configuration du router, les services API, les stores, etc.
    safelyCopyTemplate(
      "frontend/vue/src/router/index.ts.ejs",
      "frontend/src/router/index.ts"
    );

    // API services, stores, utils
    safelyCopyTemplate(
      "frontend/vue/src/services/apiConfig.ts.ejs",
      "frontend/src/services/apiConfig.ts"
    );
    safelyCopyTemplate(
      "frontend/vue/src/services/apiService.ts.ejs",
      "frontend/src/services/apiService.ts"
    );
    safelyCopyTemplate(
      "frontend/vue/src/stores/index.ts.ejs",
      "frontend/src/stores/index.ts"
    );
    safelyCopyTemplate(
      "frontend/vue/src/stores/authStore.ts.ejs",
      "frontend/src/stores/authStore.ts"
    );
    safelyCopyTemplate(
      "frontend/vue/src/stores/userStore.ts.ejs",
      "frontend/src/stores/userStore.ts"
    );
    safelyCopyTemplate(
      "frontend/vue/src/utils/form-validation.ts.ejs",
      "frontend/src/utils/form-validation.ts"
    );
    safelyCopyTemplate(
      "frontend/vue/src/utils/validators.ts.ejs",
      "frontend/src/utils/validators.ts"
    );
    safelyCopyTemplate(
      "frontend/vue/scripts/api-generate.js.ejs",
      "frontend/scripts/api-generate.js"
    );

    // Tests
    safelyCopyTemplate(
      "frontend/vue/tests/setup.ts.ejs",
      "frontend/tests/setup.ts"
    );
    safelyCopyTemplate(
      "frontend/vue/tests/api-generated.test.ts.ejs",
      "frontend/tests/api-generated.test.ts"
    );
    safelyCopyTemplate(
      "frontend/vue/tests/components/ApiExample.test.ts.ejs",
      "frontend/tests/components/ApiExample.test.ts"
    );
    safelyCopyTemplate(
      "frontend/vue/tests/stores/authStore.test.ts.ejs",
      "frontend/tests/stores/authStore.test.ts"
    );

    // Guide API
    safelyCopyTemplate(
      "frontend/vue/API-GUIDE.md.ejs",
      "frontend/API-GUIDE.md"
    );

    generator.log(chalk.green("✅ Frontend Vue.js généré avec succès!"));
  } catch (error) {
    generator.log(chalk.red(`❌ Erreur lors de la génération du frontend Vue.js: ${error}`));
    generator.log(chalk.yellow("⚠️ Création de fichiers frontend minimaux..."));

    // Assurer que les fichiers critiques existent même en cas d'erreur
    createFallbackVueFrontend(generator, templateData);
  }
}

/**
 * Génère un frontend Angular
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
export function generateAngularFrontend(generator: any, templateData: TemplateData) {
  generator.log(chalk.blue("Génération du frontend Angular..."));

  // Création de la structure de répertoires
  const directories = [
    "frontend",
    "frontend/src",
    "frontend/src/app",
    "frontend/src/app/components",
    "frontend/src/app/pages",
    "frontend/src/app/services",
    "frontend/src/app/core"
  ];

  directories.forEach(dir => {
    generator.fs.write(
      generator.destinationPath(`${dir}/.gitkeep`),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );
  });

  // Copier les fichiers de configuration
  generator.fs.copyTpl(
    generator.templatePath("frontend/angular/package.json.ejs"),
    generator.destinationPath("frontend/package.json"),
    templateData
  );

  generator.fs.copyTpl(
    generator.templatePath("frontend/angular/angular.json.ejs"),
    generator.destinationPath("frontend/angular.json"),
    templateData
  );

  generator.fs.copyTpl(
    generator.templatePath("frontend/angular/tsconfig.json.ejs"),
    generator.destinationPath("frontend/tsconfig.json"),
    templateData
  );

  // Copier les fichiers de base Angular
  generator.fs.copyTpl(
    generator.templatePath("frontend/angular/src/main.ts.ejs"),
    generator.destinationPath("frontend/src/main.ts"),
    templateData
  );

  generator.fs.copyTpl(
    generator.templatePath("frontend/angular/src/app/app.component.ts.ejs"),
    generator.destinationPath("frontend/src/app/app.component.ts"),
    templateData
  );

  generator.fs.copyTpl(
    generator.templatePath("frontend/angular/src/app/app.component.html.ejs"),
    generator.destinationPath("frontend/src/app/app.component.html"),
    templateData
  );

  generator.fs.copyTpl(
    generator.templatePath("frontend/angular/src/app/app.routes.ts.ejs"),
    generator.destinationPath("frontend/src/app/app.routes.ts"),
    templateData
  );

  // Copier le guide d'API
  generator.fs.copyTpl(
    generator.templatePath("frontend/angular/API-GUIDE.md.ejs"),
    generator.destinationPath("frontend/API-GUIDE.md"),
    templateData
  );
}

/**
 * Génère un frontend Thymeleaf
 * @param generator Référence au générateur
 * @param templateData Les donn��es pour la génération
 */
export function generateThymeleafFrontend(generator: any, templateData: TemplateData) {
  generator.log(chalk.blue("Génération du frontend Thymeleaf..."));

  // Création des dossiers nécessaires
  const directories = [
    "src/main/resources/templates",
    "src/main/resources/templates/layouts",
    "src/main/resources/templates/fragments",
    "src/main/resources/static/css",
    "src/main/resources/static/js"
  ];

  directories.forEach(dir => {
    generator.fs.write(
      generator.destinationPath(`${dir}/.gitkeep`),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );
  });

  // Copier les fichiers de base Thymeleaf
  generator.fs.copyTpl(
    generator.templatePath("frontend/thymeleaf/pages/index.html.ejs"),
    generator.destinationPath("src/main/resources/templates/index.html"),
    templateData
  );

  generator.fs.copyTpl(
    generator.templatePath("frontend/thymeleaf/layouts/main.html.ejs"),
    generator.destinationPath("src/main/resources/templates/layouts/main.html"),
    templateData
  );

  generator.fs.copyTpl(
    generator.templatePath("frontend/thymeleaf/pages/home.html.ejs"),
    generator.destinationPath("src/main/resources/templates/home.html"),
    templateData
  );

  // Copier les pages d'authentification si nécessaire
  if (templateData.includeAuth) {
    generator.fs.copyTpl(
      generator.templatePath("frontend/thymeleaf/pages/login.html.ejs"),
      generator.destinationPath("src/main/resources/templates/login.html"),
      templateData
    );
  }
}

/**
 * Génère un frontend JTE
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
export function generateJTEFrontend(generator: any, templateData: TemplateData) {
  generator.log(chalk.blue("G��nération du frontend JTE..."));

  // Création des dossiers nécessaires
  const directories = [
    "src/main/jte",
    "src/main/jte/layouts",
    "src/main/jte/pages",
    "src/main/jte/components"
  ];

  directories.forEach(dir => {
    generator.fs.write(
      generator.destinationPath(`${dir}/.gitkeep`),
      "# Ce fichier garantit que le répertoire sera inclus dans Git\n"
    );
  });

  // Copier les fichiers de base JTE
  generator.fs.copyTpl(
    generator.templatePath("frontend/jte/layouts/main.jte.ejs"),
    generator.destinationPath("src/main/jte/layouts/main.jte"),
    templateData
  );

  generator.fs.copyTpl(
    generator.templatePath("frontend/jte/layouts/default.jte.ejs"),
    generator.destinationPath("src/main/jte/layouts/default.jte"),
    templateData
  );
}

/**
 * Génère les fichiers de configuration Kubernetes pour le déploiement de l'application
 * @param generator Instance du générateur
 * @param templateData Données du template
 */
export const generateKubernetes = (generator: any, templateData: TemplateData) => {
  generator.log(chalk.cyan("\n📦 Génération des fichiers Kubernetes..."));

  try {
    // Utiliser le générateur Kubernetes dédié au lieu de copier les templates manuellement
    generator.log(chalk.yellow("⚠️ Démarrage du générateur Kubernetes dédié..."));

    // Passer les données du template au générateur Kubernetes
    const kubernetesOptions = {
      appName: templateData.appName,
      database: templateData.database,
      serverPort: templateData.serverPort || 8080,
      frontendFramework: templateData.frontendFramework,
      namespace: templateData.appName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      // Options par défaut
      deploymentType: 'raw-manifests',
      createIngress: true,
      createConfigMap: true,
      createSecrets: true,
      createPVC: templateData.database !== 'H2',
      enableAutoscaling: false,
      replicas: '2'
    };

    // Appeler le sous-générateur Kubernetes
    generator.composeWith(require.resolve('../kubernetes'), kubernetesOptions);

    generator.log(chalk.green("✅ Configuration Kubernetes prête à être générée!"));
    generator.log(chalk.gray("💡 Astuce: Utilisez 'sfs kubernetes' pour personnaliser davantage votre déploiement Kubernetes."));
  } catch (error) {
    generator.log(chalk.red(`❌ Erreur lors de la configuration Kubernetes: ${error}`));
    generator.log(chalk.yellow("⚠️ Utilisez la commande 'sfs kubernetes' pour générer la configuration Kubernetes manuellement."));
  }
}

/**
 * Crée un fichier de secours basique quand un template est manquant
 * @param generator Référence au générateur
 * @param destPath Chemin de destination du fichier
 * @param templatePath Chemin du template qui était manquant
 */
function createFallbackFile(generator: any, destPath: string, templatePath: string) {
  try {
    // Déterminer le type de fichier à partir de l'extension
    if (destPath.endsWith('.vue')) {
      // Fichier Vue basique
      const content = `<template>
  <div>
    <!-- Contenu généré automatiquement (template manquant: ${templatePath}) -->
    <p>Composant Vue.js</p>
  </div>
</template>

<script>
export default {
  name: '${path.basename(destPath, '.vue')}',
  data() {
    return {
      // données du composant
    }
  }
}
</script>

<style scoped>
/* styles du composant */
</style>`;
      generator.fs.write(generator.destinationPath(destPath), content);
    } else if (destPath.endsWith('.ts')) {
      // Fichier TypeScript basique
      let content = '// Fichier généré automatiquement (template manquant: ' + templatePath + ')\n\n';

      if (destPath.includes('main.ts')) {
        content += `import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
`;
      } else if (destPath.includes('store')) {
        content += `import { defineStore } from 'pinia'

export const useDefaultStore = defineStore('default', {
  state: () => ({
    items: []
  }),
  actions: {
    addItem(item) {
      this.items.push(item)
    }
  }
})
`;
      }

      generator.fs.write(generator.destinationPath(destPath), content);
    } else if (destPath.endsWith('.js')) {
      // Fichier JavaScript basique
      const content = '// Fichier généré automatiquement (template manquant: ' + templatePath + ')\n\n';
      generator.fs.write(generator.destinationPath(destPath), content);
    } else if (destPath.endsWith('package.json')) {
      // package.json minimal pour Vue.js
      const content = `{
  "name": "${generator.answers?.appName || 'vue-frontend'}-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext .vue,.js,.jsx,.cjs,.mjs --fix --ignore-path .gitignore",
    "test": "vitest"
  },
  "dependencies": {
    "axios": "^1.6.2",
    "pinia": "^2.1.7",
    "vue": "^3.3.9",
    "vue-router": "^4.2.5"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^4.5.1",
    "eslint": "^8.54.0",
    "eslint-plugin-vue": "^9.18.1",
    "vite": "^5.0.4",
    "vitest": "^0.34.6"
  }
}`;
      generator.fs.write(generator.destinationPath(destPath), content);
    } else if (destPath.endsWith('vite.config.ts')) {
      // vite.config.ts minimal
      const content = `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})`;
      generator.fs.write(generator.destinationPath(destPath), content);
    } else {
      // Fichier texte générique
      generator.fs.write(
        generator.destinationPath(destPath),
        `// Fichier généré automatiquement (template manquant: ${templatePath})
// Ce fichier a été créé comme solution de secours car le template d'origine n'a pas pu être trouvé.
// Vous devrez peut-être le remplacer par un contenu approprié.
`);
    }

    generator.log(chalk.yellow(`⚠️ Fichier de secours créé: ${destPath}`));
  } catch (error) {
    generator.log(chalk.red(`❌ Erreur lors de la création du fichier de secours pour ${destPath}: ${error}`));
  }
}

/**
 * Crée une structure de frontend Vue.js minimale en cas d'échec de la génération principale
 * @param generator Référence au générateur
 * @param templateData Données du template
 */
function createFallbackVueFrontend(generator: any, templateData: TemplateData) {
  try {
    // S'assurer que les répertoires de base existent
    const directories = [
      "frontend",
      "frontend/src",
      "frontend/public"
    ];

    directories.forEach(dir => {
      ensureDirectoryExists(generator, dir);
    });

    // package.json minimal
    const packageJson = `{
  "name": "${templateData.appName}-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.6.2",
    "vue": "^3.3.9",
    "vue-router": "^4.2.5"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^4.5.1",
    "vite": "^5.0.4"
  }
}`;
    generator.fs.write(generator.destinationPath("frontend/package.json"), packageJson);

    // vite.config.ts minimal
    const viteConfig = `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})`;
    generator.fs.write(generator.destinationPath("frontend/vite.config.ts"), viteConfig);

    // App.vue minimal
    const appVue = `<template>
  <div id="app">
    <h1>${templateData.appName} - Frontend</h1>
    <p>Cette application a été générée avec Spring-Fullstack-Speed</p>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
#app {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 20px;
  text-align: center;
}
</style>`;
    generator.fs.write(generator.destinationPath("frontend/src/App.vue"), appVue);

    // main.ts minimal
    const mainTs = `import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
`;
    generator.fs.write(generator.destinationPath("frontend/src/main.ts"), mainTs);

    // index.html minimal
    const indexHtml = `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${templateData.appName} - Frontend</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>`;
    generator.fs.write(generator.destinationPath("frontend/index.html"), indexHtml);

    generator.log(chalk.green("✅ Frontend Vue.js minimal généré avec succès!"));
  } catch (error) {
    generator.log(chalk.red(`❌ Erreur lors de la création du frontend Vue.js minimal: ${error}`));
  }
}
