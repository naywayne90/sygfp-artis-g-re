import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { toast } from "sonner";

export interface RefVariable {
  id: string;
  code_variable: string;
  libelle: string;
  description: string | null;
  type_variable: string;
  obligatoire: boolean;
  exemple: string | null;
  module_source: string | null;
  module_cible: string | null;
  tables_concernees: string[];
  source_of_truth: string;
  actif: boolean;
}

export interface LambdaLinkType {
  id: string;
  code: string;
  source_table: string;
  cible_table: string;
  libelle: string;
  description: string | null;
  default_mapping: Record<string, string>;
  actif: boolean;
  ordre: number;
}

export interface LambdaLink {
  id: string;
  exercice: number;
  source_table: string;
  source_id: string;
  cible_table: string;
  cible_id: string | null;
  type_lien: string;
  mapping_json: Record<string, string>;
  statut_sync: string;
  erreur_detail: string | null;
  last_sync_at: string | null;
  sync_count: number;
  commentaire: string | null;
  created_at: string;
}

export interface MappingSuggestion {
  source_field: string;
  cible_field: string;
  variable_code: string | null;
  confidence: 'exact' | 'similar' | 'manual';
}

export function useLambdaLinks() {
  const queryClient = useQueryClient();
  const { exercice } = useExercice();

  // Fetch all ref_variables
  const { data: variables = [], isLoading: loadingVariables } = useQuery({
    queryKey: ["ref-variables"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ref_variables")
        .select("*")
        .eq("actif", true)
        .order("code_variable");
      if (error) throw error;
      return data as RefVariable[];
    },
  });

  // Fetch link types with feature flags
  const { data: linkTypes = [], isLoading: loadingLinkTypes } = useQuery({
    queryKey: ["lambda-link-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lambda_link_types")
        .select("*")
        .order("ordre");
      if (error) throw error;
      return data as LambdaLinkType[];
    },
  });

  // Fetch active links for current exercise
  const { data: links = [], isLoading: loadingLinks } = useQuery({
    queryKey: ["lambda-links", exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lambda_links")
        .select("*")
        .eq("exercice", exercice)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as LambdaLink[];
    },
    enabled: !!exercice,
  });

  // Get link statistics
  const linkStats = {
    total: links.length,
    ok: links.filter(l => l.statut_sync === 'ok').length,
    aSync: links.filter(l => l.statut_sync === 'a_sync').length,
    erreur: links.filter(l => l.statut_sync === 'erreur').length,
  };

  // Create a new variable
  const createVariable = useMutation({
    mutationFn: async (variable: Omit<RefVariable, 'id'>) => {
      const { data, error } = await supabase
        .from("ref_variables")
        .insert(variable)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ref-variables"] });
      toast.success("Variable créée");
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Update a variable
  const updateVariable = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RefVariable> & { id: string }) => {
      const { data, error } = await supabase
        .from("ref_variables")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ref-variables"] });
      toast.success("Variable mise à jour");
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Toggle link type activation (feature flag)
  const toggleLinkType = useMutation({
    mutationFn: async ({ id, actif }: { id: string; actif: boolean }) => {
      const { data, error } = await supabase
        .from("lambda_link_types")
        .update({ actif })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["lambda-link-types"] });
      toast.success(`Lien ${data.libelle} ${data.actif ? 'activé' : 'désactivé'}`);
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Create a lambda link
  const createLink = useMutation({
    mutationFn: async (params: {
      source_table: string;
      source_id: string;
      cible_table: string;
      cible_id?: string;
      mapping_json?: Record<string, string>;
      type_lien?: string;
    }) => {
      const { data, error } = await supabase
        .from("lambda_links")
        .insert({
          exercice,
          source_table: params.source_table,
          source_id: params.source_id,
          cible_table: params.cible_table,
          cible_id: params.cible_id || null,
          mapping_json: params.mapping_json || {},
          type_lien: params.type_lien || 'auto',
          statut_sync: params.cible_id ? 'ok' : 'a_sync',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lambda-links", exercice] });
      toast.success("Lien créé");
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Sync a link (verify source/target existence)
  const syncLink = useMutation({
    mutationFn: async (linkId: string) => {
      const { data, error } = await supabase.rpc("sync_lambda_link", {
        p_link_id: linkId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (success) => {
      queryClient.invalidateQueries({ queryKey: ["lambda-links", exercice] });
      if (success) {
        toast.success("Lien synchronisé");
      } else {
        toast.error("Erreur de synchronisation");
      }
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Repair a broken link (update source or target)
  const repairLink = useMutation({
    mutationFn: async ({ linkId, newSourceId, newCibleId }: { 
      linkId: string; 
      newSourceId?: string; 
      newCibleId?: string; 
    }) => {
      const updates: Record<string, unknown> = { 
        statut_sync: 'a_sync',
        erreur_detail: null,
      };
      if (newSourceId) updates.source_id = newSourceId;
      if (newCibleId) updates.cible_id = newCibleId;

      const { data, error } = await supabase
        .from("lambda_links")
        .update(updates)
        .eq("id", linkId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lambda-links", exercice] });
      toast.success("Lien réparé");
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Auto-suggest mapping between source and target tables
  const suggestMapping = (sourceTable: string, cibleTable: string): MappingSuggestion[] => {
    const suggestions: MappingSuggestion[] = [];
    
    // Get link type default mapping
    const linkType = linkTypes.find(
      lt => lt.source_table === sourceTable && lt.cible_table === cibleTable
    );
    
    if (linkType?.default_mapping) {
      Object.entries(linkType.default_mapping).forEach(([source, cible]) => {
        // Find matching variable
        const variable = variables.find(v => 
          v.code_variable === source || 
          v.tables_concernees?.includes(sourceTable)
        );
        
        suggestions.push({
          source_field: source,
          cible_field: cible as string,
          variable_code: variable?.code_variable || null,
          confidence: 'exact',
        });
      });
    }
    
    // Add common fields that might match
    const commonFields = ['exercice', 'direction_id', 'created_by'];
    commonFields.forEach(field => {
      if (!suggestions.find(s => s.source_field === field)) {
        suggestions.push({
          source_field: field,
          cible_field: field,
          variable_code: field,
          confidence: 'similar',
        });
      }
    });
    
    return suggestions;
  };

  // Get source data for pre-fill
  const getSourceData = async (sourceTable: string, sourceId: string) => {
    const { data, error } = await supabase
      .from(sourceTable as 'notes_dg' | 'budget_engagements' | 'budget_liquidations' | 'marches' | 'expressions_besoin')
      .select("*")
      .eq("id", sourceId)
      .single();
    
    if (error) {
      console.error("Error fetching source data:", error);
      return null;
    }
    return data;
  };

  // Apply mapping to get pre-filled data
  const applyMapping = async (
    sourceTable: string, 
    sourceId: string, 
    mapping: Record<string, string>
  ): Promise<Record<string, unknown>> => {
    const sourceData = await getSourceData(sourceTable, sourceId);
    if (!sourceData) return {};

    const preFilled: Record<string, unknown> = {};
    Object.entries(mapping).forEach(([sourceField, cibleField]) => {
      if (sourceData[sourceField] !== undefined) {
        preFilled[cibleField] = sourceData[sourceField];
      }
    });
    
    // Add source reference
    preFilled[`${sourceTable.replace('budget_', '').replace('s', '')}_id`] = sourceId;
    
    return preFilled;
  };

  return {
    // Data
    variables,
    linkTypes,
    links,
    linkStats,
    
    // Loading states
    loadingVariables,
    loadingLinkTypes,
    loadingLinks,
    
    // Mutations
    createVariable,
    updateVariable,
    toggleLinkType,
    createLink,
    syncLink,
    repairLink,
    
    // Helpers
    suggestMapping,
    getSourceData,
    applyMapping,
  };
}
