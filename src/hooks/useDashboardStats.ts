/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useExercice } from '@/contexts/ExerciceContext';

export interface DashboardStats {
  // Notes SEF
  notesSEFTotal: number;
  notesSEFEnAttente: number;
  notesSEFAValider: number;
  notesSEFValidees: number;
  // Notes AEF
  notesAEFTotal: number;
  notesAEFEnAttente: number;
  notesAEFAValider: number;
  notesAEFImputees: number;
  // Expressions de Besoin
  ebTotal: number;
  ebAValider: number;
  ebValidees: number;
  // Legacy (pour compatibilité)
  notesEnAttente: number;
  notesTotal: number;
  notesAValider: number;
  // Engagements
  engagementsEnCours: number;
  engagementsTotal: number;
  engagementsAValider: number;
  // Liquidations
  liquidationsATraiter: number;
  liquidationsTotal: number;
  liquidationsAValider: number;
  // Ordonnancements
  ordonnancements: number;
  ordonnancementsEnSignature: number;
  ordonnancementsAValider: number;
  // Marchés
  marchesEnCours: number;
  marchesTotal: number;
  // Budget
  budgetTotal: number;
  budgetEngage: number;
  budgetLiquide: number;
  budgetPaye: number;
  budgetOrdonnance: number;
  budgetDisponible: number;
  tauxEngagement: number;
  tauxLiquidation: number;
  tauxPaiement: number;
  isBudgetLoaded: boolean;
  // Alertes d'incohérence
  hasInconsistency: boolean;
  inconsistencyType: 'none' | 'budget_not_loaded' | 'overspent' | 'data_mismatch';
  inconsistencyMessage: string;
  // Top lignes en dépassement
  topLignesDepassement: Array<{
    id: string;
    code: string;
    label: string;
    dotation: number;
    engage: number;
    depassement: number;
  }>;
}

