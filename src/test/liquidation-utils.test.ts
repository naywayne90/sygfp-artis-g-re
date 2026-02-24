import { describe, it, expect } from 'vitest';
import {
  VALIDATION_STEPS,
  SEUIL_VALIDATION_DG,
  requiresDgValidation,
  DOCUMENTS_REQUIS,
  VALIDATION_FLOW_STEPS,
  computeEngagementProgress,
  type Liquidation,
  type LiquidationCounts,
  type LiquidationAvailability,
} from '@/hooks/useLiquidations';
import { buildLiquidationChainSteps } from '@/lib/liquidation/liquidationChainSteps';
import {
  fmtCurrency,
  fmtDate,
  liquidationStatutLabel,
  regimeFiscalLabel,
  computeSuiviParEngagement,
} from '@/hooks/useLiquidationExport';

// ===========================================================================
// HELPERS — Factory functions
// ===========================================================================

const createMockLiquidation = (overrides: Partial<Liquidation> = {}): Liquidation => ({
  id: 'liq-001',
  numero: 'LIQ2026001',
  montant: 1_000_000,
  montant_ht: 847_458,
  tva_taux: 18,
  tva_montant: 152_542,
  airsi_taux: 5,
  airsi_montant: 42_373,
  retenue_source_taux: 0,
  retenue_source_montant: 0,
  tva_applicable: true,
  retenue_bic_taux: 0,
  retenue_bic_montant: 0,
  retenue_bnc_taux: 0,
  retenue_bnc_montant: 0,
  penalites_retard: 0,
  penalites_montant: 0,
  penalites_nb_jours: 0,
  penalites_taux_journalier: 0,
  total_retenues: 42_373,
  net_a_payer: 957_627,
  date_liquidation: '2026-02-01',
  reference_facture: 'FAC-2026-001',
  observation: null,
  service_fait: true,
  service_fait_date: '2026-01-28',
  service_fait_certifie_par: 'user-001',
  regime_fiscal: 'reel_normal',
  statut: 'brouillon',
  workflow_status: 'en_attente',
  current_step: 0,
  engagement_id: 'eng-001',
  exercice: 2026,
  created_by: 'user-001',
  created_at: '2026-02-01T10:00:00Z',
  submitted_at: null,
  validated_at: null,
  validated_by: null,
  rejected_at: null,
  rejected_by: null,
  rejection_reason: null,
  date_differe: null,
  motif_differe: null,
  differe_by: null,
  deadline_correction: null,
  dossier_id: null,
  reglement_urgent: false,
  reglement_urgent_motif: null,
  reglement_urgent_date: null,
  reglement_urgent_par: null,
  visa_daaf_user_id: null,
  visa_daaf_date: null,
  visa_daaf_commentaire: null,
  visa_dg_user_id: null,
  visa_dg_date: null,
  visa_dg_commentaire: null,
  motif_rejet: null,
  service_fait_commentaire: null,
  engagement: {
    id: 'eng-001',
    numero: 'ENG2026001',
    objet: 'Fourniture bureau',
    montant: 5_000_000,
    fournisseur: 'SARL Papeterie',
    budget_line: {
      id: 'bl-001',
      code: '6220',
      label: 'Fournitures de bureau',
      direction: { label: "Direction des Systèmes d'Information", sigle: 'DSI' },
    },
    marche: null,
  },
  creator: { id: 'user-001', full_name: 'Agent DSI' },
  visa_daaf_user: null,
  visa_dg_user: null,
  validated_by_profile: null,
  rejected_by_profile: null,
  sf_certifier: null,
  attachments: [],
  ...overrides,
});

// Filter helpers — replicate hook logic for testing
const filterAValider = (liq: Liquidation[]) =>
  liq.filter((l) => l.statut === 'soumis' || l.statut === 'validé_daaf');

const filterValidees = (liq: Liquidation[]) => liq.filter((l) => l.statut === 'validé_dg');

const filterRejetees = (liq: Liquidation[]) => liq.filter((l) => l.statut === 'rejete');

const filterDifferees = (liq: Liquidation[]) => liq.filter((l) => l.statut === 'differe');

const filterUrgentes = (liq: Liquidation[]) =>
  liq.filter(
    (l) => l.reglement_urgent && ['soumis', 'validé_daaf', 'validé_dg'].includes(l.statut || '')
  );

const filterCertifiesSF = (liq: Liquidation[]) => liq.filter((l) => l.statut === 'certifié_sf');

