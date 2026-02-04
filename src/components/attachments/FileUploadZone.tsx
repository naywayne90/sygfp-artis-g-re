// @ts-nocheck
/**
 * FileUploadZone - Zone de drop unique pour upload de fichier
 * Supporte drag & drop et sélection par clic
 */

import { useCallback, useState } from 'react';
import { useDropzone, type Accept } from 'react-dropzone';
import { Upload, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FilePreview } from './FilePreview';
import { FileProgress } from './FileProgress';
import {
  ACCEPTED_FILE_TYPES,
  ACCEPTED_EXTENSIONS,
  MAX_FILE_SIZE,
  formatFileSize,
  type UploadedFile,
} from '@/hooks/useFileUpload';

interface FileUploadZoneProps {
  numero: number;
  label?: string;
  required?: boolean;
  file?: UploadedFile;
  onUpload: (file: File) => Promise<void>;
  onDelete?: () => Promise<void>;
  isUploading?: boolean;
  isDeleting?: boolean;
  progress?: number;
  error?: string | null;
  disabled?: boolean;
  className?: string;
}

export function FileUploadZone({
  numero,
  label,
  required = false,
  file,
  onUpload,
  onDelete,
  isUploading = false,
  isDeleting = false,
  progress = 0,
  error,
  disabled = false,
  className,
}: FileUploadZoneProps) {
  const [localError, setLocalError] = useState<string | null>(null);

  // Callback quand des fichiers sont déposés
  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: { file: File; errors: { code: string }[] }[]) => {
      setLocalError(null);

      // Gérer les fichiers rejetés
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        const errorCode = rejection.errors[0]?.code;

        if (errorCode === 'file-too-large') {
          setLocalError(`Fichier trop volumineux. Maximum : ${formatFileSize(MAX_FILE_SIZE)}`);
        } else if (errorCode === 'file-invalid-type') {
          setLocalError('Type de fichier non accepté');
        } else {
          setLocalError('Fichier non valide');
        }
        return;
      }

      // Upload du premier fichier accepté
      if (acceptedFiles.length > 0) {
        try {
          await onUpload(acceptedFiles[0]);
        } catch (err) {
          setLocalError((err as Error).message);
        }
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES as Accept,
    maxSize: MAX_FILE_SIZE,
    maxFiles: 1,
    multiple: false,
    disabled: disabled || isUploading || !!file,
    noClick: !!file,
    noKeyboard: !!file,
  });

  const displayError = error || localError;

  // Si un fichier est déjà uploadé, afficher la prévisualisation
  if (file) {
    return (
      <div className={cn('space-y-2', className)}>
        {/* En-tête avec badge */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {label || `Pièce jointe n°${numero}`}
          </span>
          <Badge
            variant={required ? 'destructive' : 'secondary'}
            className={cn(
              'text-xs',
              required ? 'bg-red-100 text-red-700 hover:bg-red-100' : 'bg-gray-100 text-gray-600'
            )}
          >
            {required ? 'Obligatoire *' : 'Optionnel'}
          </Badge>
        </div>

        {/* Prévisualisation du fichier */}
        <FilePreview
          file={file}
          onDelete={onDelete}
          isDeleting={isDeleting}
        />
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* En-tête avec badge */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {label || `Pièce jointe n°${numero}`}
        </span>
        <Badge
          variant={required ? 'destructive' : 'secondary'}
          className={cn(
            'text-xs',
            required ? 'bg-red-100 text-red-700 hover:bg-red-100' : 'bg-gray-100 text-gray-600'
          )}
        >
          {required ? 'Obligatoire *' : 'Optionnel'}
        </Badge>
      </div>

      {/* Zone de drop */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30',
          (disabled || isUploading) && 'opacity-50 cursor-not-allowed',
          displayError && 'border-red-300 bg-red-50/50'
        )}
      >
        <input {...getInputProps()} />

        {isUploading ? (
          <div className="space-y-3">
            <Upload className="h-8 w-8 mx-auto text-primary animate-pulse" />
            <FileProgress progress={progress} size="sm" />
          </div>
        ) : (
          <>
            <Upload
              className={cn(
                'h-8 w-8 mx-auto mb-3',
                isDragActive ? 'text-primary' : 'text-muted-foreground'
              )}
            />

            <p className="text-sm font-medium mb-1">
              {isDragActive ? 'Déposez le fichier ici' : 'Glissez un fichier ou cliquez pour sélectionner'}
            </p>

            <p className="text-xs text-muted-foreground">
              {ACCEPTED_EXTENSIONS} • Max {formatFileSize(MAX_FILE_SIZE)}
            </p>
          </>
        )}
      </div>

      {/* Message d'erreur */}
      {displayError && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
}
