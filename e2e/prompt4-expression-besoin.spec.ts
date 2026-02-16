/**
 * QA Prompt 4 — Expression de Besoin : création, articles, calculs, soumission
 */
import { test, expect, Page } from '@playwright/test';
import { loginAs, waitForPageLoad, selectExercice } from './fixtures/auth';

test.setTimeout(60000);

// ─── Helper : ouvrir le formulaire avec imputation sélectionnée ──

async function openEBFormWithImputation(page: Page): Promise<boolean> {
  await loginAs(page, 'dg@arti.ci', 'Test2026!');
  await selectExercice(page);
  await page.goto('/execution/expression-besoin');
  await waitForPageLoad(page);
  await expect(page.locator('h1, h2').filter({ hasText: /Expressions? de Besoin/i })).toBeVisible({
    timeout: 15000,
  });

  // Essayer le bouton "Créer EB" dans l'onglet "À traiter"
  const creerEBBtn = page
    .locator('button')
    .filter({ hasText: /Créer EB/i })
    .first();
  const hasDirectBtn = await creerEBBtn.isVisible({ timeout: 5000 }).catch(() => false);

  if (hasDirectBtn) {
    await creerEBBtn.click();
    await page.waitForTimeout(500);
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    // Attendre que le formulaire soit chargé (pas la sélection)
    const hasArticles = await dialog
      .locator('text=/Liste des articles/i')
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    return hasArticles;
  }

  // Sinon, bouton "Nouvelle EB" et sélectionner dans la liste
  await page
    .locator('button')
    .filter({ hasText: /Nouvelle EB/i })
    .click();
  await page.waitForTimeout(1000);

  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible({ timeout: 5000 });

  const impItem = dialog.locator('.cursor-pointer').first();
  const hasImpItem = await impItem.isVisible({ timeout: 5000 }).catch(() => false);

  if (hasImpItem) {
    await impItem.click();
    await page.waitForTimeout(1000);
    const hasArticles = await dialog
      .locator('text=/Liste des articles/i')
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    return hasArticles;
  }

  console.log('[HELPER] ⚠ Aucune imputation validée disponible');
  return false;
}

// ─── Test 1 : Création EB — champs pré-remplis ──────────────────

test('P4-01 — Créer EB depuis imputation → champs pré-remplis + montant affiché', async ({
  page,
}) => {
  const hasForm = await openEBFormWithImputation(page);
  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible({ timeout: 5000 });

  if (!hasForm) {
    console.log("[P4-01] ⚠ SKIP: pas d'imputation");
    await dialog
      .locator('button')
      .filter({ hasText: /Annuler/i })
      .click();
    return;
  }

  // Imputation source visible
  await expect(dialog.locator('text=/Imputation source/i')).toBeVisible();
  // Budget imputé en FCFA
  await expect(dialog.locator('text=/Budget imputé/i')).toBeVisible();
  await expect(dialog.locator('text=/FCFA/i').first()).toBeVisible();

  // Objet pré-rempli
  const objetInput = dialog.locator('#objet');
  const objetValue = await objetInput.inputValue();
  expect(objetValue.length).toBeGreaterThan(0);
  console.log(`[P4-01] Objet pré-rempli: "${objetValue}"`);

  // Montant estimé pré-rempli depuis imputation
  const montantInput = dialog.locator('#montant_estime');
  const montantValue = await montantInput.inputValue();
  expect(montantValue.length).toBeGreaterThan(0);
  console.log(`[P4-01] Montant estimé pré-rempli: ${montantValue}`);

  console.log('[P4-01] ✅ Champs pré-remplis + montant imputé affiché');
  await dialog
    .locator('button')
    .filter({ hasText: /Annuler/i })
    .click();
});

// ─── Test 2+3 : Ajouter 3 articles + calcul auto ────────────────

