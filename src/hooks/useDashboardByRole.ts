/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useExercice } from '@/contexts/ExerciceContext';

// Stats pour le DG - Vue complète
export interface DGStats {
  budgetGlobal: number;
  budgetEngage: number;
  budgetLiquide: number;
  budgetOrdonnance: number;
  budgetPaye: number;
  tauxConsommation: number;
  topDirections: Array<{
    id: string;
    code: string;
    label: string;
    dotation: number;
    engage: number;
    tauxExecution: number;
  }>;
  dossiersEnCours: number;
  dossiersBloques: number;
  dossiersValides: number;
  dossiersSoldes: number;
  alertesDepassement: number;
  // Dossiers en attente de signature
  engagementsASigner: number;
  liquidationsASigner: number;
  ordonnancementsASigner: number;
  // Pipeline complet (9 étapes)
  pipeline: {
    notesSEF: number;
    notesSEFAValider: number;
    notesAEF: number;
    notesAEFAValider: number;
    expressionsBesoin: number;
    marches: number;
    engagements: number;
    liquidations: number;
    ordonnancements: number;
    reglements: number;
  };
  // Délais de traitement
  delais: {
    moyenEngagement: number | null;
    moyenLiquidation: number | null;
    moyenOrdonnancement: number | null;
  };
  // Actions en attente DG
  pendingDGActions: number;
  // Prestataires
  prestatairesActifs: number;
}

// Stats pour DAF/SDCT
export interface DAFStats {
  notesAImputer: number;
  notesTotales: number;
  engagementsAValider: number;
  engagementsEnValidation: number;
  engagementsValides: number;
  liquidationsAValider: number;
  depassementsBudgetaires: number;
  resteAEngager: number;
  resteALiquider: number;
  resteAPayer: number;
  montantEngageMois: number;
  montantLiquideMois: number;
}

// Stats pour SDPM
export interface SDPMStats {
  marchesEnCours: number;
  marchesBrouillon: number;
  marchesEnValidation: number;
  marchesValides: number;
  expressionsBesoinAValider: number;
  expressionsBesoinEnCours: number;
  delaiMoyenMarche: number;
  topFournisseurs: Array<{
    id: string;
    nom: string;
    montantTotal: number;
    nombreMarches: number;
  }>;
  marchesMontantTotal: number;
}

// Stats pour Trésorerie
export interface TresorerieStats {
  ordresPayerEnAttente: number;
  ordresPayerMontant: number;
  reglementsDuJour: number;
  reglementsMontantJour: number;
  reglementsSemaine: number;
  reglementsMontantSemaine: number;
  previsionSorties7j: number;
  previsionSorties30j: number;
  soldeDisponible: number;
  reglementsPartiels: number;
}

