// Script de diagnostic pour identifier les problèmes avec getSubPackage
import path from 'path';
import fs from 'fs';

// Chemins
const distPath = path.join(process.cwd(), 'dist/generators/entity/index.js');
const srcPath = path.join(process.cwd(), 'generators/entity/index.ts');

console.log('---- DIAGNOSTIC DU GÉNÉRATEUR D\'ENTITÉS ----');
console.log(`Chemin du fichier source: ${srcPath}`);
console.log(`Chemin du fichier compilé: ${distPath}`);

// Vérifier l'existence des fichiers
console.log('\n---- VÉRIFICATION DES FICHIERS ----');
console.log(`Fichier source existe: ${fs.existsSync(srcPath)}`);
console.log(`Fichier compilé existe: ${fs.existsSync(distPath)}`);

// Modification manuelle de la méthode writing() pour corriger le problème
console.log('\n---- CORRECTION DIRECTE DU FICHIER COMPILÉ ----');
try {
  if (fs.existsSync(distPath)) {
    let content = fs.readFileSync(distPath, 'utf8');

    // Chercher le code problématique dans la méthode writing()
    // et remplacer par la version corrigée
    const searchPattern = /\/\/ Correction : s'assurer que sub n'est jamais undefined/;
    const fixedCode = `
        // Correction : s'assurer que sub n'est jamais undefined
        let entityPackage, repositoryPackage, servicePackage, controllerPackage, dtoPackage;
        try {
            entityPackage = this.getSubPackage(packageName, 'entity');
            repositoryPackage = this.getSubPackage(packageName, 'repository');
            servicePackage = this.getSubPackage(packageName, 'service');
            controllerPackage = this.getSubPackage(packageName, 'controller');
            dtoPackage = this.getSubPackage(packageName, 'dto');
        } catch (e) {
            this.displayError(\`[FATAL] Erreur lors de la génération des sous-packages : \${e}\`);
            return;
        }`;

    // Vérifier si le pattern existe
    const hasPattern = searchPattern.test(content);
    console.log(`Pattern trouvé dans le fichier compilé: ${hasPattern}`);

    if (hasPattern) {
      // Appliquer la correction en remplaçant tout le bloc
      content = content.replace(/\/\/ Correction : s'assurer que sub n'est jamais undefined[\s\S]*?\/\/ Sécurisation des chemins/m,
        `${fixedCode}\n        // Sécurisation des chemins`);

      // Écrire le fichier corrigé
      fs.writeFileSync(distPath, content, 'utf8');
      console.log('✅ Correction appliquée au fichier compilé');
    } else {
      console.log('❌ Impossible de trouver l\'emplacement exact pour appliquer la correction');
    }
  }
} catch (error) {
  console.error(`Erreur lors de la correction: ${error}`);
}

console.log('\nDiagnostic terminé. Essayez maintenant d\'exécuter "node cli.js e" à nouveau.');
