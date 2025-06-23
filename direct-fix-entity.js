#!/usr/bin/env node

/**
 * Script de correction directe pour le générateur d'entités
 * Ce script modifie directement le fichier JavaScript compilé
 */

const fs = require('fs');
const path = require('path');

console.log("🔧 Correction directe du générateur d'entités");

// Chemin vers le fichier JavaScript compilé
const jsFilePath = path.join(__dirname, 'dist/generators/entity/index.js');
const backupPath = path.join(__dirname, 'dist/generators/entity/index.js.bak');

// Vérifier que le fichier existe
if (!fs.existsSync(jsFilePath)) {
  console.error(`❌ Fichier introuvable: ${jsFilePath}`);
  process.exit(1);
}

// Créer une sauvegarde
console.log(`📋 Création d'une sauvegarde: ${backupPath}`);
fs.copyFileSync(jsFilePath, backupPath);

// Lire le contenu du fichier
console.log(`📄 Lecture du fichier: ${jsFilePath}`);
let content = fs.readFileSync(jsFilePath, 'utf8');

// Fonction simple qui remplace la méthode writing par une version fonctionnelle
function patchWritingMethod(fileContent) {
  console.log("🔍 Recherche de la méthode writing()...");

  // On cherche le début de la méthode writing
  const writingMethodRegex = /async\s+writing\(\)\s*{/;
  const match = fileContent.match(writingMethodRegex);

  if (!match) {
    console.error("❌ Méthode writing() non trouvée dans le fichier");
    return fileContent;
  }

  console.log("✓ Méthode writing() trouvée");
  const writingMethodStartIndex = match.index;

  // Trouver la fin de la méthode writing
  let braceCount = 0;
  let writingMethodEndIndex = writingMethodStartIndex;
  let insideMethod = false;

  for (let i = writingMethodStartIndex; i < fileContent.length; i++) {
    const char = fileContent[i];

    if (char === '{') {
      braceCount++;
      insideMethod = true;
    } else if (char === '}') {
      braceCount--;
    }

    if (insideMethod && braceCount === 0) {
      writingMethodEndIndex = i + 1;
      break;
    }
  }

  console.log(`📌 Méthode writing() localisée de l'index ${writingMethodStartIndex} à ${writingMethodEndIndex}`);

  // Nouvelle implémentation de la méthode writing
  const fixedWritingMethod = `async writing() {
    try {
      console.log("[PATCHED] Using fixed writing() method");
      
      // S'assurer que les champs sont bien définis
      if (!this.entityFields || this.entityFields.length === 0) {
        this.log(chalk.yellow("[DEBUG] writing() - Appel de askForFields() car aucun champ défini"));
        await this.askForFields();
      }

      // Extraire et sécuriser les valeurs importantes
      const entityName = this.answers.entityName || 'Example';
      const packageName = this.answers.packageName || 'com.example.fullstack';
      this.log(chalk.yellow('[DEBUG] Utilisation du package: ' + packageName));

      // Définir directement les packages
      const entityPackage = packageName + '.entity';
      const repositoryPackage = packageName + '.repository';
      const servicePackage = packageName + '.service';
      const controllerPackage = packageName + '.controller';
      const dtoPackage = packageName + '.dto';

      // Générer les chemins des répertoires
      const basePath = "src/main/java";
      const entityPath = entityPackage.replace(/\\./g, '/');
      const repositoryPath = repositoryPackage.replace(/\\./g, '/');
      const servicePath = servicePackage.replace(/\\./g, '/');
      const controllerPath = controllerPackage.replace(/\\./g, '/');
      const dtoPath = dtoPackage.replace(/\\./g, '/');

      // Chemins complets des répertoires
      const entityDir = path.join(basePath, entityPath);
      const repositoryDir = path.join(basePath, repositoryPath);
      const serviceDir = path.join(basePath, servicePath);
      const controllerDir = path.join(basePath, controllerPath);
      const dtoDir = path.join(basePath, dtoPath);

      this.log(chalk.yellow('[DEBUG] Répertoires générés:'));
      this.log(chalk.yellow('  - entityDir: ' + entityDir));

      // Création des répertoires avec fs.mkdirSync directement
      const ensureDirExists = (dir) => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          this.log(chalk.yellow('📁 Création du répertoire: ' + dir));
        } else {
          this.log(chalk.yellow('📁 Répertoire existe déjà: ' + dir));
        }
      };

      // Créer les répertoires nécessaires
      ensureDirExists(entityDir);
      if (this.answers.generateRepository) ensureDirExists(repositoryDir);
      if (this.answers.generateService) ensureDirExists(serviceDir);
      if (this.answers.generateController) ensureDirExists(controllerDir);
      if (this.answers.generateDto) ensureDirExists(dtoDir);

      // Trouver les chemins des templates
      const templatesDir = path.join(__dirname, 'templates');
      const entityTemplate = path.join(templatesDir, 'Entity.java.ejs');
      const repositoryTemplate = path.join(templatesDir, 'Repository.java.ejs');
      const serviceTemplate = path.join(templatesDir, 'Service.java.ejs');
      const serviceImplTemplate = path.join(templatesDir, 'ServiceImpl.java.ejs');
      const controllerTemplate = path.join(templatesDir, 'Controller.java.ejs');
      const dtoTemplate = path.join(templatesDir, 'EntityDTO.java.ejs');

      this.log(chalk.yellow('[DEBUG] Templates - chemins directs:'));
      this.log(chalk.yellow('  - templatesDir: ' + templatesDir));
      this.log(chalk.yellow('  - entityTemplate: ' + entityTemplate));

      // Préparer les données pour les templates
      const templateData = {
        entityName,
        packageName: entityPackage,
        fields: this.entityFields,
        auditable: this.answers.auditable,
        dateTimeImport: this.hasDateTimeFields(),
        bigDecimalImport: this.hasBigDecimalFields(),
      };

      this.log("");
      this.log(chalk.blue("➤ ") + chalk.bold("GÉNÉRATION DES FICHIERS"));
      this.log(chalk.gray("────────────────────────────────────────────"));

      // Générer les fichiers directement avec copyTpl
      try {
        // Entity
        this.fs.copyTpl(
          entityTemplate,
          this.destinationPath(path.join(entityDir, entityName + '.java')),
          templateData
        );
        this.log(chalk.green('✅ Entité ' + entityName + '.java générée'));

        // Repository
        if (this.answers.generateRepository) {
          this.fs.copyTpl(
            repositoryTemplate,
            this.destinationPath(path.join(repositoryDir, entityName + 'Repository.java')),
            {
              ...templateData,
              packageName: repositoryPackage,
              entityPackageName: entityPackage
            }
          );
          this.log(chalk.green('✅ Repository ' + entityName + 'Repository.java généré'));
        }

        // Service
        if (this.answers.generateService) {
          this.fs.copyTpl(
            serviceTemplate,
            this.destinationPath(path.join(serviceDir, entityName + 'Service.java')),
            {
              ...templateData,
              packageName: servicePackage,
              entityPackageName: entityPackage,
              repositoryPackageName: repositoryPackage
            }
          );
          this.fs.copyTpl(
            serviceImplTemplate,
            this.destinationPath(path.join(serviceDir, entityName + 'ServiceImpl.java')),
            {
              ...templateData,
              packageName: servicePackage,
              entityPackageName: entityPackage,
              repositoryPackageName: repositoryPackage
            }
          );
          this.log(chalk.green('✅ Service ' + entityName + 'Service.java et implémentation générés'));
        }

        // Controller
        if (this.answers.generateController) {
          this.fs.copyTpl(
            controllerTemplate,
            this.destinationPath(path.join(controllerDir, entityName + 'Controller.java')),
            {
              ...templateData,
              packageName: controllerPackage,
              entityPackageName: entityPackage,
              servicePackageName: servicePackage,
              dtoPackageName: dtoPackage,
              useDto: this.answers.generateDto,
              entityNamePlural: pluralize(entityName),
              entityNameLower: entityName.charAt(0).toLowerCase() + entityName.slice(1)
            }
          );
          this.log(chalk.green('✅ Controller ' + entityName + 'Controller.java généré'));
        }

        // DTO
        if (this.answers.generateDto) {
          this.fs.copyTpl(
            dtoTemplate,
            this.destinationPath(path.join(dtoDir, entityName + 'DTO.java')),
            {
              ...templateData,
              packageName: dtoPackage,
              entityPackageName: entityPackage
            }
          );
          this.log(chalk.green('✅ DTO ' + entityName + 'DTO.java généré'));
        }

        this.log("");
        this.log(chalk.green('✅ Génération de l\\'entité ' + entityName + ' et de ses composants terminée avec succès!'));
      } catch (error) {
        this.log(chalk.red('❌ Erreur lors de la génération des fichiers: ' + error));
        if (error.stack) {
          this.log(chalk.red('Stack trace: ' + error.stack));
        }
      }
    } catch (error) {
      this.log(chalk.red('❌ Erreur lors de la génération des fichiers: ' + error));
      if (error.stack) {
        this.log(chalk.red('Stack trace: ' + error.stack));
      }
    }
  }`;

  // Remplacer la méthode originale par la version corrigée
  const newContent = fileContent.substring(0, writingMethodStartIndex) +
                     fixedWritingMethod +
                     fileContent.substring(writingMethodEndIndex);

  console.log("✅ Méthode writing() remplacée avec succès");
  return newContent;
}

// Application du patch
console.log("🔧 Application du patch...");
let patchedContent = patchWritingMethod(content);
fs.writeFileSync(jsFilePath, patchedContent);

console.log("✅ Patch appliqué avec succès");
console.log("🚀 Vous pouvez maintenant tester la commande 'sfs e'");
