/**
 * Script de test pour les configurations de base de données
 * Ce script vérifie que notre système génère correctement les configurations
 * pour différentes bases de données (MySQL, PostgreSQL, MongoDB, H2)
 */

import path from 'path';
import fs from 'fs';
import { DEFAULT_CONFIG, DATABASE_OPTIONS, BUILD_TOOL_OPTIONS } from '../utils/config.js';
import { addConditionalHelpersToContext } from '../utils/conditional-rendering.js';
import { ensureDirectoryExists, generateFile, readFile } from '../utils/files.js';

// Simuler une instance de générateur Yeoman simplifiée pour les tests
const mockGenerator = {
  templatePath: (templatePath: string) => path.resolve(process.cwd(), 'generators/app/templates', templatePath),
  destinationPath: (destPath: string) => path.resolve(process.cwd(), 'test-output/db-configs', destPath),
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
    write: (filePath: string, content: string) => fs.writeFileSync(filePath, content, 'utf8')
  }
};

// Configurations à tester pour chaque base de données
const dbTestConfigurations = [
  {
    name: 'mysql-config',
    config: {
      ...DEFAULT_CONFIG,
      appName: 'mysql-app',
      packageName: 'com.example.mysqlapp',
      database: DATABASE_OPTIONS.MYSQL,
      buildTool: BUILD_TOOL_OPTIONS.MAVEN,
      authType: 'JWT' // Ajout de authType obligatoire
    }
  },
  {
    name: 'postgresql-config',
    config: {
      ...DEFAULT_CONFIG,
      appName: 'postgres-app',
      packageName: 'com.example.postgresapp',
      database: DATABASE_OPTIONS.POSTGRESQL,
      buildTool: BUILD_TOOL_OPTIONS.MAVEN,
      authType: 'JWT' // Ajout de authType obligatoire
    }
  },
  {
    name: 'mongodb-config',
    config: {
      ...DEFAULT_CONFIG,
      appName: 'mongodb-app',
      packageName: 'com.example.mongodbapp',
      database: DATABASE_OPTIONS.MONGODB,
      buildTool: BUILD_TOOL_OPTIONS.MAVEN,
      authType: 'JWT' // Ajout de authType obligatoire
    }
  },
  {
    name: 'h2-config',
    config: {
      ...DEFAULT_CONFIG,
      appName: 'h2-app',
      packageName: 'com.example.h2app',
      database: DATABASE_OPTIONS.H2,
      buildTool: BUILD_TOOL_OPTIONS.MAVEN,
      authType: 'JWT' // Ajout de authType obligatoire
    }
  }
];

/**
 * Vérifie si la configuration générée contient les éléments attendus pour une base de données spécifique
 */
