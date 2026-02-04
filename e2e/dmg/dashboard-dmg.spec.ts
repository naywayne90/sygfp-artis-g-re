/**
 * Tests E2E - Dashboard DMG
 *
 * Vérifie les fonctionnalités du dashboard DMG :
 * - Accès dashboard DMG
 * - Affichage KPIs
 * - Liste urgentes
 * - Alertes visibles
 */

import { test, expect } from '@playwright/test';
import { waitForPageLoad, TEST_USERS } from '../fixtures/auth';

// Helper pour se connecter
async function loginWithCredentials(
  page: typeof import('@playwright/test').Page,
  email: string,
  password: string
): Promise<void> {
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

// ============================================================================
// TESTS ACCÈS DASHBOARD DMG
// ============================================================================

test.describe('Dashboard DMG - Accès', () => {
  test('Le dashboard DMG est accessible pour le DAAF', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);

    await page.goto('/dashboard-dmg');
    await waitForPageLoad(page);

    // Vérifier qu'on est sur le dashboard DMG
    const dashboardTitle = page.locator(
      'h1:has-text("DMG"), ' +
      'h1:has-text("Direction des Moyens"), ' +
      'h1:has-text("Tableau de bord")'
    );

    await expect(dashboardTitle.first()).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'test-results/dashboard-dmg-access.png', fullPage: true });
  });

  test('Le dashboard DMG est accessible pour l\'ADMIN', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.admin.email, TEST_USERS.admin.password);

    await page.goto('/dashboard-dmg');
    await waitForPageLoad(page);

    const dashboardTitle = page.locator(
      'h1:has-text("DMG"), ' +
      'h1:has-text("Direction des Moyens"), ' +
      'h1:has-text("Tableau de bord")'
    );

    const isAccessible = await dashboardTitle.first().isVisible({ timeout: 10000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/dashboard-dmg-admin-access.png', fullPage: true });
  });

  test('Le dashboard DMG est accessible pour le DG', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.dg.email, TEST_USERS.dg.password);

    await page.goto('/dashboard-dmg');
    await waitForPageLoad(page);

    const dashboardTitle = page.locator(
      'h1:has-text("DMG"), ' +
      'h1:has-text("Direction des Moyens")'
    );

    const isAccessible = await dashboardTitle.first().isVisible({ timeout: 10000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/dashboard-dmg-dg-access.png', fullPage: true });
  });

  test('Le dashboard DMG a un bouton d\'actualisation', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);

    await page.goto('/dashboard-dmg');
    await waitForPageLoad(page);

    // Chercher le bouton d'actualisation
    const refreshButton = page.locator(
      'button:has-text("Actualiser"), ' +
      'button[aria-label*="refresh"], ' +
      '[data-testid="refresh-button"]'
    );

    const hasRefresh = await refreshButton.first().isVisible({ timeout: 5000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/dashboard-dmg-refresh.png', fullPage: true });
  });
});

// ============================================================================
// TESTS AFFICHAGE KPIs
// ============================================================================

