/**
 * Tests unitaires — useBudgetTransfers (logique pure uniquement)
 *
 * Rationale : le hook React Query + Supabase ne se teste pas en jsdom sans
 * embarquer tout le client Supabase. On valide ici les 4 fonctions pures
 * critiques exportées via `__testing__` :
 *   - computeStats          : agrégation des compteurs & totaux
 *   - computeAvailableBalance : formule de solde disponible
 *   - checkSufficientBalance  : garde-fou anti sur-consommation budgétaire
 *   - isTransitionValid       : matrice workflow (évite corruption de statut)
 *
 * P0 — une bug sur ces fonctions casserait l'intégrité budgétaire (virements
 * au-dessus du solde, statuts rétroactifs). Couverture exhaustive obligatoire.
 */
import { describe, it, expect } from 'vitest';
import { __testing__, type BudgetTransfer } from '../useBudgetTransfers';

const {
  computeStats,
  computeAvailableBalance,
  checkSufficientBalance,
  checkVirementCeiling,
  isTransitionValid,
  VIREMENT_CEILING_RATIO,
} = __testing__;

// ----------------------------------------------------------------------------
// Helpers — fabrique minimale de BudgetTransfer pour les tests
// ----------------------------------------------------------------------------

type TransferOverrides = Partial<BudgetTransfer>;

function makeTransfer(overrides: TransferOverrides = {}): BudgetTransfer {
  // Les valeurs par défaut utilisent l'opérateur `in` pour distinguer
  // "propriété non fournie" d'une valeur explicitement null — sinon
  // `overrides.status ?? 'en_attente'` convertirait un null voulu en 'en_attente'.
  const base: BudgetTransfer = {
    id: 'tr-' + Math.random().toString(36).slice(2),
    code: 'VIR-TEST-0001',
    exercice: 2026,
    type_transfer: 'virement',
    status: 'en_attente',
    amount: 1_000_000,
    motif: 'Motif test',
    justification_renforcee: null,
    from_budget_line_id: 'line-a',
    to_budget_line_id: 'line-b',
    requested_at: '2026-04-01T10:00:00Z',
    requested_by: null,
    approved_at: null,
    approved_by: null,
    rejection_reason: null,
    executed_at: null,
    executed_by: null,
    cancelled_at: null,
    cancelled_by: null,
    cancel_reason: null,
    from_dotation_avant: null,
    from_dotation_apres: null,
    from_disponible_avant: null,
    from_disponible_apres: null,
    to_dotation_avant: null,
    to_dotation_apres: null,
    to_disponible_avant: null,
    to_disponible_apres: null,
  };
  return { ...base, ...overrides };
}

// ============================================================================
// computeStats
// ============================================================================

