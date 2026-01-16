import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useARTIReference } from "@/hooks/useARTIReference";

export interface NoteAEF {
  id: string;
  numero: string | null;
  reference_pivot: string | null; // Référence ARTI héritée de la SEF
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
  // Liaison Note SEF
  note_sef_id: string | null;
  dossier_id?: string | null;
  // Champs AEF directe
  origin: 'FROM_SEF' | 'DIRECT' | string | null;
  is_direct_aef: boolean;
  type_depense?: string | null;
  justification?: string | null;
  beneficiaire_id?: string | null;
  ligne_budgetaire_id?: string | null;
  os_id?: string | null;
  action_id?: string | null;
  activite_id?: string | null;
  // Relations
  direction?: { id: string; label: string; sigle: string | null };
  created_by_profile?: { id: string; first_name: string | null; last_name: string | null };
  imputed_by_profile?: { id: string; first_name: string | null; last_name: string | null };
  budget_line?: { id: string; code: string; label: string; dotation_initiale: number };
  note_sef?: { id: string; numero: string | null; reference_pivot: string | null; objet: string; dossier_id?: string | null };
}

export interface BudgetValidationStatus {
  isValidated: boolean;
  totalLines: number;
  validatedLines: number;
  message: string;
}

export interface BudgetAvailabilityCheck {
  isAvailable: boolean;
  dotation: number;
  engaged: number;
  disponible: number;
  message: string;
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
          budget_line:budget_lines(id, code, label, dotation_initiale),
          note_sef:notes_sef!notes_dg_note_sef_id_fkey(id, numero, reference_pivot, objet, dossier_id)
        `)
        .order("created_at", { ascending: false });

      if (exercice) {
        query = query.eq("exercice", exercice);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as NoteAEF[];
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

  // POINT 2: Fetch validated Notes SEF for linking (includes reference_pivot)
  const { data: notesSEFValidees = [] } = useQuery({
    queryKey: ["notes-sef-validees-for-aef", exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes_sef")
        .select("id, numero, reference_pivot, objet, direction_id, validated_at")
        .eq("statut", "valide")
        .eq("exercice", exercice || new Date().getFullYear())
        .order("validated_at", { ascending: false });
      if (error) throw error;
      return data as { 
        id: string; 
        numero: string | null; 
        reference_pivot: string | null;
        objet: string; 
        direction_id: string | null; 
        validated_at: string | null 
      }[];
    },
    enabled: !!exercice,
  });

  // Fetch beneficiaires (prestataires)
  const { data: beneficiaires = [] } = useQuery({
    queryKey: ["prestataires-for-notes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prestataires")
        .select("id, raison_sociale")
        .order("raison_sociale");
      if (error) throw error;
      return data as { id: string; raison_sociale: string }[];
    },
  });

  // Fetch budget lines for imputation
  const { data: budgetLines = [] } = useQuery({
    queryKey: ["budget-lines-for-imputation", exercice],
    queryFn: async () => {
      let query = supabase
        .from("budget_lines")
        .select("id, code, label, dotation_initiale, dotation_modifiee, statut")
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

  // Check if budget is validated
  const { data: budgetValidationStatus } = useQuery({
    queryKey: ["budget-validation-status", exercice],
    queryFn: async (): Promise<BudgetValidationStatus> => {
      if (!exercice) {
        return { isValidated: false, totalLines: 0, validatedLines: 0, message: "Aucun exercice sélectionné" };
      }

      const { data: lines, error } = await supabase
        .from("budget_lines")
        .select("id, statut")
        .eq("exercice", exercice)
        .eq("is_active", true);

      if (error) throw error;

      const total = lines?.length || 0;
      const validated = lines?.filter(l => l.statut === "valide").length || 0;

      if (total === 0) {
        return { isValidated: false, totalLines: 0, validatedLines: 0, message: "Aucune ligne budgétaire" };
      }

      const isValidated = validated > 0 && validated === total;

      return {
        isValidated,
        totalLines: total,
        validatedLines: validated,
        message: isValidated ? "Budget validé" : `Budget non validé (${validated}/${total})`
      };
    },
    enabled: !!exercice,
  });

  // (Removed duplicate queries - already defined above)

  // Check budget availability for a specific line
  const checkBudgetAvailability = async (budgetLineId: string, montant: number): Promise<BudgetAvailabilityCheck> => {
    // Get budget line dotation
    const { data: line, error: lineError } = await supabase
      .from("budget_lines")
      .select("id, dotation_initiale, dotation_modifiee")
      .eq("id", budgetLineId)
      .single();

    if (lineError || !line) {
      return { isAvailable: false, dotation: 0, engaged: 0, disponible: 0, message: "Ligne budgétaire introuvable" };
    }

    const dotation = line.dotation_modifiee || line.dotation_initiale || 0;

    // Get total engagements on this line
    const { data: engagements, error: engError } = await supabase
      .from("budget_engagements")
      .select("montant")
      .eq("budget_line_id", budgetLineId)
      .neq("statut", "annule");

    if (engError) throw engError;

    const totalEngaged = engagements?.reduce((sum, e) => sum + (e.montant || 0), 0) || 0;
    const disponible = dotation - totalEngaged;
    const isAvailable = montant <= disponible;

    return {
      isAvailable,
      dotation,
      engaged: totalEngaged,
      disponible,
      message: isAvailable 
        ? `Disponible: ${disponible.toLocaleString("fr-FR")} FCFA` 
        : `Insuffisant: ${disponible.toLocaleString("fr-FR")} FCFA disponibles`
    };
  };

  // Create note - La référence AEF = référence SEF liée (règle métier)
  const createMutation = useMutation({
    mutationFn: async (noteData: Partial<NoteAEF> & { 
      note_sef_id?: string | null;
      is_direct_aef?: boolean;
      type_depense?: string;
      justification?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      let referencePivot: string | null = null;
      let origin: 'FROM_SEF' | 'DIRECT' = 'DIRECT';
      let noteSefId: string | null = noteData.note_sef_id || null;

      // RÈGLE MÉTIER: Si liée à une Note SEF existante, copier sa référence
      if (noteData.note_sef_id && !noteData.is_direct_aef) {
        const { data: noteSef, error: sefError } = await supabase
          .from("notes_sef")
          .select("id, numero, reference_pivot, statut")
          .eq("id", noteData.note_sef_id)
          .single();

        if (sefError || !noteSef) {
          throw new Error("Note SEF introuvable");
        }

        if (noteSef.statut !== "valide") {
          throw new Error("La Note SEF doit être validée pour créer une AEF");
        }

        // La référence AEF = référence SEF (même code)
        referencePivot = noteSef.reference_pivot || noteSef.numero;
        origin = 'FROM_SEF';
      }

      const { data, error } = await supabase
        .from("notes_dg")
        .insert([{
          objet: noteData.objet!,
          contenu: noteData.contenu,
          direction_id: noteData.direction_id,
          priorite: noteData.priorite || "normale",
          montant_estime: noteData.montant_estime || 0,
          type_depense: noteData.type_depense || "fonctionnement",
          justification: noteData.justification,
          note_sef_id: noteSefId,
          is_direct_aef: noteData.is_direct_aef || false,
          origin: origin,
          reference_pivot: referencePivot, // Copie de la référence SEF
          beneficiaire_id: noteData.beneficiaire_id,
          ligne_budgetaire_id: noteData.ligne_budgetaire_id,
          os_id: noteData.os_id,
          action_id: noteData.action_id,
          activite_id: noteData.activite_id,
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notes-aef"] });
      const refDisplay = data.reference_pivot || data.numero || data.id.substring(0, 8);
      toast({ title: `Note AEF ${refDisplay} créée avec succès` });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  // Créer une AEF directe DG avec SEF shadow automatique
  const createDirectDGMutation = useMutation({
    mutationFn: async (noteData: {
      objet: string;
      contenu?: string | null;
      direction_id?: string | null;
      priorite?: string;
      montant_estime?: number;
      type_depense?: string;
      justification: string; // Obligatoire pour AEF directe
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Vérifier que l'utilisateur est DG ou ADMIN
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      
      const hasDGRole = userRoles?.some(r => r.role === "ADMIN" || r.role === "DG");
      if (!hasDGRole) {
        throw new Error("Seuls les utilisateurs DG ou ADMIN peuvent créer une AEF directe");
      }

      // Validation
      if (!noteData.justification?.trim()) {
        throw new Error("La justification est obligatoire pour une AEF directe DG");
      }

      // 1. Générer la référence ARTI (étape 0 = SEF)
      const { data: referencePivot, error: refError } = await supabase.rpc(
        "generate_arti_reference",
        { p_etape: 0, p_date: new Date().toISOString() }
      );

      if (refError || !referencePivot) {
        throw new Error("Erreur lors de la génération de la référence");
      }

      // 2. Créer la SEF shadow (auto-validée)
      const { data: shadowSef, error: sefError } = await supabase
        .from("notes_sef")
        .insert([{
          objet: `[AEF DIRECTE] ${noteData.objet}`,
          description: noteData.contenu || null,
          justification: `AEF directe DG: ${noteData.justification}`,
          direction_id: noteData.direction_id,
          demandeur_id: user.id,
          urgence: noteData.priorite || "normale",
          exercice: exercice || new Date().getFullYear(),
          created_by: user.id,
          numero: referencePivot,
          reference_pivot: referencePivot,
          statut: "valide_auto", // Statut spécial: validée automatiquement
          validated_by: user.id,
          validated_at: new Date().toISOString(),
          submitted_by: user.id,
          submitted_at: new Date().toISOString(),
          dg_validation_required: false, // Pas besoin de validation DG
        }])
        .select()
        .single();

      if (sefError || !shadowSef) {
        console.error("Erreur création SEF shadow:", sefError);
        throw new Error("Erreur lors de la création de la Note SEF associée");
      }

      // Log création SEF shadow (utilise "create" avec métadonnées)
      await logAction({
        entityType: "note_sef",
        entityId: shadowSef.id,
        action: "create",
        newValues: { ...shadowSef, is_shadow: true, created_via: "AEF_DIRECT_DG" },
      });

      // 3. Créer l'AEF liée à la SEF shadow
      const { data: aefData, error: aefError } = await supabase
        .from("notes_dg")
        .insert([{
          objet: noteData.objet,
          contenu: noteData.contenu || null,
          direction_id: noteData.direction_id,
          priorite: noteData.priorite || "normale",
          montant_estime: noteData.montant_estime || 0,
          type_depense: noteData.type_depense || "fonctionnement",
          justification: noteData.justification,
          note_sef_id: shadowSef.id, // Lien vers la SEF shadow
          is_direct_aef: true,
          origin: 'DIRECT',
          reference_pivot: referencePivot, // Même référence que la SEF
          exercice: exercice || new Date().getFullYear(),
          created_by: user.id,
          statut: "brouillon",
        }])
        .select()
        .single();

      if (aefError) {
        console.error("Erreur création AEF:", aefError);
        throw new Error("Erreur lors de la création de la Note AEF");
      }

      // Log création AEF directe DG (utilise "create" avec métadonnées)
      await logAction({
        entityType: "note_aef",
        entityId: aefData.id,
        action: "create",
        newValues: { 
          ...aefData, 
          is_direct_dg: true,
          shadow_sef_id: shadowSef.id,
          shadow_sef_numero: shadowSef.numero,
        },
      });

      return {
        aef: aefData,
        shadowSef: shadowSef,
        reference: referencePivot,
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["notes-aef"] });
      queryClient.invalidateQueries({ queryKey: ["notes-sef"] });
      toast({ 
        title: `AEF directe ${result.reference} créée`,
        description: "Une Note SEF a été générée automatiquement",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur AEF directe", description: error.message, variant: "destructive" });
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

  // Submit note - avec validations des champs requis et verrouillage cohérence SEF
  const submitMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Récupérer la note pour validation
      const { data: note, error: fetchError } = await supabase
        .from("notes_dg")
        .select("*")
        .eq("id", noteId)
        .single();

      if (fetchError) throw new Error("Note introuvable");

      // Validations des champs requis
      const errors: string[] = [];
      if (!note.objet?.trim()) errors.push("Objet");
      if (!note.direction_id) errors.push("Direction");
      if (!note.priorite) errors.push("Urgence");
      if (!note.montant_estime || note.montant_estime <= 0) errors.push("Montant estimé");
      if (!note.contenu?.trim()) errors.push("Description/Justification");

      if (errors.length > 0) {
        throw new Error(`Champs obligatoires manquants: ${errors.join(", ")}`);
      }

      // ═══════════════════════════════════════════════════════════════════════
      // RÈGLE ABSOLUE: Toute AEF soumise DOIT avoir note_sef_id + reference_pivot
      // ═══════════════════════════════════════════════════════════════════════
      let updatedSefId = note.note_sef_id;
      let updatedReferencePivot = note.reference_pivot;
      let autoLinkedSef = false;

      if (!note.note_sef_id || !note.reference_pivot) {
        // Vérifier si l'utilisateur est DG/ADMIN
        const { data: userRoles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);
        
        const hasDGRole = userRoles?.some(r => r.role === "ADMIN" || r.role === "DG");

        if (hasDGRole) {
          // CAS DG: Auto-créer une SEF shadow pour corriger les données legacy/incohérentes
          console.log("[SUBMIT] DG detected with missing SEF link - creating shadow SEF");

          // Générer la référence ARTI (étape 0 = SEF)
          const { data: referencePivot, error: refError } = await supabase.rpc(
            "generate_arti_reference",
            { p_etape: 0, p_date: new Date().toISOString() }
          );

          if (refError || !referencePivot) {
            throw new Error("Erreur lors de la génération de la référence SEF");
          }

          // Créer la SEF shadow (auto-validée)
          const { data: shadowSef, error: sefError } = await supabase
            .from("notes_sef")
            .insert([{
              objet: `[AUTO-LINK] ${note.objet}`,
              description: note.contenu || null,
              justification: `Auto-générée lors de la soumission (cohérence AEF legacy)`,
              direction_id: note.direction_id,
              demandeur_id: user.id,
              urgence: note.priorite || "normale",
              exercice: note.exercice || new Date().getFullYear(),
              created_by: user.id,
              numero: referencePivot,
              reference_pivot: referencePivot,
              statut: "valide_auto",
              validated_by: user.id,
              validated_at: new Date().toISOString(),
              submitted_by: user.id,
              submitted_at: new Date().toISOString(),
              dg_validation_required: false,
            }])
            .select()
            .single();

          if (sefError || !shadowSef) {
            console.error("Erreur création SEF shadow lors de submit:", sefError);
            throw new Error("Erreur lors de la création automatique de la Note SEF");
          }

          // Log création SEF shadow
          await logAction({
            entityType: "note_sef",
            entityId: shadowSef.id,
            action: "create",
            newValues: { ...shadowSef, is_shadow: true, created_via: "SUBMIT_AUTO_LINK" },
          });

          updatedSefId = shadowSef.id;
          updatedReferencePivot = referencePivot;
          autoLinkedSef = true;
        } else {
          // CAS NON-DG: Erreur explicite
          throw new Error(
            "Impossible de soumettre : cette Note AEF n'est pas liée à une Note SEF validée. " +
            "Veuillez sélectionner une Note SEF avant de soumettre."
          );
        }
      }

      // Préparer les données de mise à jour
      const updateData: Record<string, unknown> = {
        statut: "soumis",
        submitted_at: new Date().toISOString(),
        submitted_by: user.id,
      };

      // Si auto-link effectué, mettre à jour les champs SEF
      if (autoLinkedSef) {
        updateData.note_sef_id = updatedSefId;
        updateData.reference_pivot = updatedReferencePivot;
        updateData.origin = 'DIRECT';
        updateData.is_direct_aef = true;
      }

      const { data, error } = await supabase
        .from("notes_dg")
        .update(updateData)
        .eq("id", noteId)
        .select()
        .single();

      if (error) throw error;

      // Log action submit (avec info auto-link si applicable)
      await logAction({
        entityType: "note_aef",
        entityId: noteId,
        action: "submit",
        newValues: autoLinkedSef 
          ? { statut: "soumis", auto_linked_sef_id: updatedSefId, reference_pivot: updatedReferencePivot, via_auto_link: true }
          : { statut: "soumis" },
      });

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notes-aef"] });
      queryClient.invalidateQueries({ queryKey: ["notes-sef"] });
      toast({ title: `Note ${data.reference_pivot || data.numero} soumise pour validation` });
    },
    onError: (error: Error) => {
      toast({ title: "Soumission impossible", description: error.message, variant: "destructive" });
    },
  });

  // Validate note - devient automatiquement "à imputer" (validée par DG)
  // GUARD: Double vérification de la cohérence SEF avant validation
  const validateMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Vérifier le rôle DG/ADMIN
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      
      const hasDGRole = userRoles?.some(r => r.role === "ADMIN" || r.role === "DG");
      if (!hasDGRole) {
        throw new Error("Seuls les utilisateurs DG ou ADMIN peuvent valider une note AEF");
      }

      // Récupérer la note pour vérification de cohérence
      const { data: note, error: fetchError } = await supabase
        .from("notes_dg")
        .select("id, note_sef_id, reference_pivot, objet")
        .eq("id", noteId)
        .single();

      if (fetchError) throw new Error("Note introuvable");

      // ═══════════════════════════════════════════════════════════════════════
      // GUARD FINAL: Impossible de valider une AEF sans référence SEF valide
      // ═══════════════════════════════════════════════════════════════════════
      if (!note.note_sef_id || !note.reference_pivot) {
        console.error("[VALIDATE] Incohérence détectée - AEF sans SEF:", { noteId, note });
        throw new Error(
          "Incohérence détectée : cette Note AEF n'a pas de référence SEF valide. " +
          "Veuillez d'abord soumettre la note pour corriger cette incohérence."
        );
      }

      const { data, error } = await supabase
        .from("notes_dg")
        .update({
          statut: "a_imputer", // Nouveau statut: validée, en attente d'imputation
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
        newValues: { statut: "a_imputer" },
      });

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notes-aef"] });
      queryClient.invalidateQueries({ queryKey: ["notes-a-imputer"] });
      toast({ title: `Note ${data.reference_pivot || data.numero} validée ✓`, description: "Disponible pour imputation" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur de validation", description: error.message, variant: "destructive" });
    },
  });

  // Reject note - DG/ADMIN only
  const rejectMutation = useMutation({
    mutationFn: async ({ noteId, motif }: { noteId: string; motif: string }) => {
      if (!motif?.trim()) throw new Error("Le motif de rejet est obligatoire");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Vérifier le rôle DG/ADMIN
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      
      const hasDGRole = userRoles?.some(r => r.role === "ADMIN" || r.role === "DG");
      if (!hasDGRole) {
        throw new Error("Seuls les utilisateurs DG ou ADMIN peuvent rejeter une note AEF");
      }

      const { data, error } = await supabase
        .from("notes_dg")
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

  // Defer note - DG/ADMIN only
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

      // Vérifier le rôle DG/ADMIN
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      
      const hasDGRole = userRoles?.some(r => r.role === "ADMIN" || r.role === "DG");
      if (!hasDGRole) {
        throw new Error("Seuls les utilisateurs DG ou ADMIN peuvent différer une note AEF");
      }

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
        action: "defer",
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notes-aef"] });
      queryClient.invalidateQueries({ queryKey: ["notes-a-imputer"] });
      toast({ title: `Note ${data.numero} imputée avec succès` });
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

      // Récupérer la note originale
      const { data: original, error: fetchError } = await supabase
        .from("notes_dg")
        .select("*")
        .eq("id", noteId)
        .single();

      if (fetchError) throw fetchError;

      // Créer une copie
      const { data, error } = await supabase
        .from("notes_dg")
        .insert([{
          objet: `[Copie] ${original.objet}`,
          contenu: original.contenu,
          direction_id: original.direction_id,
          priorite: original.priorite,
          montant_estime: original.montant_estime,
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
        newValues: { ...data, duplicated_from: noteId },
      });

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notes-aef"] });
      toast({ title: `Note ${data.numero} créée (copie)` });
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

  // Filter notes by status - aligné sur les nouveaux statuts
  const notesByStatus = {
    brouillon: notes.filter((n) => n.statut === "brouillon"),
    soumis: notes.filter((n) => n.statut === "soumis"),
    a_valider: notes.filter((n) => n.statut === "soumis" || n.statut === "a_valider"),
    a_imputer: notes.filter((n) => n.statut === "a_imputer"), // Validé par DG, en attente d'imputation
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
    beneficiaires,
    budgetLines,
    budgetValidationStatus,
    notesSEFValidees, // POINT 2: Notes SEF validées pour liaison
    checkBudgetAvailability,
    createNote: createMutation.mutateAsync,
    createDirectDG: createDirectDGMutation.mutateAsync, // Nouvelle: AEF directe DG
    updateNote: updateMutation.mutateAsync,
    submitNote: submitMutation.mutateAsync,
    validateNote: validateMutation.mutateAsync,
    rejectNote: rejectMutation.mutateAsync,
    deferNote: deferMutation.mutateAsync,
    imputeNote: imputeMutation.mutateAsync,
    duplicateNote: duplicateMutation.mutateAsync,
    deleteNote: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isCreatingDirectDG: createDirectDGMutation.isPending,
    isUpdating: updateMutation.isPending,
    isSubmitting: submitMutation.isPending,
    isImputing: imputeMutation.isPending,
  };
}
