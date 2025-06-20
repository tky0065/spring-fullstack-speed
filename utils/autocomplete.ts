/**
 * Module d'auto-complétion pour le CLI
 * Facilite l'expérience utilisateur en proposant des suggestions
 * pendant la saisie de commandes et options.
 */

import tabtab from 'tabtab';
import path from 'path';
import fs from 'fs';

// Commandes principales du CLI
const COMMANDS = [
  { name: 'app', description: 'Crée une nouvelle application' },
  { name: 'add', description: 'Ajoute un composant à une application existante' },
  { name: 'entity', description: 'Génère une nouvelle entité et son CRUD' },
  { name: 'dtos', description: 'Génère des DTOs pour les entités' },
  { name: 'crud', description: 'Génère le CRUD pour une entité existante' },
  { name: 'module', description: 'Ajoute un nouveau module à l\'application' },
  { name: 'notification', description: 'Configure les notifications' },
  { name: 'cicd', description: 'Ajoute une configuration CI/CD' },
  { name: 'container', description: 'Ajoute une configuration Docker' },
  { name: 'search', description: 'Configure la recherche Elasticsearch' },
];

// Options communes à toutes les commandes
const COMMON_OPTIONS = [
  { name: '--help', description: 'Affiche l\'aide' },
  { name: '--version', description: 'Affiche la version' },
  { name: '--verbose', description: 'Mode verbeux' },
  { name: '--skip-install', description: 'Saute l\'installation des dépendances' },
  { name: '--skip-git', description: 'Saute l\'initialisation Git' },
  { name: '--force', description: 'Force l\'écrasement des fichiers existants' },
];

// Options spécifiques pour chaque commande
const COMMAND_OPTIONS = {
  app: [
    { name: '--preset', description: 'Utilise un preset prédéfini (basic, fullstack, microservice)' },
    { name: '--skip-questions', description: 'Utilise les valeurs par défaut' },
    { name: '--with-examples', description: 'Inclut des exemples de code' },
  ],
  add: [
    { name: '--frontend', description: 'Ajoute un frontend' },
    { name: '--auth', description: 'Ajoute l\'authentification' },
    { name: '--api-docs', description: 'Ajoute la documentation API' },
    { name: '--docker', description: 'Ajoute la configuration Docker' },
  ],
  entity: [
    { name: '--fields', description: 'Définit les champs de l\'entité' },
    { name: '--relations', description: 'Définit les relations de l\'entité' },
    { name: '--dto', description: 'Génère automatiquement les DTOs' },
    { name: '--service', description: 'Type de service (serviceClass, serviceImpl)' },
    { name: '--pagination', description: 'Type de pagination (pagination, infinite-scroll, no)' },
  ],
};

/**
 * Configure l'auto-complétion pour le CLI
 */
export async function setupAutocompletion() {
  const completion = tabtab.createCompletionSetup();

  // Complétion pour les commandes principales
  completion.on('sfs', (data, done) => {
    done(null, COMMANDS.map(cmd => ({
      name: cmd.name,
      description: cmd.description,
    })));
  });

  // Complétion pour les options de chaque commande
  COMMANDS.forEach(cmd => {
    completion.on(`sfs.${cmd.name}`, (data, done) => {
      const options = [
        ...(COMMAND_OPTIONS[cmd.name as keyof typeof COMMAND_OPTIONS] || []),
        ...COMMON_OPTIONS,
      ];

      done(null, options.map(opt => ({
        name: opt.name,
        description: opt.description,
      })));
    });
  });

  // Complétion pour les valeurs d'options
  completion.on('sfs.app.--preset', (data, done) => {
    done(null, [
      { name: 'basic', description: 'Application Spring Boot basique' },
      { name: 'fullstack', description: 'Application fullstack avec React et PostgreSQL' },
      { name: 'microservice', description: 'Microservice sans frontend' },
    ]);
  });

  // Complétion pour les noms d'entités existantes
  completion.on('sfs.entity', (data, done) => {
    if (data.prev === '--extends') {
      // Chercher les entités existantes dans le projet
      try {
        const entitiesDir = path.join(process.cwd(), 'src', 'main', 'java');
        if (fs.existsSync(entitiesDir)) {
          const files = findJavaEntityFiles(entitiesDir);
          const entityNames = files.map(file => path.basename(file, '.java'));
          done(null, entityNames.map(name => ({ name })));
        } else {
          done(null, []);
        }
      } catch (err) {
        done(null, []);
      }
    }
  });

  await completion.install();
}

/**
 * Recherche récursivement les fichiers d'entités Java
 * @param dir Répertoire à explorer
 * @returns Liste des chemins de fichiers d'entités
 */
function findJavaEntityFiles(dir: string): string[] {
  let results: string[] = [];

  if (!fs.existsSync(dir)) {
    return results;
  }

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results = results.concat(findJavaEntityFiles(filePath));
    } else if (
      stat.isFile() &&
      file.endsWith('.java') &&
      fs.readFileSync(filePath, 'utf8').includes('@Entity')
    ) {
      results.push(filePath);
    }
  }

  return results;
}

/**
 * Active l'auto-complétion dans la CLI
 */
export function enableAutocompletion() {
  if (process.argv.includes('--completion')) {
    return tabtab.complete('sfs', (err, data) => {
      if (err || !data) return;
      setupAutocompletion();
    });
  }
}

/**
 * Initialise l'auto-complétion lors de l'installation
 */
export function installAutocompletion() {
  if (process.argv.includes('--install-completion')) {
    setupAutocompletion()
      .then(() => console.log('Auto-complétion installée avec succès.'))
      .catch(err => console.error('Erreur lors de l\'installation de l\'auto-complétion:', err));
  }
}
