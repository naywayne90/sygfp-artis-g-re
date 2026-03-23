/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RequiredDocType {
  id: string;
  code: string;
  label: string;
  module_code: string;
  category: string | null;
  description: string | null;
  is_mandatory: boolean;
  is_active: boolean;
  icon: string | null;
  allowed_file_types: string[] | null;
  max_file_size_mb: number | null;
  created_at: string;
  updated_at: string;
}

export interface RequiredDocStats {
  total: number;
  active: number;
  mandatory: number;
  byModule: Record<string, number>;
}

export function useRequiredDocumentTypes(filters?: { module_code?: string }) {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['required-document-types', filters],
    queryFn: async () => {
      let query = (supabase as any)
        .from('required_document_types')
        .select('*')
        .order('module_code', { ascending: true })
        .order('code', { ascending: true });
      if (filters?.module_code) {
        query = query.eq('module_code', filters.module_code);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as RequiredDocType[];
    },
    retry: 2,
    staleTime: 30_000,
  });

  const stats: RequiredDocStats = {
    total: data?.length ?? 0,
    active: data?.filter((d) => d.is_active).length ?? 0,
    mandatory: data?.filter((d) => d.is_mandatory).length ?? 0,
    byModule: (data ?? []).reduce<Record<string, number>>((acc, d) => {
      acc[d.module_code] = (acc[d.module_code] ?? 0) + 1;
      return acc;
    }, {}),
  };

  const createMutation = useMutation({
    mutationFn: async (input: Omit<RequiredDocType, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await (supabase as any)
        .from('required_document_types')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as RequiredDocType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['required-document-types'] });
      toast.success('Type de document cree avec succes');
    },
    onError: (err: Error) => {
      toast.error('Erreur', { description: err.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RequiredDocType> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('required_document_types')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as RequiredDocType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['required-document-types'] });
      toast.success('Type de document mis a jour');
    },
    onError: (err: Error) => {
      toast.error('Erreur', { description: err.message });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await (supabase as any)
        .from('required_document_types')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as RequiredDocType;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['required-document-types'] });
      toast.success(variables.is_active ? 'Type de document active' : 'Type de document desactive');
    },
    onError: (err: Error) => {
      toast.error('Erreur', { description: err.message });
    },
  });

  return {
    data: data ?? [],
    stats,
    isLoading,
    error,
    refetch,
    create: createMutation,
    update: updateMutation,
    toggleActive: toggleActiveMutation,
  };
}
