/**
 * QA Prompt 5 — Diagnostic Playwright : Détail Imputation, Menu, Chaîne
 * 6 vérifications diagnostiques sans modification
 */
import { test, expect } from '@playwright/test';
import { loginAs, waitForPageLoad, selectExercice } from './fixtures/auth';

test.setTimeout(60000);

// ═══ 1. Clic référence imputation → vue détail s'ouvre ═══
test('P5-01 — Clic "Voir détails" → vue détail avec 3 cards', async ({ page }) => {
  await loginAs(page, 'dg@arti.ci', 'Test2026!');
  await selectExercice(page);
  await page.goto('/execution/imputation');
  await waitForPageLoad(page);

  await expect(page.locator('h1').filter({ hasText: /Imputation/i })).toBeVisible({
    timeout: 15000,
  });

  // Aller dans l'onglet Validées (on sait qu'il y a IMP-2026-DCSTI-0001)
  const valTab = page.locator('[role="tab"]').filter({ hasText: /Validées/i });
  await valTab.click();
  await page.waitForTimeout(1500);

  // Cliquer sur "..." de la première ligne
  const moreBtn = page
    .locator('table tbody tr')
    .first()
    .locator('button')
    .filter({ has: page.locator('svg') })
    .last();
  const hasMore = await moreBtn.isVisible({ timeout: 5000 }).catch(() => false);
  console.log(`[P5-01] Bouton "..." visible: ${hasMore}`);

  if (!hasMore) {
    console.log('[P5-01] SKIP — Aucune imputation dans Validées');
    expect(true).toBeTruthy();
    return;
  }

  await moreBtn.click();
  await page.waitForTimeout(500);

  // Cliquer "Voir détails"
  const voirDetails = page.locator('[role="menuitem"]').filter({ hasText: /Voir détails/i });
  await expect(voirDetails).toBeVisible({ timeout: 3000 });
  await voirDetails.click();
  await page.waitForTimeout(2000);

  // Vérifier que la vue détail s'affiche (pleine page, pas un dialog)
  // Header : référence + badge statut
  const refHeader = page.locator('h2').filter({ hasText: /IMP-/ });
  const hasRefHeader = await refHeader.isVisible({ timeout: 5000 }).catch(() => false);
  console.log(`[P5-01] En-tête référence IMP-XXXX: ${hasRefHeader}`);
  expect(hasRefHeader).toBeTruthy();

  // Badge statut "Validée"
  const badge = page.locator('text=/Validée/i').first();
  const hasBadge = await badge.isVisible({ timeout: 3000 }).catch(() => false);
  console.log(`[P5-01] Badge "Validée": ${hasBadge}`);

  // Card 1 : Informations
  const infoCard = page.locator('text=/Informations/i').first();
  const hasInfoCard = await infoCard.isVisible({ timeout: 3000 }).catch(() => false);
  console.log(`[P5-01] Card "Informations": ${hasInfoCard}`);
  expect(hasInfoCard).toBeTruthy();

  // Card 2 : Rattachement budgétaire
  const budgetCard = page.locator('text=/Rattachement budgétaire/i').first();
  const hasBudgetCard = await budgetCard.isVisible({ timeout: 3000 }).catch(() => false);
  console.log(`[P5-01] Card "Rattachement budgétaire": ${hasBudgetCard}`);
  expect(hasBudgetCard).toBeTruthy();

  // Card 3 : Historique
  const histCard = page.locator('text=/Historique/i').first();
  const hasHistCard = await histCard.isVisible({ timeout: 3000 }).catch(() => false);
  console.log(`[P5-01] Card "Historique": ${hasHistCard}`);
  expect(hasHistCard).toBeTruthy();

  // Vérifier champs dans Informations
  const refField = page.locator('text=/Référence/i').first();
  console.log(`[P5-01] Champ "Référence": ${await refField.isVisible().catch(() => false)}`);

  const dirField = page.locator('text=/Direction/i').first();
  console.log(`[P5-01] Champ "Direction": ${await dirField.isVisible().catch(() => false)}`);

  const montant = page.locator('text=/FCFA/i').first();
  console.log(`[P5-01] Montant FCFA affiché: ${await montant.isVisible().catch(() => false)}`);

  // Historique : Créée par, Validée par
  const creePar = page.locator('text=/Créée par/i');
  console.log(`[P5-01] "Créée par" visible: ${await creePar.isVisible().catch(() => false)}`);
  const valideePar = page.locator('text=/Validée par/i');
  console.log(`[P5-01] "Validée par" visible: ${await valideePar.isVisible().catch(() => false)}`);

  // Bouton Retour
  const retourBtn = page.locator('button').filter({ hasText: /Retour/i });
  const hasRetour = await retourBtn.isVisible({ timeout: 3000 }).catch(() => false);
  console.log(`[P5-01] Bouton "Retour": ${hasRetour}`);
  expect(hasRetour).toBeTruthy();

  await retourBtn.click();
  await page.waitForTimeout(1000);
});

