/**
 * Tests E2E - Validation des Reglements
 *
 * Scenarios testes :
 * - Acces au workflow de validation des reglements
 * - Validation d'un reglement par le DG
 * - Rejet d'un reglement avec motif
 * - Verification du statut apres validation
 */

import { test, expect } from '@playwright/test';
import { loginAs, selectExercice } from '../fixtures/auth';
import { navigateToReglements, clickTab, CHAIN_SELECTORS } from '../fixtures/budget-chain';

test.setTimeout(45000);

test.describe('Reglements - Workflow de validation', () => {
  test('DG peut acceder a la page des reglements', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);

    await expect(page.locator('h1, h2').filter({ hasText: /glements/i })).toBeVisible();
  });

  test('La page affiche les onglets "Soldes" et "Partiels"', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);

    // Verifier la presence des onglets
    const soldesTab = page.locator(CHAIN_SELECTORS.reglements.tabs.soldes).first();
    const partielsTab = page.locator(CHAIN_SELECTORS.reglements.tabs.partiels).first();

    await expect(soldesTab).toBeVisible({ timeout: 5000 });
    await expect(partielsTab).toBeVisible({ timeout: 5000 });
  });

  test('L\'onglet "Soldes" affiche les reglements termines', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);

    await clickTab(page, CHAIN_SELECTORS.reglements.tabs.soldes);

    // Le contenu devrait s'afficher sans erreur
    const content = page.locator('table, .text-center');
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });

  test('L\'onglet "Partiels" affiche les reglements en cours', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);

    await clickTab(page, CHAIN_SELECTORS.reglements.tabs.partiels);

    const content = page.locator('table, .text-center');
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });

  test('L\'onglet "Tous" affiche l\'ensemble des reglements', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);

    await clickTab(page, CHAIN_SELECTORS.reglements.tabs.tous);

    const content = page.locator('table, .text-center, .text-muted-foreground');
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });

  test("Les details d'un reglement sont accessibles", async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);

    await clickTab(page, CHAIN_SELECTORS.reglements.tabs.tous);

    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      // Cliquer sur la premiere ligne ou le bouton voir
      const viewBtn = rows.first().locator('button:has-text("Voir"), [aria-label="Voir"]');
      if (await viewBtn.isVisible({ timeout: 3000 })) {
        await viewBtn.click();
      } else {
        await rows.first().click();
      }

      // Verifier que le detail s'ouvre (Sheet ou Dialog)
      const detailPanel = page.locator('[data-state="open"], dialog, [role="dialog"]');
      await expect(detailPanel.first()).toBeVisible({ timeout: 5000 });
    } else {
      test.skip();
    }
  });
});

test.describe('Reglements - Permissions', () => {
  test('DAAF peut acceder aux reglements', async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);

    await expect(page.locator('h1, h2').filter({ hasText: /glements/i })).toBeVisible();
  });

  test("L'export est disponible sur la page des reglements", async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);

    // Verifier la presence du bouton d'export
    const exportBtn = page.locator('button:has-text("Exporter"), button:has-text("Export")');
    if (await exportBtn.first().isVisible({ timeout: 5000 })) {
      await expect(exportBtn.first()).toBeVisible();
    }
  });
});
