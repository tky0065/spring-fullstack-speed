import { describe, expect, test, jest, beforeAll, afterAll } from '@jest/globals';
import path from 'path';
import { fileURLToPath } from 'url';
import helpers from 'yeoman-test';
import fs from 'fs';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const exists = promisify(fs.exists);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appGeneratorPath = path.join(__dirname, '../app');
const entityGeneratorPath = path.join(__dirname, '../entity');
const dtoGeneratorPath = path.join(__dirname, '../dtos');
const crudGeneratorPath = path.join(__dirname, '../crud');
const kubernetesGeneratorPath = path.join(__dirname, '../kubernetes');
const dockerGeneratorPath = path.join(__dirname, '../docker');

// Augmenter le timeout pour les tests plus longs
jest.setTimeout(120000);

/**
 * Fonction utilitaire pour vérifier récursivement tous les fichiers générés
 * @param dir Répertoire à vérifier
 * @param results Tableau pour stocker les résultats
 */
async function checkFilesRecursively(dir, results = []) {
  const files = await readdir(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const fileStat = await stat(filePath);

    if (fileStat.isDirectory()) {
      // Récursion pour les sous-dossiers
      await checkFilesRecursively(filePath, results);
    } else {
      // Vérifier que le fichier n'est pas vide
      const fileSize = fileStat.size;
      results.push({
        path: filePath,
        size: fileSize,
        isEmpty: fileSize === 0
      });
    }
  }

  return results;
}

