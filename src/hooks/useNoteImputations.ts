/**
 * Hook pour gérer les imputations DG sur les notes SEF (PROMPT 27)
 *
 * Permet au DG d'ajouter des instructions de distribution aux directions/services
 * avec type d'instruction, priorité et délai.
 */

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Tables not yet in generated Supabase types - use untyped client as workaround
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const untypedSupabase = supabase as any;

// Types définis localement (non générés par Supabase)
export type InstructionType = "ATTRIBUTION" | "DIFFUSION" | "SUIVI" | "A_FAIRE_SUITE" | "CLASSEMENT";
export type ImputationPriorite = "basse" | "normale" | "haute" | "urgente";

export interface NoteImputationLigne {
  id: string;
  imputation_id: string;
  destinataire: string;
  destinataire_id: string | null;
  instruction_type: InstructionType;
  action_detail: string | null;
  priorite: ImputationPriorite;
  delai: string | null;
  ordre: number;
  created_at: string;
  updated_at: string;
  // Jointure optionnelle
  direction?: {
    id: string;
    sigle: string | null;
    label: string;
  } | null;
}

export interface NoteImputation {
  id: string;
  note_sef_id: string;
  impute_par_user_id: string | null;
  created_at: string;
  updated_at: string;
  // Jointures
  impute_par?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
  lignes: NoteImputationLigne[];
}

export interface CreateLigneInput {
  destinataire: string;
  destinataire_id?: string | null;
  instruction_type?: InstructionType;
  action_detail?: string | null;
  priorite?: ImputationPriorite;
  delai?: string | null;
  ordre?: number;
}

export interface UpdateLigneInput {
  id: string;
  destinataire?: string;
  destinataire_id?: string | null;
  instruction_type?: InstructionType;
  action_detail?: string | null;
  priorite?: ImputationPriorite;
  delai?: string | null;
  ordre?: number;
}

/**
 * Récupère l'imputation d'une note SEF avec ses lignes
 */
export function useNoteImputation(noteSefId: string | undefined) {
  return useQuery({
    queryKey: ["note-imputation", noteSefId],
    queryFn: async (): Promise<NoteImputation | null> => {
      if (!noteSefId) return null;

      // Récupérer l'imputation principale
      const { data: imputation, error: impError } = await untypedSupabase
        .from("note_imputations")
        .select(`
          *,
          impute_par:profiles!note_imputations_impute_par_user_id_fkey(
            id,
            first_name,
            last_name
          )
        `)
        .eq("note_sef_id", noteSefId)
        .maybeSingle();

      if (impError) {
        console.error("Erreur récupération imputation:", impError);
        throw impError;
      }

      if (!imputation) return null;

      // Récupérer les lignes
      const { data: lignes, error: lignesError } = await untypedSupabase
        .from("note_imputation_lignes")
        .select(`
          *,
          direction:directions(id, sigle, label)
        `)
        .eq("imputation_id", imputation.id)
        .order("ordre", { ascending: true });

      if (lignesError) {
        console.error("Erreur récupération lignes:", lignesError);
        throw lignesError;
      }

      return {
        ...imputation,
        lignes: (lignes || []) as NoteImputationLigne[],
      } as NoteImputation;
    },
    enabled: !!noteSefId,
  });
}

/**
 * Hook pour les mutations CRUD sur les imputations
 */
