/**
 * Module de navigation CLI
 * Permet à l'utilisateur de naviguer de manière interactive dans le CLI
 * avec des raccourcis clavier et un système de menus adaptatif.
 */

import chalk from 'chalk';
import keypress from 'keypress';
import { displaySectionTitle, displaySectionEnd, info } from './cli-ui';

interface MenuItem {
  key: string;
  label: string;
  description?: string;
  action: () => void | Promise<void>;
}

interface MenuOptions {
  title: string;
  subtitle?: string;
  items: MenuItem[];
  exitKey?: string;
  exitLabel?: string;
}

/**
 * Active le mode écoute du clavier et retourne à l'état initial à la fin
 * @param callback Fonction appelée pendant l'écoute
 */
export async function withKeyboardInput(callback: () => Promise<void>): Promise<void> {
  // Configuration du terminal pour la capture des touches
  keypress(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();

  try {
    await callback();
  } finally {
    // Restauration des paramètres du terminal
    process.stdin.setRawMode(false);
    process.stdin.pause();
  }
}

/**
 * Affiche un menu navigable avec les raccourcis clavier
 * @param options Configuration du menu
 * @returns Promesse résolue lorsqu'une action est exécutée
 */
export async function showNavigableMenu(options: MenuOptions): Promise<void> {
  return new Promise<void>((resolve) => {
    displaySectionTitle(options.title);

    if (options.subtitle) {
      console.log(chalk.gray(options.subtitle));
      console.log();
    }

    // Afficher les éléments du menu
    options.items.forEach((item) => {
      const keyDisplay = chalk.yellow(`[${item.key}]`);
      const description = item.description
        ? chalk.gray(` - ${item.description}`)
        : '';

      console.log(`  ${keyDisplay} ${item.label}${description}`);
    });

    // Afficher l'option de sortie
    const exitKey = options.exitKey || 'q';
    const exitLabel = options.exitLabel || 'Quitter';
    console.log(`  ${chalk.red(`[${exitKey}]`)} ${exitLabel}`);

    displaySectionEnd();

    console.log(chalk.gray('Appuyez sur une touche pour continuer...'));

    // Gestionnaire d'événement clavier
    const keyHandler = async (ch: string, key: { name: string; ctrl: boolean; }) => {
      if (key && key.ctrl && key.name === 'c') {
        process.exit(0);
      }

      if (key && key.name === exitKey) {
        process.stdin.removeListener('keypress', keyHandler);
        console.log(chalk.gray(`${exitLabel}...`));
        resolve();
        return;
      }

      // Recherche de l'élément de menu correspondant à la touche
      const menuItem = options.items.find(item => item.key === (key ? key.name : ch));

      if (menuItem) {
        process.stdin.removeListener('keypress', keyHandler);
        console.log(chalk.gray(`Sélection: ${menuItem.label}...`));

        try {
          const result = menuItem.action();
          if (result instanceof Promise) {
            await result;
          }
        } catch (error) {
          console.error(chalk.red(`Erreur lors de l'exécution de l'action: ${error}`));
        }

        resolve();
      }
    };

    // Attacher l'écouteur d'événement
    process.stdin.on('keypress', keyHandler);
  });
}

/**
 * Crée un menu à pages multiples avec pagination
 * @param options Configuration du menu principal
 * @param pageSize Nombre d'éléments par page
 * @returns Promesse résolue lorsqu'une action est exécutée
 */
export async function showPaginatedMenu(
  options: Omit<MenuOptions, 'items'> & { items: MenuItem[]; pageSize?: number }
): Promise<void> {
  const pageSize = options.pageSize || 10;
  let currentPage = 0;
  const totalPages = Math.ceil(options.items.length / pageSize);

  while (true) {
    const startIndex = currentPage * pageSize;
    const endIndex = Math.min(startIndex + pageSize, options.items.length);
    const pageItems = options.items.slice(startIndex, endIndex);

    // Ajouter les contrôles de pagination
    const navigationItems: MenuItem[] = [];

    if (currentPage > 0) {
      navigationItems.push({
        key: 'left',
        label: 'Page précédente',
        action: () => {
          currentPage--;
          // Pas de resolve pour rester dans la boucle
          return Promise.resolve();
        }
      });
    }

    if (currentPage < totalPages - 1) {
      navigationItems.push({
        key: 'right',
        label: 'Page suivante',
        action: () => {
          currentPage++;
          // Pas de resolve pour rester dans la boucle
          return Promise.resolve();
        }
      });
    }

    // Afficher le menu pour la page courante
    const menuTitle = `${options.title} (Page ${currentPage + 1}/${totalPages})`;

    let menuResolved = false;

    await showNavigableMenu({
      ...options,
      title: menuTitle,
      items: [...pageItems, ...navigationItems],
      exitKey: options.exitKey,
      exitLabel: options.exitLabel
    }).then(() => {
      // Vérifier si une action de pagination a été choisie
      if (navigationItems.length === 0) {
        menuResolved = true;
      }
    });

    // Sortir de la boucle si une action non-navigation a été choisie
    if (menuResolved) {
      break;
    }
  }
}

/**
 * Affiche un écran d'aide avec raccourcis clavier
 * @param shortcuts Liste des raccourcis disponibles avec leur description
 */
export function showKeyboardShortcutsHelp(
  shortcuts: { key: string; description: string }[]
): void {
  displaySectionTitle('Raccourcis Clavier Disponibles');

  shortcuts.forEach(shortcut => {
    console.log(`  ${chalk.yellow(shortcut.key)} : ${shortcut.description}`);
  });

  displaySectionEnd();
}

/**
 * Attend que l'utilisateur appuie sur une touche spécifique
 * @param expectedKey Touche attendue
 * @param message Message à afficher
 */
export async function waitForKeypress(
  expectedKey: string,
  message: string = `Appuyez sur ${chalk.yellow(expectedKey)} pour continuer...`
): Promise<void> {
  return new Promise<void>((resolve) => {
    console.log(message);

    const keyHandler = (ch: string, key: { name: string; ctrl: boolean; }) => {
      if (key && key.ctrl && key.name === 'c') {
        process.exit(0);
      }

      if (!key || key.name === expectedKey) {
        process.stdin.removeListener('keypress', keyHandler);
        resolve();
      }
    };

    process.stdin.on('keypress', keyHandler);
  });
}

/**
 * Affiche un menu d'aide basé sur le contexte actuel
 * @param contextualHelp Objet contenant l'aide contextuelle
 */
export function showContextualHelp(
  contextualHelp: { title: string; content: string[] }
): void {
  displaySectionTitle(`Aide: ${contextualHelp.title}`);

  contextualHelp.content.forEach(line => {
    console.log(`  ${line}`);
  });

  displaySectionEnd();

  console.log(chalk.gray('Appuyez sur une touche pour revenir...'));
}

/**
 * Crée un menu interactif pour la navigation entre les différentes étapes du wizard
 * @param steps Liste des étapes avec leur fonction d'exécution
 */
export async function createWizardNavigation(
  steps: { title: string; execute: () => Promise<any> }[]
): Promise<void> {
  let currentStep = 0;

  while (currentStep < steps.length) {
    // Afficher l'en-tête de l'étape
    console.log(`\n${chalk.blue('■')} ${chalk.bold(`Étape ${currentStep + 1}/${steps.length}: ${steps[currentStep].title}`)}\n`);

    // Exécuter l'étape courante
    await steps[currentStep].execute();

    if (currentStep < steps.length - 1) {
      // Proposer de naviguer à la prochaine étape
      const navigateOptions = {
        title: 'Navigation',
        items: [
          {
            key: 'enter',
            label: 'Continuer à l\'étape suivante',
            action: () => {
              currentStep++;
              return Promise.resolve();
            }
          },
          {
            key: 'b',
            label: 'Retour à l\'étape précédente',
            action: () => {
              if (currentStep > 0) {
                currentStep--;
              }
              return Promise.resolve();
            }
          }
        ],
        exitKey: 'q',
        exitLabel: 'Quitter le wizard'
      };

      await showNavigableMenu(navigateOptions);
    } else {
      // Terminer le wizard
      info('Configuration terminée!');
      currentStep++;
    }
  }
}
