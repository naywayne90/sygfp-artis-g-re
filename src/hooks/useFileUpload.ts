// @ts-nocheck
/**
 * Hook de gestion d'upload de fichiers pour SYGFP
 * Gère l'upload vers R2/Supabase avec progression et validation
 */

import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useExercice } from '@/contexts/ExerciceContext';

// Types de fichiers acceptés
export const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
};

// Extensions acceptées pour affichage
export const ACCEPTED_EXTENSIONS = '.pdf, .doc, .docx, .xls, .xlsx, .jpg, .jpeg, .png';

// Taille maximum (10 MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Types
export interface UploadedFile {
  id: string;
  numero: number;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  storagePath: string;
  uploadedAt: string;
}

export interface FileUploadError {
  type: 'size' | 'type' | 'upload' | 'unknown';
  message: string;
}

interface UseFileUploadOptions {
  entityType: string;
  entityId: string;
  maxSizeBytes?: number;
}

export function useFileUpload({
  entityType,
  entityId,
  maxSizeBytes = MAX_FILE_SIZE,
}: UseFileUploadOptions) {
  const queryClient = useQueryClient();
  const { exercice } = useExercice();
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Query pour récupérer les fichiers existants
  const { data: files = [], isLoading: isLoadingFiles, refetch } = useQuery({
    queryKey: ['file-uploads', entityType, entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attachments')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('numero', { ascending: true });

      if (error) throw error;

      return (data || []).map((att): UploadedFile => ({
        id: att.id,
        numero: att.numero || 1,
        filename: att.filename,
        originalName: att.original_name,
        size: att.size,
        mimeType: att.content_type,
        storagePath: att.storage_path,
        uploadedAt: att.uploaded_at,
      }));
    },
    enabled: !!entityType && !!entityId,
  });

  // Validation du fichier
  const validateFile = useCallback((file: File): FileUploadError | null => {
    // Vérifier la taille
    if (file.size > maxSizeBytes) {
      return {
        type: 'size',
        message: `Le fichier dépasse la taille maximum de ${formatFileSize(maxSizeBytes)}`,
      };
    }

    // Vérifier le type
    const acceptedTypes = Object.keys(ACCEPTED_FILE_TYPES);
    if (!acceptedTypes.includes(file.type)) {
      return {
        type: 'type',
        message: 'Type de fichier non accepté. Utilisez PDF, Word, Excel ou images (JPG, PNG)',
      };
    }

    return null;
  }, [maxSizeBytes]);

  // Mutation pour upload
  const uploadMutation = useMutation({
    mutationFn: async ({ file, numero }: { file: File; numero: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Validation
      const validationError = validateFile(file);
      if (validationError) {
        throw new Error(validationError.message);
      }

      // Générer le chemin de stockage
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `attachments/${exercice}/${entityType}/${entityId}/${timestamp}_${sanitizedName}`;

      // Simuler la progression (pas de vrai callback dans Supabase Storage)
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      try {
        // Upload vers Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('sygfp-files')
          .upload(storagePath, file, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Enregistrer les métadonnées
        const { data: attachment, error: dbError } = await supabase
          .from('attachments')
          .insert({
            entity_type: entityType,
            entity_id: entityId,
            numero,
            filename: sanitizedName,
            original_name: file.name,
            storage_path: storagePath,
            content_type: file.type,
            size: file.size,
            uploaded_by: user.id,
            exercice,
          })
          .select()
          .single();

        if (dbError) throw dbError;

        clearInterval(progressInterval);
        setProgress(100);

        return attachment;
      } catch (err) {
        clearInterval(progressInterval);
        throw err;
      }
    },
    onSuccess: () => {
      setProgress(0);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['file-uploads', entityType, entityId] });
      toast.success('Fichier téléversé avec succès');
    },
    onError: (err: Error) => {
      setProgress(0);
      setError(err.message);
      toast.error(`Erreur : ${err.message}`);
    },
  });

  // Mutation pour suppression
  const deleteMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      // Récupérer le chemin du fichier
      const { data: attachment, error: fetchError } = await supabase
        .from('attachments')
        .select('storage_path')
        .eq('id', attachmentId)
        .single();

      if (fetchError) throw fetchError;

      // Supprimer du storage
      if (attachment?.storage_path) {
        const { error: storageError } = await supabase.storage
          .from('sygfp-files')
          .remove([attachment.storage_path]);

        if (storageError) {
          console.warn('Erreur suppression storage:', storageError);
        }
      }

      // Supprimer de la base
      const { error: dbError } = await supabase
        .from('attachments')
        .delete()
        .eq('id', attachmentId);

      if (dbError) throw dbError;

      return attachmentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-uploads', entityType, entityId] });
      toast.success('Fichier supprimé');
    },
    onError: (err: Error) => {
      toast.error(`Erreur suppression : ${err.message}`);
    },
  });

  // Fonction d'upload
  const uploadFile = useCallback(async (file: File, numero: number) => {
    setError(null);
    await uploadMutation.mutateAsync({ file, numero });
  }, [uploadMutation]);

  // Fonction de suppression
  const deleteFile = useCallback(async (attachmentId: string) => {
    await deleteMutation.mutateAsync(attachmentId);
  }, [deleteMutation]);

  // Obtenir le fichier pour un numéro donné
  const getFileByNumero = useCallback((numero: number): UploadedFile | undefined => {
    return files.find((f) => f.numero === numero);
  }, [files]);

  return {
    files,
    uploadFile,
    deleteFile,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isLoading: isLoadingFiles,
    progress,
    error,
    validateFile,
    getFileByNumero,
    refetch,
  };
}

// Utilitaires

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function truncateFilename(filename: string, maxLength: number = 30): string {
  if (filename.length <= maxLength) return filename;

  const extension = filename.split('.').pop() || '';
  const nameWithoutExt = filename.slice(0, filename.length - extension.length - 1);
  const truncatedName = nameWithoutExt.slice(0, maxLength - extension.length - 4);

  return `${truncatedName}...${extension}`;
}

export function getFileIcon(mimeType: string): 'pdf' | 'image' | 'word' | 'excel' | 'document' {
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.includes('word')) return 'word';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'excel';
  return 'document';
}
