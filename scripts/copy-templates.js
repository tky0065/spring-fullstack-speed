#!/usr/bin/env node

/**
 * Script post-build pour copier les templates et autres fichiers non-TypeScript
 * dans le dossier dist après la compilation.
 * Inspiré du système de build de JHipster.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

// Configuration pour fonctionner en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('Copie des templates et autres ressources vers le dossier dist...');

/**
 * Vérifie si un chemin est un dossier
 */
function isDirectory(path) {
  try {
    return fs.statSync(path).isDirectory();
  } catch (err) {
    return false;
  }
}

/**
 * Copie un fichier source vers une destination
 */
function copyFile(source, dest) {
  try {
    // Vérifier si c'est un dossier (pour éviter les erreurs EPERM sous Windows)
    if (isDirectory(source)) {
      // Créer le dossier de destination s'il n'existe pas
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      return;
    }

    // Créer le dossier cible s'il n'existe pas
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // Copier le fichier
    fs.copyFileSync(source, dest);
  } catch (err) {
    console.error(`Erreur lors de la copie de ${source} vers ${dest}: ${err.message}`);
  }
}

/**
 * Copie tous les fichiers correspondant à un pattern vers le dossier dist
 */
async function copyFiles(pattern, srcRoot, destRoot) {
  try {
    // L'option nodir:true garantit qu'on récupère uniquement les fichiers, pas les dossiers
    const files = await glob(pattern, { cwd: srcRoot, nodir: true });

    for (const file of files) {
      const sourcePath = path.join(srcRoot, file);
      const destPath = path.join(destRoot, file);
      copyFile(sourcePath, destPath);
    }

    return files.length;
  } catch (err) {
    console.error(`Erreur lors de la recherche de fichiers avec pattern ${pattern}: ${err.message}`);
    return 0;
  }
}

// Définition des patterns de fichiers à copier
const patterns = [
  'generators/**/*.ejs',
  'generators/**/templates/**/*',
  'generators/app/**/*',
  'generators/**/*',
  'generators/**/*.json',
  'utils/**/*.json'
];

// Copier tous les templates et autres ressources
async function copyAllResources() {
  let total = 0;

  for (const pattern of patterns) {
    const count = await copyFiles(pattern, rootDir, path.join(rootDir, 'dist'));
    console.log(`${count} fichiers copiés pour le pattern: ${pattern}`);
    total += count;
  }

  console.log(`\nCopie terminée: ${total} fichiers copiés au total.`);
}

// Exécuter la copie de ressources
copyAllResources().catch(err => {
  console.error('Erreur lors de la copie des ressources:', err);
  process.exit(1);
});
