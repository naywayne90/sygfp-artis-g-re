/**
 * useApprovisionnementsTresorerie - Hook pour gérer les approvisionnements de trésorerie
 *
 * Fonctionnalités:
 * - Approvisionnements banque (BANK) et caisse (CASH)
 * - Filtres par période, compte/caisse, origine des fonds
 * - Export Excel
 * - Création avec mise à jour automatique des soldes
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCallback } from "react";
import { useExercice } from "@/contexts/ExerciceContext";

// ============================================
// TYPES
// ============================================

export type ApprovisionnementType = "BANK" | "CASH";

export interface Approvisionnement {
  id: string;
  numero: string;
  type: ApprovisionnementType;
  compte_bancaire_id: string | null;
  caisse_id: string | null;
  montant: number;
  date_operation: string;
  date_valeur: string | null;
  origine_fonds_id: string | null;
  origine_fonds_code: string | null;
  reference_piece: string | null;
  description: string | null;
  pj_url: string | null;
  pj_filename: string | null;
  exercice: number;
  statut: "brouillon" | "valide" | "annule";
  created_at: string;
  created_by: string | null;
  validated_at: string | null;
  validated_by: string | null;
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

export interface ApprovisionnementFilters {
  type?: ApprovisionnementType;
  compte_bancaire_id?: string;
  caisse_id?: string;
  origine_fonds_id?: string;
  statut?: "brouillon" | "valide" | "annule" | "all";
  date_debut?: string;
  date_fin?: string;
  search?: string;
}

export interface CreateApprovisionnementData {
  type: ApprovisionnementType;
  compte_bancaire_id?: string;
  caisse_id?: string;
  montant: number;
  date_operation: string;
  date_valeur?: string;
  origine_fonds_id?: string;
  origine_fonds_code?: string;
  reference_piece?: string;
  description?: string;
  pj_url?: string;
  pj_filename?: string;
  statut?: "brouillon" | "valide";
}

// ============================================
// HOOK
// ============================================

export function useApprovisionnementsTresorerie(filters?: ApprovisionnementFilters) {
  const queryClient = useQueryClient();
  const { selectedExercice } = useExercice();
  const exerciceAnnee = selectedExercice?.annee || new Date().getFullYear();

  // ============================================
  // QUERIES
  // ============================================

  // Récupérer les approvisionnements
  const {
    data: approvisionnements,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["approvisionnements-tresorerie", filters, exerciceAnnee],
    queryFn: async () => {
      let query = supabase
        .from("approvisionnements")
        .select(`
          *,
          compte_bancaire:comptes_bancaires(id, code, libelle, banque),
          caisse:caisses(id, code, libelle),
          origine_fonds:funding_sources(id, code, libelle),
          createur:profiles!approvisionnements_created_by_fkey(id, full_name)
        `)
        .eq("exercice", exerciceAnnee)
        .order("date_operation", { ascending: false })
        .order("created_at", { ascending: false });

      // Filtrer par type
      if (filters?.type) {
        query = query.eq("type", filters.type);
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

      // Filtrer par période
      if (filters?.date_debut) {
        query = query.gte("date_operation", filters.date_debut);
      }
      if (filters?.date_fin) {
        query = query.lte("date_operation", filters.date_fin);
      }

      const { data, error } = await query;
      if (error) throw error;

      let result = (data || []) as Approvisionnement[];

      // Recherche côté client
      if (filters?.search) {
        const search = filters.search.toLowerCase();
        result = result.filter(
          (a) =>
            a.numero.toLowerCase().includes(search) ||
            a.reference_piece?.toLowerCase().includes(search) ||
            a.description?.toLowerCase().includes(search) ||
            a.compte_bancaire?.libelle.toLowerCase().includes(search) ||
            a.caisse?.libelle.toLowerCase().includes(search)
        );
      }

      return result;
    },
  });

  // Stats
  const stats = {
    total: approvisionnements?.length || 0,
    montantTotal: approvisionnements?.reduce((sum, a) => sum + a.montant, 0) || 0,
    parType: {
      BANK: approvisionnements?.filter((a) => a.type === "BANK").length || 0,
      CASH: approvisionnements?.filter((a) => a.type === "CASH").length || 0,
    },
  };

  // ============================================
  // MUTATIONS
  // ============================================

  // Créer un approvisionnement
  const createApprovisionnement = useMutation({
    mutationFn: async (data: CreateApprovisionnementData) => {
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

      const { data: result, error } = await supabase
        .from("approvisionnements")
        .insert([
          {
            type: data.type,
            compte_bancaire_id: data.type === "BANK" ? data.compte_bancaire_id : null,
            caisse_id: data.type === "CASH" ? data.caisse_id : null,
            montant: data.montant,
            date_operation: data.date_operation,
            date_valeur: data.date_valeur || null,
            origine_fonds_id: data.origine_fonds_id || null,
            origine_fonds_code: data.origine_fonds_code || null,
            reference_piece: data.reference_piece?.trim() || null,
            description: data.description?.trim() || null,
            pj_url: data.pj_url || null,
            pj_filename: data.pj_filename || null,
            exercice: exerciceAnnee,
            statut: data.statut || "valide",
            created_by: userId,
            validated_at: data.statut === "valide" ? new Date().toISOString() : null,
            validated_by: data.statut === "valide" ? userId : null,
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
      return result as Approvisionnement;
    },
    onSuccess: (data) => {
      toast.success(`Approvisionnement ${data.numero} créé`);
      queryClient.invalidateQueries({ queryKey: ["approvisionnements-tresorerie"] });
      queryClient.invalidateQueries({ queryKey: ["comptes-bancaires"] });
      queryClient.invalidateQueries({ queryKey: ["caisses"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Annuler un approvisionnement
  const annulerApprovisionnement = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("approvisionnements")
        .update({ statut: "annule" })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Approvisionnement annulé");
      queryClient.invalidateQueries({ queryKey: ["approvisionnements-tresorerie"] });
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
    if (!approvisionnements || approvisionnements.length === 0) {
      toast.error("Aucune donnée à exporter");
      return;
    }

    const headers = [
      "Numéro",
      "Type",
      "Date Opération",
      "Date Valeur",
      "Compte/Caisse",
      "Origine Fonds",
      "Montant",
      "Référence Pièce",
      "Description",
      "Statut",
      "Créé par",
      "Date création",
    ].join(";");

    const rows = approvisionnements.map((a) =>
      [
        a.numero,
        a.type === "BANK" ? "Banque" : "Caisse",
        new Date(a.date_operation).toLocaleDateString("fr-FR"),
        a.date_valeur ? new Date(a.date_valeur).toLocaleDateString("fr-FR") : "",
        a.type === "BANK"
          ? `${a.compte_bancaire?.code} - ${a.compte_bancaire?.libelle}`
          : `${a.caisse?.code} - ${a.caisse?.libelle}`,
        a.origine_fonds?.libelle || a.origine_fonds_code || "",
        a.montant,
        a.reference_piece || "",
        a.description || "",
        a.statut,
        a.createur?.full_name || "",
        new Date(a.created_at).toLocaleDateString("fr-FR"),
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
    link.download = `approvisionnements_${exerciceAnnee}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success(`Export de ${approvisionnements.length} approvisionnement(s) réussi`);
  }, [approvisionnements, exerciceAnnee]);

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
    approvisionnements,
    stats,
    isLoading,
    exerciceAnnee,

    // Mutations
    createApprovisionnement: createApprovisionnement.mutate,
    createApprovisionnementAsync: createApprovisionnement.mutateAsync,
    annulerApprovisionnement: annulerApprovisionnement.mutate,

    // Helpers
    exportToExcel,
    formatMontant,
    refetch,

    // Loading states
    isCreating: createApprovisionnement.isPending,
    isAnnulating: annulerApprovisionnement.isPending,
  };
}

export default useApprovisionnementsTresorerie;
