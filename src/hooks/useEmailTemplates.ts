/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EmailTemplate {
  id: string;
  code: string;
  label: string;
  subject: string;
  body_html: string;
  description: string | null;
  variables: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useEmailTemplates() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('email_templates')
        .select('*')
        .order('code', { ascending: true });
      if (error) throw error;
      return data as EmailTemplate[];
    },
    retry: 2,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: async (input: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await (supabase as any)
        .from('email_templates')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as EmailTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success("Modele d'email cree avec succes");
    },
    onError: (err: Error) => {
      toast.error('Erreur', { description: err.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EmailTemplate> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('email_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as EmailTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success("Modele d'email mis a jour");
    },
    onError: (err: Error) => {
      toast.error('Erreur', { description: err.message });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await (supabase as any)
        .from('email_templates')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as EmailTemplate;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success(variables.is_active ? 'Modele active' : 'Modele desactive');
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
