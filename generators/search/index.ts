import { BaseGenerator } from '../base-generator.js';
import { SFSOptions } from '../types.js';

/**
 * Options spécifiques au générateur de recherche
 */
export interface SearchGeneratorOptions extends SFSOptions {
  elasticsearchCluster?: boolean;
  elasticsearchHost?: string;
  elasticsearchPort?: string;
  elasticsearchSecurity?: boolean;
  [key: string]: any;
}

/**
 * Générateur pour l'intégration d'Elasticsearch et des fonctionnalités de recherche avancée
 */
export default class ElasticsearchGenerator extends BaseGenerator {
  // Déclarer les méthodes et propriétés héritées
  declare answers: any;
  declare prompt: (questions: any) => Promise<any>;
  declare fs: any;
  declare destinationPath: (destPath?: string) => string;
  declare templatePath: (tempPath?: string) => string;
  declare packageFolder: string;
  declare packageName: string;

  constructor(args: string | string[], options: SearchGeneratorOptions) {
    super(args, options);

    this.desc("Générateur pour l'intégration d'Elasticsearch et des fonctionnalités de recherche");
  }

  initializing() {
    this.log('Initialisation du générateur Elasticsearch...');
  }

  async prompting() {
    const prompts = [
      {
        type: 'confirm',
        name: 'elasticsearchCluster',
        message: 'Voulez-vous configurer un cluster Elasticsearch?',
        default: false,
      },
      {
        type: 'input',
        name: 'elasticsearchHost',
        message: 'Hôte Elasticsearch:',
        default: 'localhost',
      },
      {
        type: 'input',
        name: 'elasticsearchPort',
        message: 'Port Elasticsearch:',
        default: '9200',
      },
      {
        type: 'confirm',
        name: 'elasticsearchSecurity',
        message: 'Activer la sécurité Elasticsearch (X-Pack)?',
        default: false,
      },
      {
        when: (answers: any) => answers.elasticsearchSecurity,
        type: 'input',
        name: 'elasticsearchUsername',
        message: 'Nom d\'utilisateur Elasticsearch:',
        default: 'elastic',
      },
      {
        when: (answers: any) => answers.elasticsearchSecurity,
        type: 'password',
        name: 'elasticsearchPassword',
        message: 'Mot de passe Elasticsearch:',
      },
      {
        type: 'checkbox',
        name: 'entitiesToIndex',
        message: 'Sélectionnez les entités à indexer dans Elasticsearch:',
        choices: () => {
          // À implémenter: récupérer dynamiquement les entités du projet
          return [
            { name: 'User', value: 'User' },
            { name: 'Product', value: 'Product' },
            { name: 'Order', value: 'Order' },
            { name: 'Autre (à configurer manuellement)', value: 'custom' },
          ];
        },
      },
    ];

    this.answers = await this.prompt(prompts);
  }

  configuring() {
    this.log('Configuration d\'Elasticsearch...');

    // Ajouter les dépendances ES au pom.xml ou build.gradle
    if (this.fs.exists(this.destinationPath('pom.xml'))) {
      this._addMavenDependencies();
    } else if (this.fs.exists(this.destinationPath('build.gradle')) ||
               this.fs.exists(this.destinationPath('build.gradle.kts'))) {
      this._addGradleDependencies();
    }
  }

  writing() {
    this.log('Génération des fichiers pour Elasticsearch...');

    // Configuration Elasticsearch
    this._generateElasticsearchConfig();

    // Classes Repository pour Elasticsearch
    this._generateElasticsearchRepositories();

    // Classes Service et DTO pour la recherche
    this._generateSearchServices();

    // Controllers pour les API de recherche
    this._generateSearchControllers();

    // Ajouter la configuration Docker si nécessaire
    this._updateDockerCompose();
  }

  install() {
    this.log('Installation terminée pour Elasticsearch');
  }

  end() {
    this.log('Intégration d\'Elasticsearch terminée!');
  }

  // Méthodes privées d'aide
  private _addMavenDependencies() {
    try {
      const pomXml = this.fs.read(this.destinationPath('pom.xml'));
      const elasticsearchDeps = `
        <!-- Spring Data Elasticsearch -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-elasticsearch</artifactId>
        </dependency>`;

      if (!pomXml.includes('spring-boot-starter-data-elasticsearch')) {
        const updatedPom = pomXml.replace(
          '</dependencies>',
          `${elasticsearchDeps}\n    </dependencies>`
        );
        this.fs.write(this.destinationPath('pom.xml'), updatedPom);
      }
    } catch (error) {
      this.log('Erreur lors de la mise à jour du fichier pom.xml');
    }
  }

