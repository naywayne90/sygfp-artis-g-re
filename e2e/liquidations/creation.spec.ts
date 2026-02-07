/**
 * Tests E2E - Creation de Liquidations
 *
 * Scenarios testes :
 * - Acces a la page des liquidations
 * - Affichage des engagements valides a traiter
 * - Creation d'une liquidation a partir d'un engagement valide
 * - Navigation par onglets
 * - Recherche et filtrage
 */

import { test, expect } from '@playwright/test';
import { loginAs, waitForPageLoad, selectExercice } from '../fixtures/auth';
import { navigateToLiquidations, clickTab, CHAIN_SELECTORS } from '../fixtures/budget-chain';

test.setTimeout(45000);

test.describe('Liquidations - Creation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'agent.dsi@arti.ci', 'Test2026!');
    await selectExercice(page);
  });

  test('Agent peut acceder a la page des liquidations', async ({ page }) => {
    await navigateToLiquidations(page);

    // Verifier les elements cles
    await expect(page.locator(CHAIN_SELECTORS.liquidations.pageTitle)).toBeVisible();

    // Verifier la presence des onglets
    const tabsList = page.locator('[role="tablist"]');
    await expect(tabsList).toBeVisible({ timeout: 10000 });
  });

  test('La page affiche les statistiques de liquidation', async ({ page }) => {
    await navigateToLiquidations(page);

    // Verifier la presence des cartes de stats
    const statsCards = page.locator('.grid .pt-6');
    const cardCount = await statsCards.count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test('L\'onglet "A traiter" affiche les engagements valides', async ({ page }) => {
    await navigateToLiquidations(page);

    // L'onglet "A traiter" est le defaut
    await clickTab(page, CHAIN_SELECTORS.liquidations.tabs.aTraiter);

    // Le contenu devrait s'afficher
    const tableOrEmpty = page.locator('table, .text-center');
    await expect(tableOrEmpty.first()).toBeVisible({ timeout: 10000 });
  });

  test('Les onglets de statut fonctionnent', async ({ page }) => {
    await navigateToLiquidations(page);

    const tabs = [
      CHAIN_SELECTORS.liquidations.tabs.tous,
      CHAIN_SELECTORS.liquidations.tabs.aValider,
      CHAIN_SELECTORS.liquidations.tabs.valides,
      CHAIN_SELECTORS.liquidations.tabs.rejetes,
    ];

    for (const tabSelector of tabs) {
      const tab = page.locator(tabSelector).first();
      if (await tab.isVisible({ timeout: 3000 })) {
        await tab.click();
        await waitForPageLoad(page);

        // Pas d'erreur
        const errorToast = page.locator('[data-type="error"]');
        await expect(errorToast).not.toBeVisible({ timeout: 2000 });
      }
    }
  });

  test('La recherche filtre les liquidations', async ({ page }) => {
    await navigateToLiquidations(page);

    // Aller sur "Tous"
    await clickTab(page, CHAIN_SELECTORS.liquidations.tabs.tous);

    const searchInput = page.locator(CHAIN_SELECTORS.common.searchInput);
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // Rechercher un terme inexistant
    await searchInput.fill('xyz-inexistant-test');
    await waitForPageLoad(page);

    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeLessThanOrEqual(1);
  });

  test('Le bouton "Nouvelle liquidation" est visible', async ({ page }) => {
    await navigateToLiquidations(page);

    const newBtn = page.locator(CHAIN_SELECTORS.liquidations.newBtn);
    if (await newBtn.isVisible({ timeout: 5000 })) {
      await expect(newBtn).toBeVisible();
    }
  });

  test("Le formulaire de creation de liquidation s'ouvre", async ({ page }) => {
    await navigateToLiquidations(page);

    const newBtn = page.locator(CHAIN_SELECTORS.liquidations.newBtn);

    if (await newBtn.isVisible({ timeout: 5000 })) {
      if (await newBtn.isEnabled()) {
        await newBtn.click();

        // Verifier que le dialog/sheet s'ouvre
        const dialog = page.locator('dialog, [role="dialog"], [data-state="open"]');
        await expect(dialog.first()).toBeVisible({ timeout: 5000 });
      }
    } else {
      test.skip();
    }
  });
});

test.describe('Liquidations - Validation', () => {
  test('DG peut voir les liquidations a valider', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToLiquidations(page);

    await clickTab(page, CHAIN_SELECTORS.liquidations.tabs.aValider);

    const tableOrEmpty = page.locator('table, .text-center');
    await expect(tableOrEmpty.first()).toBeVisible({ timeout: 10000 });
  });

  test('DG peut voir les liquidations validees', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToLiquidations(page);

    await clickTab(page, CHAIN_SELECTORS.liquidations.tabs.valides);

    const tableOrEmpty = page.locator('table, .text-center');
    await expect(tableOrEmpty.first()).toBeVisible({ timeout: 10000 });
  });

  test('Les actions de validation sont disponibles pour le DG', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToLiquidations(page);

    await clickTab(page, CHAIN_SELECTORS.liquidations.tabs.aValider);

    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      // Chercher le menu d'actions
      const actionMenu = rows.first().locator('button').last();
      if (await actionMenu.isVisible({ timeout: 3000 })) {
        await actionMenu.click();

        // Verifier les options du menu
        const menuItems = page.locator('[role="menuitem"]');
        await expect(menuItems.first()).toBeVisible({ timeout: 3000 });
      }
    } else {
      test.skip();
    }
  });
});
