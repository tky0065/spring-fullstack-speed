import { BaseGenerator } from '../base-generator.js';
import { SFSOptions } from '../types.js';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';

/**
 * Générateur pour les tests d'intégration frontend
 * Permet de configurer et d'ajouter des tests pour les frameworks frontend
 */

// Styles visuels constants
const STEP_PREFIX = chalk.bold.blue("➤ ");
const SECTION_DIVIDER = chalk.gray("────────────────────────────────────────────");
const INFO_COLOR = chalk.yellow;
const SUCCESS_COLOR = chalk.green;
const ERROR_COLOR = chalk.red;
const HELP_COLOR = chalk.gray.italic;

/**
 * Options spécifiques au générateur de tests frontend
 */
export interface FrontendTestGeneratorOptions extends SFSOptions {
  testLibraries?: string[];
  setupCI?: boolean;
  [key: string]: any;
}

export default class FrontendTestGenerator extends BaseGenerator {
  // Utiliser une approche différente pour la déclaration des options
  declare options: any; // Type any pour contourner le problème de compatibilité
  declare answers: any;

  constructor(args: string | string[], opts: any) {
    super(args, opts);

    this.desc('Générateur pour les tests d\'intégration des frameworks frontend');
  }

  initializing() {
    this.log(SECTION_DIVIDER);
    this.log(chalk.bold.blue('🧪 GÉNÉRATEUR DE TESTS FRONTEND'));
    this.log(SECTION_DIVIDER);
    this.log(HELP_COLOR('Ce générateur va ajouter des tests pour les frameworks frontend configurés.'));
    this.log("");
  }

  /**
   * Affiche un message d'aide contextuelle
   */
  displayHelpMessage(message: string) {
    this.log(HELP_COLOR(`💡 ${message}`));
  }

  /**
   * Affiche un message de succès
   */
  displaySuccess(message: string) {
    this.log(SUCCESS_COLOR(`✅ ${message}`));
  }

  /**
   * Affiche un message d'erreur
   */
  displayError(message: string) {
    this.log(ERROR_COLOR(`❌ ${message}`));
  }

  /**
   * Créer un répertoire s'il n'existe pas
   * @param dirPath Chemin du répertoire à créer
   */
  createDirectory(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  async prompting() {
    // Récupération de la configuration existante
    const config = this.config.getAll();
    const frontendFramework = config.frontendFramework || 'react';

    this.log(SECTION_DIVIDER);
    this.log(STEP_PREFIX + chalk.bold("CONFIGURATION DES TESTS"));
    this.log(SECTION_DIVIDER);

    this.answers = await this.prompt([
      {
        type: 'checkbox',
        name: 'testLibraries',
        message: chalk.cyan('Quelles bibliothèques de test souhaitez-vous utiliser?'),
        choices: () => {
          const choices = [
            { name: 'Jest (Tests unitaires/d\'intégration)', value: 'jest', checked: true },
            { name: 'React Testing Library (Pour les composants React)', value: 'rtl', checked: frontendFramework === 'react' },
            { name: 'Vue Testing Library (Pour les composants Vue)', value: 'vtl', checked: frontendFramework === 'vue' },
            { name: 'Cypress (Tests E2E)', value: 'cypress', checked: true },
            { name: 'Playwright (Tests E2E alternatifs)', value: 'playwright' },
            { name: 'Vitest (Alternative à Jest pour Vite)', value: 'vitest', checked: (frontendFramework === 'react' || frontendFramework === 'vue') },
            // Nouveaux types de tests ajoutés
            { name: 'Tests de performance (Web Vitals)', value: 'performance', checked: false },
            { name: 'Tests d\'accessibilité (axe)', value: 'accessibility', checked: false },
            { name: 'Tests de design responsive', value: 'responsive', checked: false },
            { name: 'Tests de snapshots', value: 'snapshots', checked: true },
            { name: 'Tests SEO', value: 'seo', checked: false },
            { name: 'Tests PWA', value: 'pwa', checked: false }
          ];
          return choices;
        }
      },
      {
        type: 'confirm',
        name: 'setupCI',
        message: chalk.cyan('Voulez-vous configurer les tests pour l\'intégration continue?'),
        default: true
      }
    ]);
  }

  configuring() {
    this.log(STEP_PREFIX + chalk.bold('ENREGISTREMENT DE LA CONFIGURATION...'));

    // Stocker la configuration pour une utilisation ultérieure
    this.config.set('testLibraries', this.answers.testLibraries);
    this.config.set('setupCI', this.answers.setupCI);

    this.displaySuccess('Configuration enregistrée');
  }

  writing() {
    const config = this.config.getAll();
    const frontendFramework = config.frontendFramework || 'react';

    this.log("");
    this.log(STEP_PREFIX + chalk.bold("GÉNÉRATION DES FICHIERS DE TEST"));
    this.log(SECTION_DIVIDER);
    this.displayHelpMessage(`Génération des tests pour le framework ${frontendFramework}...`);

    // Détecter les dossiers frontend disponibles
    const frontendPath = this._detectFrontendPath();
    if (!frontendPath) {
      this.displayError('Aucun dossier frontend détecté! Les tests ne peuvent pas être générés.');
      return;
    }

    this.displaySuccess(`Dossier frontend détecté: ${frontendPath}`);

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
    this.log("");
    this.log(STEP_PREFIX + chalk.bold("INSTALLATION DES DÉPENDANCES"));
    this.log(SECTION_DIVIDER);
    this.displayHelpMessage('Installation des dépendances de test...');

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

      this.displayHelpMessage(`Installation avec ${packageManager}...`);

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
    this.log("");
    this.log(STEP_PREFIX + chalk.bold("CONFIGURATION TERMINÉE"));
    this.log(SECTION_DIVIDER);
    this.displaySuccess('Configuration des tests frontend terminée!');
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
      if (fs.existsSync(dir)) {
        return dir;
      }
    }

    return null;
  }

