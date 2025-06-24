import chalk from 'chalk';
import fs from 'fs';

/**
 * Assure que le répertoire existe avant d'y écrire un fichier
 * @param generator Référence au générateur
 * @param dirPath Chemin du répertoire à créer
 */
export function ensureDirectoryExists(generator: any, dirPath: string): void {
  if (!dirPath || typeof dirPath !== 'string' || dirPath.trim() === '') {
    generator.log && generator.log(chalk.red(`❌ [SECURITE] Chemin de répertoire invalide ou indéfini: '${dirPath}' (appel ignoré)`));
    return;
  }
  const fullPath = generator.destinationPath(dirPath);
  if (!fs.existsSync(fullPath)) {
    generator.log(chalk.yellow(`📁 Création du répertoire: ${dirPath}`));
    fs.mkdirSync(fullPath, { recursive: true });
  }
}
