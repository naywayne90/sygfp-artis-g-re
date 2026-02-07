/**
 * Tests E2E - Filtres avances des Reglements
 *
 * Scenarios testes :
 * - Ouverture/fermeture du panneau de filtres
 * - Filtre par periode (date debut / date fin)
 * - Filtre par montant (min / max)
 * - Filtre par statut (Solde, Partiel, Rejete)
 * - Filtre par mode de paiement
 * - Filtre par beneficiaire
 * - Combinaison de plusieurs filtres
 * - Reinitialisation des filtres
 * - Badge compteur de filtres actifs
 */

import { test, expect } from '@playwright/test';
import { loginAs, selectExercice } from '../fixtures/auth';
import { navigateToReglements, switchTab, SELECTORS } from '../fixtures/reglements';

test.setTimeout(60000);

// Selecteurs specifiques aux filtres avances
const FILTER_SELECTORS = {
  toggleBtn: 'button:has-text("Filtres")',
  resetBtn: 'button:has-text("Reinitialiser")',
  panel: '.border-t', // le panneau de filtres s'affiche sous un border-t
  // Champs de filtre
  dateDebut: 'button:has-text("Depuis...")',
  dateFin: 'button:has-text("Jusqu\'a...")',
  montantMin: 'input[placeholder="0"]',
  montantMax: 'input[placeholder="Illimite"]',
  statutSelect: 'text=Tous les statuts',
  modePaiementSelect: 'text=Tous les modes',
  beneficiaireSelect: 'text=Tous les beneficiaires',
  // Labels
  labels: {
    dateDebut: 'text=Date debut',
    dateFin: 'text=Date fin',
    montantMin: 'text=Montant min',
    montantMax: 'text=Montant max',
    statut: 'text=Statut',
    modePaiement: 'text=Mode de paiement',
    beneficiaire: 'text=Beneficiaire',
  },
  // Badge compteur
  filterBadge: 'button:has-text("Filtres") span',
};

