#!/usr/bin/env node

/**
 * Script de débogage qui imprime la stack trace au moment de l'appel à ensureDirectoryExists
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Équivalent à __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const originalFile = path.join(__dirname, 'dist/generators/entity/index.js');
const backupFile = path.join(__dirname, 'dist/generators/entity/index.js.bak');

// Faire une sauvegarde du fichier original
if (!fs.existsSync(backupFile)) {
  fs.copyFileSync(originalFile, backupFile);
  console.log(`📋 Sauvegarde créée: ${backupFile}`);
}

// Lire le contenu du fichier
let content = fs.readFileSync(originalFile, 'utf8');

// Modifier la méthode ensureDirectoryExists pour ajouter un stack trace
const modifiedMethod = `
    /**
     * Assure que le répertoire existe
     */
    ensureDirectoryExists(dirPath) {
        console.log('====== DEBUG TRACE ======');
        console.log(\`Appel à ensureDirectoryExists avec dirPath = '\${dirPath}'\`);
        console.error(new Error().stack);
        console.log('========================');

        this.log(INFO_COLOR(\`[DEBUG ensureDirectoryExists] dirPath: '\${dirPath}'\`));
        
        if (!dirPath || dirPath === 'undefined') {
            this.log(ERROR_COLOR(\`[BUG] Chemin de dossier invalide passé à ensureDirectoryExists: '\${dirPath}'\`));
            // Afficher la stack trace pour voir d'où vient l'appel
            console.error('Stack trace de l\\'appel problématique:');
            console.error(new Error().stack);
            
            // Correction d'urgence - utiliser un répertoire par défaut
            const emergencyDir = "src/main/java/com/example/fullstack/entity";
            this.log(INFO_COLOR(\`[CORRECTION D'URGENCE] Utilisation du répertoire par défaut: '\${emergencyDir}'\`));
            
            if (!fs.existsSync(emergencyDir)) {
                fs.mkdirSync(emergencyDir, { recursive: true });
                this.log(chalk.yellow(\`📁 Création du répertoire par défaut: \${emergencyDir}\`));
                return emergencyDir;
            }
            return emergencyDir;
        }

        const cleanPath = dirPath.trim();
        if (!fs.existsSync(cleanPath)) {
            fs.mkdirSync(cleanPath, { recursive: true });
            this.log(chalk.yellow(\`📁 Création du répertoire: \${cleanPath}\`));
        }
        else {
            this.log(INFO_COLOR(\`📁 Répertoire existe: \${cleanPath}\`));
        }
        return cleanPath;
    }`;

// Remplacer la méthode ensureDirectoryExists par notre version modifiée
content = content.replace(/\/\*\*\s+\* Assure que le répertoire existe[\s\S]+?this\.log\(INFO_COLOR\(`📁 Répertoire existe: \${cleanPath}`\)\);\s+}\s+}/m, modifiedMethod);

// Écrire le contenu modifié dans le fichier
fs.writeFileSync(originalFile, content);
console.log(`✅ Méthode ensureDirectoryExists mise à jour dans ${originalFile}`);
console.log('Exécutez maintenant votre commande "sfs e" pour déboguer le problème');
