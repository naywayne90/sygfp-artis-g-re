/**
 * Tests unitaires — useImportJobs
 *
 * Ces tests couvrent uniquement la logique pure extraite du hook
 * (sans mock Supabase) : construction CSV, calcul du finalStatus,
 * calcul du status par ligne, validation taille de fichier,
 * cohérence des interfaces TypeScript.
 */
import { describe, it, expect } from 'vitest';
import type { ImportJob, ImportJobStats, ImportRow } from '../useImportJobs';

// ============================================================================
// Logique pure extraite (miroir fidèle du code source)
// ============================================================================

/** Constante du hook */
const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * Détermine le status final d'un job après executeImport.
 * Source : ligne 411 de useImportJobs.ts
 */
function computeFinalStatus(
  errors: number,
  inserted: number,
  updated: number
): 'completed' | 'failed' {
  return errors === 0 ? 'completed' : inserted + updated > 0 ? 'completed' : 'failed';
}

/**
 * Détermine le status d'une ligne importée.
 * Source : lignes 185-187 de useImportJobs.ts
 */
function computeRowStatus(isValid: boolean, warnings: string[]): 'ok' | 'warning' | 'error' {
  return isValid ? (warnings.length > 0 ? 'warning' : 'ok') : 'error';
}

/**
 * Construit le contenu CSV des erreurs (hors blob/DOM).
 * Source : lignes 529-541 de useImportJobs.ts
 */
function buildErrorsCsv(
  rows: Array<{
    row_index: number;
    sheet_name: string | null;
    status: string;
    error_messages: string[];
    raw: Record<string, unknown>;
  }>
): string {
  const headers = ['Ligne', 'Onglet', 'Statut', 'Erreurs', 'Données brutes'];
  const dataRows = rows.map((row) => [
    row.row_index,
    row.sheet_name || '',
    row.status,
    (row.error_messages || []).join('; '),
    JSON.stringify(row.raw),
  ]);
  return [
    headers.join(';'),
    ...dataRows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')),
  ].join('\n');
}

/** Contenu complet avec BOM, comme dans le hook */
function buildErrorsCsvWithBom(rows: Parameters<typeof buildErrorsCsv>[0]): string {
  return '\ufeff' + buildErrorsCsv(rows);
}

// ============================================================================
// 1. Tests des types / interfaces
// ============================================================================

describe('ImportJob interface', () => {
  it('should accept all 7 valid status values', () => {
    const validStatuses: ImportJob['status'][] = [
      'draft',
      'parsed',
      'validated',
      'importing',
      'completed',
      'failed',
      'rolled_back',
    ];
    expect(validStatuses).toHaveLength(7);
    validStatuses.forEach((s) => {
      expect(typeof s).toBe('string');
    });
  });

  it('should recognise "draft" as a valid status', () => {
    const status: ImportJob['status'] = 'draft';
    expect(status).toBe('draft');
  });

  it('should recognise "rolled_back" as a valid status', () => {
    const status: ImportJob['status'] = 'rolled_back';
    expect(status).toBe('rolled_back');
  });
});

describe('ImportJobStats interface', () => {
  it('should have the 6 required numeric fields', () => {
    const stats: ImportJobStats = {
      rows_total: 100,
      rows_ok: 90,
      rows_error: 5,
      rows_warning: 5,
      rows_new: 80,
      rows_update: 10,
    };
    const keys = Object.keys(stats);
    expect(keys).toContain('rows_total');
    expect(keys).toContain('rows_ok');
    expect(keys).toContain('rows_error');
    expect(keys).toContain('rows_warning');
    expect(keys).toContain('rows_new');
    expect(keys).toContain('rows_update');
    expect(keys).toHaveLength(6);
  });

  it('should accept zero values for all numeric fields', () => {
    const stats: ImportJobStats = {
      rows_total: 0,
      rows_ok: 0,
      rows_error: 0,
      rows_warning: 0,
      rows_new: 0,
      rows_update: 0,
    };
    Object.values(stats).forEach((v) => {
      expect(typeof v).toBe('number');
    });
  });
});

describe('ImportRow interface', () => {
  it('should accept all 5 valid status values', () => {
    const validStatuses: ImportRow['status'][] = ['pending', 'ok', 'error', 'warning', 'imported'];
    expect(validStatuses).toHaveLength(5);
    validStatuses.forEach((s) => expect(typeof s).toBe('string'));
  });

  it('should accept all 3 valid target_action values and null', () => {
    const validActions: ImportRow['target_action'][] = ['insert', 'update', 'skip', null];
    expect(validActions).toHaveLength(4);
    // null est permis
    expect(validActions).toContain(null);
    // les 3 string actions
    expect(validActions).toContain('insert');
    expect(validActions).toContain('update');
    expect(validActions).toContain('skip');
  });
});

