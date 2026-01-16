import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Upload, X, FileText, Eye, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DocumentType {
  code: string;
  label: string;
  obligatoire: boolean;
}

export interface UploadedDocument {
  id?: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  file_type?: string;
}

interface DocumentUploadProps {
  documentTypes: DocumentType[];
  documents: UploadedDocument[];
  onDocumentsChange: (documents: UploadedDocument[]) => void;
  onUpload?: (file: File, documentType: string) => Promise<{ path: string; name: string }>;
  disabled?: boolean;
  className?: string;
}

export function DocumentUpload({
  documentTypes,
  documents,
  onDocumentsChange,
  onUpload,
  disabled = false,
  className,
}: DocumentUploadProps) {
  const [selectedType, setSelectedType] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || !selectedType) return;

    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  }, [disabled, selectedType]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0 && selectedType) {
      await processFiles(files);
    }
    e.target.value = "";
  };

  const processFiles = async (files: File[]) => {
    if (!selectedType) return;

    setIsUploading(true);
    try {
      for (const file of files) {
        let path = URL.createObjectURL(file); // Fallback local preview
        let name = file.name;

        if (onUpload) {
          const result = await onUpload(file, selectedType);
          path = result.path;
          name = result.name;
        }

        const newDoc: UploadedDocument = {
          document_type: selectedType,
          file_name: name,
          file_path: path,
          file_size: file.size,
          file_type: file.type,
        };

        onDocumentsChange([...documents, newDoc]);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const removeDocument = (index: number) => {
    const newDocs = [...documents];
    newDocs.splice(index, 1);
    onDocumentsChange(newDocs);
  };

  const getTypeLabel = (code: string) => {
    return documentTypes.find((t) => t.code === code)?.label || code;
  };

  const isTypeComplete = (code: string) => {
    return documents.some((d) => d.document_type === code);
  };

  const requiredTypes = documentTypes.filter((t) => t.obligatoire);
  const missingRequired = requiredTypes.filter((t) => !isTypeComplete(t.code));

  return (
    <div className={cn("space-y-4", className)}>
      {/* Type selector + Drop zone */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Type de document</Label>
          <Select value={selectedType} onValueChange={setSelectedType} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un type..." />
            </SelectTrigger>
            <SelectContent>
              {documentTypes.map((type) => (
                <SelectItem key={type.code} value={type.code}>
                  <div className="flex items-center gap-2">
                    {type.label}
                    {type.obligatoire && (
                      <Badge variant="destructive" className="text-xs">
                        Obligatoire
                      </Badge>
                    )}
                    {isTypeComplete(type.code) && (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer",
            isDragging && "border-primary bg-primary/5",
            !selectedType && "opacity-50 cursor-not-allowed",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (selectedType && !disabled) {
              document.getElementById("document-upload-input")?.click();
            }
          }}
        >
          <input
            id="document-upload-input"
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            disabled={disabled || !selectedType}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          />
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Upload en cours...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {selectedType ? "Glissez ou cliquez pour ajouter" : "Sélectionnez un type d'abord"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Missing required docs warning */}
      {missingRequired.length > 0 && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
          <strong>Documents obligatoires manquants :</strong>{" "}
          {missingRequired.map((t) => t.label).join(", ")}
        </div>
      )}

      {/* Uploaded documents list */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <Label>Documents ajoutés ({documents.length})</Label>
          <div className="grid gap-2">
            {documents.map((doc, index) => (
              <Card key={index} className="bg-muted/50">
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm truncate max-w-[200px]">
                        {doc.file_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getTypeLabel(doc.document_type)}
                        {doc.file_size && ` • ${(doc.file_size / 1024).toFixed(1)} KB`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.file_path && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(doc.file_path, "_blank")}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {!disabled && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeDocument(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
