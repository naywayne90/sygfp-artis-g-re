import { describe, it, expect } from 'vitest';
import {
  VALIDATION_STEPS,
  VALIDATION_STATUTS,
  getStepFromStatut,
  checkEngagementCompleteness,
  type Engagement,
  type BudgetAvailability,
  type TypeEngagement,
} from '@/hooks/useEngagements';
import { numberToWords, numberToWordsCFA } from '@/lib/utils/numberToWords';
import {
  fmtCurrencyExport,
  fmtDateExport,
  statutLabel,
  typeEngagementLabel,
  computeSuiviBudgetaire,
} from '@/hooks/useEngagementExport';

// ---------------------------------------------------------------------------
// Filter helpers — updated to match new hook logic (includes visa statuts)
// ---------------------------------------------------------------------------
const filterAValider = (engagements: Engagement[]) =>
  engagements.filter((e) => (VALIDATION_STATUTS as readonly string[]).includes(e.statut || ''));

const filterValides = (engagements: Engagement[]) =>
  engagements.filter((e) => e.statut === 'valide');

const filterRejetes = (engagements: Engagement[]) =>
  engagements.filter((e) => e.statut === 'rejete');

const filterDifferes = (engagements: Engagement[]) =>
  engagements.filter((e) => e.statut === 'differe');

// ---------------------------------------------------------------------------
// Budget availability formula — same as useEngagements.calculateAvailability
// ---------------------------------------------------------------------------
const calculateBudgetAvailability = (
  dotation_initiale: number,
  virements_recus: number,
  virements_emis: number,
  engagements_anterieurs: number,
  engagement_actuel: number
): BudgetAvailability => {
  const dotation_actuelle = dotation_initiale + virements_recus - virements_emis;
  const cumul = engagements_anterieurs + engagement_actuel;
  const disponible = dotation_actuelle - cumul;
  return {
    dotation_initiale,
    virements_recus,
    virements_emis,
    dotation_actuelle,
    engagements_anterieurs,
    engagement_actuel,
    cumul,
    disponible,
    is_sufficient: disponible >= 0,
  };
};

// ---------------------------------------------------------------------------
// Helper — mock engagement factory (with visa columns)
// ---------------------------------------------------------------------------
const createMockEngagement = (overrides: Partial<Engagement> = {}): Engagement => ({
  id: 'test-id',
  numero: 'ARTI050226001',
  objet: 'Test engagement',
  montant: 1_000_000,
  montant_ht: 900_000,
  tva: 18,
  fournisseur: 'Test Fournisseur',
  date_engagement: '2026-01-15',
  statut: 'brouillon',
  workflow_status: 'en_attente',
  current_step: 0,
  budget_line_id: 'bl-001',
  expression_besoin_id: 'eb-001',
  marche_id: null,
  passation_marche_id: null,
  dossier_id: null,
  type_engagement: 'hors_marche',
  note_id: null,
  exercice: 2026,
  created_by: 'user-001',
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-01-15T10:00:00Z',
  date_differe: null,
  motif_differe: null,
  differe_by: null,
  deadline_correction: null,
  required_documents: null,
  // Colonnes visa
  visa_saf_user_id: null,
  visa_saf_date: null,
  visa_saf_commentaire: null,
  visa_cb_user_id: null,
  visa_cb_date: null,
  visa_cb_commentaire: null,
  visa_daaf_user_id: null,
  visa_daaf_date: null,
  visa_daaf_commentaire: null,
  visa_dg_user_id: null,
  visa_dg_date: null,
  visa_dg_commentaire: null,
  motif_rejet: null,
  ...overrides,
});

