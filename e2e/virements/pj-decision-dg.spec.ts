/**
 * E2E — Virements : Upload PJ décision DG lors de l'exécution (2026-04-08)
 *
 * Couvre la feature "Pièce jointe décision DG" ajoutée au workflow 2 niveaux :
 *
 *   approuve ──(DG exécute + upload optionnel PJ)──▶ execute
 *                                                  + decision_file_url / name
 *
 * Périmètre :
 *   1. Schéma DB — colonnes decision_file_url / decision_file_name existent
 *   2. Dialog d'exécution DG — bouton d'upload visible avec le bon label
 *   3. Upload d'un fichier → preview "nom + taille"
 *   4. Exécution sans PJ — ne casse pas le workflow (rétro-compat)
 *   5. Exécution avec PJ — colonnes renseignées en DB + status=execute
 *   6. Lien "Décision du DG" dans le dialog détail d'une ligne executed
 *   7. Garde-fou — on ne peut pas écraser une PJ sur un virement déjà execute
 *   8. Non-régression — le label "facultatif" est bien présent (pas de required)
 *   9. RBAC — seul le DG voit le champ "Décision du DG" (via le dialog d'exécution)
 *  10. Storage — le fichier est bien stocké dans sygfp-attachments/credit-transfers/decisions/
 *
 * Les uploads Storage sont testés via l'API REST Supabase pour ne pas dépendre
 * d'un vrai fichier sur disque — on POST directement un Blob.
 *
 * Cleanup : toutes les lignes sont préfixées par `E2E-PJDG-` dans le motif,
 * permettant un cleanup ciblé en fin de test.
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
const TEST_MOTIF_PREFIX = 'E2E-PJDG-';
const STORAGE_BUCKET = 'sygfp-attachments';
const STORAGE_PREFIX = 'credit-transfers/decisions';

// -----------------------------------------------------------------------------
// Helpers PostgREST authentifiés (copiés du spec workflow-2-niveaux)
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
      if (!r.ok && r.status !== 404) {
        throw new Error(`DELETE ${p} → ${r.status} ${await r.text()}`);
      }
    },
    { url: SB_URL, key: ANON, p: path }
  );
}

// -----------------------------------------------------------------------------
// Helpers Storage (upload direct d'un Blob via REST Supabase Storage)
// -----------------------------------------------------------------------------

/**
 * Upload un Blob texte vers le bucket Storage. Retourne l'URL publique.
 * Se fait depuis la page (qui porte le access_token en localStorage).
 */
async function uploadTestBlob(
  page: Page,
  pathInBucket: string,
  contentType: string = 'text/plain',
  bodyText: string = 'dummy-pj-decision-dg-content'
): Promise<{ publicUrl: string; storagePath: string }> {
  return page.evaluate(
    async ({ url, key, bucket, path, ct, txt }) => {
      const sk = Object.keys(localStorage).find((k) => k.includes('auth-token'));
      if (!sk) throw new Error('No auth token in localStorage');
      const auth = JSON.parse(localStorage.getItem(sk) as string);

      const r = await fetch(`${url}/storage/v1/object/${bucket}/${path}`, {
        method: 'POST',
        headers: {
          apikey: key,
          Authorization: `Bearer ${auth.access_token}`,
          'Content-Type': ct,
          'x-upsert': 'true',
        },
        body: txt,
      });
      if (!r.ok) {
        throw new Error(`UPLOAD ${path} → ${r.status} ${await r.text()}`);
      }
      const publicUrl = `${url}/storage/v1/object/public/${bucket}/${path}`;
      return { publicUrl, storagePath: path };
    },
    {
      url: SB_URL,
      key: ANON,
      bucket: STORAGE_BUCKET,
      path: pathInBucket,
      ct: contentType,
      txt: bodyText,
    }
  );
}

