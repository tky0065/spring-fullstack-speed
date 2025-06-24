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

  async writing() {
    this.log(chalk.blue('Génération des fichiers CI/CD...'));

    const { ciTools, stages, dockerRegistry, sonarqube, environments, deploymentStrategy } = this.answers;

    // Créer le répertoire docs pour les guides CI/CD
    this._createDirectory('docs/cicd');

    // Copier les guides communs
    this.fs.copyTpl(
      this.templatePath('docs/cicd-best-practices.md'),
      this.destinationPath('docs/cicd/best-practices.md'),
      this.answers
    );

    this.fs.copyTpl(
      this.templatePath('docs/cicd-guide.md'),
      this.destinationPath('docs/cicd/guide.md'),
      this.answers
    );

    this.fs.copyTpl(
      this.templatePath('docs/cicd-troubleshooting.md'),
      this.destinationPath('docs/cicd/troubleshooting.md'),
      this.answers
    );

    // Générer les configurations pour chaque outil CI/CD sélectionné
    if (ciTools.includes('github')) {
      this._generateGithubActions();
    }

    if (ciTools.includes('gitlab')) {
      this._generateGitlabCI();
    }

    if (ciTools.includes('jenkins')) {
      this._generateJenkins();
    }

    this.log(chalk.green('✅ Fichiers CI/CD générés avec succès!'));
  }

  install() {
    this.log(chalk.blue('Configuration des hooks Git pour CI/CD...'));
    // Pas besoin d'installer des dépendances pour CI/CD, mais on peut configurer des hooks Git

    // Si ce n'est pas un repo Git, on suggère d'en initialiser un
    if (!this._isGitRepository()) {
      this.log(chalk.yellow('⚠️ Aucun dépôt Git détecté. Pour utiliser CI/CD, initialisez un repo Git:'));
      this.log('  git init');
      this.log('  git add .');
      this.log('  git commit -m "Initial commit"');
    }
  }

  end() {
    this.log(chalk.green('🚀 Configuration CI/CD terminée!'));

    const { ciTools } = this.answers;

    // Afficher des conseils basés sur les outils sélectionnés
    if (ciTools.includes('github')) {
      this.log(chalk.blue('\nPour activer GitHub Actions:'));
      this.log('1. Créez un dépôt sur GitHub');
      this.log('2. Poussez votre code avec: git push origin main');
      this.log('3. Allez dans l\'onglet "Actions" de votre dépôt GitHub');
    }

    if (ciTools.includes('gitlab')) {
      this.log(chalk.blue('\nPour activer GitLab CI:'));
      this.log('1. Créez un dépôt sur GitLab');
      this.log('2. Poussez votre code avec: git push origin main');
      this.log('3. Allez dans la section CI/CD de votre projet GitLab');
    }

    if (ciTools.includes('jenkins')) {
      this.log(chalk.blue('\nPour configurer Jenkins:'));
      this.log('1. Installez et configurez Jenkins');
      this.log('2. Créez un pipeline pointant vers votre dépôt et utilisez le Jenkinsfile généré');
      this.log('3. Plus de détails dans: docs/cicd/guide.md');
    }
  }

  // Méthodes privées d'aide à la génération

  _createDirectory(relativePath: string) {
    const dirPath = this.destinationPath(relativePath);
    if (!this.fs.existsSync(dirPath)) {
      this.fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  _isGitRepository() {
    return this.fs.existsSync(this.destinationPath('.git'));
  }

  _generateGithubActions() {
    const { stages, environments, deploymentStrategy, sonarqube } = this.answers;

    // Créer le répertoire .github/workflows
    this._createDirectory('.github/workflows');

    // CI principal (tests, build, analyse)
    this.fs.copyTpl(
      this.templatePath('github/ci-cd.yml'),
      this.destinationPath('.github/workflows/ci-cd.yml'),
      this.answers
    );

    // Pull request workflow
    this.fs.copyTpl(
      this.templatePath('github/pull-request.yml'),
      this.destinationPath('.github/workflows/pull-request.yml'),
      this.answers
    );

    // Déploiement si sélectionné
    if (stages.includes('deploy')) {
      this.fs.copyTpl(
        this.templatePath('github/deploy.yml'),
        this.destinationPath('.github/workflows/deploy.yml'),
        this.answers
      );
    }

    // Release si sélectionnée
    if (stages.includes('release')) {
      this.fs.copyTpl(
        this.templatePath('github/release.yml'),
        this.destinationPath('.github/workflows/release.yml'),
        this.answers
      );
    }

    // Documentation sur les secrets GitHub Actions
    this.fs.copyTpl(
      this.templatePath('github/secrets-example.md'),
      this.destinationPath('.github/secrets-example.md'),
      this.answers
    );
  }

  _generateGitlabCI() {
    const { stages, environments, deploymentStrategy } = this.answers;

    // CI principal
    this.fs.copyTpl(
      this.templatePath('gitlab/gitlab-ci.yml'),
      this.destinationPath('.gitlab-ci.yml'),
      this.answers
    );

    // Scripts de déploiement si nécessaires
    if (stages.includes('deploy')) {
      this._createDirectory('.gitlab/scripts');

      if (deploymentStrategy === 'blue-green') {
        this.fs.copyTpl(
          this.templatePath('gitlab/scripts/blue-green-deploy.sh'),
          this.destinationPath('.gitlab/scripts/blue-green-deploy.sh'),
          this.answers
        );
      }

      if (deploymentStrategy === 'canary') {
        this.fs.copyTpl(
          this.templatePath('gitlab/scripts/canary-deploy.sh'),
          this.destinationPath('.gitlab/scripts/canary-deploy.sh'),
          this.answers
        );
      }

      // Script de rollback commun
      this.fs.copyTpl(
        this.templatePath('gitlab/scripts/rollback.sh'),
        this.destinationPath('.gitlab/scripts/rollback.sh'),
        this.answers
      );

      // Exemple des variables GitLab CI
      this.fs.copyTpl(
        this.templatePath('gitlab/variables-example.md'),
        this.destinationPath('.gitlab/variables-example.md'),
        this.answers
      );
    }
  }

  _generateJenkins() {
    const { stages, environments, deploymentStrategy } = this.answers;

    // Jenkinsfile principal
    this.fs.copyTpl(
      this.templatePath('jenkins/Jenkinsfile'),
      this.destinationPath('Jenkinsfile'),
      this.answers
    );

    // Documentation pour configuration Jenkins
    this.fs.copyTpl(
      this.templatePath('jenkins/jenkins-setup.md'),
      this.destinationPath('docs/cicd/jenkins-setup.md'),
      this.answers
    );

    // Scripts de déploiement si nécessaires
    if (stages.includes('deploy')) {
      this._createDirectory('jenkins/scripts');

      if (deploymentStrategy === 'blue-green') {
        this.fs.copyTpl(
          this.templatePath('jenkins/scripts/blue-green-deploy.sh'),
          this.destinationPath('jenkins/scripts/blue-green-deploy.sh'),
          this.answers
        );
      }

      if (deploymentStrategy === 'canary') {
        this.fs.copyTpl(
          this.templatePath('jenkins/scripts/canary-deploy.sh'),
          this.destinationPath('jenkins/scripts/canary-deploy.sh'),
          this.answers
        );

        this.fs.copyTpl(
          this.templatePath('jenkins/scripts/promote-canary.sh'),
          this.destinationPath('jenkins/scripts/promote-canary.sh'),
          this.answers
        );
      }

      // Script de rollback commun
      this.fs.copyTpl(
        this.templatePath('jenkins/scripts/rollback.sh'),
        this.destinationPath('jenkins/scripts/rollback.sh'),
        this.answers
      );
    }
  }
}
