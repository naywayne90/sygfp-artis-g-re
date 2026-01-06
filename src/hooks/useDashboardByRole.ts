import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";

// Stats pour le DG
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
    queryKey: ["dashboard-dg", exercice],
    queryFn: async (): Promise<DGStats> => {
      // Budget global
      const { data: budgetLines } = await supabase
        .from("budget_lines")
        .select(`
          id, dotation_initiale, direction_id,
          directions(id, code, label)
        `)
        .eq("exercice", exercice);

      const budgetGlobal = budgetLines?.reduce((sum, bl) => sum + (bl.dotation_initiale || 0), 0) || 0;

      // Engagements
      const { data: engagements } = await supabase
        .from("budget_engagements")
        .select("id, montant, statut, budget_line_id")
        .eq("exercice", exercice);

      const budgetEngage = engagements?.filter(e => e.statut === "valide")
        .reduce((sum, e) => sum + (e.montant || 0), 0) || 0;

      // Liquidations
      const { data: liquidations } = await supabase
        .from("budget_liquidations")
        .select("id, montant, statut")
        .eq("exercice", exercice);

      const budgetLiquide = liquidations?.filter(l => l.statut === "valide")
        .reduce((sum, l) => sum + (l.montant || 0), 0) || 0;

      // Ordonnancements
      const { data: ordonnancements } = await supabase
        .from("ordonnancements")
        .select("id, montant, statut")
        .eq("exercice", exercice);

      const budgetOrdonnance = ordonnancements?.filter(o => o.statut === "valide")
        .reduce((sum, o) => sum + (o.montant || 0), 0) || 0;

      // Règlements
      const { data: reglements } = await supabase
        .from("reglements")
        .select("id, montant, statut")
        .eq("exercice", exercice);

      const budgetPaye = reglements?.filter(r => r.statut === "valide" || r.statut === "confirme")
        .reduce((sum, r) => sum + (r.montant || 0), 0) || 0;

      // Top directions
      const directionStats = new Map<string, { code: string; label: string; dotation: number; engage: number }>();
      
      budgetLines?.forEach(bl => {
        if (bl.direction_id && bl.directions) {
          const dir = bl.directions as any;
          const existing = directionStats.get(bl.direction_id) || { 
            code: dir.code, 
            label: dir.label, 
            dotation: 0, 
            engage: 0 
          };
          existing.dotation += bl.dotation_initiale || 0;
          directionStats.set(bl.direction_id, existing);
        }
      });

      engagements?.filter(e => e.statut === "valide").forEach(eng => {
        const bl = budgetLines?.find(b => b.id === eng.budget_line_id);
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
        .from("dossiers")
        .select("id, statut_global")
        .eq("exercice", exercice);

      const dossiersEnCours = dossiers?.filter(d => 
        d.statut_global === "en_cours" || d.statut_global === "soumis"
      ).length || 0;

      const dossiersBloques = dossiers?.filter(d => 
        d.statut_global === "differe" || d.statut_global === "rejete"
      ).length || 0;

      const dossiersValides = dossiers?.filter(d => d.statut_global === "valide").length || 0;
      const dossiersSoldes = dossiers?.filter(d => d.statut_global === "solde").length || 0;

      // Alertes dépassement
      let alertesDepassement = 0;
      budgetLines?.forEach(bl => {
        const engageForLine = engagements?.filter(e => e.budget_line_id === bl.id && e.statut === "valide")
          .reduce((sum, e) => sum + (e.montant || 0), 0) || 0;
        if (engageForLine > bl.dotation_initiale) {
          alertesDepassement++;
        }
      });

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
      };
    },
    enabled: !!exercice,
  });
}

