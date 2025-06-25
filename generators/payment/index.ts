// Correction du générateur de paiement
import { BaseGenerator } from "../base-generator.js";
import chalk from "chalk";
import * as fs from 'fs';
import path from 'path';

// Styles visuels constants
const STEP_PREFIX = chalk.bold.blue("➤ ");
const SECTION_DIVIDER = chalk.gray("────────────────────────────────────────────");
const INFO_COLOR = chalk.yellow;
const SUCCESS_COLOR = chalk.green;
const ERROR_COLOR = chalk.red;

// Valeur par défaut pour le package
const DEFAULT_PACKAGE = "com.dev.app";

// Interface pour typer les options du générateur de paiement
interface PaymentGeneratorOptions {
  provider: string[];
  subscription: boolean;
  webhook: boolean;
  invoicing: boolean;
  taxes: boolean;
  refunds: boolean;
  reporting: boolean;
  skipInstall?: boolean;
}

/**
 * Générateur pour le système de paiement
 * Intègre Stripe API, PayPal SDK et d'autres fonctionnalités de paiement
 */
export default class PaymentGenerator extends BaseGenerator {
  declare answers: any;
  declare paymentOptions: PaymentGeneratorOptions;
  packageName: string = "";
  declare appConfig: any;

  constructor(args: string | string[], options: any) {
    super(args, options);

    // Définir les options du générateur
    this.option('provider', {
      type: Array,
      description: 'Provider(s) de paiement à intégrer (stripe, paypal, etc)',
      default: ['stripe']
    });

    this.option('subscription', {
      type: Boolean,
      description: 'Intégrer le support des abonnements',
      default: false
    });

    this.option('webhook', {
      type: Boolean,
      description: 'Configurer les webhooks pour les événements de paiement',
      default: true
    });

    this.option('invoicing', {
      type: Boolean,
      description: 'Ajouter le système de facturation',
      default: false
    });

    this.option('taxes', {
      type: Boolean,
      description: 'Configurer la gestion des taxes',
      default: false
    });

    this.option('refunds', {
      type: Boolean,
      description: 'Implémenter la gestion des remboursements',
      default: false
    });

    this.option('reporting', {
      type: Boolean,
      description: 'Générer des rapports financiers',
      default: false
    });

    this.option('lombok', {
      type: Boolean,
      description: 'Utiliser Lombok pour réduire le code boilerplate',
      default: true
    });
  }

  // Initialiser le générateur
  async initializing() {
    this.log(SECTION_DIVIDER);
    this.log(STEP_PREFIX + chalk.green('Initialisation du générateur de système de paiement...'));
    this.log(SECTION_DIVIDER);

    try {
      // Tenter de charger la configuration existante depuis .yo-rc.json s'il existe
      const configPath = this.destinationPath('.yo-rc.json');
      if (fs.existsSync(configPath)) {
        try {
          const configFile = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (configFile['generator-spring-fullstack-speed']) {
            this.appConfig = configFile['generator-spring-fullstack-speed'];
            this.log(SUCCESS_COLOR('✅ Configuration existante chargée.'));
          }
        } catch (error) {
          this.log(INFO_COLOR('⚠️ Impossible de charger la configuration existante. Utilisation des valeurs par défaut.'));
        }
      }

      // Vérifier la présence du projet Spring Boot de façon plus flexible
      const isPomExists = fs.existsSync(this.destinationPath('pom.xml'));
      const isGradleExists = fs.existsSync(this.destinationPath('build.gradle'));
      const isSrcFolderExists = fs.existsSync(this.destinationPath('src/main/java'));

      if (!isPomExists && !isGradleExists) {
        this.log(INFO_COLOR('⚠️ Attention: Aucun fichier pom.xml ou build.gradle détecté. Le générateur va continuer, mais il est recommandé d\'avoir un projet Spring Boot existant.'));
      }

      // Même sans pom.xml ou build.gradle, on continue si un dossier src/main/java existe
      if (!isPomExists && !isGradleExists && !isSrcFolderExists) {
        this.log(INFO_COLOR('⚠️ Aucune structure de projet Java standard détectée. Le générateur va créer les fichiers nécessaires.'));
      }

      // Détecter le package de base
      this.packageName = this.findBasePackageName();

      this.log(SUCCESS_COLOR(`✅ Configuration initialisée avec succès. Package détecté: ${this.packageName}`));
    } catch (error) {
      this.log(ERROR_COLOR(`❌ Erreur lors de l'initialisation: ${error}`));
      // Définir des valeurs par défaut pour éviter les erreurs plus tard
      this.packageName = DEFAULT_PACKAGE;
    }
  }

  async prompting() {
    this.log(SECTION_DIVIDER);
    this.log(STEP_PREFIX + chalk.green('Configuration du système de paiement'));
    this.log(SECTION_DIVIDER);

    // Utiliser as any pour éviter les erreurs TypeScript lors de l'accès aux propriétés
    const opts = this.options as any;

    // Récupérer les options du générateur
    const defaultProvider = Array.isArray(opts.provider) ? opts.provider : ['stripe'];

    const prompts: any = [
      {
        type: 'checkbox',
        name: 'provider',
        message: 'Quels providers de paiement souhaitez-vous intégrer?',
        choices: [
          { name: 'Stripe', value: 'stripe', checked: defaultProvider.includes('stripe') },
          { name: 'PayPal', value: 'paypal', checked: defaultProvider.includes('paypal') },
          { name: 'Braintree', value: 'braintree', checked: defaultProvider.includes('braintree') },
          { name: 'Adyen', value: 'adyen', checked: defaultProvider.includes('adyen') },
        ],
        validate: (input: string[]) => {
          if (!input || input.length === 0) {
            return 'Vous devez sélectionner au moins un provider de paiement.';
          }
          return true;
        }
      },
      {
        type: 'confirm',
        name: 'subscription',
        message: 'Voulez-vous intégrer le support des abonnements?',
        default: opts.subscription || false
      },
      {
        type: 'confirm',
        name: 'webhook',
        message: 'Voulez-vous configurer les webhooks pour les événements de paiement?',
        default: opts.webhook !== undefined ? opts.webhook : true
      },
      {
        type: 'confirm',
        name: 'invoicing',
        message: 'Voulez-vous ajouter un système de facturation?',
        default: opts.invoicing || false
      },
      {
        type: 'confirm',
        name: 'taxes',
        message: 'Voulez-vous configurer la gestion des taxes?',
        default: opts.taxes || false
      },
      {
        type: 'confirm',
        name: 'refunds',
        message: 'Voulez-vous implémenter la gestion des remboursements?',
        default: opts.refunds || false
      },
      {
        type: 'confirm',
        name: 'reporting',
        message: 'Voulez-vous générer des rapports financiers?',
        default: opts.reporting || false
      }
    ];

    // Si nous avons détecté un package, demander à l'utilisateur s'il souhaite l'utiliser
    const packagePrompt: any = [{
      type: "input",
      name: "customPackage",
      message: "Quel package souhaitez-vous utiliser pour le système de paiement?",
      default: this.packageName,
      validate: (input: string) => {
        if (!input || input.trim() === "") {
          return "Le package est obligatoire.";
        }
        return true;
      },
    }];

    // Demander à l'utilisateur les options désirées
    this.answers = await this.prompt(prompts);

    // Demander à l'utilisateur de confirmer ou de modifier le package
    const packageAnswer = await this.prompt(packagePrompt);
    this.packageName = packageAnswer.customPackage;

    // Stocker les options pour une utilisation ultérieure
    this.paymentOptions = {
      provider: this.answers.provider,
      subscription: this.answers.subscription,
      webhook: this.answers.webhook,
      invoicing: this.answers.invoicing,
      taxes: this.answers.taxes,
      refunds: this.answers.refunds,
      reporting: this.answers.reporting,
      skipInstall: (opts.skipInstall as boolean) || false
    };

    this.log(SUCCESS_COLOR('✅ Configuration du système de paiement terminée.'));
  }

