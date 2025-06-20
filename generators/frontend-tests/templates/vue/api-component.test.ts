import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import <%= componentName %> from '../components/<%= componentName %>.vue';

// Mock du service utilisateur
vi.mock('../services/userService', () => ({
  getUsers: vi.fn()
}));

import { getUsers } from '../services/userService';

const mockUsers = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
];

describe('<%= componentName %>', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Configuration par défaut du mock
    (getUsers as any).mockResolvedValue(mockUsers);
  });

  it('displays loading state initially', () => {
    const wrapper = mount(<%= componentName %>);
    expect(wrapper.find('[data-test="loading"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="error"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="user-list"]').exists()).toBe(false);
  });

  it('displays users once loaded', async () => {
    const wrapper = mount(<%= componentName %>);

    // Attendre que les promises soient résolues
    await flushPromises();

    // Vérifier que le chargement est terminé
    expect(wrapper.find('[data-test="loading"]').exists()).toBe(false);

    // Vérifier que la liste des utilisateurs est affichée
    expect(wrapper.find('[data-test="user-list"]').exists()).toBe(true);

    // Vérifier que les utilisateurs sont affichés
    expect(wrapper.find('[data-test="user-item-1"]').text()).toContain('John Doe');
    expect(wrapper.find('[data-test="user-item-2"]').text()).toContain('Jane Smith');
  });

  it('displays error message when API call fails', async () => {
    // Simuler une erreur API
    (getUsers as any).mockRejectedValue(new Error('Failed to fetch users'));

    const wrapper = mount(<%= componentName %>);

    // Attendre que les promises soient rejetées
    await flushPromises();

    // Vérifier que l'état d'erreur est affiché
    expect(wrapper.find('[data-test="loading"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="error"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="error"]').text()).toContain('Something went wrong');
    expect(wrapper.find('[data-test="user-list"]').exists()).toBe(false);
  });

  it('refetches users when retry button is clicked', async () => {
    // Simuler une erreur pour la première requête
    (getUsers as any).mockRejectedValueOnce(new Error('Failed to fetch users'));

    const wrapper = mount(<%= componentName %>);

    // Attendre que les promises soient rejetées
    await flushPromises();

    // Réinitialiser le mock pour qu'il renvoie des données à la prochaine requête
    (getUsers as any).mockResolvedValue(mockUsers);

    // Cliquer sur le bouton de réessai
    await wrapper.find('[data-test="retry-button"]').trigger('click');

    // Vérifier que le chargement est actif à nouveau
    expect(wrapper.find('[data-test="loading"]').exists()).toBe(true);

    // Attendre que les promises soient résolues
    await flushPromises();

    // Vérifier que les données sont maintenant affichées
    expect(wrapper.find('[data-test="user-list"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="error"]').exists()).toBe(false);
    expect(getUsers).toHaveBeenCalledTimes(2);
  });
});
