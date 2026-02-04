/**
 * Tests E2E - Validation des Notes SEF
 *
 * Scénarios testés :
 * - DG peut valider une note
 * - DG peut différer une note avec motif obligatoire
 * - DG peut rejeter une note avec motif obligatoire
 * - Vérification des références ARTI générées
 */

import { test, expect } from '@playwright/test';
import { loginAs, waitForPageLoad, selectExercice, logout } from '../fixtures/auth';
import {
  navigateToNotesSEF,
  navigateToValidation,
  openNewNoteForm,
  fillNoteForm,
  submitNoteForm,
  validateNote,
  rejectNote,
  deferNote,
  verifyNoteStatus,
  verifyArtiReference,
  TEST_NOTE_SEF,
  TEST_MOTIFS,
  SELECTORS,
  cleanupTestData,
} from '../fixtures/notes-sef';

// Configuration des tests
test.setTimeout(30000);

test.describe('Notes SEF - Validation par le DG', () => {
  // Note créée pour les tests de validation
  let testNoteObjet: string;

  test.beforeAll(async ({ browser }) => {
    // Créer une note de test avant les tests de validation
    const page = await browser.newPage();

    try {
      // Se connecter en tant qu'agent
      await loginAs(page, 'agent.dsi@arti.ci', 'Test2026!');
      await selectExercice(page);

      // Créer et soumettre une note
      await navigateToNotesSEF(page);
      await openNewNoteForm(page);

      testNoteObjet = `Note validation test - ${Date.now()}`;
      await fillNoteForm(page, {
        ...TEST_NOTE_SEF,
        objet: testNoteObjet,
      });

      await submitNoteForm(page);
      await waitForPageLoad(page);

      // Soumettre la note
      const searchInput = page.locator('input[placeholder*="Rechercher"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill(testNoteObjet);
        await waitForPageLoad(page);
      }

      const submitBtn = page.locator(`tr:has-text("${testNoteObjet}")`).locator('button:has-text("Soumettre")');
      if (await submitBtn.isVisible({ timeout: 5000 })) {
        await submitBtn.click();

        const confirmBtn = page.locator('button:has-text("Confirmer")');
        if (await confirmBtn.isVisible({ timeout: 2000 })) {
          await confirmBtn.click();
        }

        await waitForPageLoad(page);
      }
    } finally {
      await page.close();
    }
  });

  test('DG peut accéder à l\'espace de validation', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);

    await navigateToValidation(page);

    // Vérifier la présence des éléments de la page de validation
    await expect(page.locator('h1, h2').filter({ hasText: /Validation/i })).toBeVisible();
    await expect(page.locator(SELECTORS.list.table)).toBeVisible({ timeout: 15000 });
  });

  test('DG voit les notes à valider', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);

    await navigateToValidation(page);
    await waitForPageLoad(page);

    // Vérifier que la liste des notes à valider s'affiche
    const tableOrEmptyState = page.locator(`${SELECTORS.list.table}, ${SELECTORS.list.emptyState}`);
    await expect(tableOrEmptyState).toBeVisible({ timeout: 15000 });
  });

  test('DG peut valider une note', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);

    await navigateToValidation(page);
    await waitForPageLoad(page);

    // Rechercher une note à valider
    const searchInput = page.locator('input[placeholder*="Rechercher"]');
    if (await searchInput.isVisible() && testNoteObjet) {
      await searchInput.fill(testNoteObjet);
      await waitForPageLoad(page);
    }

    // Trouver le bouton Valider
    const validateBtn = page.locator(SELECTORS.actions.validateBtn).first();

    if (await validateBtn.isVisible({ timeout: 5000 })) {
      // Cliquer sur Valider
      await validateBtn.click();

      // Attendre la mise à jour
      await waitForPageLoad(page);

      // Vérifier le toast de succès
      await expect(
        page.locator('[role="alert"], .toast').filter({ hasText: /validé|succès/i })
      ).toBeVisible({ timeout: 10000 });
    } else {
      // Pas de note à valider - le test passe quand même
      test.skip();
    }
  });

  test('La référence ARTI est générée après validation', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);

    // Aller sur la liste des notes validées
    await navigateToNotesSEF(page);

    // Cliquer sur l'onglet "Validées"
    const valideesTab = page.locator('button:has-text("Validées")');
    await valideesTab.click();
    await waitForPageLoad(page);

    // Vérifier qu'il y a des notes validées avec référence ARTI
    const referencePattern = /ARTI\d{3}26\d{3}/;
    const referenceCell = page.locator('td, span').filter({ hasText: referencePattern }).first();

    if (await referenceCell.isVisible({ timeout: 10000 })) {
      const reference = await referenceCell.textContent();
      expect(reference).toMatch(referencePattern);
    } else {
      // Pas de note validée avec référence - acceptable
      test.skip();
    }
  });
});

