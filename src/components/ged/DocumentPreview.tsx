import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Download, ExternalLink, FileText, File } from "lucide-react";

interface DocumentPreviewProps {
  fileKey: string;
  fileName: string;
  getPreviewUrl: (key: string) => Promise<string | null>;
  onClose: () => void;
  onDownload: () => void;
}

export function DocumentPreview({
  fileKey,
  fileName,
  getPreviewUrl,
  onClose,
  onDownload,
}: DocumentPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension);
  const isPdf = extension === 'pdf';
  const isPreviewable = isImage || isPdf;

  useEffect(() => {
    const loadPreview = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const url = await getPreviewUrl(fileKey);
        if (url) {
          setPreviewUrl(url);
        } else {
          setError("Impossible de charger l'aperçu");
        }
      } catch (err) {
        setError("Erreur lors du chargement");
      } finally {
        setIsLoading(false);
      }
    };

    loadPreview();
  }, [fileKey, getPreviewUrl]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {fileName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
              <File className="h-16 w-16 mb-4 opacity-50" />
              <p>{error}</p>
            </div>
          ) : !isPreviewable ? (
            <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
              <File className="h-16 w-16 mb-4 opacity-50" />
              <p className="mb-4">Aperçu non disponible pour ce type de fichier</p>
              <p className="text-sm">Type: {extension.toUpperCase()}</p>
            </div>
          ) : isImage && previewUrl ? (
            <div className="flex items-center justify-center h-full p-4">
              <img
                src={previewUrl}
                alt={fileName}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          ) : isPdf && previewUrl ? (
            <iframe
              src={previewUrl}
              className="w-full h-[70vh] rounded-lg border"
              title={fileName}
            />
          ) : null}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          {previewUrl && (
            <Button
              variant="outline"
              onClick={() => window.open(previewUrl, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Ouvrir dans un nouvel onglet
            </Button>
          )}
          <Button onClick={onDownload}>
            <Download className="h-4 w-4 mr-2" />
            Télécharger
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
