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
    ensureDirectoryExists(generator, `${mainPath}/controller`);
    ensureDirectoryExists(generator, `${mainPath}/dto`);
    ensureDirectoryExists(generator, `${mainPath}/entity`);
    ensureDirectoryExists(generator, `${mainPath}/repository`);
    ensureDirectoryExists(generator, `${mainPath}/exception`);
    ensureDirectoryExists(generator, `${mainPath}/util`);
    ensureDirectoryExists(generator, `${mainPath}/audit`); // Ajout du répertoire pour les audits

    // Pour JWT (par défaut ou si spécifié)
    if (!templateData.authType || templateData.authType === 'JWT') {
      // Créer les répertoires spécifiques à JWT
      ensureDirectoryExists(generator, `${mainPath}/security/jwt`);
      ensureDirectoryExists(generator, `${mainPath}/security/model`);
      ensureDirectoryExists(generator, `${mainPath}/security/service`);
      ensureDirectoryExists(generator, `${mainPath}/security/config`);

      // Copier les fichiers de sécurité communs
      generator.fs.copyTpl(
        generator.templatePath('src/main/java/com/example/app/config/BasicSecurityConfig.java.ejs'),
        generator.destinationPath(`${mainPath}/security/config/BasicSecurityConfig.java`),
        templateData
      );

      // Copier uniquement le contrôleur d'authentification
      generator.fs.copyTpl(
        generator.templatePath('src/main/java/com/example/app/controller/AuthController.java.ejs'),
        generator.destinationPath(`${mainPath}/controller/AuthController.java`),
        templateData
      );

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
        try {
          generator.fs.copyTpl(
            generator.templatePath(`src/main/java/com/example/app/util/${utilFile}`),
            generator.destinationPath(`${mainPath}/util/${utilFile.replace('.ejs', '')}`),
            templateData
          );
        } catch (error) {
          generator.log(chalk.yellow(`⚠️ Impossible de copier le fichier utilitaire ${utilFile}: ${error}`));
        }
      });
    }

    // Si OAuth2 est explicitement activé
    if (templateData.authType === 'OAuth2' || templateData.authType === 'JWT+OAuth2') {
      ensureDirectoryExists(generator, `${mainPath}/security/oauth2`);

      // Copier les fichiers OAuth2
      const oauth2Files = [
        'CustomOAuth2UserService.java.ejs',
        'OAuth2AuthenticationSuccessHandler.java.ejs',
        'OAuth2AuthenticationFailureHandler.java.ejs',
        'OAuth2UserInfo.java.ejs',
        'OAuth2UserInfoFactory.java.ejs',
        'GoogleOAuth2UserInfo.java.ejs',
        'FacebookOAuth2UserInfo.java.ejs',
        'GithubOAuth2UserInfo.java.ejs'
      ];

      oauth2Files.forEach(file => {
        try {
          generator.fs.copyTpl(
            generator.templatePath(`src/main/java/com/example/app/security/oauth2/${file}`),
            generator.destinationPath(`${mainPath}/security/oauth2/${file.replace('.ejs', '')}`),
            templateData
          );
        } catch (error) {
          generator.log(chalk.yellow(`⚠️ Impossible de copier le fichier OAuth2 ${file}: ${error}`));
        }
      });

      // Ajouter la configuration OAuth2 dans application.yml
      try {
        generator.fs.copyTpl(
          generator.templatePath('src/main/resources/oauth2.yml.ejs'),
          generator.destinationPath('src/main/resources/oauth2.yml'),
          templateData
        );
      } catch (error) {
        generator.log(chalk.yellow('⚠️ Impossible de générer la configuration OAuth2: ' + error));
      }
    }

    // Générer les entités exemples - uniquement si une base de données est configurée
    if (templateData.database && templateData.database !== 'Aucune') {
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
    }

    // Ajouter les fichiers d'audit
    try {
      // Copier les fichiers d'audit
      const auditFiles = [
        'SecurityEvent.java.ejs'
      ];

      auditFiles.forEach(file => {
        try {
          generator.fs.copyTpl(
            generator.templatePath(`src/main/java/com/example/app/audit/${file}`),
            generator.destinationPath(`${mainPath}/audit/${file.replace('.ejs', '')}`),
            templateData
          );
        } catch (error) {
          generator.log(chalk.yellow(`⚠️ Impossible de copier le fichier d'audit ${file}: ${error}`));
        }
      });

      // Copier le repository d'événement de sécurité
      try {
        generator.fs.copyTpl(
          generator.templatePath('src/main/java/com/example/app/repository/SecurityEventRepository.java.ejs'),
          generator.destinationPath(`${mainPath}/repository/SecurityEventRepository.java`),
          templateData
        );
      } catch (error) {
        generator.log(chalk.yellow(`⚠️ Impossible de copier le fichier SecurityEventRepository: ${error}`));
      }

    } catch (error) {
      generator.log(chalk.yellow(`⚠️ Impossible de générer les fichiers d'audit: ${error}`));
    }

    generator.log(chalk.green('✅ Configuration de sécurité générée avec succès.'));

  } catch (error) {
    generator.log(chalk.red(`❌ Erreur lors de la génération des fichiers d'authentification: ${error}`));
    // Afficher la trace complète de l'erreur en mode debug
    if (process.env.DEBUG) {
      console.error(error);
    }
  }
}