export function useNoteImputationMutations(noteSefId: string | undefined) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["note-imputation", noteSefId] });
  }, [queryClient, noteSefId]);

  /**
   * Crée ou récupère l'imputation pour une note SEF
   */
  const getOrCreateImputation = useCallback(async (): Promise<string> => {
    if (!noteSefId) throw new Error("ID note SEF manquant");

    // Vérifier si une imputation existe déjà
    const { data: existing } = await untypedSupabase
      .from("note_imputations")
      .select("id")
      .eq("note_sef_id", noteSefId)
      .maybeSingle();

    if (existing) return (existing as any).id;

    // Récupérer l'utilisateur courant
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Utilisateur non connecté");

    // Créer l'imputation
    const { data, error } = await untypedSupabase
      .from("note_imputations")
      .insert({
        note_sef_id: noteSefId,
        impute_par_user_id: user.id,
      })
      .select("id")
      .single();

    if (error) throw error;
    return (data as any).id;
  }, [noteSefId]);

  /**
   * Ajoute une ligne d'imputation
   */
  const addLigne = useMutation({
    mutationFn: async (input: CreateLigneInput) => {
      setIsLoading(true);
      try {
        const imputationId = await getOrCreateImputation();

        // Déterminer l'ordre (max + 1)
        const { data: maxOrdre } = await untypedSupabase
          .from("note_imputation_lignes")
          .select("ordre")
          .eq("imputation_id", imputationId)
          .order("ordre", { ascending: false })
          .limit(1)
          .maybeSingle();

        const nextOrdre = ((maxOrdre as any)?.ordre ?? -1) + 1;

        const { data, error } = await untypedSupabase
          .from("note_imputation_lignes")
          .insert({
            imputation_id: imputationId,
            destinataire: input.destinataire,
            destinataire_id: input.destinataire_id || null,
            instruction_type: input.instruction_type || "ATTRIBUTION",
            action_detail: input.action_detail || null,
            priorite: input.priorite || "normale",
            delai: input.delai || null,
            ordre: input.ordre ?? nextOrdre,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      toast.success("Ligne d'imputation ajoutée");
      invalidate();
    },
    onError: (error: Error) => {
      console.error("Erreur ajout ligne:", error);
      toast.error("Erreur lors de l'ajout: " + error.message);
    },
  });

  /**
   * Met à jour une ligne d'imputation
   */
  const updateLigne = useMutation({
    mutationFn: async (input: UpdateLigneInput) => {
      setIsLoading(true);
      try {
        const { id, ...updates } = input;

        const { data, error } = await untypedSupabase
          .from("note_imputation_lignes")
          .update(updates)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      toast.success("Ligne mise à jour");
      invalidate();
    },
    onError: (error: Error) => {
      console.error("Erreur mise à jour ligne:", error);
      toast.error("Erreur lors de la mise à jour: " + error.message);
    },
  });

  /**
   * Supprime une ligne d'imputation
   */
  const deleteLigne = useMutation({
    mutationFn: async (ligneId: string) => {
      setIsLoading(true);
      try {
        const { error } = await untypedSupabase
          .from("note_imputation_lignes")
          .delete()
          .eq("id", ligneId);

        if (error) throw error;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      toast.success("Ligne supprimée");
      invalidate();
    },
    onError: (error: Error) => {
      console.error("Erreur suppression ligne:", error);
      toast.error("Erreur lors de la suppression: " + error.message);
    },
  });

  /**
   * Réordonne les lignes d'imputation
   */
  const reorderLignes = useMutation({
    mutationFn: async (ligneIds: string[]) => {
      setIsLoading(true);
      try {
        // Mettre à jour l'ordre de chaque ligne
        const updates = ligneIds.map((id, index) =>
          untypedSupabase
            .from("note_imputation_lignes")
            .update({ ordre: index })
            .eq("id", id)
        );

        const results = await Promise.all(updates);
        const errors = results.filter(r => r.error);
        if (errors.length > 0) {
          throw new Error("Erreur lors du réordonnancement");
        }
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      invalidate();
    },
    onError: (error: Error) => {
      console.error("Erreur réordonnancement:", error);
      toast.error("Erreur lors du réordonnancement");
    },
  });

  return {
    addLigne,
    updateLigne,
    deleteLigne,
    reorderLignes,
    isLoading,
  };
}

/**
 * Labels pour les types d'instruction
 */
export const INSTRUCTION_TYPE_LABELS: Record<InstructionType, string> = {
  ATTRIBUTION: "Attribution",
  DIFFUSION: "Diffusion",
  SUIVI: "Suivi",
  A_FAIRE_SUITE: "À faire suite",
  CLASSEMENT: "Classement",
};

/**
 * Labels pour les priorités
 */
export const PRIORITE_LABELS: Record<ImputationPriorite, string> = {
  basse: "Basse",
  normale: "Normale",
  haute: "Haute",
  urgente: "Urgente",
};

/**
 * Couleurs pour les priorités
 */
export const PRIORITE_COLORS: Record<ImputationPriorite, string> = {
  basse: "bg-muted text-muted-foreground",
  normale: "bg-secondary text-secondary-foreground",
  haute: "bg-warning text-warning-foreground",
  urgente: "bg-destructive text-destructive-foreground",
};
