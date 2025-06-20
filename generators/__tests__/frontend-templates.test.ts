import { describe, expect, test } from '@jest/globals';
import path from 'path';
import helpers from 'yeoman-test';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('FrontendTemplatesTests', () => {
  describe('React Integration', () => {
    test('generates a basic React frontend', async () => {
      const generatorPath = path.join(__dirname, '../app');

      const runResult = await helpers
        .create(generatorPath)
        .withOptions({
          skipInstall: true
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

      // Vérifier les fichiers spécifiques à l'openapi generator
      expect(fs.existsSync(path.join(runResult.cwd, 'frontend/API-GUIDE.md'))).toBe(true);
      expect(fs.existsSync(path.join(runResult.cwd, 'scripts/generate-api.js'))).toBe(true);

      // Vérifier les composants et configurations clés
      expect(fs.existsSync(path.join(runResult.cwd, 'frontend/src/components'))).toBe(true);
      expect(fs.existsSync(path.join(runResult.cwd, 'frontend/tailwind.config.js'))).toBe(true);
    });
  });

  describe('Vue.js Integration', () => {
    test('generates a basic Vue.js frontend', async () => {
      const generatorPath = path.join(__dirname, '../app');

      const runResult = await helpers
        .create(generatorPath)
        .withOptions({
          skipInstall: true
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

      // Vérifier les fichiers spécifiques à l'openapi generator
      expect(fs.existsSync(path.join(runResult.cwd, 'frontend/API-GUIDE.md'))).toBe(true);
      expect(fs.existsSync(path.join(runResult.cwd, 'scripts/generate-api.js'))).toBe(true);

      // Vérifier les composants et configurations Vue
      expect(fs.existsSync(path.join(runResult.cwd, 'frontend/src/components'))).toBe(true);
      expect(fs.existsSync(path.join(runResult.cwd, 'frontend/src/router'))).toBe(true);
    });
  });

  describe('Angular Integration', () => {
    test('generates a basic Angular frontend', async () => {
      const generatorPath = path.join(__dirname, '../app');

      const runResult = await helpers
        .create(generatorPath)
        .withOptions({
          skipInstall: true
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

      // Vérifier les fichiers spécifiques à ng-openapi-gen
      expect(fs.existsSync(path.join(runResult.cwd, 'frontend/API-GUIDE-OPENAPI.md'))).toBe(true);
      expect(fs.existsSync(path.join(runResult.cwd, 'scripts/generate-api.js'))).toBe(true);

      // Vérifier les configurations Angular modernes (Angular 19+)
      expect(fs.existsSync(path.join(runResult.cwd, 'frontend/tsconfig.json'))).toBe(true);
      expect(fs.existsSync(path.join(runResult.cwd, 'frontend/tsconfig.app.json'))).toBe(true);
      expect(fs.existsSync(path.join(runResult.cwd, 'frontend/tsconfig.spec.json'))).toBe(true);

      // Vérifier la structure des composants avec signal API
      expect(fs.existsSync(path.join(runResult.cwd, 'frontend/src/app/services'))).toBe(true);
      expect(fs.existsSync(path.join(runResult.cwd, 'frontend/src/app/components'))).toBe(true);
    });
  });

  describe('Thymeleaf Integration', () => {
    test('generates a basic Thymeleaf frontend', async () => {
      const generatorPath = path.join(__dirname, '../app');

      const runResult = await helpers
        .create(generatorPath)
        .withOptions({
          skipInstall: true
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

      // Vérifier les templates Thymeleaf et configurations Spring MVC
      expect(fs.existsSync(path.join(runResult.cwd, 'src/main/resources/templates'))).toBe(true);
      expect(fs.existsSync(path.join(runResult.cwd, 'src/main/resources/static'))).toBe(true);
      expect(fs.existsSync(path.join(runResult.cwd, 'src/main/java/com/example/thymeleafapp/config/WebMvcConfig.java'))).toBe(true);

      // Vérifier les pages d'authentification
      expect(fs.existsSync(path.join(runResult.cwd, 'src/main/resources/templates/auth/login.html'))).toBe(true);
      expect(fs.existsSync(path.join(runResult.cwd, 'src/main/resources/templates/auth/register.html'))).toBe(true);

      // Vérifier les fragments et layouts
      expect(fs.existsSync(path.join(runResult.cwd, 'src/main/resources/templates/fragments'))).toBe(true);
      expect(fs.existsSync(path.join(runResult.cwd, 'src/main/resources/templates/layouts'))).toBe(true);
    });
  });

  describe('JTE Integration', () => {
    test('generates a basic JTE frontend', async () => {
      const generatorPath = path.join(__dirname, '../app');

      const runResult = await helpers
        .create(generatorPath)
        .withOptions({
          skipInstall: true
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

      // Vérifier les fichiers de configuration JTE
      expect(fs.existsSync(path.join(runResult.cwd, 'src/main/java/com/example/jteapp/config/JteConfig.java'))).toBe(true);

      // Vérifier les templates JTE
      expect(fs.existsSync(path.join(runResult.cwd, 'src/main/jte'))).toBe(true);
      expect(fs.existsSync(path.join(runResult.cwd, 'src/main/jte/layouts'))).toBe(true);
      expect(fs.existsSync(path.join(runResult.cwd, 'src/main/jte/pages'))).toBe(true);
      expect(fs.existsSync(path.join(runResult.cwd, 'src/main/jte/tags'))).toBe(true);

      // Vérifier les pages d'authentification
      expect(fs.existsSync(path.join(runResult.cwd, 'src/main/jte/pages/auth/login.jte'))).toBe(true);
      expect(fs.existsSync(path.join(runResult.cwd, 'src/main/jte/pages/auth/register.jte'))).toBe(true);

      // Vérifier les ressources statiques
      expect(fs.existsSync(path.join(runResult.cwd, 'src/main/resources/static/css'))).toBe(true);
      expect(fs.existsSync(path.join(runResult.cwd, 'src/main/resources/static/js'))).toBe(true);
    });
  });
});
