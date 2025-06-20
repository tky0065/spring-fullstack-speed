// <%= appName %> - Test de performance Web Vitals
import { render, screen } from '@testing-library/react';
import * as webVitals from 'web-vitals';
import App from '../src/App'; // Ajustez le chemin selon votre structure

// Ces tests nécessitent l'installation des modules suivants :
// npm install web-vitals @testing-library/react jest-environment-jsdom --save-dev

describe('Web Vitals Performance Tests', () => {
  // Mock pour web-vitals
  const mockWebVitals = {
    getCLS: jest.fn(),
    getFID: jest.fn(),
    getFCP: jest.fn(),
    getLCP: jest.fn(),
    getTTFB: jest.fn()
  };

  beforeEach(() => {
    jest.resetAllMocks();
    Object.keys(mockWebVitals).forEach(key => {
      jest.spyOn(webVitals, key as keyof typeof webVitals).mockImplementation((fn: any) => {
        fn({ value: key === 'getCLS' ? 0.05 : 500, name: key }); // Valeurs simulées
      });
    });
  });

  test('Les métriques Web Vitals sont dans des limites acceptables', () => {
    // Configuration du test
    const metrics: Record<string, number> = {};
    const reportWebVitals = (metric: any) => {
      metrics[metric.name] = metric.value;
    };

    // Rendu du composant
    render(<App />);

    // Déclenchement des mesures
    webVitals.getCLS(reportWebVitals);
    webVitals.getFID(reportWebVitals);
    webVitals.getFCP(reportWebVitals);
    webVitals.getLCP(reportWebVitals);
    webVitals.getTTFB(reportWebVitals);

    // Vérification des métriques
    // CLS (Cumulative Layout Shift) : doit être < 0.1 pour une bonne expérience
    expect(metrics.CLS).toBeLessThan(0.1);

    // FID (First Input Delay) : doit être < 100ms pour une bonne expérience
    expect(metrics.FID).toBeLessThan(100);

    // FCP (First Contentful Paint) : doit être < 1800ms pour une bonne expérience
    expect(metrics.FCP).toBeLessThan(1800);

    // LCP (Largest Contentful Paint) : doit être < 2500ms pour une bonne expérience
    expect(metrics.LCP).toBeLessThan(2500);

    // TTFB (Time to First Byte) : doit être < 800ms pour une bonne expérience
    expect(metrics.TTFB).toBeLessThan(800);
  });
});

// Note: En environnement de test, les métriques seront simulées.
// Pour de véritables mesures, utilisez Lighthouse dans Chrome DevTools
// ou le package web-vitals en production avec un service d'analytics.

// Pour générer des rapports de performance avec Lighthouse via CLI :
// npm install -g lighthouse
// lighthouse https://votre-site.com --view