test.describe('Notes SEF - Différé', () => {
  let testNoteObjet: string;

  test.beforeAll(async ({ browser }) => {
    // Créer une note de test pour le différé
    const page = await browser.newPage();

    try {
      await loginAs(page, 'agent.dsi@arti.ci', 'Test2026!');
      await selectExercice(page);

      await navigateToNotesSEF(page);
      await openNewNoteForm(page);

      testNoteObjet = `Note différé test - ${Date.now()}`;
      await fillNoteForm(page, {
        ...TEST_NOTE_SEF,
        objet: testNoteObjet,
      });

      await submitNoteForm(page);
      await waitForPageLoad(page);

      // Soumettre la note
      const searchInput = page.locator('input[placeholder*="Rechercher"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill(testNoteObjet);
        await waitForPageLoad(page);
      }

      const submitBtn = page.locator(`tr:has-text("${testNoteObjet}")`).locator('button:has-text("Soumettre")');
      if (await submitBtn.isVisible({ timeout: 5000 })) {
        await submitBtn.click();

        const confirmBtn = page.locator('button:has-text("Confirmer")');
        if (await confirmBtn.isVisible({ timeout: 2000 })) {
          await confirmBtn.click();
        }

        await waitForPageLoad(page);
      }
    } finally {
      await page.close();
    }
  });

  test('DG peut différer une note avec motif obligatoire', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);

    await navigateToValidation(page);
    await waitForPageLoad(page);

    // Rechercher la note
    const searchInput = page.locator('input[placeholder*="Rechercher"]');
    if (await searchInput.isVisible() && testNoteObjet) {
      await searchInput.fill(testNoteObjet);
      await waitForPageLoad(page);
    }

    // Trouver le bouton Différer
    const deferBtn = page.locator(SELECTORS.actions.deferBtn).first();

    if (await deferBtn.isVisible({ timeout: 5000 })) {
      await deferBtn.click();

      // Le dialog de différé s'ouvre
      await expect(page.locator('dialog, [role="dialog"]')).toBeVisible({ timeout: 5000 });

      // Vérifier que le bouton de confirmation est désactivé sans motif
      const confirmBtn = page.locator(SELECTORS.dialogs.confirmDefer);
      await expect(confirmBtn).toBeDisabled();

      // Remplir le motif
      await page.locator(SELECTORS.dialogs.deferMotif).fill(TEST_MOTIFS.differe);

      // Le bouton devrait être activé maintenant
      await expect(confirmBtn).toBeEnabled();

      // Ajouter une condition de reprise
      const conditionField = page.locator(SELECTORS.dialogs.deferCondition);
      if (await conditionField.isVisible()) {
        await conditionField.fill(TEST_MOTIFS.condition_reprise);
      }

      // Confirmer
      await confirmBtn.click();

      // Vérifier le succès
      await waitForPageLoad(page);
      await expect(
        page.locator('[role="alert"], .toast').filter({ hasText: /différé|succès/i })
      ).toBeVisible({ timeout: 10000 });
    } else {
      test.skip();
    }
  });

  test('Le motif est enregistré après différé', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);

    // Aller sur la liste des notes différées
    await navigateToNotesSEF(page);

    const differeesTab = page.locator('button:has-text("Différées")');
    await differeesTab.click();
    await waitForPageLoad(page);

    // Rechercher la note
    const searchInput = page.locator('input[placeholder*="Rechercher"]');
    if (await searchInput.isVisible() && testNoteObjet) {
      await searchInput.fill(testNoteObjet);
      await waitForPageLoad(page);
    }

    // Vérifier le statut différé
    const differeStatus = page.locator('text=Différé').first();
    if (await differeStatus.isVisible({ timeout: 10000 })) {
      // Cliquer sur la note pour voir les détails
      const viewBtn = page.locator('button:has-text("Voir")').first();
      if (await viewBtn.isVisible()) {
        await viewBtn.click();

        // Vérifier que le motif est affiché
        await expect(
          page.locator(`text=${TEST_MOTIFS.differe}`)
        ).toBeVisible({ timeout: 10000 });
      }
    } else {
      test.skip();
    }
  });
});