// ===========================================================================
// 1. VALIDATION_STEPS
// ===========================================================================
describe('VALIDATION_STEPS', () => {
  it('devrait avoir exactement 4 étapes', () => {
    expect(VALIDATION_STEPS).toHaveLength(4);
  });

  it('devrait avoir les étapes dans le bon ordre', () => {
    expect(VALIDATION_STEPS[0].order).toBe(1);
    expect(VALIDATION_STEPS[1].order).toBe(2);
    expect(VALIDATION_STEPS[2].order).toBe(3);
    expect(VALIDATION_STEPS[3].order).toBe(4);
  });

  it('devrait avoir les bons rôles', () => {
    expect(VALIDATION_STEPS.map((s) => s.role)).toEqual(['SAF', 'CB', 'DAF', 'DG']);
  });

  it('chaque étape devrait avoir un label non vide', () => {
    VALIDATION_STEPS.forEach((step) => {
      expect(step.label).toBeTruthy();
      expect(step.label.length).toBeGreaterThan(0);
    });
  });

  it('les ordres devraient être consécutifs commençant à 1', () => {
    VALIDATION_STEPS.forEach((step, index) => {
      expect(step.order).toBe(index + 1);
    });
  });

  it('chaque étape devrait avoir un visaStatut', () => {
    expect(VALIDATION_STEPS[0].visaStatut).toBe('visa_saf');
    expect(VALIDATION_STEPS[1].visaStatut).toBe('visa_cb');
    expect(VALIDATION_STEPS[2].visaStatut).toBe('visa_daaf');
    expect(VALIDATION_STEPS[3].visaStatut).toBe('valide');
  });

  it('chaque étape devrait avoir un visaPrefix', () => {
    expect(VALIDATION_STEPS[0].visaPrefix).toBe('visa_saf');
    expect(VALIDATION_STEPS[1].visaPrefix).toBe('visa_cb');
    expect(VALIDATION_STEPS[2].visaPrefix).toBe('visa_daaf');
    expect(VALIDATION_STEPS[3].visaPrefix).toBe('visa_dg');
  });
});

// ===========================================================================
// 1b. VALIDATION_STATUTS
// ===========================================================================
describe('VALIDATION_STATUTS', () => {
  it('contient les 4 statuts intermédiaires de validation', () => {
    expect(VALIDATION_STATUTS).toEqual(['soumis', 'visa_saf', 'visa_cb', 'visa_daaf']);
  });

  it('ne contient pas valide ni rejete', () => {
    expect(VALIDATION_STATUTS).not.toContain('valide');
    expect(VALIDATION_STATUTS).not.toContain('rejete');
    expect(VALIDATION_STATUTS).not.toContain('brouillon');
  });
});

// ===========================================================================
// 1c. getStepFromStatut
// ===========================================================================
describe('getStepFromStatut', () => {
  it('soumis → étape 1', () => {
    expect(getStepFromStatut('soumis')).toBe(1);
  });

  it('visa_saf → étape 2', () => {
    expect(getStepFromStatut('visa_saf')).toBe(2);
  });

  it('visa_cb → étape 3', () => {
    expect(getStepFromStatut('visa_cb')).toBe(3);
  });

  it('visa_daaf → étape 4', () => {
    expect(getStepFromStatut('visa_daaf')).toBe(4);
  });

  it('brouillon → 0', () => {
    expect(getStepFromStatut('brouillon')).toBe(0);
  });

  it('valide → 0', () => {
    expect(getStepFromStatut('valide')).toBe(0);
  });

  it('rejete → 0', () => {
    expect(getStepFromStatut('rejete')).toBe(0);
  });

  it('null → 0', () => {
    expect(getStepFromStatut(null)).toBe(0);
  });
});

// ===========================================================================
// 1d. checkEngagementCompleteness
// ===========================================================================
describe('checkEngagementCompleteness', () => {
  it('engagement complet → isComplete true, aucun champ manquant', () => {
    const eng = createMockEngagement();
    const result = checkEngagementCompleteness(eng);
    expect(result.isComplete).toBe(true);
    expect(result.missingFields).toHaveLength(0);
  });

  it('objet manquant → champ Objet manquant', () => {
    const eng = createMockEngagement({ objet: '' });
    const result = checkEngagementCompleteness(eng);
    expect(result.isComplete).toBe(false);
    expect(result.missingFields).toContain('Objet');
  });

  it('montant nul → champ Montant manquant', () => {
    const eng = createMockEngagement({ montant: 0 });
    const result = checkEngagementCompleteness(eng);
    expect(result.isComplete).toBe(false);
    expect(result.missingFields).toContain('Montant');
  });

  it('montant négatif → champ Montant manquant', () => {
    const eng = createMockEngagement({ montant: -100 });
    const result = checkEngagementCompleteness(eng);
    expect(result.isComplete).toBe(false);
    expect(result.missingFields).toContain('Montant');
  });

  it('fournisseur manquant → champ Fournisseur manquant', () => {
    const eng = createMockEngagement({ fournisseur: null });
    const result = checkEngagementCompleteness(eng);
    expect(result.isComplete).toBe(false);
    expect(result.missingFields).toContain('Fournisseur');
  });

  it('budget_line_id manquant → champ Ligne budgétaire manquant', () => {
    const eng = createMockEngagement({ budget_line_id: '' });
    const result = checkEngagementCompleteness(eng);
    expect(result.isComplete).toBe(false);
    expect(result.missingFields).toContain('Ligne budgétaire');
  });

  it('plusieurs champs manquants', () => {
    const result = checkEngagementCompleteness({
      objet: '',
      montant: 0,
      fournisseur: null,
      budget_line_id: '',
    });
    expect(result.isComplete).toBe(false);
    expect(result.missingFields).toHaveLength(4);
    expect(result.missingFields).toEqual(
      expect.arrayContaining(['Objet', 'Montant', 'Fournisseur', 'Ligne budgétaire'])
    );
  });

  it('objet vide string → manquant', () => {
    const eng = createMockEngagement({ objet: '' });
    expect(checkEngagementCompleteness(eng).isComplete).toBe(false);
  });
});

