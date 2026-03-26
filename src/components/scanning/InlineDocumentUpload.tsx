/**
 * InlineDocumentUpload — Upload avec un VRAI bouton visible
 *
 * Approche simple et fiable : un <label> qui enveloppe un bouton visible
 * avec un <input type="file"> a l'interieur du label.
 * Le navigateur ouvre nativement le file picker quand on clique sur le label.
 * Pas de hack CSS, pas de dropzone, pas de JavaScript pour ouvrir le picker.
 */

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Upload, CheckCircle2, Loader2, FileText, X, AlertCircle, Paperclip } from 'lucide-react';
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

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Reset input
      e.target.value = '';

      // Validate
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        setError('Format non accepté (PDF, JPG, PNG, GIF, WEBP)');
        toast.error('Format non accepté. Utilisez PDF, JPG, PNG, GIF ou WEBP.');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError('Trop volumineux (max 10 Mo)');
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
        const msg = err instanceof Error ? err.message : 'Erreur';
        setError(msg);
        toast.error(msg);
      } finally {
        setIsUploading(false);
      }
    },
    [documentId, engagementId, label, onUploadSuccess]
  );

  const inputId = `scan-file-${documentId}`;

  // Document deja fourni — affichage vert
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
          <button
            type="button"
            onClick={() => onRemove(documentId)}
            className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  // Document a fournir — avec VRAI bouton visible
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border',
        error ? 'border-destructive/50 bg-destructive/5' : 'border-muted-foreground/20 bg-muted/20',
        isUploading && 'opacity-70'
      )}
    >
      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{label}</span>
          {isObligatoire && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">
              Obligatoire
            </span>
          )}
        </div>
        {error && <p className="text-xs text-destructive mt-0.5">{error}</p>}
      </div>

      {/* VRAI bouton visible — le label enveloppe le bouton + l'input */}
      <label
        htmlFor={disabled || isUploading ? undefined : inputId}
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
          'bg-primary text-primary-foreground hover:bg-primary/90',
          'cursor-pointer select-none',
          (disabled || isUploading) && 'opacity-50 cursor-not-allowed'
        )}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Paperclip className="h-4 w-4" />
        )}
        {isUploading ? 'Envoi...' : 'Choisir'}
        <input
          id={inputId}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
          onChange={handleFileChange}
          disabled={disabled || isUploading}
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            opacity: 0,
            overflow: 'hidden',
            clip: 'rect(0,0,0,0)',
          }}
        />
      </label>
    </div>
  );
}
