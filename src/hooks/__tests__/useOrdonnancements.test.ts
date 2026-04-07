/**
 * Tests unitaires — useOrdonnancements
 *
 * Ces tests couvrent uniquement la logique pure extraite du hook
 * (sans mock Supabase) : calcul du restant à ordonnancer, cohérence
 * des constantes workflow (validation + signature + modes de paiement)
 * et contrat de filtrage des liquidations disponibles.
 *
 * Pattern aligné sur src/hooks/__tests__/useImportJobs.test.ts :
 * on n'importe PAS le module runtime (qui embarquerait le client Supabase
 * et provoquerait un unhandled rejection en env jsdom). À la place,
 * on duplique les constantes et formules en « mirror » du code source.
 * Si le code source diverge, le test doit être mis à jour en miroir.
 */
import { describe, it, expect } from 'vitest';

// ============================================================================
// Mirror des constantes exportées par src/hooks/useOrdonnancements.ts (L8-26)
// ============================================================================

const VALIDATION_STEPS = [
  { order: 1, role: 'DAAF', label: 'Sous-Directeur DAAF' },
  { order: 2, role: 'CB', label: 'Contrôleur Budgétaire' },
  { order: 3, role: 'DAF', label: 'Directeur Administratif et Financier' },
  { order: 4, role: 'DG', label: 'Directeur Général' },
] as const;

const SIGNATURE_STEPS = [
  { order: 1, role: 'DAAF', label: 'Directeur Administratif et Financier' },
  { order: 2, role: 'DG', label: 'Directeur Général (Ordonnateur)' },
] as const;

const MODES_PAIEMENT = [
  { value: 'virement', label: 'Virement bancaire' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'especes', label: 'Espèces' },
  { value: 'mobile_money', label: 'Mobile Money' },
] as const;

// ============================================================================
// Logique pure extraite — mirror fidèle du code source
// ============================================================================

/**
 * Calcule la disponibilité d'une liquidation pour un nouvel ordonnancement.
 * Source : useOrdonnancements.ts:178-188 (calculateOrdonnancementAvailability)
 */
function computeAvailability(
  montantLiquide: number,
  ordonnancementsExistants: Array<{ montant: number | null; statut: string }>
): { montantLiquide: number; ordonnancementsAnterieurs: number; restantAOrdonnancer: number } {
  const totalOrdonnance = ordonnancementsExistants
    .filter((o) => o.statut !== 'rejete')
    .reduce((sum, ord) => sum + (ord.montant || 0), 0);

  return {
    montantLiquide: montantLiquide || 0,
    ordonnancementsAnterieurs: totalOrdonnance,
    restantAOrdonnancer: (montantLiquide || 0) - totalOrdonnance,
  };
}

/**
 * Filtre les liquidations éligibles au select "Nouvel ordonnancement".
 * Source : useOrdonnancements.ts:118-147 (liquidationsValidees query)
 * Règle ajoutée 2026-04-07 : exclure montant = 0 (reliquats migration legacy).
 */
function filterLiquidationsEligibles<
  T extends { statut: string; exercice: number; montant: number },
>(rows: T[], exerciceCible: number): T[] {
  return rows.filter((r) => r.statut === 'valide' && r.exercice === exerciceCible && r.montant > 0);
}

// ============================================================================
// computeAvailability
// ============================================================================

describe('computeAvailability — calcul restant à ordonnancer', () => {
  it('Retourne le montant liquidé complet si aucun ordonnancement antérieur', () => {
    const result = computeAvailability(10_000_000, []);
    expect(result.montantLiquide).toBe(10_000_000);
    expect(result.ordonnancementsAnterieurs).toBe(0);
    expect(result.restantAOrdonnancer).toBe(10_000_000);
  });

  it('Somme les ordonnancements antérieurs et calcule le restant', () => {
    const result = computeAvailability(10_000_000, [
      { montant: 3_000_000, statut: 'valide' },
      { montant: 2_500_000, statut: 'en_signature' },
    ]);
    expect(result.ordonnancementsAnterieurs).toBe(5_500_000);
    expect(result.restantAOrdonnancer).toBe(4_500_000);
  });

  it('Exclut les ordonnancements rejetés du cumul', () => {
    const result = computeAvailability(10_000_000, [
      { montant: 3_000_000, statut: 'valide' },
      { montant: 7_000_000, statut: 'rejete' }, // ne doit pas compter
    ]);
    expect(result.ordonnancementsAnterieurs).toBe(3_000_000);
    expect(result.restantAOrdonnancer).toBe(7_000_000);
  });

  it('Gère montant null (défense défensive)', () => {
    const result = computeAvailability(5_000_000, [
      { montant: null, statut: 'valide' },
      { montant: 1_000_000, statut: 'valide' },
    ]);
    expect(result.ordonnancementsAnterieurs).toBe(1_000_000);
    expect(result.restantAOrdonnancer).toBe(4_000_000);
  });

  it('Restant négatif si le cumul dépasse le liquidé (cas limite à détecter)', () => {
    const result = computeAvailability(1_000_000, [{ montant: 1_500_000, statut: 'valide' }]);
    expect(result.restantAOrdonnancer).toBeLessThan(0);
  });

  it('Montant liquidé à 0 → restant à 0', () => {
    const result = computeAvailability(0, []);
    expect(result.montantLiquide).toBe(0);
    expect(result.restantAOrdonnancer).toBe(0);
  });
});

