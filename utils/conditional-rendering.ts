/**
 * Utilitaires pour le rendu conditionnel dans les templates
 */
import { GlobalConfig } from './config.js';

/**
 * Type pour les conditions de rendu
 */
export type RenderCondition = (config: GlobalConfig) => boolean;

/**
 * Vérifie si le frontend sélectionné correspond à une valeur donnée
 * @param frontendType Le type de frontend à vérifier
 * @returns Fonction de condition qui retourne true si le frontend correspond
 */
export function isFrontend(frontendType: string): RenderCondition {
  return (config: GlobalConfig): boolean => config.frontendFramework === frontendType;
}

/**
 * Vérifie si la base de données sélectionnée correspond à une valeur donnée
 * @param dbType Le type de base de données à vérifier
 * @returns Fonction de condition qui retourne true si la base de données correspond
 */
export function isDatabase(dbType: string): RenderCondition {
  return (config: GlobalConfig): boolean => config.database === dbType;
}

/**
 * Vérifie si l'outil de build sélectionné correspond à une valeur donnée
 * @param buildTool L'outil de build à vérifier
 * @returns Fonction de condition qui retourne true si l'outil de build correspond
 */
export function isBuildTool(buildTool: string): RenderCondition {
  return (config: GlobalConfig): boolean => config.buildTool === buildTool;
}

/**
 * Vérifie si une fonctionnalité additionnelle est sélectionnée
 * @param feature La fonctionnalité à vérifier
 * @returns Fonction de condition qui retourne true si la fonctionnalité est sélectionnée
 */
export function hasFeature(feature: string): RenderCondition {
  return (config: GlobalConfig): boolean =>
    Array.isArray(config.additionalFeatures) &&
    config.additionalFeatures.includes(feature);
}

/**
 * Vérifie si l'authentification est incluse
 * @returns Fonction de condition qui retourne true si l'authentification est incluse
 */
export function hasAuth(): RenderCondition {
  return (config: GlobalConfig): boolean => config.includeAuth === true;
}

/**
 * Inverse une condition
 * @param condition La condition à inverser
 * @returns Fonction de condition qui retourne l'inverse de la condition d'origine
 */
export function not(condition: RenderCondition): RenderCondition {
  return (config: GlobalConfig): boolean => !condition(config);
}

/**
 * Combine plusieurs conditions avec un ET logique
 * @param conditions Les conditions à combiner
 * @returns Fonction de condition qui retourne true si toutes les conditions sont vraies
 */
export function and(...conditions: RenderCondition[]): RenderCondition {
  return (config: GlobalConfig): boolean =>
    conditions.every((condition) => condition(config));
}

/**
 * Combine plusieurs conditions avec un OU logique
 * @param conditions Les conditions à combiner
 * @returns Fonction de condition qui retourne true si au moins une condition est vraie
 */
export function or(...conditions: RenderCondition[]): RenderCondition {
  return (config: GlobalConfig): boolean =>
    conditions.some((condition) => condition(config));
}

/**
 * Évalue une condition avec la configuration donnée
 * @param condition La condition à évaluer
 * @param config La configuration à utiliser
 * @returns true si la condition est vraie, false sinon
 */
export function evaluateCondition(condition: RenderCondition, config: GlobalConfig): boolean {
  return condition(config);
}

/**
 * Ajoute des fonctions d'aide pour le rendu conditionnel dans un contexte de template
 * @param context Le contexte de template existant
 * @param config Configuration globale à utiliser pour les évaluations
 * @returns Le contexte enrichi avec les fonctions d'aide conditionnelles
 */
export function addConditionalHelpersToContext(
  context: Record<string, any>,
  config: GlobalConfig
): Record<string, any> {
  return {
    ...context,
    // Fonctions d'aide conditionnelles qui utilisent directement la config fournie
    if_frontend: (type: string, content: string, fallback: string = ''): string =>
      evaluateCondition(isFrontend(type), config) ? content : fallback,

    if_database: (type: string, content: string, fallback: string = ''): string =>
      evaluateCondition(isDatabase(type), config) ? content : fallback,

    if_build_tool: (type: string, content: string, fallback: string = ''): string =>
      evaluateCondition(isBuildTool(type), config) ? content : fallback,

    if_has_feature: (feature: string, content: string, fallback: string = ''): string =>
      evaluateCondition(hasFeature(feature), config) ? content : fallback,

    if_has_auth: (content: string, fallback: string = ''): string =>
      evaluateCondition(hasAuth(), config) ? content : fallback,

    // Fonction conditionnelle générique qui évalue une expression
    if_condition: (condition: boolean, content: string, fallback: string = ''): string =>
      condition ? content : fallback,

    // Fonction pour obtenir la valeur d'une propriété de configuration
    config_value: (path: string, defaultValue: any = undefined): any => {
      const pathParts = path.split('.');
      let value = config as any;

      for (const part of pathParts) {
        if (value === undefined || value === null) {
          return defaultValue;
        }
        value = value[part];
      }

      return value !== undefined ? value : defaultValue;
    },

    // Ajouter la config complète pour un accès direct si nécessaire
    config: config
  };
}

/**
 * Classe pour gérer le rendu conditionnel des blocs de code dans les templates
 */
export class ConditionalBlockRenderer {
  private config: GlobalConfig;

  constructor(config: GlobalConfig) {
    this.config = config;
  }

  /**
   * Détermine si un bloc de code doit être rendu en fonction d'une condition
   * @param condition La condition à évaluer
   * @returns true si le bloc doit être rendu, false sinon
   */
  shouldRenderBlock(condition: RenderCondition): boolean {
    return evaluateCondition(condition, this.config);
  }

  /**
   * Rend un bloc de code conditionnellement
   * @param condition La condition à évaluer
   * @param content Le contenu à rendre si la condition est vraie
   * @param fallback Le contenu à rendre si la condition est fausse (optionnel)
   * @returns Le contenu ou le fallback selon le résultat de la condition
   */
  renderBlock(condition: RenderCondition, content: string, fallback: string = ''): string {
    return this.shouldRenderBlock(condition) ? content : fallback;
  }
}
