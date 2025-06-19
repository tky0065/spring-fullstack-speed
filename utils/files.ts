/**
 * Utilitaires pour la manipulation des fichiers
 */
import fs from 'fs';
import path from 'path';
import { GlobalConfig } from './config.js';
import { RenderCondition, evaluateCondition } from './conditional-rendering.js';

/**
 * Vérifie si un fichier existe
 * @param filepath Chemin du fichier à vérifier
 * @returns true si le fichier existe, false sinon
 */
export function fileExists(filepath: string): boolean {
  return fs.existsSync(filepath);
}

/**
 * Lit le contenu d'un fichier
 * @param filepath Chemin du fichier à lire
 * @returns Contenu du fichier en tant que chaîne
 */
export function readFile(filepath: string): string {
  return fs.readFileSync(filepath, 'utf8');
}

/**
 * Crée un répertoire récursivement s'il n'existe pas
 * @param dirPath Chemin du répertoire à créer
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Copie un fichier avec traitement EJS
 * @param source Chemin source
 * @param dest Chemin destination
 * @param context Contexte pour EJS
 * @param fs Instance du système de fichiers de Yeoman
 */
export function copyTplWithEjs(source: string, dest: string, context: any, fs: any): void {
  fs.copyTpl(
    source,
    dest,
    context
  );
}

/**
 * Obtient l'extension d'un fichier
 * @param filename Nom du fichier
 * @returns Extension du fichier (sans le point)
 */
export function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex === -1 ? '' : filename.slice(lastDotIndex + 1);
}

/**
 * Options pour la génération de fichier
 */
export interface FileGenerationOptions {
  condition?: RenderCondition;
  overwrite?: boolean;
  transform?: (content: string, config: GlobalConfig) => string;
  templateData?: Record<string, any>;
}

/**
 * Génère un fichier à partir d'un template avec un traitement conditionnel
 * @param generator Instance du générateur Yeoman
 * @param templatePath Chemin du template source
 * @param targetPath Chemin cible pour le fichier généré
 * @param config Configuration globale
 * @param options Options de génération
 * @returns true si le fichier a été généré, false sinon
 */
export function generateFile(
  generator: any,
  templatePath: string,
  targetPath: string,
  config: GlobalConfig,
  options: FileGenerationOptions = {}
): boolean {
  // Vérifier la condition si elle existe
  if (options.condition && !evaluateCondition(options.condition, config)) {
    return false;
  }

  // S'assurer que le répertoire cible existe
  const targetDir = path.dirname(targetPath);
  ensureDirectoryExists(targetDir);

  // Vérifier si le fichier existe déjà et si on peut l'écraser
  if (fileExists(targetPath) && options.overwrite === false) {
    return false;
  }

  // Préparer les données du template
  const templateData = {
    ...options.templateData,
    config
  };

  // Copier le template avec le traitement EJS
  generator.fs.copyTpl(
    generator.templatePath(templatePath),
    generator.destinationPath(targetPath),
    templateData
  );

  // Appliquer la transformation si elle est définie
  if (options.transform && typeof options.transform === 'function') {
    const content = generator.fs.read(generator.destinationPath(targetPath));
    const transformedContent = options.transform(content, config);
    generator.fs.write(generator.destinationPath(targetPath), transformedContent);
  }

  return true;
}

/**
 * Génère plusieurs fichiers en utilisant un modèle commun
 * @param generator Instance du générateur Yeoman
 * @param filesConfig Tableau de configurations de fichiers à générer
 * @param globalConfig Configuration globale
 * @returns Nombre de fichiers générés avec succès
 */
export function generateMultipleFiles(
  generator: any,
  filesConfig: Array<{
    templatePath: string;
    targetPath: string;
    options?: FileGenerationOptions;
  }>,
  globalConfig: GlobalConfig
): number {
  let successCount = 0;

  for (const fileConfig of filesConfig) {
    const { templatePath, targetPath, options = {} } = fileConfig;

    if (generateFile(generator, templatePath, targetPath, globalConfig, options)) {
      successCount++;
    }
  }

  return successCount;
}

