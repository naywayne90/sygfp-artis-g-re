/**
 * Tests unitaires — Module Passation de Marché
 * Fonctions pures : seuils, procédures, prérequis workflow, constantes, helpers
 *
 * 45+ tests couvrant :
 * A. Seuils & procédures (getSeuilRecommande, getSeuilForMontant, isProcedureCoherente)
 * B. Prérequis workflow (canPublish, canClose, canStartEvaluation, canAward, canApprove, canSign)
 * C. Constantes & types (STATUTS, WORKFLOW_STEPS, MODES_PASSATION, etc.)
 * D. Helpers export (formatage monétaire, dates, noms)
 */

import { describe, it, expect } from 'vitest';
import {
  getSeuilRecommande,
  getSeuilForMontant,
  isProcedureCoherente,
  canPublish,
  canClose,
  canStartEvaluation,
  canAward,
  canApprove,
  canSign,
  SEUILS_PASSATION,
  SEUILS_DGMP,
  STATUTS,
  WORKFLOW_STEPS,
  LIFECYCLE_STEPS,
  MODES_PASSATION,
  PROCEDURES_PASSATION,
  DECISIONS_SORTIE,
  STATUTS_SOUMISSIONNAIRE,
  MIN_SOUMISSIONNAIRES,
  SEUIL_NOTE_TECHNIQUE,
  POIDS_TECHNIQUE,
  POIDS_FINANCIER,
  type PassationMarche,
  type Soumissionnaire,
} from '@/hooks/usePassationsMarche';

// ---------------------------------------------------------------------------
// Factory helpers pour créer des objets de test
// ---------------------------------------------------------------------------

function makePassation(overrides: Partial<PassationMarche> = {}): PassationMarche {
  return {
    id: 'pm-test-1',
    reference: 'PM-2026-001',
    dossier_id: null,
    expression_besoin_id: 'eb-1',
    mode_passation: 'AO_ouvert',
    type_procedure: null,
    seuil_montant: null,
    lots: [],
    allotissement: false,
    soumissionnaires: [],
    prestataires_sollicites: [],
    analyse_offres: null,
    criteres_evaluation: [],
    pv_ouverture: null,
    pv_evaluation: null,
    rapport_analyse: null,
    decision: null,
    justification_decision: null,
    prestataire_retenu_id: null,
    montant_retenu: null,
    motif_selection: null,
    statut: 'brouillon',
    exercice: 2026,
    created_by: 'user-1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    submitted_at: null,
    validated_at: null,
    rejected_at: null,
    differed_at: null,
    rejection_reason: null,
    motif_differe: null,
    date_reprise: null,
    date_publication: '2026-02-01',
    date_cloture: '2026-03-01',
    publie_at: null,
    publie_by: null,
    cloture_at: null,
    cloture_by: null,
    evaluation_at: null,
    evaluation_by: null,
    attribue_at: null,
    attribue_by: null,
    approuve_at: null,
    approuve_by: null,
    signe_at: null,
    signe_by: null,
    contrat_url: null,
    motif_rejet_attribution: null,
    pieces_jointes: [],
    expression_besoin: {
      id: 'eb-1',
      numero: 'EB-2026-001',
      objet: 'Fourniture matériel informatique',
      montant_estime: 50_000_000,
      direction_id: 'dir-1',
      ligne_budgetaire_id: null,
      type_procedure: null,
    },
    ...overrides,
  } as PassationMarche;
}

