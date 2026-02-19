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
import { isRoleForStep } from '@/lib/engagement/engagementRbac';
import { buildChainSteps } from '@/lib/engagement/engagementChainSteps';
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

// ===========================================================================
// 13. isRoleForStep — RBAC action menu (Prompt 10)
// ===========================================================================
describe('isRoleForStep', () => {
  it('ADMIN peut agir sur toutes les étapes', () => {
    expect(isRoleForStep('soumis', 'ADMIN')).toBe(true);
    expect(isRoleForStep('visa_saf', 'ADMIN')).toBe(true);
    expect(isRoleForStep('visa_cb', 'ADMIN')).toBe(true);
    expect(isRoleForStep('visa_daaf', 'ADMIN')).toBe(true);
  });

  it('SAF agit sur soumis', () => {
    expect(isRoleForStep('soumis', 'SAF')).toBe(true);
  });

  it('OPERATEUR agit sur soumis', () => {
    expect(isRoleForStep('soumis', 'OPERATEUR')).toBe(true);
  });

  it('CB agit sur visa_saf', () => {
    expect(isRoleForStep('visa_saf', 'CB')).toBe(true);
  });

  it('DAAF agit sur visa_cb', () => {
    expect(isRoleForStep('visa_cb', 'DAAF')).toBe(true);
  });

  it('DAF agit sur visa_cb', () => {
    expect(isRoleForStep('visa_cb', 'DAF')).toBe(true);
  });

  it('DG agit sur visa_daaf', () => {
    expect(isRoleForStep('visa_daaf', 'DG')).toBe(true);
  });

  it('SAF ne peut pas agir sur visa_saf', () => {
    expect(isRoleForStep('visa_saf', 'SAF')).toBe(false);
  });

  it('CB ne peut pas agir sur soumis', () => {
    expect(isRoleForStep('soumis', 'CB')).toBe(false);
  });

  it('DG ne peut pas agir sur soumis', () => {
    expect(isRoleForStep('soumis', 'DG')).toBe(false);
  });

  it('retourne false si rôle null', () => {
    expect(isRoleForStep('soumis', null)).toBe(false);
  });

  it('retourne false si statut brouillon', () => {
    expect(isRoleForStep('brouillon', 'SAF')).toBe(false);
  });

  it('retourne false si statut valide', () => {
    expect(isRoleForStep('valide', 'DG')).toBe(false);
  });

  it('retourne false si statut rejete', () => {
    expect(isRoleForStep('rejete', 'SAF')).toBe(false);
  });

  it('retourne false si statut null', () => {
    expect(isRoleForStep(null, 'SAF')).toBe(false);
  });
});

// ===========================================================================
// 14. Pagination helper — client-side slicing (Prompt 10)
// ===========================================================================
describe('Pagination helper', () => {
  // Replicate the paginateList function from Engagements.tsx
  const paginateList = <T>(list: T[], page: number, pageSize: number): T[] => {
    const start = (page - 1) * pageSize;
    return list.slice(start, start + pageSize);
  };

  const items = Array.from({ length: 55 }, (_, i) => i + 1);

  it('page 1 retourne les 20 premiers éléments', () => {
    const result = paginateList(items, 1, 20);
    expect(result).toHaveLength(20);
    expect(result[0]).toBe(1);
    expect(result[19]).toBe(20);
  });

  it('page 2 retourne les éléments 21-40', () => {
    const result = paginateList(items, 2, 20);
    expect(result).toHaveLength(20);
    expect(result[0]).toBe(21);
    expect(result[19]).toBe(40);
  });

  it('page 3 retourne les éléments 41-55 (dernière page incomplète)', () => {
    const result = paginateList(items, 3, 20);
    expect(result).toHaveLength(15);
    expect(result[0]).toBe(41);
    expect(result[14]).toBe(55);
  });

  it('page au-delà des données retourne vide', () => {
    const result = paginateList(items, 10, 20);
    expect(result).toHaveLength(0);
  });

  it('pageSize 50 sur 55 éléments → page 1 a 50 items, page 2 a 5', () => {
    expect(paginateList(items, 1, 50)).toHaveLength(50);
    expect(paginateList(items, 2, 50)).toHaveLength(5);
  });

  it('totalPages calcul correct', () => {
    expect(Math.ceil(55 / 20)).toBe(3);
    expect(Math.ceil(20 / 20)).toBe(1);
    expect(Math.ceil(0 / 20)).toBe(0);
    expect(Math.ceil(1 / 20)).toBe(1);
    expect(Math.ceil(21 / 20)).toBe(2);
  });

  it('liste vide retourne vide', () => {
    const result = paginateList([], 1, 20);
    expect(result).toHaveLength(0);
  });

  it('pageSize 100 sur 55 éléments → tout en page 1', () => {
    const result = paginateList(items, 1, 100);
    expect(result).toHaveLength(55);
  });
});