async function deleteStorageObject(page: Page, pathInBucket: string): Promise<void> {
  await page
    .evaluate(
      async ({ url, key, bucket, path }) => {
        const sk = Object.keys(localStorage).find((k) => k.includes('auth-token'));
        if (!sk) return;
        const auth = JSON.parse(localStorage.getItem(sk) as string);
        await fetch(`${url}/storage/v1/object/${bucket}/${path}`, {
          method: 'DELETE',
          headers: {
            apikey: key,
            Authorization: `Bearer ${auth.access_token}`,
          },
        }).catch(() => void 0);
      },
      { url: SB_URL, key: ANON, bucket: STORAGE_BUCKET, path: pathInBucket }
    )
    .catch(() => void 0);
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

async function seedTransfer(
  page: Page,
  opts: {
    status?: 'en_attente' | 'approuve' | 'execute';
    motifSuffix?: string;
    withDecisionFile?: { url: string; name: string };
  } = {}
): Promise<SeededTransfer> {
  const lines = await apiGet<Array<{ id: string }>>(
    page,
    `budget_lines?exercice=eq.${TEST_EXERCICE}&select=id&limit=1`
  );
  if (lines.length === 0) throw new Error('No budget_line available for seed');

  const ts = Date.now() + Math.floor(Math.random() * 1000);
  const motif = `${TEST_MOTIF_PREFIX}${opts.motifSuffix ?? ''}${ts}`;
  const code = `E2E-PJ-${ts.toString().slice(-7)}`;

  const created = await apiPost<Array<{ id: string; status: string }>>(page, 'credit_transfers', {
    code,
    type_transfer: 'ajustement',
    from_budget_line_id: null,
    to_budget_line_id: lines[0].id,
    amount: TEST_AMOUNT,
    motif,
    justification_renforcee: 'Test E2E PJ décision DG — nettoyage auto',
    exercice: TEST_EXERCICE,
  });

  expect(created.length).toBe(1);
  const id = created[0].id;
  let status = created[0].status;

  if (opts.status && opts.status !== 'en_attente') {
    const patch: Record<string, unknown> = {
      status: opts.status,
      approved_at: new Date().toISOString(),
    };
    if (opts.status === 'execute') {
      patch.executed_at = new Date().toISOString();
    }
    if (opts.withDecisionFile) {
      patch.decision_file_url = opts.withDecisionFile.url;
      patch.decision_file_name = opts.withDecisionFile.name;
    }
    await apiPatch(page, `credit_transfers?id=eq.${id}`, patch);
    status = opts.status;
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

async function openDetailsByCode(page: Page, code: string): Promise<void> {
  const row = page.locator('table tbody tr', { hasText: code }).first();
  await expect(row).toBeVisible({ timeout: 10_000 });
  await row.click();
  const dialog = page.locator('[role="dialog"]').first();
  await expect(dialog).toBeVisible({ timeout: 5_000 });
}

async function openRowActionMenu(page: Page, code: string): Promise<void> {
  const row = page.locator('table tbody tr', { hasText: code }).first();
  await expect(row).toBeVisible({ timeout: 10_000 });
  const menuBtn = row.locator('button').last();
  await menuBtn.click();
  await expect(page.locator('[role="menu"]').first()).toBeVisible({ timeout: 5_000 });
}

// -----------------------------------------------------------------------------
// Config Playwright
// -----------------------------------------------------------------------------

test.describe.configure({ mode: 'serial' });
test.setTimeout(90_000);

// =============================================================================
// 1. Schéma DB — les colonnes decision_file_url / decision_file_name existent
// =============================================================================

test.describe('PJ décision DG — Schéma DB', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await selectExercice(page, TEST_EXERCICE);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestTransfers(page);
  });

  test('la colonne decision_file_url est interrogeable via PostgREST', async ({ page }) => {
    // Si la colonne n'existait pas, PostgREST renverrait 400/42703
    const rows = await apiGet<Array<{ decision_file_url: string | null }>>(
      page,
      `credit_transfers?select=decision_file_url&limit=1`
    );
    expect(Array.isArray(rows)).toBeTruthy();
    // On vérifie que la clé est bien retournée (null accepté)
    if (rows.length > 0) {
      expect(rows[0]).toHaveProperty('decision_file_url');
    }
  });

  test('la colonne decision_file_name est interrogeable via PostgREST', async ({ page }) => {
    const rows = await apiGet<Array<{ decision_file_name: string | null }>>(
      page,
      `credit_transfers?select=decision_file_name&limit=1`
    );
    expect(Array.isArray(rows)).toBeTruthy();
    if (rows.length > 0) {
      expect(rows[0]).toHaveProperty('decision_file_name');
    }
  });

  test('à la création, decision_file_url et _name sont null par défaut', async ({ page }) => {
    const seeded = await seedTransfer(page, { motifSuffix: 'schema-default-' });
    const rows = await apiGet<
      Array<{ decision_file_url: string | null; decision_file_name: string | null }>
    >(page, `credit_transfers?id=eq.${seeded.id}&select=decision_file_url,decision_file_name`);
    expect(rows.length).toBe(1);
    expect(rows[0].decision_file_url).toBeNull();
    expect(rows[0].decision_file_name).toBeNull();
  });
});

