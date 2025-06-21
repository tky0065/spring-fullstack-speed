import { BaseGenerator } from '../base-generator.js';
import { SFSOptions } from '../types.js';
import chalk from 'chalk';
import path from 'path';

/**
 * Options spécifiques au générateur CI/CD
 */
export interface CicdGeneratorOptions extends SFSOptions {
  ciTools?: string[];
  stages?: string[];
  [key: string]: any;
}

/**
 * Générateur pour les pipelines CI/CD
 */
export default class CicdGenerator extends BaseGenerator {
  // Déclarer les méthodes et propriétés héritées
  declare answers: any;
  declare prompt: (questions: any) => Promise<any>;
  declare fs: any;
  declare destinationPath: (destPath?: string) => string;
  declare templatePath: (tempPath?: string) => string;

  constructor(args: string | string[], options: CicdGeneratorOptions) {
    super(args, options);

    this.desc('Générateur pour les pipelines CI/CD (GitHub Actions, GitLab CI, Jenkins)');
  }

  initializing() {
    this.log(chalk.blue('Initialisation du générateur de pipelines CI/CD...'));
  }

  async prompting() {
    const prompts = [
      {
        type: 'checkbox',
        name: 'ciTools',
        message: 'Quels outils CI/CD souhaitez-vous configurer?',
        choices: [
          { name: 'GitHub Actions', value: 'github', checked: true },
          { name: 'GitLab CI', value: 'gitlab' },
          { name: 'Jenkins', value: 'jenkins' }
        ],
        validate: (input: string[]) => {
          return input.length > 0 ? true : 'Vous devez sélectionner au moins un outil CI/CD';
        }
      },
      {
        type: 'checkbox',
        name: 'stages',
        message: 'Quelles étapes souhaitez-vous inclure dans vos pipelines CI/CD?',
        choices: [
          { name: 'Analyse de code statique (SonarQube/Lint)', value: 'static-analysis', checked: true },
          { name: 'Tests', value: 'tests', checked: true },
          { name: 'Build', value: 'build', checked: true },
          { name: 'Containerisation (Docker)', value: 'docker', checked: true },
          { name: 'Déploiement', value: 'deploy', checked: true },
          { name: 'Releases', value: 'release' },
          { name: 'Notifications', value: 'notify', checked: true },
        ]
      },
      {
        when: (answers: any) => answers.stages.includes('docker'),
        type: 'input',
        name: 'dockerRegistry',
        message: 'URL du registry Docker (laisser vide pour Docker Hub):',
        default: ''
      },
      {
        when: (answers: any) => answers.stages.includes('static-analysis'),
        type: 'confirm',
        name: 'sonarqube',
        message: 'Configurer SonarQube?',
        default: true
      },
      {
        when: (answers: any) => answers.stages.includes('deploy'),
        type: 'checkbox',
        name: 'environments',
        message: 'Quels environnements souhaitez-vous configurer?',
        choices: [
          { name: 'Development', value: 'dev', checked: true },
          { name: 'Staging', value: 'staging', checked: true },
          { name: 'Production', value: 'prod', checked: true }
        ]
      },
      {
        when: (answers: any) => answers.stages.includes('deploy'),
        type: 'list',
        name: 'deploymentStrategy',
        message: 'Quelle stratégie de déploiement souhaitez-vous utiliser?',
        choices: [
          { name: 'Simple (direct deploy)', value: 'simple' },
          { name: 'Blue/Green', value: 'blue-green' },
          { name: 'Canary', value: 'canary' }
        ],
        default: 'blue-green'
      },
      {
        type: 'confirm',
        name: 'caching',
        message: 'Activer le cache des dépendances pour accélérer les builds?',
        default: true
      },
      {
        when: (answers: any) => answers.stages.includes('notify'),
        type: 'checkbox',
        name: 'notifications',
        message: 'Quels canaux de notification souhaitez-vous configurer?',
        choices: [
          { name: 'Email', value: 'email', checked: true },
          { name: 'Slack', value: 'slack' },
          { name: 'Discord', value: 'discord' }
        ]
      },
      {
        type: 'checkbox',
        name: 'qualityGates',
        message: 'Quelles quality gates souhaitez-vous configurer?',
        choices: [
          { name: 'Couverture des tests (min 80%)', value: 'test-coverage', checked: true },
          { name: 'Analyse de vulnérabilité', value: 'vulnerability', checked: true },
          { name: 'Code smells', value: 'code-smells', checked: true },
          { name: 'Performance des tests', value: 'performance', checked: false }
        ]
      }
    ];

    this.answers = await this.prompt(prompts);
  }

