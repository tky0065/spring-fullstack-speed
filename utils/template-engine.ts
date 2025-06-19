/**
 * Utilitaires pour le templating EJS
 */
import ejs from 'ejs';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

/**
 * Rend un template EJS avec les données fournies
 * @param templatePath Chemin vers le fichier template
 * @param data Données à injecter dans le template
 * @returns Chaîne rendue
 */
export function renderTemplate(templatePath: string, data: Record<string, any>): string {
  try {
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    return ejs.render(templateContent, data);
  } catch (error) {
    console.error(chalk.red(`Erreur lors du rendu du template: ${templatePath}`));
    console.error(error);
    throw error;
  }
}

/**
 * Rend un template EJS et écrit le résultat dans un fichier
 * @param templatePath Chemin vers le fichier template
 * @param outputPath Chemin de sortie pour le fichier généré
 * @param data Données à injecter dans le template
 */
export function renderTemplateToFile(templatePath: string, outputPath: string, data: Record<string, any>): void {
  const rendered = renderTemplate(templatePath, data);

  // Crée le répertoire parent s'il n'existe pas
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Écrit le fichier
  fs.writeFileSync(outputPath, rendered);
}

/**
 * Vérifie si un template EJS est valide
 * @param templatePath Chemin vers le fichier template
 * @returns true si le template est valide, false sinon
 */
export function validateTemplate(templatePath: string): boolean {
  try {
    // Essaie de compiler le template
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    ejs.compile(templateContent);
    return true;
  } catch (error) {
    console.error(chalk.red(`Template invalide: ${templatePath}`));
    console.error(error);
    return false;
  }
}

/**
 * Traite une chaîne comme un template EJS
 * @param template Chaîne template
 * @param data Données à injecter
 * @returns Chaîne rendue
 */
export function renderString(template: string, data: Record<string, any>): string {
  try {
    return ejs.render(template, data);
  } catch (error) {
    console.error(chalk.red('Erreur lors du rendu de la chaîne template'));
    console.error(error);
    throw error;
  }
}

/**
 * Transforme un nom de fichier EJS en nom de fichier de sortie
 * ex: MyClass.java.ejs -> MyClass.java
 * @param filename Nom du fichier EJS
 * @returns Nom du fichier sans l'extension .ejs
 */
export function getOutputFilename(filename: string): string {
  return filename.replace(/\.ejs$/, '');
}

/**
 * Construit le contexte global avec les helpers pour les templates
 * @param baseContext Contexte de base
 * @returns Contexte enrichi
 */
export function buildTemplateContext(baseContext: Record<string, any>): Record<string, any> {
  // Ajoute des fonctions helper pour utiliser dans les templates
  return {
    ...baseContext,

    // Helper pour mettre en majuscule la première lettre d'une chaîne
    capitalize: (str: string): string => {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    },

    // Helper pour convertir en camelCase
    camelCase: (str: string): string => {
      if (!str) return '';
      return str.replace(/[-_]([a-z])/g, (g) => g[1].toUpperCase());
    },

    // Helper pour convertir en PascalCase
    pascalCase: (str: string): string => {
      const camelCase = str.replace(/[-_]([a-z])/g, (g) => g[1].toUpperCase());
      return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
    },

    // Helper pour générer un secret aléatoire
    generateRandomSecret: (length = 32): string => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      const randomValues = new Uint8Array(length);
      crypto.getRandomValues(randomValues);
      randomValues.forEach(val => {
        result += chars.charAt(val % chars.length);
      });
      return result;
    },

    // Helper pour formater la date
    formatDate: (date = new Date()): string => {
      return date.toISOString().split('T')[0];
    },

    // Helper pour échapper du HTML
    escapeHtml: (unsafe: string): string => {
      return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  };
}