/**
 * Génère un arbre de fichiers à partir d'un répertoire de templates
 * @param generator Instance du générateur Yeoman
 * @param sourceDirPath Chemin du répertoire source de templates
 * @param targetDirPath Chemin du répertoire cible
 * @param config Configuration globale
 * @param options Options de génération appliquées à tous les fichiers
 * @returns Nombre de fichiers générés avec succès
 */
export function generateFileTree(
  generator: any,
  sourceDirPath: string,
  targetDirPath: string,
  config: GlobalConfig,
  options: FileGenerationOptions = {}
): number {
  const templateFiles = generator.fs.store.get(generator.templatePath(sourceDirPath));

  if (!templateFiles) {
    return 0;
  }

  let successCount = 0;
  const processedPaths = new Set<string>();

  // Fonction récursive pour parcourir l'arborescence
  function processPath(currentPath: string, relativePath: string) {
    const fullPath = path.join(currentPath, relativePath);

    if (processedPaths.has(fullPath)) {
      return;
    }

    processedPaths.add(fullPath);

    const isDirectory = fs.statSync(fullPath).isDirectory();

    if (isDirectory) {
      const files = fs.readdirSync(fullPath);

      for (const file of files) {
        processPath(currentPath, path.join(relativePath, file));
      }
    } else {
      // C'est un fichier, on le génère
      const targetRelativePath = relativePath.replace(/\.ejs$/, '');
      const targetPath = path.join(targetDirPath, targetRelativePath);

      if (generateFile(
        generator,
        path.join(sourceDirPath, relativePath),
        targetPath,
        config,
        options
      )) {
        successCount++;
      }
    }
  }

  // Démarrer le traitement à partir du répertoire racine
  processPath(generator.templatePath(), sourceDirPath);

  return successCount;
}

/**
 * Écrit un fichier JSON formaté
 * @param filepath Chemin du fichier à écrire
 * @param data Données à écrire au format JSON
 * @param pretty Si true, le JSON sera formaté joliment
 */
export function writeJsonFile(filepath: string, data: any, pretty: boolean = true): void {
  const content = pretty
    ? JSON.stringify(data, null, 2)
    : JSON.stringify(data);

  const dirPath = path.dirname(filepath);
  ensureDirectoryExists(dirPath);

  fs.writeFileSync(filepath, content, 'utf8');
}

/**
 * Lit un fichier JSON
 * @param filepath Chemin du fichier JSON à lire
 * @returns Le contenu du fichier parsé en objet JavaScript
 */
export function readJsonFile(filepath: string): any {
  if (!fileExists(filepath)) {
    return null;
  }

  try {
    const content = readFile(filepath);
    return JSON.parse(content);
  } catch (error) {
    console.error(`Erreur lors de la lecture du fichier JSON ${filepath}:`, error);
    return null;
  }
}

/**
 * Liste récursivement tous les fichiers dans un répertoire
 * @param dirPath Chemin du répertoire
 * @param relativeTo Chemin relatif (optionnel)
 * @param fileList Liste de fichiers existante (utilisé par la récursion)
 * @returns Liste des chemins de fichiers trouvés
 */
export function listFilesRecursively(
  dirPath: string,
  relativeTo: string = dirPath,
  fileList: string[] = []
): string[] {
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      listFilesRecursively(filePath, relativeTo, fileList);
    } else {
      const relativeFilePath = path.relative(relativeTo, filePath);
      fileList.push(relativeFilePath);
    }
  }

  return fileList;
}

/**
 * Ajoute du contenu à un fichier existant à une position spécifique
 * @param filepath Chemin du fichier à modifier
 * @param content Contenu à ajouter
 * @param position Position où ajouter le contenu ('start', 'end', ou un regex pour l'insertion)
 * @returns true si le fichier a été modifié avec succès
 */
export function injectIntoFile(
  filepath: string,
  content: string,
  position: 'start' | 'end' | RegExp
): boolean {
  if (!fileExists(filepath)) {
    return false;
  }

  let fileContent = readFile(filepath);

  if (position === 'start') {
    fileContent = content + fileContent;
  } else if (position === 'end') {
    fileContent = fileContent + content;
  } else if (position instanceof RegExp) {
    fileContent = fileContent.replace(position, (match) => `${match}${content}`);
  } else {
    return false;
  }

  fs.writeFileSync(filepath, fileContent, 'utf8');
  return true;
}
