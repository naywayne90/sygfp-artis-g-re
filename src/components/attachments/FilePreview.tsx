/**
 * FilePreview - Prévisualisation d'un fichier uploadé
 * Affiche nom, taille, icône selon type et bouton supprimer
 */

import { Button } from '@/components/ui/button';
import { FileText, Image, FileSpreadsheet, File, X, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  formatFileSize,
  truncateFilename,
  getFileIcon,
  type UploadedFile,
} from '@/hooks/useFileUpload';

interface FilePreviewProps {
  file: UploadedFile;
  onDelete?: () => void;
  onDownload?: () => void;
  isDeleting?: boolean;
  showDownload?: boolean;
  className?: string;
}

// Icônes selon le type de fichier
const FileIcons = {
  pdf: () => <FileText className="h-5 w-5 text-red-500" />,
  image: () => <Image className="h-5 w-5 text-blue-500" />,
  word: () => <FileText className="h-5 w-5 text-blue-600" />,
  excel: () => <FileSpreadsheet className="h-5 w-5 text-green-600" />,
  document: () => <File className="h-5 w-5 text-gray-500" />,
};

export function FilePreview({
  file,
  onDelete,
  onDownload,
  isDeleting = false,
  showDownload = false,
  className,
}: FilePreviewProps) {
  const iconType = getFileIcon(file.mimeType);
  const IconComponent = FileIcons[iconType];

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border bg-muted/30',
        'transition-colors hover:bg-muted/50',
        isDeleting && 'opacity-50',
        className
      )}
    >
      {/* Icône selon type */}
      <div className="flex-shrink-0">
        <IconComponent />
      </div>

      {/* Informations du fichier */}
      <div className="flex-1 min-w-0">
        <p
          className="font-medium text-sm truncate"
          title={file.originalName}
        >
          {truncateFilename(file.originalName, 30)}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(file.size)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {showDownload && onDownload && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={onDownload}
            disabled={isDeleting}
            title="Télécharger"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}

        {onDelete && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50"
            onClick={onDelete}
            disabled={isDeleting}
            title="Supprimer"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
