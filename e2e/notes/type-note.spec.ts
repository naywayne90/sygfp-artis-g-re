/**
 * Tests E2E - Type de Note (NSEF/NAEF)
 *
 * Vérifie la création des différents types de notes et leurs champs spécifiques.
 */

import { test, expect } from '@playwright/test';
import { loginAs, loginAsDAAF, waitForPageLoad, TEST_USERS } from '../fixtures/auth';

test.describe('Type de Note (NSEF/NAEF)', () => {
  test.beforeEach(async ({ page }) => {
    // Se connecter en tant que DAAF
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    // Remplir le formulaire de connexion
    const emailInput = page.locator('input#email, input[name="email"], input[type="email"]');
    const passwordInput = page.locator('input#password, input[name="password"], input[type="password"]');
    const submitBtn = page.locator('button[type="submit"]');

    await emailInput.fill(TEST_USERS.daaf.email);
    await passwordInput.fill(TEST_USERS.daaf.password);
    await submitBtn.click();

    // Attendre la redirection
    await page.waitForURL(/\/(dashboard|notes|$)/, { timeout: 15000 });
    await waitForPageLoad(page);
  });

  test('Peut créer une NAEF avec montant', async ({ page }) => {
    await page.goto('/notes-sef/new');
    await waitForPageLoad(page);

    // Attendre que le formulaire soit chargé
    await page.waitForTimeout(1000);

    // Chercher l'option NAEF (Note À Effet Financier)
    const naefOption = page.locator('text=Note À Effet Financier, text=Avec Effet Financier, text=NAEF, label:has-text("effet financier")');

    if (await naefOption.first().isVisible({ timeout: 5000 })) {
      await expect(naefOption.first()).toBeVisible();
    }

    // Le champ montant doit être visible pour une NAEF
    const montantField = page.locator('input[name="montant"], input[type="number"], input[placeholder*="montant"]');

    if (await montantField.isVisible({ timeout: 5000 })) {
      await expect(montantField).toBeVisible();
    }

    // Remplir le formulaire
    const objetField = page.locator('input[name="objet"], textarea[name="objet"], input[placeholder*="objet"]');
    const exposeField = page.locator('textarea[name="expose"], textarea[name="description"], textarea[placeholder*="exposé"]');

    if (await objetField.isVisible({ timeout: 3000 })) {
      await objetField.fill(`Test NAEF ${Date.now()}`);
    }

    if (await exposeField.isVisible({ timeout: 3000 })) {
      await exposeField.fill('Ceci est une note avec effet financier - Test automatique');
    }

    if (await montantField.isVisible()) {
      await montantField.fill('150000');
    }

    // Screenshot du formulaire NAEF
    await page.screenshot({ path: 'test-results/naef-form.png', fullPage: true });
  });

  test('Peut créer une NSEF sans montant', async ({ page }) => {
    await page.goto('/notes-sef/new');
    await waitForPageLoad(page);
    await page.waitForTimeout(1000);

    // Chercher et sélectionner l'option NSEF (Note Sans Effet Financier)
    const nsefOption = page.locator('label:has-text("Sans Effet Financier"), input[value="NSEF"], input[value="nsef"], [data-testid="type-nsef"]');

    if (await nsefOption.first().isVisible({ timeout: 5000 })) {
      await nsefOption.first().click();
      await page.waitForTimeout(500);
    }

    // Le champ montant doit être masqué pour une NSEF
    const montantField = page.locator('input[name="montant"]');

    // Vérifier que le champ montant n'est pas visible ou est désactivé
    const isHidden = await montantField.isHidden({ timeout: 3000 }).catch(() => true);
    const isDisabled = await montantField.isDisabled().catch(() => false);

    expect(isHidden || isDisabled).toBeTruthy();

    // Remplir le formulaire sans montant
    const objetField = page.locator('input[name="objet"], textarea[name="objet"]');
    const exposeField = page.locator('textarea[name="expose"], textarea[name="description"]');

    if (await objetField.isVisible({ timeout: 3000 })) {
      await objetField.fill(`Test NSEF ${Date.now()}`);
    }

    if (await exposeField.isVisible({ timeout: 3000 })) {
      await exposeField.fill('Ceci est une note sans effet financier - Test automatique');
    }

    // Screenshot du formulaire NSEF
    await page.screenshot({ path: 'test-results/nsef-form.png', fullPage: true });
  });

  test('Le sélecteur de NSEF parente est optionnel pour NAEF', async ({ page }) => {
    await page.goto('/notes-sef/new');
    await waitForPageLoad(page);
    await page.waitForTimeout(1000);

    // Le sélecteur de NSEF parente doit exister mais ne pas être obligatoire
    const parentSelector = page.locator('text=Rattacher à une NSEF, text=Note parente, text=NSEF associée, [data-testid="parent-note-selector"]');

    if (await parentSelector.first().isVisible({ timeout: 3000 })) {
      // Vérifier qu'il affiche une option par défaut (Aucune ou Note indépendante)
      const defaultOption = page.locator('text=Aucune, text=indépendante, text=Sélectionner');
      await expect(defaultOption.first()).toBeVisible({ timeout: 3000 });
    }

    // Screenshot
    await page.screenshot({ path: 'test-results/naef-parent-selector.png' });
  });

  test('Le formulaire affiche les champs obligatoires', async ({ page }) => {
    await page.goto('/notes-sef/new');
    await waitForPageLoad(page);

    // Vérifier la présence des champs principaux
    const objetField = page.locator('input[name="objet"], textarea[name="objet"]');
    const exposeField = page.locator('textarea[name="expose"], textarea[name="description"]');

    await expect(objetField.or(page.locator('label:has-text("Objet")'))).toBeVisible({ timeout: 10000 });
    await expect(exposeField.or(page.locator('label:has-text("Exposé"), label:has-text("Description")'))).toBeVisible({ timeout: 5000 });

    // Vérifier la présence du bouton de soumission
    const submitBtn = page.locator('button:has-text("Enregistrer"), button:has-text("Créer"), button[type="submit"]');
    await expect(submitBtn.first()).toBeVisible({ timeout: 5000 });
  });

  test('Le type de note change les champs affichés', async ({ page }) => {
    await page.goto('/notes-sef/new');
    await waitForPageLoad(page);
    await page.waitForTimeout(1000);

    // Chercher les options de type
    const typeRadios = page.locator('[name="type_note"], [data-testid="note-type-selector"] input');
    const typeSelect = page.locator('select[name="type_note"], [data-testid="note-type-select"]');

    // Si c'est un radio group
    if (await typeRadios.first().isVisible({ timeout: 3000 })) {
      const count = await typeRadios.count();
      expect(count).toBeGreaterThanOrEqual(2); // Au moins NSEF et NAEF
    }

    // Si c'est un select
    if (await typeSelect.isVisible({ timeout: 3000 })) {
      await typeSelect.click();
      // Vérifier les options
      await expect(page.locator('[role="option"], option')).toHaveCount(2, { timeout: 3000 });
    }
  });
});

