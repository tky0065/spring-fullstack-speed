import { describe, expect, test } from '@jest/globals';
import { identifyFileType } from '../generator-utils.js';

describe('Generator Utils', () => {
  describe('identifyFileType', () => {
    test('devrait identifier correctement les fichiers Java', () => {
      expect(identifyFileType('/path/to/User.java')).toBe('java');
      expect(identifyFileType('src/main/java/com/example/Controller.java')).toBe('java');
    });

    test('devrait identifier correctement les ressources', () => {
      expect(identifyFileType('src/main/resources/application.properties')).toBe('resource');
      expect(identifyFileType('/path/to/config.yml')).toBe('resource');
    });

    test('devrait identifier correctement les fichiers frontend', () => {
      expect(identifyFileType('frontend/src/App.jsx')).toBe('frontend');
      expect(identifyFileType('/path/to/style.css')).toBe('frontend');
    });

    test('devrait identifier correctement les fichiers javascript comme frontend', () => {
      expect(identifyFileType('src/main/resources/static/js/main.js')).toBe('frontend');
    });

    test('devrait identifier correctement les fichiers de configuration', () => {
      expect(identifyFileType('pom.xml')).toBe('config');
      expect(identifyFileType('config/settings.json')).toBe('config');
    });

    test('devrait retourner "other" pour les autres types de fichiers', () => {
      expect(identifyFileType('README.md')).toBe('other');
      expect(identifyFileType('LICENSE')).toBe('other');
    });
  });
});
