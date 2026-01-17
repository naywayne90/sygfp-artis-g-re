/**
 * Hook pour l'autosave des Notes SEF en brouillon
 * 
 * Sauvegarde automatique avec debounce (3s) quand le formulaire change.
 * Ne s'applique qu'aux notes en statut "brouillon".
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { toast } from "sonner";

interface AutosaveData {
  objet?: string;
  description?: string;
  justification?: string;
  direction_id?: string;
  demandeur_id?: string;
  beneficiaire_id?: string | null;
  beneficiaire_interne_id?: string | null;
  urgence?: string;
  date_souhaitee?: string | null;
  commentaire?: string;
  montant_estime?: number;
  type_depense?: string;
  os_id?: string;
  mission_id?: string;
}

interface UseNoteSEFAutosaveOptions {
  noteId?: string | null;
  enabled?: boolean;
  debounceMs?: number;
  onSaveStart?: () => void;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
}

export function useNoteSEFAutosave(options: UseNoteSEFAutosaveOptions = {}) {
  const {
    noteId,
    enabled = true,
    debounceMs = 3000,
    onSaveStart,
    onSaveSuccess,
    onSaveError,
  } = options;

  const { exercice } = useExercice();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingDataRef = useRef<AutosaveData | null>(null);

  /**
   * Effectue la sauvegarde
   */
  const performSave = useCallback(async (data: AutosaveData) => {
    if (!noteId || !data) return;

    try {
      setIsSaving(true);
      onSaveStart?.();

      const { error } = await supabase
        .from("notes_sef")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", noteId)
        .eq("statut", "brouillon"); // Ne sauvegarder que les brouillons

      if (error) {
        throw new Error(error.message);
      }

      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      pendingDataRef.current = null;
      onSaveSuccess?.();
    } catch (error) {
      console.error("Autosave error:", error);
      onSaveError?.(error instanceof Error ? error : new Error("Erreur de sauvegarde"));
    } finally {
      setIsSaving(false);
    }
  }, [noteId, onSaveStart, onSaveSuccess, onSaveError]);

  /**
   * Planifie une sauvegarde avec debounce
   */
  const scheduleSave = useCallback((data: AutosaveData) => {
    if (!enabled || !noteId) return;

    // Stocker les données en attente
    pendingDataRef.current = data;
    setHasUnsavedChanges(true);

    // Annuler le timeout précédent
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Programmer la nouvelle sauvegarde
    timeoutRef.current = setTimeout(() => {
      if (pendingDataRef.current) {
        performSave(pendingDataRef.current);
      }
    }, debounceMs);
  }, [enabled, noteId, debounceMs, performSave]);

  /**
   * Force une sauvegarde immédiate
   */
  const saveNow = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (pendingDataRef.current && noteId) {
      await performSave(pendingDataRef.current);
    }
  }, [noteId, performSave]);

  /**
   * Annule les sauvegardes en attente
   */
  const cancelPendingSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    pendingDataRef.current = null;
    setHasUnsavedChanges(false);
  }, []);

  // Cleanup à la destruction
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Sauvegarder avant de quitter la page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && pendingDataRef.current) {
        e.preventDefault();
        e.returnValue = "Vous avez des modifications non sauvegardées.";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return {
    scheduleSave,
    saveNow,
    cancelPendingSave,
    isSaving,
    lastSaved,
    hasUnsavedChanges,
  };
}

export default useNoteSEFAutosave;