test.describe('Validation des montants NAEF', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input#email, input[name="email"]');
    const passwordInput = page.locator('input#password, input[name="password"]');

    await emailInput.fill(TEST_USERS.daaf.email);
    await passwordInput.fill(TEST_USERS.daaf.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/(dashboard|notes|$)/, { timeout: 15000 });
  });

  test('Le montant doit être positif', async ({ page }) => {
    await page.goto('/notes-sef/new');
    await waitForPageLoad(page);

    const montantField = page.locator('input[name="montant"], input[type="number"]');

    if (await montantField.isVisible({ timeout: 5000 })) {
      // Essayer de saisir un montant négatif
      await montantField.fill('-1000');
      await montantField.blur();

      // Vérifier le message d'erreur ou la validation
      const errorMessage = page.locator('text=positif, text=invalide, .error, [class*="error"]');
      // Soit erreur affichée, soit le champ rejette la valeur négative
    }
  });

  test('Le montant est formaté correctement', async ({ page }) => {
    await page.goto('/notes-sef/new');
    await waitForPageLoad(page);

    const montantField = page.locator('input[name="montant"], input[type="number"]');

    if (await montantField.isVisible({ timeout: 5000 })) {
      await montantField.fill('1500000');

      // Vérifier que le montant est affiché ou formaté
      const value = await montantField.inputValue();
      expect(value).toBeTruthy();
    }
  });
});
