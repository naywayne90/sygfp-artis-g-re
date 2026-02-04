// @ts-nocheck
/**
 * useMouvementsTresorerie - Hook pour gérer les mouvements de trésorerie
 *
 * Fonctionnalités:
 * - Mouvements banque (BANK) et caisse (CASH)
 * - Entrées et sorties
 * - Filtres par période, compte/caisse, origine des fonds, sens
 * - Export Excel
 * - Mise à jour automatique des soldes
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCallback, useMemo } from "react";
import { useExercice } from "@/contexts/ExerciceContext";

// ============================================
// TYPES
// ============================================

export type MouvementType = "BANK" | "CASH";
export type MouvementSens = "ENTREE" | "SORTIE";

export interface MouvementTresorerie {
  id: string;
  numero: string;
  type: MouvementType;
  sens: MouvementSens;
  compte_bancaire_id: string | null;
  caisse_id: string | null;
  montant: number;
  solde_avant: number | null;
  solde_apres: number | null;
  date_operation: string;
  date_valeur: string | null;
  libelle: string;
  description: string | null;
  origine_fonds_id: string | null;
  origine_fonds_code: string | null;
  reference_piece: string | null;
  reference_externe: string | null;
  approvisionnement_id: string | null;
  reglement_id: string | null;
  recette_id: string | null;
  pj_url: string | null;
  pj_filename: string | null;
  exercice: number;
  statut: "brouillon" | "valide" | "annule";
  rapproche: boolean;
  date_rapprochement: string | null;
  created_at: string;
  created_by: string | null;
  // Relations
  compte_bancaire?: {
    id: string;
    code: string;
    libelle: string;
    banque: string;
  } | null;
  caisse?: {
    id: string;
    code: string;
    libelle: string;
  } | null;
  origine_fonds?: {
    id: string;
    code: string;
    libelle: string;
  } | null;
  createur?: {
    id: string;
    full_name: string;
  } | null;
}

export interface MouvementFilters {
  type?: MouvementType;
  sens?: MouvementSens;
  compte_bancaire_id?: string;
  caisse_id?: string;
  origine_fonds_id?: string;
  statut?: "brouillon" | "valide" | "annule" | "all";
  rapproche?: boolean;
  date_debut?: string;
  date_fin?: string;
  search?: string;
}

export interface CreateMouvementData {
  type: MouvementType;
  sens: MouvementSens;
  compte_bancaire_id?: string;
  caisse_id?: string;
  montant: number;
  date_operation: string;
  date_valeur?: string;
  libelle: string;
  description?: string;
  origine_fonds_id?: string;
  origine_fonds_code?: string;
  reference_piece?: string;
  reference_externe?: string;
  pj_url?: string;
  pj_filename?: string;
  statut?: "brouillon" | "valide";
}

// ============================================
// HOOK
// ============================================

export function useMouvementsTresorerie(filters?: MouvementFilters) {
  const queryClient = useQueryClient();
  const { selectedExercice } = useExercice();
  const exerciceAnnee = selectedExercice?.annee || new Date().getFullYear();

  // ============================================
  // QUERIES
  // ============================================

  // Récupérer les mouvements
  const {
    data: mouvements,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["mouvements-tresorerie", filters, exerciceAnnee],
    queryFn: async () => {
      let query = supabase
        .from("mouvements_tresorerie")
        .select(`
          *,
          compte_bancaire:comptes_bancaires(id, code, libelle, banque),
          caisse:caisses(id, code, libelle),
          origine_fonds:funding_sources(id, code, libelle),
          createur:profiles!mouvements_tresorerie_created_by_fkey(id, full_name)
        `)
        .eq("exercice", exerciceAnnee)
        .order("date_operation", { ascending: false })
        .order("created_at", { ascending: false });

      // Filtrer par type
      if (filters?.type) {
        query = query.eq("type", filters.type);
      }

      // Filtrer par sens
      if (filters?.sens) {
        query = query.eq("sens", filters.sens);
      }

      // Filtrer par compte bancaire
      if (filters?.compte_bancaire_id) {
        query = query.eq("compte_bancaire_id", filters.compte_bancaire_id);
      }

      // Filtrer par caisse
      if (filters?.caisse_id) {
        query = query.eq("caisse_id", filters.caisse_id);
      }

      // Filtrer par origine des fonds
      if (filters?.origine_fonds_id) {
        query = query.eq("origine_fonds_id", filters.origine_fonds_id);
      }

      // Filtrer par statut
      if (filters?.statut && filters.statut !== "all") {
        query = query.eq("statut", filters.statut);
      }

      // Filtrer par rapprochement
      if (filters?.rapproche !== undefined) {
        query = query.eq("rapproche", filters.rapproche);
      }

      // Filtrer par période
      if (filters?.date_debut) {
        query = query.gte("date_operation", filters.date_debut);
      }
      if (filters?.date_fin) {
        query = query.lte("date_operation", filters.date_fin);
      }

      const { data, error } = await query;
      if (error) throw error;

      let result = (data || []) as MouvementTresorerie[];

      // Recherche côté client
      if (filters?.search) {
        const search = filters.search.toLowerCase();
        result = result.filter(
          (m) =>
            m.numero.toLowerCase().includes(search) ||
            m.libelle.toLowerCase().includes(search) ||
            m.reference_piece?.toLowerCase().includes(search) ||
            m.description?.toLowerCase().includes(search) ||
            m.compte_bancaire?.libelle.toLowerCase().includes(search) ||
            m.caisse?.libelle.toLowerCase().includes(search)
        );
      }

      return result;
    },
  });

  // Stats
  const stats = useMemo(() => {
    if (!mouvements) {
      return {
        total: 0,
        entrees: 0,
        sorties: 0,
        montantEntrees: 0,
        montantSorties: 0,
        soldeNet: 0,
      };
    }

    const entrees = mouvements.filter((m) => m.sens === "ENTREE");
    const sorties = mouvements.filter((m) => m.sens === "SORTIE");
    const montantEntrees = entrees.reduce((sum, m) => sum + m.montant, 0);
    const montantSorties = sorties.reduce((sum, m) => sum + m.montant, 0);

    return {
      total: mouvements.length,
      entrees: entrees.length,
      sorties: sorties.length,
      montantEntrees,
      montantSorties,
      soldeNet: montantEntrees - montantSorties,
    };
  }, [mouvements]);

  // ============================================
  // MUTATIONS
  // ============================================

  // Créer un mouvement
  const createMouvement = useMutation({
    mutationFn: async (data: CreateMouvementData) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;

      // Validation
      if (data.type === "BANK" && !data.compte_bancaire_id) {
        throw new Error("Veuillez sélectionner un compte bancaire");
      }
      if (data.type === "CASH" && !data.caisse_id) {
        throw new Error("Veuillez sélectionner une caisse");
      }
      if (data.montant <= 0) {
        throw new Error("Le montant doit être supérieur à 0");
      }
      if (!data.libelle?.trim()) {
        throw new Error("Le libellé est obligatoire");
      }

      const { data: result, error } = await supabase
        .from("mouvements_tresorerie")
        .insert([
          {
            type: data.type,
            sens: data.sens,
            compte_bancaire_id: data.type === "BANK" ? data.compte_bancaire_id : null,
            caisse_id: data.type === "CASH" ? data.caisse_id : null,
            montant: data.montant,
            date_operation: data.date_operation,
            date_valeur: data.date_valeur || null,
            libelle: data.libelle.trim(),
            description: data.description?.trim() || null,
            origine_fonds_id: data.origine_fonds_id || null,
            origine_fonds_code: data.origine_fonds_code || null,
            reference_piece: data.reference_piece?.trim() || null,
            reference_externe: data.reference_externe?.trim() || null,
            pj_url: data.pj_url || null,
            pj_filename: data.pj_filename || null,
            exercice: exerciceAnnee,
            statut: data.statut || "valide",
            created_by: userId,
          },
        ])
        .select(`
          *,
          compte_bancaire:comptes_bancaires(id, code, libelle, banque),
          caisse:caisses(id, code, libelle),
          origine_fonds:funding_sources(id, code, libelle)
        `)
        .single();

      if (error) throw error;
      return result as MouvementTresorerie;
    },
    onSuccess: (data) => {
      toast.success(`Mouvement ${data.numero} créé`);
      queryClient.invalidateQueries({ queryKey: ["mouvements-tresorerie"] });
      queryClient.invalidateQueries({ queryKey: ["comptes-bancaires"] });
      queryClient.invalidateQueries({ queryKey: ["caisses"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Annuler un mouvement
  const annulerMouvement = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("mouvements_tresorerie")
        .update({ statut: "annule" })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Mouvement annulé");
      queryClient.invalidateQueries({ queryKey: ["mouvements-tresorerie"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Marquer comme rapproché
  const marquerRapproche = useMutation({
    mutationFn: async ({ id, rapproche }: { id: string; rapproche: boolean }) => {
      const { data, error } = await supabase
        .from("mouvements_tresorerie")
        .update({
          rapproche,
          date_rapprochement: rapproche ? new Date().toISOString().split("T")[0] : null,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success(variables.rapproche ? "Mouvement rapproché" : "Rapprochement annulé");
      queryClient.invalidateQueries({ queryKey: ["mouvements-tresorerie"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // ============================================
  // HELPERS
  // ============================================

  // Export Excel/CSV
  const exportToExcel = useCallback(() => {
    if (!mouvements || mouvements.length === 0) {
      toast.error("Aucune donnée à exporter");
      return;
    }

    const headers = [
      "Numéro",
      "Type",
      "Sens",
      "Date Opération",
      "Date Valeur",
      "Compte/Caisse",
      "Libellé",
      "Origine Fonds",
      "Montant",
      "Solde Avant",
      "Solde Après",
      "Référence Pièce",
      "Statut",
      "Rapproché",
      "Créé par",
      "Date création",
    ].join(";");

    const rows = mouvements.map((m) =>
      [
        m.numero,
        m.type === "BANK" ? "Banque" : "Caisse",
        m.sens === "ENTREE" ? "Entrée" : "Sortie",
        new Date(m.date_operation).toLocaleDateString("fr-FR"),
        m.date_valeur ? new Date(m.date_valeur).toLocaleDateString("fr-FR") : "",
        m.type === "BANK"
          ? `${m.compte_bancaire?.code} - ${m.compte_bancaire?.libelle}`
          : `${m.caisse?.code} - ${m.caisse?.libelle}`,
        m.libelle,
        m.origine_fonds?.libelle || m.origine_fonds_code || "",
        m.sens === "ENTREE" ? m.montant : -m.montant,
        m.solde_avant ?? "",
        m.solde_apres ?? "",
        m.reference_piece || "",
        m.statut,
        m.rapproche ? "Oui" : "Non",
        m.createur?.full_name || "",
        new Date(m.created_at).toLocaleDateString("fr-FR"),
      ]
        .map((c) => `"${c}"`)
        .join(";")
    );

    const content = [headers, ...rows].join("\n");
    const blob = new Blob(["\ufeff" + content], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `mouvements_tresorerie_${exerciceAnnee}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success(`Export de ${mouvements.length} mouvement(s) réussi`);
  }, [mouvements, exerciceAnnee]);

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

  // Couleur selon sens
  const getSensColor = useCallback((sens: MouvementSens) => {
    return sens === "ENTREE"
      ? "text-green-600 bg-green-50"
      : "text-red-600 bg-red-50";
  }, []);

  // Label sens
  const getSensLabel = useCallback((sens: MouvementSens) => {
    return sens === "ENTREE" ? "Entrée" : "Sortie";
  }, []);

  // ============================================
  // RETURN
  // ============================================

  return {
    // Data
    mouvements,
    stats,
    isLoading,
    exerciceAnnee,

    // Mutations
    createMouvement: createMouvement.mutate,
    createMouvementAsync: createMouvement.mutateAsync,
    annulerMouvement: annulerMouvement.mutate,
    marquerRapproche: marquerRapproche.mutate,

    // Helpers
    exportToExcel,
    formatMontant,
    getSensColor,
    getSensLabel,
    refetch,

    // Loading states
    isCreating: createMouvement.isPending,
    isAnnulating: annulerMouvement.isPending,
    isMarking: marquerRapproche.isPending,
  };
}

export default useMouvementsTresorerie;
