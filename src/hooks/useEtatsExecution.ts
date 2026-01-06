import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";

export interface EtatFilters {
  exercice?: number;
  periode_debut?: string;
  periode_fin?: string;
  direction_id?: string;
  os_id?: string;
  mission_id?: string;
  nbe_id?: string;
  sysco_id?: string;
  projet_id?: string;
}

export interface BudgetLineExecution {
  id: string;
  code: string;
  label: string;
  dotation_initiale: number;
  direction_id: string | null;
  os_id: string | null;
  mission_id: string | null;
  nbe_id: string | null;
  sysco_id: string | null;
  engagements: number;
  liquidations: number;
  ordonnancements: number;
  reglements: number;
}

export interface ExecutionSummary {
  dotation_totale: number;
  montant_engage: number;
  montant_liquide: number;
  montant_ordonnance: number;
  montant_paye: number;
  reste_a_engager: number;
  reste_a_liquider: number;
  reste_a_ordonnancer: number;
  reste_a_payer: number;
  taux_engagement: number;
  taux_liquidation: number;
  taux_ordonnancement: number;
  taux_paiement: number;
}

export interface EtapeStats {
  etape: string;
  label: string;
  total: number;
  brouillon: number;
  soumis: number;
  valide: number;
  rejete: number;
  differe: number;
  montant_total: number;
}

export interface DirectionRef {
  id: string;
  code: string;
  label: string;
  sigle: string | null;
}

export interface RefItem {
  id: string;
  code: string;
  libelle: string;
}

// Helper to execute query and get data
async function queryTable<T>(
  table: string,
  select: string,
  filters: Record<string, any> = {}
): Promise<T[]> {
  let query = supabase.from(table as any).select(select);
  
  Object.entries(filters).forEach(([key, value]) => {
    if (key === "order") {
      query = query.order(value as string);
    } else if (key.startsWith("neq_")) {
      query = query.neq(key.replace("neq_", ""), value);
    } else if (key.startsWith("gte_")) {
      query = query.gte(key.replace("gte_", ""), value);
    } else if (key.startsWith("lte_")) {
      query = query.lte(key.replace("lte_", ""), value);
    } else if (key.startsWith("in_")) {
      query = query.in(key.replace("in_", ""), value);
    } else {
      query = query.eq(key, value);
    }
  });

  const { data, error } = await query as any;
  if (error) throw error;
  return (data || []) as T[];
}

