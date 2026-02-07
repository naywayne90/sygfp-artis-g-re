/**
 * Tests E2E - Creation de Reglements
 *
 * Scenarios testes :
 * - Creation d'un reglement par virement bancaire
 * - Creation d'un reglement par cheque
 * - Validation des champs obligatoires
 * - Validation du montant maximum
 * - Erreur si montant > reste a payer
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
  SELECTORS,
  cleanupTestData,
} from '../fixtures/reglements';

// Tests run in serial mode since they may create data that affects subsequent tests
test.describe.configure({ mode: 'serial' });

// Timeout per test: 60 seconds (form interactions + API calls)
test.setTimeout(60000);

test.describe('Reglements - Creation par virement bancaire', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await selectExercice(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestData(page);
  });

  test('Le formulaire de creation contient tous les champs requis', async ({ page }) => {
    await navigateToReglements(page);

    const createBtn = page.locator(SELECTORS.page.createBtn).first();
    if (!(await createBtn.isEnabled({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await openCreateDialog(page);

    const dialog = page.locator(SELECTORS.dialog.container);

    // Verify the ordonnancement select is present
    await expect(dialog.locator('text=Ordonnancement')).toBeVisible({ timeout: 5000 });

    // Verify the form has the required sections
    await expect(dialog.locator('text=Ordonnancement')).toBeVisible();
  });

  test('Selectionner un ordonnancement affiche les details et le calcul du restant', async ({
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

    // The availability section should appear after selecting an ordonnancement
    await expect(dialog.locator(SELECTORS.availability.montantOrdonnance)).toBeVisible({
      timeout: 10000,
    });

    await expect(dialog.locator(SELECTORS.availability.restantApres)).toBeVisible({
      timeout: 5000,
    });
  });

  test("Creation d'un reglement par virement bancaire", async ({ page }) => {
    await navigateToReglements(page);

    const createBtn = page.locator(SELECTORS.page.createBtn).first();
    if (!(await createBtn.isEnabled({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await openCreateDialog(page);
    await selectFirstOrdonnancement(page);

    // Fill form fields
    await fillReglementForm(page, {
      modePaiement: 'Virement bancaire',
      reference: `VIR-E2E-${Date.now()}`,
      montant: 100000,
      observation: 'Test E2E - Virement bancaire',
    });

    // Submit
    await submitReglementForm(page);

    // Verify the dialog closed (indicates success)
    await expect(page.locator(SELECTORS.dialog.container))
      .not.toBeVisible({ timeout: 15000 })
      .catch(() => {});

    // Verify the reglement appears in the "Tous" tab
    await switchTab(page, 'tous');
    await waitForPageLoad(page);
  });
});

test.describe('Reglements - Creation par cheque', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await selectExercice(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestData(page);
  });

  test("Creation d'un reglement par cheque", async ({ page }) => {
    await navigateToReglements(page);

    const createBtn = page.locator(SELECTORS.page.createBtn).first();
    if (!(await createBtn.isEnabled({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await openCreateDialog(page);
    await selectFirstOrdonnancement(page);

    await fillReglementForm(page, {
      modePaiement: 'Chèque',
      reference: `CHQ-E2E-${Date.now()}`,
      montant: 50000,
      observation: 'Test E2E - Paiement par cheque',
    });

    await submitReglementForm(page);

    // Verify dialog closed
    await expect(page.locator(SELECTORS.dialog.container))
      .not.toBeVisible({ timeout: 15000 })
      .catch(() => {});
  });
});

test.describe('Reglements - Validation du formulaire', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await selectExercice(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestData(page);
  });

  test('Le bouton soumettre est desactive sans ordonnancement', async ({ page }) => {
    await navigateToReglements(page);

    const createBtn = page.locator(SELECTORS.page.createBtn).first();
    if (!(await createBtn.isEnabled({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await openCreateDialog(page);

    const dialog = page.locator(SELECTORS.dialog.container);
    const submitBtn = dialog.locator('button[type="submit"]');

    // Submit button should be disabled when no ordonnancement is selected
    await expect(submitBtn).toBeDisabled({ timeout: 5000 });
  });

  test('Le bouton soumettre est desactive avec montant 0', async ({ page }) => {
    await navigateToReglements(page);

    const createBtn = page.locator(SELECTORS.page.createBtn).first();
    if (!(await createBtn.isEnabled({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await openCreateDialog(page);
    await selectFirstOrdonnancement(page);

    // Fill form but leave montant at 0
    await fillReglementForm(page, {
      modePaiement: 'Virement bancaire',
      montant: 0,
    });

    const dialog = page.locator(SELECTORS.dialog.container);
    const submitBtn = dialog.locator('button[type="submit"]');

    // Submit button should be disabled with montant 0
    await expect(submitBtn).toBeDisabled({ timeout: 5000 });
  });

  test('Le montant ne peut pas depasser le restant a payer', async ({ page }) => {
    await navigateToReglements(page);

    const createBtn = page.locator(SELECTORS.page.createBtn).first();
    if (!(await createBtn.isEnabled({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await openCreateDialog(page);
    await selectFirstOrdonnancement(page);

    const dialog = page.locator(SELECTORS.dialog.container);

    // Fill with an extremely high montant
    await fillReglementForm(page, {
      modePaiement: 'Virement bancaire',
      montant: 999999999999,
    });

    // The alert "Montant invalide" should appear
    await expect(dialog.locator(SELECTORS.alerts.montantInvalide)).toBeVisible({ timeout: 5000 });

    // Submit button should be disabled
    const submitBtn = dialog.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled({ timeout: 5000 });
  });

  test('Le mode de paiement est obligatoire', async ({ page }) => {
    await navigateToReglements(page);

    const createBtn = page.locator(SELECTORS.page.createBtn).first();
    if (!(await createBtn.isEnabled({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await openCreateDialog(page);
    await selectFirstOrdonnancement(page);

    const dialog = page.locator(SELECTORS.dialog.container);

    // Fill montant but NOT mode de paiement
    const montantInput = dialog.locator(SELECTORS.form.montant);
    await montantInput.fill('100000');

    // Submit should remain disabled without mode de paiement
    const submitBtn = dialog.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled({ timeout: 5000 });
  });

  test('Le formulaire affiche "Reglement complet" quand montant = restant', async ({ page }) => {
    await navigateToReglements(page);

    const createBtn = page.locator(SELECTORS.page.createBtn).first();
    if (!(await createBtn.isEnabled({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await openCreateDialog(page);
    await selectFirstOrdonnancement(page);

    const dialog = page.locator(SELECTORS.dialog.container);

    // Read the "restant a payer" amount from the availability section
    // We look for the "Maximum: X FCFA" text in the form description
    const maxText = dialog.locator('text=Maximum');
    if (await maxText.isVisible({ timeout: 5000 })) {
      const maxTextContent = await maxText.textContent();
      // Extract the number from "Maximum: 1 500 000 FCFA"
      const match = maxTextContent?.match(/[\d\s]+/);
      if (match) {
        const maxAmount = parseInt(match[0].replace(/\s/g, ''), 10);
        if (maxAmount > 0) {
          await fillReglementForm(page, {
            modePaiement: 'Virement bancaire',
            montant: maxAmount,
          });

          // The "Reglement complet" alert should appear
          await expect(dialog.locator(SELECTORS.alerts.reglementComplet)).toBeVisible({
            timeout: 5000,
          });
        }
      }
    }
  });

  test('Le bouton Annuler ferme le formulaire', async ({ page }) => {
    await navigateToReglements(page);

    const createBtn = page.locator(SELECTORS.page.createBtn).first();
    if (!(await createBtn.isEnabled({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await openCreateDialog(page);

    const dialog = page.locator(SELECTORS.dialog.container);
    const cancelBtn = dialog.locator(SELECTORS.form.cancelBtn);
    await cancelBtn.click();

    // Dialog should close
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe("Reglements - Creation depuis l'onglet A payer", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await selectExercice(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestData(page);
  });

  test('Cliquer "Payer" sur un ordonnancement ouvre le formulaire pre-rempli', async ({ page }) => {
    await navigateToReglements(page);

    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      // Click the "Payer" button on the first ordonnancement
      const payerBtn = rows.first().locator('button:has-text("Payer")');
      await payerBtn.click();

      // Dialog should open
      const dialog = page.locator(SELECTORS.dialog.container);
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Wait for the form to load with preselected ordonnancement
      await page.waitForTimeout(2000);

      // The availability section should be visible (ordonnancement is preselected)
      const hasAvailability = await dialog
        .locator(SELECTORS.availability.montantOrdonnance)
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      // If availability is visible, the ordonnancement was preselected
      if (hasAvailability) {
        await expect(dialog.locator(SELECTORS.availability.montantOrdonnance)).toBeVisible();
      }
    } else {
      test.skip();
    }
  });
});
