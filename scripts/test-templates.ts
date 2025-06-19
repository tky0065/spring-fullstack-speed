/**
 * Script de test pour la génération de templates de base
 * Ce script vérifie que notre système peut correctement générer des applications
 * avec différentes configurations en utilisant les templates de base
 */

import path from 'path';
import fs from 'fs';
import { DEFAULT_CONFIG, FRONTEND_OPTIONS, DATABASE_OPTIONS, BUILD_TOOL_OPTIONS } from '../utils/config.js';
import { addConditionalHelpersToContext } from '../utils/conditional-rendering.js';
import { ensureDirectoryExists, generateFile, generateFileTree } from '../utils/files.js';

// Simuler une instance de générateur Yeoman simplifiée pour les tests
const mockGenerator = {
  templatePath: (templatePath: string) => path.resolve(process.cwd(), 'generators/app/templates', templatePath),
  destinationPath: (destPath: string) => path.resolve(process.cwd(), 'test-output', destPath),
  fs: {
    copyTpl: (src: string, dest: string, context: any) => {
      console.log(`Génération du template: ${path.basename(src)} -> ${path.basename(dest)}`);

      // Créer le répertoire de destination si nécessaire
      const destDir = path.dirname(dest);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      // Simuler la copie du template (dans un vrai environnement, EJS serait utilisé)
      const content = fs.readFileSync(src, 'utf8');
      fs.writeFileSync(dest, content, 'utf8');
    },
    read: (filePath: string) => fs.readFileSync(filePath, 'utf8'),
    write: (filePath: string, content: string) => fs.writeFileSync(filePath, content, 'utf8'),
    store: {
      get: (templatePath: string) => {
        try {
          return fs.readdirSync(templatePath);
        } catch (error) {
          console.error(`Erreur lors de la lecture du répertoire ${templatePath}:`, error);
          return null;
        }
      }
    }
  }
};

// Configurations à tester
const testConfigurations = [
  {
    name: 'spring-boot-react-postgres-maven',
    config: {
      ...DEFAULT_CONFIG,
      appName: 'react-pg-app',
      packageName: 'com.example.reactpg',
      frontendFramework: FRONTEND_OPTIONS.REACT_INERTIA,
      database: DATABASE_OPTIONS.POSTGRESQL,
      buildTool: BUILD_TOOL_OPTIONS.MAVEN
    }
  },
  {
    name: 'spring-boot-vue-mysql-gradle',
    config: {
      ...DEFAULT_CONFIG,
      appName: 'vue-mysql-app',
      packageName: 'com.example.vuemysql',
      frontendFramework: FRONTEND_OPTIONS.VUE_INERTIA,
      database: DATABASE_OPTIONS.MYSQL,
      buildTool: BUILD_TOOL_OPTIONS.GRADLE
    }
  }
];

/**
 * Exécute les tests de génération de templates
 */
async function runTemplateTests() {
  console.log('🧪 Démarrage des tests de génération de templates');

  // Préparer le répertoire de sortie des tests
  const testOutputDir = path.resolve(process.cwd(), 'test-output');
  if (fs.existsSync(testOutputDir)) {
    fs.rmSync(testOutputDir, { recursive: true, force: true });
  }
  ensureDirectoryExists(testOutputDir);

  // Tester chaque configuration
  for (const { name, config } of testConfigurations) {
    console.log(`\n🔍 Test de la configuration: ${name}`);

    // Créer un sous-répertoire pour cette configuration
    const configOutputDir = path.join(testOutputDir, name);
    ensureDirectoryExists(configOutputDir);

    // Générer les fichiers pour cette configuration
    generateApplicationTemplates(config, configOutputDir);

    console.log(`✅ Génération terminée pour ${name}`);
  }

  console.log('\n🎉 Tests de génération de templates terminés avec succès!');
}

/**
 * Génère les fichiers d'application pour une configuration donnée
 */
