import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OrdonnancementSignature {
  id: string;
  ordonnancement_id: string;
  role: string;
  required: boolean | null;
  signed_by: string | null;
  signed_at: string | null;
  signature_ip: string | null;
  comments: string | null;
  created_at: string | null;
  signer?: { id: string; full_name: string | null } | null;
}

export interface OrdonnancementPiece {
  id: string;
  ordonnancement_id: string;
  piece_type: string;
  piece_label: string;
  file_path: string | null;
  file_name: string | null;
  source_entity_type: string | null;
  source_entity_id: string | null;
  included_in_parapheur: boolean | null;
  created_at: string | null;
}

const SIGNATURE_ROLE_LABELS: Record<string, string> = {
  DAAF: 'Directeur Administratif et Financier',
  DG: 'Directeur Général (Ordonnateur)',
};

export function useOrdonnancementSignatures(ordonnancementId: string | undefined) {
  const queryClient = useQueryClient();

  // Fetch signatures
  const { data: signatures = [], isLoading: isLoadingSignatures } = useQuery({
    queryKey: ['ordonnancement-signatures', ordonnancementId],
    queryFn: async () => {
      if (!ordonnancementId) return [];

      const { data, error } = await supabase
        .from('ordonnancement_signatures')
        .select(
          `
          *,
          signer:profiles!ordonnancement_signatures_signed_by_fkey(id, full_name)
        `
        )
        .eq('ordonnancement_id', ordonnancementId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data ?? []) as unknown as OrdonnancementSignature[];
    },
    enabled: !!ordonnancementId,
  });

  // Fetch pieces for parapheur
  const { data: pieces = [], isLoading: isLoadingPieces } = useQuery({
    queryKey: ['ordonnancement-pieces', ordonnancementId],
    queryFn: async () => {
      if (!ordonnancementId) return [];

      const { data, error } = await supabase
        .from('ordonnancement_pieces')
        .select('*')
        .eq('ordonnancement_id', ordonnancementId)
        .order('piece_type');

      if (error) throw error;
      return (data ?? []) as unknown as OrdonnancementPiece[];
    },
    enabled: !!ordonnancementId,
  });

  // Sign
  const signMutation = useMutation({
    mutationFn: async ({ signatureId, comments }: { signatureId: string; comments?: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('ordonnancement_signatures')
        .update({
          signed_at: new Date().toISOString(),
          signed_by: user.id,
          comments: comments || null,
        })
        .eq('id', signatureId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordonnancement-signatures', ordonnancementId] });
      queryClient.invalidateQueries({ queryKey: ['ordonnancements'] });
      toast.success('Signature apposée');
    },
    onError: (error: Error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  // Reject signature (reset to unsigned + reject ordonnancement)
  const rejectSignatureMutation = useMutation({
    mutationFn: async ({ signatureId, reason }: { signatureId: string; reason: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Fetch the signature to get the ordonnancement_id
      const { data: sig, error: sigFetchError } = await supabase
        .from('ordonnancement_signatures')
        .select('ordonnancement_id')
        .eq('id', signatureId)
        .single();

      if (sigFetchError) throw sigFetchError;

      // Record the rejection in comments
      const { error } = await supabase
        .from('ordonnancement_signatures')
        .update({
          signed_at: new Date().toISOString(),
          signed_by: user.id,
          comments: `REJETÉ: ${reason}`,
        })
        .eq('id', signatureId);

      if (error) throw error;

      // Reject the ordonnancement
      await supabase
        .from('ordonnancements')
        .update({
          statut: 'rejete',
          rejection_reason: reason,
          rejected_at: new Date().toISOString(),
          rejected_by: user.id,
        })
        .eq('id', sig.ordonnancement_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordonnancement-signatures', ordonnancementId] });
      queryClient.invalidateQueries({ queryKey: ['ordonnancements'] });
      toast.success('Signature rejetée');
    },
    onError: (error: Error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  // Derive status from signed_by
  const currentSignature = signatures.find((s) => !s.signed_by);
  const allSigned = signatures.length > 0 && signatures.every((s) => s.signed_by);
  const isRejected = signatures.some((s) => s.comments?.startsWith('REJETÉ:'));
  const signedCount = signatures.filter(
    (s) => s.signed_by && !s.comments?.startsWith('REJETÉ:')
  ).length;

  return {
    signatures,
    pieces,
    isLoading: isLoadingSignatures || isLoadingPieces,
    currentSignature,
    allSigned,
    isRejected,
    signedCount,
    totalSignatures: signatures.length,
    sign: signMutation.mutate,
    rejectSignature: rejectSignatureMutation.mutate,
    isSigning: signMutation.isPending,
    isRejecting: rejectSignatureMutation.isPending,
    getRoleLabel: (role: string) => SIGNATURE_ROLE_LABELS[role] || role,
  };
}
