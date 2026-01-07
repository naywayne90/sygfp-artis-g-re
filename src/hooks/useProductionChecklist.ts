import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { toast } from "sonner";

export interface ChecklistItem {
  id: string;
  exercice: number;
  check_key: string;
  check_label: string;
  check_category: string | null;
  is_checked: boolean;
  checked_at: string | null;
  checked_by: string | null;
  notes: string | null;
  ordre: number;
  created_at: string;
  updated_at: string;
}

export function useProductionChecklist() {
  const { exercice } = useExercice();
  const queryClient = useQueryClient();

  const { data: checklistItems, isLoading, error } = useQuery({
    queryKey: ["production-checklist", exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("production_checklist")
        .select("*")
        .eq("exercice", exercice)
        .order("ordre");
      
      if (error) throw error;
      return data as ChecklistItem[];
    },
    enabled: !!exercice,
  });

  const initChecklistMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("init_production_checklist", {
        p_exercice: exercice,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-checklist", exercice] });
      toast.success("Checklist initialisée pour l'exercice " + exercice);
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const toggleCheckMutation = useMutation({
    mutationFn: async ({ id, isChecked }: { id: string; isChecked: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("production_checklist")
        .update({
          is_checked: isChecked,
          checked_at: isChecked ? new Date().toISOString() : null,
          checked_by: isChecked ? user?.id : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-checklist", exercice] });
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from("production_checklist")
        .update({
          notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-checklist", exercice] });
      toast.success("Note mise à jour");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Calculer les statistiques
  const stats = {
    total: checklistItems?.length || 0,
    checked: checklistItems?.filter(i => i.is_checked).length || 0,
    percentage: checklistItems?.length 
      ? Math.round((checklistItems.filter(i => i.is_checked).length / checklistItems.length) * 100)
      : 0,
  };

  // Grouper par catégorie
  const groupedItems = checklistItems?.reduce((acc, item) => {
    const cat = item.check_category || "Autre";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>) || {};

  return {
    checklistItems,
    groupedItems,
    stats,
    isLoading,
    error,
    initChecklist: initChecklistMutation.mutate,
    toggleCheck: toggleCheckMutation.mutate,
    updateNotes: updateNotesMutation.mutate,
    isInitializing: initChecklistMutation.isPending,
  };
}
