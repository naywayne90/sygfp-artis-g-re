/**
 * Hook unifié pour l'upload de documents avec nommage standardisé
 */

import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { storage } from "@/services/storage";
import type { StorageObject, UploadResult } from "@/services/storage";

export interface DocumentUploadOptions {
  entityType: string;
  entityId: string;
  exercice?: number;
  reference?: string;
  onUploadSuccess?: (result: UploadResult) => void;
  onUploadError?: (error: string) => void;
  onDeleteSuccess?: (key: string) => void;
  onDeleteError?: (error: string) => void;
}

export interface UploadParams {
  file: File;
  typePiece: string;
  reference?: string;
}

export function useDocumentUpload(options: DocumentUploadOptions) {
  const {
    entityType,
    entityId,
    exercice,
    reference: defaultReference,
    onUploadSuccess,
    onUploadError,
    onDeleteSuccess,
    onDeleteError,
  } = options;

  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);

  // Query for listing files
  const filesQuery = useQuery({
    queryKey: ["documents", entityType, entityId, exercice],
    queryFn: async () => {
      if (!entityType || !entityId) return [];
      
      const prefix = exercice
        ? `${exercice}/${entityType}/${entityId}`
        : `${entityType}/${entityId}`;
      
      const { data, error } = await storage.list(prefix);
      
      if (error) {
        console.error("Failed to list documents:", error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!entityType && !!entityId,
  });

  // Upload mutation with standard naming
  const uploadMutation = useMutation({
    mutationFn: async (params: UploadParams) => {
      const { file, typePiece, reference = defaultReference } = params;
      
      if (!entityType || !entityId) {
        throw new Error("entityType and entityId are required for upload");
      }
      
      if (!reference) {
        throw new Error("reference is required for standard naming");
      }

      const path = storage.generatePath({
        entityType,
        entityId,
        filename: file.name,
        exercice,
        reference,
        typePiece,
      });

      const { data, error } = await storage.upload(file, path, (percent) => {
        setUploadProgress(percent);
      });

      if (error || !data) {
        throw new Error(error || "Upload failed");
      }

      return data;
    },
    onSuccess: (result) => {
      setUploadProgress(0);
      queryClient.invalidateQueries({
        queryKey: ["documents", entityType, entityId, exercice],
      });
      toast.success("Document uploadé avec succès");
      onUploadSuccess?.(result);
    },
    onError: (error: Error) => {
      setUploadProgress(0);
      toast.error(`Erreur upload: ${error.message}`);
      onUploadError?.(error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (key: string) => {
      const { _data, error } = await storage.delete(key);
      
      if (error) {
        throw new Error(error);
      }
      
      return key;
    },
    onSuccess: (key) => {
      queryClient.invalidateQueries({
        queryKey: ["documents", entityType, entityId, exercice],
      });
      toast.success("Document supprimé");
      onDeleteSuccess?.(key);
    },
    onError: (error: Error) => {
      toast.error(`Erreur suppression: ${error.message}`);
      onDeleteError?.(error.message);
    },
  });

  // Download function
  const download = useCallback(async (key: string, filename: string) => {
    try {
      const { data: url, error } = await storage.getDownloadUrl(key);
      
      if (error || !url) {
        toast.error("Erreur lors du téléchargement");
        return;
      }

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Erreur lors du téléchargement");
    }
  }, []);

  // Get signed URL for preview
  const getPreviewUrl = useCallback(async (key: string): Promise<string | null> => {
    const { data, error } = await storage.getDownloadUrl(key, 3600);
    if (error) {
      console.error("Failed to get preview URL:", error);
      return null;
    }
    return data;
  }, []);

  return {
    // Data
    files: filesQuery.data || [],
    isLoading: filesQuery.isLoading,
    isError: filesQuery.isError,

    // Upload
    upload: uploadMutation.mutate,
    uploadAsync: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    uploadProgress,

    // Delete
    deleteFile: deleteMutation.mutate,
    deleteFileAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,

    // Download / Preview
    download,
    getPreviewUrl,

    // Refetch
    refetch: filesQuery.refetch,
    
    // Provider info
    providerName: storage.getProviderName(),
  };
}

/**
 * Helper to extract filename from storage key
 */
export function extractFilename(key: string): string {
  const parts = key.split("/");
  return parts[parts.length - 1];
}

/**
 * Convert StorageObject to UI-friendly format
 */
export function toDocumentItem(obj: StorageObject): {
  key: string;
  name: string;
  size: number;
  lastModified: string;
} {
  return {
    key: obj.key,
    name: extractFilename(obj.key),
    size: obj.size,
    lastModified: obj.lastModified,
  };
}
