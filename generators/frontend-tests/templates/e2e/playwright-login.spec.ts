import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    // Visiter la page de login avant chaque test
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    // Vérifier que les éléments du formulaire sont présents
    await expect(page.locator('form')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.getByRole('button', { name: /sign in/i }).click();

    // Vérifier que les messages d'erreur sont affichés
    await expect(page.locator('[data-test="email-error"]')).toBeVisible();
    await expect(page.locator('[data-test="password-error"]')).toBeVisible();
  });

  test('should show error message for invalid credentials', async ({ page }) => {
    // Remplir le formulaire avec des identifiants invalides
    await page.getByLabel('Email').fill('invalid@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Vérifier que le message d'erreur est affiché
    await expect(page.locator('[data-test="login-error"]')).toBeVisible();
    await expect(page.locator('[data-test="login-error"]')).toContainText('Invalid email or password');
  });

  test('should redirect to dashboard after successful login', async ({ page }) => {
    // Intercepter la requête d'API pour simuler une connexion réussie
    await page.route('/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          token: 'fake-jwt-token',
          user: {
            id: 1,
            name: 'Test User',
            email: 'test@example.com'
          }
        }),
        headers: { 'Content-Type': 'application/json' }
      });
    });

    // Remplir le formulaire et soumettre
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Vérifier la redirection
    await expect(page).toHaveURL(/\/dashboard/);

    // Vérifier que l'utilisateur est connecté
    await expect(page.locator('[data-test="user-greeting"]')).toContainText('Test User');
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await page.getByRole('link', { name: /forgot password/i }).click();
    await expect(page).toHaveURL(/\/forgot-password/);
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.getByRole('link', { name: /sign up/i }).click();
    await expect(page).toHaveURL(/\/register/);
  });
});
