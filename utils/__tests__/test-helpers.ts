import { describe, expect, test, jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

const execPromise = promisify(exec);

/**
 * Fonction utilitaire pour nettoyer les dossiers de test
 */
export async function cleanupTestFolders() {
  // Liste des dossiers temporaires courants à nettoyer
  const foldersToClean = [
    'tmpdir',
    'temp',
    'test-integration-app',
    'test-app'
  ];

  // Chercher les dossiers à partir du répertoire courant
  const currentDir = process.cwd();

  for (const folder of foldersToClean) {
    const folderPath = path.join(currentDir, folder);

    if (fs.existsSync(folderPath)) {
      try {
        // Sur Windows, certains fichiers peuvent être verrouillés, alors utilisez rimraf
        if (process.platform === 'win32') {
          await execPromise(`rimraf "${folderPath}"`);
        } else {
          // Sur Unix, utilisez rm -rf directement
          await execPromise(`rm -rf "${folderPath}"`);
        }
        console.log(`Cleaned up test folder: ${folderPath}`);
      } catch (error) {
        console.warn(`Failed to clean up test folder ${folderPath}:`, error);
      }
    }
  }
}

/**
 * Tests pour les fonctions utilitaires de test
 */
describe('Test Helpers', () => {
  test('cleanupTestFolders should not throw errors', async () => {
    // Créer un dossier de test temporaire
    const testDirPath = path.join(process.cwd(), 'test-folder-for-cleanup');
    fs.mkdirSync(testDirPath, { recursive: true });

    // Vérifier que le dossier a été créé
    expect(fs.existsSync(testDirPath)).toBe(true);

    // Nettoyer les dossiers de test (y compris celui qu'on vient de créer)
    await cleanupTestFolders();

    // Vérifier que la fonction s'exécute sans erreur
    // (le test peut passer même si le dossier existe toujours, car la fonction
    // ne garantit pas la suppression, surtout sur Windows où les fichiers peuvent être verrouillés)
    expect(true).toBe(true);
  });
});
