/**
 * Module de vérifications post-génération pour Spring-Fullstack-Speed
 * Ce module contient des fonctions pour valider l'intégrité du projet après génération
 */

import chalk from "chalk";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

// Convertir exec en Promise
const execAsync = promisify(exec);

/**
 * Interface pour les résultats de vérification
 */
interface CheckResult {
  success: boolean;
  missingFiles: string[];
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * Liste des fichiers essentiels qui devraient être présents dans tout projet Spring Boot
 * @param templateData Données du modèle utilisé pour la génération
 * @returns string[] Liste des fichiers essentiels
 */
function getEssentialFiles(templateData: any): string[] {
  const files:any = [];
  const buildTool = templateData.buildTool?.toLowerCase() || 'maven';
  const packagePath = templateData.javaPackagePath || templateData.packageName?.replace(/\./g, '/') || 'com/example';
  const mainPath = `src/main/java/${packagePath}`;
  const className = templateData.appName
    .split("-")
    .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

  // Fichier principal de build
  if (buildTool === 'maven') {
    files.push('pom.xml');
    files.push('mvnw');
    files.push('mvnw.cmd');
  } else {
    files.push('build.gradle.kts');
    files.push('settings.gradle.kts');
    files.push('gradlew');
    files.push('gradlew.bat');
  }

  // Fichiers de l'application
  files.push(`${mainPath}/${className}Application.java`);
  files.push('src/main/resources/application.properties');
  files.push('src/main/resources/application-dev.properties');
  files.push('src/main/resources/application-prod.properties');
  files.push('.gitignore');
  files.push('README.md');

  // Docker
  files.push('Dockerfile');
  files.push('docker-compose.yml');

  // Si un frontend est configuré
  if (templateData.frontendFramework !== 'Aucun (API seulement)') {
    files.push('frontend/package.json');
    if (templateData.frontendFramework.includes('React')) {
      files.push('frontend/vite.config.ts');
      files.push('frontend/src/App.tsx');
    } else if (templateData.frontendFramework.includes('Vue')) {
      files.push('frontend/vite.config.ts');
      files.push('frontend/src/App.vue');
      files.push('frontend/src/main.ts');
    } else if (templateData.frontendFramework.includes('Angular')) {
      files.push('frontend/angular.json');
      files.push('frontend/src/app/app.component.ts');
    }
  }

  // Fichiers spécifiques à l'authentification
  if (templateData.includeAuth) {
    if (templateData.authType === 'JWT') {
      files.push(`${mainPath}/security/config/WebSecurityConfig.java`);
      files.push(`${mainPath}/security/model/User.java`);
      files.push(`${mainPath}/security/model/Role.java`);
      files.push(`${mainPath}/security/service/JwtUtils.java`);
    }
  }

  // Kubernetes
  if (templateData.kubernetes) {
    files.push('kubernetes/README.md');

    if (templateData.kubernetes.deploymentType === 'raw-manifests') {
      files.push(`kubernetes/deployments/${templateData.appName}-deployment.yaml`);
      files.push(`kubernetes/services/${templateData.appName}-service.yaml`);
    } else if (templateData.kubernetes.deploymentType === 'helm') {
      files.push(`kubernetes/helm/${templateData.appName}/Chart.yaml`);
      files.push(`kubernetes/helm/${templateData.appName}/values.yaml`);
    }
  }

  return files;
}

/**
 * Vérifie l'existence des fichiers essentiels dans le projet généré
 * @param generator Référence au générateur
 * @param templateData Données du template utilisé
 * @returns CheckResult Résultats de la vérification
 */
export function verifyProjectIntegrity(generator: any, templateData: any): CheckResult {
  generator.log(chalk.blue("🔍 Vérification de l'intégrité du projet généré..."));

  const result: CheckResult = {
    success: true,
    missingFiles: [],
    errors: [],
    warnings: [],
    suggestions: []
  };

  // Récupérer la liste des fichiers essentiels
  const essentialFiles = getEssentialFiles(templateData);

  // Vérifier l'existence de chaque fichier essentiel
  for (const file of essentialFiles) {
    const filePath = generator.destinationPath(file);
    if (!fs.existsSync(filePath)) {
      result.success = false;
      result.missingFiles.push(file);
    }
  }

  // Vérifier les permissions d'exécution des scripts
  checkExecutablePermissions(generator, templateData, result);

  // Si frontend, vérifier package.json
  if (templateData.frontendFramework !== 'Aucun (API seulement)') {
    checkPackageJsonIntegrity(generator, templateData, result);
  }

  return result;
}

/**
 * Vérifie les permissions d'exécution des scripts
 */
function checkExecutablePermissions(generator: any, templateData: any, result: CheckResult): void {
  if (process.platform === 'win32') {
    // Windows ne gère pas les permissions comme Unix
    return;
  }

  const scriptsToCheck:any = [];
  if (templateData.buildTool.toLowerCase() === 'maven') {
    scriptsToCheck.push('mvnw');
  } else {
    scriptsToCheck.push('gradlew');
  }

  for (const script of scriptsToCheck) {
    const scriptPath = generator.destinationPath(script);
    if (fs.existsSync(scriptPath)) {
      try {
        const stats = fs.statSync(scriptPath);
        const isExecutable = !!(stats.mode & 0o111); // Vérifie si le mode inclut des permissions d'exécution

        if (!isExecutable) {
          result.warnings.push(`Le script ${script} n'a pas les permissions d'exécution.`);
          // Correction automatique
          try {
            fs.chmodSync(scriptPath, '755');
            result.suggestions.push(`Les permissions d'exécution ont été ajoutées à ${script}.`);
          } catch (err) {
            result.errors.push(`Impossible d'ajouter des permissions d'exécution à ${script}: ${err}`);
          }
        }
      } catch (err) {
        result.errors.push(`Erreur lors de la vérification des permissions de ${script}: ${err}`);
      }
    }
  }
}

/**
 * Vérifie l'intégrité du package.json pour le frontend
 */
function checkPackageJsonIntegrity(generator: any, templateData: any, result: CheckResult): void {
  const packageJsonPath = generator.destinationPath('frontend/package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      // Vérifier les dépendances essentielles selon le framework
      const framework = templateData.frontendFramework;
      const missingDeps:any = [];

      if (framework.includes('React')) {
        if (!packageJson.dependencies.react) missingDeps.push('react');
        if (!packageJson.dependencies['react-dom']) missingDeps.push('react-dom');
      } else if (framework.includes('Vue')) {
        if (!packageJson.dependencies.vue) missingDeps.push('vue');
        if (!packageJson.dependencies['vue-router']) missingDeps.push('vue-router');
      } else if (framework.includes('Angular')) {
        if (!packageJson.dependencies['@angular/core']) missingDeps.push('@angular/core');
      }

      if (missingDeps.length > 0) {
        result.warnings.push(`Le fichier package.json ne contient pas toutes les dépendances nécessaires pour ${framework}: ${missingDeps.join(', ')}`);
      }

      // Vérifiez que les scripts essentiels sont présents
      const requiredScripts = ['dev', 'build', 'preview'];
      const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);

      if (missingScripts.length > 0) {
        result.warnings.push(`Le fichier package.json ne contient pas tous les scripts nécessaires: ${missingScripts.join(', ')}`);
      }
    } catch (err) {
      result.errors.push(`Erreur lors de l'analyse du package.json: ${err}`);
    }
  }
}