// ===========================================================================
// 2. Filter helpers
// ===========================================================================
describe('Filter helpers', () => {
  const engagements = [
    createMockEngagement({ id: '1', statut: 'brouillon', workflow_status: 'en_attente' }),
    createMockEngagement({ id: '2', statut: 'soumis', workflow_status: 'en_validation' }),
    createMockEngagement({ id: '3', statut: 'visa_saf', workflow_status: 'en_validation' }),
    createMockEngagement({ id: '4', statut: 'visa_cb', workflow_status: 'en_validation' }),
    createMockEngagement({ id: '5', statut: 'visa_daaf', workflow_status: 'en_validation' }),
    createMockEngagement({ id: '6', statut: 'valide', workflow_status: 'termine' }),
    createMockEngagement({ id: '7', statut: 'valide', workflow_status: 'termine' }),
    createMockEngagement({ id: '8', statut: 'valide', workflow_status: 'termine' }),
    createMockEngagement({ id: '9', statut: 'rejete', workflow_status: 'rejete' }),
    createMockEngagement({ id: '10', statut: 'differe', workflow_status: 'differe' }),
  ];

  it('filterAValider retourne les engagements en cours de validation (soumis + visa_*)', () => {
    const result = filterAValider(engagements);
    expect(result).toHaveLength(4);
    result.forEach((e) => {
      expect((VALIDATION_STATUTS as readonly string[]).includes(e.statut || '')).toBe(true);
    });
  });

  it('filterValides retourne les engagements validés', () => {
    const result = filterValides(engagements);
    expect(result).toHaveLength(3);
    result.forEach((e) => expect(e.statut).toBe('valide'));
  });

  it('filterRejetes retourne les engagements rejetés', () => {
    const result = filterRejetes(engagements);
    expect(result).toHaveLength(1);
    result.forEach((e) => expect(e.statut).toBe('rejete'));
  });

  it('filterDifferes retourne les engagements différés', () => {
    const result = filterDifferes(engagements);
    expect(result).toHaveLength(1);
    result.forEach((e) => expect(e.statut).toBe('differe'));
  });

  it('tous les filtres sur liste vide retournent vide', () => {
    expect(filterAValider([])).toHaveLength(0);
    expect(filterValides([])).toHaveLength(0);
    expect(filterRejetes([])).toHaveLength(0);
    expect(filterDifferes([])).toHaveLength(0);
  });

  it('les filtres sont mutuellement exclusifs', () => {
    const aValider = filterAValider(engagements);
    const valides = filterValides(engagements);
    const rejetes = filterRejetes(engagements);
    const differes = filterDifferes(engagements);

    const allFiltered = [...aValider, ...valides, ...rejetes, ...differes];
    const uniqueIds = new Set(allFiltered.map((e) => e.id));
    expect(uniqueIds.size).toBe(allFiltered.length);
  });
});

