/**
 * Fichier de définition des types communs pour les générateurs
 */
import Generator from "yeoman-generator";

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
}

/**
 * Options spécifiques au générateur d'entité
 * Nous ajoutons les options spécifiques à nos besoins
 */
export interface EntityGeneratorOptions {
  entityName?: string;
  package?: string;
  interactive?: boolean;
  skipRepository?: boolean;
  skipService?: boolean;
  skipController?: boolean;
  skipDto?: boolean;
  [key: string]: any;  // Pour la compatibilité avec Yeoman
}

/**
 * Options spécifiques au générateur principal (app)
 */
export interface AppGeneratorOptions {
  appName?: string;
  packageName?: string;
  buildTool?: string;
  database?: string;
  frontendFramework?: string;
  skipTests?: boolean;
  skipDocker?: boolean;
  preset?: string;
  [key: string]: any;  // Pour la compatibilité avec Yeoman
}

/**
 * Options spécifiques au générateur de DTOs
 */
export interface DtoGeneratorOptions {
  entityClass?: string;
  package?: string;
  mapperFramework?: string;
  [key: string]: any;  // Pour la compatibilité avec Yeoman
}

/**
 * Options spécifiques au générateur de CRUD
 */
export interface CrudGeneratorOptions {
  entity?: string;
  package?: string;
  skipTests?: boolean;
  [key: string]: any;  // Pour la compatibilité avec Yeoman
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