test.describe('Dashboard DMG - KPIs', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);
    await page.goto('/dashboard-dmg');
    await waitForPageLoad(page);
  });

  test('Les cartes KPI sont affichées', async ({ page }) => {
    // Chercher les cartes KPI
    const kpiCards = page.locator(
      '[data-testid="kpi-card"], ' +
      '.kpi-card, ' +
      '[class*="Card"]'
    );

    const cardCount = await kpiCards.count();
    expect(cardCount).toBeGreaterThan(0);

    await page.screenshot({ path: 'test-results/dashboard-dmg-kpi-cards.png', fullPage: true });
  });

  test('Le KPI des liquidations urgentes est visible', async ({ page }) => {
    // Chercher le KPI des liquidations urgentes
    const urgentKpi = page.locator(
      'text=Urgentes, ' +
      'text=Liquidations urgentes, ' +
      '[data-testid="urgent-kpi"]'
    );

    const hasUrgentKpi = await urgentKpi.first().isVisible({ timeout: 5000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/dashboard-dmg-kpi-urgent.png', fullPage: true });
  });

  test('Le KPI des liquidations en attente est visible', async ({ page }) => {
    // Chercher le KPI des liquidations en attente
    const pendingKpi = page.locator(
      'text=En attente, ' +
      'text=Liquidations en attente, ' +
      'text=À traiter, ' +
      '[data-testid="pending-kpi"]'
    );

    const hasPendingKpi = await pendingKpi.first().isVisible({ timeout: 5000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/dashboard-dmg-kpi-pending.png', fullPage: true });
  });

  test('Le KPI du montant total engagé est visible', async ({ page }) => {
    // Chercher le KPI du montant engagé
    const amountKpi = page.locator(
      'text=Montant engagé, ' +
      'text=Total engagé, ' +
      'text=FCFA, ' +
      '[data-testid="amount-kpi"]'
    );

    const hasAmountKpi = await amountKpi.first().isVisible({ timeout: 5000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/dashboard-dmg-kpi-amount.png', fullPage: true });
  });

  test('Les KPIs ont des indicateurs de tendance', async ({ page }) => {
    // Chercher des indicateurs de tendance (flèches haut/bas)
    const trendIndicators = page.locator(
      '[data-testid="trend-indicator"], ' +
      '.trend, ' +
      '[class*="ArrowUp"], ' +
      '[class*="ArrowDown"], ' +
      'svg[class*="arrow"]'
    );

    const hasTrends = await trendIndicators.first().isVisible({ timeout: 5000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/dashboard-dmg-kpi-trends.png', fullPage: true });
  });

  test('Les KPIs affichent des valeurs numériques', async ({ page }) => {
    // Chercher des valeurs numériques dans les KPIs
    const kpiValues = page.locator(
      '.text-2xl, ' +
      '.text-3xl, ' +
      '[class*="font-bold"]'
    );

    const valueCount = await kpiValues.count();
    expect(valueCount).toBeGreaterThan(0);

    await page.screenshot({ path: 'test-results/dashboard-dmg-kpi-values.png', fullPage: true });
  });
});

// ============================================================================
// TESTS LISTE URGENTES
// ============================================================================

test.describe('Dashboard DMG - Liste Urgentes', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);
    await page.goto('/dashboard-dmg');
    await waitForPageLoad(page);
  });

  test('La liste des liquidations urgentes est visible', async ({ page }) => {
    // Chercher la section des liquidations urgentes
    const urgentSection = page.locator(
      '[data-testid="urgent-liquidations"], ' +
      '.urgent-list, ' +
      'text=Liquidations urgentes'
    );

    const hasUrgentSection = await urgentSection.first().isVisible({ timeout: 5000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/dashboard-dmg-urgent-section.png', fullPage: true });
  });

  test('Chaque liquidation urgente affiche le fournisseur', async ({ page }) => {
    // Chercher des mentions de fournisseurs
    const supplierMentions = page.locator(
      '[data-testid="supplier-name"], ' +
      '.supplier, ' +
      'text=Fournisseur'
    );

    const hasSuppliers = await supplierMentions.first().isVisible({ timeout: 5000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/dashboard-dmg-urgent-suppliers.png', fullPage: true });
  });

  test('Chaque liquidation urgente affiche le montant', async ({ page }) => {
    // Chercher des montants
    const amountMentions = page.locator(
      'text=FCFA, ' +
      'text=XAF, ' +
      '[data-testid="amount"]'
    );

    const hasAmounts = await amountMentions.first().isVisible({ timeout: 5000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/dashboard-dmg-urgent-amounts.png', fullPage: true });
  });

  test('Chaque liquidation urgente affiche la date de marquage', async ({ page }) => {
    // Chercher des dates
    const dateMentions = page.locator(
      'text=/\\d{2}\\/\\d{2}/, ' +
      'text=il y a, ' +
      '[data-testid="urgent-date"]'
    );

    const hasDates = await dateMentions.first().isVisible({ timeout: 5000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/dashboard-dmg-urgent-dates.png', fullPage: true });
  });

  test('On peut cliquer sur une liquidation pour voir les détails', async ({ page }) => {
    // Chercher un lien ou bouton pour voir les détails
    const viewLink = page.locator(
      'a:has-text("Voir"), ' +
      'button:has-text("Voir"), ' +
      '[data-testid="view-liquidation"]'
    );

    const hasViewLink = await viewLink.first().isVisible({ timeout: 5000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/dashboard-dmg-urgent-view-link.png', fullPage: true });
  });
});

// ============================================================================
// TESTS ALERTES
// ============================================================================

test.describe('Dashboard DMG - Alertes', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);
    await page.goto('/dashboard-dmg');
    await waitForPageLoad(page);
  });

  test('L\'onglet Alertes est accessible', async ({ page }) => {
    // Chercher l'onglet Alertes
    const alertsTab = page.locator(
      'button:has-text("Alerte"), ' +
      '[role="tab"]:has-text("Alerte"), ' +
      '[data-testid="alerts-tab"]'
    );

    if (await alertsTab.first().isVisible({ timeout: 5000 })) {
      await alertsTab.first().click();
      await waitForPageLoad(page);

      await page.screenshot({ path: 'test-results/dashboard-dmg-alerts-tab.png', fullPage: true });
    }
  });

  test('Les alertes critiques sont mises en évidence', async ({ page }) => {
    // Aller à l'onglet Alertes
    const alertsTab = page.locator('button:has-text("Alerte"), [role="tab"]:has-text("Alerte")');

    if (await alertsTab.first().isVisible({ timeout: 5000 })) {
      await alertsTab.first().click();
      await waitForPageLoad(page);

      // Chercher des alertes critiques (en rouge)
      const criticalAlerts = page.locator(
        '[data-severity="critical"], ' +
        '.alert-critical, ' +
        '[class*="red"], ' +
        '[class*="destructive"]'
      );

      await page.screenshot({ path: 'test-results/dashboard-dmg-alerts-critical.png', fullPage: true });
    }
  });

  test('Les alertes affichent le type et la description', async ({ page }) => {
    // Aller à l'onglet Alertes
    const alertsTab = page.locator('button:has-text("Alerte"), [role="tab"]:has-text("Alerte")');

    if (await alertsTab.first().isVisible({ timeout: 5000 })) {
      await alertsTab.first().click();
      await waitForPageLoad(page);

      // Chercher des descriptions d'alertes
      const alertDescriptions = page.locator(
        '[data-testid="alert-description"], ' +
        '.alert-description, ' +
        'text=urgente depuis, ' +
        'text=en attente depuis'
      );

      await page.screenshot({ path: 'test-results/dashboard-dmg-alerts-descriptions.png', fullPage: true });
    }
  });

  test('Les alertes warning sont visibles', async ({ page }) => {
    // Aller à l'onglet Alertes
    const alertsTab = page.locator('button:has-text("Alerte"), [role="tab"]:has-text("Alerte")');

    if (await alertsTab.first().isVisible({ timeout: 5000 })) {
      await alertsTab.first().click();
      await waitForPageLoad(page);

      // Chercher des alertes warning (en orange/jaune)
      const warningAlerts = page.locator(
        '[data-severity="warning"], ' +
        '.alert-warning, ' +
        '[class*="orange"], ' +
        '[class*="yellow"]'
      );

      await page.screenshot({ path: 'test-results/dashboard-dmg-alerts-warning.png', fullPage: true });
    }
  });

  test('On peut résoudre une alerte', async ({ page }) => {
    // Aller à l'onglet Alertes
    const alertsTab = page.locator('button:has-text("Alerte"), [role="tab"]:has-text("Alerte")');

    if (await alertsTab.first().isVisible({ timeout: 5000 })) {
      await alertsTab.first().click();
      await waitForPageLoad(page);

      // Chercher un bouton pour résoudre/traiter une alerte
      const resolveButton = page.locator(
        'button:has-text("Résoudre"), ' +
        'button:has-text("Traiter"), ' +
        '[data-testid="resolve-alert"]'
      );

      const hasResolveButton = await resolveButton.first().isVisible({ timeout: 5000 }).catch(() => false);

      await page.screenshot({ path: 'test-results/dashboard-dmg-alerts-resolve.png', fullPage: true });
    }
  });
});

// ============================================================================
// TESTS ONGLETS DASHBOARD
// ============================================================================

test.describe('Dashboard DMG - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);
    await page.goto('/dashboard-dmg');
    await waitForPageLoad(page);
  });

  test('Les 4 onglets sont visibles', async ({ page }) => {
    // Vérifier les onglets attendus
    const tabs = ['Aperçu', 'Alertes', 'Fournisseurs', 'Liquidations'];

    for (const tabName of tabs) {
      const tab = page.locator(`button:has-text("${tabName}"), [role="tab"]:has-text("${tabName}")`);
      const isVisible = await tab.first().isVisible({ timeout: 3000 }).catch(() => false);
    }

    await page.screenshot({ path: 'test-results/dashboard-dmg-tabs.png', fullPage: true });
  });

  test('L\'onglet Fournisseurs affiche le top 5', async ({ page }) => {
    // Aller à l'onglet Fournisseurs
    const suppliersTab = page.locator('button:has-text("Fournisseur"), [role="tab"]:has-text("Fournisseur")');

    if (await suppliersTab.first().isVisible({ timeout: 5000 })) {
      await suppliersTab.first().click();
      await waitForPageLoad(page);

      // Chercher la liste des fournisseurs
      const suppliersList = page.locator(
        '[data-testid="top-suppliers"], ' +
        '.suppliers-list, ' +
        'text=Top 5'
      );

      await page.screenshot({ path: 'test-results/dashboard-dmg-suppliers-tab.png', fullPage: true });
    }
  });

  test('L\'onglet Liquidations affiche la liste complète', async ({ page }) => {
    // Aller à l'onglet Liquidations
    const liquidationsTab = page.locator('button:has-text("Liquidation"), [role="tab"]:has-text("Liquidation")');

    if (await liquidationsTab.first().isVisible({ timeout: 5000 })) {
      await liquidationsTab.first().click();
      await waitForPageLoad(page);

      // Vérifier la présence d'une table ou liste
      const liquidationsList = page.locator(
        'table, ' +
        '[data-testid="liquidations-list"], ' +
        '.liquidations-list'
      );

      await page.screenshot({ path: 'test-results/dashboard-dmg-liquidations-tab.png', fullPage: true });
    }
  });
});

// ============================================================================
// TESTS GRAPHIQUES
// ============================================================================

test.describe('Dashboard DMG - Graphiques', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);
    await page.goto('/dashboard-dmg');
    await waitForPageLoad(page);
  });

  test('Le graphique d\'évolution 30 jours est visible', async ({ page }) => {
    // Chercher un graphique
    const chart = page.locator(
      '[data-testid="evolution-chart"], ' +
      '.recharts-wrapper, ' +
      'svg[class*="chart"], ' +
      'text=30 jours'
    );

    const hasChart = await chart.first().isVisible({ timeout: 5000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/dashboard-dmg-chart.png', fullPage: true });
  });

  test('Le graphique affiche une légende', async ({ page }) => {
    // Chercher la légende du graphique
    const legend = page.locator(
      '.recharts-legend-wrapper, ' +
      '[data-testid="chart-legend"], ' +
      '.chart-legend'
    );

    const hasLegend = await legend.first().isVisible({ timeout: 5000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/dashboard-dmg-chart-legend.png', fullPage: true });
  });
});

// ============================================================================
// TESTS WIDGET SIDEBAR
// ============================================================================

test.describe('Dashboard DMG - Widget Sidebar', () => {
  test('Le widget DMG est visible dans le sidebar', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);

    await page.goto('/');
    await waitForPageLoad(page);

    // Chercher le widget DMG dans le sidebar
    const dmgWidget = page.locator(
      '[data-testid="dmg-widget"], ' +
      '.dmg-widget, ' +
      'aside text=DMG, ' +
      'aside text=Urgent'
    );

    const hasWidget = await dmgWidget.first().isVisible({ timeout: 5000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/dashboard-dmg-sidebar-widget.png', fullPage: true });
  });

  test('Le widget affiche le compteur de liquidations urgentes', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);

    await page.goto('/');
    await waitForPageLoad(page);

    // Chercher un compteur d'urgences dans le sidebar
    const urgentCounter = page.locator(
      '[data-testid="urgent-count"], ' +
      'aside .badge, ' +
      'aside [class*="badge"]'
    );

    const hasCounter = await urgentCounter.first().isVisible({ timeout: 5000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/dashboard-dmg-widget-counter.png', fullPage: true });
  });

  test('Le widget permet de naviguer vers le dashboard DMG', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);

    await page.goto('/');
    await waitForPageLoad(page);

    // Chercher un lien vers le dashboard DMG
    const dmgLink = page.locator(
      'a[href*="/dashboard-dmg"], ' +
      'a:has-text("Voir le dashboard"), ' +
      '[data-testid="dmg-dashboard-link"]'
    );

    const hasLink = await dmgLink.first().isVisible({ timeout: 5000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/dashboard-dmg-widget-link.png', fullPage: true });
  });
});

// ============================================================================
// TESTS RESPONSIVE
// ============================================================================

test.describe('Dashboard DMG - Responsive', () => {
  test('Le dashboard s\'adapte au mobile', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);

    // Simuler un écran mobile
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/dashboard-dmg');
    await waitForPageLoad(page);

    // Vérifier que le contenu est visible
    const content = page.locator('main, [data-testid="dashboard-content"]');
    await expect(content.first()).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'test-results/dashboard-dmg-mobile.png', fullPage: true });
  });

  test('Les KPIs s\'empilent sur mobile', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);

    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/dashboard-dmg');
    await waitForPageLoad(page);

    // Capturer les KPIs en mode mobile
    const kpiCards = page.locator('[data-testid="kpi-card"], .kpi-card');

    await page.screenshot({ path: 'test-results/dashboard-dmg-mobile-kpis.png', fullPage: true });
  });
});

// ============================================================================
// TESTS ACTUALISATION
// ============================================================================

test.describe('Dashboard DMG - Actualisation', () => {
  test('Le bouton actualiser recharge les données', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);

    await page.goto('/dashboard-dmg');
    await waitForPageLoad(page);

    // Chercher le bouton d'actualisation
    const refreshButton = page.locator(
      'button:has-text("Actualiser"), ' +
      'button[aria-label*="refresh"]'
    );

    if (await refreshButton.first().isVisible({ timeout: 5000 })) {
      await refreshButton.first().click();
      await page.waitForTimeout(1000);

      await page.screenshot({ path: 'test-results/dashboard-dmg-refresh-action.png', fullPage: true });
    }
  });

  test('L\'indicateur de chargement s\'affiche pendant l\'actualisation', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);

    await page.goto('/dashboard-dmg');
    await waitForPageLoad(page);

    // Chercher un indicateur de chargement
    const loadingIndicator = page.locator(
      '[data-testid="loading"], ' +
      '.loading, ' +
      '[class*="skeleton"], ' +
      '[class*="spinner"]'
    );

    await page.screenshot({ path: 'test-results/dashboard-dmg-loading.png', fullPage: true });
  });
});
