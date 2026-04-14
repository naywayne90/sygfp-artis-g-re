import { describe, it, expect } from 'vitest';
import { segmentBudgetCode } from '../code-segments';

describe('segmentBudgetCode', () => {
  it('renvoie un tableau vide pour null / undefined / chaîne vide', () => {
    expect(segmentBudgetCode(null)).toEqual([]);
    expect(segmentBudgetCode(undefined)).toEqual([]);
    expect(segmentBudgetCode('')).toEqual([]);
    expect(segmentBudgetCode('   ')).toEqual([]);
  });

  it('découpe un code standard de 18 chiffres (2+2+3+3+2+6)', () => {
    const segs = segmentBudgetCode('110110101022243100');
    expect(segs.map((s) => s.type)).toEqual([
      'os',
      'mission',
      'action',
      'activite',
      'sous_activite',
      'nbe',
    ]);
    expect(segs.map((s) => s.value)).toEqual(['11', '01', '101', '010', '22', '243100']);
    expect(segs.map((s) => s.value).join('')).toEqual('110110101022243100');
  });

  it('découpe un code standard de 18 chiffres — 2e exemple (110340313051662110)', () => {
    const segs = segmentBudgetCode('110340313051662110');
    expect(segs.map((s) => s.value)).toEqual(['11', '03', '403', '130', '51', '662110']);
  });

  it('découpe un code de 16 chiffres (sans sous-activité)', () => {
    const segs = segmentBudgetCode('0240902051665960');
    expect(segs.map((s) => s.type)).toEqual(['os', 'mission', 'action', 'activite', 'nbe']);
    expect(segs.map((s) => s.value)).toEqual(['02', '40', '902', '051', '665960']);
    expect(segs.find((s) => s.type === 'sous_activite')).toBeUndefined();
  });

  it('découpe un code de 19 chiffres (SA sur 3)', () => {
    const segs = segmentBudgetCode('1102108002022621100');
    expect(segs.map((s) => s.value)).toEqual(['11', '02', '108', '002', '022', '621100']);
    expect(segs.find((s) => s.type === 'sous_activite')?.value).toBe('022');
  });

  it('retourne un segment "other" unique pour un code alphanumérique', () => {
    const segs = segmentBudgetCode('DSI-PROMPT10-TEST');
    expect(segs).toEqual([{ type: 'other', label: 'Code', value: 'DSI-PROMPT10-TEST' }]);
  });

  it('retourne un segment "other" unique pour une longueur non gérée', () => {
    const segs = segmentBudgetCode('12345'); // 5 chiffres, pas dans les layouts
    expect(segs).toEqual([{ type: 'other', label: 'Code', value: '12345' }]);
  });

  it('retourne un segment "other" pour un code de 18 caractères contenant des lettres', () => {
    const segs = segmentBudgetCode('11011010A022243100');
    expect(segs).toHaveLength(1);
    expect(segs[0].type).toBe('other');
  });

  it('trim les espaces avant analyse', () => {
    const segs = segmentBudgetCode('  110110101022243100  ');
    expect(segs.map((s) => s.value)).toEqual(['11', '01', '101', '010', '22', '243100']);
  });

  it("round-trip : la concaténation des segments reconstitue le code d'origine", () => {
    const samples = [
      '110110101022243100',
      '110340313051662110',
      '0240902051665960',
      '1102108002022621100',
    ];
    for (const code of samples) {
      const rebuilt = segmentBudgetCode(code)
        .map((s) => s.value)
        .join('');
      expect(rebuilt).toBe(code);
    }
  });
});
