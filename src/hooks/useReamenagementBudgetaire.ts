/**
 * useReamenagementBudgetaire - Hook pour la gestion des réaménagements budgétaires
 * Basé sur l'analyse de l'ancien SYGFP (arti-ci.com:8001)
 *
 * Fonctionnalités:
 * - Liste des réaménagements
 * - Création d'un réaménagement (transfert budgétaire)
 * - Validation/Rejet d'un réaménagement
 * - Calcul du budget disponible par imputation
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuditLog } from "./useAuditLog";

// Helper pour accéder aux tables/fonctions non typées
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabaseAny = supabase as any;

// ============================================================================
// TYPES
// ============================================================================

export interface ReamenagementBudgetaire {
  id: string;
  exercice_id: string;
  exercice_libelle?: string;

  // Source
  imputation_source: string;
  nature_nbe_source: string | null;
  libelle_source: string | null;
  budget_source_avant: number;
  budget_source_apres: number;

  // Destination
  imputation_destination: string;
  nature_nbe_destination: string | null;
  libelle_destination: string | null;
  budget_destination_avant: number;
  budget_destination_apres: number;

  // Transfert
  montant: number;
  motif: string;
  reference_note: string | null;

  // Statut
  statut: "en_attente" | "valide" | "rejete";
  valide_par: string | null;
  valide_par_nom?: string;
  date_validation: string | null;
  motif_rejet: string | null;

  // Audit
  created_at: string;
  created_by: string | null;
  created_by_nom?: string;
}

export interface ImputationBudget {
  code_imputation: string;
  nature_economique: string;
  libelle_activite?: string;
  budget_initial: number;
  budget_reporte: number;
  reamenagements_entrants: number;
  reamenagements_sortants: number;
  budget_actuel: number;
  cumul_engagements: number;
  disponible: number;
}

export interface CreateReamenagementParams {
  imputationSource: string;
  imputationDestination: string;
  montant: number;
  motif: string;
  referenceNote?: string;
  exerciceId?: string;
}

export interface ValidateReamenagementParams {
  reamenagementId: string;
  action: "valider" | "rejeter";
  motifRejet?: string;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook pour récupérer la liste des réaménagements
 */
export function useReamenagements(exerciceId?: string | number, statut?: string) {
  return useQuery({
    queryKey: ["reamenagements", exerciceId, statut],
    queryFn: async (): Promise<ReamenagementBudgetaire[]> => {
      // Utiliser la vue enrichie v_reamenagements_budgetaires
      let query = supabaseAny.from("v_reamenagements_budgetaires").select("*");

      if (exerciceId) {
        // Convertir en number si c'est un UUID (pour compatibilité)
        const exercice = typeof exerciceId === "string" && exerciceId.includes("-")
          ? undefined
          : Number(exerciceId);
        if (exercice) {
          query = query.eq("exercice", exercice);
        }
      }

      if (statut) {
        query = query.eq("statut", statut);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        console.warn("Vue non disponible, utilisation table directe:", error);
        // Fallback vers la table directe
        let fallbackQuery = supabaseAny
          .from("reamenagements_budgetaires")
          .select("*");

        if (exerciceId && typeof exerciceId === "number") {
          fallbackQuery = fallbackQuery.eq("exercice", exerciceId);
        }
        if (statut) {
          fallbackQuery = fallbackQuery.eq("statut", statut);
        }

        const { data: fallbackData, error: fallbackError } = await fallbackQuery
          .order("created_at", { ascending: false });

        if (fallbackError) throw fallbackError;
        return fallbackData || [];
      }

      return data || [];
    },
  });
}

/**
 * Hook pour récupérer les réaménagements en attente
 */
export function useReamenementsEnAttente(exerciceId?: string) {
  return useReamenagements(exerciceId, "en_attente");
}

/**
 * Hook pour récupérer l'état d'exécution par imputation
 */
