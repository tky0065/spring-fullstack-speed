/**
 * Utilitaires pour la validation
 */
import chalk from "chalk";

const ERROR_PREFIX = chalk.red("✖ ");
const SUCCESS_PREFIX = chalk.green("✓ ");

/**
 * Valide le format d'un nom de package Java
 * @param input Le nom de package à valider
 * @returns true si valide, message d'erreur sinon
 */
export function validateJavaPackageName(input: string): boolean | string {
  if (!input || input.trim().length === 0) {
    return `${ERROR_PREFIX}Le nom du package ne peut pas être vide.`;
  }

  if (/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/.test(input)) {
    return true;
  }
  return `${ERROR_PREFIX}Le nom du package doit être un nom de package Java valide (ex: com.example.app).`;
}

/**
 * Valide le format d'un nom de classe Java
 * @param input Le nom de classe à valider
 * @returns true si valide, message d'erreur sinon
 */
export function validateJavaClassName(input: string): boolean | string {
  if (!input || input.trim().length === 0) {
    return `${ERROR_PREFIX}Le nom de la classe ne peut pas être vide.`;
  }

  if (/^[A-Z][a-zA-Z0-9_]*$/.test(input)) {
    return true;
  }
  return `${ERROR_PREFIX}Le nom de la classe doit commencer par une majuscule et ne contenir que des lettres, chiffres et underscore.`;
}

/**
 * Valide le format d'un nom d'application
 * @param input Le nom d'application à valider
 * @returns true si valide, message d'erreur sinon
 */
export function validateAppName(input: string): boolean | string {
  if (!input || input.trim().length === 0) {
    return `${ERROR_PREFIX}Le nom de l'application ne peut pas être vide.`;
  }

  if (/^[a-z][a-z0-9-]*$/.test(input)) {
    return true;
  }
  return `${ERROR_PREFIX}Le nom de l'application doit commencer par une lettre minuscule et ne contenir que des lettres minuscules, chiffres et tirets.`;
}

/**
 * Valide le format d'un nom de projet
 * @param input Le nom de projet à valider
 * @returns true si valide, message d'erreur sinon
 */
export function validateProjectName(input: string): boolean | string {
  if (!input || input.trim().length === 0) {
    return `${ERROR_PREFIX}Le nom du projet ne peut pas être vide.`;
  }

  if (input.length > 50) {
    return `${ERROR_PREFIX}Le nom du projet est trop long (50 caractères maximum).`;
  }

  if (/^[a-z][a-z0-9-]*$/.test(input)) {
    return true;
  }

  return `${ERROR_PREFIX}Le nom du projet doit commencer par une lettre minuscule et ne contenir que des lettres minuscules, chiffres et tirets.`;
}

/**
 * Valide une URL
 * @param input L'URL à valider
 * @param required Si l'URL est requise
 * @returns true si valide, message d'erreur sinon
 */
export function validateUrl(input: string, required: boolean = false): boolean | string {
  if (!required && (!input || input.trim().length === 0)) {
    return true;
  }

  if (required && (!input || input.trim().length === 0)) {
    return `${ERROR_PREFIX}L'URL ne peut pas être vide.`;
  }

  try {
    new URL(input);
    return true;
  } catch (e) {
    return `${ERROR_PREFIX}L'URL n'est pas valide.`;
  }
}

/**
 * Valide un port réseau
 * @param input Le port à valider
 * @returns true si valide, message d'erreur sinon
 */
export function validatePort(input: string): boolean | string {
  const port = parseInt(input, 10);
  if (isNaN(port) || port < 0 || port > 65535) {
    return `${ERROR_PREFIX}Le port doit être un nombre entre 0 et 65535.`;
  }
  return true;
}

/**
 * Valide une version de Java
 * @param input La version à valider
 * @returns true si valide, message d'erreur sinon
 */
export function validateJavaVersion(input: string): boolean | string {
  const validVersions = ['8', '11', '17', '21'];
  if (!validVersions.includes(input)) {
    return `${ERROR_PREFIX}Version Java non supportée. Versions supportées: ${validVersions.join(', ')}`;
  }
  return true;
}

/**
 * Valide un ensemble de choix multiples
 * @param input Liste des choix sélectionnés
 * @param min Nombre minimum de sélections
 * @param max Nombre maximum de sélections
 * @returns true si valide, message d'erreur sinon
 */
export function validateMultipleChoices(input: any[], min: number = 0, max: number | null = null): boolean | string {
  if (!input || input.length < min) {
    return `${ERROR_PREFIX}Veuillez sélectionner au moins ${min} option${min > 1 ? 's' : ''}.`;
  }

  if (max !== null && input.length > max) {
    return `${ERROR_PREFIX}Veuillez sélectionner au maximum ${max} option${max > 1 ? 's' : ''}.`;
  }

  return true;
}

/**
 * Valide que le nom n'est pas un mot réservé Java
 * @param input Le nom à valider
 * @returns true si valide, message d'erreur sinon
 */
export function validateNotReservedWord(input: string): boolean | string {
  const reservedWords = [
    'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char',
    'class', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum',
    'extends', 'final', 'finally', 'float', 'for', 'goto', 'if', 'implements',
    'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new', 'package',
    'private', 'protected', 'public', 'return', 'short', 'static', 'strictfp', 'super',
    'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'try', 'void',
    'volatile', 'while', 'true', 'false', 'null'
  ];

  if (reservedWords.includes(input.toLowerCase())) {
    return `${ERROR_PREFIX}Le nom "${input}" est un mot réservé en Java et ne peut pas être utilisé.`;
  }

  return true;
}
