import { BaseGenerator } from '../base-generator';
import { GeneratorOptions } from '../types';
import chalk from 'chalk';
import path from 'path';

/**
 * Générateur pour les tests d'intégration frontend
 */
export default class FrontendTestGenerator extends BaseGenerator {
  constructor(args: string | string[], options: GeneratorOptions) {
    super(args, options);

    this.desc('Générateur pour les tests d\'intégration des frameworks frontend');
  }

  initializing() {
    this.log(chalk.blue('Initialisation du générateur de tests frontend...'));
    this.log(chalk.yellow('Ce générateur va ajouter des tests pour les frameworks frontend configurés.'));
  }

  async prompting() {
    // Récupération de la configuration existante
    const config = this.config.getAll();
    const frontendFramework = config.frontendFramework || 'react';

    this.answers = await this.prompt([
      {
        type: 'checkbox',
        name: 'testLibraries',
        message: 'Quelles bibliothèques de test souhaitez-vous utiliser?',
        choices: () => {
          const choices = [
            { name: 'Jest (Tests unitaires/d\'intégration)', value: 'jest', checked: true },
            { name: 'React Testing Library (Pour les composants React)', value: 'rtl', checked: frontendFramework === 'react' },
            { name: 'Vue Testing Library (Pour les composants Vue)', value: 'vtl', checked: frontendFramework === 'vue' },
            { name: 'Cypress (Tests E2E)', value: 'cypress', checked: true },
            { name: 'Playwright (Tests E2E alternatifs)', value: 'playwright' },
            { name: 'Vitest (Alternative à Jest pour Vite)', value: 'vitest', checked: ['react', 'vue'].includes(frontendFramework) }
          ];
          return choices;
        }
      },
      {
        type: 'confirm',
        name: 'setupCI',
        message: 'Voulez-vous configurer les tests pour l\'intégration continue?',
        default: true
      }
    ]);
  }

  configuring() {
    this.log(chalk.blue('Configuration des tests frontend...'));

    // Stocker la configuration pour une utilisation ultérieure
    this.config.set('testLibraries', this.answers.testLibraries);
    this.config.set('setupCI', this.answers.setupCI);
  }

  writing() {
    const config = this.config.getAll();
    const frontendFramework = config.frontendFramework || 'react';

    this.log(chalk.blue(`Génération des tests pour le framework ${frontendFramework}...`));

    // Détecter les dossiers frontend disponibles
    const frontendPath = this._detectFrontendPath();
    if (!frontendPath) {
      this.log(chalk.red('Aucun dossier frontend détecté! Les tests ne peuvent pas être générés.'));
      return;
    }

    this.log(chalk.green(`Dossier frontend détecté: ${frontendPath}`));

    // Génération des fichiers de configuration et des tests selon le framework
    if (frontendFramework === 'react') {
      this._setupReactTests(frontendPath);
    } else if (frontendFramework === 'vue') {
      this._setupVueTests(frontendPath);
    } else if (frontendFramework === 'angular') {
      this._setupAngularTests(frontendPath);
    } else if (frontendFramework === 'thymeleaf' || frontendFramework === 'jte') {
      this._setupTemplateEngineTests(frontendPath, frontendFramework);
    }

    // Configuration pour les tests E2E
    if (this.answers.testLibraries.includes('cypress')) {
      this._setupCypressTests(frontendPath);
    }

    if (this.answers.testLibraries.includes('playwright')) {
      this._setupPlaywrightTests(frontendPath);
    }

    // Configuration CI si demandée
    if (this.answers.setupCI) {
      this._setupCIConfiguration();
    }
  }

