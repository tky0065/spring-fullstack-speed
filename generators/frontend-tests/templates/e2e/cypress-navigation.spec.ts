describe('Application Navigation', () => {
  beforeEach(() => {
    // Simuler un utilisateur connecté
    cy.window().then((window) => {
      window.localStorage.setItem('token', 'fake-jwt-token');
      window.localStorage.setItem('user', JSON.stringify({
        id: 1,
        name: 'Test User',
        email: 'test@example.com'
      }));
    });

    // Visiter la page d'accueil
    cy.visit('/');
  });

  it('should navigate to different pages via navbar', () => {
    // Vérifier que la navbar est présente
    cy.get('[data-cy="navbar"]').should('be.visible');

    // Naviguer vers la page de profil
    cy.get('[data-cy="nav-profile"]').click();
    cy.url().should('include', '/profile');
    cy.get('h1').should('contain', 'Profile');

    // Naviguer vers la page de paramètres
    cy.get('[data-cy="nav-settings"]').click();
    cy.url().should('include', '/settings');
    cy.get('h1').should('contain', 'Settings');

    // Revenir à l'accueil
    cy.get('[data-cy="nav-home"]').click();
    cy.url().should('equal', `${Cypress.config().baseUrl}/`);
    cy.get('h1').should('contain', 'Dashboard');
  });

  it('should navigate using breadcrumbs', () => {
    // Naviguer vers une page imbriquée
    cy.visit('/projects/1/tasks');
    cy.get('[data-cy="breadcrumb"]').should('be.visible');

    // Vérifier les éléments du fil d'ariane
    cy.get('[data-cy="breadcrumb-item"]').should('have.length', 3);
    cy.get('[data-cy="breadcrumb-item"]').eq(0).should('contain', 'Projects');
    cy.get('[data-cy="breadcrumb-item"]').eq(1).should('contain', 'Project 1');
    cy.get('[data-cy="breadcrumb-item"]').eq(2).should('contain', 'Tasks');

    // Naviguer en utilisant le fil d'ariane
    cy.get('[data-cy="breadcrumb-item"]').eq(1).click();
    cy.url().should('include', '/projects/1');
    cy.url().should('not.include', 'tasks');
  });

  it('should show 404 page for non-existent routes', () => {
    cy.visit('/non-existent-page', { failOnStatusCode: false });
    cy.get('[data-cy="not-found"]').should('be.visible');
    cy.get('h1').should('contain', '404');
  });

  it('should logout and redirect to login page', () => {
    cy.get('[data-cy="user-menu"]').click();
    cy.get('[data-cy="logout-button"]').click();

    // Vérifier la redirection vers la page de login
    cy.url().should('include', '/login');

    // Vérifier que les tokens ont été supprimés
    cy.window().then((window) => {
      expect(window.localStorage.getItem('token')).to.be.null;
      expect(window.localStorage.getItem('user')).to.be.null;
    });
  });

  it('should redirect protected routes to login when not authenticated', () => {
    // Déconnecter l'utilisateur
    cy.window().then((window) => {
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('user');
    });

    // Essayer d'accéder à une page protégée
    cy.visit('/profile');

    // Vérifier la redirection vers la page de login
    cy.url().should('include', '/login');
    cy.url().should('include', 'redirect=/profile');
  });
});

