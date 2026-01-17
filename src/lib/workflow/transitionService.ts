/**
 * Service de gestion des transitions de workflow
 * 
 * Gère les transitions de statut avec vérification des droits,
 * validation des conditions et journalisation complète.
 */

import { supabase } from "@/integrations/supabase/client";

// ===== Types =====

export interface WorkflowStatus {
  code: string;
  label: string;
  description?: string;
  color: string;
  bgColor: string;
  isTerminal: boolean;
  isPending: boolean;
  ordre: number;
}

export interface WorkflowTransition {
  toStatus: string;
  actionCode: string;
  actionLabel: string;
  requiresMotif: boolean;
  requiresBudgetCheck: boolean;
}

export interface TransitionResult {
  success: boolean;
  actionCode: string | null;
  message: string;
}

export interface TransitionHistoryEntry {
  id: string;
  fromStatus: string;
  toStatus: string;
  actionCode: string;
  performedBy: string | null;
  performerName: string | null;
  performedAt: string;
  motif: string | null;
  metadata: Record<string, unknown>;
}

export interface TransitionPayload {
  entityId: string;
  entityCode?: string;
  fromStatus: string;
  toStatus: string;
  motif?: string;
  metadata?: Record<string, unknown>;
}

// ===== Modules supportés =====

export type WorkflowModule = 
  | 'notes_sef'
  | 'notes_dg'
  | 'expressions_besoin'
  | 'marches'
  | 'budget_engagements'
  | 'budget_liquidations'
  | 'ordonnancements'
  | 'reglements';

// ===== Actions standards =====

export const WORKFLOW_ACTIONS = {
  SUBMIT: { code: 'SUBMIT', label: 'Soumettre' },
  VALIDATE: { code: 'VALIDATE', label: 'Valider' },
  REJECT: { code: 'REJECT', label: 'Rejeter' },
  DEFER: { code: 'DEFER', label: 'Différer' },
  RESUBMIT: { code: 'RESUBMIT', label: 'Resoumettre' },
  REVISE: { code: 'REVISE', label: 'Réviser' },
  FORWARD_DG: { code: 'FORWARD_DG', label: 'Transmettre au DG' },
  IMPUTE: { code: 'IMPUTE', label: 'Imputer' },
  VISA: { code: 'VISA', label: 'Viser' },
  SIGN: { code: 'SIGN', label: 'Signer' },
  COMPLETE_PAYMENT: { code: 'COMPLETE_PAYMENT', label: 'Confirmer paiement' },
  REFUSE_PAYMENT: { code: 'REFUSE_PAYMENT', label: 'Refuser paiement' },
} as const;

// ===== Fonctions du service =====

/**
 * Récupère tous les statuts configurés
 */
export async function getAllStatuses(): Promise<WorkflowStatus[]> {
  const { data, error } = await supabase
    .from('workflow_statuses')
    .select('*')
    .order('ordre');

  if (error) {
    console.error('Erreur chargement statuts:', error);
    return [];
  }

  return data.map((s) => ({
    code: s.code,
    label: s.label,
    description: s.description || undefined,
    color: s.color || 'gray',
    bgColor: s.bg_color || 'bg-gray-100',
    isTerminal: s.is_terminal || false,
    isPending: s.is_pending || false,
    ordre: s.ordre || 0,
  }));
}

/**
 * Récupère les transitions disponibles pour un module et statut donné
 */
export async function getAvailableTransitions(
  module: WorkflowModule,
  currentStatus: string
): Promise<WorkflowTransition[]> {
  const { data, error } = await supabase.rpc('get_available_transitions', {
    p_module: module,
    p_current_status: currentStatus,
  });

  if (error) {
    console.error('Erreur récupération transitions:', error);
    return [];
  }

  return (data || []).map((t: any) => ({
    toStatus: t.to_status,
    actionCode: t.action_code,
    actionLabel: t.action_label,
    requiresMotif: t.requires_motif,
    requiresBudgetCheck: t.requires_budget_check,
  }));
}

/**
 * Vérifie si une transition spécifique est autorisée
 */
export async function canTransition(
  module: WorkflowModule,
  fromStatus: string,
  toStatus: string
): Promise<{ allowed: boolean; reason: string; requiresMotif: boolean }> {
  const { data, error } = await supabase.rpc('can_transition', {
    p_module: module,
    p_from_status: fromStatus,
    p_to_status: toStatus,
  });

  if (error || !data || data.length === 0) {
    return { allowed: false, reason: 'Erreur de vérification', requiresMotif: false };
  }

  const result = data[0];
  return {
    allowed: result.allowed,
    reason: result.reason,
    requiresMotif: result.requires_motif || false,
  };
}

/**
 * Exécute une transition de workflow avec journalisation
 */
