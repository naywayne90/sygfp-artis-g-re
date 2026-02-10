import { describe, it, expect } from 'vitest';
import {
  splitImputation,
  formatImputation,
  formatImputationTwoLines,
  parseImputation,
  buildImputation,
  buildImputationFromBudgetLine,
  compareImputations,
  matchesbudgetLine,
} from '../imputation-utils';

// ============================================
// splitImputation
// ============================================

describe('splitImputation', () => {
  it('should split a long imputation into 10-char prefix and rest', () => {
    const result = splitImputation('OS01-ACT02-ACT03-SOU04-NBE05');
    expect(result.imputation_10).toBe('OS01-ACT02');
    expect(result.imputation_suite).toBe('-ACT03-SOU04-NBE05');
    expect(result.imputation_complete).toBe('OS01-ACT02-ACT03-SOU04-NBE05');
    expect(result.isValid).toBe(true);
  });

  it('should handle short imputation (less than 10 chars)', () => {
    const result = splitImputation('OS01-ACT');
    expect(result.imputation_10).toBe('OS01-ACT');
    expect(result.imputation_suite).toBe('-');
    expect(result.isValid).toBe(true);
  });

  it('should handle exactly 10 characters', () => {
    const result = splitImputation('0123456789');
    expect(result.imputation_10).toBe('0123456789');
    expect(result.imputation_suite).toBe('-');
    expect(result.isValid).toBe(true);
  });

  it('should return invalid for null', () => {
    const result = splitImputation(null);
    expect(result.isValid).toBe(false);
    expect(result.imputation_10).toBe('-');
    expect(result.imputation_suite).toBe('-');
    expect(result.imputation_complete).toBe('');
  });

  it('should return invalid for undefined', () => {
    const result = splitImputation(undefined);
    expect(result.isValid).toBe(false);
  });

  it('should return invalid for empty string', () => {
    const result = splitImputation('');
    expect(result.isValid).toBe(false);
  });

  it('should return invalid for whitespace-only string', () => {
    const result = splitImputation('   ');
    expect(result.isValid).toBe(false);
  });

  it('should trim whitespace before splitting', () => {
    const result = splitImputation('  OS01-ACT02-REST  ');
    expect(result.imputation_10).toBe('OS01-ACT02');
    expect(result.isValid).toBe(true);
  });
});

// ============================================
// formatImputation
// ============================================

describe('formatImputation', () => {
  it('should return the imputation as-is when no maxLength', () => {
    expect(formatImputation('OS01-ACT02-NBE05')).toBe('OS01-ACT02-NBE05');
  });

  it('should truncate with ellipsis when exceeding maxLength', () => {
    const result = formatImputation('OS01-ACT02-NBE05', 10);
    expect(result).toBe('OS01-AC...');
    expect(result.length).toBe(10);
  });

  it('should not truncate when within maxLength', () => {
    expect(formatImputation('OS01', 10)).toBe('OS01');
  });

  it('should return "-" for null', () => {
    expect(formatImputation(null)).toBe('-');
  });

  it('should return "-" for undefined', () => {
    expect(formatImputation(undefined)).toBe('-');
  });

  it('should return "-" for empty string', () => {
    expect(formatImputation('')).toBe('-');
  });

  it('should trim whitespace', () => {
    expect(formatImputation('  OS01  ')).toBe('OS01');
  });
});

// ============================================
// formatImputationTwoLines
// ============================================

describe('formatImputationTwoLines', () => {
  it('should split into ligne1 and ligne2', () => {
    const result = formatImputationTwoLines('OS01-ACT02-NBE05');
    expect(result.ligne1).toBe('OS01-ACT02');
    expect(result.ligne2).toBe('-NBE05');
  });

  it('should handle null', () => {
    const result = formatImputationTwoLines(null);
    expect(result.ligne1).toBe('-');
    expect(result.ligne2).toBe('-');
  });
});

// ============================================
// parseImputation
// ============================================

describe('parseImputation', () => {
  it('should parse OS segment from first position', () => {
    const result = parseImputation('OS01-MIS02-ACT03');
    expect(result.segments.os).toBe('OS01');
  });

  it('should parse mission segment', () => {
    const result = parseImputation('OS01-MIS02-ACT03');
    expect(result.segments.mission).toBe('MIS02');
  });

  it('should parse action segment', () => {
    const result = parseImputation('OS01-MIS02-ACT03');
    expect(result.segments.action).toBe('ACT03');
  });

  it('should parse sous-activite segment', () => {
    const result = parseImputation('OS01-MIS02-ACT03-ACT04-SOU05');
    expect(result.segments.sousActivite).toBe('SOU05');
  });

  it('should parse NBE segment from numeric patterns', () => {
    const result = parseImputation('OS01-MIS02-ACT03-60210');
    expect(result.segments.nbe).toBe('60210');
  });

  it('should mark as complete when OS + action + NBE present', () => {
    const result = parseImputation('OS01-MIS02-ACT03-60210');
    expect(result.isComplete).toBe(true);
  });

  it('should mark as incomplete without NBE', () => {
    const result = parseImputation('OS01-MIS02');
    expect(result.isComplete).toBe(false);
  });

  it('should return empty for null', () => {
    const result = parseImputation(null);
    expect(result.code).toBe('');
    expect(result.readable).toBe('-');
    expect(result.isComplete).toBe(false);
  });

  it('should return empty for empty string', () => {
    const result = parseImputation('');
    expect(result.isComplete).toBe(false);
  });

  it('should generate readable representation', () => {
    const result = parseImputation('OS01-MIS02-ACT03-60210');
    expect(result.readable).toContain('OS: OS01');
    expect(result.readable).toContain('Action: ACT03');
    expect(result.readable).toContain('NBE: 60210');
  });

  it('should preserve the original code', () => {
    const input = 'OS01-MIS02-ACT03';
    const result = parseImputation(input);
    expect(result.code).toBe(input);
  });
});

