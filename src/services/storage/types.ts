/**
 * Storage Provider Abstraction Types
 * Supports R2, Supabase Storage, and Local server storage
 */

export interface StorageResult<T> {
  data: T | null;
  error: string | null;
}

export interface StorageObject {
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

export interface PathParams {
  entityType: string;
  entityId: string;
  filename: string;
  exercice?: number;
  reference?: string;
  typePiece?: string;
}

export interface IStorageProvider {
  /**
   * Upload a file to storage
   */
  upload(
    file: File,
    path: string,
    onProgress?: (percent: number) => void
  ): Promise<StorageResult<UploadResult>>;

  /**
   * Get a signed download URL
   */
  getDownloadUrl(
    key: string,
    expiresIn?: number
  ): Promise<StorageResult<string>>;

  /**
   * Delete a file from storage
   */
  delete(key: string): Promise<StorageResult<boolean>>;

  /**
   * List files under a prefix
   */
  list(prefix?: string): Promise<StorageResult<StorageObject[]>>;

  /**
   * Generate a standard path for an entity
   */
  generatePath(params: PathParams): string;

  /**
   * Get provider name
   */
  getProviderName(): string;
}

export type StorageProviderType = 'r2' | 'supabase' | 'local';
