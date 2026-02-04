import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRBAC } from '@/contexts/RBACContext';

interface WorkflowStep {
  step_order: number;
  label: string;
  description: string | null;
  role_required: string;
  role_alternatif: string | null;
  est_optionnel: boolean;
  delai_max_heures: number;
}

interface HistoryEntry {
  step_order: number;
  action: string;
  user_name: string | null;
  motif: string | null;
  created_at: string;
}

interface WorkflowStatusData {
  exists: boolean;
  status?: 'en_cours' | 'complete' | 'rejete' | 'annule';
  current_step?: number;
  current_role_required?: string;
  started_at?: string;
  completed_at?: string;
  steps?: WorkflowStep[];
  history?: HistoryEntry[];
  message?: string;
}

interface AdvanceResult {
  success: boolean;
  workflow_complete?: boolean;
  new_step?: number;
  error?: string;
}

export type WorkflowAction = 'valide' | 'differe' | 'rejete' | 'retourne' | 'commente' | 'delegue' | 'demande_info' | 'annule';

/**
 * Hook pour gérer le workflow dynamique basé sur les tables wf_*
 * Utilise les fonctions RPC: get_workflow_status, start_workflow, advance_workflow, resume_workflow
 */
export function useWorkflowEngine(entityType: string, entityId: string) {
  const { toast } = useToast();
  const { user } = useRBAC();
  const queryClient = useQueryClient();

  // Récupérer le statut du workflow
  const { data: status, isLoading, error, refetch } = useQuery<WorkflowStatusData>({
    queryKey: ['wf-status', entityType, entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_workflow_status', {
          p_entity_type: entityType,
          p_entity_id: entityId
        });
      if (error) throw error;
      return data as unknown as WorkflowStatusData;
    },
    enabled: !!entityType && !!entityId,
    refetchInterval: 30000
  });

  // Démarrer un workflow
  const startMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .rpc('start_workflow', {
          p_entity_type: entityType,
          p_entity_id: entityId
        });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['wf-status', entityType, entityId] });
      queryClient.invalidateQueries({ queryKey: [entityType] });
      queryClient.invalidateQueries({ queryKey: ['workflow-tasks'] });
      toast({
        title: 'Workflow démarré',
        description: `Instance créée avec l'ID: ${data}`
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors du démarrage du workflow',
        variant: 'destructive'
      });
    }
  });

  // Faire avancer le workflow (valider, rejeter, différer, etc.)
  const advanceMutation = useMutation({
    mutationFn: async ({
      action,
      motif,
      dateReprise
    }: {
      action: WorkflowAction;
      motif?: string;
      dateReprise?: string;
    }) => {
      const userName = user?.fullName || null;

      const { data, error } = await supabase
        .rpc('advance_workflow', {
          p_entity_type: entityType,
          p_entity_id: entityId,
          p_action: action,
          p_motif: motif || null,
          p_user_name: userName,
          p_date_reprise: dateReprise || null
        });

      if (error) throw error;

      const result = data as AdvanceResult;
      if (!result?.success) {
        throw new Error(result?.error || 'Erreur lors de l\'action');
      }
      return result;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['wf-status', entityType, entityId] });
      queryClient.invalidateQueries({ queryKey: [entityType] });
      queryClient.invalidateQueries({ queryKey: ['workflow-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['pending-workflows'] });

      const messages: Record<WorkflowAction, string> = {
        valide: data.workflow_complete ? 'Workflow terminé avec succès !' : 'Validation effectuée',
        differe: 'Dossier différé',
        rejete: 'Dossier rejeté',
        retourne: 'Dossier retourné à l\'étape précédente',
        commente: 'Commentaire ajouté',
        delegue: 'Dossier délégué',
        demande_info: 'Demande d\'information envoyée',
        annule: 'Workflow annulé'
      };

      toast({
        title: messages[variables.action],
        description: data.workflow_complete
          ? 'Le circuit de validation est terminé'
          : data.new_step
            ? `Passage à l'étape ${data.new_step}`
            : undefined
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de l\'action',
        variant: 'destructive'
      });
    }
  });

  // Reprendre un workflow différé
  const resumeMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .rpc('resume_workflow', {
          p_entity_type: entityType,
          p_entity_id: entityId
        });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };
      if (!result?.success) {
        throw new Error(result?.error || 'Erreur lors de la reprise');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wf-status', entityType, entityId] });
      queryClient.invalidateQueries({ queryKey: [entityType] });
      queryClient.invalidateQueries({ queryKey: ['workflow-tasks'] });

      toast({
        title: 'Workflow repris',
        description: 'Le dossier est de nouveau en cours de traitement'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la reprise',
        variant: 'destructive'
      });
    }
  });

  // Vérifier si l'utilisateur peut agir sur l'étape courante
  const canUserAct = (): boolean => {
    if (!status?.exists || !user) return false;
    if (status.status !== 'en_cours') return false;

    const currentRole = status.current_role_required;
    if (!currentRole) return false;

    // Mapper les rôles de l'utilisateur vers les codes du workflow
    const userRoles: string[] = [];

    // Ajouter le rôle hiérarchique
    if (user.roleHierarchique) {
      const roleMapping: Record<string, string> = {
        'DG': 'DG',
        'DGA': 'DGA',
        'Directeur': 'DIRECTEUR',
        'Sous-Directeur': 'SOUS_DIRECTEUR',
        'Chef de Service': 'CHEF_SERVICE',
        'Agent': 'AGENT'
      };
      const mappedRole = roleMapping[user.roleHierarchique];
      if (mappedRole) userRoles.push(mappedRole);
    }

    // Ajouter le profil fonctionnel
    if (user.profilFonctionnel) {
      const profilMapping: Record<string, string[]> = {
        'Admin': ['DG', 'DGA', 'DIRECTEUR', 'SOUS_DIRECTEUR', 'CHEF_SERVICE', 'CONTROLEUR', 'TRESORIER', 'VALIDATEUR', 'AGENT', 'AUDITEUR'],
        'Validateur': ['VALIDATEUR'],
        'Controleur': ['CONTROLEUR'],
        'Tresorerie': ['TRESORIER'],
        'Operationnel': ['AGENT']
      };
      const additionalRoles = profilMapping[user.profilFonctionnel] || [];
      userRoles.push(...additionalRoles);
    }

    // Vérifier si le rôle requis correspond à l'un des rôles de l'utilisateur
    return userRoles.includes(currentRole);
  };

  // Obtenir les actions disponibles pour l'utilisateur
  const getAvailableActions = (): WorkflowAction[] => {
    if (!canUserAct()) return [];

    // Actions de base toujours disponibles
    const actions: WorkflowAction[] = ['valide', 'differe', 'rejete'];

    // Ajouter les actions conditionnelles
    if (status?.current_step && status.current_step > 1) {
      actions.push('retourne');
    }

    actions.push('commente', 'demande_info');

    return actions;
  };

  return {
    // Statut
    status,
    isLoading,
    error,
    refetch,

    // États dérivés
    isWorkflowStarted: status?.exists === true,
    isComplete: status?.status === 'complete',
    isRejected: status?.status === 'rejete',
    isPending: status?.status === 'en_cours',
    currentStep: status?.current_step,
    currentRole: status?.current_role_required,
    steps: status?.steps || [],
    history: status?.history || [],

    // Permissions
    canUserAct: canUserAct(),
    availableActions: getAvailableActions(),

    // Mutations
    startWorkflow: startMutation.mutateAsync,
    advanceWorkflow: advanceMutation.mutateAsync,
    resumeWorkflow: resumeMutation.mutateAsync,

    // États des mutations
    isStarting: startMutation.isPending,
    isAdvancing: advanceMutation.isPending,
    isResuming: resumeMutation.isPending,
    isMutating: startMutation.isPending || advanceMutation.isPending || resumeMutation.isPending
  };
}

/**
 * Hook pour récupérer les workflows en attente pour l'utilisateur courant
 */
export function usePendingWorkflows(roleCode?: string) {
  return useQuery({
    queryKey: ['pending-workflows', roleCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_pending_workflows', {
          p_role_code: roleCode || null
        });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000
  });
}