// Availability calculation — mirrors useLiquidations.calculateAvailability
const calculateAvailability = (
  montantEngage: number,
  liquidationsAnterieures: number,
  montantActuel: number
): LiquidationAvailability => {
  const cumul = liquidationsAnterieures + montantActuel;
  const restant = montantEngage - cumul;
  return {
    montant_engage: montantEngage,
    liquidations_anterieures: liquidationsAnterieures,
    nb_liquidations_anterieures: 0,
    liquidation_actuelle: montantActuel,
    cumul,
    restant_a_liquider: restant,
    is_valid: restant >= 0,
  };
};

// Fiscal calculation helpers — mirror CalculsFiscaux.tsx formulas
const calculateTVA = (montantHT: number, applicable: boolean) =>
  applicable ? Math.round((montantHT * 18) / 100) : 0;

const calculateMontantTTC = (montantHT: number, applicable: boolean) =>
  montantHT + calculateTVA(montantHT, applicable);

const calculateAIRSI = (montantHT: number, taux: number) => Math.round((montantHT * taux) / 100);

const calculateBIC = (montantHT: number, taux: number) =>
  taux > 0 ? Math.round((montantHT * taux) / 100) : 0;

const calculateBNC = (montantHT: number, taux: number) => Math.round((montantHT * taux) / 100);

const calculatePenalitesAuto = (montantTTC: number, tauxJournalier: number, nbJours: number) =>
  Math.round(montantTTC * (tauxJournalier / 100) * nbJours);

const calculateNetAPayer = (montantTTC: number, totalRetenues: number) =>
  montantTTC - totalRetenues;

// Counts calculation — mirrors useLiquidationCounts logic
const calculateCounts = (items: Liquidation[]): LiquidationCounts => ({
  total: items.length,
  brouillon: items.filter((i) => i.statut === 'brouillon').length,
  certifie_sf: items.filter((i) => i.statut === 'certifié_sf').length,
  soumis: items.filter((i) => i.statut === 'soumis').length,
  valide_daaf: items.filter((i) => i.statut === 'validé_daaf').length,
  valide_dg: items.filter((i) => i.statut === 'validé_dg').length,
  rejete: items.filter((i) => i.statut === 'rejete').length,
  differe: items.filter((i) => i.statut === 'differe').length,
  annule: items.filter((i) => i.statut === 'annule').length,
  urgent: items.filter(
    (i) => i.reglement_urgent && ['soumis', 'validé_daaf', 'validé_dg'].includes(i.statut || '')
  ).length,
  service_fait: items.filter((i) => i.service_fait).length,
  total_montant: items.reduce((s, i) => s + (i.montant || 0), 0),
  a_valider: items.filter((i) => i.statut === 'soumis' || i.statut === 'validé_daaf').length,
});

// ===========================================================================
// 1. VALIDATION_STEPS (constantes workflow)
// ===========================================================================
describe('VALIDATION_STEPS', () => {
  it('devrait avoir exactement 2 étapes de validation', () => {
    expect(VALIDATION_STEPS).toHaveLength(2);
  });

  it('devrait avoir les étapes dans le bon ordre', () => {
    expect(VALIDATION_STEPS[0].order).toBe(1);
    expect(VALIDATION_STEPS[1].order).toBe(2);
  });

  it('devrait avoir les rôles DAAF puis DG', () => {
    expect(VALIDATION_STEPS.map((s) => s.role)).toEqual(['DAAF', 'DG']);
  });

  it('chaque étape devrait avoir un label non vide', () => {
    VALIDATION_STEPS.forEach((step) => {
      expect(step.label).toBeTruthy();
      expect(step.label.length).toBeGreaterThan(0);
    });
  });

  it('devrait avoir les bons statuts de sortie', () => {
    expect(VALIDATION_STEPS[0].statut).toBe('validé_daaf');
    expect(VALIDATION_STEPS[1].statut).toBe('validé_dg');
  });
});