  private _addGradleDependencies() {
    try {
      const buildFile = this.fs.exists(this.destinationPath('build.gradle.kts'))
        ? this.destinationPath('build.gradle.kts')
        : this.destinationPath('build.gradle');

      const buildContent = this.fs.read(buildFile);
      const elasticsearchDeps = `
    // Spring Data Elasticsearch
    implementation("org.springframework.boot:spring-boot-starter-data-elasticsearch")`;

      if (!buildContent.includes('spring-boot-starter-data-elasticsearch')) {
        let updatedContent;
        if (buildFile.endsWith('.kts')) {
          updatedContent = buildContent.replace(
            'dependencies {',
            `dependencies {${elasticsearchDeps}`
          );
        } else {
          updatedContent = buildContent.replace(
            'dependencies {',
            `dependencies {${elasticsearchDeps}`
          );
        }

        this.fs.write(buildFile, updatedContent);
      }
    } catch (error) {
      this.log('Erreur lors de la mise à jour du fichier build.gradle');
    }
  }

  private _generateElasticsearchConfig() {
    // Générer la configuration Elasticsearch
    this.fs.copyTpl(
      this.templatePath('ElasticsearchConfig.java.ejs'),
      this.destinationPath(`src/main/java/${this.packageFolder}/config/ElasticsearchConfig.java`),
      {
        packageName: this.packageName,
        elasticsearchHost: this.answers.elasticsearchHost,
        elasticsearchPort: this.answers.elasticsearchPort,
        elasticsearchSecurity: this.answers.elasticsearchSecurity,
        elasticsearchUsername: this.answers.elasticsearchUsername,
        elasticsearchPassword: this.answers.elasticsearchPassword
      }
    );

    // Ajouter les propriétés dans application.properties ou application.yml
    const propertiesPath = this.fs.exists(this.destinationPath('src/main/resources/application.yml'))
      ? this.destinationPath('src/main/resources/application.yml')
      : this.destinationPath('src/main/resources/application.properties');

    if (propertiesPath.endsWith('.yml')) {
      this._updateYamlProperties(propertiesPath);
    } else {
      this._updateProperties(propertiesPath);
    }
  }

  private _updateProperties(propertiesPath: string) {
    try {
      const properties = this.fs.read(propertiesPath);
      const elasticsearchProps = `
# Elasticsearch Configuration
spring.elasticsearch.uris=http://${this.answers.elasticsearchHost}:${this.answers.elasticsearchPort}
spring.elasticsearch.connection-timeout=1s
spring.elasticsearch.socket-timeout=30s
spring.elasticsearch.restclient.sniffer.interval=10m
spring.elasticsearch.restclient.sniffer.delay-after-failure=30s
${this.answers.elasticsearchSecurity ? `spring.elasticsearch.username=${this.answers.elasticsearchUsername}
spring.elasticsearch.password=${this.answers.elasticsearchPassword}` : ''}
      `;

      this.fs.write(propertiesPath, properties + elasticsearchProps);
    } catch (error) {
      this.log('Erreur lors de la mise à jour du fichier application.properties');
    }
  }

  private _updateYamlProperties(propertiesPath: string) {
    try {
      const properties = this.fs.read(propertiesPath);
      const elasticsearchProps = `
# Elasticsearch Configuration
spring:
  elasticsearch:
    uris: http://${this.answers.elasticsearchHost}:${this.answers.elasticsearchPort}
    connection-timeout: 1s
    socket-timeout: 30s
    restclient:
      sniffer:
        interval: 10m
        delay-after-failure: 30s
${this.answers.elasticsearchSecurity ? `    username: ${this.answers.elasticsearchUsername}
    password: ${this.answers.elasticsearchPassword}` : ''}
      `;

      this.fs.write(propertiesPath, properties + elasticsearchProps);
    } catch (error) {
      this.log('Erreur lors de la mise à jour du fichier application.yml');
    }
  }

