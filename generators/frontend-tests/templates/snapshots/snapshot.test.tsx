// <%= appName %> - Tests de snapshots
import { render } from '@testing-library/react';
import React from 'react';
// Importez vos composants ici
import Button from '../src/components/ui/Button';
import Card from '../src/components/ui/Card';
import Header from '../src/components/navigation/Header';
import Footer from '../src/components/navigation/Footer';

// Ces tests nécessitent l'installation des modules suivants :
// npm install @testing-library/react react-test-renderer --save-dev

describe('Tests de snapshots des composants UI', () => {
  it('Le composant Button devrait correspondre au snapshot', () => {
    // Tester différentes variantes du bouton
    const variants = ['primary', 'secondary', 'success', 'danger', 'warning', 'info'];

    variants.forEach(variant => {
      const { container } = render(<Button variant={variant}>Bouton {variant}</Button>);
      expect(container).toMatchSnapshot();
    });
  });

  it('Le composant Card devrait correspondre au snapshot', () => {
    const { container } = render(
      <Card title="Titre de la carte">
        <p>Contenu de la carte</p>
      </Card>
    );
    expect(container).toMatchSnapshot();
  });

  it('Le Header devrait correspondre au snapshot', () => {
    const { container } = render(<Header />);
    expect(container).toMatchSnapshot();
  });

  it('Le Footer devrait correspondre au snapshot', () => {
    const { container } = render(<Footer />);
    expect(container).toMatchSnapshot();
  });

  // Test de snapshot avec différents états
  it('Le composant Button devrait correspondre au snapshot dans différents états', () => {
    // État normal
    const { container: normalButton, rerender } = render(<Button>Normal</Button>);
    expect(normalButton).toMatchSnapshot('button-normal');

    // État désactivé
    rerender(<Button disabled>Désactivé</Button>);
    expect(normalButton).toMatchSnapshot('button-disabled');

    // État de chargement
    rerender(<Button loading>Chargement</Button>);
    expect(normalButton).toMatchSnapshot('button-loading');
  });

  // Test de snapshot pour les thèmes
  it('Les composants devraient correspondre aux snapshots avec différents thèmes', () => {
    // Simuler un contexte de thème clair
    const { container: lightThemeCard } = render(
      <div data-theme="light">
        <Card title="Carte en thème clair">
          <p>Contenu avec thème clair</p>
        </Card>
      </div>
    );
    expect(lightThemeCard).toMatchSnapshot('card-light-theme');

    // Simuler un contexte de thème sombre
    const { container: darkThemeCard } = render(
      <div data-theme="dark">
        <Card title="Carte en thème sombre">
          <p>Contenu avec thème sombre</p>
        </Card>
      </div>
    );
    expect(darkThemeCard).toMatchSnapshot('card-dark-theme');
  });

  // Conseils d'utilisation des snapshots:
  // 1. Utilisez des snapshots pour des composants UI stables
  // 2. Ne créez pas de snapshots pour des composants très dynamiques
  // 3. Pour mettre à jour les snapshots: jest --updateSnapshot ou jest -u
  // 4. Passez en revue attentivement les modifications de snapshot avant de les valider
});
