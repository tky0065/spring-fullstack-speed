/**
 * Utilitaires pour la génération de fichiers
 */
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { ensureDirectoryExists } from './files.js';
import { renderString, renderTemplate } from './template-engine.js';
import { GlobalConfig } from './config.js';

/**
 * Options pour la génération d'un fichier
 */
export interface GenerateFileOptions {
  /** Chemin du template source */
  templatePath: string;
  /** Chemin de destination */
  destinationPath: string;
  /** Contexte pour le rendu du template */
  context: Record<string, any>;
  /** Si true, écrase le fichier s'il existe déjà */
  force?: boolean;
  /** Si true, ne génère pas le fichier s'il existe déjà et affiche un avertissement */
  skipIfExists?: boolean;
  /** Si true, applique le template également au nom du fichier */
  processDestinationPath?: boolean;
}

/**
 * Génère un fichier à partir d'un template
 * @param options Options pour la génération
 * @returns true si le fichier a été généré, false sinon
 */
export function generateFile(options: GenerateFileOptions): boolean {
  const {
    templatePath,
    destinationPath,
    context,
    force = false,
    skipIfExists = false,
    processDestinationPath = false
  } = options;

  // Traite le chemin de destination si nécessaire
  const finalDestPath = processDestinationPath
    ? renderString(destinationPath, context)
    : destinationPath;

  // Vérifie si le fichier existe déjà
  if (fs.existsSync(finalDestPath)) {
    if (skipIfExists) {
      console.log(chalk.yellow(`Le fichier ${finalDestPath} existe déjà, génération ignorée.`));
      return false;
    } else if (!force) {
      throw new Error(`Le fichier ${finalDestPath} existe déjà. Utilisez l'option 'force' pour l'écraser.`);
    }
  }

  try {
    // Crée le répertoire parent si nécessaire
    const dirPath = path.dirname(finalDestPath);
    ensureDirectoryExists(dirPath);

    // Rend le template et écrit le fichier
    const renderedContent = renderTemplate(templatePath, context);
    fs.writeFileSync(finalDestPath, renderedContent);

    console.log(chalk.green(`Fichier généré avec succès: ${finalDestPath}`));
    return true;
  } catch (error) {
    console.error(chalk.red(`Erreur lors de la génération du fichier ${finalDestPath}:`));
    console.error(error);
    throw error;
  }
}

/**
 * Options pour la génération d'une structure de fichiers
 */
export interface GenerateStructureOptions {
  /** Dossier source des templates */
  templateRoot: string;
  /** Dossier de destination racine */
  destinationRoot: string;
  /** Contexte pour le rendu des templates */
  context: Record<string, any>;
  /** Si true, écrase les fichiers s'ils existent déjà */
  force?: boolean;
  /** Liste de fichiers/dossiers à ignorer (relatifs à templateRoot) */
  ignore?: string[];
  /** Si true, applique le template aux noms des fichiers/dossiers */
  processDestinationPaths?: boolean;
}

/**
 * Génère une structure de fichiers à partir d'un dossier de templates
 * @param options Options pour la génération
 * @returns Nombre de fichiers générés
 */
export function generateStructure(options: GenerateStructureOptions): number {
  const {
    templateRoot,
    destinationRoot,
    context,
    force = false,
    ignore = [],
    processDestinationPaths = false
  } = options;

  // Vérifie si le dossier source existe
  if (!fs.existsSync(templateRoot) || !fs.statSync(templateRoot).isDirectory()) {
    throw new Error(`Le dossier source ${templateRoot} n'existe pas ou n'est pas un dossier.`);
  }

  // Crée le dossier de destination racine s'il n'existe pas
  ensureDirectoryExists(destinationRoot);

  // Utilise un compteur pour suivre le nombre de fichiers générés
  let generatedFiles = 0;

  // Fonction récursive pour parcourir les dossiers
  function processDirectory(sourcePath: string, destPath: string) {
    const items = fs.readdirSync(sourcePath);

    for (const item of items) {
      // Chemin complet de l'élément source
      const sourceItemPath = path.join(sourcePath, item);

      // Chemin relatif à la racine des templates
      const relativeItemPath = path.relative(templateRoot, sourceItemPath);

      // Vérifie si l'élément doit être ignoré
      if (ignore.some(pattern => {
        // Supporte les motifs glob de base (*.ext, dir/*, etc.)
        const regexPattern = pattern
          .replace(/\./g, '\\.')   // Échappe les points
          .replace(/\*/g, '.*');   // Remplace * par .*
        return new RegExp(`^${regexPattern}$`).test(relativeItemPath);
      })) {
        continue;
      }

      // Détermine le nom de destination
      let destItemName = item;
      if (processDestinationPaths) {
        destItemName = renderString(item, context);
      }

      // Si le nom se termine par .ejs, on l'enlève pour le fichier généré
      if (destItemName.endsWith('.ejs')) {
        destItemName = destItemName.slice(0, -4);
      }

      // Chemin complet de l'élément de destination
      const destItemPath = path.join(destPath, destItemName);

      // Traitement différent selon que c'est un fichier ou un dossier
      const stats = fs.statSync(sourceItemPath);
      if (stats.isDirectory()) {
        ensureDirectoryExists(destItemPath);
        processDirectory(sourceItemPath, destItemPath);
      } else if (stats.isFile() && item.endsWith('.ejs')) {
        try {
          const fileGenerated = generateFile({
            templatePath: sourceItemPath,
            destinationPath: destItemPath,
            context,
            force,
            processDestinationPath: false, // déjà traité ci-dessus
          });

          if (fileGenerated) {
            generatedFiles++;
          }
        } catch (error) {
          console.error(chalk.yellow(`Erreur lors de la génération de ${destItemPath}, poursuite de la génération des autres fichiers.`));
          console.error(error);
        }
      } else if (stats.isFile()) {
        // Copie simple pour les fichiers non-template
        try {
          ensureDirectoryExists(path.dirname(destItemPath));
          fs.copyFileSync(sourceItemPath, destItemPath);
          console.log(chalk.blue(`Fichier copié: ${destItemPath}`));
          generatedFiles++;
        } catch (error) {
          console.error(chalk.yellow(`Erreur lors de la copie de ${destItemPath}.`));
          console.error(error);
        }
      }
    }
  }

  // Lance la génération récursive
  processDirectory(templateRoot, destinationRoot);
  console.log(chalk.green(`${generatedFiles} fichiers ont été générés avec succès.`));

  return generatedFiles;
}

