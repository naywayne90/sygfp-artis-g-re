/**
 * Hook pour exporter une Note SEF en PDF format officiel ARTI (PROMPT 30)
 *
 * Charge les données complètes (note + imputation + validation + PJ)
 * et génère le PDF au format "ARTI_NOTE_DG_SYGFP".
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NoteSEF } from '@/hooks/useNotesSEF';
import { NoteImputation, NoteImputationLigne } from '@/hooks/useNoteImputations';
import { ValidationDG } from '@/hooks/useValidationDG';
import { downloadNoteSEFPdf, generateNoteSEFPdf } from '@/services/noteSEFPdfService';
import { toast } from 'sonner';

interface ExportState {
  isExporting: boolean;
  progress: string;
  error: string | null;
}

interface UseExportNoteSEFPdfResult {
  exportPdf: (noteId: string, options?: { download?: boolean }) => Promise<Blob | null>;
  isExporting: boolean;
  progress: string;
  error: string | null;
}

/**
 * Hook pour exporter une Note SEF en PDF
 */
export function useExportNoteSEFPdf(): UseExportNoteSEFPdfResult {
  const [state, setState] = useState<ExportState>({
    isExporting: false,
    progress: '',
    error: null,
  });

  const setProgress = (progress: string) => {
    setState((prev) => ({ ...prev, progress }));
  };

  /**
   * Charge les données complètes d'une note SEF
   */
  const loadNoteData = useCallback(async (noteId: string) => {
    setProgress('Chargement de la note...');

    // 1. Charger la note
    const { data: note, error: noteError } = await supabase
      .from('notes_sef')
      .select(
        `
        *,
        direction:directions(id, sigle, label),
        demandeur:profiles!notes_sef_demandeur_id_fkey(id, first_name, last_name, full_name),
        beneficiaire:prestataires(id, nom, raison_sociale)
      `
      )
      .eq('id', noteId)
      .single();

    if (noteError) throw new Error(`Erreur chargement note: ${noteError.message}`);
    if (!note) throw new Error('Note non trouvée');

    setProgress('Chargement des imputations...');

    // 2. Charger l'imputation
    const { data: imputation } = await supabase
      .from('note_imputations')
      .select(
        `
        *,
        impute_par:profiles!note_imputations_impute_par_user_id_fkey(
          id,
          first_name,
          last_name
        )
      `
      )
      .eq('note_sef_id', noteId)
      .maybeSingle();

    let imputationWithLignes: NoteImputation | null = null;
    if (imputation) {
      // Charger les lignes d'imputation
      const { data: lignes } = await supabase
        .from('note_imputation_lignes')
        .select(
          `
          *,
          direction:directions(id, sigle, label)
        `
        )
        .eq('imputation_id', imputation.id)
        .order('ordre', { ascending: true });

      imputationWithLignes = {
        ...imputation,
        lignes: (lignes || []) as NoteImputationLigne[],
      } as NoteImputation;
    }

    setProgress('Chargement de la validation...');

    // 3. Charger la validation DG
    const { data: validation } = await supabase
      .from('validation_dg')
      .select(
        `
        *,
        validated_by:profiles!validation_dg_validated_by_user_id_fkey(
          id,
          first_name,
          last_name,
          full_name
        )
      `
      )
      .eq('note_id', noteId)
      .eq('note_type', 'SEF')
      .maybeSingle();

    setProgress('Comptage des pièces jointes...');

    // 4. Compter les pièces jointes
    const { count: attachmentsCount } = await supabase
      .from('notes_sef_attachments')
      .select('*', { count: 'exact', head: true })
      .eq('note_id', noteId);

    return {
      note: note as NoteSEF,
      imputation: imputationWithLignes,
      validation: validation as ValidationDG | null,
      attachmentsCount: attachmentsCount || 0,
    };
  }, []);

  /**
   * Exporte une note SEF en PDF
   */
  const exportPdf = useCallback(
    async (
      noteId: string,
      options: { download?: boolean } = { download: true }
    ): Promise<Blob | null> => {
      setState({
        isExporting: true,
        progress: 'Préparation...',
        error: null,
      });

      try {
        // Charger les données
        const { note, imputation, validation, attachmentsCount } = await loadNoteData(noteId);

        setProgress('Génération du PDF...');

        if (options.download) {
          // Télécharger directement
          await downloadNoteSEFPdf({
            note,
            imputation,
            validation,
            attachmentsCount,
          });

          toast.success('PDF exporté avec succès');
          return null;
        } else {
          // Retourner le blob
          const { blob } = await generateNoteSEFPdf({
            note,
            imputation,
            validation,
            attachmentsCount,
          });

          return blob;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur lors de l'export";
        setState((prev) => ({ ...prev, error: message }));
        toast.error(message);
        return null;
      } finally {
        setState((prev) => ({
          ...prev,
          isExporting: false,
          progress: '',
        }));
      }
    },
    [loadNoteData]
  );

  return {
    exportPdf,
    isExporting: state.isExporting,
    progress: state.progress,
    error: state.error,
  };
}

/**
 * Bouton d'export réutilisable (composant helper)
 */
export { useExportNoteSEFPdf as default };
