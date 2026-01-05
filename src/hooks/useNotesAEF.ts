import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";

export interface NoteAEF {
  id: string;
  numero: string | null;
  exercice: number | null;
  direction_id: string | null;
  objet: string;
  contenu: string | null;
  priorite: string | null;
  montant_estime: number | null;
  statut: string | null;
  rejection_reason: string | null;
  motif_differe: string | null;
  date_differe: string | null;
  deadline_correction: string | null;
  differe_by: string | null;
  validated_by: string | null;
  validated_at: string | null;
  submitted_at: string | null;
  imputed_at: string | null;
  imputed_by: string | null;
  budget_line_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  direction?: { id: string; label: string; sigle: string | null };
  created_by_profile?: { id: string; first_name: string | null; last_name: string | null };
  imputed_by_profile?: { id: string; first_name: string | null; last_name: string | null };
  budget_line?: { id: string; code: string; label: string };
}

export function useNotesAEF() {
  const { exercice } = useExercice();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();

  // Fetch all notes AEF for current exercice
  const { data: notes = [], isLoading, refetch } = useQuery({
    queryKey: ["notes-aef", exercice],
    queryFn: async () => {
      let query = supabase
        .from("notes_dg")
        .select(`
          *,
          direction:directions(id, label, sigle),
          created_by_profile:profiles!notes_dg_created_by_fkey(id, first_name, last_name),
          imputed_by_profile:profiles!notes_dg_imputed_by_fkey(id, first_name, last_name),
          budget_line:budget_lines(id, code, label)
        `)
        .order("created_at", { ascending: false });

      if (exercice) {
        query = query.eq("exercice", exercice);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as NoteAEF[];
    },
    enabled: !!exercice,
  });

  // Fetch directions
  const { data: directions = [] } = useQuery({
    queryKey: ["directions-active-aef"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("directions")
        .select("id, code, label, sigle")
        .eq("est_active", true)
        .order("label");
      if (error) throw error;
      return data;
    },
  });

  // Fetch budget lines for imputation
  const { data: budgetLines = [] } = useQuery({
    queryKey: ["budget-lines-for-imputation", exercice],
    queryFn: async () => {
      let query = supabase
        .from("budget_lines")
        .select("id, code, label, dotation_initiale")
        .eq("is_active", true)
        .order("code");

      if (exercice) {
        query = query.eq("exercice", exercice);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!exercice,
  });

  // Create note
  const createMutation = useMutation({
    mutationFn: async (noteData: Partial<NoteAEF>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from("notes_dg")
        .insert([{
          objet: noteData.objet!,
          contenu: noteData.contenu,
          direction_id: noteData.direction_id,
          priorite: noteData.priorite || "normale",
          montant_estime: noteData.montant_estime || 0,
          exercice: exercice || new Date().getFullYear(),
          created_by: user.id,
          statut: "brouillon",
        }])
        .select()
        .single();

      if (error) throw error;

      await logAction({
        entityType: "note_aef",
        entityId: data.id,
        action: "create",
        newValues: data,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes-aef"] });
      toast({ title: "Note AEF créée avec succès" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  // Update note
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<NoteAEF> & { id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data: oldData } = await supabase.from("notes_dg").select("*").eq("id", id).single();

      const { data, error } = await supabase
        .from("notes_dg")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      await logAction({
        entityType: "note_aef",
        entityId: id,
        action: "update",
        oldValues: oldData,
        newValues: data,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes-aef"] });
      toast({ title: "Note AEF mise à jour" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  // Submit note
  const submitMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from("notes_dg")
        .update({
          statut: "soumis",
          submitted_at: new Date().toISOString(),
        })
        .eq("id", noteId)
        .select()
        .single();

      if (error) throw error;

      await logAction({
        entityType: "note_aef",
        entityId: noteId,
        action: "validate",
        newValues: { statut: "soumis" },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes-aef"] });
      toast({ title: "Note soumise pour validation" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  // Validate note - devient automatiquement "validée à imputer"
  const validateMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from("notes_dg")
        .update({
          statut: "valide",
          validated_by: user.id,
          validated_at: new Date().toISOString(),
        })
        .eq("id", noteId)
        .select()
        .single();

      if (error) throw error;

      await logAction({
        entityType: "note_aef",
        entityId: noteId,
        action: "validate",
        newValues: { statut: "valide" },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes-aef"] });
      toast({ title: "Note validée - disponible pour imputation" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  // Reject note
  const rejectMutation = useMutation({
    mutationFn: async ({ noteId, motif }: { noteId: string; motif: string }) => {
      if (!motif?.trim()) throw new Error("Le motif de rejet est obligatoire");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from("notes_dg")
        .update({
          statut: "rejete",
          rejection_reason: motif,
        })
        .eq("id", noteId)
        .select()
        .single();

      if (error) throw error;

      await logAction({
        entityType: "note_aef",
        entityId: noteId,
        action: "reject",
        newValues: { statut: "rejete", motif },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes-aef"] });
      toast({ title: "Note rejetée" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  // Defer note
  const deferMutation = useMutation({
    mutationFn: async ({
      noteId,
      motif,
      deadlineCorrection,
    }: {
      noteId: string;
      motif: string;
      deadlineCorrection?: string;
    }) => {
      if (!motif?.trim()) throw new Error("Le motif de report est obligatoire");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from("notes_dg")
        .update({
          statut: "differe",
          motif_differe: motif,
          date_differe: new Date().toISOString(),
          deadline_correction: deadlineCorrection || null,
          differe_by: user.id,
        })
        .eq("id", noteId)
        .select()
        .single();

      if (error) throw error;

      await logAction({
        entityType: "note_aef",
        entityId: noteId,
        action: "archive",
        newValues: { statut: "differe", motif },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes-aef"] });
      toast({ title: "Note différée" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  // Impute note to budget line
  const imputeMutation = useMutation({
    mutationFn: async ({
      noteId,
      budgetLineId,
    }: {
      noteId: string;
      budgetLineId: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from("notes_dg")
        .update({
          statut: "impute",
          budget_line_id: budgetLineId,
          imputed_by: user.id,
          imputed_at: new Date().toISOString(),
        })
        .eq("id", noteId)
        .select()
        .single();

      if (error) throw error;

      await logAction({
        entityType: "note_aef",
        entityId: noteId,
        action: "validate",
        newValues: { statut: "impute", budget_line_id: budgetLineId },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes-aef"] });
      toast({ title: "Note imputée avec succès" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  // Delete note
  const deleteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase.from("notes_dg").delete().eq("id", noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes-aef"] });
      toast({ title: "Note supprimée" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  // Filter notes by status
  const notesByStatus = {
    brouillon: notes.filter((n) => n.statut === "brouillon"),
    soumis: notes.filter((n) => n.statut === "soumis"),
    a_valider: notes.filter((n) => n.statut === "soumis" || n.statut === "a_valider"),
    valide: notes.filter((n) => n.statut === "valide"),
    valide_a_imputer: notes.filter((n) => n.statut === "valide" && !n.imputed_at),
    impute: notes.filter((n) => n.statut === "impute"),
    rejete: notes.filter((n) => n.statut === "rejete"),
    differe: notes.filter((n) => n.statut === "differe"),
  };

  return {
    notes,
    notesByStatus,
    isLoading,
    refetch,
    directions,
    budgetLines,
    createNote: createMutation.mutateAsync,
    updateNote: updateMutation.mutateAsync,
    submitNote: submitMutation.mutateAsync,
    validateNote: validateMutation.mutateAsync,
    rejectNote: rejectMutation.mutateAsync,
    deferNote: deferMutation.mutateAsync,
    imputeNote: imputeMutation.mutateAsync,
    deleteNote: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isImputing: imputeMutation.isPending,
  };
}