  configuring() {
    this.log(chalk.blue('Configuration des pipelines CI/CD...'));

    // Stocker la configuration pour une utilisation ultérieure
    this.config.set('cicd', this.answers);
  }

  writing() {
    this.log(chalk.blue('Génération des fichiers de configuration CI/CD...'));

    // Créer les configurations CI/CD selon les choix de l'utilisateur
    if (this.answers.ciTools.includes('github')) {
      this._generateGitHubActions();
    }

    if (this.answers.ciTools.includes('gitlab')) {
      this._generateGitLabCI();
    }

    if (this.answers.ciTools.includes('jenkins')) {
      this._generateJenkins();
    }

    // Générer la documentation
    this._generateCicdDocs();
  }

  end() {
    this.log(chalk.green('Génération des pipelines CI/CD terminée!'));

    if (this.answers.ciTools.includes('github')) {
      this.log(chalk.yellow('Les workflows GitHub Actions ont été générés dans le dossier .github/workflows'));
      this.log(chalk.yellow('Pour les utiliser, committez et poussez ces fichiers vers votre dépôt GitHub.'));
    }

    if (this.answers.ciTools.includes('gitlab')) {
      this.log(chalk.yellow('Le fichier .gitlab-ci.yml a été généré à la racine du projet.'));
      this.log(chalk.yellow('Pour l\'utiliser, committez et poussez ce fichier vers votre dépôt GitLab.'));
    }

    if (this.answers.ciTools.includes('jenkins')) {
      this.log(chalk.yellow('Le Jenkinsfile a été généré à la racine du projet.'));
      this.log(chalk.yellow('Pour l\'utiliser, configurez un pipeline Jenkins pointant vers ce fichier.'));
    }

    this.log(chalk.yellow('Consultez la documentation dans le dossier docs/cicd pour plus d\'informations.'));
  }

  // Méthodes privées
  private _generateGitHubActions() {
    // Créer le répertoire .github/workflows s'il n'existe pas en ajoutant un fichier .gitkeep
    this.fs.write(
      this.destinationPath('.github/workflows/.gitkeep'),
      '# Ce fichier garantit que le répertoire sera inclus dans Git\n'
    );

    // Pipeline principal
    this.fs.copyTpl(
      this.templatePath('github/ci-cd.yml'),
      this.destinationPath('.github/workflows/ci-cd.yml'),
      {
        stages: this.answers.stages,
        dockerRegistry: this.answers.dockerRegistry,
        environments: this.answers.environments || [],
        deploymentStrategy: this.answers.deploymentStrategy,
        sonarqube: this.answers.sonarqube,
        caching: this.answers.caching,
        notifications: this.answers.notifications || [],
        qualityGates: this.answers.qualityGates || []
      }
    );

    // Pipeline de déploiement si sélectionné
    if (this.answers.stages.includes('deploy')) {
      this.fs.copyTpl(
        this.templatePath('github/deploy.yml'),
        this.destinationPath('.github/workflows/deploy.yml'),
        {
          environments: this.answers.environments || [],
          deploymentStrategy: this.answers.deploymentStrategy,
          dockerRegistry: this.answers.dockerRegistry
        }
      );
    }

    // Pipeline pour les Pull Requests
    this.fs.copyTpl(
      this.templatePath('github/pull-request.yml'),
      this.destinationPath('.github/workflows/pull-request.yml'),
      {
        stages: this.answers.stages,
        sonarqube: this.answers.sonarqube,
        caching: this.answers.caching,
        qualityGates: this.answers.qualityGates || []
      }
    );

    // Configuration des secrets GitHub en fonction des besoins
    if (this.answers.stages.includes('deploy') || this.answers.stages.includes('docker')) {
      this.fs.copyTpl(
        this.templatePath('github/secrets-example.md'),
        this.destinationPath('docs/cicd/github-secrets-example.md'),
        {
          dockerRegistry: this.answers.dockerRegistry,
          environments: this.answers.environments || [],
          sonarqube: this.answers.sonarqube,
          notifications: this.answers.notifications || []
        }
      );
    }

    // Script d'aide pour les releases GitHub si sélectionné
    if (this.answers.stages.includes('release')) {
      this.fs.copyTpl(
        this.templatePath('github/release.yml'),
        this.destinationPath('.github/workflows/release.yml'),
        {
          dockerRegistry: this.answers.dockerRegistry
        }
      );
    }
  }

