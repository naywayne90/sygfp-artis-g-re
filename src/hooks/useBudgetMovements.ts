import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { useToast } from "@/hooks/use-toast";

export type MovementType =
  | "reservation"
  | "liberation_reservation"
  | "engagement"
  | "annulation_engagement"
  | "liquidation"
  | "ordonnancement"
  | "paiement"
  | "virement_entrant"
  | "virement_sortant"
  | "ajustement"
  | "cloture_exercice";

export interface BudgetMovement {
  id: string;
  budget_line_id: string;
  type_mouvement: MovementType;
  montant: number;
  sens: "debit" | "credit";
  disponible_avant: number | null;
  disponible_apres: number | null;
  reserve_avant: number | null;
  reserve_apres: number | null;
  entity_type: string | null;
  entity_id: string | null;
  entity_code: string | null;
  dossier_id: string | null;
  exercice: number;
  motif: string | null;
  commentaire: string | null;
  created_by: string | null;
  created_at: string;
  statut: string;
}

export interface CreateMovementParams {
  budgetLineId: string;
  type: MovementType;
  montant: number;
  entityType?: string;
  entityId?: string;
  entityCode?: string;
  dossierId?: string;
  motif?: string;
  commentaire?: string;
}

/**
 * Hook pour gérer les mouvements budgétaires et la réservation
 */
