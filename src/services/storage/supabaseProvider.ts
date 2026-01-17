/**
 * Supabase Storage Provider
 * Uses Supabase's built-in storage buckets
 */

import { supabase } from "@/integrations/supabase/client";
import type { IStorageProvider, StorageResult, StorageObject, UploadResult, PathParams } from "./types";
import { generateStandardName } from "./namingService";

const BUCKET_NAME = "documents";

export class SupabaseStorageProvider implements IStorageProvider {
  async upload(
    file: File,
    path: string,
    onProgress?: (percent: number) => void
  ): Promise<StorageResult<UploadResult>> {
    try {
      // Supabase doesn't support progress natively, simulate start
      onProgress?.(0);
      
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        return { data: null, error: error.message };
      }

      onProgress?.(100);

      return {
        data: {
          key: data.path,
          bucket: BUCKET_NAME,
          url: data.path,
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
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(key, expiresIn);

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data.signedUrl, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : "Failed to get download URL",
      };
    }
  }

  async delete(key: string): Promise<StorageResult<boolean>> {
    try {
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([key]);

      if (error) {
        return { data: null, error: error.message };
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
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(prefix || '', {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) {
        return { data: null, error: error.message };
      }

      const objects: StorageObject[] = data.map(item => ({
        key: prefix ? `${prefix}/${item.name}` : item.name,
        size: item.metadata?.size || 0,
        lastModified: item.created_at || new Date().toISOString(),
      }));

      return { data: objects, error: null };
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
    return 'supabase';
  }
}