describe('useBudgetTransfers — computeStats', () => {
  it('retourne des compteurs à 0 pour une liste vide', () => {
    const stats = computeStats([]);
    expect(stats).toEqual({
      pending: 0,
      validated: 0,
      executed: 0,
      rejected: 0,
      cancelled: 0,
      executedThisMonth: 0,
      totalExecutedAmount: 0,
      totalPendingAmount: 0,
      totalAmount: 0,
      virementsCount: 0,
      ajustementsCount: 0,
    });
  });

  it('gère undefined et null comme une liste vide', () => {
    expect(computeStats(undefined).totalAmount).toBe(0);
    expect(computeStats(null).totalAmount).toBe(0);
  });

  it('compte "en_attente" comme pending (niveau 1 — CB)', () => {
    const stats = computeStats([
      makeTransfer({ status: 'en_attente' }),
      makeTransfer({ status: 'en_attente' }),
      makeTransfer({ status: 'en_attente' }),
    ]);
    expect(stats.pending).toBe(3);
  });

  it('compte "approuve" comme validated (niveau 2 — DG exécute)', () => {
    const stats = computeStats([
      makeTransfer({ status: 'approuve' }),
      makeTransfer({ status: 'approuve' }),
    ]);
    expect(stats.validated).toBe(2);
  });

  it('sépare executed / rejected (plus de "cancelled" dans le workflow 2 niveaux)', () => {
    const stats = computeStats([
      makeTransfer({ status: 'execute' }),
      makeTransfer({ status: 'execute' }),
      makeTransfer({ status: 'rejete' }),
    ]);
    expect(stats.executed).toBe(2);
    expect(stats.rejected).toBe(1);
    expect(stats.cancelled).toBe(0);
  });

  it('ignore un statut inconnu ou null dans les compteurs', () => {
    const stats = computeStats([
      makeTransfer({ status: null }),
      makeTransfer({ status: 'inconnu' }),
    ]);
    expect(stats.pending).toBe(0);
    expect(stats.validated).toBe(0);
    expect(stats.executed).toBe(0);
    expect(stats.totalAmount).toBe(2_000_000); // total compte quand même
  });

  it('totalExecutedAmount ne somme que les exécutés', () => {
    const stats = computeStats([
      makeTransfer({ status: 'execute', amount: 5_000_000 }),
      makeTransfer({ status: 'execute', amount: 3_000_000 }),
      makeTransfer({ status: 'approuve', amount: 10_000_000 }), // ignoré
      makeTransfer({ status: 'rejete', amount: 99_000_000 }), // ignoré
    ]);
    expect(stats.totalExecutedAmount).toBe(8_000_000);
  });

  it('totalPendingAmount somme en_attente + approuve (en cours de workflow)', () => {
    const stats = computeStats([
      makeTransfer({ status: 'en_attente', amount: 2_000_000 }),
      makeTransfer({ status: 'en_attente', amount: 1_000_000 }),
      makeTransfer({ status: 'approuve', amount: 4_000_000 }),
      makeTransfer({ status: 'approuve', amount: 3_000_000 }),
      makeTransfer({ status: 'execute', amount: 99_000_000 }), // ignoré
      makeTransfer({ status: 'rejete', amount: 99_000_000 }), // ignoré
    ]);
    expect(stats.totalPendingAmount).toBe(10_000_000);
  });

  it('distingue virements et ajustements', () => {
    const stats = computeStats([
      makeTransfer({ type_transfer: 'virement' }),
      makeTransfer({ type_transfer: 'virement' }),
      makeTransfer({ type_transfer: 'virement' }),
      makeTransfer({ type_transfer: 'ajustement' }),
    ]);
    expect(stats.virementsCount).toBe(3);
    expect(stats.ajustementsCount).toBe(1);
  });

  it('executedThisMonth : compte uniquement les exécutés du mois courant', () => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 15).toISOString();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString();
    const nextYearSameMonth = new Date(now.getFullYear() + 1, now.getMonth(), 15).toISOString();

    const stats = computeStats([
      makeTransfer({ status: 'execute', executed_at: thisMonth }),
      makeTransfer({ status: 'execute', executed_at: thisMonth }),
      makeTransfer({ status: 'execute', executed_at: lastMonth }),
      makeTransfer({ status: 'execute', executed_at: nextYearSameMonth }),
      makeTransfer({ status: 'execute', executed_at: null }), // ignoré
      makeTransfer({ status: 'valide', executed_at: thisMonth }), // statut != execute
    ]);
    expect(stats.executedThisMonth).toBe(2);
  });

  it('cas réaliste : mélange 4 statuts + montants FCFA réalistes', () => {
    const stats = computeStats([
      makeTransfer({ status: 'en_attente', amount: 500_000 }),
      makeTransfer({ status: 'approuve', amount: 1_500_000 }),
      makeTransfer({ status: 'execute', amount: 2_000_000 }),
      makeTransfer({ status: 'execute', amount: 4_500_000 }),
      makeTransfer({ status: 'rejete', amount: 800_000 }),
    ]);
    expect(stats.pending).toBe(1);
    expect(stats.validated).toBe(1);
    expect(stats.executed).toBe(2);
    expect(stats.rejected).toBe(1);
    expect(stats.cancelled).toBe(0);
    expect(stats.totalExecutedAmount).toBe(6_500_000);
    expect(stats.totalPendingAmount).toBe(2_000_000);
    expect(stats.totalAmount).toBe(9_300_000);
  });
});