  private _setupReactTests(frontendPath: string) {
    this.displayHelpMessage('Configuration des tests React...');

    // 1. Configuration de Jest/Vitest
    if (this.answers.testLibraries.includes('jest')) {
      this.fs.copyTpl(
        this.templatePath('react/jest.config.js'),
        path.join(frontendPath, 'jest.config.js'),
        { useTypeScript: fs.existsSync(path.join(frontendPath, 'tsconfig.json')) }
      );

      // Ajouter les scripts au package.json
      const pkgPath = path.join(frontendPath, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        pkg.scripts = pkg.scripts || {};
        pkg.scripts.test = 'jest';
        pkg.scripts['test:watch'] = 'jest --watch';
        pkg.scripts['test:coverage'] = 'jest --coverage';
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
      }

      this.displaySuccess('Configuration Jest ajoutée');
    } else if (this.answers.testLibraries.includes('vitest')) {
      this.fs.copyTpl(
        this.templatePath('react/vitest.config.ts'),
        path.join(frontendPath, 'vitest.config.ts'),
        {}
      );

      // Ajouter les scripts au package.json
      const pkgPath = path.join(frontendPath, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        pkg.scripts = pkg.scripts || {};
        pkg.scripts['test:unit'] = 'vitest run';
        pkg.scripts['test:unit:watch'] = 'vitest';
        pkg.scripts['test:unit:coverage'] = 'vitest run --coverage';
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
      }

      this.displaySuccess('Configuration Vitest ajoutée');
    }

    // 2. Tests pour composants React avec React Testing Library
    if (this.answers.testLibraries.includes('rtl')) {
      // Créer un répertoire de tests s'il n'existe pas
      const testDir = path.join(frontendPath, 'src/__tests__');
      this.createDirectory(testDir);

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

      this.displaySuccess('Tests de composants React ajoutés');
    }

    // 3. Tests pour les hooks personnalisés
    if (this.answers.testLibraries.includes('rtl')) {
      const testDir = path.join(frontendPath, 'src/hooks/__tests__');
      this.createDirectory(testDir);

      this.fs.copyTpl(
        this.templatePath('react/hook.test.tsx'),
        path.join(testDir, 'useCounter.test.tsx'),
        { hookName: 'useCounter' }
      );

      this.displaySuccess('Tests de hooks React ajoutés');
    }

    // 4. Tests pour les utilitaires
    const utilsTestDir = path.join(frontendPath, 'src/utils/__tests__');
    this.createDirectory(utilsTestDir);

    this.fs.copyTpl(
      this.templatePath('react/util.test.ts'),
      path.join(utilsTestDir, 'format.test.ts'),
      { utilName: 'format' }
    );

    this.displaySuccess('Tests d\'utilitaires ajoutés');
    // 5. Tests supplémentaires - Nouveaux types de tests
    this._setupAdvancedTests(frontendPath);
  }

