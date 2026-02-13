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
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  created_at: string;
  etape: string | null;
  uploader?: { first_name: string | null; last_name: string | null } | null;
}

interface LinkedNoteSEF {
  id: string;
  numero: string;
  objet: string;
  statut: string | null;
  reference_pivot: string | null;
}

// ============================================
// HOOK
// ============================================

export function useNoteAEFDetail(noteId: string | null, referencePivot?: string | null) {
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

  // 2. Pieces jointes (via attachments generiques par dossier_ref)
  const { data: pieces = [], isLoading: loadingPieces } = useQuery<NoteAEFAttachment[]>({
    queryKey: ['note-aef-pieces', noteId, referencePivot],
    queryFn: async () => {
      if (!noteId) return [];

      // Strategie 1: via attachments par reference_pivot
      if (referencePivot) {
        const { data, error } = await supabase
          .from('attachments')
          .select(
            `
            *,
            uploader:profiles!attachments_uploaded_by_fkey(first_name, last_name)
          `
          )
          .eq('dossier_ref', referencePivot)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return (data || []) as unknown as NoteAEFAttachment[];
        }
      }

      // Strategie 2: via entity_id
      const { data: data2, error: error2 } = await supabase
        .from('attachments')
        .select(
          `
          *,
          uploader:profiles!attachments_uploaded_by_fkey(first_name, last_name)
        `
        )
        .eq('entity_id', noteId)
        .order('created_at', { ascending: false });

      if (error2) {
        console.error('Error fetching AEF attachments:', error2);
        return [];
      }
      return (data2 || []) as unknown as NoteAEFAttachment[];
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

  return {
    history,
    pieces,
    linkedNoteSEF,
    isLoading: loadingHistory || loadingPieces || loadingSEF,
    loadingHistory,
    loadingPieces,
    loadingSEF,
  };
}
