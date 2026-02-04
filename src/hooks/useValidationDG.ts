// @ts-nocheck - RPC functions and column references
/**
 * Hook pour gérer les validations DG avec QR code (PROMPT 29)
 *
 * Permet de récupérer et valider les notes SEF via QR code scannable.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

// Types extraits de la base de données
export type ValidationDGStatus = Database["public"]["Enums"]["validation_dg_status"];
export type ValidationNoteType = Database["public"]["Enums"]["validation_note_type"];

export interface ValidationDG {
  id: string;
  note_type: ValidationNoteType;
  note_id: string;
  token: string;
  status: ValidationDGStatus;
  validated_by_user_id: string | null;
  validated_at: string | null;
  commentaire: string | null;
  qr_payload_url: string | null;
  exercice_id: string | null;
  created_at: string;
  updated_at: string;
  // Jointures optionnelles
  validated_by?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
  } | null;
}

export interface ValidationDGWithNote extends ValidationDG {
  note_sef?: {
    id: string;
    reference: string | null;
    objet: string;
    description: string | null;
    montant: number | null;
    expose: string | null;
    avis: string | null;
    recommandations: string | null;
    statut: string;
    urgence: boolean;
    demandeur_display: string | null;
    direction?: {
      id: string;
      sigle: string | null;
      label: string;
    } | null;
  } | null;
}

/**
 * Labels pour les statuts de validation
 */
export const VALIDATION_STATUS_LABELS: Record<ValidationDGStatus, string> = {
  PENDING: "En attente",
  APPROVED: "Validée",
  REJECTED: "Rejetée",
  DEFERRED: "Différée",
};

/**
 * Couleurs pour les statuts de validation
 */
export const VALIDATION_STATUS_COLORS: Record<ValidationDGStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  APPROVED: "bg-green-100 text-green-800 border-green-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
  DEFERRED: "bg-blue-100 text-blue-800 border-blue-200",
};

/**
 * Récupère la validation DG pour une note SEF
 */
export function useValidationDGByNoteId(noteId: string | undefined, noteType: ValidationNoteType = "SEF") {
  return useQuery({
    queryKey: ["validation-dg", "note", noteId, noteType],
    queryFn: async (): Promise<ValidationDG | null> => {
      if (!noteId) return null;

      const { data, error } = await supabase
        .from("validation_dg")
        .select(`
          *,
          validated_by:profiles!validation_dg_validated_by_user_id_fkey(
            id,
            first_name,
            last_name,
            full_name
          )
        `)
        .eq("note_id", noteId)
        .eq("note_type", noteType)
        .maybeSingle();

      if (error) {
        console.error("Erreur récupération validation DG:", error);
        throw error;
      }

      return data as ValidationDG | null;
    },
    enabled: !!noteId,
  });
}

/**
 * Récupère la validation DG par token (pour la page de validation)
 */
export function useValidationDGByToken(token: string | undefined) {
  return useQuery({
    queryKey: ["validation-dg", "token", token],
    queryFn: async (): Promise<ValidationDGWithNote | null> => {
      if (!token) return null;

      // Récupérer la validation
      const { data: validation, error: valError } = await supabase
        .from("validation_dg")
        .select(`
          *,
          validated_by:profiles!validation_dg_validated_by_user_id_fkey(
            id,
            first_name,
            last_name,
            full_name
          )
        `)
        .eq("token", token)
        .maybeSingle();

      if (valError) {
        console.error("Erreur récupération validation:", valError);
        throw valError;
      }

      if (!validation) return null;

      // Si c'est une note SEF, récupérer les détails
      if (validation.note_type === "SEF") {
        const { data: noteSef, error: noteError } = await supabase
          .from("notes_sef")
          .select(`
            id,
            reference,
            objet,
            description,
            montant,
            expose,
            avis,
            recommandations,
            statut,
            urgence,
            demandeur_display,
            direction:directions(id, sigle, label)
          `)
          .eq("id", validation.note_id)
          .single();

        if (noteError) {
          console.error("Erreur récupération note SEF:", noteError);
        }

        return {
          ...validation,
          note_sef: noteSef,
        } as ValidationDGWithNote;
      }

      return validation as ValidationDGWithNote;
    },
    enabled: !!token,
  });
}

/**
 * Hook pour valider/rejeter/différer via token
 */
export function useValidateDG() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      token,
      status,
      commentaire,
    }: {
      token: string;
      status: ValidationDGStatus;
      commentaire?: string;
    }) => {
      // Appeler la fonction RPC sécurisée
      const { data, error } = await supabase.rpc("validate_note_dg", {
        p_token: token,
        p_status: status,
        p_commentaire: commentaire || null,
      });

      if (error) {
        console.error("Erreur validation:", error);
        throw new Error(error.message);
      }

      const result = data as { success: boolean; error?: string; validation_id?: string; new_status?: string };

      if (!result.success) {
        throw new Error(result.error || "Erreur lors de la validation");
      }

      return result;
    },
    onSuccess: (data, variables) => {
      const statusLabel = VALIDATION_STATUS_LABELS[variables.status];
      toast.success(`Note ${statusLabel.toLowerCase()} avec succès`);

      // Invalider les queries
      queryClient.invalidateQueries({ queryKey: ["validation-dg"] });
      queryClient.invalidateQueries({ queryKey: ["notes-sef"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la validation");
    },
  });
}

/**
 * Hook pour créer manuellement une validation (si pas déjà existante)
 */
export function useCreateValidationDG() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      noteId,
      noteType = "SEF",
      exerciceId,
    }: {
      noteId: string;
      noteType?: ValidationNoteType;
      exerciceId?: string;
    }) => {
      // Vérifier si une validation existe déjà
      const { data: existing } = await supabase
        .from("validation_dg")
        .select("id, token")
        .eq("note_id", noteId)
        .eq("note_type", noteType)
        .maybeSingle();

      if (existing) {
        return existing;
      }

      // Créer la validation
      const baseUrl = window.location.origin + "/dg/valider/";
      const token = crypto.randomUUID();

      const { data, error } = await supabase
        .from("validation_dg")
        .insert({
          note_id: noteId,
          note_type: noteType,
          token: token,
          qr_payload_url: baseUrl + token,
          exercice_id: exerciceId,
        })
        .select()
        .single();

      if (error) {
        console.error("Erreur création validation:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["validation-dg"] });
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de la création de la validation: " + error.message);
    },
  });
}

/**
 * Génère l'URL de validation pour une note
 */
export function getValidationUrl(token: string): string {
  return `${window.location.origin}/dg/valider/${token}`;
}