export function useDGDashboard() {
  const { exercice } = useExercice();

  return useQuery({
    queryKey: ['dashboard-dg', exercice],
    queryFn: async (): Promise<DGStats> => {
      // Budget global
      const { data: budgetLines } = await supabase
        .from('budget_lines')
        .select(
          `
          id, dotation_initiale, direction_id,
          directions(id, code, label)
        `
        )
        .eq('exercice', exercice);

      const budgetGlobal =
        budgetLines?.reduce((sum, bl) => sum + (bl.dotation_initiale || 0), 0) || 0;

      // Engagements
      const { data: engagements } = await supabase
        .from('budget_engagements')
        .select('id, montant, statut, budget_line_id')
        .eq('exercice', exercice);

      const budgetEngage =
        engagements
          ?.filter((e) => e.statut === 'valide')
          .reduce((sum, e) => sum + (e.montant || 0), 0) || 0;

      // Liquidations
      const { data: liquidations } = await supabase
        .from('budget_liquidations')
        .select('id, montant, statut')
        .eq('exercice', exercice);

      const budgetLiquide =
        liquidations
          ?.filter((l) => l.statut === 'valide')
          .reduce((sum, l) => sum + (l.montant || 0), 0) || 0;

      // Ordonnancements
      const { data: ordonnancements } = await supabase
        .from('ordonnancements')
        .select('id, montant, statut')
        .eq('exercice', exercice);

      const budgetOrdonnance =
        ordonnancements
          ?.filter((o) => o.statut === 'valide')
          .reduce((sum, o) => sum + (o.montant || 0), 0) || 0;

      // Règlements
      const { data: reglements } = await supabase
        .from('reglements')
        .select('id, montant, statut')
        .eq('exercice', exercice);

      const budgetPaye =
        reglements
          ?.filter((r) => r.statut === 'valide' || r.statut === 'confirme')
          .reduce((sum, r) => sum + (r.montant || 0), 0) || 0;

      // Top directions
      const directionStats = new Map<
        string,
        { code: string; label: string; dotation: number; engage: number }
      >();

      budgetLines?.forEach((bl) => {
        if (bl.direction_id && bl.directions) {
          const dir = bl.directions as any;
          const existing = directionStats.get(bl.direction_id) || {
            code: dir.code,
            label: dir.label,
            dotation: 0,
            engage: 0,
          };
          existing.dotation += bl.dotation_initiale || 0;
          directionStats.set(bl.direction_id, existing);
        }
      });

      engagements
        ?.filter((e) => e.statut === 'valide')
        .forEach((eng) => {
          const bl = budgetLines?.find((b) => b.id === eng.budget_line_id);
          if (bl?.direction_id) {
            const existing = directionStats.get(bl.direction_id);
            if (existing) {
              existing.engage += eng.montant || 0;
            }
          }
        });

      const topDirections = Array.from(directionStats.entries())
        .map(([id, stats]) => ({
          id,
          ...stats,
          tauxExecution: stats.dotation > 0 ? Math.round((stats.engage / stats.dotation) * 100) : 0,
        }))
        .sort((a, b) => b.dotation - a.dotation)
        .slice(0, 5);

      // Dossiers
      const { data: dossiers } = await supabase
        .from('dossiers')
        .select('id, statut_global')
        .eq('exercice', exercice);

      const dossiersEnCours =
        dossiers?.filter((d) => d.statut_global === 'en_cours' || d.statut_global === 'soumis')
          .length || 0;

      const dossiersBloques =
        dossiers?.filter((d) => d.statut_global === 'differe' || d.statut_global === 'rejete')
          .length || 0;

      const dossiersValides = dossiers?.filter((d) => d.statut_global === 'valide').length || 0;
      const dossiersSoldes = dossiers?.filter((d) => d.statut_global === 'solde').length || 0;

      // Alertes dépassement
      let alertesDepassement = 0;
      budgetLines?.forEach((bl) => {
        const engageForLine =
          engagements
            ?.filter((e) => e.budget_line_id === bl.id && e.statut === 'valide')
            .reduce((sum, e) => sum + (e.montant || 0), 0) || 0;
        if (engageForLine > bl.dotation_initiale) {
          alertesDepassement++;
        }
      });

      // Engagements à signer (statut soumis ou en_validation pour signature DG)
      const engagementsASigner =
        engagements?.filter((e) => e.statut === 'soumis' || e.statut === 'en_validation').length ||
        0;

      // Liquidations à signer
      const liquidationsASigner =
        liquidations?.filter((l) => l.statut === 'soumis' || l.statut === 'en_validation').length ||
        0;

      // Ordonnancements à signer
      const ordonnancementsASigner =
        ordonnancements?.filter((o) => o.statut === 'soumis' || o.statut === 'en_signature')
          .length || 0;

      // ===== Pipeline complet (9 étapes) =====
      // Notes SEF
      const { data: notesSEF } = await supabase
        .from('notes_sef')
        .select('id, statut')
        .eq('exercice', exercice);

      const notesSEFTotal = notesSEF?.length || 0;
      const notesSEFAValider =
        notesSEF?.filter((n) => n.statut === 'soumis' || n.statut === 'en_validation').length || 0;

      // Notes AEF (notes_dg)
      const { data: notesAEF } = await supabase
        .from('notes_dg')
        .select('id, statut')
        .eq('exercice', exercice);

      const notesAEFTotal = notesAEF?.length || 0;
      const notesAEFAValider =
        notesAEF?.filter((n) => n.statut === 'soumis' || n.statut === 'en_validation').length || 0;

      // Expressions de besoin
      const { data: expressions } = await supabase
        .from('expressions_besoin')
        .select('id')
        .eq('exercice', exercice);

      // Marchés
      const { data: marches } = await supabase
        .from('marches')
        .select('id')
        .eq('exercice', exercice);

      // Prestataires actifs
      const { data: prestataires } = await supabase
        .from('prestataires')
        .select('id')
        .eq('statut', 'actif');

      // ===== Délais de traitement =====
      let totalDelaiEng = 0,
        countDelaiEng = 0;
      engagements
        ?.filter((e) => e.statut === 'valide')
        .forEach((e) => {
          if ((e as any).updated_at) {
            const creation = new Date((e as any).created_at);
            const validation = new Date((e as any).updated_at);
            const delai = Math.floor(
              (validation.getTime() - creation.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (delai >= 0) {
              totalDelaiEng += delai;
              countDelaiEng++;
            }
          }
        });

      let totalDelaiLiq = 0,
        countDelaiLiq = 0;
      liquidations
        ?.filter((l) => l.statut === 'valide')
        .forEach((l) => {
          if ((l as any).updated_at) {
            const creation = new Date((l as any).created_at);
            const validation = new Date((l as any).updated_at);
            const delai = Math.floor(
              (validation.getTime() - creation.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (delai >= 0) {
              totalDelaiLiq += delai;
              countDelaiLiq++;
            }
          }
        });

      let totalDelaiOrd = 0,
        countDelaiOrd = 0;
      ordonnancements
        ?.filter((o) => o.statut === 'valide')
        .forEach((o) => {
          if ((o as any).updated_at) {
            const creation = new Date((o as any).created_at);
            const validation = new Date((o as any).updated_at);
            const delai = Math.floor(
              (validation.getTime() - creation.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (delai >= 0) {
              totalDelaiOrd += delai;
              countDelaiOrd++;
            }
          }
        });

      const pendingDGActions = notesSEFAValider + notesAEFAValider + ordonnancementsASigner;

      return {
        budgetGlobal,
        budgetEngage,
        budgetLiquide,
        budgetOrdonnance,
        budgetPaye,
        tauxConsommation: budgetGlobal > 0 ? Math.round((budgetEngage / budgetGlobal) * 100) : 0,
        topDirections,
        dossiersEnCours,
        dossiersBloques,
        dossiersValides,
        dossiersSoldes,
        alertesDepassement,
        engagementsASigner,
        liquidationsASigner,
        ordonnancementsASigner,
        pipeline: {
          notesSEF: notesSEFTotal,
          notesSEFAValider,
          notesAEF: notesAEFTotal,
          notesAEFAValider,
          expressionsBesoin: expressions?.length || 0,
          marches: marches?.length || 0,
          engagements: engagements?.length || 0,
          liquidations: liquidations?.length || 0,
          ordonnancements: ordonnancements?.length || 0,
          reglements: reglements?.length || 0,
        },
        delais: {
          moyenEngagement: countDelaiEng > 0 ? Math.round(totalDelaiEng / countDelaiEng) : null,
          moyenLiquidation: countDelaiLiq > 0 ? Math.round(totalDelaiLiq / countDelaiLiq) : null,
          moyenOrdonnancement: countDelaiOrd > 0 ? Math.round(totalDelaiOrd / countDelaiOrd) : null,
        },
        pendingDGActions,
        prestatairesActifs: prestataires?.length || 0,
      };
    },
    enabled: !!exercice,
  });
}

export function useDAFDashboard() {
  const { exercice } = useExercice();

  return useQuery({
    queryKey: ['dashboard-daf', exercice],
    queryFn: async (): Promise<DAFStats> => {
      // Notes
      const { data: notes } = await supabase
        .from('notes_dg')
        .select('id, statut')
        .eq('exercice', exercice);

      const notesAImputer = notes?.filter((n) => n.statut === 'valide' && !n.statut).length || 0;
      const notesTotales = notes?.length || 0;

      // Engagements
      const { data: engagements } = await supabase
        .from('budget_engagements')
        .select('id, statut, montant, created_at')
        .eq('exercice', exercice);

      const engagementsAValider = engagements?.filter((e) => e.statut === 'soumis').length || 0;
      const engagementsEnValidation =
        engagements?.filter((e) => e.statut === 'en_validation').length || 0;
      const engagementsValides = engagements?.filter((e) => e.statut === 'valide').length || 0;

      // Engagements du mois
      const debutMois = new Date();
      debutMois.setDate(1);
      debutMois.setHours(0, 0, 0, 0);

      const montantEngageMois =
        engagements
          ?.filter((e) => e.statut === 'valide' && new Date(e.created_at) >= debutMois)
          .reduce((sum, e) => sum + (e.montant || 0), 0) || 0;

      // Liquidations
      const { data: liquidations } = await supabase
        .from('budget_liquidations')
        .select('id, statut, montant, created_at')
        .eq('exercice', exercice);

      const liquidationsAValider = liquidations?.filter((l) => l.statut === 'soumis').length || 0;

      const montantLiquideMois =
        liquidations
          ?.filter((l) => l.statut === 'valide' && new Date(l.created_at) >= debutMois)
          .reduce((sum, l) => sum + (l.montant || 0), 0) || 0;

      // Budget et restes
      const { data: budgetLines } = await supabase
        .from('budget_lines')
        .select('id, dotation_initiale')
        .eq('exercice', exercice);

      const budgetTotal =
        budgetLines?.reduce((sum, bl) => sum + (bl.dotation_initiale || 0), 0) || 0;
      const totalEngage =
        engagements
          ?.filter((e) => e.statut === 'valide')
          .reduce((sum, e) => sum + (e.montant || 0), 0) || 0;
      const totalLiquide =
        liquidations
          ?.filter((l) => l.statut === 'valide')
          .reduce((sum, l) => sum + (l.montant || 0), 0) || 0;

      // Règlements
      const { data: reglements } = await supabase
        .from('reglements')
        .select('id, montant, statut')
        .eq('exercice', exercice);

      const totalPaye =
        reglements
          ?.filter((r) => r.statut === 'valide' || r.statut === 'confirme')
          .reduce((sum, r) => sum + (r.montant || 0), 0) || 0;

      // Dépassements
      let depassementsBudgetaires = 0;
      budgetLines?.forEach((bl) => {
        const engageForLine =
          engagements
            ?.filter((e) => e.statut === 'valide')
            .reduce((sum, e) => sum + (e.montant || 0), 0) || 0;
        if (engageForLine > bl.dotation_initiale) depassementsBudgetaires++;
      });

      return {
        notesAImputer,
        notesTotales,
        engagementsAValider,
        engagementsEnValidation,
        engagementsValides,
        liquidationsAValider,
        depassementsBudgetaires,
        resteAEngager: budgetTotal - totalEngage,
        resteALiquider: totalEngage - totalLiquide,
        resteAPayer: totalLiquide - totalPaye,
        montantEngageMois,
        montantLiquideMois,
      };
    },
    enabled: !!exercice,
  });
}

export function useSDPMDashboard() {
  const { exercice } = useExercice();

  return useQuery({
    queryKey: ['dashboard-sdpm', exercice],
    queryFn: async (): Promise<SDPMStats> => {
      // Marchés
      const { data: marches } = await supabase.from('marches').select(`
          id, statut, montant, created_at, date_signature,
          prestataires(id, raison_sociale)
        `);

      const marchesEnCours =
        marches?.filter((m) => m.statut === 'en_cours' || m.statut === 'en_execution').length || 0;
      const marchesBrouillon = marches?.filter((m) => m.statut === 'brouillon').length || 0;
      const marchesEnValidation =
        marches?.filter((m) => m.statut === 'soumis' || m.statut === 'en_validation').length || 0;
      const marchesValides =
        marches?.filter((m) => m.statut === 'valide' || m.statut === 'signe').length || 0;

      const marchesMontantTotal = marches?.reduce((sum, m) => sum + (m.montant || 0), 0) || 0;

      // Délai moyen (signature - création)
      let totalDelai = 0;
      let countDelai = 0;
      marches
        ?.filter((m) => m.date_signature)
        .forEach((m) => {
          const creation = new Date(m.created_at);
          const signature = new Date(m.date_signature!);
          const delaiJours = Math.floor(
            (signature.getTime() - creation.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (delaiJours > 0) {
            totalDelai += delaiJours;
            countDelai++;
          }
        });
      const delaiMoyenMarche = countDelai > 0 ? Math.round(totalDelai / countDelai) : 0;

      // Top fournisseurs
      const fournisseurStats = new Map<
        string,
        { nom: string; montantTotal: number; nombreMarches: number }
      >();
      marches
        ?.filter((m) => m.prestataires)
        .forEach((m) => {
          const presta = m.prestataires as any;
          if (presta?.id) {
            const existing = fournisseurStats.get(presta.id) || {
              nom: presta.raison_sociale,
              montantTotal: 0,
              nombreMarches: 0,
            };
            existing.montantTotal += m.montant || 0;
            existing.nombreMarches++;
            fournisseurStats.set(presta.id, existing);
          }
        });

      const topFournisseurs = Array.from(fournisseurStats.entries())
        .map(([id, stats]) => ({ id, ...stats }))
        .sort((a, b) => b.montantTotal - a.montantTotal)
        .slice(0, 5);

      // Expressions de besoin
      const { data: expressions } = await supabase
        .from('expressions_besoin')
        .select('id, statut')
        .eq('exercice', exercice);

      const expressionsBesoinAValider =
        expressions?.filter((e) => e.statut === 'soumis').length || 0;
      const expressionsBesoinEnCours =
        expressions?.filter((e) => e.statut === 'en_cours' || e.statut === 'brouillon').length || 0;

      return {
        marchesEnCours,
        marchesBrouillon,
        marchesEnValidation,
        marchesValides,
        expressionsBesoinAValider,
        expressionsBesoinEnCours,
        delaiMoyenMarche,
        topFournisseurs,
        marchesMontantTotal,
      };
    },
    enabled: !!exercice,
  });
}

// Stats pour Contrôleur Budgétaire (CB)
export interface ControleurStats {
  lignesCritiques: number; // >90% consommées
  lignesAlertes: number; // >80% consommées
  lignesSaines: number; // <80%
  totalLignes: number;
  engagementsAViser: number;
  engagementsEnCours: number;
  delaiMoyenEngagement: number | null; // en jours
  delaiMoyenLiquidation: number | null;
  anomaliesDetectees: number;
  montantEngage: number;
  montantDisponible: number;
  tauxConsommationGlobal: number;
  lignesCritiquesDetails: Array<{
    id: string;
    code: string;
    label: string;
    dotation: number;
    engage: number;
    tauxConsommation: number;
  }>;
  anomaliesDetails: Array<{
    type: string;
    description: string;
    entityId?: string;
    severity: 'info' | 'warning' | 'critical';
  }>;
  trackingEnabled: {
    delais: boolean;
    anomalies: boolean;
    alertes: boolean;
  };
}

function formatAmountInternal(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
}

export function useControleurDashboard() {
  const { exercice } = useExercice();

  return useQuery({
    queryKey: ['dashboard-controleur', exercice],
    queryFn: async (): Promise<ControleurStats> => {
      // Budget lines avec leur consommation
      const { data: budgetLines } = await supabase
        .from('budget_lines')
        .select(
          `
          id, code, label, dotation_initiale,
          total_engage, total_liquide
        `
        )
        .eq('exercice', exercice)
        .eq('is_active', true);

      const totalLignes = budgetLines?.length || 0;
      let lignesCritiques = 0;
      let lignesAlertes = 0;
      let lignesSaines = 0;
      const lignesCritiquesDetails: ControleurStats['lignesCritiquesDetails'] = [];

      budgetLines?.forEach((bl) => {
        const dotation = bl.dotation_initiale || 0;
        const engage = bl.total_engage || 0;
        const tauxConsommation = dotation > 0 ? (engage / dotation) * 100 : 0;

        if (tauxConsommation >= 90) {
          lignesCritiques++;
          lignesCritiquesDetails.push({
            id: bl.id,
            code: bl.code,
            label: bl.label,
            dotation,
            engage,
            tauxConsommation: Math.round(tauxConsommation),
          });
        } else if (tauxConsommation >= 80) {
          lignesAlertes++;
        } else {
          lignesSaines++;
        }
      });

      // Trier les lignes critiques par taux décroissant
      lignesCritiquesDetails.sort((a, b) => b.tauxConsommation - a.tauxConsommation);

      // Engagements à viser
      const { data: engagements } = await supabase
        .from('budget_engagements')
        .select('id, statut, montant, created_at, updated_at')
        .eq('exercice', exercice);

      const engagementsAViser =
        engagements?.filter((e) => e.statut === 'soumis' || e.statut === 'en_validation').length ||
        0;

      const engagementsEnCours =
        engagements?.filter((e) => e.statut === 'en_cours' || e.statut === 'brouillon').length || 0;

      const engagementsValides = engagements?.filter((e) => e.statut === 'valide') || [];
      const montantEngage = engagementsValides.reduce((sum, e) => sum + (e.montant || 0), 0);

      // Calcul délai moyen engagement (création -> mise à jour)
      let totalDelaiEng = 0;
      let countDelaiEng = 0;
      engagementsValides.forEach((e) => {
        if (e.updated_at) {
          const creation = new Date(e.created_at);
          const validation = new Date(e.updated_at);
          const delaiJours = Math.floor(
            (validation.getTime() - creation.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (delaiJours >= 0) {
            totalDelaiEng += delaiJours;
            countDelaiEng++;
          }
        }
      });
      const delaiMoyenEngagement =
        countDelaiEng > 0 ? Math.round(totalDelaiEng / countDelaiEng) : null;

      // Liquidations pour délai moyen
      const { data: liquidations } = await supabase
        .from('budget_liquidations')
        .select('id, statut, created_at, validated_at, updated_at')
        .eq('exercice', exercice)
        .eq('statut', 'valide');

      let totalDelaiLiq = 0;
      let countDelaiLiq = 0;
      liquidations?.forEach((l) => {
        // Utiliser validated_at si disponible, sinon updated_at
        const item = l as any;
        const validationDate = item.validated_at || item.updated_at;
        if (validationDate) {
          const creation = new Date(item.created_at);
          const validation = new Date(validationDate);
          const delaiJours = Math.floor(
            (validation.getTime() - creation.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (delaiJours >= 0) {
            totalDelaiLiq += delaiJours;
            countDelaiLiq++;
          }
        }
      });
      const delaiMoyenLiquidation =
        countDelaiLiq > 0 ? Math.round(totalDelaiLiq / countDelaiLiq) : null;

      // Budget global
      const budgetTotal =
        budgetLines?.reduce((sum, bl) => sum + (bl.dotation_initiale || 0), 0) || 0;
      const montantDisponible = budgetTotal - montantEngage;
      const tauxConsommationGlobal =
        budgetTotal > 0 ? Math.round((montantEngage / budgetTotal) * 100) : 0;

      // Anomalies détectées (règles simplifiées)
      const anomaliesDetails: ControleurStats['anomaliesDetails'] = [];

      // Anomalie: Lignes avec engagement > dotation
      budgetLines?.forEach((bl) => {
        const dotation = bl.dotation_initiale || 0;
        const engage = bl.total_engage || 0;
        if (engage > dotation) {
          anomaliesDetails.push({
            type: 'DEPASSEMENT',
            description: `Ligne ${bl.code}: engagement (${formatAmountInternal(engage)}) dépasse la dotation (${formatAmountInternal(dotation)})`,
            entityId: bl.id,
            severity: 'critical',
          });
        }
      });

      // Anomalie: Engagements en attente depuis plus de 15 jours
      const il15Jours = new Date();
      il15Jours.setDate(il15Jours.getDate() - 15);
      engagements
        ?.filter(
          (e) =>
            (e.statut === 'soumis' || e.statut === 'en_validation') &&
            new Date(e.created_at) < il15Jours
        )
        .forEach(() => {
          anomaliesDetails.push({
            type: 'RETARD_VALIDATION',
            description: `Engagement en attente de validation depuis plus de 15 jours`,
            severity: 'warning',
          });
        });

      // Check tracking enabled (based on data availability)
      const trackingEnabled = {
        delais: countDelaiEng > 0 || countDelaiLiq > 0,
        anomalies: true, // Always check for anomalies
        alertes: lignesCritiques > 0 || lignesAlertes > 0,
      };

      return {
        lignesCritiques,
        lignesAlertes,
        lignesSaines,
        totalLignes,
        engagementsAViser,
        engagementsEnCours,
        delaiMoyenEngagement,
        delaiMoyenLiquidation,
        anomaliesDetectees: anomaliesDetails.length,
        montantEngage,
        montantDisponible,
        tauxConsommationGlobal,
        lignesCritiquesDetails: lignesCritiquesDetails.slice(0, 10), // Top 10
        anomaliesDetails,
        trackingEnabled,
      };
    },
    enabled: !!exercice,
  });
}

export function useTresorerieDashboard() {
  const { exercice } = useExercice();

  return useQuery({
    queryKey: ['dashboard-tresorerie', exercice],
    queryFn: async (): Promise<TresorerieStats> => {
      const now = new Date();
      const debutJour = new Date(now);
      debutJour.setHours(0, 0, 0, 0);

      const debutSemaine = new Date(now);
      debutSemaine.setDate(now.getDate() - 7);

      // Ordonnancements validés en attente de paiement
      const { data: ordosValides } = await supabase
        .from('ordonnancements')
        .select('id, montant, montant_paye')
        .eq('exercice', exercice)
        .eq('statut', 'valide');

      const ordresPayerEnAttente =
        ordosValides?.filter((o) => (o.montant_paye || 0) < (o.montant || 0)).length || 0;

      const ordresPayerMontant =
        ordosValides?.reduce((sum, o) => {
          const reste = (o.montant || 0) - (o.montant_paye || 0);
          return sum + (reste > 0 ? reste : 0);
        }, 0) || 0;

      // Règlements
      const { data: reglements } = await supabase
        .from('reglements')
        .select('id, montant, date_paiement, statut')
        .eq('exercice', exercice);

      const reglementsDuJour =
        reglements?.filter((r) => new Date(r.date_paiement) >= debutJour).length || 0;

      const reglementsMontantJour =
        reglements
          ?.filter((r) => new Date(r.date_paiement) >= debutJour)
          .reduce((sum, r) => sum + (r.montant || 0), 0) || 0;

      const reglementsSemaine =
        reglements?.filter((r) => new Date(r.date_paiement) >= debutSemaine).length || 0;

      const reglementsMontantSemaine =
        reglements
          ?.filter((r) => new Date(r.date_paiement) >= debutSemaine)
          .reduce((sum, r) => sum + (r.montant || 0), 0) || 0;

      // Règlements partiels
      const reglementsPartiels =
        ordosValides?.filter(
          (o) => (o.montant_paye || 0) > 0 && (o.montant_paye || 0) < (o.montant || 0)
        ).length || 0;

      // Prévisions de sortie (ordonnancements validés avec date prévue)
      const dans7j = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const dans30j = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const { data: ordosAvecDate } = await supabase
        .from('ordonnancements')
        .select('id, montant, montant_paye, date_prevue_paiement')
        .eq('exercice', exercice)
        .eq('statut', 'valide')
        .not('date_prevue_paiement', 'is', null);

      const previsionSorties7j =
        ordosAvecDate
          ?.filter(
            (o) =>
              new Date(o.date_prevue_paiement!) <= dans7j &&
              (o.montant_paye || 0) < (o.montant || 0)
          )
          .reduce((sum, o) => sum + ((o.montant || 0) - (o.montant_paye || 0)), 0) || 0;

      const previsionSorties30j =
        ordosAvecDate
          ?.filter(
            (o) =>
              new Date(o.date_prevue_paiement!) <= dans30j &&
              (o.montant_paye || 0) < (o.montant || 0)
          )
          .reduce((sum, o) => sum + ((o.montant || 0) - (o.montant_paye || 0)), 0) || 0;

      // Solde disponible (simplifié - à remplacer par vraie logique trésorerie)
      const soldeDisponible = ordresPayerMontant * 0.8; // Placeholder

      return {
        ordresPayerEnAttente,
        ordresPayerMontant,
        reglementsDuJour,
        reglementsMontantJour,
        reglementsSemaine,
        reglementsMontantSemaine,
        previsionSorties7j,
        previsionSorties30j,
        soldeDisponible,
        reglementsPartiels,
      };
    },
    enabled: !!exercice,
  });
}