// ===========================================================================
// 2. SEUIL_VALIDATION_DG et requiresDgValidation
// ===========================================================================
describe('Seuil validation DG', () => {
  it('le seuil devrait être 50 000 000 FCFA', () => {
    expect(SEUIL_VALIDATION_DG).toBe(50_000_000);
  });

  it('devrait requérir la validation DG pour un montant >= 50M', () => {
    expect(requiresDgValidation(50_000_000)).toBe(true);
  });

  it('devrait requérir la validation DG pour un montant > 50M', () => {
    expect(requiresDgValidation(100_000_000)).toBe(true);
  });

  it('ne devrait PAS requérir la validation DG pour un montant < 50M', () => {
    expect(requiresDgValidation(49_999_999)).toBe(false);
  });

  it('ne devrait PAS requérir la validation DG pour 0 FCFA', () => {
    expect(requiresDgValidation(0)).toBe(false);
  });

  it('devrait requérir la validation DG exactement au seuil', () => {
    expect(requiresDgValidation(SEUIL_VALIDATION_DG)).toBe(true);
    expect(requiresDgValidation(SEUIL_VALIDATION_DG - 1)).toBe(false);
  });
});

// ===========================================================================
// 3. DOCUMENTS_REQUIS
// ===========================================================================
describe('DOCUMENTS_REQUIS', () => {
  it('devrait avoir 5 types de documents', () => {
    expect(DOCUMENTS_REQUIS).toHaveLength(5);
  });

  it('devrait avoir 3 documents obligatoires', () => {
    const obligatoires = DOCUMENTS_REQUIS.filter((d) => d.obligatoire);
    expect(obligatoires).toHaveLength(3);
  });

  it('les documents obligatoires sont facture, PV réception, bon livraison', () => {
    const obligCodes = DOCUMENTS_REQUIS.filter((d) => d.obligatoire).map((d) => d.code);
    expect(obligCodes).toContain('facture');
    expect(obligCodes).toContain('pv_reception');
    expect(obligCodes).toContain('bon_livraison');
  });

  it('les documents optionnels sont attestation SF et autre', () => {
    const optCodes = DOCUMENTS_REQUIS.filter((d) => !d.obligatoire).map((d) => d.code);
    expect(optCodes).toContain('attestation_service_fait');
    expect(optCodes).toContain('autre');
  });

  it('chaque document devrait avoir un label non vide', () => {
    DOCUMENTS_REQUIS.forEach((doc) => {
      expect(doc.label).toBeTruthy();
      expect(doc.label.length).toBeGreaterThan(0);
    });
  });
});

// ===========================================================================
// 4. VALIDATION_FLOW_STEPS
// ===========================================================================
describe('VALIDATION_FLOW_STEPS', () => {
  it('devrait avoir 3 étapes de workflow', () => {
    expect(VALIDATION_FLOW_STEPS).toHaveLength(3);
  });

  it('la dernière étape (DG) devrait être conditionnelle', () => {
    const dgStep = VALIDATION_FLOW_STEPS.find((s) => s.key === 'dg');
    expect(dgStep?.conditional).toBe(true);
  });

  it('les 2 premières étapes ne sont pas conditionnelles', () => {
    expect((VALIDATION_FLOW_STEPS[0] as Record<string, unknown>).conditional).toBeUndefined();
    expect((VALIDATION_FLOW_STEPS[1] as Record<string, unknown>).conditional).toBeUndefined();
  });
});

// ===========================================================================
// 5. Filtres par statut
// ===========================================================================
describe('Filtres par statut', () => {
  const dataset: Liquidation[] = [
    createMockLiquidation({ id: '1', statut: 'brouillon' }),
    createMockLiquidation({ id: '2', statut: 'certifié_sf' }),
    createMockLiquidation({ id: '3', statut: 'soumis' }),
    createMockLiquidation({ id: '4', statut: 'validé_daaf' }),
    createMockLiquidation({ id: '5', statut: 'validé_dg' }),
    createMockLiquidation({ id: '6', statut: 'rejete' }),
    createMockLiquidation({ id: '7', statut: 'differe' }),
    createMockLiquidation({ id: '8', statut: 'soumis', reglement_urgent: true }),
    createMockLiquidation({ id: '9', statut: 'annule' }),
  ];

  it('filterAValider retourne soumis + validé_daaf', () => {
    const result = filterAValider(dataset);
    expect(result).toHaveLength(3); // id 3, 4, 8
    result.forEach((l) => {
      expect(['soumis', 'validé_daaf']).toContain(l.statut);
    });
  });

  it('filterValidees retourne uniquement validé_dg', () => {
    const result = filterValidees(dataset);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('5');
  });

  it('filterRejetees retourne uniquement rejete', () => {
    const result = filterRejetees(dataset);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('6');
  });

  it('filterDifferees retourne uniquement differe', () => {
    const result = filterDifferees(dataset);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('7');
  });

  it('filterUrgentes retourne les urgentes avec statut actif', () => {
    const result = filterUrgentes(dataset);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('8');
  });

  it('filterCertifiesSF retourne certifié_sf', () => {
    const result = filterCertifiesSF(dataset);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });
});