  install() {
    this.log(chalk.blue('Installation des dépendances de test...'));

    const config = this.config.getAll();
    const frontendPath = this._detectFrontendPath();

    if (!frontendPath) {
      return;
    }

    // Définir les dépendances à installer
    const dependencies = this._getDependencies();

    // Installer les dépendances
    if (Object.keys(dependencies).length > 0) {
      const packageManager = this.config.get('packageManager') || 'npm';

      this.log(chalk.green(`Installation des dépendances avec ${packageManager}...`));

      if (packageManager === 'npm') {
        this.spawnCommandSync('npm', ['install', '--save-dev', ...Object.keys(dependencies).map(dep => `${dep}@${dependencies[dep]}`)], { cwd: frontendPath });
      } else if (packageManager === 'yarn') {
        this.spawnCommandSync('yarn', ['add', '--dev', ...Object.keys(dependencies).map(dep => `${dep}@${dependencies[dep]}`)], { cwd: frontendPath });
      } else if (packageManager === 'pnpm') {
        this.spawnCommandSync('pnpm', ['add', '--save-dev', ...Object.keys(dependencies).map(dep => `${dep}@${dependencies[dep]}`)], { cwd: frontendPath });
      }
    }
  }

  end() {
    this.log(chalk.green('Configuration des tests frontend terminée!'));
    this.log(chalk.yellow('Vous pouvez maintenant exécuter les tests avec la commande appropriée:'));

    const frontendPath = this._detectFrontendPath();
    if (!frontendPath) {
      return;
    }

    if (this.answers.testLibraries.includes('jest')) {
      this.log(chalk.cyan('npm test ou npm run test'));
    }
    if (this.answers.testLibraries.includes('vitest')) {
      this.log(chalk.cyan('npm run test:unit'));
    }
    if (this.answers.testLibraries.includes('cypress')) {
      this.log(chalk.cyan('npm run test:e2e'));
    }
    if (this.answers.testLibraries.includes('playwright')) {
      this.log(chalk.cyan('npm run test:e2e:playwright'));
    }
  }

  // Méthodes privées
  private _detectFrontendPath(): string | null {
    const possiblePaths = [
      // Chemins React/Vue/Angular
      path.join(this.destinationPath(), 'frontend'),
      path.join(this.destinationPath(), 'src/main/webapp'),
      path.join(this.destinationPath(), 'src/main/resources/static'),

      // Chemins spécifiques aux frameworks
      path.join(this.destinationPath(), 'react-app'),
      path.join(this.destinationPath(), 'vue-app'),
      path.join(this.destinationPath(), 'angular-app'),

      // Chemins Thymeleaf/JTE
      path.join(this.destinationPath(), 'src/main/resources/templates'),
      path.join(this.destinationPath(), 'src/main/resources/views'),
    ];

    for (const dir of possiblePaths) {
      if (this.fs.exists(dir)) {
        return dir;
      }
    }

    return null;
  }

