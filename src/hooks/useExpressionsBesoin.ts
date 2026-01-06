import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useExercice } from "@/contexts/ExerciceContext";

export interface ExpressionBesoin {
  id: string;
  numero: string | null;
  objet: string;
  description: string | null;
  justification: string | null;
  specifications: string | null;
  calendrier_debut: string | null;
  calendrier_fin: string | null;
  montant_estime: number | null;
  quantite: number | null;
  unite: string | null;
  urgence: string | null;
  statut: string | null;
  numero_lot: number | null;
  intitule_lot: string | null;
  exercice: number | null;
  marche_id: string | null;
  dossier_id: string | null;
  direction_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  validated_at: string | null;
  validated_by: string | null;
  rejection_reason: string | null;
  date_differe: string | null;
  motif_differe: string | null;
  differe_by: string | null;
  deadline_correction: string | null;
  current_validation_step: number | null;
  validation_status: string | null;
  // Joined data
  direction?: { id: string; code: string; label: string; sigle: string | null } | null;
  marche?: {
    id: string;
    numero: string | null;
    objet: string;
    montant: number;
    mode_passation: string;
    prestataire?: { 
      id: string; 
      raison_sociale: string;
    } | null;
  } | null;
  dossier?: {
    id: string;
    numero: string;
    objet: string;
  } | null;
  creator?: { id: string; full_name: string | null } | null;
  validator?: { id: string; full_name: string | null } | null;
}

export interface MarcheValide {
  id: string;
  numero: string | null;
  objet: string;
  montant: number;
  mode_passation: string;
  prestataire?: {
    id: string;
    raison_sociale: string;
  } | null;
}

export const VALIDATION_STEPS = [
  { order: 1, role: "DEMANDEUR", label: "Demandeur" },
  { order: 2, role: "CHEF_SERVICE", label: "Chef de Service" },
  { order: 3, role: "DIRECTEUR", label: "Directeur" },
  { order: 4, role: "CB", label: "Contrôleur Budgétaire" },
];

export const URGENCE_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "urgent", label: "Urgent" },
  { value: "tres_urgent", label: "Très urgent" },
];

