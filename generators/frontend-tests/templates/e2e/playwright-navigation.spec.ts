import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {
  test.beforeEach(async ({ page, context }) => {
    // Simuler un utilisateur connecté en ajoutant le token dans le localStorage
    await context.addInitScript(() => {
      localStorage.setItem('token', 'fake-jwt-token');
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        name: 'Test User',
        email: 'test@example.com'
      }));
    });

    // Visiter la page d'accueil
    await page.goto('/');
  });

  test('should navigate between pages using navbar', async ({ page }) => {
    // Vérifier que la navbar est présente
    await expect(page.locator('[data-test="navbar"]')).toBeVisible();

    // Naviguer vers la page de profil
    await page.getByRole('link', { name: /profile/i }).click();
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Profile');

    // Naviguer vers la page de paramètres
    await page.getByRole('link', { name: /settings/i }).click();
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Settings');

    // Revenir à l'accueil
    await page.getByRole('link', { name: /home|dashboard/i }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Dashboard');
  });

  test('should navigate using breadcrumbs', async ({ page }) => {
    // Naviguer vers une page imbriquée
    await page.goto('/projects/1/tasks');
    await expect(page.locator('[data-test="breadcrumb"]')).toBeVisible();

    // Vérifier les éléments du fil d'ariane
    const breadcrumbItems = page.locator('[data-test="breadcrumb-item"]');
    await expect(breadcrumbItems).toHaveCount(3);
    await expect(breadcrumbItems.nth(0)).toContainText('Projects');
    await expect(breadcrumbItems.nth(1)).toContainText('Project 1');
    await expect(breadcrumbItems.nth(2)).toContainText('Tasks');

    // Naviguer en utilisant le fil d'ariane
    await breadcrumbItems.nth(1).click();
    await expect(page).toHaveURL(/\/projects\/1$/);
  });

  test('should show 404 page for non-existent routes', async ({ page }) => {
    await page.goto('/non-existent-page');
    await expect(page.locator('[data-test="not-found"]')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('404');
  });

  test('should logout and redirect to login page', async ({ page }) => {
    await page.getByTestId('user-menu').click();
    await page.getByRole('button', { name: /logout|sign out/i }).click();

    // Vérifier la redirection vers la page de login
    await expect(page).toHaveURL(/\/login/);

    // Vérifier que les tokens ont été supprimés
    const token = await page.evaluate(() => localStorage.getItem('token'));
    const user = await page.evaluate(() => localStorage.getItem('user'));
    expect(token).toBeNull();
    expect(user).toBeNull();
  });

  test('should have responsive navigation on mobile', async ({ page }) => {
    // Redimensionner la page pour simuler un appareil mobile
    await page.setViewportSize({ width: 480, height: 640 });

    // Vérifier que la navbar est en mode mobile
    await expect(page.locator('[data-test="mobile-menu-button"]')).toBeVisible();

    // Ouvrir le menu mobile
    await page.locator('[data-test="mobile-menu-button"]').click();

    // Vérifier que les liens sont disponibles
    await expect(page.getByRole('link', { name: /profile/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /settings/i })).toBeVisible();

    // Naviguer avec le menu mobile
    await page.getByRole('link', { name: /profile/i }).click();
    await expect(page).toHaveURL(/\/profile/);
  });
});
