console.log('Test de diagnostic pour Node.js');
console.log('Version de Node.js:', process.version);
console.log('Chemin d\'exécution actuel:', process.cwd());
console.log('Liste des fichiers de test:');

const fs = require('fs');
const path = require('path');

function findTestFiles(directory) {
  const files = fs.readdirSync(directory, { withFileTypes: true });

  files.forEach(file => {
    const filePath = path.join(directory, file.name);

    if (file.isDirectory()) {
      findTestFiles(filePath);
    } else if (file.name.endsWith('.test.ts') || file.name.endsWith('.test.js')) {
      console.log('- ' + filePath);
    }
  });
}

findTestFiles('./generators');
