/**
 * Utilitaires pour le moteur de templates EJS
 */
import ejs from 'ejs';
import fs from 'fs';
import path from 'node:path';
import { promisify } from 'util';
import crypto from 'crypto';
import { addConditionalHelpersToContext } from './conditional-rendering.js';
import { getGlobalConfig, GlobalConfig } from './config.js';

const readFilePromise = promisify(fs.readFile);

/**
 * Options de rendu pour les templates
 */
export interface RenderOptions {
  [key: string]: any;
}

/**
 * Rend un template EJS avec les données fournies
 * @param template Contenu du template
 * @param data Données à injecter dans le template
 * @param options Options de rendu
 * @returns Contenu rendu
 */
export async function renderTemplate(
  template: string,
  data: Record<string, any> = {},
  options: RenderOptions = {}
): Promise<string> {
  try {
    const enhancedData = enhanceTemplateContext(data);
    return ejs.render(template, enhancedData, options);
  } catch (error) {
    console.error('Erreur lors du rendu du template:', error);
    throw error;
  }
}

/**
 * Rend un fichier template EJS avec les données fournies
 * @param templatePath Chemin du fichier template
 * @param data Données à injecter dans le template
 * @param options Options de rendu
 * @returns Contenu rendu
 */
export async function renderTemplateFile(
  templatePath: string,
  data: Record<string, any> = {},
  options: RenderOptions = {}
): Promise<string> {
  try {
    const template = await readFilePromise(templatePath, 'utf8');
    const enhancedData = enhanceTemplateContext(data);
    return ejs.render(template, enhancedData, { filename: templatePath, ...options });
  } catch (error) {
    console.error(`Erreur lors du rendu du template ${templatePath}:`, error);
    throw error;
  }
}

/**
 * Rend une chaîne comme un template EJS
 * @param str Chaîne à rendre
 * @param data Données à injecter
 * @param options Options de rendu
 * @returns Chaîne rendue
 */
export function renderString(
  str: string,
  data: Record<string, any> = {},
  options: RenderOptions = {}
): string {
  try {
    const enhancedData = enhanceTemplateContext(data);
    return ejs.render(str, enhancedData, options);
  } catch (error) {
    console.error(`Erreur lors du rendu de la chaîne:`, error);
    return str; // En cas d'erreur, retourner la chaîne originale
  }
}

/**
 * Génère un hash MD5 basé sur le contenu et les options
 * @param content Le contenu à hacher
 * @param salt Sel optionnel pour renforcer le hachage
 * @returns Le hash MD5 hexadécimal
 */
export function generateContentHash(content: string, salt: string = ''): string {
  return crypto.createHash('md5').update(content + salt).digest('hex');
}

/**
 * Construit un contexte de template avec les données fournies et la configuration globale
 * @param data Données spécifiques au template
 * @param config Configuration globale
 * @returns Contexte enrichi
 */
export function buildTemplateContext(
  data: Record<string, any> = {},
  config: GlobalConfig = getGlobalConfig()
): Record<string, any> {
  return {
    ...data,
    config,
    // Helpers spécifiques
    formatDate: (date: Date) => date.toLocaleDateString(),
    capitalize: (str: string) => str.charAt(0).toUpperCase() + str.slice(1),
    lower: (str: string) => str.toLowerCase(),
    upper: (str: string) => str.toUpperCase(),
    camelCase: (str: string) => str.replace(/[-_]([a-z])/g, g => g[1].toUpperCase()),
    pascalCase: (str: string) => {
      const camelCase = str.replace(/[-_]([a-z])/g, g => g[1].toUpperCase());
      return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
    },
    kebabCase: (str: string) => str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase(),
    snakeCase: (str: string) => str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase(),
    escapeHtml: (str: string) => str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  };
}

/**
 * Valide un template avant de le rendre
 * @param templatePath Chemin du template à valider
 * @returns true si le template est valide, sinon lance une exception
 */
export async function validateTemplate(templatePath: string): Promise<boolean> {
  try {
    const template = await readFilePromise(templatePath, 'utf8');
    // Vérifier que le template est un fichier EJS valide
    ejs.compile(template, { filename: templatePath });
    return true;
  } catch (error) {
    console.error(`Template invalide: ${templatePath}`);
    console.error(error);
    throw new Error(`Template invalide: ${templatePath} - ${error}`);
  }
}

/**
 * Génère un nom de fichier de sortie en fonction d'un chemin de template
 * @param templatePath Chemin du template
 * @param data Données de contexte
 * @returns Chemin du fichier de sortie
 */
export function getOutputFilename(templatePath: string, data: Record<string, any> = {}): string {
  // Exemple: transformer fichier.ejs en fichier
  let outputPath = templatePath.replace(/\.ejs$/, '');

  // Remplacer les variables dans le chemin (ex: __name__ devient la valeur de data.name)
  outputPath = outputPath.replace(/__([a-zA-Z0-9_]+)__/g, (_, key) => {
    return data[key] || '';
  });

  return outputPath;
}

/**
 * Enrichit le contexte du template avec des helpers utilitaires
 * @param context Contexte de base
 * @returns Contexte enrichi
 */
export function enhanceTemplateContext(context: Record<string, any> = {}): Record<string, any> {
  // Obtention de la configuration globale
  const config = getGlobalConfig();

  // Contexte de base avec des helpers utilitaires
  const contextWithBasicHelpers = {
    ...context,
    // Helper pour convertir une chaîne en camelCase
    camelCase: (str: string): string => {
      return str
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
          index === 0 ? word.toLowerCase() : word.toUpperCase()
        )
        .replace(/\s+/g, '');
    },

    // Helper pour convertir une chaîne en PascalCase
    pascalCase: (str: string): string => {
      return str
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
        .replace(/\s+/g, '');
    },

    // Helper pour convertir une chaîne en snake_case
    snakeCase: (str: string): string => {
      return str
        .replace(/\s+/g, '_')
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .toLowerCase();
    },

    // Helper pour convertir une chaîne en kebab-case
    kebabCase: (str: string): string => {
      return str
        .replace(/\s+/g, '-')
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .toLowerCase();
    },

    // Helper pour échapper les caractères HTML
    escapeHtml: (str: string): string => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  };

  // Ajoute les helpers conditionnels et retourne le contexte enrichi
  return addConditionalHelpersToContext(contextWithBasicHelpers, config);
}
