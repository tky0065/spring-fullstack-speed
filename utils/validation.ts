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