  private _setupReactTests(frontendPath: string) {
    // 1. Configuration de Jest/Vitest
    if (this.answers.testLibraries.includes('jest')) {
      this.fs.copyTpl(
        this.templatePath('react/jest.config.js'),
        path.join(frontendPath, 'jest.config.js'),
        { useTypeScript: this.fs.exists(path.join(frontendPath, 'tsconfig.json')) }
      );

      // Ajouter les scripts au package.json
      const pkgPath = path.join(frontendPath, 'package.json');
      if (this.fs.exists(pkgPath)) {
        const pkg = this.fs.readJSON(pkgPath);
        pkg.scripts = pkg.scripts || {};
        pkg.scripts.test = 'jest';
        pkg.scripts['test:watch'] = 'jest --watch';
        pkg.scripts['test:coverage'] = 'jest --coverage';
        this.fs.writeJSON(pkgPath, pkg);
      }
    } else if (this.answers.testLibraries.includes('vitest')) {
      this.fs.copyTpl(
        this.templatePath('react/vitest.config.ts'),
        path.join(frontendPath, 'vitest.config.ts'),
        {}
      );

      // Ajouter les scripts au package.json
      const pkgPath = path.join(frontendPath, 'package.json');
      if (this.fs.exists(pkgPath)) {
        const pkg = this.fs.readJSON(pkgPath);
        pkg.scripts = pkg.scripts || {};
        pkg.scripts['test:unit'] = 'vitest run';
        pkg.scripts['test:unit:watch'] = 'vitest';
        pkg.scripts['test:unit:coverage'] = 'vitest run --coverage';
        this.fs.writeJSON(pkgPath, pkg);
      }
    }

    // 2. Tests pour composants React avec React Testing Library
    if (this.answers.testLibraries.includes('rtl')) {
      // Créer un répertoire de tests s'il n'existe pas
      const testDir = path.join(frontendPath, 'src/__tests__');
      this.fs.mkdirp(testDir);

      // Exemples de tests pour les composants
      this.fs.copyTpl(
        this.templatePath('react/component.test.tsx'),
        path.join(testDir, 'Button.test.tsx'),
        { componentName: 'Button' }
      );

      // Exemple de mock et de test d'un composant qui fait des appels API
      this.fs.copyTpl(
        this.templatePath('react/api-component.test.tsx'),
        path.join(testDir, 'UserList.test.tsx'),
        { componentName: 'UserList' }
      );

      // Configuration de setup pour les tests
      this.fs.copyTpl(
        this.templatePath('react/setup-tests.js'),
        path.join(frontendPath, 'src/setupTests.js'),
        {}
      );
    }

    // 3. Tests pour les hooks personnalisés
    if (this.answers.testLibraries.includes('rtl')) {
      const testDir = path.join(frontendPath, 'src/hooks/__tests__');
      this.fs.mkdirp(testDir);

      this.fs.copyTpl(
        this.templatePath('react/hook.test.tsx'),
        path.join(testDir, 'useCounter.test.tsx'),
        { hookName: 'useCounter' }
      );
    }

    // 4. Tests pour les utilitaires
    const utilsTestDir = path.join(frontendPath, 'src/utils/__tests__');
    this.fs.mkdirp(utilsTestDir);

    this.fs.copyTpl(
      this.templatePath('react/util.test.ts'),
      path.join(utilsTestDir, 'format.test.ts'),
      { utilName: 'format' }
    );
  }

  private _setupVueTests(frontendPath: string) {
    // 1. Configuration de Jest/Vitest
    if (this.answers.testLibraries.includes('jest')) {
      this.fs.copyTpl(
        this.templatePath('vue/jest.config.js'),
        path.join(frontendPath, 'jest.config.js'),
        { useTypeScript: this.fs.exists(path.join(frontendPath, 'tsconfig.json')) }
      );

      // Ajouter les scripts au package.json
      const pkgPath = path.join(frontendPath, 'package.json');
      if (this.fs.exists(pkgPath)) {
        const pkg = this.fs.readJSON(pkgPath);
        pkg.scripts = pkg.scripts || {};
        pkg.scripts.test = 'jest';
        pkg.scripts['test:watch'] = 'jest --watch';
        pkg.scripts['test:coverage'] = 'jest --coverage';
        this.fs.writeJSON(pkgPath, pkg);
      }
    } else if (this.answers.testLibraries.includes('vitest')) {
      this.fs.copyTpl(
        this.templatePath('vue/vitest.config.ts'),
        path.join(frontendPath, 'vitest.config.ts'),
        {}
      );

      // Ajouter les scripts au package.json
      const pkgPath = path.join(frontendPath, 'package.json');
      if (this.fs.exists(pkgPath)) {
        const pkg = this.fs.readJSON(pkgPath);
        pkg.scripts = pkg.scripts || {};
        pkg.scripts['test:unit'] = 'vitest run';
        pkg.scripts['test:unit:watch'] = 'vitest';
        pkg.scripts['test:unit:coverage'] = 'vitest run --coverage';
        this.fs.writeJSON(pkgPath, pkg);
      }
    }

    // 2. Tests pour composants Vue avec Vue Testing Library
    if (this.answers.testLibraries.includes('vtl')) {
      // Créer un répertoire de tests s'il n'existe pas
      const testDir = path.join(frontendPath, 'src/__tests__');
      this.fs.mkdirp(testDir);

      // Exemples de tests pour les composants
      this.fs.copyTpl(
        this.templatePath('vue/component.test.ts'),
        path.join(testDir, 'Button.test.ts'),
        { componentName: 'Button' }
      );

      // Exemple de mock et de test d'un composant qui fait des appels API
      this.fs.copyTpl(
        this.templatePath('vue/api-component.test.ts'),
        path.join(testDir, 'UserList.test.ts'),
        { componentName: 'UserList' }
      );
    }

    // 3. Tests pour les composables (hooks Vue)
    if (this.answers.testLibraries.includes('vtl')) {
      const testDir = path.join(frontendPath, 'src/composables/__tests__');
      this.fs.mkdirp(testDir);

      this.fs.copyTpl(
        this.templatePath('vue/composable.test.ts'),
        path.join(testDir, 'useCounter.test.ts'),
        { composableName: 'useCounter' }
      );
    }

    // 4. Tests pour les utilitaires
    const utilsTestDir = path.join(frontendPath, 'src/utils/__tests__');
    this.fs.mkdirp(utilsTestDir);

    this.fs.copyTpl(
      this.templatePath('vue/util.test.ts'),
      path.join(utilsTestDir, 'format.test.ts'),
      { utilName: 'format' }
    );
  }

