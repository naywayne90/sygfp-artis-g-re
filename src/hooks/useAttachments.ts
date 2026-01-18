/**
 * Hook React pour la gestion des pièces jointes
 *
 * Utilise AttachmentService pour:
 * - Upload multi-fichiers avec progression
 * - Liste des pièces jointes par dossier/étape
 * - URLs signées pour téléchargement/preview
 * - Suppression contrôlée
 */

import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AttachmentService,
  type AttachmentMetadata,
  type AttachmentStep,
  type UploadResult,
} from "@/services/attachmentService";
import { useExercice } from "@/contexts/ExerciceContext";

// ============================================
// TYPES
// ============================================

export interface UseAttachmentsOptions {
  /** Référence pivot du dossier */
  dossierRef?: string;
  /** Étape spécifique (optionnel) */
  step?: AttachmentStep;
  /** ID de l'entité (alternative au dossierRef) */
  entityId?: string;
  /** Activer le fetch automatique */
  enabled?: boolean;
}

export interface UploadState {
  isUploading: boolean;
  progress: number;
  currentFileIndex: number;
  totalFiles: number;
  currentFileName: string;
}

export interface FileWithPreview {
  file: File;
  preview?: string;
  error?: string;
}

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useAttachments(options: UseAttachmentsOptions = {}) {
  const { dossierRef, step, entityId, enabled = true } = options;
  const { exercice } = useExercice();
  const queryClient = useQueryClient();

  // État d'upload
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    currentFileIndex: 0,
    totalFiles: 0,
    currentFileName: "",
  });

  // Query key dynamique
  const queryKey = useMemo(() => {
    if (entityId) return ["attachments", "entity", entityId];
    if (dossierRef && step) return ["attachments", dossierRef, step];
    if (dossierRef) return ["attachments", dossierRef];
    return ["attachments"];
  }, [dossierRef, step, entityId]);

  // ============================================
  // FETCH ATTACHMENTS
  // ============================================

  const {
    data: attachments = [],
    isLoading,
    error: fetchError,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async (): Promise<AttachmentMetadata[]> => {
      if (entityId) {
        const result = await AttachmentService.listByEntity(entityId);
        if (result.error) throw new Error(result.error);
        return result.attachments;
      }

      if (dossierRef) {
        const result = await AttachmentService.listAttachments(dossierRef, step);
        if (result.error) throw new Error(result.error);
        return result.attachments;
      }

      return [];
    },
    enabled: enabled && (!!dossierRef || !!entityId),
    staleTime: 30000, // 30 secondes
  });

  // ============================================
  // UPLOAD MUTATION
  // ============================================

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]): Promise<{
      results: UploadResult[];
      successCount: number;
      failedCount: number;
    }> => {
      if (!dossierRef) {
        throw new Error("dossierRef est requis pour l'upload");
      }
      if (!step) {
        throw new Error("step est requis pour l'upload");
      }
      if (!exercice) {
        throw new Error("Aucun exercice sélectionné");
      }

      setUploadState({
        isUploading: true,
        progress: 0,
        currentFileIndex: 0,
        totalFiles: files.length,
        currentFileName: files[0]?.name || "",
      });

      const result = await AttachmentService.uploadFiles({
        dossierRef,
        step,
        files,
        exercice,
        entityId,
        onProgress: (fileIndex, percent) => {
          setUploadState((prev) => ({
            ...prev,
            currentFileIndex: fileIndex,
            currentFileName: files[fileIndex]?.name || "",
            progress: Math.round(
              ((fileIndex + percent / 100) / files.length) * 100
            ),
          }));
        },
      });

      return result;
    },
    onSuccess: (result) => {
      setUploadState({
        isUploading: false,
        progress: 100,
        currentFileIndex: 0,
        totalFiles: 0,
        currentFileName: "",
      });

      // Invalider le cache
      queryClient.invalidateQueries({ queryKey });

      // Notifications
      if (result.successCount > 0 && result.failedCount === 0) {
        toast.success(
          `${result.successCount} fichier(s) téléversé(s) avec succès`
        );
      } else if (result.successCount > 0 && result.failedCount > 0) {
        toast.warning(
          `${result.successCount} fichier(s) réussi(s), ${result.failedCount} échec(s)`
        );
      } else if (result.failedCount > 0) {
        toast.error(`Échec du téléversement de ${result.failedCount} fichier(s)`);
      }
    },
    onError: (error) => {
      setUploadState({
        isUploading: false,
        progress: 0,
        currentFileIndex: 0,
        totalFiles: 0,
        currentFileName: "",
      });
      toast.error(
        error instanceof Error ? error.message : "Erreur lors du téléversement"
      );
    },
  });

  // ============================================
  // DELETE MUTATION
  // ============================================

  const deleteMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      const result = await AttachmentService.deleteAttachment(attachmentId);
      if (!result.success) {
        throw new Error(result.error || "Échec de la suppression");
      }
      return attachmentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Fichier supprimé");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Erreur de suppression"
      );
    },
  });

  // ============================================
  // ACTIONS
  // ============================================

  /**
   * Upload un ou plusieurs fichiers
   */
  const upload = useCallback(
    async (files: File | File[]) => {
      const fileArray = Array.isArray(files) ? files : [files];
      return uploadMutation.mutateAsync(fileArray);
    },
    [uploadMutation]
  );

  /**
   * Valide les fichiers avant upload
   */
  const validateFiles = useCallback((files: File[]): FileWithPreview[] => {
    return files.map((file) => {
      const validation = AttachmentService.validateFile(file);
      const preview = AttachmentService.isImage(file.type)
        ? URL.createObjectURL(file)
        : undefined;

      return {
        file,
        preview,
        error: validation.valid ? undefined : validation.error,
      };
    });
  }, []);

  /**
   * Supprime un fichier
   */
  const deleteAttachment = useCallback(
    async (attachmentId: string) => {
      return deleteMutation.mutateAsync(attachmentId);
    },
    [deleteMutation]
  );

  /**
   * Obtient une URL signée pour un fichier
   */
  const getDownloadUrl = useCallback(async (storagePath: string) => {
    const result = await AttachmentService.getSignedUrl(storagePath);
    if (result.error) {
      toast.error(result.error);
      return null;
    }
    return result.url;
  }, []);

  /**
   * Obtient une URL de preview
   */
  const getPreviewUrl = useCallback(async (storagePath: string) => {
    const result = await AttachmentService.getPreviewUrl(storagePath);
    if (result.error) {
      return null;
    }
    return result.url;
  }, []);

  /**
   * Télécharge un fichier
   */
  const download = useCallback(
    async (attachment: AttachmentMetadata) => {
      const url = await getDownloadUrl(attachment.storage_path);
      if (url) {
        const link = document.createElement("a");
        link.href = url;
        link.download = attachment.original_name;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    },
    [getDownloadUrl]
  );

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const totalSize = useMemo(() => {
    return attachments.reduce((sum, att) => sum + att.size, 0);
  }, [attachments]);

  const attachmentsByType = useMemo(() => {
    const byType: Record<string, AttachmentMetadata[]> = {};
    for (const att of attachments) {
      const type = att.type_piece || "AUTRE";
      if (!byType[type]) byType[type] = [];
      byType[type].push(att);
    }
    return byType;
  }, [attachments]);

  // ============================================
  // RETURN
  // ============================================

  return {
    // Data
    attachments,
    attachmentsByType,
    totalSize,
    totalCount: attachments.length,

    // Loading states
    isLoading,
    isUploading: uploadState.isUploading,
    isDeleting: deleteMutation.isPending,
    uploadState,

    // Errors
    error: fetchError,
    uploadError: uploadMutation.error,
    deleteError: deleteMutation.error,

    // Actions
    upload,
    validateFiles,
    deleteAttachment,
    getDownloadUrl,
    getPreviewUrl,
    download,
    refetch,

    // Utilities
    formatFileSize: AttachmentService.formatFileSize.bind(AttachmentService),
    isImage: AttachmentService.isImage.bind(AttachmentService),
    isPdf: AttachmentService.isPdf.bind(AttachmentService),
    getFileIcon: AttachmentService.getFileIcon.bind(AttachmentService),
    getAcceptedExtensions: AttachmentService.getAcceptedExtensions.bind(AttachmentService),
    providerName: AttachmentService.getProviderName(),
  };
}

// ============================================
// HOOK SIMPLIFIÉ POUR UPLOAD SEUL
// ============================================

export function useAttachmentUpload(
  dossierRef: string,
  step: AttachmentStep,
  entityId?: string
) {
  const { exercice } = useExercice();
  const queryClient = useQueryClient();

  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const upload = useCallback(
    async (files: File[]) => {
      if (!exercice) {
        toast.error("Aucun exercice sélectionné");
        return { successCount: 0, failedCount: files.length };
      }

      setIsUploading(true);
      setProgress(0);

      try {
        const result = await AttachmentService.uploadFiles({
          dossierRef,
          step,
          files,
          exercice,
          entityId,
          onProgress: (_, percent) => {
            setProgress(percent);
          },
        });

        // Invalider le cache
        queryClient.invalidateQueries({
          queryKey: ["attachments", dossierRef, step],
        });

        return result;
      } finally {
        setIsUploading(false);
        setProgress(0);
      }
    },
    [dossierRef, step, entityId, exercice, queryClient]
  );

  return {
    upload,
    isUploading,
    progress,
    validate: AttachmentService.validateFile.bind(AttachmentService),
  };
}

export default useAttachments;