// ===========================================================================
// 6. Calcul disponibilité liquidation
// ===========================================================================
describe('Calcul disponibilité liquidation', () => {
  it('devrait calculer correctement avec aucune liquidation antérieure', () => {
    const avail = calculateAvailability(5_000_000, 0, 1_000_000);
    expect(avail.montant_engage).toBe(5_000_000);
    expect(avail.cumul).toBe(1_000_000);
    expect(avail.restant_a_liquider).toBe(4_000_000);
    expect(avail.is_valid).toBe(true);
  });

  it('devrait calculer avec des liquidations antérieures', () => {
    const avail = calculateAvailability(5_000_000, 3_000_000, 1_000_000);
    expect(avail.cumul).toBe(4_000_000);
    expect(avail.restant_a_liquider).toBe(1_000_000);
    expect(avail.is_valid).toBe(true);
  });

  it('devrait être valide si montant exact = restant', () => {
    const avail = calculateAvailability(5_000_000, 3_000_000, 2_000_000);
    expect(avail.restant_a_liquider).toBe(0);
    expect(avail.is_valid).toBe(true);
  });

  it('devrait être invalide si dépassement', () => {
    const avail = calculateAvailability(5_000_000, 3_000_000, 3_000_000);
    expect(avail.restant_a_liquider).toBe(-1_000_000);
    expect(avail.is_valid).toBe(false);
  });

  it('devrait gérer un engagement à montant zéro', () => {
    const avail = calculateAvailability(0, 0, 1_000);
    expect(avail.is_valid).toBe(false);
  });
});

// ===========================================================================
// 7. Calculs fiscaux
// ===========================================================================
describe('Calculs fiscaux', () => {
  const montantHT = 1_000_000;

  it('TVA 18% applicable', () => {
    expect(calculateTVA(montantHT, true)).toBe(180_000);
  });

  it('TVA non applicable = 0', () => {
    expect(calculateTVA(montantHT, false)).toBe(0);
  });

  it('TTC = HT + TVA', () => {
    expect(calculateMontantTTC(montantHT, true)).toBe(1_180_000);
    expect(calculateMontantTTC(montantHT, false)).toBe(1_000_000);
  });

  it('AIRSI 5% du HT', () => {
    expect(calculateAIRSI(montantHT, 5)).toBe(50_000);
  });

  it('AIRSI 0% = 0', () => {
    expect(calculateAIRSI(montantHT, 0)).toBe(0);
  });

  it('BIC par taux', () => {
    expect(calculateBIC(montantHT, 25)).toBe(250_000);
  });

  it('BIC taux 0 = 0 (montant libre non simulé ici)', () => {
    expect(calculateBIC(montantHT, 0)).toBe(0);
  });

  it('BNC 20% défaut', () => {
    expect(calculateBNC(montantHT, 20)).toBe(200_000);
  });

  it('BNC 10% convention', () => {
    expect(calculateBNC(montantHT, 10)).toBe(100_000);
  });

  it('pénalités auto-calculées correctement', () => {
    const ttc = 1_180_000;
    const taux = 0.1; // 0.1% par jour
    const jours = 10;
    const expected = Math.round(ttc * (taux / 100) * jours);
    expect(calculatePenalitesAuto(ttc, taux, jours)).toBe(expected);
    expect(expected).toBe(11_800);
  });

  it('pénalités 0 jours = 0', () => {
    expect(calculatePenalitesAuto(1_180_000, 0.1, 0)).toBe(0);
  });

  it('net à payer = TTC - retenues', () => {
    expect(calculateNetAPayer(1_180_000, 50_000)).toBe(1_130_000);
  });

  it('net à payer négatif si retenues > TTC', () => {
    expect(calculateNetAPayer(1_000_000, 1_500_000)).toBe(-500_000);
  });

  it('chaîne complète TVA + AIRSI + BNC + pénalités', () => {
    const ht = 10_000_000;
    const tva = calculateTVA(ht, true);
    const ttc = ht + tva;
    const airsi = calculateAIRSI(ht, 5);
    const bnc = calculateBNC(ht, 20);
    const penalites = calculatePenalitesAuto(ttc, 0.1, 5);
    const totalRet = airsi + bnc + penalites;
    const net = calculateNetAPayer(ttc, totalRet);

    expect(tva).toBe(1_800_000);
    expect(ttc).toBe(11_800_000);
    expect(airsi).toBe(500_000);
    expect(bnc).toBe(2_000_000);
    expect(penalites).toBe(59_000);
    expect(totalRet).toBe(2_559_000);
    expect(net).toBe(9_241_000);
  });
});

