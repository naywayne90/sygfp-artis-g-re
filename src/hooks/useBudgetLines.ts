import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { toast } from "sonner";

export interface BudgetLineWithRelations {
  id: string;
  code: string;
  label: string;
  level: string;
  exercice: number;
  dotation_initiale: number;
  direction_id: string | null;
  os_id: string | null;
  mission_id: string | null;
  action_id: string | null;
  activite_id: string | null;
  sous_activite_id: string | null;
  nbe_id: string | null;
  sysco_id: string | null;
  source_financement: string | null;
  commentaire: string | null;
  statut: string | null;
  is_active: boolean | null;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  direction?: { label: string; code: string } | null;
  objectif_strategique?: { libelle: string; code: string } | null;
  mission?: { libelle: string; code: string } | null;
  action?: { libelle: string; code: string } | null;
  activite?: { libelle: string; code: string } | null;
  sous_activite?: { libelle: string; code: string } | null;
  nomenclature_nbe?: { libelle: string; code: string } | null;
  plan_comptable_sysco?: { libelle: string; code: string } | null;
}

export interface BudgetLineFilters {
  direction_id?: string;
  os_id?: string;
  nbe_code?: string;
  sysco_code?: string;
  keyword?: string;
  statut?: string;
}

export function useBudgetLines(filters?: BudgetLineFilters) {
  const { exercice } = useExercice();
  const queryClient = useQueryClient();

  const { data: budgetLines, isLoading, error } = useQuery({
    queryKey: ["budget-lines", exercice, filters],
    queryFn: async () => {
      let query = supabase
        .from("budget_lines")
        .select(`
          *,
          direction:directions(label, code),
          objectif_strategique:objectifs_strategiques(libelle, code),
          mission:missions(libelle, code),
          action:actions(libelle, code),
          activite:activites(libelle, code),
          sous_activite:sous_activites(libelle, code),
          nomenclature_nbe(libelle, code),
          plan_comptable_sysco(libelle, code)
        `)
        .eq("exercice", exercice || new Date().getFullYear())
        .order("code");

      if (filters?.direction_id) {
        query = query.eq("direction_id", filters.direction_id);
      }
      if (filters?.os_id) {
        query = query.eq("os_id", filters.os_id);
      }
      if (filters?.statut) {
        query = query.eq("statut", filters.statut);
      }
      if (filters?.keyword) {
        query = query.or(`label.ilike.%${filters.keyword}%,code.ilike.%${filters.keyword}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BudgetLineWithRelations[];
    },
    enabled: !!exercice,
  });

  // Get engagements sum for a budget line
  const getEngagements = async (budgetLineId: string) => {
    const { data, error } = await supabase
      .from("budget_engagements")
      .select("montant")
      .eq("budget_line_id", budgetLineId)
      .eq("exercice", exercice || new Date().getFullYear());

    if (error) throw error;
    return data?.reduce((sum, e) => sum + (e.montant || 0), 0) || 0;
  };

  // Create budget line
  const createMutation = useMutation({
    mutationFn: async (data: Partial<BudgetLineWithRelations>) => {
      const insertData = {
        code: data.code || "",
        label: data.label || "",
        level: data.level || "ligne",
        dotation_initiale: data.dotation_initiale || 0,
        direction_id: data.direction_id,
        os_id: data.os_id,
        mission_id: data.mission_id,
        action_id: data.action_id,
        activite_id: data.activite_id,
        sous_activite_id: data.sous_activite_id,
        nbe_id: data.nbe_id,
        sysco_id: data.sysco_id,
        source_financement: data.source_financement,
        commentaire: data.commentaire,
        parent_id: data.parent_id,
        exercice: exercice || new Date().getFullYear(),
      };

      const { error, data: created } = await supabase
        .from("budget_lines")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-lines"] });
      toast.success("Ligne budgétaire créée");
    },
    onError: (error: any) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Update budget line with history
  const updateMutation = useMutation({
    mutationFn: async ({ id, data, reason }: { id: string; data: Partial<BudgetLineWithRelations>; reason?: string }) => {
      // Get current values for history
      const { data: current } = await supabase
        .from("budget_lines")
        .select("*")
        .eq("id", id)
        .single();

      // Update the line
      const { error, data: updated } = await supabase
        .from("budget_lines")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Log history for changed fields
      if (current) {
        const changes = Object.entries(data).filter(
          ([key, value]) => current[key as keyof typeof current] !== value
        );

        for (const [fieldName, newValue] of changes) {
          await supabase.from("budget_line_history").insert({
            budget_line_id: id,
            field_name: fieldName,
            old_value: String(current[fieldName as keyof typeof current] ?? ""),
            new_value: String(newValue ?? ""),
            change_reason: reason,
          });
        }
      }

      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-lines"] });
      toast.success("Ligne budgétaire modifiée");
    },
    onError: (error: any) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Submit for validation
  const submitMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("budget_lines")
        .update({
          statut: "soumis",
          submitted_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-lines"] });
      toast.success("Soumis pour validation");
    },
  });

  // Validate
  const validateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("budget_lines")
        .update({
          statut: "valide",
          validated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-lines"] });
      toast.success("Ligne validée");
    },
  });

  // Reject
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase
        .from("budget_lines")
        .update({
          statut: "rejete",
          rejection_reason: reason,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-lines"] });
      toast.success("Ligne rejetée");
    },
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("budget_lines").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-lines"] });
      toast.success("Ligne supprimée");
    },
  });

  // Calculate totals
  const totals = budgetLines?.reduce(
    (acc, line) => ({
      dotation: acc.dotation + (line.dotation_initiale || 0),
      count: acc.count + 1,
    }),
    { dotation: 0, count: 0 }
  ) || { dotation: 0, count: 0 };

  return {
    budgetLines,
    isLoading,
    error,
    totals,
    getEngagements,
    createBudgetLine: createMutation.mutate,
    updateBudgetLine: updateMutation.mutate,
    submitBudgetLine: submitMutation.mutate,
    validateBudgetLine: validateMutation.mutate,
    rejectBudgetLine: rejectMutation.mutate,
    deleteBudgetLine: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}

export function useCreditTransfers() {
  const { exercice } = useExercice();
  const queryClient = useQueryClient();

  const { data: transfers, isLoading } = useQuery({
    queryKey: ["credit-transfers", exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_transfers")
        .select(`
          *,
          from_line:budget_lines!credit_transfers_from_budget_line_id_fkey(code, label),
          to_line:budget_lines!credit_transfers_to_budget_line_id_fkey(code, label),
          requested_by_profile:profiles!credit_transfers_requested_by_fkey(full_name),
          approved_by_profile:profiles!credit_transfers_approved_by_fkey(full_name)
        `)
        .eq("exercice", exercice || new Date().getFullYear())
        .order("requested_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!exercice,
  });

  const createTransfer = useMutation({
    mutationFn: async (data: {
      from_budget_line_id: string;
      to_budget_line_id: string;
      amount: number;
      motif: string;
    }) => {
      const { error, data: created } = await supabase
        .from("credit_transfers")
        .insert({
          ...data,
          exercice: exercice || new Date().getFullYear(),
          status: "en_attente",
        })
        .select()
        .single();

      if (error) throw error;
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["budget-lines"] });
      toast.success("Demande de virement créée");
    },
    onError: (error: any) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const approveTransfer = useMutation({
    mutationFn: async (id: string) => {
      // Get transfer details
      const { data: transfer } = await supabase
        .from("credit_transfers")
        .select("*")
        .eq("id", id)
        .single();

      if (!transfer) throw new Error("Virement non trouvé");

      // Update budget lines
      const { data: fromLine } = await supabase
        .from("budget_lines")
        .select("dotation_initiale")
        .eq("id", transfer.from_budget_line_id)
        .single();

      const { data: toLine } = await supabase
        .from("budget_lines")
        .select("dotation_initiale")
        .eq("id", transfer.to_budget_line_id)
        .single();

      if (!fromLine || !toLine) throw new Error("Lignes budgétaires non trouvées");

      // Check available balance
      if (fromLine.dotation_initiale < transfer.amount) {
        throw new Error("Solde insuffisant sur la ligne source");
      }

      // Update from line
      await supabase
        .from("budget_lines")
        .update({ dotation_initiale: fromLine.dotation_initiale - transfer.amount })
        .eq("id", transfer.from_budget_line_id);

      // Update to line
      await supabase
        .from("budget_lines")
        .update({ dotation_initiale: toLine.dotation_initiale + transfer.amount })
        .eq("id", transfer.to_budget_line_id);

      // Update transfer status
      const { error } = await supabase
        .from("credit_transfers")
        .update({
          status: "approuve",
          approved_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["budget-lines"] });
      toast.success("Virement approuvé");
    },
    onError: (error: any) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const rejectTransfer = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase
        .from("credit_transfers")
        .update({
          status: "rejete",
          rejection_reason: reason,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-transfers"] });
      toast.success("Virement rejeté");
    },
  });

  return {
    transfers,
    isLoading,
    createTransfer: createTransfer.mutate,
    approveTransfer: approveTransfer.mutate,
    rejectTransfer: rejectTransfer.mutate,
    isCreating: createTransfer.isPending,
  };
}