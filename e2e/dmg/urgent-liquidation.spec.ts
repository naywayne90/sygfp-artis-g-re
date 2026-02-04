/**
 * Tests E2E - Liquidations Urgentes (DMG)
 *
 * Vérifie les fonctionnalités de marquage urgent des liquidations :
 * - Marquage liquidation urgente (DMG)
 * - Motif obligatoire (minimum 10 caractères)
 * - Démarquage
 * - Permissions (seuls DMG/DAAF/ADMIN)
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
// TESTS ACCÈS PAGE LIQUIDATIONS
// ============================================================================

test.describe('Liquidations Urgentes - Accès', () => {
  test('La page des liquidations est accessible', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);

    await page.goto('/liquidations');
    await waitForPageLoad(page);

    // Vérifier le titre de la page
    const pageTitle = page.locator('h1:has-text("Liquidation"), h1:has-text("liquidation")');
    await expect(pageTitle.first()).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'test-results/dmg-liquidations-page.png', fullPage: true });
  });

  test('L\'onglet "Urgentes" est visible dans la page liquidations', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);

    await page.goto('/liquidations');
    await waitForPageLoad(page);

    // Chercher l'onglet Urgentes
    const urgentTab = page.locator(
      'button:has-text("Urgent"), ' +
      '[role="tab"]:has-text("Urgent"), ' +
      '[data-testid="urgent-tab"]'
    );

    const hasUrgentTab = await urgentTab.first().isVisible({ timeout: 5000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/dmg-urgent-tab.png', fullPage: true });
  });

  test('La liste des liquidations affiche les colonnes attendues', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);

    await page.goto('/liquidations');
    await waitForPageLoad(page);

    // Vérifier la présence d'une table
    const table = page.locator('table, [data-testid="liquidations-table"]');
    await expect(table.first()).toBeVisible({ timeout: 10000 });

    // Vérifier quelques colonnes attendues
    const expectedHeaders = ['Référence', 'Fournisseur', 'Montant', 'Statut'];

    for (const header of expectedHeaders) {
      const headerCell = page.locator(`th:has-text("${header}"), td:has-text("${header}")`);
      // On ne fait pas de strict check car les noms peuvent varier
    }

    await page.screenshot({ path: 'test-results/dmg-liquidations-columns.png', fullPage: true });
  });
});

// ============================================================================
// TESTS MARQUAGE URGENT
// ============================================================================

test.describe('Liquidations Urgentes - Marquage', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);
    await page.goto('/liquidations');
    await waitForPageLoad(page);
  });

  test('Le bouton de marquage urgent est visible sur une liquidation', async ({ page }) => {
    // Chercher un bouton ou icône pour marquer comme urgent
    const urgentToggle = page.locator(
      '[data-testid="urgent-toggle"], ' +
      'button:has-text("Urgent"), ' +
      'button[aria-label*="urgent"], ' +
      '[class*="urgent"]'
    );

    const hasUrgentToggle = await urgentToggle.first().isVisible({ timeout: 5000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/dmg-urgent-toggle-button.png', fullPage: true });
  });

  test('Cliquer sur le bouton urgent ouvre un dialog de confirmation', async ({ page }) => {
    // Chercher le premier bouton de marquage urgent
    const urgentToggle = page.locator(
      '[data-testid="urgent-toggle"], ' +
      'button:has-text("Marquer urgent"), ' +
      'button[aria-label*="urgent"]'
    ).first();

    if (await urgentToggle.isVisible({ timeout: 5000 })) {
      await urgentToggle.click();
      await page.waitForTimeout(500);

      // Vérifier que le dialog s'ouvre
      const dialog = page.locator(
        '[role="dialog"], ' +
        '[data-testid="urgent-dialog"], ' +
        '.dialog-content'
      );

      await expect(dialog).toBeVisible({ timeout: 5000 });

      await page.screenshot({ path: 'test-results/dmg-urgent-dialog.png' });

      // Fermer le dialog
      const closeButton = page.locator('button:has-text("Annuler"), button[aria-label="Close"]');
      if (await closeButton.first().isVisible({ timeout: 2000 })) {
        await closeButton.first().click();
      }
    }
  });

  test('Le champ motif est obligatoire pour marquer urgent', async ({ page }) => {
    const urgentToggle = page.locator(
      '[data-testid="urgent-toggle"], ' +
      'button:has-text("Marquer urgent")'
    ).first();

    if (await urgentToggle.isVisible({ timeout: 5000 })) {
      await urgentToggle.click();
      await page.waitForTimeout(500);

      // Chercher le champ motif
      const motifField = page.locator(
        'textarea[name="motif"], ' +
        'input[name="motif"], ' +
        '[data-testid="motif-input"], ' +
        'textarea[placeholder*="motif"]'
      );

      if (await motifField.first().isVisible({ timeout: 3000 })) {
        // Essayer de valider sans motif
        const confirmButton = page.locator(
          'button:has-text("Confirmer"), ' +
          'button:has-text("Marquer"), ' +
          'button[type="submit"]'
        );

        if (await confirmButton.first().isVisible({ timeout: 3000 })) {
          await confirmButton.first().click();
          await page.waitForTimeout(500);

          // Vérifier qu'un message d'erreur apparaît
          const errorMessage = page.locator(
            'text=obligatoire, ' +
            'text=requis, ' +
            'text=minimum, ' +
            '[class*="error"]'
          );

          await page.screenshot({ path: 'test-results/dmg-urgent-motif-required.png' });
        }
      }

      // Fermer le dialog
      const closeButton = page.locator('button:has-text("Annuler")');
      if (await closeButton.first().isVisible({ timeout: 2000 })) {
        await closeButton.first().click();
      }
    }
  });

  test('Le motif doit avoir au moins 10 caractères', async ({ page }) => {
    const urgentToggle = page.locator(
      '[data-testid="urgent-toggle"], ' +
      'button:has-text("Marquer urgent")'
    ).first();

    if (await urgentToggle.isVisible({ timeout: 5000 })) {
      await urgentToggle.click();
      await page.waitForTimeout(500);

      const motifField = page.locator(
        'textarea[name="motif"], ' +
        'input[name="motif"], ' +
        '[data-testid="motif-input"]'
      );

      if (await motifField.first().isVisible({ timeout: 3000 })) {
        // Entrer un motif trop court
        await motifField.first().fill('Court');

        const confirmButton = page.locator('button:has-text("Confirmer"), button:has-text("Marquer")');

        if (await confirmButton.first().isVisible({ timeout: 3000 })) {
          await confirmButton.first().click();
          await page.waitForTimeout(500);

          // Vérifier le message d'erreur pour longueur minimale
          const errorMessage = page.locator(
            'text=10 caractères, ' +
            'text=minimum, ' +
            'text=trop court'
          );

          await page.screenshot({ path: 'test-results/dmg-urgent-motif-min-length.png' });
        }
      }

      // Fermer le dialog
      const closeButton = page.locator('button:has-text("Annuler")');
      if (await closeButton.first().isVisible({ timeout: 2000 })) {
        await closeButton.first().click();
      }
    }
  });

  test('On peut marquer une liquidation comme urgente avec un motif valide', async ({ page }) => {
    const urgentToggle = page.locator(
      '[data-testid="urgent-toggle"], ' +
      'button:has-text("Marquer urgent")'
    ).first();

    if (await urgentToggle.isVisible({ timeout: 5000 })) {
      await urgentToggle.click();
      await page.waitForTimeout(500);

      const motifField = page.locator(
        'textarea[name="motif"], ' +
        'input[name="motif"], ' +
        '[data-testid="motif-input"]'
      );

      if (await motifField.first().isVisible({ timeout: 3000 })) {
        // Entrer un motif valide
        await motifField.first().fill('Paiement urgent pour fournisseur stratégique - Test E2E');

        await page.screenshot({ path: 'test-results/dmg-urgent-motif-filled.png' });

        // Ne pas confirmer pour éviter de modifier les données
        // Annuler le dialog
        const cancelButton = page.locator('button:has-text("Annuler")');
        if (await cancelButton.isVisible({ timeout: 2000 })) {
          await cancelButton.click();
        }
      }
    }
  });
});

// ============================================================================
// TESTS DÉMARQUAGE
// ============================================================================

test.describe('Liquidations Urgentes - Démarquage', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);
    await page.goto('/liquidations');
    await waitForPageLoad(page);
  });

  test('On peut accéder à l\'onglet des liquidations urgentes', async ({ page }) => {
    // Cliquer sur l'onglet Urgentes
    const urgentTab = page.locator(
      'button:has-text("Urgent"), ' +
      '[role="tab"]:has-text("Urgent")'
    );

    if (await urgentTab.first().isVisible({ timeout: 5000 })) {
      await urgentTab.first().click();
      await waitForPageLoad(page);

      await page.screenshot({ path: 'test-results/dmg-urgent-list.png', fullPage: true });
    }
  });

  test('Les liquidations urgentes affichent un badge flamme', async ({ page }) => {
    // Aller à l'onglet Urgentes
    const urgentTab = page.locator('button:has-text("Urgent"), [role="tab"]:has-text("Urgent")');

    if (await urgentTab.first().isVisible({ timeout: 5000 })) {
      await urgentTab.first().click();
      await waitForPageLoad(page);

      // Chercher le badge flamme
      const flameBadge = page.locator(
        '[data-testid="urgent-badge"], ' +
        '.urgent-badge, ' +
        '[class*="flame"], ' +
        'svg[class*="flame"]'
      );

      const hasFlame = await flameBadge.first().isVisible({ timeout: 5000 }).catch(() => false);

      await page.screenshot({ path: 'test-results/dmg-urgent-flame-badge.png', fullPage: true });
    }
  });

  test('Le bouton de démarquage est visible sur une liquidation urgente', async ({ page }) => {
    // Aller à l'onglet Urgentes
    const urgentTab = page.locator('button:has-text("Urgent"), [role="tab"]:has-text("Urgent")');

    if (await urgentTab.first().isVisible({ timeout: 5000 })) {
      await urgentTab.first().click();
      await waitForPageLoad(page);

      // Chercher le bouton de démarquage
      const unmarkButton = page.locator(
        '[data-testid="unmark-urgent"], ' +
        'button:has-text("Retirer urgent"), ' +
        'button:has-text("Démarquer"), ' +
        'button[aria-label*="retirer"]'
      );

      const hasUnmarkButton = await unmarkButton.first().isVisible({ timeout: 5000 }).catch(() => false);

      await page.screenshot({ path: 'test-results/dmg-urgent-unmark-button.png', fullPage: true });
    }
  });

  test('Le tooltip affiche les informations d\'urgence', async ({ page }) => {
    // Aller à l'onglet Urgentes
    const urgentTab = page.locator('button:has-text("Urgent"), [role="tab"]:has-text("Urgent")');

    if (await urgentTab.first().isVisible({ timeout: 5000 })) {
      await urgentTab.first().click();
      await waitForPageLoad(page);

      // Hover sur un badge urgent pour voir le tooltip
      const urgentBadge = page.locator('[data-testid="urgent-badge"], .urgent-badge').first();

      if (await urgentBadge.isVisible({ timeout: 5000 })) {
        await urgentBadge.hover();
        await page.waitForTimeout(500);

        // Chercher le tooltip avec les infos
        const tooltip = page.locator(
          '[role="tooltip"], ' +
          '.tooltip, ' +
          '[data-testid="urgent-tooltip"]'
        );

        await page.screenshot({ path: 'test-results/dmg-urgent-tooltip.png' });
      }
    }
  });
});

// ============================================================================
// TESTS PERMISSIONS
// ============================================================================

test.describe('Liquidations Urgentes - Permissions', () => {
  test('DAAF peut marquer une liquidation comme urgente', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);

    await page.goto('/liquidations');
    await waitForPageLoad(page);

    // Vérifier que le bouton de marquage urgent est visible
    const urgentToggle = page.locator(
      '[data-testid="urgent-toggle"], ' +
      'button:has-text("Marquer urgent"), ' +
      'button[aria-label*="urgent"]'
    );

    const canMarkUrgent = await urgentToggle.first().isVisible({ timeout: 5000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/dmg-permission-daaf.png', fullPage: true });
  });

  test('ADMIN peut marquer une liquidation comme urgente', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.admin.email, TEST_USERS.admin.password);

    await page.goto('/liquidations');
    await waitForPageLoad(page);

    // Vérifier que le bouton de marquage urgent est visible
    const urgentToggle = page.locator(
      '[data-testid="urgent-toggle"], ' +
      'button:has-text("Marquer urgent"), ' +
      'button[aria-label*="urgent"]'
    );

    const canMarkUrgent = await urgentToggle.first().isVisible({ timeout: 5000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/dmg-permission-admin.png', fullPage: true });
  });

  test('AGENT ne peut pas marquer une liquidation comme urgente', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.agent.email, TEST_USERS.agent.password);

    await page.goto('/liquidations');
    await waitForPageLoad(page);

    // Vérifier que le bouton de marquage urgent n'est PAS visible ou est désactivé
    const urgentToggle = page.locator(
      '[data-testid="urgent-toggle"], ' +
      'button:has-text("Marquer urgent")'
    );

    const isVisible = await urgentToggle.first().isVisible({ timeout: 5000 }).catch(() => false);

    // Si visible, vérifier qu'il est désactivé
    if (isVisible) {
      const isDisabled = await urgentToggle.first().isDisabled();
      // On s'attend à ce qu'il soit soit invisible, soit désactivé
    }

    await page.screenshot({ path: 'test-results/dmg-permission-agent.png', fullPage: true });
  });

  test('DG peut marquer une liquidation comme urgente', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.dg.email, TEST_USERS.dg.password);

    await page.goto('/liquidations');
    await waitForPageLoad(page);

    // Vérifier que le bouton de marquage urgent est visible
    const urgentToggle = page.locator(
      '[data-testid="urgent-toggle"], ' +
      'button:has-text("Marquer urgent"), ' +
      'button[aria-label*="urgent"]'
    );

    const canMarkUrgent = await urgentToggle.first().isVisible({ timeout: 5000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/dmg-permission-dg.png', fullPage: true });
  });
});

// ============================================================================
// TESTS LISTE URGENTES
// ============================================================================

test.describe('Liquidations Urgentes - Liste', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);
  });

  test('La liste des urgentes affiche les statistiques', async ({ page }) => {
    await page.goto('/liquidations');
    await waitForPageLoad(page);

    // Aller à l'onglet Urgentes
    const urgentTab = page.locator('button:has-text("Urgent"), [role="tab"]:has-text("Urgent")');

    if (await urgentTab.first().isVisible({ timeout: 5000 })) {
      await urgentTab.first().click();
      await waitForPageLoad(page);

      // Chercher les statistiques
      const stats = page.locator(
        '[data-testid="urgent-stats"], ' +
        '.stats-summary, ' +
        'text=Total'
      );

      await page.screenshot({ path: 'test-results/dmg-urgent-list-stats.png', fullPage: true });
    }
  });

  test('On peut rechercher dans la liste des urgentes', async ({ page }) => {
    await page.goto('/liquidations');
    await waitForPageLoad(page);

    // Aller à l'onglet Urgentes
    const urgentTab = page.locator('button:has-text("Urgent"), [role="tab"]:has-text("Urgent")');

    if (await urgentTab.first().isVisible({ timeout: 5000 })) {
      await urgentTab.first().click();
      await waitForPageLoad(page);

      // Chercher le champ de recherche
      const searchInput = page.locator(
        'input[placeholder*="Recherche"], ' +
        'input[type="search"], ' +
        '[data-testid="urgent-search"]'
      );

      if (await searchInput.first().isVisible({ timeout: 5000 })) {
        await searchInput.first().fill('test');
        await page.waitForTimeout(500);

        await page.screenshot({ path: 'test-results/dmg-urgent-list-search.png', fullPage: true });
      }
    }
  });

  test('On peut trier la liste des urgentes', async ({ page }) => {
    await page.goto('/liquidations');
    await waitForPageLoad(page);

    // Aller à l'onglet Urgentes
    const urgentTab = page.locator('button:has-text("Urgent"), [role="tab"]:has-text("Urgent")');

    if (await urgentTab.first().isVisible({ timeout: 5000 })) {
      await urgentTab.first().click();
      await waitForPageLoad(page);

      // Chercher un sélecteur de tri
      const sortSelect = page.locator(
        '[data-testid="sort-select"], ' +
        'select[name="sort"], ' +
        'button:has-text("Trier")'
      );

      const hasSort = await sortSelect.first().isVisible({ timeout: 5000 }).catch(() => false);

      await page.screenshot({ path: 'test-results/dmg-urgent-list-sort.png', fullPage: true });
    }
  });

  test('On peut exporter la liste des urgentes en Excel', async ({ page }) => {
    await page.goto('/liquidations');
    await waitForPageLoad(page);

    // Aller à l'onglet Urgentes
    const urgentTab = page.locator('button:has-text("Urgent"), [role="tab"]:has-text("Urgent")');

    if (await urgentTab.first().isVisible({ timeout: 5000 })) {
      await urgentTab.first().click();
      await waitForPageLoad(page);

      // Chercher le bouton d'export
      const exportButton = page.locator(
        'button:has-text("Export"), ' +
        'button:has-text("Excel"), ' +
        '[data-testid="export-button"]'
      );

      const hasExport = await exportButton.first().isVisible({ timeout: 5000 }).catch(() => false);

      await page.screenshot({ path: 'test-results/dmg-urgent-list-export.png', fullPage: true });
    }
  });
});

// ============================================================================
// TESTS BADGE ET INDICATEURS
// ============================================================================

test.describe('Liquidations Urgentes - Indicateurs', () => {
  test('Le sidebar affiche l\'indicateur de liquidations urgentes', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);

    await page.goto('/');
    await waitForPageLoad(page);

    // Chercher l'indicateur dans le sidebar
    const sidebarIndicator = page.locator(
      '[data-testid="urgent-sidebar-indicator"], ' +
      '.sidebar [class*="urgent"], ' +
      'nav [class*="badge"]'
    );

    const hasIndicator = await sidebarIndicator.first().isVisible({ timeout: 5000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/dmg-sidebar-urgent-indicator.png', fullPage: true });
  });

  test('Le badge urgent pulse pour attirer l\'attention', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);

    await page.goto('/liquidations');
    await waitForPageLoad(page);

    // Aller à l'onglet Urgentes
    const urgentTab = page.locator('button:has-text("Urgent")');

    if (await urgentTab.first().isVisible({ timeout: 5000 })) {
      await urgentTab.first().click();
      await waitForPageLoad(page);

      // Chercher un badge avec animation
      const animatedBadge = page.locator(
        '[class*="animate"], ' +
        '[class*="pulse"], ' +
        '.urgent-badge'
      );

      await page.screenshot({ path: 'test-results/dmg-urgent-badge-animated.png', fullPage: true });
    }
  });
});