// ============================================================================
// computeAvailableBalance
// ============================================================================

describe('useBudgetTransfers — computeAvailableBalance', () => {
  it('cas nominal : dotation - engagé (aucun virement)', () => {
    const d = computeAvailableBalance({
      dotationInitiale: 10_000_000,
      dotationModifiee: null,
      totalEngage: 3_000_000,
      virementsEmis: 0,
      virementsRecus: 0,
    });
    expect(d).toBe(7_000_000);
  });

  it('dotation_modifiee prime sur dotation_initiale', () => {
    const d = computeAvailableBalance({
      dotationInitiale: 10_000_000,
      dotationModifiee: 15_000_000,
      totalEngage: 0,
      virementsEmis: 0,
      virementsRecus: 0,
    });
    expect(d).toBe(15_000_000);
  });

  it('soustrait les virements émis et ajoute les virements reçus', () => {
    const d = computeAvailableBalance({
      dotationInitiale: 10_000_000,
      dotationModifiee: null,
      totalEngage: 0,
      virementsEmis: 2_000_000,
      virementsRecus: 5_000_000,
    });
    // 10M - 2M (émis) + 5M (reçus) = 13M
    expect(d).toBe(13_000_000);
  });

  it('cas complet : dotation modifiée + engagé + émis + reçus', () => {
    const d = computeAvailableBalance({
      dotationInitiale: 10_000_000, // ignoré (modifiée prime)
      dotationModifiee: 12_000_000,
      totalEngage: 4_000_000,
      virementsEmis: 1_000_000,
      virementsRecus: 500_000,
    });
    // 12M + 0.5M - 1M - 4M = 7.5M
    expect(d).toBe(7_500_000);
  });

  it('gère null/undefined sans crash (coalescing à 0)', () => {
    const d = computeAvailableBalance({
      dotationInitiale: null,
      dotationModifiee: null,
      totalEngage: null,
      virementsEmis: 0,
      virementsRecus: 0,
    });
    expect(d).toBe(0);
  });

  it('solde peut devenir négatif (sur-engagement historique)', () => {
    const d = computeAvailableBalance({
      dotationInitiale: 1_000_000,
      dotationModifiee: null,
      totalEngage: 1_500_000,
      virementsEmis: 0,
      virementsRecus: 0,
    });
    expect(d).toBe(-500_000);
  });
});

// ============================================================================
// checkSufficientBalance
// ============================================================================

describe('useBudgetTransfers — checkSufficientBalance', () => {
  it('ok quand le solde couvre exactement le montant', () => {
    expect(checkSufficientBalance(1_000_000, 1_000_000)).toEqual({ ok: true });
  });

  it('ok quand le solde est supérieur', () => {
    expect(checkSufficientBalance(5_000_000, 1_000_000)).toEqual({ ok: true });
  });

  it('refuse quand le solde est strictement inférieur', () => {
    const res = checkSufficientBalance(500_000, 1_000_000);
    expect(res.ok).toBe(false);
    expect(res.message).toBeDefined();
  });

  it('retourne un message FCFA en français formaté (règle métier CRITIQUE)', () => {
    const res = checkSufficientBalance(500_000, 1_000_000);
    // Le format fr-FR utilise l'espace insécable U+202F comme séparateur de milliers.
    // On vérifie la structure plutôt que l'égalité stricte pour ne pas dépendre de l'encodage.
    expect(res.message).toMatch(/^Solde insuffisant :/);
    expect(res.message).toMatch(/FCFA disponibles/);
    expect(res.message).toMatch(/FCFA demandés/);
    // Les chiffres sont formatés (avec ou sans séparateur)
    expect(res.message).toMatch(/500/);
    expect(res.message).toMatch(/1.?000.?000/); // permet espace ou nbsp
  });

  it('refuse un solde négatif face à un montant positif', () => {
    const res = checkSufficientBalance(-100_000, 500_000);
    expect(res.ok).toBe(false);
    expect(res.message).toMatch(/Solde insuffisant/);
  });

  it('accepte un montant 0 (cas limite sans intérêt mais pas de régression)', () => {
    expect(checkSufficientBalance(0, 0)).toEqual({ ok: true });
  });
});