export function useDashboardStats() {
  const { exercice } = useExercice();

  return useQuery({
    queryKey: ['dashboard-stats', exercice],
    queryFn: async (): Promise<DashboardStats> => {
      // Fetch Notes SEF stats
      const { data: notesSEF, error: notesSEFError } = await supabase
        .from('notes_sef')
        .select('id, statut')
        .eq('exercice', exercice);

      if (notesSEFError) throw notesSEFError;

      const notesSEFTotal = notesSEF?.length || 0;
      const notesSEFEnAttente =
        notesSEF?.filter((n) => n.statut === 'soumis' || n.statut === 'en_attente').length || 0;
      const notesSEFAValider =
        notesSEF?.filter(
          (n) => n.statut === 'soumis' || n.statut === 'en_attente' || n.statut === 'a_valider_dg'
        ).length || 0;
      const notesSEFValidees =
        notesSEF?.filter((n) => n.statut === 'valide' || n.statut === 'valide_auto').length || 0;

      // Fetch Notes AEF stats
      const { data: notesAEF, error: notesAEFError } = await supabase
        .from('notes_dg')
        .select('id, statut')
        .eq('exercice', exercice);

      if (notesAEFError) throw notesAEFError;

      const notesAEFTotal = notesAEF?.length || 0;
      const notesAEFEnAttente =
        notesAEF?.filter((n) => n.statut === 'soumis' || n.statut === 'en_attente').length || 0;
      const notesAEFAValider =
        notesAEF?.filter((n) => n.statut === 'soumis' || n.statut === 'a_valider').length || 0;
      const notesAEFImputees = notesAEF?.filter((n) => n.statut === 'impute').length || 0;

      // Legacy totaux combinés
      const notesTotal = notesSEFTotal + notesAEFTotal;
      const notesEnAttente = notesSEFEnAttente + notesAEFEnAttente;
      const notesAValider = notesSEFAValider + notesAEFAValider;

      // Fetch expressions de besoin stats
      const { data: expressionsBesoin, error: ebError } = await supabase
        .from('expressions_besoin')
        .select('id, statut')
        .eq('exercice', exercice);

      if (ebError) throw ebError;

      const ebTotal = expressionsBesoin?.length || 0;
      const ebAValider = expressionsBesoin?.filter((e) => e.statut === 'soumis').length || 0;
      const ebValidees = expressionsBesoin?.filter((e) => e.statut === 'validé').length || 0;

      // Fetch engagements stats
      const { data: engagements, error: engagementsError } = await supabase
        .from('budget_engagements')
        .select('id, statut, montant')
        .eq('exercice', exercice);

      if (engagementsError) throw engagementsError;

      const engagementsEnCours =
        engagements?.filter((e) => e.statut === 'en_attente' || e.statut === 'en_cours').length ||
        0;
      const engagementsAValider =
        engagements?.filter((e) => e.statut === 'soumis' || e.statut === 'en_attente').length || 0;
      const engagementsTotal = engagements?.length || 0;
      // CORRECTION: Ne compter que les engagements VALIDES
      const budgetEngage =
        engagements
          ?.filter((e) => e.statut === 'valide')
          .reduce((sum, e) => sum + (e.montant || 0), 0) || 0;

      // Fetch liquidations stats
      const { data: liquidations, error: liquidationsError } = await supabase
        .from('budget_liquidations')
        .select('id, statut, montant')
        .eq('exercice', exercice);

      if (liquidationsError) throw liquidationsError;

      const liquidationsATraiter =
        liquidations?.filter((l) => l.statut === 'en_attente').length || 0;
      const liquidationsAValider =
        liquidations?.filter((l) => l.statut === 'soumis' || l.statut === 'en_attente').length || 0;
      const liquidationsTotal = liquidations?.length || 0;
      const budgetLiquide =
        liquidations
          ?.filter((l) => l.statut === 'valide')
          .reduce((sum, l) => sum + (l.montant || 0), 0) || 0;

      // Fetch ordonnancements stats
      const { data: ordonnancements, error: ordoError } = await supabase
        .from('ordonnancements')
        .select('id, statut, montant')
        .eq('exercice', exercice);

      if (ordoError) throw ordoError;

      const ordonnancementsTotal = ordonnancements?.length || 0;
      const ordonnancementsEnSignature =
        ordonnancements?.filter((o) => o.statut === 'en_signature' || o.statut === 'en_attente')
          .length || 0;
      const ordonnancementsAValider =
        ordonnancements?.filter(
          (o) => o.statut === 'soumis' || o.statut === 'en_attente' || o.statut === 'en_signature'
        ).length || 0;

      // CORRECTION: Fetch reglements pour le montant payé (pas ordonnancements)
      const { data: reglements, error: reglementsError } = await supabase
        .from('reglements')
        .select('id, statut, montant')
        .eq('exercice', exercice);

      if (reglementsError) throw reglementsError;

      // Budget payé = règlements au statut "paye"
      const budgetPaye =
        reglements
          ?.filter((r) => r.statut === 'paye')
          .reduce((sum, r) => sum + (r.montant || 0), 0) || 0;

      // Fetch marches stats
      const { data: marches, error: marchesError } = await supabase
        .from('marches')
        .select('id, statut');

      if (marchesError) throw marchesError;

      const marchesEnCours =
        marches?.filter((m) => m.statut !== 'termine' && m.statut !== 'annule').length || 0;
      const marchesTotal = marches?.length || 0;

      // Fetch budget lines for total budget with engagement details
      const { data: budgetLines, error: budgetError } = await supabase
        .from('budget_lines')
        .select('id, code, label, dotation_initiale, total_engage')
        .eq('exercice', exercice);

      if (budgetError) throw budgetError;

      const budgetTotal =
        budgetLines?.reduce((sum, bl) => sum + (bl.dotation_initiale || 0), 0) || 0;

      // Fetch ordonnancement totals
      const budgetOrdonnance =
        ordonnancements
          ?.filter((o) => o.statut === 'valide' || o.statut === 'signe')
          .reduce((sum, o) => sum + ((o as any).montant || 0), 0) || 0;

      // CORRECTION: Disponibilité = Budget - Engagé validé (peut être négatif pour détecter dépassement)
      const budgetDisponibleRaw = budgetTotal - budgetEngage;
      const budgetDisponible = Math.max(0, budgetDisponibleRaw);

      // CORRECTION: Taux d'engagement sécurisé
      const tauxEngagement = budgetTotal > 0 ? Math.round((budgetEngage / budgetTotal) * 100) : 0;
      const tauxLiquidation =
        budgetEngage > 0 ? Math.round((budgetLiquide / budgetEngage) * 100) : 0;
      const tauxPaiement = budgetLiquide > 0 ? Math.round((budgetPaye / budgetLiquide) * 100) : 0;

      // Indicateur si le budget est chargé
      const isBudgetLoaded = budgetTotal > 0;

      // Détection des incohérences
      let hasInconsistency = false;
      let inconsistencyType: 'none' | 'budget_not_loaded' | 'overspent' | 'data_mismatch' = 'none';
      let inconsistencyMessage = '';

      if (!isBudgetLoaded && (budgetEngage > 0 || budgetLiquide > 0 || budgetPaye > 0)) {
        hasInconsistency = true;
        inconsistencyType = 'budget_not_loaded';
        inconsistencyMessage = `Dotation non chargée mais ${engagementsTotal} engagement(s) enregistré(s) pour un total de ${new Intl.NumberFormat('fr-FR').format(budgetEngage)} FCFA. Veuillez importer les lignes budgétaires.`;
      } else if (budgetDisponibleRaw < 0) {
        hasInconsistency = true;
        inconsistencyType = 'overspent';
        inconsistencyMessage = `Dépassement budgétaire de ${new Intl.NumberFormat('fr-FR').format(Math.abs(budgetDisponibleRaw))} FCFA. Vérifiez les engagements sur les lignes en dépassement.`;
      } else if (budgetLiquide > budgetEngage) {
        hasInconsistency = true;
        inconsistencyType = 'data_mismatch';
        inconsistencyMessage = `Incohérence : montant liquidé (${new Intl.NumberFormat('fr-FR').format(budgetLiquide)} FCFA) supérieur au montant engagé (${new Intl.NumberFormat('fr-FR').format(budgetEngage)} FCFA).`;
      }

      // Calculer les top lignes en dépassement
      const topLignesDepassement = (budgetLines || [])
        .map((bl) => ({
          id: bl.id,
          code: bl.code,
          label: bl.label,
          dotation: bl.dotation_initiale || 0,
          engage: bl.total_engage || 0,
          depassement: (bl.total_engage || 0) - (bl.dotation_initiale || 0),
        }))
        .filter((bl) => bl.depassement > 0)
        .sort((a, b) => b.depassement - a.depassement)
        .slice(0, 5);

      return {
        // Notes SEF
        notesSEFTotal,
        notesSEFEnAttente,
        notesSEFAValider,
        notesSEFValidees,
        // Notes AEF
        notesAEFTotal,
        notesAEFEnAttente,
        notesAEFAValider,
        notesAEFImputees,
        // Expressions de besoin
        ebTotal,
        ebAValider,
        ebValidees,
        // Legacy
        notesEnAttente,
        notesTotal,
        notesAValider,
        // Autres
        engagementsEnCours,
        engagementsTotal,
        engagementsAValider,
        liquidationsATraiter,
        liquidationsTotal,
        liquidationsAValider,
        ordonnancements: ordonnancementsTotal,
        ordonnancementsEnSignature,
        ordonnancementsAValider,
        marchesEnCours,
        marchesTotal,
        budgetTotal,
        budgetEngage,
        budgetLiquide,
        budgetPaye,
        budgetOrdonnance,
        budgetDisponible,
        tauxEngagement,
        tauxLiquidation,
        tauxPaiement,
        isBudgetLoaded,
        hasInconsistency,
        inconsistencyType,
        inconsistencyMessage,
        topLignesDepassement,
      };
    },
    enabled: !!exercice,
  });
}

