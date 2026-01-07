import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { toast } from "sonner";

export interface BudgetTransfer {
  id: string;
  code: string | null;
  exercice: number | null;
  type_transfer: string | null;
  status: string | null;
  amount: number;
  motif: string;
  justification_renforcee: string | null;
  from_budget_line_id: string | null;
  to_budget_line_id: string;
  requested_at: string;
  requested_by: string | null;
  approved_at: string | null;
  approved_by: string | null;
  rejection_reason: string | null;
  executed_at: string | null;
  executed_by: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancel_reason: string | null;
  from_dotation_avant: number | null;
  from_dotation_apres: number | null;
  from_disponible_avant: number | null;
  from_disponible_apres: number | null;
  to_dotation_avant: number | null;
  to_dotation_apres: number | null;
  to_disponible_avant: number | null;
  to_disponible_apres: number | null;
  from_line?: { code: string; label: string; dotation_initiale: number } | null;
  to_line?: { code: string; label: string; dotation_initiale: number } | null;
  requested_by_profile?: { full_name: string } | null;
  approved_by_profile?: { full_name: string } | null;
  executed_by_profile?: { full_name: string } | null;
}

export interface BudgetTransferFilters {
  status?: string;
  type_transfer?: string;
  direction_id?: string;
}

export interface BudgetHistory {
  id: string;
  budget_line_id: string;
  event_type: string;
  delta: number;
  dotation_avant: number | null;
  dotation_apres: number | null;
  disponible_avant: number | null;
  disponible_apres: number | null;
  ref_code: string | null;
  ref_id: string | null;
  commentaire: string | null;
  created_by: string | null;
  created_at: string;
  created_by_profile?: { full_name: string } | null;
}

