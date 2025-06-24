import { TemplateData } from './generator-methods.js';
import { ensureDirectoryExists } from './ensure-dir-exists.js';
import chalk from 'chalk';

/**
 * Génère les fichiers pour l'authentification
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
export function generateAuth(generator: any, templateData: TemplateData) {
  if (!templateData.includeAuth) {
    return; // Ne rien faire si l'authentification n'est pas demandée
  }

  generator.log(chalk.blue(`Génération des fichiers d'authentification (${templateData.authType || 'JWT'})...`));

  try {
    const mainPath = `src/main/java/${templateData.javaPackagePath}`;

    console.log(`Main path for auth generation: ${mainPath}`);

    // Créer les répertoires nécessaires
    ensureDirectoryExists(generator, `${mainPath}/security`);
    ensureDirectoryExists(generator, `${mainPath}/security/jwt`);
    ensureDirectoryExists(generator, `${mainPath}/security/model`);
    ensureDirectoryExists(generator, `${mainPath}/security/service`);
    ensureDirectoryExists(generator, `${mainPath}/security/config`);
    ensureDirectoryExists(generator, `${mainPath}/controller`);
    ensureDirectoryExists(generator, `${mainPath}/dto`);
    ensureDirectoryExists(generator, `${mainPath}/entity`);
    ensureDirectoryExists(generator, `${mainPath}/repository`);
    ensureDirectoryExists(generator, `${mainPath}/exception`);
    ensureDirectoryExists(generator, `${mainPath}/util`);

    // Copier les fichiers de sécurité communs
    generator.fs.copyTpl(
      generator.templatePath('src/main/java/com/example/app/security/SecurityConfig.java.ejs'),
      generator.destinationPath(`${mainPath}/security/config/WebSecurityConfig.java`),
      templateData
    );

    // Copier tous les controllers disponibles
    const controllerFiles = [
      'AuthController.java.ejs',
      'DashboardController.java.ejs',
      'ExampleController.java.ejs',
      'PaginatedUserController.java.ejs',
      'SecurityController.java.ejs'
    ];

    controllerFiles.forEach(file => {
      try {
        generator.fs.copyTpl(
          generator.templatePath(`src/main/java/com/example/app/controller/${file}`),
          generator.destinationPath(`${mainPath}/controller/${file.replace('.ejs', '')}`),
          templateData
        );
      } catch (error) {
        // Si un fichier spécifique a un problème, ne pas arrêter le processus complet
        generator.log(chalk.yellow(`⚠️ Impossible de copier le controller ${file}: ${error}`));
      }
    });

    // Générer les modèles User et Role dans security/model
    generator.fs.copyTpl(
      generator.templatePath('src/main/java/com/example/app/entity/User.java.ejs'),
      generator.destinationPath(`${mainPath}/security/model/User.java`),
      templateData
    );

    generator.fs.copyTpl(
      generator.templatePath('src/main/java/com/example/app/entity/Role.java.ejs'),
      generator.destinationPath(`${mainPath}/security/model/Role.java`),
      templateData
    );

    // Générer les entités exemples
    try {
      if (templateData.database === 'MongoDB') {
        generator.fs.copyTpl(
          generator.templatePath('src/main/java/com/example/app/entity/MongoExample.java.ejs'),
          generator.destinationPath(`${mainPath}/entity/Example.java`),
          templateData
        );
      } else {
        generator.fs.copyTpl(
          generator.templatePath('src/main/java/com/example/app/entity/Example.java.ejs'),
          generator.destinationPath(`${mainPath}/entity/Example.java`),
          templateData
        );
      }
    } catch (error) {
      generator.log(chalk.yellow(`⚠️ Impossible de générer l'entité Example: ${error}`));
    }

    // Générer les repositories pour User et Role
    generator.fs.copyTpl(
      generator.templatePath('src/main/java/com/example/app/repository/UserRepository.java.ejs'),
      generator.destinationPath(`${mainPath}/repository/UserRepository.java`),
      templateData
    );

    generator.fs.copyTpl(
      generator.templatePath('src/main/java/com/example/app/repository/RoleRepository.java.ejs'),
      generator.destinationPath(`${mainPath}/repository/RoleRepository.java`),
      templateData
    );

    // Ajouter le service d'authentification
    generator.fs.copyTpl(
      generator.templatePath('src/main/java/com/example/app/security/AuthEntryPointJwt.java.ejs'),
      generator.destinationPath(`${mainPath}/security/AuthEntryPointJwt.java`),
      templateData
    );

    // Pour JWT (par défaut ou si spécifié)
    if (!templateData.authType || templateData.authType === 'JWT') {
      // Utiliser directement les templates sans le préfixe 'src/main/java/com/example/app/'
      generator.fs.copyTpl(
        generator.templatePath('src/main/java/com/example/app/security/jwt/JwtTokenProvider.java.ejs'),
        generator.destinationPath(`${mainPath}/security/jwt/JwtTokenProvider.java`),
        templateData
      );

      generator.fs.copyTpl(
        generator.templatePath('src/main/java/com/example/app/security/jwt/JwtAuthenticationFilter.java.ejs'),
        generator.destinationPath(`${mainPath}/security/jwt/JwtAuthenticationFilter.java`),
        templateData
      );

      // Ajouter le service JwtUtils
      generator.fs.copyTpl(
        generator.templatePath('src/main/java/com/example/app/security/jwt/JwtUtils.java.ejs'),
        generator.destinationPath(`${mainPath}/security/service/JwtUtils.java`),
        templateData
      );

      // DTOs pour l'authentification - Copier tous les DTOs disponibles
      const dtoFiles = [
        'AuthenticationRequest.java.ejs',
        'AuthenticationResponse.java.ejs',
        'RegisterRequest.java.ejs',
        'UserDto.java.ejs'
      ];

      dtoFiles.forEach(file => {
        try {
          generator.fs.copyTpl(
            generator.templatePath(`src/main/java/com/example/app/dto/${file}`),
            generator.destinationPath(`${mainPath}/dto/${file.replace('.ejs', '')}`),
            templateData
          );
        } catch (error) {
          generator.log(chalk.yellow(`⚠️ Impossible de copier le DTO ${file}: ${error}`));
        }
      });

      // Ajouter le service UserDetailsServiceImpl pour JWT
      generator.fs.copyTpl(
        generator.templatePath('src/main/java/com/example/app/security/UserDetailsServiceImpl.java.ejs'),
        generator.destinationPath(`${mainPath}/security/UserDetailsServiceImpl.java`),
        templateData
      );

      // Ajouter le gestionnaire global d'exceptions
      generator.fs.copyTpl(
        generator.templatePath('src/main/java/com/example/app/exception/GlobalExceptionHandler.java.ejs'),
        generator.destinationPath(`${mainPath}/exception/GlobalExceptionHandler.java`),
        templateData
      );

      // Ajouter les classes utilitaires
      const utilFiles = [
        'SecurityUtils.java.ejs',
        'ApiError.java.ejs',
        'DateTimeUtils.java.ejs',
        'LazyLoadingUtil.java.ejs',
        'AppUtils.java.ejs',
        'LoggingUtils.java.ejs',
        'StringUtils.java.ejs',
        'PaginationUtil.java.ejs',
        'OptimizedQueryUtil.java.ejs'
      ];

      utilFiles.forEach(utilFile => {
        generator.fs.copyTpl(
          generator.templatePath(`src/main/java/com/example/app/util/${utilFile}`),
          generator.destinationPath(`${mainPath}/util/${utilFile.replace('.ejs', '')}`),
          templateData
        );
      });

      // Si OAuth2 est activé, ajouter la configuration et les services nécessaires
      if (templateData.oauth2Enabled) {
        ensureDirectoryExists(generator, `${mainPath}/security/oauth2`);

        // Copier les fichiers OAuth2
        generator.fs.copyTpl(
          generator.templatePath('src/main/java/com/example/app/security/oauth2/CustomOAuth2UserService.java.ejs'),
          generator.destinationPath(`${mainPath}/security/oauth2/CustomOAuth2UserService.java`),
          templateData
        );

        generator.fs.copyTpl(
          generator.templatePath('src/main/java/com/example/app/security/oauth2/OAuth2AuthenticationSuccessHandler.java.ejs'),
          generator.destinationPath(`${mainPath}/security/oauth2/OAuth2AuthenticationSuccessHandler.java`),
          templateData
        );

        generator.fs.copyTpl(
          generator.templatePath('src/main/java/com/example/app/security/oauth2/OAuth2AuthenticationFailureHandler.java.ejs'),
          generator.destinationPath(`${mainPath}/security/oauth2/OAuth2AuthenticationFailureHandler.java`),
          templateData
        );

        generator.fs.copyTpl(
          generator.templatePath('src/main/java/com/example/app/security/oauth2/OAuth2UserInfo.java.ejs'),
          generator.destinationPath(`${mainPath}/security/oauth2/OAuth2UserInfo.java`),
          templateData
        );

        generator.fs.copyTpl(
          generator.templatePath('src/main/java/com/example/app/security/oauth2/OAuth2UserInfoFactory.java.ejs'),
          generator.destinationPath(`${mainPath}/security/oauth2/OAuth2UserInfoFactory.java`),
          templateData
        );

        // Copier les implémentations spécifiques des providers
        generator.fs.copyTpl(
          generator.templatePath('src/main/java/com/example/app/security/oauth2/GoogleOAuth2UserInfo.java.ejs'),
          generator.destinationPath(`${mainPath}/security/oauth2/GoogleOAuth2UserInfo.java`),
          templateData
        );

        generator.fs.copyTpl(
          generator.templatePath('src/main/java/com/example/app/security/oauth2/FacebookOAuth2UserInfo.java.ejs'),
          generator.destinationPath(`${mainPath}/security/oauth2/FacebookOAuth2UserInfo.java`),
          templateData
        );

        generator.fs.copyTpl(
          generator.templatePath('src/main/java/com/example/app/security/oauth2/GithubOAuth2UserInfo.java.ejs'),
          generator.destinationPath(`${mainPath}/security/oauth2/GithubOAuth2UserInfo.java`),
          templateData
        );
      }
    }

    generator.log(chalk.green("✅ Fichiers d'authentification générés avec succès!"));
  } catch (error) {
    generator.log(chalk.red(`❌ Erreur lors de la génération des fichiers d'authentification: ${error}`));
    // En cas d'erreur, continuer sans bloquer la génération globale
  }
}