/**
 * Installe les dépendances NPM pour le frontend si nécessaire
 * @param generator Référence au générateur
 * @param templateData Données du template utilisé
 */
export async function installFrontendDependencies(generator: any, templateData: any): Promise<{success: boolean, error?: string}> {
  if (templateData.frontendFramework === 'Aucun (API seulement)') {
    return { success: true };
  }

  generator.log(chalk.blue("📦 Installation des dépendances frontend..."));

  const frontendDir = generator.destinationPath('frontend');
  const packageJsonPath = path.join(frontendDir, 'package.json');

  // Vérifier si package.json existe
  if (!fs.existsSync(packageJsonPath)) {
    return {
      success: false,
      error: "Le fichier package.json n'a pas été trouvé. Les dépendances frontend ne peuvent pas être installées."
    };
  }

  try {
    // Déterminer le gestionnaire de paquets à utiliser (npm ou yarn)
    let packageManager = 'npm';
    // Tester si yarn est disponible
    try {
      await execAsync('yarn --version', { cwd: frontendDir });
      packageManager = 'yarn';
    } catch (e) {
      // Yarn n'est pas disponible, on utilise npm par défaut
    }

    generator.log(chalk.yellow(`Utilisation de ${packageManager} pour installer les dépendances...`));

    // Commande d'installation
    const installCommand = packageManager === 'yarn' ? 'yarn install' : 'npm install';

    // Exécuter la commande d'installation
    generator.log(chalk.yellow(`Exécution de: ${installCommand} dans ${frontendDir}`));
    await execAsync(installCommand, { cwd: frontendDir });

    generator.log(chalk.green("✅ Installation des dépendances frontend terminée avec succès."));
    return { success: true };
  } catch (error) {
    const errorMessage = `Erreur lors de l'installation des dépendances frontend: ${error}`;
    generator.log(chalk.red(`❌ ${errorMessage}`));

    // Suggestions de résolution
    generator.log(chalk.yellow("\nSuggestions de résolution:"));
    generator.log(chalk.yellow("1. Vérifiez votre connexion internet"));
    generator.log(chalk.yellow("2. Assurez-vous que npm ou yarn est correctement installé"));
    generator.log(chalk.yellow("3. Essayez d'installer manuellement les dépendances:"));
    generator.log(chalk.yellow(`   - cd ${frontendDir}`));
    generator.log(chalk.yellow("   - npm install"));

    return { success: false, error: errorMessage };
  }
}