export function useEtatExecutionImputations(exerciceId?: string) {
  return useQuery({
    queryKey: ["etat-execution-imputations", exerciceId],
    queryFn: async (): Promise<ImputationBudget[]> => {
      let query = supabaseAny.from("v_etat_execution_imputation").select("*");

      if (exerciceId) {
        query = query.eq("exercice_id", exerciceId);
      }

      const { data, error } = await query.order("code_imputation");

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
 * Hook pour récupérer le budget d'une imputation spécifique
 */
export function useBudgetImputation(imputation: string | null, exerciceId?: string) {
  return useQuery({
    queryKey: ["budget-imputation", imputation, exerciceId],
    queryFn: async () => {
      if (!imputation) return null;

      // Utiliser les fonctions RPC
      const [budgetResult, cumuleResult] = await Promise.all([
        supabaseAny.rpc("get_budget_imputation", {
          p_imputation: imputation,
          p_exercice_id: exerciceId || null,
        }),
        supabaseAny.rpc("get_cumul_engagements_imputation", {
          p_imputation: imputation,
          p_exercice_id: exerciceId || null,
        }),
      ]);

      const budget = budgetResult.data || 0;
      const cumul = cumuleResult.data || 0;

      return {
        budget_actuel: budget,
        cumul_engagements: cumul,
        disponible: budget - cumul,
      };
    },
    enabled: !!imputation,
  });
}

/**
 * Hook pour créer un réaménagement budgétaire
 */
export function useCreateReamenagement() {
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();

  return useMutation({
    mutationFn: async (params: CreateReamenagementParams) => {
      const { data, error } = await supabaseAny.rpc("create_reamenagement_budgetaire", {
        p_imputation_source: params.imputationSource,
        p_imputation_destination: params.imputationDestination,
        p_montant: params.montant,
        p_motif: params.motif,
        p_reference_note: params.referenceNote || null,
        p_exercice_id: params.exerciceId || null,
      });

      if (error) {
        console.warn("RPC error, insertion directe:", error);

        // Fallback: insertion directe
        const { data: insertData, error: insertError } = await supabaseAny
          .from("reamenagements_budgetaires")
          .insert({
            imputation_source: params.imputationSource,
            imputation_destination: params.imputationDestination,
            montant: params.montant,
            motif: params.motif,
            reference_note: params.referenceNote,
            exercice_id: params.exerciceId,
            statut: "en_attente",
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return { success: true, reamenagement_id: insertData.id };
      }

      if (!data.success) {
        throw new Error(data.error || "Erreur lors de la création du réaménagement");
      }

      return data;
    },
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reamenagements"] });
      queryClient.invalidateQueries({ queryKey: ["etat-execution-imputations"] });
      queryClient.invalidateQueries({ queryKey: ["budget-imputation"] });

      // Audit log
      await logAction({
        entityType: "reamenagements_budgetaires",
        entityId: data.reamenagement_id,
        action: "create",
        newValues: {
          source: variables.imputationSource,
          destination: variables.imputationDestination,
          montant: variables.montant,
        },
        justification: variables.motif,
      });

      toast.success("Réaménagement créé", {
        description: `Transfert de ${variables.montant.toLocaleString("fr-FR")} FCFA en attente de validation`,
      });
    },
    onError: (error: Error) => {
      toast.error("Erreur", { description: error.message });
    },
  });
}

/**
 * Hook pour valider ou rejeter un réaménagement
 */
export function useValidateReamenagement() {
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();

  return useMutation({
    mutationFn: async (params: ValidateReamenagementParams) => {
      if (params.action === "valider") {
        // Utiliser la fonction RPC validate_reamenagement
        const { data, error } = await supabaseAny.rpc("validate_reamenagement", {
          p_reamenagement_id: params.reamenagementId,
        });

        if (error) {
          console.warn("RPC validate error:", error);
          throw new Error(error.message || "Erreur lors de la validation");
        }

        return { success: data, message: "Réaménagement validé avec succès" };
      } else {
        // Utiliser la fonction RPC reject_reamenagement
        if (!params.motifRejet) {
          throw new Error("Le motif de rejet est obligatoire");
        }

        const { data, error } = await supabaseAny.rpc("reject_reamenagement", {
          p_reamenagement_id: params.reamenagementId,
          p_motif: params.motifRejet,
        });

        if (error) {
          console.warn("RPC reject error:", error);
          throw new Error(error.message || "Erreur lors du rejet");
        }

        return { success: data, message: "Réaménagement rejeté" };
      }
    },
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reamenagements"] });
      queryClient.invalidateQueries({ queryKey: ["etat-execution-imputations"] });
      queryClient.invalidateQueries({ queryKey: ["budget-imputation"] });

      // Audit log
      await logAction({
        entityType: "reamenagements_budgetaires",
        entityId: variables.reamenagementId,
        action: variables.action === "valider" ? "validate" : "reject",
        justification: variables.motifRejet || (variables.action === "valider" ? "Validation" : "Rejet"),
      });

      const isValidation = variables.action === "valider";
      toast.success(isValidation ? "Réaménagement validé" : "Réaménagement rejeté", {
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast.error("Erreur", { description: error.message });
    },
  });
}

/**
 * Hook pour récupérer les imputations disponibles pour réaménagement
 */
export function useImputationsDisponibles(exerciceId?: string) {
  return useQuery({
    queryKey: ["imputations-disponibles", exerciceId],
    queryFn: async () => {
      let query = supabaseAny
        .from("imputations_budgetaires")
        .select(`
          id,
          code_imputation,
          nature_economique,
          montant_initial,
          exercice_id,
          activite:activites(libelle)
        `)
        .gt("montant_initial", 0);

      if (exerciceId) {
        query = query.eq("exercice_id", exerciceId);
      }

      const { data, error } = await query.order("code_imputation");

      if (error) {
        console.warn("Erreur récupération imputations:", error);
        return [];
      }

      return (data || []).map((item: Record<string, unknown>) => ({
        code: item.code_imputation as string,
        nbe: item.nature_economique as string,
        libelle: (item.activite as { libelle?: string } | null)?.libelle || "N/A",
        montant_initial: item.montant_initial as number,
      }));
    },
    staleTime: 60000,
  });
}

/**
 * Hook principal combiné
 */
export function useReamenagementBudgetaire(exerciceId?: string) {
  const reamenagements = useReamenagements(exerciceId);
  const enAttente = useReamenementsEnAttente(exerciceId);
  const imputations = useImputationsDisponibles(exerciceId);
  const createMutation = useCreateReamenagement();
  const validateMutation = useValidateReamenagement();

  return {
    // Données
    reamenagements: reamenagements.data || [],
    enAttente: enAttente.data || [],
    imputations: imputations.data || [],

    // États
    isLoading: reamenagements.isLoading || imputations.isLoading,
    isLoadingEnAttente: enAttente.isLoading,
    isCreating: createMutation.isPending,
    isValidating: validateMutation.isPending,

    // Actions
    create: createMutation.mutate,
    validate: (id: string) => validateMutation.mutate({ reamenagementId: id, action: "valider" }),
    reject: (id: string, motif: string) =>
      validateMutation.mutate({ reamenagementId: id, action: "rejeter", motifRejet: motif }),

    // Compteurs
    countEnAttente: (enAttente.data || []).length,
    countValides: (reamenagements.data || []).filter((r) => r.statut === "valide").length,
    countRejetes: (reamenagements.data || []).filter((r) => r.statut === "rejete").length,

    // Erreurs
    error: reamenagements.error || imputations.error,
  };
}

export default useReamenagementBudgetaire;