  /**
   * Configure les tests avancés: performances, accessibilité, responsive, snapshots, SEO, PWA
   */
  private _setupAdvancedTests(frontendPath: string) {
    const testDir = path.join(frontendPath, 'src/__tests__');
    const appName = this.config.get('appName') || 'App';

    // Tests de performance (Web Vitals)
    if (this.answers.testLibraries.includes('performance')) {
      this.displayHelpMessage('Configuration des tests de performance...');
      const performanceTestDir = path.join(testDir, 'performance');
      this.createDirectory(performanceTestDir);

      this.fs.copyTpl(
        this.templatePath('performance/web-vitals.test.ts'),
        path.join(performanceTestDir, 'web-vitals.test.ts'),
        { appName }
      );

      // Ajouter les dépendances au package.json
      this._addDependencies(frontendPath, {
        'web-vitals': '^3.5.0'
      });

      this.displaySuccess('Tests de performance ajoutés');
    }

    // Tests d'accessibilité
    if (this.answers.testLibraries.includes('accessibility')) {
      this.displayHelpMessage('Configuration des tests d\'accessibilité...');
      const accessibilityTestDir = path.join(testDir, 'accessibility');
      this.createDirectory(accessibilityTestDir);

      this.fs.copyTpl(
        this.templatePath('accessibility/accessibility.test.tsx'),
        path.join(accessibilityTestDir, 'accessibility.test.tsx'),
        { appName }
      );

      // Ajouter les dépendances au package.json
      this._addDependencies(frontendPath, {
        'jest-axe': '^8.0.0',
        '@types/jest-axe': '^3.5.0'
      });

      this.displaySuccess('Tests d\'accessibilité ajoutés');
    }

    // Tests de responsive design
    if (this.answers.testLibraries.includes('responsive')) {
      this.displayHelpMessage('Configuration des tests de responsive design...');
      const responsiveTestDir = path.join(testDir, 'responsive');
      this.createDirectory(responsiveTestDir);

      this.fs.copyTpl(
        this.templatePath('responsive/responsive.test.tsx'),
        path.join(responsiveTestDir, 'responsive.test.tsx'),
        { appName }
      );

      // Ajouter les dépendances au package.json
      this._addDependencies(frontendPath, {
        'jest-matchmedia-mock': '^1.1.0'
      });

      this.displaySuccess('Tests de responsive design ajoutés');
    }

    // Tests de snapshots
    if (this.answers.testLibraries.includes('snapshots')) {
      this.displayHelpMessage('Configuration des tests de snapshots...');
      const snapshotsTestDir = path.join(testDir, 'snapshots');
      this.createDirectory(snapshotsTestDir);

      this.fs.copyTpl(
        this.templatePath('snapshots/snapshot.test.tsx'),
        path.join(snapshotsTestDir, 'snapshot.test.tsx'),
        { appName }
      );

      // Ajouter les dépendances au package.json
      this._addDependencies(frontendPath, {
        'react-test-renderer': '^18.2.0',
        '@types/react-test-renderer': '^18.0.0'
      });

      this.displaySuccess('Tests de snapshots ajoutés');
    }

    // Tests SEO
    if (this.answers.testLibraries.includes('seo')) {
      this.displayHelpMessage('Configuration des tests SEO...');
      const seoTestDir = path.join(testDir, 'seo');
      this.createDirectory(seoTestDir);

      this.fs.copyTpl(
        this.templatePath('seo/seo.test.tsx'),
        path.join(seoTestDir, 'seo.test.tsx'),
        { appName }
      );

      // Ajouter les dépendances au package.json
      this._addDependencies(frontendPath, {
        'react-helmet-async': '^1.3.0',
        'react-router-dom': '^6.15.0'
      });

      this.displaySuccess('Tests SEO ajoutés');
    }

    // Tests PWA
    if (this.answers.testLibraries.includes('pwa')) {
      this.displayHelpMessage('Configuration des tests PWA...');
      const pwaTestDir = path.join(testDir, 'pwa');
      this.createDirectory(pwaTestDir);

      this.fs.copyTpl(
        this.templatePath('pwa/pwa.test.tsx'),
        path.join(pwaTestDir, 'pwa.test.tsx'),
        { appName }
      );

      // Ajouter les dépendances au package.json
      this._addDependencies(frontendPath, {
        'workbox-window': '^7.0.0',
        'jest-fetch-mock': '^3.0.3'
      });

      this.displaySuccess('Tests PWA ajoutés');
    }
  }

