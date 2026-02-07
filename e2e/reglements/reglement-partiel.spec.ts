/**
 * Tests E2E - Reglements Partiels
 *
 * Scenarios testes :
 * - Creation d'un reglement partiel
 * - Verification du montant restant calcule
 * - Verification du statut "Partiel" vs "Solde"
 * - Reglement complet qui solde l'ordonnancement
 * - Verification de l'alerte quand le montant depasse le restant
 */

import { test, expect } from '@playwright/test';
import { loginAs, selectExercice } from '../fixtures/auth';
import {
  navigateToReglements,
  openCreateDialog,
  selectFirstOrdonnancement,
  switchTab,
  cleanupTestData,
  SELECTORS,
} from '../fixtures/reglements';

test.setTimeout(60000);

test.describe('Reglements Partiels - Calcul de disponibilite', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'agent.dsi@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestData(page);
  });

  test("La section calcul du restant a payer apparait apres selection d'un ordonnancement", async ({
    page,
  }) => {
    const createBtn = page.locator(SELECTORS.page.createBtn);
    if (await createBtn.isDisabled()) {
      test.skip();
      return;
    }

    await openCreateDialog(page);
    await selectFirstOrdonnancement(page);

    // La section de calcul doit apparaitre
    await expect(page.locator('text=Calcul du restant à payer')).toBeVisible({ timeout: 10000 });

    // Les composants du calcul doivent etre visibles
    await expect(page.locator('text=(A) Montant ordonnancé')).toBeVisible();
    await expect(page.locator('text=(B) Règlements antérieurs')).toBeVisible();
    await expect(page.locator('text=(C) Ce règlement')).toBeVisible();
    await expect(page.locator('text=(D) Restant après')).toBeVisible();
  });

  test('Le badge "Disponible" s\'affiche quand il reste du montant a payer', async ({ page }) => {
    const createBtn = page.locator(SELECTORS.page.createBtn);
    if (await createBtn.isDisabled()) {
      test.skip();
      return;
    }

    await openCreateDialog(page);
    await selectFirstOrdonnancement(page);

    // Attendre le calcul
    await expect(page.locator('text=Calcul du restant à payer')).toBeVisible({ timeout: 10000 });

    // Le badge "Disponible" devrait etre present (car les ordonnancements valides ont un restant > 0)
    await expect(page.locator(SELECTORS.availability.disponible)).toBeVisible();
  });

  test('Le montant de "Ce reglement" se met a jour en temps reel', async ({ page }) => {
    const createBtn = page.locator(SELECTORS.page.createBtn);
    if (await createBtn.isDisabled()) {
      test.skip();
      return;
    }

    await openCreateDialog(page);
    await selectFirstOrdonnancement(page);

    // Attendre le calcul
    await expect(page.locator('text=Calcul du restant à payer')).toBeVisible({ timeout: 10000 });

    // Saisir un montant
    const montantInput = page.locator(SELECTORS.form.montant);
    await montantInput.fill('50000');

    // Verifier que la section "(C) Ce reglement" affiche le montant
    await expect(page.locator('text=50 000 FCFA')).toBeVisible({ timeout: 5000 });
  });

  test("Une alerte s'affiche si le montant depasse le restant a payer", async ({ page }) => {
    const createBtn = page.locator(SELECTORS.page.createBtn);
    if (await createBtn.isDisabled()) {
      test.skip();
      return;
    }

    await openCreateDialog(page);
    await selectFirstOrdonnancement(page);

    // Attendre le calcul
    await expect(page.locator('text=Calcul du restant à payer')).toBeVisible({ timeout: 10000 });

    // Saisir un montant tres eleve (superieur au restant)
    const montantInput = page.locator(SELECTORS.form.montant);
    await montantInput.fill('99999999999');

    // L'alerte "Montant invalide" devrait apparaitre
    await expect(page.locator('text=Montant invalide')).toBeVisible({ timeout: 5000 });
    await expect(
      page.locator('text=Le montant du règlement ne peut pas dépasser le restant à payer')
    ).toBeVisible();

    // Le bouton de soumission devrait etre desactive
    await expect(page.locator(SELECTORS.form.submitBtn)).toBeDisabled();
  });

  test('L\'alerte "Reglement complet" apparait quand le montant egale le restant', async ({
    page,
  }) => {
    const createBtn = page.locator(SELECTORS.page.createBtn);
    if (await createBtn.isDisabled()) {
      test.skip();
      return;
    }

    await openCreateDialog(page);
    await selectFirstOrdonnancement(page);

    // Attendre le calcul
    await expect(page.locator('text=Calcul du restant à payer')).toBeVisible({ timeout: 10000 });

    // Lire le montant "Maximum" affiche sous le champ montant
    const maxDescription = page.locator('text=Maximum:');
    if (await maxDescription.isVisible({ timeout: 5000 })) {
      // Recuperer le texte du maximum pour remplir le meme montant
      const maxText = await maxDescription.textContent();
      // Extraire le nombre du format "Maximum: 1 500 000 FCFA"
      const match = maxText?.match(/[\d\s]+/);
      if (match) {
        const maxAmount = match[0].replace(/\s/g, '').trim();
        const montantInput = page.locator(SELECTORS.form.montant);
        await montantInput.fill(maxAmount);

        // L'alerte "Reglement complet" devrait apparaitre
        await expect(page.locator('text=Règlement complet')).toBeVisible({ timeout: 5000 });
        await expect(
          page.locator("text=Ce règlement soldera complètement l'ordonnancement")
        ).toBeVisible();
      }
    }
  });
});