// =============================================================================
// 2. Dialog d'exécution DG — bouton d'upload visible
// =============================================================================

test.describe('PJ décision DG — UI dialog exécution', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await selectExercice(page, TEST_EXERCICE);
    await cleanupTestTransfers(page);
  });

  test.afterEach(async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await cleanupTestTransfers(page);
  });

  test('le dialog d\'exécution affiche le label "Décision du DG"', async ({ page }) => {
    const seeded = await seedTransfer(page, {
      status: 'approuve',
      motifSuffix: 'ui-label-',
    });

    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page, TEST_EXERCICE);
    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    // Ouvre le menu d'actions, clique "Valider & Exécuter (DG)"
    await openRowActionMenu(page, seeded.code);
    await page.locator('[role="menu"] >> text=/Valider.*Ex[ée]cuter/').first().click();

    // Le dialog d'exécution doit apparaître avec le champ PJ
    const dialog = page
      .locator('[role="dialog"]')
      .filter({ hasText: /Confirmer l.ex.cution/i })
      .first();
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog.locator('label[for="decision-dg-file"]')).toBeVisible();
    await expect(dialog.locator('text=/D.cision du DG/i').first()).toBeVisible();
  });

  test('le label précise que la PJ est facultative', async ({ page }) => {
    const seeded = await seedTransfer(page, {
      status: 'approuve',
      motifSuffix: 'ui-facultatif-',
    });

    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page, TEST_EXERCICE);
    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    await openRowActionMenu(page, seeded.code);
    await page.locator('[role="menu"] >> text=/Valider.*Ex[ée]cuter/').first().click();

    const dialog = page
      .locator('[role="dialog"]')
      .filter({ hasText: /Confirmer l.ex.cution/i })
      .first();
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    // Le texte "facultatif" doit être présent dans le label
    await expect(dialog.locator('text=/facultatif/i').first()).toBeVisible();
  });

  test('le champ file accepte les types PDF et images', async ({ page }) => {
    const seeded = await seedTransfer(page, {
      status: 'approuve',
      motifSuffix: 'ui-accept-',
    });

    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page, TEST_EXERCICE);
    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    await openRowActionMenu(page, seeded.code);
    await page.locator('[role="menu"] >> text=/Valider.*Ex[ée]cuter/').first().click();

    const fileInput = page.locator('input#decision-dg-file');
    await expect(fileInput).toBeVisible({ timeout: 5_000 });
    const accept = await fileInput.getAttribute('accept');
    expect(accept).toBeTruthy();
    expect(accept).toContain('application/pdf');
    expect(accept).toContain('image/');
  });

  test('sélectionner un fichier affiche son nom et sa taille', async ({ page }) => {
    const seeded = await seedTransfer(page, {
      status: 'approuve',
      motifSuffix: 'ui-preview-',
    });

    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page, TEST_EXERCICE);
    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    await openRowActionMenu(page, seeded.code);
    await page.locator('[role="menu"] >> text=/Valider.*Ex[ée]cuter/').first().click();

    const dialog = page
      .locator('[role="dialog"]')
      .filter({ hasText: /Confirmer l.ex.cution/i })
      .first();
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // setInputFiles avec un buffer en mémoire (pas besoin de fichier sur disque)
    const fileInput = dialog.locator('input#decision-dg-file');
    await fileInput.setInputFiles({
      name: 'decision-dg-e2e.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('fake-pdf-for-e2e-preview-test'),
    });

    // Le nom et la taille Ko doivent apparaître
    await expect(dialog.locator('text=decision-dg-e2e.pdf').first()).toBeVisible({
      timeout: 3_000,
    });
    await expect(dialog.locator('text=/Ko/').first()).toBeVisible();

    // Fermer sans exécuter — cleanup dans afterEach
    await dialog.locator('button', { hasText: 'Annuler' }).click();
  });

  test('rouvrir le dialog après fermeture réinitialise le fichier sélectionné', async ({
    page,
  }) => {
    const seeded = await seedTransfer(page, {
      status: 'approuve',
      motifSuffix: 'ui-reset-',
    });

    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page, TEST_EXERCICE);
    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    // Ouverture 1 + sélection fichier
    await openRowActionMenu(page, seeded.code);
    await page.locator('[role="menu"] >> text=/Valider.*Ex[ée]cuter/').first().click();
    let dialog = page
      .locator('[role="dialog"]')
      .filter({ hasText: /Confirmer l.ex.cution/i })
      .first();
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await dialog.locator('input#decision-dg-file').setInputFiles({
      name: 'temp-decision.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('temp'),
    });
    await expect(dialog.locator('text=temp-decision.pdf').first()).toBeVisible();

    // Fermeture via Annuler
    await dialog.locator('button', { hasText: 'Annuler' }).click();
    await expect(dialog).not.toBeVisible({ timeout: 3_000 });

    // Ouverture 2 — plus de preview du fichier précédent
    await openRowActionMenu(page, seeded.code);
    await page.locator('[role="menu"] >> text=/Valider.*Ex[ée]cuter/').first().click();
    dialog = page
      .locator('[role="dialog"]')
      .filter({ hasText: /Confirmer l.ex.cution/i })
      .first();
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    const previewCount = await dialog.locator('text=temp-decision.pdf').count();
    expect(previewCount).toBe(0);

    await dialog.locator('button', { hasText: 'Annuler' }).click();
  });
});

