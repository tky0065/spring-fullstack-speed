import { describe, expect, test } from '@jest/globals';
import path from 'path';
import { fileURLToPath } from 'url';
import helpers from 'yeoman-test';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('FrontendTemplatesTests', () => {
  describe('React Integration', () => {
    test('generates a basic React frontend', async () => {
      const generatorPath = path.join(__dirname, '../app');

      const runResult = await helpers
        .create(generatorPath)
        .withOptions({
          skipInstall: true,
          skipPrompts: true,
        })
        .withPrompts({
          projectName: 'test-react-app',
          packageName: 'com.example.reactapp',
          buildTool: 'maven',
          dbType: 'h2',
          authenticationType: 'jwt',
          frontendType: 'React avec Inertia.js'
        })
        .run();

      // Vérifier que les fichiers React ont été générés
      expect(fs.existsSync(path.join(runResult.cwd, 'frontend/package.json'))).toBe(true);
      expect(fs.existsSync(path.join(runResult.cwd, 'frontend/src/App.tsx'))).toBe(true);
      expect(fs.existsSync(path.join(runResult.cwd, 'frontend/vite.config.ts'))).toBe(true);
    });
  });

  describe('Vue.js Integration', () => {
    test('generates a basic Vue.js frontend', async () => {
      const generatorPath = path.join(__dirname, '../app');

      const runResult = await helpers
        .create(generatorPath)
        .withOptions({
          skipInstall: true,
          skipPrompts: true,
        })
        .withPrompts({
          projectName: 'test-vue-app',
          packageName: 'com.example.vueapp',
          buildTool: 'maven',
          dbType: 'h2',
          authenticationType: 'jwt',
          frontendType: 'Vue.js avec Inertia.js'
        })
        .run();

      // Vérifier que les fichiers Vue ont été générés
      expect(fs.existsSync(path.join(runResult.cwd, 'frontend/package.json'))).toBe(true);
      expect(fs.existsSync(path.join(runResult.cwd, 'frontend/src/App.vue'))).toBe(true);
      expect(fs.existsSync(path.join(runResult.cwd, 'frontend/vite.config.ts'))).toBe(true);
    });
  });

  describe('Angular Integration', () => {
    test('generates a basic Angular frontend', async () => {
      const generatorPath = path.join(__dirname, '../app');

      const runResult = await helpers
        .create(generatorPath)
        .withOptions({
          skipInstall: true,
          skipPrompts: true,
        })
        .withPrompts({
          projectName: 'test-angular-app',
          packageName: 'com.example.angularapp',
          buildTool: 'maven',
          dbType: 'h2',
          authenticationType: 'jwt',
          frontendType: 'Angular standalone'
        })
        .run();

      // Vérifier que les fichiers Angular ont été générés
      expect(fs.existsSync(path.join(runResult.cwd, 'frontend/package.json'))).toBe(true);
      expect(fs.existsSync(path.join(runResult.cwd, 'frontend/src/app/app.component.ts'))).toBe(true);
      expect(fs.existsSync(path.join(runResult.cwd, 'frontend/angular.json'))).toBe(true);
    });
  });

  describe('Thymeleaf Integration', () => {
    test('generates a basic Thymeleaf frontend', async () => {
      const generatorPath = path.join(__dirname, '../app');

      const runResult = await helpers
        .create(generatorPath)
        .withOptions({
          skipInstall: true,
          skipPrompts: true,
        })
        .withPrompts({
          projectName: 'test-thymeleaf-app',
          packageName: 'com.example.thymeleafapp',
          buildTool: 'maven',
          dbType: 'h2',
          authenticationType: 'jwt',
          frontendType: 'Thymeleaf'
        })
        .run();

      // Vérifier que les fichiers Thymeleaf ont été générés
      expect(fs.existsSync(path.join(runResult.cwd, 'src/main/resources/templates/index.html'))).toBe(true);
      expect(fs.existsSync(path.join(runResult.cwd, 'src/main/resources/templates/layouts/main.html'))).toBe(true);
    });
  });

  describe('JTE Integration', () => {
    test('generates a basic JTE frontend', async () => {
      const generatorPath = path.join(__dirname, '../app');

      const runResult = await helpers
        .create(generatorPath)
        .withOptions({
          skipInstall: true,
          skipPrompts: true,
        })
        .withPrompts({
          projectName: 'test-jte-app',
          packageName: 'com.example.jteapp',
          buildTool: 'maven',
          dbType: 'h2',
          authenticationType: 'jwt',
          frontendType: 'JTE'
        })
        .run();

      // Vérifier que les fichiers JTE ont été générés
      expect(fs.existsSync(path.join(runResult.cwd, 'src/main/jte'))).toBe(true);
      expect(fs.existsSync(path.join(runResult.cwd, 'src/main/jte/layouts/main.jte'))).toBe(true);
    });
  });
});
