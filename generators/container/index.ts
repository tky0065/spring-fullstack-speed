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
    this.log(chalk.blue('Génération des fichiers de containerisation...'));

    const { multiStage, baseImage, healthcheck, healthcheckPath, containerPort, dockerCompose, services } = this.answers;

    // Création des répertoires nécessaires
    this.fs.mkdirp('docker');
    this.fs.mkdirp('docker/scripts');
    this.fs.mkdirp('docker/conf');
    this.fs.mkdirp('docker/secrets');

    // Génération du Dockerfile principal
    if (multiStage) {
      this.fs.copyTpl(
        this.templatePath('Dockerfile.multistage.ejs'),
        this.destinationPath('Dockerfile'),
        {
          baseImage,
          healthcheck,
          healthcheckPath,
          containerPort
        }
      );
    } else {
      this.fs.copyTpl(
        this.templatePath('Dockerfile.simple.ejs'),
        this.destinationPath('Dockerfile'),
        {
          baseImage,
          healthcheck,
          healthcheckPath,
          containerPort
        }
      );
    }

    // Génération du .dockerignore
    this.fs.copyTpl(
      this.templatePath('dockerignore.ejs'),
      this.destinationPath('.dockerignore'),
      this.answers
    );

    // Génération des scripts utilitaires
    this.fs.copyTpl(
      this.templatePath('scripts/build.sh.ejs'),
      this.destinationPath('docker/scripts/build.sh'),
      this.answers
    );

    this.fs.copyTpl(
      this.templatePath('scripts/run.sh.ejs'),
      this.destinationPath('docker/scripts/run.sh'),
      this.answers
    );

    this.fs.copyTpl(
      this.templatePath('scripts/deploy.sh.ejs'),
      this.destinationPath('docker/scripts/deploy.sh'),
      this.answers
    );

    // Gestion des secrets Docker
    this.fs.copyTpl(
      this.templatePath('secrets/manage-secrets.sh.ejs'),
      this.destinationPath('docker/secrets/manage-secrets.sh'),
      this.answers
    );

    this.fs.copyTpl(
      this.templatePath('secrets/secrets-example.env.ejs'),
      this.destinationPath('docker/secrets/secrets-example.env'),
      this.answers
    );

    // Documentation
    this.fs.copyTpl(
      this.templatePath('docs/docker-guide.md.ejs'),
      this.destinationPath('docs/docker-guide.md'),
      this.answers
    );

    this.fs.copyTpl(
      this.templatePath('docs/docker-best-practices.md.ejs'),
      this.destinationPath('docs/docker-best-practices.md'),
      this.answers
    );

    // Docker Compose si demandé
    if (dockerCompose) {
      this._generateDockerCompose();
    }

    // Documentation des services si des services ont été sélectionnés
    if (services && services.length > 0) {
      this.fs.copyTpl(
        this.templatePath('docs/services-guide.md.ejs'),
        this.destinationPath('docs/services-guide.md'),
        this.answers
      );
    }

    this.log(chalk.green('✅ Fichiers de containerisation générés avec succès !'));
  }

  install() {
    this.log(chalk.blue('Configuration des permissions pour les scripts...'));

    // Rendre les scripts exécutables (sous Linux/Mac)
    if (process.platform !== 'win32') {
      try {
        fs.chmodSync(this.destinationPath('docker/scripts/build.sh'), '755');
        fs.chmodSync(this.destinationPath('docker/scripts/run.sh'), '755');
        fs.chmodSync(this.destinationPath('docker/scripts/deploy.sh'), '755');
        fs.chmodSync(this.destinationPath('docker/secrets/manage-secrets.sh'), '755');
        this.log(chalk.green('✅ Permissions configurées pour les scripts'));
      } catch (error) {
        this.log(chalk.yellow(`⚠️ Impossible de définir les permissions d'exécution: ${error}`));
      }
    }
  }

  end() {
    this.log(chalk.green('🚀 Configuration de containerisation terminée !'));

    // Afficher les instructions d'utilisation
    this.log(chalk.blue('\nPour construire l\'image Docker :'));
    this.log('docker build -t nom-application .');

    this.log(chalk.blue('\nPour exécuter le conteneur :'));
    this.log(`docker run -p ${this.answers.containerPort}:${this.answers.containerPort} nom-application`);

    if (this.answers.dockerCompose) {
      this.log(chalk.blue('\nPour démarrer tous les services avec Docker Compose :'));
      this.log('docker-compose up -d');
    }

    this.log(chalk.blue('\nPour plus d\'informations, consultez :'));
    this.log('- docs/docker-guide.md');
    this.log('- docs/docker-best-practices.md');
  }

  // Méthodes privées

  private _generateDockerCompose() {
    const { services, containerPort } = this.answers;
    const servicesToInclude = services || [];

    // Générer le docker-compose.yml
    this.fs.copyTpl(
      this.templatePath('docker-compose.yml.ejs'),
      this.destinationPath('docker-compose.yml'),
      {
        containerPort,
        services: servicesToInclude,
        includePostgres: servicesToInclude.includes('postgres'),
        includeMysql: servicesToInclude.includes('mysql'),
        includeMongodb: servicesToInclude.includes('mongodb'),
        includeRedis: servicesToInclude.includes('redis'),
        includeElasticsearch: servicesToInclude.includes('elasticsearch'),
        includeKibana: servicesToInclude.includes('kibana'),
        includeRabbitmq: servicesToInclude.includes('rabbitmq'),
        includeKafka: servicesToInclude.includes('kafka'),
        includePrometheus: servicesToInclude.includes('prometheus'),
        includeGrafana: servicesToInclude.includes('grafana')
      }
    );

    this.log(chalk.green('✅ Fichier docker-compose.yml généré avec succès !'));
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
