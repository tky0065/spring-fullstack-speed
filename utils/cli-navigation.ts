/**
 * Module de navigation CLI
 * Permet à l'utilisateur de naviguer de manière interactive dans le CLI
 * avec des raccourcis clavier et un système de menus adaptatif.
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import { COMMAND_PAGE_SIZE } from './config.js';
import { displaySectionTitle, displaySectionEnd, info } from './cli-ui.js';

// Types
type MenuItem = {
  name: string;
  value: string;
  description?: string;
  disabled?: boolean | string;
};

/**
 * Affiche un menu paginé et permet la navigation
 * @param title Titre du menu
 * @param items Éléments du menu
 * @param pageSize Taille de la page
 * @returns L'élément sélectionné
 */
export async function displayPaginatedMenu(
  title: string,
  items: MenuItem[],
  pageSize = COMMAND_PAGE_SIZE
): Promise<string> {
  let currentPage = 1;
  const totalPages = Math.ceil(items.length / pageSize);

  // Ajouter des items de navigation si plusieurs pages
  const getPageItems = (page: number) => {
    const startIdx = (page - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, items.length);
    const pageItems = items.slice(startIdx, endIdx);

    const navigationItems: MenuItem[] = [];

    if (totalPages > 1) {
      if (page > 1) {
        navigationItems.push({
          name: '⬆️ Page précédente',
          value: '__prev',
          description: 'Aller à la page précédente'
        });
      }

      if (page < totalPages) {
        navigationItems.push({
          name: '⬇️ Page suivante',
          value: '__next',
          description: 'Aller à la page suivante'
        });
      }

      navigationItems.push({
        name: '🔍 Rechercher',
        value: '__search',
        description: 'Rechercher dans les options'
      });
    }

    return [...pageItems, ...navigationItems];
  };

  displaySectionTitle(title);
  info(`Page ${currentPage}/${totalPages}`);

  while (true) {
    const pageItems = getPageItems(currentPage);

    const { selection } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selection',
        message: 'Choisissez une option:',
        choices: pageItems,
        pageSize: Math.min(pageSize + 3, 15)
      }
    ]);

    if (selection === '__prev') {
      currentPage--;
      info(`Page ${currentPage}/${totalPages}`);
      continue;
    }

    if (selection === '__next') {
      currentPage++;
      info(`Page ${currentPage}/${totalPages}`);
      continue;
    }

    if (selection === '__search') {
      const { searchTerm } = await inquirer.prompt([
        {
          type: 'input',
          name: 'searchTerm',
          message: 'Entrez un terme de recherche:'
        }
      ]);

      if (searchTerm) {
        const results = items.filter(item =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        if (results.length === 0) {
          info(chalk.yellow('Aucun résultat trouvé. Réessayez.'));
        } else if (results.length === 1) {
          displaySectionEnd();
          return results[0].value;
        } else {
          const { foundSelection } = await inquirer.prompt([
            {
              type: 'list',
              name: 'foundSelection',
              message: `${results.length} résultats trouvés:`,
              choices: results
            }
          ]);

          displaySectionEnd();
          return foundSelection;
        }
      }

      continue;
    }

    displaySectionEnd();
    return selection;
  }
}

/**
 * Fonction pour gérer l'entrée clavier dans une interface CLI
 * @param callback Fonction à exécuter lorsqu'une touche est pressée
 */
export async function withKeyboardInput(callback: (key: string) => Promise<boolean> | boolean): Promise<void> {
  const readline = await import('readline');
  readline.emitKeypressEvents(process.stdin);

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }

  return new Promise<void>((resolve) => {
    const keyPressHandler = async (str: string, key: any) => {
      // Sortir si ctrl+c est pressé
      if (key.ctrl && key.name === 'c') {
        process.stdin.removeListener('keypress', keyPressHandler);
        if (process.stdin.isTTY) {
          process.stdin.setRawMode(false);
        }
        process.exit();
      }

      const shouldContinue = await callback(key.name || str);
      if (!shouldContinue) {
        process.stdin.removeListener('keypress', keyPressHandler);
        if (process.stdin.isTTY) {
          process.stdin.setRawMode(false);
        }
        resolve();
      }
    };

    process.stdin.on('keypress', keyPressHandler);
  });
}

/**
 * Affiche un menu navigable avec les touches du clavier
 * @param title Titre du menu
 * @param items Éléments du menu
 * @param renderItem Fonction de rendu personnalisée pour chaque élément
 * @returns La valeur de l'élément sélectionné
 */
export async function showNavigableMenu<T>(
  title: string,
  items: Array<{ name: string; value: T; disabled?: boolean }>,
  renderItem?: (item: { name: string; value: T }, isSelected: boolean) => string
): Promise<T> {
  if (items.length === 0) {
    throw new Error('Le menu ne peut pas être vide');
  }

  displaySectionTitle(title);

  let selectedIndex = 0;
  let done = false;
  let result: T | null = null;

  const defaultRender = (item: { name: string; value: T }, isSelected: boolean) => {
    const prefix = isSelected ? chalk.green('› ') : '  ';
    return `${prefix}${isSelected ? chalk.bold(item.name) : item.name}`;
  };

  const renderer = renderItem || defaultRender;

  const renderMenu = () => {
    console.clear();
    console.log(chalk.bold(title) + '\n');
    items.forEach((item, index) => {
      if (item.disabled) {
        console.log(chalk.gray(`  ${item.name} (non disponible)`));
      } else {
        console.log(renderer(item, index === selectedIndex));
      }
    });
    console.log('\n' + chalk.gray('Utilisez les flèches ↑/↓ pour naviguer, Entrée pour sélectionner, Ctrl+C pour quitter'));
  };

  renderMenu();

  await withKeyboardInput(async (key) => {
    if (key === 'up' || key === 'k') {
      do {
        selectedIndex = (selectedIndex - 1 + items.length) % items.length;
      } while (items[selectedIndex].disabled);
      renderMenu();
    } else if (key === 'down' || key === 'j') {
      do {
        selectedIndex = (selectedIndex + 1) % items.length;
      } while (items[selectedIndex].disabled);
      renderMenu();
    } else if (key === 'return') {
      result = items[selectedIndex].value;
      done = true;
      return false; // Arrêter l'écoute des touches
    }
    return !done; // Continuer l'écoute des touches tant que done est false
  });

  displaySectionEnd();
  return result as T;
}
