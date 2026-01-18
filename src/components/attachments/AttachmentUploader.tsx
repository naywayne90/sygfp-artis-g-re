/**
 * AttachmentUploader - Composant d'upload de pièces jointes
 *
 * Fonctionnalités:
 * - Drag & Drop
 * - Multi-fichiers
 * - Validation en temps réel
 * - Barre de progression
 */

import { useState, useRef, useCallback } from "react";
import { Upload, X, FileText, Image, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  useAttachmentUpload,
  type FileWithPreview,
} from "@/hooks/useAttachments";
import { AttachmentService, type AttachmentStep } from "@/services/attachmentService";

interface AttachmentUploaderProps {
  dossierRef: string;
  step: AttachmentStep;
  entityId?: string;
  onUploadComplete?: (successCount: number, failedCount: number) => void;
  maxFiles?: number;
  className?: string;
  compact?: boolean;
}

export function AttachmentUploader({
  dossierRef,
  step,
  entityId,
  onUploadComplete,
  maxFiles = 10,
  className,
  compact = false,
}: AttachmentUploaderProps) {
  const { upload, isUploading, progress, validate } = useAttachmentUpload(
    dossierRef,
    step,
    entityId
  );

  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation et ajout de fichiers
  const handleFilesSelected = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);

      // Limiter le nombre de fichiers
      const remaining = maxFiles - selectedFiles.length;
      const filesToAdd = fileArray.slice(0, remaining);

      const newFiles: FileWithPreview[] = filesToAdd.map((file) => {
        const validation = validate(file);
        const isImage = AttachmentService.isImage(file.type);

        return {
          file,
          preview: isImage ? URL.createObjectURL(file) : undefined,
          error: validation.valid ? undefined : validation.error,
        };
      });

      setSelectedFiles((prev) => [...prev, ...newFiles]);
    },
    [maxFiles, selectedFiles.length, validate]
  );

  // Drag & Drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (e.dataTransfer.files?.length > 0) {
        handleFilesSelected(e.dataTransfer.files);
      }
    },
    [handleFilesSelected]
  );

  // Input file change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        handleFilesSelected(e.target.files);
      }
      // Reset input pour permettre de re-sélectionner le même fichier
      e.target.value = "";
    },
    [handleFilesSelected]
  );

  // Supprimer un fichier de la sélection
  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => {
      const file = prev[index];
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // Lancer l'upload
  const handleUpload = useCallback(async () => {
    const validFiles = selectedFiles.filter((f) => !f.error).map((f) => f.file);

    if (validFiles.length === 0) return;

    const result = await upload(validFiles);

    // Nettoyer les previews
    selectedFiles.forEach((f) => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });

    setSelectedFiles([]);
    onUploadComplete?.(result.successCount, result.failedCount);
  }, [selectedFiles, upload, onUploadComplete]);

  const validFilesCount = selectedFiles.filter((f) => !f.error).length;
  const hasErrors = selectedFiles.some((f) => f.error);

  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept={AttachmentService.getAcceptedExtensions()}
          onChange={handleInputChange}
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="gap-2"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          Ajouter des fichiers
        </Button>

        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            {selectedFiles.map((f, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-2 text-sm p-2 rounded border",
                  f.error ? "border-destructive bg-destructive/5" : "border-border"
                )}
              >
                {f.error ? (
                  <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                ) : (
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className="truncate flex-1">{f.file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeFile(i)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}

            {isUploading && (
              <Progress value={progress} className="h-2" />
            )}

            <Button
              type="button"
              size="sm"
              onClick={handleUpload}
              disabled={isUploading || validFilesCount === 0}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Téléversement... {progress}%
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Téléverser {validFilesCount} fichier(s)
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Zone de drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50",
          isUploading && "opacity-50 pointer-events-none"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept={AttachmentService.getAcceptedExtensions()}
          onChange={handleInputChange}
        />

        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />

        <p className="text-lg font-medium mb-1">
          {isDragOver
            ? "Déposez les fichiers ici"
            : "Glissez-déposez vos fichiers ici"}
        </p>

        <p className="text-sm text-muted-foreground mb-4">ou</p>

        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          Sélectionner des fichiers
        </Button>

        <p className="text-xs text-muted-foreground mt-4">
          PDF, Word, Excel, Images • Max 10 Mo par fichier • Jusqu'à {maxFiles}{" "}
          fichiers
        </p>
      </div>

      {/* Liste des fichiers sélectionnés */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">
              Fichiers sélectionnés ({selectedFiles.length})
            </h4>
            {hasErrors && (
              <Badge variant="destructive">
                {selectedFiles.filter((f) => f.error).length} erreur(s)
              </Badge>
            )}
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {selectedFiles.map((fileItem, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border",
                  fileItem.error
                    ? "border-destructive bg-destructive/5"
                    : "border-border bg-muted/30"
                )}
              >
                {/* Preview ou icône */}
                {fileItem.preview ? (
                  <img
                    src={fileItem.preview}
                    alt={fileItem.file.name}
                    className="h-10 w-10 object-cover rounded"
                  />
                ) : (
                  <div className="h-10 w-10 flex items-center justify-center bg-muted rounded">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}

                {/* Infos fichier */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {fileItem.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {AttachmentService.formatFileSize(fileItem.file.size)}
                  </p>
                  {fileItem.error && (
                    <p className="text-xs text-destructive mt-1">
                      {fileItem.error}
                    </p>
                  )}
                </div>

                {/* Statut */}
                {fileItem.error ? (
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                )}

                {/* Bouton supprimer */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Barre de progression */}
          {isUploading && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">
                Téléversement en cours... {progress}%
              </p>
            </div>
          )}

          {/* Bouton upload */}
          <Button
            type="button"
            onClick={handleUpload}
            disabled={isUploading || validFilesCount === 0}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Téléversement en cours...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Téléverser {validFilesCount} fichier(s)
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

export default AttachmentUploader;
