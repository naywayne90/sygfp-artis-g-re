import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ============================================
// TYPES
// ============================================

export interface NoteAEFHistoryEntry {
  id: string;
  action: string;
  old_statut: string | null;
  new_statut: string | null;
  performed_at: string;
  commentaire: string | null;
  performer: { first_name: string | null; last_name: string | null } | null;
}

export interface NoteAEFAttachment {
  id: string;
  note_id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  created_at: string;
}

interface LinkedNoteSEF {
  id: string;
  numero: string;
  objet: string;
  statut: string | null;
  reference_pivot: string | null;
}

export interface LinkedImputation {
  id: string;
  reference: string | null;
  objet: string;
  montant: number;
  statut: string;
  created_at: string;
  budget_line: { code: string; label: string } | null;
}

// ============================================
// HOOK
// ============================================

export function useNoteAEFDetail(noteId: string | null, _referencePivot?: string | null) {
  // 1. Historique des actions
  const { data: history = [], isLoading: loadingHistory } = useQuery<NoteAEFHistoryEntry[]>({
    queryKey: ['note-aef-history', noteId],
    queryFn: async () => {
      if (!noteId) return [];
      const { data, error } = await supabase
        .from('notes_aef_history')
        .select(
          `
          *,
          performer:profiles!notes_aef_history_performed_by_fkey(first_name, last_name)
        `
        )
        .eq('note_id', noteId)
        .order('performed_at', { ascending: false });
      if (error) {
        console.error('Error fetching AEF history:', error);
        return [];
      }
      return (data || []) as unknown as NoteAEFHistoryEntry[];
    },
    enabled: !!noteId,
    staleTime: 30_000,
  });

  // 2. Pieces jointes (via note_attachments par note_id)
  const { data: pieces = [], isLoading: loadingPieces } = useQuery<NoteAEFAttachment[]>({
    queryKey: ['note-aef-pieces', noteId],
    queryFn: async () => {
      if (!noteId) return [];

      const { data, error } = await supabase
        .from('note_attachments')
        .select('*')
        .eq('note_id', noteId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching AEF attachments:', error);
        return [];
      }
      return (data || []) as unknown as NoteAEFAttachment[];
    },
    enabled: !!noteId,
    staleTime: 30_000,
  });

  // 3. Note SEF liee
  const { data: linkedNoteSEF = null, isLoading: loadingSEF } = useQuery({
    queryKey: ['linked-note-sef-detail', noteId],
    queryFn: async (): Promise<LinkedNoteSEF | null> => {
      if (!noteId) return null;

      // Recuperer le note_sef_id via la note AEF
      const { data: noteData, error: noteError } = await supabase
        .from('notes_dg')
        .select('note_sef_id')
        .eq('id', noteId)
        .single();

      if (noteError || !noteData?.note_sef_id) return null;

      const { data, error } = await supabase
        .from('notes_sef')
        .select('id, numero, objet, statut, reference_pivot')
        .eq('id', noteData.note_sef_id)
        .single();

      if (error) return null;
      return data as LinkedNoteSEF;
    },
    enabled: !!noteId,
    staleTime: 60_000,
  });

  // 4. Imputation liée (0 ou 1 imputation par AEF)
  const { data: linkedImputation = null, isLoading: loadingImputation } = useQuery({
    queryKey: ['linked-imputation-detail', noteId],
    queryFn: async (): Promise<LinkedImputation | null> => {
      if (!noteId) return null;

      const { data, error } = await supabase
        .from('imputations')
        .select(
          'id, reference, objet, montant, statut, created_at, budget_line:budget_lines(code, label)'
        )
        .eq('note_aef_id', noteId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching linked imputation:', error);
        return null;
      }
      return data as LinkedImputation | null;
    },
    enabled: !!noteId,
    staleTime: 30_000,
  });

  return {
    history,
    pieces,
    linkedNoteSEF,
    linkedImputation,
    isLoading: loadingHistory || loadingPieces || loadingSEF || loadingImputation,
    loadingHistory,
    loadingPieces,
    loadingSEF,
    loadingImputation,
  };
}
