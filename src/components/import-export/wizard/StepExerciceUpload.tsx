import { useCallback, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileSpreadsheet, X, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepExerciceUploadProps {
  selectedExercice: number;
  onExerciceChange: (exercice: number) => void;
  file: File | null;
  onFileUpload: (file: File) => void;
}

export function StepExerciceUpload({
  selectedExercice,
  onExerciceChange,
  file,
  onFileUpload,
}: StepExerciceUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      onFileUpload(droppedFile);
    }
  }, [onFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onFileUpload(selectedFile);
    }
  }, [onFileUpload]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Exercice selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Exercice budgétaire</CardTitle>
          <CardDescription>
            Sélectionnez l'exercice pour lequel vous souhaitez importer le budget
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs">
            <Label htmlFor="exercice">Exercice</Label>
            <Select
              value={String(selectedExercice)}
              onValueChange={(v) => onExerciceChange(parseInt(v))}
            >
              <SelectTrigger id="exercice" className="mt-1.5">
                <SelectValue placeholder="Sélectionner l'exercice" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year} {year === currentYear && "(actif)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* File upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fichier Excel</CardTitle>
          <CardDescription>
            Glissez-déposez votre fichier Excel ou cliquez pour parcourir
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              )}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Upload className={cn(
                "h-12 w-12 mx-auto mb-4",
                isDragging ? "text-primary" : "text-muted-foreground"
              )} />
              <p className="text-lg font-medium text-foreground">
                {isDragging ? "Déposez le fichier ici" : "Glissez-déposez votre fichier Excel"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                ou cliquez pour parcourir (formats: .xlsx, .xls)
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="flex-shrink-0">
                <FileSpreadsheet className="h-10 w-10 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="font-medium truncate">{file.name}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Reset file - parent should handle this
                }}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
