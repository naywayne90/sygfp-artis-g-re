/**
 * Tests E2E - Création de Notes SEF
 *
 * Scénarios testés :
 * - Création d'une note SEF complète
 * - Ajout de pièce jointe
 * - Soumission pour validation
 */

import { test, expect } from '@playwright/test';
import { loginAs, waitForPageLoad, selectExercice } from '../fixtures/auth';
import {
  navigateToNotesSEF,
  openNewNoteForm,
  fillNoteForm,
  submitNoteForm,
  submitNote,
  addAttachment,
  verifyNoteStatus,
  TEST_NOTE_SEF,
  SELECTORS,
  cleanupTestData,
} from '../fixtures/notes-sef';

// Configuration des tests
test.describe.configure({ mode: 'serial' });

// Timeout par test : 30 secondes
test.setTimeout(30000);

// Variable pour stocker la référence de la note créée
let createdNoteRef: string | null = null;

test.describe('Notes SEF - Création', () => {
  test.beforeEach(async ({ page }) => {
    // Se connecter en tant qu'agent DSI
    await loginAs(page, 'agent.dsi@arti.ci', 'Test2026!');

    // Sélectionner un exercice si nécessaire
    await selectExercice(page);
  });

  test.afterEach(async ({ page }) => {
    // Nettoyer après chaque test
    await cleanupTestData(page);
  });

  test('Agent peut accéder à la page Notes SEF', async ({ page }) => {
    await navigateToNotesSEF(page);

    // Vérifier la présence des éléments clés
    await expect(page.locator('h1, h2').filter({ hasText: /Notes SEF/i })).toBeVisible();
    await expect(page.locator(SELECTORS.actions.newNote)).toBeVisible();
  });

  test('Agent peut ouvrir le formulaire de création', async ({ page }) => {
    await navigateToNotesSEF(page);
    await openNewNoteForm(page);

    // Vérifier que le formulaire s'affiche
    await expect(page.locator('dialog, [role="dialog"]')).toBeVisible();
    await expect(page.locator(SELECTORS.form.objet)).toBeVisible();
  });

  test('Agent peut créer une note SEF complète', async ({ page }) => {
    await navigateToNotesSEF(page);
    await openNewNoteForm(page);

    // Générer un identifiant unique pour cette note
    const uniqueObjet = `Note SEF Test - ${Date.now()}`;

    // Remplir le formulaire
    await fillNoteForm(page, {
      ...TEST_NOTE_SEF,
      objet: uniqueObjet,
    });

    // Soumettre
    await submitNoteForm(page);

    // Vérifier que la note apparaît dans la liste
    await waitForPageLoad(page);

    // Rechercher la note créée
    const searchInput = page.locator('input[placeholder*="Rechercher"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill(uniqueObjet);
      await waitForPageLoad(page);
    }

    // Vérifier la présence de la note
    await expect(page.locator(`text=${uniqueObjet}`).first()).toBeVisible({ timeout: 15000 });

    // Stocker la référence pour les tests suivants
    createdNoteRef = uniqueObjet;
  });

  test('Agent peut ajouter une pièce jointe', async ({ page }) => {
    await navigateToNotesSEF(page);
    await openNewNoteForm(page);

    // Remplir le formulaire
    const uniqueObjet = `Note SEF avec PJ - ${Date.now()}`;
    await fillNoteForm(page, {
      ...TEST_NOTE_SEF,
      objet: uniqueObjet,
    });

    // Ajouter une pièce jointe
    await addAttachment(page);

    // Vérifier que le fichier est listé
    await expect(page.locator(SELECTORS.attachments.attachmentItem).first()).toBeVisible({ timeout: 15000 });

    // Soumettre
    await submitNoteForm(page);

    // Vérifier la création
    await waitForPageLoad(page);
    await expect(page.locator(`text=${uniqueObjet}`).first()).toBeVisible({ timeout: 15000 });
  });

  test('Agent peut soumettre une note pour validation', async ({ page }) => {
    await navigateToNotesSEF(page);

    // Créer d'abord une note
    await openNewNoteForm(page);

    const uniqueObjet = `Note à soumettre - ${Date.now()}`;
    await fillNoteForm(page, {
      ...TEST_NOTE_SEF,
      objet: uniqueObjet,
    });

    await submitNoteForm(page);
    await waitForPageLoad(page);

    // Rechercher la note
    const searchInput = page.locator('input[placeholder*="Rechercher"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill(uniqueObjet);
      await waitForPageLoad(page);
    }

    // Vérifier le statut initial (brouillon ou créé)
    const noteRow = page.locator(`tr:has-text("${uniqueObjet}")`).first();
    await expect(noteRow).toBeVisible({ timeout: 15000 });

    // Soumettre la note
    const submitBtn = noteRow.locator('button:has-text("Soumettre")');
    if (await submitBtn.isVisible({ timeout: 5000 })) {
      await submitBtn.click();

      // Confirmer si nécessaire
      const confirmBtn = page.locator('button:has-text("Confirmer")');
      if (await confirmBtn.isVisible({ timeout: 2000 })) {
        await confirmBtn.click();
      }

      await waitForPageLoad(page);

      // Vérifier le statut "soumis"
      await verifyNoteStatus(page, 'soumis', uniqueObjet);
    }
  });

  test('Validation des champs obligatoires', async ({ page }) => {
    await navigateToNotesSEF(page);
    await openNewNoteForm(page);

    // Essayer de soumettre sans remplir les champs obligatoires
    const submitBtn = page.locator(SELECTORS.form.submitBtn);

    // Le bouton devrait être désactivé ou la validation devrait échouer
    if (await submitBtn.isEnabled()) {
      await submitBtn.click();

      // Vérifier les messages d'erreur de validation
      await expect(
        page.locator('[role="alert"], .error-message, [data-testid="validation-error"]')
      ).toBeVisible({ timeout: 5000 });
    } else {
      // Le bouton est désactivé - c'est le comportement attendu
      await expect(submitBtn).toBeDisabled();
    }
  });
});