  configuring() {
    this.log(SECTION_DIVIDER);
    this.log(STEP_PREFIX + chalk.green('Configuration des dépendances...'));
    this.log(SECTION_DIVIDER);

    // Ajouter les dépendances nécessaires au pom.xml, build.gradle ou build.gradle.kts
    if (fs.existsSync(this.destinationPath('pom.xml'))) {
      this._addMavenDependencies();
    } else if (fs.existsSync(this.destinationPath('build.gradle'))) {
      this._addGradleDependencies('build.gradle', false);
    } else if (fs.existsSync(this.destinationPath('build.gradle.kts'))) {
      this._addGradleDependencies('build.gradle.kts', true);
    } else {
      this.log(INFO_COLOR('⚠️ Aucun fichier pom.xml, build.gradle ou build.gradle.kts trouvé. Les dépendances devront être ajoutées manuellement.'));
    }
  }

  writing() {
    this.log(SECTION_DIVIDER);
    this.log(STEP_PREFIX + chalk.green('Génération des fichiers pour le système de paiement...'));
    this.log(SECTION_DIVIDER);

    const { provider, subscription, webhook, invoicing, taxes, refunds, reporting } = this.paymentOptions;

    // Créer la structure de dossiers
    this._createDirectories();

    // Générer les fichiers de base pour le système de paiement
    this._generatePaymentConfig();
    this._generateBasePaymentService();
    this._generatePaymentController();

    // Générer les fichiers spécifiques au provider
    if (provider.includes('stripe')) {
      this._generateStripeImplementation();
    }

    if (provider.includes('paypal')) {
      this._generatePayPalImplementation();
    }

    if (provider.includes('braintree')) {
      this._generateBraintreeImplementation();
    }

    if (provider.includes('adyen')) {
      this._generateAdyenImplementation();
    }

    // Générer les fonctionnalités supplémentaires si demandées
    if (subscription) {
      this._generateSubscriptionSupport();
    }

    if (webhook) {
      this._generateWebhookSupport();
    }

    if (invoicing) {
      this._generateInvoicingSystem();
    }

    if (taxes) {
      this._generateTaxManagement();
    }

    if (refunds) {
      this._generateRefundManagement();
    }

    if (reporting) {
      this._generateFinancialReporting();
    }

    // Générer les exemples d'utilisation et la documentation
    this._generateSampleUsageAndDocs();

    this.log(SUCCESS_COLOR('✅ Génération des fichiers terminée avec succès.'));
  }

  /**
   * Trouve le package de base du projet
   */
  findBasePackageName(): string {
    try {
      // Rechercher le package dans l'application principale
      const mainAppDir = "src/main/java";
      if (fs.existsSync(mainAppDir)) {
        // Parcourir récursivement pour trouver un fichier Java contenant "package"
        const findPackageInDir = (dir: string): string | null => {
          const files = fs.readdirSync(dir);

          for (const file of files) {
            const fullPath = path.join(dir, file);
            const stats = fs.statSync(fullPath);

            if (stats.isDirectory()) {
              const result = findPackageInDir(fullPath);
              if (result) return result;
            }
            else if (file.endsWith('.java')) {
              try {
                const content = fs.readFileSync(fullPath, 'utf8');
                const packageMatch = content.match(/package\s+([^;]+);/);
                if (packageMatch && packageMatch.length > 1) {
                  const pkg = packageMatch[1].trim();

                  // Chercher d'abord le package d'application principal
                  if (file.endsWith('Application.java')) {
                    return pkg.split('.').slice(0, -1).join('.');
                  }

                  // Si on trouve un package "payment", c'est probablement ce qu'on veut
                  if (pkg.includes('.payment')) {
                    return pkg;
                  }
                }
              } catch (e) {
                // Ignorer les erreurs de lecture de fichier
              }
            }
          }
          return null;
        };

        // Essayer d'abord de trouver le fichier Application.java
        const foundPackage = findPackageInDir(mainAppDir);
        if (foundPackage) {
          return foundPackage;
        }
      }
    } catch (error) {
      this.log(ERROR_COLOR(`❌ Erreur lors de la recherche du package de base: ${error}`));
    }

    // Utiliser le package par défaut défini en constante
    return DEFAULT_PACKAGE;
  }

  /**
   * Construire un sous-package pour un composant spécifique
   * Cette méthode utilise maintenant les packages standards existants dans le projet
   */
  _constructSubPackage(basePackage: string, componentType: string): string {
    if (!basePackage) {
      return `com.example.fullstack.${componentType}`;
    }

    // Mapper le type de composant vers les noms de dossiers standards
    const standardFolders: Record<string, string> = {
      'entities': 'entity',
      'entity': 'entity',
      'services': 'service',
      'service': 'service',
      'controllers': 'controller',
      'controller': 'controller',
      'dtos': 'dto',
      'dto': 'dto',
      'config': 'config',
      'repositories': 'repository',
      'repository': 'repository',
      'exceptions': 'exception',
      'exception': 'exception',
      'utils': 'util',
      'util': 'util'
    };

    // Si le type de composant est mappé à un dossier standard, utiliser ce dossier
    const standardFolder = standardFolders[componentType];
    if (standardFolder) {
      return `${basePackage.split('.payment')[0]}.${standardFolder}`;
    }

    // Pour les autres types (subscription, webhook, etc.), utiliser le package de base
    return `${basePackage.split('.payment')[0]}.${componentType}`;
  }