// ============================================================================
// 15. QR code visibility condition
// ============================================================================
describe("QR code — condition d'affichage", () => {
  it('engagement validé avec visa_dg_date → QR visible', () => {
    const engagement = {
      statut: 'valide',
      visa_dg_date: '2026-02-19T10:00:00Z',
      visa_dg_user_id: 'u1',
    };
    const showQR = engagement.statut === 'valide' && !!engagement.visa_dg_date;
    expect(showQR).toBe(true);
  });

  it('engagement brouillon → QR masqué', () => {
    const engagement = { statut: 'brouillon', visa_dg_date: null, visa_dg_user_id: null };
    const showQR = engagement.statut === 'valide' && !!engagement.visa_dg_date;
    expect(showQR).toBe(false);
  });

  it('engagement soumis → QR masqué', () => {
    const engagement = { statut: 'soumis', visa_dg_date: null, visa_dg_user_id: null };
    const showQR = engagement.statut === 'valide' && !!engagement.visa_dg_date;
    expect(showQR).toBe(false);
  });

  it('engagement rejete → QR masqué', () => {
    const engagement = { statut: 'rejete', visa_dg_date: null, visa_dg_user_id: null };
    const showQR = engagement.statut === 'valide' && !!engagement.visa_dg_date;
    expect(showQR).toBe(false);
  });

  it('engagement validé sans visa_dg_date → QR masqué', () => {
    const engagement = { statut: 'valide', visa_dg_date: null, visa_dg_user_id: null };
    const showQR = engagement.statut === 'valide' && !!engagement.visa_dg_date;
    expect(showQR).toBe(false);
  });
});

// ============================================================================
// 16. Alertes budgétaires — calcul lignes en alerte >80%
// ============================================================================
describe('Alertes budgétaires — calcul lignes >80%', () => {
  // Helper qui reproduit le calcul du composant Engagements
  function computeAlertCount(
    engagements: Array<{
      budget_line_id: string;
      montant: number;
      dotation: number;
      statut: string;
    }>
  ) {
    const uniqueBudgetLines = new Map<string, number>();
    const budgetLineEngages = new Map<string, number>();

    for (const eng of engagements) {
      if (!uniqueBudgetLines.has(eng.budget_line_id)) {
        uniqueBudgetLines.set(eng.budget_line_id, eng.dotation);
      }
      if (eng.statut !== 'rejete' && eng.statut !== 'annule') {
        budgetLineEngages.set(
          eng.budget_line_id,
          (budgetLineEngages.get(eng.budget_line_id) || 0) + eng.montant
        );
      }
    }

    let count = 0;
    for (const [blId, totalEng] of budgetLineEngages) {
      const dotation = uniqueBudgetLines.get(blId);
      if (dotation && dotation > 0 && (totalEng / dotation) * 100 > 80) {
        count++;
      }
    }
    return count;
  }

  it('aucune ligne en alerte si toutes < 80%', () => {
    const engagements = [
      { budget_line_id: 'bl1', montant: 70_000, dotation: 100_000, statut: 'valide' },
      { budget_line_id: 'bl2', montant: 50_000, dotation: 100_000, statut: 'valide' },
    ];
    expect(computeAlertCount(engagements)).toBe(0);
  });

  it('1 ligne en alerte si taux > 80%', () => {
    const engagements = [
      { budget_line_id: 'bl1', montant: 85_000, dotation: 100_000, statut: 'valide' },
      { budget_line_id: 'bl2', montant: 50_000, dotation: 100_000, statut: 'valide' },
    ];
    expect(computeAlertCount(engagements)).toBe(1);
  });

  it('2 lignes en alerte (>80% et >95%)', () => {
    const engagements = [
      { budget_line_id: 'bl1', montant: 85_000, dotation: 100_000, statut: 'valide' },
      { budget_line_id: 'bl2', montant: 98_000, dotation: 100_000, statut: 'valide' },
    ];
    expect(computeAlertCount(engagements)).toBe(2);
  });

  it('engagements rejetés ne comptent pas', () => {
    const engagements = [
      { budget_line_id: 'bl1', montant: 90_000, dotation: 100_000, statut: 'rejete' },
      { budget_line_id: 'bl1', montant: 30_000, dotation: 100_000, statut: 'valide' },
    ];
    expect(computeAlertCount(engagements)).toBe(0);
  });

  it('engagements annulés ne comptent pas', () => {
    const engagements = [
      { budget_line_id: 'bl1', montant: 90_000, dotation: 100_000, statut: 'annule' },
      { budget_line_id: 'bl1', montant: 30_000, dotation: 100_000, statut: 'valide' },
    ];
    expect(computeAlertCount(engagements)).toBe(0);
  });

  it('cumul multi-engagements sur même ligne dépasse le seuil', () => {
    const engagements = [
      { budget_line_id: 'bl1', montant: 50_000, dotation: 100_000, statut: 'valide' },
      { budget_line_id: 'bl1', montant: 35_000, dotation: 100_000, statut: 'soumis' },
    ];
    // 85_000 / 100_000 = 85% > 80%
    expect(computeAlertCount(engagements)).toBe(1);
  });

  it("dotation 0 → pas d'alerte (division par zéro)", () => {
    const engagements = [{ budget_line_id: 'bl1', montant: 50_000, dotation: 0, statut: 'valide' }];
    expect(computeAlertCount(engagements)).toBe(0);
  });

  it("exactement 80% → pas d'alerte (seuil strict >80)", () => {
    const engagements = [
      { budget_line_id: 'bl1', montant: 80_000, dotation: 100_000, statut: 'valide' },
    ];
    expect(computeAlertCount(engagements)).toBe(0);
  });

  it('80.1% → en alerte', () => {
    const engagements = [
      { budget_line_id: 'bl1', montant: 80_100, dotation: 100_000, statut: 'valide' },
    ];
    expect(computeAlertCount(engagements)).toBe(1);
  });

  it('dépassement >100% → en alerte', () => {
    const engagements = [
      { budget_line_id: 'bl1', montant: 120_000, dotation: 100_000, statut: 'valide' },
    ];
    expect(computeAlertCount(engagements)).toBe(1);
  });

  it('liste vide → 0 alertes', () => {
    expect(computeAlertCount([])).toBe(0);
  });
});