// ============================================
// buildImputation
// ============================================

describe('buildImputation', () => {
  it('should build from segments with default separator', () => {
    const result = buildImputation({
      os: 'OS01',
      mission: 'MIS02',
      action: 'ACT03',
    });
    expect(result).toBe('OS01-MIS02-ACT03');
  });

  it('should use custom separator', () => {
    const result = buildImputation({ os: 'OS01', action: 'ACT03' }, '.');
    expect(result).toBe('OS01.ACT03');
  });

  it('should skip undefined segments', () => {
    const result = buildImputation({ os: 'OS01', nbe: '60210' });
    expect(result).toBe('OS01-60210');
  });

  it('should return "-" for empty segments', () => {
    const result = buildImputation({});
    expect(result).toBe('-');
  });

  it('should include all segments in correct order', () => {
    const result = buildImputation({
      os: 'OS01',
      mission: 'MIS02',
      action: 'ACT03',
      activite: 'ACT04',
      sousActivite: 'SOU05',
      nbe: '60210',
      sysco: 'CPT001',
    });
    expect(result).toBe('OS01-MIS02-ACT03-ACT04-SOU05-60210-CPT001');
  });
});

// ============================================
// buildImputationFromBudgetLine
// ============================================

describe('buildImputationFromBudgetLine', () => {
  it('should use code directly when available', () => {
    const result = buildImputationFromBudgetLine({
      code: 'OS01-ACT02-NBE03',
      objectif_strategique: { code: 'OS99' },
    });
    expect(result).toBe('OS01-ACT02-NBE03');
  });

  it('should build from relations when no code', () => {
    const result = buildImputationFromBudgetLine({
      objectif_strategique: { code: 'OS01' },
      action: { code: 'ACT02' },
      nbe: { code: '60210' },
    });
    expect(result).toBe('OS01-ACT02-60210');
  });

  it('should handle null relations', () => {
    const result = buildImputationFromBudgetLine({
      objectif_strategique: null,
      action: null,
    });
    expect(result).toBe('-');
  });

  it('should handle missing code in relations', () => {
    const result = buildImputationFromBudgetLine({
      objectif_strategique: { code: 'OS01' },
      action: { code: undefined },
    });
    expect(result).toBe('OS01');
  });
});

// ============================================
// compareImputations
// ============================================

describe('compareImputations', () => {
  it('should match identical imputations (strict)', () => {
    expect(compareImputations('OS01-ACT02', 'OS01-ACT02', true)).toBe(true);
  });

  it('should be case-insensitive', () => {
    expect(compareImputations('os01-act02', 'OS01-ACT02', true)).toBe(true);
  });

  it('should not match different imputations (strict)', () => {
    expect(compareImputations('OS01-ACT02', 'OS01-ACT03', true)).toBe(false);
  });

  it('should match prefix in non-strict mode', () => {
    expect(compareImputations('OS01-ACT02-NBE03', 'OS01-ACT02', false)).toBe(true);
  });

  it('should match when second is prefix of first (non-strict)', () => {
    expect(compareImputations('OS01', 'OS01-ACT02', false)).toBe(true);
  });

  it('should match when one contains the other (non-strict)', () => {
    expect(compareImputations('OS01-ACT02-NBE03', 'ACT02', false)).toBe(true);
  });

  it('should return false for null inputs', () => {
    expect(compareImputations(null, 'OS01')).toBe(false);
    expect(compareImputations('OS01', null)).toBe(false);
    expect(compareImputations(null, null)).toBe(false);
  });

  it('should return false for empty inputs', () => {
    expect(compareImputations('', 'OS01')).toBe(false);
    expect(compareImputations('OS01', '')).toBe(false);
  });

  it('should trim whitespace before comparing', () => {
    expect(compareImputations('  OS01  ', 'OS01', true)).toBe(true);
  });

  it('should strip internal spaces before comparing', () => {
    expect(compareImputations('OS 01', 'OS01', true)).toBe(true);
  });
});

// ============================================
// matchesbudgetLine
// ============================================

describe('matchesbudgetLine', () => {
  it('should match when imputation is a prefix of budget line code', () => {
    expect(matchesbudgetLine('OS01-ACT02', 'OS01-ACT02-NBE03')).toBe(true);
  });

  it('should match when budget line code is a prefix', () => {
    expect(matchesbudgetLine('OS01-ACT02-NBE03', 'OS01-ACT02')).toBe(true);
  });

  it('should return false for completely different codes', () => {
    expect(matchesbudgetLine('OS01-ACT02', 'OS99-ACT99')).toBe(false);
  });

  it('should return false for null imputation', () => {
    expect(matchesbudgetLine(null, 'OS01')).toBe(false);
  });

  it('should return false for null budget line', () => {
    expect(matchesbudgetLine('OS01', null)).toBe(false);
  });
});
