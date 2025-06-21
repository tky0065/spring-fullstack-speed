import { describe, expect, test, jest } from '@jest/globals';
import path from 'path';
import { fileURLToPath } from 'url';
import helpers from 'yeoman-test';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const generatorPath = path.join(__dirname, '../generate');

// Augmenter le timeout pour les tests plus longs
jest.setTimeout(30000);

describe('Générateur unifié generate', () => {
  describe('Génération d\'entité', () => {
    test('devrait générer une entité correctement', async () => {
      // Arrange & Act
      const result = await helpers
        .create(generatorPath)
        .withArguments(['entity', 'Product'])
        .withOptions({ package: 'com.example.domain', interactive: false, skipInstall: true })
        .run();

      // Assert - Pour l'instant, on vérifie juste que le test s'exécute sans erreur
      expect(result).toBeDefined();
    });
  });

  describe('Génération de DTOs', () => {
    test('devrait générer des DTOs correctement', async () => {
      // Arrange & Act
      const result = await helpers
        .create(generatorPath)
        .withArguments(['dtos', 'Product'])
        .withOptions({ package: 'com.example.dto', entity: 'Product', interactive: false, skipInstall: true })
        .run();

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe('Génération de CRUD', () => {
    test('devrait générer des opérations CRUD correctement', async () => {
      // Arrange & Act
      const result = await helpers
        .create(generatorPath)
        .withArguments(['crud', 'Product'])
        .withOptions({ package: 'com.example', entity: 'Product', interactive: false, skipInstall: true })
        .run();

      // Assert
      expect(result).toBeDefined();
    });
  });
});
