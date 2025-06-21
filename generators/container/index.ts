import { BaseGenerator } from '../base-generator.js';
import { SFSOptions } from '../types.js';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';

/**
 * Options spécifiques au générateur de containerisation
 */
export interface ContainerGeneratorOptions extends SFSOptions {
  multiStage?: boolean;
  baseImage?: string;
  healthcheck?: boolean;
  [key: string]: any;
}

/**
 * Générateur pour la containerisation Docker
 */
export default class ContainerizationGenerator extends BaseGenerator {
  // Déclarer les méthodes et propriétés héritées
  declare answers: any;
  declare prompt: (questions: any) => Promise<any>;
  declare fs: any;
  declare destinationPath: (destPath?: string) => string;
  declare templatePath: (tempPath?: string) => string;

  constructor(args: string | string[], options: ContainerGeneratorOptions) {
    super(args, options);


    this.desc('Générateur pour la containerisation Docker des applications Spring Boot');
  }

  initializing() {
    this.log(chalk.blue('Initialisation du générateur de containerisation...'));
  }

  async prompting() {
    const prompts = [
      {
        type: 'confirm',
        name: 'multiStage',
        message: 'Voulez-vous utiliser un build multi-stage pour optimiser l\'image Docker?',
        default: true
      },
      {
        type: 'list',
        name: 'baseImage',
        message: 'Quelle image de base souhaitez-vous utiliser pour votre application?',
        choices: [
          { name: 'Eclipse Temurin (recommandé)', value: 'eclipse-temurin:17-jre-alpine' },
          { name: 'Amazon Corretto', value: 'amazoncorretto:17-alpine' },
          { name: 'OpenJDK', value: 'openjdk:17-slim' },
          { name: 'BellSoft Liberica', value: 'bellsoft/liberica-openjdk-alpine:17' }
        ],
        default: 'eclipse-temurin:17-jre-alpine'
      },
      {
        type: 'confirm',
        name: 'healthcheck',
        message: 'Voulez-vous ajouter des health checks à votre container?',
        default: true
      },
      {
        when: (answers: any) => answers.healthcheck,
        type: 'input',
        name: 'healthcheckPath',
        message: 'Chemin pour le health check:',
        default: '/actuator/health'
      },
      {
        type: 'input',
        name: 'containerPort',
        message: 'Port sur lequel l\'application s\'exécute:',
        default: '8080'
      },
      {
        type: 'confirm',
        name: 'dockerCompose',
        message: 'Voulez-vous générer un fichier docker-compose.yml?',
        default: true
      },
      {
        when: (answers: any) => answers.dockerCompose,
        type: 'checkbox',
        name: 'services',
        message: 'Quels services additionnels souhaitez-vous inclure dans docker-compose.yml?',
        choices: [
          { name: 'PostgreSQL', value: 'postgres' },
          { name: 'MySQL', value: 'mysql' },
          { name: 'MongoDB', value: 'mongodb' },
          { name: 'Redis', value: 'redis' },
          { name: 'Elasticsearch', value: 'elasticsearch' },
          { name: 'Kibana', value: 'kibana' },
          { name: 'RabbitMQ', value: 'rabbitmq' },
          { name: 'Kafka', value: 'kafka' },
          { name: 'Prometheus', value: 'prometheus' },
          { name: 'Grafana', value: 'grafana' }
        ]
      },
      {
        type: 'confirm',
        name: 'dockerScripts',
        message: 'Voulez-vous générer des scripts utilitaires pour Docker?',
        default: true
      },
      {
        type: 'confirm',
        name: 'dockerSecrets',
        message: 'Voulez-vous configurer des secrets Docker?',
        default: true
      }
    ];

    this.answers = await this.prompt(prompts);
  }

  configuring() {
    this.log(chalk.blue('Configuration de la containerisation...'));

    // Stocker la configuration pour une utilisation ultérieure
    this.config.set('docker', this.answers);
  }

  writing() {
    this.log(chalk.blue('Génération des fichiers Docker...'));

    // 1. Créer le Dockerfile
    this._generateDockerfile();

    // 2. Créer docker-compose.yml si demandé
    if (this.answers.dockerCompose) {
      this._generateDockerCompose();
    }

    // 3. Créer les scripts utilitaires si demandés
    if (this.answers.dockerScripts) {
      this._generateDockerScripts();
    }

    // 4. Configurer les secrets Docker si demandés
    if (this.answers.dockerSecrets) {
      this._generateDockerSecrets();
    }

    // 5. Ajouter un .dockerignore
    this._generateDockerIgnore();

    // 6. Générer la documentation Docker
    this._generateDockerDocs();
  }