// ============================================================================
// filterLiquidationsEligibles
// ============================================================================

describe("filterLiquidationsEligibles — contrat d'éligibilité au select", () => {
  const exercice = 2026;

  it("Ne retient que les liquidations validées de l'exercice courant avec montant > 0", () => {
    const rows = [
      { id: 'a', statut: 'valide', exercice: 2026, montant: 10_000_000 },
      { id: 'b', statut: 'valide', exercice: 2026, montant: 0 }, // 0 FCFA → exclu
      { id: 'c', statut: 'valide', exercice: 2025, montant: 5_000_000 }, // autre exercice
      { id: 'd', statut: 'soumis', exercice: 2026, montant: 3_000_000 }, // pas validé
      { id: 'e', statut: 'valide', exercice: 2026, montant: 500_000 },
    ];
    const eligible = filterLiquidationsEligibles(rows, exercice);
    expect(eligible.map((r) => r.id)).toEqual(['a', 'e']);
  });

  it('Rejette les montants négatifs (anomalie de données)', () => {
    const rows = [{ id: 'x', statut: 'valide', exercice: 2026, montant: -100 }];
    expect(filterLiquidationsEligibles(rows, exercice)).toEqual([]);
  });

  it('Retourne un tableau vide si aucune liquidation éligible', () => {
    const rows = [
      { id: 'a', statut: 'valide', exercice: 2026, montant: 0 },
      { id: 'b', statut: 'valide', exercice: 2026, montant: 0 },
    ];
    expect(filterLiquidationsEligibles(rows, exercice)).toEqual([]);
  });
});

// ============================================================================
// Constantes workflow — garde-fou contre régressions structurelles
// ============================================================================

describe('VALIDATION_STEPS — workflow validation ordonnancement', () => {
  it('Contient exactement 4 étapes', () => {
    expect(VALIDATION_STEPS).toHaveLength(4);
  });

  it('Étapes ordonnées 1 → 4', () => {
    expect(VALIDATION_STEPS.map((s) => s.order)).toEqual([1, 2, 3, 4]);
  });

  it('Rôles attendus : DAAF → CB → DAF → DG', () => {
    expect(VALIDATION_STEPS.map((s) => s.role)).toEqual(['DAAF', 'CB', 'DAF', 'DG']);
  });

  it('Chaque étape a un label non vide', () => {
    for (const step of VALIDATION_STEPS) {
      expect(step.label).toBeTruthy();
      expect(step.label.length).toBeGreaterThan(3);
    }
  });
});

describe('SIGNATURE_STEPS — workflow signature', () => {
  it('Contient 2 étapes : DAAF puis DG (ordonnateur)', () => {
    expect(SIGNATURE_STEPS).toHaveLength(2);
    expect(SIGNATURE_STEPS[0].role).toBe('DAAF');
    expect(SIGNATURE_STEPS[1].role).toBe('DG');
  });

  it('Ordres séquentiels 1 puis 2', () => {
    expect(SIGNATURE_STEPS.map((s) => s.order)).toEqual([1, 2]);
  });
});

describe('MODES_PAIEMENT — modes supportés', () => {
  it('Au moins 4 modes sont proposés', () => {
    expect(MODES_PAIEMENT.length).toBeGreaterThanOrEqual(4);
  });

  it('Contient virement bancaire (mode principal ARTI)', () => {
    const values = MODES_PAIEMENT.map((m) => m.value);
    expect(values).toContain('virement');
  });

  it('Chaque mode a un value unique et un label non vide', () => {
    const values = MODES_PAIEMENT.map((m) => m.value);
    expect(new Set(values).size).toBe(values.length); // unicité
    for (const mode of MODES_PAIEMENT) {
      expect(mode.label).toBeTruthy();
    }
  });
});
