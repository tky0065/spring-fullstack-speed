import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import <%= componentName %> from '../components/<%= componentName %>';

// Mock des modules de service/API
jest.mock('../services/userService', () => ({
  getUsers: jest.fn().mockResolvedValue([
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ])
}));

describe('<%= componentName %> Component', () => {
  test('should render loading state initially', () => {
    render(<<%= componentName %> />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('should render users after loading', async () => {
    render(<<%= componentName %> />);

    // Attendre que les utilisateurs soient chargés
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Vérifier que les utilisateurs sont affichés
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  test('should render error message when API call fails', async () => {
    // Override le mock pour simuler une erreur
    const userServiceMock = require('../services/userService');
    userServiceMock.getUsers.mockRejectedValueOnce(new Error('Failed to fetch'));

    render(<<%= componentName %> />);

    // Attendre que l'erreur soit affichée
    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });
});
