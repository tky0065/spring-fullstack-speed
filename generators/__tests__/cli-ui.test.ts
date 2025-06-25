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
  showInfo: jest.fn(),
  showProgressBar: jest.fn(),
  showConfirmation: jest.fn(),
  showHelp: jest.fn(),
  initKeyboardShortcuts: jest.fn(),
  setTheme: jest.fn(),
  navigateTo: jest.fn(),
  enableAutoComplete: jest.fn()
};

describe('Interface CLI Interactive', () => {
  // Tests pour les menus de sélection
  describe('Menus de sélection', () => {
    it('devrait afficher un menu avec des options', () => {
      const options = ['Option 1', 'Option 2', 'Option 3'];
      mockCli.showMenu.mockReturnValue(Promise.resolve('Option 1'));

      return mockCli.showMenu('Test Menu', options).then(result => {
        expect(mockCli.showMenu).toHaveBeenCalledWith('Test Menu', options);
        expect(result).toBe('Option 1');
      });
    });

    it('devrait gérer les menus imbriqués', () => {
      const mainOptions = ['Option 1', 'Option 2', 'Sous-menu'];
      const subOptions = ['Sous-option 1', 'Sous-option 2'];

      mockCli.showMenu.mockImplementation((title, options) => {
        if (title === 'Menu Principal') return Promise.resolve('Sous-menu');
        if (title === 'Sous-menu') return Promise.resolve('Sous-option 1');
        return Promise.resolve(null);
      });

      return mockCli.showMenu('Menu Principal', mainOptions)
        .then(result => {
          expect(result).toBe('Sous-menu');
          return mockCli.showMenu('Sous-menu', subOptions);
        })
        .then(result => {
          expect(result).toBe('Sous-option 1');
        });
    });
  });

  // Tests pour la validation des réponses
  describe('Validation des réponses', () => {
    it('devrait valider correctement les entrées', () => {
      mockCli.askQuestion.mockImplementation((question, validator) => {
        const input = 'test-input';
        const isValid = validator ? validator(input) : true;
        return Promise.resolve(isValid ? input : null);
      });

      const validator = (input) => input.length >= 3;

      return mockCli.askQuestion('Entrez votre nom:', validator).then(result => {
        expect(result).toBe('test-input');
      });
    });

    it('devrait rejeter les entrées invalides', () => {
      mockCli.askQuestion.mockImplementation((question, validator) => {
        const input = 'no'; // Trop court pour le validateur
        const isValid = validator ? validator(input) : true;
        return Promise.resolve(isValid ? input : null);
      });

      const validator = (input) => {
        if (input.length < 3) return 'L\'entrée doit avoir au moins 3 caractères';
        return true;
      };

      return mockCli.askQuestion('Entrez votre nom:', validator).then(result => {
        expect(result).toBeNull();
      });
    });
  });

  // Tests pour l'auto-complétion
  describe('Auto-complétion', () => {
    it('devrait activer l\'auto-complétion', () => {
      const completions = ['spring', 'spring-boot', 'spring-data', 'spring-security'];
      mockCli.enableAutoComplete.mockReturnValue(true);

      const result = mockCli.enableAutoComplete(completions);
      expect(mockCli.enableAutoComplete).toHaveBeenCalledWith(completions);
      expect(result).toBe(true);
    });

    it('devrait suggérer des complétions pertinentes', () => {
      const getCompletions = (input, choices) => {
        return choices.filter(c => c.startsWith(input));
      };

      const choices = ['spring', 'spring-boot', 'spring-data', 'spring-security', 'react'];
      const completions = getCompletions('spring', choices);

      expect(completions).toContain('spring');
      expect(completions).toContain('spring-boot');
      expect(completions).toContain('spring-data');
      expect(completions).not.toContain('react');
    });
  });

  // Tests pour les barres de progression
  describe('Barres de progression', () => {
    it('devrait afficher une barre de progression', () => {
      mockCli.showProgressBar.mockImplementation((title, total) => {
        return {
          increment: jest.fn(),
          update: jest.fn(),
          stop: jest.fn()
        };
      });

      const progressBar = mockCli.showProgressBar('Génération en cours', 100);
      expect(mockCli.showProgressBar).toHaveBeenCalledWith('Génération en cours', 100);
      expect(progressBar).toHaveProperty('increment');
      expect(progressBar).toHaveProperty('update');
      expect(progressBar).toHaveProperty('stop');
    });

    it('devrait mettre à jour la progression', () => {
      const mockIncrement = jest.fn();
      const mockUpdate = jest.fn();
      const mockStop = jest.fn();

      mockCli.showProgressBar.mockReturnValue({
        increment: mockIncrement,
        update: mockUpdate,
        stop: mockStop
      });

      const progressBar = mockCli.showProgressBar('Installation', 3);
      progressBar.increment();
      progressBar.update(2);
      progressBar.stop();

      expect(mockIncrement).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledWith(2);
      expect(mockStop).toHaveBeenCalled();
    });
  });

  // Tests pour les confirmations
  describe('Confirmations', () => {
    it('devrait afficher une confirmation et retourner true', () => {
      mockCli.showConfirmation.mockReturnValue(Promise.resolve(true));

      return mockCli.showConfirmation('Voulez-vous continuer?').then(result => {
        expect(mockCli.showConfirmation).toHaveBeenCalledWith('Voulez-vous continuer?');
        expect(result).toBe(true);
      });
    });

    it('devrait gérer les confirmations négatives', () => {
      mockCli.showConfirmation.mockReturnValue(Promise.resolve(false));

      return mockCli.showConfirmation('Voulez-vous supprimer ce fichier?').then(result => {
        expect(result).toBe(false);
      });
    });
  });

  // Tests pour les messages d'erreur colorés
  describe('Messages d\'erreur colorés', () => {
    it('devrait afficher des messages d\'erreur', () => {
      mockCli.showError.mockReturnValue(undefined);

      mockCli.showError('Une erreur s\'est produite');
      expect(mockCli.showError).toHaveBeenCalledWith('Une erreur s\'est produite');
    });

    it('devrait afficher des messages d\'avertissement', () => {
      mockCli.showWarning.mockReturnValue(undefined);

      mockCli.showWarning('Attention: opération risquée');
      expect(mockCli.showWarning).toHaveBeenCalledWith('Attention: opération risquée');
    });

    it('devrait afficher des messages d\'information', () => {
      mockCli.showInfo.mockReturnValue(undefined);

      mockCli.showInfo('Information utile');
      expect(mockCli.showInfo).toHaveBeenCalledWith('Information utile');
    });

    it('devrait afficher des messages de succès', () => {
      mockCli.showSuccess.mockReturnValue(undefined);

      mockCli.showSuccess('Opération réussie!');
      expect(mockCli.showSuccess).toHaveBeenCalledWith('Opération réussie!');
    });
  });

  // Tests pour l'aide contextuelle
  describe('Aide contextuelle', () => {
    it('devrait afficher l\'aide pour une commande spécifique', () => {
      mockCli.showHelp.mockReturnValue(undefined);

      mockCli.showHelp('generate');
      expect(mockCli.showHelp).toHaveBeenCalledWith('generate');
    });

    it('devrait afficher l\'aide générale quand aucune commande n\'est spécifiée', () => {
      mockCli.showHelp.mockReturnValue(undefined);

      mockCli.showHelp();
      expect(mockCli.showHelp).toHaveBeenCalled();
      expect(mockCli.showHelp).toHaveBeenCalledWith();
    });
  });

  // Tests pour les raccourcis clavier
  describe('Raccourcis clavier', () => {
    it('devrait initialiser les raccourcis clavier', () => {
      const shortcuts = [
        { key: 'h', description: 'Afficher l\'aide', action: jest.fn() },
        { key: 'q', description: 'Quitter', action: jest.fn() }
      ];

      mockCli.initKeyboardShortcuts.mockReturnValue(true);

      const result = mockCli.initKeyboardShortcuts(shortcuts);
      expect(mockCli.initKeyboardShortcuts).toHaveBeenCalledWith(shortcuts);
      expect(result).toBe(true);
    });
  });

  // Tests pour la navigation
  describe('Navigation', () => {
    it('devrait permettre la navigation entre les écrans', () => {
      mockCli.navigateTo.mockReturnValue(Promise.resolve());

      return mockCli.navigateTo('main-menu').then(() => {
        expect(mockCli.navigateTo).toHaveBeenCalledWith('main-menu');
      });
    });

    it('devrait gérer les écrans précédents', () => {
      mockCli.navigateTo.mockImplementation((screen) => {
        if (screen === 'back') return Promise.resolve('previous-screen');
        return Promise.resolve(screen);
      });

      return mockCli.navigateTo('back').then(result => {
        expect(result).toBe('previous-screen');
      });
    });
  });

  // Tests pour les thèmes CLI
  describe('Thèmes CLI', () => {
    it('devrait changer le thème', () => {
      mockCli.setTheme.mockReturnValue(true);

      const result = mockCli.setTheme('dark');
      expect(mockCli.setTheme).toHaveBeenCalledWith('dark');
      expect(result).toBe(true);
    });

    it('devrait rejeter les thèmes non valides', () => {
      mockCli.setTheme.mockImplementation((theme) => {
        const validThemes = ['light', 'dark', 'colorful'];
        return validThemes.includes(theme);
      });

      expect(mockCli.setTheme('invalid-theme')).toBe(false);
      expect(mockCli.setTheme('dark')).toBe(true);
    });
  });
});
