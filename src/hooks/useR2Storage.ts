import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { r2Storage, R2Object, UploadResult } from "@/services/r2Storage";
import { toast } from "sonner";

interface UseR2StorageOptions {
  entityType?: string;
  entityId?: string;
  exercice?: number;
  onUploadSuccess?: (result: UploadResult) => void;
  onUploadError?: (error: string) => void;
  onDeleteSuccess?: (key: string) => void;
  onDeleteError?: (error: string) => void;
}

export function useR2Storage(options: UseR2StorageOptions = {}) {
  const {
    entityType,
    entityId,
    exercice,
    onUploadSuccess,
    onUploadError,
    onDeleteSuccess,
    onDeleteError,
  } = options;

  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);

  // Query for listing files
  const filesQuery = useQuery({
    queryKey: ["r2-files", entityType, entityId, exercice],
    queryFn: async () => {
      if (!entityType) return [];
      
      const prefix = exercice
        ? `${entityType}/${exercice}/${entityId || ""}`
        : `${entityType}/${entityId || ""}`;
      
      const { data, error } = await r2Storage.list(prefix);
      
      if (error) {
        console.error("Failed to list R2 files:", error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!entityType,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!entityType || !entityId) {
        throw new Error("entityType and entityId are required for upload");
      }

      const path = r2Storage.generatePath(
        entityType,
        entityId,
        file.name,
        exercice
      );

      const { data, error } = await r2Storage.upload(file, path, (percent) => {
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
        queryKey: ["r2-files", entityType, entityId, exercice],
      });
      toast.success("Fichier uploadé avec succès");
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
      const { data: _data, error } = await r2Storage.delete(key);
      
      if (error) {
        throw new Error(error);
      }
      
      return key;
    },
    onSuccess: (key) => {
      queryClient.invalidateQueries({
        queryKey: ["r2-files", entityType, entityId, exercice],
      });
      toast.success("Fichier supprimé");
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
      const { data: url, error } = await r2Storage.getDownloadUrl(key);
      
      if (error || !url) {
        toast.error("Erreur lors du téléchargement");
        return;
      }

      // Create a temporary link and trigger download
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

  // Get signed URL
  const getSignedUrl = useCallback(async (key: string, expiresIn = 3600) => {
    const { data, error } = await r2Storage.getDownloadUrl(key, expiresIn);
    if (error) {
      console.error("Failed to get signed URL:", error);
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

    // Download
    download,
    getSignedUrl,

    // Refetch
    refetch: filesQuery.refetch,
  };
}

// Helper type for file list items
export interface R2FileItem {
  key: string;
  name: string;
  size: number;
  lastModified: string;
}

/**
 * Helper to extract filename from R2 key
 */
export function extractFilename(key: string): string {
  const parts = key.split("/");
  const filename = parts[parts.length - 1];
  // Remove timestamp prefix if present (e.g., "1234567890_filename.pdf" -> "filename.pdf")
  const match = filename.match(/^\d+_(.+)$/);
  return match ? match[1] : filename;
}

/**
 * Convert R2Object to a more UI-friendly format
 */
export function toFileItem(obj: R2Object): R2FileItem {
  return {
    key: obj.key,
    name: extractFilename(obj.key),
    size: obj.size,
    lastModified: obj.lastModified,
  };
}
