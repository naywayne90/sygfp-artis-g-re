/**
 * Tests unitaires — useBudgetComparison (logique pure uniquement)
 *
 * On ne teste pas l'intégration React Query + Supabase (qui embarquerait
 * le client Supabase en env jsdom et rendrait les tests fragiles).
 * On importe l'export `__testing__` qui expose la fonction `computeDelta`
 * afin de valider les cas limites du calcul de delta pourcentuel.
 */
import { describe, it, expect } from 'vitest';
import { __testing__ } from '../useBudgetComparison';

const { computeDelta } = __testing__;

describe('useBudgetComparison — computeDelta', () => {
  it('retourne 0 lorsque les deux valeurs sont nulles', () => {
    expect(computeDelta(0, 0)).toBe(0);
  });

  it('retourne Infinity quand previous = 0 et current > 0', () => {
    expect(computeDelta(100, 0)).toBe(Infinity);
  });

  it('retourne 0 quand previous = 0 et current = 0 (cas limite)', () => {
    expect(computeDelta(0, 0)).toBe(0);
  });

  it('calcule une hausse de 10% correctement', () => {
    expect(computeDelta(110, 100)).toBe(10);
  });

  it('calcule une baisse de 50% correctement', () => {
    expect(computeDelta(50, 100)).toBe(-50);
  });

  it('arrondit au centième de pourcent', () => {
    // 123 vs 100 = +23.00 %
    expect(computeDelta(123, 100)).toBe(23);
    // 133.3333 vs 100 = +33.33 % (arrondi)
    expect(computeDelta(133.3333, 100)).toBe(33.33);
    // 133.3367 vs 100 = +33.34 % (arrondi sup)
    expect(computeDelta(133.3367, 100)).toBe(33.34);
  });

  it('gère des valeurs décimales sans drift', () => {
    // 99.99 vs 100 = -0.01 %
    expect(computeDelta(99.99, 100)).toBe(-0.01);
  });

  it('gère des valeurs réalistes (budgets FCFA)', () => {
    // 11 452 200 019 vs 10 000 000 000 = +14.52 %
    expect(computeDelta(11_452_200_019, 10_000_000_000)).toBe(14.52);
    // 5 500 000 vs 5 000 000 = +10 %
    expect(computeDelta(5_500_000, 5_000_000)).toBe(10);
  });

  it('gère une baisse de 100% (tout perdu)', () => {
    expect(computeDelta(0, 100)).toBe(-100);
  });
});