  private _setupAngularTests(frontendPath: string) {
    // Les projets Angular ont déjà une configuration de test par défaut avec le CLI
    // Nous pouvons ajouter des exemples de tests pour les composants/services

    // 1. Exemples de tests pour les composants
    const componentTestDir = path.join(frontendPath, 'src/app/components');
    this.fs.mkdirp(componentTestDir);

    this.fs.copyTpl(
      this.templatePath('angular/component.spec.ts'),
      path.join(componentTestDir, 'button/button.component.spec.ts'),
      { componentName: 'Button' }
    );

    // 2. Exemples de tests pour les services
    const serviceTestDir = path.join(frontendPath, 'src/app/services');
    this.fs.mkdirp(serviceTestDir);

    this.fs.copyTpl(
      this.templatePath('angular/service.spec.ts'),
      path.join(serviceTestDir, 'user.service.spec.ts'),
      { serviceName: 'User' }
    );

    // 3. Tests pour les guards
    const guardTestDir = path.join(frontendPath, 'src/app/guards');
    this.fs.mkdirp(guardTestDir);

    this.fs.copyTpl(
      this.templatePath('angular/guard.spec.ts'),
      path.join(guardTestDir, 'auth.guard.spec.ts'),
      { guardName: 'Auth' }
    );

    // 4. Tests pour les pipes
    const pipeTestDir = path.join(frontendPath, 'src/app/pipes');
    this.fs.mkdirp(pipeTestDir);

    this.fs.copyTpl(
      this.templatePath('angular/pipe.spec.ts'),
      path.join(pipeTestDir, 'format-date.pipe.spec.ts'),
      { pipeName: 'FormatDate' }
    );

    // 5. Tests pour les directives
    const directiveTestDir = path.join(frontendPath, 'src/app/directives');
    this.fs.mkdirp(directiveTestDir);

    this.fs.copyTpl(
      this.templatePath('angular/directive.spec.ts'),
      path.join(directiveTestDir, 'highlight.directive.spec.ts'),
      { directiveName: 'Highlight' }
    );
  }