export function useExpressionsBesoin() {
  const queryClient = useQueryClient();
  const { exercice } = useExercice();

  // Fetch all expressions de besoin
  const { data: expressions = [], isLoading, error } = useQuery({
    queryKey: ["expressions-besoin", exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expressions_besoin")
        .select(`
          *,
          direction:directions(id, code, label, sigle),
          marche:marches!expressions_besoin_marche_id_fkey(
            id, numero, objet, montant, mode_passation,
            prestataire:prestataires(id, raison_sociale)
          ),
          dossier:dossiers(id, numero, objet),
          creator:profiles!expressions_besoin_created_by_fkey(id, full_name),
          validator:profiles!expressions_besoin_validated_by_fkey(id, full_name)
        `)
        .eq("exercice", exercice)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ExpressionBesoin[];
    },
  });

  // Fetch notes imputées disponibles pour créer une EB
  const { data: notesImputees = [] } = useQuery({
    queryKey: ["notes-imputees-disponibles", exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes_dg")
        .select(`
          id, numero, objet, montant_estime, budget_line_id, direction_id,
          direction:directions(label, sigle),
          budget_line:budget_lines(id, code, label)
        `)
        .eq("statut", "impute")
        .eq("exercice", exercice || new Date().getFullYear())
        .order("imputed_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!exercice,
  });

  // Fetch marchés attribués (ready for execution) without expressions
  const { data: marchesValides = [] } = useQuery({
    queryKey: ["marches-valides-pour-expression", exercice],
    queryFn: async () => {
      // Get marchés with statuses that allow expressions de besoin
      // Statuts valides: attribue, valide, validé, en_cours, en_execution
      const { data: marches, error } = await supabase
        .from("marches")
        .select(`
          id, numero, objet, montant, mode_passation,
          prestataire:prestataires(id, raison_sociale)
        `)
        .in("statut", ["attribue", "valide", "validé", "en_cours", "en_execution"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return marches as MarcheValide[];
    },
  });

  // Create expression de besoin
  const createMutation = useMutation({
    mutationFn: async (data: {
      marche_id: string;
      objet: string;
      description: string | null;
      justification: string | null;
      specifications: string | null;
      calendrier_debut: string | null;
      calendrier_fin: string | null;
      montant_estime: number | null;
      urgence: string;
      numero_lot?: number | null;
      intitule_lot?: string | null;
    }) => {
      const { data: result, error } = await supabase
        .from("expressions_besoin")
        .insert({
          ...data,
          exercice,
          statut: "brouillon",
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expressions-besoin"] });
      toast.success("Expression de besoin créée");
    },
    onError: (error) => {
      toast.error("Erreur lors de la création: " + error.message);
    },
  });

  // Update expression de besoin
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<ExpressionBesoin>) => {
      const { error } = await supabase
        .from("expressions_besoin")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expressions-besoin"] });
      toast.success("Expression de besoin mise à jour");
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour: " + error.message);
    },
  });

  // Submit expression
  const submitMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("expressions_besoin")
        .update({
          statut: "soumis",
          submitted_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expressions-besoin"] });
      toast.success("Expression de besoin soumise");
    },
    onError: (error) => {
      toast.error("Erreur lors de la soumission: " + error.message);
    },
  });

  // Validate expression
  const validateMutation = useMutation({
    mutationFn: async ({ id, comments }: { id: string; comments?: string }) => {
      const { error } = await supabase
        .from("expressions_besoin")
        .update({
          statut: "validé",
          validated_at: new Date().toISOString(),
          rejection_reason: null,
          date_differe: null,
          motif_differe: null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expressions-besoin"] });
      toast.success("Expression de besoin validée");
    },
    onError: (error) => {
      toast.error("Erreur lors de la validation: " + error.message);
    },
  });

  // Reject expression
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase
        .from("expressions_besoin")
        .update({
          statut: "rejeté",
          rejection_reason: reason,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expressions-besoin"] });
      toast.success("Expression de besoin rejetée");
    },
    onError: (error) => {
      toast.error("Erreur lors du rejet: " + error.message);
    },
  });

  // Defer expression
  const deferMutation = useMutation({
    mutationFn: async ({
      id,
      motif,
      dateReprise,
    }: {
      id: string;
      motif: string;
      dateReprise?: string;
    }) => {
      const { error } = await supabase
        .from("expressions_besoin")
        .update({
          statut: "différé",
          motif_differe: motif,
          date_differe: new Date().toISOString(),
          deadline_correction: dateReprise || null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expressions-besoin"] });
      toast.success("Expression de besoin différée");
    },
    onError: (error) => {
      toast.error("Erreur lors du report: " + error.message);
    },
  });

  // Resume deferred expression
  const resumeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("expressions_besoin")
        .update({
          statut: "soumis",
          date_differe: null,
          motif_differe: null,
          deadline_correction: null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expressions-besoin"] });
      toast.success("Expression de besoin reprise");
    },
    onError: (error) => {
      toast.error("Erreur lors de la reprise: " + error.message);
    },
  });

  // Delete expression
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("expressions_besoin")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expressions-besoin"] });
      toast.success("Expression de besoin supprimée");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression: " + error.message);
    },
  });

  // Filter helpers
  const expressionsAValider = expressions.filter((e) => e.statut === "soumis");
  const expressionsValidees = expressions.filter((e) => e.statut === "validé");
  const expressionsRejetees = expressions.filter((e) => e.statut === "rejeté");
  const expressionsDifferees = expressions.filter((e) => e.statut === "différé");

  return {
    expressions,
    expressionsAValider,
    expressionsValidees,
    expressionsRejetees,
    expressionsDifferees,
    marchesValides,
    notesImputees,
    isLoading,
    error,
    createExpression: createMutation.mutateAsync,
    updateExpression: updateMutation.mutateAsync,
    submitExpression: submitMutation.mutateAsync,
    validateExpression: validateMutation.mutateAsync,
    rejectExpression: rejectMutation.mutateAsync,
    deferExpression: deferMutation.mutateAsync,
    resumeExpression: resumeMutation.mutateAsync,
    deleteExpression: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isSubmitting: submitMutation.isPending,
    isValidating: validateMutation.isPending,
  };
}