// ============================================
// NOUVEAUX HOOKS POUR DASHBOARD AVANCÉ
// ============================================

export interface RoadmapStats {
  total_activites: number;
  activites_realisees: number;
  activites_en_cours: number;
  activites_bloquees: number;
  activites_non_demarrees: number;
  taux_realisation: number;
  taux_avancement_moyen: number;
}

export interface BudgetChainStats {
  montant_prevu: number;
  montant_engage: number;
  montant_liquide: number;
  montant_ordonnance: number;
  montant_regle: number;
  taux_engagement: number;
  taux_liquidation: number;
  taux_ordonnancement: number;
  taux_reglement: number;
  nb_engagements: number;
  nb_liquidations: number;
  nb_ordonnancements: number;
  nb_reglements: number;
}

export interface AlertStats {
  dossiers_bloques: number;
  taches_en_retard: number;
  engagements_en_attente: number;
  liquidations_en_attente: number;
  ordonnancements_en_attente: number;
}

export interface DirectionStats {
  direction_id: string;
  direction_code: string;
  direction_label: string;
  roadmap: RoadmapStats;
  budget: BudgetChainStats;
}

export interface OSStats {
  os_id: string;
  os_code: string;
  os_libelle: string;
  total_activites: number;
  activites_realisees: number;
  taux_realisation: number;
  montant_prevu: number;
  montant_engage: number;
}