test.describe('Reglements - Filtres avances : Panneau', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'agent.dsi@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);
  });

  test('Le bouton "Filtres" est visible a cote de la recherche', async ({ page }) => {
    await expect(page.locator(FILTER_SELECTORS.toggleBtn)).toBeVisible({ timeout: 10000 });
  });

  test('Cliquer sur "Filtres" ouvre le panneau de filtres avances', async ({ page }) => {
    await page.locator(FILTER_SELECTORS.toggleBtn).click();

    // Les labels des filtres doivent apparaitre
    await expect(page.locator(FILTER_SELECTORS.labels.dateDebut)).toBeVisible({ timeout: 5000 });
    await expect(page.locator(FILTER_SELECTORS.labels.dateFin)).toBeVisible();
    await expect(page.locator(FILTER_SELECTORS.labels.montantMin)).toBeVisible();
    await expect(page.locator(FILTER_SELECTORS.labels.montantMax)).toBeVisible();
    await expect(page.locator(FILTER_SELECTORS.labels.statut)).toBeVisible();
    await expect(page.locator(FILTER_SELECTORS.labels.modePaiement)).toBeVisible();
    await expect(page.locator(FILTER_SELECTORS.labels.beneficiaire)).toBeVisible();
  });

  test('Cliquer a nouveau sur "Filtres" ferme le panneau', async ({ page }) => {
    // Ouvrir
    await page.locator(FILTER_SELECTORS.toggleBtn).click();
    await expect(page.locator(FILTER_SELECTORS.labels.dateDebut)).toBeVisible({ timeout: 5000 });

    // Fermer
    await page.locator(FILTER_SELECTORS.toggleBtn).click();
    await expect(page.locator(FILTER_SELECTORS.labels.dateDebut)).toBeHidden({ timeout: 5000 });
  });

  test('Le panneau contient 7 criteres de filtrage', async ({ page }) => {
    await page.locator(FILTER_SELECTORS.toggleBtn).click();

    // Compter les labels visibles
    const labels = [
      FILTER_SELECTORS.labels.dateDebut,
      FILTER_SELECTORS.labels.dateFin,
      FILTER_SELECTORS.labels.montantMin,
      FILTER_SELECTORS.labels.montantMax,
      FILTER_SELECTORS.labels.statut,
      FILTER_SELECTORS.labels.modePaiement,
      FILTER_SELECTORS.labels.beneficiaire,
    ];

    for (const label of labels) {
      await expect(page.locator(label).first()).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Reglements - Filtres avances : Periode', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'agent.dsi@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);
    await page.locator(FILTER_SELECTORS.toggleBtn).click();
    await expect(page.locator(FILTER_SELECTORS.labels.dateDebut)).toBeVisible({ timeout: 5000 });
  });

  test('Le bouton "Depuis..." ouvre un calendrier', async ({ page }) => {
    const dateDebutBtn = page.locator('button:has-text("Depuis...")');
    if (await dateDebutBtn.isVisible({ timeout: 3000 })) {
      await dateDebutBtn.click();

      // Le calendrier doit apparaitre
      await expect(page.locator('[role="grid"]')).toBeVisible({ timeout: 5000 });

      // Fermer
      await page.keyboard.press('Escape');
    }
  });

  test('Le bouton "Jusqu\'a..." ouvre un calendrier', async ({ page }) => {
    const dateFinBtn = page.locator('button:has-text("Jusqu\'a...")');
    if (await dateFinBtn.isVisible({ timeout: 3000 })) {
      await dateFinBtn.click();

      // Le calendrier doit apparaitre
      await expect(page.locator('[role="grid"]')).toBeVisible({ timeout: 5000 });

      // Fermer
      await page.keyboard.press('Escape');
    }
  });

  test('Selectionner une date debut met a jour le bouton et active le badge', async ({ page }) => {
    const dateDebutBtn = page.locator('button:has-text("Depuis...")');
    if (!(await dateDebutBtn.isVisible({ timeout: 3000 }))) {
      test.skip();
      return;
    }

    await dateDebutBtn.click();
    await expect(page.locator('[role="grid"]')).toBeVisible({ timeout: 5000 });

    // Cliquer sur le jour 1 du mois courant
    const dayBtn = page.locator('[role="grid"] button:has-text("1")').first();
    if (await dayBtn.isVisible()) {
      await dayBtn.click();
      await page.waitForTimeout(500);

      // Le bouton ne devrait plus afficher "Depuis..."
      await expect(page.locator('button:has-text("Depuis...")')).toBeHidden({ timeout: 3000 });

      // Le badge du compteur de filtres devrait apparaitre
      const filterBtn = page.locator(FILTER_SELECTORS.toggleBtn);
      const badgeText = await filterBtn.textContent();
      expect(badgeText).toContain('1');
    }
  });
});

test.describe('Reglements - Filtres avances : Montants', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'agent.dsi@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);
    await page.locator(FILTER_SELECTORS.toggleBtn).click();
    await expect(page.locator(FILTER_SELECTORS.labels.montantMin)).toBeVisible({ timeout: 5000 });
  });

  test('Le champ montant min accepte une valeur numerique', async ({ page }) => {
    const montantMinInput = page.locator('input[placeholder="0"]').first();
    await montantMinInput.fill('100000');
    await expect(montantMinInput).toHaveValue('100000');
  });

  test('Le champ montant max accepte une valeur numerique', async ({ page }) => {
    const montantMaxInput = page.locator('input[placeholder="Illimite"]');
    await montantMaxInput.fill('5000000');
    await expect(montantMaxInput).toHaveValue('5000000');
  });

  test('Saisir un montant min active le badge compteur', async ({ page }) => {
    const montantMinInput = page.locator('input[placeholder="0"]').first();
    await montantMinInput.fill('100000');

    // Le badge devrait afficher 1 filtre actif
    const filterBtn = page.locator(FILTER_SELECTORS.toggleBtn);
    await page.waitForTimeout(300);
    const text = await filterBtn.textContent();
    expect(text).toContain('1');
  });
});

