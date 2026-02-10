/**
 * Storage Factory
 * Creates the appropriate storage provider based on environment configuration
 */

import type { IStorageProvider, StorageProviderType } from "./types";
import { R2StorageProvider } from "./r2Provider";
import { SupabaseStorageProvider } from "./supabaseProvider";
import { LocalStorageProvider } from "./localProvider";

let storageInstance: IStorageProvider | null = null;

/**
 * Get the configured storage provider type from environment
 */
function getConfiguredProvider(): StorageProviderType {
  const provider = import.meta.env.VITE_STORAGE_PROVIDER;
  
  if (provider === 'supabase' || provider === 'local') {
    return provider;
  }
  
  // Default to R2
  return 'r2';
}

/**
 * Create a storage provider instance based on type
 */
function createProvider(type: StorageProviderType): IStorageProvider {
  switch (type) {
    case 'supabase':
      return new SupabaseStorageProvider();
    case 'local':
      return new LocalStorageProvider();
    case 'r2':
    default:
      return new R2StorageProvider();
  }
}

/**
 * Get the storage provider singleton
 * Provider type is determined by VITE_STORAGE_PROVIDER env variable:
 * - "r2" (default): Cloudflare R2 via Edge Function
 * - "supabase": Supabase Storage
 * - "local": Self-hosted Linux server
 */
export function getStorageProvider(): IStorageProvider {
  if (!storageInstance) {
    const type = getConfiguredProvider();
    storageInstance = createProvider(type);
    // Storage provider initialized: type
  }
  return storageInstance;
}

/**
 * Reset the storage instance (useful for testing or reconfiguration)
 */
export function resetStorageProvider(): void {
  storageInstance = null;
}

/**
 * Get current provider type
 */
export function getCurrentProviderType(): StorageProviderType {
  return getConfiguredProvider();
}

// Export singleton for convenience
export const storage = getStorageProvider();