export function useBudgetMovements(budgetLineId?: string) {
  const { exercice } = useExercice();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer les mouvements d'une ligne budgétaire
  const { data: movements = [], isLoading } = useQuery({
    queryKey: ["budget-movements", budgetLineId, exercice],
    queryFn: async () => {
      if (!budgetLineId) return [];

      const { data, error } = await supabase
        .from("budget_movements")
        .select("*")
        .eq("budget_line_id", budgetLineId)
        .eq("exercice", exercice || new Date().getFullYear())
        .eq("statut", "valide")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BudgetMovement[];
    },
    enabled: !!budgetLineId && !!exercice,
  });

  // Calculer le disponible actuel avec les réservations
  const calculateCurrentAvailability = async (lineId: string): Promise<{
    dotation_actuelle: number;
    total_engage: number;
    montant_reserve: number;
    disponible_brut: number;
    disponible_net: number;
  }> => {
    // Récupérer la ligne
    const { data: line } = await supabase
      .from("budget_lines")
      .select("dotation_initiale, dotation_modifiee, total_engage, montant_reserve")
      .eq("id", lineId)
      .single();

    if (!line) {
      throw new Error("Ligne budgétaire introuvable");
    }

    // Calculer virements
    const { data: virementsRecus } = await supabase
      .from("credit_transfers")
      .select("amount")
      .eq("to_budget_line_id", lineId)
      .eq("status", "execute");

    const { data: virementsEmis } = await supabase
      .from("credit_transfers")
      .select("amount")
      .eq("from_budget_line_id", lineId)
      .eq("status", "execute");

    const totalRecus = virementsRecus?.reduce((sum, v) => sum + (v.amount || 0), 0) || 0;
    const totalEmis = virementsEmis?.reduce((sum, v) => sum + (v.amount || 0), 0) || 0;

    const dotation_actuelle = (line.dotation_initiale || 0) + totalRecus - totalEmis;
    const total_engage = line.total_engage || 0;
    const montant_reserve = line.montant_reserve || 0;
    const disponible_brut = dotation_actuelle - total_engage;
    const disponible_net = disponible_brut - montant_reserve;

    return {
      dotation_actuelle,
      total_engage,
      montant_reserve,
      disponible_brut,
      disponible_net,
    };
  };

  // Créer une réservation (pré-engagement bloquant)
  const createReservationMutation = useMutation({
    mutationFn: async (params: CreateMovementParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Vérifier la disponibilité AVANT la réservation
      const availability = await calculateCurrentAvailability(params.budgetLineId);

      if (params.montant > availability.disponible_net) {
        throw new Error(
          `❌ RÉSERVATION BLOQUÉE: Disponible net insuffisant.\n` +
          `• Disponible net: ${availability.disponible_net.toLocaleString("fr-FR")} FCFA\n` +
          `• Montant demandé: ${params.montant.toLocaleString("fr-FR")} FCFA\n` +
          `• Écart: ${(params.montant - availability.disponible_net).toLocaleString("fr-FR")} FCFA`
        );
      }

      // Créer le mouvement de réservation
      const { data: movement, error: movementError } = await supabase
        .from("budget_movements")
        .insert({
          budget_line_id: params.budgetLineId,
          type_mouvement: "reservation",
          montant: params.montant,
          sens: "debit",
          disponible_avant: availability.disponible_net,
          disponible_apres: availability.disponible_net - params.montant,
          reserve_avant: availability.montant_reserve,
          reserve_apres: availability.montant_reserve + params.montant,
          entity_type: params.entityType,
          entity_id: params.entityId,
          entity_code: params.entityCode,
          dossier_id: params.dossierId,
          exercice: exercice || new Date().getFullYear(),
          motif: params.motif,
          commentaire: params.commentaire,
          created_by: user.id,
          statut: "valide",
        })
        .select()
        .single();

      if (movementError) throw movementError;

      // Mettre à jour montant_reserve sur la ligne budgétaire
      const { error: updateError } = await supabase
        .from("budget_lines")
        .update({
          montant_reserve: availability.montant_reserve + params.montant,
        })
        .eq("id", params.budgetLineId);

      if (updateError) throw updateError;

      return {
        movement,
        newDisponible: availability.disponible_net - params.montant,
        newReserve: availability.montant_reserve + params.montant,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-movements"] });
      queryClient.invalidateQueries({ queryKey: ["budget-lines"] });
      queryClient.invalidateQueries({ queryKey: ["budget-availability"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur de réservation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Libérer une réservation
  const releaseReservationMutation = useMutation({
    mutationFn: async (params: {
      budgetLineId: string;
      montant: number;
      originalMovementId?: string;
      entityType?: string;
      entityId?: string;
      motif?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const availability = await calculateCurrentAvailability(params.budgetLineId);

      // Créer mouvement de libération
      const { data: movement, error: movementError } = await supabase
        .from("budget_movements")
        .insert({
          budget_line_id: params.budgetLineId,
          type_mouvement: "liberation_reservation",
          montant: params.montant,
          sens: "credit",
          disponible_avant: availability.disponible_net,
          disponible_apres: availability.disponible_net + params.montant,
          reserve_avant: availability.montant_reserve,
          reserve_apres: Math.max(0, availability.montant_reserve - params.montant),
          entity_type: params.entityType,
          entity_id: params.entityId,
          exercice: exercice || new Date().getFullYear(),
          motif: params.motif || "Libération de réservation",
          created_by: user.id,
          statut: "valide",
        })
        .select()
        .single();

      if (movementError) throw movementError;

      // Mettre à jour montant_reserve
      const { error: updateError } = await supabase
        .from("budget_lines")
        .update({
          montant_reserve: Math.max(0, availability.montant_reserve - params.montant),
        })
        .eq("id", params.budgetLineId);

      if (updateError) throw updateError;

      return movement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-movements"] });
      queryClient.invalidateQueries({ queryKey: ["budget-lines"] });
      queryClient.invalidateQueries({ queryKey: ["budget-availability"] });
    },
  });

  // Vérifier si une imputation/engagement est possible
  const checkCanImpute = async (
    budgetLineId: string,
    montant: number
  ): Promise<{
    possible: boolean;
    disponible_net: number;
    dotation_actuelle: number;
    montant_reserve: number;
    message: string;
    details: {
      dotation_actuelle: number;
      total_engage: number;
      montant_reserve: number;
      disponible_brut: number;
      disponible_net: number;
    };
  }> => {
    try {
      const availability = await calculateCurrentAvailability(budgetLineId);

      if (montant > availability.disponible_net) {
        return {
          possible: false,
          disponible_net: availability.disponible_net,
          dotation_actuelle: availability.dotation_actuelle,
          montant_reserve: availability.montant_reserve,
          message:
            `❌ IMPUTATION BLOQUÉE\n` +
            `Dotation actuelle: ${availability.dotation_actuelle.toLocaleString("fr-FR")} FCFA\n` +
            `Total engagé: ${availability.total_engage.toLocaleString("fr-FR")} FCFA\n` +
            `Montant réservé: ${availability.montant_reserve.toLocaleString("fr-FR")} FCFA\n` +
            `Disponible net: ${availability.disponible_net.toLocaleString("fr-FR")} FCFA\n` +
            `Montant demandé: ${montant.toLocaleString("fr-FR")} FCFA\n` +
            `Écart: ${(montant - availability.disponible_net).toLocaleString("fr-FR")} FCFA`,
          details: availability,
        };
      }

      return {
        possible: true,
        disponible_net: availability.disponible_net,
        dotation_actuelle: availability.dotation_actuelle,
        montant_reserve: availability.montant_reserve,
        message: `✓ Imputation possible. Disponible après: ${(availability.disponible_net - montant).toLocaleString("fr-FR")} FCFA`,
        details: availability,
      };
    } catch (error) {
      return {
        possible: false,
        disponible_net: 0,
        dotation_actuelle: 0,
        montant_reserve: 0,
        message: `Erreur: ${error instanceof Error ? error.message : "Vérification impossible"}`,
        details: {
          dotation_actuelle: 0,
          total_engage: 0,
          montant_reserve: 0,
          disponible_brut: 0,
          disponible_net: 0,
        },
      };
    }
  };

  return {
    movements,
    isLoading,
    calculateCurrentAvailability,
    checkCanImpute,
    createReservation: createReservationMutation.mutateAsync,
    isCreatingReservation: createReservationMutation.isPending,
    releaseReservation: releaseReservationMutation.mutateAsync,
    isReleasingReservation: releaseReservationMutation.isPending,
  };
}

/**
 * Hook pour récupérer l'historique des mouvements d'un dossier
 */
export function useDossierMovements(dossierId?: string) {
  const { data: movements = [], isLoading } = useQuery({
    queryKey: ["dossier-movements", dossierId],
    queryFn: async () => {
      if (!dossierId) return [];

      const { data, error } = await supabase
        .from("budget_movements")
        .select(`
          *,
          budget_line:budget_lines(id, code, label)
        `)
        .eq("dossier_id", dossierId)
        .eq("statut", "valide")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!dossierId,
  });

  return { movements, isLoading };
}
