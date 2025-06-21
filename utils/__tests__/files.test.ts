import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { getFileExtension, generateFile, writeJsonFile, readJsonFile, injectIntoFile } from '../files.js';
import path from 'path';
import fs from 'fs';
import { GlobalConfig, DEFAULT_CONFIG } from '../config.js';
import { isFrontend, isDatabase } from '../conditional-rendering.js';

// Créer des mocks pour les fonctions spécifiques de fs que nous utilisons
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  readFileSync: jest.fn().mockReturnValue('{"test":"data"}'),
  writeFileSync: jest.fn(),
  statSync: jest.fn().mockReturnValue({ isDirectory: () => false }),
  readdirSync: jest.fn().mockReturnValue([]),
  mkdirSync: jest.fn()
}));

// Configuration des mocks avant chaque test
beforeEach(() => {
  jest.clearAllMocks();
  fs.existsSync = jest.fn().mockReturnValue(true);
  fs.readFileSync = jest.fn().mockReturnValue('{"test":"data"}');
  fs.writeFileSync = jest.fn();
  fs.statSync = jest.fn().mockReturnValue({ isDirectory: () => false });
  fs.readdirSync = jest.fn().mockReturnValue([]);
  fs.mkdirSync = jest.fn();
});

// Créer un mock pour le générateur Yeoman
const mockYeomanGenerator = {
  templatePath: jest.fn((filePath) => filePath),
  destinationPath: jest.fn((filePath) => filePath),
  fs: {
    copyTpl: jest.fn(),
    read: jest.fn().mockImplementation(() => ''),
    write: jest.fn(),
    store: {
      get: jest.fn()
    }
  }
};

describe('File Utils', () => {
  test('getFileExtension devrait retourner l\'extension du fichier', () => {
    expect(getFileExtension('file.txt')).toBe('txt');
    expect(getFileExtension('script.js')).toBe('js');
    expect(getFileExtension('style.css')).toBe('css');
    expect(getFileExtension('index')).toBe('');
    expect(getFileExtension('.gitignore')).toBe('');
  });

  test('generateFile devrait appeler les méthodes appropriées du générateur', () => {
    const generator = { ...mockYeomanGenerator };
    const templatePath = 'templates/file.txt.ejs';
    const destinationPath = 'output/file.txt';
    const context = { name: 'Test' };

    // Utilisation de la fonction generateFile avec le bon format de paramètres
    generateFile(generator as any, templatePath, destinationPath, context);

    expect(generator.fs.copyTpl).toHaveBeenCalledWith(
      templatePath,
      destinationPath,
      expect.objectContaining({ config: context })
    );
  });

  test('writeJsonFile devrait écrire un fichier JSON formaté', () => {
    const filePath = 'config.json';
    const data = { name: 'Test', version: '1.0.0' };

    writeJsonFile(filePath, data);

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      filePath,
      JSON.stringify(data, null, 2),
      'utf8'
    );
  });

  test('readJsonFile devrait lire et parser un fichier JSON', () => {
    const filePath = 'config.json';
    const expectedData = { test: 'data' };

    const result = readJsonFile(filePath);

    expect(fs.readFileSync).toHaveBeenCalledWith(filePath, 'utf8');
    expect(result).toEqual(expectedData);
  });

  test('injectIntoFile devrait modifier le contenu d\'un fichier', () => {
    const filePath = 'file.txt';
    const content = 'Initial content';
    // Configurer le mock pour retourner le contenu existant
    (fs.readFileSync as jest.Mock).mockReturnValueOnce(content);

    // Appeler la fonction avec une regex pour remplacer 'Initial' par 'Initial Modified'
    injectIntoFile(filePath, ' Modified', /Initial/);

    // Vérifier que writeFileSync a été appelé avec les bons paramètres
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      filePath,
      'Initial Modified content',
      'utf8'
    );
  });
});
