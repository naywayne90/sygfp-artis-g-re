/**
 * useCaisses - Hook pour gérer les caisses de trésorerie
 *
 * Fonctionnalités:
 * - Liste des caisses (actives, inactives, toutes)
 * - CRUD complet avec validation
 * - Désactivation/Réactivation (soft-delete)
 * - Export CSV
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCallback, useMemo } from "react";

// ============================================
// TYPES
// ============================================

export interface Caisse {
  id: string;
  code: string;
  libelle: string;
  description: string | null;
  solde_initial: number;
  solde_actuel: number;
  devise: string;
  plafond: number | null;
  responsable_id: string | null;
  direction_id: string | null;
  est_actif: boolean;
  deactivated_at: string | null;
  deactivated_by: string | null;
  deactivation_reason: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  // Relations
  responsable?: { id: string; full_name: string } | null;
  direction?: { id: string; code: string; libelle: string } | null;
}

export interface CaisseFilters {
  search?: string;
  statut?: "all" | "actif" | "inactif";
  direction_id?: string;
}

export interface CreateCaisseData {
  code: string;
  libelle: string;
  description?: string;
  solde_initial?: number;
  devise?: string;
  plafond?: number;
  responsable_id?: string;
  direction_id?: string;
}

export interface UpdateCaisseData extends Partial<CreateCaisseData> {
  id: string;
}

// ============================================
// HOOK
// ============================================

export function useCaisses(filters?: CaisseFilters) {
  const queryClient = useQueryClient();

  // ============================================
  // QUERIES
  // ============================================

  // Récupérer toutes les caisses
  const {
    data: caisses,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["caisses", filters],
    queryFn: async () => {
      let query = supabase
        .from("caisses")
        .select(`
          *,
          responsable:profiles!caisses_responsable_id_fkey(id, full_name),
          direction:directions(id, code, label)
        `)
        .order("code");

      // Filtrer par statut
      if (filters?.statut === "actif") {
        query = query.eq("est_actif", true);
      } else if (filters?.statut === "inactif") {
        query = query.eq("est_actif", false);
      }

      // Filtrer par direction
      if (filters?.direction_id) {
        query = query.eq("direction_id", filters.direction_id);
      }

      const { data, error } = await query;
      if (error) throw error;

      let result = (data || []) as Caisse[];

      // Recherche côté client
      if (filters?.search) {
        const search = filters.search.toLowerCase();
        result = result.filter(
          (c) =>
            c.code.toLowerCase().includes(search) ||
            c.libelle.toLowerCase().includes(search) ||
            c.description?.toLowerCase().includes(search)
        );
      }

      return result;
    },
  });

  // Récupérer les caisses actives uniquement (pour les sélecteurs)
  const { data: caissesActives } = useQuery({
    queryKey: ["caisses-actives"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("caisses")
        .select("id, code, libelle, solde_actuel, devise, plafond")
        .eq("est_actif", true)
        .order("code");
      if (error) throw error;
      return data || [];
    },
  });

  // Stats des caisses
  const stats = useMemo(() => {
    if (!caisses) return { total: 0, actives: 0, inactives: 0, soldeTotal: 0 };

    const actives = caisses.filter((c) => c.est_actif);
    const inactives = caisses.filter((c) => !c.est_actif);
    const soldeTotal = actives.reduce((sum, c) => sum + (c.solde_actuel || 0), 0);

    return {
      total: caisses.length,
      actives: actives.length,
      inactives: inactives.length,
      soldeTotal,
    };
  }, [caisses]);

  // ============================================
  // MUTATIONS
  // ============================================

  // Créer une caisse
  const createCaisse = useMutation({
    mutationFn: async (data: CreateCaisseData) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;

      const { data: result, error } = await supabase
        .from("caisses")
        .insert([
          {
            code: data.code.toUpperCase().trim(),
            libelle: data.libelle.trim(),
            description: data.description?.trim() || null,
            solde_initial: data.solde_initial || 0,
            solde_actuel: data.solde_initial || 0,
            devise: data.devise || "XAF",
            plafond: data.plafond || null,
            responsable_id: data.responsable_id || null,
            direction_id: data.direction_id || null,
            created_by: userId,
          },
        ])
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("Une caisse avec ce code existe déjà");
        }
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      toast.success("Caisse créée avec succès");
      queryClient.invalidateQueries({ queryKey: ["caisses"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Mettre à jour une caisse
  const updateCaisse = useMutation({
    mutationFn: async ({ id, ...data }: UpdateCaisseData) => {
      const updateData: Record<string, any> = { updated_at: new Date().toISOString() };

      if (data.code) updateData.code = data.code.toUpperCase().trim();
      if (data.libelle) updateData.libelle = data.libelle.trim();
      if (data.description !== undefined) updateData.description = data.description?.trim() || null;
      if (data.solde_initial !== undefined) updateData.solde_initial = data.solde_initial;
      if (data.devise) updateData.devise = data.devise;
      if (data.plafond !== undefined) updateData.plafond = data.plafond;
      if (data.responsable_id !== undefined) updateData.responsable_id = data.responsable_id;
      if (data.direction_id !== undefined) updateData.direction_id = data.direction_id;

      const { data: result, error } = await supabase
        .from("caisses")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("Une caisse avec ce code existe déjà");
        }
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      toast.success("Caisse modifiée");
      queryClient.invalidateQueries({ queryKey: ["caisses"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Désactiver une caisse
  const deactivateCaisse = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data, error } = await supabase.rpc("deactivate_caisse", {
        p_caisse_id: id,
        p_reason: reason || "Désactivation manuelle",
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Caisse désactivée");
      queryClient.invalidateQueries({ queryKey: ["caisses"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Réactiver une caisse
  const reactivateCaisse = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.rpc("reactivate_caisse", {
        p_caisse_id: id,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Caisse réactivée");
      queryClient.invalidateQueries({ queryKey: ["caisses"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // ============================================
  // HELPERS
  // ============================================

  // Export CSV
  const exportToCSV = useCallback(() => {
    if (!caisses || caisses.length === 0) {
      toast.error("Aucune donnée à exporter");
      return;
    }

    const headers = [
      "Code",
      "Libellé",
      "Description",
      "Devise",
      "Solde Initial",
      "Solde Actuel",
      "Plafond",
      "Responsable",
      "Direction",
      "Statut",
    ].join(";");

    const rows = caisses.map((c) =>
      [
        c.code,
        c.libelle,
        c.description || "",
        c.devise,
        c.solde_initial,
        c.solde_actuel,
        c.plafond || "",
        c.responsable?.full_name || "",
        c.direction?.libelle || "",
        c.est_actif ? "Active" : "Inactive",
      ].join(";")
    );

    const content = [headers, ...rows].join("\n");
    const blob = new Blob(["\ufeff" + content], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `caisses_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success(`Export de ${caisses.length} caisse(s) réussi`);
  }, [caisses]);

  // Formater montant
  const formatMontant = useCallback((montant: number, devise?: string) => {
    return (
      new Intl.NumberFormat("fr-FR", {
        style: "decimal",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(montant) + ` ${devise || "FCFA"}`
    );
  }, []);

  // ============================================
  // RETURN
  // ============================================

  return {
    // Data
    caisses,
    caissesActives,
    stats,
    isLoading,

    // Mutations
    createCaisse: createCaisse.mutate,
    createCaisseAsync: createCaisse.mutateAsync,
    updateCaisse: updateCaisse.mutate,
    updateCaisseAsync: updateCaisse.mutateAsync,
    deactivateCaisse: deactivateCaisse.mutate,
    reactivateCaisse: reactivateCaisse.mutate,

    // Helpers
    exportToCSV,
    formatMontant,
    refetch,

    // Loading states
    isCreating: createCaisse.isPending,
    isUpdating: updateCaisse.isPending,
    isDeactivating: deactivateCaisse.isPending,
    isReactivating: reactivateCaisse.isPending,
  };
}

export default useCaisses;
