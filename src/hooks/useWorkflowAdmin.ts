import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Types
export interface WfRole {
  id: string;
  code: string;
  label: string;
  description: string | null;
  niveau_hierarchique: number;
  est_actif: boolean;
}

export interface WfAction {
  id: string;
  code: string;
  label: string;
  description: string | null;
  icon: string | null;
  color: string;
  require_motif: boolean;
  require_date_reprise: boolean;
  is_terminal: boolean;
  est_actif: boolean;
}

export interface WfService {
  id: string;
  code: string;
  label: string;
  description: string | null;
  parent_id: string | null;
  responsable_role_code: string | null;
  est_actif: boolean;
}

export interface WfStepPermission {
  role_code: string;
  service_code: string | null;
  can_view: boolean;
  can_act: boolean;
  can_delegate: boolean;
  is_primary: boolean;
}

export interface WfStepAction {
  code: string;
  label: string;
  icon: string | null;
  color: string;
  require_motif: boolean;
  is_terminal: boolean;
}

export interface WfStep {
  id: string;
  step_order: number;
  label: string;
  description: string | null;
  role_required: string;
  role_alternatif: string | null;
  direction_required: string | null;
  est_optionnel: boolean;
  delai_max_heures: number;
  permissions: WfStepPermission[];
  actions: WfStepAction[];
}

export interface WfDefinition {
  id: string;
  entity_type: string;
  nom: string;
  description: string | null;
  est_actif: boolean;
  steps: WfStep[];
}

export interface WorkflowConfig {
  workflows: WfDefinition[];
  roles: WfRole[];
  services: WfService[];
  actions: WfAction[];
}

