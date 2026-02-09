/**
 * Hook pour récupérer les données du dashboard SYGFP
 * Utilise TanStack Query avec refetchInterval pour les mises à jour en temps réel
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useExercice } from '@/contexts/ExerciceContext';
import { usePermissions } from '@/hooks/usePermissions';

// ============================================================================
// TYPES
// ============================================================================

export interface DashboardKPIs {
  // Notes SEF
  notesSEF: {
    total: number;
    brouillon: number;
    soumis: number;
    aValider: number;
    valide: number;
    differe: number;
    rejete: number;
  };
  // Notes AEF
  notesAEF: {
    total: number;
    enCours: number;
    valide: number;
  };
  // Dossiers
  dossiers: {
    total: number;
    enCours: number;
    valide: number;
    solde: number;
    bloque: number;
  };
  // Budget
  budget: {
    total: number;
    engage: number;
    liquide: number;
    ordonnance: number;
    paye: number;
    tauxExecution: number;
  };
  // Délais moyens (en jours)
  delais: {
    moyenValidation: number;
    moyenTraitement: number;
  };
  // Activité récente (7 derniers jours)
  activiteRecente: {
    notesCreees: number;
    notesValidees: number;
    dossiersTraites: number;
  };
}

export interface ChartData {
  // Répartition par statut
  repartitionStatut: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  // Évolution mensuelle
  evolutionMensuelle: Array<{
    mois: string;
    notes: number;
    dossiers: number;
    montant: number;
  }>;
  // Répartition par direction
  repartitionDirection: Array<{
    direction: string;
    notes: number;
    montant: number;
  }>;
  // Répartition par type de dépense
  repartitionTypeDepense: Array<{
    type: string;
    montant: number;
    pourcentage: number;
  }>;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  charts: ChartData;
  lastUpdated: Date;
}

// ============================================================================
// COULEURS DES STATUTS
// ============================================================================

const STATUS_COLORS: Record<string, string> = {
  brouillon: '#9CA3AF',
  soumis: '#3B82F6',
  a_valider: '#F59E0B',
  valide: '#10B981',
  differe: '#F97316',
  rejete: '#EF4444',
  en_cours: '#3B82F6',
  solde: '#10B981',
  bloque: '#EF4444',
};

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useDashboardData(options?: { refetchInterval?: number }) {
  const { exercice } = useExercice();
  const { userId, userDirectionId } = usePermissions();

  const { refetchInterval = 30000 } = options || {}; // 30 secondes par défaut

  return useQuery<DashboardData>({
    queryKey: ['dashboard-data', exercice, userId],
    queryFn: async (): Promise<DashboardData> => {
      if (!exercice) {
        throw new Error('Exercice non sélectionné');
      }

      // Essayer d'utiliser la fonction RPC si elle existe
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_dashboard_data', {
        p_exercice: exercice,
        p_direction_id: userDirectionId,
      });

      if (!rpcError && rpcData) {
        return transformRPCData(rpcData);
      }

      // Fallback: requêtes multiples
      const [notesStats, dossiersStats, budgetStats, evolutionData, directionStats] =
        await Promise.all([
          fetchNotesStats(exercice),
          fetchDossiersStats(exercice),
          fetchBudgetStats(exercice),
          fetchEvolutionMensuelle(exercice),
          fetchDirectionStats(exercice),
        ]);

      return {
        kpis: {
          notesSEF: notesStats.notesSEF,
          notesAEF: notesStats.notesAEF,
          dossiers: dossiersStats,
          budget: budgetStats,
          delais: {
            moyenValidation: notesStats.delaiMoyenValidation,
            moyenTraitement: dossiersStats.delaiMoyenTraitement,
          },
          activiteRecente: {
            notesCreees: notesStats.notesCreees7j,
            notesValidees: notesStats.notesValidees7j,
            dossiersTraites: dossiersStats.dossiersTraites7j,
          },
        },
        charts: {
          repartitionStatut: buildRepartitionStatut(notesStats.notesSEF),
          evolutionMensuelle: evolutionData,
          repartitionDirection: directionStats,
          repartitionTypeDepense: budgetStats.repartitionType || [],
        },
        lastUpdated: new Date(),
      };
    },
    enabled: !!exercice,
    refetchInterval,
    staleTime: 10000, // 10 secondes
  });
}

// ============================================================================
// FONCTIONS DE FETCH
// ============================================================================

async function fetchNotesStats(exercice: number) {
  const { data: notesSEF } = await supabase
    .from('notes_sef')
    .select('id, statut, created_at, validated_at')
    .eq('exercice', exercice);

  const notes = notesSEF || [];

  // Compter par statut
  const statuts = {
    brouillon: 0,
    soumis: 0,
    a_valider: 0,
    valide: 0,
    differe: 0,
    rejete: 0,
  };

  notes.forEach((n) => {
    const s = n.statut?.toLowerCase() || 'brouillon';
    if (s in statuts) {
      statuts[s as keyof typeof statuts]++;
    }
  });

  // Délai moyen de validation (notes validées)
  const notesValidees = notes.filter((n) => n.validated_at && n.created_at);
  let delaiMoyenValidation = 0;
  if (notesValidees.length > 0) {
    const totalDelai = notesValidees.reduce((sum, n) => {
      const created = new Date(n.created_at).getTime();
      const validated = n.validated_at ? new Date(n.validated_at).getTime() : created;
      return sum + (validated - created) / (1000 * 60 * 60 * 24);
    }, 0);
    delaiMoyenValidation = Math.round(totalDelai / notesValidees.length);
  }

  // Activité 7 derniers jours
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const notesCreees7j = notes.filter((n) => new Date(n.created_at) >= sevenDaysAgo).length;
  const notesValidees7j = notes.filter(
    (n) => n.validated_at && new Date(n.validated_at) >= sevenDaysAgo
  ).length;

  return {
    notesSEF: {
      total: notes.length,
      ...statuts,
      aValider: statuts.a_valider,
    },
    notesAEF: await fetchNotesAEFStats(exercice),
    delaiMoyenValidation,
    notesCreees7j,
    notesValidees7j,
  };
}

async function fetchNotesAEFStats(exercice: number) {
  const { data: notesAEF } = await supabase
    .from('notes_dg')
    .select('id, statut')
    .eq('exercice', exercice);

  const notes = notesAEF || [];
  const enCours = notes.filter(
    (n) => n.statut && !['valide', 'impute', 'rejete'].includes(n.statut)
  ).length;
  const valide = notes.filter((n) => n.statut === 'valide' || n.statut === 'impute').length;

  return { total: notes.length, enCours, valide };
}

async function fetchDossiersStats(exercice: number) {
  const { data: dossiers } = await supabase
    .from('dossiers')
    .select('id, statut_global, created_at, updated_at')
    .eq('exercice', exercice);

  const items = dossiers || [];

  const stats = {
    total: items.length,
    enCours: items.filter((d) => d.statut_global === 'en_cours').length,
    valide: items.filter((d) => d.statut_global === 'valide').length,
    solde: items.filter((d) => d.statut_global === 'solde').length,
    bloque: items.filter((d) => d.statut_global === 'differe' || d.statut_global === 'rejete')
      .length,
    delaiMoyenTraitement: 0,
    dossiersTraites7j: 0,
  };

  // Délai moyen de traitement
  const dossiersSoldes = items.filter((d) => d.statut_global === 'solde');
  if (dossiersSoldes.length > 0) {
    const totalDelai = dossiersSoldes.reduce((sum, d) => {
      const created = new Date(d.created_at).getTime();
      const updated = new Date(d.updated_at).getTime();
      return sum + (updated - created) / (1000 * 60 * 60 * 24);
    }, 0);
    stats.delaiMoyenTraitement = Math.round(totalDelai / dossiersSoldes.length);
  }

  // Activité 7 derniers jours
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  stats.dossiersTraites7j = items.filter((d) => new Date(d.updated_at) >= sevenDaysAgo).length;

  return stats;
}

async function fetchBudgetStats(exercice: number) {
  // Utilise la table budget_lines (lignes budgétaires)
  const { data: lignes } = await supabase
    .from('budget_lines')
    .select('dotation_initiale, total_engage, total_liquide, total_ordonnance, total_paye')
    .eq('exercice', exercice);

  const items = lignes || [];

  const totals = items.reduce(
    (acc, l) => ({
      total: acc.total + (l.dotation_initiale || 0),
      engage: acc.engage + (l.total_engage || 0),
      liquide: acc.liquide + (l.total_liquide || 0),
      ordonnance: acc.ordonnance + (l.total_ordonnance || 0),
      paye: acc.paye + (l.total_paye || 0),
    }),
    { total: 0, engage: 0, liquide: 0, ordonnance: 0, paye: 0 }
  );

  const tauxExecution = totals.total > 0 ? Math.round((totals.paye / totals.total) * 100) : 0;

  return {
    ...totals,
    tauxExecution,
    repartitionType: [],
  };
}

async function fetchEvolutionMensuelle(exercice: number) {
  const mois = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

  const { data: notes } = await supabase
    .from('notes_sef')
    .select('id, created_at, montant_estime')
    .eq('exercice', exercice);

  const { data: dossiers } = await supabase
    .from('dossiers')
    .select('id, created_at')
    .eq('exercice', exercice);

  const evolution = mois.map((m, index) => {
    const notesCount = (notes || []).filter((n) => {
      const d = new Date(n.created_at);
      return d.getMonth() === index;
    }).length;

    const dossiersCount = (dossiers || []).filter((d) => {
      const dt = new Date(d.created_at);
      return dt.getMonth() === index;
    }).length;

    const montant = (notes || [])
      .filter((n) => new Date(n.created_at).getMonth() === index)
      .reduce((sum, n) => sum + (n.montant_estime || 0), 0);

    return { mois: m, notes: notesCount, dossiers: dossiersCount, montant };
  });

  return evolution;
}

async function fetchDirectionStats(exercice: number) {
  const { data: notes } = await supabase
    .from('notes_sef')
    .select(
      `
      id,
      montant_estime,
      direction:directions(id, sigle, label)
    `
    )
    .eq('exercice', exercice);

  const directionMap = new Map<string, { notes: number; montant: number }>();

  (notes || []).forEach((n) => {
    const dir = (n.direction as { sigle?: string; label?: string })?.sigle || 'Non assigné';
    const existing = directionMap.get(dir) || { notes: 0, montant: 0 };
    directionMap.set(dir, {
      notes: existing.notes + 1,
      montant: existing.montant + (n.montant_estime || 0),
    });
  });

  return Array.from(directionMap.entries())
    .map(([direction, stats]) => ({
      direction,
      notes: stats.notes,
      montant: stats.montant,
    }))
    .sort((a, b) => b.notes - a.notes)
    .slice(0, 10);
}

// ============================================================================
// UTILITAIRES
// ============================================================================

function transformRPCData(rpcData: unknown): DashboardData {
  // Transformer les données RPC en format DashboardData
  const data = rpcData as Record<string, unknown>;

  return {
    kpis: data.kpis as DashboardKPIs,
    charts: data.charts as ChartData,
    lastUpdated: new Date(),
  };
}

function buildRepartitionStatut(notesSEF: DashboardKPIs['notesSEF']) {
  return [
    { name: 'Brouillon', value: notesSEF.brouillon, color: STATUS_COLORS.brouillon },
    { name: 'Soumis', value: notesSEF.soumis, color: STATUS_COLORS.soumis },
    { name: 'À valider', value: notesSEF.aValider, color: STATUS_COLORS.a_valider },
    { name: 'Validé', value: notesSEF.valide, color: STATUS_COLORS.valide },
    { name: 'Différé', value: notesSEF.differe, color: STATUS_COLORS.differe },
    { name: 'Rejeté', value: notesSEF.rejete, color: STATUS_COLORS.rejete },
  ].filter((item) => item.value > 0);
}

// ============================================================================
// EXPORTS ADDITIONNELS
// ============================================================================

export { STATUS_COLORS };
