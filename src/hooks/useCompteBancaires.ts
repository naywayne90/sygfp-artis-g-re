// @ts-nocheck
/**
 * useCompteBancaires - Hook dédié pour la gestion des comptes bancaires
 *
 * Fonctionnalités:
 * - CRUD comptes bancaires
 * - Filtrage par statut (actif/inactif)
 * - Recherche
 * - Export
 * - Activer/Désactiver (pas de suppression)
 * - Validation unicité (numero_compte + banque)
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCallback, useMemo } from "react";

// ============================================
// TYPES
// ============================================

export interface CompteBancaire {
  id: string;
  code: string;
  libelle: string;
  banque: string | null;
  numero_compte: string | null;
  iban: string | null;
  bic: string | null;
  solde_initial: number;
  solde_actuel: number;
  devise: string;
  est_actif: boolean;
  type_compte: string;
  has_movements?: boolean;
  deactivated_at: string | null;
  deactivated_by: string | null;
  deactivation_reason: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string | null;
}

export interface CompteBancaireFilters {
  search?: string;
  statut?: "all" | "actif" | "inactif";
  type_compte?: string;
  banque?: string;
}

export interface CreateCompteBancaireData {
  code: string;
  libelle: string;
  banque?: string;
  numero_compte?: string;
  iban?: string;
  bic?: string;
  solde_initial?: number;
  devise?: string;
  type_compte?: string;
  est_actif?: boolean;
}

export interface UpdateCompteBancaireData extends Partial<CreateCompteBancaireData> {
  id: string;
}

export const TYPES_COMPTE = [
  { value: "courant", label: "Compte courant" },
  { value: "epargne", label: "Compte épargne" },
  { value: "caisse", label: "Caisse" },
  { value: "special", label: "Compte spécial" },
  { value: "devise", label: "Compte en devise" },
];

export const DEVISES = [
  { value: "XAF", label: "Franc CFA (XAF)" },
  { value: "XOF", label: "Franc CFA BCEAO (XOF)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "USD", label: "Dollar US (USD)" },
];

// ============================================
// HOOK
// ============================================

export function useCompteBancaires(filters?: CompteBancaireFilters) {
  const queryClient = useQueryClient();

  // ============================================
  // QUERIES
  // ============================================

  // Récupérer tous les comptes bancaires
  const {
    data: comptes,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["comptes-bancaires", filters],
    queryFn: async () => {
      let query = supabase
        .from("comptes_bancaires")
        .select("*")
        .order("code");

      // Filtrer par statut
      if (filters?.statut === "actif") {
        query = query.eq("est_actif", true);
      } else if (filters?.statut === "inactif") {
        query = query.eq("est_actif", false);
      }

      // Filtrer par type
      if (filters?.type_compte) {
        query = query.eq("type_compte", filters.type_compte);
      }

      // Filtrer par banque
      if (filters?.banque) {
        query = query.eq("banque", filters.banque);
      }

      const { data, error } = await query;
      if (error) throw error;

      let result = (data || []) as CompteBancaire[];

      // Recherche côté client (pour flexibilité)
      if (filters?.search) {
        const search = filters.search.toLowerCase();
        result = result.filter(
          (c) =>
            c.code.toLowerCase().includes(search) ||
            c.libelle.toLowerCase().includes(search) ||
            (c.banque && c.banque.toLowerCase().includes(search)) ||
            (c.numero_compte && c.numero_compte.toLowerCase().includes(search))
        );
      }

      return result;
    },
  });

  // Récupérer les comptes actifs uniquement (pour les sélecteurs)
  const { data: comptesActifs } = useQuery({
    queryKey: ["comptes-bancaires-actifs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comptes_bancaires")
        .select("id, code, libelle, banque, solde_actuel, devise, type_compte")
        .eq("est_actif", true)
        .order("code");
      if (error) throw error;
      return data || [];
    },
  });

  // Stats des comptes
  const stats = useMemo(() => {
    if (!comptes) return { total: 0, actifs: 0, inactifs: 0, soldeTotal: 0 };

    const actifs = comptes.filter((c) => c.est_actif);
    const inactifs = comptes.filter((c) => !c.est_actif);
    const soldeTotal = actifs.reduce((sum, c) => sum + (c.solde_actuel || 0), 0);

    return {
      total: comptes.length,
      actifs: actifs.length,
      inactifs: inactifs.length,
      soldeTotal,
    };
  }, [comptes]);

  // Liste des banques uniques
  const banquesUniques = useMemo(() => {
    if (!comptes) return [];
    const banques = new Set(comptes.map((c) => c.banque).filter(Boolean));
    return Array.from(banques).sort() as string[];
  }, [comptes]);

  // ============================================
  // MUTATIONS
  // ============================================

  // Créer un compte
  const createCompte = useMutation({
    mutationFn: async (data: CreateCompteBancaireData) => {
      // Vérifier unicité numero_compte + banque
      if (data.numero_compte && data.banque) {
        const { data: existing } = await supabase
          .from("comptes_bancaires")
          .select("id")
          .eq("numero_compte", data.numero_compte)
          .eq("banque", data.banque)
          .maybeSingle();

        if (existing) {
          throw new Error(`Un compte avec ce numéro existe déjà chez ${data.banque}`);
        }
      }

      const { data: result, error } = await supabase
        .from("comptes_bancaires")
        .insert([
          {
            ...data,
            solde_actuel: data.solde_initial || 0,
            est_actif: data.est_actif ?? true,
            devise: data.devise || "XAF",
            type_compte: data.type_compte || "courant",
          },
        ])
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("Un compte avec ce code existe déjà");
        }
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      toast.success("Compte bancaire créé avec succès");
      queryClient.invalidateQueries({ queryKey: ["comptes-bancaires"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Mettre à jour un compte
  const updateCompte = useMutation({
    mutationFn: async ({ id, ...data }: UpdateCompteBancaireData) => {
      // Vérifier unicité si numero_compte ou banque changent
      if (data.numero_compte && data.banque) {
        const { data: existing } = await supabase
          .from("comptes_bancaires")
          .select("id")
          .eq("numero_compte", data.numero_compte)
          .eq("banque", data.banque)
          .neq("id", id)
          .maybeSingle();

        if (existing) {
          throw new Error(`Un compte avec ce numéro existe déjà chez ${data.banque}`);
        }
      }

      const { data: result, error } = await supabase
        .from("comptes_bancaires")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast.success("Compte bancaire modifié");
      queryClient.invalidateQueries({ queryKey: ["comptes-bancaires"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Désactiver un compte
  const deactivateCompte = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data, error } = await supabase.rpc("deactivate_compte_bancaire", {
        p_compte_id: id,
        p_reason: reason || "Désactivation manuelle",
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Compte désactivé");
      queryClient.invalidateQueries({ queryKey: ["comptes-bancaires"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Réactiver un compte
  const reactivateCompte = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.rpc("reactivate_compte_bancaire", {
        p_compte_id: id,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Compte réactivé");
      queryClient.invalidateQueries({ queryKey: ["comptes-bancaires"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Vérifier si un compte a des mouvements
  const checkHasMovements = useCallback(async (id: string): Promise<boolean> => {
    const { data, error } = await supabase.rpc("check_compte_has_movements", {
      p_compte_id: id,
    });

    if (error) {
      console.error("Erreur vérification mouvements:", error);
      return true; // Par sécurité, on considère qu'il y a des mouvements
    }

    return data as boolean;
  }, []);

  // ============================================
  // HELPERS
  // ============================================

  // Export des comptes en CSV
  const exportToCSV = useCallback(() => {
    if (!comptes || comptes.length === 0) {
      toast.error("Aucune donnée à exporter");
      return;
    }

    const headers = [
      "Code",
      "Libellé",
      "Banque",
      "N° Compte",
      "IBAN",
      "BIC",
      "Type",
      "Devise",
      "Solde Initial",
      "Solde Actuel",
      "Statut",
    ].join(";");

    const rows = comptes.map((c) =>
      [
        c.code,
        c.libelle,
        c.banque || "",
        c.numero_compte || "",
        c.iban || "",
        c.bic || "",
        TYPES_COMPTE.find((t) => t.value === c.type_compte)?.label || c.type_compte,
        c.devise,
        c.solde_initial,
        c.solde_actuel,
        c.est_actif ? "Actif" : "Inactif",
      ].join(";")
    );

    const content = [headers, ...rows].join("\n");
    const blob = new Blob(["\ufeff" + content], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `comptes_bancaires_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success(`Export de ${comptes.length} compte(s) réussi`);
  }, [comptes]);

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
    comptes,
    comptesActifs,
    stats,
    banquesUniques,
    isLoading,

    // Mutations
    createCompte: createCompte.mutate,
    createCompteAsync: createCompte.mutateAsync,
    updateCompte: updateCompte.mutate,
    updateCompteAsync: updateCompte.mutateAsync,
    deactivateCompte: deactivateCompte.mutate,
    reactivateCompte: reactivateCompte.mutate,

    // Helpers
    checkHasMovements,
    exportToCSV,
    formatMontant,
    refetch,

    // Loading states
    isCreating: createCompte.isPending,
    isUpdating: updateCompte.isPending,
    isDeactivating: deactivateCompte.isPending,
    isReactivating: reactivateCompte.isPending,
  };
}

export default useCompteBancaires;
