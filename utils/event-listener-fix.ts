/**
 * Module pour gérer les limites d'écouteurs d'événements
 * Augmente la limite maximale d'écouteurs pour éviter les avertissements
 */

import { EventEmitter } from 'events';

// Augmenter la limite par défaut d'écouteurs pour tout le processus
export function increaseEventListenerLimit(limit: number = 20): void {
  // Définir une nouvelle limite par défaut pour tous les EventEmitter
  EventEmitter.defaultMaxListeners = limit;
}

// Augmenter la limite d'un émetteur spécifique
export function setListenerLimitForEmitter(emitter: EventEmitter, limit: number = 20): void {
  emitter.setMaxListeners(limit);
}

// Nettoyer les écouteurs après utilisation
export function cleanupListeners(emitter: EventEmitter, event: string): void {
  emitter.removeAllListeners(event);
}
