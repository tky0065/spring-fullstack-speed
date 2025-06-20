const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Script de diagnostic pour Spring-Fullstack-Speed');
console.log('================================================');
console.log(`Version Node.js: ${process.version}`);
console.log(`Répertoire courant: ${process.cwd()}`);
console.log('');

// Vérifier l'existence des fichiers clés
console.log('1. Vérification des fichiers essentiels:');
const essentialFiles = [
  'package.json',
  'tsconfig.json',
  'jest.config.js',
  'generators/base-generator.ts',
  'generators/app/index.ts',
  'utils/config.ts'
];

for (const file of essentialFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} existe`);
  } else {
    console.log(`❌ ${file} n'existe PAS`);
  }
}
console.log('');

// Vérifier si le dossier dist existe et contient des fichiers
console.log('2. Vérification de la compilation TypeScript:');
if (fs.existsSync('dist')) {
  console.log('✅ Le dossier dist existe');
  const distFiles = fs.readdirSync('dist').filter(f => f.endsWith('.js')).length;
  console.log(`   - ${distFiles} fichiers .js trouvés dans le dossier dist`);
} else {
  console.log('❌ Le dossier dist n\'existe PAS - le projet n\'a pas été compilé');
}
console.log('');

// Vérifier les fichiers de test
console.log('3. Vérification des fichiers de test:');
function countTestFiles(dir) {
  let count = 0;

  try {
    const files = fs.readdirSync(dir, { withFileTypes: true });

    for (const file of files) {
      const fullPath = path.join(dir, file.name);

      if (file.isDirectory()) {
        count += countTestFiles(fullPath);
      } else if (file.name.endsWith('.test.ts') || file.name.endsWith('.test.js')) {
        console.log(`   - Fichier de test trouvé: ${fullPath}`);
        count++;
      }
    }
  } catch (error) {
    console.error(`Erreur lors de la lecture du répertoire ${dir}:`, error.message);
  }

  return count;
}

const testCount = countTestFiles('./generators');
console.log(`Total: ${testCount} fichiers de test trouvés dans les générateurs`);
console.log('');

// Vérifier les erreurs de compilation TypeScript
console.log('4. Vérification des erreurs de compilation TypeScript:');
try {
  console.log('Exécution de tsc --noEmit pour vérifier les erreurs...');
  execSync('npx tsc --noEmit', { encoding: 'utf8' });
  console.log('✅ Aucune erreur TypeScript détectée');
} catch (error) {
  console.log('❌ Erreurs TypeScript détectées:');
  console.log(error.stdout);
}
console.log('');

// Vérifier si Jest est correctement installé
console.log('5. Vérification de l\'installation de Jest:');
try {
  const jestVersion = execSync('npx jest --version', { encoding: 'utf8' }).trim();
  console.log(`✅ Jest version ${jestVersion} est installé`);
} catch (error) {
  console.log('❌ Problème avec l\'installation de Jest:');
  console.log(error.message);
}

console.log('');
console.log('Diagnostic terminé.');
