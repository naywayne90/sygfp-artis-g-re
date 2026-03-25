/**
 * InlineDocumentUpload — Upload inline avec react-dropzone
 *
 * Utilise react-dropzone (deja installe) pour un file picker fiable
 * dans tous les navigateurs + drag-and-drop.
 */

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { Upload, CheckCircle2, Loader2, FileText, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from '@/hooks/useEngagementDocuments';

interface InlineDocumentUploadProps {
  documentId: string;
  engagementId: string;
  label: string;
  isObligatoire: boolean;
  isFourni: boolean;
  fileName?: string | null;
  uploadedAt?: string | null;
  onUploadSuccess: (
    documentId: string,
    filePath: string,
    fileName: string,
    fileSize: number,
    fileType: string
  ) => void;
  onRemove?: (documentId: string) => void;
  disabled?: boolean;
}

export function InlineDocumentUpload({
  documentId,
  engagementId,
  label,
  isObligatoire,
  isFourni,
  fileName,
  uploadedAt,
  onUploadSuccess,
  onRemove,
  disabled = false,
}: InlineDocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (file.size > MAX_FILE_SIZE) {
        setError('Fichier trop volumineux (max 10 Mo).');
        toast.error('Fichier trop volumineux (max 10 Mo).');
        return;
      }

      setIsUploading(true);
      setError(null);

      try {
        const filePath = `engagements/${engagementId}/${Date.now()}_${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from('engagement-documents')
          .upload(filePath, file, { contentType: file.type, upsert: true });

        if (uploadError && !uploadError.message?.includes('not found')) {
          console.warn('Storage upload warning:', uploadError.message);
        }

        onUploadSuccess(documentId, filePath, file.name, file.size, file.type);
        toast.success(`${label} ajouté`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur lors du téléversement';
        setError(msg);
        toast.error(msg);
      } finally {
        setIsUploading(false);
      }
    },
    [documentId, engagementId, label, onUploadSuccess]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    multiple: false,
    disabled: disabled || isUploading || isFourni,
    noKeyboard: true,
  });

  // Document deja fourni
  if (isFourni) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border border-green-200 bg-green-50/50">
        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{label}</span>
            {isObligatoire && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                Obligatoire
              </span>
            )}
          </div>
          {fileName && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {fileName}
              {uploadedAt && ` — ${new Date(uploadedAt).toLocaleDateString('fr-FR')}`}
            </p>
          )}
        </div>
        {onRemove && !disabled && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(documentId)}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  // Zone d'upload avec react-dropzone
  return (
    <div
      {...getRootProps()}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border-2 border-dashed cursor-pointer transition-all duration-200',
        isDragActive && 'border-primary bg-primary/5 scale-[1.01]',
        !isDragActive &&
          !error &&
          'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30',
        error && 'border-destructive/50 bg-destructive/5',
        isUploading && 'opacity-70 cursor-wait',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <input {...getInputProps()} />

      {isUploading ? (
        <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
      ) : error ? (
        <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
      ) : (
        <Upload className="h-5 w-5 text-muted-foreground shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{label}</span>
          {isObligatoire && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">
              Obligatoire
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isUploading
            ? 'Téléversement en cours...'
            : error
              ? error
              : isDragActive
                ? 'Déposez le fichier ici'
                : 'Glissez un fichier ici ou cliquez pour sélectionner'}
        </p>
      </div>

      <FileText className="h-4 w-4 text-muted-foreground/50 shrink-0" />
    </div>
  );
}
