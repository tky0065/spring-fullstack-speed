import { describe, it, expect } from '@jest/globals';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Test des alias de commande', () => {
  it('Les alias de commande sont correctement définis dans index.ts', () => {
    // Vérifier que le fichier existe
    const indexPath = path.join(__dirname, '../index.ts');
    expect(fs.existsSync(indexPath)).toBe(true);

    // Lire le contenu du fichier
    const content = fs.readFileSync(indexPath, 'utf8');

    // Vérifier la présence de l'objet COMMAND_ALIASES
    expect(content).toContain('export const COMMAND_ALIASES');

    // Vérifier la présence des alias principaux
    const expectedAliases = ['g', 'e', 'd', 'c', 'a', 's', 'b', 't'];
    expectedAliases.forEach(alias => {
      expect(content).toContain(`'${alias}':`);
    });
  });
});