  /**
   * Ajoute des dépendances au package.json
   */
  private _addDependencies(frontendPath: string, dependencies: Record<string, string>): void {
    const pkgPath = path.join(frontendPath, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      pkg.devDependencies = pkg.devDependencies || {};

      // Ajouter les nouvelles dépendances
      Object.entries(dependencies).forEach(([name, version]) => {
        if (!pkg.devDependencies[name]) {
          pkg.devDependencies[name] = version;
        }
      });

      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    }
  }

  private _setupVueTests(frontendPath: string) {
    this.displayHelpMessage('Configuration des tests Vue...');

    // 1. Configuration de Jest/Vitest
    if (this.answers.testLibraries.includes('jest')) {
      this.fs.copyTpl(
        this.templatePath('vue/jest.config.js'),
        path.join(frontendPath, 'jest.config.js'),
        { useTypeScript: fs.existsSync(path.join(frontendPath, 'tsconfig.json')) }
      );

      // Ajouter les scripts au package.json
      const pkgPath = path.join(frontendPath, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        pkg.scripts = pkg.scripts || {};
        pkg.scripts.test = 'jest';
        pkg.scripts['test:watch'] = 'jest --watch';
        pkg.scripts['test:coverage'] = 'jest --coverage';
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
      }

      this.displaySuccess('Configuration Jest ajoutée');
    } else if (this.answers.testLibraries.includes('vitest')) {
      this.fs.copyTpl(
        this.templatePath('vue/vitest.config.ts'),
        path.join(frontendPath, 'vitest.config.ts'),
        {}
      );

      // Ajouter les scripts au package.json
      const pkgPath = path.join(frontendPath, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        pkg.scripts = pkg.scripts || {};
        pkg.scripts['test:unit'] = 'vitest run';
        pkg.scripts['test:unit:watch'] = 'vitest';
        pkg.scripts['test:unit:coverage'] = 'vitest run --coverage';
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
      }

      this.displaySuccess('Configuration Vitest ajoutée');
    }

    // 2. Tests pour composants Vue avec Vue Testing Library
    if (this.answers.testLibraries.includes('vtl')) {
      // Créer un répertoire de tests s'il n'existe pas
      const testDir = path.join(frontendPath, 'src/__tests__');
      this.createDirectory(testDir);

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

      this.displaySuccess('Tests de composants Vue ajoutés');
    }

    // 3. Tests pour les composables (hooks Vue)
    if (this.answers.testLibraries.includes('vtl')) {
      const testDir = path.join(frontendPath, 'src/composables/__tests__');
      this.createDirectory(testDir);

      this.fs.copyTpl(
        this.templatePath('vue/composable.test.ts'),
        path.join(testDir, 'useCounter.test.ts'),
        { composableName: 'useCounter' }
      );

      this.displaySuccess('Tests de composables Vue ajoutés');
    }

    // 4. Tests pour les utilitaires
    const utilsTestDir = path.join(frontendPath, 'src/utils/__tests__');
    this.createDirectory(utilsTestDir);

    this.fs.copyTpl(
      this.templatePath('vue/util.test.ts'),
      path.join(utilsTestDir, 'format.test.ts'),
      { utilName: 'format' }
    );

    this.displaySuccess('Tests d\'utilitaires ajoutés');
  }

