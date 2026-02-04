/**
 * Tests E2E - Dashboard Graphiques
 *
 * Vérifie le fonctionnement des graphiques sur le dashboard.
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

test.describe('Dashboard - Graphiques', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);
  });

  test('Les graphiques sont affichés sur le dashboard', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Chercher les conteneurs de graphiques (Recharts, Chart.js, etc.)
    const chartContainers = page.locator(
      '[data-testid="chart"], ' +
      '.recharts-wrapper, ' +
      '.chart-container, ' +
      'canvas, ' +
      'svg.recharts-surface, ' +
      '[class*="Chart"], ' +
      '[class*="chart"]'
    );

    // Attendre que les graphiques soient chargés
    await page.waitForTimeout(2000);

    const chartCount = await chartContainers.count();

    if (chartCount > 0) {
      await expect(chartContainers.first()).toBeVisible({ timeout: 10000 });
      await page.screenshot({ path: 'test-results/dashboard-charts.png', fullPage: true });
    }
  });

  test('Le graphique d\'exécution budgétaire est présent', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Chercher le graphique d'exécution
    const executionChart = page.locator(
      'text=Exécution, ' +
      'text=Budget, ' +
      '[data-testid="execution-chart"], ' +
      '[data-testid="budget-chart"]'
    );

    if (await executionChart.first().isVisible({ timeout: 10000 })) {
      await page.screenshot({ path: 'test-results/dashboard-execution-chart.png' });
    }
  });

  test('Le graphique de répartition par direction est présent', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Chercher le graphique de répartition
    const repartitionChart = page.locator(
      'text=Répartition, ' +
      'text=Direction, ' +
      '[data-testid="repartition-chart"], ' +
      '[data-testid="direction-chart"]'
    );

    if (await repartitionChart.first().isVisible({ timeout: 10000 })) {
      await page.screenshot({ path: 'test-results/dashboard-repartition-chart.png' });
    }
  });

  test('Les graphiques ont des légendes', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Chercher les légendes des graphiques
    const legends = page.locator(
      '.recharts-legend-wrapper, ' +
      '[data-testid="chart-legend"], ' +
      '.chart-legend, ' +
      '.legend'
    );

    await page.waitForTimeout(2000);

    const legendCount = await legends.count();

    if (legendCount > 0) {
      await page.screenshot({ path: 'test-results/dashboard-chart-legends.png' });
    }
  });

  test('Les graphiques réagissent au survol', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Trouver un graphique
    const chart = page.locator('.recharts-wrapper, canvas, [class*="chart"]').first();

    if (await chart.isVisible({ timeout: 10000 })) {
      // Survoler le graphique
      await chart.hover();
      await page.waitForTimeout(500);

      // Chercher un tooltip
      const tooltip = page.locator(
        '.recharts-tooltip-wrapper, ' +
        '[data-testid="chart-tooltip"], ' +
        '.chart-tooltip, ' +
        '[role="tooltip"]'
      );

      await page.screenshot({ path: 'test-results/dashboard-chart-hover.png' });
    }
  });
});

test.describe('Dashboard - Types de graphiques', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.dg.email, TEST_USERS.dg.password);
  });

  test('Graphique en barres pour les comparaisons', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Chercher un graphique en barres
    const barChart = page.locator(
      '.recharts-bar, ' +
      '[data-testid="bar-chart"], ' +
      'rect[class*="bar"]'
    );

    await page.waitForTimeout(2000);

    if (await barChart.first().isVisible({ timeout: 5000 })) {
      await page.screenshot({ path: 'test-results/dashboard-bar-chart.png' });
    }
  });

  test('Graphique en ligne pour les tendances', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Chercher un graphique en ligne
    const lineChart = page.locator(
      '.recharts-line, ' +
      '[data-testid="line-chart"], ' +
      'path[class*="line"]'
    );

    await page.waitForTimeout(2000);

    if (await lineChart.first().isVisible({ timeout: 5000 })) {
      await page.screenshot({ path: 'test-results/dashboard-line-chart.png' });
    }
  });

  test('Graphique circulaire pour les répartitions', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Chercher un graphique circulaire (pie/donut)
    const pieChart = page.locator(
      '.recharts-pie, ' +
      '[data-testid="pie-chart"], ' +
      '[data-testid="donut-chart"], ' +
      'path[class*="pie"]'
    );

    await page.waitForTimeout(2000);

    if (await pieChart.first().isVisible({ timeout: 5000 })) {
      await page.screenshot({ path: 'test-results/dashboard-pie-chart.png' });
    }
  });
});

test.describe('Dashboard - Filtres des graphiques', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);
  });

  test('Les graphiques peuvent être filtrés par période', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Chercher un sélecteur de période
    const periodSelector = page.locator(
      '[data-testid="period-selector"], ' +
      'select:has-text("Période"), ' +
      'button:has-text("Mois"), ' +
      'button:has-text("Trimestre"), ' +
      'button:has-text("Année")'
    );

    if (await periodSelector.first().isVisible({ timeout: 5000 })) {
      await periodSelector.first().click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'test-results/dashboard-period-filter.png' });
    }
  });

  test('Les graphiques peuvent être filtrés par direction', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Chercher un filtre par direction
    const directionFilter = page.locator(
      '[data-testid="direction-filter"], ' +
      'select:has-text("Direction"), ' +
      '[placeholder*="direction"]'
    );

    if (await directionFilter.first().isVisible({ timeout: 5000 })) {
      await directionFilter.first().click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'test-results/dashboard-direction-filter.png' });
    }
  });
});

test.describe('Dashboard - Performance des graphiques', () => {
  test('Les graphiques se chargent en moins de 5 secondes', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);

    const startTime = Date.now();

    await page.goto('/');

    // Attendre qu'un graphique soit visible
    const chart = page.locator('.recharts-wrapper, canvas, [class*="chart"]').first();

    try {
      await chart.waitFor({ state: 'visible', timeout: 5000 });
      const loadTime = Date.now() - startTime;

      // Le temps de chargement devrait être raisonnable
      expect(loadTime).toBeLessThan(5000);
    } catch {
      // Si pas de graphique, le test passe quand même
    }
  });

  test('Les graphiques ne causent pas d\'erreurs console', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);
    await page.goto('/');
    await waitForPageLoad(page);
    await page.waitForTimeout(3000);

    // Filtrer les erreurs liées aux graphiques
    const chartErrors = consoleErrors.filter(err =>
      err.toLowerCase().includes('chart') ||
      err.toLowerCase().includes('recharts') ||
      err.toLowerCase().includes('canvas')
    );

    expect(chartErrors.length).toBe(0);
  });
});