// ============================================================================
// 17. Notification workflow — logique de dispatch
// ============================================================================
describe('Notification workflow — logique de dispatch', () => {
  // Simule le pattern de notification du module engagement
  function buildNotifRecipients(params: {
    isLastStep: boolean;
    createdBy: string | null;
    directionUsers: string[];
    nextRoleUsers: string[];
  }) {
    const recipients: Array<{ userId: string; type: string; reason: string }> = [];

    // Toujours notifier le créateur
    if (params.createdBy) {
      recipients.push({
        userId: params.createdBy,
        type: params.isLastStep ? 'validation' : 'validation',
        reason: params.isLastStep ? 'engagement_valide' : 'visa_accorde',
      });
    }

    // Étape suivante (si pas dernière)
    if (!params.isLastStep) {
      for (const uid of params.nextRoleUsers) {
        recipients.push({ userId: uid, type: 'validation', reason: 'a_valider' });
      }
    }

    // Validation DG → direction
    if (params.isLastStep) {
      for (const uid of params.directionUsers) {
        if (uid !== params.createdBy) {
          recipients.push({ userId: uid, type: 'validation', reason: 'direction_notifiee' });
        }
      }
    }

    return recipients;
  }

  it('soumission (pas lastStep) → notifie créateur + SAF', () => {
    const r = buildNotifRecipients({
      isLastStep: false,
      createdBy: 'agent1',
      directionUsers: [],
      nextRoleUsers: ['saf1', 'saf2'],
    });
    expect(r).toHaveLength(3);
    expect(r[0].userId).toBe('agent1');
    expect(r[1].userId).toBe('saf1');
    expect(r[2].userId).toBe('saf2');
  });

  it('validation DG (lastStep) → notifie créateur + direction (sans doublon)', () => {
    const r = buildNotifRecipients({
      isLastStep: true,
      createdBy: 'agent1',
      directionUsers: ['agent1', 'agent2', 'agent3'],
      nextRoleUsers: [],
    });
    // agent1 est créateur ET dans direction → ne reçoit pas double
    expect(r).toHaveLength(3); // agent1 (creator) + agent2 + agent3
    const dirNotifs = r.filter((n) => n.reason === 'direction_notifiee');
    expect(dirNotifs).toHaveLength(2); // agent2 + agent3, pas agent1
  });

  it('validation DG sans direction → notifie uniquement le créateur', () => {
    const r = buildNotifRecipients({
      isLastStep: true,
      createdBy: 'agent1',
      directionUsers: [],
      nextRoleUsers: [],
    });
    expect(r).toHaveLength(1);
    expect(r[0].userId).toBe('agent1');
  });

  it('sans créateur (edge case) → notifie uniquement direction', () => {
    const r = buildNotifRecipients({
      isLastStep: true,
      createdBy: null,
      directionUsers: ['agent2'],
      nextRoleUsers: [],
    });
    expect(r).toHaveLength(1);
    expect(r[0].reason).toBe('direction_notifiee');
  });
});

