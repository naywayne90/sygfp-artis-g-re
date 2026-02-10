/**
 * Hook pour la génération et le téléchargement de PDF des Notes DG
 */

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Table not yet in generated Supabase types - use untyped client as workaround
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabaseUntyped = supabase as any;
import { useAuditLog } from '@/hooks/useAuditLog';
import { downloadNoteDGPdf, generateNoteDGPdf } from '@/services/noteDGPdfService';
import { r2Storage } from '@/services/r2Storage';
import { NoteDirectionGenerale, NoteDGImputation } from '@/hooks/useNotesDirectionGenerale';

interface UseNoteDGPdfOptions {
  noteId: string | null;
}

interface GeneratePdfParams {
  note: NoteDirectionGenerale;
  imputations: NoteDGImputation[];
}

export function useNoteDGPdf({ noteId: _noteId }: UseNoteDGPdfOptions) {
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * Génère le QR token si nécessaire
   */
  const ensureQrToken = useCallback(
    async (note: NoteDirectionGenerale): Promise<string> => {
      // Si le token existe déjà, le retourner
      // Accès dynamique pour les nouveaux champs
      const noteWithQr = note as NoteDirectionGenerale & {
        qr_token?: string;
        qr_generated_at?: string;
      };

      if (noteWithQr.qr_token) {
        return noteWithQr.qr_token;
      }

      // Sinon, générer un nouveau token
      const newToken = crypto.randomUUID();

      const { error } = await supabaseUntyped
        .from('notes_direction_generale')
        .update({
          qr_token: newToken,
          qr_generated_at: new Date().toISOString(),
        })
        .eq('id', note.id);

      if (error) {
        console.error('Error generating QR token:', error);
        throw new Error('Impossible de générer le QR token');
      }

      // Invalider le cache
      queryClient.invalidateQueries({ queryKey: ['notes-direction-generale'] });
      queryClient.invalidateQueries({ queryKey: ['note-direction-generale', note.id] });

      return newToken;
    },
    [queryClient]
  );

  /**
   * Télécharge le PDF de la note
   */
  const downloadPdf = useMutation({
    mutationFn: async ({ note, imputations }: GeneratePdfParams) => {
      // Vérifier que la note est validée
      if (!['dg_valide', 'diffusee'].includes(note.statut)) {
        throw new Error('Le PDF ne peut être généré que pour les notes validées');
      }

      setIsGenerating(true);

      try {
        // S'assurer que le QR token existe
        const qrToken = await ensureQrToken(note);

        // Générer et télécharger le PDF
        await downloadNoteDGPdf({
          note,
          imputations,
          qrToken,
        });

        // Logger l'action
        await logAction({
          entityType: 'note_direction_generale',
          entityId: note.id,
          action: 'pdf_download',
          newValues: { qr_token: qrToken },
        });

        return { success: true, qrToken };
      } finally {
        setIsGenerating(false);
      }
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'PDF généré',
        description: `Le PDF de la note ${variables.note.reference || ''} a été téléchargé`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  /**
   * Génère le PDF et le stocke
   */
  const generateAndStorePdf = useMutation({
    mutationFn: async ({ note, imputations }: GeneratePdfParams) => {
      // Vérifier que la note est validée
      if (!['dg_valide', 'diffusee'].includes(note.statut)) {
        throw new Error('Le PDF ne peut être généré que pour les notes validées');
      }

      setIsGenerating(true);

      try {
        // S'assurer que le QR token existe
        const qrToken = await ensureQrToken(note);

        // Générer le PDF
        const { blob, filename } = await generateNoteDGPdf({
          note,
          imputations,
          qrToken,
        });

        // Calculer le hash du PDF pour l'intégrité
        const arrayBuffer = await blob.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const pdfHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

        // Stocker le PDF via Edge Function r2-storage
        const storagePath = r2Storage.generatePath(
          'notes-dg/pdf',
          note.id,
          filename,
          note.exercice
        );

        const { data: uploadResult, error: uploadError } = await r2Storage.uploadBlob(
          blob,
          storagePath,
          'application/pdf'
        );

        if (uploadError || !uploadResult) {
          console.error('Error uploading PDF to R2:', uploadError);
          throw new Error('Impossible de stocker le PDF: ' + (uploadError || 'Erreur inconnue'));
        }

        const storedKey = uploadResult.key;

        // Mettre à jour la note avec les infos PDF
        const { error: updateError } = await supabaseUntyped
          .from('notes_direction_generale')
          .update({
            pdf_generated_at: new Date().toISOString(),
            pdf_hash: pdfHash,
            pdf_url: storedKey,
          })
          .eq('id', note.id);

        if (updateError) {
          console.error('Error updating PDF info:', updateError);
        }

        // Logger l'action
        await logAction({
          entityType: 'note_direction_generale',
          entityId: note.id,
          action: 'pdf_generate',
          newValues: { pdf_hash: pdfHash, pdf_url: storedKey, qr_token: qrToken },
        });

        // Invalider le cache
        queryClient.invalidateQueries({ queryKey: ['notes-direction-generale'] });
        queryClient.invalidateQueries({ queryKey: ['note-direction-generale', note.id] });

        return { success: true, qrToken, filename, pdfHash, pdfUrl: storedKey };
      } finally {
        setIsGenerating(false);
      }
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'PDF généré et stocké',
        description: `Le PDF de la note ${variables.note.reference || ''} a été généré`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  /**
   * Télécharge un PDF déjà stocké dans R2
   */
  const downloadStoredPdf = useCallback(
    async (note: NoteDirectionGenerale) => {
      if (!note.pdf_url) {
        throw new Error('Aucun PDF stocké pour cette note');
      }

      const { data: downloadUrl, error } = await r2Storage.getDownloadUrl(note.pdf_url);

      if (error || !downloadUrl) {
        throw new Error('Impossible de récupérer le PDF: ' + (error || 'Erreur inconnue'));
      }

      // Trigger browser download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `ARTI_NOTE_DG_${note.reference || 'PDF'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      await logAction({
        entityType: 'note_direction_generale',
        entityId: note.id,
        action: 'pdf_download',
        newValues: { pdf_url: note.pdf_url },
      });
    },
    [logAction]
  );

  return {
    downloadPdf: downloadPdf.mutateAsync,
    generateAndStorePdf: generateAndStorePdf.mutateAsync,
    downloadStoredPdf,
    isGenerating,
    isDownloading: downloadPdf.isPending,
    isStoring: generateAndStorePdf.isPending,
  };
}

export default useNoteDGPdf;