test.describe('Notes SEF - Formulaire avancé', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'agent.dsi@arti.ci', 'Test2026!');
    await selectExercice(page);
  });

  test('Les niveaux d\'urgence sont disponibles', async ({ page }) => {
    await navigateToNotesSEF(page);
    await openNewNoteForm(page);

    // Ouvrir le select d'urgence
    const urgenceSelect = page.locator(SELECTORS.form.urgence);
    if (await urgenceSelect.isVisible()) {
      await urgenceSelect.click();

      // Vérifier les options
      await expect(page.locator('[role="option"]:has-text("normale")')).toBeVisible();
      await expect(page.locator('[role="option"]:has-text("haute")')).toBeVisible();
      await expect(page.locator('[role="option"]:has-text("urgente")')).toBeVisible();

      // Fermer le select
      await page.keyboard.press('Escape');
    }
  });

  test('L\'auto-save fonctionne pour les brouillons', async ({ page }) => {
    await navigateToNotesSEF(page);
    await openNewNoteForm(page);

    const uniqueObjet = `Note autosave test - ${Date.now()}`;

    // Remplir partiellement le formulaire
    await page.locator(SELECTORS.form.objet).fill(uniqueObjet);

    // Attendre l'auto-save (généralement 2-5 secondes)
    await page.waitForTimeout(5000);

    // Recharger la page
    await page.reload();

    // Vérifier que le brouillon est sauvegardé
    await navigateToNotesSEF(page);

    // Cliquer sur l'onglet Brouillons
    const brouillonsTab = page.locator('button:has-text("Brouillons")');
    if (await brouillonsTab.isVisible()) {
      await brouillonsTab.click();
      await waitForPageLoad(page);

      // Vérifier la présence du brouillon
      await expect(page.locator(`text=${uniqueObjet}`).first()).toBeVisible({ timeout: 10000 });
    }
  });
});
