import { BaseGenerator } from '../base-generator.js';
import { SFSOptions } from '../types.js';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';

/**
 * Générateur pour les configurations Kubernetes
 * Permet de générer les manifests K8s, Helm charts et autres config nécessaires
 */

// Styles visuels constants
const STEP_PREFIX = chalk.bold.blue("➤ ");
const SECTION_DIVIDER = chalk.gray("────────────────────────────────────────────");
const INFO_COLOR = chalk.yellow;
const SUCCESS_COLOR = chalk.green;
const ERROR_COLOR = chalk.red;
const HELP_COLOR = chalk.gray.italic;

/**
 * Options spécifiques au générateur Kubernetes
 */
export interface KubernetesGeneratorOptions extends SFSOptions {
  useHelm?: boolean;
  useKustomize?: boolean;
  deploymentType?: string;
  createIngress?: boolean;
  createConfigMap?: boolean;
  createSecrets?: boolean;
  createPVC?: boolean;
  enableAutoscaling?: boolean;
  enableServiceMesh?: boolean;
  [key: string]: any;
}

export default class KubernetesGenerator extends BaseGenerator {
  declare answers: any;

  constructor(args: string | string[], opts: SFSOptions) {
    super(args, opts);
    this.description = 'Générateur de configurations Kubernetes pour Spring Boot';
  }

