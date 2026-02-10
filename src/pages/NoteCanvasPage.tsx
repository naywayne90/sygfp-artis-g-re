/**
 * NoteCanvasPage - Page route /espace-direction/notes/:id/canvas
 * Charge la note et passe tout au composant NoteCanvas
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useRBAC } from '@/contexts/RBACContext';
import { useExercice } from '@/contexts/ExerciceContext';
import { NoteCanvas } from '@/components/canvas/NoteCanvas';
import type { NoteCanvasMetadata } from '@/components/canvas/NoteCanvasSidebar';
import type { NoteDirection, TypeNote, StatutNote, PrioriteNote } from '@/hooks/useNotesDirection';
import { Skeleton } from '@/components/ui/skeleton';

// ============================================
// DEFAULT METADATA
// ============================================

function createDefaultMetadata(): NoteCanvasMetadata {
  return {
    reference: '',
    destinataire: '',
    expediteur: '',
    dateNote: new Date().toISOString().split('T')[0],
    objet: '',
    typeNote: 'interne' as TypeNote,
    priorite: 'normale' as PrioriteNote,
    statut: 'brouillon' as StatutNote,
    tags: [],
    objectifStrategique: '',
    action: '',
    budgetPrevisionnel: '',
  };
}

function noteToMetadata(note: NoteDirection): NoteCanvasMetadata {
  // Parse metadata from the note's metadata JSONB field if present
  const meta = note.metadata as Record<string, unknown> | null;
  return {
    reference: note.reference || '',
    destinataire: note.destinataire || '',
    expediteur: note.expediteur || '',
    dateNote: note.date_note || new Date().toISOString().split('T')[0],
    objet: note.objet || note.titre || '',
    typeNote: note.type_note,
    priorite: note.priorite,
    statut: note.statut,
    tags: note.tags || [],
    objectifStrategique: (meta?.objectif_strategique as string) || '',
    action: (meta?.action as string) || '',
    budgetPrevisionnel: (meta?.budget_previsionnel as string) || '',
  };
}

// ============================================
// PAGE COMPONENT
// ============================================

export default function NoteCanvasPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useRBAC();
  const { exerciceId } = useExercice();
  const queryClient = useQueryClient();

  const isNew = id === 'new';
  const isReadOnly = searchParams.get('mode') === 'view';

  const [metadata, setMetadata] = useState<NoteCanvasMetadata>(createDefaultMetadata);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [noteId, setNoteId] = useState<string | null>(isNew ? null : id || null);
  const metadataInitialized = useRef(false);

  // Direction de l'utilisateur
  const directionId = user?.directionId || '';

  // Charger la direction
  const { data: directions } = useQuery({
    queryKey: ['directions-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('directions')
        .select('id, code, label, sigle')
        .order('code');
      if (error) throw error;
      return data || [];
    },
  });

  const currentDirection = directions?.find((d) => d.id === directionId);
  const directionLabel = currentDirection
    ? `${currentDirection.sigle} - ${currentDirection.label}`
    : '';

  // Charger la note si edition
  const { data: note, isLoading } = useQuery({
    queryKey: ['note-direction', noteId],
    queryFn: async () => {
      if (!noteId) return null;
      const { data, error } = await supabase
        .from('notes_direction')
        .select(
          `*,
          direction:directions!notes_direction_direction_id_fkey(code, label, sigle),
          creator:profiles!notes_direction_created_by_profile_fkey(full_name, email)`
        )
        .eq('id', noteId)
        .single();
      if (error) throw error;
      return data as unknown as NoteDirection;
    },
    enabled: !!noteId,
  });

  // Initialiser les metadonnees a partir de la note chargee
  useEffect(() => {
    if (note && !metadataInitialized.current) {
      setMetadata(noteToMetadata(note));
      metadataInitialized.current = true;
    }
  }, [note]);

  // Track dirty state
  const handleMetadataChange = useCallback((partial: Partial<NoteCanvasMetadata>) => {
    setMetadata((prev) => ({ ...prev, ...partial }));
    setIsDirty(true);
  }, []);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // Save handler
  const handleSave = useCallback(
    async (content: string, meta: NoteCanvasMetadata) => {
      setIsSaving(true);
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (!authUser) throw new Error('Non authentifie');

        const plainText = content
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        const noteData: Record<string, unknown> = {
          titre: meta.objet || 'Note sans titre',
          contenu: content,
          contenu_brut: plainText.substring(0, 10000),
          type_note: meta.typeNote,
          priorite: meta.priorite,
          statut: meta.statut,
          tags: meta.tags.length > 0 ? meta.tags : null,
          updated_by: authUser.id,
          // Extended canvas fields (added by migration)
          reference: meta.reference || null,
          destinataire: meta.destinataire || null,
          expediteur: meta.expediteur || null,
          objet: meta.objet || null,
          date_note: meta.dateNote || null,
          metadata: {
            objectif_strategique: meta.objectifStrategique || null,
            action: meta.action || null,
            budget_previsionnel: meta.budgetPrevisionnel || null,
          },
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const untypedClient = supabase as any;

        if (noteId) {
          // Update existing note
          const { error } = await untypedClient
            .from('notes_direction')
            .update(noteData)
            .eq('id', noteId);
          if (error) throw error;
        } else {
          // Create new note - ensure titre is present for the insert
          const insertData = {
            ...noteData,
            titre: (noteData.titre as string) || 'Note sans titre',
            direction_id: directionId,
            exercice_id: exerciceId || null,
            created_by: authUser.id,
          };
          const { data, error } = await untypedClient
            .from('notes_direction')
            .insert(insertData)
            .select('id')
            .single();
          if (error) throw error;
          setNoteId(data.id);
          // Update URL without reloading
          window.history.replaceState(null, '', `/espace-direction/notes/${data.id}/canvas`);
        }

        setIsDirty(false);
        setLastSaved(new Date());
        queryClient.invalidateQueries({ queryKey: ['notes-direction'] });
        toast.success('Note sauvegardee');
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Erreur inconnue';
        toast.error(`Erreur de sauvegarde: ${msg}`);
      } finally {
        setIsSaving(false);
      }
    },
    [noteId, directionId, exerciceId, queryClient]
  );

  // Publish handler
  const handlePublish = useCallback(
    async (content: string, meta: NoteCanvasMetadata) => {
      const publishMeta = { ...meta, statut: 'publie' as StatutNote };
      setMetadata(publishMeta);
      await handleSave(content, publishMeta);
      toast.success('Note publiee avec succes');
    },
    [handleSave]
  );

  if (!isNew && isLoading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="space-y-4 w-96">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <NoteCanvas
      note={note}
      directionLabel={directionLabel}
      initialContent={note?.contenu || ''}
      metadata={metadata}
      onMetadataChange={handleMetadataChange}
      onSave={handleSave}
      onPublish={handlePublish}
      isSaving={isSaving}
      isDirty={isDirty}
      lastSaved={lastSaved}
      readOnly={isReadOnly}
      authorName={note?.creator?.full_name || user?.fullName || ''}
    />
  );
}
