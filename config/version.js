// Ce fichier contient la version globale du projet utilisée dans tous les fichiers
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJsonPath = resolve(__dirname, '..', 'package.json');

// Lire la version depuis package.json
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
export const VERSION = packageJson.version;

// Export d'autres métadonnées utiles
export const PROJECT_NAME = packageJson.name;
export const DESCRIPTION = packageJson.description;

// Fonction pour générer un texte de version avec date
export function getVersionWithDate() {
  return `${VERSION} (${new Date().toISOString().split('T')[0]})`;
}

// Pour usage en ligne de commande
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(VERSION);
}