// ===========================================================================
// 8. computeEngagementProgress (tranches)
// ===========================================================================
describe('computeEngagementProgress', () => {
  it('calcule correctement avec 1 liquidation active', () => {
    const result = computeEngagementProgress('eng-1', 10_000_000, [
      { id: 'l1', engagement_id: 'eng-1', montant: 3_000_000, statut: 'soumis' },
    ]);
    expect(result.total_liquide).toBe(3_000_000);
    expect(result.restant).toBe(7_000_000);
    expect(result.pourcent).toBeCloseTo(30);
    expect(result.is_complet).toBe(false);
    expect(result.count).toBe(1);
  });

  it('exclut les liquidations annulées et rejetées', () => {
    const result = computeEngagementProgress('eng-1', 10_000_000, [
      { id: 'l1', engagement_id: 'eng-1', montant: 3_000_000, statut: 'validé_dg' },
      { id: 'l2', engagement_id: 'eng-1', montant: 2_000_000, statut: 'annule' },
      { id: 'l3', engagement_id: 'eng-1', montant: 1_000_000, statut: 'rejete' },
    ]);
    expect(result.total_liquide).toBe(3_000_000);
    expect(result.count).toBe(1);
  });

  it('filtre par engagement_id', () => {
    const result = computeEngagementProgress('eng-1', 10_000_000, [
      { id: 'l1', engagement_id: 'eng-1', montant: 3_000_000, statut: 'soumis' },
      { id: 'l2', engagement_id: 'eng-2', montant: 5_000_000, statut: 'soumis' },
    ]);
    expect(result.total_liquide).toBe(3_000_000);
  });

  it('détecte complet à 100%', () => {
    const result = computeEngagementProgress('eng-1', 5_000_000, [
      { id: 'l1', engagement_id: 'eng-1', montant: 3_000_000, statut: 'validé_dg' },
      { id: 'l2', engagement_id: 'eng-1', montant: 2_000_000, statut: 'soumis' },
    ]);
    expect(result.restant).toBe(0);
    expect(result.pourcent).toBe(100);
    expect(result.is_complet).toBe(true);
  });

  it('gère engagement avec montant 0 sans division par zéro', () => {
    const result = computeEngagementProgress('eng-1', 0, []);
    expect(result.pourcent).toBe(0);
    expect(result.is_complet).toBe(true);
  });

  it('cap le pourcentage à 100% même en dépassement', () => {
    const result = computeEngagementProgress('eng-1', 1_000_000, [
      { id: 'l1', engagement_id: 'eng-1', montant: 1_500_000, statut: 'soumis' },
    ]);
    expect(result.pourcent).toBe(100);
  });
});

