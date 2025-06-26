// Ce script met à jour la version dans les fichiers de documentation
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { VERSION } from '../config/version.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const docsDir = resolve(__dirname, '..', 'docs');
const websiteDir = resolve(__dirname, '..', 'docs', 'learn');

console.log(`Mise à jour de la version ${VERSION} dans les fichiers de documentation...`);

// Mise à jour des fichiers Markdown
function updateMarkdownFiles(directory) {
  const files = readdirSync(directory, { withFileTypes: true });

  for (const file of files) {
    const fullPath = join(directory, file.name);

    if (file.isDirectory()) {
      updateMarkdownFiles(fullPath);
      continue;
    }

    if (!file.name.endsWith('.md')) continue;

    let content = readFileSync(fullPath, 'utf8');

    // Mettre à jour ou ajouter la version dans le frontmatter
    if (content.startsWith('---')) {
      if (content.includes('version:')) {
        content = content.replace(/version:.*/, `version: ${VERSION}`);
      } else {
        content = content.replace('---', `---\nversion: ${VERSION}`);
      }
    }

    // Mettre à jour les références explicites à la version
    content = content.replace(/spring-fullstack-speed v\d+\.\d+\.\d+/g, `spring-fullstack-speed v${VERSION}`);

    writeFileSync(fullPath, content);
    console.log(`✓ Mise à jour de ${fullPath}`);
  }
}

// Mise à jour des fichiers HTML
function updateHtmlFiles(directory) {
  const files = readdirSync(directory, { withFileTypes: true });

  for (const file of files) {
    const fullPath = join(directory, file.name);

    if (file.isDirectory() && file.name !== 'css' && file.name !== 'js' && file.name !== 'images') {
      updateHtmlFiles(fullPath);
      continue;
    }

    if (!file.name.endsWith('.html')) continue;

    let content = readFileSync(fullPath, 'utf8');

    // Mettre à jour les balises meta
    content = content.replace(/<meta name="version" content=".*?">/g, `<meta name="version" content="${VERSION}">`);

    // Mettre à jour le titre dans la balise <title>
    content = content.replace(/<title>(.*?)v\d+\.\d+\.\d+(.*?)<\/title>/g, `<title>$1v${VERSION}$2</title>`);

    // Mettre à jour les attributs data-version
    content = content.replace(/data-version=["']\d+\.\d+\.\d+["']/g, `data-version="${VERSION}"`);

    // Mettre à jour les badges de version
    content = content.replace(/<span class="version-badge">v?\d+\.\d+\.\d+<\/span>/g, `<span class="version-badge">v${VERSION}</span>`);

    // Mettre à jour les noms de fichiers contenant la version dans les liens
    content = content.replace(/(href=["'].*?)[vV]?\d+\.\d+\.\d+(\.html["'])/g, `$1v${VERSION}$2`);

    // Mettre à jour les références explicites à la version dans le texte
    content = content.replace(/spring-fullstack-speed v\d+\.\d+\.\d+/g, `spring-fullstack-speed v${VERSION}`);
    content = content.replace(/spring-fullstack-speed [vV]ersion \d+\.\d+\.\d+/g, `spring-fullstack-speed Version ${VERSION}`);
    content = content.replace(/version \d+\.\d+\.\d+ de Spring-Fullstack-Speed/gi, `version ${VERSION} de Spring-Fullstack-Speed`);

    writeFileSync(fullPath, content);
    console.log(`✓ Mise à jour de ${fullPath}`);
  }
}

try {
  // Mettre à jour les fichiers markdown
  updateMarkdownFiles(docsDir);

  // Mettre à jour les fichiers HTML
  if (websiteDir) {
    updateHtmlFiles(websiteDir);
  }

  console.log(`Terminé! Version ${VERSION} appliquée à tous les fichiers de documentation.`);
} catch (error) {
  console.error('Erreur lors de la mise à jour des fichiers:', error);
  process.exit(1);
}
