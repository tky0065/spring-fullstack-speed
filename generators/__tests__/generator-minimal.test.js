const path = require('path');
const assert = require('yeoman-assert');
const helpers = require('yeoman-test');
const fs = require('fs');

describe('Spring-Fullstack-Speed generator basic test', () => {
  let runResult;

  // Configuration minimale pour un projet Spring Boot
  const minimalOptions = {
    appName: 'test-app',
    packageName: 'com.example.testapp',
    database: 'H2',
    frontendFramework: 'Aucun (API seulement)',
    includeAuth: false,
    additionalFeatures: []
  };

  // Fonction pour exécuter le générateur avant les tests
  beforeAll(async () => {
    // Exécute le générateur avec les options minimales
    runResult = await helpers
      .run(path.join(__dirname, '../app'))
      .withOptions(minimalOptions);

    // Laissez le temps au générateur de terminer
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 30000); // Timeout de 30s pour laisser le temps au générateur

  // Teste la création des fichiers de base
  describe('Basic project files', () => {
    it('creates main Maven/Gradle build files', () => {
      // Vérifie la présence des fichiers Maven
      assert.file(['pom.xml', 'mvnw', 'mvnw.cmd']);
    });

    it('creates application.yml with correct configurations', () => {
      assert.file(['src/main/resources/application.yml']);
      const content = fs.readFileSync('src/main/resources/application.yml', 'utf8');
      assert.textMatch(content, /spring:/);
      assert.textMatch(content, /name: test-app/);
    });

    it('creates logback-spring.xml for logging configuration', () => {
      assert.file(['src/main/resources/logback-spring.xml']);
    });
  });

  // Teste la structure de base des packages Java
  describe('Java package structure', () => {
    it('creates Application.java main class', () => {
      assert.file(['src/main/java/com/example/testapp/TestAppApplication.java']);
    });

    it('creates base package structure', () => {
      assert.file([
        'src/main/java/com/example/testapp/controller',
        'src/main/java/com/example/testapp/service',
        'src/main/java/com/example/testapp/repository',
        'src/main/java/com/example/testapp/entity',
        'src/main/java/com/example/testapp/util'
      ]);
    });
  });

  // Teste les classes utilitaires générées
  describe('Utility classes', () => {
    it('creates LoggingUtils', () => {
      assert.file(['src/main/java/com/example/testapp/util/LoggingUtils.java']);
    });

    it('creates StringUtils', () => {
      assert.file(['src/main/java/com/example/testapp/util/StringUtils.java']);
    });

    it('creates DateTimeUtils', () => {
      assert.file(['src/main/java/com/example/testapp/util/DateTimeUtils.java']);
    });

    it('creates PaginationUtil', () => {
      assert.file(['src/main/java/com/example/testapp/util/PaginationUtil.java']);
    });
  });

  // Teste l'exemple d'entité et son repository
  describe('Entity example', () => {
    it('creates BaseEntity', () => {
      assert.file(['src/main/java/com/example/testapp/entity/BaseEntity.java']);
    });

    it('creates Example entity', () => {
      assert.file(['src/main/java/com/example/testapp/entity/Example.java']);
      const content = fs.readFileSync('src/main/java/com/example/testapp/entity/Example.java', 'utf8');
      assert.textMatch(content, /extends BaseEntity/);
    });

    it('creates ExampleRepository', () => {
      assert.file(['src/main/java/com/example/testapp/repository/ExampleRepository.java']);
    });
  });
});