  private _generateGitLabCI() {
    // Générer le fichier .gitlab-ci.yml principal
    this.fs.copyTpl(
      this.templatePath('gitlab/gitlab-ci.yml'),
      this.destinationPath('.gitlab-ci.yml'),
      {
        stages: this.answers.stages,
        dockerRegistry: this.answers.dockerRegistry,
        environments: this.answers.environments || [],
        deploymentStrategy: this.answers.deploymentStrategy,
        sonarqube: this.answers.sonarqube,
        caching: this.answers.caching,
        notifications: this.answers.notifications || [],
        qualityGates: this.answers.qualityGates || []
      }
    );

    // Scripts auxiliaires pour GitLab CI si nécessaire
    if (this.answers.deploymentStrategy === 'blue-green' || this.answers.deploymentStrategy === 'canary') {
      this.fs.mkdirp('ci/gitlab');

      // Script de déploiement Blue/Green
      if (this.answers.deploymentStrategy === 'blue-green') {
        this.fs.copyTpl(
          this.templatePath('gitlab/scripts/blue-green-deploy.sh'),
          this.destinationPath('ci/gitlab/blue-green-deploy.sh'),
          {}
        );
      }

      // Script de déploiement Canary
      if (this.answers.deploymentStrategy === 'canary') {
        this.fs.copyTpl(
          this.templatePath('gitlab/scripts/canary-deploy.sh'),
          this.destinationPath('ci/gitlab/canary-deploy.sh'),
          {}
        );
      }

      // Script de rollback
      this.fs.copyTpl(
        this.templatePath('gitlab/scripts/rollback.sh'),
        this.destinationPath('ci/gitlab/rollback.sh'),
        {}
      );

      // Rendre les scripts exécutables
      try {
        const fs = require('fs');
        const scriptsPath = this.destinationPath('ci/gitlab');
        fs.chmodSync(path.join(scriptsPath, 'rollback.sh'), '755');
        if (this.answers.deploymentStrategy === 'blue-green') {
          fs.chmodSync(path.join(scriptsPath, 'blue-green-deploy.sh'), '755');
        }
        if (this.answers.deploymentStrategy === 'canary') {
          fs.chmodSync(path.join(scriptsPath, 'canary-deploy.sh'), '755');
        }
      } catch (e) {
        this.log(chalk.yellow('Impossible de rendre les scripts exécutables. Vous devrez le faire manuellement.'));
      }
    }

    // Documentation des variables GitLab CI
    this.fs.copyTpl(
      this.templatePath('gitlab/variables-example.md'),
      this.destinationPath('docs/cicd/gitlab-variables-example.md'),
      {
        dockerRegistry: this.answers.dockerRegistry,
        environments: this.answers.environments || [],
        sonarqube: this.answers.sonarqube,
        notifications: this.answers.notifications || []
      }
    );
  }