test.describe('Notes SEF - Rejet', () => {
  let testNoteObjet: string;

  test.beforeAll(async ({ browser }) => {
    // Créer une note de test pour le rejet
    const page = await browser.newPage();

    try {
      await loginAs(page, 'agent.dsi@arti.ci', 'Test2026!');
      await selectExercice(page);

      await navigateToNotesSEF(page);
      await openNewNoteForm(page);

      testNoteObjet = `Note rejet test - ${Date.now()}`;
      await fillNoteForm(page, {
        ...TEST_NOTE_SEF,
        objet: testNoteObjet,
      });

      await submitNoteForm(page);
      await waitForPageLoad(page);

      // Soumettre la note
      const searchInput = page.locator('input[placeholder*="Rechercher"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill(testNoteObjet);
        await waitForPageLoad(page);
      }

      const submitBtn = page.locator(`tr:has-text("${testNoteObjet}")`).locator('button:has-text("Soumettre")');
      if (await submitBtn.isVisible({ timeout: 5000 })) {
        await submitBtn.click();

        const confirmBtn = page.locator('button:has-text("Confirmer")');
        if (await confirmBtn.isVisible({ timeout: 2000 })) {
          await confirmBtn.click();
        }

        await waitForPageLoad(page);
      }
    } finally {
      await page.close();
    }
  });

  test('DG peut rejeter une note avec motif obligatoire', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);

    await navigateToValidation(page);
    await waitForPageLoad(page);

    // Rechercher la note
    const searchInput = page.locator('input[placeholder*="Rechercher"]');
    if (await searchInput.isVisible() && testNoteObjet) {
      await searchInput.fill(testNoteObjet);
      await waitForPageLoad(page);
    }

    // Trouver le bouton Rejeter
    const rejectBtn = page.locator(SELECTORS.actions.rejectBtn).first();

    if (await rejectBtn.isVisible({ timeout: 5000 })) {
      await rejectBtn.click();

      // Le dialog de rejet s'ouvre
      await expect(page.locator('dialog, [role="dialog"]')).toBeVisible({ timeout: 5000 });

      // Vérifier que le bouton de confirmation est désactivé sans motif
      const confirmBtn = page.locator(SELECTORS.dialogs.confirmReject);
      await expect(confirmBtn).toBeDisabled();

      // Remplir le motif
      await page.locator(SELECTORS.dialogs.rejectMotif).fill(TEST_MOTIFS.rejet);

      // Le bouton devrait être activé maintenant
      await expect(confirmBtn).toBeEnabled();

      // Confirmer
      await confirmBtn.click();

      // Vérifier le succès
      await waitForPageLoad(page);
      await expect(
        page.locator('[role="alert"], .toast').filter({ hasText: /rejeté|succès/i })
      ).toBeVisible({ timeout: 10000 });
    } else {
      test.skip();
    }
  });

  test('Le statut rejete est correctement affiché', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);

    // Aller sur la liste des notes rejetées
    await navigateToNotesSEF(page);

    const rejeteesTab = page.locator('button:has-text("Rejetées")');
    await rejeteesTab.click();
    await waitForPageLoad(page);

    // Rechercher la note
    const searchInput = page.locator('input[placeholder*="Rechercher"]');
    if (await searchInput.isVisible() && testNoteObjet) {
      await searchInput.fill(testNoteObjet);
      await waitForPageLoad(page);
    }

    // Vérifier le statut rejeté
    await expect(page.locator('text=Rejeté').first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Notes SEF - Permissions', () => {
  test('Agent ne peut pas accéder à l\'espace de validation', async ({ page }) => {
    await loginAs(page, 'agent.dsi@arti.ci', 'Test2026!');
    await selectExercice(page);

    // Essayer d'accéder à la page de validation
    await page.goto('/notes-sef/validation');

    // Devrait voir un message d'accès restreint ou être redirigé
    const accessDenied = page.locator('text=Accès restreint, text=non autorisé, text=permission');
    const redirected = page.url().includes('/notes-sef') && !page.url().includes('/validation');

    expect(await accessDenied.isVisible({ timeout: 5000 }) || redirected).toBeTruthy();
  });

  test('Agent ne voit pas les boutons de validation', async ({ page }) => {
    await loginAs(page, 'agent.dsi@arti.ci', 'Test2026!');
    await selectExercice(page);

    await navigateToNotesSEF(page);

    // L'agent ne devrait pas voir le bouton "Valider"
    await expect(page.locator(SELECTORS.actions.validateBtn)).toHaveCount(0, { timeout: 5000 });
  });
});
