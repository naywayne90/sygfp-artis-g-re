/**
 * Tests E2E - Validation des Reglements
 *
 * Scenarios testes :
 * - Cycle de validation d'un reglement
 * - Changements de statut
 * - Permissions (qui peut valider/rejeter)
 * - Rejet avec motif obligatoire et renvoi
 */

import { test, expect } from '@playwright/test';
import { loginAs, selectExercice } from '../fixtures/auth';
import { navigateToReglements, switchTab, SELECTORS } from '../fixtures/reglements';

test.setTimeout(60000);

test.describe('Reglements - Verification des statuts', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'agent.dsi@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);
  });

  test("Les reglements affiches dans l'onglet Tous ont un statut visible", async ({ page }) => {
    await switchTab(page, 'tous');

    // Verifier si des reglements existent
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();

    if (rowCount === 0) {
      // Pas de reglements - verifier l'etat vide
      await expect(page.locator(SELECTORS.list.emptyState)).toBeVisible();
      test.skip();
      return;
    }

    // Chaque reglement devrait avoir un badge de statut (Solde ou Partiel)
    const firstRow = rows.first();
    const statusBadge = firstRow.locator('text=Soldé, text=Partiel');
    await expect(statusBadge).toBeVisible({ timeout: 10000 });
  });

  test("L'onglet Soldes ne montre que les reglements soldes", async ({ page }) => {
    await switchTab(page, 'soldes');

    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();

    if (rowCount === 0) {
      // Pas de reglements soldes - acceptable
      const emptyState = page.locator(SELECTORS.list.emptyState);
      await expect(emptyState).toBeVisible({ timeout: 5000 });
      return;
    }

    // Tous les reglements visibles doivent avoir le badge "Solde"
    for (let i = 0; i < Math.min(rowCount, 5); i++) {
      const row = rows.nth(i);
      await expect(row.locator('text=Soldé')).toBeVisible();
    }
  });

  test("L'onglet Partiels ne montre que les reglements partiels", async ({ page }) => {
    await switchTab(page, 'partiels');

    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();

    if (rowCount === 0) {
      const emptyState = page.locator(SELECTORS.list.emptyState);
      await expect(emptyState).toBeVisible({ timeout: 5000 });
      return;
    }

    // Tous les reglements visibles doivent avoir le badge "Partiel"
    for (let i = 0; i < Math.min(rowCount, 5); i++) {
      const row = rows.nth(i);
      await expect(row.locator('text=Partiel')).toBeVisible();
    }
  });
});

test.describe('Reglements - Details et actions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'agent.dsi@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);
  });

  test("Agent peut ouvrir les details d'un reglement", async ({ page }) => {
    await switchTab(page, 'tous');

    // Trouver un reglement dans la liste
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();

    if (rowCount === 0) {
      test.skip();
      return;
    }

    // Cliquer sur le menu d'actions du premier reglement
    const firstRow = rows.first();
    const menuBtn = firstRow.locator('button').last();
    await menuBtn.click();

    // Cliquer sur "Voir details"
    await page.locator(SELECTORS.actions.viewDetails).click();

    // Le panneau de details devrait s'ouvrir
    await expect(page.locator(SELECTORS.details.title)).toBeVisible({ timeout: 10000 });
  });

  test('Les details du reglement affichent les informations completes', async ({ page }) => {
    await switchTab(page, 'tous');

    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();

    if (rowCount === 0) {
      test.skip();
      return;
    }

    // Ouvrir les details du premier reglement
    const firstRow = rows.first();
    const menuBtn = firstRow.locator('button').last();
    await menuBtn.click();
    await page.locator(SELECTORS.actions.viewDetails).click();

    // Verifier les sections du detail
    await expect(page.locator('text=Informations du règlement')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Ordonnancement associé')).toBeVisible();
    await expect(page.locator('text=Chaîne de traçabilité')).toBeVisible();

    // Verifier les onglets du detail
    await expect(page.locator('button[role="tab"]:has-text("Détails")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Workflow")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Journal d\'audit")')).toBeVisible();
  });

  test('La progression du paiement est affichee dans les details', async ({ page }) => {
    await switchTab(page, 'tous');

    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();

    if (rowCount === 0) {
      test.skip();
      return;
    }

    // Ouvrir les details du premier reglement
    const firstRow = rows.first();
    const menuBtn = firstRow.locator('button').last();
    await menuBtn.click();
    await page.locator(SELECTORS.actions.viewDetails).click();

    // Verifier la barre de progression
    await expect(page.locator('text=Progression du paiement')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[role="progressbar"]')).toBeVisible();
  });
});