// ===========================================================================
// 9. buildLiquidationChainSteps (navigation chaîne)
// ===========================================================================
describe('buildLiquidationChainSteps', () => {
  it('devrait retourner 4 étapes', () => {
    const liq = createMockLiquidation();
    const steps = buildLiquidationChainSteps(liq);
    expect(steps).toHaveLength(4);
  });

  it('les 4 étapes sont Passation, Engagement, Liquidation, Ordonnancement', () => {
    const steps = buildLiquidationChainSteps(createMockLiquidation());
    expect(steps.map((s) => s.key)).toEqual([
      'passation',
      'engagement',
      'liquidation',
      'ordonnancement',
    ]);
  });

  it('la liquidation est toujours "current"', () => {
    const steps = buildLiquidationChainSteps(createMockLiquidation());
    const liqStep = steps.find((s) => s.key === 'liquidation');
    expect(liqStep?.status).toBe('current');
    expect(liqStep?.url).toBeNull();
  });

  it('passation unavailable quand pas de marché', () => {
    const liq = createMockLiquidation({
      engagement: {
        id: 'eng',
        numero: 'E1',
        objet: 'O',
        montant: 1000,
        fournisseur: 'F',
        budget_line: null,
        marche: null,
      },
    });
    const steps = buildLiquidationChainSteps(liq);
    expect(steps[0].status).toBe('unavailable');
    expect(steps[0].url).toBeNull();
  });

  it('passation completed quand marché existe', () => {
    const liq = createMockLiquidation({
      engagement: {
        id: 'eng',
        numero: 'E1',
        objet: 'O',
        montant: 1000,
        fournisseur: 'F',
        budget_line: null,
        marche: { id: 'mar-1', numero: 'PM-001', prestataire: null },
      },
    });
    const steps = buildLiquidationChainSteps(liq);
    expect(steps[0].status).toBe('completed');
    expect(steps[0].url).toContain('mar-1');
  });

  it('engagement completed quand engagement_id existe', () => {
    const steps = buildLiquidationChainSteps(createMockLiquidation());
    expect(steps[1].status).toBe('completed');
    expect(steps[1].url).toContain('eng-001');
  });

  it('ordonnancement pending quand statut validé_dg', () => {
    const liq = createMockLiquidation({ statut: 'validé_dg' });
    const steps = buildLiquidationChainSteps(liq);
    expect(steps[3].status).toBe('pending');
    expect(steps[3].url).toContain('sourceLiquidation');
    expect(steps[3].subtitle).toBe('Creer');
  });

  it('ordonnancement unavailable quand pas encore validé', () => {
    const liq = createMockLiquidation({ statut: 'soumis' });
    const steps = buildLiquidationChainSteps(liq);
    expect(steps[3].status).toBe('unavailable');
    expect(steps[3].url).toBeNull();
  });
});

// ===========================================================================
// 10. Compteurs (LiquidationCounts)
// ===========================================================================
describe('Compteurs par statut', () => {
  const dataset: Liquidation[] = [
    createMockLiquidation({ id: '1', statut: 'brouillon', montant: 100_000, service_fait: false }),
    createMockLiquidation({ id: '2', statut: 'certifié_sf', montant: 200_000, service_fait: true }),
    createMockLiquidation({ id: '3', statut: 'soumis', montant: 300_000, service_fait: true }),
    createMockLiquidation({ id: '4', statut: 'validé_daaf', montant: 400_000, service_fait: true }),
    createMockLiquidation({ id: '5', statut: 'validé_dg', montant: 500_000, service_fait: true }),
    createMockLiquidation({ id: '6', statut: 'rejete', montant: 150_000, service_fait: false }),
    createMockLiquidation({ id: '7', statut: 'differe', montant: 250_000, service_fait: false }),
    createMockLiquidation({
      id: '8',
      statut: 'soumis',
      montant: 600_000,
      reglement_urgent: true,
      service_fait: true,
    }),
    createMockLiquidation({ id: '9', statut: 'annule', montant: 50_000, service_fait: false }),
  ];

  const counts = calculateCounts(dataset);

  it('total devrait être 9', () => {
    expect(counts.total).toBe(9);
  });

  it('brouillon = 1', () => {
    expect(counts.brouillon).toBe(1);
  });

  it('certifie_sf = 1', () => {
    expect(counts.certifie_sf).toBe(1);
  });

  it('soumis = 2', () => {
    expect(counts.soumis).toBe(2);
  });

  it('valide_daaf = 1', () => {
    expect(counts.valide_daaf).toBe(1);
  });

  it('valide_dg = 1', () => {
    expect(counts.valide_dg).toBe(1);
  });

  it('rejete = 1', () => {
    expect(counts.rejete).toBe(1);
  });

  it('differe = 1', () => {
    expect(counts.differe).toBe(1);
  });

  it('annule = 1', () => {
    expect(counts.annule).toBe(1);
  });

  it('a_valider = soumis + validé_daaf = 3', () => {
    expect(counts.a_valider).toBe(3);
  });

  it('urgent = 1 (soumis + urgent)', () => {
    expect(counts.urgent).toBe(1);
  });

  it('service_fait = 5', () => {
    expect(counts.service_fait).toBe(5);
  });

  it('total_montant = somme de tous les montants', () => {
    expect(counts.total_montant).toBe(2_550_000);
  });
});

