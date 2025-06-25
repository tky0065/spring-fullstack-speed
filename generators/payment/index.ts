import { BaseGenerator } from "../base-generator.js";
import chalk from "chalk";
import * as fs from 'fs';

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
  declare paymentOptions: any;
  declare packageDir: string;
  declare appConfig: any;
  declare options: any;

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
    this.log(chalk.green('Initialisation du générateur de système de paiement...'));

    // Vérifier que l'application existe déjà
    if (!fs.existsSync(this.destinationPath('pom.xml')) && !fs.existsSync(this.destinationPath('build.gradle'))) {
      this.log(chalk.red('Aucun projet Spring Boot détecté. Veuillez exécuter le générateur app en premier.'));
      process.exit(1);
    }

    // Lire les configurations existantes depuis appConfig
    const packageDir = this.appConfig && this.appConfig.packageDir;
    if (packageDir) {
      this.packageDir = packageDir;
    } else {
      this.log(chalk.yellow('Package directory non trouvé dans la configuration. Utilisation de la valeur par défaut.'));
      this.packageDir = 'com/example/app';
    }
  }

  // Poser les questions à l'utilisateur
  async prompting() {
    this.log(chalk.green('Configuration du système de paiement...'));

    const answers = await this.prompt([
      {
        type: 'checkbox',
        name: 'provider',
        message: 'Quels providers de paiement voulez-vous intégrer?',
        choices: [
          { name: 'Stripe API', value: 'stripe', checked: true },
          { name: 'PayPal SDK', value: 'paypal' },
          { name: 'Braintree', value: 'braintree' },
          { name: 'Adyen', value: 'adyen' },
          { name: 'Mollie', value: 'mollie' }
        ],
        validate: (input) => input.length > 0 ? true : 'Vous devez sélectionner au moins un provider'
      },
      {
        type: 'confirm',
        name: 'subscription',
        message: 'Voulez-vous implémenter la gestion des abonnements?',
        default: this.options.subscription
      },
      {
        type: 'confirm',
        name: 'webhook',
        message: 'Voulez-vous configurer les webhooks pour les événements de paiement?',
        default: this.options.webhook
      },
      {
        type: 'confirm',
        name: 'invoicing',
        message: 'Voulez-vous ajouter le système de facturation?',
        default: this.options.invoicing
      },
      {
        type: 'confirm',
        name: 'taxes',
        message: 'Voulez-vous configurer la gestion des taxes?',
        default: this.options.taxes
      },
      {
        type: 'confirm',
        name: 'refunds',
        message: 'Voulez-vous implémenter la gestion des remboursements?',
        default: this.options.refunds
      },
      {
        type: 'confirm',
        name: 'reporting',
        message: 'Voulez-vous générer des rapports financiers?',
        default: this.options.reporting
      },
      {
        type: 'input',
        name: 'packageName',
        message: 'Quel nom de package voulez-vous utiliser pour le système de paiement?',
        default: `${this.appConfig && this.appConfig.packageName || 'com.example'}.payment`,
        validate: (input) => /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+[0-9a-z_]$/.test(input) ? true : 'Veuillez entrer un nom de package Java valide'
      }
    ]);

    // Stocker les réponses
    this.paymentOptions = {
      provider: answers.provider || this.options.provider,
      subscription: answers.subscription,
      webhook: answers.webhook,
      invoicing: answers.invoicing,
      taxes: answers.taxes,
      refunds: answers.refunds,
      reporting: answers.reporting,
      packageName: answers.packageName
    };

    // Calculer le chemin du package
    this.packageDir = this.paymentOptions.packageName.replace(/\./g, '/');
  }

  // Configurer le générateur
  configuring() {
    this.log(chalk.green('Configuration des dépendances de paiement...'));

    // Déterminer les dépendances à ajouter en fonction des providers sélectionnés
    const dependencies:any = [];

    if (this.paymentOptions.provider.includes('stripe')) {
      dependencies.push({
        groupId: 'com.stripe',
        artifactId: 'stripe-java',
        version: '24.5.0' // Mise à jour vers la dernière version
      });

      // Ajouter la dépendance Stripe Checkout pour une intégration plus simple
      dependencies.push({
        groupId: 'com.stripe',
        artifactId: 'stripe-checkout-java',
        version: '1.2.0'
      });
    }

    // Ajouter JTE pour les templates dynamiques
    dependencies.push({
      groupId: 'gg.jte',
      artifactId: 'jte',
      version: '3.1.0'
    });

    // Ajouter l'intégration Spring pour JTE
    dependencies.push({
      groupId: 'gg.jte',
      artifactId: 'jte-spring-boot-starter-3',
      version: '3.1.0'
    });

    if (this.paymentOptions.provider.includes('paypal')) {
      dependencies.push({
        groupId: 'com.paypal.sdk',
        artifactId: 'rest-api-sdk',
        version: '1.14.0'
      });
      dependencies.push({
        groupId: 'com.paypal.sdk',
        artifactId: 'checkout-sdk',
        version: '2.0.0'
      });
    }

    if (this.paymentOptions.provider.includes('braintree')) {
      dependencies.push({
        groupId: 'com.braintreepayments.gateway',
        artifactId: 'braintree-java',
        version: '3.18.0'
      });
    }

    if (this.paymentOptions.provider.includes('adyen')) {
      dependencies.push({
        groupId: 'com.adyen',
        artifactId: 'adyen-java-api-library',
        version: '18.1.0'
      });
    }

    if (this.paymentOptions.provider.includes('mollie')) {
      dependencies.push({
        groupId: 'com.mollie',
        artifactId: 'mollie-api-java',
        version: '3.9.0'
      });
    }

    // Ajouter la dépendance pour la gestion des factures PDF si nécessaire
    if (this.paymentOptions.invoicing) {
      dependencies.push({
        groupId: 'com.itextpdf',
        artifactId: 'itext7-core',
        version: '7.2.5'
      });
    }

    // Ajouter les dépendances au projet
    if (fs.existsSync(this.destinationPath('pom.xml'))) {
      this.addMavenDependencies(dependencies);
    } else if (fs.existsSync(this.destinationPath('build.gradle'))) {
      this.addGradleDependencies(dependencies);
    }
  }

  // Écrire les fichiers
  writing() {
    this.log(chalk.green('Génération des fichiers du système de paiement...'));

    // Créer le contexte pour les templates
    const context = {
      basePackage: this.appConfig && this.appConfig.packageName || 'com.example',
      packageName: this.paymentOptions.packageName,
      packageDir: this.packageDir,
      providers: this.paymentOptions.provider,
      subscription: this.paymentOptions.subscription,
      webhook: this.paymentOptions.webhook,
      invoicing: this.paymentOptions.invoicing,
      taxes: this.paymentOptions.taxes,
      refunds: this.paymentOptions.refunds,
      reporting: this.paymentOptions.reporting
    };

    // Générer les entités
    this._generateEntities(context);

    // Générer les repositories
    this._generateRepositories(context);

    // Générer les services
    this._generateServices(context);

    // Générer les controllers
    this._generateControllers(context);

    // Générer les DTOs
    this._generateDtos(context);

    // Générer les configurations
    this._generateConfigurations(context);

    // Générer les webhooks si nécessaire
    if (this.paymentOptions.webhook) {
      this._generateWebhooks(context);
    }

    // Générer le système d'abonnement si nécessaire
    if (this.paymentOptions.subscription) {
      this._generateSubscriptions(context);
    }

    // Générer le système de facturation si nécessaire
    if (this.paymentOptions.invoicing) {
      this._generateInvoicing(context);
    }

    // Générer la gestion des taxes si nécessaire
    if (this.paymentOptions.taxes) {
      this._generateTaxes(context);
    }

    // Générer la gestion des remboursements si nécessaire
    if (this.paymentOptions.refunds) {
      this._generateRefunds(context);
    }

    // Générer les rapports financiers si nécessaire
    if (this.paymentOptions.reporting) {
      this._generateReports(context);
    }

    // Générer les tests
    this._generateTests(context);

    // Mettre à jour les fichiers de configuration
    this._updateConfigurations(context);
  }

  // Installation des dépendances
  install() {
    if (!this.options.skipInstall) {
      this.log(chalk.green('Installation des dépendances...'));
      if (fs.existsSync(this.destinationPath('pom.xml'))) {
        this.spawnSync('mvn', ['install', '-DskipTests']);
      } else if (fs.existsSync(this.destinationPath('build.gradle'))) {
        this.spawnSync('./gradlew', ['build', '-x', 'test']);
      }
    }
  }

  // Finalisation
  end() {
    this.log(chalk.green('Le système de paiement a été généré avec succès!'));
    this.log(chalk.yellow('Pour finir la configuration, veuillez:'));
    this.log('1. Définir vos clés API dans src/main/resources/application.yml');

    if (this.paymentOptions.webhook) {
      this.log('2. Configurer les webhooks dans vos dashboards Stripe/PayPal');
    }

    this.log(chalk.yellow('\nDocumentation:'));

    if (this.paymentOptions.provider.includes('stripe')) {
      this.log('- Stripe API: https://stripe.com/docs/api');
    }

    if (this.paymentOptions.provider.includes('paypal')) {
      this.log('- PayPal SDK: https://developer.paypal.com/docs/api/overview/');
    }
  }

  // Méthode utilitaire pour vérifier si un template existe et le rendre
  private renderTemplateIfExists(templatePath: string, outputPath: string, context: any) {
    const fullTemplatePath = this.templatePath(templatePath);

    // Vérifier si le fichier template existe
    if (fs.existsSync(fullTemplatePath)) {
      this.renderTemplate(
        templatePath,
        outputPath,
        context
      );
    } else {
      this.log(chalk.yellow(`Template ${templatePath} n'a pas été trouvé. Génération ignorée.`));
    }
  }

  // Méthode privée pour générer les entités
  private _generateEntities(context: any) {
    this.log(chalk.blue('Génération des entités de paiement...'));

    // Générer l'entité Payment
    this.renderTemplate(
      this.templatePath('entities/Payment.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/domain/Payment.java`),
      context
    );

    // Générer l'entité PaymentMethod
    this.renderTemplate(
      this.templatePath('entities/PaymentMethod.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/domain/PaymentMethod.java`),
      context
    );

    // Générer l'entité Transaction
    this.renderTemplate(
      this.templatePath('entities/Transaction.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/domain/Transaction.java`),
      context
    );

    // Générer l'entité Customer
    this.renderTemplate(
      this.templatePath('entities/Customer.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/domain/Customer.java`),
      context
    );

    if (context.subscription) {
      // Générer l'entité Subscription
      this.renderTemplate(
        this.templatePath('entities/Subscription.java.ejs'),
        this.destinationPath(`src/main/java/${context.packageDir}/domain/Subscription.java`),
        context
      );

      // Générer l'entité Plan
      this.renderTemplate(
        this.templatePath('entities/Plan.java.ejs'),
        this.destinationPath(`src/main/java/${context.packageDir}/domain/Plan.java`),
        context
      );
    }

    if (context.invoicing) {
      // Générer l'entité Invoice
      this.renderTemplate(
        this.templatePath('entities/Invoice.java.ejs'),
        this.destinationPath(`src/main/java/${context.packageDir}/domain/Invoice.java`),
        context
      );

      // Générer l'entité InvoiceItem
      this.renderTemplate(
        this.templatePath('entities/InvoiceItem.java.ejs'),
        this.destinationPath(`src/main/java/${context.packageDir}/domain/InvoiceItem.java`),
        context
      );
    }
  }

  // Méthode privée pour générer les repositories
  private _generateRepositories(context: any) {
    this.log(chalk.blue('Génération des repositories de paiement...'));

    // Générer le repository Payment
    this.renderTemplate(
      this.templatePath('repositories/PaymentRepository.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/repository/PaymentRepository.java`),
      context
    );

    // Générer le repository PaymentMethod
    this.renderTemplate(
      this.templatePath('repositories/PaymentMethodRepository.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/repository/PaymentMethodRepository.java`),
      context
    );

    // Générer le repository Transaction
    this.renderTemplate(
      this.templatePath('repositories/TransactionRepository.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/repository/TransactionRepository.java`),
      context
    );

    // Générer le repository Customer
    this.renderTemplate(
      this.templatePath('repositories/CustomerRepository.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/repository/CustomerRepository.java`),
      context
    );

    if (context.subscription) {
      // Générer le repository Subscription
      this.renderTemplate(
        this.templatePath('repositories/SubscriptionRepository.java.ejs'),
        this.destinationPath(`src/main/java/${context.packageDir}/repository/SubscriptionRepository.java`),
        context
      );

      // Générer le repository Plan
      this.renderTemplate(
        this.templatePath('repositories/PlanRepository.java.ejs'),
        this.destinationPath(`src/main/java/${context.packageDir}/repository/PlanRepository.java`),
        context
      );
    }

    if (context.invoicing) {
      // Générer le repository Invoice
      this.renderTemplate(
        this.templatePath('repositories/InvoiceRepository.java.ejs'),
        this.destinationPath(`src/main/java/${context.packageDir}/repository/InvoiceRepository.java`),
        context
      );

      // Générer le repository InvoiceItem
      this.renderTemplate(
        this.templatePath('repositories/InvoiceItemRepository.java.ejs'),
        this.destinationPath(`src/main/java/${context.packageDir}/repository/InvoiceItemRepository.java`),
        context
      );
    }
  }

  // Méthode privée pour générer les services
  private _generateServices(context: any) {
    this.log(chalk.blue('Génération des services de paiement...'));

    // Générer les interfaces de service
    this.renderTemplate(
      this.templatePath('services/PaymentService.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/PaymentService.java`),
      context
    );

    // Générer les implémentations de services spécifiques à chaque provider
    for (const provider of context.providers) {
      this.renderTemplate(
        this.templatePath(`services/${this._capitalize(provider)}PaymentService.java.ejs`),
        this.destinationPath(`src/main/java/${context.packageDir}/service/impl/${this._capitalize(provider)}PaymentService.java`),
        context
      );
    }

    // Générer le service générique
    this.renderTemplate(
      this.templatePath('services/PaymentServiceImpl.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/impl/PaymentServiceImpl.java`),
      context
    );

    // Générer le service de gestion des méthodes de paiement
    this.renderTemplate(
      this.templatePath('services/PaymentMethodService.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/PaymentMethodService.java`),
      context
    );

    this.renderTemplate(
      this.templatePath('services/PaymentMethodServiceImpl.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/impl/PaymentMethodServiceImpl.java`),
      context
    );

    // Générer le service de gestion des clients
    this.renderTemplate(
      this.templatePath('services/CustomerService.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/CustomerService.java`),
      context
    );

    this.renderTemplate(
      this.templatePath('services/CustomerServiceImpl.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/impl/CustomerServiceImpl.java`),
      context
    );

    // Générer le service de transactions
    this.renderTemplate(
      this.templatePath('services/TransactionService.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/TransactionService.java`),
      context
    );

    this.renderTemplate(
      this.templatePath('services/TransactionServiceImpl.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/impl/TransactionServiceImpl.java`),
      context
    );

    if (context.subscription) {
      // Générer les services d'abonnement
      this.renderTemplate(
        this.templatePath('services/SubscriptionService.java.ejs'),
        this.destinationPath(`src/main/java/${context.packageDir}/service/SubscriptionService.java`),
        context
      );

      this.renderTemplate(
        this.templatePath('services/SubscriptionServiceImpl.java.ejs'),
        this.destinationPath(`src/main/java/${context.packageDir}/service/impl/SubscriptionServiceImpl.java`),
        context
      );

      // Générer les services de plan
      this.renderTemplate(
        this.templatePath('services/PlanService.java.ejs'),
        this.destinationPath(`src/main/java/${context.packageDir}/service/PlanService.java`),
        context
      );

      this.renderTemplate(
        this.templatePath('services/PlanServiceImpl.java.ejs'),
        this.destinationPath(`src/main/java/${context.packageDir}/service/impl/PlanServiceImpl.java`),
        context
      );
    }

    if (context.invoicing) {
      // Générer les services de facturation
      this.renderTemplate(
        this.templatePath('services/InvoiceService.java.ejs'),
        this.destinationPath(`src/main/java/${context.packageDir}/service/InvoiceService.java`),
        context
      );

      this.renderTemplate(
        this.templatePath('services/InvoiceServiceImpl.java.ejs'),
        this.destinationPath(`src/main/java/${context.packageDir}/service/impl/InvoiceServiceImpl.java`),
        context
      );

      // Service pour la génération de PDF
      this.renderTemplate(
        this.templatePath('services/PdfService.java.ejs'),
        this.destinationPath(`src/main/java/${context.packageDir}/service/PdfService.java`),
        context
      );

      this.renderTemplate(
        this.templatePath('services/PdfServiceImpl.java.ejs'),
        this.destinationPath(`src/main/java/${context.packageDir}/service/impl/PdfServiceImpl.java`),
        context
      );
    }
  }

  // Méthode privée pour générer les controllers
  private _generateControllers(context: any) {
    this.log(chalk.blue('Génération des controllers de paiement...'));

    // Générer le controller principal de paiement
    this.renderTemplate(
      this.templatePath('controllers/PaymentController.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/web/rest/PaymentController.java`),
      context
    );

    // Générer le controller pour les méthodes de paiement
    this.renderTemplate(
      this.templatePath('controllers/PaymentMethodController.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/web/rest/PaymentMethodController.java`),
      context
    );

    // Générer le controller pour les clients
    this.renderTemplate(
      this.templatePath('controllers/CustomerController.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/web/rest/CustomerController.java`),
      context
    );

    // Générer le controller pour les transactions
    this.renderTemplate(
      this.templatePath('controllers/TransactionController.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/web/rest/TransactionController.java`),
      context
    );

    if (context.subscription) {
      // Générer le controller pour les abonnements
      this.renderTemplate(
        this.templatePath('controllers/SubscriptionController.java.ejs'),
        this.destinationPath(`src/main/java/${context.packageDir}/web/rest/SubscriptionController.java`),
        context
      );

      // Générer le controller pour les plans
      this.renderTemplate(
        this.templatePath('controllers/PlanController.java.ejs'),
        this.destinationPath(`src/main/java/${context.packageDir}/web/rest/PlanController.java`),
        context
      );
    }

    if (context.invoicing) {
      // Générer le controller pour les factures
      this.renderTemplate(
        this.templatePath('controllers/InvoiceController.java.ejs'),
        this.destinationPath(`src/main/java/${context.packageDir}/web/rest/InvoiceController.java`),
        context
      );
    }

    if (context.webhook) {
      // Générer les controllers pour les webhooks
      this.renderTemplate(
        this.templatePath('controllers/WebhookController.java.ejs'),
        this.destinationPath(`src/main/java/${context.packageDir}/web/rest/WebhookController.java`),
        context
      );
    }
  }

  // Méthode privée pour générer les DTOs
  private _generateDtos(context: any) {
    this.log(chalk.blue('Génération des DTOs de paiement...'));

    // Créer le dossier des DTOs
    const dtoPath = this.destinationPath(`src/main/java/${context.packageDir}/service/dto`);
    fs.mkdirSync(dtoPath, { recursive: true });

    // Générer les DTOs de base
    this.renderTemplate(
      this.templatePath('dtos/PaymentDTO.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/dto/PaymentDTO.java`),
      context
    );

    this.renderTemplate(
      this.templatePath('dtos/PaymentMethodDTO.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/dto/PaymentMethodDTO.java`),
      context
    );

    this.renderTemplate(
      this.templatePath('dtos/CustomerDTO.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/dto/CustomerDTO.java`),
      context
    );

    this.renderTemplate(
      this.templatePath('dtos/TransactionDTO.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/dto/TransactionDTO.java`),
      context
    );

    // Générer les DTOs de requête
    this.renderTemplate(
      this.templatePath('dtos/PaymentRequestDTO.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/dto/PaymentRequestDTO.java`),
      context
    );

    // Générer les DTOs de réponse
    this.renderTemplate(
      this.templatePath('dtos/PaymentResponseDTO.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/dto/PaymentResponseDTO.java`),
      context
    );

    if (context.subscription) {
      // Générer les DTOs pour les abonnements
      this.renderTemplate(
        this.templatePath('dtos/SubscriptionDTO.java.ejs'),
        this.destinationPath(`src/main/java/${context.packageDir}/service/dto/SubscriptionDTO.java`),
        context
      );

      this.renderTemplate(
        this.templatePath('dtos/PlanDTO.java.ejs'),
        this.destinationPath(`src/main/java/${context.packageDir}/service/dto/PlanDTO.java`),
        context
      );
    }

    if (context.invoicing) {
      // Générer les DTOs pour la facturation
      this.renderTemplate(
        this.templatePath('dtos/InvoiceDTO.java.ejs'),
        this.destinationPath(`src/main/java/${context.packageDir}/service/dto/InvoiceDTO.java`),
        context
      );

      this.renderTemplate(
        this.templatePath('dtos/InvoiceItemDTO.java.ejs'),
        this.destinationPath(`src/main/java/${context.packageDir}/service/dto/InvoiceItemDTO.java`),
        context
      );
    }
  }

  // Méthode privée pour générer les configurations
  private _generateConfigurations(context: any) {
    this.log(chalk.blue('Génération des configurations de paiement...'));

    // Générer la configuration générale du système de paiement
    this.renderTemplate(
      this.templatePath('config/PaymentConfig.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/config/PaymentConfig.java`),
      context
    );

    // Générer les fichiers de configuration pour chaque provider
    for (const provider of context.providers) {
      this.renderTemplate(
        this.templatePath(`config/${this._capitalize(provider)}Config.java.ejs`),
        this.destinationPath(`src/main/java/${context.packageDir}/config/${this._capitalize(provider)}Config.java`),
        context
      );
    }

    // Générer la configuration de sécurité pour les paiements
    this.renderTemplate(
      this.templatePath('config/PaymentSecurityConfig.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/config/PaymentSecurityConfig.java`),
      context
    );
  }

  // Méthode privée pour générer les webhooks
  private _generateWebhooks(context: any) {
    this.log(chalk.blue('Génération des webhooks de paiement...'));

    // Générer le service de gestion des webhooks
    this.renderTemplate(
      this.templatePath('webhooks/WebhookService.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/WebhookService.java`),
      context
    );

    // Générer les implémentations de webhooks pour chaque provider
    for (const provider of context.providers) {
      this.renderTemplate(
        this.templatePath(`webhooks/${this._capitalize(provider)}WebhookService.java.ejs`),
        this.destinationPath(`src/main/java/${context.packageDir}/service/impl/${this._capitalize(provider)}WebhookService.java`),
        context
      );
    }

    // Générer les handlers d'événements
    this.renderTemplate(
      this.templatePath('webhooks/WebhookEventHandler.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/WebhookEventHandler.java`),
      context
    );

    this.renderTemplate(
      this.templatePath('webhooks/WebhookEventHandlerImpl.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/impl/WebhookEventHandlerImpl.java`),
      context
    );
  }

  // Méthode privée pour générer le système d'abonnement
  private _generateSubscriptions(context: any) {
    this.log(chalk.blue('Génération du système d\'abonnement...'));

    // Générer les utilitaires d'abonnement
    this.renderTemplate(
      this.templatePath('subscription/SubscriptionUtils.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/util/SubscriptionUtils.java`),
      context
    );

    // Générer les services de gestion du cycle de vie des abonnements
    this.renderTemplate(
      this.templatePath('subscription/SubscriptionLifecycleService.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/SubscriptionLifecycleService.java`),
      context
    );

    this.renderTemplate(
      this.templatePath('subscription/SubscriptionLifecycleServiceImpl.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/impl/SubscriptionLifecycleServiceImpl.java`),
      context
    );

    // Générer les tâches planifiées pour la gestion des abonnements
    this.renderTemplate(
      this.templatePath('subscription/SubscriptionScheduledTasks.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/scheduled/SubscriptionScheduledTasks.java`),
      context
    );
  }

  // Méthode privée pour générer le système de facturation
  private _generateInvoicing(context: any) {
    this.log(chalk.blue('Génération du système de facturation...'));

    // Créer les dossiers pour les templates JTE
    const jteTemplatesDir = this.destinationPath(`src/main/jte`);
    fs.mkdirSync(jteTemplatesDir, { recursive: true });

    const jteInvoicesDir = this.destinationPath(`src/main/jte/invoices`);
    fs.mkdirSync(jteInvoicesDir, { recursive: true });

    const jteLayoutsDir = this.destinationPath(`src/main/jte/layouts`);
    fs.mkdirSync(jteLayoutsDir, { recursive: true });

    // Générer les templates JTE de facture
    this.renderTemplate(
      this.templatePath('invoicing/invoice.jte.ejs'),
      this.destinationPath(`src/main/jte/invoices/invoice.jte`),
      context
    );

    // Générer un template JTE pour le layout commun
    this.renderTemplate(
      this.templatePath('invoicing/layout.jte.ejs'),
      this.destinationPath(`src/main/jte/layouts/invoice-layout.jte`),
      context
    );

    // Générér un template JTE pour les reçus
    this.renderTemplate(
      this.templatePath('invoicing/receipt.jte.ejs'),
      this.destinationPath(`src/main/jte/invoices/receipt.jte`),
      context
    );

    // Générer la configuration JTE
    this.renderTemplate(
      this.templatePath('invoicing/JteConfig.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/config/JteConfig.java`),
      context
    );

    // Générer les styles CSS pour les factures (toujours utile pour le rendu PDF)
    this.renderTemplate(
      this.templatePath('invoicing/invoice-styles.css.ejs'),
      this.destinationPath(`src/main/resources/static/css/invoice-styles.css`),
      context
    );

    // Générer le service de génération de factures avec JTE
    this.renderTemplate(
      this.templatePath('invoicing/InvoiceGenerationService.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/InvoiceGenerationService.java`),
      context
    );

    this.renderTemplate(
      this.templatePath('invoicing/InvoiceGenerationServiceImpl.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/impl/InvoiceGenerationServiceImpl.java`),
      context
    );

    // Générer les classes de modèle pour les templates JTE
    this.renderTemplate(
      this.templatePath('invoicing/InvoiceTemplateModel.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/model/InvoiceTemplateModel.java`),
      context
    );

    this.renderTemplate(
      this.templatePath('invoicing/ReceiptTemplateModel.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/model/ReceiptTemplateModel.java`),
      context
    );

    // Générer les utilitaires de facturation
    this.renderTemplate(
      this.templatePath('invoicing/InvoiceUtils.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/util/InvoiceUtils.java`),
      context
    );
  }

  // Méthode privée pour générer la gestion des taxes
  private _generateTaxes(context: any) {
    this.log(chalk.blue('Génération de la gestion des taxes...'));

    // Générer les entités de taxe
    this.renderTemplate(
      this.templatePath('taxes/Tax.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/domain/Tax.java`),
      context
    );

    this.renderTemplate(
      this.templatePath('taxes/TaxRate.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/domain/TaxRate.java`),
      context
    );

    // Générer les repositories de taxe
    this.renderTemplate(
      this.templatePath('taxes/TaxRepository.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/repository/TaxRepository.java`),
      context
    );

    this.renderTemplate(
      this.templatePath('taxes/TaxRateRepository.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/repository/TaxRateRepository.java`),
      context
    );

    // Générer les services de taxe
    this.renderTemplate(
      this.templatePath('taxes/TaxService.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/TaxService.java`),
      context
    );

    this.renderTemplate(
      this.templatePath('taxes/TaxServiceImpl.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/impl/TaxServiceImpl.java`),
      context
    );

    // Générer le controller de taxe
    this.renderTemplate(
      this.templatePath('taxes/TaxController.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/web/rest/TaxController.java`),
      context
    );

    // Générer les DTOs de taxe
    this.renderTemplate(
      this.templatePath('taxes/TaxDTO.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/dto/TaxDTO.java`),
      context
    );

    this.renderTemplate(
      this.templatePath('taxes/TaxRateDTO.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/dto/TaxRateDTO.java`),
      context
    );

    // Intégration avec API externe de taxe (par exemple TaxJar)
    if (context.providers.includes('stripe')) {
      this.renderTemplate(
        this.templatePath('taxes/StripeTaxService.java.ejs'),
        this.destinationPath(`src/main/java/${context.packageDir}/service/impl/StripeTaxService.java`),
        context
      );
    }
  }

  // Méthode privée pour générer la gestion des remboursements
  private _generateRefunds(context: any) {
    this.log(chalk.blue('Génération de la gestion des remboursements...'));

    // Générer l'entité Refund
    this.renderTemplate(
      this.templatePath('refunds/Refund.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/domain/Refund.java`),
      context
    );

    // Générer le repository Refund
    this.renderTemplate(
      this.templatePath('refunds/RefundRepository.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/repository/RefundRepository.java`),
      context
    );

    // Générer le service de remboursement
    this.renderTemplate(
      this.templatePath('refunds/RefundService.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/RefundService.java`),
      context
    );

    this.renderTemplate(
      this.templatePath('refunds/RefundServiceImpl.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/impl/RefundServiceImpl.java`),
      context
    );

    // Générer le controller de remboursement
    this.renderTemplate(
      this.templatePath('refunds/RefundController.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/web/rest/RefundController.java`),
      context
    );

    // Générer le DTO de remboursement
    this.renderTemplate(
      this.templatePath('refunds/RefundDTO.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/dto/RefundDTO.java`),
      context
    );

    // Implémentations spécifiques pour chaque provider
    for (const provider of context.providers) {
      this.renderTemplate(
        this.templatePath(`refunds/${this._capitalize(provider)}RefundService.java.ejs`),
        this.destinationPath(`src/main/java/${context.packageDir}/service/impl/${this._capitalize(provider)}RefundService.java`),
        context
      );
    }
  }

  // Méthode privée pour générer les rapports financiers
  private _generateReports(context: any) {
    this.log(chalk.blue('Génération des rapports financiers...'));

    // Générer le service de rapport
    this.renderTemplate(
      this.templatePath('reports/ReportService.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/ReportService.java`),
      context
    );

    this.renderTemplate(
      this.templatePath('reports/ReportServiceImpl.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/impl/ReportServiceImpl.java`),
      context
    );

    // Générer les types de rapports
    this.renderTemplate(
      this.templatePath('reports/RevenueReport.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/report/RevenueReport.java`),
      context
    );

    this.renderTemplate(
      this.templatePath('reports/TransactionReport.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/report/TransactionReport.java`),
      context
    );

    this.renderTemplate(
      this.templatePath('reports/CustomerReport.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/report/CustomerReport.java`),
      context
    );

    // Générer le controller de rapport
    this.renderTemplate(
      this.templatePath('reports/ReportController.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/web/rest/ReportController.java`),
      context
    );

    // Générer les DTOs de rapport
    this.renderTemplate(
      this.templatePath('reports/ReportDTO.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/dto/ReportDTO.java`),
      context
    );

    // Gén��rer le générateur de rapports Excel
    this.renderTemplate(
      this.templatePath('reports/ExcelReportGenerator.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/util/ExcelReportGenerator.java`),
      context
    );

    // Générer le générateur de rapports PDF
    this.renderTemplate(
      this.templatePath('reports/PdfReportGenerator.java.ejs'),
      this.destinationPath(`src/main/java/${context.packageDir}/service/util/PdfReportGenerator.java`),
      context
    );
  }

  // Méthode privée pour générer les tests
  private _generateTests(context: any) {
    this.log(chalk.blue('Génération des tests de paiement...'));

    // Générer les tests unitaires
    this.renderTemplate(
      this.templatePath('tests/PaymentServiceTest.java.ejs'),
      this.destinationPath(`src/test/java/${context.packageDir}/service/PaymentServiceTest.java`),
      context
    );

    // Générer les tests d'intégration
    this.renderTemplate(
      this.templatePath('tests/PaymentControllerIT.java.ejs'),
      this.destinationPath(`src/test/java/${context.packageDir}/web/rest/PaymentControllerIT.java`),
      context
    );

    // Générer les mocks pour les providers externes
    for (const provider of context.providers) {
      this.renderTemplate(
        this.templatePath(`tests/${this._capitalize(provider)}MockConfig.java.ejs`),
        this.destinationPath(`src/test/java/${context.packageDir}/config/${this._capitalize(provider)}MockConfig.java`),
        context
      );
    }
  }

  // Méthode privée pour mettre à jour les fichiers de configuration
  private _updateConfigurations(context: any) {
    this.log(chalk.blue('Mise à jour des fichiers de configuration...'));

    // Ajouter les propriétés de configuration dans application.yml
    const applicationYmlPath = this.destinationPath('src/main/resources/application.yml');
    let applicationYml = this.fs.exists(applicationYmlPath) ? this.fs.read(applicationYmlPath) : '';

    // Vérifier si la section de paiement existe déjà
    if (!applicationYml?.includes('payment:')) {
      // Construire la configuration pour chaque provider
      let paymentConfig = '\n# Configuration du système de paiement\npayment:\n';

      if (context.providers.includes('stripe')) {
        paymentConfig += '  stripe:\n';
        paymentConfig += '    api-key: ${STRIPE_API_KEY:your-stripe-api-key}\n';
        paymentConfig += '    webhook-secret: ${STRIPE_WEBHOOK_SECRET:your-stripe-webhook-secret}\n';
        paymentConfig += '    success-url: ${STRIPE_SUCCESS_URL:http://localhost:8080/payment/success}\n';
        paymentConfig += '    cancel-url: ${STRIPE_CANCEL_URL:http://localhost:8080/payment/cancel}\n';
      }

      if (context.providers.includes('paypal')) {
        paymentConfig += '  paypal:\n';
        paymentConfig += '    client-id: ${PAYPAL_CLIENT_ID:your-paypal-client-id}\n';
        paymentConfig += '    client-secret: ${PAYPAL_CLIENT_SECRET:your-paypal-client-secret}\n';
        paymentConfig += '    mode: ${PAYPAL_MODE:sandbox}\n';  // sandbox ou live
        paymentConfig += '    success-url: ${PAYPAL_SUCCESS_URL:http://localhost:8080/payment/success}\n';
        paymentConfig += '    cancel-url: ${PAYPAL_CANCEL_URL:http://localhost:8080/payment/cancel}\n';
      }

      // Ajouter la configuration commune
      paymentConfig += '  default-provider: ${DEFAULT_PAYMENT_PROVIDER:' + context.providers[0] + '}\n';
      paymentConfig += '  currency: ${DEFAULT_CURRENCY:EUR}\n';

      // Ajouter au fichier
      applicationYml += paymentConfig;
      this.fs.write(applicationYmlPath, applicationYml? applicationYml : '');
    }
  }

  // Méthode d'aide pour ajouter des dépendances Maven
  private addMavenDependencies(dependencies: any[]) {
    const pomPath = this.destinationPath('pom.xml');

    if (!this.fs.exists(pomPath)) {
      this.log(chalk.red('pom.xml not found!'));
      return;
    }

    let pomXml = this.fs.read(pomPath);

    // Rechercher la section des dépendances
    const dependenciesStart = pomXml?.indexOf('<dependencies>');
    const dependenciesEnd = pomXml?.indexOf('</dependencies>', dependenciesStart);

    if (dependenciesStart === -1 || dependenciesEnd === -1) {
      this.log(chalk.red('Could not find dependencies section in pom.xml'));
      return;
    }

    // Construire les nouvelles dépendances
    let newDependencies = '';
    for (const dep of dependencies) {
      // Vérifier si la dépendance existe déjà
      if (pomXml?.includes(`<artifactId>${dep.artifactId}</artifactId>`)) {
        continue;
      }

      newDependencies += `\n    <dependency>\n`;
      newDependencies += `        <groupId>${dep.groupId}</groupId>\n`;
      newDependencies += `        <artifactId>${dep.artifactId}</artifactId>\n`;
      if (dep.version) {
        newDependencies += `        <version>${dep.version}</version>\n`;
      }
      if (dep.scope) {
        newDependencies += `        <scope>${dep.scope}</scope>\n`;
      }
      newDependencies += `    </dependency>`;
    }

    // Insérer les nouvelles dépendances avant la fin de la section
    if (newDependencies) {
      if (dependenciesEnd != null) {
        pomXml = pomXml?.substring(0, dependenciesEnd) + newDependencies + pomXml?.substring(dependenciesEnd);
      }
      this.fs.write(pomPath, pomXml? pomXml : '');
    }
  }

  // Méthode d'aide pour ajouter des dépendances Gradle
  private addGradleDependencies(dependencies: any[]) {
    const gradlePath = this.destinationPath('build.gradle');

    if (!this.fs.exists(gradlePath)) {
      this.log(chalk.red('build.gradle not found!'));
      return;
    }

    let gradleFile = this.fs.read(gradlePath);

    // Rechercher la section des dépendances
    const dependenciesStart = gradleFile?.indexOf('dependencies {');
    const dependenciesEnd = gradleFile?.indexOf('}', dependenciesStart);

    if (dependenciesStart === -1 || dependenciesEnd === -1) {
      this.log(chalk.red('Could not find dependencies section in build.gradle'));
      return;
    }

    // Construire les nouvelles dépendances
    let newDependencies = '';
    for (const dep of dependencies) {
      // Vérifier si la dépendance existe déjà
      const depString = `${dep.groupId}:${dep.artifactId}`;
      if (gradleFile?.includes(depString)) {
        continue;
      }

      newDependencies += `\n    implementation '${dep.groupId}:${dep.artifactId}:${dep.version}'`;
    }

    // Insérer les nouvelles dépendances avant la fin de la section
    if (newDependencies) {
      if (dependenciesEnd != null) {
        gradleFile = gradleFile?.substring(0, dependenciesEnd) + newDependencies + gradleFile?.substring(dependenciesEnd);
      }
      this.fs.write(gradlePath, gradleFile? gradleFile : '');
    }
  }

  // Méthode d'aide pour mettre en majuscule la première lettre d'une chaîne
  private _capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