test.describe('Reglements - Filtres avances : Selects', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'agent.dsi@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);
    await page.locator(FILTER_SELECTORS.toggleBtn).click();
    await expect(page.locator(FILTER_SELECTORS.labels.statut)).toBeVisible({ timeout: 5000 });
  });

  test('Le filtre statut propose Solde, Partiel, Rejete', async ({ page }) => {
    // Ouvrir le select Statut
    const statutTrigger = page.locator('button').filter({ hasText: 'Tous les statuts' }).first();
    await statutTrigger.click();

    // Verifier les options
    await expect(page.locator('[role="option"]:has-text("Tous les statuts")')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('[role="option"]:has-text("Solde")')).toBeVisible();
    await expect(page.locator('[role="option"]:has-text("Partiel")')).toBeVisible();
    await expect(page.locator('[role="option"]:has-text("Rejete")')).toBeVisible();

    // Fermer
    await page.keyboard.press('Escape');
  });

  test('Selectionner un statut active le filtre', async ({ page }) => {
    const statutTrigger = page.locator('button').filter({ hasText: 'Tous les statuts' }).first();
    await statutTrigger.click();

    await page.locator('[role="option"]:has-text("Solde")').click();
    await page.waitForTimeout(500);

    // Le badge devrait afficher 1 filtre actif
    const filterBtn = page.locator(FILTER_SELECTORS.toggleBtn);
    const text = await filterBtn.textContent();
    expect(text).toContain('1');
  });

  test('Le filtre mode de paiement propose les modes disponibles', async ({ page }) => {
    const modeTrigger = page.locator('button').filter({ hasText: 'Tous les modes' }).first();
    await modeTrigger.click();

    // Verifier la presence des options
    await expect(page.locator('[role="option"]:has-text("Tous les modes")')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('[role="option"]:has-text("Virement bancaire")')).toBeVisible();
    await expect(page.locator('[role="option"]:has-text("Chèque")')).toBeVisible();
    await expect(page.locator('[role="option"]:has-text("Espèces")')).toBeVisible();
    await expect(page.locator('[role="option"]:has-text("Mobile Money")')).toBeVisible();

    await page.keyboard.press('Escape');
  });

  test('Le filtre beneficiaire propose les beneficiaires existants', async ({ page }) => {
    const benefTrigger = page
      .locator('button')
      .filter({ hasText: 'Tous les beneficiaires' })
      .first();
    await benefTrigger.click();

    // Verifier qu'il y a au moins l'option "Tous"
    await expect(page.locator('[role="option"]:has-text("Tous les beneficiaires")')).toBeVisible({
      timeout: 5000,
    });

    // Il peut y avoir d'autres options si des reglements existent
    const options = page.locator('[role="option"]');
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThanOrEqual(1);

    await page.keyboard.press('Escape');
  });
});

test.describe('Reglements - Filtres avances : Reinitialisation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'agent.dsi@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);
    await page.locator(FILTER_SELECTORS.toggleBtn).click();
    await expect(page.locator(FILTER_SELECTORS.labels.statut)).toBeVisible({ timeout: 5000 });
  });

  test('Le bouton "Reinitialiser" n\'apparait que quand des filtres sont actifs', async ({
    page,
  }) => {
    // Sans filtre actif, le bouton ne doit pas etre visible
    await expect(page.locator(FILTER_SELECTORS.resetBtn)).toBeHidden({ timeout: 3000 });

    // Activer un filtre
    const montantMinInput = page.locator('input[placeholder="0"]').first();
    await montantMinInput.fill('100000');
    await page.waitForTimeout(300);

    // Le bouton Reinitialiser doit apparaitre
    await expect(page.locator(FILTER_SELECTORS.resetBtn)).toBeVisible({ timeout: 5000 });
  });

  test('Reinitialiser supprime tous les filtres actifs', async ({ page }) => {
    // Activer plusieurs filtres
    const montantMinInput = page.locator('input[placeholder="0"]').first();
    await montantMinInput.fill('100000');

    const montantMaxInput = page.locator('input[placeholder="Illimite"]');
    await montantMaxInput.fill('5000000');

    // Selectionner un statut
    const statutTrigger = page.locator('button').filter({ hasText: 'Tous les statuts' }).first();
    await statutTrigger.click();
    await page.locator('[role="option"]:has-text("Solde")').click();

    await page.waitForTimeout(500);

    // Le badge devrait afficher 3 filtres actifs
    const filterBtn = page.locator(FILTER_SELECTORS.toggleBtn);
    const textBefore = await filterBtn.textContent();
    expect(textBefore).toContain('3');

    // Cliquer sur Reinitialiser
    await page.locator(FILTER_SELECTORS.resetBtn).click();
    await page.waitForTimeout(500);

    // Les champs doivent etre reinitialises
    await expect(montantMinInput).toHaveValue('');
    await expect(montantMaxInput).toHaveValue('');

    // Le bouton Reinitialiser doit disparaitre
    await expect(page.locator(FILTER_SELECTORS.resetBtn)).toBeHidden({ timeout: 3000 });
  });
});