// ═══ 2. Rattachement budgétaire → ligne budgétaire + note AEF source ═══
test('P5-02 — Card Rattachement budgétaire → ligne budgétaire + AEF source', async ({ page }) => {
  await loginAs(page, 'dg@arti.ci', 'Test2026!');
  await selectExercice(page);
  await page.goto('/execution/imputation');
  await waitForPageLoad(page);

  await expect(page.locator('h1').filter({ hasText: /Imputation/i })).toBeVisible({
    timeout: 15000,
  });

  // Onglet Validées
  await page
    .locator('[role="tab"]')
    .filter({ hasText: /Validées/i })
    .click();
  await page.waitForTimeout(1500);

  // Ouvrir détails
  const moreBtn = page
    .locator('table tbody tr')
    .first()
    .locator('button')
    .filter({ has: page.locator('svg') })
    .last();
  if (!(await moreBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
    console.log("[P5-02] SKIP — Pas d'imputation");
    expect(true).toBeTruthy();
    return;
  }

  await moreBtn.click();
  await page.waitForTimeout(500);
  await page
    .locator('[role="menuitem"]')
    .filter({ hasText: /Voir détails/i })
    .click();
  await page.waitForTimeout(2000);

  // Vérifier Card Rattachement budgétaire
  const budgetCard = page.locator('text=/Rattachement budgétaire/i').first();
  await expect(budgetCard).toBeVisible({ timeout: 5000 });

  // Ligne budgétaire (code + label)
  const ligneBudg = page.locator('text=/Ligne budgétaire/i').first();
  const hasLigne = await ligneBudg.isVisible({ timeout: 3000 }).catch(() => false);
  console.log(`[P5-02] "Ligne budgétaire" label: ${hasLigne}`);
  expect(hasLigne).toBeTruthy();

  // Note AEF source
  const aefSource = page.locator('text=/Note AEF source/i').first();
  const hasAef = await aefSource.isVisible({ timeout: 3000 }).catch(() => false);
  console.log(`[P5-02] "Note AEF source" label: ${hasAef}`);
  expect(hasAef).toBeTruthy();

  // Vérifier si disponible/barre de progression existe (diagnostic)
  const disponible = page.locator('text=/disponible|Dotation|Taux/i').first();
  const hasDisponible = await disponible.isVisible({ timeout: 3000 }).catch(() => false);
  console.log(`[P5-02] Disponible/barre progression dans détail: ${hasDisponible}`);
  console.log(
    `[P5-02] NOTE: Le disponible budgétaire n'est affiché que dans le formulaire de création, pas dans la vue détail`
  );

  // Retour
  await page
    .locator('button')
    .filter({ hasText: /Retour/i })
    .click();
  await page.waitForTimeout(500);
});

// ═══ 3. Menu "..." : DAAF voit Soumettre/Supprimer ou Valider selon statut, DG idem ═══
test('P5-03 — Menu "..." : actions par rôle (DAAF vs DG vs Agent)', async ({ page }) => {
  // --- Test DAAF sur imputation validée ---
  await loginAs(page, 'daaf@arti.ci', 'Test2026!');
  await selectExercice(page);
  await page.goto('/execution/imputation');
  await waitForPageLoad(page);
  await expect(page.locator('h1').filter({ hasText: /Imputation/i })).toBeVisible({
    timeout: 15000,
  });

  // Onglet Validées
  await page
    .locator('[role="tab"]')
    .filter({ hasText: /Validées/i })
    .click();
  await page.waitForTimeout(1500);

  const moreBtn = page
    .locator('table tbody tr')
    .first()
    .locator('button')
    .filter({ has: page.locator('svg') })
    .last();
  if (!(await moreBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
    console.log("[P5-03] SKIP — Pas d'imputation validée");
    expect(true).toBeTruthy();
    return;
  }

  await moreBtn.click();
  await page.waitForTimeout(500);

  // Menu items pour DAAF sur imputation validée
  const menuItems = page.locator('[role="menuitem"]');
  const menuCount = await menuItems.count();
  console.log(`[P5-03] DAAF - Menu items (validée): ${menuCount}`);
  for (let i = 0; i < menuCount; i++) {
    const text = await menuItems.nth(i).textContent();
    console.log(`[P5-03] DAAF - Item ${i}: "${text?.trim()}"`);
  }

  // Vérifier "Voir détails" toujours présent
  const voirDetails = menuItems.filter({ hasText: /Voir détails/i });
  expect(await voirDetails.isVisible().catch(() => false)).toBeTruthy();
  console.log('[P5-03] DAAF - "Voir détails": OK');

  // Sur validée, DAAF devrait voir "Créer expression de besoin"
  const creerEB = menuItems.filter({ hasText: /expression de besoin/i });
  const hasCreerEB = await creerEB.isVisible({ timeout: 2000 }).catch(() => false);
  console.log(`[P5-03] DAAF - "Créer expression de besoin" (validée): ${hasCreerEB}`);

  // Fermer le menu
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // --- Onglet "À valider" pour vérifier actions de validation ---
  const aValiderTab = page.locator('[role="tab"]').filter({ hasText: /À valider/i });
  await aValiderTab.click();
  await page.waitForTimeout(1500);

  const aValiderRow = page.locator('table tbody tr').first();
  const hasAValider = await aValiderRow.isVisible({ timeout: 3000 }).catch(() => false);
  console.log(`[P5-03] DAAF - Imputations "À valider": ${hasAValider ? 'oui' : 'aucune'}`);

  if (hasAValider) {
    const moreBtnAV = aValiderRow
      .locator('button')
      .filter({ has: page.locator('svg') })
      .last();
    await moreBtnAV.click();
    await page.waitForTimeout(500);

    const menuItemsAV = page.locator('[role="menuitem"]');
    const menuCountAV = await menuItemsAV.count();
    for (let i = 0; i < menuCountAV; i++) {
      const text = await menuItemsAV.nth(i).textContent();
      console.log(`[P5-03] DAAF - À valider Item ${i}: "${text?.trim()}"`);
    }

    // DAAF (canValidate) devrait voir Valider, Différer, Rejeter
    const hasValider = await menuItemsAV
      .filter({ hasText: /^Valider$/i })
      .isVisible()
      .catch(() => false);
    const hasDifferer = await menuItemsAV
      .filter({ hasText: /Différer/i })
      .isVisible()
      .catch(() => false);
    const hasRejeter = await menuItemsAV
      .filter({ hasText: /Rejeter/i })
      .isVisible()
      .catch(() => false);
    console.log(
      `[P5-03] DAAF - "Valider": ${hasValider}, "Différer": ${hasDifferer}, "Rejeter": ${hasRejeter}`
    );

    await page.keyboard.press('Escape');
  } else {
    console.log("[P5-03] Pas d'imputation à valider — actions de validation non testables");
  }

  // --- Test DG ---
  await loginAs(page, 'dg@arti.ci', 'Test2026!');
  await selectExercice(page);
  await page.goto('/execution/imputation');
  await waitForPageLoad(page);
  await expect(page.locator('h1').filter({ hasText: /Imputation/i })).toBeVisible({
    timeout: 15000,
  });

  await page
    .locator('[role="tab"]')
    .filter({ hasText: /Validées/i })
    .click();
  await page.waitForTimeout(1500);

  const moreBtnDG = page
    .locator('table tbody tr')
    .first()
    .locator('button')
    .filter({ has: page.locator('svg') })
    .last();
  if (await moreBtnDG.isVisible({ timeout: 5000 }).catch(() => false)) {
    await moreBtnDG.click();
    await page.waitForTimeout(500);

    const menuItemsDG = page.locator('[role="menuitem"]');
    const menuCountDG = await menuItemsDG.count();
    console.log(`[P5-03] DG - Menu items (validée): ${menuCountDG}`);
    for (let i = 0; i < menuCountDG; i++) {
      const text = await menuItemsDG.nth(i).textContent();
      console.log(`[P5-03] DG - Item ${i}: "${text?.trim()}"`);
    }
    await page.keyboard.press('Escape');
  }

  // --- Test Agent DSI (pas canValidate) ---
  await loginAs(page, 'agent.dsi@arti.ci', 'Test2026!');
  await selectExercice(page);
  await page.goto('/execution/imputation');
  await waitForPageLoad(page);
  await expect(page.locator('h1').filter({ hasText: /Imputation/i })).toBeVisible({
    timeout: 15000,
  });

  await page
    .locator('[role="tab"]')
    .filter({ hasText: /Validées/i })
    .click();
  await page.waitForTimeout(1500);

  const moreBtnAgent = page
    .locator('table tbody tr')
    .first()
    .locator('button')
    .filter({ has: page.locator('svg') })
    .last();
  if (await moreBtnAgent.isVisible({ timeout: 5000 }).catch(() => false)) {
    await moreBtnAgent.click();
    await page.waitForTimeout(500);

    const menuItemsAgent = page.locator('[role="menuitem"]');
    const menuCountAgent = await menuItemsAgent.count();
    console.log(`[P5-03] Agent DSI - Menu items (validée): ${menuCountAgent}`);
    for (let i = 0; i < menuCountAgent; i++) {
      const text = await menuItemsAgent.nth(i).textContent();
      console.log(`[P5-03] Agent DSI - Item ${i}: "${text?.trim()}"`);
    }

    // Agent ne devrait PAS voir Valider/Différer/Rejeter
    const agentValider = await menuItemsAgent
      .filter({ hasText: /^Valider$/i })
      .isVisible()
      .catch(() => false);
    console.log(`[P5-03] Agent DSI - "Valider" visible: ${agentValider} (attendu: false)`);

    await page.keyboard.press('Escape');
  }

  expect(true).toBeTruthy();
});

// ═══ 4. "Voir NAEF" → diagnostic : lien vers NAEF d'origine ? ═══
test('P5-04 — Diagnostic : lien "Voir NAEF" ou note AEF source cliquable', async ({ page }) => {
  await loginAs(page, 'dg@arti.ci', 'Test2026!');
  await selectExercice(page);
  await page.goto('/execution/imputation');
  await waitForPageLoad(page);
  await expect(page.locator('h1').filter({ hasText: /Imputation/i })).toBeVisible({
    timeout: 15000,
  });

  // Onglet Validées
  await page
    .locator('[role="tab"]')
    .filter({ hasText: /Validées/i })
    .click();
  await page.waitForTimeout(1500);

  // Ouvrir détails
  const moreBtn = page
    .locator('table tbody tr')
    .first()
    .locator('button')
    .filter({ has: page.locator('svg') })
    .last();
  if (!(await moreBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
    console.log("[P5-04] SKIP — Pas d'imputation");
    expect(true).toBeTruthy();
    return;
  }

  await moreBtn.click();
  await page.waitForTimeout(500);
  await page
    .locator('[role="menuitem"]')
    .filter({ hasText: /Voir détails/i })
    .click();
  await page.waitForTimeout(2000);

  // Chercher "Note AEF source" dans la vue détail
  const aefLabel = page.locator('text=/Note AEF source/i').first();
  const hasAefLabel = await aefLabel.isVisible({ timeout: 3000 }).catch(() => false);
  console.log(`[P5-04] Label "Note AEF source": ${hasAefLabel}`);

  // Chercher un lien ou bouton "Voir NAEF" / "Voir la note"
  const voirNaefBtn = page
    .locator('button, a')
    .filter({ hasText: /Voir.*NAEF|Voir.*note|Ouvrir.*AEF/i })
    .first();
  const hasVoirNaef = await voirNaefBtn.isVisible({ timeout: 3000 }).catch(() => false);
  console.log(`[P5-04] Bouton/lien "Voir NAEF": ${hasVoirNaef}`);

  // Chercher un lien cliquable sur le numéro AEF
  const aefLink = page.locator('a').filter({ hasText: /ARTI/i }).first();
  const hasAefLink = await aefLink.isVisible({ timeout: 3000 }).catch(() => false);
  console.log(`[P5-04] Numéro AEF cliquable (lien <a>): ${hasAefLink}`);

  if (!hasVoirNaef && !hasAefLink) {
    console.log(
      '[P5-04] CONSTAT: Le numéro AEF source est affiché en texte brut, sans lien ni bouton pour naviguer vers la NAEF'
    );
    console.log(
      '[P5-04] RECOMMANDATION: Ajouter un bouton "Voir NAEF" ou rendre le numéro cliquable'
    );
  }

  // Retour
  await page
    .locator('button')
    .filter({ hasText: /Retour/i })
    .click();
  await page.waitForTimeout(500);
  expect(true).toBeTruthy();
});

// ═══ 5. Chaîne NSEF→NAEF→IMPUTATION affichée ? ═══
test('P5-05 — Diagnostic : chaîne NSEF → NAEF → IMPUTATION visible', async ({ page }) => {
  await loginAs(page, 'dg@arti.ci', 'Test2026!');
  await selectExercice(page);
  await page.goto('/execution/imputation');
  await waitForPageLoad(page);
  await expect(page.locator('h1').filter({ hasText: /Imputation/i })).toBeVisible({
    timeout: 15000,
  });

  // Vérifier la barre chaîne sur la page principale
  const chaineBar = page
    .locator('text=/Chaîne.*dépense|Note SEF.*Note AEF.*Imputation|NSEF.*NAEF/i')
    .first();
  const hasChaineMain = await chaineBar.isVisible({ timeout: 5000 }).catch(() => false);
  console.log(`[P5-05] Barre chaîne sur page principale: ${hasChaineMain}`);

  // Vérifier les étapes de la chaîne
  const etapes = ['Note SEF', 'Note AEF', 'Imputation', 'Engagement', 'Liquidation'];
  for (const etape of etapes) {
    const el = page.locator(`text=/${etape}/i`).first();
    const visible = await el.isVisible({ timeout: 2000 }).catch(() => false);
    console.log(`[P5-05] Étape chaîne "${etape}": ${visible}`);
  }

  // Ouvrir détail pour vérifier chaîne dans la vue détail
  await page
    .locator('[role="tab"]')
    .filter({ hasText: /Validées/i })
    .click();
  await page.waitForTimeout(1500);

  const moreBtn = page
    .locator('table tbody tr')
    .first()
    .locator('button')
    .filter({ has: page.locator('svg') })
    .last();
  if (await moreBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await moreBtn.click();
    await page.waitForTimeout(500);
    await page
      .locator('[role="menuitem"]')
      .filter({ hasText: /Voir détails/i })
      .click();
    await page.waitForTimeout(2000);

    // Chercher une représentation de chaîne dans la vue détail
    const chaineDetail = page
      .locator('text=/NSEF.*NAEF.*IMP|Note SEF.*Note AEF.*Imputation|chaîne|workflow|étapes/i')
      .first();
    const hasChaineDetail = await chaineDetail.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`[P5-05] Chaîne dans vue détail: ${hasChaineDetail}`);

    // Vérifier la présence d'un breadcrumb ou fil d'Ariane
    const breadcrumb = page
      .locator('nav[aria-label="breadcrumb"], .breadcrumb, [role="navigation"]')
      .first();
    const hasBreadcrumb = await breadcrumb.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`[P5-05] Breadcrumb/fil d'Ariane: ${hasBreadcrumb}`);

    if (!hasChaineDetail) {
      console.log(
        '[P5-05] CONSTAT: Pas de visualisation chaîne NSEF→NAEF→IMPUTATION dans la vue détail'
      );
      console.log(
        "[P5-05] La page principale affiche une barre de chaîne mais la vue détail n'en a pas"
      );
    }

    await page
      .locator('button')
      .filter({ hasText: /Retour/i })
      .click();
  }

  expect(true).toBeTruthy();
});

// ═══ 6. Non-régression /notes-sef + /notes-aef ═══
test('P5-06 — Non-régression /notes-sef et /notes-aef', async ({ page }) => {
  await loginAs(page, 'dg@arti.ci', 'Test2026!');
  await selectExercice(page);

  // /notes-sef
  await page.goto('/notes-sef');
  await waitForPageLoad(page);
  const sefTitle = page.locator('h1, h2').filter({ hasText: /Notes SEF/i });
  const sefOK = await sefTitle.isVisible({ timeout: 15000 }).catch(() => false);
  console.log(`[P5-06] /notes-sef charge: ${sefOK}`);
  expect(sefOK).toBeTruthy();

  const sefTable = page.locator('table').first();
  await expect(sefTable).toBeVisible({ timeout: 10000 });
  console.log('[P5-06] /notes-sef table: OK');

  // /notes-aef
  await page.goto('/notes-aef');
  await waitForPageLoad(page);
  const aefTitle = page.locator('h1, h2').filter({ hasText: /Notes AEF/i });
  const aefOK = await aefTitle.isVisible({ timeout: 15000 }).catch(() => false);
  console.log(`[P5-06] /notes-aef charge: ${aefOK}`);
  expect(aefOK).toBeTruthy();

  const aefTable = page.locator('table').first();
  await expect(aefTable).toBeVisible({ timeout: 10000 });
  console.log('[P5-06] /notes-aef table: OK');
});
