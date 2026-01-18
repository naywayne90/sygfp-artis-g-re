/**
 * AttachmentPreviewDialog - Dialog de prévisualisation des fichiers
 *
 * Supporte:
 * - Images (PNG, JPG, GIF, WebP)
 * - PDF (via iframe)
 */

import { Download, X, ExternalLink, ZoomIn, ZoomOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { AttachmentService, type AttachmentMetadata } from "@/services/attachmentService";

interface AttachmentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attachment: AttachmentMetadata;
  previewUrl: string;
  onDownload?: () => void;
}

export function AttachmentPreviewDialog({
  open,
  onOpenChange,
  attachment,
  previewUrl,
  onDownload,
}: AttachmentPreviewDialogProps) {
  const [zoom, setZoom] = useState(1);
  const isImage = AttachmentService.isImage(attachment.content_type);
  const isPdf = AttachmentService.isPdf(attachment.content_type);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));

  const handleOpenInNewTab = () => {
    window.open(previewUrl, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-none">
          <DialogTitle className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-3 min-w-0">
              <span className="truncate">{attachment.original_name}</span>
              <Badge variant="outline" className="shrink-0">
                {AttachmentService.formatFileSize(attachment.size)}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center justify-between border-b pb-2 flex-none">
          <div className="flex items-center gap-2">
            {isImage && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Ouvrir
            </Button>
            <Button variant="outline" size="sm" onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-auto min-h-0 bg-muted/30 rounded-lg">
          {isImage && (
            <div className="flex items-center justify-center p-4 min-h-[400px]">
              <img
                src={previewUrl}
                alt={attachment.original_name}
                className="max-w-full max-h-full object-contain transition-transform"
                style={{ transform: `scale(${zoom})` }}
              />
            </div>
          )}

          {isPdf && (
            <iframe
              src={previewUrl}
              className="w-full h-[600px] border-0"
              title={attachment.original_name}
            />
          )}

          {!isImage && !isPdf && (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
              <p className="text-lg mb-4">
                Prévisualisation non disponible pour ce type de fichier
              </p>
              <Button onClick={onDownload}>
                <Download className="h-4 w-4 mr-2" />
                Télécharger le fichier
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AttachmentPreviewDialog;