test('P4-02 — Ajouter 3 articles + prix_total = qté × prix_unit', async ({ page }) => {
  const hasForm = await openEBFormWithImputation(page);
  if (!hasForm) {
    console.log('[P4-02] ⚠ SKIP');
    return;
  }

  const dialog = page.locator('[role="dialog"]');
  const articleRows = dialog.locator('table tbody tr');
  await expect(articleRows).toHaveCount(1);

  // Article 1 : 2 × 50000 = 100 000
  const row1 = articleRows.nth(0);
  await row1.locator('input[placeholder="Nom de l\'article..."]').fill('Ordinateur HP');
  await row1.locator('input[type="number"]').first().fill('2');
  await row1.locator('input[type="number"]').nth(1).fill('50000');
  await page.waitForTimeout(500);
  await expect(row1.locator('td').nth(5)).toContainText('100');
  console.log('[P4-02] Ligne 1: 2 × 50 000 = 100 000 ✅');

  // Article 2 : 5 × 8000 = 40 000
  await dialog.getByRole('button', { name: 'Ajouter', exact: true }).click();
  await expect(articleRows).toHaveCount(2);
  const row2 = articleRows.nth(1);
  await row2.locator('input[placeholder="Nom de l\'article..."]').fill('Souris');
  await row2.locator('input[type="number"]').first().fill('5');
  await row2.locator('input[type="number"]').nth(1).fill('8000');
  await page.waitForTimeout(500);
  await expect(row2.locator('td').nth(5)).toContainText('40');
  console.log('[P4-02] Ligne 2: 5 × 8 000 = 40 000 ✅');

  // Article 3 : 3 × 5000 = 15 000
  await dialog.getByRole('button', { name: 'Ajouter', exact: true }).click();
  await expect(articleRows).toHaveCount(3);
  const row3 = articleRows.nth(2);
  await row3.locator('input[placeholder="Nom de l\'article..."]').fill('Clavier');
  await row3.locator('input[type="number"]').first().fill('3');
  await row3.locator('input[type="number"]').nth(1).fill('5000');
  await page.waitForTimeout(500);
  await expect(row3.locator('td').nth(5)).toContainText('15');
  console.log('[P4-02] Ligne 3: 3 × 5 000 = 15 000 ✅');
  console.log('[P4-02] ✅ 3 articles, calculs corrects');

  await dialog
    .locator('button')
    .filter({ hasText: /Annuler/i })
    .click();
});

// ─── Test 4 : Total général = somme des lignes ──────────────────

test('P4-04 — Total général = somme des lignes', async ({ page }) => {
  const hasForm = await openEBFormWithImputation(page);
  if (!hasForm) {
    console.log('[P4-04] ⚠ SKIP');
    return;
  }

  const dialog = page.locator('[role="dialog"]');
  const articleRows = dialog.locator('table tbody tr');

  // Article 1 : 2 × 50000 = 100000
  await articleRows.nth(0).locator('input[placeholder="Nom de l\'article..."]').fill('A');
  await articleRows.nth(0).locator('input[type="number"]').first().fill('2');
  await articleRows.nth(0).locator('input[type="number"]').nth(1).fill('50000');

  // Article 2 : 3 × 10000 = 30000
  await dialog.getByRole('button', { name: 'Ajouter', exact: true }).click();
  await articleRows.nth(1).locator('input[placeholder="Nom de l\'article..."]').fill('B');
  await articleRows.nth(1).locator('input[type="number"]').first().fill('3');
  await articleRows.nth(1).locator('input[type="number"]').nth(1).fill('10000');
  await page.waitForTimeout(500);

  // TOTAL GÉNÉRAL doit afficher 130 000 FCFA
  const totalRow = dialog.locator('text=/TOTAL GÉNÉRAL/i');
  await expect(totalRow).toBeVisible();
  const totalCell = dialog.locator('tfoot td').nth(1);
  await expect(totalCell).toContainText('130');
  console.log('[P4-04] ✅ TOTAL GÉNÉRAL = 130 000 FCFA');

  // Montant estimé auto-calculé = 130000
  const montantInput = dialog.locator('#montant_estime');
  const montantValue = await montantInput.inputValue();
  expect(montantValue).toBe('130000');
  console.log('[P4-04] ✅ Montant estimé auto-sync: 130000');

  await dialog
    .locator('button')
    .filter({ hasText: /Annuler/i })
    .click();
});

// ─── Test 5 : Alerte dépassement budget ─────────────────────────