  private _generateElasticsearchRepositories() {
    // Générer un repository de base pour Elasticsearch
    this.fs.copyTpl(
      this.templatePath('ElasticsearchRepository.java.ejs'),
      this.destinationPath(`src/main/java/${this.packageFolder}/repository/search/SearchRepository.java`),
      {
        packageName: this.packageName
      }
    );

    // Générer les repositories spécifiques pour chaque entité sélectionnée
    if (this.answers.entitiesToIndex && this.answers.entitiesToIndex.length > 0) {
      this.answers.entitiesToIndex.forEach((entity: string) => {
        if (entity !== 'custom') {
          this.fs.copyTpl(
            this.templatePath('EntitySearchRepository.java.ejs'),
            this.destinationPath(`src/main/java/${this.packageFolder}/repository/search/${entity}SearchRepository.java`),
            {
              packageName: this.packageName,
              entity
            }
          );
        }
      });
    }
  }

  private _generateSearchServices() {
    // Générer le service de recherche générique
    this.fs.copyTpl(
      this.templatePath('SearchService.java.ejs'),
      this.destinationPath(`src/main/java/${this.packageFolder}/service/SearchService.java`),
      {
        packageName: this.packageName
      }
    );

    // Générer les DTO pour la recherche
    this.fs.copyTpl(
      this.templatePath('SearchDTO.java.ejs'),
      this.destinationPath(`src/main/java/${this.packageFolder}/dto/SearchDTO.java`),
      {
        packageName: this.packageName
      }
    );

    this.fs.copyTpl(
      this.templatePath('SearchResultDTO.java.ejs'),
      this.destinationPath(`src/main/java/${this.packageFolder}/dto/SearchResultDTO.java`),
      {
        packageName: this.packageName
      }
    );

    // Générer des services spécifiques pour chaque entité
    if (this.answers.entitiesToIndex && this.answers.entitiesToIndex.length > 0) {
      this.answers.entitiesToIndex.forEach((entity: string) => {
        if (entity !== 'custom') {
          this.fs.copyTpl(
            this.templatePath('EntitySearchService.java.ejs'),
            this.destinationPath(`src/main/java/${this.packageFolder}/service/search/${entity}SearchService.java`),
            {
              packageName: this.packageName,
              entity
            }
          );
        }
      });
    }
  }

  private _generateSearchControllers() {
    // Générer le contrôleur de recherche principal
    this.fs.copyTpl(
      this.templatePath('SearchController.java.ejs'),
      this.destinationPath(`src/main/java/${this.packageFolder}/controller/SearchController.java`),
      {
        packageName: this.packageName
      }
    );

    // Générer des contrôleurs spécifiques pour chaque entité
    if (this.answers.entitiesToIndex && this.answers.entitiesToIndex.length > 0) {
      this.answers.entitiesToIndex.forEach((entity: string) => {
        if (entity !== 'custom') {
          this.fs.copyTpl(
            this.templatePath('EntitySearchController.java.ejs'),
            this.destinationPath(`src/main/java/${this.packageFolder}/controller/${entity}SearchController.java`),
            {
              packageName: this.packageName,
              entity
            }
          );
        }
      });
    }
  }

  private _updateDockerCompose() {
    const dockerComposePath = this.destinationPath('docker/docker-compose.yml');
    if (this.fs.exists(dockerComposePath)) {
      try {
        let dockerCompose = this.fs.read(dockerComposePath);

        // Vérifier si Elasticsearch est déjà dans le fichier
        if (!dockerCompose.includes('elasticsearch:')) {
          const elasticsearchService = `
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.10.4
    container_name: elasticsearch
    environment:
      - node.name=elasticsearch
      - cluster.name=docker-cluster
      - discovery.type=single-node
      - bootstrap.memory_lock=true
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - xpack.security.enabled=${this.answers.elasticsearchSecurity ? 'true' : 'false'}
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    ports:
      - ${this.answers.elasticsearchPort}:9200
    networks:
      - app-network

  kibana:
    image: docker.elastic.co/kibana/kibana:8.10.4
    container_name: kibana
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
    networks:
      - app-network`;

          // Ajouter le service à docker-compose
          dockerCompose = dockerCompose.replace(
            'networks:',
            `${elasticsearchService}\n\nnetworks:`
          );

          // Ajouter le volume si nécessaire
          if (!dockerCompose.includes('elasticsearch-data:')) {
            dockerCompose = dockerCompose.replace(
              'volumes:',
              'volumes:\n  elasticsearch-data:'
            );
            if (!dockerCompose.includes('volumes:')) {
              dockerCompose += '\nvolumes:\n  elasticsearch-data:';
            }
          }

          this.fs.write(dockerComposePath, dockerCompose);
        }
      } catch (error) {
        this.log('Erreur lors de la mise à jour du fichier docker-compose.yml');
      }
    }
  }
}
