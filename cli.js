#!/usr/bin/env node

/**
 * Point d'entrée CLI pour Spring-Fullstack-Speed (SFS)
 * Ce fichier permet d'exécuter le générateur via la commande 'sfs'
 */

import yeoman from "yeoman-environment";
import chalk from "chalk";
import path from "path";
import { fileURLToPath } from "url";

// Récupération du chemin du fichier actuel en module ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = yeoman.createEnv();
const args = process.argv.slice(2);
const generatorName = args[0] || "app";

// Enregistrement des générateurs disponibles
env.register(path.join(__dirname, 'generators/app'), 'sfs:app');
env.register(path.join(__dirname, 'generators/entity'), 'sfs:entity');
env.register(path.join(__dirname, 'generators/crud'), 'sfs:crud');
env.register(path.join(__dirname, 'generators/module'), 'sfs:module');
env.register(path.join(__dirname, 'generators/dtos'), 'sfs:dtos');

// Affichage de l'aide si demandé
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
${chalk.green('SFS - Spring-Fullstack-Speed')} - Générateur d'applications Spring Boot fullstack

${chalk.yellow('Usage:')}
  sfs [générateur] [options]

${chalk.yellow('Générateurs disponibles:')}
  app      : Génère une nouvelle application Spring Boot fullstack (par défaut)
  entity   : Génère une nouvelle entité avec son repository, service et controller
  crud     : Génère les opérations CRUD pour une entité existante
  dtos     : Génère des DTOs pour une entité existante
  module   : Génère un nouveau module fonctionnel

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
