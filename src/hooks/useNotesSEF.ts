import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";

export interface NoteSEF {
  id: string;
  numero: string | null;
  exercice: number;
  direction_id: string | null;
  demandeur_id: string | null;
  objet: string;
  description: string | null;
  urgence: string | null;
  commentaire: string | null;
  statut: string | null;
  rejection_reason: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  differe_motif: string | null;
  differe_condition: string | null;
  differe_date_reprise: string | null;
  differe_by: string | null;
  differe_at: string | null;
  validated_by: string | null;
  validated_at: string | null;
  submitted_by: string | null;
  submitted_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  direction?: { id: string; label: string; sigle: string | null };
  demandeur?: { id: string; first_name: string | null; last_name: string | null };
  created_by_profile?: { id: string; first_name: string | null; last_name: string | null };
}

export interface NoteSEFHistory {
  id: string;
  note_id: string;
  action: string;
  old_statut: string | null;
  new_statut: string | null;
  commentaire: string | null;
  performed_by: string | null;
  performed_at: string;
  performer?: { first_name: string | null; last_name: string | null };
}

export function useNotesSEF() {
  const { exercice } = useExercice();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();

  // Fetch all notes SEF for current exercice
  const { data: notes = [], isLoading, refetch } = useQuery({
    queryKey: ["notes-sef", exercice],
    queryFn: async () => {
      let query = supabase
        .from("notes_sef")
        .select(`
          *,
          direction:directions(id, label, sigle),
          demandeur:profiles!notes_sef_demandeur_id_fkey(id, first_name, last_name),
          created_by_profile:profiles!notes_sef_created_by_fkey(id, first_name, last_name)
        `)
        .order("created_at", { ascending: false });

      if (exercice) {
        query = query.eq("exercice", exercice);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as NoteSEF[];
    },
    enabled: !!exercice,
  });

  // Fetch directions
  const { data: directions = [] } = useQuery({
    queryKey: ["directions-active"],
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

  // Fetch profiles for demandeur
  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-list-sef"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .order("last_name");
      if (error) throw error;
      return data;
    },
  });

  // Create note
  const createMutation = useMutation({
    mutationFn: async (noteData: Partial<NoteSEF>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from("notes_sef")
        .insert([{
          objet: noteData.objet!,
          description: noteData.description,
          direction_id: noteData.direction_id,
          demandeur_id: noteData.demandeur_id || user.id,
          urgence: noteData.urgence,
          commentaire: noteData.commentaire,
          exercice: exercice || new Date().getFullYear(),
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      // Log history
      await supabase.from("notes_sef_history").insert([{
        note_id: data.id,
        action: "création",
        new_statut: "brouillon",
        performed_by: user.id,
      }]);

      await logAction({
        entityType: "note_sef",
        entityId: data.id,
        action: "create",
        newValues: data,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes-sef"] });
      toast({ title: "Note SEF créée avec succès" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  // Update note
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<NoteSEF> & { id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data: oldData } = await supabase.from("notes_sef").select("*").eq("id", id).single();

      const { data, error } = await supabase
        .from("notes_sef")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      await logAction({
        entityType: "note_sef",
        entityId: id,
        action: "update",
        oldValues: oldData,
        newValues: data,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes-sef"] });
      toast({ title: "Note SEF mise à jour" });
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
        .from("notes_sef")
        .update({
          statut: "soumis",
          submitted_by: user.id,
          submitted_at: new Date().toISOString(),
        })
        .eq("id", noteId)
        .select()
        .single();

      if (error) throw error;

      await supabase.from("notes_sef_history").insert([{
        note_id: noteId,
        action: "soumission",
        old_statut: "brouillon",
        new_statut: "soumis",
        performed_by: user.id,
      }]);

      await logAction({
        entityType: "note_sef",
        entityId: noteId,
        action: "validate",
        newValues: { statut: "soumis" },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes-sef"] });
      toast({ title: "Note soumise pour validation" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  // Move to "à valider"
  const moveToValidationMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from("notes_sef")
        .update({ statut: "a_valider" })
        .eq("id", noteId)
        .select()
        .single();

      if (error) throw error;

      await supabase.from("notes_sef_history").insert([{
        note_id: noteId,
        action: "passage à valider",
        old_statut: "soumis",
        new_statut: "a_valider",
        performed_by: user.id,
      }]);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes-sef"] });
      toast({ title: "Note prête pour validation" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  // Validate note
  const validateMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data: oldNote } = await supabase.from("notes_sef").select("statut").eq("id", noteId).single();

      const { data, error } = await supabase
        .from("notes_sef")
        .update({
          statut: "valide",
          validated_by: user.id,
          validated_at: new Date().toISOString(),
        })
        .eq("id", noteId)
        .select()
        .single();

      if (error) throw error;

      await supabase.from("notes_sef_history").insert([{
        note_id: noteId,
        action: "validation",
        old_statut: oldNote?.statut,
        new_statut: "valide",
        performed_by: user.id,
      }]);

      await logAction({
        entityType: "note_sef",
        entityId: noteId,
        action: "validate",
        newValues: { statut: "valide" },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes-sef"] });
      toast({ title: "Note validée avec succès" });
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

      const { data: oldNote } = await supabase.from("notes_sef").select("statut").eq("id", noteId).single();

      const { data, error } = await supabase
        .from("notes_sef")
        .update({
          statut: "rejete",
          rejection_reason: motif,
          rejected_by: user.id,
          rejected_at: new Date().toISOString(),
        })
        .eq("id", noteId)
        .select()
        .single();

      if (error) throw error;

      await supabase.from("notes_sef_history").insert([{
        note_id: noteId,
        action: "rejet",
        old_statut: oldNote?.statut,
        new_statut: "rejete",
        commentaire: motif,
        performed_by: user.id,
      }]);

      await logAction({
        entityType: "note_sef",
        entityId: noteId,
        action: "reject",
        newValues: { statut: "rejete", motif },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes-sef"] });
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
      condition,
      dateReprise,
    }: {
      noteId: string;
      motif: string;
      condition?: string;
      dateReprise?: string;
    }) => {
      if (!motif?.trim()) throw new Error("Le motif de report est obligatoire");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data: oldNote } = await supabase.from("notes_sef").select("statut").eq("id", noteId).single();

      const { data, error } = await supabase
        .from("notes_sef")
        .update({
          statut: "differe",
          differe_motif: motif,
          differe_condition: condition || null,
          differe_date_reprise: dateReprise || null,
          differe_by: user.id,
          differe_at: new Date().toISOString(),
        })
        .eq("id", noteId)
        .select()
        .single();

      if (error) throw error;

      await supabase.from("notes_sef_history").insert([{
        note_id: noteId,
        action: "report",
        old_statut: oldNote?.statut,
        new_statut: "differe",
        commentaire: motif,
        performed_by: user.id,
      }]);

      await logAction({
        entityType: "note_sef",
        entityId: noteId,
        action: "archive",
        newValues: { statut: "differe", motif },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes-sef"] });
      toast({ title: "Note différée" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  // Delete note
  const deleteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase.from("notes_sef").delete().eq("id", noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes-sef"] });
      toast({ title: "Note supprimée" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  // Fetch history for a note
  const fetchHistory = async (noteId: string): Promise<NoteSEFHistory[]> => {
    const { data, error } = await supabase
      .from("notes_sef_history")
      .select(`
        *,
        performer:profiles!notes_sef_history_performed_by_fkey(first_name, last_name)
      `)
      .eq("note_id", noteId)
      .order("performed_at", { ascending: false });

    if (error) throw error;
    return data as NoteSEFHistory[];
  };

  // Filter notes by status
  const notesByStatus = {
    brouillon: notes.filter((n) => n.statut === "brouillon"),
    soumis: notes.filter((n) => n.statut === "soumis"),
    a_valider: notes.filter((n) => n.statut === "a_valider" || n.statut === "soumis"),
    valide: notes.filter((n) => n.statut === "valide"),
    rejete: notes.filter((n) => n.statut === "rejete"),
    differe: notes.filter((n) => n.statut === "differe"),
  };

  return {
    notes,
    notesByStatus,
    isLoading,
    refetch,
    directions,
    profiles,
    createNote: createMutation.mutateAsync,
    updateNote: updateMutation.mutateAsync,
    submitNote: submitMutation.mutateAsync,
    moveToValidation: moveToValidationMutation.mutateAsync,
    validateNote: validateMutation.mutateAsync,
    rejectNote: rejectMutation.mutateAsync,
    deferNote: deferMutation.mutateAsync,
    deleteNote: deleteMutation.mutateAsync,
    fetchHistory,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
