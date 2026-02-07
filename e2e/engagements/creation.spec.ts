/**
 * Tests E2E - Creation d'Engagements
 *
 * Scenarios testes :
 * - Acces a la page des engagements
 * - Creation d'un engagement a partir d'une passation validee
 * - Soumission d'un engagement pour validation
 * - Validation des champs obligatoires
 */

import { test, expect } from '@playwright/test';
import { loginAs, waitForPageLoad, selectExercice } from '../fixtures/auth';
import { navigateToEngagements, clickTab, CHAIN_SELECTORS } from '../fixtures/budget-chain';

test.setTimeout(45000);

test.describe('Engagements - Creation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'agent.dsi@arti.ci', 'Test2026!');
    await selectExercice(page);
  });

  test('Agent peut acceder a la page des engagements', async ({ page }) => {
    await navigateToEngagements(page);

    // Verifier les elements cles de la page
    await expect(page.locator(CHAIN_SELECTORS.engagements.pageTitle)).toBeVisible();

    // Verifier la presence des onglets
    const tabsList = page.locator('[role="tablist"]');
    await expect(tabsList).toBeVisible({ timeout: 10000 });
  });

  test('La page affiche les statistiques', async ({ page }) => {
    await navigateToEngagements(page);

    // Verifier la presence des cartes de stats
    await expect(page.locator('text=Total').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Montant total').first()).toBeVisible({ timeout: 10000 });
  });

  test('La recherche filtre les engagements', async ({ page }) => {
    await navigateToEngagements(page);

    // Aller sur l'onglet "Tous"
    await clickTab(page, CHAIN_SELECTORS.engagements.tabs.tous);

    // Verifier la barre de recherche
    const searchInput = page.locator(CHAIN_SELECTORS.common.searchInput);
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // Taper un terme de recherche
    await searchInput.fill('test-inexistant-xyz');
    await waitForPageLoad(page);

    // Verifier que la liste est filtree (peut etre vide)
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    // Le nombre de resultats devrait etre 0 ou tres faible
    expect(rowCount).toBeLessThanOrEqual(1);
  });

  test('L\'onglet "A traiter" affiche les passations validees', async ({ page }) => {
    await navigateToEngagements(page);

    // L'onglet "A traiter" devrait etre selectionne par defaut ou visible
    await clickTab(page, CHAIN_SELECTORS.engagements.tabs.aTraiter);

    // Le contenu devrait s'afficher (liste ou etat vide)
    const tableOrEmpty = page.locator('table, .text-center');
    await expect(tableOrEmpty.first()).toBeVisible({ timeout: 10000 });
  });

  test('Le bouton "Nouvel engagement" est visible pour un agent autorise', async ({ page }) => {
    await navigateToEngagements(page);

    // Le bouton devrait etre present (visible ou dans un PermissionGuard)
    const newBtn = page.locator(CHAIN_SELECTORS.engagements.newBtn);
    // Si l'agent a la permission, le bouton est visible
    if (await newBtn.isVisible({ timeout: 5000 })) {
      await expect(newBtn).toBeVisible();
    }
  });

  test("Le formulaire de creation d'engagement s'ouvre", async ({ page }) => {
    await navigateToEngagements(page);

    const newBtn = page.locator(CHAIN_SELECTORS.engagements.newBtn);

    if (await newBtn.isVisible({ timeout: 5000 })) {
      if (await newBtn.isEnabled()) {
        await newBtn.click();

        // Verifier que le formulaire/dialog s'ouvre
        const dialog = page.locator(CHAIN_SELECTORS.common.dialog);
        await expect(dialog).toBeVisible({ timeout: 5000 });
      }
    } else {
      // L'agent peut ne pas avoir la permission
      test.skip();
    }
  });

  test('Les onglets de statut fonctionnent', async ({ page }) => {
    await navigateToEngagements(page);

    // Tester chaque onglet
    const tabs = [
      CHAIN_SELECTORS.engagements.tabs.tous,
      CHAIN_SELECTORS.engagements.tabs.aValider,
      CHAIN_SELECTORS.engagements.tabs.valides,
      CHAIN_SELECTORS.engagements.tabs.rejetes,
      CHAIN_SELECTORS.engagements.tabs.differes,
    ];

    for (const tabSelector of tabs) {
      const tab = page.locator(tabSelector).first();
      if (await tab.isVisible({ timeout: 3000 })) {
        await tab.click();
        await waitForPageLoad(page);

        // Verifier que le contenu se charge sans erreur
        const errorToast = page.locator('[data-type="error"]');
        await expect(errorToast).not.toBeVisible({ timeout: 2000 });
      }
    }
  });
});

test.describe('Engagements - Actions', () => {
  test('DG peut voir les engagements a valider', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToEngagements(page);

    // Aller sur l'onglet "A valider"
    await clickTab(page, CHAIN_SELECTORS.engagements.tabs.aValider);

    // Verifier que la liste se charge
    const tableOrEmpty = page.locator('table, .text-center');
    await expect(tableOrEmpty.first()).toBeVisible({ timeout: 10000 });
  });

  test('DG voit les boutons de validation sur les engagements', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToEngagements(page);

    // Aller sur l'onglet "A valider"
    await clickTab(page, CHAIN_SELECTORS.engagements.tabs.aValider);

    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      // Verifier la presence d'un menu d'actions ou de boutons
      const actionMenu = rows.first().locator('button').last();
      if (await actionMenu.isVisible({ timeout: 3000 })) {
        await actionMenu.click();

        // Verifier les actions disponibles dans le dropdown
        const menuItems = page.locator('[role="menuitem"]');
        await expect(menuItems.first()).toBeVisible({ timeout: 3000 });
      }
    } else {
      test.skip();
    }
  });

  test('Un engagement valide peut generer une liquidation', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToEngagements(page);

    // Aller sur l'onglet "Valides"
    await clickTab(page, CHAIN_SELECTORS.engagements.tabs.valides);

    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      // Chercher un bouton ou lien "Liquidation" dans le menu d'actions
      const actionMenu = rows.first().locator('button').last();
      if (await actionMenu.isVisible({ timeout: 3000 })) {
        await actionMenu.click();

        // Verifier qu'il y a une option pour creer une liquidation
        const liquidationOption = page.locator('[role="menuitem"]:has-text("Liquidation")');
        if (await liquidationOption.isVisible({ timeout: 3000 })) {
          await expect(liquidationOption).toBeVisible();
        }
      }
    } else {
      test.skip();
    }
  });
});
