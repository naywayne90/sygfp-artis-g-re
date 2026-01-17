/**
 * Local Storage Provider
 * For self-hosted Linux servers with a custom storage API
 */

import type { IStorageProvider, StorageResult, StorageObject, UploadResult, PathParams } from "./types";
import { generateStandardName } from "./namingService";

export class LocalStorageProvider implements IStorageProvider {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_LOCAL_STORAGE_URL || 'http://localhost:3001/storage';
    this.apiKey = import.meta.env.VITE_LOCAL_STORAGE_API_KEY || '';
  }

  private getHeaders(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async upload(
    file: File,
    path: string,
    onProgress?: (percent: number) => void
  ): Promise<StorageResult<UploadResult>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', path);

      const xhr = new XMLHttpRequest();
      
      const uploadPromise = new Promise<{ key: string; url: string }>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable && onProgress) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve({ key: response.key || path, url: response.url || path });
            } catch {
              resolve({ key: path, url: path });
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Network error during upload"));
        });
      });

      xhr.open("POST", `${this.baseUrl}/upload`);
      if (this.apiKey) {
        xhr.setRequestHeader('Authorization', `Bearer ${this.apiKey}`);
      }
      xhr.send(formData);

      const result = await uploadPromise;

      return {
        data: {
          key: result.key,
          bucket: 'local',
          url: result.url,
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
    try {
      const response = await fetch(`${this.baseUrl}/signed-url`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ key, expiresIn }),
      });

      if (!response.ok) {
        return { data: null, error: `Failed to get download URL: ${response.statusText}` };
      }

      const data = await response.json();
      return { data: data.url || `${this.baseUrl}/files/${key}`, error: null };
    } catch (err) {
      // Fallback to direct URL
      return { data: `${this.baseUrl}/files/${key}`, error: null };
    }
  }

  async delete(key: string): Promise<StorageResult<boolean>> {
    try {
      const response = await fetch(`${this.baseUrl}/delete`, {
        method: 'DELETE',
        headers: this.getHeaders(),
        body: JSON.stringify({ key }),
      });

      if (!response.ok) {
        return { data: null, error: `Delete failed: ${response.statusText}` };
      }

      return { data: true, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "Delete failed",
      };
    }
  }

  async list(prefix?: string): Promise<StorageResult<StorageObject[]>> {
    try {
      const url = new URL(`${this.baseUrl}/list`);
      if (prefix) {
        url.searchParams.set('prefix', prefix);
      }

      const response = await fetch(url.toString(), {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return { data: null, error: `List failed: ${response.statusText}` };
      }

      const data = await response.json();
      return { data: data.objects || [], error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "List failed",
      };
    }
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
    return 'local';
  }
}
