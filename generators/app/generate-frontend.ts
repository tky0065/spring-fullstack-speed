import { TemplateData } from './generator-methods.js';
import chalk from 'chalk';
import { ensureDirectoryExists } from './ensure-dir-exists.js';
import fs from 'fs';

/**
 * Génère les fichiers pour le frontend sélectionné
 * @param generator Référence au générateur
 * @param templateData Les données pour la génération
 */
export function generateFrontend(generator: any, templateData: TemplateData) {
  generator.log(chalk.blue(`Génération des fichiers frontend (${templateData.frontendFramework})...`));

  try {
    const frontendType = templateData.frontendFramework.toLowerCase();

    // Gestion spécifique pour JTE (moteur de template Java)
    if (frontendType === 'jte') {
      generator.log(chalk.blue(`Configuration du moteur de template JTE...`));

      // Créer la structure de dossiers pour JTE
      ensureDirectoryExists(generator, "src/main/jte");

      // Créer le fichier .jteroot vide dans le dossier src/main/jte
      fs.writeFileSync(generator.destinationPath('src/main/jte/.jteroot'), '');

      generator.log(chalk.green(`Structure de dossiers JTE créée avec succès.`));
    }

    if (frontendType === 'react' || frontendType === 'vue.js' || frontendType === 'vue' || frontendType === 'angular') {
      // Créer le répertoire frontend
      ensureDirectoryExists(generator, "frontend");
      ensureDirectoryExists(generator, "frontend/src");

      const sourcePath = frontendType === 'react'
        ? 'frontend/react'
        : (frontendType === 'vue.js' || frontendType === 'vue')
          ? 'frontend/vue'
          : frontendType === 'angular'
            ? 'frontend/angular'
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

          // Fichier principal de l'application
          generator.fs.copyTpl(
            generator.templatePath(`${sourcePath}/src/App.tsx.ejs`),
            generator.destinationPath('frontend/src/App.tsx'),
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

          // Configuration Vite pour Vue
          generator.fs.copyTpl(
            generator.templatePath(`${sourcePath}/vite.config.ts.ejs`),
            generator.destinationPath('frontend/vite.config.ts'),
            templateData
          );

          // Configuration TypeScript
          generator.fs.copyTpl(
            generator.templatePath(`${sourcePath}/tsconfig.json.ejs`),
            generator.destinationPath('frontend/tsconfig.json'),
            templateData
          );

          // Fichiers principaux Vue
          generator.fs.copyTpl(
            generator.templatePath(`${sourcePath}/src/App.vue.ejs`),
            generator.destinationPath('frontend/src/App.vue'),
            templateData
          );

          generator.fs.copyTpl(
            generator.templatePath(`${sourcePath}/src/main.ts.ejs`),
            generator.destinationPath('frontend/src/main.ts'),
            templateData
          );

          // Création des répertoires nécessaires pour Vue
          ensureDirectoryExists(generator, "frontend/src/components");
          ensureDirectoryExists(generator, "frontend/src/components/ui");
          ensureDirectoryExists(generator, "frontend/src/components/navigation");
          ensureDirectoryExists(generator, "frontend/src/components/forms");
          ensureDirectoryExists(generator, "frontend/src/components/examples");
          ensureDirectoryExists(generator, "frontend/src/pages");
          ensureDirectoryExists(generator, "frontend/src/layouts");
          ensureDirectoryExists(generator, "frontend/src/router");
          ensureDirectoryExists(generator, "frontend/src/stores");
          ensureDirectoryExists(generator, "frontend/src/assets");
          ensureDirectoryExists(generator, "frontend/src/services");
          ensureDirectoryExists(generator, "frontend/src/utils");

          // Copie des composants disponibles
          const vueComponentsFiles = [
            { src: 'src/components/UsersList.vue.ejs', dest: 'frontend/src/components/UsersList.vue' },
            { src: 'src/components/ui/Alert.vue.ejs', dest: 'frontend/src/components/ui/Alert.vue' },
            { src: 'src/components/ui/Button.vue.ejs', dest: 'frontend/src/components/ui/Button.vue' },
            { src: 'src/components/ui/Card.vue.ejs', dest: 'frontend/src/components/ui/Card.vue' },
            { src: 'src/components/ui/InputField.vue.ejs', dest: 'frontend/src/components/ui/InputField.vue' },
            { src: 'src/components/navigation/Navbar.vue.ejs', dest: 'frontend/src/components/navigation/Navbar.vue' },
            { src: 'src/components/navigation/Footer.vue.ejs', dest: 'frontend/src/components/navigation/Footer.vue' },
            { src: 'src/components/forms/ContactForm.vue.ejs', dest: 'frontend/src/components/forms/ContactForm.vue' },
            { src: 'src/components/examples/ApiExample.vue.ejs', dest: 'frontend/src/components/examples/ApiExample.vue' },
          ];

          // Copie des pages et routes
          const vuePagesFiles = [
            { src: 'src/pages/Home.vue.ejs', dest: 'frontend/src/pages/Home.vue' },
            { src: 'src/pages/NotFound.vue.ejs', dest: 'frontend/src/pages/NotFound.vue' },
            { src: 'src/layouts/MainLayout.vue.ejs', dest: 'frontend/src/layouts/MainLayout.vue' },
          ];

          // Copie des fichiers de configuration et services
          const vueConfigFiles = [
            { src: 'src/router/index.ts.ejs', dest: 'frontend/src/router/index.ts' },
            { src: 'src/stores/index.ts.ejs', dest: 'frontend/src/stores/index.ts' },
            { src: 'src/services/apiConfig.ts.ejs', dest: 'frontend/src/services/apiConfig.ts' },
            { src: 'src/services/apiService.ts.ejs', dest: 'frontend/src/services/apiService.ts' },
            { src: 'src/assets/main.css.ejs', dest: 'frontend/src/assets/main.css' },
            { src: 'src/assets/base.css.ejs', dest: 'frontend/src/assets/base.css' },
            { src: 'src/utils/form-validation.ts.ejs', dest: 'frontend/src/utils/form-validation.ts' },
            { src: 'src/utils/validators.ts.ejs', dest: 'frontend/src/utils/validators.ts' },
          ];

          // Fonction pour copier les fichiers avec gestion d'erreurs
          const copyTemplateFile = (file) => {
            try {
              generator.fs.copyTpl(
                generator.templatePath(`${sourcePath}/${file.src}`),
                generator.destinationPath(file.dest),
                templateData
              );
            } catch (error) {
              generator.log(chalk.yellow(`⚠️ Impossible de copier le fichier ${file.src}: ${error}`));
            }
          };

          // Copier tous les fichiers
          vueComponentsFiles.forEach(copyTemplateFile);
          vuePagesFiles.forEach(copyTemplateFile);
          vueConfigFiles.forEach(copyTemplateFile);

          // Si authentification activée, ajouter les composants d'authentification
          if (templateData.includeAuth) {
            ensureDirectoryExists(generator, "frontend/src/pages/Auth");

            const vueAuthFiles = [
              { src: 'src/pages/Auth/Login.vue.ejs', dest: 'frontend/src/pages/Auth/Login.vue' },
              { src: 'src/pages/Auth/Register.vue.ejs', dest: 'frontend/src/pages/Auth/Register.vue' },
              { src: 'src/pages/Auth/ForgotPassword.vue.ejs', dest: 'frontend/src/pages/Auth/ForgotPassword.vue' },
              { src: 'src/pages/Auth/ResetPassword.vue.ejs', dest: 'frontend/src/pages/Auth/ResetPassword.vue' },
              { src: 'src/stores/authStore.ts.ejs', dest: 'frontend/src/stores/authStore.ts' },
              { src: 'src/stores/userStore.ts.ejs', dest: 'frontend/src/stores/userStore.ts' },
            ];

            vueAuthFiles.forEach(copyTemplateFile);
          }
        } else if (frontendType === 'angular') {
          // Fichiers spécifiques à Angular
          ensureDirectoryExists(generator, "frontend/src");
          ensureDirectoryExists(generator, "frontend/src/app");
          ensureDirectoryExists(generator, "frontend/src/assets");
          ensureDirectoryExists(generator, "frontend/src/environments");

          // Copier les fichiers de configuration Angular
          generator.fs.copyTpl(
            generator.templatePath(`${sourcePath}/angular.json.ejs`),
            generator.destinationPath('frontend/angular.json'),
            templateData
          );

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

          generator.fs.copyTpl(
            generator.templatePath(`${sourcePath}/tsconfig.app.json.ejs`),
            generator.destinationPath('frontend/tsconfig.app.json'),
            templateData
          );

          generator.fs.copyTpl(
            generator.templatePath(`${sourcePath}/tsconfig.spec.json.ejs`),
            generator.destinationPath('frontend/tsconfig.spec.json'),
            templateData
          );

          // Copier le fichier proxy.conf si disponible
          try {
            generator.fs.copyTpl(
              generator.templatePath(`${sourcePath}/proxy.conf.json.ejs`),
              generator.destinationPath('frontend/proxy.conf.json'),
              templateData
            );
          } catch (error) {
            // Fichier optionnel, ne pas bloquer si absence
          }

          // Scripts de génération d'API
          ensureDirectoryExists(generator, "frontend/scripts");
          try {
            generator.fs.copyTpl(
              generator.templatePath(`${sourcePath}/scripts/api-generate.js.ejs`),
              generator.destinationPath('frontend/scripts/api-generate.js'),
              templateData
            );

            generator.fs.copyTpl(
              generator.templatePath(`${sourcePath}/scripts/generate-api.sh.ejs`),
              generator.destinationPath('frontend/scripts/generate-api.sh'),
              templateData
            );
          } catch (error) {
            // Fichiers optionnels
          }

          // Copier les fichiers principaux de src
          generator.fs.copyTpl(
            generator.templatePath(`${sourcePath}/src/main.ts.ejs`),
            generator.destinationPath('frontend/src/main.ts'),
            templateData
          );

          generator.fs.copyTpl(
            generator.templatePath(`${sourcePath}/src/index.html.ejs`),
            generator.destinationPath('frontend/src/index.html'),
            templateData
          );

          // Copier les fichiers du dossier app
          generator.fs.copyTpl(
            generator.templatePath(`${sourcePath}/src/app/app.component.ts.ejs`),
            generator.destinationPath('frontend/src/app/app.component.ts'),
            templateData
          );

          generator.fs.copyTpl(
            generator.templatePath(`${sourcePath}/src/app/app.component.html.ejs`),
            generator.destinationPath('frontend/src/app/app.component.html'),
            templateData
          );

          generator.fs.copyTpl(
            generator.templatePath(`${sourcePath}/src/app/app.component.css.ejs`),
            generator.destinationPath('frontend/src/app/app.component.css'),
            templateData
          );

          generator.fs.copyTpl(
            generator.templatePath(`${sourcePath}/src/app/app.routes.ts.ejs`),
            generator.destinationPath('frontend/src/app/app.routes.ts'),
            templateData
          );

          // Création de la structure du dossier app
          const angularDirs = [
            "frontend/src/app/components",
            "frontend/src/app/core",
            "frontend/src/app/core/guards",
            "frontend/src/app/core/interceptors",
            "frontend/src/app/core/services",
            "frontend/src/app/features",
            "frontend/src/app/features/about",
            "frontend/src/app/features/dashboard",
            "frontend/src/app/features/home",
            "frontend/src/app/features/login",
            "frontend/src/app/models",
            "frontend/src/app/pages",
            "frontend/src/app/pages/home",
            "frontend/src/app/pages/auth",
            "frontend/src/app/pages/auth/login",
            "frontend/src/app/pages/auth/register",
            "frontend/src/app/services",
            "frontend/src/app/shared",
            "frontend/src/app/shared/components",
            "frontend/src/app/shared/components/nav-bar"
          ];

          // Création des répertoires
          angularDirs.forEach(dir => ensureDirectoryExists(generator, dir));

          // Copie des fichiers de composants depuis les templates
          const copyAngularFile = (src, dest) => {
            try {
              generator.fs.copyTpl(
                generator.templatePath(`${sourcePath}/src/app/${src}`),
                generator.destinationPath(`frontend/src/app/${dest || src}`),
                templateData
              );
            } catch (error) {
              generator.log(chalk.yellow(`⚠️ Impossible de copier le fichier ${src}: ${error}`));
            }
          };

          // Core - Guards et Interceptors
          copyAngularFile('core/guards/auth.guard.ts.ejs', 'core/guards/auth.guard.ts');
          copyAngularFile('core/guards/role.guard.ts.ejs', 'core/guards/role.guard.ts');
          copyAngularFile('core/interceptors/auth.interceptor.ts.ejs', 'core/interceptors/auth.interceptor.ts');
          copyAngularFile('core/interceptors/error.interceptor.ts.ejs', 'core/interceptors/error.interceptor.ts');
          copyAngularFile('core/services/auth.service.ts.ejs', 'core/services/auth.service.ts');

          // Features components
          copyAngularFile('features/about/about.component.ts.ejs', 'features/about/about.component.ts');
          copyAngularFile('features/about/about.component.html.ejs', 'features/about/about.component.html');
          copyAngularFile('features/about/about.component.css.ejs', 'features/about/about.component.css');

          copyAngularFile('features/dashboard/dashboard.component.ts.ejs', 'features/dashboard/dashboard.component.ts');
          copyAngularFile('features/dashboard/dashboard.component.html.ejs', 'features/dashboard/dashboard.component.html');
          copyAngularFile('features/dashboard/dashboard.component.css.ejs', 'features/dashboard/dashboard.component.css');

          copyAngularFile('features/home/home.component.ts.ejs', 'features/home/home.component.ts');
          copyAngularFile('features/home/home.component.html.ejs', 'features/home/home.component.html');
          copyAngularFile('features/home/home.component.css.ejs', 'features/home/home.component.css');

          copyAngularFile('features/login/login.component.ts.ejs', 'features/login/login.component.ts');
          copyAngularFile('features/login/login.component.html.ejs', 'features/login/login.component.html');
          copyAngularFile('features/login/login.component.css.ejs', 'features/login/login.component.css');

          // Pages
          copyAngularFile('pages/home/home.component.ts.ejs', 'pages/home/home.component.ts');
          copyAngularFile('pages/auth/login/login.component.ts.ejs', 'pages/auth/login/login.component.ts');

          // Shared components
          copyAngularFile('shared/components/nav-bar/nav-bar.component.ts.ejs', 'shared/components/nav-bar/nav-bar.component.ts');
          copyAngularFile('shared/components/nav-bar/nav-bar.component.html.ejs', 'shared/components/nav-bar/nav-bar.component.html');
          copyAngularFile('shared/components/nav-bar/nav-bar.component.css.ejs', 'shared/components/nav-bar/nav-bar.component.css');

          // Créer le fichier d'environnement si nécessaire
          ensureDirectoryExists(generator, "frontend/src/environments");
          const envContent = `export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};`;
          generator.fs.write(
            generator.destinationPath('frontend/src/environments/environment.ts'),
            envContent
          );

          const envProdContent = `export const environment = {
  production: true,
  apiUrl: '/api'
};`;
          generator.fs.write(
            generator.destinationPath('frontend/src/environments/environment.prod.ts'),
            envProdContent
          );

          generator.log(chalk.green(`✅ Configuration frontend ${frontendType} générée avec succès!`));
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
      } else if (frontendType === 'jte') {
        // Création des répertoires pour JTE dans src/main/jte
        ensureDirectoryExists(generator, "src/main/jte");
        ensureDirectoryExists(generator, "src/main/jte/layouts");
        ensureDirectoryExists(generator, "src/main/jte/pages");

        // Créer le fichier .jteroot vide dans le dossier src/main/jte
        fs.writeFileSync(generator.destinationPath('src/main/jte/.jteroot'), '');

        // Copie des templates JTE pour les layouts
        generator.fs.copyTpl(
          generator.templatePath('frontend/jte/layouts/default.jte.ejs'),
          generator.destinationPath('src/main/jte/layouts/default.jte'),
          templateData
        );

        generator.fs.copyTpl(
          generator.templatePath('frontend/jte/layouts/main.jte.ejs'),
          generator.destinationPath('src/main/jte/layouts/main.jte'),
          templateData
        );

        // Copie des templates JTE pour les pages
        generator.fs.copyTpl(
          generator.templatePath('frontend/jte/home.jte.ejs'),
          generator.destinationPath('src/main/jte/pages/home.jte'),
          templateData
        );

        // Si l'authentification est activée, ajouter les templates d'authentification
        if (templateData.includeAuth) {
          generator.fs.copyTpl(
            generator.templatePath('frontend/jte/login.jte.ejs'),
            generator.destinationPath('src/main/jte/pages/login.jte'),
            templateData
          );

          generator.fs.copyTpl(
            generator.templatePath('frontend/jte/register.jte.ejs'),
            generator.destinationPath('src/main/jte/pages/register.jte'),
            templateData
          );
        }

        // Création du contrôleur pour la gestion de la connexion et la page d'accueil
        const mainPath = `src/main/java/${templateData.javaPackagePath}`;
        ensureDirectoryExists(generator, `${mainPath}/controller`);

        const loginControllerContent = `package ${templateData.packageName}.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

/**
 * Contrôleur pour gérer les pages principales du site
 * Gère les requêtes pour la page d'accueil et les pages d'authentification
 */
@Controller
public class LoginController {

    @GetMapping("/login")
    public String login(HttpServletRequest request, Model model,
                        @RequestParam(value = "error", required = false) String error,
                        @RequestParam(value = "logout", required = false) String logout) {
        if (error != null) {
            model.addAttribute("error", true);
            model.addAttribute("errorMessage", "Nom d'utilisateur ou mot de passe invalide");
        }

        if (logout != null) {
            model.addAttribute("logout", true);
            model.addAttribute("logoutMessage", "Vous avez été déconnecté avec succès");
        }

        // Afficher la page login avec le formulaire qui soumet vers /authenticate
        model.addAttribute("loginProcessUrl", "/authenticate");
        return "pages/login";
    }

    @GetMapping({"/", "/home"})
    public String home(Model model) {
        // Ajouter des attributs au modèle si nécessaire
        model.addAttribute("pageTitle", "Accueil");
        return "pages/home";
    }
    
    @GetMapping("/register")
    public String register(Model model) {
        model.addAttribute("pageTitle", "Inscription");
        return "pages/register";
    }
}`;

        // Écriture du fichier LoginController.java
        generator.fs.write(
          generator.destinationPath(`${mainPath}/controller/LoginController.java`),
          loginControllerContent
        );

        generator.log(chalk.green(`✅ LoginController généré avec succès pour JTE`));
      }
    } else {
      generator.log(chalk.yellow(`⚠️ Pas de configuration frontend spécifique pour ${frontendType}.`));
    }
  } catch (error) {
    generator.log(chalk.red(`❌ Erreur lors de la génération du frontend: ${error}`));
    // En cas d'erreur, continuer sans bloquer la génération globale
  }
}