/**
 * Vérifie les versions des outils requis (Node.js, Java, etc.)
 */
export async function checkToolVersions(generator: any): Promise<{success: boolean, messages: string[]}> {
  generator.log(chalk.blue("🔍 Vérification des versions des outils requis..."));

  const messages: string[] = [];
  let success = true;

  try {
    // Vérifier Node.js
    const nodeResult = await execAsync('node --version');
    const nodeVersion = nodeResult.stdout.trim();
    const nodeVersionNum = parseFloat(nodeVersion.replace('v', ''));

    if (nodeVersionNum < 14) {
      messages.push(chalk.red(`⚠️ Votre version de Node.js (${nodeVersion}) est ancienne. Nous recommandons Node.js 14+.`));
      success = false;
    } else {
      messages.push(chalk.green(`✅ Node.js ${nodeVersion} détecté.`));
    }

    // Vérifier npm
    const npmResult = await execAsync('npm --version');
    const npmVersion = npmResult.stdout.trim();
    messages.push(chalk.green(`✅ npm ${npmVersion} détecté.`));

    // Vérifier Java si possible
    try {
      const javaResult = await execAsync('java -version 2>&1');
      // java -version écrit sur stderr, pas stdout
      const javaVersionOutput = javaResult.stderr || javaResult.stdout;
      const javaVersionMatch = javaVersionOutput.match(/"(\d+\.\d+).*"/);

      if (javaVersionMatch) {
        const javaVersion = javaVersionMatch[1];
        const javaVersionNum = parseFloat(javaVersion);

        if (javaVersionNum < 17) {
          messages.push(chalk.yellow(`⚠️ Votre version de Java (${javaVersion}) peut ne pas être compatible. Spring Boot 3 recommande Java 17+.`));
        } else {
          messages.push(chalk.green(`✅ Java ${javaVersion} détecté.`));
        }
      } else {
        messages.push(chalk.yellow(`⚠️ Version de Java non détectée. Assurez-vous que Java est correctement installé.`));
      }
    } catch (err) {
      messages.push(chalk.yellow("⚠️ Java n'a pas été détecté sur votre système. Vous aurez besoin de Java 17+ pour exécuter votre application Spring Boot."));
    }

    // Vérifier Maven/Gradle si possible
    try {
      const mvnResult = await execAsync('mvn --version');
      const mvnVersionMatch = mvnResult.stdout.match(/Apache Maven (\d+\.\d+\.\d+)/);
      if (mvnVersionMatch) {
        messages.push(chalk.green(`✅ Maven ${mvnVersionMatch[1]} détecté.`));
      }
    } catch (err) {
      try {
        const gradleResult = await execAsync('gradle --version');
        const gradleVersionMatch = gradleResult.stdout.match(/Gradle (\d+\.\d+)/);
        if (gradleVersionMatch) {
          messages.push(chalk.green(`✅ Gradle ${gradleVersionMatch[1]} détecté.`));
        }
      } catch (err2) {
        messages.push(chalk.yellow("⚠️ Ni Maven ni Gradle n'ont été détectés. Vous aurez besoin de l'un d'eux pour construire votre application."));
      }
    }

    // Vérifier Docker si possible
    try {
      const dockerResult = await execAsync('docker --version');
      const dockerVersion = dockerResult.stdout.trim();
      messages.push(chalk.green(`✅ ${dockerVersion} détecté.`));
    } catch (err) {
      messages.push(chalk.yellow("⚠️ Docker n'a pas été détecté. Vous en aurez besoin pour exécuter les conteneurs Docker."));
    }

  } catch (err) {
    messages.push(chalk.red(`❌ Erreur lors de la vérification des versions des outils: ${err}`));
    success = false;
  }

  return { success, messages };
}

/**
 * Affiche des conseils finaux et des informations utiles pour l'utilisateur
 */
