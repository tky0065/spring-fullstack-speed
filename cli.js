#!/usr/bin/env node

/**
 * Point d'entrée CLI pour Spring-Fullstack-Speed (SFS)
 * Ce fichier permet d'exécuter le générateur via la commande 'sfs'
 */

import { createEnv } from "yeoman-environment";
import chalk from "chalk";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { COMMAND_ALIASES } from "./dist/generators/index.js";

// Récupération du chemin du fichier actuel en module ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Création de l'environnement Yeoman
const env = createEnv();
const args = process.argv.slice(2);
let generatorName = args[0] || "app";

// Afficher les informations de débogage pour le diagnostic
if (process.env.SFS_DEBUG) {
  console.log('Arguments reçus:', args);
  console.log('Générateur demandé:', generatorName);
  console.log('Aliases disponibles:', COMMAND_ALIASES);
}

// Gestion des alias de commandes
if (COMMAND_ALIASES[generatorName]) {
  if (process.env.SFS_DEBUG) {
    console.log(`Alias trouvé: ${generatorName} -> ${COMMAND_ALIASES[generatorName]}`);
  }
  generatorName = COMMAND_ALIASES[generatorName];
}

// Gestion des sous-commandes avec alias (comme "g e" pour "generate entity")
if (generatorName === "generate" && args.length > 1 && COMMAND_ALIASES[args[1]]) {
  if (process.env.SFS_DEBUG) {
    console.log(`Sous-alias trouvé: ${args[1]} -> ${COMMAND_ALIASES[args[1]]}`);
  }
  args[1] = COMMAND_ALIASES[args[1]];
}

// Enregistrement des générateurs disponibles en utilisant la structure correcte
// Inspiré de JHipster qui utilise les chemins vers les fichiers compilés
const availableGenerators = [
  { name: 'app', path: './dist/generators/app/index.js' },
  { name: 'entity', path: './dist/generators/entity/index.js' },
  { name: 'crud', path: './dist/generators/crud/index.js' },
  { name: 'module', path: './dist/generators/module/index.js' },
  { name: 'dtos', path: './dist/generators/dtos/index.js' },
  { name: 'add', path: './dist/generators/add/index.js' },
  { name: 'generate', path: './dist/generators/generate/index.js' },
  { name: 'serve', path: './dist/generators/serve/index.js' },
  { name: 'test', path: './dist/generators/test/index.js' },
  { name: 'deploy', path: './dist/generators/deploy/index.js' },
  { name: 'migrate', path: './dist/generators/migrate/index.js' },
  { name: 'doctor', path: './dist/generators/doctor/index.js' },
  { name: 'upgrade', path: './dist/generators/upgrade/index.js' },
  { name: 'plugins', path: './dist/generators/plugins/index.js' },
  { name: 'kubernetes', path: './dist/generators/kubernetes/index.js' },
  { name: 'docker', path: './dist/generators/docker/index.js' },
  { name: 'notification', path: './dist/generators/notification/index.js' },
  { name: 'payment', path: './dist/generators/payment/index.js' },
  { name: 'search', path: './dist/generators/search/index.js' },
  { name: 'cicd', path: './dist/generators/cicd/index.js' },
  { name: 'container', path: './dist/generators/container/index.js' }
];

// Liste des générateurs valides pour vérification
const validGenerators = new Set(availableGenerators.map(g => g.name));

// Vérification si la commande existe avant de continuer
if (generatorName !== "app" && !validGenerators.has(generatorName) &&
    !args.includes('--help') && !args.includes('-h') &&
    !args.includes('--version') && !args.includes('-v')) {
  console.error(chalk.red(`Commande inconnue "${generatorName}"`));
  console.log(`Utilisez ${chalk.green('sfs --help')} pour voir la liste des commandes disponibles.`);
  process.exit(1);
}

// Enregistrer chaque générateur avec un namespace spécifique
for (const generator of availableGenerators) {
  try {
    const generatorPath = path.join(__dirname, generator.path);
    env.register(generatorPath, { namespace: `sfs:${generator.name}` });
    if (process.env.SFS_DEBUG) {
      console.log(`Générateur enregistré: sfs:${generator.name} -> ${generatorPath}`);
    }
  } catch (error) {
    console.warn(`Avertissement: Impossible d'enregistrer le générateur ${generator.name}: ${error.message}`);
  }
}

// Affichage de l'aide si demandé
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
${chalk.green('SFS - Spring-Fullstack-Speed')} - Générateur d'applications Spring Boot fullstack

${chalk.yellow('Usage:')}
  sfs [générateur] [options]

${chalk.yellow('Générateurs disponibles:')}
  app      : Génère une nouvelle application Spring Boot fullstack (par défaut)
  entity, e: Génère une nouvelle entité avec son repository, service et controller
  crud, c  : Génère les opérations CRUD pour une entité existante
  dtos, d  : Génère des DTOs pour une entité existante
  module   : Génère un nouveau module fonctionnel
  add, a   : Ajoute des composants à un projet existant
  generate, g: Génération rapide de code (entités, DTOs, CRUD, API)
  serve, s : Démarre un serveur de développement
  test, t  : Exécute différents types de tests
  deploy   : Options de déploiement (serveurs, cloud, k8s)
  migrate  : Gestion des migrations de base de données
  doctor   : Outil de diagnostic pour votre projet
  upgrade  : Mise à niveau du projet
  plugins  : Gestion des extensions
  kubernetes: Gestion des déploiements Kubernetes
  docker   : Gestion des conteneurs Docker
  notification: Gestion des notifications
  payment  : Gestion des paiements
  search   : Fonctionnalités de recherche
  cicd     : Intégration et déploiement continus
  container : Gestion des conteneurs

${chalk.yellow('Raccourcis communs:')}
  sfs g e   : équivalent à "sfs generate entity"
  sfs g d   : équivalent à "sfs generate dtos"
  sfs g c   : équivalent à "sfs generate crud"

${chalk.yellow('Options:')}
  --help, -h   : Affiche cette aide
  --version, -v : Affiche la version du générateur
  `);
  process.exit(0);
}

// Affichage de la version si demandée
if (args.includes('--version') || args.includes('-v')) {
  try {
    const packageJsonPath = path.join(__dirname, 'package.json');
    const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    console.log(`SFS version ${packageData.version}`);
    process.exit(0);
  } catch (error) {
    console.error(chalk.red(`Erreur lors de la récupération de la version: ${error.message}`));
    process.exit(1);
  }
}

// Gestion du signal d'interruption (Ctrl+C)
process.on('SIGINT', () => {
  console.log(chalk.yellow('\nOpération annulée par l\'utilisateur.'));
  process.exit(0);
});

// Exécution du générateur demandé
try {
  const remainingArgs = generatorName === args[0] ? args.slice(1) : args;
  env.run(`sfs:${generatorName}`, { arguments: remainingArgs }, (err) => {
    if (err) {
      console.error(chalk.red('Erreur lors de l\'exécution du générateur:'));
      console.error(err);
      process.exit(1);
    }
  });
} catch (err) {
  console.error(chalk.red(`Erreur inattendue lors de l'exécution de la commande "${generatorName}":`));
  console.error(err);
  console.log(`Utilisez ${chalk.green('sfs --help')} pour voir la liste des commandes disponibles.`);
  process.exit(1);
}
