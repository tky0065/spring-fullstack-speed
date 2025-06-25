/**
 * Point d'entrée pour tous les générateurs SFS
 * Exporte tous les générateurs pour une utilisation facile
 */

export { default as AppGenerator } from './app/index.js';
export { default as EntityGenerator } from './entity/index.js';
export { default as CrudGenerator } from './crud/index.js';
export { default as ModuleGenerator } from './module/index.js';
export { default as DtosGenerator } from './dtos/index.js';
export { BaseGenerator } from './base-generator.js';

// Import des générateurs additionnels
export { default as AddGenerator } from './add/index.js';
export { default as GenerateGenerator } from './generate/index.js';
export { default as ServeGenerator } from './serve/index.js';
export { default as TestGenerator } from './test/index.js';
export { default as DeployGenerator } from './deploy/index.js';
export { default as MigrateGenerator } from './migrate/index.js';
export { default as DoctorGenerator } from './doctor/index.js';
export { default as UpgradeGenerator } from './upgrade/index.js';
export { default as PluginsGenerator } from './plugins/index.js';
export { default as KubernetesGenerator } from './kubernetes/index.js';
export { default as DockerGenerator } from './docker/index.js';
export { default as PaymentGenerator } from './payment/index.js';

// Définit les types de générateurs disponibles
export const GENERATOR_TYPES = {
  APP: 'app',
  ENTITY: 'entity',
  CRUD: 'crud',
  MODULE: 'module',
  DTOS: 'dtos',
  ADD: 'add',
  GENERATE: 'generate',
  SERVE: 'serve',
  TEST: 'test',
  BUILD: 'build',
  DEPLOY: 'deploy',
  MIGRATE: 'migrate',
  DOCTOR: 'doctor',
  UPGRADE: 'upgrade',
  PLUGINS: 'plugins',
  KUBERNETES: 'kubernetes',
  DOCKER: 'docker',
  PAYMENT: 'payment'
};

// Définition des alias pour les commandes principales
// Ces alias sont utilisés dans cli.js pour interpréter les commandes raccourcies
export const COMMAND_ALIASES = {
  'g': 'generate',
  'e': 'entity',
  'd': 'dtos',
  'c': 'crud',
  'a': 'add',
  's': 'serve',
  't': 'test',
  'k': 'kubernetes',
  'doc': 'docker',
  'p': 'payment',

};