test.describe('Reglements - Filtres avances : Combinaison et resultats', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'agent.dsi@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);
  });

  test("Les filtres affectent le compteur de resultats dans l'en-tete du tableau", async ({
    page,
  }) => {
    // Passer sur l'onglet Tous pour voir les reglements
    await switchTab(page, 'tous');

    // Recuperer le compteur initial
    const countText = page.locator('text=règlement(s) trouvé(s)');
    await expect(countText).toBeVisible({ timeout: 10000 });
    // Ouvrir les filtres et appliquer un filtre restrictif
    await page.locator(FILTER_SELECTORS.toggleBtn).click();
    await expect(page.locator(FILTER_SELECTORS.labels.montantMin)).toBeVisible({ timeout: 5000 });

    // Mettre un montant min tres eleve pour reduire les resultats
    const montantMinInput = page.locator('input[placeholder="0"]').first();
    await montantMinInput.fill('99999999999');
    await page.waitForTimeout(1000);

    // Le compteur devrait avoir change (probablement 0)
    const filteredText = await countText.textContent();
    // Avec un montant tres eleve, il ne devrait pas y avoir de resultats
    expect(filteredText).toContain('0');
  });

  test('La recherche textuelle fonctionne en combinaison avec les filtres avances', async ({
    page,
  }) => {
    await switchTab(page, 'tous');

    // Ouvrir les filtres
    await page.locator(FILTER_SELECTORS.toggleBtn).click();
    await expect(page.locator(FILTER_SELECTORS.labels.statut)).toBeVisible({ timeout: 5000 });

    // Saisir une recherche textuelle
    const searchInput = page.locator(SELECTORS.page.searchInput);
    await searchInput.fill('terme-inexistant-xyz');
    await page.waitForTimeout(500);

    // Le compteur devrait etre a 0
    await expect(page.locator('text=0 règlement(s) trouvé(s)')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Reglements - Filtres avances : Badge compteur', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'agent.dsi@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);
  });

  test("Le badge compteur n'apparait pas quand aucun filtre n'est actif", async ({ page }) => {
    // Sans filtre, le bouton ne doit pas avoir de badge numerique
    const filterBtn = page.locator(FILTER_SELECTORS.toggleBtn);
    const text = await filterBtn.textContent();
    // Le texte devrait juste etre "Filtres" sans nombre
    expect(text?.trim()).toBe('Filtres');
  });

  test('Le badge compteur affiche le nombre correct de filtres actifs', async ({ page }) => {
    // Ouvrir les filtres
    await page.locator(FILTER_SELECTORS.toggleBtn).click();
    await expect(page.locator(FILTER_SELECTORS.labels.statut)).toBeVisible({ timeout: 5000 });

    // Activer 2 filtres: montant min + statut
    const montantMinInput = page.locator('input[placeholder="0"]').first();
    await montantMinInput.fill('10000');

    const statutTrigger = page.locator('button').filter({ hasText: 'Tous les statuts' }).first();
    await statutTrigger.click();
    await page.locator('[role="option"]:has-text("Partiel")').click();

    await page.waitForTimeout(500);

    // Le badge devrait afficher "2"
    const filterBtn = page.locator(FILTER_SELECTORS.toggleBtn);
    const text = await filterBtn.textContent();
    expect(text).toContain('2');
  });
});
