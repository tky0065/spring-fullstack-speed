/**
 * Test simple pour vérifier que les tests peuvent s'exécuter
 * sans blocage dans l'interface interactive
 */

// Importer Jest pour exécuter des tests simples
import { describe, it, expect } from '@jest/globals';
import fs from 'fs';

// Configuration de l'environnement
process.env.NODE_ENV = 'test';

// Test très simple qui devrait toujours passer
describe('Tests de base', () => {
  it('devrait retourner true pour true', () => {
    expect(true).toBe(true);
  });

  it('devrait pouvoir additionner correctement', () => {
    expect(1 + 1).toBe(2);
  });
});

// Test pour vérifier que l'environnement Node.js fonctionne correctement
describe('Environnement Node.js', () => {
  it('devrait avoir accès au système de fichiers', () => {
    expect(typeof fs.readFileSync).toBe('function');
  });

  it('devrait pouvoir accéder aux variables d\'environnement', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});

// Test pour vérifier que Jest fonctionne correctement
describe('Fonctionnalités Jest', () => {
  it('devrait pouvoir faire des assertions asynchrones', async () => {
    const result = await Promise.resolve(42);
    expect(result).toBe(42);
  });
});
