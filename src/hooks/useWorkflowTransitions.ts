/**
 * Hook pour gérer les transitions de workflow
 * 
 * Fournit les transitions disponibles, la validation et l'exécution
 * avec gestion d'état React et notifications.
 */

import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  WorkflowModule,
  WorkflowTransition,
  TransitionPayload,
  TransitionResult,
  getAvailableTransitions,
  canTransition,
  transitionEntity,
  getTransitionHistory,
} from "@/lib/workflow/transitionService";

interface UseWorkflowTransitionsOptions {
  module: WorkflowModule;
  entityId?: string;
  currentStatus?: string;
  entityCode?: string;
  onTransitionSuccess?: (result: TransitionResult) => void;
  onTransitionError?: (error: Error) => void;
}

export function useWorkflowTransitions(options: UseWorkflowTransitionsOptions) {
  const { module, entityId, currentStatus, entityCode, onTransitionSuccess, onTransitionError } = options;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Récupérer les transitions disponibles
  const {
    data: availableTransitions = [],
    isLoading: isLoadingTransitions,
    refetch: refetchTransitions,
  } = useQuery({
    queryKey: ['workflow-transitions', module, currentStatus],
    queryFn: () => getAvailableTransitions(module, currentStatus || 'brouillon'),
    enabled: !!currentStatus,
    staleTime: 30000,
  });

  // Récupérer l'historique
  const {
    data: transitionHistory = [],
    isLoading: isLoadingHistory,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ['workflow-history', module, entityId],
    queryFn: () => getTransitionHistory(module, entityId!),
    enabled: !!entityId,
    staleTime: 60000,
  });

  // Mutation pour exécuter une transition
  const transitionMutation = useMutation({
    mutationFn: async (payload: Omit<TransitionPayload, 'entityId'>) => {
      if (!entityId) throw new Error('entityId requis');
      
      setIsTransitioning(true);
      const result = await transitionEntity(module, getTableName(module), {
        entityId,
        entityCode,
        ...payload,
      });
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      return result;
    },
    onSuccess: (result) => {
      setIsTransitioning(false);
      toast({
        title: "Transition effectuée",
        description: result.message,
      });
      
      // Invalider les caches
      queryClient.invalidateQueries({ queryKey: ['workflow-transitions', module] });
      queryClient.invalidateQueries({ queryKey: ['workflow-history', module, entityId] });
      queryClient.invalidateQueries({ queryKey: [module] });
      
      onTransitionSuccess?.(result);
    },
    onError: (error: Error) => {
      setIsTransitioning(false);
      toast({
        variant: "destructive",
        title: "Erreur de transition",
        description: error.message,
      });
      onTransitionError?.(error);
    },
  });

  // Vérifier si une transition spécifique est autorisée
  const checkTransition = useCallback(async (toStatus: string) => {
    if (!currentStatus) return { allowed: false, reason: 'Statut actuel inconnu', requiresMotif: false };
    return canTransition(module, currentStatus, toStatus);
  }, [module, currentStatus]);

  // Exécuter une transition
  const executeTransition = useCallback((toStatus: string, motif?: string, metadata?: Record<string, unknown>) => {
    if (!currentStatus) {
      toast({ variant: "destructive", title: "Erreur", description: "Statut actuel inconnu" });
      return;
    }
    
    transitionMutation.mutate({
      fromStatus: currentStatus,
      toStatus,
      motif,
      metadata,
    });
  }, [currentStatus, transitionMutation, toast]);

  // Raccourcis pour les actions courantes
  const actions = useMemo(() => ({
    submit: () => executeTransition('soumis'),
    validate: () => executeTransition('valide'),
    reject: (motif: string) => executeTransition('rejete', motif),
    defer: (motif: string) => executeTransition('differe', motif),
    resubmit: () => executeTransition('soumis'),
    impute: () => executeTransition('impute'),
  }), [executeTransition]);

  // Trouver une transition spécifique
  const findTransition = useCallback((toStatus: string): WorkflowTransition | undefined => {
    return availableTransitions.find(t => t.toStatus === toStatus);
  }, [availableTransitions]);

  // Vérifier si une action est disponible
  const canDo = useMemo(() => ({
    submit: !!findTransition('soumis'),
    validate: !!findTransition('valide'),
    reject: !!findTransition('rejete'),
    defer: !!findTransition('differe'),
    resubmit: currentStatus === 'differe' && !!findTransition('soumis'),
    impute: !!findTransition('impute'),
  }), [findTransition, currentStatus]);

  return {
    // État
    isTransitioning,
    isLoadingTransitions,
    isLoadingHistory,
    
    // Données
    availableTransitions,
    transitionHistory,
    currentStatus,
    
    // Actions
    executeTransition,
    checkTransition,
    actions,
    
    // Helpers
    findTransition,
    canDo,
    
    // Refetch
    refetchTransitions,
    refetchHistory,
  };
}

// Helper privé
function getTableName(module: WorkflowModule): string {
  return module; // Le nom du module correspond au nom de la table
}

export default useWorkflowTransitions;