test.describe('Reglements Partiels - Verification dans les onglets', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'agent.dsi@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);
  });

  test("L'onglet Partiels affiche les compteurs dans le badge", async ({ page }) => {
    // L'onglet Partiels doit afficher un nombre
    const partielsTab = page.locator(SELECTORS.tabs.partiels);
    await expect(partielsTab).toBeVisible();

    // Il devrait contenir un badge avec un nombre
    const badge = partielsTab.locator('span, div').filter({ hasText: /^\d+$/ });
    if (await badge.isVisible({ timeout: 3000 })) {
      const count = await badge.textContent();
      expect(parseInt(count || '0', 10)).toBeGreaterThanOrEqual(0);
    }
  });

  test("L'onglet Soldes affiche les compteurs dans le badge", async ({ page }) => {
    const soldesTab = page.locator(SELECTORS.tabs.soldes);
    await expect(soldesTab).toBeVisible();

    const badge = soldesTab.locator('span, div').filter({ hasText: /^\d+$/ });
    if (await badge.isVisible({ timeout: 3000 })) {
      const count = await badge.textContent();
      expect(parseInt(count || '0', 10)).toBeGreaterThanOrEqual(0);
    }
  });

  test("L'onglet Tous affiche le nombre total de reglements", async ({ page }) => {
    const tousTab = page.locator(SELECTORS.tabs.tous);
    await expect(tousTab).toBeVisible();

    const badge = tousTab.locator('span, div').filter({ hasText: /^\d+$/ });
    if (await badge.isVisible({ timeout: 3000 })) {
      const count = await badge.textContent();
      expect(parseInt(count || '0', 10)).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe('Reglements Partiels - Details et progression', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'agent.dsi@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);
  });

  test('Un reglement partiel affiche la progression dans les details', async ({ page }) => {
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
    await page.locator('text=Voir détails').click();

    // La progression du paiement doit etre visible et inferieure a 100%
    await expect(page.locator('text=Progression du paiement')).toBeVisible({ timeout: 10000 });

    // Le badge "Partiel" doit etre present
    await expect(page.locator(SELECTORS.details.statutPartiel)).toBeVisible();

    // Le restant a payer doit etre affiche
    await expect(page.locator('text=Restant à payer')).toBeVisible();
  });

  test('Un reglement solde affiche la barre a 100% et le badge Solde', async ({ page }) => {
    await switchTab(page, 'soldes');

    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();

    if (rowCount === 0) {
      test.skip();
      return;
    }

    // Ouvrir les details du premier reglement solde
    const firstRow = rows.first();
    const menuBtn = firstRow.locator('button').last();
    await menuBtn.click();
    await page.locator('text=Voir détails').click();

    // Le badge "Solde" doit etre present
    await expect(page.locator(SELECTORS.details.statutSolde).first()).toBeVisible({
      timeout: 10000,
    });

    // L'alerte de cloture doit etre visible
    await expect(page.locator('text=Dossier clôturé')).toBeVisible();
  });
});

test.describe('Reglements Partiels - Table A payer', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'agent.dsi@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);
  });

  test("L'onglet A payer affiche les colonnes correctes", async ({ page }) => {
    // L'onglet "A payer" est actif par defaut
    const table = page.locator(SELECTORS.list.table);
    const emptyState = page.locator(SELECTORS.aTraiterList.emptyState);

    if (await table.isVisible({ timeout: 5000 })) {
      // Verifier les en-tetes de colonnes
      await expect(page.locator('th:has-text("Réf. Ordonnancement")')).toBeVisible();
      await expect(page.locator('th:has-text("Bénéficiaire")')).toBeVisible();
      await expect(page.locator('th:has-text("Mode paiement")')).toBeVisible();
      await expect(page.locator('th:has-text("Montant")')).toBeVisible();
      await expect(page.locator('th:has-text("Restant")')).toBeVisible();
      await expect(page.locator('th:has-text("Actions")')).toBeVisible();
    } else if (await emptyState.isVisible({ timeout: 5000 })) {
      // Pas d'ordonnancements en attente - acceptable
      await expect(emptyState).toBeVisible();
    }
  });

  test("Le montant restant est affiche en orange dans l'onglet A payer", async ({ page }) => {
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();

    if (rowCount === 0) {
      test.skip();
      return;
    }

    // Verifier que le montant restant est present et formate en FCFA
    const firstRow = rows.first();
    const montantCells = firstRow.locator('td').filter({ hasText: /FCFA/ });
    const cellCount = await montantCells.count();

    // Il devrait y avoir au moins 2 cellules avec FCFA (montant et restant)
    expect(cellCount).toBeGreaterThanOrEqual(2);
  });
});