export function useBudgetTransfers(filters?: BudgetTransferFilters) {
  const { exercice } = useExercice();
  const queryClient = useQueryClient();

  // Fetch all transfers
  const { data: transfers, isLoading } = useQuery({
    queryKey: ["budget-transfers", exercice, filters],
    queryFn: async () => {
      let query = supabase
        .from("credit_transfers")
        .select(`
          *,
          from_line:budget_lines!credit_transfers_from_budget_line_id_fkey(code, label, dotation_initiale),
          to_line:budget_lines!credit_transfers_to_budget_line_id_fkey(code, label, dotation_initiale),
          requested_by_profile:profiles!credit_transfers_requested_by_fkey(full_name),
          approved_by_profile:profiles!credit_transfers_approved_by_fkey(full_name)
        `)
        .eq("exercice", exercice || new Date().getFullYear())
        .order("requested_at", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.type_transfer) {
        query = query.eq("type_transfer", filters.type_transfer);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BudgetTransfer[];
    },
    enabled: !!exercice,
  });

  // Stats for dashboard
  const stats = {
    pending: transfers?.filter(t => t.status === "en_attente" || t.status === "soumis").length || 0,
    validated: transfers?.filter(t => t.status === "approuve" || t.status === "valide").length || 0,
    executed: transfers?.filter(t => t.status === "execute").length || 0,
    executedThisMonth: transfers?.filter(t => {
      if (t.status !== "execute" || !t.executed_at) return false;
      const execDate = new Date(t.executed_at);
      const now = new Date();
      return execDate.getMonth() === now.getMonth() && execDate.getFullYear() === now.getFullYear();
    }).length || 0,
    totalExecutedAmount: transfers?.filter(t => t.status === "execute")
      .reduce((sum, t) => sum + t.amount, 0) || 0,
  };

  // Create transfer
  const createMutation = useMutation({
    mutationFn: async (data: {
      type_transfer: "virement" | "ajustement";
      from_budget_line_id?: string | null;
      to_budget_line_id: string;
      amount: number;
      motif: string;
      justification_renforcee?: string;
    }) => {
      // Generate code
      const { data: code } = await supabase.rpc("generate_transfer_code", {
        p_exercice: exercice || new Date().getFullYear(),
        p_type: data.type_transfer,
      });

      const { error, data: created } = await supabase
        .from("credit_transfers")
        .insert({
          code,
          type_transfer: data.type_transfer,
          from_budget_line_id: data.from_budget_line_id || null,
          to_budget_line_id: data.to_budget_line_id,
          amount: data.amount,
          motif: data.motif,
          justification_renforcee: data.justification_renforcee,
          exercice: exercice || new Date().getFullYear(),
          status: "brouillon",
        })
        .select()
        .single();

      if (error) throw error;

      // Log audit
      await supabase.from("audit_logs").insert({
        entity_type: "credit_transfer",
        entity_id: created.id,
        action: "transfer_created",
        new_values: { code, type: data.type_transfer, amount: data.amount },
        exercice: exercice || new Date().getFullYear(),
      });

      return created;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["budget-transfers"] });
      toast.success(`${data.type_transfer === "ajustement" ? "Ajustement" : "Virement"} créé: ${data.code}`);
    },
    onError: (error: any) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Submit for validation
  const submitMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("credit_transfers")
        .update({ status: "soumis" })
        .eq("id", id);

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        entity_type: "credit_transfer",
        entity_id: id,
        action: "transfer_submitted",
        exercice: exercice || new Date().getFullYear(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-transfers"] });
      toast.success("Demande soumise pour validation");
    },
  });

  // Validate
  const validateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("credit_transfers")
        .update({
          status: "valide",
          approved_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        entity_type: "credit_transfer",
        entity_id: id,
        action: "transfer_validated",
        exercice: exercice || new Date().getFullYear(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-transfers"] });
      toast.success("Virement validé");
    },
  });

  // Reject
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase
        .from("credit_transfers")
        .update({
          status: "rejete",
          rejection_reason: reason,
        })
        .eq("id", id);

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        entity_type: "credit_transfer",
        entity_id: id,
        action: "transfer_rejected",
        new_values: { reason },
        exercice: exercice || new Date().getFullYear(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-transfers"] });
      toast.success("Virement rejeté");
    },
  });

  // Execute
  const executeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: result, error } = await supabase.rpc("execute_credit_transfer", {
        p_transfer_id: id,
      });

      if (error) throw error;
      const res = result as { success: boolean; error?: string; code?: string };
      if (!res?.success) throw new Error(res?.error || "Erreur d'exécution");

      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["budget-lines"] });
      toast.success("Virement exécuté avec succès");
    },
    onError: (error: any) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Cancel
  const cancelMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase
        .from("credit_transfers")
        .update({
          status: "annule",
          cancelled_at: new Date().toISOString(),
          cancel_reason: reason,
        })
        .eq("id", id);

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        entity_type: "credit_transfer",
        entity_id: id,
        action: "transfer_cancelled",
        new_values: { reason },
        exercice: exercice || new Date().getFullYear(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-transfers"] });
      toast.success("Virement annulé");
    },
  });

  // Update draft
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<BudgetTransfer>;
    }) => {
      const { error } = await supabase
        .from("credit_transfers")
        .update(data)
        .eq("id", id)
        .eq("status", "brouillon"); // Only allow updating drafts

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-transfers"] });
      toast.success("Modification enregistrée");
    },
  });

  return {
    transfers,
    isLoading,
    stats,
    createTransfer: createMutation.mutate,
    submitTransfer: submitMutation.mutate,
    validateTransfer: validateMutation.mutate,
    rejectTransfer: rejectMutation.mutate,
    executeTransfer: executeMutation.mutate,
    cancelTransfer: cancelMutation.mutate,
    updateTransfer: updateMutation.mutate,
    isCreating: createMutation.isPending,
    isExecuting: executeMutation.isPending,
  };
}

// Hook to get budget history for a specific line
export function useBudgetHistory(budgetLineId?: string) {
  const { data: history, isLoading } = useQuery({
    queryKey: ["budget-history", budgetLineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budget_history")
        .select(`
          *,
          created_by_profile:profiles!budget_history_created_by_fkey(full_name)
        `)
        .eq("budget_line_id", budgetLineId!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BudgetHistory[];
    },
    enabled: !!budgetLineId,
  });

  return { history, isLoading };
}

// Hook to calculate available balance
export function useBudgetLineAvailable(budgetLineId?: string) {
  const { exercice } = useExercice();

  const { data, isLoading } = useQuery({
    queryKey: ["budget-line-available", budgetLineId, exercice],
    queryFn: async () => {
      // Get line info
      const { data: line } = await supabase
        .from("budget_lines")
        .select("dotation_initiale")
        .eq("id", budgetLineId!)
        .single();

      // Get engaged amount
      const { data: engagements } = await supabase
        .from("budget_engagements")
        .select("montant")
        .eq("budget_line_id", budgetLineId!)
        .in("statut", ["valide", "en_cours"]);

      const dotation = line?.dotation_initiale || 0;
      const engaged = engagements?.reduce((sum, e) => sum + (e.montant || 0), 0) || 0;
      const disponible = dotation - engaged;

      return { dotation, engaged, disponible };
    },
    enabled: !!budgetLineId,
  });

  return { ...data, isLoading };
}