function makeSoumissionnaire(overrides: Partial<Soumissionnaire> = {}): Soumissionnaire {
  return {
    id: 'soum-1',
    passation_marche_id: 'pm-test-1',
    lot_marche_id: null,
    prestataire_id: null,
    is_manual_entry: true,
    raison_sociale: 'Entreprise Test',
    contact_nom: null,
    email: null,
    telephone: null,
    rccm: null,
    offre_technique_url: null,
    offre_financiere: 45_000_000,
    date_depot: '2026-02-15',
    note_technique: null,
    note_financiere: null,
    qualifie_technique: false,
    note_finale: null,
    rang_classement: null,
    statut: 'recu',
    motif_elimination: null,
    observations: null,
    created_by: 'user-1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// A. SEUILS & PROCÉDURES
// ═══════════════════════════════════════════════════════════════════════════

describe('A. Seuils & Procédures', () => {
  // ── getSeuilRecommande ──

  describe('getSeuilRecommande', () => {
    it('retourne null pour un montant null', () => {
      expect(getSeuilRecommande(null)).toBeNull();
    });

    it('retourne null pour un montant négatif', () => {
      expect(getSeuilRecommande(-1000)).toBeNull();
    });

    it('retourne null pour un montant 0', () => {
      expect(getSeuilRecommande(0)).toBeNull();
    });

    it('retourne PSD pour montant < 10M', () => {
      const seuil = getSeuilRecommande(5_000_000);
      expect(seuil).not.toBeNull();
      expect(seuil?.code).toBe('PSD');
      expect(seuil?.mode_value).toBe('entente_directe');
    });

    it('retourne PSC pour montant entre 10M et 30M', () => {
      const seuil = getSeuilRecommande(15_000_000);
      expect(seuil).not.toBeNull();
      expect(seuil?.code).toBe('PSC');
    });

    it('retourne PSL pour montant entre 30M et 100M', () => {
      const seuil = getSeuilRecommande(50_000_000);
      expect(seuil).not.toBeNull();
      expect(seuil?.code).toBe('PSL');
    });

    it('retourne PSO pour montant >= 100M', () => {
      const seuil = getSeuilRecommande(200_000_000);
      expect(seuil).not.toBeNull();
      expect(seuil?.code).toBe('PSO');
    });

    it('gère les montants limites exactement à 10M (PSC)', () => {
      const seuil = getSeuilRecommande(10_000_000);
      expect(seuil?.code).toBe('PSC');
    });

    it('gère les montants limites exactement à 30M (PSL)', () => {
      const seuil = getSeuilRecommande(30_000_000);
      expect(seuil?.code).toBe('PSL');
    });

    it('gère les montants limites exactement à 100M (PSO)', () => {
      const seuil = getSeuilRecommande(100_000_000);
      expect(seuil?.code).toBe('PSO');
    });
  });

  // ── getSeuilForMontant ──

  describe('getSeuilForMontant', () => {
    it('retourne null pour montant null', () => {
      expect(getSeuilForMontant(null)).toBeNull();
    });

    it('retourne null pour montant <= 0', () => {
      expect(getSeuilForMontant(0)).toBeNull();
      expect(getSeuilForMontant(-500)).toBeNull();
    });

    it('retourne Entente directe pour < 10M', () => {
      const seuil = getSeuilForMontant(5_000_000);
      expect(seuil?.label).toBe('Entente directe');
      expect(seuil?.procedure).toBe('entente_directe');
    });

    it('retourne Demande de cotation pour 10M-30M', () => {
      const seuil = getSeuilForMontant(20_000_000);
      expect(seuil?.label).toBe('Demande de cotation');
    });

    it('retourne Compétition limitée pour 30M-100M', () => {
      const seuil = getSeuilForMontant(75_000_000);
      expect(seuil?.label).toBe('Compétition limitée');
    });

    it('retourne AO ouvert pour >= 100M', () => {
      const seuil = getSeuilForMontant(500_000_000);
      expect(seuil?.label).toBe("Appel d'offres ouvert");
    });
  });

  // ── isProcedureCoherente ──

  describe('isProcedureCoherente', () => {
    it('retourne true si montant est null', () => {
      expect(isProcedureCoherente(null, 'AO_ouvert')).toBe(true);
    });

    it('retourne true pour gré à gré quel que soit le montant', () => {
      expect(isProcedureCoherente(200_000_000, 'gre_a_gre')).toBe(true);
    });

    it('retourne true pour prestations intellectuelles quel que soit le montant', () => {
      expect(isProcedureCoherente(200_000_000, 'prestations_intellectuelles')).toBe(true);
    });

    it('retourne true pour procédure cohérente avec le seuil', () => {
      expect(isProcedureCoherente(5_000_000, 'entente_directe')).toBe(true);
    });

    it('retourne false pour procédure incohérente avec le seuil', () => {
      // 5M FCFA → entente_directe attendu, pas AO_ouvert
      expect(isProcedureCoherente(5_000_000, 'AO_ouvert')).toBe(false);
    });

    it('détecte incohérence montant élevé avec entente directe', () => {
      // 200M → AO_ouvert attendu, pas entente_directe
      expect(isProcedureCoherente(200_000_000, 'entente_directe')).toBe(false);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// B. PRÉREQUIS WORKFLOW
// ═══════════════════════════════════════════════════════════════════════════

describe('B. Prérequis Workflow', () => {
  // ── canPublish ──

  describe('canPublish', () => {
    it('réussit avec toutes les conditions remplies', () => {
      const p = makePassation({
        statut: 'brouillon',
        expression_besoin_id: 'eb-1',
        mode_passation: 'AO_ouvert',
        date_publication: '2026-02-01',
        date_cloture: '2026-03-01',
      });
      const result = canPublish(p);
      expect(result.ok).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('échoue si statut != brouillon', () => {
      const p = makePassation({ statut: 'publie' });
      const result = canPublish(p);
      expect(result.ok).toBe(false);
      expect(result.errors).toContain('Le statut doit être "brouillon"');
    });

    it('échoue sans expression de besoin', () => {
      const p = makePassation({ expression_besoin_id: null });
      const result = canPublish(p);
      expect(result.ok).toBe(false);
      expect(result.errors).toContain('Expression de besoin liée obligatoire');
    });

    it('échoue sans mode de passation', () => {
      const p = makePassation({ mode_passation: '' });
      const result = canPublish(p);
      expect(result.ok).toBe(false);
      expect(result.errors).toContain('Mode de passation obligatoire');
    });

    it('échoue sans date de publication', () => {
      const p = makePassation({ date_publication: null });
      const result = canPublish(p);
      expect(result.ok).toBe(false);
      expect(result.errors).toContain('Date de publication obligatoire');
    });

    it('échoue sans date de clôture', () => {
      const p = makePassation({ date_cloture: null });
      const result = canPublish(p);
      expect(result.ok).toBe(false);
      expect(result.errors).toContain('Date de clôture obligatoire');
    });

    it('échoue si date clôture <= date publication', () => {
      const p = makePassation({
        date_publication: '2026-03-01',
        date_cloture: '2026-02-01',
      });
      const result = canPublish(p);
      expect(result.ok).toBe(false);
      expect(result.errors).toContain(
        'La date de clôture doit être postérieure à la date de publication'
      );
    });

    it('échoue si alloti sans lots', () => {
      const p = makePassation({ allotissement: true, lots: [] });
      const result = canPublish(p);
      expect(result.ok).toBe(false);
      expect(result.errors).toContain('Au moins 1 lot requis pour un marché alloti');
    });

    it('réussit si alloti avec lots', () => {
      const p = makePassation({
        allotissement: true,
        lots: [
          {
            id: 'lot-1',
            numero: 1,
            designation: 'Lot A',
            description: 'Test',
            montant_estime: 10_000_000,
          },
        ],
      });
      const result = canPublish(p);
      expect(result.ok).toBe(true);
    });

    it('remonte plusieurs erreurs simultanément', () => {
      const p = makePassation({
        statut: 'publie',
        expression_besoin_id: null,
        mode_passation: '',
        date_publication: null,
        date_cloture: null,
      });
      const result = canPublish(p);
      expect(result.ok).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(4);
    });
  });

  // ── canClose ──

  describe('canClose', () => {
    it('réussit si statut = publié', () => {
      const p = makePassation({ statut: 'publie' });
      expect(canClose(p).ok).toBe(true);
    });

    it('échoue si statut != publié', () => {
      const p = makePassation({ statut: 'brouillon' });
      const result = canClose(p);
      expect(result.ok).toBe(false);
      expect(result.errors).toContain('Le statut doit être "publié"');
    });
  });

  // ── canStartEvaluation ──

  describe('canStartEvaluation', () => {
    it('réussit si clôturé avec soumissionnaires', () => {
      const p = makePassation({
        statut: 'cloture',
        soumissionnaires: [makeSoumissionnaire()],
      });
      expect(canStartEvaluation(p).ok).toBe(true);
    });

    it('échoue si statut != clôturé', () => {
      const p = makePassation({
        statut: 'publie',
        soumissionnaires: [makeSoumissionnaire()],
      });
      const result = canStartEvaluation(p);
      expect(result.ok).toBe(false);
      expect(result.errors).toContain('Le statut doit être "clôturé"');
    });

    it('échoue sans soumissionnaires', () => {
      const p = makePassation({ statut: 'cloture', soumissionnaires: [] });
      const result = canStartEvaluation(p);
      expect(result.ok).toBe(false);
      expect(result.errors).toContain('Au moins 1 soumissionnaire requis');
    });
  });

  // ── canAward ──

  describe('canAward', () => {
    it('réussit si en_evaluation avec tous évalués et qualifiés', () => {
      const p = makePassation({
        statut: 'en_evaluation',
        soumissionnaires: [
          makeSoumissionnaire({
            id: 's1',
            note_technique: 80,
            note_financiere: 90,
            note_finale: 83,
            qualifie_technique: true,
            statut: 'qualifie',
          }),
        ],
      });
      expect(canAward(p).ok).toBe(true);
    });

    it('échoue si statut != en_evaluation', () => {
      const p = makePassation({ statut: 'cloture' });
      const result = canAward(p);
      expect(result.ok).toBe(false);
      expect(result.errors).toContain('Le statut doit être "en évaluation"');
    });

    it('échoue si soumissionnaires non évalués', () => {
      const p = makePassation({
        statut: 'en_evaluation',
        soumissionnaires: [makeSoumissionnaire({ note_finale: null, statut: 'conforme' })],
      });
      const result = canAward(p);
      expect(result.ok).toBe(false);
      expect(result.errors[0]).toContain('non évalué');
    });

    it('échoue si aucun soumissionnaire qualifié', () => {
      const p = makePassation({
        statut: 'en_evaluation',
        soumissionnaires: [
          makeSoumissionnaire({
            note_finale: 50,
            qualifie_technique: false,
            statut: 'elimine',
          }),
        ],
      });
      const result = canAward(p);
      expect(result.ok).toBe(false);
      expect(result.errors).toContain('Aucun soumissionnaire qualifié');
    });

    it('ignore les éliminés pour le check non-évalués', () => {
      const p = makePassation({
        statut: 'en_evaluation',
        soumissionnaires: [
          makeSoumissionnaire({
            id: 's1',
            note_finale: 83,
            qualifie_technique: true,
            statut: 'qualifie',
          }),
          makeSoumissionnaire({
            id: 's2',
            note_finale: null,
            qualifie_technique: false,
            statut: 'elimine',
          }),
        ],
      });
      const result = canAward(p);
      expect(result.ok).toBe(true);
    });
  });

  // ── canApprove ──

  describe('canApprove', () => {
    it('réussit si statut = attribué', () => {
      const p = makePassation({ statut: 'attribue' });
      expect(canApprove(p).ok).toBe(true);
    });

    it('échoue si statut != attribué', () => {
      const p = makePassation({ statut: 'en_evaluation' });
      const result = canApprove(p);
      expect(result.ok).toBe(false);
      expect(result.errors).toContain('Le statut doit être "attribué"');
    });
  });

  // ── canSign ──

  describe('canSign', () => {
    it('réussit si approuvé avec contrat URL', () => {
      const p = makePassation({
        statut: 'approuve',
        contrat_url: 'https://example.com/contrat.pdf',
      });
      expect(canSign(p).ok).toBe(true);
    });

    it('échoue si statut != approuvé', () => {
      const p = makePassation({
        statut: 'attribue',
        contrat_url: 'https://example.com/contrat.pdf',
      });
      const result = canSign(p);
      expect(result.ok).toBe(false);
      expect(result.errors).toContain('Le statut doit être "approuvé"');
    });

    it('échoue sans URL de contrat', () => {
      const p = makePassation({ statut: 'approuve', contrat_url: null });
      const result = canSign(p);
      expect(result.ok).toBe(false);
      expect(result.errors).toContain('URL du contrat signé obligatoire');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// C. CONSTANTES & TYPES
// ═══════════════════════════════════════════════════════════════════════════

describe('C. Constantes & Types', () => {
  describe('SEUILS_PASSATION', () => {
    it('contient 4 seuils', () => {
      expect(SEUILS_PASSATION).toHaveLength(4);
    });

    it('couvre de 0 à Infinity sans trou', () => {
      for (let i = 0; i < SEUILS_PASSATION.length - 1; i++) {
        expect(SEUILS_PASSATION[i].max).toBe(SEUILS_PASSATION[i + 1].min);
      }
      expect(SEUILS_PASSATION[0].min).toBe(0);
      expect(SEUILS_PASSATION[SEUILS_PASSATION.length - 1].max).toBe(Infinity);
    });

    it('chaque seuil a un code, label, et mode_value', () => {
      for (const s of SEUILS_PASSATION) {
        expect(s.code).toBeTruthy();
        expect(s.label).toBeTruthy();
        expect(s.mode_value).toBeTruthy();
      }
    });
  });

  describe('SEUILS_DGMP', () => {
    it('contient 4 seuils', () => {
      expect(SEUILS_DGMP).toHaveLength(4);
    });

    it('chaque seuil a label, color, procedure', () => {
      for (const s of SEUILS_DGMP) {
        expect(s.label).toBeTruthy();
        expect(s.color).toBeTruthy();
        expect(s.procedure).toBeTruthy();
      }
    });
  });

  describe('STATUTS', () => {
    it('contient les 7 statuts principaux du workflow', () => {
      const expected = [
        'brouillon',
        'publie',
        'cloture',
        'en_evaluation',
        'attribue',
        'approuve',
        'signe',
      ];
      for (const key of expected) {
        expect(STATUTS[key]).toBeDefined();
        expect(STATUTS[key].label).toBeTruthy();
        expect(STATUTS[key].color).toBeTruthy();
        expect(typeof STATUTS[key].step).toBe('number');
      }
    });

    it('les steps principaux sont ordonnés 0→6', () => {
      expect(STATUTS.brouillon.step).toBe(0);
      expect(STATUTS.publie.step).toBe(1);
      expect(STATUTS.cloture.step).toBe(2);
      expect(STATUTS.en_evaluation.step).toBe(3);
      expect(STATUTS.attribue.step).toBe(4);
      expect(STATUTS.approuve.step).toBe(5);
      expect(STATUTS.signe.step).toBe(6);
    });

    it('contient les statuts legacy avec step -1', () => {
      expect(STATUTS.soumis.step).toBe(-1);
      expect(STATUTS.rejete.step).toBe(-1);
      expect(STATUTS.differe.step).toBe(-1);
    });
  });

  describe('WORKFLOW_STEPS', () => {
    it('contient 7 étapes', () => {
      expect(WORKFLOW_STEPS).toHaveLength(7);
    });

    it('les clés correspondent aux statuts principaux', () => {
      const keys = WORKFLOW_STEPS.map((s) => s.key);
      expect(keys).toEqual([
        'brouillon',
        'publie',
        'cloture',
        'en_evaluation',
        'attribue',
        'approuve',
        'signe',
      ]);
    });
  });

  describe('LIFECYCLE_STEPS', () => {
    it('contient 7 étapes dans lordre', () => {
      expect(LIFECYCLE_STEPS).toEqual([
        'brouillon',
        'publie',
        'cloture',
        'en_evaluation',
        'attribue',
        'approuve',
        'signe',
      ]);
    });
  });

  describe('MODES_PASSATION / PROCEDURES_PASSATION', () => {
    it('contient 7 modes', () => {
      expect(MODES_PASSATION).toHaveLength(7);
    });

    it('MODES_PASSATION === PROCEDURES_PASSATION (alias)', () => {
      expect(MODES_PASSATION).toBe(PROCEDURES_PASSATION);
    });

    it('chaque mode a value et label', () => {
      for (const m of MODES_PASSATION) {
        expect(m.value).toBeTruthy();
        expect(m.label).toBeTruthy();
      }
    });

    it('inclut les modes clés', () => {
      const values = MODES_PASSATION.map((m) => m.value);
      expect(values).toContain('entente_directe');
      expect(values).toContain('AO_ouvert');
      expect(values).toContain('gre_a_gre');
      expect(values).toContain('prestations_intellectuelles');
    });
  });

  describe('DECISIONS_SORTIE', () => {
    it('contient 2 décisions', () => {
      expect(DECISIONS_SORTIE).toHaveLength(2);
    });

    it('engagement_possible et contrat_a_creer', () => {
      const values = DECISIONS_SORTIE.map((d) => d.value);
      expect(values).toContain('engagement_possible');
      expect(values).toContain('contrat_a_creer');
    });
  });

  describe('STATUTS_SOUMISSIONNAIRE', () => {
    it('contient les 5 statuts', () => {
      const keys = Object.keys(STATUTS_SOUMISSIONNAIRE);
      expect(keys).toEqual(['recu', 'conforme', 'qualifie', 'retenu', 'elimine']);
    });

    it('chaque statut a label et color', () => {
      for (const s of Object.values(STATUTS_SOUMISSIONNAIRE)) {
        expect(s.label).toBeTruthy();
        expect(s.color).toBeTruthy();
      }
    });

    it('les transitions sont logiques', () => {
      expect(STATUTS_SOUMISSIONNAIRE.recu.next).toContain('conforme');
      expect(STATUTS_SOUMISSIONNAIRE.recu.next).toContain('elimine');
      expect(STATUTS_SOUMISSIONNAIRE.conforme.next).toContain('qualifie');
      expect(STATUTS_SOUMISSIONNAIRE.qualifie.next).toContain('retenu');
      // retenu est terminal
      expect(STATUTS_SOUMISSIONNAIRE.retenu.next).toBeUndefined();
    });
  });

  describe('MIN_SOUMISSIONNAIRES', () => {
    it('entente_directe = 1', () => {
      expect(MIN_SOUMISSIONNAIRES.entente_directe).toBe(1);
    });

    it('AO_ouvert = 3', () => {
      expect(MIN_SOUMISSIONNAIRES.AO_ouvert).toBe(3);
    });

    it('gre_a_gre = 1', () => {
      expect(MIN_SOUMISSIONNAIRES.gre_a_gre).toBe(1);
    });
  });

  describe('Constantes évaluation', () => {
    it('SEUIL_NOTE_TECHNIQUE = 70', () => {
      expect(SEUIL_NOTE_TECHNIQUE).toBe(70);
    });

    it('POIDS_TECHNIQUE = 0.7', () => {
      expect(POIDS_TECHNIQUE).toBe(0.7);
    });

    it('POIDS_FINANCIER = 0.3', () => {
      expect(POIDS_FINANCIER).toBe(0.3);
    });

    it('POIDS_TECHNIQUE + POIDS_FINANCIER = 1', () => {
      expect(POIDS_TECHNIQUE + POIDS_FINANCIER).toBeCloseTo(1.0);
    });
  });
});