  private _setupAngularTests(frontendPath: string) {
    this.displayHelpMessage('Configuration des tests Angular...');

    // Les projets Angular ont déjà une configuration de test par défaut avec le CLI
    // Nous pouvons ajouter des exemples de tests pour les composants/services

    // 1. Exemples de tests pour les composants
    const componentTestDir = path.join(frontendPath, 'src/app/components');
    this.createDirectory(componentTestDir);
    this.createDirectory(path.join(componentTestDir, 'button'));

    this.fs.copyTpl(
      this.templatePath('angular/component.spec.ts'),
      path.join(componentTestDir, 'button/button.component.spec.ts'),
      { componentName: 'Button' }
    );

    this.displaySuccess('Tests de composants Angular ajoutés');

    // 2. Exemples de tests pour les services
    const serviceTestDir = path.join(frontendPath, 'src/app/services');
    this.createDirectory(serviceTestDir);

    this.fs.copyTpl(
      this.templatePath('angular/service.spec.ts'),
      path.join(serviceTestDir, 'user.service.spec.ts'),
      { serviceName: 'User' }
    );

    this.displaySuccess('Tests de services Angular ajoutés');

    // 3. Tests pour les guards
    const guardTestDir = path.join(frontendPath, 'src/app/guards');
    this.createDirectory(guardTestDir);

    this.fs.copyTpl(
      this.templatePath('angular/guard.spec.ts'),
      path.join(guardTestDir, 'auth.guard.spec.ts'),
      { guardName: 'Auth' }
    );

    this.displaySuccess('Tests de guards Angular ajoutés');

    // 4. Tests pour les pipes
    const pipeTestDir = path.join(frontendPath, 'src/app/pipes');
    this.createDirectory(pipeTestDir);

    this.fs.copyTpl(
      this.templatePath('angular/pipe.spec.ts'),
      path.join(pipeTestDir, 'format-date.pipe.spec.ts'),
      { pipeName: 'FormatDate' }
    );

    this.displaySuccess('Tests de pipes Angular ajoutés');

    // 5. Tests pour les directives
    const directiveTestDir = path.join(frontendPath, 'src/app/directives');
    this.createDirectory(directiveTestDir);

    this.fs.copyTpl(
      this.templatePath('angular/directive.spec.ts'),
      path.join(directiveTestDir, 'highlight.directive.spec.ts'),
      { directiveName: 'Highlight' }
    );

    this.displaySuccess('Tests de directives Angular ajoutés');
  }

  private _setupTemplateEngineTests(frontendPath: string, engine: string) {
    this.displayHelpMessage('Configuration des tests pour le moteur de templates ' + engine);

    // Pour les moteurs de template comme Thymeleaf ou JTE, on utilise des tests d'intégration
    // Ces tests sont généralement côté serveur avec Spring Boot

    // Créer un répertoire de tests d'intégration Spring pour les templates
    const integrationTestDir = path.join(this.destinationPath(), 'src/test/java');

    // Trouver le package principal
    const packageDir = this._findJavaPackageDir(integrationTestDir);
    if (!packageDir) {
      this.displayError('Impossible de trouver le package principal Java.');
      return;
    }

    const templateTestDir = path.join(packageDir, 'web');
    this.createDirectory(templateTestDir);

    // Test d'intégration pour les templates
    this.fs.copyTpl(
      this.templatePath(`${engine}/template-integration-test.java`),
      path.join(templateTestDir, `${this._capitalize(engine)}TemplateIntegrationTest.java`),
      {
        packageName: this._getJavaPackageName(packageDir),
        engineName: this._capitalize(engine),
      }
    );

    this.displaySuccess('Tests d\'intégration pour le moteur de templates ajoutés');
  }