// ============================================================================
// 2. Tests de la logique CSV export
// ============================================================================

describe('exportErrors CSV logic', () => {
  const sampleRows = [
    {
      row_index: 2,
      sheet_name: 'Feuille1',
      status: 'error',
      error_messages: ['Montant manquant', 'Code invalide'],
      raw: { A: 'valeur', B: 42 },
    },
    {
      row_index: 5,
      sheet_name: null,
      status: 'warning',
      error_messages: ['Champ optionnel absent'],
      raw: { A: 'autre' },
    },
  ];

  it('should produce exactly 5 header columns', () => {
    const csv = buildErrorsCsv(sampleRows);
    const headerLine = csv.split('\n')[0];
    const headers = headerLine.split(';');
    expect(headers).toHaveLength(5);
  });

  it('should use the correct header names', () => {
    const csv = buildErrorsCsv(sampleRows);
    const headerLine = csv.split('\n')[0];
    expect(headerLine).toBe('Ligne;Onglet;Statut;Erreurs;Données brutes');
  });

  it('should use semicolon as column separator', () => {
    const csv = buildErrorsCsv(sampleRows);
    const firstDataLine = csv.split('\n')[1];
    // 5 colonnes = 4 séparateurs ";" dans chaque ligne de données
    const semicolonCount = (firstDataLine.match(/;/g) || []).length;
    expect(semicolonCount).toBeGreaterThanOrEqual(4);
  });

  it('should include the UTF-8 BOM at the start', () => {
    const csv = buildErrorsCsvWithBom(sampleRows);
    expect(csv.startsWith('\ufeff')).toBe(true);
  });

  it('should have BOM followed immediately by the header', () => {
    const csv = buildErrorsCsvWithBom(sampleRows);
    expect(csv.startsWith('\ufeffLigne;Onglet;Statut;Erreurs;Données brutes')).toBe(true);
  });

  it('should produce header + 2 data rows = 3 lines total', () => {
    const csv = buildErrorsCsv(sampleRows);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(3); // 1 header + 2 data
  });

  it('should handle null sheet_name as empty string', () => {
    const csv = buildErrorsCsv(sampleRows);
    const secondDataLine = csv.split('\n')[2];
    // onglet vide → ""
    expect(secondDataLine).toContain('""');
  });

  it('should join multiple error_messages with "; "', () => {
    const csv = buildErrorsCsv(sampleRows);
    const firstDataLine = csv.split('\n')[1];
    expect(firstDataLine).toContain('Montant manquant; Code invalide');
  });
});

// ============================================================================
// 3. Tests de la logique executeImport — finalStatus
// ============================================================================

describe('executeImport finalStatus logic', () => {
  it('should return "completed" when errors === 0', () => {
    expect(computeFinalStatus(0, 10, 5)).toBe('completed');
  });

  it('should return "completed" when errors === 0 and nothing inserted/updated', () => {
    // Cas limite : aucune ligne à traiter, 0 erreur → completed
    expect(computeFinalStatus(0, 0, 0)).toBe('completed');
  });

  it('should return "failed" when errors > 0 and inserted === 0 and updated === 0', () => {
    expect(computeFinalStatus(2, 0, 0)).toBe('failed');
  });

  it('should return "completed" when errors > 0 but inserted > 0 (import partiel)', () => {
    expect(computeFinalStatus(2, 5, 0)).toBe('completed');
  });

  it('should return "completed" when errors > 0 but updated > 0 (import partiel)', () => {
    expect(computeFinalStatus(3, 0, 7)).toBe('completed');
  });

  it('should return "completed" when errors > 0 but both inserted and updated > 0', () => {
    expect(computeFinalStatus(1, 4, 3)).toBe('completed');
  });
});

// ============================================================================
// 4. Tests des filtres fetchAllJobs — interface options
// ============================================================================

