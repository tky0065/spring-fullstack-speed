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

    // Créer les répertoires nécessaires
    ensureDirectoryExists(generator, `${mainPath}/security`);
    ensureDirectoryExists(generator, `${mainPath}/security/jwt`);
    ensureDirectoryExists(generator, `${mainPath}/controller`);
    ensureDirectoryExists(generator, `${mainPath}/dto`);
    ensureDirectoryExists(generator, `${mainPath}/entity`);

    // Copier les fichiers de sécurité communs
    generator.fs.copyTpl(
      generator.templatePath('src/main/java/com/example/app/security/SecurityConfig.java.ejs'),
      generator.destinationPath(`${mainPath}/security/SecurityConfig.java`),
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

      generator.fs.copyTpl(
        generator.templatePath('src/main/java/com/example/app/controller/AuthController.java.ejs'),
        generator.destinationPath(`${mainPath}/controller/AuthController.java`),
        templateData
      );

      // Ajouter la classe AuthEntryPointJwt qui était manquante
      generator.fs.copyTpl(
        generator.templatePath('src/main/java/com/example/app/security/AuthEntryPointJwt.java.ejs'),
        generator.destinationPath(`${mainPath}/security/AuthEntryPointJwt.java`),
        templateData
      );

      // Ajouter le service UserDetailsServiceImpl pour JWT
      generator.fs.copyTpl(
        generator.templatePath('src/main/java/com/example/app/security/UserDetailsServiceImpl.java.ejs'),
        generator.destinationPath(`${mainPath}/security/UserDetailsServiceImpl.java`),
        templateData
      );

      // DTOs pour l'authentification
      generator.fs.copyTpl(
        generator.templatePath('src/main/java/com/example/app/dto/AuthenticationRequest.java.ejs'),
        generator.destinationPath(`${mainPath}/dto/AuthenticationRequest.java`),
        templateData
      );

      generator.fs.copyTpl(
        generator.templatePath('src/main/java/com/example/app/dto/AuthenticationResponse.java.ejs'),
        generator.destinationPath(`${mainPath}/dto/AuthenticationResponse.java`),
        templateData
      );

      generator.fs.copyTpl(
        generator.templatePath('src/main/java/com/example/app/dto/RegisterRequest.java.ejs'),
        generator.destinationPath(`${mainPath}/dto/RegisterRequest.java`),
        templateData
      );

      // Ajouter le DTO UserDto
      generator.fs.copyTpl(
        generator.templatePath('src/main/java/com/example/app/dto/UserDto.java.ejs'),
        generator.destinationPath(`${mainPath}/dto/UserDto.java`),
        templateData
      );

      // Repositories
      ensureDirectoryExists(generator, `${mainPath}/repository`);
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
    }

    // Entité User
    generator.fs.copyTpl(
      generator.templatePath('src/main/java/com/example/app/entity/User.java.ejs'),
      generator.destinationPath(`${mainPath}/entity/User.java`),
      templateData
    );

    generator.fs.copyTpl(
      generator.templatePath('src/main/java/com/example/app/entity/Role.java.ejs'),
      generator.destinationPath(`${mainPath}/entity/Role.java`),
      templateData
    );

    generator.log(chalk.green(`✅ Configuration d'authentification générée avec succès!`));
  } catch (error) {
    generator.log(chalk.red(`❌ Erreur lors de la génération des fichiers d'authentification: ${error}`));
    // En cas d'erreur, continuer sans bloquer la génération globale
  }
}
