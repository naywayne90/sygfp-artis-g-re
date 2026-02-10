import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  Download, 
  Trash2, 
  Eye, 
  FileText, 
  File, 
  FileImage, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Grid,
  List,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useDocumentUpload, extractFilename } from "@/hooks/useDocumentUpload";
import { useDocumentPermissions } from "@/hooks/useDocumentPermissions";
import { useDocumentCompleteness } from "@/hooks/useDocumentCompleteness";
import { DocumentPreview } from "./DocumentPreview";
import { DocumentChecklist } from "./DocumentChecklist";

interface DossierGEDProps {
  entityType: string;
  entityId: string;
  dossierId?: string;
  reference: string;
  exercice?: number;
  etape?: string;
  showChecklist?: boolean;
  readOnly?: boolean;
  className?: string;
}

export function DossierGED({
  entityType,
  entityId,
  dossierId,
  reference,
  exercice,
  etape,
  showChecklist = true,
  readOnly = false,
  className,
}: DossierGEDProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedType, setSelectedType] = useState<string>('');
  const [previewDoc, setPreviewDoc] = useState<{ key: string; name: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Hooks
  const { 
    files, 
    isLoading, 
    upload, 
    uploadProgress, 
    isUploading, 
    deleteFile, 
    isDeleting,
    download,
    getPreviewUrl,
  } = useDocumentUpload({
    entityType,
    entityId,
    exercice,
    reference,
  });

  const { uploadableTypes, checkPermission } = useDocumentPermissions();
  
  const completeness = useDocumentCompleteness({
    dossierId,
    etape: etape || '',
    entityType,
    entityId,
  });

  // Handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!readOnly && selectedType) setIsDragging(true);
  }, [readOnly, selectedType]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (readOnly || !selectedType) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    for (const file of droppedFiles) {
      upload({ file, typePiece: selectedType, reference });
    }
  }, [readOnly, selectedType, upload, reference]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0 && selectedType) {
      for (const file of selectedFiles) {
        upload({ file, typePiece: selectedType, reference });
      }
    }
    e.target.value = '';
  };

  const handlePreview = async (key: string, name: string) => {
    setPreviewDoc({ key, name });
  };

  const handleDownload = (key: string, name: string) => {
    download(key, name);
  };

  const handleDelete = (key: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      deleteFile(key);
    }
  };

  // File icon helper
  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <FileImage className="h-5 w-5 text-blue-500" />;
    }
    if (ext === 'pdf') {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    return <File className="h-5 w-5 text-muted-foreground" />;
  };

  // Format file size
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium">Documents du dossier</h3>
          <Badge variant="secondary">{files.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Completeness indicator */}
      {showChecklist && etape && (
        <Card className={cn(
          "border-l-4",
          completeness.isComplete ? "border-l-green-500" : "border-l-amber-500"
        )}>
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {completeness.isComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                )}
                <span className="font-medium">
                  {completeness.isComplete 
                    ? "Tous les documents requis sont présents" 
                    : `${completeness.missingDocuments.length} document(s) manquant(s)`}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {completeness.totalProvided}/{completeness.totalRequired}
              </span>
            </div>
            {!completeness.isComplete && (
              <p className="text-sm text-muted-foreground mt-1">
                Manquants: {completeness.missingDocuments.join(", ")}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents">Documents ({files.length})</TabsTrigger>
          {showChecklist && etape && (
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          {/* Upload zone */}
          {!readOnly && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <option value="">Sélectionner le type de document...</option>
                  {uploadableTypes.map((type) => (
                    <option key={type.code} value={type.code}>
                      {type.label} {type.obligatoire ? "(obligatoire)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                  isDragging && "border-primary bg-primary/5",
                  !selectedType && "opacity-50 cursor-not-allowed",
                  selectedType && "cursor-pointer hover:border-primary/50"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => {
                  if (selectedType) {
                    document.getElementById("ged-file-input")?.click();
                  }
                }}
              >
                <input
                  id="ged-file-input"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={!selectedType}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                />
                {isUploading ? (
                  <div className="space-y-2">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <Progress value={uploadProgress} className="max-w-xs mx-auto" />
                    <p className="text-sm text-muted-foreground">Upload en cours... {uploadProgress}%</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-2">
                      {selectedType 
                        ? "Glissez vos fichiers ici ou cliquez pour parcourir" 
                        : "Sélectionnez d'abord un type de document"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, Images, Word, Excel (max 10 MB)
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Files list */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Aucun document</p>
            </div>
          ) : viewMode === 'list' ? (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {files.map((file) => {
                  const filename = extractFilename(file.key);
                  const canDelete = checkPermission('delete', '', true);
                  
                  return (
                    <Card key={file.key} className="bg-muted/30">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {getFileIcon(filename)}
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{filename}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatSize(file.size)} • {format(new Date(file.lastModified), "dd MMM yyyy HH:mm", { locale: fr })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePreview(file.key, filename)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownload(file.key, filename)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {!readOnly && canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(file.key)}
                              disabled={isDeleting}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {files.map((file) => {
                const filename = extractFilename(file.key);
                const canDelete = checkPermission('delete', '', true);
                
                return (
                  <Card 
                    key={file.key} 
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => handlePreview(file.key, filename)}
                  >
                    <CardContent className="p-3 text-center space-y-2">
                      <div className="h-12 flex items-center justify-center">
                        {getFileIcon(filename)}
                      </div>
                      <p className="text-sm font-medium truncate">{filename}</p>
                      <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                      <div className="flex justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(file.key, filename);
                          }}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        {!readOnly && canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(file.key);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {showChecklist && etape && (
          <TabsContent value="checklist">
            <DocumentChecklist
              documents={completeness.documents}
              onUpload={!readOnly ? (typeDocument, file) => {
                upload({ file, typePiece: typeDocument, reference });
              } : undefined}
              isUploading={isUploading}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Preview dialog */}
      {previewDoc && (
        <DocumentPreview
          fileKey={previewDoc.key}
          fileName={previewDoc.name}
          getPreviewUrl={getPreviewUrl}
          onClose={() => setPreviewDoc(null)}
          onDownload={() => handleDownload(previewDoc.key, previewDoc.name)}
        />
      )}
    </div>
  );
}
