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
  packageName?: string; // Ajout de la propriété packageName
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

    // Déterminer le package de base
    // Cast des options vers SearchGeneratorOptions pour accéder à packageName
    let packageName = (this.options as SearchGeneratorOptions).packageName || this.config.get('packageName');
    if (!packageName) {
      // Essayer de déduire le package from src/main/java
      const files = this.fs.glob.sync('src/main/java/**/*Application.java');
      if (files.length > 0) {
        const fileContent = this.fs.read(files[0]);
        const packageMatch = fileContent.match(/package ([a-z0-9.]+);/);
        if (packageMatch) {
          packageName = packageMatch[1];
        }
      }
    }

    // Fallback si toujours pas de package
    if (!packageName) {
      packageName = 'com.example.app';
    }

    // S'assurer que packageName est bien une chaîne de caractères
    packageName = String(packageName);

    this.log(`📦 Package détecté: ${packageName}`);
    const packagePath = packageName.replace(/\./g, '/');

    // Configuration de base
    this._generateElasticsearchConfig(packageName, packagePath);

    // Génération des repositories search
    this._generateSearchRepositories(packageName, packagePath);

    // Génération du service de recherche
    this._generateSearchService(packageName, packagePath);

    // Génération du controller de recherche
    this._generateSearchController(packageName, packagePath);

    // Configuration de la propriété elasticsearch
    this._addElasticsearchProperties();

    // Docker compose pour Elasticsearch (si demandé)
    if (this.answers.elasticsearchCluster) {
      this._generateElasticsearchDockerCompose();
    }

    this.log('✅ Les fichiers Elasticsearch ont été générés avec succès!');
  }

  install() {
    this.log('Installation des dépendances pour Elasticsearch...');

    // Ajouter les dépendances nécessaires au projet
    if (this.fs.exists(this.destinationPath('pom.xml'))) {
      this._addMavenDependencies();
    } else if (this.fs.exists(this.destinationPath('build.gradle'))) {
      this._addGradleDependencies();
    } else {
      this.log('❌ Aucun fichier de build (pom.xml ou build.gradle) n\'a été trouvé. Impossible d\'ajouter les dépendances.');
      this.log('Ajoutez manuellement la dépendance: org.springframework.boot:spring-boot-starter-data-elasticsearch');
    }
  }

  end() {
    this.log('🚀 Configuration Elasticsearch terminée!');

    // Instructions pour démarrer Elasticsearch
    this.log('\nPour démarrer Elasticsearch:');

    if (this.answers.elasticsearchCluster) {
      this.log('1. Exécutez: docker-compose -f docker-compose-elasticsearch.yml up -d');
    } else {
      this.log('1. Assurez-vous qu\'Elasticsearch est en cours d\'exécution sur ' +
        this.answers.elasticsearchHost + ':' + this.answers.elasticsearchPort);
    }

    this.log('2. Lancez votre application Spring Boot');
    this.log('3. Les indices seront créés automatiquement au démarrage');

    // Instructions d'utilisation
    this.log('\nExemple d\'utilisation:');
    this.log(`
@Autowired
private ProductSearchRepository productSearchRepository;

// Indexer un produit
productSearchRepository.save(product);

// Rechercher des produits
List<Product> results = productSearchRepository.findByNameContainingIgnoreCase("keyword");
    `);

    if (this.answers.elasticsearchSecurity) {
      this.log('\n⚠️ N\'oubliez pas de configurer les identifiants Elasticsearch dans application.properties');
    }
  }

  // Méthodes privées pour la génération des fichiers
  _generateElasticsearchConfig(packageName: string, packagePath: string) {
    const configDir = `src/main/java/${packagePath}/config`;
    this.fs.mkdirp(configDir);

    const templateData = {
      packageName,
      elasticsearchHost: this.answers.elasticsearchHost,
      elasticsearchPort: this.answers.elasticsearchPort,
      useSecurityConfig: this.answers.elasticsearchSecurity,
      elasticsearchUsername: this.answers.elasticsearchUsername,
      elasticsearchPassword: this.answers.elasticsearchPassword
    };

    this.fs.copyTpl(
      this.templatePath('ElasticsearchConfig.java.ejs'),
      this.destinationPath(`${configDir}/ElasticsearchConfig.java`),
      templateData
    );
  }

  _generateSearchRepositories(packageName: string, packagePath: string) {
    const { entitiesToIndex } = this.answers;
    const repoDir = `src/main/java/${packagePath}/repository/search`;
    this.fs.mkdirp(repoDir);

    // Créer un repository générique pour recherche
    this.fs.copyTpl(
      this.templatePath('ElasticsearchRepository.java.ejs'),
      this.destinationPath(`${repoDir}/ElasticsearchRepository.java`),
      { packageName }
    );

    // Créer des repositories spécifiques pour chaque entité
    if (entitiesToIndex && entitiesToIndex.length > 0) {
      entitiesToIndex.forEach((entity: string) => {
        if (entity !== 'custom') {
          this.fs.copyTpl(
            this.templatePath('EntitySearchRepository.java.ejs'),
            this.destinationPath(`${repoDir}/${entity}SearchRepository.java`),
            { packageName, entityName: entity }
          );
        }
      });
    }
  }

  _generateSearchService(packageName: string, packagePath: string) {
    const { entitiesToIndex } = this.answers;
    const serviceDir = `src/main/java/${packagePath}/service`;
    this.fs.mkdirp(serviceDir);

    // Service générique
    this.fs.copyTpl(
      this.templatePath('SearchService.java.ejs'),
      this.destinationPath(`${serviceDir}/SearchService.java`),
      { packageName }
    );

    // Services spécifiques pour chaque entité
    if (entitiesToIndex && entitiesToIndex.length > 0) {
      entitiesToIndex.forEach((entity: string) => {
        if (entity !== 'custom') {
          this.fs.copyTpl(
            this.templatePath('EntitySearchService.java.ejs'),
            this.destinationPath(`${serviceDir}/${entity}SearchService.java`),
            { packageName, entityName: entity }
          );
        }
      });
    }
  }

  _generateSearchController(packageName: string, packagePath: string) {
    const { entitiesToIndex } = this.answers;
    const controllerDir = `src/main/java/${packagePath}/controller`;
    const dtoDir = `src/main/java/${packagePath}/dto`;

    this.fs.mkdirp(controllerDir);
    this.fs.mkdirp(dtoDir);

    // DTOs pour la recherche
    this.fs.copyTpl(
      this.templatePath('SearchDTO.java.ejs'),
      this.destinationPath(`${dtoDir}/SearchDTO.java`),
      { packageName }
    );

    this.fs.copyTpl(
      this.templatePath('SearchResultDTO.java.ejs'),
      this.destinationPath(`${dtoDir}/SearchResultDTO.java`),
      { packageName }
    );

    // Controller générique
    this.fs.copyTpl(
      this.templatePath('SearchController.java.ejs'),
      this.destinationPath(`${controllerDir}/SearchController.java`),
      { packageName, entities: entitiesToIndex }
    );

    // Controllers spécifiques pour chaque entité
    if (entitiesToIndex && entitiesToIndex.length > 0) {
      entitiesToIndex.forEach((entity: string) => {
        if (entity !== 'custom') {
          this.fs.copyTpl(
            this.templatePath('EntitySearchController.java.ejs'),
            this.destinationPath(`${controllerDir}/${entity}SearchController.java`),
            { packageName, entityName: entity }
          );
        }
      });
    }
  }

  _addElasticsearchProperties() {
    const propertiesPath = this.destinationPath('src/main/resources/application.properties');
    const ymlPath = this.destinationPath('src/main/resources/application.yml');

    let propertiesContent = `
# Configuration Elasticsearch
spring.elasticsearch.uris=http://${this.answers.elasticsearchHost}:${this.answers.elasticsearchPort}
spring.elasticsearch.connection-timeout=1s
spring.elasticsearch.socket-timeout=30s
spring.elasticsearch.restclient.sniffer.interval=300000
spring.elasticsearch.restclient.sniffer.delay-after-failure=300000
spring.data.elasticsearch.repositories.enabled=true
spring.data.elasticsearch.cluster-name=elasticsearch
`;

    if (this.answers.elasticsearchSecurity) {
      propertiesContent += `
# Elasticsearch Security (X-Pack)
spring.elasticsearch.username=${this.answers.elasticsearchUsername}
spring.elasticsearch.password=${this.answers.elasticsearchPassword}
`;
    }

    // Ajouter la configuration au fichier de propriétés existant
    if (this.fs.exists(propertiesPath)) {
      this.fs.append(propertiesPath, propertiesContent);
      this.log('✅ Configuration Elasticsearch ajoutée au fichier application.properties');
    } else if (this.fs.exists(ymlPath)) {
      // Convertir les propriétés en YAML
      const ymlContent = `
# Configuration Elasticsearch
spring:
  elasticsearch:
    uris: http://${this.answers.elasticsearchHost}:${this.answers.elasticsearchPort}
    connection-timeout: 1s
    socket-timeout: 30s
${this.answers.elasticsearchSecurity ? `    username: ${this.answers.elasticsearchUsername}\n    password: ${this.answers.elasticsearchPassword}` : ''}
    restclient:
      sniffer:
        interval: 300000
        delay-after-failure: 300000
  data:
    elasticsearch:
      repositories:
        enabled: true
      cluster-name: elasticsearch
`;
      this.fs.append(ymlPath, ymlContent);
      this.log('✅ Configuration Elasticsearch ajoutée au fichier application.yml');
    } else {
      // Créer un nouveau fichier application.properties
      this.fs.write(propertiesPath, propertiesContent);
      this.log('✅ Fichier application.properties créé avec la configuration Elasticsearch');
    }
  }

  _generateElasticsearchDockerCompose() {
    const dockerComposePath = this.destinationPath('docker-compose-elasticsearch.yml');

    const dockerComposeContent = `
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.17.0
    container_name: elasticsearch
    environment:
      - node.name=elasticsearch
      - cluster.name=elasticsearch-cluster
      - discovery.type=single-node
      - bootstrap.memory_lock=true
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    ports:
      - ${this.answers.elasticsearchPort}:9200
    networks:
      - elastic-net

  kibana:
    image: docker.elastic.co/kibana/kibana:7.17.0
    container_name: kibana
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    ports:
      - 5601:5601
    depends_on:
      - elasticsearch
    networks:
      - elastic-net

networks:
  elastic-net:
    driver: bridge

volumes:
  elasticsearch-data:
    driver: local
`;

    this.fs.write(dockerComposePath, dockerComposeContent);
    this.log('✅ Fichier docker-compose-elasticsearch.yml généré avec succès');
  }

  private _addMavenDependencies() {
    const pomPath = this.destinationPath('pom.xml');

    if (!this.fs.exists(pomPath)) {
      this.log('❌ Fichier pom.xml non trouvé. Impossible d\'ajouter les dépendances.');
      return;
    }

    let pomContent = this.fs.read(pomPath);

    // Vérifier si la dépendance Elasticsearch existe déjà
    if (!pomContent.includes('spring-boot-starter-data-elasticsearch')) {
      // Ajouter la dépendance Elasticsearch
      const elasticDependency = `
        <!-- Elasticsearch -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-elasticsearch</artifactId>
        </dependency>`;

      if (pomContent.includes('</dependencies>')) {
        pomContent = pomContent.replace('</dependencies>', `${elasticDependency}\n    </dependencies>`);
        this.fs.write(pomPath, pomContent);
        this.log('✅ Dépendances Elasticsearch ajoutées au fichier pom.xml');
      } else {
        this.log('⚠️ Structure du fichier pom.xml non reconnue. Impossible d\'ajouter les dépendances automatiquement.');
        this.log('Ajoutez manuellement les dépendances suivantes:');
        this.log(elasticDependency);
      }
    } else {
      this.log('ℹ️ Les dépendances Elasticsearch sont déjà présentes dans le pom.xml');
    }
  }

  private _addGradleDependencies() {
    const buildGradlePath = this.destinationPath('build.gradle');

    if (!this.fs.exists(buildGradlePath)) {
      this.log('❌ Fichier build.gradle non trouvé. Impossible d\'ajouter les dépendances.');
      return;
    }

    let buildGradleContent = this.fs.read(buildGradlePath);

    // Vérifier si la dépendance Elasticsearch existe déjà
    if (!buildGradleContent.includes('spring-boot-starter-data-elasticsearch')) {
      // Ajouter la dépendance Elasticsearch
      const elasticDependency = `implementation 'org.springframework.boot:spring-boot-starter-data-elasticsearch'`;

      if (buildGradleContent.includes('dependencies {')) {
        buildGradleContent = buildGradleContent.replace(
          'dependencies {',
          `dependencies {\n    ${elasticDependency}\n`
        );
        this.fs.write(buildGradlePath, buildGradleContent);
        this.log('✅ Dépendances Elasticsearch ajoutées au fichier build.gradle');
      } else {
        this.log('⚠️ Structure du fichier build.gradle non reconnue. Impossible d\'ajouter les dépendances automatiquement.');
        this.log('Ajoutez manuellement la dépendance suivante:');
        this.log(elasticDependency);
      }
    } else {
      this.log('ℹ️ Les dépendances Elasticsearch sont déjà présentes dans le build.gradle');
    }
  }
}
