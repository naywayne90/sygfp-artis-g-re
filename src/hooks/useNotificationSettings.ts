/**
 * Hook de gestion des paramètres de notifications
 * CRUD pour templates, destinataires et préférences
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Helper pour accéder aux tables non encore générées dans les types Supabase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabaseAny = supabase as any;

// ============================================================================
// TYPES
// ============================================================================

export interface NotificationTemplate {
  id: string;
  code: string;
  titre_template: string;
  corps_template: string;
  type_evenement: NotificationEventType;
  variables_disponibles: string[];
  est_actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationRecipient {
  id: string;
  type_evenement: string;
  role_hierarchique: string | null;
  direction_id: string | null;
  user_id: string | null;
  est_actif: boolean;
  created_at: string;
  // Relations jointes
  direction?: { id: string; label: string; sigle: string } | null;
  user?: { id: string; full_name: string | null; email: string } | null;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  // Canaux
  email_enabled: boolean | null;
  sms_enabled: boolean | null;
  in_app_enabled: boolean | null;
  // Préférences email
  email_daily_summary: boolean | null;
  email_summary_time: string | null;
  // Préférences SMS
  phone_number: string | null;
  sms_urgent_only: boolean | null;
  // Types d'événements
  notify_new_validation: boolean | null;
  notify_rejection: boolean | null;
  notify_budget_alert: boolean | null;
  notify_deadline: boolean | null;
  notify_workflow_update: boolean | null;
}

export interface NotificationLog {
  id: string;
  template_id: string | null;
  recipient_id: string;
  notification_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  variables_utilisees: Record<string, unknown>;
  titre_rendu: string | null;
  corps_rendu: string | null;
  statut: 'pending' | 'sent' | 'read' | 'failed';
  canal: NotificationChannel;
  erreur: string | null;
  created_at: string;
  sent_at: string | null;
  read_at: string | null;
}

export type NotificationEventType =
  | 'ordonnancement'
  | 'reglement'
  | 'reglement_partiel'
  | 'note_soumise'
  | 'note_validee'
  | 'note_rejetee'
  | 'engagement_cree'
  | 'liquidation_validee';

export type NotificationChannel = 'in_app' | 'email' | 'both' | 'disabled';

export interface CreateTemplateParams {
  code: string;
  titre_template: string;
  corps_template: string;
  type_evenement: NotificationEventType;
  variables_disponibles?: string[];
}

export interface UpdateTemplateParams {
  id: string;
  titre_template?: string;
  corps_template?: string;
  variables_disponibles?: string[];
  est_actif?: boolean;
}

export interface CreateRecipientParams {
  type_evenement: string;
  role_hierarchique?: string;
  direction_id?: string;
  user_id?: string;
}

// ============================================================================
// CONSTANTES
// ============================================================================

export const EVENT_TYPE_LABELS: Record<NotificationEventType, string> = {
  ordonnancement: 'Ordonnancement',
  reglement: 'Règlement effectué',
  reglement_partiel: 'Règlement partiel',
  note_soumise: 'Note soumise',
  note_validee: 'Note validée',
  note_rejetee: 'Note rejetée',
  engagement_cree: 'Engagement créé',
  liquidation_validee: 'Liquidation validée',
};

export const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  in_app: 'Application uniquement',
  email: 'Email uniquement',
  both: 'Application + Email',
  disabled: 'Désactivé',
};

export const ROLE_LABELS: Record<string, string> = {
  DG: 'Directeur Général',
  DMG: 'Directeur des Moyens Généraux',
  Directeur: 'Directeurs',
  'Sous-Directeur': 'Sous-Directeurs',
  'Chef de Service': 'Chefs de Service',
  Agent: 'Agents',
};

export const DEFAULT_VARIABLES: Record<NotificationEventType, string[]> = {
  ordonnancement: ['reference', 'montant', 'fournisseur', 'date', 'direction', 'objet'],
  reglement: ['reference', 'montant', 'mode_paiement', 'date', 'fournisseur', 'banque'],
  reglement_partiel: ['reference', 'montant_regle', 'montant_total', 'reste_a_payer', 'date', 'fournisseur'],
  note_soumise: ['reference', 'objet', 'direction', 'montant', 'createur', 'date'],
  note_validee: ['reference', 'validateur', 'date', 'commentaire'],
  note_rejetee: ['reference', 'motif', 'validateur', 'date'],
  engagement_cree: ['reference', 'montant', 'fournisseur', 'date', 'ligne_budgetaire'],
  liquidation_validee: ['reference', 'montant', 'fournisseur', 'date'],
};

// ============================================================================
// HOOK: useNotificationTemplates
// ============================================================================

export function useNotificationTemplates() {
  const queryClient = useQueryClient();

  const {
    data: templates = [],
    isLoading,
    error,
    refetch,
  } = useQuery<NotificationTemplate[]>({
    queryKey: ['notification-templates'],
    queryFn: async () => {
      const { data, error } = await supabaseAny
        .from('notification_templates')
        .select('*')
        .order('type_evenement', { ascending: true });

      if (error) throw error;
      return (data || []).map((t) => ({
        ...t,
        variables_disponibles: Array.isArray(t.variables_disponibles)
          ? t.variables_disponibles
          : JSON.parse(t.variables_disponibles as string || '[]'),
      })) as NotificationTemplate[];
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (params: CreateTemplateParams) => {
      const { data, error } = await supabaseAny
        .from('notification_templates')
        .insert({
          code: params.code,
          titre_template: params.titre_template,
          corps_template: params.corps_template,
          type_evenement: params.type_evenement,
          variables_disponibles: params.variables_disponibles || [],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Template créé avec succès');
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async (params: UpdateTemplateParams) => {
      const { id, ...updates } = params;
      const { error } = await supabaseAny
        .from('notification_templates')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Template mis à jour');
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabaseAny
        .from('notification_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Template supprimé');
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return {
    templates,
    isLoading,
    error: error as Error | null,
    refetch,
    createTemplate: createTemplateMutation.mutateAsync,
    updateTemplate: updateTemplateMutation.mutateAsync,
    deleteTemplate: deleteTemplateMutation.mutateAsync,
    isCreating: createTemplateMutation.isPending,
    isUpdating: updateTemplateMutation.isPending,
    isDeleting: deleteTemplateMutation.isPending,
  };
}

// ============================================================================
// HOOK: useNotificationRecipients
// ============================================================================

export function useNotificationRecipients() {
  const queryClient = useQueryClient();

  const {
    data: recipients = [],
    isLoading,
    error,
    refetch,
  } = useQuery<NotificationRecipient[]>({
    queryKey: ['notification-recipients'],
    queryFn: async () => {
      const { data, error } = await supabaseAny
        .from('notification_recipients')
        .select(`
          *,
          direction:directions(id, label, sigle),
          user:profiles(id, full_name, email)
        `)
        .order('type_evenement', { ascending: true });

      if (error) throw error;
      return (data || []) as NotificationRecipient[];
    },
  });

  const createRecipientMutation = useMutation({
    mutationFn: async (params: CreateRecipientParams) => {
      const { data, error } = await supabaseAny
        .from('notification_recipients')
        .insert({
          type_evenement: params.type_evenement,
          role_hierarchique: params.role_hierarchique || null,
          direction_id: params.direction_id || null,
          user_id: params.user_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Destinataire ajouté');
      queryClient.invalidateQueries({ queryKey: ['notification-recipients'] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateRecipientMutation = useMutation({
    mutationFn: async (params: { id: string; est_actif: boolean }) => {
      const { error } = await supabaseAny
        .from('notification_recipients')
        .update({ est_actif: params.est_actif })
        .eq('id', params.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Destinataire mis à jour');
      queryClient.invalidateQueries({ queryKey: ['notification-recipients'] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteRecipientMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabaseAny
        .from('notification_recipients')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Destinataire supprimé');
      queryClient.invalidateQueries({ queryKey: ['notification-recipients'] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Grouper par type d'événement
  const recipientsByEvent = recipients.reduce((acc, recipient) => {
    const type = recipient.type_evenement;
    if (!acc[type]) acc[type] = [];
    acc[type].push(recipient);
    return acc;
  }, {} as Record<string, NotificationRecipient[]>);

  return {
    recipients,
    recipientsByEvent,
    isLoading,
    error: error as Error | null,
    refetch,
    createRecipient: createRecipientMutation.mutateAsync,
    updateRecipient: updateRecipientMutation.mutateAsync,
    deleteRecipient: deleteRecipientMutation.mutateAsync,
    isCreating: createRecipientMutation.isPending,
    isUpdating: updateRecipientMutation.isPending,
    isDeleting: deleteRecipientMutation.isPending,
  };
}

// ============================================================================
// HOOK: useNotificationPreferences (préférences système globales)
// ============================================================================

export function useSystemNotificationPreferences() {
  const queryClient = useQueryClient();

  const {
    data: preferences = [],
    isLoading,
    error,
    refetch,
  } = useQuery<NotificationPreference[]>({
    queryKey: ['system-notification-preferences'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .order('type_evenement', { ascending: true });

      if (error) throw error;
      return (data || []) as NotificationPreference[];
    },
  });

  return {
    preferences,
    isLoading,
    error: error as Error | null,
    refetch,
    invalidate: () => queryClient.invalidateQueries({ queryKey: ['system-notification-preferences'] }),
  };
}

// ============================================================================
// HOOK: useNotificationLogs
// ============================================================================

export function useNotificationLogs(options?: { limit?: number }) {
  const { limit = 100 } = options || {};

  const {
    data: logs = [],
    isLoading,
    error,
    refetch,
  } = useQuery<NotificationLog[]>({
    queryKey: ['notification-logs', limit],
    queryFn: async () => {
      const { data, error } = await supabaseAny
        .from('notification_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as NotificationLog[];
    },
  });

  // Statistiques
  const stats = {
    total: logs.length,
    sent: logs.filter((l) => l.statut === 'sent').length,
    read: logs.filter((l) => l.statut === 'read').length,
    failed: logs.filter((l) => l.statut === 'failed').length,
    pending: logs.filter((l) => l.statut === 'pending').length,
  };

  return {
    logs,
    stats,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

// ============================================================================
// HOOK: useRenderTemplate - Aperçu d'un template avec des données de test
// ============================================================================

export function useRenderTemplate() {
  const renderMutation = useMutation({
    mutationFn: async (params: { templateCode: string; variables: Record<string, string> }) => {
      const { data, error } = await supabaseAny.rpc('render_notification_template', {
        p_template_code: params.templateCode,
        p_variables: params.variables,
      });

      if (error) throw error;
      const result = data as { titre: string; corps: string; template_id: string }[] | null;
      return result && result.length > 0 ? result[0] : null;
    },
  });

  return {
    render: renderMutation.mutateAsync,
    isRendering: renderMutation.isPending,
    error: renderMutation.error as Error | null,
  };
}

// ============================================================================
// HOOK: Données de référence (utilisateurs, directions)
// ============================================================================

export function useNotificationReferenceData() {
  const { data: users = [] } = useQuery({
    queryKey: ['users-for-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, first_name, last_name, email, role_hierarchique')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      return data || [];
    },
  });

  const { data: directions = [] } = useQuery({
    queryKey: ['directions-for-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('directions')
        .select('id, label, sigle, code')
        .order('label');

      if (error) throw error;
      return data || [];
    },
  });

  return { users, directions };
}

export default useNotificationTemplates;