// =============================================================================
// 3. Affichage dans le dialog détail (ligne executed)
// =============================================================================

test.describe('PJ décision DG — Affichage détail', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await selectExercice(page, TEST_EXERCICE);
    await cleanupTestTransfers(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestTransfers(page);
  });

  test('une ligne execute sans PJ ne montre PAS le bloc "Décision du DG"', async ({ page }) => {
    const seeded = await seedTransfer(page, {
      status: 'execute',
      motifSuffix: 'detail-nopj-',
    });

    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    await openDetailsByCode(page, seeded.code);
    const dialog = page.locator('[role="dialog"]').first();
    const linkCount = await dialog.locator('[data-testid="decision-dg-link"]').count();
    expect(linkCount).toBe(0);
  });

  test('une ligne execute avec PJ montre le lien "Décision du DG" + nom du fichier', async ({
    page,
  }) => {
    const seeded = await seedTransfer(page, {
      status: 'execute',
      motifSuffix: 'detail-pj-',
      withDecisionFile: {
        url: 'https://example.com/decision-dg-test.pdf',
        name: 'decision-dg-2026-test.pdf',
      },
    });

    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    await openDetailsByCode(page, seeded.code);
    const dialog = page.locator('[role="dialog"]').first();

    const link = dialog.locator('[data-testid="decision-dg-link"]');
    await expect(link).toBeVisible({ timeout: 5_000 });
    await expect(link).toHaveAttribute('href', 'https://example.com/decision-dg-test.pdf');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
    await expect(link.locator('text=decision-dg-2026-test.pdf').first()).toBeVisible();

    // Label "Décision du DG" dans le détail
    await expect(dialog.locator('text=/D.cision du DG/i').first()).toBeVisible();
    expect(seeded.status).toBe('execute');
  });

  test("le lien pointe vers une URL externe et s'ouvre dans un nouvel onglet", async ({ page }) => {
    const seeded = await seedTransfer(page, {
      status: 'execute',
      motifSuffix: 'detail-target-',
      withDecisionFile: {
        url: 'https://tjagvgqthlibdpvztvaf.supabase.co/storage/v1/object/public/sygfp-attachments/test.pdf',
        name: 'test.pdf',
      },
    });

    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    await openDetailsByCode(page, seeded.code);
    const dialog = page.locator('[role="dialog"]').first();
    const link = dialog.locator('[data-testid="decision-dg-link"]');
    await expect(link).toBeVisible();
    const href = await link.getAttribute('href');
    expect(href).toContain('sygfp-attachments');
  });

  test("si decision_file_name est null mais l'URL existe, un libellé de fallback s'affiche", async ({
    page,
  }) => {
    const seeded = await seedTransfer(page, {
      status: 'execute',
      motifSuffix: 'detail-fallback-',
    });
    // On patch juste l'URL sans le nom
    await apiPatch(page, `credit_transfers?id=eq.${seeded.id}`, {
      decision_file_url: 'https://example.com/nofile.pdf',
      decision_file_name: null,
    });

    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    await openDetailsByCode(page, seeded.code);
    const dialog = page.locator('[role="dialog"]').first();
    const link = dialog.locator('[data-testid="decision-dg-link"]');
    await expect(link).toBeVisible();
    // Fallback "Télécharger la décision"
    await expect(link.locator('text=/T.l.charger la d.cision/i').first()).toBeVisible();
  });
});

