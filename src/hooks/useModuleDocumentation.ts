import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ModuleDocumentation {
  id: string;
  module_key: string;
  module_label: string | null;
  objectif: string | null;
  perimetre: string | null;
  tables_utilisees: string[];
  champs_cles: string[];
  statuts_workflow: string[];
  regles_metier: string | null;
  cas_limites: string | null;
  controles: { label: string; checked: boolean }[];
  dependances: string[];
  version: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export function useModuleDocumentation() {
  const queryClient = useQueryClient();

  const { data: modules, isLoading, error } = useQuery({
    queryKey: ["module-documentation"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("module_documentation")
        .select("*")
        .order("module_key");
      
      if (error) throw error;
      return data as ModuleDocumentation[];
    },
  });

  const updateModuleMutation = useMutation({
    mutationFn: async (module: Partial<ModuleDocumentation> & { id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("module_documentation")
        .update({
          ...module,
          updated_at: new Date().toISOString(),
          updated_by: user?.id,
        })
        .eq("id", module.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module-documentation"] });
      toast.success("Documentation mise à jour");
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour: " + error.message);
    },
  });

  const generateDraftMutation = useMutation({
    mutationFn: async (moduleKey: string) => {
      // Récupérer les champs depuis data_dictionary
      const { data: dictData } = await supabase
        .from("data_dictionary")
        .select("table_name, field_name, label_fr, type_donnee")
        .eq("module", moduleKey);
      
      const tables = [...new Set(dictData?.map(d => d.table_name) || [])];
      const champs = dictData?.map(d => ({
        table: d.table_name,
        field: d.field_name,
        label: d.label_fr,
        type: d.type_donnee
      })) || [];

      const { error } = await supabase
        .from("module_documentation")
        .update({
          tables_utilisees: tables,
          champs_cles: champs,
          updated_at: new Date().toISOString(),
        })
        .eq("module_key", moduleKey);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module-documentation"] });
      toast.success("Brouillon généré depuis le dictionnaire");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  return {
    modules,
    isLoading,
    error,
    updateModule: updateModuleMutation.mutate,
    generateDraft: generateDraftMutation.mutate,
    isUpdating: updateModuleMutation.isPending,
    isGenerating: generateDraftMutation.isPending,
  };
}
