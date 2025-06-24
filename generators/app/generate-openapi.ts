import { TemplateData } from './generator-methods.js';
import chalk from 'chalk';
import { ensureDirectoryExists } from './ensure-dir-exists.js';

/**
 * Génère les fichiers pour OpenAPI/Swagger
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
export function generateOpenAPI(generator: any, templateData: TemplateData) {
  if (!templateData.additionalFeatures || !templateData.additionalFeatures.includes('openapi')) {
    return; // Ne rien faire si OpenAPI n'est pas demandé
  }

  generator.log(chalk.blue("Génération des fichiers OpenAPI/Swagger..."));

  try {
    const mainPath = `src/main/java/${templateData.javaPackagePath}`;

    // Créer le répertoire config s'il n'existe pas déjà
    ensureDirectoryExists(generator, `${mainPath}/config`);

    // Copier les fichiers de configuration OpenAPI
    generator.fs.copyTpl(
      generator.templatePath('openapi/OpenApiConfig.java.ejs'),
      generator.destinationPath(`${mainPath}/config/OpenApiConfig.java`),
      templateData
    );

    generator.fs.copyTpl(
      generator.templatePath('openapi/SwaggerUIConfig.java.ejs'),
      generator.destinationPath(`${mainPath}/config/SwaggerUIConfig.java`),
      templateData
    );

    // Controller d'exemple avec annotations OpenAPI
    generator.fs.copyTpl(
      generator.templatePath('openapi/ExampleApiController.java.ejs'),
      generator.destinationPath(`${mainPath}/controller/ExampleApiController.java`),
      templateData
    );

    // Propriétés OpenAPI pour application.properties/yml
    generator.fs.copyTpl(
      generator.templatePath('openapi/application-openapi.properties.ejs'),
      generator.destinationPath('src/main/resources/application-openapi.properties'),
      templateData
    );

    generator.log(chalk.green("✅ Configuration OpenAPI/Swagger générée avec succès!"));
  } catch (error) {
    generator.log(chalk.red(`❌ Erreur lors de la génération des fichiers OpenAPI: ${error}`));
    // En cas d'erreur, continuer sans bloquer la génération globale
  }
}