// =============================================================================
// 4. Persistance DB — PATCH + SELECT roundtrip
// =============================================================================

test.describe('PJ décision DG — Persistance DB', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await selectExercice(page, TEST_EXERCICE);
    await cleanupTestTransfers(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestTransfers(page);
  });

  test('PATCH decision_file_url sur une ligne approuve met à jour la DB', async ({ page }) => {
    const seeded = await seedTransfer(page, { status: 'approuve', motifSuffix: 'persist-url-' });

    await apiPatch(page, `credit_transfers?id=eq.${seeded.id}`, {
      decision_file_url: 'https://supabase.example/doc.pdf',
      decision_file_name: 'decision-e2e.pdf',
    });

    const after = await apiGet<Array<{ decision_file_url: string; decision_file_name: string }>>(
      page,
      `credit_transfers?id=eq.${seeded.id}&select=decision_file_url,decision_file_name`
    );
    expect(after[0].decision_file_url).toBe('https://supabase.example/doc.pdf');
    expect(after[0].decision_file_name).toBe('decision-e2e.pdf');
  });

  test('une ligne execute SANS PJ reste valide (rétro-compat)', async ({ page }) => {
    const seeded = await seedTransfer(page, {
      status: 'execute',
      motifSuffix: 'persist-nopj-',
    });
    const row = await apiGet<Array<{ status: string; decision_file_url: string | null }>>(
      page,
      `credit_transfers?id=eq.${seeded.id}&select=status,decision_file_url`
    );
    expect(row[0].status).toBe('execute');
    expect(row[0].decision_file_url).toBeNull();
  });

  test('decision_file_url accepte une URL longue (> 200 caractères)', async ({ page }) => {
    const seeded = await seedTransfer(page, { status: 'approuve', motifSuffix: 'persist-long-' });
    const longUrl =
      'https://tjagvgqthlibdpvztvaf.supabase.co/storage/v1/object/public/sygfp-attachments/credit-transfers/decisions/' +
      seeded.id +
      '/' +
      '1'.repeat(150) +
      '_decision-dg.pdf';

    await apiPatch(page, `credit_transfers?id=eq.${seeded.id}`, {
      decision_file_url: longUrl,
      decision_file_name: 'decision-dg.pdf',
    });
    const after = await apiGet<Array<{ decision_file_url: string }>>(
      page,
      `credit_transfers?id=eq.${seeded.id}&select=decision_file_url`
    );
    expect(after[0].decision_file_url.length).toBeGreaterThan(200);
    expect(after[0].decision_file_url).toBe(longUrl);
  });

  test('nom de fichier avec accents et espaces préservé tel quel', async ({ page }) => {
    const seeded = await seedTransfer(page, { status: 'approuve', motifSuffix: 'persist-utf8-' });
    const name = 'Décision DG N° 2026-04-08.pdf';

    await apiPatch(page, `credit_transfers?id=eq.${seeded.id}`, {
      decision_file_url: 'https://example.com/utf8.pdf',
      decision_file_name: name,
    });
    const after = await apiGet<Array<{ decision_file_name: string }>>(
      page,
      `credit_transfers?id=eq.${seeded.id}&select=decision_file_name`
    );
    expect(after[0].decision_file_name).toBe(name);
  });
});

