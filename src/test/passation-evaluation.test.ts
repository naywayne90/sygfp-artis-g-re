/**
 * Tests unitaires — computeEvaluations
 * Fonction pure de calcul des notes, qualification et classement
 *
 * 20+ tests couvrant :
 * - Calcul note finale (pondération 70% tech + 30% fin)
 * - Qualification technique (seuil 70/100)
 * - Classement par note finale décroissante
 * - Attribution de rangs
 * - Cas limites (notes nulles, soumissionnaires éliminés, etc.)
 */

import { describe, it, expect } from 'vitest';
import { computeEvaluations, type SoumEval } from '@/components/passation-marche/EvaluationCOJO';
import type { Soumissionnaire } from '@/hooks/usePassationsMarche';

// ---------------------------------------------------------------------------
// Factory helper
// ---------------------------------------------------------------------------

function makeSoum(overrides: Partial<Soumissionnaire> = {}): Soumissionnaire {
  return {
    id: 'soum-' + Math.random().toString(36).slice(2, 8),
    passation_marche_id: 'pm-1',
    lot_marche_id: null,
    prestataire_id: null,
    is_manual_entry: true,
    raison_sociale: 'Entreprise Test',
    contact_nom: null,
    email: null,
    telephone: null,
    rccm: null,
    offre_technique_url: null,
    offre_financiere: 50_000_000,
    date_depot: '2026-02-15',
    note_technique: null,
    note_financiere: null,
    qualifie_technique: false,
    note_finale: null,
    rang_classement: null,
    statut: 'conforme',
    motif_elimination: null,
    observations: null,
    created_by: 'user-1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Tests computeEvaluations
// ═══════════════════════════════════════════════════════════════════════════

describe('computeEvaluations', () => {
  // ── Cas vide ──

  it('retourne un tableau vide pour aucun soumissionnaire', () => {
    const result = computeEvaluations([]);
    expect(result).toEqual([]);
  });

  // ── Calcul note finale ──

  describe('Calcul note finale', () => {
    it('calcule noteFinale = tech*0.7 + fin*0.3 pour un soumissionnaire qualifié', () => {
      const soums = [
        makeSoum({
          id: 's1',
          raison_sociale: 'Alpha',
          note_technique: 80,
          note_financiere: 90,
          qualifie_technique: true,
        }),
      ];
      const result = computeEvaluations(soums);
      expect(result).toHaveLength(1);
      // 80*0.7 + 90*0.3 = 56 + 27 = 83
      expect(result[0].noteFinale).toBeCloseTo(83, 2);
    });

    it('utilise note_finale de la DB si présente', () => {
      const soums = [
        makeSoum({
          id: 's1',
          note_technique: 80,
          note_financiere: 90,
          note_finale: 85.5, // Override DB
          qualifie_technique: true,
        }),
      ];
      const result = computeEvaluations(soums);
      expect(result[0].noteFinale).toBe(85.5);
    });

    it('noteFinale = null si note_technique est null', () => {
      const soums = [
        makeSoum({
          id: 's1',
          note_technique: null,
          note_financiere: 90,
        }),
      ];
      const result = computeEvaluations(soums);
      expect(result[0].noteFinale).toBeNull();
    });

    it('noteFinale = null si note_financiere est null', () => {
      const soums = [
        makeSoum({
          id: 's1',
          note_technique: 80,
          note_financiere: null,
          qualifie_technique: true,
        }),
      ];
      const result = computeEvaluations(soums);
      expect(result[0].noteFinale).toBeNull();
    });

    it('noteFinale = null si non qualifié techniquement', () => {
      const soums = [
        makeSoum({
          id: 's1',
          note_technique: 50, // < 70
          note_financiere: 90,
          qualifie_technique: false,
        }),
      ];
      const result = computeEvaluations(soums);
      expect(result[0].noteFinale).toBeNull();
      expect(result[0].isQualifie).toBe(false);
    });

    it('cas parfait : 100/100 tech + 100/100 fin = 100', () => {
      const soums = [
        makeSoum({
          note_technique: 100,
          note_financiere: 100,
          qualifie_technique: true,
        }),
      ];
      const result = computeEvaluations(soums);
      expect(result[0].noteFinale).toBeCloseTo(100, 2);
    });

    it('note seuil : tech=70 + fin=70 = 70', () => {
      const soums = [
        makeSoum({
          note_technique: 70,
          note_financiere: 70,
          qualifie_technique: true,
        }),
      ];
      const result = computeEvaluations(soums);
      // 70*0.7 + 70*0.3 = 49 + 21 = 70
      expect(result[0].noteFinale).toBeCloseTo(70, 2);
    });
  });

  // ── Qualification technique ──

  describe('Qualification technique', () => {
    it('qualifié si note_technique >= 70', () => {
      const soums = [
        makeSoum({
          note_technique: 70,
          note_financiere: 80,
        }),
      ];
      const result = computeEvaluations(soums);
      expect(result[0].isQualifie).toBe(true);
    });

    it('non qualifié si note_technique < 70', () => {
      const soums = [
        makeSoum({
          note_technique: 69.9,
          note_financiere: 95,
        }),
      ];
      const result = computeEvaluations(soums);
      expect(result[0].isQualifie).toBe(false);
    });

    it('qualifié si qualifie_technique=true en DB (override)', () => {
      const soums = [
        makeSoum({
          note_technique: 60, // < 70 mais qualifié en DB
          note_financiere: 80,
          qualifie_technique: true,
        }),
      ];
      const result = computeEvaluations(soums);
      expect(result[0].isQualifie).toBe(true);
    });

    it('non qualifié si note_technique est null', () => {
      const soums = [
        makeSoum({
          note_technique: null,
        }),
      ];
      const result = computeEvaluations(soums);
      expect(result[0].isQualifie).toBe(false);
    });
  });

  // ── Classement ──

  describe('Classement et tri', () => {
    it('classe les qualifiés avant les non-qualifiés', () => {
      const soums = [
        makeSoum({
          id: 'non-qualifie',
          raison_sociale: 'Beta',
          note_technique: 50,
          note_financiere: 90,
        }),
        makeSoum({
          id: 'qualifie',
          raison_sociale: 'Alpha',
          note_technique: 80,
          note_financiere: 90,
          qualifie_technique: true,
        }),
      ];
      const result = computeEvaluations(soums);
      expect(result[0].soumissionnaire.raison_sociale).toBe('Alpha');
      expect(result[0].isQualifie).toBe(true);
      expect(result[1].soumissionnaire.raison_sociale).toBe('Beta');
      expect(result[1].isQualifie).toBe(false);
    });

    it('classe par note finale décroissante parmi les qualifiés', () => {
      const soums = [
        makeSoum({
          id: 's1',
          raison_sociale: 'Gamma',
          note_technique: 75,
          note_financiere: 70,
          qualifie_technique: true,
        }),
        makeSoum({
          id: 's2',
          raison_sociale: 'Alpha',
          note_technique: 95,
          note_financiere: 90,
          qualifie_technique: true,
        }),
        makeSoum({
          id: 's3',
          raison_sociale: 'Beta',
          note_technique: 85,
          note_financiere: 80,
          qualifie_technique: true,
        }),
      ];
      const result = computeEvaluations(soums);
      // Alpha: 95*0.7 + 90*0.3 = 66.5 + 27 = 93.5
      // Beta: 85*0.7 + 80*0.3 = 59.5 + 24 = 83.5
      // Gamma: 75*0.7 + 70*0.3 = 52.5 + 21 = 73.5
      expect(result[0].soumissionnaire.raison_sociale).toBe('Alpha');
      expect(result[1].soumissionnaire.raison_sociale).toBe('Beta');
      expect(result[2].soumissionnaire.raison_sociale).toBe('Gamma');
    });

    it('attribue des rangs aux qualifiés', () => {
      const soums = [
        makeSoum({
          id: 's1',
          raison_sociale: 'Alpha',
          note_technique: 90,
          note_financiere: 85,
          qualifie_technique: true,
        }),
        makeSoum({
          id: 's2',
          raison_sociale: 'Beta',
          note_technique: 80,
          note_financiere: 75,
          qualifie_technique: true,
        }),
      ];
      const result = computeEvaluations(soums);
      expect(result[0].rang).toBe(1);
      expect(result[1].rang).toBe(2);
    });

    it('rang = null pour les non-qualifiés', () => {
      const soums = [
        makeSoum({
          id: 's1',
          note_technique: 50, // < 70
          note_financiere: 90,
        }),
      ];
      const result = computeEvaluations(soums);
      expect(result[0].rang).toBeNull();
    });

    it('respecte les rangs de la DB (rang_classement)', () => {
      const soums = [
        makeSoum({
          id: 's1',
          raison_sociale: 'Alpha',
          note_technique: 80,
          note_financiere: 80,
          qualifie_technique: true,
          rang_classement: 2, // DB override
        }),
        makeSoum({
          id: 's2',
          raison_sociale: 'Beta',
          note_technique: 90,
          note_financiere: 90,
          qualifie_technique: true,
          rang_classement: 1, // DB override
        }),
      ];
      const result = computeEvaluations(soums);
      // Beta (rang=1) doit être premier malgré l'ordre d'entrée
      expect(result[0].soumissionnaire.raison_sociale).toBe('Beta');
      expect(result[0].rang).toBe(1);
      expect(result[1].soumissionnaire.raison_sociale).toBe('Alpha');
      expect(result[1].rang).toBe(2);
    });
  });

  // ── Cas complexes ──

  describe('Cas complexes', () => {
    it('gère un mix de qualifiés, non-qualifiés et éliminés', () => {
      const soums = [
        makeSoum({
          id: 's1',
          raison_sociale: 'Éliminé',
          note_technique: null,
          statut: 'elimine',
        }),
        makeSoum({
          id: 's2',
          raison_sociale: 'Non qualifié',
          note_technique: 60,
          note_financiere: 95,
        }),
        makeSoum({
          id: 's3',
          raison_sociale: 'Qualifié',
          note_technique: 85,
          note_financiere: 80,
          qualifie_technique: true,
        }),
      ];
      const result = computeEvaluations(soums);
      expect(result).toHaveLength(3);
      // Qualifié en premier (rang 1)
      expect(result[0].soumissionnaire.raison_sociale).toBe('Qualifié');
      expect(result[0].rang).toBe(1);
      expect(result[0].isQualifie).toBe(true);
      // Les deux autres sans rang
      expect(result[1].rang).toBeNull();
      expect(result[2].rang).toBeNull();
    });

    it('5 soumissionnaires avec classement complet', () => {
      const soums = [
        makeSoum({
          id: 's1',
          raison_sociale: 'E1',
          note_technique: 90,
          note_financiere: 80,
          qualifie_technique: true,
        }),
        makeSoum({
          id: 's2',
          raison_sociale: 'E2',
          note_technique: 50,
          note_financiere: 95,
        }),
        makeSoum({
          id: 's3',
          raison_sociale: 'E3',
          note_technique: 85,
          note_financiere: 90,
          qualifie_technique: true,
        }),
        makeSoum({
          id: 's4',
          raison_sociale: 'E4',
          note_technique: 70,
          note_financiere: 70,
          qualifie_technique: true,
        }),
        makeSoum({
          id: 's5',
          raison_sociale: 'E5',
          note_technique: null,
          statut: 'elimine',
        }),
      ];

      const result = computeEvaluations(soums);
      expect(result).toHaveLength(5);

      // Qualifiés classés
      const ranked = result.filter((e) => e.rang !== null);
      expect(ranked).toHaveLength(3);
      // E3: 85*0.7+90*0.3 = 59.5+27 = 86.5 → rang 1
      // E1: 90*0.7+80*0.3 = 63+24 = 87 → rang 1 (actually E1 > E3)
      // Actually: E1: 90*0.7=63 + 80*0.3=24 = 87
      //           E3: 85*0.7=59.5 + 90*0.3=27 = 86.5
      //           E4: 70*0.7=49 + 70*0.3=21 = 70
      expect(ranked[0].soumissionnaire.raison_sociale).toBe('E1');
      expect(ranked[0].noteFinale).toBeCloseTo(87, 1);
      expect(ranked[0].rang).toBe(1);

      expect(ranked[1].soumissionnaire.raison_sociale).toBe('E3');
      expect(ranked[1].noteFinale).toBeCloseTo(86.5, 1);
      expect(ranked[1].rang).toBe(2);

      expect(ranked[2].soumissionnaire.raison_sociale).toBe('E4');
      expect(ranked[2].noteFinale).toBeCloseTo(70, 1);
      expect(ranked[2].rang).toBe(3);
    });

    it('retourne le type SoumEval correct', () => {
      const soums = [
        makeSoum({
          note_technique: 80,
          note_financiere: 75,
          qualifie_technique: true,
        }),
      ];
      const result = computeEvaluations(soums);
      const ev: SoumEval = result[0];

      expect(ev).toHaveProperty('soumissionnaire');
      expect(ev).toHaveProperty('noteFinale');
      expect(ev).toHaveProperty('isQualifie');
      expect(ev).toHaveProperty('rang');
      expect(ev.soumissionnaire.id).toBeTruthy();
    });
  });
});
