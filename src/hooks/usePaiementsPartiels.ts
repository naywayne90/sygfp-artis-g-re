/**
 * usePaiementsPartiels - Hook pour la gestion des paiements partiels
 * Basé sur l'analyse de l'ancien SYGFP (arti-ci.com:8001)
 *
 * Fonctionnalités:
 * - Liste des mouvements bancaires par règlement
 * - Ajout de nouveaux mouvements (paiements partiels)
 * - Calcul du reste à payer
 * - Statistiques de paiement
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Helper pour accéder aux tables/fonctions non typées
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabaseAny = supabase as any;

// ============================================================================
// TYPES
// ============================================================================

export interface CompteBancaire {
  id: string;
  code: string;
  libelle: string;
  type_compte: "tresor" | "commercial" | "autre";
  banque: string | null;
  numero_compte: string | null;
  est_actif: boolean;
  solde_initial: number;
}

export interface MouvementBancaire {
  id: string;
  reglement_id: string;
  compte_bancaire_code: string;
  compte_bancaire_libelle?: string;
  banque?: string;
  montant: number;
  reference: string;
  objet: string | null;
  piece_justificative_url: string | null;
  date_reglement: string;
  created_at: string;
  created_by: string | null;
  created_by_name?: string;
  numero_reglement?: string;
  montant_total_reglement?: number;
}

export interface ReglementAvecPaiement {
  id: string;
  numero_reglement: string;
  ordonnancement_id: string;
  montant_ht: number | null;
  montant_ttc: number | null;
  date_reglement: string | null;
  statut: string;
  exercice_id: string;
  created_at: string;
  montant_paye: number;
  reste_a_payer: number;
  nombre_mouvements: number;
  statut_paiement: "non_effectue" | "partiel" | "total";
  date_dernier_paiement: string | null;
}

export interface StatsPaiements {
  total_reglements: number;
  montant_total: number;
  reglements_total: number;
  reglements_partiel: number;
  reglements_non_effectue: number;
  montant_paye: number;
  montant_reste: number;
}

export interface AddMouvementParams {
  reglementId: string;
  compteBancaireCode: string;
  montant: number;
  reference: string;
  objet?: string;
  pieceJustificativeUrl?: string;
  dateReglement?: string;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook pour récupérer les comptes bancaires disponibles
 */
export function useComptesBancaires() {
  return useQuery({
    queryKey: ["comptes-bancaires"],
    queryFn: async (): Promise<CompteBancaire[]> => {
      const { data, error } = await supabaseAny
        .from("comptes_bancaires")
        .select("*")
        .eq("est_actif", true)
        .order("code");

      if (error) throw error;
      return data || [];
    },
    staleTime: 60000, // Cache 1 minute
  });
}

/**
 * Hook pour récupérer les mouvements bancaires d'un règlement
 */
export function useMouvementsBancaires(reglementId: string | null) {
  return useQuery({
    queryKey: ["mouvements-bancaires", reglementId],
    queryFn: async (): Promise<MouvementBancaire[]> => {
      if (!reglementId) return [];

      const { data, error } = await supabaseAny
        .from("v_mouvements_details")
        .select("*")
        .eq("reglement_id", reglementId)
        .order("date_reglement", { ascending: false });

      if (error) {
        console.warn("Vue non disponible, utilisation de la table directe:", error);
        // Fallback si la vue n'existe pas
        const { data: fallbackData, error: fallbackError } = await supabaseAny
          .from("mouvements_bancaires")
          .select("*")
          .eq("reglement_id", reglementId)
          .order("date_reglement", { ascending: false });

        if (fallbackError) throw fallbackError;
        return fallbackData || [];
      }

      return data || [];
    },
    enabled: !!reglementId,
  });
}

/**
 * Hook pour récupérer les règlements avec statut de paiement
 */
