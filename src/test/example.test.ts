import { describe, it, expect } from 'vitest';

describe('Example Test Suite', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle strings', () => {
    const message = 'SYGFP';
    expect(message).toContain('SYG');
  });

  it('should handle arrays', () => {
    const items = ['Note SEF', 'Note AEF', 'Engagement'];
    expect(items).toHaveLength(3);
    expect(items).toContain('Note SEF');
  });

  it('should handle objects', () => {
    const budget = {
      id: 1,
      libelle: 'Budget 2025',
      montant: 1000000,
    };
    expect(budget).toHaveProperty('id');
    expect(budget.montant).toBeGreaterThan(0);
  });
});
