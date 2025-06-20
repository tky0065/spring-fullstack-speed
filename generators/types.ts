/**
 * Fichier de définition des types communs pour les générateurs
 */
import Generator from "yeoman-generator";
import { GlobalConfig } from "../utils/config.js";

// Définition des interfaces pour représenter les options de générateur

/**
 * Type pour les options personnalisées de nos générateurs
 * Cette interface utilise un index signature pour être compatible avec les options de Yeoman
 */
export interface SFSOptions {
  [key: string]: any;
  // Options communes
  destinationRoot?: string;
  skipInstall?: boolean;
  skipWelcome?: boolean;
  skipPrompts?: boolean;
  preset?: string;
  quickStart?: boolean;
}

/**
 * Options spécifiques au générateur d'entité
 * Nous ajoutons les options spécifiques à nos besoins
 */
export interface EntityGeneratorOptions extends SFSOptions {
  entityName?: string;
  package?: string;
  interactive?: boolean;
  skipRepository?: boolean;
  skipService?: boolean;
  skipController?: boolean;
  skipDto?: boolean;
}

/**
 * Options spécifiques au générateur d'application principale
 */
export interface AppGeneratorOptions extends SFSOptions {
  appName?: string;
  packageName?: string;
  buildTool?: string;
  frontendFramework?: string;
  database?: string;
  includeAuth?: boolean;
  authType?: string; // Ajout explicite de authType
  additionalFeatures?: string[];
  serverPort?: number;
  javaVersion?: string;
  springBootVersion?: string;
}

/**
 * Options spécifiques au générateur de modules
 */
export interface ModuleGeneratorOptions extends SFSOptions {
  moduleName?: string;
  basePackage?: string;
  moduleType?: string;
  moduleFeatures?: string[];
}

/**
 * Options spécifiques au générateur de DTOs
 */
export interface DtoGeneratorOptions extends SFSOptions {
  entityName?: string;
  dtoName?: string;
  basePackage?: string;
  includeMappers?: boolean;
  useRecords?: boolean;
  useBuilders?: boolean;
}

/**
 * Options pour les générateurs de plugins
 */
export interface PluginGeneratorOptions extends SFSOptions {
  pluginType?: string;
  pluginName?: string;
}

/**
 * Options pour les tests
 */
export interface TestGeneratorOptions extends SFSOptions {
  testType?: string; // unit, integration, e2e
  component?: string; // le composant à tester
  packageName?: string;
  mockStrategy?: string;
}

/**
 * Interface de base pour les réponses des prompts
 * Étend GlobalConfig pour assurer la cohérence avec la configuration
 */
export interface BaseAnswers extends GlobalConfig {
  [key: string]: any;
}

/**
 * Caractéristiques communes pour les questions
 */
export type YeomanQuestion = Parameters<Generator["prompt"]>[0];

/**
 * Types pour les champs d'entité
 */
export interface EntityField {
  name: string;
  type: string;
  required: boolean;
  unique: boolean;
  minLength: number | null;
  maxLength: number | null;
  min: number | null;
  max: number | null;
  enumValues: string[] | null;
  relationship?: EntityRelationship | null;
}

/**
 * Types de relations entre entités
 */
export interface EntityRelationship {
  type: 'OneToOne' | 'OneToMany' | 'ManyToOne' | 'ManyToMany';
  targetEntity: string;
  ownerSide: boolean;
  mappedBy?: string;
  fetchType?: 'EAGER' | 'LAZY';
  cascade?: ('PERSIST' | 'MERGE' | 'REMOVE' | 'REFRESH' | 'DETACH' | 'ALL')[];
  orphanRemoval?: boolean;
}

/**
 * Réponses du générateur d'entité
 */
export interface EntityGeneratorAnswers {
  entityName: string;
  packageName: string;
  generateRepository: boolean;
  generateService: boolean;
  generateController: boolean;
  generateDto: boolean;
  auditable: boolean;
}

/**
 * Réponses du générateur principal (app)
 */
export interface AppGeneratorAnswers {
  appName: string;
  packageName: string;
  buildTool: string;
  database: string;
  frontendFramework: string;
  includeAuth: boolean;
  authType?: string;
  oauth2Providers?: string[];
  additionalFeatures?: string[];
}

/**
 * Configuration du projet dans le fichier .yo-rc.json
 */
export interface ProjectConfig {
  packageName: string;
  buildTool: string;
  database: string;
  frontendFramework: string;
  authEnabled: boolean;
  authType?: string;
  features: string[];
  [key: string]: any;
}