  private _setupTemplateEngineTests(frontendPath: string, engine: string) {
    // Pour les moteurs de template comme Thymeleaf ou JTE, on utilise des tests d'intégration
    // Ces tests sont généralement côté serveur avec Spring Boot

    // Créer un répertoire de tests d'intégration Spring pour les templates
    const integrationTestDir = path.join(this.destinationPath(), 'src/test/java');

    // Trouver le package principal
    const packageDir = this._findJavaPackageDir(integrationTestDir);
    if (!packageDir) {
      this.log(chalk.red('Impossible de trouver le package principal Java.'));
      return;
    }

    const templateTestDir = path.join(packageDir, 'web');
    this.fs.mkdirp(templateTestDir);

    // Test d'intégration pour les templates
    this.fs.copyTpl(
      this.templatePath(`${engine}/template-integration-test.java`),
      path.join(templateTestDir, `${this._capitalize(engine)}TemplateIntegrationTest.java`),
      {
        packageName: this._getJavaPackageName(packageDir),
        engineName: this._capitalize(engine),
      }
    );
  }

  private _setupCypressTests(frontendPath: string) {
    // Créer la structure de base pour Cypress
    const cypressDir = path.join(frontendPath, 'cypress');
    this.fs.mkdirp(cypressDir);
    this.fs.mkdirp(path.join(cypressDir, 'fixtures'));
    this.fs.mkdirp(path.join(cypressDir, 'integration'));
    this.fs.mkdirp(path.join(cypressDir, 'plugins'));
    this.fs.mkdirp(path.join(cypressDir, 'support'));

    // Configuration de base
    this.fs.copyTpl(
      this.templatePath('e2e/cypress.config.ts'),
      path.join(frontendPath, 'cypress.config.ts'),
      {}
    );

    // Test E2E de base
    this.fs.copyTpl(
      this.templatePath('e2e/cypress-login.spec.ts'),
      path.join(cypressDir, 'integration/login.spec.ts'),
      {}
    );

    this.fs.copyTpl(
      this.templatePath('e2e/cypress-navigation.spec.ts'),
      path.join(cypressDir, 'integration/navigation.spec.ts'),
      {}
    );

    // Support files
    this.fs.copyTpl(
      this.templatePath('e2e/cypress-commands.js'),
      path.join(cypressDir, 'support/commands.js'),
      {}
    );

    this.fs.copyTpl(
      this.templatePath('e2e/cypress-index.js'),
      path.join(cypressDir, 'support/index.js'),
      {}
    );

    // Ajouter les scripts au package.json
    const pkgPath = path.join(frontendPath, 'package.json');
    if (this.fs.exists(pkgPath)) {
      const pkg = this.fs.readJSON(pkgPath);
      pkg.scripts = pkg.scripts || {};
      pkg.scripts['test:e2e'] = 'cypress run';
      pkg.scripts['cypress:open'] = 'cypress open';
      this.fs.writeJSON(pkgPath, pkg);
    }
  }

  private _setupPlaywrightTests(frontendPath: string) {
    // Créer la structure de base pour Playwright
    const playwrightDir = path.join(frontendPath, 'playwright');
    this.fs.mkdirp(playwrightDir);
    this.fs.mkdirp(path.join(playwrightDir, 'tests'));

    // Configuration de base
    this.fs.copyTpl(
      this.templatePath('e2e/playwright.config.ts'),
      path.join(frontendPath, 'playwright.config.ts'),
      {}
    );

    // Tests E2E de base
    this.fs.copyTpl(
      this.templatePath('e2e/playwright-login.spec.ts'),
      path.join(playwrightDir, 'tests/login.spec.ts'),
      {}
    );

    this.fs.copyTpl(
      this.templatePath('e2e/playwright-navigation.spec.ts'),
      path.join(playwrightDir, 'tests/navigation.spec.ts'),
      {}
    );

    // Ajouter les scripts au package.json
    const pkgPath = path.join(frontendPath, 'package.json');
    if (this.fs.exists(pkgPath)) {
      const pkg = this.fs.readJSON(pkgPath);
      pkg.scripts = pkg.scripts || {};
      pkg.scripts['test:e2e:playwright'] = 'playwright test';
      pkg.scripts['playwright:ui'] = 'playwright test --ui';
      this.fs.writeJSON(pkgPath, pkg);
    }
  }

