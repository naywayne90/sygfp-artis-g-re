/**
 * useFundingSources - Hook pour gérer les sources/origines de financement
 *
 * Fonctionnalités:
 * - Liste des sources (actives, inactives, toutes)
 * - CRUD complet avec validation
 * - Désactivation/Réactivation (soft-delete)
 * - Mapping des anciennes valeurs texte
 * - Export CSV
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCallback } from "react";

// ============================================
// TYPES
// ============================================

export interface FundingSource {
  id: string;
  code: string;
  libelle: string;
  type: FundingSourceType;
  description: string | null;
  est_actif: boolean;
  ordre: number;
  legacy_codes: string[] | null;
  deactivated_at: string | null;
  deactivated_by: string | null;
  deactivation_reason: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
}

export type FundingSourceType = "etat" | "partenaire" | "recette" | "emprunt" | "don" | "autre";

export interface FundingSourceFilters {
  status?: "active" | "inactive" | "all";
  type?: FundingSourceType | "all";
  search?: string;
}

export interface CreateFundingSourceData {
  code: string;
  libelle: string;
  type: FundingSourceType;
  description?: string;
  ordre?: number;
  legacy_codes?: string[];
}

export interface UpdateFundingSourceData extends Partial<CreateFundingSourceData> {
  id: string;
}

// Types de financement avec labels
export const FUNDING_SOURCE_TYPES: { value: FundingSourceType; label: string }[] = [
  { value: "etat", label: "État" },
  { value: "partenaire", label: "Partenaire" },
  { value: "recette", label: "Recette" },
  { value: "emprunt", label: "Emprunt" },
  { value: "don", label: "Don" },
  { value: "autre", label: "Autre" },
];

// ============================================
// HOOK
// ============================================

export function useFundingSources(filters?: FundingSourceFilters) {
  const queryClient = useQueryClient();

  // ============================================
  // QUERIES
  // ============================================

  // Liste complète des sources avec filtres
  const {
    data: sources,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["funding-sources", filters],
    queryFn: async () => {
      let query = supabase
        .from("funding_sources")
        .select("*")
        .order("ordre", { ascending: true })
        .order("libelle", { ascending: true });

      // Filtre par statut
      if (filters?.status === "active") {
        query = query.eq("est_actif", true);
      } else if (filters?.status === "inactive") {
        query = query.eq("est_actif", false);
      }

      // Filtre par type
      if (filters?.type && filters.type !== "all") {
        query = query.eq("type", filters.type);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filtre par recherche côté client
      let result = data as FundingSource[];
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        result = result.filter(
          (s) =>
            s.code.toLowerCase().includes(searchLower) ||
            s.libelle.toLowerCase().includes(searchLower) ||
            s.description?.toLowerCase().includes(searchLower)
        );
      }

      return result;
    },
  });

  // Sources actives uniquement (pour les sélecteurs)
  const { data: activeSources } = useQuery({
    queryKey: ["funding-sources-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("funding_sources")
        .select("id, code, libelle, type, ordre")
        .eq("est_actif", true)
        .order("ordre", { ascending: true })
        .order("libelle", { ascending: true });

      if (error) throw error;
      return data as Pick<FundingSource, "id" | "code" | "libelle" | "type" | "ordre">[];
    },
  });

  // Statistiques
  const { data: stats } = useQuery({
    queryKey: ["funding-sources-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("funding_sources")
        .select("est_actif, type");

      if (error) throw error;

      const sources = data || [];
      const activeCount = sources.filter((s) => s.est_actif).length;
      const inactiveCount = sources.filter((s) => !s.est_actif).length;

      // Compter par type
      const byType: Record<string, number> = {};
      sources.forEach((s) => {
        byType[s.type] = (byType[s.type] || 0) + 1;
      });

      return {
        total: sources.length,
        activeCount,
        inactiveCount,
        byType,
      };
    },
  });

  // ============================================
  // MUTATIONS
  // ============================================

  // Créer une source
  const createSource = useMutation({
    mutationFn: async (data: CreateFundingSourceData) => {
      const { data: result, error } = await supabase
        .from("funding_sources")
        .insert({
          code: data.code.toUpperCase().trim(),
          libelle: data.libelle.trim(),
          type: data.type,
          description: data.description?.trim() || null,
          ordre: data.ordre || 0,
          legacy_codes: data.legacy_codes || [],
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("Ce code existe déjà");
        }
        throw error;
      }

      return result as FundingSource;
    },
    onSuccess: () => {
      toast.success("Source de financement créée");
      queryClient.invalidateQueries({ queryKey: ["funding-sources"] });
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Mettre à jour une source
  const updateSource = useMutation({
    mutationFn: async (data: UpdateFundingSourceData) => {
      const { id, ...updates } = data;

      const updateData: Record<string, any> = {};
      if (updates.code) updateData.code = updates.code.toUpperCase().trim();
      if (updates.libelle) updateData.libelle = updates.libelle.trim();
      if (updates.type) updateData.type = updates.type;
      if (updates.description !== undefined)
        updateData.description = updates.description?.trim() || null;
      if (updates.ordre !== undefined) updateData.ordre = updates.ordre;
      if (updates.legacy_codes !== undefined)
        updateData.legacy_codes = updates.legacy_codes;

      const { data: result, error } = await supabase
        .from("funding_sources")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("Ce code existe déjà");
        }
        throw error;
      }

      return result as FundingSource;
    },
    onSuccess: () => {
      toast.success("Source de financement mise à jour");
      queryClient.invalidateQueries({ queryKey: ["funding-sources"] });
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Désactiver une source
  const deactivateSource = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data, error } = await supabase.rpc("deactivate_funding_source", {
        p_source_id: id,
        p_reason: reason || null,
      });

      if (error) throw error;
      return data as FundingSource;
    },
    onSuccess: () => {
      toast.success("Source de financement désactivée");
      queryClient.invalidateQueries({ queryKey: ["funding-sources"] });
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Réactiver une source
  const reactivateSource = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.rpc("reactivate_funding_source", {
        p_source_id: id,
      });

      if (error) throw error;
      return data as FundingSource;
    },
    onSuccess: () => {
      toast.success("Source de financement réactivée");
      queryClient.invalidateQueries({ queryKey: ["funding-sources"] });
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // ============================================
  // HELPERS
  // ============================================

  /**
   * Obtenir le libellé d'un type
   */
  const getTypeLabel = useCallback((type: FundingSourceType): string => {
    return FUNDING_SOURCE_TYPES.find((t) => t.value === type)?.label || type;
  }, []);

  /**
   * Obtenir la couleur d'un type
   */
  const getTypeColor = useCallback((type: FundingSourceType): string => {
    const colors: Record<FundingSourceType, string> = {
      etat: "bg-blue-100 text-blue-800",
      partenaire: "bg-green-100 text-green-800",
      recette: "bg-purple-100 text-purple-800",
      emprunt: "bg-orange-100 text-orange-800",
      don: "bg-pink-100 text-pink-800",
      autre: "bg-gray-100 text-gray-800",
    };
    return colors[type] || colors.autre;
  }, []);

  /**
   * Obtenir le libellé d'une source par son code ou valeur legacy
   */
  const getSourceLabel = useCallback(
    (codeOrLegacy: string | null | undefined): string => {
      if (!codeOrLegacy) return "-";

      // Chercher dans les sources actives
      const source = activeSources?.find(
        (s) =>
          s.code === codeOrLegacy ||
          s.code.toLowerCase() === codeOrLegacy.toLowerCase()
      );

      if (source) return source.libelle;

      // Chercher dans toutes les sources (y compris inactives)
      const allSource = sources?.find(
        (s) =>
          s.code === codeOrLegacy ||
          s.code.toLowerCase() === codeOrLegacy.toLowerCase() ||
          s.legacy_codes?.includes(codeOrLegacy)
      );

      if (allSource) return allSource.libelle;

      // Fallback: retourner la valeur originale formatée
      return codeOrLegacy.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    },
    [activeSources, sources]
  );

  /**
   * Export CSV
   */
  const exportToCSV = useCallback(() => {
    if (!sources || sources.length === 0) {
      toast.error("Aucune donnée à exporter");
      return;
    }

    const headers = ["Code", "Libellé", "Type", "Description", "Actif", "Ordre"];
    const rows = sources.map((s) => [
      s.code,
      s.libelle,
      getTypeLabel(s.type),
      s.description || "",
      s.est_actif ? "Oui" : "Non",
      s.ordre.toString(),
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map((r) => r.map((c) => `"${c}"`).join(";")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `origines_fonds_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success("Export CSV téléchargé");
  }, [sources, getTypeLabel]);

  // ============================================
  // RETURN
  // ============================================

  return {
    // Data
    sources,
    activeSources,
    stats,
    isLoading,

    // Actions
    createSource: createSource.mutate,
    createSourceAsync: createSource.mutateAsync,
    updateSource: updateSource.mutate,
    updateSourceAsync: updateSource.mutateAsync,
    deactivateSource: deactivateSource.mutate,
    reactivateSource: reactivateSource.mutate,
    refetch,

    // Helpers
    getTypeLabel,
    getTypeColor,
    getSourceLabel,
    exportToCSV,

    // Loading states
    isCreating: createSource.isPending,
    isUpdating: updateSource.isPending,
    isDeactivating: deactivateSource.isPending,
    isReactivating: reactivateSource.isPending,
  };
}

export default useFundingSources;
