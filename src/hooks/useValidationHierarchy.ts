/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface WorkflowModule {
  id: string;
  code: string;
  label: string;
  description: string | null;
  is_active: boolean;
}

export interface ValidationStep {
  id: string;
  module_id: string;
  role: string;
  step_order: number;
  label: string;
  description: string | null;
  min_amount: number | null;
  max_amount: number | null;
  is_optional: boolean;
  is_active: boolean;
  conditions: Record<string, unknown> | null;
  required_fields: string[] | null;
  required_documents: string[] | null;
  created_at: string;
  updated_at: string;
  workflow_module?: WorkflowModule;
}

export function useValidationHierarchy() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['validation-hierarchy'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('validation_hierarchy')
        .select('*, workflow_module:workflow_modules(id, code, label, description, is_active)')
        .order('step_order', { ascending: true });
      if (error) throw error;
      return data as ValidationStep[];
    },
    retry: 2,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: async (
      input: Omit<ValidationStep, 'id' | 'created_at' | 'updated_at' | 'workflow_module'>
    ) => {
      const { data, error } = await (supabase as any)
        .from('validation_hierarchy')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as ValidationStep;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validation-hierarchy'] });
      toast.success('Etape de validation creee avec succes');
    },
    onError: (err: Error) => {
      toast.error('Erreur', { description: err.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ValidationStep> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('validation_hierarchy')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as ValidationStep;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validation-hierarchy'] });
      toast.success('Etape de validation mise a jour');
    },
    onError: (err: Error) => {
      toast.error('Erreur', { description: err.message });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await (supabase as any)
        .from('validation_hierarchy')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as ValidationStep;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['validation-hierarchy'] });
      toast.success(variables.is_active ? 'Etape activee' : 'Etape desactivee');
    },
    onError: (err: Error) => {
      toast.error('Erreur', { description: err.message });
    },
  });

  return {
    data: data ?? [],
    isLoading,
    error,
    refetch,
    create: createMutation,
    update: updateMutation,
    toggleActive: toggleActiveMutation,
  };
}
