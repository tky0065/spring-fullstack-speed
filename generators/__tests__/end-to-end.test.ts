import { describe, expect, test, jest, beforeAll, afterAll } from '@jest/globals';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);
const CLI_PATH = path.join(process.cwd(), 'cli.js');

// Dossiers temporaires pour les tests
const TEST_WORKSPACE = path.join(process.cwd(), 'e2e-test-workspace');
const APP_NAME = 'e2e-test-app';
const APP_DIR = path.join(TEST_WORKSPACE, APP_NAME);

// Configuration globale avant tous les tests
beforeAll(async () => {
  // Créer le dossier de travail
  if (!fs.existsSync(TEST_WORKSPACE)) {
    fs.mkdirSync(TEST_WORKSPACE, { recursive: true });
  }

  // Compiler le projet pour s'assurer d'avoir les dernières modifications
  // Commenté temporairement pour accélérer les tests
  // await execPromise('npm run build');

  // Définir l'environnement de test
  process.env.NODE_ENV = 'test';
}, 60000);

// Nettoyage après tous les tests
afterAll(async () => {
  // Nettoyer les dossiers de test à la fin
  if (fs.existsSync(TEST_WORKSPACE)) {
    try {
      // Sur Windows, utiliser rimraf pour gérer les problèmes de verrouillage de fichiers
      if (process.platform === 'win32') {
        await execPromise(`rimraf "${TEST_WORKSPACE}"`);
      } else {
        await execPromise(`rm -rf "${TEST_WORKSPACE}"`);
      }
      console.log(`Cleaned up E2E test workspace: ${TEST_WORKSPACE}`);
    } catch (error) {
      console.warn(`Failed to clean up test workspace ${TEST_WORKSPACE}:`, error);
    }
  }
}, 30000);

/**
 * Tests End-to-End qui simulent un utilisateur réel utilisant l'outil
 */
describe('Tests End-to-End', () => {
  // Test simple pour vérifier que l'environnement fonctionne
  test('Test simple de vérification E2E', async () => {
    expect(fs.existsSync(CLI_PATH)).toBe(true);
    console.log('Test E2E simple exécuté avec succès');
  });

  // Test end-to-end complet (commenté par défaut et à exécuter manuellement)
  // Pour exécuter ce test spécifiquement: npm test -- -t "Workflow complet"
  test.skip('Workflow complet: création app -> ajout entité -> CRUD -> Docker', async () => {
    // Configurer un timeout plus long pour ce test complexe
    jest.setTimeout(300000); // 5 minutes

    try {
      // 1. Créer une nouvelle application
      console.log('1. Génération de l\'application de base...');
      const createAppCmd = `node "${CLI_PATH}" app --yes --skipInstall true --appName ${APP_NAME} --packageName com.example.e2e --buildTool maven --database h2 --frontendFramework none --outputDir "${TEST_WORKSPACE}"`;

      const { stdout: createAppOutput } = await execPromise(createAppCmd);
      console.log('Sortie de la création d\'application:', createAppOutput);

      // Vérifier que l'application a été créée correctement
      expect(fs.existsSync(path.join(APP_DIR, 'pom.xml'))).toBe(true);

      // 2. Ajouter une entité
      console.log('2. Ajout d\'une entité...');
      process.chdir(APP_DIR); // Se déplacer dans le répertoire de l'application

      // Créer un fichier de définition d'entité temporaire
      const entityConfigPath = path.join(APP_DIR, 'entity-config.json');
      const entityConfig = {
        entityName: 'Customer',
        packageName: 'com.example.e2e.domain',
        fields: [
          { fieldName: 'firstName', fieldType: 'String', required: true },
          { fieldName: 'lastName', fieldType: 'String', required: true },
          { fieldName: 'email', fieldType: 'String', required: true },
          { fieldName: 'phoneNumber', fieldType: 'String', required: false },
          { fieldName: 'birthDate', fieldType: 'LocalDate', required: false }
        ],
        relationships: [],
        includeRepository: true
      };

      fs.writeFileSync(entityConfigPath, JSON.stringify(entityConfig, null, 2));

      const addEntityCmd = `node "${CLI_PATH}" entity --yes --configFile entity-config.json`;
      const { stdout: addEntityOutput } = await execPromise(addEntityCmd);
      console.log('Sortie de l\'ajout d\'entité:', addEntityOutput);

      // Vérifier que l'entité a été créée
      expect(fs.existsSync(path.join(APP_DIR, 'src/main/java/com/example/e2e/domain/Customer.java'))).toBe(true);

      // 3. Générer un CRUD
      console.log('3. Génération du CRUD...');
      const generateCrudCmd = `node "${CLI_PATH}" crud --yes --entityName Customer --packageName com.example.e2e.web --includeDTO true --includeService true`;
      const { stdout: generateCrudOutput } = await execPromise(generateCrudCmd);
      console.log('Sortie de la génération CRUD:', generateCrudOutput);

      // Vérifier que le CRUD a été généré
      expect(fs.existsSync(path.join(APP_DIR, 'src/main/java/com/example/e2e/web/CustomerController.java'))).toBe(true);
      expect(fs.existsSync(path.join(APP_DIR, 'src/main/java/com/example/e2e/dto/CustomerDTO.java'))).toBe(true);

      // 4. Ajouter la configuration Docker
      console.log('4. Ajout de la configuration Docker...');
      const addDockerCmd = `node "${CLI_PATH}" container --yes`;
      const { stdout: addDockerOutput } = await execPromise(addDockerCmd);
      console.log('Sortie de l\'ajout Docker:', addDockerOutput);

      // Vérifier que les fichiers Docker ont été générés
      expect(fs.existsSync(path.join(APP_DIR, 'Dockerfile'))).toBe(true);
      expect(fs.existsSync(path.join(APP_DIR, 'docker-compose.yml'))).toBe(true);

      // 5. Vérifier que le projet est compilable (optionnel - commenté par défaut car c'est long)
      // console.log('5. Vérification que le projet est compilable...');
      // Si Maven est disponible dans le PATH
      // const { stdout: mvnOutput } = await execPromise('mvn compile -DskipTests');
      // console.log('Sortie de la compilation Maven:', mvnOutput);

      console.log('Test E2E complet exécuté avec succès');
    } catch (error) {
      console.error('Erreur lors du test E2E:', error);
      throw error; // Re-throw pour faire échouer le test
    }
  }, 300000); // Timeout explicite, même valeur que dans le test
});
