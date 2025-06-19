import { describe, expect, test } from '@jest/globals';
import path from 'path';
import { fileURLToPath } from 'url';
import helpers from 'yeoman-test';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('AppGenerator', () => {
  test('generator test placeholder', () => {
    // Test basique pour vérifier que l'environnement de test fonctionne
    expect(true).toBe(true);

    // Note: Les tests complets du générateur seront implémentés
    // une fois que le générateur principal sera plus avancé
  });

  test('generates a minimal Spring Boot project', async () => {
    // Chemin vers le générateur d'application
    const generatorPath = path.join(__dirname, '../app');

    // Exécuter le générateur avec des options minimales
    const runResult = await helpers
      .create(generatorPath)
      .withOptions({
        skipInstall: true,  // On saute l'installation des dépendances pour accélérer le test
        skipPrompts: true,  // On utilise des valeurs par défaut
      })
      .withPrompts({
        projectName: 'test-app',
        packageName: 'com.example.testapp',
        buildTool: 'maven',
        dbType: 'h2',
        authenticationType: 'jwt',
        frontendType: 'none'  // Pas de frontend pour un test minimal
      })
      .run();

    // Vérifier que les fichiers essentiels ont été générés
    expect(fs.existsSync(path.join(runResult.cwd, 'pom.xml'))).toBe(true);
    expect(fs.existsSync(path.join(runResult.cwd, 'src/main/java/com/example/testapp/TestAppApplication.java'))).toBe(true);
    expect(fs.existsSync(path.join(runResult.cwd, 'src/main/resources/application.properties'))).toBe(true);

    // Vérifier la structure des packages
    expect(fs.existsSync(path.join(runResult.cwd, 'src/main/java/com/example/testapp/controller'))).toBe(true);
    expect(fs.existsSync(path.join(runResult.cwd, 'src/main/java/com/example/testapp/service'))).toBe(true);
    expect(fs.existsSync(path.join(runResult.cwd, 'src/main/java/com/example/testapp/repository'))).toBe(true);
    expect(fs.existsSync(path.join(runResult.cwd, 'src/main/java/com/example/testapp/entity'))).toBe(true);
  });
});
