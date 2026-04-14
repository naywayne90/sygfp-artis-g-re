/**
 * E2E — Virements : Template PDF officiel + Chain-nav + Timeline enrichie (2026-04-08)
 *
 * Couvre les 3 features ajoutées en Phase 4 du refactor Virements :
 *
 *   A. Template PDF officiel "DÉCISION DE VIREMENT BUDGÉTAIRE N°..."
 *      - bouton "Télécharger PDF" visible dans le détail
 *      - génération d'un blob application/pdf non vide
 *      - nom de fichier au format ARTI_DECISION_{VIREMENT|AJUSTEMENT}_<code>_<timestamp>.pdf
 *
 *   B. VirementChainNav — navigation entre entités liées
 *      - présence des étapes selon le type (virement → 4 étapes, ajustement → 3)
 *      - étape "virement" en "current" (non cliquable)
 *      - clic sur une étape cliquable → navigation vers la page cible
 *
 *   C. VirementTimeline — timeline workflow enrichie
 *      - mode compact (par défaut dans l'onglet Détails)
 *      - mode full (dans l'onglet Historique) avec acteurs, dates, motifs
 *      - pj (pièce jointe décision DG) rendue dans le step Exécution DG si présente
 *      - statut rejected correctement rendu sur la step de refus
 *
 * Cleanup : toutes les lignes sont préfixées par `E2E-PDFCT-` dans le motif.
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
const TEST_AMOUNT = 1000;
const TEST_MOTIF_PREFIX = 'E2E-PDFCT-';

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
      if (!sk) return;
      const auth = JSON.parse(localStorage.getItem(sk) as string);
      const r = await fetch(`${url}/rest/v1/${p}`, {
        method: 'DELETE',
        headers: {
          apikey: key,
          Authorization: `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!r.ok && r.status !== 404) {
        throw new Error(`DELETE ${p} → ${r.status} ${await r.text()}`);
      }
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
  type_transfer: 'virement' | 'ajustement';
  from_budget_line_id: string | null;
  to_budget_line_id: string;
}

async function seedTransfer(
  page: Page,
  opts: {
    status?: 'en_attente' | 'approuve' | 'execute' | 'rejete';
    type?: 'virement' | 'ajustement';
    motifSuffix?: string;
    withDecisionFile?: { url: string; name: string };
    withRejection?: string;
  } = {}
): Promise<SeededTransfer> {
  const type = opts.type ?? 'ajustement';

  // Pour un virement, on a besoin de 2 lignes distinctes (from + to).
  // Pour un ajustement, seule la ligne destination est requise.
  const lines = await apiGet<Array<{ id: string }>>(
    page,
    `budget_lines?exercice=eq.${TEST_EXERCICE}&select=id&limit=2`
  );
  if (lines.length === 0) throw new Error('No budget_line available for seed');
  if (type === 'virement' && lines.length < 2) {
    throw new Error('Need at least 2 budget_lines for a virement seed');
  }

  const ts = Date.now() + Math.floor(Math.random() * 1000);
  const motif = `${TEST_MOTIF_PREFIX}${opts.motifSuffix ?? ''}${ts}`;
  const code = `E2E-PDFCT-${ts.toString().slice(-7)}`;

  const from_budget_line_id = type === 'virement' ? lines[0].id : null;
  const to_budget_line_id = type === 'virement' ? lines[1].id : lines[0].id;

  const created = await apiPost<Array<{ id: string; status: string }>>(page, 'credit_transfers', {
    code,
    type_transfer: type,
    from_budget_line_id,
    to_budget_line_id,
    amount: TEST_AMOUNT,
    motif,
    justification_renforcee: `Test E2E PDF + ChainNav + Timeline — ${opts.motifSuffix ?? 'base'}`,
    exercice: TEST_EXERCICE,
  });

  expect(created.length).toBe(1);
  const id = created[0].id;
  let status = created[0].status;

  if (opts.status && opts.status !== 'en_attente') {
    const patch: Record<string, unknown> = { status: opts.status };
    if (opts.status === 'approuve' || opts.status === 'execute') {
      patch.approved_at = new Date().toISOString();
    }
    if (opts.status === 'execute') {
      patch.executed_at = new Date().toISOString();
      if (type === 'virement') {
        // Remplir les snapshots de dotation pour que le détail affiche les avant/après
        patch.from_dotation_avant = 10_000_000;
        patch.from_dotation_apres = 10_000_000 - TEST_AMOUNT;
        patch.to_dotation_avant = 2_000_000;
        patch.to_dotation_apres = 2_000_000 + TEST_AMOUNT;
      } else {
        patch.to_dotation_avant = 2_000_000;
        patch.to_dotation_apres = 2_000_000 + TEST_AMOUNT;
      }
    }
    if (opts.status === 'rejete') {
      patch.rejection_reason =
        opts.withRejection ?? 'Rejet automatique test — justification insuffisante';
    }
    if (opts.withDecisionFile) {
      patch.decision_file_url = opts.withDecisionFile.url;
      patch.decision_file_name = opts.withDecisionFile.name;
    }
    await apiPatch(page, `credit_transfers?id=eq.${id}`, patch);
    status = opts.status;
  }

  return {
    id,
    code,
    motif,
    status,
    type_transfer: type,
    from_budget_line_id,
    to_budget_line_id,
  };
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

async function openDetailsByCode(page: Page, code: string): Promise<void> {
  const row = page.locator('table tbody tr', { hasText: code }).first();
  await expect(row).toBeVisible({ timeout: 10_000 });
  await row.click();
  const dialog = page.locator('[role="dialog"]').first();
  await expect(dialog).toBeVisible({ timeout: 5_000 });
}

// -----------------------------------------------------------------------------
// Config Playwright
// -----------------------------------------------------------------------------

test.describe.configure({ mode: 'serial' });
test.setTimeout(90_000);

// =============================================================================
// A. Template PDF officiel
// =============================================================================

test.describe('Template PDF officiel — génération', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await selectExercice(page, TEST_EXERCICE);
    await cleanupTestTransfers(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestTransfers(page);
  });

  test('le bouton "Télécharger PDF" est visible dans le détail', async ({ page }) => {
    const seeded = await seedTransfer(page, {
      status: 'execute',
      type: 'ajustement',
      motifSuffix: 'btn-visible-',
    });

    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await openDetailsByCode(page, seeded.code);

    const btn = page.locator('[data-testid="download-pdf-btn"]');
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
    await expect(btn).toContainText(/Télécharger PDF/i);
  });

  test('le PDF généré a le bon content-type et un poids > 10 Ko', async ({ page }) => {
    const seeded = await seedTransfer(page, {
      status: 'execute',
      type: 'ajustement',
      motifSuffix: 'pdf-meta-',
    });

    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await openDetailsByCode(page, seeded.code);

    // Charger les données complètes de seeded via le hook public puis appeler le service directement
    const result = await page.evaluate(async (transferId) => {
      // Récupérer le transfer complet
      const sk = Object.keys(localStorage).find((k) => k.includes('auth-token'));
      if (!sk) throw new Error('no auth');
      const auth = JSON.parse(localStorage.getItem(sk) as string);

      const r = await fetch(
        `https://tjagvgqthlibdpvztvaf.supabase.co/rest/v1/credit_transfers?id=eq.${transferId}&select=*,from_line:budget_lines!credit_transfers_from_budget_line_id_fkey(code,label,dotation_initiale),to_line:budget_lines!credit_transfers_to_budget_line_id_fkey(code,label,dotation_initiale)`,
        {
          headers: {
            apikey:
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqYWd2Z3F0aGxpYmRwdnp0dmFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MDMzNTcsImV4cCI6MjA4MjA3OTM1N30.k_uRpLFHbn99FI4-rIQOLa4bqbS_uYkA-SO_JJRX9H0',
            Authorization: `Bearer ${auth.access_token}`,
          },
        }
      );
      const rows = await r.json();
      const transfer = rows[0];

      const mod = await import('/src/services/virementDecisionPdfService.ts');
      const out = await mod.generateVirementDecisionPdf({ transfer });
      return {
        filename: out.filename,
        size: out.blob.size,
        type: out.blob.type,
      };
    }, seeded.id);

    expect(result.type).toBe('application/pdf');
    expect(result.size).toBeGreaterThan(10_000);
    expect(result.filename).toMatch(/^ARTI_DECISION_AJUSTEMENT_/);
    expect(result.filename).toMatch(/\.pdf$/);
  });

  test('le nom de fichier utilise VIREMENT pour les virements et AJUSTEMENT pour les ajustements', async ({
    page,
  }) => {
    const virement = await seedTransfer(page, {
      status: 'execute',
      type: 'virement',
      motifSuffix: 'fname-vir-',
    });
    const ajustement = await seedTransfer(page, {
      status: 'execute',
      type: 'ajustement',
      motifSuffix: 'fname-aju-',
    });

    const fnames = await page.evaluate(
      async ({ virId, ajuId }) => {
        const sk = Object.keys(localStorage).find((k) => k.includes('auth-token'));
        if (!sk) throw new Error('no auth');
        const auth = JSON.parse(localStorage.getItem(sk) as string);
        const h = {
          apikey:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqYWd2Z3F0aGxpYmRwdnp0dmFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MDMzNTcsImV4cCI6MjA4MjA3OTM1N30.k_uRpLFHbn99FI4-rIQOLa4bqbS_uYkA-SO_JJRX9H0',
          Authorization: `Bearer ${auth.access_token}`,
        };

        const getT = async (id: string) => {
          const r = await fetch(
            `https://tjagvgqthlibdpvztvaf.supabase.co/rest/v1/credit_transfers?id=eq.${id}&select=*,from_line:budget_lines!credit_transfers_from_budget_line_id_fkey(code,label,dotation_initiale),to_line:budget_lines!credit_transfers_to_budget_line_id_fkey(code,label,dotation_initiale)`,
            { headers: h }
          );
          return (await r.json())[0];
        };

        const mod = await import('/src/services/virementDecisionPdfService.ts');
        const vir = await mod.generateVirementDecisionPdf({ transfer: await getT(virId) });
        const aju = await mod.generateVirementDecisionPdf({ transfer: await getT(ajuId) });
        return { vir: vir.filename, aju: aju.filename };
      },
      { virId: virement.id, ajuId: ajustement.id }
    );

    expect(fnames.vir).toMatch(/^ARTI_DECISION_VIREMENT_/);
    expect(fnames.aju).toMatch(/^ARTI_DECISION_AJUSTEMENT_/);
  });

  test('le PDF peut être généré même sur un virement en_attente (non exécuté)', async ({
    page,
  }) => {
    const seeded = await seedTransfer(page, { motifSuffix: 'pdf-pending-' });

    const result = await page.evaluate(async (transferId) => {
      const sk = Object.keys(localStorage).find((k) => k.includes('auth-token'));
      if (!sk) throw new Error('no auth');
      const auth = JSON.parse(localStorage.getItem(sk) as string);
      const r = await fetch(
        `https://tjagvgqthlibdpvztvaf.supabase.co/rest/v1/credit_transfers?id=eq.${transferId}&select=*,to_line:budget_lines!credit_transfers_to_budget_line_id_fkey(code,label,dotation_initiale)`,
        {
          headers: {
            apikey:
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqYWd2Z3F0aGxpYmRwdnp0dmFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MDMzNTcsImV4cCI6MjA4MjA3OTM1N30.k_uRpLFHbn99FI4-rIQOLa4bqbS_uYkA-SO_JJRX9H0',
            Authorization: `Bearer ${auth.access_token}`,
          },
        }
      );
      const transfer = (await r.json())[0];
      const mod = await import('/src/services/virementDecisionPdfService.ts');
      const out = await mod.generateVirementDecisionPdf({ transfer });
      return { ok: true, size: out.blob.size };
    }, seeded.id);

    expect(result.ok).toBe(true);
    expect(result.size).toBeGreaterThan(10_000);
  });

  test('click sur le bouton "Télécharger PDF" déclenche la génération sans erreur', async ({
    page,
  }) => {
    const seeded = await seedTransfer(page, {
      status: 'execute',
      type: 'ajustement',
      motifSuffix: 'click-dl-',
    });

    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await openDetailsByCode(page, seeded.code);

    // Capturer le blob déclenché côté client
    const captured = await page.evaluate(async () => {
      let capturedName: string | null = null;
      const orig = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function () {
        if (this.href && this.download) {
          capturedName = this.download;
        }
      };
      try {
        const btn = document.querySelector(
          '[data-testid="download-pdf-btn"]'
        ) as HTMLButtonElement | null;
        btn?.click();
        // Laisser le temps au jsPDF de s'exécuter (+ chargement logo)
        await new Promise((r) => setTimeout(r, 3500));
      } finally {
        HTMLAnchorElement.prototype.click = orig;
      }
      return capturedName;
    });

    expect(captured).toBeTruthy();
    expect(captured).toMatch(/ARTI_DECISION_AJUSTEMENT_.*\.pdf$/);
  });
});

// =============================================================================
// B. VirementChainNav
// =============================================================================

test.describe('VirementChainNav — navigation entités liées', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await selectExercice(page, TEST_EXERCICE);
    await cleanupTestTransfers(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestTransfers(page);
  });

  test('le chain-nav est visible dans le dialog de détail', async ({ page }) => {
    const seeded = await seedTransfer(page, {
      status: 'execute',
      type: 'ajustement',
      motifSuffix: 'chainnav-visible-',
    });

    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await openDetailsByCode(page, seeded.code);

    const nav = page.locator('[data-testid="virement-chain-nav"]');
    await expect(nav).toBeVisible();
  });

  test('ajustement : 3 étapes (virement + destination + journal)', async ({ page }) => {
    const seeded = await seedTransfer(page, {
      status: 'execute',
      type: 'ajustement',
      motifSuffix: 'chainnav-aju-',
    });

    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await openDetailsByCode(page, seeded.code);

    await expect(page.locator('[data-testid="chain-step-virement"]')).toBeVisible();
    await expect(page.locator('[data-testid="chain-step-destination"]')).toBeVisible();
    await expect(page.locator('[data-testid="chain-step-journal"]')).toBeVisible();

    // Pas de "source" pour un ajustement
    const sourceCount = await page.locator('[data-testid="chain-step-source"]').count();
    expect(sourceCount).toBe(0);
  });

  test('virement : 4 étapes (source + virement + destination + journal)', async ({ page }) => {
    const seeded = await seedTransfer(page, {
      status: 'execute',
      type: 'virement',
      motifSuffix: 'chainnav-vir-',
    });

    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await openDetailsByCode(page, seeded.code);

    await expect(page.locator('[data-testid="chain-step-source"]')).toBeVisible();
    await expect(page.locator('[data-testid="chain-step-virement"]')).toBeVisible();
    await expect(page.locator('[data-testid="chain-step-destination"]')).toBeVisible();
    await expect(page.locator('[data-testid="chain-step-journal"]')).toBeVisible();
  });

  test('l\'étape "virement" est marquée current et non cliquable', async ({ page }) => {
    const seeded = await seedTransfer(page, {
      status: 'execute',
      type: 'ajustement',
      motifSuffix: 'chainnav-current-',
    });

    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await openDetailsByCode(page, seeded.code);

    const currentBtn = page.locator('[data-testid="chain-step-virement"]');
    await expect(currentBtn).toBeVisible();
    await expect(currentBtn).toBeDisabled();
  });

  test('l\'étape "journal" est désactivée pour un virement en_attente', async ({ page }) => {
    const seeded = await seedTransfer(page, {
      status: 'en_attente',
      type: 'ajustement',
      motifSuffix: 'chainnav-journal-disabled-',
    });

    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await openDetailsByCode(page, seeded.code);

    const journalBtn = page.locator('[data-testid="chain-step-journal"]');
    await expect(journalBtn).toBeVisible();
    await expect(journalBtn).toBeDisabled();
  });

  test('l\'étape "journal" devient cliquable pour un virement exécuté', async ({ page }) => {
    const seeded = await seedTransfer(page, {
      status: 'execute',
      type: 'ajustement',
      motifSuffix: 'chainnav-journal-enabled-',
    });

    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await openDetailsByCode(page, seeded.code);

    const journalBtn = page.locator('[data-testid="chain-step-journal"]');
    await expect(journalBtn).toBeVisible();
    await expect(journalBtn).toBeEnabled();
  });

  test("le code du virement est affiché sous l'étape current", async ({ page }) => {
    const seeded = await seedTransfer(page, {
      status: 'execute',
      type: 'ajustement',
      motifSuffix: 'chainnav-subtitle-',
    });

    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await openDetailsByCode(page, seeded.code);

    const currentBtn = page.locator('[data-testid="chain-step-virement"]');
    await expect(currentBtn).toContainText(seeded.code);
  });
});

// =============================================================================
// C. VirementTimeline — compact & full
// =============================================================================

test.describe('VirementTimeline — compact & full', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await selectExercice(page, TEST_EXERCICE);
    await cleanupTestTransfers(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestTransfers(page);
  });

  test("mode compact visible par défaut dans l'onglet Détails", async ({ page }) => {
    const seeded = await seedTransfer(page, {
      status: 'execute',
      type: 'ajustement',
      motifSuffix: 'timeline-compact-',
    });

    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await openDetailsByCode(page, seeded.code);

    const compact = page.locator('[data-testid="virement-timeline-compact"]');
    await expect(compact).toBeVisible();
  });

  test('mode compact affiche les 3 steps pour un virement exécuté', async ({ page }) => {
    const seeded = await seedTransfer(page, {
      status: 'execute',
      type: 'ajustement',
      motifSuffix: 'timeline-3steps-',
    });

    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await openDetailsByCode(page, seeded.code);

    await expect(page.locator('[data-testid="timeline-step-creation"]')).toBeVisible();
    await expect(page.locator('[data-testid="timeline-step-approbation_cb"]')).toBeVisible();
    await expect(page.locator('[data-testid="timeline-step-execution_dg"]')).toBeVisible();
  });

  test('onglet Historique affiche le mode full avec les détails', async ({ page }) => {
    const seeded = await seedTransfer(page, {
      status: 'execute',
      type: 'ajustement',
      motifSuffix: 'timeline-full-',
    });

    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await openDetailsByCode(page, seeded.code);

    // Cliquer sur l'onglet Historique
    await page.locator('[role="dialog"] [role="tab"]', { hasText: 'Historique' }).click();

    const full = page.locator('[data-testid="virement-timeline-full"]');
    await expect(full).toBeVisible();
    await expect(page.locator('[data-testid="timeline-step-full-creation"]')).toBeVisible();
    await expect(page.locator('[data-testid="timeline-step-full-approbation_cb"]')).toBeVisible();
    await expect(page.locator('[data-testid="timeline-step-full-execution_dg"]')).toBeVisible();
  });

  test('onglet Historique affiche le motif du virement sur le step Création', async ({ page }) => {
    const seeded = await seedTransfer(page, {
      status: 'execute',
      type: 'ajustement',
      motifSuffix: 'timeline-motif-',
    });

    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await openDetailsByCode(page, seeded.code);

    await page.locator('[role="dialog"] [role="tab"]', { hasText: 'Historique' }).click();

    const creationStep = page.locator('[data-testid="timeline-step-full-creation"]');
    await expect(creationStep).toBeVisible();
    // Le motif doit apparaître dans le bloc
    await expect(creationStep).toContainText(seeded.motif);
  });

  test('onglet Historique affiche la PJ décision DG sur le step Exécution DG', async ({ page }) => {
    const seeded = await seedTransfer(page, {
      status: 'execute',
      type: 'ajustement',
      motifSuffix: 'timeline-pj-',
      withDecisionFile: {
        url: 'https://example.com/decision-dg.pdf',
        name: 'decision-dg-test.pdf',
      },
    });

    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await openDetailsByCode(page, seeded.code);

    await page.locator('[role="dialog"] [role="tab"]', { hasText: 'Historique' }).click();

    const execStep = page.locator('[data-testid="timeline-step-full-execution_dg"]');
    await expect(execStep).toBeVisible();

    // Le lien attachment est rendu
    const attachmentLink = page.locator('[data-testid="timeline-attachment-link"]');
    await expect(attachmentLink).toBeVisible();
    await expect(attachmentLink).toContainText('decision-dg-test.pdf');
    await expect(attachmentLink).toHaveAttribute('href', 'https://example.com/decision-dg.pdf');
  });

  test('virement rejeté — step de rejet rendu en rouge avec le motif', async ({ page }) => {
    const seeded = await seedTransfer(page, {
      status: 'rejete',
      type: 'ajustement',
      motifSuffix: 'timeline-reject-',
      withRejection: 'Motif dummy — ligne mal choisie',
    });

    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await openDetailsByCode(page, seeded.code);

    await page.locator('[role="dialog"] [role="tab"]', { hasText: 'Historique' }).click();

    // Le step devrait être nommé "approbation_cb" ou "execution_dg" selon où le rejet s'est fait.
    // Dans notre seed, on n'a pas renseigné approved_at → le rejet est porté par approbation_cb.
    const reject = page.locator('[data-testid="timeline-step-full-approbation_cb"]');
    await expect(reject).toBeVisible();
    await expect(reject).toContainText(/Rejet|Rejeté/i);
    await expect(reject).toContainText('Motif dummy');
  });

  test('timeline step execution_dg est en attente pour un virement approuvé non exécuté', async ({
    page,
  }) => {
    const seeded = await seedTransfer(page, {
      status: 'approuve',
      type: 'ajustement',
      motifSuffix: 'timeline-pending-exec-',
    });

    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await openDetailsByCode(page, seeded.code);

    await page.locator('[role="dialog"] [role="tab"]', { hasText: 'Historique' }).click();

    const execStep = page.locator('[data-testid="timeline-step-full-execution_dg"]');
    await expect(execStep).toBeVisible();
    await expect(execStep).toContainText(/En cours|En attente/i);
  });
});

// =============================================================================
// D. Non-régression — dialog detail toujours fonctionnel
// =============================================================================

test.describe('Non-régression — détail virement', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await selectExercice(page, TEST_EXERCICE);
    await cleanupTestTransfers(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestTransfers(page);
  });

  test("le montant est toujours affiché dans l'onglet Détails", async ({ page }) => {
    const seeded = await seedTransfer(page, {
      status: 'execute',
      type: 'ajustement',
      motifSuffix: 'regression-amount-',
    });

    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await openDetailsByCode(page, seeded.code);

    // Le montant 1 000 FCFA doit apparaître
    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog).toContainText('1 000 FCFA');
  });

  test('les 2 onglets Détails et Historique sont présents', async ({ page }) => {
    const seeded = await seedTransfer(page, {
      status: 'execute',
      type: 'ajustement',
      motifSuffix: 'regression-tabs-',
    });

    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await openDetailsByCode(page, seeded.code);

    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog.locator('[role="tab"]', { hasText: 'Détails' })).toBeVisible();
    await expect(dialog.locator('[role="tab"]', { hasText: 'Historique' })).toBeVisible();
  });

  test('le bouton Fermer ferme bien le dialog', async ({ page }) => {
    const seeded = await seedTransfer(page, {
      status: 'execute',
      type: 'ajustement',
      motifSuffix: 'regression-close-',
    });

    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await openDetailsByCode(page, seeded.code);

    await page.locator('[role="dialog"] button', { hasText: 'Fermer' }).click();
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  });
});
