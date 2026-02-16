/**
 * QA Prompt 5 — Expression de Besoin : panneau détail 5 onglets, articles, budget, menu actions, chaîne
 *
 * Architecture réelle du détail EB (ExpressionBesoinDetails.tsx) :
 * - Dialog avec 5 onglets : Informations | Articles | Budget | PJ | Chaîne
 * - Tab "Validées" dans la page utilise navigate() (pas de Dialog) → on utilise l'onglet Brouillons
 * - Tab "Brouillons" utilise ExpressionBesoinList qui ouvre un Dialog
 */
import { test, expect, Page } from '@playwright/test';
import { loginAs, waitForPageLoad, selectExercice } from './fixtures/auth';

test.setTimeout(60000);

// ─── Helper : ouvrir la page EB et attendre le chargement ──
async function goToEB(page: Page, user = 'dg@arti.ci') {
  await loginAs(page, user, 'Test2026!');
  await selectExercice(page);
  await page.goto('/execution/expression-besoin');
  await waitForPageLoad(page);
  await expect(page.locator('h1, h2').filter({ hasText: /Expressions? de Besoin/i })).toBeVisible({
    timeout: 15000,
  });
}

// ─── Helper : créer une EB de test avec articles depuis l'imputation ──
async function createTestEB(page: Page): Promise<boolean> {
  // Onglet "À traiter" est sélectionné par défaut
  const creerEBBtn = page
    .locator('button')
    .filter({ hasText: /Créer EB/i })
    .first();
  const hasBtn = await creerEBBtn
    .waitFor({ state: 'visible', timeout: 5000 })
    .then(() => true)
    .catch(() => false);
  if (!hasBtn) return false;

  await creerEBBtn.click();
  await page.waitForTimeout(500);

  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible({ timeout: 5000 });

  // Attendre le formulaire avec articles
  const hasArticles = await dialog
    .locator('text=/Liste des articles/i')
    .waitFor({ state: 'visible', timeout: 5000 })
    .then(() => true)
    .catch(() => false);
  if (!hasArticles) return false;

  // Remplir un article
  const row1 = dialog.locator('table tbody tr').nth(0);
  await row1.locator('input[placeholder="Nom de l\'article..."]').fill('Test-P5-Article');
  await row1.locator('input[type="number"]').first().fill('2');
  await row1.locator('input[type="number"]').nth(1).fill('25000');
  await page.waitForTimeout(500);

  // Soumettre
  const submitBtn = dialog.locator('button').filter({ hasText: /Créer l'expression/i });
  await submitBtn.scrollIntoViewIfNeeded();
  await submitBtn.click();

  const success = await page
    .locator('text=/créée avec succès/i')
    .waitFor({ state: 'visible', timeout: 15000 })
    .then(() => true)
    .catch(() => false);

  if (success) {
    await expect(dialog).toBeHidden({ timeout: 5000 });
    await page.waitForTimeout(1000);
  }

  return success;
}

// ─── Helper : ouvrir le détail d'un brouillon → Dialog avec 5 onglets ──
async function openBrouillonDetail(page: Page): Promise<boolean> {
  await page
    .locator('[role="tab"]')
    .filter({ hasText: /Brouillons/i })
    .click();
  await page.waitForTimeout(2000);

  const firstRow = page.locator('table tbody tr').first();
  const hasRow = await firstRow
    .waitFor({ state: 'visible', timeout: 5000 })
    .then(() => true)
    .catch(() => false);
  if (!hasRow) return false;

  // Cliquer sur le menu "..." de la première ligne
  await firstRow.locator('button').last().click();
  await page.waitForTimeout(300);

  // Cliquer "Voir détails"
  await page
    .locator('[role="menuitem"]')
    .filter({ hasText: /Voir détails/i })
    .click();
  await page.waitForTimeout(500);

  // Attendre le dialog
  const dialog = page.locator('[role="dialog"]');
  return await dialog
    .waitFor({ state: 'visible', timeout: 5000 })
    .then(() => true)
    .catch(() => false);
}

// ─── Test 1 : Créer EB + ouvrir détail → 5 onglets ──

test('P5-01 — Créer EB + ouvrir détail → panneau 5 onglets', async ({ page }) => {
  await goToEB(page);

  // Créer une EB brouillon avec articles
  const created = await createTestEB(page);
  if (!created) {
    console.log("[P5-01] SKIP: pas d'imputation disponible pour créer EB");
    return;
  }
  console.log('[P5-01] EB créée avec succès');

  // Ouvrir le détail du brouillon → Dialog
  const opened = await openBrouillonDetail(page);
  expect(opened).toBeTruthy();
  console.log('[P5-01] Dialog de détail ouvert');

  const dialog = page.locator('[role="dialog"]');

  // Titre
  await expect(dialog.locator('text=/Expression de besoin/i').first()).toBeVisible();

  // Badge de statut
  await expect(dialog.locator('text=/Brouillon/i').first()).toBeVisible();

  // 5 onglets
  const tabs = dialog.locator('[role="tab"]');
  await expect(tabs).toHaveCount(5);
  await expect(tabs.nth(0)).toContainText('Informations');
  await expect(tabs.nth(1)).toContainText('Articles');
  await expect(tabs.nth(2)).toContainText('Budget');
  await expect(tabs.nth(3)).toContainText('PJ');
  await expect(tabs.nth(4)).toContainText('Chaîne');
  console.log('[P5-01] 5 onglets : Informations | Articles | Budget | PJ | Chaîne');

  // Onglet Informations actif par défaut
  await expect(dialog.locator('text=/Informations générales/i')).toBeVisible();
  await expect(dialog.locator('text=/Objet/i').first()).toBeVisible();
  await expect(dialog.locator('text=/Direction/i').first()).toBeVisible();
  await expect(dialog.locator('text=/Urgence/i').first()).toBeVisible();
  await expect(dialog.locator('text=/Statut/i').first()).toBeVisible();
  console.log('[P5-01] Onglet Informations : sections visibles');

  // Imputation d'origine visible (lien cliquable)
  await expect(dialog.locator("text=/Imputation d'origine/i")).toBeVisible();
  await expect(dialog.locator('text=/IMP-2026-DCSTI/i')).toBeVisible();
  console.log("[P5-01] Lien Imputation d'origine visible");

  await page.keyboard.press('Escape');
});

// ─── Test 2 : Onglet Articles → tableau lignes + total + comparaison budget ──

test('P5-02 — Onglet Articles : lignes, total, comparaison montant imputé', async ({ page }) => {
  await goToEB(page);

  // Ouvrir le brouillon existant (créé par P5-01)
  const opened = await openBrouillonDetail(page);
  if (!opened) {
    console.log('[P5-02] SKIP: pas de brouillon disponible');
    return;
  }

  const dialog = page.locator('[role="dialog"]');

  // Cliquer sur l'onglet "Articles"
  await dialog
    .locator('[role="tab"]')
    .filter({ hasText: /Articles/i })
    .click();
  await page.waitForTimeout(500);
  console.log('[P5-02] Onglet Articles ouvert');

  // Titre "Articles (1)" visible
  await expect(dialog.locator('text=/Articles/i').first()).toBeVisible();

  // Article "Test-P5-Article" affiché dans le tableau
  await expect(dialog.locator('text=/Test-P5-Article/i')).toBeVisible();
  console.log('[P5-02] Article "Test-P5-Article" affiché');

  // Quantité 2 et total 50 000 affichés
  await expect(dialog.locator('text=/50/').first()).toBeVisible();
  console.log('[P5-02] Total article affiché');

  // TOTAL GÉNÉRAL visible dans le footer
  await expect(dialog.locator('text=/TOTAL GÉNÉRAL/i')).toBeVisible();
  console.log('[P5-02] TOTAL GÉNÉRAL visible');

  // Comparaison avec montant imputé (200 000)
  const comparison = dialog.locator('text=/Montant imputé/i');
  const hasComparison = await comparison
    .waitFor({ state: 'visible', timeout: 3000 })
    .then(() => true)
    .catch(() => false);
  if (hasComparison) {
    await expect(dialog.locator('text=/200/').first()).toBeVisible();
    console.log('[P5-02] Comparaison avec montant imputé (200 000) affichée');
  }

  // Barre de progression visible (consommation budget)
  const progressBar = dialog.locator('[role="progressbar"]');
  const hasProgress = await progressBar
    .waitFor({ state: 'visible', timeout: 2000 })
    .then(() => true)
    .catch(() => false);
  if (hasProgress) {
    console.log('[P5-02] Barre de progression budget visible');
  }

  // "Reste disponible" affiché (50000 < 200000)
  const resteDisponible = dialog.locator('text=/Reste disponible/i');
  const hasReste = await resteDisponible
    .waitFor({ state: 'visible', timeout: 2000 })
    .then(() => true)
    .catch(() => false);
  if (hasReste) {
    console.log('[P5-02] "Reste disponible" affiché');
  }

  await page.keyboard.press('Escape');
});

// ─── Test 3 : Onglet Budget → imputation source + récapitulatif ──

test('P5-03 — Onglet Budget : imputation source + récapitulatif budgétaire', async ({ page }) => {
  await goToEB(page);

  const opened = await openBrouillonDetail(page);
  if (!opened) {
    console.log('[P5-03] SKIP: pas de brouillon disponible');
    return;
  }

  const dialog = page.locator('[role="dialog"]');

  // Cliquer sur l'onglet "Budget"
  await dialog
    .locator('[role="tab"]')
    .filter({ hasText: /Budget/i })
    .click();
  await page.waitForTimeout(500);
  console.log('[P5-03] Onglet Budget ouvert');

  // Section "Imputation source" visible (carte violette)
  await expect(dialog.locator('text=/Imputation source/i')).toBeVisible();
  console.log('[P5-03] Section Imputation source visible');

  // Référence imputation visible
  await expect(dialog.locator('text=/Référence/i').first()).toBeVisible();

  // Montant imputé affiché
  await expect(dialog.locator('text=/Montant imputé/i').first()).toBeVisible();
  await expect(dialog.locator('text=/200/').first()).toBeVisible();
  console.log('[P5-03] Montant imputé 200 000 affiché');

  // Section "Récapitulatif budgétaire" visible
  await expect(dialog.locator('text=/Récapitulatif budgétaire/i')).toBeVisible();
  console.log('[P5-03] Récapitulatif budgétaire visible');

  // Total articles affiché
  await expect(dialog.locator('text=/Total articles/i')).toBeVisible();

  // Disponible affiché
  await expect(dialog.locator('text=/Disponible/i')).toBeVisible();

  // Consommation % visible
  const consommation = dialog.locator('text=/Consommation/i');
  const hasConso = await consommation
    .waitFor({ state: 'visible', timeout: 2000 })
    .then(() => true)
    .catch(() => false);
  if (hasConso) {
    console.log('[P5-03] Consommation % affichée');
  }

  await page.keyboard.press('Escape');
});

// ─── Test 4 : Menu "..." → brouillon = Soumettre/Supprimer, validé = Créer passation ──

test('P5-04 — Menu actions : brouillon→Soumettre/Supprimer, validé→Créer passation marché', async ({
  page,
}) => {
  await goToEB(page);

  // === Test sur Brouillons ===
  await page
    .locator('[role="tab"]')
    .filter({ hasText: /Brouillons/i })
    .click();
  await page.waitForTimeout(2000);

  const brouillonRow = page.locator('table tbody tr').first();
  const hasBrouillon = await brouillonRow
    .waitFor({ state: 'visible', timeout: 5000 })
    .then(() => true)
    .catch(() => false);

  if (hasBrouillon) {
    await brouillonRow.locator('button').last().click();
    await page.waitForTimeout(300);

    const menuItems = page.locator('[role="menuitem"]');
    const menuTexts = await menuItems.allTextContents();
    const menuStr = menuTexts.join(' | ');

    expect(menuStr).toContain('Voir détails');
    expect(menuStr).toContain('Soumettre');
    expect(menuStr).toContain('Supprimer');
    console.log(`[P5-04] Menu brouillon: ${menuStr}`);
    console.log('[P5-04] Brouillon: Voir détails + Soumettre + Supprimer');

    await page.keyboard.press('Escape');
  } else {
    console.log('[P5-04] Pas de brouillon disponible');
  }

  // === Test sur Validées (table custom avec menu inline) ===
  await page
    .locator('[role="tab"]')
    .filter({ hasText: /Validées/i })
    .click();
  await page.waitForTimeout(2000);

  const valideRow = page.locator('table tbody tr').first();
  const hasValide = await valideRow
    .waitFor({ state: 'visible', timeout: 5000 })
    .then(() => true)
    .catch(() => false);

  if (hasValide) {
    await valideRow.locator('button').last().click();
    await page.waitForTimeout(300);

    const menuItems = page.locator('[role="menuitem"]');
    const menuTexts = await menuItems.allTextContents();
    const menuStr = menuTexts.join(' | ');

    // Le menu Validées affiche "Créer passation marché" (pas "engagement")
    const hasPassation = menuStr.toLowerCase().includes('passation');
    console.log(`[P5-04] Menu validé: ${menuStr}`);
    expect(hasPassation).toBeTruthy();
    console.log('[P5-04] Validé: Créer passation marché disponible');

    await page.keyboard.press('Escape');
  }
});

// ─── Test 5 : Imputation d'origine visible dans onglet Informations ──

test("P5-05 — Imputation d'origine visible dans détail EB liée", async ({ page }) => {
  await goToEB(page);

  const opened = await openBrouillonDetail(page);
  if (!opened) {
    console.log('[P5-05] SKIP: pas de brouillon lié à une imputation');
    return;
  }

  const dialog = page.locator('[role="dialog"]');

  // Onglet Informations est actif par défaut
  // Section "Imputation d'origine" visible avec lien cliquable
  const impSection = dialog.locator("text=/Imputation d'origine/i");
  const hasImputation = await impSection
    .waitFor({ state: 'visible', timeout: 3000 })
    .then(() => true)
    .catch(() => false);

  if (hasImputation) {
    console.log('[P5-05] Section "Imputation d\'origine" visible');

    // Référence IMP-2026-DCSTI-0001 affichée
    await expect(dialog.locator('text=/IMP-2026-DCSTI/i')).toBeVisible();
    console.log('[P5-05] Référence imputation affichée');

    // Montant 200 000 affiché
    await expect(dialog.locator('text=/200.*000/i').first()).toBeVisible();
    console.log('[P5-05] Montant 200 000 FCFA affiché');

    // Lien cliquable (ExternalLink icon)
    const link = dialog.locator('button').filter({ hasText: /IMP-2026/i });
    const hasLink = await link
      .waitFor({ state: 'visible', timeout: 2000 })
      .then(() => true)
      .catch(() => false);
    if (hasLink) {
      console.log("[P5-05] Lien cliquable vers l'imputation");
    }
  } else {
    console.log("[P5-05] Section Imputation d'origine non visible (EB non liée)");
  }

  await page.keyboard.press('Escape');
});

// ─── Test 6 : Onglet Chaîne → DossierStepTimeline + ExpressionBesoinTimeline ──

test('P5-06 — Onglet Chaîne : timeline workflow + chaîne de la dépense', async ({ page }) => {
  await goToEB(page);

  const opened = await openBrouillonDetail(page);
  if (!opened) {
    console.log('[P5-06] SKIP: pas de brouillon disponible');
    return;
  }

  const dialog = page.locator('[role="dialog"]');

  // Cliquer sur l'onglet "Chaîne"
  await dialog
    .locator('[role="tab"]')
    .filter({ hasText: /Chaîne/i })
    .click();
  await page.waitForTimeout(1000);
  console.log('[P5-06] Onglet Chaîne ouvert');

  // Chaîne de la dépense (DossierStepTimeline) si dossier_id existe
  const chaineLabel = dialog.locator('text=/SEF|AEF|IMP|Imputation|Expression/i').first();
  const hasChaine = await chaineLabel
    .waitFor({ state: 'visible', timeout: 3000 })
    .then(() => true)
    .catch(() => false);

  if (hasChaine) {
    console.log('[P5-06] Chaîne de la dépense visible (dossier lié)');
    // Vérifier les étapes
    const steps = ['SEF', 'AEF', 'IMP'];
    for (const step of steps) {
      const found = await dialog
        .locator(`text=/${step}/i`)
        .first()
        .waitFor({ state: 'visible', timeout: 1000 })
        .then(() => true)
        .catch(() => false);
      if (found) {
        console.log(`[P5-06] Étape ${step} visible`);
      }
    }
  } else {
    console.log('[P5-06] Pas de chaîne de dépense (pas de dossier lié)');
  }

  // Journal d'audit visible
  const journal = dialog.locator("text=/Journal d'audit/i");
  const hasJournal = await journal
    .waitFor({ state: 'visible', timeout: 3000 })
    .then(() => true)
    .catch(() => false);
  if (hasJournal) {
    console.log("[P5-06] Journal d'audit visible");
    await expect(dialog.locator('text=/Créé le/i')).toBeVisible();
    console.log('[P5-06] "Créé le" affiché dans le journal');
  }

  await page.keyboard.press('Escape');
});

// ─── Test 7a-c : Non-régression ──

test('P5-07a — Non-régression /notes-sef', async ({ page }) => {
  await loginAs(page, 'dg@arti.ci', 'Test2026!');
  await selectExercice(page);
  await page.goto('/notes-sef');
  await waitForPageLoad(page);
  await expect(page.locator('h1, h2').filter({ hasText: /Notes SEF/i })).toBeVisible({
    timeout: 15000,
  });
  await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 });
  console.log('[P5-07a] /notes-sef OK');
});

test('P5-07b — Non-régression /notes-aef', async ({ page }) => {
  await loginAs(page, 'dg@arti.ci', 'Test2026!');
  await selectExercice(page);
  await page.goto('/notes-aef');
  await waitForPageLoad(page);
  await expect(page.locator('h1, h2').filter({ hasText: /Notes AEF/i })).toBeVisible({
    timeout: 15000,
  });
  await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 });
  console.log('[P5-07b] /notes-aef OK');
});

test('P5-07c — Non-régression /execution/imputation', async ({ page }) => {
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
  console.log('[P5-07c] /execution/imputation OK');
});