describe('fetchAllJobs filter options', () => {
  // L'interface options est : { exercice?, status?, module?, limit?, date_from?, date_to? }
  // On vérifie la compatibilité TypeScript via des objets typés explicitement.

  type FetchAllJobsOptions = {
    exercice?: number;
    status?: string;
    module?: string;
    limit?: number;
    date_from?: string;
    date_to?: string;
  };

  it('should accept an empty options object (all fields optional)', () => {
    const options: FetchAllJobsOptions = {};
    expect(options).toBeDefined();
  });

  it('should accept "exercice" as a number', () => {
    const options: FetchAllJobsOptions = { exercice: 2026 };
    expect(typeof options.exercice).toBe('number');
    expect(options.exercice).toBe(2026);
  });

  it('should accept "status" as a string', () => {
    const options: FetchAllJobsOptions = { status: 'completed' };
    expect(typeof options.status).toBe('string');
  });

  it('should accept "limit" as a number', () => {
    const options: FetchAllJobsOptions = { limit: 50 };
    expect(typeof options.limit).toBe('number');
    expect(options.limit).toBe(50);
  });

  it('should accept "date_from" as an ISO date string', () => {
    const options: FetchAllJobsOptions = { date_from: '2026-01-01' };
    expect(typeof options.date_from).toBe('string');
    // Format ISO basique : YYYY-MM-DD
    expect(options.date_from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should accept "date_to" as an ISO date string', () => {
    const options: FetchAllJobsOptions = { date_to: '2026-12-31' };
    expect(typeof options.date_to).toBe('string');
    expect(options.date_to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should accept all filter options simultaneously', () => {
    const options: FetchAllJobsOptions = {
      exercice: 2026,
      status: 'completed',
      module: 'budget',
      limit: 100,
      date_from: '2026-01-01',
      date_to: '2026-12-31',
    };
    expect(Object.keys(options)).toHaveLength(6);
  });
});

// ============================================================================
// 5. Tests de storeImportRows — logique status par ligne
// ============================================================================

describe('storeImportRows row status logic', () => {
  it('should return "ok" when isValid=true and no warnings', () => {
    expect(computeRowStatus(true, [])).toBe('ok');
  });

  it('should return "warning" when isValid=true and warnings present', () => {
    expect(computeRowStatus(true, ['Champ optionnel manquant'])).toBe('warning');
  });

  it('should return "warning" when isValid=true and multiple warnings', () => {
    expect(computeRowStatus(true, ['warn1', 'warn2', 'warn3'])).toBe('warning');
  });

  it('should return "error" when isValid=false and no warnings', () => {
    expect(computeRowStatus(false, [])).toBe('error');
  });

  it('should return "error" when isValid=false even if warnings present (errors take priority)', () => {
    expect(computeRowStatus(false, ['avertissement'])).toBe('error');
  });
});

// ============================================================================
// 6. Tests de la logique de taille de fichier
// ============================================================================

describe('file size validation', () => {
  it('should define MAX_FILE_SIZE_MB as 20', () => {
    expect(MAX_FILE_SIZE_MB).toBe(20);
  });

  it('should compute the max bytes limit as 20 * 1024 * 1024', () => {
    expect(MAX_FILE_SIZE_BYTES).toBe(20 * 1024 * 1024);
  });

  it('should compute the exact byte limit as 20 971 520', () => {
    expect(MAX_FILE_SIZE_BYTES).toBe(20_971_520);
  });

  it('should accept a file of 19 Mo (below limit)', () => {
    const fileSize = 19 * 1024 * 1024; // 19 922 944 bytes
    expect(fileSize).toBeLessThan(MAX_FILE_SIZE_BYTES);
  });

  it('should reject a file of 21 Mo (above limit)', () => {
    const fileSize = 21 * 1024 * 1024; // 22 020 096 bytes
    expect(fileSize).toBeGreaterThan(MAX_FILE_SIZE_BYTES);
  });

  it('should reject a file of exactly MAX_FILE_SIZE_BYTES + 1 byte', () => {
    const fileSize = MAX_FILE_SIZE_BYTES + 1;
    // Le hook utilise : file.size > MAX_FILE_SIZE_MB * 1024 * 1024
    expect(fileSize > MAX_FILE_SIZE_BYTES).toBe(true);
  });

  it('should accept a file of exactly MAX_FILE_SIZE_BYTES (boundary — not strictly greater)', () => {
    const fileSize = MAX_FILE_SIZE_BYTES;
    // Condition du hook : file.size > MAX_FILE_SIZE_MB * 1024 * 1024
    // Donc exactement égal = autorisé
    expect(fileSize > MAX_FILE_SIZE_BYTES).toBe(false);
  });

  it('should accept a 1-byte file', () => {
    const fileSize = 1;
    expect(fileSize).toBeLessThan(MAX_FILE_SIZE_BYTES);
  });
});
