// TODO: Corriger les types Supabase pour les tables manquantes
/**
 * Hook pour la gestion des Notes Direction Générale (Notes DG officielles)
 * DISTINCT de notes_dg (qui stocke les Notes AEF)
 *
 * Ce module gère les notes officielles du DG avec système d'imputation
 * (destinataires et instructions)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useExercice } from '@/contexts/ExerciceContext';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';

// Tables not yet in generated Supabase types - use untyped client as workaround
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabaseUntyped = supabase as any;

// ============================================================================
// Types
// ============================================================================

export type NoteDGStatut = 'brouillon' | 'soumise_dg' | 'dg_valide' | 'dg_rejetee' | 'diffusee';

export type InstructionType = 'ATTRIBUTION' | 'DIFFUSION' | 'SUIVI' | 'ACTION_SUITE' | 'CLASSEMENT';

export type ImputationPriorite = 'normale' | 'urgente' | 'tres_urgente';

export interface NoteDirectionGenerale {
  id: string;
  reference: string | null;
  numero_note: string | null;
  exercice: number;
  date_note: string;
  destinataire: string;
  objet: string;
  direction_id: string | null;
  nom_prenoms: string | null;
  expose: string | null;
  avis: string | null;
  recommandations: string | null;
  document_annexe_files: unknown[];
  nb_pages: number;
  statut: NoteDGStatut;
  signed_by: string | null;
  signed_at: string | null;
  signature_qr_data: string | null;
  motif_rejet: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  pdf_url: string | null;
  pdf_generated_at: string | null;
  pdf_hash: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  direction?: { id: string; label: string; sigle: string | null };
  created_by_profile?: { id: string; first_name: string | null; last_name: string | null };
  signed_by_profile?: { id: string; first_name: string | null; last_name: string | null };
}

export interface NoteDGImputation {
  id: string;
  note_id: string;
  destinataire: string;
  direction_id: string | null;
  instruction_type: InstructionType;
  priorite: ImputationPriorite | null;
  delai: string | null;
  commentaire: string | null;
  accuse_reception: boolean;
  date_accuse: string | null;
  accuse_par: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  direction?: { id: string; label: string; sigle: string | null };
}

export interface CreateNoteDGInput {
  date_note?: string;
  destinataire: string;
  objet: string;
  direction_id?: string | null;
  nom_prenoms?: string | null;
  expose?: string | null;
  avis?: string | null;
  recommandations?: string | null;
  document_annexe_files?: unknown[];
  nb_pages?: number;
}

export interface UpdateNoteDGInput extends Partial<CreateNoteDGInput> {
  id: string;
}

export interface CreateImputationInput {
  note_id: string;
  destinataire: string;
  direction_id?: string | null;
  instruction_type: InstructionType;
  priorite?: ImputationPriorite | null;
  delai?: string | null;
  commentaire?: string | null;
}

// ============================================================================
// Constants
// ============================================================================

export const STATUTS_NOTE_DG: Record<NoteDGStatut, string> = {
  brouillon: 'Brouillon',
  soumise_dg: 'Soumise au DG',
  dg_valide: 'Validée par DG',
  dg_rejetee: 'Rejetée par DG',
  diffusee: 'Diffusée',
};

export const INSTRUCTION_TYPES: Record<InstructionType, string> = {
  ATTRIBUTION: 'Attribution',
  DIFFUSION: 'Diffusion/Information',
  SUIVI: 'Suivi',
  ACTION_SUITE: 'Action/Suite à donner',
  CLASSEMENT: 'Classement/Archives',
};

export const PRIORITES: Record<ImputationPriorite, string> = {
  normale: 'Normale',
  urgente: 'Urgente',
  tres_urgente: 'Très urgente',
};

// Transitions de statut valides
const VALID_TRANSITIONS: Record<NoteDGStatut, NoteDGStatut[]> = {
  brouillon: ['soumise_dg'],
  soumise_dg: ['dg_valide', 'dg_rejetee'],
  dg_valide: ['diffusee'],
  dg_rejetee: ['brouillon'], // Peut revenir en brouillon pour correction
  diffusee: [], // État terminal
};

export function isValidTransition(from: NoteDGStatut, to: NoteDGStatut): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// ============================================================================
// Hook principal
// ============================================================================

export function useNotesDirectionGenerale() {
  const { exercice } = useExercice();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();

  // ──────────────────────────────────────────────────────────────────────────
  // Queries
  // ──────────────────────────────────────────────────────────────────────────

  // Fetch all notes for current exercice
  const {
    data: notes = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['notes-direction-generale', exercice],
    queryFn: async () => {
      let query = supabaseUntyped
        .from('notes_direction_generale')
        .select(
          `
          *,
          direction:directions(id, label, sigle),
          created_by_profile:profiles!notes_direction_generale_created_by_fkey(id, first_name, last_name),
          signed_by_profile:profiles!notes_direction_generale_signed_by_fkey(id, first_name, last_name)
        `
        )
        .order('created_at', { ascending: false });

      if (exercice) {
        query = query.eq('exercice', exercice);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as NoteDirectionGenerale[];
    },
    enabled: !!exercice,
  });

  // Fetch directions
  const { data: directions = [] } = useQuery({
    queryKey: ['directions-for-notes-dg'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('directions')
        .select('id, code, label, sigle')
        .eq('est_active', true)
        .order('label');
      if (error) throw error;
      return data;
    },
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Mutations - Notes
  // ──────────────────────────────────────────────────────────────────────────

  // Create note
  const createMutation = useMutation({
    mutationFn: async (input: CreateNoteDGInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Validation des champs obligatoires
      if (!input.destinataire?.trim()) throw new Error('Le destinataire est obligatoire');
      if (!input.objet?.trim()) throw new Error("L'objet est obligatoire");

      const { data, error } = await supabaseUntyped
        .from('notes_direction_generale')
        .insert([
          {
            date_note: input.date_note || new Date().toISOString().split('T')[0],
            destinataire: input.destinataire,
            objet: input.objet,
            direction_id: input.direction_id || null,
            nom_prenoms: input.nom_prenoms || null,
            expose: input.expose || null,
            avis: input.avis || null,
            recommandations: input.recommandations || null,
            document_annexe_files: input.document_annexe_files || [],
            nb_pages: input.nb_pages || 0,
            exercice: exercice || new Date().getFullYear(),
            created_by: user.id,
            statut: 'brouillon',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      await logAction({
        entityType: 'note_direction_generale',
        entityId: data.id,
        action: 'create',
        newValues: data,
      });

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notes-direction-generale'] });
      toast({ title: `Note DG ${data.reference || 'créée'} avec succès` });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  // Update note
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateNoteDGInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Récupérer les anciennes valeurs pour l'audit
      const { data: oldData, error: fetchError } = await supabaseUntyped
        .from('notes_direction_generale')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw new Error('Note introuvable');

      // Ne peut modifier que si brouillon ou rejetée
      if (!['brouillon', 'dg_rejetee'].includes(oldData.statut)) {
        throw new Error('Cette note ne peut plus être modifiée');
      }

      const { data, error } = await supabaseUntyped
        .from('notes_direction_generale')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await logAction({
        entityType: 'note_direction_generale',
        entityId: id,
        action: 'update',
        oldValues: oldData,
        newValues: data,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes-direction-generale'] });
      toast({ title: 'Note mise à jour' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  // Submit note to DG
  const submitMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data: note, error: fetchError } = await supabaseUntyped
        .from('notes_direction_generale')
        .select('*')
        .eq('id', noteId)
        .single();

      if (fetchError) throw new Error('Note introuvable');

      // Validation de la transition
      if (!isValidTransition(note.statut as NoteDGStatut, 'soumise_dg')) {
        throw new Error(`Transition invalide: ${note.statut} → soumise_dg`);
      }

      // Validation des champs obligatoires
      const errors: string[] = [];
      if (!note.destinataire?.trim()) errors.push('Destinataire');
      if (!note.objet?.trim()) errors.push('Objet');
      if (!note.expose?.trim()) errors.push('Exposé');

      if (errors.length > 0) {
        throw new Error(`Champs obligatoires manquants: ${errors.join(', ')}`);
      }

      const { data, error } = await supabaseUntyped
        .from('notes_direction_generale')
        .update({ statut: 'soumise_dg' })
        .eq('id', noteId)
        .select()
        .single();

      if (error) throw error;

      await logAction({
        entityType: 'note_direction_generale',
        entityId: noteId,
        action: 'submit',
        oldValues: { statut: note.statut },
        newValues: { statut: 'soumise_dg' },
      });

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notes-direction-generale'] });
      toast({ title: `Note ${data.reference} soumise au DG` });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  // Validate note (DG only)
  const validateMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Vérifier le rôle DG/ADMIN
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const hasDGRole = userRoles?.some((r) => r.role === 'Admin' || r.role === 'DG');
      if (!hasDGRole) {
        throw new Error('Seuls les utilisateurs DG ou Admin peuvent valider une note');
      }

      const { data: note, error: fetchError } = await supabaseUntyped
        .from('notes_direction_generale')
        .select('*')
        .eq('id', noteId)
        .single();

      if (fetchError) throw new Error('Note introuvable');

      if (!isValidTransition(note.statut as NoteDGStatut, 'dg_valide')) {
        throw new Error(`Transition invalide: ${note.statut} → dg_valide`);
      }

      const { data, error } = await supabaseUntyped
        .from('notes_direction_generale')
        .update({
          statut: 'dg_valide',
          signed_by: user.id,
          signed_at: new Date().toISOString(),
        })
        .eq('id', noteId)
        .select()
        .single();

      if (error) throw error;

      await logAction({
        entityType: 'note_direction_generale',
        entityId: noteId,
        action: 'validate',
        oldValues: { statut: note.statut },
        newValues: { statut: 'dg_valide', signed_by: user.id },
      });

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notes-direction-generale'] });
      toast({ title: `Note ${data.reference} validée par le DG ✓` });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  // Reject note (DG only)
  const rejectMutation = useMutation({
    mutationFn: async ({ noteId, motif }: { noteId: string; motif: string }) => {
      if (!motif?.trim()) throw new Error('Le motif de rejet est obligatoire');

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Vérifier le rôle DG/ADMIN
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const hasDGRole = userRoles?.some((r) => r.role === 'Admin' || r.role === 'DG');
      if (!hasDGRole) {
        throw new Error('Seuls les utilisateurs DG ou Admin peuvent rejeter une note');
      }

      const { data: note, error: fetchError } = await supabaseUntyped
        .from('notes_direction_generale')
        .select('*')
        .eq('id', noteId)
        .single();

      if (fetchError) throw new Error('Note introuvable');

      if (!isValidTransition(note.statut as NoteDGStatut, 'dg_rejetee')) {
        throw new Error(`Transition invalide: ${note.statut} → dg_rejetee`);
      }

      const { data, error } = await supabaseUntyped
        .from('notes_direction_generale')
        .update({
          statut: 'dg_rejetee',
          motif_rejet: motif,
          rejected_by: user.id,
          rejected_at: new Date().toISOString(),
        })
        .eq('id', noteId)
        .select()
        .single();

      if (error) throw error;

      await logAction({
        entityType: 'note_direction_generale',
        entityId: noteId,
        action: 'reject',
        oldValues: { statut: note.statut },
        newValues: { statut: 'dg_rejetee', motif_rejet: motif },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes-direction-generale'] });
      toast({ title: 'Note rejetée' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  // Diffuse note
  const diffuseMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data: note, error: fetchError } = await supabaseUntyped
        .from('notes_direction_generale')
        .select('*')
        .eq('id', noteId)
        .single();

      if (fetchError) throw new Error('Note introuvable');

      if (!isValidTransition(note.statut as NoteDGStatut, 'diffusee')) {
        throw new Error(`Transition invalide: ${note.statut} → diffusee`);
      }

      // Vérifier qu'il y a au moins une imputation
      const { count } = await supabaseUntyped
        .from('note_dg_imputations')
        .select('*', { count: 'exact', head: true })
        .eq('note_id', noteId);

      if (!count || count === 0) {
        throw new Error('Ajoutez au moins une imputation avant de diffuser');
      }

      const { data, error } = await supabaseUntyped
        .from('notes_direction_generale')
        .update({ statut: 'diffusee' })
        .eq('id', noteId)
        .select()
        .single();

      if (error) throw error;

      await logAction({
        entityType: 'note_direction_generale',
        entityId: noteId,
        action: 'diffuse',
        oldValues: { statut: note.statut },
        newValues: { statut: 'diffusee' },
      });

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notes-direction-generale'] });
      toast({ title: `Note ${data.reference} diffusée aux destinataires` });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  // Revenir en brouillon (après rejet)
  const revertToDraftMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data: note, error: fetchError } = await supabaseUntyped
        .from('notes_direction_generale')
        .select('*')
        .eq('id', noteId)
        .single();

      if (fetchError) throw new Error('Note introuvable');

      if (!isValidTransition(note.statut as NoteDGStatut, 'brouillon')) {
        throw new Error(`Transition invalide: ${note.statut} → brouillon`);
      }

      const { data, error } = await supabaseUntyped
        .from('notes_direction_generale')
        .update({
          statut: 'brouillon',
          motif_rejet: null,
          rejected_by: null,
          rejected_at: null,
        })
        .eq('id', noteId)
        .select()
        .single();

      if (error) throw error;

      await logAction({
        entityType: 'note_direction_generale',
        entityId: noteId,
        action: 'revert_draft',
        oldValues: { statut: note.statut },
        newValues: { statut: 'brouillon' },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes-direction-generale'] });
      toast({ title: 'Note remise en brouillon pour correction' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  // Delete note (brouillon only)
  const deleteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { data: note, error: fetchError } = await supabaseUntyped
        .from('notes_direction_generale')
        .select('statut')
        .eq('id', noteId)
        .single();

      if (fetchError) throw new Error('Note introuvable');

      if (note.statut !== 'brouillon') {
        throw new Error('Seules les notes en brouillon peuvent être supprimées');
      }

      const { error } = await supabaseUntyped
        .from('notes_direction_generale')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      await logAction({
        entityType: 'note_direction_generale',
        entityId: noteId,
        action: 'delete',
        oldValues: { id: noteId },
        newValues: {},
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes-direction-generale'] });
      toast({ title: 'Note supprimée' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Filter notes by status
  // ──────────────────────────────────────────────────────────────────────────

  const notesByStatus = {
    brouillon: notes.filter((n) => n.statut === 'brouillon'),
    soumise_dg: notes.filter((n) => n.statut === 'soumise_dg'),
    dg_valide: notes.filter((n) => n.statut === 'dg_valide'),
    dg_rejetee: notes.filter((n) => n.statut === 'dg_rejetee'),
    diffusee: notes.filter((n) => n.statut === 'diffusee'),
  };

  return {
    // Data
    notes,
    notesByStatus,
    directions,
    isLoading,
    refetch,

    // Mutations
    createNote: createMutation.mutateAsync,
    updateNote: updateMutation.mutateAsync,
    submitNote: submitMutation.mutateAsync,
    validateNote: validateMutation.mutateAsync,
    rejectNote: rejectMutation.mutateAsync,
    diffuseNote: diffuseMutation.mutateAsync,
    revertToDraft: revertToDraftMutation.mutateAsync,
    deleteNote: deleteMutation.mutateAsync,

    // Loading states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isSubmitting: submitMutation.isPending,
    isValidating: validateMutation.isPending,
    isRejecting: rejectMutation.isPending,
    isDiffusing: diffuseMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// ============================================================================
// Hook pour les imputations d'une note spécifique
// ============================================================================

export function useNoteDGImputations(noteId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();

  // Fetch imputations for a note
  const {
    data: imputations = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['note-dg-imputations', noteId],
    queryFn: async () => {
      if (!noteId) return [];

      const { data, error } = await supabaseUntyped
        .from('note_dg_imputations')
        .select(
          `
          *,
          direction:directions(id, label, sigle)
        `
        )
        .eq('note_id', noteId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as NoteDGImputation[];
    },
    enabled: !!noteId,
  });

  // Add imputation
  const addMutation = useMutation({
    mutationFn: async (input: CreateImputationInput) => {
      if (!input.destinataire?.trim()) throw new Error('Le destinataire est obligatoire');
      if (!input.instruction_type) throw new Error("Le type d'instruction est obligatoire");

      const { data, error } = await supabaseUntyped
        .from('note_dg_imputations')
        .insert([
          {
            note_id: input.note_id,
            destinataire: input.destinataire,
            direction_id: input.direction_id || null,
            instruction_type: input.instruction_type,
            priorite: input.priorite || 'normale',
            delai: input.delai || null,
            commentaire: input.commentaire || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      await logAction({
        entityType: 'note_dg_imputation',
        entityId: data.id,
        action: 'create',
        newValues: data,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note-dg-imputations', noteId] });
      toast({ title: 'Imputation ajoutée' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  // Update imputation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<NoteDGImputation> & { id: string }) => {
      const { data: oldData, error: fetchError } = await supabaseUntyped
        .from('note_dg_imputations')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw new Error('Imputation introuvable');

      const { data, error } = await supabaseUntyped
        .from('note_dg_imputations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await logAction({
        entityType: 'note_dg_imputation',
        entityId: id,
        action: 'update',
        oldValues: oldData,
        newValues: data,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note-dg-imputations', noteId] });
      toast({ title: 'Imputation mise à jour' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  // Delete imputation
  const deleteMutation = useMutation({
    mutationFn: async (imputationId: string) => {
      const { error } = await supabaseUntyped
        .from('note_dg_imputations')
        .delete()
        .eq('id', imputationId);

      if (error) throw error;

      await logAction({
        entityType: 'note_dg_imputation',
        entityId: imputationId,
        action: 'delete',
        oldValues: { id: imputationId },
        newValues: {},
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note-dg-imputations', noteId] });
      toast({ title: 'Imputation supprimée' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  // Acknowledge receipt
  const acknowledgeMutation = useMutation({
    mutationFn: async (imputationId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabaseUntyped
        .from('note_dg_imputations')
        .update({
          accuse_reception: true,
          date_accuse: new Date().toISOString(),
          accuse_par: user.id,
        })
        .eq('id', imputationId)
        .select()
        .single();

      if (error) throw error;

      await logAction({
        entityType: 'note_dg_imputation',
        entityId: imputationId,
        action: 'acknowledge',
        newValues: { accuse_reception: true, accuse_par: user.id },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note-dg-imputations', noteId] });
      toast({ title: 'Accusé de réception enregistré' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  return {
    imputations,
    isLoading,
    refetch,
    addImputation: addMutation.mutateAsync,
    updateImputation: updateMutation.mutateAsync,
    deleteImputation: deleteMutation.mutateAsync,
    acknowledgeReceipt: acknowledgeMutation.mutateAsync,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// ============================================================================
// Hook pour récupérer une note par ID
// ============================================================================

export function useNoteDGById(noteId: string | null) {
  return useQuery({
    queryKey: ['note-direction-generale', noteId],
    queryFn: async () => {
      if (!noteId) return null;

      const { data, error } = await supabaseUntyped
        .from('notes_direction_generale')
        .select(
          `
          *,
          direction:directions(id, label, sigle),
          created_by_profile:profiles!notes_direction_generale_created_by_fkey(id, first_name, last_name),
          signed_by_profile:profiles!notes_direction_generale_signed_by_fkey(id, first_name, last_name)
        `
        )
        .eq('id', noteId)
        .single();

      if (error) throw error;
      return data as unknown as NoteDirectionGenerale;
    },
    enabled: !!noteId,
  });
}

export default useNotesDirectionGenerale;
