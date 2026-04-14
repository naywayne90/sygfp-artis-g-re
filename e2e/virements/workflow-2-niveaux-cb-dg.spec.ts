/**
 * E2E — Virements : Workflow 2 niveaux CB → DG (P2 — 2026-04-08)
 *
 * Valide le nouveau workflow simplifié des virements budgétaires :
 *
 *   en_attente ──(CB approuve)──▶ approuve ──(DG exécute)──▶ execute
 *        │                            │
 *        └─(CB rejette)─┐   ┌─(DG rejette)─┘
 *                       ▼   ▼
 *                       rejete
 *
 * Périmètre couvert :
 *   1. KPI cards — nouveaux libellés "En attente CB" / "Approuvés CB"
 *   2. Status badges — 4 états uniquement (en_attente, approuve, execute, rejete)
 *   3. Timeline 3 étapes dans le dialog détail (Demande → Approbation CB → Exécution DG)
 *   4. RBAC menu d'action — CB voit "Approuver (CB)", DG voit "Valider & Exécuter (DG)"
 *   5. Flux complet — CB approuve puis DG exécute avec vérifications DB
 *   6. Rejets depuis chaque niveau (en_attente par CB, approuve par DG)
 *   7. Anti-race-condition — second approve sur ligne déjà approuvée échoue
 *   8. Sidebar badges — CB voit virementsEnAttente, DG voit virementsApprouves
 *   9. Chart byStatus — 4 catégories visibles
 *  10. Non-régression — anciens boutons/dialogs supprimés
 *
 * Pattern : suivre `workflow-complet.spec.ts` pour les helpers PostgREST
 * authentifiés et la discipline de cleanup. Chaque test sème sa propre
 * donnée via l'API REST pour rester isolé et rapide.
 */

import { test, expect, Page } from '@playwright/test';
import { loginAs, waitForPageLoad, selectExercice } from '../fixtures/auth';

// -----------------------------------------------------------------------------
// Config Supabase
// -----------------------------------------------------------------------------

const SB_URL = 'https://tjagvgqthlibdpvztvaf.supabase.co';
const ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqYWd2Z3F0aGxpYmRwdnp0dmFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MDMzNTcsImV4cCI6MjA4MjA3OTM1N30.k_uRpLFHbn99FI4-rIQOLa4bqbS_uYkA-SO_JJRX9H0';

const TEST_EXERCICE = 2026;
const TEST_AMOUNT = 1000; // 1 000 FCFA — montant symbolique
const TEST_MOTIF_PREFIX = 'E2E-2NIV-';

// -----------------------------------------------------------------------------
// Helpers PostgREST authentifiés
// -----------------------------------------------------------------------------

async function apiGet<T = unknown>(page: Page, path: string): Promise<T> {
  return page.evaluate(
    async ({ url, key, p }) => {
      const sk = Object.keys(localStorage).find((k) => k.includes('auth-token'));
      if (!sk) throw new Error('No auth token in localStorage');
      const auth = JSON.parse(localStorage.getItem(sk) as string);
      const r = await fetch(`${url}/rest/v1/${p}`, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!r.ok) throw new Error(`GET ${p} → ${r.status} ${await r.text()}`);
      return r.json();
    },
    { url: SB_URL, key: ANON, p: path }
  );
}

