/**
 * Hook de suivi DG — agrégation des validations en attente,
 * matrice de validation, suivi par direction, historique
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useExercice } from '@/contexts/ExerciceContext';

// ============================================
// TYPES
// ============================================

export interface SuiviDGStats {
  totalEnAttente: number;
  montantEnAttente: number;
  delaiMoyenJours: number;
  enRetard: number;
  tauxValidation: number;
  totalValideesMois: number;
  totalTraiteesMois: number;
  pipeline: PipelineStep[];
}

export interface MatriceStep {
  stepOrder: number;
  label: string;
  roleRequired: string;
  personnes: string[];
  countPending: number;
}

export interface MatriceRow {
  moduleCode: string;
  moduleLabel: string;
  steps: MatriceStep[];
  totalPending: number;
}

export interface DirectionSuivi {
  directionId: string;
  directionCode: string;
  directionSigle: string | null;
  directionLabel: string;
  responsableNom: string | null;
  parModule: Record<string, number>;
  totalEnAttente: number;
  montantEnAttente: number;
  urgence: 'vert' | 'orange' | 'rouge';
}

export interface PipelineStep {
  etape: number;
  label: string;
  countEnAttente: number;
  countTotal: number;
  pourcentage: number;
  color: string;
  url: string;
}

export interface OperationEnAttente {
  id: string;
  reference: string;
  entityTitle: string | null;
  module: string;
  moduleLabel: string;
  directionCode: string;
  directionLabel: string;
  etapeActuelle: string;
  validateurRole: string;
  validateurNom: string | null;
  delaiJours: number;
  montant: number | null;
  slaDepasse: boolean;
  priorite: string;
  createdAt: string;
  entityUrl: string;
  stepActuel: number;
  stepTotal: number;
}

export interface HistoriqueAction {
  id: string;
  action: string;
  actionLabel: string;
  entityType: string;
  entityTypeLabel: string;
  entityReference: string | null;
  userName: string | null;
  userRole: string | null;
  motif: string | null;
  newStatus: string | null;
  createdAt: string;
}

// ============================================
// CONSTANTES
// ============================================

const ENTITY_URL_MAP: Record<string, string> = {
  notes_sef: '/notes-sef',
  notes_aef: '/notes-aef',
  notes_dg: '/notes-aef',
  budget_engagements: '/engagements',
  budget_liquidations: '/liquidations',
  ordonnancements: '/ordonnancements',
  reglements: '/reglements',
  passation_marche: '/execution/passation-marche',
  expressions_besoin: '/execution/expression-besoin',
  imputations: '/execution/imputation',
};

const MODULE_LABELS: Record<string, string> = {
  NOTES_SEF: 'Notes SEF',
  NOTES_AEF: 'Notes AEF',
  IMPUTATION: 'Imputation',
  EXPRESSION_BESOIN: 'Expression Besoin',
  PASSATION_MARCHE: 'Passation Marché',
  ENGAGEMENT: 'Engagement',
  LIQUIDATION: 'Liquidation',
  ORDONNANCEMENT: 'Ordonnancement',
  REGLEMENT: 'Règlement',
};

const ROLE_LABELS: Record<string, string> = {
  DG: 'Directeur Général',
  DAAF: 'DAAF',
  DAF: 'DAF',
  CB: 'Contrôleur Budgétaire',
  SAF: 'Service Comptable',
  SDPM: 'Sous-Dir. Passation',
  SDCT: 'Sous-Dir. Comptabilité',
  TRESORERIE: 'Trésorerie',
  TRESORIER: 'Trésorier',
  DIRECTEUR: 'Directeur',
  OPERATEUR: 'Opérateur',
  CHARGE_MISSION: 'Chargé de Mission',
  DGPEC: 'DGPEC',
};

const ACTION_LABELS: Record<string, string> = {
  VALIDATE: 'Validé',
  APPROVE: 'Approuvé',
  REJECT: 'Rejeté',
  DEFER: 'Différé',
  SUBMIT: 'Soumis',
  SIGN: 'Signé',
  CREATE: 'Créé',
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  notes_sef: 'Note SEF',
  notes_dg: 'Note AEF',
  notes_aef: 'Note AEF',
  budget_engagements: 'Engagement',
  budget_liquidations: 'Liquidation',
  ordonnancements: 'Ordonnancement',
  reglements: 'Règlement',
  passation_marche: 'Passation Marché',
  expressions_besoin: 'Expression Besoin',
  imputations: 'Imputation',
};

const MODULE_STEP_MAP: Record<string, number> = {
  notes_sef: 1,
  notes_dg: 2,
  notes_aef: 2,
  imputations: 3,
  expressions_besoin: 4,
  passation_marche: 5,
  budget_engagements: 6,
  budget_liquidations: 7,
  ordonnancements: 8,
  reglements: 9,
};

const PIPELINE_CONFIG = [
  { etape: 1, label: 'Notes SEF', color: 'blue', url: '/notes-sef' },
  { etape: 2, label: 'Notes AEF', color: 'indigo', url: '/notes-aef' },
  { etape: 3, label: 'Imputation', color: 'cyan', url: '/execution/imputation' },
  { etape: 4, label: 'Expr. Besoin', color: 'teal', url: '/execution/expression-besoin' },
  { etape: 5, label: 'Passation', color: 'emerald', url: '/execution/passation-marche' },
  { etape: 6, label: 'Engagement', color: 'green', url: '/engagements' },
  { etape: 7, label: 'Liquidation', color: 'amber', url: '/liquidations' },
  { etape: 8, label: 'Ordonnanc.', color: 'purple', url: '/ordonnancements' },
  { etape: 9, label: 'Règlement', color: 'emerald', url: '/reglements' },
];

// ============================================
// HELPERS
// ============================================

function getEntityUrl(entityType: string, _entityId: string): string {
  return ENTITY_URL_MAP[entityType] || '/';
}

function computeDelaiJours(dateStr: string): number {
  return Math.max(0, Math.ceil((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)));
}

function computeUrgence(delaiMaxJours: number): 'vert' | 'orange' | 'rouge' {
  if (delaiMaxJours > 7) return 'rouge';
  if (delaiMaxJours > 3) return 'orange';
  return 'vert';
}

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useSuiviDG() {
  const { exercice } = useExercice();

  // 1. Stats KPI + opérations en attente (depuis les tables entity, comme useSidebarBadges)
  const statsQuery = useQuery({
    queryKey: ['suivi-dg-stats', exercice],
    queryFn: async (): Promise<SuiviDGStats> => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [
        sefRes,
        aefRes,
        ebRes,
        engRes,
        liqRes,
        ordoRes,
        reglRes,
        marchesRes,
        logsValidMois,
        logsTotalMois,
        // Totaux pour le pipeline (tous statuts confondus)
        sefTotalRes,
        aefTotalRes,
        impTotalRes,
        ebTotalRes,
        marchesTotalRes,
        engTotalRes,
        liqTotalRes,
        ordoTotalRes,
        reglTotalRes,
      ] = await Promise.all([
        // Counts en attente par module
        supabase
          .from('notes_sef')
          .select('id, montant_estime', { count: 'exact', head: false })
          .eq('exercice', exercice)
          .in('statut', ['soumis', 'a_valider_dg']),
        supabase
          .from('notes_dg')
          .select('id, montant_estime', { count: 'exact', head: false })
          .eq('exercice', exercice)
          .in('statut', ['soumis', 'a_valider']),
        supabase
          .from('expressions_besoin')
          .select('id, montant_estime', { count: 'exact', head: false })
          .eq('exercice', exercice)
          .in('statut', ['soumis', 'verifie']),
        supabase
          .from('budget_engagements')
          .select('id, montant, created_at', { count: 'exact', head: false })
          .eq('exercice', exercice)
          .in('statut', ['soumis', 'visa_saf', 'visa_cb', 'visa_daaf']),
        supabase
          .from('budget_liquidations')
          .select('id, montant, created_at', { count: 'exact', head: false })
          .eq('exercice', exercice)
          .in('statut', ['soumis', 'certifié_sf']),
        supabase
          .from('ordonnancements')
          .select('id, montant, created_at', { count: 'exact', head: false })
          .eq('exercice', exercice)
          .in('statut', ['soumis', 'en_attente', 'en_signature']),
        supabase
          .from('reglements')
          .select('id, montant', { count: 'exact', head: false })
          .eq('exercice', exercice)
          .eq('statut', 'en_attente'),
        supabase
          .from('passation_marche')
          .select('id', { count: 'exact', head: true })
          .eq('exercice', exercice)
          .in('statut', ['attribue']),
        // Logs validations ce mois
        supabase
          .from('logs_actions')
          .select('id', { count: 'exact', head: true })
          .in('action', ['VALIDATE', 'APPROVE'])
          .gte('created_at', startOfMonth),
        supabase
          .from('logs_actions')
          .select('id', { count: 'exact', head: true })
          .in('action', ['VALIDATE', 'APPROVE', 'REJECT', 'DEFER', 'CANCEL'])
          .gte('created_at', startOfMonth),
        // Totaux pipeline (head: true = count only)
        supabase
          .from('notes_sef')
          .select('id', { count: 'exact', head: true })
          .eq('exercice', exercice),
        supabase
          .from('notes_dg')
          .select('id', { count: 'exact', head: true })
          .eq('exercice', exercice),
        supabase
          .from('notes_dg')
          .select('id', { count: 'exact', head: true })
          .eq('exercice', exercice)
          .eq('statut', 'a_imputer'),
        supabase
          .from('expressions_besoin')
          .select('id', { count: 'exact', head: true })
          .eq('exercice', exercice),
        supabase
          .from('passation_marche')
          .select('id', { count: 'exact', head: true })
          .eq('exercice', exercice),
        supabase
          .from('budget_engagements')
          .select('id', { count: 'exact', head: true })
          .eq('exercice', exercice),
        supabase
          .from('budget_liquidations')
          .select('id', { count: 'exact', head: true })
          .eq('exercice', exercice),
        supabase
          .from('ordonnancements')
          .select('id', { count: 'exact', head: true })
          .eq('exercice', exercice),
        supabase
          .from('reglements')
          .select('id', { count: 'exact', head: true })
          .eq('exercice', exercice),
      ]);

      const sefData = sefRes.data || [];
      const aefData = aefRes.data || [];
      const ebData = ebRes.data || [];
      const engData = engRes.data || [];
      const liqData = liqRes.data || [];
      const ordoData = ordoRes.data || [];
      const reglData = reglRes.data || [];

      const totalEnAttente =
        sefData.length +
        aefData.length +
        ebData.length +
        engData.length +
        liqData.length +
        ordoData.length +
        reglData.length +
        (marchesRes.count || 0);

      const montantEnAttente =
        sefData.reduce((s, n) => s + (n.montant_estime || 0), 0) +
        aefData.reduce((s, n) => s + (n.montant_estime || 0), 0) +
        ebData.reduce((s, n) => s + (n.montant_estime || 0), 0) +
        engData.reduce((s, n) => s + (n.montant || 0), 0) +
        liqData.reduce((s, n) => s + (n.montant || 0), 0) +
        ordoData.reduce((s, n) => s + (n.montant || 0), 0) +
        reglData.reduce((s, n) => s + (n.montant || 0), 0);

      // Délai moyen (engagements + liquidations + ordos qui ont created_at)
      const allDates = [
        ...engData.map((e) => e.created_at),
        ...liqData.map((l) => l.created_at),
        ...ordoData.map((o) => o.created_at),
      ].filter(Boolean);
      const delaiMoyenJours =
        allDates.length > 0
          ? Math.round(allDates.reduce((sum, d) => sum + computeDelaiJours(d), 0) / allDates.length)
          : 0;

      // Opérations en retard (> 5 jours)
      const enRetard = allDates.filter((d) => computeDelaiJours(d) > 5).length;

      const totalValideesMois = logsValidMois.count || 0;
      const totalTraiteesMois = logsTotalMois.count || 0;
      const tauxValidation =
        totalTraiteesMois > 0 ? Math.round((totalValideesMois / totalTraiteesMois) * 100) : 0;

      // Pipeline 9 étapes
      const enAttenteParEtape = [
        sefData.length, // 1 Notes SEF
        aefData.length, // 2 Notes AEF
        impTotalRes.count || 0, // 3 Imputation (a_imputer)
        ebData.length, // 4 Expr. Besoin
        marchesRes.count || 0, // 5 Passation
        engData.length, // 6 Engagement
        liqData.length, // 7 Liquidation
        ordoData.length, // 8 Ordonnancement
        reglData.length, // 9 Règlement
      ];
      const totauxParEtape = [
        sefTotalRes.count || 0,
        aefTotalRes.count || 0,
        impTotalRes.count || 0,
        ebTotalRes.count || 0,
        marchesTotalRes.count || 0,
        engTotalRes.count || 0,
        liqTotalRes.count || 0,
        ordoTotalRes.count || 0,
        reglTotalRes.count || 0,
      ];

      const pipeline: PipelineStep[] = PIPELINE_CONFIG.map((cfg, i) => {
        const total = totauxParEtape[i];
        const enAttente = enAttenteParEtape[i];
        const traites = total - enAttente;
        return {
          ...cfg,
          countEnAttente: enAttente,
          countTotal: total,
          pourcentage: total > 0 ? Math.round((traites / total) * 100) : 100,
        };
      });

      return {
        totalEnAttente,
        montantEnAttente,
        delaiMoyenJours,
        enRetard,
        tauxValidation,
        totalValideesMois,
        totalTraiteesMois,
        pipeline,
      };
    },
    enabled: !!exercice,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  // 2. Matrice de validation (validation_hierarchy + workflow_modules + user_roles/profiles)
  const matriceQuery = useQuery({
    queryKey: ['suivi-dg-matrice'],
    queryFn: async (): Promise<MatriceRow[]> => {
      const [modulesRes, hierarchyRes, rolesRes, profilesRes] = await Promise.all([
        supabase
          .from('workflow_modules')
          .select('id, code, label')
          .eq('is_active', true)
          .order('code'),
        supabase
          .from('validation_hierarchy')
          .select('module_id, step_order, label, role')
          .eq('is_active', true)
          .order('step_order'),
        supabase.from('user_roles').select('user_id, role').eq('is_active', true),
        supabase.from('profiles').select('id, full_name').eq('is_active', true),
      ]);

      const modules = modulesRes.data || [];
      const hierarchy = hierarchyRes.data || [];
      const roles = rolesRes.data || [];
      const profiles = profilesRes.data || [];

      // Map user_id → full_name
      const profileMap: Record<string, string> = {};
      for (const p of profiles) {
        if (p.full_name) profileMap[p.id] = p.full_name;
      }

      // Map rôle → noms des personnes
      const rolePersonnesMap: Record<string, string[]> = {};
      for (const r of roles) {
        const roleName = r.role;
        const name = profileMap[r.user_id];
        if (name) {
          if (!rolePersonnesMap[roleName]) rolePersonnesMap[roleName] = [];
          if (!rolePersonnesMap[roleName].includes(name)) {
            rolePersonnesMap[roleName].push(name);
          }
        }
      }

      return modules.map((mod): MatriceRow => {
        const modSteps = hierarchy.filter((h) => h.module_id === mod.id);
        return {
          moduleCode: mod.code,
          moduleLabel: mod.label || MODULE_LABELS[mod.code] || mod.code,
          steps: modSteps.map(
            (step): MatriceStep => ({
              stepOrder: step.step_order,
              label: step.label || `Étape ${step.step_order}`,
              roleRequired: step.role,
              personnes: rolePersonnesMap[step.role] || [],
              countPending: 0, // sera enrichi côté composant avec les stats
            })
          ),
          totalPending: 0,
        };
      });
    },
    staleTime: 300_000, // 5 min — données de config
  });

  // 3. Suivi par direction (basé sur notes_sef qui ont direction_id + expressions_besoin)
  const directionsQuery = useQuery({
    queryKey: ['suivi-dg-directions', exercice],
    queryFn: async (): Promise<DirectionSuivi[]> => {
      const [dirsRes, sefRes, ebRes] = await Promise.all([
        supabase
          .from('directions')
          .select(
            'id, code, label, sigle, responsable:profiles!directions_responsable_id_fkey(full_name)'
          )
          .eq('est_active', true)
          .order('code'),
        supabase
          .from('notes_sef')
          .select('direction_id, montant_estime, created_at')
          .eq('exercice', exercice)
          .in('statut', ['soumis', 'a_valider_dg']),
        supabase
          .from('expressions_besoin')
          .select('direction_id, montant_estime, created_at')
          .eq('exercice', exercice)
          .in('statut', ['soumis', 'verifie']),
      ]);

      const dirs = dirsRes.data || [];
      const sefData = sefRes.data || [];
      const ebData = ebRes.data || [];

      return dirs
        .map((dir): DirectionSuivi => {
          const responsable = dir.responsable as unknown as { full_name: string | null } | null;
          const sefItems = sefData.filter((s) => s.direction_id === dir.id);
          const ebItems = ebData.filter((e) => e.direction_id === dir.id);

          const totalEnAttente = sefItems.length + ebItems.length;
          const montantEnAttente =
            sefItems.reduce((sum, s) => sum + (s.montant_estime || 0), 0) +
            ebItems.reduce((sum, e) => sum + (e.montant_estime || 0), 0);

          // Urgence basée sur le plus vieux document
          const allDates = [
            ...sefItems.map((s) => s.created_at),
            ...ebItems.map((e) => e.created_at),
          ].filter(Boolean);
          const maxDelai =
            allDates.length > 0 ? Math.max(...allDates.map((d) => computeDelaiJours(d))) : 0;

          return {
            directionId: dir.id,
            directionCode: dir.code,
            directionSigle: dir.sigle,
            directionLabel: dir.label,
            responsableNom: responsable?.full_name || null,
            parModule: {
              'Notes SEF': sefItems.length,
              'Expr. Besoin': ebItems.length,
            },
            totalEnAttente,
            montantEnAttente,
            urgence: totalEnAttente === 0 ? 'vert' : computeUrgence(maxDelai),
          };
        })
        .filter((d) => d.totalEnAttente > 0)
        .sort((a, b) => b.totalEnAttente - a.totalEnAttente);
    },
    enabled: !!exercice,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  // 4. Opérations en attente (détaillé)
  const operationsQuery = useQuery({
    queryKey: ['suivi-dg-operations', exercice],
    queryFn: async (): Promise<OperationEnAttente[]> => {
      const [sefRes, engRes, liqRes, ordoRes] = await Promise.all([
        supabase
          .from('notes_sef')
          .select(
            'id, reference_pivot, objet, direction_id, montant_estime, statut, created_at, directions!notes_sef_direction_id_fkey(code, label)'
          )
          .eq('exercice', exercice)
          .in('statut', ['soumis', 'a_valider_dg'])
          .order('created_at', { ascending: true })
          .limit(100),
        supabase
          .from('budget_engagements')
          .select('id, numero, objet, montant, statut, created_at')
          .eq('exercice', exercice)
          .in('statut', ['soumis', 'visa_saf', 'visa_cb', 'visa_daaf'])
          .order('created_at', { ascending: true })
          .limit(100),
        supabase
          .from('budget_liquidations')
          .select('id, numero, montant, statut, created_at')
          .eq('exercice', exercice)
          .in('statut', ['soumis', 'certifié_sf'])
          .order('created_at', { ascending: true })
          .limit(100),
        supabase
          .from('ordonnancements')
          .select('id, numero, objet, montant, statut, created_at')
          .eq('exercice', exercice)
          .in('statut', ['soumis', 'en_attente', 'en_signature'])
          .order('created_at', { ascending: true })
          .limit(100),
      ]);

      const ops: OperationEnAttente[] = [];

      // Notes SEF
      for (const item of sefRes.data || []) {
        const dir = item.directions as unknown as { code: string; label: string } | null;
        const delai = computeDelaiJours(item.created_at);
        ops.push({
          id: item.id,
          reference: item.reference_pivot || '—',
          entityTitle: item.objet,
          module: 'notes_sef',
          moduleLabel: 'Note SEF',
          directionCode: dir?.code || '—',
          directionLabel: dir?.label || '—',
          etapeActuelle: item.statut === 'a_valider_dg' ? 'Validation DG' : 'Validation Directeur',
          validateurRole: item.statut === 'a_valider_dg' ? 'DG' : 'DIRECTEUR',
          validateurNom: null,
          delaiJours: delai,
          montant: item.montant_estime,
          slaDepasse: delai > 5,
          priorite: delai > 7 ? 'haute' : 'normale',
          createdAt: item.created_at,
          entityUrl: getEntityUrl('notes_sef', item.id),
          stepActuel: MODULE_STEP_MAP['notes_sef'],
          stepTotal: 9,
        });
      }

      // Engagements (pas de direction_id — table liée via budget_line_id)
      const engEtapeMap: Record<string, { etape: string; role: string }> = {
        soumis: { etape: 'Visa SAF', role: 'SAF' },
        visa_saf: { etape: 'Visa CB', role: 'CB' },
        visa_cb: { etape: 'Visa DAAF', role: 'DAAF' },
        visa_daaf: { etape: 'Visa DG', role: 'DG' },
      };
      for (const item of engRes.data || []) {
        const delai = computeDelaiJours(item.created_at);
        const step = engEtapeMap[item.statut || ''] || { etape: item.statut || '—', role: '—' };
        ops.push({
          id: item.id,
          reference: item.numero || '—',
          entityTitle: item.objet,
          module: 'budget_engagements',
          moduleLabel: 'Engagement',
          directionCode: '—',
          directionLabel: '—',
          etapeActuelle: step.etape,
          validateurRole: step.role,
          validateurNom: null,
          delaiJours: delai,
          montant: item.montant,
          slaDepasse: delai > 5,
          priorite: delai > 7 ? 'haute' : 'normale',
          createdAt: item.created_at,
          entityUrl: getEntityUrl('budget_engagements', item.id),
          stepActuel: MODULE_STEP_MAP['budget_engagements'],
          stepTotal: 9,
        });
      }

      // Liquidations (pas de direction_id ni objet)
      for (const item of liqRes.data || []) {
        const delai = computeDelaiJours(item.created_at);
        ops.push({
          id: item.id,
          reference: item.numero || '—',
          entityTitle: null,
          module: 'budget_liquidations',
          moduleLabel: 'Liquidation',
          directionCode: '—',
          directionLabel: '—',
          etapeActuelle: item.statut === 'certifié_sf' ? 'Validation DAAF' : 'Certification SF',
          validateurRole: item.statut === 'certifié_sf' ? 'DAAF' : 'CB',
          validateurNom: null,
          delaiJours: delai,
          montant: item.montant,
          slaDepasse: delai > 5,
          priorite: delai > 7 ? 'haute' : 'normale',
          createdAt: item.created_at,
          entityUrl: getEntityUrl('budget_liquidations', item.id),
          stepActuel: MODULE_STEP_MAP['budget_liquidations'],
          stepTotal: 9,
        });
      }

      // Ordonnancements (pas de direction_id)
      for (const item of ordoRes.data || []) {
        const delai = computeDelaiJours(item.created_at);
        const etape =
          item.statut === 'en_signature'
            ? 'Signature DG'
            : item.statut === 'en_attente'
              ? 'Validation DAF'
              : 'Soumis';
        const role =
          item.statut === 'en_signature' ? 'DG' : item.statut === 'en_attente' ? 'DAF' : 'DAF';
        ops.push({
          id: item.id,
          reference: item.numero || '—',
          entityTitle: item.objet,
          module: 'ordonnancements',
          moduleLabel: 'Ordonnancement',
          directionCode: '—',
          directionLabel: '—',
          etapeActuelle: etape,
          validateurRole: role,
          validateurNom: null,
          delaiJours: delai,
          montant: item.montant,
          slaDepasse: delai > 5,
          priorite: delai > 7 ? 'haute' : 'normale',
          createdAt: item.created_at,
          entityUrl: getEntityUrl('ordonnancements', item.id),
          stepActuel: MODULE_STEP_MAP['ordonnancements'],
          stepTotal: 9,
        });
      }

      // Trier par délai décroissant (les plus urgents en premier)
      return ops.sort((a, b) => b.delaiJours - a.delaiJours);
    },
    enabled: !!exercice,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  // 5. Historique des validations récentes
  const historiqueQuery = useQuery({
    queryKey: ['suivi-dg-historique'],
    queryFn: async (): Promise<HistoriqueAction[]> => {
      const { data } = await supabase
        .from('v_logs_actions')
        .select(
          'id, action, action_label, entity_type, entity_type_label, entity_reference, user_name, new_status, created_at, metadata'
        )
        .in('action', ['VALIDATE', 'APPROVE', 'REJECT', 'DEFER', 'CANCEL', 'SUBMIT'])
        .order('created_at', { ascending: false })
        .limit(50);

      return (data || []).map(
        (log): HistoriqueAction => ({
          id: log.id || '',
          action: log.action || '',
          actionLabel: log.action_label || ACTION_LABELS[log.action || ''] || log.action || '',
          entityType: log.entity_type || '',
          entityTypeLabel:
            log.entity_type_label ||
            ENTITY_TYPE_LABELS[log.entity_type || ''] ||
            log.entity_type ||
            '',
          entityReference: log.entity_reference,
          userName: log.user_name,
          userRole: null, // la vue ne contient pas le rôle
          motif: null,
          newStatus: log.new_status,
          createdAt: log.created_at || '',
        })
      );
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  return {
    stats: statsQuery.data || {
      totalEnAttente: 0,
      montantEnAttente: 0,
      delaiMoyenJours: 0,
      enRetard: 0,
      tauxValidation: 0,
      totalValideesMois: 0,
      totalTraiteesMois: 0,
      pipeline: [],
    },
    matrice: matriceQuery.data || [],
    directions: directionsQuery.data || [],
    operations: operationsQuery.data || [],
    historique: historiqueQuery.data || [],
    isLoading: statsQuery.isLoading || operationsQuery.isLoading,
    refetch: () => {
      statsQuery.refetch();
      matriceQuery.refetch();
      directionsQuery.refetch();
      operationsQuery.refetch();
      historiqueQuery.refetch();
    },
    // Exports pour les constantes
    ROLE_LABELS,
    ENTITY_URL_MAP,
  };
}
