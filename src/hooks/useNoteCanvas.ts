/**
 * Hook principal pour le canvas de notes direction
 * Gere le chargement, la sauvegarde auto (debounce 2s), et le dirty state
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { NoteDirection, CreateNoteInput, UpdateNoteInput } from './useNotesDirection';

// ============================================
// TYPES
// ============================================

export interface NoteCanvasMetadata {
  reference: string;
  destinataire: string;
  expediteur: string;
  objet: string;
  dateNote: string;
  objectifsStrategiques: string;
  actionRattachement: string;
  budgetPrevisionnel: string;
  observationsDg: string;
  decisionDg: string;
  dateDecision: string;
  signataireNom: string;
  signataireTitre: string;
}

const EMPTY_METADATA: NoteCanvasMetadata = {
  reference: '',
  destinataire: '',
  expediteur: '',
  objet: '',
  dateNote: new Date().toISOString().split('T')[0],
  objectifsStrategiques: '',
  actionRattachement: '',
  budgetPrevisionnel: '',
  observationsDg: '',
  decisionDg: '',
  dateDecision: '',
  signataireNom: '',
  signataireTitre: '',
};

export interface UseNoteCanvasReturn {
  note: NoteDirection | null;
  isLoading: boolean;
  isSaving: boolean;
  isDirty: boolean;
  lastSaved: Date | null;
  editorContent: string;
  setEditorContent: (html: string) => void;
  metadata: NoteCanvasMetadata;
  updateMetadata: (partial: Partial<NoteCanvasMetadata>) => void;
  save: () => Promise<void>;
  publish: () => Promise<void>;
}

// ============================================
// HELPERS
// ============================================

function noteToMetadata(note: NoteDirection): NoteCanvasMetadata {
  return {
    reference: note.reference || '',
    destinataire: note.destinataire || '',
    expediteur: note.expediteur || '',
    objet: note.objet || '',
    dateNote: note.date_note || new Date().toISOString().split('T')[0],
    objectifsStrategiques: note.objectifs_strategiques || '',
    actionRattachement: note.action_rattachement || '',
    budgetPrevisionnel: note.budget_previsionnel || '',
    observationsDg: note.observations_dg || '',
    decisionDg: note.decision_dg || '',
    dateDecision: note.date_decision || '',
    signataireNom: note.signataire_nom || '',
    signataireTitre: note.signataire_titre || '',
  };
}

function metadataToDbFields(metadata: NoteCanvasMetadata): Partial<UpdateNoteInput> {
  return {
    reference: metadata.reference || undefined,
    destinataire: metadata.destinataire || undefined,
    expediteur: metadata.expediteur || undefined,
    objet: metadata.objet || undefined,
    date_note: metadata.dateNote || undefined,
    objectifs_strategiques: metadata.objectifsStrategiques || undefined,
    action_rattachement: metadata.actionRattachement || undefined,
    budget_previsionnel: metadata.budgetPrevisionnel || undefined,
    observations_dg: metadata.observationsDg || undefined,
    decision_dg: metadata.decisionDg || undefined,
    date_decision: metadata.dateDecision || undefined,
    signataire_nom: metadata.signataireNom || undefined,
    signataire_titre: metadata.signataireTitre || undefined,
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useNoteCanvas(noteId: string | null, directionId: string): UseNoteCanvasReturn {
  const queryClient = useQueryClient();
  const [editorContent, setEditorContentState] = useState('');
  const [metadata, setMetadata] = useState<NoteCanvasMetadata>(EMPTY_METADATA);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [createdNoteId, setCreatedNoteId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitializedRef = useRef(false);

  const effectiveNoteId = noteId || createdNoteId;

  // Load existing note
  const { data: note, isLoading } = useQuery({
    queryKey: ['note-canvas', effectiveNoteId],
    queryFn: async () => {
      if (!effectiveNoteId) return null;

      const { data, error } = await supabase
        .from('notes_direction')
        .select(
          `*,
          direction:directions!notes_direction_direction_id_fkey(code, label, sigle),
          creator:profiles!notes_direction_created_by_profile_fkey(full_name, email)`
        )
        .eq('id', effectiveNoteId)
        .single();

      if (error) throw error;
      return data as NoteDirection;
    },
    enabled: !!effectiveNoteId,
  });

  // Initialize editor content and metadata from loaded note
  useEffect(() => {
    if (note && !isInitializedRef.current) {
      setEditorContentState(note.contenu || '');
      setMetadata(noteToMetadata(note));
      isInitializedRef.current = true;
    }
  }, [note]);

  // Reset initialization when noteId changes
  useEffect(() => {
    isInitializedRef.current = false;
  }, [noteId]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (input: CreateNoteInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifie');

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
      return data as NoteDirection;
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (input: UpdateNoteInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifie');

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
      return data as NoteDirection;
    },
  });

  // Set editor content with dirty tracking
  const setEditorContent = useCallback(
    (html: string) => {
      setEditorContentState(html);
      setIsDirty(true);

      // Debounce auto-save (2 seconds)
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        void performSave(html, metadata);
      }, 2000);
    },
    [metadata] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Update metadata with dirty tracking
  const updateMetadata = useCallback(
    (partial: Partial<NoteCanvasMetadata>) => {
      setMetadata((prev) => {
        const updated = { ...prev, ...partial };

        // Debounce auto-save
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => {
          void performSave(editorContent, updated);
        }, 2000);

        setIsDirty(true);
        return updated;
      });
    },
    [editorContent] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Core save function
  const performSave = useCallback(
    async (content: string, meta: NoteCanvasMetadata) => {
      setIsSaving(true);
      try {
        const contenuBrut = stripHtml(content).substring(0, 10000);
        const dbFields = metadataToDbFields(meta);

        if (effectiveNoteId) {
          // Update existing note
          await updateMutation.mutateAsync({
            id: effectiveNoteId,
            titre: meta.objet || 'Note sans titre',
            contenu: content,
            contenu_brut: contenuBrut,
            ...dbFields,
          });
        } else {
          // Create new note
          const newNote = await createMutation.mutateAsync({
            direction_id: directionId,
            titre: meta.objet || 'Note sans titre',
            contenu: content,
            contenu_brut: contenuBrut,
            type_note: 'interne',
            statut: 'brouillon',
            priorite: 'normale',
            template_id: 'note_descriptive',
            ...dbFields,
          });
          setCreatedNoteId(newNote.id);
        }

        setIsDirty(false);
        setLastSaved(new Date());
        queryClient.invalidateQueries({ queryKey: ['notes-direction'] });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue';
        toast.error(`Erreur de sauvegarde: ${message}`);
      } finally {
        setIsSaving(false);
      }
    },
    [effectiveNoteId, directionId, createMutation, updateMutation, queryClient]
  );

  // Manual save
  const save = useCallback(async () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    await performSave(editorContent, metadata);
  }, [editorContent, metadata, performSave]);

  // Publish (save + change status to publie)
  const publish = useCallback(async () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    setIsSaving(true);
    try {
      const contenuBrut = stripHtml(editorContent).substring(0, 10000);
      const dbFields = metadataToDbFields(metadata);

      if (effectiveNoteId) {
        await updateMutation.mutateAsync({
          id: effectiveNoteId,
          titre: metadata.objet || 'Note sans titre',
          contenu: editorContent,
          contenu_brut: contenuBrut,
          statut: 'publie',
          ...dbFields,
        });
      } else {
        const newNote = await createMutation.mutateAsync({
          direction_id: directionId,
          titre: metadata.objet || 'Note sans titre',
          contenu: editorContent,
          contenu_brut: contenuBrut,
          type_note: 'interne',
          statut: 'publie',
          priorite: 'normale',
          template_id: 'note_descriptive',
          ...dbFields,
        });
        setCreatedNoteId(newNote.id);
      }

      setIsDirty(false);
      setLastSaved(new Date());
      queryClient.invalidateQueries({ queryKey: ['notes-direction'] });
      toast.success('Note publiee avec succes');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur de publication: ${message}`);
    } finally {
      setIsSaving(false);
    }
  }, [
    editorContent,
    metadata,
    effectiveNoteId,
    directionId,
    createMutation,
    updateMutation,
    queryClient,
  ]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Warn about unsaved changes on navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return {
    note: note || null,
    isLoading,
    isSaving,
    isDirty,
    lastSaved,
    editorContent,
    setEditorContent,
    metadata,
    updateMetadata,
    save,
    publish,
  };
}
