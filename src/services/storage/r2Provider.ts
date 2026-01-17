/**
 * R2 Storage Provider
 * Uses existing r2Storage service through Edge Function
 */

import { supabase } from "@/integrations/supabase/client";
import type { IStorageProvider, StorageResult, StorageObject, UploadResult, PathParams } from "./types";
import { generateStandardName } from "./namingService";

export class R2StorageProvider implements IStorageProvider {
  private async callEdgeFunction<T>(body: Record<string, unknown>): Promise<StorageResult<T>> {
    try {
      const { data, error } = await supabase.functions.invoke("r2-storage", {
        body,
      });

      if (error) {
        console.error("R2 Edge Function Error:", error);
        return { data: null, error: error.message };
      }

      if (data?.error) {
        return { data: null, error: data.error };
      }

      return { data: data as T, error: null };
    } catch (err) {
      console.error("R2 Service Error:", err);
      return { data: null, error: err instanceof Error ? err.message : "Unknown error" };
    }
  }

  async upload(
    file: File,
    path: string,
    onProgress?: (percent: number) => void
  ): Promise<StorageResult<UploadResult>> {
    // Step 1: Get presigned upload URL
    const { data: urlData, error: urlError } = await this.callEdgeFunction<{
      uploadUrl: string;
      key: string;
      bucket: string;
    }>({
      action: "getUploadUrl",
      key: path,
      contentType: file.type || "application/octet-stream",
    });

    if (urlError || !urlData) {
      return { data: null, error: urlError || "Failed to get upload URL" };
    }

    // Step 2: Upload directly to R2 using presigned URL
    try {
      const xhr = new XMLHttpRequest();
      
      const uploadPromise = new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable && onProgress) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Network error during upload"));
        });
      });

      xhr.open("PUT", urlData.uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      xhr.send(file);

      await uploadPromise;

      return {
        data: {
          key: urlData.key,
          bucket: urlData.bucket,
          url: urlData.key,
        },
        error: null,
      };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "Upload failed",
      };
    }
  }

  async getDownloadUrl(key: string, expiresIn = 3600): Promise<StorageResult<string>> {
    const { data, error } = await this.callEdgeFunction<{ downloadUrl: string }>({
      action: "getDownloadUrl",
      key,
      expiresIn,
    });

    if (error || !data) {
      return { data: null, error: error || "Failed to get download URL" };
    }

    return { data: data.downloadUrl, error: null };
  }

  async delete(key: string): Promise<StorageResult<boolean>> {
    const { data, error } = await this.callEdgeFunction<{ success: boolean }>({
      action: "deleteObject",
      key,
    });

    if (error) {
      return { data: null, error };
    }

    return { data: data?.success ?? false, error: null };
  }

  async list(prefix?: string): Promise<StorageResult<StorageObject[]>> {
    const { data, error } = await this.callEdgeFunction<{ objects: StorageObject[] }>({
      action: "listObjects",
      prefix,
    });

    if (error || !data) {
      return { data: null, error: error || "Failed to list objects" };
    }

    return { data: data.objects, error: null };
  }

  generatePath(params: PathParams): string {
    const { entityType, entityId, filename, exercice, reference, typePiece } = params;
    
    // If reference and typePiece provided, use standard naming
    if (reference && typePiece) {
      const { standardName } = generateStandardName({
        reference,
        typePiece,
        originalFilename: filename,
      });
      
      if (exercice) {
        return `${exercice}/${entityType}/${entityId}/${standardName}`;
      }
      return `${entityType}/${entityId}/${standardName}`;
    }
    
    // Fallback to timestamp-based naming
    const timestamp = Date.now();
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    
    if (exercice) {
      return `${entityType}/${exercice}/${entityId}/${timestamp}_${safeFilename}`;
    }
    
    return `${entityType}/${entityId}/${timestamp}_${safeFilename}`;
  }

  getProviderName(): string {
    return 'r2';
  }
}
