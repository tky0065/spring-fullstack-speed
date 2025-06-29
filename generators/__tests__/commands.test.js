const path = require('path');
const helpers = require('yeoman-test');
const assert = require('yeoman-assert');
const fs = require('fs');

describe('Test des commandes CLI', () => {
  describe('Test des commandes principales', () => {
    it('Les commandes principales sont correctement définies dans le fichier index.ts', () => {
      // Vérifier que le fichier des générateurs existe
      assert.file(path.join(__dirname, '../index.ts'));

      // Récupérer le contenu du fichier index.ts
      const indexContent = fs.readFileSync(path.join(__dirname, '../index.ts'), 'utf8');

      // Vérifier que toutes les commandes principales sont enregistrées (format ES Modules)
      [
        'add', 'generate', 'serve', 'test', 'build',
        'deploy', 'migrate', 'doctor', 'upgrade', 'plugins'
      ].forEach(cmd => {
        const capitalizedCmd = cmd.charAt(0).toUpperCase() + cmd.slice(1);
        assert.textIncludes(indexContent, `${capitalizedCmd}Generator`);
      });
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
      assert.textIncludes(indexContent, 'export const COMMAND_ALIASES');

      // Vérifier que chaque alias est défini
      for (const [alias, command] of Object.entries(expectedAliases)) {
        assert.textIncludes(indexContent, `'${alias}': '${command}'`);
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
    assert.textIncludes(cliContent, 'import { COMMAND_ALIASES }');
    assert.textIncludes(cliContent, 'if (generatorName in COMMAND_ALIASES)');
  });
});
