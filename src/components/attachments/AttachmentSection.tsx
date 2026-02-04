// @ts-nocheck
/**
 * AttachmentSection - Composant combiné pour les formulaires
 *
 * Combine AttachmentUploader et AttachmentList pour une intégration
 * facile dans les formulaires de la chaîne de dépense.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Paperclip, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AttachmentUploader } from "./AttachmentUploader";
import { AttachmentList } from "./AttachmentList";
import { AttachmentPreviewDialog } from "./AttachmentPreviewDialog";
import { useAttachments, type UseAttachmentsOptions } from "@/hooks/useAttachments";
import type { AttachmentMetadata } from "@/services/attachmentService";

// ============================================
// TYPES
// ============================================

export interface AttachmentSectionProps extends UseAttachmentsOptions {
  /** Titre de la section */
  title?: string;
  /** Description optionnelle */
  description?: string;
  /** Mode lecture seule (pas d'upload ni suppression) */
  readOnly?: boolean;
  /** Permet la suppression */
  allowDelete?: boolean;
  /** Types de pièces autorisés */
  allowedTypes?: string[];
  /** Collapsible */
  collapsible?: boolean;
  /** État initial (ouvert/fermé) */
  defaultOpen?: boolean;
  /** Affichage compact */
  compact?: boolean;
  /** Classe CSS additionnelle */
  className?: string;
  /** Callback après upload réussi */
  onUploadComplete?: (count: number) => void;
  /** Callback après suppression */
  onDeleteComplete?: () => void;
}

// ============================================
// COMPOSANT
// ============================================

export function AttachmentSection({
  title = "Pièces jointes",
  description,
  readOnly = false,
  allowDelete = true,
  allowedTypes,
  collapsible = false,
  defaultOpen = true,
  compact = false,
  className,
  onUploadComplete,
  onDeleteComplete,
  ...attachmentOptions
}: AttachmentSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentMetadata | null>(null);

  const {
    attachments,
    totalCount,
    isLoading,
    isUploading,
    isDeleting,
    uploadState,
    upload,
    deleteAttachment,
    getPreviewUrl,
    formatFileSize,
    isImage,
    isPdf,
    getFileIcon,
    getAcceptedExtensions,
  } = useAttachments(attachmentOptions);

  // Handlers
  const handleUpload = async (files: File[]) => {
    const result = await upload(files);
    if (result.successCount > 0 && onUploadComplete) {
      onUploadComplete(result.successCount);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteAttachment(id);
    if (onDeleteComplete) {
      onDeleteComplete();
    }
  };

  const handlePreview = (attachment: AttachmentMetadata) => {
    setPreviewAttachment(attachment);
  };

  // Filtrage par type si spécifié
  const filteredAttachments = allowedTypes
    ? attachments.filter((att) => !att.type_piece || allowedTypes.includes(att.type_piece))
    : attachments;

  // Header avec toggle
  const renderHeader = () => (
    <CardHeader
      className={cn(
        "pb-2",
        collapsible && "cursor-pointer select-none",
        compact && "py-3"
      )}
      onClick={collapsible ? () => setIsOpen(!isOpen) : undefined}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-muted-foreground" />
          <CardTitle className={cn("text-base", compact && "text-sm")}>
            {title}
          </CardTitle>
          {totalCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {totalCount}
            </Badge>
          )}
        </div>
        {collapsible && (
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
      {description && isOpen && (
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      )}
    </CardHeader>
  );

  // Contenu
  const renderContent = () => {
    if (!isOpen) return null;

    return (
      <CardContent className={cn("space-y-4", compact && "pt-0")}>
        {/* Uploader */}
        {!readOnly && (
          <AttachmentUploader
            onUpload={handleUpload}
            isUploading={isUploading}
            uploadState={uploadState}
            compact={compact}
            disabled={isUploading || isDeleting}
          />
        )}

        {/* Liste des fichiers */}
        <AttachmentList
          attachments={filteredAttachments}
          isLoading={isLoading}
          isDeleting={isDeleting}
          onDelete={!readOnly && allowDelete ? handleDelete : undefined}
          onPreview={handlePreview}
          formatFileSize={formatFileSize}
          isImage={isImage}
          isPdf={isPdf}
          getFileIcon={getFileIcon}
          compact={compact}
          emptyMessage={
            readOnly
              ? "Aucune pièce jointe"
              : "Aucun fichier. Glissez-déposez ou cliquez pour ajouter."
          }
        />
      </CardContent>
    );
  };

  return (
    <>
      <Card className={cn("overflow-hidden", className)}>
        {renderHeader()}
        {renderContent()}
      </Card>

      {/* Dialog de preview */}
      <AttachmentPreviewDialog
        attachment={previewAttachment}
        open={!!previewAttachment}
        onOpenChange={(open) => !open && setPreviewAttachment(null)}
        getPreviewUrl={getPreviewUrl}
        isImage={isImage}
        isPdf={isPdf}
      />
    </>
  );
}

export default AttachmentSection;
