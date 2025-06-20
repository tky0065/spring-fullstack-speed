import { describe, expect, test } from '@jest/globals';
import path from 'path';
import { fileURLToPath } from 'url';
import helpers from 'yeoman-test';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const generatorPath = path.join(__dirname, '../generate');

describe('Générateur unifié generate', () => {
  jest.setTimeout(30000); // Augmente le timeout pour les tests plus longs

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
        .withArguments(['dtos', 'User'])
        .withOptions({ package: 'com.example.user', interactive: false, skipInstall: true })
        .run();

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe('Génération CRUD complet', () => {
    test('devrait générer un CRUD complet correctement', async () => {
      // Arrange & Act
      const result = await helpers
        .create(generatorPath)
        .withArguments(['crud', 'Order'])
        .withOptions({ package: 'com.example.order', interactive: false, skipInstall: true })
        .run();

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe('Gestion des erreurs', () => {
    test('devrait gérer un type de génération inconnu', async () => {
      // Arrange & Act & Assert
      await expect(async () => {
        await helpers
          .create(generatorPath)
          .withArguments(['unknown', 'Test'])
          .withOptions({ package: 'com.example.test', interactive: false, skipInstall: true })
          .run();
      }).rejects.toThrow();
    });
  });
});