  private _generateJenkins() {
    // Génération du Jenkinsfile principal
    this.fs.copyTpl(
      this.templatePath('jenkins/Jenkinsfile'),
      this.destinationPath('Jenkinsfile'),
      {
        stages: this.answers.stages,
        dockerRegistry: this.answers.dockerRegistry,
        environments: this.answers.environments || [],
        deploymentStrategy: this.answers.deploymentStrategy,
        sonarqube: this.answers.sonarqube,
        caching: this.answers.caching,
        notifications: this.answers.notifications || [],
        qualityGates: this.answers.qualityGates || []
      }
    );

    // Scripts auxiliaires pour Jenkins si nécessaire
    if (this.answers.deploymentStrategy === 'blue-green' || this.answers.deploymentStrategy === 'canary') {
      this.fs.mkdirp('ci/jenkins');

      // Script de déploiement Blue/Green
      if (this.answers.deploymentStrategy === 'blue-green') {
        this.fs.copyTpl(
          this.templatePath('jenkins/scripts/blue-green-deploy.sh'),
          this.destinationPath('ci/jenkins/blue-green-deploy.sh'),
          {}
        );
      }

      // Script de déploiement Canary
      if (this.answers.deploymentStrategy === 'canary') {
        this.fs.copyTpl(
          this.templatePath('jenkins/scripts/canary-deploy.sh'),
          this.destinationPath('ci/jenkins/canary-deploy.sh'),
          {}
        );
      }

      // Script de rollback
      this.fs.copyTpl(
        this.templatePath('jenkins/scripts/rollback.sh'),
        this.destinationPath('ci/jenkins/rollback.sh'),
        {}
      );

      // Rendre les scripts exécutables
      try {
        const fs = require('fs');
        const scriptsPath = this.destinationPath('ci/jenkins');
        fs.chmodSync(path.join(scriptsPath, 'rollback.sh'), '755');
        if (this.answers.deploymentStrategy === 'blue-green') {
          fs.chmodSync(path.join(scriptsPath, 'blue-green-deploy.sh'), '755');
        }
        if (this.answers.deploymentStrategy === 'canary') {
          fs.chmodSync(path.join(scriptsPath, 'canary-deploy.sh'), '755');
        }
      } catch (e) {
        this.log(chalk.yellow('Impossible de rendre les scripts exécutables. Vous devrez le faire manuellement.'));
      }
    }

    // Documentation pour la configuration Jenkins
    this.fs.copyTpl(
      this.templatePath('jenkins/jenkins-setup.md'),
      this.destinationPath('docs/cicd/jenkins-setup.md'),
      {
        dockerRegistry: this.answers.dockerRegistry,
        environments: this.answers.environments || [],
        sonarqube: this.answers.sonarqube,
        notifications: this.answers.notifications || []
      }
    );
  }

  private _generateCicdDocs() {
    // Créer le dossier docs/cicd s'il n'existe pas déjà
    this.fs.mkdirp('docs/cicd');

    // Guide principal CI/CD
    this.fs.copyTpl(
      this.templatePath('docs/cicd-guide.md'),
      this.destinationPath('docs/cicd/README.md'),
      {
        ciTools: this.answers.ciTools,
        stages: this.answers.stages,
        dockerRegistry: this.answers.dockerRegistry,
        environments: this.answers.environments || [],
        deploymentStrategy: this.answers.deploymentStrategy,
        sonarqube: this.answers.sonarqube,
        notifications: this.answers.notifications || [],
        qualityGates: this.answers.qualityGates || []
      }
    );

    // Guide des bonnes pratiques CI/CD
    this.fs.copyTpl(
      this.templatePath('docs/cicd-best-practices.md'),
      this.destinationPath('docs/cicd/best-practices.md'),
      {}
    );

    // Guide de dépannage CI/CD
    this.fs.copyTpl(
      this.templatePath('docs/cicd-troubleshooting.md'),
      this.destinationPath('docs/cicd/troubleshooting.md'),
      {
        ciTools: this.answers.ciTools
      }
    );
  }
}
