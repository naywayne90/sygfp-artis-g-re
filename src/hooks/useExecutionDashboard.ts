import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";

export interface ExecutionStats {
  // Engagements
  engagements: {
    brouillon: { count: number; montant: number };
    soumis: { count: number; montant: number };
    valide: { count: number; montant: number };
    rejete: { count: number; montant: number };
    total: { count: number; montant: number };
  };
  // Liquidations
  liquidations: {
    brouillon: { count: number; montant: number };
    soumis: { count: number; montant: number };
    valide: { count: number; montant: number };
    rejete: { count: number; montant: number };
    total: { count: number; montant: number };
  };
  // Ordonnancements
  ordonnancements: {
    brouillon: { count: number; montant: number };
    en_signature: { count: number; montant: number };
    signe: { count: number; montant: number };
    rejete: { count: number; montant: number };
    total: { count: number; montant: number };
  };
  // Règlements
  reglements: {
    en_attente: { count: number; montant: number };
    en_cours: { count: number; montant: number };
    paye: { count: number; montant: number };
    annule: { count: number; montant: number };
    total: { count: number; montant: number };
  };
  // Évolution mensuelle
  evolutionMensuelle: Array<{
    mois: string;
    engagements: number;
    liquidations: number;
    ordonnancements: number;
    reglements: number;
  }>;
  // Top dossiers
  topDossiers: Array<{
    id: string;
    code: string;
    objet: string;
    montant: number;
    etape: string;
    progression: number;
  }>;
}

const MOIS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

function aggregateByStatus<T extends { statut?: string | null; montant?: number | null }>(
  items: T[],
  statusMap: Record<string, string[]>
): Record<string, { count: number; montant: number }> {
  const result: Record<string, { count: number; montant: number }> = {};
  
  for (const [key, statuses] of Object.entries(statusMap)) {
    const filtered = items.filter(item => statuses.includes(item.statut || ""));
    result[key] = {
      count: filtered.length,
      montant: filtered.reduce((sum, item) => sum + (item.montant || 0), 0),
    };
  }
  
  result.total = {
    count: items.length,
    montant: items.reduce((sum, item) => sum + (item.montant || 0), 0),
  };
  
  return result;
}

export function useExecutionDashboard() {
  const { exercice } = useExercice();

  return useQuery({
    queryKey: ["execution-dashboard", exercice],
    queryFn: async (): Promise<ExecutionStats> => {
      // Fetch all data in parallel
      const [engagementsRes, liquidationsRes, ordonnancementsRes, reglementsRes, dossiersRes] = await Promise.all([
        supabase
          .from("budget_engagements")
          .select("id, numero, objet, statut, montant, date_engagement, dossier_id")
          .eq("exercice", exercice),
        supabase
          .from("budget_liquidations")
          .select("id, numero, statut, montant, date_liquidation")
          .eq("exercice", exercice),
        supabase
          .from("ordonnancements")
          .select("id, numero, statut, montant, created_at")
          .eq("exercice", exercice),
        supabase
          .from("reglements")
          .select("id, numero, statut, montant, created_at")
          .eq("exercice", exercice),
        supabase
          .from("dossiers")
          .select("id, numero, objet, statut_global, montant, etape_courante")
          .eq("exercice", exercice)
          .order("montant", { ascending: false })
          .limit(10),
      ]);

      if (engagementsRes.error) throw engagementsRes.error;
      if (liquidationsRes.error) throw liquidationsRes.error;
      if (ordonnancementsRes.error) throw ordonnancementsRes.error;
      if (reglementsRes.error) throw reglementsRes.error;

      const engagements = engagementsRes.data || [];
      const liquidations = liquidationsRes.data || [];
      const ordonnancements = ordonnancementsRes.data || [];
      const reglements = reglementsRes.data || [];
      const dossiers = dossiersRes.data || [];

      // Aggregate engagements
      const engagementsStats = aggregateByStatus(engagements, {
        brouillon: ["brouillon", "en_cours"],
        soumis: ["soumis", "en_attente"],
        valide: ["valide"],
        rejete: ["rejete", "annule"],
      });

      // Aggregate liquidations
      const liquidationsStats = aggregateByStatus(liquidations, {
        brouillon: ["brouillon"],
        soumis: ["soumis", "en_attente"],
        valide: ["valide"],
        rejete: ["rejete"],
      });

      // Aggregate ordonnancements
      const ordonnancementsStats = aggregateByStatus(ordonnancements, {
        brouillon: ["brouillon", "en_attente"],
        en_signature: ["en_signature", "soumis"],
        signe: ["signe", "valide"],
        rejete: ["rejete"],
      });

      // Aggregate règlements
      const reglementsStats = aggregateByStatus(reglements, {
        en_attente: ["en_attente", "brouillon"],
        en_cours: ["en_cours", "soumis"],
        paye: ["paye", "valide"],
        annule: ["annule", "rejete"],
      });

      // Calculate monthly evolution
      const evolutionMensuelle = MOIS.map((mois, index) => {
        const monthStart = new Date(exercice, index, 1);
        const monthEnd = new Date(exercice, index + 1, 0);
        
        const filterByMonth = (items: Array<{ [key: string]: any }>, dateField: string) => {
          return items.filter(item => {
            if (!item[dateField]) return false;
            const date = new Date(item[dateField]);
            return date >= monthStart && date <= monthEnd;
          });
        };

        return {
          mois,
          engagements: filterByMonth(engagements.filter(e => e.statut === "valide"), "date_engagement")
            .reduce((sum, e) => sum + ((e as any).montant || 0), 0),
          liquidations: filterByMonth(liquidations.filter(l => l.statut === "valide"), "date_liquidation")
            .reduce((sum, l) => sum + ((l as any).montant || 0), 0),
          ordonnancements: filterByMonth(ordonnancements.filter((o: any) => o.statut === "signe" || o.statut === "valide"), "created_at")
            .reduce((sum, o) => sum + ((o as any).montant || 0), 0),
          reglements: filterByMonth(reglements.filter((r: any) => r.statut === "paye"), "created_at")
            .reduce((sum, r) => sum + ((r as any).montant || 0), 0),
        };
      });

      // Map étape progression
      const etapeToProgression: Record<string, number> = {
        "note_sef": 10,
        "note_aef": 20,
        "imputation": 30,
        "expression_besoin": 40,
        "marche": 50,
        "engagement": 60,
        "liquidation": 70,
        "ordonnancement": 80,
        "reglement": 90,
        "termine": 100,
      };

      // Top dossiers
      const topDossiers = (dossiers || []).map((d: any) => ({
        id: d.id,
        code: d.numero || "-",
        objet: d.objet || "-",
        montant: d.montant || 0,
        etape: d.etape_courante || "note_sef",
        progression: etapeToProgression[d.etape_courante || ""] || 0,
      }));

      return {
        engagements: engagementsStats as ExecutionStats["engagements"],
        liquidations: liquidationsStats as ExecutionStats["liquidations"],
        ordonnancements: ordonnancementsStats as ExecutionStats["ordonnancements"],
        reglements: reglementsStats as ExecutionStats["reglements"],
        evolutionMensuelle,
        topDossiers,
      };
    },
    enabled: !!exercice,
  });
}

export default useExecutionDashboard;