// ============================================================================
// checkVirementCeiling — plafond LOLF 10 % (CRITIQUE métier)
// ============================================================================

describe('useBudgetTransfers — checkVirementCeiling (plafond LOLF 10 %)', () => {
  // ----- Constante -----
  it('expose le ratio par défaut VIREMENT_CEILING_RATIO = 0.1 (10 %)', () => {
    expect(VIREMENT_CEILING_RATIO).toBe(0.1);
  });

  // ----- Cas nominal : aucun virement déjà émis -----
  it('cas nominal : un premier virement < 10 % est accepté', () => {
    const res = checkVirementCeiling({
      dotationInitiale: 10_000_000,
      totalVirementsEmisExecutes: 0,
      nouveauMontant: 500_000, // 5 %
    });
    expect(res.ok).toBe(true);
    expect(res.ceiling).toBe(1_000_000);
    expect(res.cumulativeWouldBe).toBe(500_000);
    expect(res.cumulativeRatio).toBe(0.05);
    expect(res.message).toBeUndefined();
  });

  // ----- Cas limite : exactement 10 % -----
  it('accepte un virement pile à 10 % (limite inclusive)', () => {
    const res = checkVirementCeiling({
      dotationInitiale: 10_000_000,
      totalVirementsEmisExecutes: 0,
      nouveauMontant: 1_000_000, // 10 %
    });
    expect(res.ok).toBe(true);
    expect(res.ceiling).toBe(1_000_000);
    expect(res.cumulativeRatio).toBe(0.1);
  });

  // ----- Refus : dépassement immédiat -----
  it('refuse un virement > 10 % dès le premier', () => {
    const res = checkVirementCeiling({
      dotationInitiale: 10_000_000,
      totalVirementsEmisExecutes: 0,
      nouveauMontant: 1_000_001, // 10.00001 %
    });
    expect(res.ok).toBe(false);
    expect(res.message).toBeDefined();
    expect(res.message).toContain('Plafond virements dépassé');
  });

  // ----- Cumul : plusieurs petits virements -----
  it('cumulatif : accepte un virement si le cumul reste sous le plafond', () => {
    const res = checkVirementCeiling({
      dotationInitiale: 10_000_000,
      totalVirementsEmisExecutes: 600_000, // 6 % déjà utilisés
      nouveauMontant: 300_000, // +3 %, total 9 %
    });
    expect(res.ok).toBe(true);
    expect(res.cumulativeWouldBe).toBe(900_000);
    expect(res.cumulativeRatio).toBe(0.09);
  });

  it('cumulatif : refuse un virement si le cumul dépasse le plafond', () => {
    const res = checkVirementCeiling({
      dotationInitiale: 10_000_000,
      totalVirementsEmisExecutes: 800_000, // 8 % déjà utilisés
      nouveauMontant: 300_000, // +3 %, total 11 % → REFUS
    });
    expect(res.ok).toBe(false);
    expect(res.cumulativeWouldBe).toBe(1_100_000);
    expect(res.cumulativeRatio).toBe(0.11);
    expect(res.message).toContain('Plafond virements dépassé');
  });

  // ----- Cumul : plafond déjà atteint -----
  it('cumulatif : refuse tout nouveau virement si plafond déjà atteint', () => {
    const res = checkVirementCeiling({
      dotationInitiale: 10_000_000,
      totalVirementsEmisExecutes: 1_000_000, // 10 % consommés
      nouveauMontant: 1, // 1 FCFA de plus → REFUS
    });
    expect(res.ok).toBe(false);
    expect(res.cumulativeWouldBe).toBe(1_000_001);
  });

  // ----- Messages formatés -----
  it("le message d'erreur contient dotation, cumul, plafond et ratio (format FCFA)", () => {
    const res = checkVirementCeiling({
      dotationInitiale: 50_000_000,
      totalVirementsEmisExecutes: 2_000_000,
      nouveauMontant: 4_000_000, // cumul 6M vs plafond 5M
    });
    expect(res.ok).toBe(false);
    expect(res.message).toMatch(/Plafond virements dépassé/);
    expect(res.message).toMatch(/FCFA/);
    expect(res.message).toMatch(/%/); // contient un pourcentage
    expect(res.message).toMatch(/dotation initiale/);
    expect(res.message).toMatch(/Virements déjà exécutés/);
  });

  // ----- Edge case : dotation nulle -----
  it('refuse quand dotation_initiale = 0 (cas dégénéré)', () => {
    const res = checkVirementCeiling({
      dotationInitiale: 0,
      totalVirementsEmisExecutes: 0,
      nouveauMontant: 1,
    });
    expect(res.ok).toBe(false);
    expect(res.ceiling).toBe(0);
    expect(res.cumulativeRatio).toBe(Infinity);
    expect(res.message).toContain('pas de dotation initiale');
  });

  it('refuse quand dotation_initiale < 0 (cas anomalie)', () => {
    const res = checkVirementCeiling({
      dotationInitiale: -1_000_000,
      totalVirementsEmisExecutes: 0,
      nouveauMontant: 100,
    });
    expect(res.ok).toBe(false);
    expect(res.ceiling).toBe(0);
  });

  it('refuse quand dotation_initiale est null (pas de donnée)', () => {
    const res = checkVirementCeiling({
      dotationInitiale: null,
      totalVirementsEmisExecutes: 0,
      nouveauMontant: 100,
    });
    expect(res.ok).toBe(false);
  });

  it('refuse quand dotation_initiale est undefined (pas de donnée)', () => {
    const res = checkVirementCeiling({
      dotationInitiale: undefined,
      totalVirementsEmisExecutes: 0,
      nouveauMontant: 100,
    });
    expect(res.ok).toBe(false);
  });

  // ----- Montants réalistes FCFA -----
  it('cas réaliste ARTI : dotation 500M FCFA, virement 40M → accepté', () => {
    const res = checkVirementCeiling({
      dotationInitiale: 500_000_000,
      totalVirementsEmisExecutes: 0,
      nouveauMontant: 40_000_000, // 8 %
    });
    expect(res.ok).toBe(true);
    expect(res.ceiling).toBe(50_000_000);
    expect(res.cumulativeRatio).toBe(0.08);
  });

  it('cas réaliste ARTI : dotation 500M, cumul 45M + nouveau 10M → refusé (11 %)', () => {
    const res = checkVirementCeiling({
      dotationInitiale: 500_000_000,
      totalVirementsEmisExecutes: 45_000_000,
      nouveauMontant: 10_000_000,
    });
    expect(res.ok).toBe(false);
    expect(res.cumulativeWouldBe).toBe(55_000_000);
    expect(res.cumulativeRatio).toBe(0.11);
  });

  // ----- Override du ratio (dérogation exceptionnelle) -----
  it("permet l'override du ratio (ex : arrêté spécial à 15 %)", () => {
    const res = checkVirementCeiling({
      dotationInitiale: 10_000_000,
      totalVirementsEmisExecutes: 0,
      nouveauMontant: 1_400_000, // 14 %
      ratio: 0.15,
    });
    expect(res.ok).toBe(true);
    expect(res.ceiling).toBe(1_500_000);
  });

  it("l'override ratio = 0 (gel total) refuse tout virement", () => {
    const res = checkVirementCeiling({
      dotationInitiale: 10_000_000,
      totalVirementsEmisExecutes: 0,
      nouveauMontant: 1,
      ratio: 0,
    });
    expect(res.ok).toBe(false);
    expect(res.ceiling).toBe(0);
  });

  // ----- Montant 0 -----
  it('accepte un virement de 0 FCFA (non-op) tant que le cumul reste sous le plafond', () => {
    const res = checkVirementCeiling({
      dotationInitiale: 10_000_000,
      totalVirementsEmisExecutes: 500_000,
      nouveauMontant: 0,
    });
    expect(res.ok).toBe(true);
    expect(res.cumulativeWouldBe).toBe(500_000);
  });

  // ----- Précision flottante -----
  it('ne dérive pas sur des valeurs non-rondes (précision)', () => {
    const res = checkVirementCeiling({
      dotationInitiale: 1_234_567,
      totalVirementsEmisExecutes: 0,
      nouveauMontant: 123_456, // 9.9999... %
    });
    expect(res.ok).toBe(true);
    // Le ratio est arrondi à 4 décimales
    expect(res.cumulativeRatio).toBeCloseTo(0.1, 4);
  });

  it('refuse un micro-dépassement de 1 FCFA au-delà du plafond', () => {
    const res = checkVirementCeiling({
      dotationInitiale: 10_000_000,
      totalVirementsEmisExecutes: 0,
      nouveauMontant: 1_000_000 + 1, // 1 FCFA au-dessus du plafond
    });
    expect(res.ok).toBe(false);
  });
});

