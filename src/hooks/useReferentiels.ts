import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Types
export interface DataDictionaryEntry {
  id: string;
  module: string;
  table_name: string;
  field_name: string;
  label_fr: string;
  description: string | null;
  type_donnee: string;
  obligatoire: boolean;
  regles_validation: string | null;
  exemple: string | null;
  source: string | null;
  version: string;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface CodificationRule {
  id: string;
  code_type: string;
  format: string;
  separateur: string;
  ordre_composants: string[];
  longueur_seq: number;
  prefixe: string | null;
  exemple: string | null;
  description: string | null;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface ModuleRegistry {
  id: string;
  module_key: string;
  module_name: string;
  description: string | null;
  tables_concernees: string[];
  variables_entree: string[];
  variables_sortie: string[];
  dependances: string[];
  owner_role: string | null;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

// Hook principal
export function useReferentiels() {
  const queryClient = useQueryClient();

  // Dictionnaire des variables
  const { data: dictionary = [], isLoading: loadingDictionary } = useQuery({
    queryKey: ["data_dictionary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("data_dictionary")
        .select("*")
        .order("module", { ascending: true })
        .order("table_name", { ascending: true });
      if (error) throw error;
      return data as DataDictionaryEntry[];
    },
  });

  // Règles de codification
  const { data: codificationRules = [], isLoading: loadingRules } = useQuery({
    queryKey: ["ref_codification_rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ref_codification_rules")
        .select("*")
        .order("code_type", { ascending: true });
      if (error) throw error;
      return data as CodificationRule[];
    },
  });

  // Registre des modules
  const { data: modules = [], isLoading: loadingModules } = useQuery({
    queryKey: ["module_registry"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("module_registry")
        .select("*")
        .order("module_key", { ascending: true });
      if (error) throw error;
      return data as ModuleRegistry[];
    },
  });

  // Mutations - Dictionnaire
  const addDictionaryEntry = useMutation({
    mutationFn: async (entry: Omit<DataDictionaryEntry, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase.from("data_dictionary").insert(entry).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data_dictionary"] });
      toast.success("Variable ajoutée au dictionnaire");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateDictionaryEntry = useMutation({
    mutationFn: async ({ id, ...entry }: Partial<DataDictionaryEntry> & { id: string }) => {
      const { data, error } = await supabase.from("data_dictionary").update(entry).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data_dictionary"] });
      toast.success("Variable mise à jour");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteDictionaryEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("data_dictionary").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data_dictionary"] });
      toast.success("Variable supprimée");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Mutations - Codification
  const addCodificationRule = useMutation({
    mutationFn: async (rule: Omit<CodificationRule, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase.from("ref_codification_rules").insert(rule).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ref_codification_rules"] });
      toast.success("Règle de codification ajoutée");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateCodificationRule = useMutation({
    mutationFn: async ({ id, ...rule }: Partial<CodificationRule> & { id: string }) => {
      const { data, error } = await supabase.from("ref_codification_rules").update(rule).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ref_codification_rules"] });
      toast.success("Règle mise à jour");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteCodificationRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ref_codification_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ref_codification_rules"] });
      toast.success("Règle supprimée");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Export dictionnaire CSV
  const exportDictionaryCSV = () => {
    const headers = ["Module", "Table", "Champ", "Libellé", "Description", "Type", "Obligatoire", "Exemple", "Source"];
    const rows = dictionary.map((d) => [
      d.module,
      d.table_name,
      d.field_name,
      d.label_fr,
      d.description || "",
      d.type_donnee,
      d.obligatoire ? "Oui" : "Non",
      d.exemple || "",
      d.source || "",
    ]);

    const csvContent = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dictionnaire_variables_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Dictionnaire exporté");
  };

  // Statut du socle
  const socleStatus = {
    dictionnaireOK: dictionary.length >= 5,
    codificationOK: codificationRules.length >= 2,
    variablesConnexionOK: true, // Toujours OK car données initiales insérées
  };

  return {
    dictionary,
    codificationRules,
    modules,
    loadingDictionary,
    loadingRules,
    loadingModules,
    addDictionaryEntry,
    updateDictionaryEntry,
    deleteDictionaryEntry,
    addCodificationRule,
    updateCodificationRule,
    deleteCodificationRule,
    exportDictionaryCSV,
    socleStatus,
  };
}