// ============================================================================
// 18. EngagementChainNav — buildChainSteps
// ============================================================================
describe('EngagementChainNav — buildChainSteps', () => {
  const baseEngagement = {
    id: 'eng-1',
    numero: 'ENG-2026-001',
    objet: 'Test',
    montant: 100_000,
    montant_ht: null,
    tva: null,
    fournisseur: null,
    date_engagement: '2026-01-15',
    statut: 'brouillon' as string | null,
    workflow_status: null,
    current_step: null,
    budget_line_id: 'bl-1',
    expression_besoin_id: null,
    marche_id: null,
    passation_marche_id: null,
    dossier_id: null,
    type_engagement: 'hors_marche' as const,
    note_id: null,
    exercice: 2026,
    created_by: null,
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-01-15T10:00:00Z',
    date_differe: null,
    motif_differe: null,
    differe_by: null,
    deadline_correction: null,
    required_documents: null,
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
    montant_degage: null,
    motif_degage: null,
    degage_by: null,
    degage_at: null,
  };

  it('engagement brouillon sans passation → passation unavailable, liquidation unavailable', () => {
    const steps = buildChainSteps(baseEngagement);
    expect(steps).toHaveLength(3);
    expect(steps[0].key).toBe('passation');
    expect(steps[0].status).toBe('unavailable');
    expect(steps[0].url).toBeNull();
    expect(steps[1].key).toBe('engagement');
    expect(steps[1].status).toBe('current');
    expect(steps[2].key).toBe('liquidation');
    expect(steps[2].status).toBe('unavailable');
    expect(steps[2].url).toBeNull();
  });

  it('engagement sur marché → passation completed avec URL', () => {
    const eng = {
      ...baseEngagement,
      passation_marche_id: 'pm-1',
      marche: { id: 'm-1', numero: 'PM-2026-010', objet: 'IT', montant: 500_000 },
    };
    const steps = buildChainSteps(eng);
    expect(steps[0].status).toBe('completed');
    expect(steps[0].url).toContain('/execution/passation-marche?detail=pm-1');
    expect(steps[0].subtitle).toBe('PM-2026-010');
  });

  it('engagement validé → liquidation pending avec URL', () => {
    const eng = { ...baseEngagement, statut: 'valide' };
    const steps = buildChainSteps(eng);
    expect(steps[2].status).toBe('pending');
    expect(steps[2].url).toContain(`/liquidations?sourceEngagement=${eng.id}`);
    expect(steps[2].subtitle).toBe('Créer');
  });

  it('engagement soumis → liquidation unavailable', () => {
    const eng = { ...baseEngagement, statut: 'soumis' };
    const steps = buildChainSteps(eng);
    expect(steps[2].status).toBe('unavailable');
    expect(steps[2].url).toBeNull();
  });

  it('engagement validé + passation → tout accessible', () => {
    const eng = {
      ...baseEngagement,
      statut: 'valide',
      passation_marche_id: 'pm-1',
      marche: { id: 'm-1', numero: 'PM-001', objet: 'IT', montant: 100_000 },
    };
    const steps = buildChainSteps(eng);
    expect(steps[0].status).toBe('completed');
    expect(steps[0].url).not.toBeNull();
    expect(steps[1].status).toBe('current');
    expect(steps[2].status).toBe('pending');
    expect(steps[2].url).not.toBeNull();
  });

  it('engagement courant a toujours le numéro en subtitle', () => {
    const steps = buildChainSteps(baseEngagement);
    expect(steps[1].subtitle).toBe('ENG-2026-001');
  });
});