  private _setupCIConfiguration() {
    // Créer des fichiers de configuration CI basés sur les choix de l'utilisateur
    if (this.answers.testLibraries.includes('jest') || this.answers.testLibraries.includes('vitest')) {
      // GitHub Actions configuration
      this.fs.copyTpl(
        this.templatePath('ci/github-actions-test.yml'),
        path.join(this.destinationPath(), '.github/workflows/test.yml'),
        {
          testLibraries: this.answers.testLibraries,
          hasE2E: this.answers.testLibraries.includes('cypress') || this.answers.testLibraries.includes('playwright')
        }
      );
    }
  }

  private _getDependencies() {
    const deps: Record<string, string> = {};
    const config = this.config.getAll();
    const frontendFramework = config.frontendFramework || 'react';
    const useTypeScript = this.fs.exists(path.join(this._detectFrontendPath() || '', 'tsconfig.json'));

    if (this.answers.testLibraries.includes('jest')) {
      deps['jest'] = '^29.6.0';

      if (useTypeScript) {
        deps['ts-jest'] = '^29.1.0';
        deps['@types/jest'] = '^29.5.0';
      }

      if (frontendFramework === 'react') {
        deps['@testing-library/jest-dom'] = '^5.16.5';
      }
    }

    if (this.answers.testLibraries.includes('vitest')) {
      deps['vitest'] = '^0.34.0';
      deps['@vitest/coverage-v8'] = '^0.34.0';
      deps['happy-dom'] = '^12.0.0';
    }

    if (this.answers.testLibraries.includes('rtl')) {
      deps['@testing-library/react'] = '^14.0.0';
      deps['@testing-library/user-event'] = '^14.0.0';
    }

    if (this.answers.testLibraries.includes('vtl')) {
      deps['@testing-library/vue'] = '^7.0.0';
      deps['@vue/test-utils'] = '^2.0.0';
    }

    if (this.answers.testLibraries.includes('cypress')) {
      deps['cypress'] = '^12.0.0';
    }

    if (this.answers.testLibraries.includes('playwright')) {
      deps['@playwright/test'] = '^1.36.0';
    }

    return deps;
  }

  private _findJavaPackageDir(baseDir: string): string | null {
    // Cette méthode trouve récursivement le premier dossier package Java
    if (!this.fs.exists(baseDir)) {
      return null;
    }

    try {
      const entries = this.fs.readdirSync(baseDir);

      for (const entry of entries) {
        const fullPath = path.join(baseDir, entry);
        const stats = this.fs.statSync(fullPath);

        if (stats.isDirectory()) {
          // C'est peut-être un dossier package?
          if (this._isJavaPackageDir(fullPath)) {
            return fullPath;
          }

          // Chercher dans ce sous-dossier
          const packageDir = this._findJavaPackageDir(fullPath);
          if (packageDir) {
            return packageDir;
          }
        }
      }
    } catch (e) {
      // Ignorer les erreurs
    }

    return null;
  }

  private _isJavaPackageDir(dirPath: string): boolean {
    // Vérifier si ce dossier contient des fichiers Java
    try {
      const entries = this.fs.readdirSync(dirPath);
      return entries.some(entry => entry.endsWith('.java'));
    } catch (e) {
      return false;
    }
  }

  private _getJavaPackageName(packageDir: string): string {
    // Convertit un chemin de package en nom de package Java
    const projectRoot = this.destinationPath();
    const relativePath = path.relative(path.join(projectRoot, 'src/main/java'), packageDir);

    if (!relativePath) {
      return 'com.example.demo';
    }

    return relativePath.replace(/[\\/]/g, '.');
  }

  private _capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