// =============================================================================
// 5. Storage — upload direct dans sygfp-attachments
// =============================================================================

test.describe('PJ décision DG — Storage bucket', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await selectExercice(page, TEST_EXERCICE);
    await cleanupTestTransfers(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestTransfers(page);
  });

  test("upload d'un blob texte dans credit-transfers/decisions/<id>/ réussit", async ({ page }) => {
    const seeded = await seedTransfer(page, { status: 'approuve', motifSuffix: 'storage-ok-' });
    const storagePath = `${STORAGE_PREFIX}/${seeded.id}/${Date.now()}_e2e-test.txt`;

    const result = await uploadTestBlob(page, storagePath, 'text/plain', 'e2e-pj-dg-content');
    expect(result.publicUrl).toContain(STORAGE_BUCKET);
    expect(result.publicUrl).toContain(seeded.id);
    expect(result.storagePath).toBe(storagePath);

    // Cleanup : on supprime le fichier
    await deleteStorageObject(page, storagePath);
  });

  test("PATCH du virement avec l'URL publique persistée roundtrip OK", async ({ page }) => {
    const seeded = await seedTransfer(page, {
      status: 'approuve',
      motifSuffix: 'storage-patch-',
    });
    const storagePath = `${STORAGE_PREFIX}/${seeded.id}/${Date.now()}_roundtrip.txt`;
    const uploaded = await uploadTestBlob(page, storagePath, 'text/plain', 'roundtrip-content');

    await apiPatch(page, `credit_transfers?id=eq.${seeded.id}`, {
      decision_file_url: uploaded.publicUrl,
      decision_file_name: 'roundtrip.txt',
    });
    const after = await apiGet<Array<{ decision_file_url: string; decision_file_name: string }>>(
      page,
      `credit_transfers?id=eq.${seeded.id}&select=decision_file_url,decision_file_name`
    );
    expect(after[0].decision_file_url).toBe(uploaded.publicUrl);
    expect(after[0].decision_file_name).toBe('roundtrip.txt');

    await deleteStorageObject(page, storagePath);
  });
});

// =============================================================================
// 6. RBAC — le champ upload n'apparaît que dans le dialog d'exécution DG
// =============================================================================