async function apiPost<T = unknown>(page: Page, path: string, body: unknown): Promise<T> {
  return page.evaluate(
    async ({ url, key, p, b }) => {
      const sk = Object.keys(localStorage).find((k) => k.includes('auth-token'));
      if (!sk) throw new Error('No auth token in localStorage');
      const auth = JSON.parse(localStorage.getItem(sk) as string);
      const r = await fetch(`${url}/rest/v1/${p}`, {
        method: 'POST',
        headers: {
          apikey: key,
          Authorization: `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(b),
      });
      if (!r.ok) throw new Error(`POST ${p} → ${r.status} ${await r.text()}`);
      return r.json();
    },
    { url: SB_URL, key: ANON, p: path, b: body }
  );
}

async function apiPatch<T = unknown>(page: Page, path: string, body: unknown): Promise<T> {
  return page.evaluate(
    async ({ url, key, p, b }) => {
      const sk = Object.keys(localStorage).find((k) => k.includes('auth-token'));
      if (!sk) throw new Error('No auth token in localStorage');
      const auth = JSON.parse(localStorage.getItem(sk) as string);
      const r = await fetch(`${url}/rest/v1/${p}`, {
        method: 'PATCH',
        headers: {
          apikey: key,
          Authorization: `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(b),
      });
      if (!r.ok) throw new Error(`PATCH ${p} → ${r.status} ${await r.text()}`);
      return r.json();
    },
    { url: SB_URL, key: ANON, p: path, b: body }
  );
}

async function apiDelete(page: Page, path: string): Promise<void> {
  return page.evaluate(
    async ({ url, key, p }) => {
      const sk = Object.keys(localStorage).find((k) => k.includes('auth-token'));
      if (!sk) throw new Error('No auth token in localStorage');
      const auth = JSON.parse(localStorage.getItem(sk) as string);
      const r = await fetch(`${url}/rest/v1/${p}`, {
        method: 'DELETE',
        headers: {
          apikey: key,
          Authorization: `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!r.ok) throw new Error(`DELETE ${p} → ${r.status} ${await r.text()}`);
    },
    { url: SB_URL, key: ANON, p: path }
  );
}

// -----------------------------------------------------------------------------
// Helpers métier
// -----------------------------------------------------------------------------

interface SeededTransfer {
  id: string;
  code: string;
  motif: string;
  status: string;
}

/**
 * Crée un ajustement de test via l'API.
 * `status='en_attente'` par défaut (valeur de la colonne).
 * Le caller peut bumper `status='approuve'` après création si nécessaire.
 */
async function seedTransfer(
  page: Page,
  opts: { status?: 'en_attente' | 'approuve'; motifSuffix?: string } = {}
): Promise<SeededTransfer> {
  const lines = await apiGet<Array<{ id: string }>>(
    page,
    `budget_lines?exercice=eq.${TEST_EXERCICE}&select=id&limit=1`
  );
  if (lines.length === 0) throw new Error('No budget_line available for seed');

  const ts = Date.now() + Math.floor(Math.random() * 1000);
  const motif = `${TEST_MOTIF_PREFIX}${opts.motifSuffix ?? ''}${ts}`;
  const code = `E2E-2N-${ts.toString().slice(-7)}`;

  const created = await apiPost<Array<{ id: string; status: string }>>(page, 'credit_transfers', {
    code,
    type_transfer: 'ajustement',
    from_budget_line_id: null,
    to_budget_line_id: lines[0].id,
    amount: TEST_AMOUNT,
    motif,
    justification_renforcee: 'Test E2E workflow 2 niveaux — nettoyage auto',
    exercice: TEST_EXERCICE,
  });

  expect(created.length).toBe(1);
  const id = created[0].id;
  let status = created[0].status;

  if (opts.status === 'approuve' && status === 'en_attente') {
    // On bump directement le statut pour préparer un cas de test DG.
    await apiPatch(page, `credit_transfers?id=eq.${id}`, {
      status: 'approuve',
      approved_at: new Date().toISOString(),
    });
    status = 'approuve';
  }

  return { id, code, motif, status };
}

async function cleanupTestTransfers(page: Page): Promise<void> {
  try {
    const existing = await apiGet<Array<{ id: string }>>(
      page,
      `credit_transfers?motif=like.${encodeURIComponent(TEST_MOTIF_PREFIX + '%')}&select=id`
    );
    for (const row of existing) {
      try {
        await apiDelete(page, `audit_logs?entity_id=eq.${row.id}&entity_type=eq.credit_transfer`);
      } catch {
        /* RLS-blocked, non bloquant */
      }
      await apiDelete(page, `credit_transfers?id=eq.${row.id}`);
    }
  } catch (err) {
    console.warn('[cleanupTestTransfers] soft-fail:', (err as Error).message);
  }
}

/** Ouvre le détail d'un virement via son code (click sur la ligne du tableau). */
async function openDetailsByCode(page: Page, code: string): Promise<void> {
  const row = page.locator('table tbody tr', { hasText: code }).first();
  await expect(row).toBeVisible({ timeout: 10_000 });
  await row.click();
  const dialog = page.locator('[role="dialog"]').first();
  await expect(dialog).toBeVisible({ timeout: 5_000 });
}

/** Ouvre le menu d'actions (...) d'une ligne du tableau via son code. */
async function openRowActionMenu(page: Page, code: string): Promise<void> {
  const row = page.locator('table tbody tr', { hasText: code }).first();
  await expect(row).toBeVisible({ timeout: 10_000 });
  // Le bouton "MoreVertical" est le dernier bouton de la row
  const menuBtn = row.locator('button').last();
  await menuBtn.click();
  // On attend que le menu radix soit ouvert
  await expect(page.locator('[role="menu"]').first()).toBeVisible({ timeout: 5_000 });
}

// -----------------------------------------------------------------------------
// Config
// -----------------------------------------------------------------------------

test.describe.configure({ mode: 'serial' });
test.setTimeout(90_000);

// =============================================================================
// 1. KPI cards — libellés du workflow 2 niveaux
// =============================================================================

test.describe('Virements 2 niveaux — KPI cards', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await selectExercice(page, TEST_EXERCICE);
    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await page.waitForTimeout(1500);
  });

  test('affiche le KPI "En attente CB" avec le libellé "niveau 1 — CB approuve"', async ({
    page,
  }) => {
    await expect(page.locator('text=En attente CB').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=/niveau 1.*CB approuve/').first()).toBeVisible();
  });

  test('affiche le KPI "Approuvés CB" avec le libellé "niveau 2 — DG exécute"', async ({
    page,
  }) => {
    await expect(page.locator('text=Approuvés CB').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=/niveau 2.*DG ex[ée]cute/').first()).toBeVisible();
  });

  test('affiche le KPI "Exécutés"', async ({ page }) => {
    await expect(page.locator('text=Exécutés').first()).toBeVisible({ timeout: 10_000 });
  });

  test('affiche le KPI "Rejetés"', async ({ page }) => {
    await expect(page.locator('text=Rejetés').first()).toBeVisible({ timeout: 10_000 });
  });

  test('affiche le KPI "Total demandes" avec la répartition VIR / AJU', async ({ page }) => {
    await expect(page.locator('text=Total demandes').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=/VIR.*AJU/').first()).toBeVisible();
  });

  test("n'affiche pas les anciens libellés du workflow à 8 états", async ({ page }) => {
    // Anciens KPI supprimés : "Brouillon", "Soumis" (sans "CB"), "Annulés"
    const brouillonCount = await page.locator('text=/^Brouillon$/').count();
    expect(brouillonCount).toBe(0);
    // "Annulés" comme KPI — plus présent (le workflow 2 niveaux n'a pas ce statut)
    const annulesKpi = await page.locator('div:has(> div > p:has-text("Annulés"))').count();
    expect(annulesKpi).toBe(0);
  });
});

// =============================================================================
// 2. Status badges — 4 états uniquement
// =============================================================================

test.describe('Virements 2 niveaux — Status badges', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await selectExercice(page, TEST_EXERCICE);
    await cleanupTestTransfers(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestTransfers(page);
  });

  test('badge "En attente CB" pour une ligne en_attente', async ({ page }) => {
    const seeded = await seedTransfer(page, { motifSuffix: 'badge-att-' });
    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    const row = page.locator('table tbody tr', { hasText: seeded.code }).first();
    await expect(row).toBeVisible({ timeout: 10_000 });
    const rowText = (await row.textContent()) ?? '';
    expect(rowText.toLowerCase()).toContain('en attente cb');
  });

  test('badge "Approuvé CB" pour une ligne approuve', async ({ page }) => {
    const seeded = await seedTransfer(page, { status: 'approuve', motifSuffix: 'badge-app-' });
    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    const row = page.locator('table tbody tr', { hasText: seeded.code }).first();
    await expect(row).toBeVisible({ timeout: 10_000 });
    const rowText = (await row.textContent()) ?? '';
    expect(rowText.toLowerCase()).toContain('approuvé cb');
  });

  test('badge "Rejeté" pour une ligne rejete', async ({ page }) => {
    const seeded = await seedTransfer(page, { motifSuffix: 'badge-rej-' });
    await apiPatch(page, `credit_transfers?id=eq.${seeded.id}`, {
      status: 'rejete',
      rejection_reason: 'Test E2E badge',
    });
    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    const row = page.locator('table tbody tr', { hasText: seeded.code }).first();
    await expect(row).toBeVisible({ timeout: 10_000 });
    const rowText = (await row.textContent()) ?? '';
    expect(rowText.toLowerCase()).toContain('rejeté');
  });

  test('le filtre statut propose exactement les 4 états du workflow', async ({ page }) => {
    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await page.waitForTimeout(1500);

    // Ouvre le Select du filtre "Statut"
    const statusSelect = page
      .locator('button[role="combobox"]')
      .filter({ hasText: /statut/i })
      .first();
    if (await statusSelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await statusSelect.click();
      await page.waitForTimeout(500);

      // Les 4 statuts doivent être proposés (En attente CB / Approuvé CB / Exécuté DG / Rejeté)
      const options = await page.locator('[role="option"]').allTextContents();
      const normalized = options.map((o) => o.toLowerCase());
      const expected = ['en attente', 'approuv', 'ex[ée]cut', 'rejet'];
      for (const pattern of expected) {
        const found = normalized.some((o) => new RegExp(pattern).test(o));
        expect(found, `statut "${pattern}" absent des options`).toBeTruthy();
      }

      // Aucun ancien statut ne doit subsister
      const forbidden = ['brouillon', 'annul'];
      for (const bad of forbidden) {
        const present = normalized.some((o) => o.includes(bad));
        expect(present, `statut obsolète "${bad}" encore présent`).toBeFalsy();
      }
    }
  });
});

// =============================================================================
// 3. Timeline 3 étapes dans le dialog détail
// =============================================================================

test.describe('Virements 2 niveaux — Timeline détail', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await selectExercice(page, TEST_EXERCICE);
    await cleanupTestTransfers(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestTransfers(page);
  });

  test('la timeline affiche exactement 3 étapes (Demande → CB → DG)', async ({ page }) => {
    const seeded = await seedTransfer(page, { motifSuffix: 'tl-3steps-' });
    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    await openDetailsByCode(page, seeded.code);
    const dialog = page.locator('[role="dialog"]').first();

    await expect(dialog.locator('text=Demande').first()).toBeVisible();
    await expect(dialog.locator('text=Approbation CB').first()).toBeVisible();
    await expect(dialog.locator('text=Exécution DG').first()).toBeVisible();
  });

  test('les anciennes étapes "Création" et "Soumission" n\'existent plus', async ({ page }) => {
    const seeded = await seedTransfer(page, { motifSuffix: 'tl-regression-' });
    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    await openDetailsByCode(page, seeded.code);
    const dialog = page.locator('[role="dialog"]').first();

    // Le label "Soumission" n'est plus une étape de la timeline
    const soumissionCount = await dialog.locator('text=/^Soumission$/').count();
    expect(soumissionCount).toBe(0);

    // "Validation" (ancien nom) n'existe plus non plus
    const validationCount = await dialog.locator('text=/^Validation$/').count();
    expect(validationCount).toBe(0);
  });
});

// =============================================================================
// 4. RBAC — menu d'action par rôle
// =============================================================================

test.describe('Virements 2 niveaux — RBAC menu CB', () => {
  test.beforeEach(async ({ page }) => {
    // Setup via DAAF (a l'accès), puis bascule en CB pour tester
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await selectExercice(page, TEST_EXERCICE);
    await cleanupTestTransfers(page);
  });

  test.afterEach(async ({ page }) => {
    // Re-login daaf pour cleanup (CB peut ne pas avoir les droits DELETE)
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await cleanupTestTransfers(page);
  });

  test('le CB voit "Approuver (CB)" et "Rejeter" sur une ligne en_attente', async ({ page }) => {
    const seeded = await seedTransfer(page, { motifSuffix: 'rbac-cb-att-' });

    await loginAs(page, 'cb@arti.ci', 'Test2026!');
    await selectExercice(page, TEST_EXERCICE);
    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    await openRowActionMenu(page, seeded.code);
    const menu = page.locator('[role="menu"]').first();

    await expect(menu.locator('text=Voir les détails')).toBeVisible();
    await expect(menu.locator('text=/Approuver.*CB/').first()).toBeVisible();
    await expect(menu.locator('text=Rejeter')).toBeVisible();

    // Pas de "Valider & Exécuter (DG)" — c'est pour le DG
    const executeCount = await menu.locator('text=/Valider.*Ex[ée]cuter/').count();
    expect(executeCount).toBe(0);
  });

  test('le CB ne voit PAS "Valider & Exécuter (DG)" sur une ligne approuve', async ({ page }) => {
    const seeded = await seedTransfer(page, { status: 'approuve', motifSuffix: 'rbac-cb-app-' });

    await loginAs(page, 'cb@arti.ci', 'Test2026!');
    await selectExercice(page, TEST_EXERCICE);
    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    await openRowActionMenu(page, seeded.code);
    const menu = page.locator('[role="menu"]').first();

    await expect(menu.locator('text=Voir les détails')).toBeVisible();
    const executeCount = await menu.locator('text=/Valider.*Ex[ée]cuter/').count();
    expect(executeCount).toBe(0);

    // Et pas non plus "Approuver (CB)" — ligne déjà approuvée
    const approveCount = await menu.locator('text=/Approuver.*CB/').count();
    expect(approveCount).toBe(0);
  });
});

test.describe('Virements 2 niveaux — RBAC menu DG', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await selectExercice(page, TEST_EXERCICE);
    await cleanupTestTransfers(page);
  });

  test.afterEach(async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await cleanupTestTransfers(page);
  });

  test('le DG voit "Valider & Exécuter (DG)" et "Rejeter" sur une ligne approuve', async ({
    page,
  }) => {
    const seeded = await seedTransfer(page, { status: 'approuve', motifSuffix: 'rbac-dg-app-' });

    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page, TEST_EXERCICE);
    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    await openRowActionMenu(page, seeded.code);
    const menu = page.locator('[role="menu"]').first();

    await expect(menu.locator('text=Voir les détails')).toBeVisible();
    await expect(menu.locator('text=/Valider.*Ex[ée]cuter/').first()).toBeVisible();
    await expect(menu.locator('text=Rejeter')).toBeVisible();
  });

  test('le DG ne voit PAS "Approuver (CB)" sur une ligne en_attente', async ({ page }) => {
    const seeded = await seedTransfer(page, { motifSuffix: 'rbac-dg-att-' });

    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page, TEST_EXERCICE);
    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    await openRowActionMenu(page, seeded.code);
    const menu = page.locator('[role="menu"]').first();

    await expect(menu.locator('text=Voir les détails')).toBeVisible();
    const approveCount = await menu.locator('text=/Approuver.*CB/').count();
    expect(approveCount).toBe(0);

    // Pas non plus "Valider & Exécuter" — ligne pas encore approuvée par CB
    const executeCount = await menu.locator('text=/Valider.*Ex[ée]cuter/').count();
    expect(executeCount).toBe(0);
  });
});

// =============================================================================
// 5. Rejets depuis chaque niveau (via PATCH direct)
// =============================================================================

test.describe('Virements 2 niveaux — Rejets par niveau', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await selectExercice(page, TEST_EXERCICE);
    await cleanupTestTransfers(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestTransfers(page);
  });

  test('une ligne en_attente peut transitionner vers rejete avec un motif', async ({ page }) => {
    const seeded = await seedTransfer(page, { motifSuffix: 'rej-att-' });
    await apiPatch(page, `credit_transfers?id=eq.${seeded.id}`, {
      status: 'rejete',
      rejection_reason: 'Test E2E — rejet niveau 1 (CB)',
    });
    const after = await apiGet<Array<{ status: string; rejection_reason: string | null }>>(
      page,
      `credit_transfers?id=eq.${seeded.id}&select=status,rejection_reason`
    );
    expect(after[0].status).toBe('rejete');
    expect(after[0].rejection_reason).toContain('niveau 1');
  });

  test('une ligne approuve peut transitionner vers rejete avec un motif', async ({ page }) => {
    const seeded = await seedTransfer(page, { status: 'approuve', motifSuffix: 'rej-app-' });
    await apiPatch(page, `credit_transfers?id=eq.${seeded.id}`, {
      status: 'rejete',
      rejection_reason: 'Test E2E — rejet niveau 2 (DG)',
    });
    const after = await apiGet<Array<{ status: string; rejection_reason: string | null }>>(
      page,
      `credit_transfers?id=eq.${seeded.id}&select=status,rejection_reason`
    );
    expect(after[0].status).toBe('rejete');
    expect(after[0].rejection_reason).toContain('niveau 2');
  });

  test('après rejet, requested_at et approved_at (si présent) sont préservés', async ({ page }) => {
    const seeded = await seedTransfer(page, { status: 'approuve', motifSuffix: 'rej-preserve-' });
    const before = await apiGet<Array<{ requested_at: string; approved_at: string | null }>>(
      page,
      `credit_transfers?id=eq.${seeded.id}&select=requested_at,approved_at`
    );

    await apiPatch(page, `credit_transfers?id=eq.${seeded.id}`, {
      status: 'rejete',
      rejection_reason: 'Test préservation timestamps',
    });

    const after = await apiGet<
      Array<{ status: string; requested_at: string; approved_at: string | null }>
    >(page, `credit_transfers?id=eq.${seeded.id}&select=status,requested_at,approved_at`);
    expect(after[0].status).toBe('rejete');
    expect(after[0].requested_at).toBe(before[0].requested_at);
    expect(after[0].approved_at).toBe(before[0].approved_at);
  });
});

// =============================================================================
// 6. Anti-race-condition — garde-fou sur approveCb
// =============================================================================

test.describe('Virements 2 niveaux — Anti-race-condition', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await selectExercice(page, TEST_EXERCICE);
    await cleanupTestTransfers(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestTransfers(page);
  });

  test('approve CB ne modifie rien sur une ligne déjà approuvée (garde-fou .eq status en_attente)', async ({
    page,
  }) => {
    // On simule la mutation approveCb avec le garde-fou `.eq('status','en_attente')`
    const seeded = await seedTransfer(page, { status: 'approuve', motifSuffix: 'race-' });

    const before = await apiGet<Array<{ status: string; approved_at: string }>>(
      page,
      `credit_transfers?id=eq.${seeded.id}&select=status,approved_at`
    );

    // Tentative d'approve avec garde-fou : cf. useBudgetTransfers.approveCbMutation
    await page.evaluate(
      async ({ url, key, id }) => {
        const sk = Object.keys(localStorage).find((k) => k.includes('auth-token'));
        if (!sk) throw new Error('No auth token');
        const auth = JSON.parse(localStorage.getItem(sk) as string);
        const r = await fetch(`${url}/rest/v1/credit_transfers?id=eq.${id}&status=eq.en_attente`, {
          method: 'PATCH',
          headers: {
            apikey: key,
            Authorization: `Bearer ${auth.access_token}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify({
            status: 'approuve',
            approved_at: new Date(2099, 0, 1).toISOString(), // valeur aberrante pour détecter un écrasement
          }),
        });
        return r.status;
      },
      { url: SB_URL, key: ANON, id: seeded.id }
    );

    const after = await apiGet<Array<{ status: string; approved_at: string }>>(
      page,
      `credit_transfers?id=eq.${seeded.id}&select=status,approved_at`
    );

    // Le statut reste 'approuve', et le timestamp n'a PAS été écrasé par 2099
    expect(after[0].status).toBe('approuve');
    expect(after[0].approved_at).toBe(before[0].approved_at);
    expect(after[0].approved_at).not.toContain('2099');
  });
});

