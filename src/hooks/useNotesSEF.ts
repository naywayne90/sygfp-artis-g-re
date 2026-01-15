import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useNotesSEFAudit } from "@/hooks/useNotesSEFAudit";

export interface NoteSEF {
  id: string;
  numero: string | null;
  reference_pivot: string | null;
  exercice: number;
  direction_id: string | null;
  demandeur_id: string | null;
  beneficiaire_id: string | null;
  beneficiaire_interne_id: string | null;
  objet: string;
  description: string | null;
  justification: string | null;
  date_souhaitee: string | null;
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
  // Lien vers le dossier créé
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
  const { logSoumission, logValidation, logRejet, logReport, logAjoutPiece, logSuppressionPiece } = useNotesSEFAudit();

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

  // Fetch profiles for demandeur (actifs uniquement, avec poste et direction)
  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-list-sef"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, full_name, email, poste, direction_id, is_active")
        .eq("is_active", true)
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
          justification: noteData.justification,
          date_souhaitee: noteData.date_souhaitee,
          direction_id: noteData.direction_id,
          demandeur_id: noteData.demandeur_id || user.id,
          beneficiaire_id: noteData.beneficiaire_id,
          beneficiaire_interne_id: noteData.beneficiaire_interne_id,
          urgence: noteData.urgence,
          commentaire: noteData.commentaire,
          exercice: exercice || new Date().getFullYear(),
          created_by: user.id,
          // reference_pivot sera généré par trigger
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
      toast({ 
        title: `Note ${data.reference_pivot || data.numero} créée`, 
        description: "La note a été enregistrée en brouillon",
      });
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

  // Submit note - avec validation des champs obligatoires
  const submitMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Récupérer la note avant la soumission pour validation + notifications
      const { data: oldNote, error: fetchError } = await supabase
        .from("notes_sef")
        .select(`
          *,
          direction:directions(id, label, sigle),
          demandeur:profiles!demandeur_id(id, first_name, last_name)
        `)
        .eq("id", noteId)
        .single();

      if (fetchError) throw new Error("Note introuvable");
      if (!oldNote) throw new Error("Note introuvable");

      // Validation front des champs obligatoires (le backend valide aussi)
      const errors: string[] = [];
      if (!oldNote.objet?.trim()) errors.push("Objet");
      if (!oldNote.direction_id) errors.push("Direction");
      if (!oldNote.demandeur_id) errors.push("Demandeur");
      if (!oldNote.urgence) errors.push("Urgence");
      if (!oldNote.justification?.trim()) errors.push("Justification");
      if (!oldNote.date_souhaitee) errors.push("Date souhaitée");

      if (errors.length > 0) {
        throw new Error(`Champs obligatoires manquants: ${errors.join(", ")}`);
      }

      // Vérifier que l'utilisateur est autorisé (créateur ou admin)
      const isCreator = oldNote.created_by === user.id;
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      
      const isAdmin = userRoles?.some(r => r.role === "ADMIN" || r.role === "DG");
      
      if (!isCreator && !isAdmin) {
        throw new Error("Vous n'êtes pas autorisé à soumettre cette note");
      }

      // Mise à jour du statut
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

      // Log history + audit + notifications aux validateurs
      await logSoumission({ ...oldNote, ...data } as any);

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notes-sef"] });
      queryClient.invalidateQueries({ queryKey: ["notes-sef-list"] });
      queryClient.invalidateQueries({ queryKey: ["notes-sef-counts"] });
      toast({ 
        title: `Note ${data.reference_pivot || data.numero} soumise`,
        description: "Les validateurs ont été notifiés",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur de soumission", description: error.message, variant: "destructive" });
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
  // Sécurisé: seuls DG/ADMIN peuvent valider (vérifié par trigger backend)
  const validateMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Vérifier le rôle DG/ADMIN côté frontend (le backend vérifie aussi)
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      
      const hasDGRole = userRoles?.some(r => r.role === "ADMIN" || r.role === "DG");
      if (!hasDGRole) {
        throw new Error("Seuls les utilisateurs DG ou ADMIN peuvent valider une note");
      }

      const { data: oldNote } = await supabase.from("notes_sef").select("*, direction:directions(sigle)").eq("id", noteId).single();

      // Vérifier que la note est dans un état validable
      if (!oldNote || !["soumis", "a_valider", "differe"].includes(oldNote.statut)) {
        throw new Error("Cette note n'est pas dans un état permettant la validation");
      }

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

      // Log history + audit + notifications au créateur/demandeur
      await logValidation({ ...oldNote, ...data } as any, dossier?.id);

      return { ...data, dossier };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["notes-sef"] });
      queryClient.invalidateQueries({ queryKey: ["notes-sef-list"] });
      queryClient.invalidateQueries({ queryKey: ["notes-sef-counts"] });
      queryClient.invalidateQueries({ queryKey: ["dossiers"] });
      if (result.dossier) {
        toast({ 
          title: `Note ${result.numero || result.reference_pivot} validée ✓`, 
          description: `Dossier ${result.dossier.numero} créé automatiquement.`,
          duration: 6000,
        });
      } else {
        toast({ title: `Note ${result.numero || result.reference_pivot} validée avec succès` });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Erreur de validation", description: error.message, variant: "destructive" });
    },
  });

  // Reject note - Sécurisé: seuls DG/ADMIN peuvent rejeter (vérifié par trigger backend)
  const rejectMutation = useMutation({
    mutationFn: async ({ noteId, motif }: { noteId: string; motif: string }) => {
      if (!motif?.trim()) throw new Error("Le motif de rejet est obligatoire");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Vérifier le rôle DG/ADMIN côté frontend (le backend vérifie aussi)
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      
      const hasDGRole = userRoles?.some(r => r.role === "ADMIN" || r.role === "DG");
      if (!hasDGRole) {
        throw new Error("Seuls les utilisateurs DG ou ADMIN peuvent rejeter une note");
      }

      // Récupérer la note avec les infos nécessaires pour les notifications
      const { data: oldNote } = await supabase
        .from("notes_sef")
        .select("*, direction:directions(id, label)")
        .eq("id", noteId)
        .single();

      // Vérifier que la note est dans un état rejectable
      if (!oldNote || !["soumis", "a_valider"].includes(oldNote.statut)) {
        throw new Error("Cette note n'est pas dans un état permettant le rejet");
      }

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

      // Log history + audit + notifications au créateur/demandeur
      await logRejet({ ...oldNote, ...data } as any, motif);

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notes-sef"] });
      queryClient.invalidateQueries({ queryKey: ["notes-sef-list"] });
      queryClient.invalidateQueries({ queryKey: ["notes-sef-counts"] });
      toast({ title: `Note ${data.reference_pivot || data.numero} rejetée` });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur de rejet", description: error.message, variant: "destructive" });
    },
  });

  // Defer note - Sécurisé: seuls DG/ADMIN peuvent différer (vérifié par trigger backend)
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

      // Vérifier le rôle DG/ADMIN côté frontend (le backend vérifie aussi)
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      
      const hasDGRole = userRoles?.some(r => r.role === "ADMIN" || r.role === "DG");
      if (!hasDGRole) {
        throw new Error("Seuls les utilisateurs DG ou ADMIN peuvent différer une note");
      }

      // Récupérer la note avec les infos nécessaires pour les notifications
      const { data: oldNote } = await supabase
        .from("notes_sef")
        .select("*, direction:directions(id, label)")
        .eq("id", noteId)
        .single();

      // Vérifier que la note est dans un état différable
      if (!oldNote || !["soumis", "a_valider"].includes(oldNote.statut)) {
        throw new Error("Cette note n'est pas dans un état permettant le report");
      }

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

      // Log history + audit + notifications au créateur/demandeur
      await logReport({ ...oldNote, ...data } as any, motif, dateReprise);

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notes-sef"] });
      queryClient.invalidateQueries({ queryKey: ["notes-sef-list"] });
      queryClient.invalidateQueries({ queryKey: ["notes-sef-counts"] });
      toast({ title: `Note ${(data as any).reference_pivot || (data as any).numero} différée` });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur de report", description: error.message, variant: "destructive" });
    },
  });

  // Re-submit note (DIFFERE -> A_VALIDER)
  const resubmitMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Récupérer la note
      const { data: oldNote } = await supabase
        .from("notes_sef")
        .select("*")
        .eq("id", noteId)
        .single();

      if (!oldNote || oldNote.statut !== "differe") {
        throw new Error("Seules les notes différées peuvent être re-soumises");
      }

      // Vérifier que l'utilisateur est autorisé (créateur ou admin)
      const isCreator = oldNote.created_by === user.id;
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      
      const isAdmin = userRoles?.some(r => r.role === "ADMIN");
      
      if (!isCreator && !isAdmin) {
        throw new Error("Seul le créateur peut re-soumettre cette note");
      }

      // Mise à jour du statut
      const { data, error } = await supabase
        .from("notes_sef")
        .update({
          statut: "soumis",
          submitted_by: user.id,
          submitted_at: new Date().toISOString(),
          // Réinitialiser les champs de report
          differe_motif: null,
          differe_condition: null,
          differe_date_reprise: null,
          differe_by: null,
          differe_at: null,
        })
        .eq("id", noteId)
        .select()
        .single();

      if (error) throw error;

      // Log history
      await supabase.from("notes_sef_history").insert([{
        note_id: noteId,
        action: "resoumission",
        old_statut: "differe",
        new_statut: "soumis",
        commentaire: "Re-soumission après report",
        performed_by: user.id,
      }]);

      // Notifier les validateurs
      await logSoumission({ ...oldNote, ...data } as any);

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notes-sef"] });
      queryClient.invalidateQueries({ queryKey: ["notes-sef-list"] });
      queryClient.invalidateQueries({ queryKey: ["notes-sef-counts"] });
      toast({ 
        title: `Note ${(data as any).reference_pivot || (data as any).numero} re-soumise`,
        description: "Les validateurs ont été notifiés",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur de re-soumission", description: error.message, variant: "destructive" });
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
    resubmitNote: resubmitMutation.mutateAsync,
    duplicateNote: duplicateMutation.mutateAsync,
    deleteNote: deleteMutation.mutateAsync,
    fetchHistory,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isSubmitting: submitMutation.isPending,
    isResubmitting: resubmitMutation.isPending,
  };
}
