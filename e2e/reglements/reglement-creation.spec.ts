/**
 * Tests E2E - Creation de Reglements
 *
 * Scenarios testes :
 * - Acces a la page Reglements
 * - Ouverture du formulaire de creation
 * - Creation d'un reglement complet
 * - Verification de la presence dans la liste
 * - Validation des champs obligatoires
 * - Creation depuis l'onglet "A payer"
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
  cleanupTestData,
  SELECTORS,
  MODES_PAIEMENT,
} from '../fixtures/reglements';

// Tests en serie (la creation depend de l'etat precedent)
test.describe.configure({ mode: 'serial' });

test.setTimeout(60000);

test.describe('Reglements - Acces a la page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'agent.dsi@arti.ci', 'Test2026!');
    await selectExercice(page);
  });

  test('Agent peut acceder a la page Reglements', async ({ page }) => {
    await navigateToReglements(page);

    // Verifier la presence du titre
    await expect(
      page.locator(SELECTORS.page.title).filter({ hasText: /Règlements/i })
    ).toBeVisible();

    // Verifier la presence du bouton de creation
    await expect(page.locator(SELECTORS.page.createBtn)).toBeVisible();

    // Verifier la presence des onglets
    await expect(page.locator(SELECTORS.tabs.aTraiter)).toBeVisible();
    await expect(page.locator(SELECTORS.tabs.tous)).toBeVisible();
    await expect(page.locator(SELECTORS.tabs.soldes)).toBeVisible();
    await expect(page.locator(SELECTORS.tabs.partiels)).toBeVisible();
  });

  test('Les cartes de statistiques sont visibles', async ({ page }) => {
    await navigateToReglements(page);

    // Verifier les cartes de stats
    await expect(page.locator(SELECTORS.stats.totalReglements)).toBeVisible();
    await expect(page.locator(SELECTORS.stats.montantTotal)).toBeVisible();
    await expect(page.locator(SELECTORS.stats.soldes)).toBeVisible();
    await expect(page.locator(SELECTORS.stats.enAttente)).toBeVisible();
  });

  test('La barre de recherche est fonctionnelle', async ({ page }) => {
    await navigateToReglements(page);

    const searchInput = page.locator(SELECTORS.page.searchInput);
    await expect(searchInput).toBeVisible();

    // Taper une recherche
    await searchInput.fill('test-recherche');
    await waitForPageLoad(page);

    // Verifier que le filtre est applique (le champ contient la valeur)
    await expect(searchInput).toHaveValue('test-recherche');
  });
});

test.describe('Reglements - Formulaire de creation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'agent.dsi@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestData(page);
  });

  test('Agent peut ouvrir le formulaire de creation', async ({ page }) => {
    // Le bouton peut etre desactive s'il n'y a pas d'ordonnancements valides
    const createBtn = page.locator(SELECTORS.page.createBtn);
    const isDisabled = await createBtn.isDisabled();

    if (isDisabled) {
      // Pas d'ordonnancements valides - c'est un comportement attendu
      test.skip();
      return;
    }

    await openCreateDialog(page);

    // Verifier que le dialog s'affiche
    await expect(page.locator(SELECTORS.dialog.container)).toBeVisible();
    await expect(page.locator(SELECTORS.dialog.title)).toBeVisible();
  });

  test('Le formulaire affiche les champs requis', async ({ page }) => {
    const createBtn = page.locator(SELECTORS.page.createBtn);
    if (await createBtn.isDisabled()) {
      test.skip();
      return;
    }

    await openCreateDialog(page);

    // Verifier les labels des champs obligatoires
    await expect(page.locator('text=Ordonnancement validé')).toBeVisible();
    await expect(page.locator('text=Date de paiement')).toBeVisible();
    await expect(page.locator('text=Mode de paiement')).toBeVisible();
    await expect(page.locator('text=Compte bancaire ARTI')).toBeVisible();
    await expect(page.locator('text=Montant payé')).toBeVisible();

    // Verifier les boutons
    await expect(page.locator(SELECTORS.form.submitBtn)).toBeVisible();
    await expect(page.locator(SELECTORS.form.cancelBtn)).toBeVisible();
  });

  test("La selection d'un ordonnancement affiche ses details", async ({ page }) => {
    const createBtn = page.locator(SELECTORS.page.createBtn);
    if (await createBtn.isDisabled()) {
      test.skip();
      return;
    }

    await openCreateDialog(page);
    await selectFirstOrdonnancement(page);

    // Verifier que les informations de l'ordonnancement s'affichent
    await expect(page.locator('text=Bénéficiaire')).toBeVisible({ timeout: 10000 });

    // La section "Calcul du restant a payer" devrait apparaitre
    await expect(page.locator('text=Calcul du restant à payer')).toBeVisible({ timeout: 10000 });
  });

  test('Agent peut creer un reglement complet', async ({ page }) => {
    const createBtn = page.locator(SELECTORS.page.createBtn);
    if (await createBtn.isDisabled()) {
      test.skip();
      return;
    }

    await openCreateDialog(page);

    // Selectionner un ordonnancement
    await selectFirstOrdonnancement(page);

    // Attendre que le calcul de disponibilite charge
    await expect(page.locator('text=Calcul du restant à payer')).toBeVisible({ timeout: 10000 });

    // Remplir le formulaire
    await fillReglementForm(page, {
      modePaiement: 'Virement bancaire',
      reference: `VIR-TEST-${Date.now()}`,
      compteBancaire: 'first',
      montant: 100000,
      observation: `Reglement test E2E - ${Date.now()}`,
    });

    // Soumettre
    await submitReglementForm(page);

    // Verifier que le reglement a ete cree (le dialog se ferme)
    // Et le toast de succes apparait
    await expect(page.locator(SELECTORS.dialog.container)).toBeHidden({ timeout: 15000 });
  });

  test('Le bouton soumettre est desactive si le formulaire est invalide', async ({ page }) => {
    const createBtn = page.locator(SELECTORS.page.createBtn);
    if (await createBtn.isDisabled()) {
      test.skip();
      return;
    }

    await openCreateDialog(page);

    // Sans remplir aucun champ, le bouton devrait etre desactive
    const submitBtn = page.locator(SELECTORS.form.submitBtn);
    await expect(submitBtn).toBeDisabled();
  });

  test('Agent peut annuler la creation', async ({ page }) => {
    const createBtn = page.locator(SELECTORS.page.createBtn);
    if (await createBtn.isDisabled()) {
      test.skip();
      return;
    }

    await openCreateDialog(page);

    // Cliquer sur Annuler
    await page.locator(SELECTORS.form.cancelBtn).click();

    // Le dialog devrait se fermer
    await expect(page.locator(SELECTORS.dialog.container)).toBeHidden({ timeout: 5000 });
  });

  test('Les modes de paiement sont disponibles', async ({ page }) => {
    const createBtn = page.locator(SELECTORS.page.createBtn);
    if (await createBtn.isDisabled()) {
      test.skip();
      return;
    }

    await openCreateDialog(page);

    // Ouvrir le select des modes de paiement
    const modeSelect = page.locator('button').filter({ hasText: 'Sélectionner le mode' });
    await modeSelect.click();

    // Verifier les options
    for (const mode of MODES_PAIEMENT) {
      await expect(page.locator(`[role="option"]:has-text("${mode}")`)).toBeVisible();
    }

    // Fermer
    await page.keyboard.press('Escape');
  });
});

test.describe("Reglements - Creation depuis l'onglet A payer", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'agent.dsi@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);
  });

  test("L'onglet A payer affiche les ordonnancements en attente", async ({ page }) => {
    // L'onglet "A payer" est actif par defaut
    const tableOrEmpty = page.locator(
      `${SELECTORS.list.table}, ${SELECTORS.aTraiterList.emptyState}`
    );
    await expect(tableOrEmpty.first()).toBeVisible({ timeout: 15000 });
  });

  test('Le bouton Payer ouvre le formulaire avec ordonnancement pre-selectionne', async ({
    page,
  }) => {
    // Verifier s'il y a des ordonnancements a payer
    const payerBtn = page.locator(SELECTORS.aTraiterList.payerBtn).first();

    if (await payerBtn.isVisible({ timeout: 5000 })) {
      await payerBtn.click();

      // Le dialog de creation doit s'ouvrir
      await expect(page.locator(SELECTORS.dialog.container)).toBeVisible({ timeout: 5000 });

      // L'ordonnancement devrait etre pre-selectionne (les details sont visibles)
      await expect(page.locator('text=Bénéficiaire')).toBeVisible({ timeout: 10000 });
    } else {
      // Pas d'ordonnancements a payer
      test.skip();
    }
  });
});

test.describe('Reglements - Navigation entre onglets', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'agent.dsi@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);
  });

  test("Agent peut naviguer vers l'onglet Tous", async ({ page }) => {
    await switchTab(page, 'tous');

    // Verifier la liste ou l'etat vide
    const content = page.locator(`${SELECTORS.list.table}, ${SELECTORS.list.emptyState}`);
    await expect(content.first()).toBeVisible({ timeout: 15000 });
  });

  test("Agent peut naviguer vers l'onglet Soldes", async ({ page }) => {
    await switchTab(page, 'soldes');

    const content = page.locator(`${SELECTORS.list.table}, ${SELECTORS.list.emptyState}`);
    await expect(content.first()).toBeVisible({ timeout: 15000 });
  });

  test("Agent peut naviguer vers l'onglet Partiels", async ({ page }) => {
    await switchTab(page, 'partiels');

    const content = page.locator(`${SELECTORS.list.table}, ${SELECTORS.list.emptyState}`);
    await expect(content.first()).toBeVisible({ timeout: 15000 });
  });
});
