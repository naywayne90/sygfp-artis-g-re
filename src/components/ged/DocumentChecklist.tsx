import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Circle, 
  Upload, 
  FileText,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DocumentStatus } from "@/hooks/useDocumentCompleteness";

interface DocumentChecklistProps {
  documents: DocumentStatus[];
  onUpload?: (typeDocument: string, file: File) => void;
  isUploading?: boolean;
  className?: string;
}

export function DocumentChecklist({
  documents,
  onUpload,
  isUploading = false,
  className,
}: DocumentChecklistProps) {
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleUploadClick = (typeDocument: string) => {
    const input = fileInputRefs.current[typeDocument];
    if (input) {
      input.click();
    }
  };

  const handleFileChange = (typeDocument: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      onUpload(typeDocument, file);
    }
    e.target.value = '';
  };

  const requiredDocs = documents.filter(d => d.required);
  const optionalDocs = documents.filter(d => !d.required);
  const completedCount = requiredDocs.filter(d => d.isProvided).length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Summary */}
      <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
        <div className="flex-1">
          <p className="font-medium">Documents obligatoires</p>
          <p className="text-sm text-muted-foreground">
            {completedCount}/{requiredDocs.length} fournis
          </p>
        </div>
        <div className="h-12 w-12 rounded-full flex items-center justify-center" 
          style={{
            background: `conic-gradient(hsl(var(--primary)) ${(completedCount / requiredDocs.length) * 100}%, hsl(var(--muted)) 0)`
          }}
        >
          <div className="h-9 w-9 rounded-full bg-background flex items-center justify-center text-sm font-medium">
            {Math.round((completedCount / requiredDocs.length) * 100)}%
          </div>
        </div>
      </div>

      {/* Required documents */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          Documents obligatoires
        </h4>
        {requiredDocs.map((doc) => (
          <Card 
            key={doc.typeDocument} 
            className={cn(
              "transition-colors",
              doc.isProvided ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : ""
            )}
          >
            <CardContent className="p-3 flex items-center gap-3">
              {doc.isProvided ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              )}
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{doc.label}</p>
                {doc.isProvided && doc.fileName && (
                  <p className="text-xs text-muted-foreground truncate">
                    {doc.fileName}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {doc.isProvided ? (
                  <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                    Fourni
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                    Requis
                  </Badge>
                )}

                {onUpload && (
                  <>
                    <input
                      type="file"
                      ref={(el) => { fileInputRefs.current[doc.typeDocument] = el; }}
                      className="hidden"
                      onChange={(e) => handleFileChange(doc.typeDocument, e)}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUploadClick(doc.typeDocument)}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-1" />
                          {doc.isProvided ? "Remplacer" : "Upload"}
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Optional documents */}
      {optionalDocs.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Documents optionnels
          </h4>
          {optionalDocs.map((doc) => (
            <Card 
              key={doc.typeDocument}
              className={cn(
                "transition-colors",
                doc.isProvided ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800" : ""
              )}
            >
              <CardContent className="p-3 flex items-center gap-3">
                {doc.isProvided ? (
                  <CheckCircle2 className="h-5 w-5 text-blue-500 flex-shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{doc.label}</p>
                  {doc.isProvided && doc.fileName && (
                    <p className="text-xs text-muted-foreground truncate">
                      {doc.fileName}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {doc.isProvided && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      Fourni
                    </Badge>
                  )}

                  {onUpload && (
                    <>
                      <input
                        type="file"
                        ref={(el) => { fileInputRefs.current[doc.typeDocument] = el; }}
                        className="hidden"
                        onChange={(e) => handleFileChange(doc.typeDocument, e)}
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUploadClick(doc.typeDocument)}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-1" />
                            {doc.isProvided ? "Remplacer" : "Upload"}
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