// ============================================================================
// isTransitionValid — workflow states
// ============================================================================

describe('useBudgetTransfers — isTransitionValid (matrice workflow 2 niveaux CB → DG)', () => {
  // ----- Niveau 1 : CB approuve -----
  it('autorise en_attente → approuve (CB approuve)', () => {
    expect(isTransitionValid('en_attente', 'approuve')).toBe(true);
  });

  it('autorise en_attente → rejete (CB rejette)', () => {
    expect(isTransitionValid('en_attente', 'rejete')).toBe(true);
  });

  // ----- Niveau 2 : DG exécute -----
  it('autorise approuve → execute (DG exécute)', () => {
    expect(isTransitionValid('approuve', 'execute')).toBe(true);
  });

  it('autorise approuve → rejete (DG rejette après CB)', () => {
    expect(isTransitionValid('approuve', 'rejete')).toBe(true);
  });

  // ----- Sauts interdits -----
  it("BLOQUE en_attente → execute (CB doit approuver d'abord)", () => {
    expect(isTransitionValid('en_attente', 'execute')).toBe(false);
  });

  it('BLOQUE retour arrière approuve → en_attente', () => {
    expect(isTransitionValid('approuve', 'en_attente')).toBe(false);
  });

  // ----- États terminaux : aucune transition sortante -----
  it('BLOQUE toute transition depuis execute (état terminal)', () => {
    expect(isTransitionValid('execute', 'approuve')).toBe(false);
    expect(isTransitionValid('execute', 'rejete')).toBe(false);
    expect(isTransitionValid('execute', 'en_attente')).toBe(false);
  });

  it('BLOQUE toute transition depuis rejete (état terminal)', () => {
    expect(isTransitionValid('rejete', 'en_attente')).toBe(false);
    expect(isTransitionValid('rejete', 'approuve')).toBe(false);
    expect(isTransitionValid('rejete', 'execute')).toBe(false);
  });

  // ----- Statuts legacy retirés -----
  it('BLOQUE les anciens statuts soumis/valide/annule (workflow simplifié)', () => {
    expect(isTransitionValid('soumis', 'approuve')).toBe(false);
    expect(isTransitionValid('valide', 'execute')).toBe(false);
    expect(isTransitionValid('annule', 'en_attente')).toBe(false);
  });

  // ----- Entrées invalides -----
  it("retourne false si l'état source est null", () => {
    expect(isTransitionValid(null, 'approuve')).toBe(false);
  });

  it("retourne false si l'état source est undefined", () => {
    expect(isTransitionValid(undefined, 'approuve')).toBe(false);
  });

  it('retourne false pour un état source inconnu', () => {
    expect(isTransitionValid('foobar', 'approuve')).toBe(false);
  });

  it('retourne false pour un état cible inconnu', () => {
    expect(isTransitionValid('en_attente', 'foobar')).toBe(false);
  });
});