export interface MissionStats {
  mission_id: string;
  mission_code: string;
  mission_libelle: string;
  direction_id: string;
  total_activites: number;
  activites_realisees: number;
  taux_realisation: number;
}

/**
 * Hook pour les stats globales (vue DG)
 */
export function useDashboardGlobalStats() {
  const { exerciceId } = useExercice();

  // Stats feuille de route globales
  const roadmapQuery = useQuery({
    queryKey: ['dashboard-roadmap-global', exerciceId],
    queryFn: async (): Promise<RoadmapStats> => {
      // Utiliser la table taches au lieu de task_executions
      const { data: taches, error } = await (supabase.from as any)('taches')
        .select('statut, taux_avancement')
        .eq('exercice', exerciceId as any);

      if (error) throw error;

      const total = taches?.length || 0;
      const realisees = taches?.filter((e) => e.statut === 'termine').length || 0;
      const enCours = taches?.filter((e) => e.statut === 'en_cours').length || 0;
      const bloquees = taches?.filter((e) => e.statut === 'bloque').length || 0;
      const nonDemarrees =
        taches?.filter((e) => e.statut === 'non_demarre' || e.statut === 'planifie').length || 0;

      const tauxMoyen =
        total > 0
          ? Math.round(taches.reduce((sum, e) => sum + (e.taux_avancement || 0), 0) / total)
          : 0;

      return {
        total_activites: total,
        activites_realisees: realisees,
        activites_en_cours: enCours,
        activites_bloquees: bloquees,
        activites_non_demarrees: nonDemarrees,
        taux_realisation: total > 0 ? Math.round((realisees / total) * 100) : 0,
        taux_avancement_moyen: tauxMoyen,
      };
    },
    enabled: !!exerciceId,
  });

  // Alertes
  const alertsQuery = useQuery({
    queryKey: ['dashboard-alerts-global', exerciceId],
    queryFn: async (): Promise<AlertStats> => {
      // Utiliser la table taches qui existe pour les tâches bloquées
      const { count: bloquees } = await (supabase.from as any)('taches')
        .select('*', { count: 'exact', head: true })
        .eq('exercice', exerciceId as any)
        .eq('statut', 'bloque');

      const today = new Date().toISOString().split('T')[0];
      const { count: enRetard } = await (supabase.from as any)('taches')
        .select('*', { count: 'exact', head: true })
        .eq('exercice', exerciceId as any)
        .lt('date_fin_prevue', today)
        .not('statut', 'in', '("termine","annule")');

      const { count: engAttente } = await supabase
        .from('budget_engagements')
        .select('*', { count: 'exact', head: true })
        .eq('exercice', exerciceId as any)
        .eq('statut', 'soumis');

      const { count: liqAttente } = await supabase
        .from('budget_liquidations')
        .select('*', { count: 'exact', head: true })
        .eq('exercice', exerciceId as any)
        .eq('statut', 'soumise');

      const { count: ordAttente } = await supabase
        .from('ordonnancements')
        .select('*', { count: 'exact', head: true })
        .eq('exercice', exerciceId as any)
        .eq('statut', 'en_attente');

      return {
        dossiers_bloques: bloquees || 0,
        taches_en_retard: enRetard || 0,
        engagements_en_attente: engAttente || 0,
        liquidations_en_attente: liqAttente || 0,
        ordonnancements_en_attente: ordAttente || 0,
      };
    },
    enabled: !!exerciceId,
  });

  // Stats par direction
  const directionsQuery = useQuery({
    queryKey: ['dashboard-directions-stats', exerciceId],
    queryFn: async (): Promise<DirectionStats[]> => {
      const { data: directions } = await supabase
        .from('directions')
        .select('id, code, label')
        .order('code');

      if (!directions) return [];

      const stats: DirectionStats[] = [];

      for (const dir of directions) {
        // Utiliser la table taches au lieu de v_task_executions
        const { data: taches } = await (supabase.from as any)('taches')
          .select('id, statut, taux_avancement, montant_prevu')
          .eq('exercice', exerciceId as any)
          .eq('direction_id', dir.id);

        const total = taches?.length || 0;
        if (total === 0) continue;

        const realisees = taches?.filter((e) => e.statut === 'termine').length || 0;
        const enCours = taches?.filter((e) => e.statut === 'en_cours').length || 0;
        const bloquees = taches?.filter((e) => e.statut === 'bloque').length || 0;
        const montantPrevu = taches?.reduce((sum, e) => sum + (e.montant_prevu || 0), 0) || 0;

        stats.push({
          direction_id: dir.id,
          direction_code: dir.code,
          direction_label: dir.label,
          roadmap: {
            total_activites: total,
            activites_realisees: realisees,
            activites_en_cours: enCours,
            activites_bloquees: bloquees,
            activites_non_demarrees: total - realisees - enCours - bloquees,
            taux_realisation: Math.round((realisees / total) * 100),
            taux_avancement_moyen:
              total > 0
                ? Math.round(taches.reduce((sum, e) => sum + (e.taux_avancement || 0), 0) / total)
                : 0,
          },
          budget: {
            montant_prevu: montantPrevu,
            montant_engage: 0,
            montant_liquide: 0,
            montant_ordonnance: 0,
            montant_regle: 0,
            taux_engagement: 0,
            taux_liquidation: 0,
            taux_ordonnancement: 0,
            taux_reglement: 0,
            nb_engagements: 0,
            nb_liquidations: 0,
            nb_ordonnancements: 0,
            nb_reglements: 0,
          },
        });
      }

      return stats.sort((a, b) => b.roadmap.total_activites - a.roadmap.total_activites);
    },
    enabled: !!exerciceId,
  });

  // Stats par OS
  const osQuery = useQuery({
    queryKey: ['dashboard-os-stats', exerciceId],
    queryFn: async (): Promise<OSStats[]> => {
      const { data: osData } = await supabase
        .from('objectifs_strategiques')
        .select('id, code, libelle')
        .order('code');

      if (!osData) return [];

      const stats: OSStats[] = [];

      for (const os of osData) {
        // Utiliser la table taches au lieu de v_task_executions
        const { data: taches } = await (supabase.from as any)('taches')
          .select('id, statut, montant_prevu')
          .eq('exercice', exerciceId as any)
          .eq('os_id', os.id);

        const total = taches?.length || 0;
        if (total === 0) continue;

        const realisees = taches?.filter((e) => e.statut === 'termine').length || 0;
        const montantPrevu = taches?.reduce((sum, e) => sum + (e.montant_prevu || 0), 0) || 0;

        stats.push({
          os_id: os.id,
          os_code: os.code,
          os_libelle: os.libelle,
          total_activites: total,
          activites_realisees: realisees,
          taux_realisation: Math.round((realisees / total) * 100),
          montant_prevu: montantPrevu,
          montant_engage: 0,
        });
      }

      return stats;
    },
    enabled: !!exerciceId,
  });

  return {
    roadmap: roadmapQuery.data,
    alerts: alertsQuery.data,
    directions: directionsQuery.data || [],
    objectifsStrategiques: osQuery.data || [],
    isLoading: roadmapQuery.isLoading || alertsQuery.isLoading,
    isError: roadmapQuery.isError,
    refetch: () => {
      roadmapQuery.refetch();
      alertsQuery.refetch();
      directionsQuery.refetch();
      osQuery.refetch();
    },
  };
}