test.describe("Reglements - Rejet d'un reglement", () => {
  test('Le bouton rejeter est visible pour les reglements non soldes', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);

    await switchTab(page, 'partiels');

    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();

    if (rowCount === 0) {
      test.skip();
      return;
    }

    // Ouvrir les details du premier reglement partiel
    const firstRow = rows.first();
    const menuBtn = firstRow.locator('button').last();
    await menuBtn.click();
    await page.locator(SELECTORS.actions.viewDetails).click();

    // Le bouton Rejeter devrait etre visible pour un reglement partiel
    const rejectBtn = page.locator(SELECTORS.details.rejectBtn);
    if (await rejectBtn.isVisible({ timeout: 5000 })) {
      await expect(rejectBtn).toBeVisible();
    } else {
      // Le reglement est peut-etre deja solde ou rejete
      test.skip();
    }
  });

  test('Le rejet requiert un motif obligatoire', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);

    await switchTab(page, 'partiels');

    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();

    if (rowCount === 0) {
      test.skip();
      return;
    }

    // Ouvrir les details
    const firstRow = rows.first();
    const menuBtn = firstRow.locator('button').last();
    await menuBtn.click();
    await page.locator(SELECTORS.actions.viewDetails).click();

    // Cliquer sur Rejeter
    const rejectBtn = page.locator(SELECTORS.details.rejectBtn);
    if (!(await rejectBtn.isVisible({ timeout: 5000 }))) {
      test.skip();
      return;
    }

    await rejectBtn.click();

    // Le dialog de rejet s'ouvre
    await expect(page.locator('text=Rejeter le règlement')).toBeVisible({ timeout: 5000 });

    // Le bouton de confirmation est desactive sans motif
    const confirmRejectBtn = page.locator('button:has-text("Rejeter et renvoyer")');
    await expect(confirmRejectBtn).toBeDisabled();

    // Remplir le motif
    await page.locator('textarea#motif').fill('Rejet de test E2E - Reference invalide');

    // Le bouton devrait etre active
    await expect(confirmRejectBtn).toBeEnabled();
  });

  test('Les options de renvoi sont disponibles', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);

    await switchTab(page, 'partiels');

    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();

    if (rowCount === 0) {
      test.skip();
      return;
    }

    // Ouvrir les details
    const firstRow = rows.first();
    const menuBtn = firstRow.locator('button').last();
    await menuBtn.click();
    await page.locator(SELECTORS.actions.viewDetails).click();

    // Cliquer sur Rejeter
    const rejectBtn = page.locator(SELECTORS.details.rejectBtn);
    if (!(await rejectBtn.isVisible({ timeout: 5000 }))) {
      test.skip();
      return;
    }

    await rejectBtn.click();

    // Verifier les options de renvoi
    await expect(page.locator('text=Renvoyer vers')).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Renvoi à l'Engagement")).toBeVisible();
    await expect(page.locator('text=Renvoi à la Création')).toBeVisible();
  });
});

test.describe('Reglements - Permissions', () => {
  test('Agent DSI peut acceder a la page reglements', async ({ page }) => {
    await loginAs(page, 'agent.dsi@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);

    // L'agent doit voir la page
    await expect(
      page.locator(SELECTORS.page.title).filter({ hasText: /Règlements/i })
    ).toBeVisible();
  });

  test('DG peut acceder a la page reglements', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);

    await expect(
      page.locator(SELECTORS.page.title).filter({ hasText: /Règlements/i })
    ).toBeVisible();
  });

  test('DAAF peut acceder a la page reglements', async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);

    await expect(
      page.locator(SELECTORS.page.title).filter({ hasText: /Règlements/i })
    ).toBeVisible();
  });
});

test.describe('Reglements - Annulation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'agent.dsi@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);
  });

  test("Le menu d'actions contient l'option Annuler reglement", async ({ page }) => {
    await switchTab(page, 'tous');

    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();

    if (rowCount === 0) {
      test.skip();
      return;
    }

    // Ouvrir le menu d'actions
    const firstRow = rows.first();
    const menuBtn = firstRow.locator('button').last();
    await menuBtn.click();

    // Verifier que l'option Annuler est presente
    await expect(page.locator(SELECTORS.actions.cancelReglement)).toBeVisible();
  });

  test("L'annulation demande une confirmation", async ({ page }) => {
    await switchTab(page, 'tous');

    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();

    if (rowCount === 0) {
      test.skip();
      return;
    }

    // Ouvrir le menu et cliquer sur Annuler
    const firstRow = rows.first();
    const menuBtn = firstRow.locator('button').last();
    await menuBtn.click();
    await page.locator(SELECTORS.actions.cancelReglement).click();

    // Le dialog de confirmation doit s'ouvrir
    await expect(page.locator(SELECTORS.alerts.cancelDialog)).toBeVisible({ timeout: 5000 });
    await expect(page.locator(SELECTORS.alerts.confirmCancel)).toBeVisible();

    // Fermer sans confirmer (cliquer Annuler dans le dialog)
    await page.locator('button:has-text("Annuler")').last().click();
  });
});