export async function executeTransition(
  module: WorkflowModule,
  payload: TransitionPayload
): Promise<TransitionResult> {
  const { data, error } = await supabase.rpc('execute_transition', {
    p_module: module,
    p_entity_id: payload.entityId,
    p_entity_code: payload.entityCode || null,
    p_from_status: payload.fromStatus,
    p_to_status: payload.toStatus,
    p_motif: payload.motif || null,
    p_metadata: JSON.stringify(payload.metadata || {}),
  });

  if (error) {
    console.error('Erreur exécution transition:', error);
    return { success: false, actionCode: null, message: error.message };
  }

  if (!data || data.length === 0) {
    return { success: false, actionCode: null, message: 'Réponse invalide' };
  }

  const result = data[0];
  return {
    success: result.success,
    actionCode: result.action_code,
    message: result.message,
  };
}

/**
 * Effectue une transition complète sur une entité (mise à jour + log)
 */
export async function transitionEntity(
  module: WorkflowModule,
  tableName: string,
  payload: TransitionPayload & { 
    additionalUpdates?: Record<string, unknown>;
  }
): Promise<TransitionResult> {
  // 1. Vérifier et logger la transition
  const transitionResult = await executeTransition(module, payload);
  
  if (!transitionResult.success) {
    return transitionResult;
  }

  // 2. Mettre à jour l'entité dans la table
  const updates: Record<string, unknown> = {
    statut: payload.toStatus,
    ...payload.additionalUpdates,
  };

  // Ajouter les champs spécifiques selon l'action
  if (payload.toStatus === 'differe' && payload.motif) {
    updates.motif_differe = payload.motif;
    updates.date_differe = new Date().toISOString();
    updates.differe_by = (await supabase.auth.getUser()).data.user?.id;
  }
  
  if (payload.toStatus === 'rejete' && payload.motif) {
    updates.rejection_reason = payload.motif;
    updates.rejected_at = new Date().toISOString();
    updates.rejected_by = (await supabase.auth.getUser()).data.user?.id;
  }

  if (payload.toStatus === 'valide') {
    updates.validated_at = new Date().toISOString();
    updates.validated_by = (await supabase.auth.getUser()).data.user?.id;
  }

  if (payload.toStatus === 'soumis' && payload.fromStatus === 'brouillon') {
    updates.submitted_at = new Date().toISOString();
    updates.submitted_by = (await supabase.auth.getUser()).data.user?.id;
  }

  // Appel générique à la table
  const { error: updateError } = await supabase
    .from(tableName as any)
    .update(updates as any)
    .eq('id', payload.entityId);

  if (updateError) {
    console.error('Erreur mise à jour entité:', updateError);
    return { 
      success: false, 
      actionCode: transitionResult.actionCode, 
      message: `Transition loguée mais erreur mise à jour: ${updateError.message}` 
    };
  }

  return transitionResult;
}

/**
 * Récupère l'historique des transitions d'une entité
 */
export async function getTransitionHistory(
  module: WorkflowModule,
  entityId: string
): Promise<TransitionHistoryEntry[]> {
  const { data, error } = await supabase.rpc('get_entity_transition_history', {
    p_module: module,
    p_entity_id: entityId,
  });

  if (error) {
    console.error('Erreur chargement historique:', error);
    return [];
  }

  return (data || []).map((h: any) => ({
    id: h.id,
    fromStatus: h.from_status,
    toStatus: h.to_status,
    actionCode: h.action_code,
    performedBy: h.performed_by,
    performerName: h.performer_name,
    performedAt: h.performed_at,
    motif: h.motif,
    metadata: h.metadata || {},
  }));
}

/**
 * Raccourcis pour les actions courantes
 */
export const workflowActions = {
  submit: (module: WorkflowModule, entityId: string, entityCode?: string) =>
    transitionEntity(module, getTableName(module), {
      entityId,
      entityCode,
      fromStatus: 'brouillon',
      toStatus: 'soumis',
    }),

  validate: (module: WorkflowModule, entityId: string, fromStatus = 'soumis', entityCode?: string) =>
    transitionEntity(module, getTableName(module), {
      entityId,
      entityCode,
      fromStatus,
      toStatus: 'valide',
    }),

  reject: (module: WorkflowModule, entityId: string, motif: string, fromStatus = 'soumis', entityCode?: string) =>
    transitionEntity(module, getTableName(module), {
      entityId,
      entityCode,
      fromStatus,
      toStatus: 'rejete',
      motif,
    }),

  defer: (module: WorkflowModule, entityId: string, motif: string, fromStatus = 'soumis', entityCode?: string) =>
    transitionEntity(module, getTableName(module), {
      entityId,
      entityCode,
      fromStatus,
      toStatus: 'differe',
      motif,
    }),

  resubmit: (module: WorkflowModule, entityId: string, entityCode?: string) =>
    transitionEntity(module, getTableName(module), {
      entityId,
      entityCode,
      fromStatus: 'differe',
      toStatus: 'soumis',
    }),
};

/**
 * Mappe un module vers son nom de table
 */
function getTableName(module: WorkflowModule): string {
  const mapping: Record<WorkflowModule, string> = {
    notes_sef: 'notes_sef',
    notes_dg: 'notes_dg',
    expressions_besoin: 'expressions_besoin',
    marches: 'marches',
    budget_engagements: 'budget_engagements',
    budget_liquidations: 'budget_liquidations',
    ordonnancements: 'ordonnancements',
    reglements: 'reglements',
  };
  return mapping[module];
}
