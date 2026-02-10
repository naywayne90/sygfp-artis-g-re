/**
 * FilePreview - Prévisualisation de fichiers (PDF/images) avec contrôle type/poids
 */

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  Image as ImageIcon, 
  File, 
  Eye, 
  Trash2,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  FileType
} from "lucide-react";
import { cn } from "@/lib/utils";

// Configuration des types de fichiers acceptés
export const FILE_CONFIG = {
  maxSize: 10 * 1024 * 1024, // 10MB
  maxSizeLabel: "10 Mo",
  allowedTypes: [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  allowedExtensions: [".pdf", ".jpg", ".jpeg", ".png", ".gif", ".webp", ".doc", ".docx", ".xls", ".xlsx"],
};

export interface UploadedFile {
  file: File;
  preview?: string;
  error?: string;
  progress?: number;
  uploaded?: boolean;
}

// Obtenir l'icône selon le type MIME
function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) {
    return <ImageIcon className="h-5 w-5 text-blue-500" />;
  }
  if (mimeType === "application/pdf") {
    return <FileText className="h-5 w-5 text-red-500" />;
  }
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) {
    return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
  }
  if (mimeType.includes("word") || mimeType.includes("document")) {
    return <FileType className="h-5 w-5 text-blue-600" />;
  }
  return <File className="h-5 w-5 text-muted-foreground" />;
}

// Formater la taille du fichier
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

// Vérifier si le fichier est valide
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Vérifier la taille
  if (file.size > FILE_CONFIG.maxSize) {
    return { 
      valid: false, 
      error: `Le fichier dépasse ${FILE_CONFIG.maxSizeLabel}` 
    };
  }
  
  // Vérifier le type MIME
  if (!FILE_CONFIG.allowedTypes.includes(file.type)) {
    // Vérifier aussi par extension
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!FILE_CONFIG.allowedExtensions.includes(ext)) {
      return { 
        valid: false, 
        error: "Type de fichier non autorisé" 
      };
    }
  }
  
  return { valid: true };
}

// Composant pour un fichier individuel
interface FileItemProps {
  file: UploadedFile;
  index: number;
  onRemove: (index: number) => void;
  onPreview: (file: UploadedFile) => void;
  disabled?: boolean;
}

export function FileItem({ file, index, onRemove, onPreview, disabled }: FileItemProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const isImage = file.file.type.startsWith("image/");
  const isPdf = file.file.type === "application/pdf";
  
  // Générer preview pour les images
  useEffect(() => {
    if (isImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file.file);
    }
    return () => setPreview(null);
  }, [file.file, isImage]);

  const hasError = !!file.error;
  
  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-colors",
        hasError 
          ? "bg-destructive/10 border-destructive/30" 
          : file.uploaded 
            ? "bg-green-50 dark:bg-green-950/20 border-green-200"
            : "bg-muted/50 hover:bg-muted"
      )}
    >
      {/* Thumbnail ou icône */}
      <div className="shrink-0 w-12 h-12 rounded overflow-hidden flex items-center justify-center bg-background border">
        {isImage && preview ? (
          <img 
            src={preview} 
            alt={file.file.name} 
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => onPreview(file)}
          />
        ) : (
          getFileIcon(file.file.type)
        )}
      </div>
      
      {/* Infos fichier */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" title={file.file.name}>
          {file.file.name}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatFileSize(file.file.size)}</span>
          {hasError ? (
            <Badge variant="destructive" className="text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              {file.error}
            </Badge>
          ) : file.uploaded ? (
            <Badge variant="default" className="bg-green-500 text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Uploadé
            </Badge>
          ) : file.progress !== undefined && file.progress < 100 ? (
            <div className="flex items-center gap-2 flex-1">
              <Progress value={file.progress} className="h-1.5 flex-1" />
              <span>{file.progress}%</span>
            </div>
          ) : null}
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {(isImage || isPdf) && !hasError && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPreview(file)}
            title="Prévisualiser"
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onRemove(index)}
          disabled={disabled}
          title="Supprimer"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Dialog de prévisualisation
interface FilePreviewDialogProps {
  file: UploadedFile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FilePreviewDialog({ file, open, onOpenChange }: FilePreviewDialogProps) {
  const [preview, setPreview] = useState<string | null>(null);
  
  useEffect(() => {
    if (file && open) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file.file);
    } else {
      setPreview(null);
    }
  }, [file, open]);

  if (!file) return null;
  
  const isImage = file.file.type.startsWith("image/");
  const isPdf = file.file.type === "application/pdf";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getFileIcon(file.file.type)}
            <span className="truncate">{file.file.name}</span>
            <Badge variant="secondary">{formatFileSize(file.file.size)}</Badge>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh]">
          {isImage && preview && (
            <img 
              src={preview} 
              alt={file.file.name}
              className="max-w-full h-auto rounded-lg mx-auto"
            />
          )}
          
          {isPdf && preview && (
            <iframe
              src={preview}
              className="w-full h-[60vh] rounded-lg border"
              title={file.file.name}
            />
          )}
          
          {!isImage && !isPdf && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              {getFileIcon(file.file.type)}
              <p className="mt-2">Prévisualisation non disponible</p>
              <p className="text-sm">Téléchargez le fichier pour le visualiser</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Liste complète des fichiers
interface FileListProps {
  files: UploadedFile[];
  onRemove: (index: number) => void;
  disabled?: boolean;
  showStats?: boolean;
}

export function FileList({ files, onRemove, disabled, showStats = true }: FileListProps) {
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  
  if (files.length === 0) return null;
  
  const totalSize = files.reduce((sum, f) => sum + f.file.size, 0);
  const validFiles = files.filter(f => !f.error).length;
  const errorFiles = files.filter(f => !!f.error).length;

  return (
    <div className="space-y-3">
      {showStats && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {validFiles} fichier(s) • {formatFileSize(totalSize)}
          </span>
          {errorFiles > 0 && (
            <Badge variant="destructive">
              {errorFiles} erreur(s)
            </Badge>
          )}
        </div>
      )}
      
      <div className="space-y-2">
        {files.map((file, index) => (
          <FileItem
            key={`${file.file.name}-${index}`}
            file={file}
            index={index}
            onRemove={onRemove}
            onPreview={setPreviewFile}
            disabled={disabled}
          />
        ))}
      </div>
      
      <FilePreviewDialog
        file={previewFile}
        open={!!previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
      />
    </div>
  );
}

export default FileList;
