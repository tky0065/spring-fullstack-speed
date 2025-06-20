describe('Login Page', () => {
  beforeEach(() => {
    // Visiter la page de login avant chaque test
    cy.visit('/login');
  });

  it('should display login form', () => {
    cy.get('form').should('be.visible');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('should show validation errors for empty fields', () => {
    cy.get('button[type="submit"]').click();
    cy.get('[data-cy="email-error"]').should('be.visible');
    cy.get('[data-cy="password-error"]').should('be.visible');
  });

  it('should show error message for invalid credentials', () => {
    cy.get('input[type="email"]').type('invalid@example.com');
    cy.get('input[type="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    // Attendez que la requête soit complétée et l'erreur affichée
    cy.get('[data-cy="login-error"]').should('be.visible')
      .and('contain', 'Invalid email or password');
  });

  it('should redirect to dashboard after successful login', () => {
    // Intercepter la requête d'API pour simuler une connexion réussie
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        token: 'fake-jwt-token',
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com'
        }
      }
    }).as('loginRequest');

    // Remplir le formulaire et soumettre
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    // Attendre que la requête soit complétée
    cy.wait('@loginRequest');

    // Vérifier la redirection
    cy.url().should('include', '/dashboard');

    // Vérifier que l'utilisateur est connecté
    cy.get('[data-cy="user-greeting"]').should('contain', 'Test User');
  });

  it('should have a working "forgot password" link', () => {
    cy.get('[data-cy="forgot-password"]').click();
    cy.url().should('include', '/forgot-password');
  });
});
