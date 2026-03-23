/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SupplierBankAccount {
  id: string;
  supplier_id: string;
  banque: string;
  code_banque: string | null;
  code_guichet: string | null;
  numero_compte: string;
  cle_rib: string | null;
  iban: string | null;
  bic_swift: string | null;
  titulaire: string | null;
  est_principal: boolean;
  est_actif: boolean;
  created_at: string;
  updated_at: string;
  supplier_name?: string;
}

export interface BankAccountStats {
  total: number;
  active: number;
  byBank: Record<string, number>;
}

export function useSupplierBankAccounts(filters?: { supplier_id?: string }) {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['supplier-bank-accounts', filters],
    queryFn: async () => {
      let query = (supabase as any)
        .from('supplier_bank_accounts')
        .select('*, prestataire:prestataires(raison_sociale)')
        .order('est_principal', { ascending: false })
        .order('banque', { ascending: true });
      if (filters?.supplier_id) {
        query = query.eq('supplier_id', filters.supplier_id);
      }
      const { data, error } = await query;
      if (error) throw error;
      return ((data || []) as Record<string, unknown>[]).map((row) => ({
        ...row,
        supplier_name: (row.prestataire as Record<string, unknown>)?.raison_sociale as
          | string
          | undefined,
      })) as unknown as SupplierBankAccount[];
    },
    retry: 2,
    staleTime: 30_000,
  });

  const stats: BankAccountStats = {
    total: data?.length ?? 0,
    active: data?.filter((a) => a.est_actif).length ?? 0,
    byBank: (data ?? []).reduce<Record<string, number>>((acc, a) => {
      acc[a.banque] = (acc[a.banque] ?? 0) + 1;
      return acc;
    }, {}),
  };

  const createMutation = useMutation({
    mutationFn: async (
      input: Omit<SupplierBankAccount, 'id' | 'created_at' | 'updated_at' | 'supplier_name'>
    ) => {
      const { data, error } = await (supabase as any)
        .from('supplier_bank_accounts')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as SupplierBankAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-bank-accounts'] });
      toast.success('Compte bancaire cree avec succes');
    },
    onError: (err: Error) => {
      toast.error('Erreur', { description: err.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SupplierBankAccount> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('supplier_bank_accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as SupplierBankAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-bank-accounts'] });
      toast.success('Compte bancaire mis a jour');
    },
    onError: (err: Error) => {
      toast.error('Erreur', { description: err.message });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, est_actif }: { id: string; est_actif: boolean }) => {
      const { data, error } = await (supabase as any)
        .from('supplier_bank_accounts')
        .update({ est_actif })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as SupplierBankAccount;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['supplier-bank-accounts'] });
      toast.success(variables.est_actif ? 'Compte active' : 'Compte desactive');
    },
    onError: (err: Error) => {
      toast.error('Erreur', { description: err.message });
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: async ({ id, supplier_id }: { id: string; supplier_id: string }) => {
      // Desactiver tous les comptes principaux du fournisseur
      await (supabase as any)
        .from('supplier_bank_accounts')
        .update({ est_principal: false })
        .eq('supplier_id', supplier_id);
      // Definir le nouveau compte principal
      const { data, error } = await (supabase as any)
        .from('supplier_bank_accounts')
        .update({ est_principal: true })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as SupplierBankAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-bank-accounts'] });
      toast.success('Compte defini comme principal');
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
    setPrimary: setPrimaryMutation,
  };
}
