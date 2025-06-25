// Correction du générateur de paiement
import { BaseGenerator } from "./generators/base-generator.js";
import chalk from "chalk";
import * as fs from 'fs';
import path from 'path';

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

    try {
      // Tenter de charger la configuration existante depuis .yo-rc.json s'il existe
      const configPath = this.destinationPath('.yo-rc.json');
      if (fs.existsSync(configPath)) {
        try {
          const configFile = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (configFile['generator-spring-fullstack-speed']) {
            this.appConfig = configFile['generator-spring-fullstack-speed'];
            this.log(chalk.green('Configuration existante chargée.'));
          }
        } catch (error) {
          this.log(chalk.yellow('Impossible de charger la configuration existante. Utilisation des valeurs par défaut.'));
        }
      }

      // Vérifier que l'application existe déjà
      if (!fs.existsSync(this.destinationPath('pom.xml')) && !fs.existsSync(this.destinationPath('build.gradle'))) {
        this.log(chalk.red('Aucun projet Spring Boot détecté. Veuillez exécuter le générateur app en premier.'));
        // Au lieu de quitter, on définit un packageDir par défaut pour éviter les erreurs
        this.packageDir = 'com/example/app';
        return;
      }

      // Lire les configurations existantes depuis appConfig
      if (this.appConfig && this.appConfig.packageDir) {
        this.packageDir = this.appConfig.packageDir;
      } else {
        this.log(chalk.yellow('Package directory non trouvé dans la configuration. Utilisation de la valeur par défaut.'));
        this.packageDir = 'com/example/app';
      }

      this.log(chalk.green(`Configuration initialisée avec succès. Package directory: ${this.packageDir}`));
    } catch (error) {
      this.log(chalk.red(`Erreur lors de l'initialisation: ${error}`));
      // Définir des valeurs par défaut pour éviter les erreurs plus tard
      this.packageDir = 'com/example/app';
    }
  }