// ===========================================================================
// 11. Export helpers (fmtCurrency, fmtDate, labels)
// ===========================================================================
describe('Export helpers', () => {
  describe('fmtCurrency', () => {
    it('formate un montant positif', () => {
      const result = fmtCurrency(1_000_000);
      expect(result).toContain('1');
      expect(result).toContain('FCFA');
    });

    it('retourne "-" pour null', () => {
      expect(fmtCurrency(null)).toBe('-');
    });

    it('retourne "-" pour undefined', () => {
      expect(fmtCurrency(undefined)).toBe('-');
    });

    it('retourne "-" pour NaN', () => {
      expect(fmtCurrency(NaN)).toBe('-');
    });

    it('gère le zéro', () => {
      const result = fmtCurrency(0);
      expect(result).toContain('0');
      expect(result).toContain('FCFA');
    });
  });

  describe('fmtDate', () => {
    it('formate une date ISO', () => {
      const result = fmtDate('2026-02-15');
      expect(result).toContain('2026');
    });

    it('retourne "-" pour null', () => {
      expect(fmtDate(null)).toBe('-');
    });

    it('retourne "-" pour undefined', () => {
      expect(fmtDate(undefined)).toBe('-');
    });

    it('retourne "-" pour chaîne vide', () => {
      expect(fmtDate('')).toBe('-');
    });
  });

  describe('liquidationStatutLabel', () => {
    it('traduit brouillon', () => {
      expect(liquidationStatutLabel('brouillon')).toBe('Brouillon');
    });

    it('traduit certifié_sf', () => {
      expect(liquidationStatutLabel('certifié_sf')).toBe('SF Certifié');
    });

    it('traduit soumis', () => {
      expect(liquidationStatutLabel('soumis')).toBe('Soumis');
    });

    it('traduit validé_daaf', () => {
      expect(liquidationStatutLabel('validé_daaf')).toBe('Validé DAAF');
    });

    it('traduit validé_dg', () => {
      expect(liquidationStatutLabel('validé_dg')).toBe('Validé DG');
    });

    it('traduit rejete', () => {
      expect(liquidationStatutLabel('rejete')).toBe('Rejeté');
    });

    it('traduit differe', () => {
      expect(liquidationStatutLabel('differe')).toBe('Différé');
    });

    it('traduit annule', () => {
      expect(liquidationStatutLabel('annule')).toBe('Annulé');
    });

    it('retourne "-" pour null', () => {
      expect(liquidationStatutLabel(null)).toBe('-');
    });

    it('retourne le statut brut pour un inconnu', () => {
      expect(liquidationStatutLabel('inconnu')).toBe('inconnu');
    });
  });

  describe('regimeFiscalLabel', () => {
    it('traduit reel_normal', () => {
      expect(regimeFiscalLabel('reel_normal')).toBe('Réel normal');
    });

    it('traduit reel_simplifie', () => {
      expect(regimeFiscalLabel('reel_simplifie')).toBe('Réel simplifié');
    });

    it('traduit exonere', () => {
      expect(regimeFiscalLabel('exonere')).toBe('Exonéré');
    });

    it('retourne "-" pour null', () => {
      expect(regimeFiscalLabel(null)).toBe('-');
    });

    it('retourne le régime brut pour un inconnu', () => {
      expect(regimeFiscalLabel('special')).toBe('special');
    });
  });
});

