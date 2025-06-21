import path from 'path';
import fs from 'fs';
import assert from 'yeoman-assert';
import helpers from 'yeoman-test';
import { fileURLToPath } from 'url';
import { describe, it, expect, jest, beforeAll } from '@jest/globals';
import { EventEmitter } from 'events';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurer explicitement l'environnement pour les tests
beforeAll(() => {
  process.env.NODE_ENV = 'test';
  // Augmenter la limite d'écouteurs d'événements pour éviter les avertissements
  EventEmitter.defaultMaxListeners = 20;
});

describe('Test des commandes CLI', () => {
  describe('Test des commandes principales', () => {
    it('Les commandes principales sont correctement définies dans le fichier index.ts', () => {
      // Vérifier que le fichier des générateurs existe
      assert.file(path.join(__dirname, '../index.ts'));

      // Récupérer le contenu du fichier index.ts
      const indexContent = fs.readFileSync(path.join(__dirname, '../index.ts'), 'utf8');

      // Vérifier que les générateurs principaux sont exportés
      const mainGenerators = [
        'App', 'Entity', 'Crud', 'Module', 'Dtos',
        'Add', 'Generate', 'Serve', 'Test', 'Deploy',
        'Migrate', 'Doctor', 'Upgrade', 'Plugins'
      ];

      // Vérifier que chaque générateur principal est exporté
      mainGenerators.forEach(generator => {
        assert.fileContent(path.join(__dirname, '../index.ts'), `export { default as ${generator}Generator }`);
      });

      // Vérifier que l'objet GENERATOR_TYPES contient tous les types nécessaires
      assert.fileContent(path.join(__dirname, '../index.ts'), 'BUILD: \'build\'');
    });
  });

  describe('Test des alias de commande', () => {
    it('Les alias sont correctement définis', () => {
      // Vérifier que le fichier des générateurs existe
      assert.file(path.join(__dirname, '../index.ts'));

      // Récupérer le contenu du fichier index.ts
      const indexContent = fs.readFileSync(path.join(__dirname, '../index.ts'), 'utf8');

      // Vérifier que les alias sont définis dans l'objet COMMAND_ALIASES
      const expectedAliases = {
        'g': 'generate',
        'e': 'entity',
        'd': 'dtos',
        'c': 'crud',
        'a': 'add',
        's': 'serve',
        'b': 'build',
        't': 'test'
      };

      // Vérifier que l'objet COMMAND_ALIASES est exporté
      assert.fileContent(path.join(__dirname, '../index.ts'), 'export const COMMAND_ALIASES');

      // Vérifier que chaque alias est défini
      for (const [alias, command] of Object.entries(expectedAliases)) {
        assert.fileContent(path.join(__dirname, '../index.ts'), `'${alias}': '${command}'`);
      }
    });
  });
});

// Test spécifique pour la structure du générateur generate
describe('Test de la structure du générateur generate', () => {
  it('Le dossier generate existe', () => {
    assert.file(path.join(__dirname, '../generate/index.ts'));
  });
});

// Test du CLI principal
describe('Test du fichier CLI principal', () => {
  it('Le fichier CLI importe bien le système d\'alias', () => {
    assert.file(path.join(__dirname, '../../cli.js'));
    const cliContent = fs.readFileSync(path.join(__dirname, '../../cli.js'), 'utf8');
    assert.fileContent(path.join(__dirname, '../../cli.js'), 'import { COMMAND_ALIASES }');
    assert.fileContent(path.join(__dirname, '../../cli.js'), 'if (generatorName in COMMAND_ALIASES)');
  });
});
