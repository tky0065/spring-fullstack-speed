import { TemplateData } from './generator-methods.js';
import chalk from 'chalk';
import { ensureDirectoryExists } from './ensure-dir-exists.js';

/**
 * Génère les fichiers pour le frontend sélectionné
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
export function generateFrontend(generator: any, templateData: TemplateData) {
  generator.log(chalk.blue(`Génération des fichiers frontend (${templateData.frontendFramework})...`));

  try {
    const frontendType = templateData.frontendFramework.toLowerCase();

    if (frontendType === 'react' || frontendType === 'vue.js' || frontendType === 'vue') {
      // Créer le répertoire frontend
      ensureDirectoryExists(generator, "frontend");
      ensureDirectoryExists(generator, "frontend/src");

      const sourcePath = frontendType === 'react'
        ? 'frontend/react'
        : (frontendType === 'vue.js' || frontendType === 'vue')
          ? 'frontend/vue'
          : null;

      if (sourcePath) {
        // Copier les fichiers spécifiques au framework
        generator.log(chalk.yellow(`Copie des fichiers ${frontendType}...`));

        // Copier les fichiers de base et de configuration
        generator.fs.copyTpl(
          generator.templatePath(`${sourcePath}/package.json.ejs`),
          generator.destinationPath('frontend/package.json'),
          templateData
        );

        generator.fs.copyTpl(
          generator.templatePath(`${sourcePath}/tsconfig.json.ejs`),
          generator.destinationPath('frontend/tsconfig.json'),
          templateData
        );

        // Autres fichiers spécifiques à chaque framework
        if (frontendType === 'react') {
          // Fichiers spécifiques à React
          ensureDirectoryExists(generator, "frontend/src/components");
          ensureDirectoryExists(generator, "frontend/src/pages");
          ensureDirectoryExists(generator, "frontend/src/services");
          ensureDirectoryExists(generator, "frontend/src/store");
          ensureDirectoryExists(generator, "frontend/src/utils");
          ensureDirectoryExists(generator, "frontend/src/styles");
          ensureDirectoryExists(generator, "frontend/src/routes");

          // Configuration Vite pour React
          generator.fs.copyTpl(
            generator.templatePath(`${sourcePath}/vite.config.ts.ejs`),
            generator.destinationPath('frontend/vite.config.ts'),
            templateData
          );

          // Pages principales
          generator.fs.copyTpl(
            generator.templatePath(`${sourcePath}/src/pages/Home.tsx.ejs`),
            generator.destinationPath('frontend/src/pages/Home.tsx'),
            templateData
          );

          generator.fs.copyTpl(
            generator.templatePath(`${sourcePath}/src/pages/UserList.tsx.ejs`),
            generator.destinationPath('frontend/src/pages/UserList.tsx'),
            templateData
          );

          // Routes
          generator.fs.copyTpl(
            generator.templatePath(`${sourcePath}/src/routes/index.ts.ejs`),
            generator.destinationPath('frontend/src/routes/index.ts'),
            templateData
          );

          // Services API
          generator.fs.copyTpl(
            generator.templatePath(`${sourcePath}/src/services/apiConfig.ts.ejs`),
            generator.destinationPath('frontend/src/services/apiConfig.ts'),
            templateData
          );

          generator.fs.copyTpl(
            generator.templatePath(`${sourcePath}/src/services/apiService.ts.ejs`),
            generator.destinationPath('frontend/src/services/apiService.ts'),
            templateData
          );

          // Styles
          generator.fs.copyTpl(
            generator.templatePath(`${sourcePath}/src/styles/main.css.ejs`),
            generator.destinationPath('frontend/src/styles/main.css'),
            templateData
          );

          // Utils
          generator.fs.copyTpl(
            generator.templatePath(`${sourcePath}/src/utils/form-validation.ts.ejs`),
            generator.destinationPath('frontend/src/utils/form-validation.ts'),
            templateData
          );

          generator.fs.copyTpl(
            generator.templatePath(`${sourcePath}/src/utils/validators.ts.ejs`),
            generator.destinationPath('frontend/src/utils/validators.ts'),
            templateData
          );

          // State management (context API ou Redux)
          generator.fs.copyTpl(
            generator.templatePath(`${sourcePath}/src/store/index.ts.ejs`),
            generator.destinationPath('frontend/src/store/index.ts'),
            templateData
          );

          // Pages d'authentification si l'authentification est activée
          if (templateData.includeAuth) {
            ensureDirectoryExists(generator, "frontend/src/pages/Auth");

            generator.fs.copyTpl(
              generator.templatePath(`${sourcePath}/src/pages/Auth/Login.tsx.ejs`),
              generator.destinationPath('frontend/src/pages/Auth/Login.tsx'),
              templateData
            );

            generator.fs.copyTpl(
              generator.templatePath(`${sourcePath}/src/pages/Auth/Register.tsx.ejs`),
              generator.destinationPath('frontend/src/pages/Auth/Register.tsx'),
              templateData
            );

            generator.fs.copyTpl(
              generator.templatePath(`${sourcePath}/src/pages/Auth/ResetPassword.tsx.ejs`),
              generator.destinationPath('frontend/src/pages/Auth/ResetPassword.tsx'),
              templateData
            );

            // Ajouter le store pour l'authentification
            generator.fs.copyTpl(
              generator.templatePath(`${sourcePath}/src/store/slices/authSlice.ts.ejs`),
              generator.destinationPath('frontend/src/store/slices/authSlice.ts'),
              templateData
            );

            generator.fs.copyTpl(
              generator.templatePath(`${sourcePath}/src/store/slices/userSlice.ts.ejs`),
              generator.destinationPath('frontend/src/store/slices/userSlice.ts'),
              templateData
            );
          }

        } else if (frontendType === 'vue.js' || frontendType === 'vue') {
          // Fichiers spécifiques à Vue
          generator.fs.copyTpl(
            generator.templatePath(`${sourcePath}/index.html.ejs`),
            generator.destinationPath('frontend/index.html'),
            templateData
          );

          // Autres fichiers Vue...
        }

        generator.log(chalk.green(`✅ Configuration frontend ${frontendType} générée avec succès!`));
      }
    } else if (frontendType === 'thymeleaf' || frontendType === 'jte') {
      // Pour les templates côté serveur, configurer les ressources dans le projet Spring
      ensureDirectoryExists(generator, "src/main/resources/templates");

      if (frontendType === 'thymeleaf') {
        generator.fs.copyTpl(
          generator.templatePath('frontend/thymeleaf/layouts/main.html.ejs'),
          generator.destinationPath('src/main/resources/templates/layouts/main.html'),
          templateData
        );

        generator.fs.copyTpl(
          generator.templatePath('frontend/thymeleaf/pages/home.html.ejs'),
          generator.destinationPath('src/main/resources/templates/home.html'),
          templateData
        );
      }

      generator.log(chalk.green(`✅ Configuration frontend ${frontendType} générée avec succès!`));
    } else {
      generator.log(chalk.yellow(`⚠️ Pas de configuration frontend spécifique pour ${frontendType}.`));
    }
  } catch (error) {
    generator.log(chalk.red(`❌ Erreur lors de la génération du frontend: ${error}`));
    // En cas d'erreur, continuer sans bloquer la génération globale
  }
}