export function displayFinalInstructions(generator: any, templateData: any, checkResult: CheckResult): void {
  generator.log(chalk.blue("\n📋 RÉSUMÉ DE LA GÉNÉRATION DU PROJET"));
  generator.log(chalk.gray("══════════════════════════════════════════���═"));

  if (checkResult.success) {
    generator.log(chalk.green("✅ Projet généré avec succès ! Voici quelques étapes pour démarrer:"));
  } else {
    generator.log(chalk.yellow("⚠️ Le projet a été généré mais certains problèmes ont été détectés:"));

    if (checkResult.missingFiles.length > 0) {
      generator.log(chalk.yellow("\nFichiers manquants:"));
      checkResult.missingFiles.forEach(file => {
        generator.log(chalk.yellow(`  - ${file}`));
      });
    }

    if (checkResult.errors.length > 0) {
      generator.log(chalk.red("\nErreurs détectées:"));
      checkResult.errors.forEach(error => {
        generator.log(chalk.red(`  - ${error}`));
      });
    }

    if (checkResult.warnings.length > 0) {
      generator.log(chalk.yellow("\nAvertissements:"));
      checkResult.warnings.forEach(warning => {
        generator.log(chalk.yellow(`  - ${warning}`));
      });
    }

    generator.log(chalk.yellow("\nVous pouvez tenter de résoudre ces problèmes avant de continuer."));
  }

  if (checkResult.suggestions.length > 0) {
    generator.log(chalk.cyan("\nSuggestions:"));
    checkResult.suggestions.forEach(suggestion => {
      generator.log(chalk.cyan(`  - ${suggestion}`));
    });
  }

  // Instructions pour démarrer l'application
  generator.log(chalk.blue("\n🚀 POUR DÉMARRER VOTRE APPLICATION"));
  generator.log(chalk.gray("════════════════════════════════════════════"));

  // Backend
  generator.log(chalk.cyan("\nBackend (Spring Boot):"));
  if (templateData.buildTool.toLowerCase() === 'maven') {
    generator.log(chalk.white("  cd " + generator.destinationRoot()));
    generator.log(chalk.white("  ./mvnw spring-boot:run"));
  } else {
    generator.log(chalk.white("  cd " + generator.destinationRoot()));
    generator.log(chalk.white("  ./gradlew bootRun"));
  }

  // Frontend
  if (templateData.frontendFramework !== 'Aucun (API seulement)') {
    generator.log(chalk.cyan("\nFrontend (" + templateData.frontendFramework + "):"));
    generator.log(chalk.white("  cd " + path.join(generator.destinationRoot(), 'frontend')));
    generator.log(chalk.white("  npm install    # Si ce n'est pas déjà fait"));
    generator.log(chalk.white("  npm run dev"));
  }

  // Docker
  generator.log(chalk.cyan("\nDocker:"));
  generator.log(chalk.white("  docker-compose up -d"));

  // Kubernetes (si applicable)
  if (templateData.kubernetes) {
    generator.log(chalk.cyan("\nKubernetes:"));
    generator.log(chalk.white("  Consultez le fichier kubernetes/README.md pour les instructions de déploiement"));
  }

  // Accès à l'application
  generator.log(chalk.blue("\n🌐 URL D'ACCÈS:"));
  generator.log(chalk.gray("══════════════════════════════════════��═════"));
  generator.log(chalk.white("  Backend: http://localhost:8080"));

  if (templateData.frontendFramework !== 'Aucun (API seulement)') {
    generator.log(chalk.white("  Frontend: http://localhost:3000"));
  }

  if (templateData.includeAuth) {
    generator.log(chalk.white("  Swagger/API: http://localhost:8080/swagger-ui.html"));
  }

  // Documentation
  generator.log(chalk.blue("\n📚 DOCUMENTATION ET AIDE:"));
  generator.log(chalk.gray("════════════════════════════════════════════"));
  generator.log(chalk.white("  Documentation: README.md"));
  generator.log(chalk.white("  Aide supplémentaire: https://github.com/tky0065/spring-fullstack-speed/wiki"));

  generator.log(chalk.gray("\n════════════════════════════════════════════"));
  generator.log(chalk.green("\nBon développement avec Spring-Fullstack-Speed! 🚀"));
}

/**
 * Affiche les vérifications post-génération et conseils pour le projet généré
 * @param generator Référence au générateur
 * @param templateData Données du template utilisé
 */
export async function postGenerationChecksAndAdvice(generator: any, templateData: any): Promise<void> {
  // Vérifier l'intégrité du projet
  const integrityResult = verifyProjectIntegrity(generator, templateData);

  // Vérifier les versions des outils
  const toolsResult = await checkToolVersions(generator);

  // Tenter d'installer les dépendances frontend si nécessaire
  let npmInstallResult: { success: boolean, error?: string } = { success: true };
  if (templateData.frontendFramework !== 'Aucun (API seulement)') {
    npmInstallResult = await installFrontendDependencies(generator, templateData);
    if (!npmInstallResult.success && npmInstallResult.error) {
      integrityResult.warnings.push(npmInstallResult.error);
    }
  }

  // Afficher les résultats et conseils
  toolsResult.messages.forEach(message => generator.log(message));

  // Afficher le résumé final et instructions
  displayFinalInstructions(generator, templateData, integrityResult);
}
