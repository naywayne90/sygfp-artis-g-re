/**
 * E2E — Virements : Plafond LOLF 10 % (P0 anti-corruption)
 *
 * Règle LOLF reprise par l'ARTI : la somme des virements émis depuis une ligne
 * budgétaire sur un exercice ne peut pas dépasser 10 % de sa dotation initiale.
 * Cette règle n'existait ni dans la RPC `execute_credit_transfer`, ni dans le
 * hook `useBudgetTransfers` avant le 2026-04-08.
 *
 * Ce spec couvre :
 *
 *   1. UI — Le CreateTransferDialog affiche en temps réel :
 *        - Plafond absolu (dotation × 10 %)
 *        - Cumul déjà viré
 *        - Marge restante
 *      Et une alerte rouge + bouton submit désactivé quand le montant saisi
 *      excède la marge restante.
 *
 *   2. UI — Cas limite inclusif : exactement 10 % est accepté.
 *
 *   3. UI — Micro-dépassement de 1 FCFA → refusé.
 *
 *   4. Logique pure — couverte par les tests unitaires
 *      `src/hooks/__tests__/useBudgetTransfers.test.ts` (suite
 *      `checkVirementCeiling`, ~20 cas).
 *
 * NB : on ne soumet JAMAIS un virement en DB dans ce spec. On vérifie
 * uniquement l'état du formulaire (alerte + disabled) — la couche mutation
 * est garantie par les tests unitaires.
 */

import { test, expect, Page } from '@playwright/test';
import { loginAs, waitForPageLoad, selectExercice } from '../fixtures/auth';

const SB_URL = 'https://tjagvgqthlibdpvztvaf.supabase.co';
const ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqYWd2Z3F0aGxpYmRwdnp0dmFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MDMzNTcsImV4cCI6MjA4MjA3OTM1N30.k_uRpLFHbn99FI4-rIQOLa4bqbS_uYkA-SO_JJRX9H0';

const TEST_EXERCICE = 2026;
const CEILING_RATIO = 0.1; // 10 %

// -----------------------------------------------------------------------------
// Helper : trouver une ligne budgétaire avec une grosse dotation initiale
// pour avoir des plafonds "parlants" à tester.
// -----------------------------------------------------------------------------

interface BudgetLineLite {
  id: string;
  code: string;
  label: string;
  dotation_initiale: number;
  dotation_modifiee: number | null;
}

async function findSourceLine(page: Page, opts: { minDotation: number }): Promise<BudgetLineLite> {
  const rows = await page.evaluate(
    async ({ url, key, min, exercice }) => {
      const sk = Object.keys(localStorage).find((k) => k.includes('auth-token'));
      if (!sk) throw new Error('No auth token');
      const auth = JSON.parse(localStorage.getItem(sk) as string);
      const r = await fetch(
        `${url}/rest/v1/budget_lines?exercice=eq.${exercice}&dotation_initiale=gt.${min}&select=id,code,label,dotation_initiale,dotation_modifiee&order=dotation_initiale.desc&limit=10`,
        {
          headers: {
            apikey: key,
            Authorization: `Bearer ${auth.access_token}`,
          },
        }
      );
      if (!r.ok) throw new Error(`find line → ${r.status} ${await r.text()}`);
      return r.json();
    },
    { url: SB_URL, key: ANON, min: opts.minDotation, exercice: TEST_EXERCICE }
  );
  if (!rows || rows.length === 0) {
    throw new Error(
      `Aucune ligne budgétaire avec dotation_initiale > ${opts.minDotation} pour exercice ${TEST_EXERCICE}`
    );
  }
  return rows[0] as BudgetLineLite;
}