function verifyDbConfiguration(configPath: string, dbType: string): boolean {
  try {
    const content = readFile(configPath);

    // Vérifier les éléments de base requis pour tous les types de DB
    const hasDataSourceConfig = content.includes('datasource') || content.includes('dataSource');

    if (!hasDataSourceConfig) {
      console.error(`❌ Configuration ${dbType}: Manque de configuration DataSource`);
      return false;
    }

    // Vérifications spécifiques à chaque type de DB
    switch (dbType) {
      case DATABASE_OPTIONS.MYSQL:
        if (!content.includes('mysql') && !content.includes('MySQL')) {
          console.error(`❌ Configuration MySQL: Driver ou URL MySQL non trouvée`);
          return false;
        }
        if (!content.includes('com.mysql') && !content.includes('mysql-connector')) {
          console.error(`❌ Configuration MySQL: Dépendance driver MySQL non trouvée`);
          return false;
        }
        break;

      case DATABASE_OPTIONS.POSTGRESQL:
        if (!content.includes('postgresql') && !content.includes('postgres')) {
          console.error(`❌ Configuration PostgreSQL: Driver ou URL PostgreSQL non trouvée`);
          return false;
        }
        if (!content.includes('org.postgresql') && !content.includes('postgresql')) {
          console.error(`❌ Configuration PostgreSQL: Dépendance driver PostgreSQL non trouvée`);
          return false;
        }
        break;

      case DATABASE_OPTIONS.MONGODB:
        if (!content.includes('mongodb')) {
          console.error(`❌ Configuration MongoDB: URI MongoDB non trouvée`);
          return false;
        }
        if (!content.includes('spring-boot-starter-data-mongodb')) {
          console.error(`❌ Configuration MongoDB: Dépendance Spring Data MongoDB non trouvée`);
          return false;
        }
        break;

      case DATABASE_OPTIONS.H2:
        if (!content.includes('h2') && !content.includes('H2')) {
          console.error(`❌ Configuration H2: Driver ou URL H2 non trouvée`);
          return false;
        }
        if (!content.includes('com.h2database') && !content.includes('h2')) {
          console.error(`❌ Configuration H2: Dépendance H2 non trouvée`);
          return false;
        }
        break;
    }

    // Vérifier les configurations communes attendues
    if (dbType !== DATABASE_OPTIONS.MONGODB) {
      if (!content.includes('hibernate') && !content.includes('jpa')) {
        console.error(`❌ Configuration ${dbType}: Configuration Hibernate/JPA non trouvée`);
        return false;
      }

      if (!content.includes('hikari') && !content.includes('HikariCP')) {
        console.error(`❌ Configuration ${dbType}: Configuration HikariCP non trouvée`);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error(`❌ Erreur lors de la vérification de la configuration ${dbType}:`, error);
    return false;
  }
}

/**
 * Exécute les tests pour chaque configuration de base de données
 */
async function runDbConfigTests() {
  console.log('🧪 Démarrage des tests de configuration de base de données');

  // Préparer le répertoire de sortie des tests
  const testOutputDir = path.resolve(process.cwd(), 'test-output/db-configs');
  if (fs.existsSync(testOutputDir)) {
    fs.rmSync(testOutputDir, { recursive: true, force: true });
  }
  ensureDirectoryExists(testOutputDir);

  let successCount = 0;

  // Tester chaque configuration de base de données
  for (const { name, config } of dbTestConfigurations) {
    console.log(`\n🔍 Test de la configuration: ${name}`);

    // Créer un sous-répertoire pour cette configuration
    const configOutputDir = path.join(testOutputDir, name);
    ensureDirectoryExists(configOutputDir);

    // Générer les fichiers de configuration pour cette base de données
    const context = addConditionalHelpersToContext({}, config);

    // Générer les fichiers de build
    generateFile(
      mockGenerator,
      'pom.xml.ejs',
      path.join(configOutputDir, 'pom.xml'),
      config,
      { templateData: context }
    );

    // Générer les fichiers de configuration Spring Boot
    const resourcesDir = path.join(configOutputDir, 'src/main/resources');
    generateFile(
      mockGenerator,
      'src/main/resources/application.yml.ejs',
      path.join(resourcesDir, 'application.yml'),
      config,
      { templateData: context }
    );

    // Générer les fichiers spécifiques à la base de données
    if (config.database === DATABASE_OPTIONS.MYSQL) {
      generateFile(
        mockGenerator,
        'scripts/mysql-init.sh.ejs',
        path.join(configOutputDir, 'scripts/mysql-init.sh'),
        config,
        { templateData: context }
      );
    } else if (config.database === DATABASE_OPTIONS.POSTGRESQL) {
      generateFile(
        mockGenerator,
        'scripts/postgresql-init.sh.ejs',
        path.join(configOutputDir, 'scripts/postgresql-init.sh'),
        config,
        { templateData: context }
      );
    } else if (config.database === DATABASE_OPTIONS.MONGODB) {
      generateFile(
        mockGenerator,
        'scripts/mongodb-init.sh.ejs',
        path.join(configOutputDir, 'scripts/mongodb-init.sh'),
        config,
        { templateData: context }
      );
    } else if (config.database === DATABASE_OPTIONS.H2) {
      generateFile(
        mockGenerator,
        'src/main/resources/db/h2/schema.sql.ejs',
        path.join(resourcesDir, 'db/h2/schema.sql'),
        config,
        { templateData: context }
      );
      generateFile(
        mockGenerator,
        'src/main/resources/db/h2/data.sql.ejs',
        path.join(resourcesDir, 'db/h2/data.sql'),
        config,
        { templateData: context }
      );
    }

    // Vérifier que les configurations générées sont correctes
    console.log('Vérification des fichiers de configuration générés...');

    const pomXmlPath = path.join(configOutputDir, 'pom.xml');
    const applicationYmlPath = path.join(resourcesDir, 'application.yml');

    const pomXmlValid = verifyDbConfiguration(pomXmlPath, config.database);
    const applicationYmlValid = verifyDbConfiguration(applicationYmlPath, config.database);

    if (pomXmlValid && applicationYmlValid) {
      console.log(`✅ Configuration ${name} validée avec succès`);
      successCount++;
    } else {
      console.error(`❌ La configuration ${name} contient des erreurs`);
    }
  }

  // Afficher le résultat final
  console.log(`\n🎉 Tests de configuration DB terminés: ${successCount}/${dbTestConfigurations.length} configurations validées`);

  if (successCount === dbTestConfigurations.length) {
    console.log('✅ Toutes les configurations de base de données fonctionnent correctement!');
    return true;
  } else {
    console.error('❌ Certaines configurations de base de données ont échoué aux tests');
    return false;
  }
}

// Exécuter les tests
runDbConfigTests().catch(error => {
  console.error('❌ Erreur lors de l\'exécution des tests:', error);
  process.exit(1);
});
