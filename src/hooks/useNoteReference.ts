/**
 * Hook pour generer automatiquement la reference des notes direction
 * Format: ND/ARTI/{DIR_CODE}/{ANNEE}/{SEQUENCE}
 * Ex: ND/ARTI/DSI/2026/001
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useNoteReference(directionId: string | undefined) {
  return useQuery({
    queryKey: ['note-reference', directionId],
    queryFn: async (): Promise<string> => {
      if (!directionId) return '';

      // Get direction code
      const { data: direction, error: dirError } = await supabase
        .from('directions')
        .select('code, sigle')
        .eq('id', directionId)
        .single();

      if (dirError || !direction) {
        return '';
      }

      const dirCode = direction.sigle || direction.code;
      const year = new Date().getFullYear();

      // Count existing notes for this direction in the current year
      const { count, error: countError } = await supabase
        .from('notes_direction')
        .select('id', { count: 'exact', head: true })
        .eq('direction_id', directionId)
        .gte('created_at', `${year}-01-01T00:00:00`)
        .lt('created_at', `${year + 1}-01-01T00:00:00`);

      if (countError) {
        return '';
      }

      const sequence = ((count || 0) + 1).toString().padStart(3, '0');
      return `ND/ARTI/${dirCode}/${year}/${sequence}`;
    },
    enabled: !!directionId,
    staleTime: 30000, // Cache for 30 seconds to avoid stale sequence numbers
  });
}