async function findDestinationLine(page: Page, excludeId: string): Promise<BudgetLineLite> {
  const rows = await page.evaluate(
    async ({ url, key, excludeId, exercice }) => {
      const sk = Object.keys(localStorage).find((k) => k.includes('auth-token'));
      if (!sk) throw new Error('No auth token');
      const auth = JSON.parse(localStorage.getItem(sk) as string);
      const r = await fetch(
        `${url}/rest/v1/budget_lines?exercice=eq.${exercice}&id=neq.${excludeId}&select=id,code,label,dotation_initiale,dotation_modifiee&limit=1`,
        {
          headers: {
            apikey: key,
            Authorization: `Bearer ${auth.access_token}`,
          },
        }
      );
      if (!r.ok) throw new Error(`find dest → ${r.status} ${await r.text()}`);
      return r.json();
    },
    { url: SB_URL, key: ANON, excludeId, exercice: TEST_EXERCICE }
  );
  if (!rows || rows.length === 0) {
    throw new Error('Aucune ligne de destination trouvée');
  }
  return rows[0] as BudgetLineLite;
}

// -----------------------------------------------------------------------------
// Helpers UI : ouvrir le dialog, sélectionner les lignes, saisir montant.
// On contourne les Radix Select via leurs [role="option"] ; tous les inputs
// sont pilotés via les setters React natifs pour déclencher les re-renders.
// -----------------------------------------------------------------------------

async function openCreateDialog(page: Page): Promise<void> {
  await page.getByRole('button', { name: /^Nouveau$/ }).click();
  await page.waitForSelector('[role="dialog"]', { timeout: 5_000 });
}

async function selectLineInDialog(
  page: Page,
  triggerIndex: number,
  lineCode: string
): Promise<void> {
  // triggerIndex: 0 = source, 1 = destination
  const triggers = await page.locator('[role="dialog"] [role="combobox"]').all();
  await triggers[triggerIndex].click();
  // Les items chargent ~283 lignes, on filtre par texte du code
  const opt = page.locator('[role="option"]', { hasText: lineCode }).first();
  await opt.waitFor({ state: 'visible', timeout: 5_000 });
  await opt.click();
}

