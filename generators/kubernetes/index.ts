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
        type: 'confirm',
        name: 'createIngress',
        message: chalk.cyan('Voulez-vous créer une configuration Ingress ?'),
        default: true
      },
      {
        type: 'confirm',
        name: 'createConfigMap',
        message: chalk.cyan('Voulez-vous créer un ConfigMap pour les variables d\'environnement ?'),
        default: true
      },
      {
        type: 'confirm',
        name: 'createSecrets',
        message: chalk.cyan('Voulez-vous créer des Secrets Kubernetes ?'),
        default: true
      },
      {
        type: 'confirm',
        name: 'createPVC',
        message: chalk.cyan('Voulez-vous configurer le stockage persistant (PVC) ?'),
        default: database !== 'h2'
      },
      {
        type: 'confirm',
        name: 'enableAutoscaling',
        message: chalk.cyan('Voulez-vous activer l\'auto-scaling horizontal (HPA) ?'),
        default: false
      },
      {
        type: 'confirm',
        name: 'enableServiceMesh',
        message: chalk.cyan('Voulez-vous configurer un service mesh (Istio) ?'),
        default: false
      },
      {
        type: 'confirm',
        name: 'configureMonitoring',
        message: chalk.cyan('Voulez-vous configurer la surveillance Prometheus/Grafana ?'),
        default: false
      }
    ]);
  }

  configuring() {
    this.log(STEP_PREFIX + chalk.bold('ENREGISTREMENT DE LA CONFIGURATION...'));

    // Stocker la configuration pour une utilisation ultérieure
    this.config.set('kubernetesConfig', this.answers);

    this.displaySuccess('Configuration Kubernetes enregistrée');
  }

  writing() {
    const config = this.config.getAll();
    const appName = config.appName || 'spring-app';

      const appNameKebab = typeof appName === 'string' ? appName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'sfs-app';

    // Créer un dossier kubernetes dans le projet
    const kubernetesDir = path.join(this.destinationPath(), 'kubernetes');
    this.createDirectory(kubernetesDir);

    // Données de template communes
    const templateData = {
      appName,
      appNameKebab,
      containerPort: 8080,
      servicePort: 80,
      replicas: 2,
      database: config.database || 'mysql',
      frontendFramework: config.frontendFramework || 'react',
      namespace: 'default',
      dockerImage: `${appNameKebab}:latest`,
      ...this.answers
    };

    // Générer les manifests selon le type choisi
    if (this.answers.deploymentType === 'raw-manifests') {
      this._generateRawManifests(kubernetesDir, templateData);
    } else if (this.answers.deploymentType === 'helm') {
      this._generateHelmCharts(kubernetesDir, templateData);
    } else if (this.answers.deploymentType === 'kustomize') {
      this._generateKustomize(kubernetesDir, templateData);
    }

    // Générer README avec instructions
    this._generateDocumentation(kubernetesDir, templateData);
  }

  _generateRawManifests(kubernetesDir: string, templateData: any) {
    this.log("");
    this.log(STEP_PREFIX + chalk.bold("GÉNÉRATION DES MANIFESTS KUBERNETES"));

    // Créer les sous-dossiers pour organiser les manifests
    const baseDir = path.join(kubernetesDir, 'base');
    this.createDirectory(baseDir);

    // Générer namespace.yaml
    this.fs.copyTpl(
      this.templatePath('base/namespace.yaml'),
      path.join(baseDir, 'namespace.yaml'),
      templateData
    );

    // Générer deployment.yaml
    this.fs.copyTpl(
      this.templatePath('deployments/deployment.yaml'),
      path.join(baseDir, 'deployment.yaml'),
      templateData
    );

    // Générer service.yaml
    this.fs.copyTpl(
      this.templatePath('services/service.yaml'),
      path.join(baseDir, 'service.yaml'),
      templateData
    );

    // Générer ingress si demandé
    if (templateData.createIngress) {
      this.fs.copyTpl(
        this.templatePath('ingress/ingress.yaml'),
        path.join(baseDir, 'ingress.yaml'),
        templateData
      );
    }

    // Générer configmap si demandé
    if (templateData.createConfigMap) {
      this.fs.copyTpl(
        this.templatePath('config/configmap.yaml'),
        path.join(baseDir, 'configmap.yaml'),
        templateData
      );
    }

    // Générer secrets si demandé
    if (templateData.createSecrets) {
      this.fs.copyTpl(
        this.templatePath('config/secrets.yaml'),
        path.join(baseDir, 'secrets.yaml'),
        templateData
      );
    }

    // Générer PVC si demandé
    if (templateData.createPVC) {
      this.fs.copyTpl(
        this.templatePath('storage/pvc.yaml'),
        path.join(baseDir, 'pvc.yaml'),
        templateData
      );
    }

    // Générer HPA si demandé
    if (templateData.enableAutoscaling) {
      this.fs.copyTpl(
        this.templatePath('deployments/hpa.yaml'),
        path.join(baseDir, 'hpa.yaml'),
        templateData
      );
    }

    // Générer ServiceMesh (Istio) si demandé
    if (templateData.enableServiceMesh) {
      const istioDir = path.join(kubernetesDir, 'istio');
      this.createDirectory(istioDir);

      this.fs.copyTpl(
        this.templatePath('deployments/virtualservice.yaml'),
        path.join(istioDir, 'virtualservice.yaml'),
        templateData
      );

      this.fs.copyTpl(
        this.templatePath('deployments/destinationrule.yaml'),
        path.join(istioDir, 'destinationrule.yaml'),
        templateData
      );
    }

    // Générer la configuration de monitoring si demandé
    if (templateData.configureMonitoring) {
      const monitoringDir = path.join(kubernetesDir, 'monitoring');
      this.createDirectory(monitoringDir);

      this.fs.copyTpl(
        this.templatePath('monitoring/servicemonitor.yaml'),
        path.join(monitoringDir, 'servicemonitor.yaml'),
        templateData
      );
    }

    this.displaySuccess('Manifests Kubernetes générés avec succès');
  }

  _generateHelmCharts(kubernetesDir: string, templateData: any) {
    this.log("");
    this.log(STEP_PREFIX + chalk.bold("GÉNÉRATION DES CHARTS HELM"));

    // Créer la structure Helm charts
    const helmDir = path.join(kubernetesDir, 'helm');
    const chartDir = path.join(helmDir, templateData.appNameKebab);
    const templatesDir = path.join(chartDir, 'templates');

    this.createDirectory(helmDir);
    this.createDirectory(chartDir);
    this.createDirectory(templatesDir);

    // Générer Chart.yaml
    this.fs.copyTpl(
      this.templatePath('base/helm-chart.yaml'),
      path.join(chartDir, 'Chart.yaml'),
      templateData
    );

    // Générer values.yaml
    this.fs.copyTpl(
      this.templatePath('base/helm-values.yaml'),
      path.join(chartDir, 'values.yaml'),
      templateData
    );

    // Générer les templates Helm
    this.fs.copyTpl(
      this.templatePath('deployments/helm-deployment.yaml'),
      path.join(templatesDir, 'deployment.yaml'),
      templateData
    );

    this.fs.copyTpl(
      this.templatePath('services/helm-service.yaml'),
      path.join(templatesDir, 'service.yaml'),
      templateData
    );

    if (templateData.createIngress) {
      this.fs.copyTpl(
        this.templatePath('ingress/helm-ingress.yaml'),
        path.join(templatesDir, 'ingress.yaml'),
        templateData
      );
    }

    if (templateData.createConfigMap) {
      this.fs.copyTpl(
        this.templatePath('config/helm-configmap.yaml'),
        path.join(templatesDir, 'configmap.yaml'),
        templateData
      );
    }

    if (templateData.createSecrets) {
      this.fs.copyTpl(
        this.templatePath('config/helm-secrets.yaml'),
        path.join(templatesDir, 'secrets.yaml'),
        templateData
      );
    }

    if (templateData.createPVC) {
      this.fs.copyTpl(
        this.templatePath('storage/helm-pvc.yaml'),
        path.join(templatesDir, 'pvc.yaml'),
        templateData
      );
    }

    if (templateData.enableAutoscaling) {
      this.fs.copyTpl(
        this.templatePath('deployments/helm-hpa.yaml'),
        path.join(templatesDir, 'hpa.yaml'),
        templateData
      );
    }

    this.displaySuccess('Charts Helm générés avec succès');
  }

  _generateKustomize(kubernetesDir: string, templateData: any) {
    this.log("");
    this.log(STEP_PREFIX + chalk.bold("GÉNÉRATION DES CONFIGURATIONS KUSTOMIZE"));

    // Créer la structure Kustomize
    const kustomizeDir = path.join(kubernetesDir, 'kustomize');
    const baseDir = path.join(kustomizeDir, 'base');
    const overlaysDir = path.join(kustomizeDir, 'overlays');
    const devDir = path.join(overlaysDir, 'dev');
    const prodDir = path.join(overlaysDir, 'prod');

    this.createDirectory(kustomizeDir);
    this.createDirectory(baseDir);
    this.createDirectory(overlaysDir);
    this.createDirectory(devDir);
    this.createDirectory(prodDir);

    // Générer kustomization.yaml de base
    this.fs.copyTpl(
      this.templatePath('base/kustomization.yaml'),
      path.join(baseDir, 'kustomization.yaml'),
      templateData
    );

    // Générer les ressources de base
    this.fs.copyTpl(
      this.templatePath('deployments/deployment.yaml'),
      path.join(baseDir, 'deployment.yaml'),
      templateData
    );

    this.fs.copyTpl(
      this.templatePath('services/service.yaml'),
      path.join(baseDir, 'service.yaml'),
      templateData
    );

    // Générer kustomization.yaml pour dev
    this.fs.copyTpl(
      this.templatePath('base/kustomization-dev.yaml'),
      path.join(devDir, 'kustomization.yaml'),
      templateData
    );

    // Générer kustomization.yaml pour prod
    this.fs.copyTpl(
      this.templatePath('base/kustomization-prod.yaml'),
      path.join(prodDir, 'kustomization.yaml'),
      templateData
    );

    // Générer des patches pour les overlays
    this.fs.copyTpl(
      this.templatePath('deployments/deployment-patch.yaml'),
      path.join(devDir, 'deployment-patch.yaml'),
      {...templateData, replicas: 1} // Moins de replicas pour dev
    );

    this.fs.copyTpl(
      this.templatePath('deployments/deployment-patch.yaml'),
      path.join(prodDir, 'deployment-patch.yaml'),
      {...templateData, replicas: 3} // Plus de replicas pour prod
    );

    this.displaySuccess('Configurations Kustomize générées avec succès');
  }

  _generateDocumentation(kubernetesDir: string, templateData: any) {
    this.log("");
    this.log(STEP_PREFIX + chalk.bold("GÉNÉRATION DE LA DOCUMENTATION KUBERNETES"));

    // Générer le README.md
    this.fs.copyTpl(
      this.templatePath('base/README.md'),
      path.join(kubernetesDir, 'README.md'),
      templateData
    );

    this.displaySuccess('Documentation Kubernetes générée');
  }

  end() {
    this.log("");
    this.log(STEP_PREFIX + chalk.bold("CONFIGURATION KUBERNETES TERMINÉE"));
    this.log(SECTION_DIVIDER);
    this.displaySuccess('Configurations Kubernetes générées avec succès!');
    this.log(HELP_COLOR('Consultez le fichier README.md dans le dossier kubernetes pour les instructions de déploiement.'));

    const deployType = this.answers.deploymentType === 'helm' ? 'Helm' :
                       this.answers.deploymentType === 'kustomize' ? 'Kustomize' :
                       'kubectl apply';

    this.log(chalk.cyan(`\nCommande pour déployer votre application:`));

    if (this.answers.deploymentType === 'raw-manifests') {
      this.log(INFO_COLOR(`kubectl apply -f kubernetes/base/`));
    } else if (this.answers.deploymentType === 'helm') {
      const appName = this.config.get('appName');
      const appNameKebab = typeof appName === 'string' ? appName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'my-app';
      this.log(INFO_COLOR(`helm install ${appName || 'my-app'} kubernetes/helm/${appNameKebab}`));
    } else if (this.answers.deploymentType === 'kustomize') {
      this.log(INFO_COLOR(`kubectl apply -k kubernetes/kustomize/overlays/dev`));
    }
  }
}