  end() {
    this.log(chalk.green('Génération de la configuration Docker terminée!'));
    this.log(chalk.yellow('Vous pouvez maintenant construire votre image Docker avec:'));
    this.log(chalk.cyan('  docker build -t your-app:latest .'));

    if (this.answers.dockerCompose) {
      this.log(chalk.yellow('Pour démarrer tous les services avec docker-compose:'));
      this.log(chalk.cyan('  docker compose up -d'));
    }

    if (this.answers.dockerScripts) {
      this.log(chalk.yellow('Ou utilisez les scripts générés:'));
      this.log(chalk.cyan('  ./docker/build.sh'));
      this.log(chalk.cyan('  ./docker/run.sh'));
    }
  }

  // Méthodes privées
  private _generateDockerfile() {
    const buildTool = this._detectBuildTool();

    if (this.answers.multiStage) {
      // Dockerfile multi-stage pour une image optimisée
      this.fs.copyTpl(
        this.templatePath('Dockerfile.multistage.ejs'),
        this.destinationPath('Dockerfile'),
        {
          baseImage: this.answers.baseImage,
          healthcheck: this.answers.healthcheck,
          healthcheckPath: this.answers.healthcheckPath,
          containerPort: this.answers.containerPort,
          buildTool,
          applicationName: this._getApplicationName(),
          javaOpts: this._getDefaultJavaOpts()
        }
      );
    } else {
      // Dockerfile simple
      this.fs.copyTpl(
        this.templatePath('Dockerfile.simple.ejs'),
        this.destinationPath('Dockerfile'),
        {
          baseImage: this.answers.baseImage,
          healthcheck: this.answers.healthcheck,
          healthcheckPath: this.answers.healthcheckPath,
          containerPort: this.answers.containerPort,
          buildTool,
          applicationName: this._getApplicationName(),
          javaOpts: this._getDefaultJavaOpts()
        }
      );
    }
  }

  private _generateDockerCompose() {
    const dbDetails = this._getDbDetails();
    const applicationName = this._getApplicationName();
    const dependencies = dbDetails.dependencies || [];

    // Ajouter les services sélectionnés comme dépendances
    if (this.answers.services && this.answers.services.length > 0) {
      dependencies.push(...this.answers.services);
    }

    // Générer le fichier docker-compose.yml
    this.fs.copyTpl(
      this.templatePath('docker-compose.yml.ejs'),
      this.destinationPath('docker-compose.yml'),
      {
        applicationName,
        containerPort: this.answers.containerPort,
        dbDetails,
        services: this.answers.services || [],
        healthcheck: this.answers.healthcheck,
        healthcheckPath: this.answers.healthcheckPath,
        hasElasticsearch: (this.answers.services || []).includes('elasticsearch'),
        hasKibana: (this.answers.services || []).includes('kibana'),
        hasRedis: (this.answers.services || []).includes('redis'),
        hasPrometheus: (this.answers.services || []).includes('prometheus'),
        hasGrafana: (this.answers.services || []).includes('grafana'),
        hasKafka: (this.answers.services || []).includes('kafka'),
        hasRabbitMQ: (this.answers.services || []).includes('rabbitmq')
      }
    );
  }

  private _generateDockerScripts() {
    // Créer le dossier docker si nécessaire en ajoutant un fichier .gitkeep
    this.fs.write(
      this.destinationPath('docker/.gitkeep'),
      '# Ce fichier garantit que le répertoire sera inclus dans Git\n'
    );

    // Script de build
    this.fs.copyTpl(
      this.templatePath('scripts/build.sh.ejs'),
      this.destinationPath('docker/build.sh'),
      {
        applicationName: this._getApplicationName(),
        dockerRegistry: 'localhost'
      }
    );

    // Script de run
    this.fs.copyTpl(
      this.templatePath('scripts/run.sh.ejs'),
      this.destinationPath('docker/run.sh'),
      {
        applicationName: this._getApplicationName(),
        containerPort: this.answers.containerPort
      }
    );

    // Script de déploiement
    this.fs.copyTpl(
      this.templatePath('scripts/deploy.sh.ejs'),
      this.destinationPath('docker/deploy.sh'),
      {
        applicationName: this._getApplicationName()
      }
    );

    // Rendre les scripts exécutables
    try {
      fs.chmodSync(path.join(this.destinationPath(), 'docker/build.sh'), '755');
      fs.chmodSync(path.join(this.destinationPath(), 'docker/run.sh'), '755');
      fs.chmodSync(path.join(this.destinationPath(), 'docker/deploy.sh'), '755');
    } catch (e) {
      this.log(chalk.yellow('Impossible de rendre les scripts exécutables. Vous devrez le faire manuellement.'));
    }
  }