/**
 * Hook pour les stats d'une direction (vue Directeur)
 */
export function useDashboardDirectionStats(directionId: string | null) {
  const { exerciceId } = useExercice();

  const roadmapQuery = useQuery({
    queryKey: ['dashboard-roadmap-direction', exerciceId, directionId],
    queryFn: async (): Promise<RoadmapStats> => {
      // Utiliser la table taches au lieu de v_task_executions
      const { data: taches, error } = await (supabase.from as any)('taches')
        .select('statut, taux_avancement')
        .eq('exercice', exerciceId as any)
        .eq('direction_id', directionId!);

      if (error) throw error;

      const total = taches?.length || 0;
      const realisees = taches?.filter((e) => e.statut === 'termine').length || 0;
      const enCours = taches?.filter((e) => e.statut === 'en_cours').length || 0;
      const bloquees = taches?.filter((e) => e.statut === 'bloque').length || 0;
      const nonDemarrees =
        taches?.filter((e) => e.statut === 'non_demarre' || e.statut === 'planifie').length || 0;

      return {
        total_activites: total,
        activites_realisees: realisees,
        activites_en_cours: enCours,
        activites_bloquees: bloquees,
        activites_non_demarrees: nonDemarrees,
        taux_realisation: total > 0 ? Math.round((realisees / total) * 100) : 0,
        taux_avancement_moyen:
          total > 0
            ? Math.round(taches.reduce((sum, e) => sum + (e.taux_avancement || 0), 0) / total)
            : 0,
      };
    },
    enabled: !!exerciceId && !!directionId,
  });

  const missionsQuery = useQuery({
    queryKey: ['dashboard-missions-direction', exerciceId, directionId],
    queryFn: async (): Promise<MissionStats[]> => {
      const { data: missions } = await (supabase
        .from('missions') as any)
        .select('id, code, libelle')
        .eq('direction_id', directionId!)
        .order('code');

      if (!missions) return [];

      const stats: MissionStats[] = [];

      for (const mission of missions) {
        // Utiliser la table taches au lieu de v_task_executions
        const { data: taches } = await (supabase.from as any)('taches')
          .select('statut')
          .eq('exercice', exerciceId as any)
          .eq('mission_id', mission.id);

        const total = taches?.length || 0;
        if (total === 0) continue;

        const realisees = taches?.filter((e) => e.statut === 'termine').length || 0;

        stats.push({
          mission_id: mission.id,
          mission_code: mission.code,
          mission_libelle: mission.libelle,
          direction_id: directionId!,
          total_activites: total,
          activites_realisees: realisees,
          taux_realisation: Math.round((realisees / total) * 100),
        });
      }

      return stats;
    },
    enabled: !!exerciceId && !!directionId,
  });

  const alertsQuery = useQuery({
    queryKey: ['dashboard-alerts-direction', exerciceId, directionId],
    queryFn: async (): Promise<AlertStats> => {
      // Utiliser la table taches au lieu de v_task_executions
      const { count: bloquees } = await (supabase.from as any)('taches')
        .select('*', { count: 'exact', head: true })
        .eq('exercice', exerciceId as any)
        .eq('direction_id', directionId!)
        .eq('statut', 'bloque');

      const today = new Date().toISOString().split('T')[0];
      const { count: enRetard } = await (supabase.from as any)('taches')
        .select('*', { count: 'exact', head: true })
        .eq('exercice', exerciceId as any)
        .eq('direction_id', directionId!)
        .lt('date_fin_prevue', today)
        .not('statut', 'in', '("termine","annule")');

      return {
        dossiers_bloques: bloquees || 0,
        taches_en_retard: enRetard || 0,
        engagements_en_attente: 0,
        liquidations_en_attente: 0,
        ordonnancements_en_attente: 0,
      };
    },
    enabled: !!exerciceId && !!directionId,
  });

  return {
    roadmap: roadmapQuery.data,
    missions: missionsQuery.data || [],
    alerts: alertsQuery.data,
    isLoading: roadmapQuery.isLoading || missionsQuery.isLoading,
    isError: roadmapQuery.isError,
    refetch: () => {
      roadmapQuery.refetch();
      missionsQuery.refetch();
      alertsQuery.refetch();
    },
  };
}

/**
 * Hook pour récupérer la direction de l'utilisateur connecté
 */
export function useUserDirection() {
  return useQuery({
    queryKey: ['user-direction'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select(
          'direction_id, profil_fonctionnel, directions:directions!profiles_direction_id_fkey(id, code, label)'
        )
        .eq('id', user.id)
        .single();

      return profile;
    },
  });
}
