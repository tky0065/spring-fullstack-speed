// <%= appName %> - Test d'accessibilité
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import App from '../src/App'; // Ajustez le chemin selon votre structure

// Ces tests nécessitent l'installation des modules suivants :
// npm install jest-axe @testing-library/react @types/jest-axe --save-dev

// Ajout de custom matchers pour jest-axe
expect.extend(toHaveNoViolations);

describe('Tests d\'accessibilité', () => {
  it('Ne devrait pas avoir de violations d\'accessibilité dans l\'application principale', async () => {
    const { container } = render(<App />);
    const results = await axe(container);

    // Vérifie l'absence de violations d'accessibilité
    expect(results).toHaveNoViolations();
  });

  it('Vérifie que les éléments interactifs sont accessibles au clavier', () => {
    render(<App />);

    // Recherche les boutons et liens
    const interactiveElements = screen.queryAllByRole(/button|link/i);

    // Vérifie que chaque élément interactif a un rôle approprié
    interactiveElements.forEach(element => {
      expect(element).toHaveAttribute('role');
    });

    // Vérifie les attributs tabIndex
    interactiveElements.forEach(element => {
      // Les éléments interactifs ne devraient pas avoir de tabIndex négatif
      // (sauf si c'est intentionnel pour des raisons d'UX spécifiques)
      const tabIndex = element.getAttribute('tabIndex');
      if (tabIndex) {
        expect(parseInt(tabIndex, 10)).toBeGreaterThanOrEqual(0);
      }
    });
  });

  it('Vérifie que les images ont des attributs alt descriptifs', () => {
    render(<App />);

    // Rechercher toutes les images
    const images = screen.queryAllByRole('img');

    // Vérifier que chaque image a un attribut alt
    images.forEach(img => {
      expect(img).toHaveAttribute('alt');

      // Vérifier que l'attribut alt n'est pas vide (sauf pour les images décoratives)
      const alt = img.getAttribute('alt');
      if (!img.getAttribute('role')?.includes('presentation')) {
        expect(alt).not.toBe('');
      }
    });
  });

  it('Vérifie le contraste des couleurs', async () => {
    // Cette vérification est plus difficile à automatiser entièrement avec jest-axe
    // Les outils spécialisés comme Lighthouse ou l'extension axe DevTools sont recommandés
    // mais nous pouvons faire quelques vérifications de base

    const { container } = render(<App />);
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });

    // Vérifie spécifiquement les problèmes de contraste
    expect(results).toHaveNoViolations();
  });
});
