/**
 * Module d'interface utilisateur CLI
 * Fournit des fonctionnalités avancées pour améliorer l'expérience utilisateur
 * dans le terminal avec des couleurs, animations et interactions.
 */

import chalk from 'chalk';
import ora, { Ora } from 'ora';

// Constantes pour les couleurs et styles
const COLORS = {
  primary: chalk.blue,
  secondary: chalk.cyan,
  success: chalk.green,
  warning: chalk.yellow,
  error: chalk.red,
  info: chalk.white,
  muted: chalk.gray,
  highlight: chalk.magenta,
};

const SYMBOLS = {
  success: '✓',
  error: '✗',
  warning: '⚠',
  info: 'ℹ',
  arrow: '→',
  bullet: '•',
  star: '★',
};

/**
 * Interface pour les options de spinner
 */
interface SpinnerOptions {
  text?: string;
  color?: keyof typeof COLORS;
  spinner?: string;
}

/**
 * Interface pour les options de barre de progression
 */
interface ProgressBarOptions {
  total: number;
  width?: number;
  complete?: string;
  incomplete?: string;
  format?: string;
}

/**
 * Classe pour gérer les barres de progression dans le CLI
 */
export class ProgressBar {
  private current: number = 0;
  private options: Required<ProgressBarOptions>;
  private startTime: number;

  constructor(options: ProgressBarOptions) {
    this.options = {
      total: options.total,
      width: options.width || 40,
      complete: options.complete || '█',
      incomplete: options.incomplete || '░',
      format: options.format || ':bar :percent :elapseds [:current/:total]',
    };
    this.startTime = Date.now();
  }

  /**
   * Met à jour la progression de la barre
   * @param increment Valeur à ajouter à la progression actuelle
   */
  update(increment: number = 1): void {
    this.current += increment;
    if (this.current > this.options.total) {
      this.current = this.options.total;
    }
    this.render();
  }

  /**
   * Définit la valeur actuelle de la barre
   * @param value Nouvelle valeur
   */
  set(value: number): void {
    this.current = Math.min(value, this.options.total);
    this.render();
  }

  /**
   * Termine la barre de progression
   */
  complete(): void {
    this.current = this.options.total;
    this.render();
    process.stdout.write('\n');
  }

  /**
   * Affiche la barre de progression
   */
  private render(): void {
    const percent = Math.floor((this.current / this.options.total) * 100);
    const completeLength = Math.round((this.current / this.options.total) * this.options.width);
    const incompleteLength = this.options.width - completeLength;

    const bar =
      this.options.complete.repeat(completeLength) +
      this.options.incomplete.repeat(incompleteLength);

    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1) + 's';

    let output = this.options.format
      .replace(':bar', bar)
      .replace(':percent', `${percent}%`)
      .replace(':current', this.current.toString())
      .replace(':total', this.options.total.toString())
      .replace(':elapseds', elapsed);

    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(output);
  }
}

/**
 * Crée un nouveau spinner avec du texte coloré
 * @param options Options du spinner
 * @returns Instance Ora configurée
 */
export function createSpinner(options: SpinnerOptions = {}): Ora {
  const text = options.text || 'Chargement...';
  const color = options.color || 'primary';

  return ora({
    text: COLORS[color](text),
    spinner: options.spinner || 'dots',
    color: color === 'primary' ? 'blue' : color === 'secondary' ? 'cyan' : 'white',
  });
}

/**
 * Affiche un titre de section formaté
 * @param title Titre à afficher
 */
export function displaySectionTitle(title: string): void {
  const line = '─'.repeat(Math.max(0, 80 - title.length - 4));
  console.log(`\n${COLORS.secondary('┌── ')}${COLORS.primary.bold(title)} ${COLORS.secondary(line)}`);
}

/**
 * Affiche un sous-titre formaté
 * @param subtitle Sous-titre à afficher
 */
export function displaySubtitle(subtitle: string): void {
  console.log(`${COLORS.secondary('│')} ${COLORS.highlight(subtitle)}`);
}

/**
 * Affiche la fin d'une section
 */
export function displaySectionEnd(): void {
  console.log(`${COLORS.secondary('└')}${COLORS.secondary('─'.repeat(79))}\n`);
}

/**
 * Affiche un message d'information
 * @param message Message à afficher
 */
export function info(message: string): void {
  console.log(`${COLORS.info(SYMBOLS.info)} ${message}`);
}

/**
 * Affiche un message de succès
 * @param message Message à afficher
 */
export function success(message: string): void {
  console.log(`${COLORS.success(SYMBOLS.success)} ${message}`);
}

/**
 * Affiche un message d'erreur
 * @param message Message d'erreur
 */
export function error(message: string): void {
  console.log(`${COLORS.error(SYMBOLS.error)} ${message}`);
}

/**
 * Affiche un message d'avertissement
 * @param message Message d'avertissement
 */
export function warning(message: string): void {
  console.log(`${COLORS.warning(SYMBOLS.warning)} ${message}`);
}

/**
 * Affiche un tableau formaté dans le terminal
 * @param headers En-têtes des colonnes
 * @param rows Données des lignes
 */
export function displayTable(headers: string[], rows: any[][]): void {
  // Déterminer la largeur maximale de chaque colonne
  const widths = headers.map((h, i) => {
    const columnValues = [h, ...rows.map(r => String(r[i] || ''))];
    return Math.max(...columnValues.map(v => v.length)) + 2;
  });

  // Afficher l'en-tête
  const headerRow = headers.map((h, i) => h.padEnd(widths[i])).join('');
  console.log(COLORS.secondary(headerRow));

  // Afficher la ligne de séparation
  const separator = widths.map(w => '─'.repeat(w)).join('');
  console.log(COLORS.muted(separator));

  // Afficher les données
  for (const row of rows) {
    const formattedRow = row.map((cell, i) => String(cell || '').padEnd(widths[i])).join('');
    console.log(formattedRow);
  }
}

/**
 * Affiche un menu interactif avec des raccourcis
 * @param title Titre du menu
 * @param items Éléments du menu avec leurs raccourcis
 */
export function displayShortcutMenu(title: string, items: { key: string; description: string }[]): void {
  displaySectionTitle(title);

  for (const item of items) {
    console.log(`  ${COLORS.primary(item.key)} : ${item.description}`);
  }

  displaySectionEnd();
}

/**
 * Affiche une aide contextuelle
 * @param message Message d'aide
 */
export function showContextualHelp(message: string): void {
  console.log(`\n${COLORS.muted('Aide:')} ${message}\n`);
}

/**
 * Formate un texte pour afficher un raccourci clavier
 * @param keys Touches du raccourci
 */
export function formatKeyboardShortcut(keys: string): string {
  return COLORS.secondary(`[${keys}]`);
}

/**
 * Affiche un message de débogage (visible uniquement en mode verbose)
 * @param message Message de débogage
 * @param verbose Mode verbose activé ou non
 */
export function debug(message: string, verbose: boolean = false): void {
  if (verbose) {
    console.log(COLORS.muted(`${SYMBOLS.info} DEBUG: ${message}`));
  }
}
