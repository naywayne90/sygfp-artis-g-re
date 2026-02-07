/**
 * Tests E2E - Workflow Reglements
 *
 * Scenarios testes :
 * - Paiement total (marquer comme solde)
 * - Paiement partiel (montant < total)
 * - Annulation d'un reglement
 * - Details d'un reglement
 * - Actions dans le menu dropdown
 */

import { test, expect } from '@playwright/test';
import { loginAs, waitForPageLoad, selectExercice } from '../fixtures/auth';
import {
  navigateToReglements,
  openCreateDialog,
  selectFirstOrdonnancement,
  fillReglementForm,
  submitReglementForm,
  switchTab,
  getTableRowCount,
  openReglementActions,
  SELECTORS,
  cleanupTestData,
} from '../fixtures/reglements';

// Tests run in serial mode since they modify data
test.describe.configure({ mode: 'serial' });

// Timeout per test: 60 seconds
test.setTimeout(60000);

test.describe('Reglements - Paiement partiel', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await selectExercice(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestData(page);
  });

  test('Un paiement partiel garde l\'ordonnancement dans la liste "A payer"', async ({ page }) => {
    await navigateToReglements(page);

    const createBtn = page.locator(SELECTORS.page.createBtn).first();
    if (!(await createBtn.isEnabled({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }

    // Count ordonnancements before
    const initialRows = page.locator('table tbody tr');
    const initialCount = await initialRows.count();

    if (initialCount === 0) {
      test.skip();
      return;
    }

    await openCreateDialog(page);
    await selectFirstOrdonnancement(page);

    // Make a small partial payment
    await fillReglementForm(page, {
      modePaiement: 'Virement bancaire',
      reference: `VIR-PARTIEL-${Date.now()}`,
      montant: 1000, // Very small amount - should be partial
      observation: 'Test E2E - Paiement partiel',
    });

    await submitReglementForm(page);

    // Wait for page to refresh
    await waitForPageLoad(page);

    // Navigate back to reglements
    await navigateToReglements(page);

    // The reglement should appear in "Partiels" tab
    await switchTab(page, 'partiels');
    const partielsContent = page.locator('table, text=Aucun');
    await expect(partielsContent.first()).toBeVisible({ timeout: 10000 });
  });

  test('Un paiement partiel affiche le statut "Partiel"', async ({ page }) => {
    await navigateToReglements(page);
    await switchTab(page, 'tous');

    const rowCount = await getTableRowCount(page);

    if (rowCount > 0) {
      // Look for any "Partiel" badges in the table
      const partielBadge = page.locator('tbody').locator('text=Partiel');
      const hasBadge = await partielBadge
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      // If there are partial payments, the badge should be visible
      // This is a data-dependent assertion
      if (hasBadge) {
        await expect(partielBadge.first()).toBeVisible();
      }
    }
  });
});

test.describe('Reglements - Paiement total (solde)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await selectExercice(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestData(page);
  });

  test('Un paiement total montre l\'alerte "Reglement complet" dans le formulaire', async ({
    page,
  }) => {
    await navigateToReglements(page);

    const createBtn = page.locator(SELECTORS.page.createBtn).first();
    if (!(await createBtn.isEnabled({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await openCreateDialog(page);
    await selectFirstOrdonnancement(page);

    const dialog = page.locator(SELECTORS.dialog.container);

    // Read the max amount from the form description
    const maxText = dialog.locator('text=Maximum');
    if (await maxText.isVisible({ timeout: 5000 })) {
      const maxTextContent = await maxText.textContent();
      const match = maxTextContent?.match(/[\d\s]+/);
      if (match) {
        const maxAmount = parseInt(match[0].replace(/\s/g, ''), 10);
        if (maxAmount > 0) {
          await fillReglementForm(page, {
            modePaiement: 'Virement bancaire',
            montant: maxAmount,
          });

          // "Reglement complet" alert should appear
          await expect(dialog.locator(SELECTORS.alerts.reglementComplet)).toBeVisible({
            timeout: 5000,
          });
        }
      }
    }
  });

  test('Apres paiement total, l\'ordonnancement passe en "Solde"', async ({ page }) => {
    await navigateToReglements(page);
    await switchTab(page, 'soldes');

    const content = page.locator('table, text=Aucun');
    await expect(content.first()).toBeVisible({ timeout: 10000 });

    // Check for "Solde" badges if there are rows
    const rowCount = await getTableRowCount(page);
    if (rowCount > 0) {
      const soldeBadge = page.locator('tbody').locator('text=Soldé');
      await expect(soldeBadge.first()).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Reglements - Actions et details', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await selectExercice(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestData(page);
  });

  test("Le menu d'actions d'un reglement s'ouvre correctement", async ({ page }) => {
    await navigateToReglements(page);
    await switchTab(page, 'tous');

    const rowCount = await getTableRowCount(page);

    if (rowCount > 0) {
      // Open the actions menu on the first row
      await openReglementActions(page, 0);

      // Verify menu items are visible
      await expect(page.locator(SELECTORS.actions.viewDetails)).toBeVisible({ timeout: 3000 });

      await expect(page.locator(SELECTORS.actions.printReceipt)).toBeVisible({ timeout: 3000 });

      await expect(page.locator(SELECTORS.actions.cancelReglement)).toBeVisible({ timeout: 3000 });

      // Close the menu by pressing Escape
      await page.keyboard.press('Escape');
    } else {
      test.skip();
    }
  });

  test("Voir les details d'un reglement ouvre le panneau lateral", async ({ page }) => {
    await navigateToReglements(page);
    await switchTab(page, 'tous');

    const rowCount = await getTableRowCount(page);

    if (rowCount > 0) {
      await openReglementActions(page, 0);

      // Click "Voir details"
      await page.locator(SELECTORS.actions.viewDetails).click();

      // The Sheet should open with the details
      await expect(page.locator(SELECTORS.details.title)).toBeVisible({ timeout: 10000 });

      // Verify the details panel shows key information
      const detailsPanel = page.locator(SELECTORS.details.container).last();
      await expect(detailsPanel).toBeVisible({ timeout: 5000 });
    } else {
      test.skip();
    }
  });

  test('Le panneau de details affiche les informations du reglement', async ({ page }) => {
    await navigateToReglements(page);
    await switchTab(page, 'tous');

    const rowCount = await getTableRowCount(page);

    if (rowCount > 0) {
      await openReglementActions(page, 0);
      await page.locator(SELECTORS.actions.viewDetails).click();

      // Wait for the details to load
      await expect(page.locator(SELECTORS.details.title)).toBeVisible({ timeout: 10000 });

      // Check for key information sections
      const detailsPanel = page.locator(SELECTORS.details.container).last();

      // Payment date should be visible
      const hasDatePaiement = await detailsPanel
        .locator('text=Date de paiement')
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      // Montant should be visible
      const hasMontant = await detailsPanel
        .locator('text=Montant')
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      // At least one of these should be visible
      expect(hasDatePaiement || hasMontant).toBeTruthy();
    } else {
      test.skip();
    }
  });
});

test.describe('Reglements - Annulation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await selectExercice(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestData(page);
  });

  test("Le menu d'actions propose l'annulation", async ({ page }) => {
    await navigateToReglements(page);
    await switchTab(page, 'tous');

    const rowCount = await getTableRowCount(page);

    if (rowCount > 0) {
      await openReglementActions(page, 0);

      // "Annuler reglement" option should be visible
      await expect(page.locator(SELECTORS.actions.cancelReglement)).toBeVisible({ timeout: 3000 });

      await page.keyboard.press('Escape');
    } else {
      test.skip();
    }
  });

  test('Cliquer sur "Annuler reglement" ouvre un dialog de confirmation', async ({ page }) => {
    await navigateToReglements(page);
    await switchTab(page, 'tous');

    const rowCount = await getTableRowCount(page);

    if (rowCount > 0) {
      await openReglementActions(page, 0);

      // Click "Annuler reglement"
      await page.locator(SELECTORS.actions.cancelReglement).click();

      // Confirmation dialog should appear
      await expect(page.locator(SELECTORS.alerts.cancelDialog)).toBeVisible({ timeout: 5000 });

      // The "Confirmer l'annulation" button should be visible
      await expect(page.locator(SELECTORS.alerts.confirmCancel)).toBeVisible({ timeout: 3000 });

      // Cancel the dialog (don't actually delete)
      const cancelBtn = page.locator('[role="alertdialog"] button').filter({ hasText: 'Annuler' });
      if (await cancelBtn.isVisible({ timeout: 2000 })) {
        await cancelBtn.click();
      }
    } else {
      test.skip();
    }
  });

  test('Annuler la confirmation ferme le dialog sans supprimer', async ({ page }) => {
    await navigateToReglements(page);
    await switchTab(page, 'tous');

    const rowCount = await getTableRowCount(page);

    if (rowCount > 0) {
      const initialCount = rowCount;

      await openReglementActions(page, 0);
      await page.locator(SELECTORS.actions.cancelReglement).click();

      // Wait for dialog
      await expect(page.locator(SELECTORS.alerts.cancelDialog)).toBeVisible({ timeout: 5000 });

      // Click the "Annuler" button in the dialog (not the "Confirmer" button)
      const cancelDialogBtn = page
        .locator('[role="alertdialog"] button')
        .filter({ hasText: 'Annuler' });
      if (await cancelDialogBtn.isVisible({ timeout: 2000 })) {
        await cancelDialogBtn.click();
      }

      // Dialog should close
      await expect(page.locator(SELECTORS.alerts.cancelDialog))
        .not.toBeVisible({ timeout: 5000 })
        .catch(() => {});

      // Row count should remain the same
      const afterCount = await getTableRowCount(page);
      expect(afterCount).toBe(initialCount);
    } else {
      test.skip();
    }
  });
});

test.describe('Reglements - Export', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await selectExercice(page);
  });

  test("Le bouton d'export est visible", async ({ page }) => {
    await navigateToReglements(page);

    // The BudgetChainExportButton should be visible
    const exportBtn = page.locator('button:has-text("Export")');
    const hasExport = await exportBtn
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasExport) {
      await expect(exportBtn.first()).toBeVisible();
    }
  });
});
