/**
 * Hook pour gérer les notes internes par direction
 * Permet CRUD + import Word (.docx) → HTML
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ============================================
// TYPES
// ============================================

export type TypeNote = 'interne' | 'compte_rendu' | 'rapport' | 'memo' | 'autre';
export type StatutNote = 'brouillon' | 'publie' | 'archive';
export type PrioriteNote = 'normale' | 'haute' | 'urgente';

export interface NoteDirection {
  id: string;
  direction_id: string;
  exercice_id: string | null;
  titre: string;
  contenu: string | null;
  contenu_brut: string | null;
  type_note: TypeNote;
  statut: StatutNote;
  tags: string[] | null;
  fichier_original_url: string | null;
  fichier_original_nom: string | null;
  priorite: PrioriteNote;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  // Canvas fields
  reference: string | null;
  destinataire: string | null;
  expediteur: string | null;
  objet: string | null;
  date_note: string | null;
  template_id: string | null;
  metadata: Record<string, unknown> | null;
  objectifs_strategiques: string | null;
  action_rattachement: string | null;
  budget_previsionnel: string | null;
  observations_dg: string | null;
  decision_dg: string | null;
  date_decision: string | null;
  signataire_nom: string | null;
  signataire_titre: string | null;
  // Relations
  direction?: { code: string; label: string; sigle: string } | null;
  creator?: { full_name: string; email: string } | null;
}

export interface CreateNoteInput {
  direction_id: string;
  exercice_id?: string;
  titre: string;
  contenu?: string;
  contenu_brut?: string;
  type_note?: TypeNote;
  statut?: StatutNote;
  tags?: string[];
  fichier_original_url?: string;
  fichier_original_nom?: string;
  priorite?: PrioriteNote;
  // Canvas fields (all optional for backward compatibility)
  reference?: string;
  destinataire?: string;
  expediteur?: string;
  objet?: string;
  date_note?: string;
  template_id?: string;
  metadata?: Record<string, unknown>;
  objectifs_strategiques?: string;
  action_rattachement?: string;
  budget_previsionnel?: string;
  observations_dg?: string;
  decision_dg?: string;
  date_decision?: string;
  signataire_nom?: string;
  signataire_titre?: string;
}

export interface UpdateNoteInput {
  id: string;
  titre?: string;
  contenu?: string;
  contenu_brut?: string;
  type_note?: TypeNote;
  statut?: StatutNote;
  tags?: string[];
  priorite?: PrioriteNote;
  // Canvas fields
  reference?: string;
  destinataire?: string;
  expediteur?: string;
  objet?: string;
  date_note?: string;
  template_id?: string;
  metadata?: Record<string, unknown>;
  objectifs_strategiques?: string;
  action_rattachement?: string;
  budget_previsionnel?: string;
  observations_dg?: string;
  decision_dg?: string;
  date_decision?: string;
  signataire_nom?: string;
  signataire_titre?: string;
}

export interface NotesDirectionFilters {
  directionId?: string;
  exerciceId?: string;
  typeNote?: TypeNote;
  statut?: StatutNote;
  search?: string;
}

// ============================================
// HOOK PRINCIPAL - LISTE DES NOTES
// ============================================

export function useNotesDirection(filters: NotesDirectionFilters) {
  return useQuery({
    queryKey: ['notes-direction', filters],
    queryFn: async () => {
      let query = supabase
        .from('notes_direction')
        .select(
          `
          *,
          direction:directions!notes_direction_direction_id_fkey(code, label, sigle),
          creator:profiles!notes_direction_created_by_profile_fkey(full_name, email)
        `
        )
        .order('created_at', { ascending: false });

      if (filters.directionId) {
        query = query.eq('direction_id', filters.directionId);
      }
      if (filters.exerciceId) {
        query = query.eq('exercice_id', filters.exerciceId);
      }
      if (filters.typeNote) {
        query = query.eq('type_note', filters.typeNote);
      }
      if (filters.statut) {
        query = query.eq('statut', filters.statut);
      }
      if (filters.search) {
        query = query.or(`titre.ilike.%${filters.search}%,contenu_brut.ilike.%${filters.search}%`);
      }

      // Ne pas afficher les notes archivées par défaut
      if (!filters.statut) {
        query = query.neq('statut', 'archive');
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return (data || []) as unknown as NoteDirection[];
    },
    enabled: !!filters.directionId,
  });
}

// ============================================
// MUTATION - CRÉER UNE NOTE
// ============================================

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateNoteInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('notes_direction')
        .insert({
          ...input,
          created_by: user.id,
          updated_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes-direction'] });
      toast.success('Note créée avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la création: ${error.message}`);
    },
  });
}

// ============================================
// MUTATION - MODIFIER UNE NOTE
// ============================================

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateNoteInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from('notes_direction')
        .update({
          ...updates,
          updated_by: user.id,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes-direction'] });
      toast.success('Note mise à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
    },
  });
}

// ============================================
// MUTATION - ARCHIVER UNE NOTE
// ============================================

export function useArchiveNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('notes_direction')
        .update({ statut: 'archive', updated_by: user.id })
        .eq('id', noteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes-direction'] });
      toast.success('Note archivée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// ============================================
// MUTATION - IMPORTER DEPUIS WORD (.docx)
// ============================================

export function useImportWordNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      directionId,
      exerciceId,
    }: {
      file: File;
      directionId: string;
      exerciceId?: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // 1. Parser le fichier Word avec mammoth
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const html = result.value;
      const plainText = html
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // 2. Uploader le fichier original dans Supabase Storage
      const fileName = `notes-direction/${directionId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('sygfp-attachments')
        .upload(fileName, file);

      let fileUrl: string | null = null;
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('sygfp-attachments').getPublicUrl(fileName);
        fileUrl = urlData.publicUrl;
      }

      // 3. Extraire le titre (premier h1/h2 ou nom du fichier)
      const titleMatch = html.match(/<h[12][^>]*>(.*?)<\/h[12]>/i);
      const titre = titleMatch
        ? titleMatch[1].replace(/<[^>]*>/g, '').trim()
        : file.name.replace(/\.docx?$/i, '');

      // 4. Créer la note en base
      const { data, error } = await supabase
        .from('notes_direction')
        .insert({
          direction_id: directionId,
          exercice_id: exerciceId || null,
          titre,
          contenu: html,
          contenu_brut: plainText.substring(0, 10000),
          type_note: 'rapport' as TypeNote,
          statut: 'brouillon' as StatutNote,
          priorite: 'normale' as PrioriteNote,
          fichier_original_url: fileUrl,
          fichier_original_nom: file.name,
          created_by: user.id,
          updated_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        note: data,
        warnings: result.messages.map((m) => m.message),
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['notes-direction'] });
      const warningCount = result.warnings.length;
      if (warningCount > 0) {
        toast.success(`Note importée avec ${warningCount} avertissement(s)`);
      } else {
        toast.success('Document Word importé avec succès');
      }
    },
    onError: (error: Error) => {
      toast.error(`Erreur d'import: ${error.message}`);
    },
  });
}

// ============================================
// HOOK - STATISTIQUES PAR DIRECTION
// ============================================

export function useNotesDirectionStats(directionId: string | undefined) {
  return useQuery({
    queryKey: ['notes-direction-stats', directionId],
    queryFn: async () => {
      if (!directionId) return null;

      const { data, error } = await supabase
        .from('notes_direction')
        .select('statut, type_note')
        .eq('direction_id', directionId)
        .neq('statut', 'archive');

      if (error) throw error;

      const notes = data || [];
      return {
        total: notes.length,
        brouillons: notes.filter((n) => n.statut === 'brouillon').length,
        publies: notes.filter((n) => n.statut === 'publie').length,
        parType: {
          interne: notes.filter((n) => n.type_note === 'interne').length,
          compte_rendu: notes.filter((n) => n.type_note === 'compte_rendu').length,
          rapport: notes.filter((n) => n.type_note === 'rapport').length,
          memo: notes.filter((n) => n.type_note === 'memo').length,
          autre: notes.filter((n) => n.type_note === 'autre').length,
        },
      };
    },
    enabled: !!directionId,
  });
}