  /**
   * Création des répertoires nécessaires avec une organisation claire par type de composant
   */
  _createDirectories() {
    // On ne crée pas de sous-dossier payment, on utilise les dossiers standards existants
    const javaDir = path.join(process.cwd(), 'src/main/java');

    // Récupérer le package de base sans le .payment (qui pourrait exister)
    const basePackage = this.packageName.split('.payment')[0];
    const baseDir = path.join(javaDir, basePackage.replace(/\./g, '/'));

    // Liste des dossiers standards dans un projet Spring Boot
    const standardFolders = [
      'entity',
      'dto',
      'repository',
      'service',
      'controller',
      'config'
    ];

    // Vérifier que les dossiers standards existent
    for (const folder of standardFolders) {
      const folderPath = path.join(baseDir, folder);
      this._createDirectoryIfNotExists(folderPath);
    }

    // Aucun message de log ici car on ne crée pas de structure pour le payment spécifiquement
  }

  /**
   * Utilitaire pour créer un répertoire s'il n'existe pas
   */
  _createDirectoryIfNotExists(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Ajouter les dépendances Maven nécessaires
   */
  _addMavenDependencies() {
    // Charger le contenu du pom.xml
    const pomPath = this.destinationPath('pom.xml');
    if (!fs.existsSync(pomPath)) {
      return;
    }

    try {
      let pomContent = fs.readFileSync(pomPath, 'utf8');
      const dependenciesSection = this._getMavenDependenciesBasedOnOptions();

      // Vérifier si la section des dépendances existe déjà
      if (pomContent.includes('</dependencies>')) {
        // Insérer les dépendances juste avant la fermeture du tag </dependencies>
        pomContent = pomContent.replace('</dependencies>', `${dependenciesSection}\n</dependencies>`);
      } else {
        // Créer une nouvelle section de dépendances juste avant </project>
        pomContent = pomContent.replace('</project>', `<dependencies>\n${dependenciesSection}\n</dependencies>\n</project>`);
      }

      // Écrire le contenu modifié
      fs.writeFileSync(pomPath, pomContent);
      this.log(SUCCESS_COLOR('✅ Dépendances Maven ajoutées avec succès.'));
    } catch (error) {
      this.log(ERROR_COLOR(`❌ Erreur lors de l'ajout des dépendances Maven: ${error}`));
    }
  }

  /**
   * Ajouter les dépendances Gradle nécessaires
   */
  _addGradleDependencies(gradleFile: string, isKts: boolean) {
    // Charger le contenu du build.gradle ou build.gradle.kts
    const gradlePath = this.destinationPath(gradleFile);
    if (!fs.existsSync(gradlePath)) {
      return;
    }

    try {
      let gradleContent = fs.readFileSync(gradlePath, 'utf8');
      const dependenciesSection = this._getGradleDependenciesBasedOnOptions();

      // Vérifier si la section des dépendances existe déjà
      if (gradleContent.includes('dependencies {')) {
        // Insérer les dépendances juste après l'ouverture du bloc dependencies
        gradleContent = gradleContent.replace('dependencies {', `dependencies {\n${dependenciesSection}`);
      } else {
        // Ajouter une nouvelle section de dépendances à la fin du fichier
        gradleContent += `\ndependencies {\n${dependenciesSection}\n}`;
      }

      // Écrire le contenu modifié
      fs.writeFileSync(gradlePath, gradleContent);
      this.log(SUCCESS_COLOR('✅ Dépendances Gradle ajoutées avec succès.'));
    } catch (error) {
      this.log(ERROR_COLOR(`❌ Erreur lors de l'ajout des dépendances Gradle: ${error}`));
    }
  }

  /**
   * Obtenir les dépendances Maven en fonction des options sélectionnées
   */
  _getMavenDependenciesBasedOnOptions(): string {
    let dependencies = '';

    // Dépendances communes à tous les providers
    dependencies += `    <!-- Dépendances pour le système de paiement -->\n`;
    dependencies += `    <dependency>\n`;
    dependencies += `        <groupId>org.springframework.boot</groupId>\n`;
    dependencies += `        <artifactId>spring-boot-starter-web</artifactId>\n`;
    dependencies += `    </dependency>\n`;
    dependencies += `    <dependency>\n`;
    dependencies += `        <groupId>org.springframework.boot</groupId>\n`;
    dependencies += `        <artifactId>spring-boot-starter-validation</artifactId>\n`;
    dependencies += `    </dependency>\n`;

    // Dépendances spécifiques au provider
    if (this.paymentOptions.provider.includes('stripe')) {
      dependencies += `    <dependency>\n`;
      dependencies += `        <groupId>com.stripe</groupId>\n`;
      dependencies += `        <artifactId>stripe-java</artifactId>\n`;
      dependencies += `        <version>22.0.0</version>\n`;
      dependencies += `    </dependency>\n`;
    }

    if (this.paymentOptions.provider.includes('paypal')) {
      dependencies += `    <dependency>\n`;
      dependencies += `        <groupId>com.paypal.sdk</groupId>\n`;
      dependencies += `        <artifactId>rest-api-sdk</artifactId>\n`;
      dependencies += `        <version>1.14.0</version>\n`;
      dependencies += `    </dependency>\n`;
    }

    if (this.paymentOptions.provider.includes('braintree')) {
      dependencies += `    <dependency>\n`;
      dependencies += `        <groupId>com.braintreepayments.gateway</groupId>\n`;
      dependencies += `        <artifactId>braintree-java</artifactId>\n`;
      dependencies += `        <version>3.16.0</version>\n`;
      dependencies += `    </dependency>\n`;
    }

    if (this.paymentOptions.provider.includes('adyen')) {
      dependencies += `    <dependency>\n`;
      dependencies += `        <groupId>com.adyen</groupId>\n`;
      dependencies += `        <artifactId>adyen-java-api-library</artifactId>\n`;
      dependencies += `        <version>18.1.2</version>\n`;
      dependencies += `    </dependency>\n`;
    }

    return dependencies;
  }

  /**
   * Obtenir les dépendances Gradle en fonction des options sélectionnées
   */
  _getGradleDependenciesBasedOnOptions(): string {
    let dependencies = '';

    // Dépendances communes à tous les providers
    dependencies += `    // Dépendances pour le système de paiement\n`;
    dependencies += `    implementation 'org.springframework.boot:spring-boot-starter-web'\n`;
    dependencies += `    implementation 'org.springframework.boot:spring-boot-starter-validation'\n`;

    // Dépendances spécifiques au provider
    if (this.paymentOptions.provider.includes('stripe')) {
      dependencies += `    implementation 'com.stripe:stripe-java:22.0.0'\n`;
    }

    if (this.paymentOptions.provider.includes('paypal')) {
      dependencies += `    implementation 'com.paypal.sdk:rest-api-sdk:1.14.0'\n`;
    }

    if (this.paymentOptions.provider.includes('braintree')) {
      dependencies += `    implementation 'com.braintreepayments.gateway:braintree-java:3.16.0'\n`;
    }

    if (this.paymentOptions.provider.includes('adyen')) {
      dependencies += `    implementation 'com.adyen:adyen-java-api-library:18.1.2'\n`;
    }

    return dependencies;
  }

  /**
   * Générer la configuration du système de paiement
   */
  _generatePaymentConfig() {
    const packageName = this._constructSubPackage(this.packageName, 'config');
    const filePath = path.join(process.cwd(), 'src/main/java', packageName.replace(/\./g, '/'), 'PaymentConfig.java');

    if (!fs.existsSync(filePath)) {
      this.renderEjsTemplate('config/PaymentConfig.java.ejs', filePath, {
        packageName,
        providers: this.paymentOptions.provider
      });
      this.log(SUCCESS_COLOR(`✅ Fichier PaymentConfig.java généré avec succès.`));
    } else {
    //  this.log(INFO_COLOR(`⚠️ Le fichier PaymentConfig.java existe déjà et n'a pas été écrasé.`));
    }
  }

  /**
   * Générer le service de base pour le paiement
   */
  _generateBasePaymentService() {
    const packageName = this._constructSubPackage(this.packageName, 'services');

    // Interface du service
    const interfacePath = path.join(process.cwd(), 'src/main/java', packageName.replace(/\./g, '/'), 'PaymentService.java');

    if (!fs.existsSync(interfacePath)) {
      this.renderEjsTemplate('services/PaymentService.java.ejs', interfacePath, {
        packageName,
        subscription: this.paymentOptions.subscription,
        refunds: this.paymentOptions.refunds
      });
      this.log(SUCCESS_COLOR(`✅ Fichier PaymentService.java (interface) généré avec succès.`));
    } else {
    //  this.log(INFO_COLOR(`⚠️ Le fichier PaymentService.java existe déjà et n'a pas été écrasé.`));
    }
  }

  /**
   * Générer le contrôleur de paiement
   */
  _generatePaymentController() {
    const packageName = this._constructSubPackage(this.packageName, 'controllers');
    const serviceName = this._constructSubPackage(this.packageName, 'services');
    const filePath = path.join(process.cwd(), 'src/main/java', packageName.replace(/\./g, '/'), 'PaymentController.java');

    if (!fs.existsSync(filePath)) {
      this.renderEjsTemplate('controllers/PaymentController.java.ejs', filePath, {
        packageName,
        serviceName,
        subscription: this.paymentOptions.subscription,
        refunds: this.paymentOptions.refunds
      });
      this.log(SUCCESS_COLOR(`✅ Fichier PaymentController.java généré avec succès.`));
    } else {
     // this.log(INFO_COLOR(`⚠️ Le fichier PaymentController.java existe déjà et n'a pas été écrasé.`));
    }
  }

  /**
   * Générer l'implémentation pour Stripe
   */
  _generateStripeImplementation() {
    // Configuration Stripe dans le dossier config
    const configPackageName = this._constructSubPackage(this.packageName, 'config');
    const configFilePath = path.join(process.cwd(), 'src/main/java', configPackageName.replace(/\./g, '/'), 'StripeConfig.java');

    if (!fs.existsSync(configFilePath)) {
      this.renderEjsTemplate('config/StripeConfig.java.ejs', configFilePath, {
        packageName: configPackageName
      });
      this.log(SUCCESS_COLOR(`✅ Fichier StripeConfig.java généré avec succès.`));
    } else {
      //this.log(INFO_COLOR(`⚠️ Le fichier StripeConfig.java existe déjà et n'a pas été écrasé.`));
    }

    // Service Stripe dans le dossier services (correction)
    const servicesPackageName = this._constructSubPackage(this.packageName, 'services');
    const filePath = path.join(process.cwd(), 'src/main/java', servicesPackageName.replace(/\./g, '/'), 'StripePaymentService.java');

    if (!fs.existsSync(filePath)) {
      this.renderEjsTemplate('services/StripePaymentService.java.ejs', filePath, {
        packageName: servicesPackageName,
        entityPackageName: this._constructSubPackage(this.packageName, 'entities'),
        configPackageName,
        subscription: this.paymentOptions.subscription,
        refunds: this.paymentOptions.refunds,
        webhook: this.paymentOptions.webhook
      });
      this.log(SUCCESS_COLOR(`✅ Fichier StripePaymentService.java généré avec succès.`));
    } else {
      //this.log(INFO_COLOR(`⚠️ Le fichier StripePaymentService.java existe déjà et n'a pas été écrasé.`));
    }
  }

  /**
   * Générer l'implémentation pour PayPal
   */
  _generatePayPalImplementation() {
    // Configuration PayPal dans le dossier config
    const configPackageName = this._constructSubPackage(this.packageName, 'config');
    const configFilePath = path.join(process.cwd(), 'src/main/java', configPackageName.replace(/\./g, '/'), 'PayPalConfig.java');

    if (fs.existsSync(path.join(this.templatePath(), 'config/PayPalConfig.java.ejs')) && !fs.existsSync(configFilePath)) {
      this.renderEjsTemplate('config/PayPalConfig.java.ejs', configFilePath, {
        packageName: configPackageName
      });
      this.log(SUCCESS_COLOR(`✅ Fichier PayPalConfig.java généré avec succès.`));
    }

    // Service PayPal dans le dossier services (correction)
    const servicesPackageName = this._constructSubPackage(this.packageName, 'services');
    const filePath = path.join(process.cwd(), 'src/main/java', servicesPackageName.replace(/\./g, '/'), 'PayPalPaymentService.java');

    if (!fs.existsSync(filePath)) {
      this.renderEjsTemplate('services/PayPalPaymentService.java.ejs', filePath, {
        packageName: servicesPackageName,
        entityPackageName: this._constructSubPackage(this.packageName, 'entities'),
        configPackageName,
        subscription: this.paymentOptions.subscription,
        refunds: this.paymentOptions.refunds
      });
      this.log(SUCCESS_COLOR(`✅ Fichier PayPalPaymentService.java généré avec succès.`));
    } else {
     // this.log(INFO_COLOR(`⚠️ Le fichier PayPalPaymentService.java existe déjà et n'a pas été écrasé.`));
    }
  }

  /**
   * Générer l'implémentation pour Braintree
   */
  _generateBraintreeImplementation() {
    // Configuration Braintree dans le dossier config
    const configPackageName = this._constructSubPackage(this.packageName, 'config');
    const configFilePath = path.join(process.cwd(), 'src/main/java', configPackageName.replace(/\./g, '/'), 'BraintreeConfig.java');

    if (fs.existsSync(path.join(this.templatePath(), 'config/BraintreeConfig.java.ejs')) && !fs.existsSync(configFilePath)) {
      this.renderEjsTemplate('config/BraintreeConfig.java.ejs', configFilePath, {
        packageName: configPackageName
      });
      this.log(SUCCESS_COLOR(`✅ Fichier BraintreeConfig.java généré avec succès.`));
    }

    // Service Braintree dans le dossier services (correction)
    const servicesPackageName = this._constructSubPackage(this.packageName, 'services');
    const filePath = path.join(process.cwd(), 'src/main/java', servicesPackageName.replace(/\./g, '/'), 'BraintreePaymentService.java');

    if (!fs.existsSync(filePath)) {
      this.renderEjsTemplate('services/BraintreePaymentService.java.ejs', filePath, {
        packageName: servicesPackageName,
        entityPackageName: this._constructSubPackage(this.packageName, 'entities'),
        configPackageName,
        subscription: this.paymentOptions.subscription,
        refunds: this.paymentOptions.refunds
      });
      this.log(SUCCESS_COLOR(`✅ Fichier BraintreePaymentService.java généré avec succès.`));
    } else {
     // this.log(INFO_COLOR(`⚠️ Le fichier BraintreePaymentService.java existe déjà et n'a pas été écrasé.`));
    }
  }

  /**
   * Générer l'implémentation pour Adyen
   */
  _generateAdyenImplementation() {
    // Configuration Adyen
    const configPackageName = this._constructSubPackage(this.packageName, 'config');
    const configFilePath = path.join(process.cwd(), 'src/main/java', configPackageName.replace(/\./g, '/'), 'AdyenConfig.java');

    if (fs.existsSync(path.join(this.templatePath(), 'config/AdyenConfig.java.ejs')) && !fs.existsSync(configFilePath)) {
      this.renderEjsTemplate('config/AdyenConfig.java.ejs', configFilePath, {
        packageName: configPackageName
      });
      this.log(SUCCESS_COLOR(`✅ Fichier AdyenConfig.java généré avec succès.`));
    }

    // Service Adyen
    const packageName = this._constructSubPackage(this.packageName, 'service');
    const filePath = path.join(process.cwd(), 'src/main/java', packageName.replace(/\./g, '/'), 'AdyenPaymentService.java');

    if (!fs.existsSync(filePath)) {
      this.renderEjsTemplate('services/AdyenPaymentService.java.ejs', filePath, {
        packageName,
        entityPackageName: this._constructSubPackage(this.packageName, 'entity'),
        configPackageName,
        subscription: this.paymentOptions.subscription,
        refunds: this.paymentOptions.refunds
      });
      this.log(SUCCESS_COLOR(`✅ Fichier AdyenPaymentService.java généré avec succès.`));
    } else {
     // this.log(INFO_COLOR(`⚠️ Le fichier AdyenPaymentService.java existe déjà et n'a pas été écrasé.`));
    }
  }

  /**
   * Générer le support des abonnements
   */
  _generateSubscriptionSupport() {
    const controllerPackageName = this._constructSubPackage(this.packageName, 'controller');
    const servicePackageName = this._constructSubPackage(this.packageName, 'service');
    const entityPackageName = this._constructSubPackage(this.packageName, 'entity');
    const repositoryPackageName = this._constructSubPackage(this.packageName, 'repository');

    const controllerPath = path.join(process.cwd(), 'src/main/java', controllerPackageName.replace(/\./g, '/'), 'SubscriptionController.java');
    const servicePath = path.join(process.cwd(), 'src/main/java', servicePackageName.replace(/\./g, '/'), 'SubscriptionService.java');
    const entityPath = path.join(process.cwd(), 'src/main/java', entityPackageName.replace(/\./g, '/'), 'Subscription.java');
    const repositoryPath = path.join(process.cwd(), 'src/main/java', repositoryPackageName.replace(/\./g, '/'), 'SubscriptionRepository.java');

    // Générer le controller des abonnements
    if (!fs.existsSync(controllerPath)) {
      this.renderEjsTemplate('controllers/SubscriptionController.java.ejs', controllerPath, {
        packageName: controllerPackageName,
        serviceName: servicePackageName,
        entityPackageName
      });
      this.log(SUCCESS_COLOR(`✅ Fichier SubscriptionController.java généré avec succès.`));
    } else {
     // this.log(INFO_COLOR(`⚠️ Le fichier SubscriptionController.java existe déjà et n'a pas été écrasé.`));
    }

    // Générer le service des abonnements
    if (!fs.existsSync(servicePath)) {
      this.renderEjsTemplate('services/SubscriptionService.java.ejs', servicePath, {
        packageName: servicePackageName,
        entityPackageName,
        repositoryPackageName
      });
      this.log(SUCCESS_COLOR(`✅ Fichier SubscriptionService.java généré avec succès.`));
    } else {
    //  this.log(INFO_COLOR(`⚠️ Le fichier SubscriptionService.java existe déjà et n'a pas été écrasé.`));
    }

    // Générer l'entité des abonnements
    if (!fs.existsSync(entityPath)) {
      this.renderEjsTemplate('entities/Subscription.java.ejs', entityPath, {
        packageName: entityPackageName
      });
      this.log(SUCCESS_COLOR(`✅ Fichier Subscription.java généré avec succès.`));
    } else {
    //  this.log(INFO_COLOR(`⚠️ Le fichier Subscription.java existe déjà et n'a pas été écrasé.`));
    }

    // Générer le repository des abonnements
    if (!fs.existsSync(repositoryPath)) {
      this.renderEjsTemplate('repositories/SubscriptionRepository.java.ejs', repositoryPath, {
        packageName: repositoryPackageName,
        entityPackageName
      });
      this.log(SUCCESS_COLOR(`✅ Fichier SubscriptionRepository.java généré avec succès.`));
    } else {
     // this.log(INFO_COLOR(`⚠️ Le fichier SubscriptionRepository.java existe déjà et n'a pas été écrasé.`));
    }
  }

  /**
   * Générer le support des webhooks
   */
  _generateWebhookSupport() {
    const controllerPackageName = this._constructSubPackage(this.packageName, 'controller');
    const servicePackageName = this._constructSubPackage(this.packageName, 'service');

    const controllerPath = path.join(process.cwd(), 'src/main/java', controllerPackageName.replace(/\./g, '/'), 'WebhookController.java');
    const servicePath = path.join(process.cwd(), 'src/main/java', servicePackageName.replace(/\./g, '/'), 'WebhookService.java');

    // Générer le contrôleur pour les webhooks
    if (!fs.existsSync(controllerPath)) {
      this.renderEjsTemplate('controllers/WebhookController.java.ejs', controllerPath, {
        packageName: controllerPackageName,
        serviceName: servicePackageName,
        providers: this.paymentOptions.provider
      });
      this.log(SUCCESS_COLOR(`✅ Fichier WebhookController.java généré avec succès.`));
    } else {
     // this.log(INFO_COLOR(`⚠️ Le fichier WebhookController.java existe déjà et n'a pas été écrasé.`));
    }

    // Générer le service pour les webhooks
    if (!fs.existsSync(servicePath)) {
      this.renderEjsTemplate('services/WebhookService.java.ejs', servicePath, {
        packageName: servicePackageName,
        providers: this.paymentOptions.provider
      });
      this.log(SUCCESS_COLOR(`✅ Fichier WebhookService.java généré avec succès.`));
    } else {
     // this.log(INFO_COLOR(`⚠️ Le fichier WebhookService.java existe déjà et n'a pas été écrasé.`));
    }
  }

  /**
   * Générer le système de facturation
   */
  _generateInvoicingSystem() {
    const controllerPackageName = this._constructSubPackage(this.packageName, 'controller');
    const servicePackageName = this._constructSubPackage(this.packageName, 'service');
    const entityPackageName = this._constructSubPackage(this.packageName, 'entity');
    const repositoryPackageName = this._constructSubPackage(this.packageName, 'repository');

    const controllerPath = path.join(process.cwd(), 'src/main/java', controllerPackageName.replace(/\./g, '/'), 'InvoiceController.java');
    const servicePath = path.join(process.cwd(), 'src/main/java', servicePackageName.replace(/\./g, '/'), 'InvoiceService.java');
    const entityPath = path.join(process.cwd(), 'src/main/java', entityPackageName.replace(/\./g, '/'), 'Invoice.java');
    const repositoryPath = path.join(process.cwd(), 'src/main/java', repositoryPackageName.replace(/\./g, '/'), 'InvoiceRepository.java');

    // Générer le controller des factures
    if (!fs.existsSync(controllerPath)) {
      this.renderEjsTemplate('controllers/InvoiceController.java.ejs', controllerPath, {
        packageName: controllerPackageName,
        serviceName: servicePackageName,
        entityPackageName
      });
      this.log(SUCCESS_COLOR(`✅ Fichier InvoiceController.java généré avec succès.`));
    } else {
      //this.log(INFO_COLOR(`⚠️ Le fichier InvoiceController.java existe déjà et n'a pas été écrasé.`));
    }

    // Générer le service des factures
    if (!fs.existsSync(servicePath)) {
      this.renderEjsTemplate('services/InvoiceService.java.ejs', servicePath, {
        packageName: servicePackageName,
        entityPackageName,
        repositoryPackageName
      });
      this.log(SUCCESS_COLOR(`✅ Fichier InvoiceService.java généré avec succès.`));
    } else {
     // this.log(INFO_COLOR(`⚠️ Le fichier InvoiceService.java existe déjà et n'a pas été écrasé.`));
    }

    // Générer l'entité des factures
    if (!fs.existsSync(entityPath)) {
      this.renderEjsTemplate('entities/Invoice.java.ejs', entityPath, {
        packageName: entityPackageName
      });
      this.log(SUCCESS_COLOR(`✅ Fichier Invoice.java généré avec succès.`));
    } else {
    //  this.log(INFO_COLOR(`⚠️ Le fichier Invoice.java existe déjà et n'a pas été écrasé.`));
    }

    // Générer le repository des factures
    if (!fs.existsSync(repositoryPath)) {
      this.renderEjsTemplate('repositories/InvoiceRepository.java.ejs', repositoryPath, {
        packageName: repositoryPackageName,
        entityPackageName
      });
      this.log(SUCCESS_COLOR(`✅ Fichier InvoiceRepository.java généré avec succès.`));
    } else {
     // this.log(INFO_COLOR(`⚠️ Le fichier InvoiceRepository.java existe déjà et n'a pas été écrasé.`));
    }
  }

  /**
   * Générer la gestion des taxes
   */
  _generateTaxManagement() {
    const servicePackageName = this._constructSubPackage(this.packageName, 'service');
    const entityPackageName = this._constructSubPackage(this.packageName, 'entity');
    const repositoryPackageName = this._constructSubPackage(this.packageName, 'repository');
    const controllerPackageName = this._constructSubPackage(this.packageName, 'controller');
    const dtoPackageName = this._constructSubPackage(this.packageName, 'dto');

    const servicePath = path.join(process.cwd(), 'src/main/java', servicePackageName.replace(/\./g, '/'), 'TaxService.java');
    const entityPath = path.join(process.cwd(), 'src/main/java', entityPackageName.replace(/\./g, '/'), 'Tax.java');
    const repositoryPath = path.join(process.cwd(), 'src/main/java', repositoryPackageName.replace(/\./g, '/'), 'TaxRepository.java');
    const controllerPath = path.join(process.cwd(), 'src/main/java', controllerPackageName.replace(/\./g, '/'), 'TaxController.java');
    const dtoPath = path.join(process.cwd(), 'src/main/java', dtoPackageName.replace(/\./g, '/'), 'TaxDTO.java');

    // Générer le service des taxes
    if (!fs.existsSync(servicePath)) {
      this.renderEjsTemplate('services/TaxService.java.ejs', servicePath, {
        packageName: servicePackageName,
        entityPackageName,
        repositoryPackageName
      });
      this.log(SUCCESS_COLOR(`✅ Fichier TaxService.java généré avec succès.`));
    } else {
     // this.log(INFO_COLOR(`⚠️ Le fichier TaxService.java existe déjà et n'a pas été écrasé.`));
    }

    // Générer l'entité Tax
    if (!fs.existsSync(entityPath)) {
      this.renderEjsTemplate('entities/Tax.java.ejs', entityPath, {
        packageName: entityPackageName
      });
      this.log(SUCCESS_COLOR(`✅ Fichier Tax.java généré avec succès.`));
    } else {
     // this.log(INFO_COLOR(`⚠️ Le fichier Tax.java existe déjà et n'a pas été écrasé.`));
    }

    // Générer le repository des taxes
    if (!fs.existsSync(repositoryPath)) {
      this.renderEjsTemplate('repositories/TaxRepository.java.ejs', repositoryPath, {
        packageName: repositoryPackageName,
        entityPackageName
      });
      this.log(SUCCESS_COLOR(`✅ Fichier TaxRepository.java généré avec succès.`));
    } else {
     // this.log(INFO_COLOR(`⚠️ Le fichier TaxRepository.java existe déjà et n'a pas été écrasé.`));
    }

    // Générer le controller des taxes
    if (!fs.existsSync(controllerPath)) {
      this.renderEjsTemplate('controllers/TaxController.java.ejs', controllerPath, {
        packageName: controllerPackageName,
        serviceName: servicePackageName,
        entityPackageName
      });
      this.log(SUCCESS_COLOR(`✅ Fichier TaxController.java généré avec succès.`));
    } else {
      //this.log(INFO_COLOR(`⚠️ Le fichier TaxController.java existe déjà et n'a pas été écrasé.`));
    }

    // Générer le DTO des taxes
    if (!fs.existsSync(dtoPath)) {
      this.renderEjsTemplate('dtos/TaxDTO.java.ejs', dtoPath, {
        packageName: dtoPackageName
      });
      this.log(SUCCESS_COLOR(`✅ Fichier TaxDTO.java généré avec succès.`));
    } else {
     // this.log(INFO_COLOR(`⚠️ Le fichier TaxDTO.java existe déjà et n'a pas été écrasé.`));
    }
  }

  /**
   * Générer la gestion des remboursements
   */
  _generateRefundManagement() {
    const controllerPackageName = this._constructSubPackage(this.packageName, 'controller');
    const servicePackageName = this._constructSubPackage(this.packageName, 'service');
    const entityPackageName = this._constructSubPackage(this.packageName, 'entity');
    const repositoryPackageName = this._constructSubPackage(this.packageName, 'repository');

    const controllerPath = path.join(process.cwd(), 'src/main/java', controllerPackageName.replace(/\./g, '/'), 'RefundController.java');
    const servicePath = path.join(process.cwd(), 'src/main/java', servicePackageName.replace(/\./g, '/'), 'RefundService.java');
    const entityPath = path.join(process.cwd(), 'src/main/java', entityPackageName.replace(/\./g, '/'), 'Refund.java');
    const repositoryPath = path.join(process.cwd(), 'src/main/java', repositoryPackageName.replace(/\./g, '/'), 'RefundRepository.java');

    // Générer le controller des remboursements
    if (!fs.existsSync(controllerPath)) {
      this.renderEjsTemplate('controllers/RefundController.java.ejs', controllerPath, {
        packageName: controllerPackageName,
        serviceName: servicePackageName,
        entityPackageName
      });
      this.log(SUCCESS_COLOR(`✅ Fichier RefundController.java généré avec succès.`));
    } else {
      //this.log(INFO_COLOR(`⚠️ Le fichier RefundController.java existe déjà et n'a pas été écrasé.`));
    }

    // Générer le service des remboursements
    if (!fs.existsSync(servicePath)) {
      this.renderEjsTemplate('services/RefundService.java.ejs', servicePath, {
        packageName: servicePackageName,
        entityPackageName,
        repositoryPackageName
      });
      this.log(SUCCESS_COLOR(`✅ Fichier RefundService.java généré avec succès.`));
    } else {
     // this.log(INFO_COLOR(`⚠️ Le fichier RefundService.java existe déjà et n'a pas été écrasé.`));
    }

    // Générer l'entité Refund
    if (!fs.existsSync(entityPath)) {
      this.renderEjsTemplate('entities/Refund.java.ejs', entityPath, {
        packageName: entityPackageName
      });
      this.log(SUCCESS_COLOR(`✅ Fichier Refund.java généré avec succès.`));
    } else {
      //this.log(INFO_COLOR(`⚠️ Le fichier Refund.java existe déjà et n'a pas été écrasé.`));
    }

    // Générer le repository des remboursements
    if (!fs.existsSync(repositoryPath)) {
      this.renderEjsTemplate('repositories/RefundRepository.java.ejs', repositoryPath, {
        packageName: repositoryPackageName,
        entityPackageName
      });
      this.log(SUCCESS_COLOR(`✅ Fichier RefundRepository.java généré avec succès.`));
    } else {
     // this.log(INFO_COLOR(`⚠️ Le fichier RefundRepository.java existe déjà et n'a pas été écrasé.`));
    }
  }

  /**
   * Générer le reporting financier
   */
  _generateFinancialReporting() {
    // Définir les packages pour chaque type de composant
    const servicePackageName = this._constructSubPackage(this.packageName, 'service');
    const controllerPackageName = this._constructSubPackage(this.packageName, 'controller');
    const dtoPackageName = this._constructSubPackage(this.packageName, 'dto');
    const entityPackageName = this._constructSubPackage(this.packageName, 'entity');
    const repositoryPackageName = this._constructSubPackage(this.packageName, 'repository');

    const javaMainDir = path.join(process.cwd(), 'src/main/java');

    // Générer l'entité pour les rapports
    const reportEntityPath = path.join(
      javaMainDir,
      entityPackageName.replace(/\./g, '/'),
      'Report.java'
    );

    if (!fs.existsSync(reportEntityPath)) {
      this.renderEjsTemplate('entities/Report.java.ejs', reportEntityPath, {
        packageName: entityPackageName
      });
      this.log(SUCCESS_COLOR(`✅ Fichier Report.java généré avec succès.`));
    } else {
   //   this.log(INFO_COLOR(`⚠️ Le fichier Report.java existe déjà et n'a pas été écrasé.`));
    }

    // Générer le repository pour les rapports
    const reportRepositoryPath = path.join(
      javaMainDir,
      repositoryPackageName.replace(/\./g, '/'),
      'ReportRepository.java'
    );

    if (!fs.existsSync(reportRepositoryPath)) {
      this.renderEjsTemplate('repositories/ReportRepository.java.ejs', reportRepositoryPath, {
        packageName: repositoryPackageName,
        entityPackageName
      });
      this.log(SUCCESS_COLOR(`✅ Fichier ReportRepository.java généré avec succès.`));
    } else {
     // this.log(INFO_COLOR(`⚠️ Le fichier ReportRepository.java existe déjà et n'a pas été écrasé.`));
    }

    // Générer les services de reporting
    const reportingServicePath = path.join(
      javaMainDir,
      servicePackageName.replace(/\./g, '/'),
      'ReportingService.java'
    );

    if (!fs.existsSync(reportingServicePath)) {
      this.renderEjsTemplate('services/ReportingService.java.ejs', reportingServicePath, {
        packageName: servicePackageName,
        entityPackageName,
        repositoryPackageName
      });
      this.log(SUCCESS_COLOR(`✅ Fichier ReportingService.java généré avec succès.`));
    } else {
      //this.log(INFO_COLOR(`⚠️ Le fichier ReportingService.java existe déjà et n'a pas été écrasé.`));
    }

    // Interface du service de reporting
    const reportServicePath = path.join(
      javaMainDir,
      servicePackageName.replace(/\./g, '/'),
      'ReportService.java'
    );

    if (!fs.existsSync(reportServicePath)) {
      this.renderEjsTemplate('services/ReportService.java.ejs', reportServicePath, {
        packageName: servicePackageName,
        entityPackageName
      });
      this.log(SUCCESS_COLOR(`✅ Fichier ReportService.java généré avec succès.`));
    } else {
      //this.log(INFO_COLOR(`⚠️ Le fichier ReportService.java existe déjà et n'a pas été écrasé.`));
    }

    // Implémentation du service de reporting
    const reportServiceImplPath = path.join(
      javaMainDir,
      servicePackageName.replace(/\./g, '/'),
      'ReportServiceImpl.java'
    );

    if (!fs.existsSync(reportServiceImplPath)) {
      this.renderEjsTemplate('services/ReportServiceImpl.java.ejs', reportServiceImplPath, {
        packageName: servicePackageName,
        entityPackageName,
        repositoryPackageName
      });
      this.log(SUCCESS_COLOR(`✅ Fichier ReportServiceImpl.java généré avec succès.`));
    } else {
     // this.log(INFO_COLOR(`⚠️ Le fichier ReportServiceImpl.java existe déjà et n'a pas été écrasé.`));
    }

    // Contrôleur pour les rapports
    const reportControllerPath = path.join(
      javaMainDir,
      controllerPackageName.replace(/\./g, '/'),
      'ReportController.java'
    );

    if (!fs.existsSync(reportControllerPath)) {
      this.renderEjsTemplate('controllers/ReportController.java.ejs', reportControllerPath, {
        packageName: controllerPackageName,
        serviceName: servicePackageName,
        entityPackageName
      });
      this.log(SUCCESS_COLOR(`✅ Fichier ReportController.java généré avec succès.`));
    } else {
     // this.log(INFO_COLOR(`⚠️ Le fichier ReportController.java existe déjà et n'a pas été écrasé.`));
    }

    // DTO pour les rapports
    const reportDtoPath = path.join(
      javaMainDir,
      dtoPackageName.replace(/\./g, '/'),
      'ReportDTO.java'
    );

    // S'assurer que le dossier existe
    const reportDtoDir = path.dirname(reportDtoPath);
    if (!fs.existsSync(reportDtoDir)) {
      fs.mkdirSync(reportDtoDir, { recursive: true });
    }

    if (!fs.existsSync(reportDtoPath)) {
      this.renderEjsTemplate('dtos/ReportDTO.java.ejs', reportDtoPath, {
        packageName: dtoPackageName
      });
      this.log(SUCCESS_COLOR(`✅ Fichier ReportDTO.java généré avec succès.`));
    } else {
     // this.log(INFO_COLOR(`⚠️ Le fichier ReportDTO.java existe déjà et n'a pas été écrasé.`));
    }
  }

  /**
   * Générer les exemples d'utilisation et la documentation
   */
  _generateSampleUsageAndDocs() {
    // Générer un README pour le système de paiement
    const readmePath = path.join(process.cwd(), 'payment-system-README.md');

    if (!fs.existsSync(readmePath)) {
      // Essayer de trouver le template dans plusieurs emplacements possibles
      let readmeTemplate;
      const possibleTemplatePaths = [
        path.join(this.templatePath(), 'payment-README.md.ejs'),
        path.join(this.templatePath(), '../docs/payment-README.md.ejs'),
        path.join(this.templatePath(), 'docs/payment-README.md.ejs')
      ];

      for (const templatePath of possibleTemplatePaths) {
        if (fs.existsSync(templatePath)) {
          const relativePath = path.relative(this.templatePath(), templatePath);
          readmeTemplate = relativePath.replace(/\\/g, '/'); // Normaliser les chemins pour Windows
          break;
        }
      }

      // Si aucun template n'est trouvé, utiliser un chemin par défaut
      if (!readmeTemplate) {
        readmeTemplate = 'payment-README.md.ejs';
        this.log(INFO_COLOR(`⚠️ Utilisation du template par défaut: ${readmeTemplate}`));
      } else {
        this.log(SUCCESS_COLOR(`✅ Template README trouvé: ${readmeTemplate}`));
      }

      this.renderEjsTemplate(readmeTemplate, readmePath, {
        packageName: this.packageName,
        providers: this.paymentOptions.provider,
        features: {
          subscription: this.paymentOptions.subscription,
          webhook: this.paymentOptions.webhook,
          invoicing: this.paymentOptions.invoicing,
          taxes: this.paymentOptions.taxes,
          refunds: this.paymentOptions.refunds,
          reporting: this.paymentOptions.reporting
        }
      });
      this.log(SUCCESS_COLOR(`✅ Documentation README générée avec succès dans ${readmePath}.`));
    } else {
    //  this.log(INFO_COLOR(`⚠️ Le fichier README existe déjà et n'a pas été écrasé.`));
    }
  }

  /**
   * Méthode appelée à la fin du processus de génération
   */
  end() {
    this.log(SECTION_DIVIDER);
    this.log(STEP_PREFIX + chalk.green('Système de paiement généré avec succès!'));
    this.log(SECTION_DIVIDER);

    this.log(INFO_COLOR(`📌 Providers de paiement configurés: ${this.paymentOptions.provider.join(', ')}`));

    // Afficher les fonctionnalités activées
    const enabledFeatures:any = [];
    if (this.paymentOptions.subscription) enabledFeatures.push('Abonnements');
    if (this.paymentOptions.webhook) enabledFeatures.push('Webhooks');
    if (this.paymentOptions.invoicing) enabledFeatures.push('Facturation');
    if (this.paymentOptions.taxes) enabledFeatures.push('Gestion des taxes');
    if (this.paymentOptions.refunds) enabledFeatures.push('Gestion des remboursements');
    if (this.paymentOptions.reporting) enabledFeatures.push('Reporting financier');

    if (enabledFeatures.length > 0) {
      this.log(INFO_COLOR(`📌 Fonctionnalités activées: ${enabledFeatures.join(', ')}`));
    }

    this.log(SUCCESS_COLOR(`✅ Le système de paiement a été généré dans le package: ${this.packageName}`));
    this.log(SUCCESS_COLOR(`✅ Consultez le fichier payment-system-README.md pour plus d'informations sur l'utilisation du système de paiement.`));
  }
}
