/**
 * AUDIT DÉTAILLÉ — Module Marchés (Diagnostic Playwright)
 * NE MODIFIE RIEN — Lecture seule
 *
 * D1 : Formulaire création → tous les champs + manquants
 * D2 : Onglets par statut → compteurs
 * D3 : Clic marché existant → détail → onglets/sections
 * D4 : Menu Actions (...) → actions disponibles
 * D5 : Filtres existants
 * D6 : Navigation Expression Besoin → Passation (chaîne)
 * D7 : Non-régression /notes-sef + /expression-besoin
 */

import { test, expect, type Page } from '@playwright/test';
import { loginAs, waitForPageLoad, selectExercice } from './fixtures/auth';

async function loginAndGoMarches(page: Page) {
  await loginAs(page, 'dg@arti.ci', 'Test2026!');
  await selectExercice(page);
  await page.goto('/marches');
  await waitForPageLoad(page);
  await page.waitForTimeout(2000);
}

test.describe('Audit Détaillé — Module Marchés', () => {
  test.setTimeout(90_000);

  /* ================================================================== */
  /*  D1 — Formulaire création : TOUS les champs + manquants           */
  /* ================================================================== */
  test('D1 — Formulaire création : inventaire complet des champs', async ({ page }) => {
    await loginAndGoMarches(page);

    // Ouvrir le formulaire
    const newBtn = page
      .locator('button')
      .filter({ hasText: /nouveau marché/i })
      .first();
    await expect(newBtn).toBeVisible({ timeout: 10_000 });
    await newBtn.click();
    await page.waitForTimeout(2000);

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    console.log('=== D1 — FORMULAIRE CRÉATION MARCHÉ ===');

    // 1. Labels
    const labels = dialog.locator('label');
    const labelCount = await labels.count();
    console.log(`\n[D1] Labels (${labelCount}):`);
    for (let i = 0; i < labelCount; i++) {
      const text = await labels.nth(i).textContent();
      const forAttr = await labels.nth(i).getAttribute('for');
      console.log(`  ${i + 1}. "${text?.trim()}" (for=${forAttr})`);
    }

    // 2. Inputs text/number/date
    const textInputs = dialog.locator(
      'input[type="text"], input[type="number"], input[type="date"], input:not([type])'
    );
    const textCount = await textInputs.count();
    console.log(`\n[D1] Inputs text/number/date (${textCount}):`);
    for (let i = 0; i < textCount; i++) {
      const inp = textInputs.nth(i);
      const id = await inp.getAttribute('id');
      const name = await inp.getAttribute('name');
      const type = await inp.getAttribute('type');
      const placeholder = await inp.getAttribute('placeholder');
      const required = await inp.getAttribute('required');
      console.log(
        `  ${i + 1}. id="${id}" name="${name}" type="${type}" placeholder="${placeholder}" required=${required !== null}`
      );
    }

    // 3. Selects / Combobox
    const selects = dialog.locator('select, [role="combobox"]');
    const selectCount = await selects.count();
    console.log(`\n[D1] Selects/Combobox (${selectCount}):`);
    for (let i = 0; i < selectCount; i++) {
      const sel = selects.nth(i);
      const id = await sel.getAttribute('id');
      const text = await sel.textContent();
      console.log(`  ${i + 1}. id="${id}" value="${text?.trim().substring(0, 50)}"`);
    }

    // 4. Textareas
    const textareas = dialog.locator('textarea');
    const taCount = await textareas.count();
    console.log(`\n[D1] Textareas (${taCount}):`);
    for (let i = 0; i < taCount; i++) {
      const id = await textareas.nth(i).getAttribute('id');
      const placeholder = await textareas.nth(i).getAttribute('placeholder');
      console.log(`  ${i + 1}. id="${id}" placeholder="${placeholder}"`);
    }

    // 5. Boutons dans le dialog
    const buttons = dialog.locator('button');
    const btnCount = await buttons.count();
    console.log(`\n[D1] Boutons (${btnCount}):`);
    for (let i = 0; i < btnCount; i++) {
      const text = await buttons.nth(i).textContent();
      const disabled = await buttons.nth(i).isDisabled();
      console.log(`  ${i + 1}. "${text?.trim()}" disabled=${disabled}`);
    }

    // 6. Sections / Groupes (titres h3, h4, legend)
    const sections = dialog.locator('h3, h4, legend, [class*="section-title"]');
    const secCount = await sections.count();
    console.log(`\n[D1] Sections/Titres (${secCount}):`);
    for (let i = 0; i < secCount; i++) {
      console.log(`  ${i + 1}. "${await sections.nth(i).textContent()}"`);
    }

    // 7. Analyse manquants
    console.log('\n[D1] === ANALYSE CHAMPS ATTENDUS ===');
    const dialogText = (await dialog.textContent()) || '';
    const expectedFields = [
      { name: 'Objet', present: /objet/i.test(dialogText) },
      { name: 'Montant', present: /montant/i.test(dialogText) },
      { name: 'Prestataire/Fournisseur', present: /prestataire|fournisseur/i.test(dialogText) },
      { name: 'Type de marché', present: /type de marché/i.test(dialogText) },
      { name: 'Type de procédure', present: /procédure/i.test(dialogText) },
      { name: 'Mode de passation', present: /mode|passation/i.test(dialogText) },
      { name: 'Nombre de lots', present: /lots/i.test(dialogText) },
      { name: 'Direction', present: /direction/i.test(dialogText) },
      { name: 'Ligne budgétaire', present: /budgétaire|budget/i.test(dialogText) },
      { name: 'Expression de Besoin (lien)', present: /expression|besoin|EB/i.test(dialogText) },
      {
        name: 'Date attribution',
        present: /date.*attribution/i.test(dialogText) || /attribution/i.test(dialogText),
      },
      { name: 'Durée exécution', present: /durée|exécution/i.test(dialogText) },
      { name: 'Date début', present: /date.*début|début/i.test(dialogText) },
      { name: 'Date fin', present: /date.*fin/i.test(dialogText) },
      { name: 'Pièces jointes', present: /pièce|jointe|PJ|fichier|upload/i.test(dialogText) },
      {
        name: 'Observations/Notes',
        present: /observation|note|commentaire|remarque/i.test(dialogText),
      },
    ];

    for (const f of expectedFields) {
      console.log(`  ${f.present ? '✅' : '❌'} ${f.name}`);
    }

    const missing = expectedFields.filter((f) => !f.present);
    console.log(
      `\n[D1] Champs présents: ${expectedFields.length - missing.length}/${expectedFields.length}`
    );
    console.log(`[D1] Champs manquants: ${missing.map((m) => m.name).join(', ') || 'aucun'}`);

    await page.keyboard.press('Escape');
    console.log('[D1] PASS');
  });

  /* ================================================================== */
  /*  D2 — Onglets par statut + compteurs                              */
  /* ================================================================== */
  test('D2 — Onglets par statut et compteurs', async ({ page }) => {
    await loginAndGoMarches(page);

    console.log('=== D2 — ONGLETS PAR STATUT ===');

    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();
    console.log(`\n[D2] Nombre d'onglets: ${tabCount}`);

    for (let i = 0; i < tabCount; i++) {
      const tab = tabs.nth(i);
      const text = await tab.textContent();
      const isSelected = await tab.getAttribute('aria-selected');

      // Cliquer sur l'onglet
      await tab.click();
      await page.waitForTimeout(2000);

      // Compter lignes
      const table = page.locator('table').first();
      const hasTable = await table.isVisible().catch(() => false);
      let rowCount = 0;
      if (hasTable) {
        rowCount = await page.locator('table tbody tr').count();
      }

      // État vide ?
      const emptyState = page.locator('text=/aucun|pas de marché|vide/i').first();
      const isEmpty = await emptyState.isVisible().catch(() => false);

      // Extraire le compteur de l'onglet
      const numMatch = text?.match(/(\d+)/);
      const tabCounter = numMatch ? parseInt(numMatch[1], 10) : -1;

      console.log(
        `  Onglet ${i + 1}: "${text?.trim()}" | selected=${isSelected} | counter=${tabCounter} | rows=${rowCount} | empty=${isEmpty}`
      );

      // Vérifier cohérence compteur vs lignes
      if (tabCounter >= 0 && hasTable) {
        const coherent = rowCount === tabCounter || (tabCounter === 0 && isEmpty);
        console.log(
          `    → Cohérence compteur/lignes: ${coherent ? '✅' : '⚠️'} (${tabCounter} vs ${rowCount})`
        );
      }
    }

    console.log('[D2] PASS');
  });

  /* ================================================================== */
  /*  D3 — Clic marché existant → page détail → onglets/sections       */
  /* ================================================================== */
  test('D3 — Détail marché : onglets et sections', async ({ page }) => {
    await loginAndGoMarches(page);

    console.log('=== D3 — DÉTAIL MARCHÉ ===');

    // S'assurer qu'on est sur l'onglet "Tous"
    const tousTab = page.getByRole('tab', { name: /tous/i }).first();
    if (await tousTab.isVisible().catch(() => false)) {
      await tousTab.click();
      await page.waitForTimeout(2000);
    }

    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    console.log(`\n[D3] Marchés visibles: ${rowCount}`);

    if (rowCount === 0) {
      console.log('[D3] SKIP — Aucun marché');
      return;
    }

    // Lire la première ligne
    const firstRow = rows.first();
    const cells = firstRow.locator('td');
    const cellCount = await cells.count();
    const cellTexts: string[] = [];
    for (let i = 0; i < cellCount; i++) {
      cellTexts.push((await cells.nth(i).textContent())?.trim() || '');
    }
    console.log(`[D3] Première ligne: ${JSON.stringify(cellTexts)}`);

    // Essayer de cliquer sur la ligne ou chercher un lien "Voir détails"
    // D'abord essayer un clic direct sur la ligne
    await firstRow.click();
    await page.waitForTimeout(2000);

    // Vérifier si un dialog/sheet/page s'est ouvert
    let detailOpened = false;
    const dialog = page.getByRole('dialog');
    const hasDialog = await dialog.isVisible().catch(() => false);
    if (hasDialog) {
      detailOpened = true;
      console.log('[D3] Détail ouvert via DIALOG');
    }

    // Ou un sheet (panneau latéral)
    const sheet = page.locator('[data-state="open"][role="dialog"], .sheet-content');
    const hasSheet = await sheet.isVisible().catch(() => false);
    if (hasSheet && !detailOpened) {
      detailOpened = true;
      console.log('[D3] Détail ouvert via SHEET');
    }

    if (!detailOpened) {
      // Essayer via le menu Actions
      console.log('[D3] Pas de détail via clic ligne, essai via menu Actions...');
      await page.goto('/marches');
      await waitForPageLoad(page);
      await page.waitForTimeout(2000);

      if (await tousTab.isVisible().catch(() => false)) {
        await tousTab.click();
        await page.waitForTimeout(2000);
      }

      const actionBtn = rows.first().locator('button').last();
      if (await actionBtn.isVisible().catch(() => false)) {
        await actionBtn.click();
        await page.waitForTimeout(1000);

        const viewDetails = page
          .locator('[role="menuitem"]')
          .filter({ hasText: /voir|détail|ouvrir/i })
          .first();
        if (await viewDetails.isVisible().catch(() => false)) {
          await viewDetails.click();
          await page.waitForTimeout(3000);

          const dialogAfter = page.getByRole('dialog');
          detailOpened = await dialogAfter.isVisible().catch(() => false);
          console.log(`[D3] Détail ouvert via menu: ${detailOpened}`);
        } else {
          console.log('[D3] Pas d\'option "Voir détails" dans le menu');
          // Lister les options du menu
          const menuItems = page.locator('[role="menuitem"]');
          const menuCount = await menuItems.count();
          for (let i = 0; i < menuCount; i++) {
            console.log(`  Menu item ${i + 1}: "${await menuItems.nth(i).textContent()}"`);
          }
          await page.keyboard.press('Escape');
        }
      }
    }

    if (detailOpened) {
      const container = page.getByRole('dialog').first();

      // Onglets dans le détail
      const detailTabs = container.locator('[role="tab"]');
      const dtCount = await detailTabs.count();
      console.log(`\n[D3] Onglets détail (${dtCount}):`);
      for (let i = 0; i < dtCount; i++) {
        const tabText = await detailTabs.nth(i).textContent();
        console.log(`  ${i + 1}. "${tabText?.trim()}"`);
      }

      // Titres/sections dans le détail
      const headings = container.locator('h2, h3, h4');
      const hCount = await headings.count();
      console.log(`\n[D3] Titres/Sections (${hCount}):`);
      for (let i = 0; i < Math.min(hCount, 15); i++) {
        console.log(`  ${i + 1}. "${await headings.nth(i).textContent()}"`);
      }

      // Cliquer sur chaque onglet et inventorier
      for (let i = 0; i < dtCount; i++) {
        const tab = detailTabs.nth(i);
        const tabName = await tab.textContent();
        await tab.click();
        await page.waitForTimeout(1500);

        // Chercher des données clés
        const tables = container.locator('table');
        const tableCount = await tables.count();
        const buttons = container.locator('button');
        const btnCount = await buttons.count();
        const links = container.locator('a');
        const linkCount = await links.count();

        console.log(`\n[D3] Onglet "${tabName?.trim()}":`);
        console.log(`  Tables: ${tableCount}, Boutons: ${btnCount}, Liens: ${linkCount}`);

        // Texte résumé
        const tabContent = await container.textContent();
        const snippet = tabContent?.substring(0, 300).replace(/\s+/g, ' ');
        console.log(`  Contenu: "${snippet?.substring(0, 200)}..."`);
      }

      await page.keyboard.press('Escape');
    } else {
      console.log("[D3] ⚠️ Impossible d'ouvrir le détail d'un marché");
    }

    console.log('[D3] PASS');
  });

  /* ================================================================== */
  /*  D4 — Menu Actions (...) → actions disponibles                    */
  /* ================================================================== */
  test('D4 — Menu Actions sur un marché', async ({ page }) => {
    await loginAndGoMarches(page);

    console.log('=== D4 — MENU ACTIONS ===');

    const tousTab = page.getByRole('tab', { name: /tous/i }).first();
    if (await tousTab.isVisible().catch(() => false)) {
      await tousTab.click();
      await page.waitForTimeout(2000);
    }

    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();

    if (rowCount === 0) {
      console.log('[D4] SKIP — Aucun marché');
      return;
    }

    // Pour chaque marché (max 3), ouvrir le menu actions
    for (let r = 0; r < Math.min(rowCount, 3); r++) {
      const row = rows.nth(r);

      // Identifier le statut
      const rowText = await row.textContent();
      console.log(`\n[D4] Marché ${r + 1}: "${rowText?.substring(0, 80)}..."`);

      // Trouver le bouton actions (dernier bouton ou bouton avec ...)
      const actionBtns = row.locator('button');
      const btnCount = await actionBtns.count();

      if (btnCount === 0) {
        console.log('  Aucun bouton action');
        continue;
      }

      // Essayer le dernier bouton (souvent le menu "...")
      const lastBtn = actionBtns.last();
      await lastBtn.click();
      await page.waitForTimeout(1000);

      // Lire les items du menu
      const menuItems = page.locator('[role="menuitem"]');
      const menuCount = await menuItems.count();
      console.log(`  Actions (${menuCount}):`);

      for (let m = 0; m < menuCount; m++) {
        const itemText = await menuItems.nth(m).textContent();
        const isDisabled = await menuItems.nth(m).getAttribute('aria-disabled');
        console.log(
          `    ${m + 1}. "${itemText?.trim()}" ${isDisabled === 'true' ? '(disabled)' : ''}`
        );
      }

      // Aussi chercher des boutons inline (pas dans le menu)
      const inlineBtns = row.locator(
        'button[title], button:has(.lucide-check), button:has(.lucide-x)'
      );
      const inlineCount = await inlineBtns.count();
      if (inlineCount > 0) {
        console.log(`  Boutons inline (${inlineCount}):`);
        for (let b = 0; b < inlineCount; b++) {
          const title = await inlineBtns.nth(b).getAttribute('title');
          const text = await inlineBtns.nth(b).textContent();
          console.log(`    - title="${title}" text="${text?.trim()}"`);
        }
      }

      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    console.log('[D4] PASS');
  });

  /* ================================================================== */
  /*  D5 — Filtres existants                                            */
  /* ================================================================== */
  test('D5 — Filtres disponibles', async ({ page }) => {
    await loginAndGoMarches(page);

    console.log('=== D5 — FILTRES ===');

    // Chercher une barre de recherche
    const searchInput = page.locator('input[placeholder*="echerch"], input[type="search"]').first();
    const hasSearch = await searchInput.isVisible().catch(() => false);
    console.log(`[D5] Barre de recherche: ${hasSearch ? '✅' : '❌'}`);
    if (hasSearch) {
      const placeholder = await searchInput.getAttribute('placeholder');
      console.log(`  Placeholder: "${placeholder}"`);
    }

    // Chercher des filtres (Select, Combobox hors dialog)
    const filterSelects = page.locator(
      'main select, main [role="combobox"], header select, header [role="combobox"]'
    );
    const filterCount = await filterSelects.count();
    console.log(`\n[D5] Filtres Select/Combobox (${filterCount}):`);
    for (let i = 0; i < filterCount; i++) {
      const el = filterSelects.nth(i);
      const text = await el.textContent();
      const id = await el.getAttribute('id');
      console.log(`  ${i + 1}. id="${id}" text="${text?.trim().substring(0, 50)}"`);
    }

    // Chercher des boutons de filtre
    const filterBtns = page.locator('button').filter({ hasText: /filtre|filter/i });
    const filterBtnCount = await filterBtns.count();
    console.log(`\n[D5] Boutons filtre (${filterBtnCount}):`);
    for (let i = 0; i < filterBtnCount; i++) {
      console.log(`  ${i + 1}. "${await filterBtns.nth(i).textContent()}"`);
    }

    // Chercher des dropdowns de filtre par contenu
    const pageText = (await page.locator('main').textContent()) || '';
    const filterKeywords = [
      { name: 'Type de marché', present: /type de marché/i.test(pageText) },
      { name: 'Type de procédure', present: /type de procédure|procédure/i.test(pageText) },
      { name: 'Direction', present: /direction/i.test(pageText) },
      { name: 'Mode de passation', present: /mode.*passation/i.test(pageText) },
      { name: 'Statut', present: /statut/i.test(pageText) },
      { name: 'Exercice', present: /exercice/i.test(pageText) },
      { name: 'Prestataire', present: /prestataire/i.test(pageText) },
      { name: 'Montant min/max', present: /montant min|montant max|fourchette/i.test(pageText) },
    ];

    console.log('\n[D5] Filtres attendus (présence dans le texte):');
    for (const f of filterKeywords) {
      console.log(`  ${f.present ? '✅' : '❌'} ${f.name}`);
    }

    // Aussi vérifier sur /execution/passation-marche
    await page.goto('/execution/passation-marche');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    const passSearch = page.locator('input[placeholder*="echerch"], input[type="search"]').first();
    const hasPassSearch = await passSearch.isVisible().catch(() => false);
    console.log(`\n[D5] /execution/passation-marche — Recherche: ${hasPassSearch ? '✅' : '❌'}`);

    const passFilters = page.locator('main select, main [role="combobox"]');
    console.log(`[D5] /execution/passation-marche — Filtres: ${await passFilters.count()}`);

    console.log('[D5] PASS');
  });

  /* ================================================================== */
  /*  D6 — Navigation Expression Besoin → Passation                    */
  /* ================================================================== */
  test('D6 — Navigation Expression Besoin → Passation (chaîne)', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);

    console.log('=== D6 — NAVIGATION EB → PASSATION ===');

    // 1. Aller sur /execution/expression-besoin
    await page.goto('/execution/expression-besoin');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);
    console.log('[D6] Page Expression de Besoin chargée');

    // 2. Chercher un lien/bouton vers Passation
    // a. Barre chaîne de dépense (breadcrumb/stepper)
    const chainLinks = page.locator('a[href*="passation"], a[href*="marche"]');
    const chainCount = await chainLinks.count();
    console.log(`[D6] Liens vers passation/marché: ${chainCount}`);
    for (let i = 0; i < chainCount; i++) {
      const href = await chainLinks.nth(i).getAttribute('href');
      const text = await chainLinks.nth(i).textContent();
      console.log(`  ${i + 1}. href="${href}" text="${text?.trim()}"`);
    }

    // b. Boutons vers passation
    const passBtns = page.locator('button').filter({ hasText: /passation|marché/i });
    const passBtnCount = await passBtns.count();
    console.log(`[D6] Boutons passation/marché: ${passBtnCount}`);
    for (let i = 0; i < passBtnCount; i++) {
      console.log(`  ${i + 1}. "${await passBtns.nth(i).textContent()}"`);
    }

    // c. Sidebar lien
    const sidebarLink = page.locator('a[href*="marches"], nav a[href*="passation"]');
    const sidebarCount = await sidebarLink.count();
    console.log(`[D6] Sidebar liens: ${sidebarCount}`);

    // 3. Vérifier la barre chaîne (stepper horizontal avec étapes)
    const stepper = page.locator(
      '[class*="chain"], [class*="stepper"], [class*="workflow"], [class*="breadcrumb"]'
    );
    const hasStepper = await stepper
      .first()
      .isVisible()
      .catch(() => false);
    console.log(`[D6] Barre chaîne/stepper visible: ${hasStepper}`);

    if (hasStepper) {
      const stepperText = await stepper.first().textContent();
      console.log(`[D6] Contenu stepper: "${stepperText?.trim().substring(0, 200)}"`);
    }

    // 4. Depuis le détail d'une EB validée, chercher un lien vers passation
    // Onglet "Validées"
    const valideesTab = page.getByRole('tab', { name: /validées/i });
    if (await valideesTab.isVisible().catch(() => false)) {
      await valideesTab.scrollIntoViewIfNeeded();
      await valideesTab.click({ force: true });
      await page.waitForTimeout(2000);

      const ebRows = page.locator('table tbody tr');
      const ebCount = await ebRows.count();
      console.log(`[D6] EB validées: ${ebCount}`);

      if (ebCount > 0) {
        // Ouvrir le menu de la première EB
        const moreBtn = ebRows.first().locator('button').last();
        if (await moreBtn.isVisible().catch(() => false)) {
          await moreBtn.click();
          await page.waitForTimeout(1000);

          // Chercher une option "Créer passation" ou "Créer marché"
          const menuItems = page.locator('[role="menuitem"]');
          const menuCount = await menuItems.count();
          console.log(`[D6] Menu EB validée (${menuCount} items):`);
          for (let i = 0; i < menuCount; i++) {
            const text = await menuItems.nth(i).textContent();
            console.log(`  ${i + 1}. "${text?.trim()}"`);
          }

          const passationItem = page
            .locator('[role="menuitem"]')
            .filter({ hasText: /passation|marché/i });
          const hasPassation = await passationItem.isVisible().catch(() => false);
          console.log(`[D6] Action "Créer passation/marché": ${hasPassation ? '✅' : '❌'}`);

          await page.keyboard.press('Escape');
        }
      }
    }

    // 5. Depuis /execution/passation-marche, vérifier que les EB validées apparaissent
    await page.goto('/execution/passation-marche');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    const aTraiterTab = page.getByRole('tab', { name: /à traiter/i });
    if (await aTraiterTab.isVisible().catch(() => false)) {
      await aTraiterTab.click();
      await page.waitForTimeout(2000);

      const passRows = page.locator('table tbody tr');
      const passCount = await passRows.count();
      console.log(`[D6] EB dans "À traiter" passation: ${passCount}`);

      const emptyMsg = page.locator('text=/aucune|vide/i').first();
      const isEmpty = await emptyMsg.isVisible().catch(() => false);
      if (isEmpty) {
        console.log('[D6] Onglet "À traiter" vide — aucune EB prête pour passation');
      }
    }

    console.log('[D6] PASS');
  });

  /* ================================================================== */
  /*  D7 — Non-régression /notes-sef + /expression-besoin              */
  /* ================================================================== */
  test('D7 — Non-régression notes-sef + expression-besoin', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);

    console.log('=== D7 — NON-RÉGRESSION ===');

    // /notes-sef
    await page.goto('/notes-sef');
    await waitForPageLoad(page);
    const sefTable = page.locator('table').first();
    const hasSef = await sefTable.isVisible({ timeout: 15_000 }).catch(() => false);
    const sefRows = hasSef ? await page.locator('table tbody tr').count() : 0;
    console.log(`[D7] /notes-sef: ${hasSef ? 'OK' : 'FAIL'} (${sefRows} lignes)`);
    expect(hasSef).toBeTruthy();

    // /execution/expression-besoin
    await page.goto('/execution/expression-besoin');
    await waitForPageLoad(page);
    const ebHeading = page.locator('text=Expressions de Besoin').first();
    const hasEB = await ebHeading.isVisible({ timeout: 15_000 }).catch(() => false);
    console.log(`[D7] /execution/expression-besoin: ${hasEB ? 'OK' : 'FAIL'}`);
    expect(hasEB).toBeTruthy();

    // Vérifier les KPIs EB
    const toutesTab = page.getByRole('tab', { name: /toutes/i });
    if (await toutesTab.isVisible().catch(() => false)) {
      const toutesText = await toutesTab.textContent();
      console.log(`[D7] EB onglet Toutes: "${toutesText}"`);
    }

    console.log('[D7] PASS — Non-régression OK');
  });
});
