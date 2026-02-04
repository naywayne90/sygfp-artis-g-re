// @ts-nocheck - Dynamic table names
/**
 * Hook de validation pour les entités SYGFP
 * Gère les actions : Valider, Différer, Rejeter
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuditLog } from '@/hooks/useAuditLog';
import type {
  ValidationEntityType,
  ValidationResult,
  DiffereFormData,
  RejetFormData,
} from '@/types/validation';
import { ENTITY_TYPE_LABELS } from '@/types/validation';

// Mapping des types d'entités vers les tables Supabase
const ENTITY_TABLE_MAP: Record<ValidationEntityType, string> = {
  notes_sef: 'notes_sef',
  engagement: 'budget_engagements',
  liquidation: 'liquidations',
  ordonnancement: 'ordonnancements',
};

// Mapping des query keys pour invalidation
const ENTITY_QUERY_KEYS: Record<ValidationEntityType, string[]> = {
  notes_sef: ['notes-sef', 'notes_sef'],
  engagement: ['engagements', 'budget_engagements'],
  liquidation: ['liquidations'],
  ordonnancement: ['ordonnancements'],
};

export function useValidation(entityType: ValidationEntityType) {
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();

  // Mutation pour valider une entité
  const validateMutation = useMutation({
    mutationFn: async (entityId: string): Promise<ValidationResult> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const table = ENTITY_TABLE_MAP[entityType];
      const now = new Date().toISOString();

      const { error } = await supabase
        .from(table)
        .update({
          statut: 'validé',
          validated_by: user.id,
          validated_at: now,
          updated_at: now,
        })
        .eq('id', entityId);

      if (error) throw error;

      // Audit log
      await logAction({
        entityType,
        entityId,
        action: 'validate',
        newValues: { statut: 'validé' },
      });

      return {
        success: true,
        entityId,
        newStatus: 'validé',
        message: `${ENTITY_TYPE_LABELS[entityType]} validé(e) avec succès`,
      };
    },
    onSuccess: (result) => {
      // Invalider les queries associées
      ENTITY_QUERY_KEYS[entityType].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
      toast.success(result.message);
    },
    onError: (error) => {
      toast.error(`Erreur lors de la validation : ${error.message}`);
    },
  });

  // Mutation pour différer une entité
  const differMutation = useMutation({
    mutationFn: async ({
      entityId,
      data,
    }: {
      entityId: string;
      data: DiffereFormData;
    }): Promise<ValidationResult> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const table = ENTITY_TABLE_MAP[entityType];
      const now = new Date().toISOString();

      const updateData: Record<string, unknown> = {
        statut: 'différé',
        motif_differe: data.motif,
        updated_at: now,
      };

      if (data.conditionReprise) {
        updateData.condition_reprise = data.conditionReprise;
      }

      if (data.dateReprisePrevue) {
        updateData.date_reprise_prevue = data.dateReprisePrevue.toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', entityId);

      if (error) throw error;

      // Audit log
      await logAction({
        entityType,
        entityId,
        action: 'defer',
        newValues: {
          statut: 'différé',
          motif: data.motif,
          conditionReprise: data.conditionReprise,
          dateReprisePrevue: data.dateReprisePrevue?.toISOString(),
        },
      });

      return {
        success: true,
        entityId,
        newStatus: 'différé',
        message: `${ENTITY_TYPE_LABELS[entityType]} différé(e) avec succès`,
      };
    },
    onSuccess: (result) => {
      ENTITY_QUERY_KEYS[entityType].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
      toast.success(result.message);
    },
    onError: (error) => {
      toast.error(`Erreur lors du différé : ${error.message}`);
    },
  });

  // Mutation pour rejeter une entité
  const rejectMutation = useMutation({
    mutationFn: async ({
      entityId,
      data,
    }: {
      entityId: string;
      data: RejetFormData;
    }): Promise<ValidationResult> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const table = ENTITY_TABLE_MAP[entityType];
      const now = new Date().toISOString();

      const { error } = await supabase
        .from(table)
        .update({
          statut: 'rejeté',
          motif_rejet: data.motif,
          rejected_by: user.id,
          rejected_at: now,
          updated_at: now,
        })
        .eq('id', entityId);

      if (error) throw error;

      // Audit log
      await logAction({
        entityType,
        entityId,
        action: 'reject',
        newValues: {
          statut: 'rejeté',
          motif: data.motif,
        },
      });

      return {
        success: true,
        entityId,
        newStatus: 'rejeté',
        message: `${ENTITY_TYPE_LABELS[entityType]} rejeté(e)`,
      };
    },
    onSuccess: (result) => {
      ENTITY_QUERY_KEYS[entityType].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
      toast.success(result.message);
    },
    onError: (error) => {
      toast.error(`Erreur lors du rejet : ${error.message}`);
    },
  });

  return {
    // Actions
    validate: validateMutation.mutate,
    validateAsync: validateMutation.mutateAsync,
    differ: differMutation.mutate,
    differAsync: differMutation.mutateAsync,
    reject: rejectMutation.mutate,
    rejectAsync: rejectMutation.mutateAsync,

    // États de chargement
    isValidating: validateMutation.isPending,
    isDiffering: differMutation.isPending,
    isRejecting: rejectMutation.isPending,
    isLoading: validateMutation.isPending || differMutation.isPending || rejectMutation.isPending,

    // Erreurs
    validateError: validateMutation.error,
    differError: differMutation.error,
    rejectError: rejectMutation.error,
  };
}