/**
 * Fonction utilitaire pour générer un fichier source Java à partir d'un template
 * Gère automatiquement le package et les chemins
 */
export function generateJavaSource(options: {
  templatePath: string;
  className: string;
  packageName: string;
  outputDir: string;
  context: GlobalConfig;
  force?: boolean;
}): string {
  const { templatePath, className, packageName, outputDir, context, force = false } = options;

  // Transforme le nom du package en chemin de dossiers
  const packagePath = packageName.replace(/\./g, '/');

  // Construit le chemin de destination
  const destinationPath = path.join(outputDir, 'src/main/java', packagePath, `${className}.java`);

  // Enrichit le contexte avec la classe et le package
  const enrichedContext = {
    ...context,
    className,
    packageName,
  };

  // Génère le fichier
  generateFile({
    templatePath,
    destinationPath,
    context: enrichedContext,
    force,
  });

  return destinationPath;
}

/**
 * Fonction utilitaire pour générer un fichier de ressource à partir d'un template
 */
export function generateResource(options: {
  templatePath: string;
  resourcePath: string;
  outputDir: string;
  context: Record<string, any>;
  force?: boolean;
}): string {
  const { templatePath, resourcePath, outputDir, context, force = false } = options;

  // Construit le chemin de destination
  const destinationPath = path.join(outputDir, 'src/main/resources', resourcePath);

  // Génère le fichier
  generateFile({
    templatePath,
    destinationPath,
    context,
    force,
  });

  return destinationPath;
}

/**
 * Vérifie si un fichier généré doit être mis à jour ou ignoré
 * @param filePath Chemin du fichier à vérifier
 * @param content Nouveau contenu à comparer
 * @returns true si le fichier doit être mis à jour, false sinon
 */
export function shouldUpdateFile(filePath: string, content: string): boolean {
  if (!fs.existsSync(filePath)) {
    return true;
  }

  const existingContent = fs.readFileSync(filePath, 'utf8');
  return existingContent !== content;
}

/**
 * Identifie le type d'un fichier pour déterminer les règles de génération spécifiques
 */
export function identifyFileType(filePath: string): 'java' | 'resource' | 'frontend' | 'config' | 'other' {
  if (filePath.endsWith('.java')) {
    return 'java';
  } else if ((filePath.includes('/resources/') && !filePath.match(/\/resources\/static\/(js|css)\//)) ||
             filePath.endsWith('.properties') ||
             filePath.endsWith('.yml')) {
    return 'resource';
  } else if (filePath.includes('/frontend/') ||
             filePath.includes('/resources/static/js/') ||
             filePath.includes('/resources/static/css/') ||
             filePath.endsWith('.js') ||
             filePath.endsWith('.jsx') ||
             filePath.endsWith('.ts') ||
             filePath.endsWith('.tsx') ||
             filePath.endsWith('.vue') ||
             filePath.endsWith('.html') ||
             filePath.endsWith('.css')) {
    return 'frontend';
  } else if (filePath.includes('/config/') ||
             filePath.endsWith('.xml') ||
             filePath.endsWith('.json') ||
             filePath.endsWith('.conf')) {
    return 'config';
  } else {
    return 'other';
  }
}