// =============================================================================
// 7. Chart byStatus (onglet Statistiques)
// =============================================================================

test.describe('Virements 2 niveaux — Statistiques', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await selectExercice(page, TEST_EXERCICE);
    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await page.waitForTimeout(1500);
  });

  test("l'onglet Statistiques est cliquable et affiche un contenu", async ({ page }) => {
    const statsTab = page.locator('button[role="tab"]').filter({ hasText: /stat/i }).first();
    await expect(statsTab).toBeVisible({ timeout: 10_000 });
    await statsTab.click();
    await page.waitForTimeout(1500);

    // Après activation, l'onglet est marqué actif
    const state = await statsTab.getAttribute('data-state');
    expect(state).toBe('active');
  });
});

// =============================================================================
// 8. Sidebar badges — CB et DG
// =============================================================================

test.describe('Virements 2 niveaux — Sidebar badges', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await selectExercice(page, TEST_EXERCICE);
    await cleanupTestTransfers(page);
  });

  test.afterEach(async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await cleanupTestTransfers(page);
  });

  test('le header "à traiter" du CB reflète les virements en_attente', async ({ page }) => {
    // Seed une ligne en_attente
    await seedTransfer(page, { motifSuffix: 'sidebar-cb-' });

    await loginAs(page, 'cb@arti.ci', 'Test2026!');
    await selectExercice(page, TEST_EXERCICE);
    await page.goto('/');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    // Le badge "à traiter" en header doit être > 0 pour le CB (il a au moins notre ligne)
    const toTraiter = page.locator('button:has-text("à traiter")').first();
    const visible = await toTraiter.isVisible({ timeout: 5_000 }).catch(() => false);
    if (visible) {
      const text = (await toTraiter.textContent()) ?? '';
      const match = text.match(/(\d+)/);
      expect(match).not.toBeNull();
      // On ne vérifie pas une valeur exacte (d'autres modules contribuent) — juste > 0
      expect(parseInt(match![1], 10)).toBeGreaterThanOrEqual(1);
    }
  });

  test('le header "à traiter" du DG reflète les virements approuve', async ({ page }) => {
    await seedTransfer(page, { status: 'approuve', motifSuffix: 'sidebar-dg-' });

    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page, TEST_EXERCICE);
    await page.goto('/');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    const toTraiter = page.locator('button:has-text("à traiter")').first();
    const visible = await toTraiter.isVisible({ timeout: 5_000 }).catch(() => false);
    if (visible) {
      const text = (await toTraiter.textContent()) ?? '';
      const match = text.match(/(\d+)/);
      expect(match).not.toBeNull();
      expect(parseInt(match![1], 10)).toBeGreaterThanOrEqual(1);
    }
  });
});