  private _generateDockerSecrets() {
    // Créer le dossier docker/secrets si nécessaire en ajoutant un fichier .gitkeep
    this.fs.write(
      this.destinationPath('docker/secrets/.gitkeep'),
      '# Ce fichier garantit que le répertoire sera inclus dans Git\n'
    );

    // Fichier exemple pour les secrets Docker
    this.fs.copyTpl(
      this.templatePath('secrets/secrets-example.env.ejs'),
      this.destinationPath('docker/secrets/secrets-example.env'),
      {
        dbDetails: this._getDbDetails(),
        services: this.answers.services || []
      }
    );

    // Script pour gérer les secrets
    this.fs.copyTpl(
      this.templatePath('secrets/manage-secrets.sh.ejs'),
      this.destinationPath('docker/secrets/manage-secrets.sh'),
      {}
    );

    // Rendre le script exécutable
    try {
      fs.chmodSync(path.join(this.destinationPath(), 'docker/secrets/manage-secrets.sh'), '755');
    } catch (e) {
      this.log(chalk.yellow('Impossible de rendre le script exécutable. Vous devrez le faire manuellement.'));
    }
  }

  private _generateDockerIgnore() {
    this.fs.copyTpl(
      this.templatePath('dockerignore.ejs'),
      this.destinationPath('.dockerignore'),
      {}
    );
  }

  private _generateDockerDocs() {
    // Créer le dossier docs/docker si nécessaire en ajoutant un fichier .gitkeep
    this.fs.write(
      this.destinationPath('docs/docker/.gitkeep'),
      '# Ce fichier garantit que le répertoire sera inclus dans Git\n'
    );

    // Documentation Docker principale
    this.fs.copyTpl(
      this.templatePath('docs/docker-guide.md.ejs'),
      this.destinationPath('docs/docker/docker-guide.md'),
      {
        applicationName: this._getApplicationName(),
        multiStage: this.answers.multiStage,
        baseImage: this.answers.baseImage,
        healthcheck: this.answers.healthcheck,
        dockerCompose: this.answers.dockerCompose,
        services: this.answers.services || []
      }
    );

    // Documentation des services (si docker-compose est utilisé)
    if (this.answers.dockerCompose && this.answers.services && this.answers.services.length > 0) {
      this.fs.copyTpl(
        this.templatePath('docs/services-guide.md.ejs'),
        this.destinationPath('docs/docker/services-guide.md'),
        {
          services: this.answers.services
        }
      );
    }

    // Documentation des bonnes pratiques
    this.fs.copyTpl(
      this.templatePath('docs/docker-best-practices.md.ejs'),
      this.destinationPath('docs/docker/docker-best-practices.md'),
      {}
    );
  }

  private _detectBuildTool(): 'maven' | 'gradle' {
    if (this.fs.exists(this.destinationPath('pom.xml'))) {
      return 'maven';
    } else {
      return 'gradle';
    }
  }

  private _getApplicationName(): string {
    try {
      // Essayer de lire le nom de l'application depuis le fichier pom.xml ou build.gradle
      if (this.fs.exists(this.destinationPath('pom.xml'))) {
        const pomContent = this.fs.read(this.destinationPath('pom.xml'));
        const artifactIdMatch = pomContent.match(/<artifactId>([^<]+)<\/artifactId>/);
        if (artifactIdMatch && artifactIdMatch[1]) {
          return artifactIdMatch[1];
        }
      } else if (this.fs.exists(this.destinationPath('build.gradle'))) {
        const gradleContent = this.fs.read(this.destinationPath('build.gradle'));
        const nameMatch = gradleContent.match(/archivesBaseName\s*=\s*['"]([^'"]+)['"]/);
        if (nameMatch && nameMatch[1]) {
          return nameMatch[1];
        }
      } else if (this.fs.exists(this.destinationPath('build.gradle.kts'))) {
        const gradleContent = this.fs.read(this.destinationPath('build.gradle.kts'));
        const nameMatch = gradleContent.match(/archivesBaseName\s*=\s*"([^"]+)"/);
        if (nameMatch && nameMatch[1]) {
          return nameMatch[1];
        }
      }
    } catch (e) {
      // Ignorer les erreurs
    }