// Hook principal
export function useWorkflowAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer toute la configuration
  const { data: config, isLoading, error, refetch } = useQuery<WorkflowConfig>({
    queryKey: ['workflow-config'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_workflow_config');
      if (error) throw error;
      return data as unknown as WorkflowConfig;
    },
  });

  // Upsert Workflow
  const upsertWorkflow = useMutation({
    mutationFn: async (params: {
      id?: string;
      entity_type?: string;
      nom?: string;
      description?: string;
      est_actif?: boolean;
    }) => {
      const { data, error } = await supabase.rpc('wf_admin_upsert_workflow', {
        p_id: params.id || null,
        p_entity_type: params.entity_type || null,
        p_nom: params.nom || null,
        p_description: params.description || null,
        p_est_actif: params.est_actif ?? true,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-config'] });
      toast({ title: 'Workflow sauvegardé', description: 'Les modifications ont été enregistrées.' });
    },
    onError: (err: Error) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    },
  });

  // Upsert Step
  const upsertStep = useMutation({
    mutationFn: async (params: {
      id?: string;
      workflow_id?: string;
      step_order?: number;
      label?: string;
      description?: string;
      role_required?: string;
      role_alternatif?: string | null;
      direction_required?: string | null;
      est_optionnel?: boolean;
      delai_max_heures?: number;
    }) => {
      const { data, error } = await supabase.rpc('wf_admin_upsert_step', {
        p_id: params.id || null,
        p_workflow_id: params.workflow_id || null,
        p_step_order: params.step_order || null,
        p_label: params.label || null,
        p_description: params.description || null,
        p_role_required: params.role_required || null,
        p_role_alternatif: params.role_alternatif || null,
        p_direction_required: params.direction_required || null,
        p_est_optionnel: params.est_optionnel ?? false,
        p_delai_max_heures: params.delai_max_heures ?? 48,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-config'] });
      toast({ title: 'Étape sauvegardée' });
    },
    onError: (err: Error) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    },
  });

  // Delete Step
  const deleteStep = useMutation({
    mutationFn: async (stepId: string) => {
      const { data, error } = await supabase.rpc('wf_admin_delete_step', {
        p_step_id: stepId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-config'] });
      toast({ title: 'Étape supprimée' });
    },
    onError: (err: Error) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    },
  });

  // Reorder Steps
  const reorderSteps = useMutation({
    mutationFn: async (params: { workflow_id: string; step_ids: string[] }) => {
      const { data, error } = await supabase.rpc('wf_admin_reorder_steps', {
        p_workflow_id: params.workflow_id,
        p_step_ids: params.step_ids,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-config'] });
      toast({ title: 'Ordre mis à jour' });
    },
    onError: (err: Error) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    },
  });

  // Upsert Role
  const upsertRole = useMutation({
    mutationFn: async (params: {
      id?: string;
      code?: string;
      label?: string;
      description?: string;
      niveau_hierarchique?: number;
      est_actif?: boolean;
    }) => {
      const { data, error } = await supabase.rpc('wf_admin_upsert_role', {
        p_id: params.id || null,
        p_code: params.code || null,
        p_label: params.label || null,
        p_description: params.description || null,
        p_niveau_hierarchique: params.niveau_hierarchique ?? 0,
        p_est_actif: params.est_actif ?? true,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-config'] });
      toast({ title: 'Rôle sauvegardé' });
    },
    onError: (err: Error) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    },
  });

  // Upsert Service
  const upsertService = useMutation({
    mutationFn: async (params: {
      id?: string;
      code?: string;
      label?: string;
      description?: string;
      parent_id?: string | null;
      responsable_role_code?: string | null;
      est_actif?: boolean;
    }) => {
      const { data, error } = await supabase.rpc('wf_admin_upsert_service', {
        p_id: params.id || null,
        p_code: params.code || null,
        p_label: params.label || null,
        p_description: params.description || null,
        p_parent_id: params.parent_id || null,
        p_responsable_role_code: params.responsable_role_code || null,
        p_est_actif: params.est_actif ?? true,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-config'] });
      toast({ title: 'Service sauvegardé' });
    },
    onError: (err: Error) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    },
  });

  // Upsert Action
  const upsertAction = useMutation({
    mutationFn: async (params: {
      id?: string;
      code?: string;
      label?: string;
      description?: string;
      icon?: string;
      color?: string;
      require_motif?: boolean;
      require_date_reprise?: boolean;
      is_terminal?: boolean;
      est_actif?: boolean;
    }) => {
      const { data, error } = await supabase.rpc('wf_admin_upsert_action', {
        p_id: params.id || null,
        p_code: params.code || null,
        p_label: params.label || null,
        p_description: params.description || null,
        p_icon: params.icon || null,
        p_color: params.color ?? 'gray',
        p_require_motif: params.require_motif ?? false,
        p_require_date_reprise: params.require_date_reprise ?? false,
        p_is_terminal: params.is_terminal ?? false,
        p_est_actif: params.est_actif ?? true,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-config'] });
      toast({ title: 'Action sauvegardée' });
    },
    onError: (err: Error) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    },
  });

  // Set Step Permission
  const setStepPermission = useMutation({
    mutationFn: async (params: {
      step_id: string;
      role_code: string;
      service_code?: string | null;
      can_view?: boolean;
      can_act?: boolean;
      can_delegate?: boolean;
      is_primary?: boolean;
    }) => {
      const { data, error } = await supabase.rpc('wf_admin_set_step_permission', {
        p_step_id: params.step_id,
        p_role_code: params.role_code,
        p_service_code: params.service_code || null,
        p_can_view: params.can_view ?? true,
        p_can_act: params.can_act ?? true,
        p_can_delegate: params.can_delegate ?? false,
        p_is_primary: params.is_primary ?? false,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-config'] });
      toast({ title: 'Permission mise à jour' });
    },
    onError: (err: Error) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    },
  });

  // Set Step Actions
  const setStepActions = useMutation({
    mutationFn: async (params: { step_id: string; action_codes: string[] }) => {
      const { data, error } = await supabase.rpc('wf_admin_set_step_actions', {
        p_step_id: params.step_id,
        p_action_codes: params.action_codes,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-config'] });
      toast({ title: 'Actions de l\'étape mises à jour' });
    },
    onError: (err: Error) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    },
  });

  return {
    config,
    isLoading,
    error,
    refetch,
    // Mutations
    upsertWorkflow,
    upsertStep,
    deleteStep,
    reorderSteps,
    upsertRole,
    upsertService,
    upsertAction,
    setStepPermission,
    setStepActions,
  };
}