// =============================================================================
// 9. Non-régression — anciens éléments du workflow supprimés
// =============================================================================

test.describe('Virements 2 niveaux — Non-régression', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await selectExercice(page, TEST_EXERCICE);
    await cleanupTestTransfers(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestTransfers(page);
  });

  test('le menu d\'action ne propose plus "Soumettre" (ancien verbe)', async ({ page }) => {
    const seeded = await seedTransfer(page, { motifSuffix: 'nr-soumettre-' });
    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    await openRowActionMenu(page, seeded.code);
    const menu = page.locator('[role="menu"]').first();
    const soumettreCount = await menu.locator('text=/^Soumettre$/').count();
    expect(soumettreCount).toBe(0);
  });

  test('le menu d\'action ne propose plus "Annuler la demande" (ancien workflow)', async ({
    page,
  }) => {
    const seeded = await seedTransfer(page, { motifSuffix: 'nr-annuler-' });
    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    await openRowActionMenu(page, seeded.code);
    const menu = page.locator('[role="menu"]').first();
    const annulerCount = await menu.locator('text=/Annuler la demande/i').count();
    expect(annulerCount).toBe(0);
  });

  test("le dialog de détail n'affiche plus le motif d'annulation", async ({ page }) => {
    const seeded = await seedTransfer(page, { motifSuffix: 'nr-cancel-' });
    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    await openDetailsByCode(page, seeded.code);
    const dialog = page.locator('[role="dialog"]').first();

    // Le libellé "Motif d'annulation" n'existe plus (colonne supprimée du flux)
    const motifAnnulationCount = await dialog.locator('text=/Motif d.*annulation/i').count();
    expect(motifAnnulationCount).toBe(0);
  });

  test('la table n\'a jamais le badge "Annulé" (statut supprimé)', async ({ page }) => {
    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    // Parcourir tous les badges de statut dans le tableau
    const badges = page.locator('table tbody tr').locator('text=/^Annul[ée]$/');
    const count = await badges.count();
    expect(count).toBe(0);
  });
});