export function useEtatsExecution(filters: EtatFilters = {}) {
  const { exercice: exerciceContext } = useExercice();
  const exercice = filters.exercice || exerciceContext || new Date().getFullYear();

  // Fetch referential data
  const { data: directions = [] } = useQuery<DirectionRef[]>({
    queryKey: ["directions-ref-etats"],
    queryFn: () => queryTable<DirectionRef>("directions", "id, code, label, sigle", { 
      est_active: true, 
      order: "label" 
    }),
  });

  const { data: objectifsStrategiques = [] } = useQuery<RefItem[]>({
    queryKey: ["os-ref-etats"],
    queryFn: () => queryTable<RefItem>("objectifs_strategiques", "id, code, libelle", { 
      est_active: true, 
      order: "code" 
    }),
  });

  const { data: missions = [] } = useQuery<RefItem[]>({
    queryKey: ["missions-ref-etats"],
    queryFn: () => queryTable<RefItem>("missions", "id, code, libelle", { 
      est_active: true, 
      order: "code" 
    }),
  });

  const { data: nomenclaturesNBE = [] } = useQuery<RefItem[]>({
    queryKey: ["nbe-ref-etats"],
    queryFn: () => queryTable<RefItem>("nomenclature_nbe", "id, code, libelle", { 
      est_active: true, 
      order: "code" 
    }),
  });

  const { data: planComptableSYSCO = [] } = useQuery<RefItem[]>({
    queryKey: ["sysco-ref-etats"],
    queryFn: () => queryTable<RefItem>("plan_comptable_sysco", "id, code, libelle", { 
      est_active: true, 
      order: "code" 
    }),
  });

  // Fetch budget lines with execution data
  const { data: budgetLinesExecution = [], isLoading: isLoadingBudgetLines } = useQuery<BudgetLineExecution[]>({
    queryKey: ["etats-execution-budget-lines", exercice, filters],
    queryFn: async () => {
      // Get budget lines
      const lineFilters: Record<string, any> = {
        exercice,
        is_active: true,
        order: "code",
      };
      if (filters.direction_id) lineFilters.direction_id = filters.direction_id;
      if (filters.os_id) lineFilters.os_id = filters.os_id;
      if (filters.mission_id) lineFilters.mission_id = filters.mission_id;
      if (filters.nbe_id) lineFilters.nbe_id = filters.nbe_id;
      if (filters.sysco_id) lineFilters.sysco_id = filters.sysco_id;

      const lines = await queryTable<{
        id: string;
        code: string;
        label: string;
        dotation_initiale: number;
        direction_id: string | null;
        os_id: string | null;
        mission_id: string | null;
        nbe_id: string | null;
        sysco_id: string | null;
      }>("budget_lines", "id, code, label, dotation_initiale, direction_id, os_id, mission_id, nbe_id, sysco_id", lineFilters);

      // Get engagements
      const engFilters: Record<string, any> = { exercice, neq_statut: "annule" };
      if (filters.periode_debut) engFilters.gte_date_engagement = filters.periode_debut;
      if (filters.periode_fin) engFilters.lte_date_engagement = filters.periode_fin;
      
      const engagements = await queryTable<{ budget_line_id: string; montant: number; id: string }>(
        "budget_engagements", 
        "id, budget_line_id, montant", 
        engFilters
      );

      // Build engagement map
      const engByLine: Record<string, number> = {};
      const engBudgetMap: Record<string, string> = {};
      engagements.forEach(e => {
        if (e.budget_line_id) {
          engByLine[e.budget_line_id] = (engByLine[e.budget_line_id] || 0) + (e.montant || 0);
          engBudgetMap[e.id] = e.budget_line_id;
        }
      });

      // Get liquidations
      const liqFilters: Record<string, any> = { exercice, neq_statut: "annule" };
      const liquidations = await queryTable<{ engagement_id: string; montant: number }>(
        "budget_liquidations",
        "engagement_id, montant",
        liqFilters
      );

      const liqByLine: Record<string, number> = {};
      liquidations.forEach(l => {
        const lineId = engBudgetMap[l.engagement_id];
        if (lineId) {
          liqByLine[lineId] = (liqByLine[lineId] || 0) + (l.montant || 0);
        }
      });

      // Get ordonnancements
      const ordonnancements = await queryTable<{ liquidation_id: string; montant: number }>(
        "ordonnancements",
        "liquidation_id, montant",
        { exercice, neq_statut: "annule" }
      );

      // Build liquidation to engagement map
      const liqEngMap: Record<string, string> = {};
      const liqIds = [...new Set(ordonnancements.map(o => o.liquidation_id).filter(Boolean))];
      if (liqIds.length > 0) {
        const liqData = await queryTable<{ id: string; engagement_id: string }>(
          "budget_liquidations",
          "id, engagement_id",
          { in_id: liqIds }
        );
        liqData.forEach(l => { liqEngMap[l.id] = l.engagement_id; });
      }

      const ordByLine: Record<string, number> = {};
      ordonnancements.forEach(o => {
        const engId = liqEngMap[o.liquidation_id];
        const lineId = engId ? engBudgetMap[engId] : null;
        if (lineId) {
          ordByLine[lineId] = (ordByLine[lineId] || 0) + (o.montant || 0);
        }
      });

      // Get reglements
      const reglements = await queryTable<{ ordonnancement_id: string; montant: number }>(
        "reglements",
        "ordonnancement_id, montant",
        { exercice, neq_statut: "annule" }
      );

      // Build ordonnancement to liquidation map
      const ordLiqMap: Record<string, string> = {};
      const ordIds = [...new Set(reglements.map(r => r.ordonnancement_id).filter(Boolean))];
      if (ordIds.length > 0) {
        const ordData = await queryTable<{ id: string; liquidation_id: string }>(
          "ordonnancements",
          "id, liquidation_id",
          { in_id: ordIds }
        );
        ordData.forEach(o => { ordLiqMap[o.id] = o.liquidation_id; });
      }

      const regByLine: Record<string, number> = {};
      reglements.forEach(r => {
        const liqId = ordLiqMap[r.ordonnancement_id];
        const engId = liqId ? liqEngMap[liqId] : null;
        const lineId = engId ? engBudgetMap[engId] : null;
        if (lineId) {
          regByLine[lineId] = (regByLine[lineId] || 0) + (r.montant || 0);
        }
      });

      return lines.map(line => ({
        ...line,
        engagements: engByLine[line.id] || 0,
        liquidations: liqByLine[line.id] || 0,
        ordonnancements: ordByLine[line.id] || 0,
        reglements: regByLine[line.id] || 0,
      }));
    },
    enabled: !!exercice,
  });

  // Fetch etapes stats
  const { data: etapesStats = [], isLoading: isLoadingEtapes } = useQuery<EtapeStats[]>({
    queryKey: ["etats-execution-etapes", exercice, filters],
    queryFn: async () => {
      const stats: EtapeStats[] = [];

      // Notes AEF
      const notes = await queryTable<{ id: string; statut: string | null; montant_estime: number | null }>(
        "notes_dg",
        "id, statut, montant_estime",
        { exercice }
      );
      
      stats.push({
        etape: "notes_aef",
        label: "Notes AEF",
        total: notes.length,
        brouillon: notes.filter(n => n.statut === "brouillon").length,
        soumis: notes.filter(n => n.statut === "soumis").length,
        valide: notes.filter(n => n.statut === "valide" || n.statut === "impute").length,
        rejete: notes.filter(n => n.statut === "rejete").length,
        differe: notes.filter(n => n.statut === "differe").length,
        montant_total: notes.reduce((sum, n) => sum + (n.montant_estime || 0), 0),
      });

      // Engagements
      const engagements = await queryTable<{ id: string; statut: string | null; montant: number }>(
        "budget_engagements",
        "id, statut, montant",
        { exercice }
      );
      
      stats.push({
        etape: "engagements",
        label: "Engagements",
        total: engagements.length,
        brouillon: engagements.filter(e => e.statut === "brouillon").length,
        soumis: engagements.filter(e => e.statut === "soumis").length,
        valide: engagements.filter(e => e.statut === "valide").length,
        rejete: engagements.filter(e => e.statut === "rejete").length,
        differe: engagements.filter(e => e.statut === "differe").length,
        montant_total: engagements.reduce((sum, e) => sum + (e.montant || 0), 0),
      });

      // Liquidations
      const liquidations = await queryTable<{ id: string; statut: string | null; montant: number }>(
        "budget_liquidations",
        "id, statut, montant",
        { exercice }
      );
      
      stats.push({
        etape: "liquidations",
        label: "Liquidations",
        total: liquidations.length,
        brouillon: liquidations.filter(l => l.statut === "brouillon").length,
        soumis: liquidations.filter(l => l.statut === "soumis").length,
        valide: liquidations.filter(l => l.statut === "valide").length,
        rejete: liquidations.filter(l => l.statut === "rejete").length,
        differe: liquidations.filter(l => l.statut === "differe").length,
        montant_total: liquidations.reduce((sum, l) => sum + (l.montant || 0), 0),
      });

      // Ordonnancements
      const ordonnancements = await queryTable<{ id: string; statut: string | null; montant: number }>(
        "ordonnancements",
        "id, statut, montant",
        { exercice }
      );
      
      stats.push({
        etape: "ordonnancements",
        label: "Ordonnancements",
        total: ordonnancements.length,
        brouillon: ordonnancements.filter(o => o.statut === "brouillon").length,
        soumis: ordonnancements.filter(o => o.statut === "soumis").length,
        valide: ordonnancements.filter(o => o.statut === "valide").length,
        rejete: ordonnancements.filter(o => o.statut === "rejete").length,
        differe: ordonnancements.filter(o => o.statut === "differe").length,
        montant_total: ordonnancements.reduce((sum, o) => sum + (o.montant || 0), 0),
      });

      // Règlements
      const reglements = await queryTable<{ id: string; statut: string | null; montant: number }>(
        "reglements",
        "id, statut, montant",
        { exercice }
      );
      
      stats.push({
        etape: "reglements",
        label: "Règlements",
        total: reglements.length,
        brouillon: 0,
        soumis: 0,
        valide: reglements.filter(r => r.statut === "valide" || r.statut === "enregistre").length,
        rejete: reglements.filter(r => r.statut === "annule").length,
        differe: 0,
        montant_total: reglements.reduce((sum, r) => sum + (r.montant || 0), 0),
      });

      return stats;
    },
    enabled: !!exercice,
  });

  // Calculate summary
  const summary: ExecutionSummary = {
    dotation_totale: budgetLinesExecution.reduce((sum, l) => sum + (l.dotation_initiale || 0), 0),
    montant_engage: budgetLinesExecution.reduce((sum, l) => sum + (l.engagements || 0), 0),
    montant_liquide: budgetLinesExecution.reduce((sum, l) => sum + (l.liquidations || 0), 0),
    montant_ordonnance: budgetLinesExecution.reduce((sum, l) => sum + (l.ordonnancements || 0), 0),
    montant_paye: budgetLinesExecution.reduce((sum, l) => sum + (l.reglements || 0), 0),
    reste_a_engager: 0,
    reste_a_liquider: 0,
    reste_a_ordonnancer: 0,
    reste_a_payer: 0,
    taux_engagement: 0,
    taux_liquidation: 0,
    taux_ordonnancement: 0,
    taux_paiement: 0,
  };

  summary.reste_a_engager = summary.dotation_totale - summary.montant_engage;
  summary.reste_a_liquider = summary.montant_engage - summary.montant_liquide;
  summary.reste_a_ordonnancer = summary.montant_liquide - summary.montant_ordonnance;
  summary.reste_a_payer = summary.montant_ordonnance - summary.montant_paye;
  summary.taux_engagement = summary.dotation_totale > 0 ? (summary.montant_engage / summary.dotation_totale) * 100 : 0;
  summary.taux_liquidation = summary.montant_engage > 0 ? (summary.montant_liquide / summary.montant_engage) * 100 : 0;
  summary.taux_ordonnancement = summary.montant_liquide > 0 ? (summary.montant_ordonnance / summary.montant_liquide) * 100 : 0;
  summary.taux_paiement = summary.montant_ordonnance > 0 ? (summary.montant_paye / summary.montant_ordonnance) * 100 : 0;

  // Aggregation functions
  const getEtatByDirection = () => {
    const grouped: Record<string, { 
      direction: DirectionRef; 
      dotation: number; 
      engage: number; 
      liquide: number; 
      ordonnance: number; 
      paye: number;
    }> = {};

    budgetLinesExecution.forEach(line => {
      const dirId = line.direction_id || "non_affecte";
      if (!grouped[dirId]) {
        const dir = directions.find(d => d.id === line.direction_id);
        grouped[dirId] = {
          direction: dir || { id: "non_affecte", code: "-", label: "Non affecté", sigle: null },
          dotation: 0,
          engage: 0,
          liquide: 0,
          ordonnance: 0,
          paye: 0,
        };
      }
      grouped[dirId].dotation += line.dotation_initiale || 0;
      grouped[dirId].engage += line.engagements || 0;
      grouped[dirId].liquide += line.liquidations || 0;
      grouped[dirId].ordonnance += line.ordonnancements || 0;
      grouped[dirId].paye += line.reglements || 0;
    });

    return Object.values(grouped);
  };

  const getEtatByOS = () => {
    const grouped: Record<string, { 
      os: RefItem; 
      dotation: number; 
      engage: number; 
      liquide: number; 
      ordonnance: number; 
      paye: number;
    }> = {};

    budgetLinesExecution.forEach(line => {
      const osId = line.os_id || "non_affecte";
      if (!grouped[osId]) {
        const os = objectifsStrategiques.find(o => o.id === line.os_id);
        grouped[osId] = {
          os: os || { id: "non_affecte", code: "-", libelle: "Non affecté" },
          dotation: 0,
          engage: 0,
          liquide: 0,
          ordonnance: 0,
          paye: 0,
        };
      }
      grouped[osId].dotation += line.dotation_initiale || 0;
      grouped[osId].engage += line.engagements || 0;
      grouped[osId].liquide += line.liquidations || 0;
      grouped[osId].ordonnance += line.ordonnancements || 0;
      grouped[osId].paye += line.reglements || 0;
    });

    return Object.values(grouped);
  };

  const getEtatByMission = () => {
    const grouped: Record<string, { 
      mission: RefItem; 
      dotation: number; 
      engage: number; 
      liquide: number; 
      ordonnance: number; 
      paye: number;
    }> = {};

    budgetLinesExecution.forEach(line => {
      const missionId = line.mission_id || "non_affecte";
      if (!grouped[missionId]) {
        const mission = missions.find(m => m.id === line.mission_id);
        grouped[missionId] = {
          mission: mission || { id: "non_affecte", code: "-", libelle: "Non affecté" },
          dotation: 0,
          engage: 0,
          liquide: 0,
          ordonnance: 0,
          paye: 0,
        };
      }
      grouped[missionId].dotation += line.dotation_initiale || 0;
      grouped[missionId].engage += line.engagements || 0;
      grouped[missionId].liquide += line.liquidations || 0;
      grouped[missionId].ordonnance += line.ordonnancements || 0;
      grouped[missionId].paye += line.reglements || 0;
    });

    return Object.values(grouped);
  };

  const getEtatByNBE = () => {
    const grouped: Record<string, { 
      nbe: RefItem; 
      dotation: number; 
      engage: number; 
      liquide: number; 
      ordonnance: number; 
      paye: number;
    }> = {};

    budgetLinesExecution.forEach(line => {
      const nbeId = line.nbe_id || "non_affecte";
      if (!grouped[nbeId]) {
        const nbe = nomenclaturesNBE.find(n => n.id === line.nbe_id);
        grouped[nbeId] = {
          nbe: nbe || { id: "non_affecte", code: "-", libelle: "Non affecté" },
          dotation: 0,
          engage: 0,
          liquide: 0,
          ordonnance: 0,
          paye: 0,
        };
      }
      grouped[nbeId].dotation += line.dotation_initiale || 0;
      grouped[nbeId].engage += line.engagements || 0;
      grouped[nbeId].liquide += line.liquidations || 0;
      grouped[nbeId].ordonnance += line.ordonnancements || 0;
      grouped[nbeId].paye += line.reglements || 0;
    });

    return Object.values(grouped);
  };

  const getEtatBySYSCO = () => {
    const grouped: Record<string, { 
      sysco: RefItem; 
      dotation: number; 
      engage: number; 
      liquide: number; 
      ordonnance: number; 
      paye: number;
    }> = {};

    budgetLinesExecution.forEach(line => {
      const syscoId = line.sysco_id || "non_affecte";
      if (!grouped[syscoId]) {
        const sysco = planComptableSYSCO.find(s => s.id === line.sysco_id);
        grouped[syscoId] = {
          sysco: sysco || { id: "non_affecte", code: "-", libelle: "Non affecté" },
          dotation: 0,
          engage: 0,
          liquide: 0,
          ordonnance: 0,
          paye: 0,
        };
      }
      grouped[syscoId].dotation += line.dotation_initiale || 0;
      grouped[syscoId].engage += line.engagements || 0;
      grouped[syscoId].liquide += line.liquidations || 0;
      grouped[syscoId].ordonnance += line.ordonnancements || 0;
      grouped[syscoId].paye += line.reglements || 0;
    });

    return Object.values(grouped);
  };

  return {
    // Data
    budgetLinesExecution,
    etapesStats,
    summary,
    
    // Aggregations
    getEtatByDirection,
    getEtatByOS,
    getEtatByMission,
    getEtatByNBE,
    getEtatBySYSCO,
    
    // Referential
    directions,
    objectifsStrategiques,
    missions,
    nomenclaturesNBE,
    planComptableSYSCO,
    
    // Loading states
    isLoading: isLoadingBudgetLines || isLoadingEtapes,
    exercice,
  };
}
