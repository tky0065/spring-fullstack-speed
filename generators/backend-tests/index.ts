import * as Generator from 'yeoman-generator';
import chalk from 'chalk';
import { BaseGenerator } from '../base-generator.js';
import { SFSOptions } from '../types.js';

// Styles visuels constants
const STEP_PREFIX = chalk.bold.blue("➤ ");
const SECTION_DIVIDER = chalk.gray("────────────────────────────────────────────");
const INFO_COLOR = chalk.yellow;
const SUCCESS_COLOR = chalk.green;
const ERROR_COLOR = chalk.red;
const HELP_COLOR = chalk.gray.italic;

/**
 * Options spécifiques au générateur de tests backend
 */
export interface BackendTestGeneratorOptions extends SFSOptions {
  testType?: string;
  entityName?: string;
  useTestContainers?: boolean;
  databaseType?: string;
  [key: string]: any;
}

export default class BackendTestGenerator extends BaseGenerator {
  // Déclaration correcte des propriétés pour être compatible avec BaseGenerator
  declare answers: any;

  constructor(args: string | string[], opts: SFSOptions) {
    super(args, opts);
    // Utiliser la méthode description correctement
    this.description = 'Generate backend tests for Spring Boot application';
  }

  initializing() {
    this.log(SECTION_DIVIDER);
    this.log(chalk.bold.blue('🧪 GÉNÉRATEUR DE TESTS BACKEND'));
    this.log(SECTION_DIVIDER);
    this.log(HELP_COLOR('Ce générateur va créer différents types de tests pour votre application Spring Boot.'));
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

  async prompting() {
    this.log(chalk.blue('🧪 Spring Boot Test Generator'));
    this.log(chalk.green('This generator will create various test files for your Spring Boot application.'));

    const prompts: any[] = [
      {
        type: 'list',
        name: 'testType',
        message: 'What type of tests would you like to generate?',
        choices: [
          { name: 'Unit Tests', value: 'unit' },
          { name: 'Integration Tests', value: 'integration' },
          { name: 'Repository Tests', value: 'repository' },
          { name: 'Service Tests', value: 'service' },
          { name: 'Controller Tests', value: 'controller' },
          { name: 'Security Tests', value: 'security' },
          { name: 'Performance Tests', value: 'performance' },
          { name: 'All Tests', value: 'all' }
        ]
      },
      {
        type: 'input',
        name: 'entityName',
        message: 'What is the name of the entity to test? (e.g. User, Product)',
        when: (answers: any) => answers.testType !== 'all' && answers.testType !== 'security' && answers.testType !== 'performance',
        default: 'User'
      },
      {
        type: 'confirm',
        name: 'useTestContainers',
        message: 'Would you like to use TestContainers for integration tests?',
        when: (answers: any) => answers.testType === 'integration' || answers.testType === 'all',
        default: true
      },
      {
        type: 'list',
        name: 'databaseType',
        message: 'Which database are you using?',
        when: (answers: any) => answers.useTestContainers === true,
        choices: [
          { name: 'PostgreSQL', value: 'postgresql' },
          { name: 'MySQL', value: 'mysql' },
          { name: 'MongoDB', value: 'mongodb' }
        ],
        default: 'postgresql'
      }
    ];

    this.answers = await this.prompt(prompts);
  }

  writing() {
    const { testType, entityName, useTestContainers, databaseType } = this.answers;
    const packageName = this.config.get('packageName') || 'com.example.app';
    // Ajouter une vérification de type pour s'assurer que packageName est une chaîne
    const packagePath = typeof packageName === 'string' ? packageName.replace(/\./g, '/') : 'com/example/app';

    const templateData = {
      packageName,
      entityName,
      entityNameLower: entityName ? entityName.toLowerCase() : '',
      useTestContainers,
      databaseType
    };

    // Generate test files based on user choice
    if (testType === 'unit' || testType === 'all') {
      this._generateUnitTests(templateData, packagePath, entityName);
    }

    if (testType === 'integration' || testType === 'all') {
      this._generateIntegrationTests(templateData, packagePath, entityName);
    }

    if (testType === 'repository' || testType === 'all') {
      this._generateRepositoryTests(templateData, packagePath, entityName);
    }

    if (testType === 'service' || testType === 'all') {
      this._generateServiceTests(templateData, packagePath, entityName);
    }

    if (testType === 'controller' || testType === 'all') {
      this._generateControllerTests(templateData, packagePath, entityName);
    }

    if (testType === 'security' || testType === 'all') {
      this._generateSecurityTests(templateData, packagePath);
    }

    if (testType === 'performance' || testType === 'all') {
      this._generatePerformanceTests(templateData, packagePath);
    }

    // Generate common test utilities
    this._generateTestUtils(templateData, packagePath);

    // Generate test configuration files
    this._generateTestConfigs(templateData, packagePath);
  }

  _generateUnitTests(templateData: any, packagePath: string, entityName: string) {
    this.log(chalk.cyan('📋 Generating Unit Tests'));

    this.fs.copyTpl(
      this.templatePath('unit/DtoTest.java.ejs'),
      this.destinationPath(`src/test/java/${packagePath}/dto/${entityName}DtoTest.java`),
      templateData
    );

    this.fs.copyTpl(
      this.templatePath('unit/UtilsTest.java.ejs'),
      this.destinationPath(`src/test/java/${packagePath}/util/AppUtilsTest.java`),
      templateData
    );
  }

  _generateIntegrationTests(templateData: any, packagePath: string, entityName: string) {
    this.log(chalk.cyan('📋 Generating Integration Tests'));

    this.fs.copyTpl(
      this.templatePath('integration/ApplicationIntegrationTest.java.ejs'),
      this.destinationPath(`src/test/java/${packagePath}/ApplicationIntegrationTest.java`),
      templateData
    );

    if (templateData.useTestContainers) {
      this.fs.copyTpl(
        this.templatePath('integration/AbstractContainerBaseTest.java.ejs'),
        this.destinationPath(`src/test/java/${packagePath}/config/AbstractContainerBaseTest.java`),
        templateData
      );
    }
  }

  _generateRepositoryTests(templateData: any, packagePath: string, entityName: string) {
    this.log(chalk.cyan('📋 Generating Repository Tests'));

    this.fs.copyTpl(
      this.templatePath('repository/RepositoryTest.java.ejs'),
      this.destinationPath(`src/test/java/${packagePath}/repository/${entityName}RepositoryTest.java`),
      templateData
    );
  }

  _generateServiceTests(templateData: any, packagePath: string, entityName: string) {
    this.log(chalk.cyan('📋 Generating Service Tests'));

    this.fs.copyTpl(
      this.templatePath('service/ServiceTest.java.ejs'),
      this.destinationPath(`src/test/java/${packagePath}/service/${entityName}ServiceTest.java`),
      templateData
    );
  }

  _generateControllerTests(templateData: any, packagePath: string, entityName: string) {
    this.log(chalk.cyan('📋 Generating Controller Tests'));

    this.fs.copyTpl(
      this.templatePath('controller/ControllerTest.java.ejs'),
      this.destinationPath(`src/test/java/${packagePath}/controller/${entityName}ControllerTest.java`),
      templateData
    );
  }

  _generateSecurityTests(templateData: any, packagePath: string) {
    this.log(chalk.cyan('📋 Generating Security Tests'));

    this.fs.copyTpl(
      this.templatePath('security/JwtAuthenticationTest.java.ejs'),
      this.destinationPath(`src/test/java/${packagePath}/security/jwt/JwtAuthenticationTest.java`),
      templateData
    );

    this.fs.copyTpl(
      this.templatePath('security/SecurityConfigTest.java.ejs'),
      this.destinationPath(`src/test/java/${packagePath}/security/SecurityConfigTest.java`),
      templateData
    );
  }

  _generatePerformanceTests(templateData: any, packagePath: string) {
    this.log(chalk.cyan('📋 Generating Performance Tests'));

    this.fs.copyTpl(
      this.templatePath('performance/ApiPerformanceTest.java.ejs'),
      this.destinationPath(`src/test/java/${packagePath}/performance/ApiPerformanceTest.java`),
      templateData
    );

    this.fs.copyTpl(
      this.templatePath('performance/LoadTest.java.ejs'),
      this.destinationPath(`src/test/java/${packagePath}/performance/LoadTest.java`),
      templateData
    );
  }

  _generateTestUtils(templateData: any, packagePath: string) {
    this.log(chalk.cyan('📋 Generating Test Utilities'));

    this.fs.copyTpl(
      this.templatePath('utils/TestUtil.java.ejs'),
      this.destinationPath(`src/test/java/${packagePath}/utils/TestUtil.java`),
      templateData
    );

    this.fs.copyTpl(
      this.templatePath('utils/MockDataFactory.java.ejs'),
      this.destinationPath(`src/test/java/${packagePath}/utils/MockDataFactory.java`),
      templateData
    );
  }

  _generateTestConfigs(templateData: any, packagePath: string) {
    this.log(chalk.cyan('📋 Generating Test Configurations'));

    this.fs.copyTpl(
      this.templatePath('config/application-test.properties.ejs'),
      this.destinationPath('src/test/resources/application-test.properties'),
      templateData
    );

    if (templateData.useTestContainers) {
      this.fs.copyTpl(
        this.templatePath('config/TestDatabaseConfig.java.ejs'),
        this.destinationPath(`src/test/java/${packagePath}/config/TestDatabaseConfig.java`),
        templateData
      );
    }
  }

  end() {
    this.log(chalk.green('✅ Backend tests have been generated successfully!'));
    this.log(chalk.yellow('💡 Make sure to add the following dependencies to your pom.xml or build.gradle:'));

    if (this.answers.useTestContainers) {
      this.log(chalk.cyan(`
  <!-- TestContainers -->
  <dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>testcontainers</artifactId>
    <version>1.17.6</version>
    <scope>test</scope>
  </dependency>
  <dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>junit-jupiter</artifactId>
    <version>1.17.6</version>
    <scope>test</scope>
  </dependency>
  <dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>${this.answers.databaseType}</artifactId>
    <version>1.17.6</version>
    <scope>test</scope>
  </dependency>
      `));
    }
  }
};