async function fillAmount(page: Page, amount: number): Promise<void> {
  await page.evaluate((val) => {
    const dlg = document.querySelector('[role="dialog"]');
    const input = dlg?.querySelector('input[type="number"]') as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    if (input && setter) {
      setter.call(input, String(val));
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, amount);
}

async function fillMotif(page: Page, motif: string): Promise<void> {
  await page.evaluate((val) => {
    const dlg = document.querySelector('[role="dialog"]');
    const textarea = dlg?.querySelector('textarea') as HTMLTextAreaElement;
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value'
    )?.set;
    if (textarea && setter) {
      setter.call(textarea, val);
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, motif);
}

async function getFormState(page: Page): Promise<{
  alertVisible: boolean;
  submitDisabled: boolean;
  alertText: string | null;
}> {
  return page.evaluate(() => {
    const dlg = document.querySelector('[role="dialog"]');
    const alert = dlg?.querySelector('[data-testid="ceiling-alert"]');
    const submit = [...(dlg?.querySelectorAll('button') || [])].find((b) =>
      /Cr[eé]er/i.test(b.textContent || '')
    ) as HTMLButtonElement | undefined;
    return {
      alertVisible: !!alert,
      submitDisabled: !!submit?.disabled,
      alertText: alert?.textContent || null,
    };
  });
}

async function closeDialog(page: Page): Promise<void> {
  await page
    .locator('[role="dialog"] button')
    .filter({ hasText: /Annuler/ })
    .click();
  await page.waitForSelector('[role="dialog"]', { state: 'detached', timeout: 5_000 });
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

test.describe.configure({ mode: 'serial' });
test.setTimeout(90_000);

test.describe('Virements - Plafond LOLF 10 % (P0 anti-corruption)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await selectExercice(page, TEST_EXERCICE);
    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await page.waitForTimeout(1500);
  });

  test('UI — affiche plafond, marge restante et refuse > 10 %', async ({ page }) => {
    const sourceLine = await findSourceLine(page, { minDotation: 100_000_000 });
    const destLine = await findDestinationLine(page, sourceLine.id);
    const ceiling = sourceLine.dotation_initiale * CEILING_RATIO;

    await openCreateDialog(page);
    await selectLineInDialog(page, 0, sourceLine.code);
    await selectLineInDialog(page, 1, destLine.code);

    // Vérifier que le plafond et la marge sont affichés
    const dialogText = await page.locator('[role="dialog"]').textContent();
    expect(dialogText).toMatch(/Plafond LOLF 10\s*%/);
    expect(dialogText).toMatch(/D[ée]j[aà] vir[ée]/);
    expect(dialogText).toMatch(/Marge restante/);

    // Cas 1 : 20 % de la dotation (donc > 10 %) → alerte + submit disabled
    const doubleCeiling = Math.round(ceiling * 2);
    await fillAmount(page, doubleCeiling);
    await fillMotif(page, 'Test plafond — cas 20 %');
    await page.waitForTimeout(200);

    let state = await getFormState(page);
    expect(state.alertVisible).toBe(true);
    expect(state.submitDisabled).toBe(true);
    expect(state.alertText).toMatch(/Plafond LOLF 10\s*%\s*d[ée]pass[ée]/);

    // Cas 2 : exactement le plafond → accepté (limite inclusive)
    await fillAmount(page, Math.floor(ceiling));
    await page.waitForTimeout(200);
    state = await getFormState(page);
    expect(state.alertVisible).toBe(false);
    expect(state.submitDisabled).toBe(false);

    // Cas 3 : plafond + 1 FCFA → refusé (micro-dépassement)
    await fillAmount(page, Math.floor(ceiling) + 1);
    await page.waitForTimeout(200);
    state = await getFormState(page);
    // Note : si le plafond n'est pas un entier (ex : 99 999 999.9), floor puis +1
    // peut tomber juste sous le plafond. On se protège en utilisant ceil+1 pour
    // garantir un dépassement strict.
    const overflow = Math.ceil(ceiling) + 1;
    await fillAmount(page, overflow);
    await page.waitForTimeout(200);
    state = await getFormState(page);
    expect(state.alertVisible).toBe(true);
    expect(state.submitDisabled).toBe(true);

    // Cas 4 : 1 FCFA → accepté (montant symbolique, << plafond)
    await fillAmount(page, 1);
    await page.waitForTimeout(200);
    state = await getFormState(page);
    expect(state.alertVisible).toBe(false);
    expect(state.submitDisabled).toBe(false);

    await closeDialog(page);
  });

  test('UI — libellés plafond présents dès ouverture du dialog source', async ({ page }) => {
    const sourceLine = await findSourceLine(page, { minDotation: 10_000_000 });

    await openCreateDialog(page);
    await selectLineInDialog(page, 0, sourceLine.code);

    // On ne sélectionne PAS la destination — on vérifie juste que les libellés
    // du plafond apparaissent dès que la source est choisie.
    const dialogText = await page.locator('[role="dialog"]').textContent();
    expect(dialogText).toMatch(/Dotation:/);
    expect(dialogText).toMatch(/Disponible:/);
    expect(dialogText).toMatch(/Plafond LOLF 10\s*%/);
    expect(dialogText).toMatch(/D[ée]j[aà] vir[ée]/);
    expect(dialogText).toMatch(/Marge restante/);

    // Le plafond doit contenir un montant en FCFA
    const fmt = new Intl.NumberFormat('fr-FR');
    const expectedCeiling = fmt.format(sourceLine.dotation_initiale * CEILING_RATIO);
    expect(dialogText).toContain(expectedCeiling);

    await closeDialog(page);
  });

  test('UI — switcher sur ajustement masque les contrôles plafond', async ({ page }) => {
    await openCreateDialog(page);

    // Cliquer sur l'onglet "Ajustement"
    await page
      .locator('[role="dialog"] [role="tab"]')
      .filter({ hasText: /Ajustement/ })
      .click();
    await page.waitForTimeout(300);

    // La ligne source n'apparaît plus (ajustement n'a pas de source)
    const sourceLabelVisible = await page
      .locator('[role="dialog"] label')
      .filter({ hasText: /Ligne source/ })
      .isVisible()
      .catch(() => false);
    expect(sourceLabelVisible).toBe(false);

    // Le libellé "Plafond LOLF" n'apparaît pas non plus (on affiche seulement
    // quand une source est sélectionnée — en ajustement il n'y en a pas)
    const dialogText = await page.locator('[role="dialog"]').textContent();
    expect(dialogText).not.toMatch(/Plafond LOLF 10\s*%/);

    await closeDialog(page);
  });
});