  initializing() {
    this.log(SECTION_DIVIDER);
    this.log(chalk.bold.blue('🚢 GÉNÉRATEUR KUBERNETES'));
    this.log(SECTION_DIVIDER);
    this.log(HELP_COLOR('Ce générateur va créer les configurations Kubernetes pour votre application Spring Boot.'));
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
   */
  createDirectory(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  async prompting() {
    // Récupération de la configuration existante
    const config = this.config.getAll();
    const appName = config.appName || 'spring-app';
    const database = config.database || 'mysql';

    this.log(SECTION_DIVIDER);
    this.log(STEP_PREFIX + chalk.bold("CONFIGURATION KUBERNETES"));
    this.log(SECTION_DIVIDER);

    this.answers = await this.prompt([
      {
        type: 'list',
        name: 'deploymentType',
        message: chalk.cyan('Type de déploiement Kubernetes ?'),
        choices: [
          { name: 'Manifests Kubernetes bruts', value: 'raw-manifests' },
          { name: 'Helm Charts', value: 'helm' },
          { name: 'Kustomize', value: 'kustomize' }
        ],
        default: 'raw-manifests'
      },
      {
        type: 'input',
        name: 'namespace',
        message: chalk.cyan('Nom du namespace Kubernetes ?'),
        default: (answers: any) => {
          return appName;
        }
      },
      {
        type: 'confirm',
        name: 'createIngress',
        message: chalk.cyan('Créer une configuration d\'Ingress ?'),
        default: true
      },
      {
        type: 'confirm',
        name: 'createConfigMap',
        message: chalk.cyan('Créer un ConfigMap pour les variables d\'environnement ?'),
        default: true
      },
      {
        type: 'confirm',
        name: 'createSecrets',
        message: chalk.cyan('Créer un Secret pour les informations sensibles ?'),
        default: true
      },
      {
        type: 'confirm',
        name: 'createPVC',
        message: chalk.cyan('Créer un PersistentVolumeClaim pour le stockage persistant ?'),
        default: database !== 'h2'
      },
      {
        type: 'confirm',
        name: 'enableAutoscaling',
        message: chalk.cyan('Activer l\'autoscaling horizontal (HPA) ?'),
        default: false
      },
      {
        type: 'confirm',
        name: 'enableServiceMesh',
        message: chalk.cyan('Ajouter configurations pour Service Mesh (Istio) ?'),
        default: false,
        when: (answers: any) => answers.deploymentType !== 'helm'
      },
      {
        type: 'input',
        name: 'replicas',
        message: chalk.cyan('Nombre initial de réplicas ?'),
        default: '2',
        validate: (input: string) => {
          const num = parseInt(input, 10);
          if (isNaN(num) || num < 1) {
            return 'Veuillez saisir un nombre valide supérieur à 0';
          }
          return true;
        }
      }
    ]);
  }

  configuring() {
    this.log(STEP_PREFIX + "Configuration des paramètres Kubernetes...");
    this.config.set('kubernetes', this.answers);
    this.config.save();
  }

  writing() {
    const { deploymentType } = this.answers;

    this.log(STEP_PREFIX + "Création des fichiers Kubernetes...");

    this.createDirectory('kubernetes');

    // Créer les dossiers de base selon l'organisation standard
    if (deploymentType === 'raw-manifests' || deploymentType === 'kustomize') {
      this.createDirectory('kubernetes/base');
      this.createDirectory('kubernetes/overlays');
      this.createDirectory('kubernetes/overlays/dev');
      this.createDirectory('kubernetes/overlays/prod');
    }

    // Créer les dossiers pour les ressources par type
    if (deploymentType === 'raw-manifests') {
      this.createDirectory('kubernetes/deployments');
      this.createDirectory('kubernetes/services');
      this.createDirectory('kubernetes/config');

      if (this.answers.createIngress) {
        this.createDirectory('kubernetes/ingress');
      }

      if (this.answers.createPVC) {
        this.createDirectory('kubernetes/storage');
      }

      if (this.answers.enableAutoscaling) {
        this.createDirectory('kubernetes/autoscaling');
      }

      if (this.answers.enableServiceMesh) {
        this.createDirectory('kubernetes/service-mesh');
      }
    }

    this._generateManifests();

    if (deploymentType === 'helm') {
      this._generateHelmCharts();
    } else if (deploymentType === 'kustomize') {
      this._generateKustomizeConfigs();
    }

    this._generateDocumentation();
  }

  _generateManifests() {
    const deploymentType = this.answers.deploymentType;
    const appName = this.config.get('appName') || 'spring-app';
    const appPort = this.config.get('serverPort') || 8080;
    const database = this.config.get('database') || 'h2';
    const namespace = this.answers.namespace || appName;
    const replicas = parseInt(this.answers.replicas, 10) || 2;

    const templateData = {
      appName,
      appPort,
      database,
      namespace,
      replicas,
      ...this.answers
    };

    // Namespace
    if (deploymentType === 'raw-manifests') {
      this.fs.copyTpl(
        this.templatePath('base/namespace.yaml'),
        this.destinationPath('kubernetes/base/namespace.yaml'),
        templateData
      );
    }

    // Deployment
    this.fs.copyTpl(
      this.templatePath('deployments/deployment.yaml'),
      this.destinationPath(`kubernetes/deployments/${appName}-deployment.yaml`),
      templateData
    );

    // Service
    this.fs.copyTpl(
      this.templatePath('services/service.yaml'),
      this.destinationPath(`kubernetes/services/${appName}-service.yaml`),
      templateData
    );

    // ConfigMap si demandé
    if (this.answers.createConfigMap) {
      this.fs.copyTpl(
        this.templatePath('config/configmap.yaml'),
        this.destinationPath(`kubernetes/config/${appName}-configmap.yaml`),
        templateData
      );
    }

    // Secrets si demandé
    if (this.answers.createSecrets) {
      this.fs.copyTpl(
        this.templatePath('config/secrets.yaml'),
        this.destinationPath(`kubernetes/config/${appName}-secrets.yaml`),
        templateData
      );
    }

    // Ingress si demandé
    if (this.answers.createIngress) {
      this.fs.copyTpl(
        this.templatePath('ingress/ingress.yaml'),
        this.destinationPath(`kubernetes/ingress/${appName}-ingress.yaml`),
        templateData
      );
    }

    // PVC si demandé
    if (this.answers.createPVC) {
      this.fs.copyTpl(
        this.templatePath('storage/pvc.yaml'),
        this.destinationPath(`kubernetes/storage/${appName}-pvc.yaml`),
        templateData
      );
    }

    // HPA si demandé
    if (this.answers.enableAutoscaling) {
      this.fs.copyTpl(
        this.templatePath('deployments/hpa.yaml'),
        this.destinationPath(`kubernetes/autoscaling/${appName}-hpa.yaml`),
        templateData
      );
    }

    // Service Mesh (Istio) si demandé
    if (this.answers.enableServiceMesh) {
      this.fs.copyTpl(
        this.templatePath('deployments/virtualservice.yaml'),
        this.destinationPath(`kubernetes/service-mesh/${appName}-virtualservice.yaml`),
        templateData
      );

      this.fs.copyTpl(
        this.templatePath('deployments/destinationrule.yaml'),
        this.destinationPath(`kubernetes/service-mesh/${appName}-destinationrule.yaml`),
        templateData
      );
    }

    // Fichiers kustomization.yaml pour les environnements
    if (deploymentType === 'kustomize') {
      this.fs.copyTpl(
        this.templatePath('base/kustomization.yaml'),
        this.destinationPath('kubernetes/base/kustomization.yaml'),
        templateData
      );

      this.fs.copyTpl(
        this.templatePath('base/kustomization-dev.yaml'),
        this.destinationPath('kubernetes/overlays/dev/kustomization.yaml'),
        templateData
      );

      this.fs.copyTpl(
        this.templatePath('base/kustomization-prod.yaml'),
        this.destinationPath('kubernetes/overlays/prod/kustomization.yaml'),
        templateData
      );

      // Ajout du patch pour l'environnement de production (plus de réplicas)
      this.fs.copyTpl(
        this.templatePath('deployments/deployment-patch.yaml'),
        this.destinationPath('kubernetes/overlays/prod/deployment-patch.yaml'),
        {
          ...templateData,
          replicas: Math.max(replicas * 2, 3) // Au moins 3 réplicas en prod, ou le double de dev
        }
      );
    }
  }

  _generateHelmCharts() {
    const appName = this.config.get('appName') || 'spring-app';
    const appPort = this.config.get('serverPort') || 8080;
    const namespace = this.answers.namespace || appName;

    const templateData = {
      appName,
      appPort,
      namespace,
      ...this.answers
    };

    // Créer la structure de dossier Helm
    this.createDirectory(`kubernetes/helm/${appName}`);
    this.createDirectory(`kubernetes/helm/${appName}/templates`);
    this.createDirectory(`kubernetes/helm/${appName}/charts`);

    // Chart.yaml
    this.fs.copyTpl(
      this.templatePath('base/helm-chart.yaml'),
      this.destinationPath(`kubernetes/helm/${appName}/Chart.yaml`),
      templateData
    );

    // values.yaml
    this.fs.copyTpl(
      this.templatePath('base/helm-values.yaml'),
      this.destinationPath(`kubernetes/helm/${appName}/values.yaml`),
      templateData
    );

    // Templates
    this.fs.copyTpl(
      this.templatePath('deployments/deployment.yaml'),
      this.destinationPath(`kubernetes/helm/${appName}/templates/deployment.yaml`),
      templateData
    );

    this.fs.copyTpl(
      this.templatePath('services/helm-service.yaml'),
      this.destinationPath(`kubernetes/helm/${appName}/templates/service.yaml`),
      templateData
    );

    if (this.answers.createConfigMap) {
      this.fs.copyTpl(
        this.templatePath('config/helm-configmap.yaml'),
        this.destinationPath(`kubernetes/helm/${appName}/templates/configmap.yaml`),
        templateData
      );
    }

    if (this.answers.createSecrets) {
      this.fs.copyTpl(
        this.templatePath('config/helm-secrets.yaml'),
        this.destinationPath(`kubernetes/helm/${appName}/templates/secrets.yaml`),
        templateData
      );
    }

    if (this.answers.createIngress) {
      this.fs.copyTpl(
        this.templatePath('ingress/helm-ingress.yaml'),
        this.destinationPath(`kubernetes/helm/${appName}/templates/ingress.yaml`),
        templateData
      );
    }

    if (this.answers.createPVC) {
      this.fs.copyTpl(
        this.templatePath('storage/helm-pvc.yaml'),
        this.destinationPath(`kubernetes/helm/${appName}/templates/pvc.yaml`),
        templateData
      );
    }

    // NOTES.txt avec instructions d'utilisation
    this.fs.write(
      this.destinationPath(`kubernetes/helm/${appName}/templates/NOTES.txt`),
      `Félicitations ! Votre application ${appName} a été déployée.

Accédez à votre application avec:

  kubectl port-forward -n ${namespace} svc/${appName} ${appPort}:${appPort}

Ou si vous avez un Ingress, utilisez l'URL: http://${appName}.example.com`
    );
  }

  _generateKustomizeConfigs() {
    // Déjà implémenté dans _generateManifests
  }

  _generateDocumentation() {
    const appName = this.config.get('appName') || 'spring-app';
    const namespace = this.answers.namespace || appName;
    const deploymentType = this.answers.deploymentType;

    // README avec instructions d'utilisation
    this.fs.copyTpl(
      this.templatePath('base/README.md'),
      this.destinationPath('kubernetes/README.md'),
      {
        appName,
        namespace,
        deploymentType,
        ...this.answers
      }
    );
  }

  end() {
    this.log(SECTION_DIVIDER);
    this.log(STEP_PREFIX + SUCCESS_COLOR("Configuration Kubernetes générée avec succès!"));
    this.log(INFO_COLOR("Consultez le fichier kubernetes/README.md pour les instructions de déploiement."));
    this.log(SECTION_DIVIDER);
  }
}
