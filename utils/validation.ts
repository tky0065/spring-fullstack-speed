/**
 * Utilitaires pour la validation
 */

/**
 * Valide le format d'un nom de package Java
 * @param input Le nom de package à valider
 * @returns true si valide, message d'erreur sinon
 */
export function validateJavaPackageName(input: string): boolean | string {
  if (/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/.test(input)) {
    return true;
  }
  return "Le nom du package doit être un nom de package Java valide (ex: com.example.app).";
}

/**
 * Valide le format d'un nom de classe Java
 * @param input Le nom de classe à valider
 * @returns true si valide, message d'erreur sinon
 */
export function validateJavaClassName(input: string): boolean | string {
  if (/^[A-Z][a-zA-Z0-9_]*$/.test(input)) {
    return true;
  }
  return "Le nom de la classe doit commencer par une majuscule et ne contenir que des lettres, chiffres et underscore.";
}

/**
 * Valide le format d'un nom d'application
 * @param input Le nom d'application à valider
 * @returns true si valide, message d'erreur sinon
 */
export function validateAppName(input: string): boolean | string {
  if (/^[a-z][a-z0-9-]*$/.test(input)) {
    return true;
  }
  return "Le nom de l'application doit commencer par une lettre minuscule et ne contenir que des lettres minuscules, chiffres et tirets.";
}

/**
 * Valide le format d'un nom de projet
 * @param input Le nom de projet à valider
 * @returns true si valide, message d'erreur sinon
 */
export function validateProjectName(input: string): boolean | string {
  if (!input || input.trim().length === 0) {
    return "Le nom du projet ne peut pas être vide.";
  }

  if (input.length > 50) {
    return "Le nom du projet ne doit pas dépasser 50 caractères.";
  }

  if (/^[a-z][a-z0-9-]*$/.test(input)) {
    return true;
  }

  return "Le nom du projet doit commencer par une lettre minuscule et ne contenir que des lettres minuscules, chiffres et tirets (par exemple: my-awesome-project).";
}

/**
 * Valide un port réseau
 * @param input Le numéro de port à valider
 * @returns true si valide, message d'erreur sinon
 */
export function validatePort(input: string): boolean | string {
  const port = parseInt(input, 10);
  if (isNaN(port)) {
    return "Le port doit être un nombre.";
  }
  if (port < 0 || port > 65535) {
    return "Le port doit être entre 0 et 65535.";
  }
  return true;
}

/**
 * Valide une URL
 * @param input L'URL à valider
 * @returns true si valide, message d'erreur sinon
 */
export function validateUrl(input: string): boolean | string {
  try {
    new URL(input);
    return true;
  } catch (e) {
    return "URL invalide. Format attendu: http://example.com";
  }
}