describe('Tests complets de génération', () => {
  let tempDir;

  beforeAll(() => {
    // Création d'un répertoire temporaire pour les tests
    console.log('Initialisation des tests de génération complète...');
  });

  afterAll(() => {
    console.log('Tests de génération terminés.');
  });

  describe('Génération d\'une application complète', () => {
    test('devrait générer tous les fichiers d\'application sans erreur', async () => {
      // Arrangement
      const appName = 'test-app';
      const packageName = 'com.example.testapp';

      // Action
      const result = await helpers
        .create(appGeneratorPath)
        .withOptions({
          name: appName,
          packageName: packageName,
          database: 'postgresql',
          frontend: 'react',
          auth: 'jwt',
          skipInstall: true,
          interactive: false
        })
        .run();

      tempDir = result.cwd;

      // Assertion
      expect(result).toBeDefined();

      // Vérifier les fichiers essentiels
      const pomExists = await exists(path.join(tempDir, 'pom.xml'));
      expect(pomExists).toBe(true);

      const appJavaExists = await exists(path.join(tempDir, `src/main/java/${packageName.replace(/\./g, '/')}/${appName}Application.java`.replace(/-/g, '')));
      expect(appJavaExists).toBe(true);

      // Vérifier la structure complète
      const allFiles = await checkFilesRecursively(tempDir);
      const emptyFiles = allFiles.filter(file => file.isEmpty);

      console.log(`Total des fichiers générés: ${allFiles.length}`);
      console.log(`Fichiers vides: ${emptyFiles.length}`);

      // Lister les fichiers vides éventuels
      if (emptyFiles.length > 0) {
        console.warn('Fichiers vides détectés:');
        emptyFiles.forEach(file => {
          console.warn(`- ${file.path}`);
        });
      }

      // S'assurer qu'il n'y a pas de fichiers vides essentiels
      const criticalPatterns = ['pom.xml', 'Application.java', 'SecurityConfig', 'JwtToken'];
      const emptyCriticalFiles = emptyFiles.filter(file => {
        return criticalPatterns.some(pattern => file.path.includes(pattern));
      });

      expect(emptyCriticalFiles.length).toBe(0);
    });
  });

  describe('Génération d\'une entité et ses composants associés', () => {
    test('devrait générer une entité avec DTOs et CRUD', async () => {
      if (!tempDir) {
        throw new Error('Le répertoire temporaire n\'est pas défini. Exécutez d\'abord le test d\'application.');
      }

      // 1. Générer une entité
      const entityName = 'Product';
      const entityResult = await helpers
        .create(entityGeneratorPath)
        .withOptions({
          name: entityName,
          packageName: 'com.example.testapp.domain',
          fields: 'name:String,price:Double,description:String,quantity:Integer',
          skipInstall: true,
          interactive: false
        })
        .inDir(tempDir)
        .run();

      expect(entityResult).toBeDefined();

      // Vérifier que le fichier d'entité a été créé
      const entityPath = path.join(tempDir, 'src/main/java/com/example/testapp/domain/Product.java');
      expect(await exists(entityPath)).toBe(true);

      // 2. Générer les DTOs
      const dtoResult = await helpers
        .create(dtoGeneratorPath)
        .withOptions({
          entity: entityName,
          packageName: 'com.example.testapp.dto',
          skipInstall: true,
          interactive: false
        })
        .inDir(tempDir)
        .run();

      expect(dtoResult).toBeDefined();

      // Vérifier que les fichiers DTO ont été créés
      const dtoPath = path.join(tempDir, 'src/main/java/com/example/testapp/dto/ProductDTO.java');
      expect(await exists(dtoPath)).toBe(true);

      // 3. Générer le CRUD
      const crudResult = await helpers
        .create(crudGeneratorPath)
        .withOptions({
          entity: entityName,
          packageName: 'com.example.testapp',
          skipInstall: true,
          interactive: false
        })
        .inDir(tempDir)
        .run();

      expect(crudResult).toBeDefined();

      // Vérifier que les fichiers CRUD ont été créés
      const repoPath = path.join(tempDir, 'src/main/java/com/example/testapp/repository/ProductRepository.java');
      const servicePath = path.join(tempDir, 'src/main/java/com/example/testapp/service/ProductService.java');
      const controllerPath = path.join(tempDir, 'src/main/java/com/example/testapp/controller/ProductController.java');

      expect(await exists(repoPath)).toBe(true);
      expect(await exists(servicePath)).toBe(true);
      expect(await exists(controllerPath)).toBe(true);
    });
  });

  describe('Génération des fichiers de déploiement', () => {
    test('devrait générer les fichiers Docker et Kubernetes', async () => {
      if (!tempDir) {
        throw new Error('Le répertoire temporaire n\'est pas défini. Exécutez d\'abord le test d\'application.');
      }

      // 1. Générer les fichiers Docker
      const dockerResult = await helpers
        .create(dockerGeneratorPath)
        .withOptions({
          appName: 'test-app',
          packageName: 'com.example.testapp',
          dbType: 'postgresql',
          skipInstall: true,
          interactive: false
        })
        .inDir(tempDir)
        .run();

      expect(dockerResult).toBeDefined();

      // Vérifier que les fichiers Docker ont été créés
      const dockerfilePath = path.join(tempDir, 'Dockerfile');
      const dockerComposePath = path.join(tempDir, 'docker-compose.yml');

      expect(await exists(dockerfilePath)).toBe(true);
      expect(await exists(dockerComposePath)).toBe(true);

      // 2. Générer les fichiers Kubernetes
      const k8sResult = await helpers
        .create(kubernetesGeneratorPath)
        .withOptions({
          appName: 'test-app',
          packageName: 'com.example.testapp',
          dbType: 'postgresql',
          skipInstall: true,
          interactive: false
        })
        .inDir(tempDir)
        .run();

      expect(k8sResult).toBeDefined();

      // Vérifier que les fichiers K8s ont été créés
      const k8sDir = path.join(tempDir, 'kubernetes');
      const deploymentPath = path.join(k8sDir, 'base/deployment.yaml');
      const servicePath = path.join(k8sDir, 'base/service.yaml');

      expect(await exists(k8sDir)).toBe(true);
      expect(await exists(deploymentPath)).toBe(true);
      expect(await exists(servicePath)).toBe(true);

      // Vérifier la structure complète des fichiers générés
      const allFiles = await checkFilesRecursively(tempDir);
      console.log(`Rapport final - Total des fichiers générés: ${allFiles.length}`);

      // Analyses des résultats pour le rapport
      const filesByType = {};
      allFiles.forEach(file => {
        const ext = path.extname(file.path).toLowerCase();
        if (!filesByType[ext]) {
          filesByType[ext] = 0;
        }
        filesByType[ext]++;
      });

      console.log('Répartition des fichiers par type:');
      Object.entries(filesByType).forEach(([ext, count]) => {
        console.log(`${ext || 'sans extension'}: ${count} fichiers`);
      });
    });
  });
});