    // Utiliser un nom par défaut si non trouvé
    return 'spring-app';
  }

  private _getDbDetails(): any {
    const dbDetails = {
      type: 'none',
      port: '',
      username: '',
      password: '',
      database: '',
      dependencies: [] as string[]
    };

    try {
      // Lire le application.properties ou application.yml pour détecter la configuration de la base de données
      if (this.fs.exists(this.destinationPath('src/main/resources/application.properties'))) {
        const propertiesContent = this.fs.read(this.destinationPath('src/main/resources/application.properties'));

        if (propertiesContent.includes('spring.datasource.url')) {
          const urlMatch = propertiesContent.match(/spring\.datasource\.url=.*:\/\/.*:(\d+)\/(\w+)/);
          if (urlMatch) {
            dbDetails.port = urlMatch[1];
            dbDetails.database = urlMatch[2];
          }

          if (propertiesContent.includes('mysql')) {
            dbDetails.type = 'mysql';
            dbDetails.port = dbDetails.port || '3306';
            dbDetails.dependencies.push('mysql');
          } else if (propertiesContent.includes('postgresql')) {
            dbDetails.type = 'postgres';
            dbDetails.port = dbDetails.port || '5432';
            dbDetails.dependencies.push('postgres');
          } else if (propertiesContent.includes('mongodb')) {
            dbDetails.type = 'mongodb';
            dbDetails.port = dbDetails.port || '27017';
            dbDetails.dependencies.push('mongodb');
          }

          const usernameMatch = propertiesContent.match(/spring\.datasource\.username=(\S+)/);
          if (usernameMatch) {
            dbDetails.username = usernameMatch[1];
          }

          const passwordMatch = propertiesContent.match(/spring\.datasource\.password=(\S+)/);
          if (passwordMatch) {
            dbDetails.password = passwordMatch[1];
          }
        }
      } else if (this.fs.exists(this.destinationPath('src/main/resources/application.yml'))) {
        const ymlContent = this.fs.read(this.destinationPath('src/main/resources/application.yml'));

        if (ymlContent.includes('spring:') && ymlContent.includes('datasource:')) {
          if (ymlContent.includes('url:')) {
            const urlMatch = ymlContent.match(/url:.*:\/\/.*:(\d+)\/(\w+)/);
            if (urlMatch) {
              dbDetails.port = urlMatch[1];
              dbDetails.database = urlMatch[2];
            }

            if (ymlContent.includes('mysql')) {
              dbDetails.type = 'mysql';
              dbDetails.port = dbDetails.port || '3306';
              dbDetails.dependencies.push('mysql');
            } else if (ymlContent.includes('postgresql')) {
              dbDetails.type = 'postgres';
              dbDetails.port = dbDetails.port || '5432';
              dbDetails.dependencies.push('postgres');
            } else if (ymlContent.includes('mongodb')) {
              dbDetails.type = 'mongodb';
              dbDetails.port = dbDetails.port || '27017';
              dbDetails.dependencies.push('mongodb');
            }
          }

          const usernameMatch = ymlContent.match(/username:\s*(\S+)/);
          if (usernameMatch) {
            dbDetails.username = usernameMatch[1];
          }

          const passwordMatch = ymlContent.match(/password:\s*(\S+)/);
          if (passwordMatch) {
            dbDetails.password = passwordMatch[1];
          }
        }
      }
    } catch (e) {
      // Ignorer les erreurs
    }

    // Valeurs par défaut si non trouvées
    dbDetails.username = dbDetails.username || 'user';
    dbDetails.password = dbDetails.password || 'password';
    dbDetails.database = dbDetails.database || 'app';

    return dbDetails;
  }

  private _getDefaultJavaOpts(): string {
    return '-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom';
  }
}
