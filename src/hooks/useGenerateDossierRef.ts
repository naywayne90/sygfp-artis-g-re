// @ts-nocheck
/**
 * Hook pour générer des références dossier uniques (dossier_ref)
 * Format: ARTI + MM(2) + YY(2) + NNNNNN(6) = 14 chars
 * Ex: ARTI0126000001 (janvier 2026, premier dossier)
 *
 * Utilise une fonction RPC avec lock advisory pour garantir
 * zéro collision même en création simultanée.
 */

import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ============================================
// TYPES
// ============================================

interface GenerateDossierRefResult {
  dossierRef: string;
  mois: number;
  annee: number;
  numero: number;
}

interface ParsedDossierRef {
  mois: number;
  annee: number;
  numero: number;
  isValid: boolean;
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Parse une référence dossier pour extraire ses composants
 * @param ref Référence au format ARTI + MM + YY + NNNNNN
 */
export function parseDossierRef(ref: string | null | undefined): ParsedDossierRef {
  if (!ref || ref.length !== 14 || !ref.startsWith("ARTI")) {
    return { mois: 0, annee: 0, numero: 0, isValid: false };
  }

  const regex = /^ARTI(\d{2})(\d{2})(\d{6})$/;
  const match = ref.match(regex);

  if (!match) {
    return { mois: 0, annee: 0, numero: 0, isValid: false };
  }

  return {
    mois: parseInt(match[1], 10),
    annee: 2000 + parseInt(match[2], 10),
    numero: parseInt(match[3], 10),
    isValid: true,
  };
}

/**
 * Valide le format d'une référence dossier
 */
export function isValidDossierRef(ref: string | null | undefined): boolean {
  if (!ref) return false;
  return /^ARTI\d{10}$/.test(ref);
}

/**
 * Formate une référence pour affichage (ajoute des espaces)
 * Ex: ARTI0126000001 → ARTI 01-26 000001
 */
export function formatDossierRefDisplay(ref: string | null | undefined): string {
  if (!ref || !isValidDossierRef(ref)) return ref || "-";

  const parsed = parseDossierRef(ref);
  if (!parsed.isValid) return ref;

  return `ARTI ${String(parsed.mois).padStart(2, "0")}-${String(
    parsed.annee % 100
  ).padStart(2, "0")} ${String(parsed.numero).padStart(6, "0")}`;
}

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useGenerateDossierRef() {
  const queryClient = useQueryClient();
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);

  /**
   * Génère une nouvelle référence dossier unique via RPC
   * Utilise un lock advisory côté serveur pour garantir l'atomicité
   */
  const generateMutation = useMutation({
    mutationFn: async (): Promise<GenerateDossierRefResult> => {
      const { data, error } = await supabase.rpc("get_next_dossier_ref");

      if (error) {
        throw new Error(`Erreur génération dossier_ref: ${error.message}`);
      }

      if (!data || typeof data !== "string") {
        throw new Error("Référence dossier invalide retournée par le serveur");
      }

      const parsed = parseDossierRef(data);
      if (!parsed.isValid) {
        throw new Error(`Format de référence invalide: ${data}`);
      }

      setLastGenerated(data);

      return {
        dossierRef: data,
        mois: parsed.mois,
        annee: parsed.annee,
        numero: parsed.numero,
      };
    },
    onSuccess: () => {
      // Invalider les requêtes qui pourraient dépendre du compteur
      queryClient.invalidateQueries({ queryKey: ["dossier-ref-counters"] });
    },
  });

  /**
   * Génère une référence et retourne une promesse
   */
  const generate = useCallback(async (): Promise<string> => {
    const result = await generateMutation.mutateAsync();
    return result.dossierRef;
  }, [generateMutation]);

  /**
   * Génère plusieurs références en séquence (pour batch)
   * Chaque appel est atomique côté serveur
   */
  const generateBatch = useCallback(
    async (count: number): Promise<string[]> => {
      const refs: string[] = [];
      for (let i = 0; i < count; i++) {
        const ref = await generate();
        refs.push(ref);
      }
      return refs;
    },
    [generate]
  );

  return {
    // Mutation state
    isGenerating: generateMutation.isPending,
    error: generateMutation.error,
    lastGenerated,

    // Actions
    generate,
    generateBatch,

    // Utilitaires
    parseDossierRef,
    isValidDossierRef,
    formatDossierRefDisplay,
  };
}

// ============================================
// HOOK SIMPLIFIÉ POUR LECTURE SEULE
// ============================================

/**
 * Hook pour parser/valider des références sans générer
 */
export function useDossierRefUtils() {
  return {
    parse: parseDossierRef,
    isValid: isValidDossierRef,
    format: formatDossierRefDisplay,
  };
}

export default useGenerateDossierRef;
