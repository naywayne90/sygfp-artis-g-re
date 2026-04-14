import { describe, it, expect } from 'vitest';
import {
  STATUS_CONFIG,
  ROW_STATUS_LABELS,
  computeStats,
  formatProcessingDuration,
  computeSuccessRate,
} from '../HistoriqueImports';
import type { ImportJob } from '@/hooks/useImportJobs';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeJob(status: ImportJob['status'], overrides: Partial<ImportJob> = {}): ImportJob {
  return {
    id: crypto.randomUUID(),
    created_by: null,
    created_at: new Date().toISOString(),
    module: 'budget',
    exercice_id: 2026,
    filename: 'test.xlsx',
    storage_path: null,
    status,
    stats: {
      rows_total: 0,
      rows_ok: 0,
      rows_error: 0,
      rows_warning: 0,
      rows_new: 0,
      rows_update: 0,
    },
    errors_count: 0,
    notes: null,
    completed_at: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// STATUS_CONFIG
// ---------------------------------------------------------------------------

describe('STATUS_CONFIG', () => {
  const EXPECTED_KEYS = [
    'draft',
    'parsed',
    'validated',
    'importing',
    'completed',
    'failed',
    'rolled_back',
  ];

  it('should have exactly 7 statuts', () => {
    expect(Object.keys(STATUS_CONFIG)).toHaveLength(7);
  });

  it('should contain all expected status keys', () => {
    EXPECTED_KEYS.forEach((key) => {
      expect(STATUS_CONFIG).toHaveProperty(key);
    });
  });

  it('should have label, color and icon defined for each status', () => {
    EXPECTED_KEYS.forEach((key) => {
      const entry = STATUS_CONFIG[key];
      expect(entry.label).toBeDefined();
      expect(entry.color).toBeDefined();
      expect(entry.icon).toBeDefined();
    });
  });

  it('should use French labels (no English values like "Failed" or "Completed")', () => {
    const englishWords = [
      'Failed',
      'Completed',
      'Pending',
      'Validated',
      'Imported',
      'Draft',
      'Parsed',
    ];
    EXPECTED_KEYS.forEach((key) => {
      const { label } = STATUS_CONFIG[key];
      englishWords.forEach((word) => {
        expect(label).not.toBe(word);
      });
    });
  });

  it('should have correct label for "draft" → "Soumis"', () => {
    expect(STATUS_CONFIG.draft.label).toBe('Soumis');
  });

  it('should have correct label for "parsed" → "Analysé"', () => {
    expect(STATUS_CONFIG.parsed.label).toBe('Analysé');
  });

  it('should have correct label for "validated" → "Validé"', () => {
    expect(STATUS_CONFIG.validated.label).toBe('Validé');
  });

  it('should have correct label for "importing" → "En cours"', () => {
    expect(STATUS_CONFIG.importing.label).toBe('En cours');
  });

  it('should have correct label for "completed" → "Terminé"', () => {
    expect(STATUS_CONFIG.completed.label).toBe('Terminé');
  });

  it('should have correct label for "failed" → "Échoué"', () => {
    expect(STATUS_CONFIG.failed.label).toBe('Échoué');
  });

  it('should have correct label for "rolled_back" → "Annulé"', () => {
    expect(STATUS_CONFIG.rolled_back.label).toBe('Annulé');
  });

  it('should use green color class for "completed"', () => {
    expect(STATUS_CONFIG.completed.color).toContain('green');
  });

  it('should use red color class for "failed"', () => {
    expect(STATUS_CONFIG.failed.color).toContain('red');
  });

  it('should use yellow color class for "importing"', () => {
    expect(STATUS_CONFIG.importing.color).toContain('yellow');
  });

  it('should use gray color class for "draft"', () => {
    expect(STATUS_CONFIG.draft.color).toContain('gray');
  });
});

// ---------------------------------------------------------------------------
// ROW_STATUS_LABELS
// ---------------------------------------------------------------------------

describe('ROW_STATUS_LABELS', () => {
  it('should have exactly 5 entries', () => {
    expect(Object.keys(ROW_STATUS_LABELS)).toHaveLength(5);
  });

  it('should map "pending" → "En attente"', () => {
    expect(ROW_STATUS_LABELS.pending).toBe('En attente');
  });

  it('should map "ok" → "Valide"', () => {
    expect(ROW_STATUS_LABELS.ok).toBe('Valide');
  });

  it('should map "error" → "Erreur"', () => {
    expect(ROW_STATUS_LABELS.error).toBe('Erreur');
  });

  it('should map "warning" → "Avertissement"', () => {
    expect(ROW_STATUS_LABELS.warning).toBe('Avertissement');
  });

  it('should map "imported" → "Importé"', () => {
    expect(ROW_STATUS_LABELS.imported).toBe('Importé');
  });

  it('should have all French values (no English labels)', () => {
    const englishValues = ['Pending', 'Valid', 'Error', 'Warning', 'Imported'];
    Object.values(ROW_STATUS_LABELS).forEach((label) => {
      englishValues.forEach((english) => {
        expect(label).not.toBe(english);
      });
    });
  });
});

// ---------------------------------------------------------------------------
// computeStats
// ---------------------------------------------------------------------------

describe('computeStats', () => {
  it('should return all zeros for an empty array', () => {
    const result = computeStats([]);
    expect(result.total).toBe(0);
    expect(result.completed).toBe(0);
    expect(result.inProgress).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.pending).toBe(0);
    expect(result.cancelled).toBe(0);
  });

  it('should count 3 completed and 2 failed from 5 jobs', () => {
    const jobs = [
      makeJob('completed'),
      makeJob('completed'),
      makeJob('completed'),
      makeJob('failed'),
      makeJob('failed'),
    ];
    const result = computeStats(jobs);
    expect(result.total).toBe(5);
    expect(result.completed).toBe(3);
    expect(result.failed).toBe(2);
    expect(result.inProgress).toBe(0);
    expect(result.pending).toBe(0);
    expect(result.cancelled).toBe(0);
  });

  it('should count jobs with status "importing" in inProgress', () => {
    const jobs = [makeJob('importing'), makeJob('importing'), makeJob('completed')];
    const result = computeStats(jobs);
    expect(result.inProgress).toBe(2);
    expect(result.completed).toBe(1);
  });

  it('should count "draft", "parsed" and "validated" jobs in pending', () => {
    const jobs = [makeJob('draft'), makeJob('parsed'), makeJob('validated'), makeJob('completed')];
    const result = computeStats(jobs);
    expect(result.pending).toBe(3);
    expect(result.completed).toBe(1);
  });

  it('should count "rolled_back" jobs in cancelled', () => {
    const jobs = [makeJob('rolled_back'), makeJob('rolled_back'), makeJob('failed')];
    const result = computeStats(jobs);
    expect(result.cancelled).toBe(2);
    expect(result.failed).toBe(1);
  });

  it('should handle a mixed array of 1 job per status (total=7, each counter=1)', () => {
    const jobs = [
      makeJob('draft'),
      makeJob('parsed'),
      makeJob('validated'),
      makeJob('importing'),
      makeJob('completed'),
      makeJob('failed'),
      makeJob('rolled_back'),
    ];
    const result = computeStats(jobs);
    expect(result.total).toBe(7);
    expect(result.completed).toBe(1);
    expect(result.inProgress).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.pending).toBe(3); // draft + parsed + validated
    expect(result.cancelled).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// formatProcessingDuration
// ---------------------------------------------------------------------------

describe('formatProcessingDuration', () => {
  it('should return "—" when completedAt is null', () => {
    expect(formatProcessingDuration('2026-01-01T10:00:00.000Z', null)).toBe('—');
  });

  it('should return "< 1s" for a 500ms duration', () => {
    const created = '2026-01-01T10:00:00.000Z';
    const completed = '2026-01-01T10:00:00.500Z';
    expect(formatProcessingDuration(created, completed)).toBe('< 1s');
  });

  it('should return "< 1s" when createdAt and completedAt are the same timestamp', () => {
    const ts = '2026-01-01T10:00:00.000Z';
    expect(formatProcessingDuration(ts, ts)).toBe('< 1s');
  });

  it('should format a 2-minute 30-second duration correctly', () => {
    const created = '2026-01-01T10:00:00.000Z';
    const completed = '2026-01-01T10:02:30.000Z';
    const result = formatProcessingDuration(created, completed);
    expect(result).toContain('2');
    expect(result).toContain('minute');
    expect(result).toContain('30');
    expect(result).toContain('seconde');
  });

  it('should format a 1-minute duration without seconds part when seconds=0', () => {
    const created = '2026-01-01T10:00:00.000Z';
    const completed = '2026-01-01T10:01:00.000Z';
    const result = formatProcessingDuration(created, completed);
    expect(result).toContain('1 minute');
    expect(result).not.toContain('seconde');
  });

  it('should format a 45-second duration correctly', () => {
    const created = '2026-01-01T10:00:00.000Z';
    const completed = '2026-01-01T10:00:45.000Z';
    const result = formatProcessingDuration(created, completed);
    expect(result).toContain('45 secondes');
  });
});

// ---------------------------------------------------------------------------
// computeSuccessRate
// ---------------------------------------------------------------------------

describe('computeSuccessRate', () => {
  it('should return null when rows_total is 0', () => {
    const job = makeJob('completed', {
      stats: {
        rows_total: 0,
        rows_ok: 0,
        rows_error: 0,
        rows_warning: 0,
        rows_new: 0,
        rows_update: 0,
      },
    });
    expect(computeSuccessRate(job)).toBeNull();
  });

  it('should return 0 when rows_ok=0 and rows_total=10', () => {
    const job = makeJob('completed', {
      stats: {
        rows_total: 10,
        rows_ok: 0,
        rows_error: 10,
        rows_warning: 0,
        rows_new: 0,
        rows_update: 0,
      },
    });
    expect(computeSuccessRate(job)).toBe(0);
  });

  it('should return 100 when rows_ok=rows_total=10', () => {
    const job = makeJob('completed', {
      stats: {
        rows_total: 10,
        rows_ok: 10,
        rows_error: 0,
        rows_warning: 0,
        rows_new: 10,
        rows_update: 0,
      },
    });
    expect(computeSuccessRate(job)).toBe(100);
  });

  it('should return 70 when rows_ok=7 and rows_total=10', () => {
    const job = makeJob('completed', {
      stats: {
        rows_total: 10,
        rows_ok: 7,
        rows_error: 3,
        rows_warning: 0,
        rows_new: 7,
        rows_update: 0,
      },
    });
    expect(computeSuccessRate(job)).toBe(70);
  });

  it('should return 43 when rows_ok=3 and rows_total=7 (Math.round(3/7*100))', () => {
    const job = makeJob('completed', {
      stats: {
        rows_total: 7,
        rows_ok: 3,
        rows_error: 4,
        rows_warning: 0,
        rows_new: 3,
        rows_update: 0,
      },
    });
    expect(computeSuccessRate(job)).toBe(43);
  });

  it('should return null when stats rows_total is 0 (zero-value guard)', () => {
    const job = makeJob('failed');
    // Default stats from makeJob have rows_total: 0
    expect(computeSuccessRate(job)).toBeNull();
  });
});