function generateApplicationTemplates(config: any, outputDir: string) {
  // Créer un contexte enrichi avec les aides conditionnelles
  const context = addConditionalHelpersToContext({}, config);

  console.log('Génération des fichiers de configuration...');

  // Générer les fichiers de build selon l'outil choisi
  if (config.buildTool === BUILD_TOOL_OPTIONS.MAVEN) {
    generateFile(
      mockGenerator,
      'pom.xml.ejs',
      path.join(outputDir, 'pom.xml'),
      config,
      { templateData: context }
    );
    generateFile(
      mockGenerator,
      'mvnw',
      path.join(outputDir, 'mvnw'),
      config
    );
    generateFile(
      mockGenerator,
      'mvnw.cmd',
      path.join(outputDir, 'mvnw.cmd'),
      config
    );
  } else {
    generateFile(
      mockGenerator,
      'build.gradle.kts.ejs',
      path.join(outputDir, 'build.gradle.kts'),
      config,
      { templateData: context }
    );
    generateFile(
      mockGenerator,
      'settings.gradle.kts.ejs',
      path.join(outputDir, 'settings.gradle.kts'),
      config,
      { templateData: context }
    );
    generateFile(
      mockGenerator,
      'gradlew',
      path.join(outputDir, 'gradlew'),
      config
    );
    generateFile(
      mockGenerator,
      'gradlew.bat',
      path.join(outputDir, 'gradlew.bat'),
      config
    );
  }

  console.log('Génération des fichiers de configuration Spring Boot...');

  // Générer les fichiers de configuration Spring Boot
  const resourcesDir = path.join(outputDir, 'src/main/resources');
  generateFile(
    mockGenerator,
    'src/main/resources/application.yml.ejs',
    path.join(resourcesDir, 'application.yml'),
    config,
    { templateData: context }
  );
  generateFile(
    mockGenerator,
    'src/main/resources/logback-spring.xml.ejs',
    path.join(resourcesDir, 'logback-spring.xml'),
    config
  );

  console.log('Génération de la classe Application principale...');

  // Générer la classe Application principale
  const packagePath = config.packageName.replace(/\./g, '/');
  const mainJavaDir = path.join(outputDir, 'src/main/java', packagePath);
  ensureDirectoryExists(mainJavaDir);

  generateFile(
    mockGenerator,
    'Application.java.ejs',
    path.join(mainJavaDir, 'Application.java'),
    config,
    { templateData: context }
  );

  console.log('Génération des fichiers frontend...');

  // Générer les fichiers frontend selon le framework choisi
  if (config.frontendFramework === FRONTEND_OPTIONS.REACT_INERTIA) {
    const frontendDir = path.join(outputDir, 'src/main/frontend');
    ensureDirectoryExists(frontendDir);

    generateFile(
      mockGenerator,
      'frontend/react/package.json.ejs',
      path.join(frontendDir, 'package.json'),
      config,
      { templateData: context }
    );
    generateFile(
      mockGenerator,
      'frontend/react/vite.config.js.ejs',
      path.join(frontendDir, 'vite.config.js'),
      config,
      { templateData: context }
    );
    generateFile(
      mockGenerator,
      'frontend/react/tailwind.config.js.ejs',
      path.join(frontendDir, 'tailwind.config.js'),
      config,
      { templateData: context }
    );

    // Créer les répertoires pour React
    const pagesDir = path.join(frontendDir, 'pages');
    const stylesDir = path.join(frontendDir, 'styles');
    ensureDirectoryExists(pagesDir);
    ensureDirectoryExists(stylesDir);

    generateFile(
      mockGenerator,
      'frontend/react/pages/Home.jsx.ejs',
      path.join(pagesDir, 'Home.jsx'),
      config,
      { templateData: context }
    );
    generateFile(
      mockGenerator,
      'frontend/react/styles/main.css.ejs',
      path.join(stylesDir, 'main.css'),
      config,
      { templateData: context }
    );
  } else if (config.frontendFramework === FRONTEND_OPTIONS.VUE_INERTIA) {
    const frontendDir = path.join(outputDir, 'src/main/frontend');
    ensureDirectoryExists(frontendDir);

    generateFile(
      mockGenerator,
      'frontend/vue/package.json.ejs',
      path.join(frontendDir, 'package.json'),
      config,
      { templateData: context }
    );
    generateFile(
      mockGenerator,
      'frontend/vue/vite.config.js.ejs',
      path.join(frontendDir, 'vite.config.js'),
      config,
      { templateData: context }
    );
    generateFile(
      mockGenerator,
      'frontend/vue/tailwind.config.js.ejs',
      path.join(frontendDir, 'tailwind.config.js'),
      config,
      { templateData: context }
    );

    // Créer les répertoires pour Vue
    const pagesDir = path.join(frontendDir, 'pages');
    const stylesDir = path.join(frontendDir, 'styles');
    ensureDirectoryExists(pagesDir);
    ensureDirectoryExists(stylesDir);

    generateFile(
      mockGenerator,
      'frontend/vue/pages/Home.vue.ejs',
      path.join(pagesDir, 'Home.vue'),
      config,
      { templateData: context }
    );
    generateFile(
      mockGenerator,
      'frontend/vue/styles/main.css.ejs',
      path.join(stylesDir, 'main.css'),
      config,
      { templateData: context }
    );
  }

  console.log('Génération des fichiers Docker...');

  // Générer les fichiers Docker
  const dockerDir = path.join(outputDir, 'docker');
  ensureDirectoryExists(dockerDir);

  generateFile(
    mockGenerator,
    'docker/Dockerfile.ejs',
    path.join(dockerDir, 'Dockerfile'),
    config,
    { templateData: context }
  );
  generateFile(
    mockGenerator,
    'docker/docker-compose.yml.ejs',
    path.join(dockerDir, 'docker-compose.yml'),
    config,
    { templateData: context }
  );

  // Générer les fichiers spécifiques à la base de données
  console.log(`Génération des fichiers pour la base de données ${config.database}...`);

  if (config.database === DATABASE_OPTIONS.MYSQL) {
    generateFile(
      mockGenerator,
      'scripts/mysql-init.sh.ejs',
      path.join(outputDir, 'scripts/mysql-init.sh'),
      config,
      { templateData: context }
    );
  } else if (config.database === DATABASE_OPTIONS.POSTGRESQL) {
    generateFile(
      mockGenerator,
      'scripts/postgresql-init.sh.ejs',
      path.join(outputDir, 'scripts/postgresql-init.sh'),
      config,
      { templateData: context }
    );
  } else if (config.database === DATABASE_OPTIONS.MONGODB) {
    generateFile(
      mockGenerator,
      'scripts/mongodb-init.sh.ejs',
      path.join(outputDir, 'scripts/mongodb-init.sh'),
      config,
      { templateData: context }
    );
  }
}

// Exécuter les tests
runTemplateTests().catch(error => {
  console.error('❌ Erreur lors de l\'exécution des tests:', error);
  process.exit(1);
});