// ===========================================================================
// 3. Budget availability
// ===========================================================================
describe('Budget availability', () => {
  it('calcule correctement le disponible sans virements', () => {
    const result = calculateBudgetAvailability(10_000_000, 0, 0, 3_000_000, 2_000_000);
    expect(result.dotation_actuelle).toBe(10_000_000);
    expect(result.cumul).toBe(5_000_000);
    expect(result.disponible).toBe(5_000_000);
    expect(result.is_sufficient).toBe(true);
  });

  it('calcule correctement avec virements reçus', () => {
    const result = calculateBudgetAvailability(10_000_000, 2_000_000, 0, 3_000_000, 2_000_000);
    expect(result.dotation_actuelle).toBe(12_000_000);
    expect(result.disponible).toBe(7_000_000);
    expect(result.is_sufficient).toBe(true);
  });

  it('calcule correctement avec virements émis', () => {
    const result = calculateBudgetAvailability(10_000_000, 0, 3_000_000, 3_000_000, 2_000_000);
    expect(result.dotation_actuelle).toBe(7_000_000);
    expect(result.disponible).toBe(2_000_000);
    expect(result.is_sufficient).toBe(true);
  });

  it('calcule correctement avec les deux types de virements', () => {
    const result = calculateBudgetAvailability(
      10_000_000,
      5_000_000,
      3_000_000,
      4_000_000,
      3_000_000
    );
    expect(result.dotation_actuelle).toBe(12_000_000);
    expect(result.cumul).toBe(7_000_000);
    expect(result.disponible).toBe(5_000_000);
    expect(result.is_sufficient).toBe(true);
  });

  it('détecte un budget insuffisant', () => {
    const result = calculateBudgetAvailability(5_000_000, 0, 0, 3_000_000, 3_000_000);
    expect(result.disponible).toBe(-1_000_000);
    expect(result.is_sufficient).toBe(false);
  });

  it('gère un disponible exactement à zéro', () => {
    const result = calculateBudgetAvailability(5_000_000, 0, 0, 3_000_000, 2_000_000);
    expect(result.disponible).toBe(0);
    expect(result.is_sufficient).toBe(true);
  });

  it('gère des montants nuls', () => {
    const result = calculateBudgetAvailability(0, 0, 0, 0, 0);
    expect(result.dotation_actuelle).toBe(0);
    expect(result.cumul).toBe(0);
    expect(result.disponible).toBe(0);
    expect(result.is_sufficient).toBe(true);
  });

  it('formule: disponible = dotation_actuelle - cumul', () => {
    const result = calculateBudgetAvailability(8_000_000, 1_000_000, 500_000, 2_000_000, 1_500_000);
    expect(result.disponible).toBe(result.dotation_actuelle - result.cumul);
  });

  it('formule: dotation_actuelle = initiale + recus - emis', () => {
    const result = calculateBudgetAvailability(8_000_000, 1_000_000, 500_000, 0, 0);
    expect(result.dotation_actuelle).toBe(8_000_000 + 1_000_000 - 500_000);
  });

  it('formule: cumul = anterieurs + actuel', () => {
    const result = calculateBudgetAvailability(10_000_000, 0, 0, 3_000_000, 2_000_000);
    expect(result.cumul).toBe(3_000_000 + 2_000_000);
  });
});

// ===========================================================================
// 4. Engagement statut workflow (updated with visa statuts)
// ===========================================================================
describe('Engagement statut workflow', () => {
  it('statut initial est brouillon', () => {
    const eng = createMockEngagement();
    expect(eng.statut).toBe('brouillon');
    expect(eng.workflow_status).toBe('en_attente');
    expect(eng.current_step).toBe(0);
  });

  it('soumission: brouillon → soumis', () => {
    const eng = createMockEngagement({
      statut: 'soumis',
      workflow_status: 'en_validation',
      current_step: 1,
    });
    expect(eng.statut).toBe('soumis');
    expect(eng.workflow_status).toBe('en_validation');
    expect(eng.current_step).toBe(1);
  });

  it('visa SAF: soumis → visa_saf', () => {
    const eng = createMockEngagement({
      statut: 'visa_saf',
      workflow_status: 'en_validation',
      current_step: 2,
      visa_saf_user_id: 'user-saf',
      visa_saf_date: '2026-02-01T10:00:00Z',
    });
    expect(eng.statut).toBe('visa_saf');
    expect(eng.current_step).toBe(2);
    expect(eng.visa_saf_user_id).toBeTruthy();
  });

  it('visa CB: visa_saf → visa_cb', () => {
    const eng = createMockEngagement({
      statut: 'visa_cb',
      workflow_status: 'en_validation',
      current_step: 3,
      visa_cb_user_id: 'user-cb',
      visa_cb_date: '2026-02-02T10:00:00Z',
    });
    expect(eng.statut).toBe('visa_cb');
    expect(eng.current_step).toBe(3);
  });

  it('visa DAAF: visa_cb → visa_daaf', () => {
    const eng = createMockEngagement({
      statut: 'visa_daaf',
      workflow_status: 'en_validation',
      current_step: 4,
      visa_daaf_user_id: 'user-daaf',
      visa_daaf_date: '2026-02-03T10:00:00Z',
    });
    expect(eng.statut).toBe('visa_daaf');
    expect(eng.current_step).toBe(4);
  });

  it('validation finale: visa_daaf → valide', () => {
    const eng = createMockEngagement({
      statut: 'valide',
      workflow_status: 'termine',
      current_step: VALIDATION_STEPS.length,
      visa_dg_user_id: 'user-dg',
      visa_dg_date: '2026-02-04T10:00:00Z',
    });
    expect(eng.statut).toBe('valide');
    expect(eng.workflow_status).toBe('termine');
    expect(eng.visa_dg_user_id).toBeTruthy();
  });

  it('rejet: tout statut → rejete avec motif', () => {
    const eng = createMockEngagement({
      statut: 'rejete',
      workflow_status: 'rejete',
      motif_rejet: 'Documents non conformes',
    });
    expect(eng.statut).toBe('rejete');
    expect(eng.workflow_status).toBe('rejete');
    expect(eng.motif_rejet).toBe('Documents non conformes');
  });

  it('différé: soumis → differe avec motif', () => {
    const eng = createMockEngagement({
      statut: 'differe',
      workflow_status: 'differe',
      motif_differe: 'Documents incomplets',
      date_differe: '2026-02-01T10:00:00Z',
      differe_by: 'user-002',
    });
    expect(eng.statut).toBe('differe');
    expect(eng.motif_differe).toBeTruthy();
    expect(eng.date_differe).toBeTruthy();
    expect(eng.differe_by).toBeTruthy();
  });

  it('reprise après différé: differe → soumis', () => {
    const eng = createMockEngagement({
      statut: 'soumis',
      workflow_status: 'en_validation',
      motif_differe: null,
      date_differe: null,
      differe_by: null,
    });
    expect(eng.statut).toBe('soumis');
    expect(eng.motif_differe).toBeNull();
  });

  it('statuts valides sont reconnus', () => {
    const validStatuts = [
      'brouillon',
      'soumis',
      'visa_saf',
      'visa_cb',
      'visa_daaf',
      'valide',
      'rejete',
      'differe',
      'annule',
    ];
    validStatuts.forEach((statut) => {
      const eng = createMockEngagement({ statut });
      expect(validStatuts).toContain(eng.statut);
    });
  });
});

