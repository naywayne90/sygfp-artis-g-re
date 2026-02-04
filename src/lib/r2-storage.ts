/**
 * Re-export du service R2 Storage depuis /services
 * Ce fichier permet un import plus court depuis /lib
 */

export {
  r2Storage,
  type R2Object,
  type UploadResult,
} from '@/services/r2Storage';

// Utilitaires de stockage
export const STORAGE_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10 MB
  bucket: 'sygfp-files',
  allowedTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
  ],
} as const;

/**
 * Génère un chemin de stockage standardisé
 */
export function generateStoragePath(
  entityType: string,
  entityId: string,
  filename: string,
  exercice?: number
): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

  const parts = ['attachments'];
  if (exercice) parts.push(String(exercice));
  parts.push(entityType, entityId, `${timestamp}_${sanitizedFilename}`);

  return parts.join('/');
}

/**
 * Extrait le nom de fichier original d'un chemin de stockage
 */
export function extractFilename(storagePath: string): string {
  const parts = storagePath.split('/');
  const filename = parts[parts.length - 1];
  // Enlever le préfixe timestamp si présent
  const match = filename.match(/^\d+_(.+)$/);
  return match ? match[1] : filename;
}