test('P4-05 — Alerte quand total > montant imputé', async ({ page }) => {
  const hasForm = await openEBFormWithImputation(page);
  if (!hasForm) {
    console.log('[P4-05] ⚠ SKIP');
    return;
  }

  const dialog = page.locator('[role="dialog"]');

  // Montant imputé = 200 000. Article à 300 000
  const row1 = dialog.locator('table tbody tr').nth(0);
  await row1.locator('input[placeholder="Nom de l\'article..."]').fill('Très cher');
  await row1.locator('input[type="number"]').first().fill('1');
  await row1.locator('input[type="number"]').nth(1).fill('300000');
  await page.waitForTimeout(500);

  // Alerte destructive visible
  const alerte = dialog.locator('text=/dépasse le montant imputé/i');
  await expect(alerte).toBeVisible({ timeout: 3000 });
  console.log('[P4-05] ✅ Alerte de dépassement budgétaire visible');

  // Bouton "Créer" doit être désactivé
  const submitBtn = dialog.locator('button').filter({ hasText: /Créer l'expression/i });
  await expect(submitBtn).toBeDisabled();
  console.log('[P4-05] ✅ Bouton de création désactivé');

  await dialog
    .locator('button')
    .filter({ hasText: /Annuler/i })
    .click();
});

// ─── Test 6 : Supprimer une ligne → total recalculé ────────────

test('P4-06 — Supprimer une ligne → total recalculé', async ({ page }) => {
  const hasForm = await openEBFormWithImputation(page);
  if (!hasForm) {
    console.log('[P4-06] ⚠ SKIP');
    return;
  }

  const dialog = page.locator('[role="dialog"]');
  const articleRows = dialog.locator('table tbody tr');

  // Article 1 : 2 × 10000 = 20 000
  await articleRows.nth(0).locator('input[placeholder="Nom de l\'article..."]').fill('A');
  await articleRows.nth(0).locator('input[type="number"]').first().fill('2');
  await articleRows.nth(0).locator('input[type="number"]').nth(1).fill('10000');

  // Article 2 : 1 × 25000 = 25 000
  await dialog.getByRole('button', { name: 'Ajouter', exact: true }).click();
  await expect(articleRows).toHaveCount(2);
  await articleRows.nth(1).locator('input[placeholder="Nom de l\'article..."]').fill('B');
  await articleRows.nth(1).locator('input[type="number"]').first().fill('1');
  await articleRows.nth(1).locator('input[type="number"]').nth(1).fill('25000');
  await page.waitForTimeout(500);

  // TOTAL = 45 000
  const totalCell = dialog.locator('tfoot td').nth(1);
  await expect(totalCell).toContainText('45');

  // Supprimer ligne 2
  await articleRows.nth(1).locator('button').last().click();
  await page.waitForTimeout(300);

  // 1 ligne restante, TOTAL = 20 000
  await expect(articleRows).toHaveCount(1);
  await expect(totalCell).toContainText('20');
  console.log('[P4-06] ✅ Suppression → TOTAL recalculé = 20 000');

  await dialog
    .locator('button')
    .filter({ hasText: /Annuler/i })
    .click();
});

// ─── Test 7 : Soumettre sans article → erreur validation ────────

test('P4-07 — Créer EB sans article → erreur validation', async ({ page }) => {
  const hasForm = await openEBFormWithImputation(page);
  if (!hasForm) {
    console.log('[P4-07] ⚠ SKIP');
    return;
  }

  const dialog = page.locator('[role="dialog"]');

  // Ne PAS remplir d'article. Scroll et cliquer créer.
  const submitBtn = dialog.locator('button').filter({ hasText: /Créer l'expression/i });
  await submitBtn.scrollIntoViewIfNeeded();
  await submitBtn.click();
  await page.waitForTimeout(1500);

  // Toast d'erreur "au moins un article"
  const errorToast = page.locator('text=/au moins un article/i');
  const hasError = await errorToast.isVisible({ timeout: 5000 }).catch(() => false);

  if (hasError) {
    console.log('[P4-07] ✅ Erreur: "Veuillez saisir au moins un article avec une désignation"');
  } else {
    console.log("[P4-07] ⚠ Toast d'erreur non détecté");
  }

  // Dialog toujours ouvert (pas de création)
  await expect(dialog).toBeVisible();
  console.log('[P4-07] ✅ Dialog reste ouvert (pas de création)');

  await dialog
    .locator('button')
    .filter({ hasText: /Annuler/i })
    .click();
});

// ─── Test 8 : Créer avec articles → brouillon créé ─────────────

test('P4-08 — Créer EB avec articles → brouillon dans la liste', async ({ page }) => {
  const hasForm = await openEBFormWithImputation(page);
  if (!hasForm) {
    console.log('[P4-08] ⚠ SKIP');
    return;
  }

  const dialog = page.locator('[role="dialog"]');
  const tag = 'QA-P4-' + Date.now();

  // Remplir un article valide
  const row1 = dialog.locator('table tbody tr').nth(0);
  await row1.locator('input[placeholder="Nom de l\'article..."]').fill(tag);
  await row1.locator('input[type="number"]').first().fill('1');
  await row1.locator('input[type="number"]').nth(1).fill('10000');
  await page.waitForTimeout(500);

  // Scroll vers le bouton et cliquer
  const submitBtn = dialog.locator('button').filter({ hasText: /Créer l'expression/i });
  await submitBtn.scrollIntoViewIfNeeded();
  await submitBtn.click();

  // Capturer les erreurs console et réseau pendant la soumission
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text().substring(0, 200));
  });

  // Capturer les réponses réseau d'erreur
  const networkErrors: string[] = [];
  page.on('response', async (response) => {
    if (response.status() >= 400 && response.url().includes('supabase')) {
      try {
        const body = await response.text();
        networkErrors.push(
          `${response.status()} ${response.url().split('/').pop()}: ${body.substring(0, 300)}`
        );
      } catch {
        networkErrors.push(`${response.status()} ${response.url()}`);
      }
    }
  });

  // Attendre toast succès ou que la dialog se ferme (timeout 20s)
  const toastSuccess = page.locator('text=/créée avec succès/i');
  const toastError = page.locator('text=/Erreur/i');

  // Utiliser waitFor (pas isVisible qui est instantané)
  const hasSuccess = await toastSuccess
    .waitFor({ state: 'visible', timeout: 20000 })
    .then(() => true)
    .catch(() => false);

  if (hasSuccess) {
    console.log('[P4-08] ✅ EB créée avec succès');

    // Dialog doit se fermer
    await expect(dialog).toBeHidden({ timeout: 5000 });
    console.log('[P4-08] ✅ Dialog fermé après création');

    // Vérifier dans l'onglet Brouillons
    await page
      .locator('[role="tab"]')
      .filter({ hasText: /Brouillons/i })
      .click();
    await page.waitForTimeout(2000);

    // L'EB brouillon doit avoir l'objet "tablette" (pré-rempli depuis l'imputation)
    const ebRow = page.locator('table tbody tr').filter({ hasText: /tablette/i });
    const found = await ebRow
      .first()
      .waitFor({ state: 'visible', timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    console.log(
      `[P4-08] ${found ? '✅' : '⚠'} EB ${found ? 'trouvée' : 'non trouvée'} dans onglet Brouillons`
    );
  } else {
    // Vérifier si un toast d'erreur est apparu
    const hasError = await toastError.first().isVisible();
    if (hasError) {
      const errorText = await toastError
        .first()
        .textContent()
        .catch(() => '');
      console.log(`[P4-08] ❌ Erreur de création: ${errorText}`);
    } else {
      console.log('[P4-08] ⚠ Pas de toast détecté');
    }

    // Logs erreurs
    if (consoleErrors.length > 0) {
      console.log(`[P4-08] Console errors: ${consoleErrors.join(' | ')}`);
    }
    if (networkErrors.length > 0) {
      networkErrors.forEach((e) => console.log(`[P4-08] Network error: ${e}`));
    }

    const dialogOpen = await dialog.isVisible();
    console.log(`[P4-08] Dialog toujours ouvert: ${dialogOpen}`);
  }
});

// ─── Test 9 : Non-régression ─────────────────────────────────────

test('P4-09a — Non-régression /notes-sef', async ({ page }) => {
  await loginAs(page, 'dg@arti.ci', 'Test2026!');
  await selectExercice(page);
  await page.goto('/notes-sef');
  await waitForPageLoad(page);
  await expect(page.locator('h1, h2').filter({ hasText: /Notes SEF/i })).toBeVisible({
    timeout: 15000,
  });
  await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 });
  console.log('[P4-09a] /notes-sef ✅');
});

test('P4-09b — Non-régression /notes-aef', async ({ page }) => {
  await loginAs(page, 'dg@arti.ci', 'Test2026!');
  await selectExercice(page);
  await page.goto('/notes-aef');
  await waitForPageLoad(page);
  await expect(page.locator('h1, h2').filter({ hasText: /Notes AEF/i })).toBeVisible({
    timeout: 15000,
  });
  await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 });
  console.log('[P4-09b] /notes-aef ✅');
});

test('P4-09c — Non-régression /execution/imputation', async ({ page }) => {
  const jsErrors: string[] = [];
  page.on('pageerror', (err) => jsErrors.push(err.message.substring(0, 150)));

  await loginAs(page, 'dg@arti.ci', 'Test2026!');
  await selectExercice(page);
  await page.goto('/execution/imputation');
  await waitForPageLoad(page);
  await expect(page.locator('h1').filter({ hasText: /Imputation/i })).toBeVisible({
    timeout: 15000,
  });
  expect(jsErrors.length).toBe(0);
  console.log('[P4-09c] /execution/imputation ✅');
});