// ===========================================================================
// 5. Type Engagement — structure
// ===========================================================================
describe('Type Engagement', () => {
  it('contient les champs identifiants requis', () => {
    const eng = createMockEngagement();
    expect(eng).toHaveProperty('id');
    expect(eng).toHaveProperty('numero');
    expect(eng).toHaveProperty('exercice');
  });

  it('contient les champs montants', () => {
    const eng = createMockEngagement();
    expect(eng).toHaveProperty('montant');
    expect(eng).toHaveProperty('montant_ht');
    expect(eng).toHaveProperty('tva');
  });

  it('contient les champs workflow', () => {
    const eng = createMockEngagement();
    expect(eng).toHaveProperty('statut');
    expect(eng).toHaveProperty('workflow_status');
    expect(eng).toHaveProperty('current_step');
  });

  it('contient les champs de liaison', () => {
    const eng = createMockEngagement();
    expect(eng).toHaveProperty('budget_line_id');
    expect(eng).toHaveProperty('expression_besoin_id');
    expect(eng).toHaveProperty('marche_id');
    expect(eng).toHaveProperty('passation_marche_id');
    expect(eng).toHaveProperty('dossier_id');
  });

  it('contient les champs différé', () => {
    const eng = createMockEngagement();
    expect(eng).toHaveProperty('date_differe');
    expect(eng).toHaveProperty('motif_differe');
    expect(eng).toHaveProperty('differe_by');
    expect(eng).toHaveProperty('deadline_correction');
  });

  it('contient les colonnes visa', () => {
    const eng = createMockEngagement();
    expect(eng).toHaveProperty('visa_saf_user_id');
    expect(eng).toHaveProperty('visa_saf_date');
    expect(eng).toHaveProperty('visa_saf_commentaire');
    expect(eng).toHaveProperty('visa_cb_user_id');
    expect(eng).toHaveProperty('visa_cb_date');
    expect(eng).toHaveProperty('visa_cb_commentaire');
    expect(eng).toHaveProperty('visa_daaf_user_id');
    expect(eng).toHaveProperty('visa_daaf_date');
    expect(eng).toHaveProperty('visa_daaf_commentaire');
    expect(eng).toHaveProperty('visa_dg_user_id');
    expect(eng).toHaveProperty('visa_dg_date');
    expect(eng).toHaveProperty('visa_dg_commentaire');
    expect(eng).toHaveProperty('motif_rejet');
  });

  it('colonnes visa sont null par défaut', () => {
    const eng = createMockEngagement();
    expect(eng.visa_saf_user_id).toBeNull();
    expect(eng.visa_saf_date).toBeNull();
    expect(eng.visa_cb_user_id).toBeNull();
    expect(eng.visa_dg_user_id).toBeNull();
    expect(eng.motif_rejet).toBeNull();
  });

  it('type_engagement est sur_marche ou hors_marche', () => {
    const surMarche = createMockEngagement({ type_engagement: 'sur_marche' });
    const horsMarche = createMockEngagement({ type_engagement: 'hors_marche' });
    expect(['sur_marche', 'hors_marche'] satisfies TypeEngagement[]).toContain(
      surMarche.type_engagement
    );
    expect(['sur_marche', 'hors_marche'] satisfies TypeEngagement[]).toContain(
      horsMarche.type_engagement
    );
  });

  it('timestamps sont présents', () => {
    const eng = createMockEngagement();
    expect(eng).toHaveProperty('created_at');
    expect(eng).toHaveProperty('updated_at');
    expect(eng).toHaveProperty('created_by');
  });
});

