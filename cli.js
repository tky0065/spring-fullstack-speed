#!/usr/bin/env node

/**
 * Point d'entrée CLI pour Spring-Fullstack-Speed (SFS)
 * Ce fichier permet d'exécuter le générateur via la commande 'sfs'
 */

import yeoman from "yeoman-environment";
import chalk from "chalk";
import path from "path";
import { fileURLToPath } from "url";
import { COMMAND_ALIASES } from "./generators/index.js";

// Récupération du chemin du fichier actuel en module ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = yeoman.createEnv();
const args = process.argv.slice(2);
let generatorName = args[0] || "app";

// Gestion des alias de commandes
if (generatorName in COMMAND_ALIASES) {
  generatorName = COMMAND_ALIASES[generatorName];
}

// Gestion des sous-commandes avec alias (comme "g e" pour "generate entity")
if (generatorName === "generate" && args.length > 1 && args[1] in COMMAND_ALIASES) {
  args[1] = COMMAND_ALIASES[args[1]];
}

// Enregistrement des générateurs disponibles
env.register(path.join(__dirname, 'generators/app'), 'sfs:app');
env.register(path.join(__dirname, 'generators/entity'), 'sfs:entity');
env.register(path.join(__dirname, 'generators/crud'), 'sfs:crud');
env.register(path.join(__dirname, 'generators/module'), 'sfs:module');
env.register(path.join(__dirname, 'generators/dtos'), 'sfs:dtos');
env.register(path.join(__dirname, 'generators/add'), 'sfs:add');
env.register(path.join(__dirname, 'generators/generate'), 'sfs:generate');
env.register(path.join(__dirname, 'generators/serve'), 'sfs:serve');
env.register(path.join(__dirname, 'generators/test'), 'sfs:test');
env.register(path.join(__dirname, 'generators/build'), 'sfs:build');
env.register(path.join(__dirname, 'generators/deploy'), 'sfs:deploy');
env.register(path.join(__dirname, 'generators/migrate'), 'sfs:migrate');
env.register(path.join(__dirname, 'generators/doctor'), 'sfs:doctor');
env.register(path.join(__dirname, 'generators/upgrade'), 'sfs:upgrade');
env.register(path.join(__dirname, 'generators/plugins'), 'sfs:plugins');

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
  build, b : Compile l'application pour la production
  deploy   : Options de déploiement (serveurs, cloud, k8s)
  migrate  : Gestion des migrations de base de données
  doctor   : Outil de diagnostic pour votre projet
  upgrade  : Mise à niveau du projet
  plugins  : Gestion des extensions

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
  const packageJson = await import('./package.json', { assert: { type: 'json' } });
  console.log(`SFS version ${packageJson.default.version}`);
  process.exit(0);
}

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
  console.error(chalk.red(`Générateur "${generatorName}" non trouvé.`));
  console.error('Utilisez "sfs --help" pour voir la liste des générateurs disponibles.');
  process.exit(1);
}
