// @ts-nocheck
/**
 * FileUploadGroup - Groupe de 3 zones d'upload
 * PJ n°1 obligatoire, PJ n°2 et n°3 optionnelles
 */

import { useCallback } from 'react';
import { FileUploadZone } from './FileUploadZone';
import { useFileUpload } from '@/hooks/useFileUpload';
import { cn } from '@/lib/utils';

interface FileUploadGroupProps {
  entityType: string;
  entityId: string;
  onUploadComplete?: () => void;
  labels?: {
    pj1?: string;
    pj2?: string;
    pj3?: string;
  };
  disabled?: boolean;
  className?: string;
}

export function FileUploadGroup({
  entityType,
  entityId,
  onUploadComplete,
  labels,
  disabled = false,
  className,
}: FileUploadGroupProps) {
  const {
    uploadFile,
    deleteFile,
    isUploading,
    isDeleting,
    progress,
    error,
    getFileByNumero,
  } = useFileUpload({
    entityType,
    entityId,
  });

  // Handlers d'upload pour chaque zone
  const handleUpload = useCallback(
    async (file: File, numero: number) => {
      await uploadFile(file, numero);
      onUploadComplete?.();
    },
    [uploadFile, onUploadComplete]
  );

  // Handlers de suppression
  const handleDelete = useCallback(
    async (attachmentId: string) => {
      await deleteFile(attachmentId);
      onUploadComplete?.();
    },
    [deleteFile, onUploadComplete]
  );

  // Récupérer les fichiers par numéro
  const file1 = getFileByNumero(1);
  const file2 = getFileByNumero(2);
  const file3 = getFileByNumero(3);

  return (
    <div className={cn('space-y-4', className)}>
      {/* PJ n°1 - Obligatoire */}
      <FileUploadZone
        numero={1}
        label={labels?.pj1 || 'Pièce jointe principale'}
        required={true}
        file={file1}
        onUpload={(file) => handleUpload(file, 1)}
        onDelete={file1 ? () => handleDelete(file1.id) : undefined}
        isUploading={isUploading}
        isDeleting={isDeleting}
        progress={progress}
        error={error}
        disabled={disabled}
      />

      {/* PJ n°2 - Optionnel */}
      <FileUploadZone
        numero={2}
        label={labels?.pj2 || 'Pièce jointe complémentaire'}
        required={false}
        file={file2}
        onUpload={(file) => handleUpload(file, 2)}
        onDelete={file2 ? () => handleDelete(file2.id) : undefined}
        isUploading={isUploading}
        isDeleting={isDeleting}
        progress={progress}
        error={error}
        disabled={disabled}
      />

      {/* PJ n°3 - Optionnel */}
      <FileUploadZone
        numero={3}
        label={labels?.pj3 || 'Pièce jointe supplémentaire'}
        required={false}
        file={file3}
        onUpload={(file) => handleUpload(file, 3)}
        onDelete={file3 ? () => handleDelete(file3.id) : undefined}
        isUploading={isUploading}
        isDeleting={isDeleting}
        progress={progress}
        error={error}
        disabled={disabled}
      />
    </div>
  );
}

/**
 * Variante compacte pour validation avec un seul upload
 */
interface SingleFileUploadProps {
  entityType: string;
  entityId: string;
  label?: string;
  required?: boolean;
  onUploadComplete?: () => void;
  disabled?: boolean;
  className?: string;
}

export function SingleFileUpload({
  entityType,
  entityId,
  label = 'Pièce jointe',
  required = false,
  onUploadComplete,
  disabled = false,
  className,
}: SingleFileUploadProps) {
  const {
    uploadFile,
    deleteFile,
    isUploading,
    isDeleting,
    progress,
    error,
    getFileByNumero,
  } = useFileUpload({
    entityType,
    entityId,
  });

  const file = getFileByNumero(1);

  return (
    <FileUploadZone
      numero={1}
      label={label}
      required={required}
      file={file}
      onUpload={(f) => {
        uploadFile(f, 1).then(() => onUploadComplete?.());
      }}
      onDelete={file ? () => deleteFile(file.id).then(() => onUploadComplete?.()) : undefined}
      isUploading={isUploading}
      isDeleting={isDeleting}
      progress={progress}
      error={error}
      disabled={disabled}
      className={className}
    />
  );
}
