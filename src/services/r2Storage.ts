import { supabase } from "@/integrations/supabase/client";

export interface R2Object {
  key: string;
  size: number;
  lastModified: string;
  etag?: string;
}

export interface UploadResult {
  key: string;
  bucket: string;
  url: string;
}

interface R2Response<T> {
  data: T | null;
  error: string | null;
}

/**
 * Service for interacting with Cloudflare R2 via Edge Function
 * All files are stored under the "sygfp/" prefix in the bucket
 */
class R2StorageService {
  private async callEdgeFunction<T>(body: Record<string, unknown>): Promise<R2Response<T>> {
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

  /**
   * Upload a file to R2
   * @param file - The file to upload
   * @param path - The path within the bucket (will be prefixed with sygfp/)
   * @param onProgress - Optional progress callback
   */
  async upload(
    file: File,
    path: string,
    onProgress?: (percent: number) => void
  ): Promise<R2Response<UploadResult>> {
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
          url: urlData.key, // Store the key as reference
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

  /**
   * Get a signed download URL for a file
   * @param key - The full key of the file (including sygfp/ prefix)
   * @param expiresIn - URL expiration in seconds (default 3600)
   */
  async getDownloadUrl(
    key: string,
    expiresIn = 3600
  ): Promise<R2Response<string>> {
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

  /**
   * Download a file from R2
   * @param key - The full key of the file
   * @param filename - The filename for the downloaded file
   */
  async download(key: string, filename: string): Promise<R2Response<Blob>> {
    const { data: url, error } = await this.getDownloadUrl(key);
    
    if (error || !url) {
      return { data: null, error: error || "Failed to get download URL" };
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        return { data: null, error: `Download failed: ${response.statusText}` };
      }
      
      const blob = await response.blob();
      return { data: blob, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "Download failed",
      };
    }
  }

  /**
   * Delete a file from R2
   * @param key - The full key of the file
   */
  async delete(key: string): Promise<R2Response<boolean>> {
    const { data, error } = await this.callEdgeFunction<{ success: boolean }>({
      action: "deleteObject",
      key,
    });

    if (error) {
      return { data: null, error };
    }

    return { data: data?.success ?? false, error: null };
  }

  /**
   * List files in R2 under a prefix
   * @param prefix - The prefix to list (will be prefixed with sygfp/ if not already)
   */
  async list(prefix?: string): Promise<R2Response<R2Object[]>> {
    const { data, error } = await this.callEdgeFunction<{ objects: R2Object[] }>({
      action: "listObjects",
      prefix,
    });

    if (error || !data) {
      return { data: null, error: error || "Failed to list objects" };
    }

    return { data: data.objects, error: null };
  }

  /**
   * Generate a storage path for an entity
   * @param entityType - Type of entity (e.g., 'notes-sef', 'notes-aef')
   * @param entityId - ID of the entity
   * @param filename - Original filename
   * @param exercice - Optional exercise year
   */
  generatePath(
    entityType: string,
    entityId: string,
    filename: string,
    exercice?: number
  ): string {
    const timestamp = Date.now();
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    
    if (exercice) {
      return `${entityType}/${exercice}/${entityId}/${timestamp}_${safeFilename}`;
    }
    
    return `${entityType}/${entityId}/${timestamp}_${safeFilename}`;
  }
}

// Export singleton instance
export const r2Storage = new R2StorageService();
