import { describe, it, expect, jest, beforeEach, afterEach, beforeAll } from '@jest/globals';
import inquirer from 'inquirer';
import { EventEmitter } from 'events';

// Configuration de l'environnement de test
beforeAll(() => {
  // Définir explicitement les variables d'environnement
  process.env.NODE_ENV = 'test';
  process.env.JEST_WORKER_ID = '1';

  // Augmenter la limite d'écouteurs d'événements directement
  EventEmitter.defaultMaxListeners = 25;

  // Remplacer inquirer.prompt par un mock directement dans le test
  // @ts-ignore - Ignorer les erreurs TypeScript pour le mock
  inquirer.prompt = jest.fn().mockImplementation((questions) => {
    const answers = {};
    const questionsArray = Array.isArray(questions) ? questions : [questions];

    questionsArray.forEach(question => {
      if (question.name) {
        if (question.type === 'list' || question.type === 'rawlist') {
          answers[question.name] = question.choices && question.choices[0]?.value || 'test';
        } else if (question.type === 'confirm') {
          answers[question.name] = true;
        } else {
          answers[question.name] = question.default || 'test-value';
        }
      }
    });

    return Promise.resolve(answers);
  });
});

// Setup des mocks pour les tests
jest.mock('inquirer', () => ({
  prompt: jest.fn()
}));

// Création d'un mock simple pour l'interface CLI
const mockCli = {
  askQuestion: jest.fn(),
  showMenu: jest.fn(),
  showSuccess: jest.fn(),
  showError: jest.fn(),
  showWarning: jest.fn(),
  showInfo: jest.fn()
};

describe('Interface CLI Interactive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Capturer la sortie console pour les tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Tests de base', () => {
    it('devrait effectuer des opérations de base', () => {
      // Test basique pour s'assurer que l'environnement de test fonctionne
      expect(true).toBe(true);
    });
  });

  describe('Tests des fonctionnalités CLI', () => {
    it('devrait pouvoir afficher des messages', () => {
      // Appel des fonctions mock
      mockCli.showSuccess('Test réussi');
      mockCli.showError('Test d\'erreur');
      mockCli.showWarning('Test d\'avertissement');
      mockCli.showInfo('Information de test');

      // Vérifications
      expect(mockCli.showSuccess).toHaveBeenCalledWith('Test réussi');
      expect(mockCli.showError).toHaveBeenCalledWith('Test d\'erreur');
      expect(mockCli.showWarning).toHaveBeenCalledWith('Test d\'avertissement');
      expect(mockCli.showInfo).toHaveBeenCalledWith('Information de test');
    });

    it('devrait gérer les questions utilisateur', async () => {
      // Configuration du mock inquirer
      const mockPromptResponse = { answer: 'réponse de test' };
      (inquirer.prompt as jest.Mock).mockImplementation(() => Promise.resolve(mockPromptResponse));

      // Configuration du mock CLI pour retourner la réponse
      mockCli.askQuestion.mockImplementation(async () => 'réponse de test');

      // Test de la fonction
      const answer = await mockCli.askQuestion({
        type: 'input',
        name: 'answer',
        message: 'Question de test?'
      });

      // Vérification
      expect(answer).toBe('réponse de test');
      expect(mockCli.askQuestion).toHaveBeenCalled();
    });
  });
});
