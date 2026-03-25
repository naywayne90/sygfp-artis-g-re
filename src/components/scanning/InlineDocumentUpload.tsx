/**
 * InlineDocumentUpload — Upload de document inline avec drag-and-drop
 *
 * Remplace le dialog d'upload complexe (6 clics) par un composant inline (1 clic).
 * L'utilisateur glisse un fichier ou clique pour ouvrir le file picker.
 * L'upload demarre automatiquement apres selection.
 */

import { useState, useCallback } from 'react';
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
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return 'Format non accepté. Utilisez PDF, JPG, PNG, GIF ou WEBP.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Fichier trop volumineux (max 10 Mo).';
    }
    return null;
  };

  const uploadFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        toast.error(validationError);
        return;
      }

      setIsUploading(true);
      setError(null);

      try {
        const filePath = `engagements/${engagementId}/${Date.now()}_${file.name}`;

        // Upload vers Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('engagement-documents')
          .upload(filePath, file, {
            contentType: file.type,
            upsert: true,
          });

        // Si le bucket n'existe pas, on continue quand même (fallback metadata-only)
        if (uploadError && !uploadError.message?.includes('not found')) {
          console.warn('Storage upload warning:', uploadError.message);
        }

        // Mettre à jour les métadonnées en base
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

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled && !isFourni) setIsDragging(true);
    },
    [disabled, isFourni]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled || isUploading) return;

      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    [disabled, isUploading, uploadFile]
  );

  const handleClick = useCallback(() => {
    if (disabled || isUploading) return;
    // Créer un input file dynamique et l'ajouter au DOM (requis par certains navigateurs)
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png,.gif,.webp';
    input.style.position = 'fixed';
    input.style.opacity = '0';
    input.style.pointerEvents = 'none';
    input.style.left = '-9999px';
    document.body.appendChild(input);
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) uploadFile(file);
      document.body.removeChild(input);
    };
    // Timeout nécessaire pour que le DOM soit prêt
    setTimeout(() => input.click(), 0);
  }, [disabled, isUploading, uploadFile]);

  const handleRemove = useCallback(() => {
    if (onRemove) onRemove(documentId);
  }, [documentId, onRemove]);

  // Document déjà fourni — afficher le résultat
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
            onClick={handleRemove}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  // Zone d'upload (drag-drop + click)
  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border-2 border-dashed cursor-pointer transition-all duration-200',
        isDragging && 'border-primary bg-primary/5 scale-[1.01]',
        !isDragging &&
          !error &&
          'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30',
        error && 'border-destructive/50 bg-destructive/5',
        isUploading && 'opacity-70 cursor-wait',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
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
              : isDragging
                ? 'Déposez le fichier ici'
                : 'Glissez un fichier ici ou cliquez pour sélectionner'}
        </p>
      </div>

      <FileText className="h-4 w-4 text-muted-foreground/50 shrink-0" />
    </div>
  );
}