export function useDAFDashboard() {
  const { exercice } = useExercice();

  return useQuery({
    queryKey: ["dashboard-daf", exercice],
    queryFn: async (): Promise<DAFStats> => {
      // Notes
      const { data: notes } = await supabase
        .from("notes_dg")
        .select("id, statut")
        .eq("exercice", exercice);

      const notesAImputer = notes?.filter(n => n.statut === "valide" && !n.statut).length || 0;
      const notesTotales = notes?.length || 0;

      // Engagements
      const { data: engagements } = await supabase
        .from("budget_engagements")
        .select("id, statut, montant, created_at")
        .eq("exercice", exercice);

      const engagementsAValider = engagements?.filter(e => e.statut === "soumis").length || 0;
      const engagementsEnValidation = engagements?.filter(e => e.statut === "en_validation").length || 0;
      const engagementsValides = engagements?.filter(e => e.statut === "valide").length || 0;

      // Engagements du mois
      const debutMois = new Date();
      debutMois.setDate(1);
      debutMois.setHours(0, 0, 0, 0);
      
      const montantEngageMois = engagements?.filter(e => 
        e.statut === "valide" && new Date(e.created_at) >= debutMois
      ).reduce((sum, e) => sum + (e.montant || 0), 0) || 0;

      // Liquidations
      const { data: liquidations } = await supabase
        .from("budget_liquidations")
        .select("id, statut, montant, created_at")
        .eq("exercice", exercice);

      const liquidationsAValider = liquidations?.filter(l => l.statut === "soumis").length || 0;

      const montantLiquideMois = liquidations?.filter(l => 
        l.statut === "valide" && new Date(l.created_at) >= debutMois
      ).reduce((sum, l) => sum + (l.montant || 0), 0) || 0;

      // Budget et restes
      const { data: budgetLines } = await supabase
        .from("budget_lines")
        .select("id, dotation_initiale")
        .eq("exercice", exercice);

      const budgetTotal = budgetLines?.reduce((sum, bl) => sum + (bl.dotation_initiale || 0), 0) || 0;
      const totalEngage = engagements?.filter(e => e.statut === "valide")
        .reduce((sum, e) => sum + (e.montant || 0), 0) || 0;
      const totalLiquide = liquidations?.filter(l => l.statut === "valide")
        .reduce((sum, l) => sum + (l.montant || 0), 0) || 0;

      // Règlements
      const { data: reglements } = await supabase
        .from("reglements")
        .select("id, montant, statut")
        .eq("exercice", exercice);

      const totalPaye = reglements?.filter(r => r.statut === "valide" || r.statut === "confirme")
        .reduce((sum, r) => sum + (r.montant || 0), 0) || 0;

      // Dépassements
      let depassementsBudgetaires = 0;
      budgetLines?.forEach(bl => {
        const engageForLine = engagements?.filter(e => e.statut === "valide")
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
    queryKey: ["dashboard-sdpm", exercice],
    queryFn: async (): Promise<SDPMStats> => {
      // Marchés
      const { data: marches } = await supabase
        .from("marches")
        .select(`
          id, statut, montant, created_at, date_signature,
          prestataires(id, raison_sociale)
        `);

      const marchesEnCours = marches?.filter(m => 
        m.statut === "en_cours" || m.statut === "en_execution"
      ).length || 0;
      const marchesBrouillon = marches?.filter(m => m.statut === "brouillon").length || 0;
      const marchesEnValidation = marches?.filter(m => 
        m.statut === "soumis" || m.statut === "en_validation"
      ).length || 0;
      const marchesValides = marches?.filter(m => 
        m.statut === "valide" || m.statut === "signe"
      ).length || 0;

      const marchesMontantTotal = marches?.reduce((sum, m) => sum + (m.montant || 0), 0) || 0;

      // Délai moyen (signature - création)
      let totalDelai = 0;
      let countDelai = 0;
      marches?.filter(m => m.date_signature).forEach(m => {
        const creation = new Date(m.created_at);
        const signature = new Date(m.date_signature!);
        const delaiJours = Math.floor((signature.getTime() - creation.getTime()) / (1000 * 60 * 60 * 24));
        if (delaiJours > 0) {
          totalDelai += delaiJours;
          countDelai++;
        }
      });
      const delaiMoyenMarche = countDelai > 0 ? Math.round(totalDelai / countDelai) : 0;

      // Top fournisseurs
      const fournisseurStats = new Map<string, { nom: string; montantTotal: number; nombreMarches: number }>();
      marches?.filter(m => m.prestataires).forEach(m => {
        const presta = m.prestataires as any;
        if (presta?.id) {
          const existing = fournisseurStats.get(presta.id) || { 
            nom: presta.raison_sociale, 
            montantTotal: 0, 
            nombreMarches: 0 
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
        .from("expressions_besoin")
        .select("id, statut")
        .eq("exercice", exercice);

      const expressionsBesoinAValider = expressions?.filter(e => e.statut === "soumis").length || 0;
      const expressionsBesoinEnCours = expressions?.filter(e => 
        e.statut === "en_cours" || e.statut === "brouillon"
      ).length || 0;

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

export function useTresorerieDashboard() {
  const { exercice } = useExercice();

  return useQuery({
    queryKey: ["dashboard-tresorerie", exercice],
    queryFn: async (): Promise<TresorerieStats> => {
      const now = new Date();
      const debutJour = new Date(now);
      debutJour.setHours(0, 0, 0, 0);
      
      const debutSemaine = new Date(now);
      debutSemaine.setDate(now.getDate() - 7);

      // Ordonnancements validés en attente de paiement
      const { data: ordosValides } = await supabase
        .from("ordonnancements")
        .select("id, montant, montant_paye")
        .eq("exercice", exercice)
        .eq("statut", "valide");

      const ordresPayerEnAttente = ordosValides?.filter(o => 
        (o.montant_paye || 0) < (o.montant || 0)
      ).length || 0;

      const ordresPayerMontant = ordosValides?.reduce((sum, o) => {
        const reste = (o.montant || 0) - (o.montant_paye || 0);
        return sum + (reste > 0 ? reste : 0);
      }, 0) || 0;

      // Règlements
      const { data: reglements } = await supabase
        .from("reglements")
        .select("id, montant, date_paiement, statut")
        .eq("exercice", exercice);

      const reglementsDuJour = reglements?.filter(r => 
        new Date(r.date_paiement) >= debutJour
      ).length || 0;

      const reglementsMontantJour = reglements?.filter(r => 
        new Date(r.date_paiement) >= debutJour
      ).reduce((sum, r) => sum + (r.montant || 0), 0) || 0;

      const reglementsSemaine = reglements?.filter(r => 
        new Date(r.date_paiement) >= debutSemaine
      ).length || 0;

      const reglementsMontantSemaine = reglements?.filter(r => 
        new Date(r.date_paiement) >= debutSemaine
      ).reduce((sum, r) => sum + (r.montant || 0), 0) || 0;

      // Règlements partiels
      const reglementsPartiels = ordosValides?.filter(o => 
        (o.montant_paye || 0) > 0 && (o.montant_paye || 0) < (o.montant || 0)
      ).length || 0;

      // Prévisions de sortie (ordonnancements validés avec date prévue)
      const dans7j = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const dans30j = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const { data: ordosAvecDate } = await supabase
        .from("ordonnancements")
        .select("id, montant, montant_paye, date_prevue_paiement")
        .eq("exercice", exercice)
        .eq("statut", "valide")
        .not("date_prevue_paiement", "is", null);

      const previsionSorties7j = ordosAvecDate?.filter(o => 
        new Date(o.date_prevue_paiement!) <= dans7j &&
        (o.montant_paye || 0) < (o.montant || 0)
      ).reduce((sum, o) => sum + ((o.montant || 0) - (o.montant_paye || 0)), 0) || 0;

      const previsionSorties30j = ordosAvecDate?.filter(o => 
        new Date(o.date_prevue_paiement!) <= dans30j &&
        (o.montant_paye || 0) < (o.montant || 0)
      ).reduce((sum, o) => sum + ((o.montant || 0) - (o.montant_paye || 0)), 0) || 0;

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
