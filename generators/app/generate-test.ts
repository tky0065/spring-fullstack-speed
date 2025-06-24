import { TemplateData } from './generator-methods.js';
import chalk from 'chalk';
import { ensureDirectoryExists } from './ensure-dir-exists.js';

/**
 * Génère les fichiers de tests
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
export function generateTests(generator: any, templateData: TemplateData) {
  generator.log(chalk.blue("Génération des fichiers de test..."));

  try {
    const testPath = `src/test/java/${templateData.javaPackagePath}`;

    // Créer les répertoires de test s'ils n'existent pas déjà
    ensureDirectoryExists(generator, testPath);
    ensureDirectoryExists(generator, `${testPath}/controller`);
    ensureDirectoryExists(generator, `${testPath}/service`);
    ensureDirectoryExists(generator, `${testPath}/repository`);

    // Tests pour l'authentification si elle est incluse
    if (templateData.includeAuth) {
      ensureDirectoryExists(generator, `${testPath}/security`);

      // Test du AuthController
      generator.fs.copyTpl(
        generator.templatePath('src/test/java/com/example/app/controller/AuthControllerTest.java.ejs'),
        generator.destinationPath(`${testPath}/controller/AuthControllerTest.java`),
        templateData
      );

      // Test du JwtTokenProvider si JWT
      if (!templateData.authType || templateData.authType === 'JWT') {
        generator.fs.copyTpl(
          generator.templatePath('src/test/java/com/example/app/security/jwt/JwtTokenProviderTest.java.ejs'),
          generator.destinationPath(`${testPath}/security/jwt/JwtTokenProviderTest.java`),
          templateData
        );
      }
    }

    // Tests frontend si un framework frontend est sélectionné
    if (templateData.frontendFramework &&
      templateData.frontendFramework !== 'Aucun (API seulement)' &&
      templateData.frontendFramework !== 'Thymeleaf' &&
      templateData.frontendFramework !== 'JTE') {

      const frontendTestsPath = 'frontend/tests';
      ensureDirectoryExists(generator, frontendTestsPath);

      // Tests spécifiques à React
      if (templateData.frontendFramework.toLowerCase() === 'react') {
        generator.fs.copyTpl(
          generator.templatePath('frontend/react/tests/setup.ts.ejs'),
          generator.destinationPath('frontend/tests/setup.ts'),
          templateData
        );

        generator.fs.copyTpl(
          generator.templatePath('frontend/react/tests/api-integration.test.tsx.ejs'),
          generator.destinationPath('frontend/tests/api-integration.test.tsx'),
          templateData
        );
      }

      // Tests spécifiques à Vue
      else if (templateData.frontendFramework.toLowerCase() === 'vue.js' ||
        templateData.frontendFramework.toLowerCase() === 'vue') {
        generator.fs.copyTpl(
          generator.templatePath('frontend/vue/tests/setup.ts.ejs'),
          generator.destinationPath('frontend/tests/setup.ts'),
          templateData
        );

        generator.fs.copyTpl(
          generator.templatePath('frontend/vue/tests/api-generated.test.ts.ejs'),
          generator.destinationPath('frontend/tests/api-generated.test.ts'),
          templateData
        );
      }
    }

    generator.log(chalk.green("✅ Configuration des tests générée avec succès!"));
  } catch (error) {
    generator.log(chalk.red(`❌ Erreur lors de la génération des fichiers de test: ${error}`));
    // En cas d'erreur, continuer sans bloquer la génération globale
  }
}
