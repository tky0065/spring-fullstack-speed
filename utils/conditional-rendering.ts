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
 * @returns Le contexte enrichi avec les fonctions d'aide conditionnelles
 */
export function addConditionalHelpersToContext(context: Record<string, any>): Record<string, any> {
  return {
    ...context,
    if_frontend: (frontendType: string, options: any): string => {
      const matches = context.frontendFramework === frontendType;
      return matches ? options.fn(context) : options.inverse(context);
    },
    if_database: (dbType: string, options: any): string => {
      const matches = context.database === dbType;
      return matches ? options.fn(context) : options.inverse(context);
    },
    if_build_tool: (buildTool: string, options: any): string => {
      const matches = context.buildTool === buildTool;
      return matches ? options.fn(context) : options.inverse(context);
    },
    if_has_feature: (feature: string, options: any): string => {
      const matches = Array.isArray(context.additionalFeatures) &&
                       context.additionalFeatures.includes(feature);
      return matches ? options.fn(context) : options.inverse(context);
    },
    if_has_auth: (options: any): string => {
      const hasAuth = context.includeAuth === true;
      return hasAuth ? options.fn(context) : options.inverse(context);
    }
  };
}