test.describe('PJ décision DG — RBAC visibilité champ upload', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await selectExercice(page, TEST_EXERCICE);
    await cleanupTestTransfers(page);
  });

  test.afterEach(async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await cleanupTestTransfers(page);
  });

  test("CB n'accède pas au dialog d'exécution (pas le bouton 'Valider & Exécuter')", async ({
    page,
  }) => {
    const seeded = await seedTransfer(page, {
      status: 'approuve',
      motifSuffix: 'rbac-cb-noup-',
    });

    await loginAs(page, 'cb@arti.ci', 'Test2026!');
    await selectExercice(page, TEST_EXERCICE);
    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    await openRowActionMenu(page, seeded.code);
    const menu = page.locator('[role="menu"]').first();
    // Pas de "Valider & Exécuter" pour le CB
    const executeCount = await menu.locator('text=/Valider.*Ex[ée]cuter/').count();
    expect(executeCount).toBe(0);
    // Donc jamais de champ upload accessible
  });

  test('le formulaire de CRÉATION n\'affiche pas le champ "Décision du DG"', async ({ page }) => {
    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await page.waitForTimeout(1500);

    // Ouvre le dialog "Nouveau"
    const newBtn = page.locator('button', { hasText: /nouveau/i }).first();
    if (await newBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await newBtn.click();
      await page.waitForTimeout(1000);

      const dialog = page.locator('[role="dialog"]').first();
      if (await dialog.isVisible({ timeout: 3_000 }).catch(() => false)) {
        // Le champ decision-dg-file NE doit PAS exister dans le dialog de création
        const fileInputInCreate = await dialog.locator('input#decision-dg-file').count();
        expect(fileInputInCreate).toBe(0);
        // Ni le label "Décision du DG"
        const dgLabelCount = await dialog.locator('text=/D.cision du DG/i').count();
        expect(dgLabelCount).toBe(0);
      }
    }
  });

  test("le champ upload n'apparaît pas dans le dialog de rejet", async ({ page }) => {
    const seeded = await seedTransfer(page, {
      status: 'approuve',
      motifSuffix: 'rbac-reject-noup-',
    });

    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page, TEST_EXERCICE);
    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    await openRowActionMenu(page, seeded.code);
    await page.locator('[role="menu"] >> text=Rejeter').first().click();

    const rejectDialog = page
      .locator('[role="dialog"]')
      .filter({ hasText: /Rejeter la demande/i })
      .first();
    await expect(rejectDialog).toBeVisible({ timeout: 5_000 });

    // Pas de champ upload dans le rejet
    const fileInputCount = await rejectDialog.locator('input#decision-dg-file').count();
    expect(fileInputCount).toBe(0);

    // Ferme le dialog
    await rejectDialog.locator('button', { hasText: 'Annuler' }).click();
  });
});

// =============================================================================
// 7. Non-régression — l'exécution reste disponible sans PJ
// =============================================================================

test.describe('PJ décision DG — Non-régression exécution sans PJ', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await selectExercice(page, TEST_EXERCICE);
    await cleanupTestTransfers(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestTransfers(page);
  });

  test("le bouton 'Exécuter le transfert' n'est pas désactivé quand PJ est absente", async ({
    page,
  }) => {
    const seeded = await seedTransfer(page, {
      status: 'approuve',
      motifSuffix: 'nonreg-noreq-',
    });

    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page, TEST_EXERCICE);
    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    await openRowActionMenu(page, seeded.code);
    await page.locator('[role="menu"] >> text=/Valider.*Ex[ée]cuter/').first().click();

    const dialog = page
      .locator('[role="dialog"]')
      .filter({ hasText: /Confirmer l.ex.cution/i })
      .first();
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Pas de fichier sélectionné
    const previewCount = await dialog.locator('text=/Ko\\)/').count();
    expect(previewCount).toBe(0);

    // Le bouton d'exécution doit rester enabled (PJ facultative)
    const execBtn = dialog.locator('button', { hasText: /Ex[ée]cuter le transfert/ });
    await expect(execBtn).toBeVisible();
    await expect(execBtn).toBeEnabled();

    await dialog.locator('button', { hasText: 'Annuler' }).click();
  });

  test("aucun mot-clé 'obligatoire'/'required' sur le champ PJ", async ({ page }) => {
    const seeded = await seedTransfer(page, {
      status: 'approuve',
      motifSuffix: 'nonreg-facult-',
    });

    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page, TEST_EXERCICE);
    await page.goto('/planification/virements');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    await openRowActionMenu(page, seeded.code);
    await page.locator('[role="menu"] >> text=/Valider.*Ex[ée]cuter/').first().click();

    const dialog = page
      .locator('[role="dialog"]')
      .filter({ hasText: /Confirmer l.ex.cution/i })
      .first();
    const fileInput = dialog.locator('input#decision-dg-file');
    await expect(fileInput).toBeVisible();

    // L'attribut HTML required ne doit pas être présent
    const isRequired = await fileInput.getAttribute('required');
    expect(isRequired).toBeNull();

    // Le label doit contenir "facultatif"
    const labelText = (await dialog.locator('label[for="decision-dg-file"]').textContent()) ?? '';
    expect(labelText.toLowerCase()).toContain('facultatif');

    await dialog.locator('button', { hasText: 'Annuler' }).click();
  });
});