  private _setupCypressTests(frontendPath: string) {
    this.displayHelpMessage('Configuration des tests Cypress...');

    // Créer la structure de base pour Cypress
    const cypressDir = path.join(frontendPath, 'cypress');
    this.createDirectory(cypressDir);
    this.createDirectory(path.join(cypressDir, 'fixtures'));
    this.createDirectory(path.join(cypressDir, 'integration'));
    this.createDirectory(path.join(cypressDir, 'plugins'));
    this.createDirectory(path.join(cypressDir, 'support'));

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
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      pkg.scripts = pkg.scripts || {};
      pkg.scripts['test:e2e'] = 'cypress run';
      pkg.scripts['cypress:open'] = 'cypress open';
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    }

    this.displaySuccess('Configuration Cypress ajoutée');
  }

  private _setupPlaywrightTests(frontendPath: string) {
    this.displayHelpMessage('Configuration des tests Playwright...');

    // Créer la structure de base pour Playwright
    const playwrightDir = path.join(frontendPath, 'playwright');
    this.createDirectory(playwrightDir);
    this.createDirectory(path.join(playwrightDir, 'tests'));

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
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      pkg.scripts = pkg.scripts || {};
      pkg.scripts['test:e2e:playwright'] = 'playwright test';
      pkg.scripts['playwright:ui'] = 'playwright test --ui';
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    }

    this.displaySuccess('Configuration Playwright ajoutée');
  }

  private _setupCIConfiguration() {
    this.displayHelpMessage('Configuration CI pour les tests...');

    // Créer des fichiers de configuration CI basés sur les choix de l'utilisateur
    if (this.answers.testLibraries.includes('jest') || this.answers.testLibraries.includes('vitest')) {
      // GitHub Actions configuration
      const workflowsDir = path.join(this.destinationPath(), '.github/workflows');
      this.createDirectory(workflowsDir);

      this.fs.copyTpl(
        this.templatePath('ci/github-actions-test.yml'),
        path.join(workflowsDir, 'test.yml'),
        {
          testLibraries: this.answers.testLibraries,
          hasE2E: this.answers.testLibraries.includes('cypress') || this.answers.testLibraries.includes('playwright')
        }
      );

      this.displaySuccess('Configuration CI GitHub Actions ajoutée');
    }
  }

  private _getDependencies() {
    const deps: Record<string, string> = {};
    const config = this.config.getAll();
    const frontendFramework = config.frontendFramework || 'react';
    const frontendPath = this._detectFrontendPath();
    const useTypeScript = frontendPath && fs.existsSync(path.join(frontendPath, 'tsconfig.json'));

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

    // Dépendances pour les tests avancés
    if (this.answers.testLibraries.includes('performance')) {
      deps['web-vitals'] = '^3.5.0';
    }

    if (this.answers.testLibraries.includes('accessibility')) {
      deps['jest-axe'] = '^8.0.0';
      deps['@types/jest-axe'] = '^3.5.0';
    }

    if (this.answers.testLibraries.includes('responsive')) {
      deps['jest-matchmedia-mock'] = '^1.1.0';
    }

    if (this.answers.testLibraries.includes('snapshots')) {
      deps['react-test-renderer'] = '^18.2.0';
      deps['@types/react-test-renderer'] = '^18.0.0';
    }

    if (this.answers.testLibraries.includes('seo')) {
      deps['react-helmet-async'] = '^1.3.0';
      deps['react-router-dom'] = '^6.15.0';
    }

    if (this.answers.testLibraries.includes('pwa')) {
      deps['workbox-window'] = '^7.0.0';
      deps['jest-fetch-mock'] = '^3.0.3';
    }

    return deps;
  }

  private _findJavaPackageDir(baseDir: string): string | null {
    // Cette méthode trouve récursivement le premier dossier package Java
    if (!fs.existsSync(baseDir)) {
      return null;
    }

    try {
      const entries = fs.readdirSync(baseDir);

      for (const entry of entries) {
        const fullPath = path.join(baseDir, entry);
        const stats = fs.statSync(fullPath);

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
      const entries = fs.readdirSync(dirPath);
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