// ===========================================================================
// 12. computeSuiviParEngagement (export)
// ===========================================================================
describe('computeSuiviParEngagement', () => {
  it('regroupe les liquidations par engagement', () => {
    const liqList: Liquidation[] = [
      createMockLiquidation({
        id: 'l1',
        engagement_id: 'eng-1',
        montant: 1_000_000,
        engagement: {
          id: 'eng-1',
          numero: 'E1',
          objet: 'Objet 1',
          montant: 5_000_000,
          fournisseur: 'F1',
          budget_line: null,
          marche: null,
        },
      }),
      createMockLiquidation({
        id: 'l2',
        engagement_id: 'eng-1',
        montant: 2_000_000,
        engagement: {
          id: 'eng-1',
          numero: 'E1',
          objet: 'Objet 1',
          montant: 5_000_000,
          fournisseur: 'F1',
          budget_line: null,
          marche: null,
        },
      }),
      createMockLiquidation({
        id: 'l3',
        engagement_id: 'eng-2',
        montant: 3_000_000,
        engagement: {
          id: 'eng-2',
          numero: 'E2',
          objet: 'Objet 2',
          montant: 10_000_000,
          fournisseur: 'F2',
          budget_line: null,
          marche: null,
        },
      }),
    ];

    const result = computeSuiviParEngagement(liqList);
    expect(result).toHaveLength(2);
  });

  it('exclut les liquidations rejetées et annulées', () => {
    const liqList: Liquidation[] = [
      createMockLiquidation({
        id: 'l1',
        engagement_id: 'eng-1',
        montant: 1_000_000,
        statut: 'validé_dg',
      }),
      createMockLiquidation({
        id: 'l2',
        engagement_id: 'eng-1',
        montant: 2_000_000,
        statut: 'rejete',
      }),
      createMockLiquidation({
        id: 'l3',
        engagement_id: 'eng-1',
        montant: 3_000_000,
        statut: 'annule',
      }),
    ];

    const result = computeSuiviParEngagement(liqList);
    expect(result).toHaveLength(1);
    expect(result[0].totalLiquide).toBe(1_000_000);
    expect(result[0].nbLiquidations).toBe(1);
  });

  it('calcule correctement le taux de consommation', () => {
    const liqList: Liquidation[] = [
      createMockLiquidation({
        engagement_id: 'eng-1',
        montant: 2_500_000,
        statut: 'validé_dg',
        engagement: {
          id: 'eng-1',
          numero: 'E1',
          objet: 'O1',
          montant: 5_000_000,
          fournisseur: 'F1',
          budget_line: null,
          marche: null,
        },
      }),
    ];

    const result = computeSuiviParEngagement(liqList);
    expect(result[0].taux).toBeCloseTo(50);
    expect(result[0].restant).toBe(2_500_000);
  });

  it('trie par taux de consommation décroissant', () => {
    const liqList: Liquidation[] = [
      createMockLiquidation({
        id: 'l1',
        engagement_id: 'eng-1',
        montant: 1_000_000,
        engagement: {
          id: 'eng-1',
          numero: 'E1',
          objet: 'O1',
          montant: 10_000_000,
          fournisseur: 'F1',
          budget_line: null,
          marche: null,
        },
      }),
      createMockLiquidation({
        id: 'l2',
        engagement_id: 'eng-2',
        montant: 9_000_000,
        engagement: {
          id: 'eng-2',
          numero: 'E2',
          objet: 'O2',
          montant: 10_000_000,
          fournisseur: 'F2',
          budget_line: null,
          marche: null,
        },
      }),
    ];

    const result = computeSuiviParEngagement(liqList);
    expect(result[0].engagementNumero).toBe('E2'); // 90% > 10%
    expect(result[1].engagementNumero).toBe('E1');
  });

  it('retourne tableau vide pour liste vide', () => {
    expect(computeSuiviParEngagement([])).toHaveLength(0);
  });

  it('gère engagement avec montant 0 sans NaN', () => {
    const liqList: Liquidation[] = [
      createMockLiquidation({
        engagement_id: 'eng-1',
        montant: 0,
        engagement: {
          id: 'eng-1',
          numero: 'E1',
          objet: 'O1',
          montant: 0,
          fournisseur: 'F1',
          budget_line: null,
          marche: null,
        },
      }),
    ];

    const result = computeSuiviParEngagement(liqList);
    expect(result[0].taux).toBe(0);
    expect(isNaN(result[0].taux)).toBe(false);
  });
});

// ===========================================================================
// 13. Mock factory validation
// ===========================================================================
describe('Mock factory Liquidation', () => {
  it('crée un objet Liquidation valide avec tous les champs', () => {
    const liq = createMockLiquidation();
    expect(liq.id).toBe('liq-001');
    expect(liq.numero).toBe('LIQ2026001');
    expect(liq.montant).toBe(1_000_000);
    expect(liq.engagement_id).toBe('eng-001');
    expect(liq.statut).toBe('brouillon');
    expect(liq.exercice).toBe(2026);
  });

  it('permet de surcharger des champs', () => {
    const liq = createMockLiquidation({ statut: 'soumis', montant: 999 });
    expect(liq.statut).toBe('soumis');
    expect(liq.montant).toBe(999);
    // Les autres champs gardent la valeur par défaut
    expect(liq.numero).toBe('LIQ2026001');
  });

  it("permet de surcharger les données d'engagement", () => {
    const liq = createMockLiquidation({
      engagement: {
        id: 'custom-eng',
        numero: 'CUSTOM001',
        objet: 'Custom',
        montant: 99_000,
        fournisseur: 'Custom Corp',
        budget_line: null,
        marche: {
          id: 'mar-1',
          numero: 'PM-99',
          prestataire: { id: 'prest-1', raison_sociale: 'Corp SA' },
        },
      },
    });
    expect(liq.engagement?.numero).toBe('CUSTOM001');
    expect(liq.engagement?.marche?.prestataire?.raison_sociale).toBe('Corp SA');
  });
});
