/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { NoteSEFHistory } from '@/hooks/useNotesSEF';

export interface Attachment {
  id: string;
  note_id: string;
  nom: string;
  fichier_url: string;
  type_fichier: string | null;
  taille: number | null;
  uploaded_by: string | null;
  uploaded_at: string;
}

interface LinkedNoteAEF {
  id: string;
  numero: string;
  objet: string;
  statut: string | null;
}

export function useNoteSEFDetail(noteId: string | null) {
  // 1. Pièces jointes
  const { data: pieces = [], isLoading: loadingPieces } = useQuery({
    queryKey: ['note-sef-pieces', noteId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('notes_sef_pieces')
        .select('*')
        .eq('note_id', noteId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Attachment[];
    },
    enabled: !!noteId,
    staleTime: 30_000,
  });

  // 2. Historique
  const { data: history = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['note-sef-history', noteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes_sef_history')
        .select(
          `
          *,
          performer:profiles!notes_sef_history_performed_by_fkey(first_name, last_name)
        `
        )
        .eq('note_id', noteId!)
        .order('performed_at', { ascending: false });
      if (error) throw error;
      return (data || []) as NoteSEFHistory[];
    },
    enabled: !!noteId,
    staleTime: 30_000,
  });

  // 3. Note AEF liée (via notes_dg.note_sef_id ou notes_sef.note_aef_id)
  const { data: linkedNoteAEF = null, isLoading: loadingAEF } = useQuery({
    queryKey: ['linked-note-aef', noteId],
    queryFn: async (): Promise<LinkedNoteAEF | null> => {
      // Stratégie 1: Chercher dans notes_dg via note_sef_id
      const { data: dgData, error: dgError } = await (supabase as any)
        .from('notes_dg')
        .select('id, numero, objet, statut')
        .eq('note_sef_id', noteId!)
        .limit(1)
        .maybeSingle();

      if (!dgError && dgData) {
        return dgData as LinkedNoteAEF;
      }

      // Stratégie 2: Chercher via note_aef_id dans notes_sef
      const { data: sefData, error: sefError } = await (supabase as any)
        .from('notes_sef')
        .select('note_aef_id')
        .eq('id', noteId!)
        .single();

      if (sefError || !sefData?.note_aef_id) return null;

      const { data: aefData, error: aefError } = await (supabase as any)
        .from('notes_dg')
        .select('id, numero, objet, statut')
        .eq('id', sefData.note_aef_id)
        .single();

      if (aefError || !aefData) return null;
      return aefData as LinkedNoteAEF;
    },
    enabled: !!noteId,
    staleTime: 60_000,
  });

  return {
    pieces,
    history,
    linkedNoteAEF,
    isLoading: loadingPieces || loadingHistory || loadingAEF,
    loadingPieces,
    loadingHistory,
    loadingAEF,
  };
}