// ===========================================================================
// 6. numberToWords — conversion nombre → lettres (français)
// ===========================================================================
describe('numberToWords', () => {
  it('zéro', () => {
    expect(numberToWords(0)).toBe('zéro');
  });

  it('unités (1-9)', () => {
    expect(numberToWords(1)).toBe('un');
    expect(numberToWords(5)).toBe('cinq');
    expect(numberToWords(9)).toBe('neuf');
  });

  it('dizaines spéciales (10-19)', () => {
    expect(numberToWords(10)).toBe('dix');
    expect(numberToWords(11)).toBe('onze');
    expect(numberToWords(16)).toBe('seize');
    expect(numberToWords(19)).toBe('dix-neuf');
  });

  it('dizaines (20-69)', () => {
    expect(numberToWords(20)).toBe('vingt');
    expect(numberToWords(21)).toBe('vingt-un');
    expect(numberToWords(42)).toBe('quarante-deux');
    expect(numberToWords(55)).toBe('cinquante-cinq');
  });

  it('cas spéciaux français (70, 80, 90)', () => {
    expect(numberToWords(70)).toBe('soixante-dix');
    expect(numberToWords(71)).toBe('soixante-onze');
    expect(numberToWords(77)).toBe('soixante-dix-sept');
    expect(numberToWords(80)).toBe('quatre-vingt');
    expect(numberToWords(81)).toBe('quatre-vingt-un');
    expect(numberToWords(90)).toBe('quatre-vingt-dix');
    expect(numberToWords(91)).toBe('quatre-vingt-onze');
    expect(numberToWords(99)).toBe('quatre-vingt-dix-neuf');
  });

  it('centaines', () => {
    expect(numberToWords(100)).toBe('cent');
    expect(numberToWords(200)).toBe('deux cent');
    expect(numberToWords(101)).toBe('cent un');
    expect(numberToWords(250)).toBe('deux cent cinquante');
    expect(numberToWords(999)).toBe('neuf cent quatre-vingt-dix-neuf');
  });

  it('milliers', () => {
    expect(numberToWords(1000)).toBe('mille');
    expect(numberToWords(2000)).toBe('deux mille');
    expect(numberToWords(1500)).toBe('mille cinq cent');
    expect(numberToWords(10000)).toBe('dix mille');
    expect(numberToWords(100000)).toBe('cent mille');
    expect(numberToWords(999999)).toBe(
      'neuf cent quatre-vingt-dix-neuf mille neuf cent quatre-vingt-dix-neuf'
    );
  });

  it('millions', () => {
    expect(numberToWords(1000000)).toBe('un million');
    expect(numberToWords(2000000)).toBe('deux millions');
    expect(numberToWords(1500000)).toBe('un million cinq cent mille');
    expect(numberToWords(25000000)).toBe('vingt-cinq millions');
  });

  it('milliards', () => {
    expect(numberToWords(1000000000)).toBe('un milliard');
    expect(numberToWords(3000000000)).toBe('trois milliards');
  });

  it('nombres négatifs', () => {
    expect(numberToWords(-5)).toBe('moins cinq');
    expect(numberToWords(-100)).toBe('moins cent');
  });
});

// ===========================================================================
// 7. numberToWordsCFA — montant en lettres avec "francs CFA"
// ===========================================================================
describe('numberToWordsCFA', () => {
  it('montant simple', () => {
    expect(numberToWordsCFA(1000)).toBe('mille francs CFA');
  });

  it('montant courant', () => {
    expect(numberToWordsCFA(1500000)).toBe('un million cinq cent mille francs CFA');
  });

  it('montant zéro', () => {
    expect(numberToWordsCFA(0)).toBe('zéro francs CFA');
  });

  it('montant avec décimales (tronqué)', () => {
    expect(numberToWordsCFA(1500000.75)).toBe('un million cinq cent mille francs CFA');
  });

  it('montant négatif (valeur absolue)', () => {
    expect(numberToWordsCFA(-5000)).toBe('cinq mille francs CFA');
  });
});

