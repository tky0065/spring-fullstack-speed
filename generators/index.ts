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

// Définit les types de générateurs disponibles
export const GENERATOR_TYPES = {
  APP: 'app',
  ENTITY: 'entity',
  CRUD: 'crud',
  MODULE: 'module',
  DTOS: 'dtos'
};
