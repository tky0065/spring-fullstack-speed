// @ts-nocheck
/**
 * Configuration de test compatible ESM
 */

// Configurer l'environnement de test
process.env.NODE_ENV = 'test';
process.env.JEST_WORKER_ID = '1';

// Augmenter la limite d'écouteurs d'événements
import { EventEmitter } from 'events';
EventEmitter.defaultMaxListeners = 25;

// Plutôt que d'utiliser jest.mock qui peut être problématique avec ESM,
// nous allons remplacer directement le module inquirer
import inquirer from 'inquirer';

// Remplacer la méthode prompt par un mock
const originalPrompt = inquirer.prompt;
inquirer.prompt = async (questions) => {
  // Traite les questions sous forme de tableau ou objet unique
  const questionsArray = Array.isArray(questions) ? questions : [questions];
  const answers = {};

  questionsArray.forEach(question => {
    if (!question || !question.name) return;

    switch (question.type) {
      case 'list':
      case 'rawlist':
        // Pour les menus, prendre la première option
        answers[question.name] = question.choices &&
          question.choices.length > 0 &&
          question.choices[0].value ?
          question.choices[0].value : 'quickstart';
        break;

      case 'confirm':
        // Pour les confirmations, toujours répondre par oui
        answers[question.name] = true;
        break;

      case 'checkbox':
        // Pour les checkbox, sélectionner les 2 premières options si disponibles
        answers[question.name] = question.choices &&
          question.choices.length > 0 ?
          question.choices.slice(0, 2)
            .map(c => typeof c === 'object' ? c.value : c)
            .filter(Boolean) :
          [];
        break;

      default:
        // Pour les autres types, utiliser la valeur par défaut ou une chaîne générique
        answers[question.name] = question.default || 'test-value';
    }
  });

  return answers;
};

// Message de confirmation
console.log('[TEST] Environment configured - Interactive CLI tests will bypass prompts');
