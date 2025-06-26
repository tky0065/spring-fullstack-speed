#!/usr/bin/env node

/**
 * Script pour synchroniser automatiquement les templates entre les dossiers source et dist
 * À exécuter après chaque build pour garantir que tous les fichiers templates sont correctement copiés
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SOURCE_DIR = path.join(__dirname, '../generators');
const DIST_DIR = path.join(__dirname, '../dist/generators');

// Fonction pour créer un répertoire s'il n'existe pas
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Fonction pour copier récursivement un dossier
function copyDir(src, dest) {
  ensureDir(dest);

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Fonction pour synchroniser spécifiquement les templates
function syncTemplates() {
  console.log('🔄 Synchronisation des templates entre les dossiers source et dist...');

  // Synchroniser les templates de l'application principale
  const appTemplatesSource = path.join(SOURCE_DIR, 'app/templates');
  const appTemplatesDist = path.join(DIST_DIR, 'app/templates');

  if (fs.existsSync(appTemplatesSource)) {
    console.log('📁 Synchronisation des templates de l\'application principale...');
    copyDir(appTemplatesSource, appTemplatesDist);
  }

  console.log('✅ Synchronisation des templates terminée avec succès!');
}

// Exécution principale
try {
  syncTemplates();
  console.log('🚀 Tous les templates ont été synchronisés avec succès!');
} catch (error) {
  console.error('❌ Erreur lors de la synchronisation des templates:', error);
  process.exit(1);
}