export function useReglementsAvecPaiement(exerciceId?: string) {
  return useQuery({
    queryKey: ["reglements-paiements", exerciceId],
    queryFn: async (): Promise<ReglementAvecPaiement[]> => {
      let query = supabaseAny.from("v_reglements_paiements").select("*");

      if (exerciceId) {
        query = query.eq("exercice_id", exerciceId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        console.warn("Vue non disponible:", error);
        return [];
      }

      return data || [];
    },
    staleTime: 30000,
  });
}

/**
 * Hook pour récupérer les règlements partiels uniquement
 */
export function useReglementsPartiels(exerciceId?: string) {
  return useQuery({
    queryKey: ["reglements-partiels", exerciceId],
    queryFn: async (): Promise<ReglementAvecPaiement[]> => {
      let query = supabaseAny
        .from("v_reglements_paiements")
        .select("*")
        .eq("statut_paiement", "partiel");

      if (exerciceId) {
        query = query.eq("exercice_id", exerciceId);
      }

      const { data, error } = await query.order("reste_a_payer", { ascending: false });

      if (error) {
        console.warn("Vue non disponible:", error);
        return [];
      }

      return data || [];
    },
  });
}

/**
 * Hook pour obtenir les statistiques de paiement
 */
export function useStatsPaiements(exerciceId?: string | number) {
  return useQuery({
    queryKey: ["stats-paiements", exerciceId],
    queryFn: async (): Promise<StatsPaiements> => {
      // Convertir en number si nécessaire (la fonction prend un integer)
      const exercice = exerciceId
        ? (typeof exerciceId === "string" ? parseInt(exerciceId, 10) : exerciceId)
        : null;

      const { data, error } = await supabaseAny.rpc("get_stats_paiements", {
        p_exercice: exercice,
      });

      if (error) {
        console.warn("RPC non disponible:", error);
        return {
          total_reglements: 0,
          montant_total: 0,
          reglements_total: 0,
          reglements_partiel: 0,
          reglements_non_effectue: 0,
          montant_paye: 0,
          montant_reste: 0,
        };
      }

      // Mapper les résultats de la fonction RPC aux noms attendus
      if (Array.isArray(data) && data.length > 0) {
        const stats = data[0];
        return {
          total_reglements: stats.total_reglements || 0,
          montant_total: stats.total_montant || 0,
          reglements_total: stats.nb_complets || 0,
          reglements_partiel: stats.nb_partiels || 0,
          reglements_non_effectue: stats.nb_non_effectues || 0,
          montant_paye: stats.total_paye || 0,
          montant_reste: stats.total_reste || 0,
        };
      }

      return {
        total_reglements: 0,
        montant_total: 0,
        reglements_total: 0,
        reglements_partiel: 0,
        reglements_non_effectue: 0,
        montant_paye: 0,
        montant_reste: 0,
      };
    },
    staleTime: 30000,
  });
}

/**
 * Hook pour ajouter un mouvement bancaire
 */
export function useAddMouvementBancaire() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: AddMouvementParams) => {
      // Utiliser la fonction RPC add_mouvement_bancaire
      const { data, error } = await supabaseAny.rpc("add_mouvement_bancaire", {
        p_reglement_id: params.reglementId,
        p_compte_bancaire_code: params.compteBancaireCode,
        p_montant: params.montant,
        p_reference: params.reference,
        p_objet: params.objet || null,
        p_date_reglement: params.dateReglement || new Date().toISOString().split("T")[0],
      });

      if (error) {
        console.warn("RPC error, utilisation insertion directe:", error);

        // Fallback: insertion directe
        const { data: insertData, error: insertError } = await supabaseAny
          .from("mouvements_bancaires")
          .insert({
            reglement_id: params.reglementId,
            compte_bancaire_code: params.compteBancaireCode,
            montant: params.montant,
            reference: params.reference,
            objet: params.objet,
            date_reglement: params.dateReglement || new Date().toISOString().split("T")[0],
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return { success: true, mouvement_id: insertData.id };
      }

      // La fonction RPC retourne l'UUID du mouvement créé
      return { success: true, mouvement_id: data };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["mouvements-bancaires", variables.reglementId] });
      queryClient.invalidateQueries({ queryKey: ["reglements-paiements"] });
      queryClient.invalidateQueries({ queryKey: ["reglements-partiels"] });
      queryClient.invalidateQueries({ queryKey: ["stats-paiements"] });

      toast.success("Mouvement bancaire enregistré", {
        description: `Reste à payer: ${data.nouveau_reste?.toLocaleString("fr-FR")} FCFA`,
      });
    },
    onError: (error: Error) => {
      toast.error("Erreur", { description: error.message });
    },
  });
}

/**
 * Hook pour supprimer un mouvement bancaire
 */
export function useDeleteMouvementBancaire() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mouvementId, reglementId }: { mouvementId: string; reglementId: string }) => {
      const { error } = await supabaseAny
        .from("mouvements_bancaires")
        .delete()
        .eq("id", mouvementId);

      if (error) throw error;
      return { mouvementId, reglementId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["mouvements-bancaires", variables.reglementId] });
      queryClient.invalidateQueries({ queryKey: ["reglements-paiements"] });
      queryClient.invalidateQueries({ queryKey: ["reglements-partiels"] });
      queryClient.invalidateQueries({ queryKey: ["stats-paiements"] });
      toast.success("Mouvement supprimé");
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de la suppression", { description: error.message });
    },
  });
}

/**
 * Hook principal combiné
 */
export function usePaiementsPartiels(reglementId?: string, exerciceId?: string) {
  const comptesBancaires = useComptesBancaires();
  const mouvements = useMouvementsBancaires(reglementId || null);
  const stats = useStatsPaiements(exerciceId);
  const addMouvement = useAddMouvementBancaire();
  const deleteMouvement = useDeleteMouvementBancaire();

  return {
    // Données
    comptesBancaires: comptesBancaires.data || [],
    mouvements: mouvements.data || [],
    stats: stats.data,

    // États
    isLoadingComptes: comptesBancaires.isLoading,
    isLoadingMouvements: mouvements.isLoading,
    isLoadingStats: stats.isLoading,
    isAdding: addMouvement.isPending,
    isDeleting: deleteMouvement.isPending,

    // Actions
    addMouvement: addMouvement.mutate,
    deleteMouvement: deleteMouvement.mutate,

    // Erreurs
    error: comptesBancaires.error || mouvements.error || stats.error,
  };
}

export default usePaiementsPartiels;
