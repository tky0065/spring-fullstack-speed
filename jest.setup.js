/**
 * Configuration pour l'environnement de test Jest
 * Ce fichier est exécuté avant chaque test
 */

// Importations ESM au lieu de CommonJS
import { EventEmitter } from 'events';
import { jest } from '@jest/globals';

// Configurer l'environnement de test
process.env.NODE_ENV = 'test';
process.env.JEST_WORKER_ID = '1';

// Augmenter la limite d'écouteurs d'événements pour éviter les avertissements
EventEmitter.defaultMaxListeners = 25;

// Supprimer les fonctions interactives qui bloquent les tests
// Mock d'inquirer pour éviter les interactions dans les tests
jest.mock('inquirer', () => {
  return {
    prompt: jest.fn().mockImplementation((questions) => {
      // Par défaut, renvoie des réponses prédéterminées selon le type de question
      const answers = {};

      // Traite les questions sous forme de tableau ou objet unique
      const questionsArray = Array.isArray(questions) ? questions : [questions];

      questionsArray.forEach(question => {
        if (question.name) {
          if (question.type === 'list' || question.type === 'rawlist') {
            // Pour les menus, prendre la première option
            answers[question.name] = question.choices && question.choices[0] && question.choices[0].value
              ? question.choices[0].value
              : 'quickstart';
          } else if (question.type === 'confirm') {
            // Pour les confirmations, toujours répondre par oui
            answers[question.name] = true;
          } else if (question.type === 'checkbox') {
            // Pour les checkbox, sélectionner les 2 premières options si disponibles
            answers[question.name] = question.choices && question.choices.length > 0
              ? question.choices.slice(0, 2).map(c => c.value || c)
                .filter(v => v !== undefined && typeof v !== 'object')
              : [];
          } else {
            // Pour les autres types, utiliser la valeur par défaut ou une chaîne générique
            answers[question.name] = question.default || 'test-value';
          }
        }
      });

      return Promise.resolve(answers);
    })
  };
});

console.log('Jest setup completed - Environment configured for interactive CLI tests');
