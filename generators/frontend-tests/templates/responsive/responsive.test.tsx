// <%= appName %> - Tests de responsive design
import { render } from '@testing-library/react';
import React from 'react';
import App from '../src/App'; // Ajustez le chemin selon votre structure
import ResponsiveComponent from '../src/components/ResponsiveComponent'; // Exemple

// Ces tests nécessitent l'installation des modules suivants :
// npm install @testing-library/react jest-matchmedia-mock --save-dev

// Utilisation de jest-matchmedia-mock pour simuler différentes tailles d'écran
import MatchMediaMock from 'jest-matchmedia-mock';

describe('Tests de responsive design', () => {
  let matchMedia: MatchMediaMock;

  // Avant chaque test, initialiser le mock pour matchMedia
  beforeAll(() => {
    matchMedia = new MatchMediaMock();
  });

  // Après chaque test, nettoyer le mock
  afterEach(() => {
    matchMedia.clear();
  });

  // Après tous les tests, réinitialiser les mocks
  afterAll(() => {
    matchMedia.destroy();
  });

  // Fonction utilitaire pour simuler différentes tailles d'écran
  function setScreenSize(width: number, height: number) {
    matchMedia.useMediaQuery(`(min-width: ${width}px)`);
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: height });
    window.dispatchEvent(new Event('resize'));
  }

  it('Devrait afficher la version mobile sur les petits écrans', () => {
    // Simuler un écran mobile
    setScreenSize(320, 568); // iPhone 5

    const { container } = render(<ResponsiveComponent />);

    // Vérifier que la classe pour le layout mobile est présente
    expect(container.querySelector('.mobile-view')).toBeInTheDocument();
    expect(container.querySelector('.desktop-view')).not.toBeInTheDocument();
  });

  it('Devrait afficher la version tablette sur les écrans moyens', () => {
    // Simuler un écran de tablette
    setScreenSize(768, 1024); // iPad

    const { container } = render(<ResponsiveComponent />);

    // Vérifier que la classe pour le layout tablette est présente
    expect(container.querySelector('.tablet-view')).toBeInTheDocument();
    expect(container.querySelector('.mobile-view')).not.toBeInTheDocument();
  });

  it('Devrait afficher la version desktop sur les grands écrans', () => {
    // Simuler un écran de bureau
    setScreenSize(1920, 1080); // Full HD

    const { container } = render(<ResponsiveComponent />);

    // Vérifier que la classe pour le layout desktop est présente
    expect(container.querySelector('.desktop-view')).toBeInTheDocument();
    expect(container.querySelector('.mobile-view')).not.toBeInTheDocument();
  });

  it('Les éléments critiques devraient être visibles à toutes les tailles d\'écran', () => {
    const criticalSelectors = [
      '.logo',
      '.main-navigation',
      '.search-bar',
      '.primary-content',
      '.footer'
    ];

    // Tester sur plusieurs tailles d'écran
    const screenSizes = [
      { width: 320, height: 568 }, // Mobile
      { width: 768, height: 1024 }, // Tablette
      { width: 1366, height: 768 }, // Laptop
      { width: 1920, height: 1080 } // Desktop
    ];

    screenSizes.forEach(size => {
      setScreenSize(size.width, size.height);
      const { container } = render(<App />);

      // Vérifier que chaque élément critique est visible
      criticalSelectors.forEach(selector => {
        const element = container.querySelector(selector);
        expect(element).toBeInTheDocument();

        // Vérifier que l'élément n'est pas masqué
        const style = window.getComputedStyle(element as Element);
        expect(style.display).not.toBe('none');
        expect(style.visibility).not.toBe('hidden');
      });
    });
  });
});
