/**
 * Hook dédié aux compteurs/badges de la sidebar
 * Requêtes optimisées pour les comptes temps réel
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useExercice } from '@/contexts/ExerciceContext';

export interface SidebarBadges {
  // Notes SEF
  sefAValider: number;
  sefDifferes: number;

  // Notes AEF
  aefAValider: number;
  aefAImputer: number;
  aefDifferes: number;

  // Imputations
  imputationsATraiter: number;

  // Expressions de besoin
  ebAValider: number;

  // Marchés
  marchesEnCours: number;

  // Engagements
  engagementsAValider: number;
  engagementsDifferes: number;

  // Liquidations
  liquidationsAValider: number;
  liquidationsDifferes: number;
  liquidationsUrgentes: number;

  // Ordonnancements
  ordoAValider: number;
  ordoEnSignature: number;

  // Règlements
  reglementsATraiter: number;

  // Virements
  virementsEnAttente: number;

  // Total global (pour indicateur header)
  totalATraiter: number;

  // Timestamp dernière mise à jour
  lastUpdated: Date;
}

export function useSidebarBadges() {
  const { exercice } = useExercice();

  return useQuery({
    queryKey: ['sidebar-badges', exercice],
    queryFn: async (): Promise<SidebarBadges> => {
      // Requêtes parallèles optimisées (COUNT uniquement)
      const [
        notesSEFRes,
        notesAEFRes,
        imputationsRes,
        ebRes,
        marchesRes,
        engagementsRes,
        liquidationsAValiderRes,
        liquidationsDifferesRes,
        liquidationsUrgentesRes,
        ordoRes,
        reglementsRes,
        virementsRes,
      ] = await Promise.all([
        // Notes SEF
        supabase
          .from('notes_sef')
          .select('id, statut', { count: 'exact', head: false })
          .eq('exercice', exercice)
          .in('statut', ['soumis', 'a_valider_dg', 'differe']),

        // Notes AEF
        supabase
          .from('notes_dg')
          .select('id, statut', { count: 'exact', head: false })
          .eq('exercice', exercice)
          .in('statut', ['soumis', 'a_valider', 'a_imputer', 'differe']),

        // Imputations (notes AEF validées mais non imputées)
        supabase
          .from('notes_dg')
          .select('id', { count: 'exact', head: true })
          .eq('exercice', exercice)
          .eq('statut', 'a_imputer'),

        // Expressions de besoin (soumis + verifie = à traiter)
        supabase
          .from('expressions_besoin')
          .select('id', { count: 'exact', head: true })
          .eq('exercice', exercice)
          .in('statut', ['soumis', 'verifie']),

        // Passations de marché en attente d'action (brouillon + attribué non approuvé)
        supabase
          .from('passation_marche')
          .select('id', { count: 'exact', head: true })
          .eq('exercice', exercice)
          .in('statut', ['brouillon', 'attribue']),

        // Engagements (inclut tous les statuts de validation : soumis → visa_saf → visa_cb → visa_daaf)
        supabase
          .from('budget_engagements')
          .select('id, statut', { count: 'exact', head: false })
          .eq('exercice', exercice)
          .in('statut', ['soumis', 'visa_saf', 'visa_cb', 'visa_daaf', 'differe']),

        // Liquidations à valider (head: true — count only)
        supabase
          .from('budget_liquidations')
          .select('id', { count: 'exact', head: true })
          .eq('exercice', exercice)
          .in('statut', ['soumis', 'validé_daaf', 'en_attente']),

        // Liquidations différées (head: true — count only)
        supabase
          .from('budget_liquidations')
          .select('id', { count: 'exact', head: true })
          .eq('exercice', exercice)
          .eq('statut', 'differe'),

        // Liquidations urgentes (non réglées)
        supabase
          .from('budget_liquidations')
          .select('id', { count: 'exact', head: true })
          .eq('exercice', exercice)
          .eq('reglement_urgent', true)
          .in('statut', ['soumis', 'validé_daaf', 'validé_dg']),

        // Ordonnancements
        supabase
          .from('ordonnancements')
          .select('id, statut', { count: 'exact', head: false })
          .eq('exercice', exercice)
          .in('statut', ['soumis', 'en_attente', 'en_signature']),

        // Règlements
        supabase
          .from('reglements')
          .select('id', { count: 'exact', head: true })
          .eq('exercice', exercice)
          .eq('statut', 'en_attente'),

        // Virements en attente
        supabase
          .from('credit_transfers')
          .select('id', { count: 'exact', head: true })
          .eq('exercice', exercice)
          .eq('status', 'pending'),
      ]);

      // Calcul des compteurs
      const sefData = notesSEFRes.data || [];
      const sefAValider = sefData.filter(
        (n) => n.statut === 'soumis' || n.statut === 'a_valider_dg'
      ).length;
      const sefDifferes = sefData.filter((n) => n.statut === 'differe').length;

      const aefData = notesAEFRes.data || [];
      const aefAValider = aefData.filter(
        (n) => n.statut === 'soumis' || n.statut === 'a_valider'
      ).length;
      const aefAImputer = aefData.filter((n) => n.statut === 'a_imputer').length;
      const aefDifferes = aefData.filter((n) => n.statut === 'differe').length;

      const imputationsATraiter = imputationsRes.count || 0;
      const ebAValider = ebRes.count || 0;
      const marchesEnCours = marchesRes.count || 0;

      const engData = engagementsRes.data || [];
      const engagementsAValider = engData.filter(
        (e) =>
          e.statut === 'soumis' ||
          e.statut === 'visa_saf' ||
          e.statut === 'visa_cb' ||
          e.statut === 'visa_daaf'
      ).length;
      const engagementsDifferes = engData.filter((e) => e.statut === 'differe').length;

      const liquidationsAValider = liquidationsAValiderRes.count || 0;
      const liquidationsDifferes = liquidationsDifferesRes.count || 0;
      const liquidationsUrgentes = liquidationsUrgentesRes.count || 0;

      const ordoData = ordoRes.data || [];
      const ordoAValider = ordoData.filter(
        (o) => o.statut === 'soumis' || o.statut === 'en_attente'
      ).length;
      const ordoEnSignature = ordoData.filter((o) => o.statut === 'en_signature').length;

      const reglementsATraiter = reglementsRes.count || 0;
      const virementsEnAttente = virementsRes.count || 0;

      // Total global pour l'indicateur header
      const totalATraiter =
        sefAValider +
        aefAValider +
        aefAImputer +
        ebAValider +
        engagementsAValider +
        liquidationsAValider +
        ordoAValider +
        ordoEnSignature +
        reglementsATraiter +
        virementsEnAttente;

      return {
        sefAValider,
        sefDifferes,
        aefAValider,
        aefAImputer,
        aefDifferes,
        imputationsATraiter,
        ebAValider,
        marchesEnCours,
        engagementsAValider,
        engagementsDifferes,
        liquidationsAValider,
        liquidationsDifferes,
        liquidationsUrgentes,
        ordoAValider,
        ordoEnSignature,
        reglementsATraiter,
        virementsEnAttente,
        totalATraiter,
        lastUpdated: new Date(),
      };
    },
    enabled: !!exercice,
    // Rafraîchissement régulier pour les badges temps réel
    refetchInterval: 30000, // 30 secondes
    staleTime: 15000, // 15 secondes
  });
}
