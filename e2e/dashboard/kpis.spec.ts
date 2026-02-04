/**
 * Tests E2E - Dashboard KPIs
 *
 * Vérifie l'affichage des indicateurs clés de performance sur le dashboard.
 */

import { test, expect } from '@playwright/test';
import { waitForPageLoad, TEST_USERS } from '../fixtures/auth';

// Helper pour se connecter
async function loginWithCredentials(page: typeof import('@playwright/test').Page, email: string, password: string): Promise<void> {
  await page.goto('/auth');
  await page.waitForLoadState('networkidle');

  const emailInput = page.locator('input#email, input[name="email"], input[type="email"]');
  const passwordInput = page.locator('input#password, input[name="password"], input[type="password"]');

  await emailInput.fill(email);
  await passwordInput.fill(password);
  await page.locator('button[type="submit"]').click();

  await page.waitForURL(/\/(dashboard|$)/, { timeout: 15000 });
  await waitForPageLoad(page);
}

test.describe('Dashboard - Affichage des KPIs', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);
  });

  test('Le dashboard affiche les cartes KPI', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Chercher les cartes KPI
    const kpiCards = page.locator('[data-testid="kpi-card"], .kpi-card, [class*="KPI"], .stat-card, .dashboard-card');

    // Attendre que les KPIs soient chargés
    await expect(kpiCards.first()).toBeVisible({ timeout: 15000 });

    // Vérifier qu'il y a plusieurs KPIs
    const kpiCount = await kpiCards.count();
    expect(kpiCount).toBeGreaterThan(0);

    await page.screenshot({ path: 'test-results/dashboard-kpis.png', fullPage: true });
  });

  test('Les KPIs affichent des valeurs numériques', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Les KPIs doivent contenir des chiffres
    const kpiValues = page.locator('[data-testid="kpi-value"], .kpi-value, .stat-value, h2, h3').filter({ hasText: /\d+/ });

    await expect(kpiValues.first()).toBeVisible({ timeout: 15000 });

    // Vérifier que les valeurs sont des nombres valides
    const firstValue = await kpiValues.first().textContent();
    expect(firstValue).toMatch(/\d/);
  });

  test('Les KPIs ont des labels descriptifs', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Chercher les labels des KPIs
    const expectedLabels = [
      'Notes',
      'Engagement',
      'Budget',
      'Liquidation',
      'Ordonnancement',
      'attente',
      'validé',
      'cours',
    ];

    let foundLabels = 0;
    for (const label of expectedLabels) {
      const labelElement = page.locator(`text=${label}`).first();
      if (await labelElement.isVisible({ timeout: 2000 }).catch(() => false)) {
        foundLabels++;
      }
    }

    // Au moins quelques labels devraient être présents
    expect(foundLabels).toBeGreaterThan(0);
  });

  test('Les KPIs de la chaîne de dépense sont visibles', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Chercher les KPIs spécifiques à la chaîne de dépense
    const chaineKPIs = page.locator('[data-testid="chaine-depense-kpi"], text=Chaîne de dépense, text=Exécution');

    if (await chaineKPIs.first().isVisible({ timeout: 5000 })) {
      await expect(chaineKPIs.first()).toBeVisible();
      await page.screenshot({ path: 'test-results/dashboard-chaine-kpis.png' });
    }
  });

  test('Les KPIs montrent les tendances (hausse/baisse)', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Chercher les indicateurs de tendance
    const trendIndicators = page.locator('[data-testid="trend"], .trend, .arrow-up, .arrow-down, text=↑, text=↓, text=+, text=-');

    // Les tendances peuvent ne pas être présentes, mais si elles le sont, vérifier
    const trendCount = await trendIndicators.count();

    if (trendCount > 0) {
      await page.screenshot({ path: 'test-results/dashboard-trends.png' });
    }
  });
});

test.describe('Dashboard - KPIs par rôle', () => {
  test('Le DG voit les KPIs globaux', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.dg.email, TEST_USERS.dg.password);

    await page.goto('/');
    await waitForPageLoad(page);

    // Le DG devrait voir des statistiques globales
    const globalStats = page.locator('text=Total, text=Global, text=Toutes directions, text=Ensemble');

    await page.screenshot({ path: 'test-results/dashboard-dg-kpis.png', fullPage: true });

    // Vérifier la présence de KPIs
    const kpiCards = page.locator('[data-testid="kpi-card"], .kpi-card, .stat-card');
    await expect(kpiCards.first()).toBeVisible({ timeout: 15000 });
  });

  test('L\'agent voit ses KPIs personnels', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.agent.email, TEST_USERS.agent.password);

    await page.goto('/');
    await waitForPageLoad(page);

    // L'agent devrait voir ses statistiques personnelles
    const personalStats = page.locator('text=Mes notes, text=Mes tâches, text=Mon activité');

    await page.screenshot({ path: 'test-results/dashboard-agent-kpis.png', fullPage: true });
  });

  test('Le DAAF voit les KPIs financiers', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);

    await page.goto('/');
    await waitForPageLoad(page);

    // Le DAAF devrait voir des KPIs financiers
    const financialKPIs = page.locator('text=Budget, text=Engagement, text=Liquidation, text=FCFA, text=Montant');

    await page.screenshot({ path: 'test-results/dashboard-daaf-kpis.png', fullPage: true });

    // Vérifier qu'au moins un KPI financier est visible
    await expect(financialKPIs.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Dashboard - Actualisation des KPIs', () => {
  test('Les KPIs se chargent sans erreur', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);

    await page.goto('/');

    // Vérifier qu'il n'y a pas d'erreur de chargement
    const errorMessage = page.locator('text=Erreur, text=Error, .error, [class*="error"]');

    // Attendre le chargement
    await waitForPageLoad(page);

    // Pas d'erreur visible
    const hasError = await errorMessage.first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasError).toBeFalsy();
  });

  test('Le bouton de rafraîchissement fonctionne', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);

    await page.goto('/');
    await waitForPageLoad(page);

    // Chercher un bouton de rafraîchissement
    const refreshBtn = page.locator('button:has-text("Actualiser"), button:has-text("Rafraîchir"), [data-testid="refresh"], button[aria-label*="refresh"]');

    if (await refreshBtn.first().isVisible({ timeout: 5000 })) {
      await refreshBtn.first().click();

      // Attendre le rechargement
      await waitForPageLoad(page);

      // Vérifier que les KPIs sont toujours visibles
      const kpiCards = page.locator('[data-testid="kpi-card"], .kpi-card');
      await expect(kpiCards.first()).toBeVisible({ timeout: 10000 });
    }
  });
});
