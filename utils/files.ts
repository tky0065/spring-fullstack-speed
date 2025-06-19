/**
 * Utilitaires pour la manipulation des fichiers
 */
import fs from 'fs';
import path from 'path';

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
