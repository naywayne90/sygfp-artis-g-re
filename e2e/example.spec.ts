import { test, expect } from '@playwright/test';

test.describe('SYGFP Application', () => {
  test('should load the login page', async ({ page }) => {
    await page.goto('/');

    // Vérifier que la page se charge
    await expect(page).toHaveTitle(/SYGFP|ARTI/i);
  });

  test('should display login form', async ({ page }) => {
    await page.goto('/auth');

    // Vérifier la présence des éléments de connexion
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const _passwordInput = page.locator('input[type="password"]');

    await expect(emailInput.or(page.locator('text=Email'))).toBeVisible({ timeout: 10000 });
  });
});
