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
  beneficiaire_id: string | null;
  beneficiaire_interne_id: string | null;
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
  // Nouveau: lien vers le dossier créé
  dossier_id?: string | null;
  // Relations
  direction?: { id: string; label: string; sigle: string | null };
  demandeur?: { id: string; first_name: string | null; last_name: string | null };
  beneficiaire?: { id: string; raison_sociale: string };
  beneficiaire_interne?: { id: string; first_name: string | null; last_name: string | null };
  created_by_profile?: { id: string; first_name: string | null; last_name: string | null };
  // Relation vers dossier
  dossier?: { id: string; numero: string; statut_global: string | null };
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
          demandeur:profiles!demandeur_id(id, first_name, last_name),
          beneficiaire:prestataires!beneficiaire_id(id, raison_sociale),
          beneficiaire_interne:profiles!beneficiaire_interne_id(id, first_name, last_name),
          created_by_profile:profiles!created_by(id, first_name, last_name),
          dossier:dossiers!dossier_id(id, numero, statut_global)
        `)
        .order("created_at", { ascending: false });

      if (exercice) {
        query = query.eq("exercice", exercice);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown) as NoteSEF[];
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

  // Fetch beneficiaires (prestataires)
  const { data: beneficiaires = [] } = useQuery({
    queryKey: ["prestataires-for-notes-sef"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prestataires")
        .select("id, raison_sociale")
        .order("raison_sociale");
      if (error) throw error;
      return data as { id: string; raison_sociale: string }[];
    },
  });

  // Create note - numéro généré automatiquement par trigger
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
          beneficiaire_id: noteData.beneficiaire_id,
          beneficiaire_interne_id: noteData.beneficiaire_interne_id,
          urgence: noteData.urgence,
          commentaire: noteData.commentaire,
          exercice: exercice || new Date().getFullYear(),
          created_by: user.id,
          // numero sera généré par trigger
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notes-sef"] });
      toast({ title: `Note ${data.numero} créée avec succès` });
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
        action: "submit",
        newValues: { statut: "soumis" },
      });

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notes-sef"] });
      toast({ title: `Note ${data.numero} soumise pour validation` });
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

  // Validate note - CREATION AUTOMATIQUE DU DOSSIER
  const validateMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data: oldNote } = await supabase.from("notes_sef").select("*, direction:directions(sigle)").eq("id", noteId).single();

      // Mise à jour de la Note SEF
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

      // ========================================
      // POINT 1: CRÉATION AUTOMATIQUE DU DOSSIER
      // ========================================
      
      // Générer le numéro de dossier au format: ARTI/{ANNEE}/{DIR}/{SEQ}
      const year = exercice || new Date().getFullYear();
      const dirSigle = oldNote?.direction?.sigle || "GEN";
      
      // Récupérer le prochain numéro de séquence pour les dossiers
      const { data: seqData, error: seqError } = await supabase.rpc("get_next_sequence", {
        p_doc_type: "DOSSIER",
        p_exercice: year,
        p_direction_code: dirSigle,
        p_scope: "direction",
      });

      let numeroDossier = `ARTI/${year}/${dirSigle}/0001`;
      if (!seqError && seqData && seqData.length > 0) {
        numeroDossier = seqData[0].full_code;
      }

      // Créer le dossier
      const { data: dossier, error: dossierError } = await supabase
        .from("dossiers")
        .insert({
          numero: numeroDossier,
          objet: oldNote?.objet || data.objet,
          type_dossier: "SEF",
          direction_id: oldNote?.direction_id || data.direction_id,
          demandeur_id: oldNote?.demandeur_id || data.demandeur_id,
          beneficiaire_id: (oldNote as any)?.beneficiaire_id,
          note_sef_id: noteId,
          statut_global: "en_cours",
          etape_courante: "note_sef",
          exercice: year,
          created_by: user.id,
          montant_estime: 0,
          montant_engage: 0,
          montant_liquide: 0,
          montant_ordonnance: 0,
          montant_paye: 0,
        } as any)
        .select()
        .single();

      if (dossierError) {
        console.error("Erreur création dossier:", dossierError);
        // Ne pas bloquer la validation de la note si le dossier échoue
      } else if (dossier) {
        // Mettre à jour la note avec le dossier_id (cast to any for flexibility)
        await supabase
          .from("notes_sef")
          .update({ dossier_id: dossier.id } as any)
          .eq("id", noteId);

        // Ajouter l'entrée dans dossier_etapes
        await supabase.from("dossier_etapes").insert({
          dossier_id: dossier.id,
          type_etape: "note_sef",
          reference_id: noteId,
          reference_numero: data.numero,
          statut: "valide",
          montant: 0,
          created_by: user.id,
        });
      }

      await supabase.from("notes_sef_history").insert([{
        note_id: noteId,
        action: "validation",
        old_statut: oldNote?.statut,
        new_statut: "valide",
        commentaire: dossier ? `Dossier ${dossier.numero} créé automatiquement` : undefined,
        performed_by: user.id,
      }]);

      await logAction({
        entityType: "note_sef",
        entityId: noteId,
        action: "validate",
        newValues: { statut: "valide", dossier_id: dossier?.id },
      });

      return { ...data, dossier };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["notes-sef"] });
      queryClient.invalidateQueries({ queryKey: ["dossiers"] });
      if (result.dossier) {
        toast({ 
          title: `Note ${result.numero} validée ✓`, 
          description: `Dossier ${result.dossier.numero} créé automatiquement. Cliquez sur la note pour voir le lien vers le dossier.`,
          duration: 6000,
        });
      } else {
        toast({ title: `Note ${result.numero} validée avec succès` });
      }
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

  // Duplicate note
  const duplicateMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data: original, error: fetchError } = await supabase
        .from("notes_sef")
        .select("*")
        .eq("id", noteId)
        .single();

      if (fetchError) throw fetchError;

      const { data, error } = await supabase
        .from("notes_sef")
        .insert([{
          objet: `[Copie] ${original.objet}`,
          description: original.description,
          direction_id: original.direction_id,
          demandeur_id: original.demandeur_id,
          urgence: original.urgence,
          commentaire: original.commentaire,
          exercice: exercice || new Date().getFullYear(),
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      await logAction({
        entityType: "note_sef",
        entityId: data.id,
        action: "create",
        newValues: { ...data, duplicated_from: noteId },
      });

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notes-sef"] });
      toast({ title: `Note ${data.numero} créée (copie)` });
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
    beneficiaires,
    createNote: createMutation.mutateAsync,
    updateNote: updateMutation.mutateAsync,
    submitNote: submitMutation.mutateAsync,
    moveToValidation: moveToValidationMutation.mutateAsync,
    validateNote: validateMutation.mutateAsync,
    rejectNote: rejectMutation.mutateAsync,
    deferNote: deferMutation.mutateAsync,
    duplicateNote: duplicateMutation.mutateAsync,
    deleteNote: deleteMutation.mutateAsync,
    fetchHistory,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isSubmitting: submitMutation.isPending,
  };
}
