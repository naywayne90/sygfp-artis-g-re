/**
 * AttachmentList - Affichage et gestion des pièces jointes
 *
 * Fonctionnalités:
 * - Liste des fichiers avec preview
 * - Téléchargement via URL signée
 * - Suppression (si autorisé)
 * - Groupement par type
 */

import { useState, useCallback } from "react";
import {
  FileText,
  Image,
  Download,
  Trash2,
  File,
  Table,
  Presentation,
  Archive,
  Loader2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAttachments } from "@/hooks/useAttachments";
import { type AttachmentMetadata, type AttachmentStep } from "@/services/attachmentService";
import { AttachmentPreviewDialog } from "./AttachmentPreviewDialog";

interface AttachmentListProps {
  dossierRef?: string;
  step?: AttachmentStep;
  entityId?: string;
  showHeader?: boolean;
  showDelete?: boolean;
  groupByType?: boolean;
  maxHeight?: string;
  className?: string;
  emptyMessage?: string;
}

export function AttachmentList({
  dossierRef,
  step,
  entityId,
  showHeader = true,
  showDelete = true,
  groupByType = false,
  maxHeight = "400px",
  className,
  emptyMessage = "Aucune pièce jointe",
}: AttachmentListProps) {
  const {
    attachments,
    attachmentsByType,
    isLoading,
    isDeleting,
    deleteAttachment,
    download,
    getPreviewUrl,
    formatFileSize,
    isImage,
    isPdf,
  } = useAttachments({ dossierRef, step, entityId });

  const [previewAttachment, setPreviewAttachment] = useState<AttachmentMetadata | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Ouvrir la preview
  const handlePreview = useCallback(
    async (attachment: AttachmentMetadata) => {
      if (!isImage(attachment.content_type) && !isPdf(attachment.content_type)) {
        // Pas de preview, télécharger directement
        download(attachment);
        return;
      }

      setLoadingPreview(true);
      const url = await getPreviewUrl(attachment.storage_path);
      setLoadingPreview(false);

      if (url) {
        setPreviewUrl(url);
        setPreviewAttachment(attachment);
      }
    },
    [isImage, isPdf, download, getPreviewUrl]
  );

  // Fermer la preview
  const closePreview = useCallback(() => {
    setPreviewAttachment(null);
    setPreviewUrl(null);
  }, []);

  // Icône selon le type de fichier
  const getIcon = (contentType: string) => {
    if (isImage(contentType)) return Image;
    if (isPdf(contentType)) return FileText;
    if (contentType.includes("word") || contentType.includes("document"))
      return FileText;
    if (contentType.includes("excel") || contentType.includes("spreadsheet"))
      return Table;
    if (contentType.includes("powerpoint") || contentType.includes("presentation"))
      return Presentation;
    if (contentType.includes("zip") || contentType.includes("rar"))
      return Archive;
    return File;
  };

  // Rendu d'un item
  const renderAttachmentItem = (attachment: AttachmentMetadata) => {
    const Icon = getIcon(attachment.content_type);
    const canPreview =
      isImage(attachment.content_type) || isPdf(attachment.content_type);

    return (
      <div
        key={attachment.id}
        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
      >
        {/* Icône */}
        <div className="h-10 w-10 flex items-center justify-center bg-muted rounded shrink-0">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Infos */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate" title={attachment.original_name}>
            {attachment.original_name}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatFileSize(attachment.size)}</span>
            <span>•</span>
            <span>
              {format(new Date(attachment.uploaded_at), "dd MMM yyyy", {
                locale: fr,
              })}
            </span>
            {attachment.type_piece && (
              <>
                <span>•</span>
                <Badge variant="outline" className="text-xs py-0">
                  {attachment.type_piece}
                </Badge>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <TooltipProvider>
            {canPreview && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handlePreview(attachment)}
                    disabled={loadingPreview}
                  >
                    {loadingPreview ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Aperçu</TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => download(attachment)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Télécharger</TooltipContent>
            </Tooltip>

            {showDelete && attachment.id && (
              <AlertDialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Supprimer</TooltipContent>
                </Tooltip>

                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                    <AlertDialogDescription>
                      Voulez-vous vraiment supprimer le fichier "
                      {attachment.original_name}" ? Cette action est irréversible.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteAttachment(attachment.id!)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </TooltipProvider>
        </div>
      </div>
    );
  };

  // Contenu principal
  const content = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (attachments.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <FileText className="h-8 w-8 mb-2" />
          <p>{emptyMessage}</p>
        </div>
      );
    }

    if (groupByType) {
      return (
        <div className="space-y-4">
          {Object.entries(attachmentsByType).map(([type, items]) => (
            <div key={type}>
              <h4 className="font-medium text-sm mb-2 text-muted-foreground">
                {type} ({items.length})
              </h4>
              <div className="space-y-2">
                {items.map(renderAttachmentItem)}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-2">{attachments.map(renderAttachmentItem)}</div>
    );
  };

  return (
    <Card className={cn("", className)}>
      {showHeader && (
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Pièces jointes
          </CardTitle>
          <CardDescription>
            {attachments.length} fichier(s) •{" "}
            {formatFileSize(
              attachments.reduce((sum, a) => sum + a.size, 0)
            )}
          </CardDescription>
        </CardHeader>
      )}

      <CardContent>
        <ScrollArea style={{ maxHeight }} className="pr-4">
          {content()}
        </ScrollArea>
      </CardContent>

      {/* Dialog de preview */}
      {previewAttachment && previewUrl && (
        <AttachmentPreviewDialog
          open={!!previewAttachment}
          onOpenChange={(open) => !open && closePreview()}
          attachment={previewAttachment}
          previewUrl={previewUrl}
          onDownload={() => download(previewAttachment)}
        />
      )}
    </Card>
  );
}

export default AttachmentList;