// ===========================================================================
// 8. Export helpers — fmtCurrencyExport
// ===========================================================================
describe('fmtCurrencyExport', () => {
  it('formate un montant positif avec FCFA', () => {
    expect(fmtCurrencyExport(1000000)).toContain('FCFA');
    expect(fmtCurrencyExport(1000000)).toContain('1');
  });

  it('retourne - pour null', () => {
    expect(fmtCurrencyExport(null)).toBe('-');
  });

  it('retourne - pour undefined', () => {
    expect(fmtCurrencyExport(undefined)).toBe('-');
  });

  it('retourne - pour NaN', () => {
    expect(fmtCurrencyExport(NaN)).toBe('-');
  });

  it('formate zéro', () => {
    expect(fmtCurrencyExport(0)).toContain('0');
    expect(fmtCurrencyExport(0)).toContain('FCFA');
  });
});

// ===========================================================================
// 9. Export helpers — fmtDateExport
// ===========================================================================
describe('fmtDateExport', () => {
  it('formate une date ISO', () => {
    const result = fmtDateExport('2026-02-19T10:00:00Z');
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it('retourne - pour null', () => {
    expect(fmtDateExport(null)).toBe('-');
  });

  it('retourne - pour undefined', () => {
    expect(fmtDateExport(undefined)).toBe('-');
  });

  it('retourne - pour string vide', () => {
    expect(fmtDateExport('')).toBe('-');
  });
});

// ===========================================================================
// 10. Export helpers — statutLabel
// ===========================================================================
describe('statutLabel', () => {
  it('traduit brouillon', () => {
    expect(statutLabel('brouillon')).toBe('Brouillon');
  });

  it('traduit soumis', () => {
    expect(statutLabel('soumis')).toBe('Soumis');
  });

  it('traduit visa_saf', () => {
    expect(statutLabel('visa_saf')).toBe('Visa SAF');
  });

  it('traduit visa_cb', () => {
    expect(statutLabel('visa_cb')).toBe('Visa CB');
  });

  it('traduit visa_daaf', () => {
    expect(statutLabel('visa_daaf')).toBe('Visa DAAF');
  });

  it('traduit valide', () => {
    expect(statutLabel('valide')).toBe('Validé');
  });

  it('traduit rejete', () => {
    expect(statutLabel('rejete')).toBe('Rejeté');
  });

  it('traduit differe', () => {
    expect(statutLabel('differe')).toBe('Différé');
  });

  it('retourne - pour null', () => {
    expect(statutLabel(null)).toBe('-');
  });

  it('retourne la valeur brute pour un statut inconnu', () => {
    expect(statutLabel('inconnu')).toBe('inconnu');
  });
});

// ===========================================================================
// 11. Export helpers — typeEngagementLabel
// ===========================================================================
describe('typeEngagementLabel', () => {
  it('traduit sur_marche', () => {
    expect(typeEngagementLabel('sur_marche')).toBe('Sur marché');
  });

  it('traduit hors_marche', () => {
    expect(typeEngagementLabel('hors_marche')).toBe('Hors marché');
  });

  it('retourne - pour null', () => {
    expect(typeEngagementLabel(null)).toBe('-');
  });

  it('retourne la valeur brute pour un type inconnu', () => {
    expect(typeEngagementLabel('autre')).toBe('autre');
  });
});

// ===========================================================================
// 12. computeSuiviBudgetaire
// ===========================================================================
describe('computeSuiviBudgetaire', () => {
  const engagementsForSuivi = [
    createMockEngagement({
      id: 's1',
      statut: 'valide',
      montant: 3_000_000,
      budget_line_id: 'bl-001',
      date_engagement: '2026-01-15',
      budget_line: {
        id: 'bl-001',
        code: '60',
        label: 'Achats',
        dotation_initiale: 10_000_000,
        direction: { label: 'DSI', sigle: 'DSI' },
      },
    }),
    createMockEngagement({
      id: 's2',
      statut: 'valide',
      montant: 2_000_000,
      budget_line_id: 'bl-001',
      date_engagement: '2026-02-01',
      budget_line: {
        id: 'bl-001',
        code: '60',
        label: 'Achats',
        dotation_initiale: 10_000_000,
        direction: { label: 'DSI', sigle: 'DSI' },
      },
    }),
    createMockEngagement({
      id: 's3',
      statut: 'valide',
      montant: 5_000_000,
      budget_line_id: 'bl-002',
      date_engagement: '2026-01-20',
      budget_line: {
        id: 'bl-002',
        code: '61',
        label: 'Services',
        dotation_initiale: 8_000_000,
        direction: { label: 'DRH', sigle: 'DRH' },
      },
    }),
    createMockEngagement({
      id: 's4',
      statut: 'rejete',
      montant: 1_000_000,
      budget_line_id: 'bl-001',
      date_engagement: '2026-01-10',
      budget_line: {
        id: 'bl-001',
        code: '60',
        label: 'Achats',
        dotation_initiale: 10_000_000,
        direction: { label: 'DSI', sigle: 'DSI' },
      },
    }),
    createMockEngagement({
      id: 's5',
      statut: 'annule',
      montant: 500_000,
      budget_line_id: 'bl-002',
      date_engagement: '2026-01-05',
      budget_line: {
        id: 'bl-002',
        code: '61',
        label: 'Services',
        dotation_initiale: 8_000_000,
        direction: { label: 'DRH', sigle: 'DRH' },
      },
    }),
  ];

  it('groupe par ligne budgétaire', () => {
    const result = computeSuiviBudgetaire(engagementsForSuivi);
    expect(result).toHaveLength(2);
  });

  it('exclut les engagements rejetés et annulés', () => {
    const result = computeSuiviBudgetaire(engagementsForSuivi);
    const bl001 = result.find((s) => s.code === '60');
    // s1 (3M) + s2 (2M) = 5M, s4 (rejete) exclu
    expect(bl001?.totalEngage).toBe(5_000_000);
    expect(bl001?.nbEngagements).toBe(2);
  });

  it('calcule correctement le disponible', () => {
    const result = computeSuiviBudgetaire(engagementsForSuivi);
    const bl001 = result.find((s) => s.code === '60');
    expect(bl001?.disponible).toBe(10_000_000 - 5_000_000); // 5M
  });

  it('calcule correctement le taux', () => {
    const result = computeSuiviBudgetaire(engagementsForSuivi);
    const bl001 = result.find((s) => s.code === '60');
    expect(bl001?.taux).toBe(50); // 5M / 10M * 100
  });

  it('trie par taux décroissant', () => {
    const result = computeSuiviBudgetaire(engagementsForSuivi);
    // bl-002 : 5M / 8M = 62.5% > bl-001 : 5M / 10M = 50%
    expect(result[0].code).toBe('61');
    expect(result[1].code).toBe('60');
  });

  it('retourne le dernier engagement par ligne', () => {
    const result = computeSuiviBudgetaire(engagementsForSuivi);
    const bl001 = result.find((s) => s.code === '60');
    expect(bl001?.dernierEngagement).toBe('2026-02-01');
  });

  it('retourne la direction', () => {
    const result = computeSuiviBudgetaire(engagementsForSuivi);
    const bl001 = result.find((s) => s.code === '60');
    expect(bl001?.directionSigle).toBe('DSI');
  });

  it('gère une liste vide', () => {
    const result = computeSuiviBudgetaire([]);
    expect(result).toHaveLength(0);
  });

  it('gère des engagements sans budget_line_id', () => {
    const engs = [createMockEngagement({ id: 'x1', statut: 'valide', budget_line_id: '' })];
    const result = computeSuiviBudgetaire(engs);
    expect(result).toHaveLength(0);
  });

  it('gère dotation à zéro (taux = 0)', () => {
    const engs = [
      createMockEngagement({
        id: 'z1',
        statut: 'valide',
        montant: 1_000_000,
        budget_line_id: 'bl-zero',
        budget_line: {
          id: 'bl-zero',
          code: '99',
          label: 'Test',
          dotation_initiale: 0,
          direction: null,
        },
      }),
    ];
    const result = computeSuiviBudgetaire(engs);
    expect(result[0].taux).toBe(0);
    expect(result[0].disponible).toBe(-1_000_000);
  });

  it('calcule correctement avec une seule ligne', () => {
    const engs = [
      createMockEngagement({
        id: 'u1',
        statut: 'soumis',
        montant: 4_000_000,
        budget_line_id: 'bl-solo',
        budget_line: {
          id: 'bl-solo',
          code: '70',
          label: 'Solo',
          dotation_initiale: 20_000_000,
          direction: { label: 'DG', sigle: 'DG' },
        },
      }),
    ];
    const result = computeSuiviBudgetaire(engs);
    expect(result).toHaveLength(1);
    expect(result[0].totalEngage).toBe(4_000_000);
    expect(result[0].taux).toBe(20);
    expect(result[0].nbEngagements).toBe(1);
  });
});
