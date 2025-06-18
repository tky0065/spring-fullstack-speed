import { getFileExtension } from '../files.js';
import path from 'path';

// Note: Certaines fonctions comme fileExists, readFile nécessitent des mocks
// pour être testées efficacement sans dépendre du système de fichiers réel

describe('File Utils', () => {
  describe('getFileExtension', () => {
    test('should correctly extract file extensions', () => {
      expect(getFileExtension('file.txt')).toBe('txt');
      expect(getFileExtension('image.jpg')).toBe('jpg');
      expect(getFileExtension('script.js')).toBe('js');
      expect(getFileExtension('style.css')).toBe('css');
      expect(getFileExtension('path/to/file.md')).toBe('md');
      expect(getFileExtension('C:\\Windows\\file.bat')).toBe('bat');
    });

    test('should handle files without extensions', () => {
      expect(getFileExtension('README')).toBe('');
      expect(getFileExtension('Dockerfile')).toBe('');
    });

    test('should handle files with multiple dots', () => {
      expect(getFileExtension('archive.tar.gz')).toBe('gz');
      expect(getFileExtension('script.test.js')).toBe('js');
    });
  });
});
