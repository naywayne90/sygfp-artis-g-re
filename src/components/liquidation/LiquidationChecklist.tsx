import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLiquidationDocuments } from "@/hooks/useLiquidationDocuments";
import {
  FileCheck,
  FileX,
  CheckCircle,
  Upload,
  Eye,
  Loader2,
  AlertCircle,
  FileImage,
  X,
  Shield,
  AlertTriangle,
  Lock
} from "lucide-react";

interface LiquidationChecklistProps {
  liquidationId: string;
  readOnly?: boolean;
  /** Callback appelé quand la complétude change */
  onCompletenessChange?: (isComplete: boolean, isVerified: boolean) => void;
  /** Bloquer la soumission si incomplet */
  blockSubmitIfIncomplete?: boolean;
}

const DOCUMENT_ICONS: Record<string, string> = {
  facture: "📄",
  pv_reception: "📋",
  bon_livraison: "📦",
  attestation_service_fait: "✅",
  bordereau_livraison: "🚚",
  autre: "📎",
};

// Types MIME acceptés pour le scan
const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo

export function LiquidationChecklist({
  liquidationId,
  readOnly = false,
  onCompletenessChange,
  blockSubmitIfIncomplete = true
}: LiquidationChecklistProps) {
  const {
    documents,
    isLoading,
    checklistStatus,
    markAsProvided,
    verifyDocument,
    isMarking,
    isVerifying,
  } = useLiquidationDocuments(liquidationId);

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Notifier le parent des changements de complétude
  useEffect(() => {
    if (onCompletenessChange) {
      onCompletenessChange(checklistStatus.isComplete, checklistStatus.isFullyVerified);
    }
  }, [checklistStatus.isComplete, checklistStatus.isFullyVerified, onCompletenessChange]);

  // Gérer la sélection de fichier avec preview
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);

    if (!file) {
      setSelectedFile(null);
      setFilePreview(null);
      return;
    }

    // Vérifier le type MIME
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      setUploadError("Type de fichier non accepté. Utilisez PDF, JPG, PNG, GIF ou WEBP.");
      return;
    }

    // Vérifier la taille
    if (file.size > MAX_FILE_SIZE) {
      setUploadError("Fichier trop volumineux (max 10 Mo).");
      return;
    }

    setSelectedFile(file);

    // Créer un aperçu pour les images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  }, []);

  // Ouvrir le dialog d'upload pour un document
  const openUploadDialog = (docId: string) => {
    setSelectedDocumentId(docId);
    setSelectedFile(null);
    setFilePreview(null);
    setUploadError(null);
    setUploadDialogOpen(true);
  };

  // Confirmer l'upload
  const handleConfirmUpload = () => {
    if (!selectedDocumentId || !selectedFile) return;

    const filePath = `liquidations/${liquidationId}/${Date.now()}_${selectedFile.name}`;

    markAsProvided({
      documentId: selectedDocumentId,
      filePath,
      fileName: selectedFile.name
    });

    setUploadDialogOpen(false);
    setSelectedDocumentId(null);
    setSelectedFile(null);
    setFilePreview(null);
  };

  // Fermer le dialog
  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
    setSelectedDocumentId(null);
    setSelectedFile(null);
    setFilePreview(null);
    setUploadError(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const progressPercent = checklistStatus.totalRequired > 0 
    ? (checklistStatus.providedRequired / checklistStatus.totalRequired) * 100 
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Pièces justificatives
            </CardTitle>
            <CardDescription>
              Documents requis pour la liquidation
            </CardDescription>
          </div>
          {checklistStatus.isComplete ? (
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              <CheckCircle className="h-3 w-3 mr-1" />
              Complet
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
              <AlertCircle className="h-3 w-3 mr-1" />
              {checklistStatus.missingLabels.length} manquant(s)
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progression</span>
            <span className="font-medium">
              {checklistStatus.providedRequired}/{checklistStatus.totalRequired} fournis
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Documents list */}
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={`
                flex items-center justify-between p-3 rounded-lg border
                ${doc.is_verified 
                  ? "bg-success/5 border-success/20" 
                  : doc.is_provided 
                    ? "bg-primary/5 border-primary/20" 
                    : "bg-muted/50 border-muted"
                }
              `}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{DOCUMENT_ICONS[doc.document_type] || "📎"}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{doc.document_label}</span>
                    {doc.is_required && (
                      <Badge variant="secondary" className="text-xs">Obligatoire</Badge>
                    )}
                  </div>
                  {doc.file_name && (
                    <span className="text-xs text-muted-foreground">{doc.file_name}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {doc.is_verified ? (
                  <Badge variant="outline" className="bg-success/10 text-success">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Vérifié
                  </Badge>
                ) : doc.is_provided ? (
                  <>
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                      Fourni
                    </Badge>
                    {!readOnly && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => verifyDocument({ documentId: doc.id })}
                        disabled={isVerifying}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Vérifier
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Badge variant="outline" className="bg-muted text-muted-foreground">
                      <FileX className="h-3 w-3 mr-1" />
                      Non fourni
                    </Badge>
                    {!readOnly && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openUploadDialog(doc.id)}
                        disabled={isMarking}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Scanner
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Missing documents warning with blocking */}
        {!checklistStatus.isComplete && (
          <Alert variant="destructive" className="border-warning bg-warning/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="text-warning">Documents manquants</AlertTitle>
            <AlertDescription className="text-muted-foreground">
              {checklistStatus.missingLabels.join(", ")}
              {blockSubmitIfIncomplete && (
                <span className="block mt-2 text-sm font-medium text-destructive">
                  <Lock className="h-3 w-3 inline mr-1" />
                  La soumission est bloquée tant que tous les documents obligatoires ne sont pas fournis.
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Verification pending notice */}
        {checklistStatus.isComplete && !checklistStatus.isFullyVerified && (
          <Alert className="border-secondary/50 bg-secondary/10">
            <Shield className="h-4 w-4 text-secondary" />
            <AlertTitle className="text-secondary">Vérification en attente</AlertTitle>
            <AlertDescription className="text-muted-foreground">
              {checklistStatus.totalRequired - checklistStatus.verifiedRequired} document(s) fourni(s) mais non encore vérifié(s).
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      {/* Footer with blocking status */}
      {blockSubmitIfIncomplete && !readOnly && (
        <CardFooter className="bg-muted/30 border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {checklistStatus.isComplete ? (
                <>
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm text-success font-medium">
                    Dossier complet - soumission possible
                  </span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 text-destructive" />
                  <span className="text-sm text-destructive font-medium">
                    Dossier incomplet - soumission bloquée
                  </span>
                </>
              )}
            </div>
            <Badge variant={checklistStatus.isComplete ? "default" : "destructive"}>
              {checklistStatus.providedRequired}/{checklistStatus.totalRequired} obligatoires
            </Badge>
          </div>
        </CardFooter>
      )}

      {/* Dialog d'upload avec preview */}
      <Dialog open={uploadDialogOpen} onOpenChange={handleCloseUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Scanner / Téléverser un document
            </DialogTitle>
            <DialogDescription>
              Sélectionnez ou scannez le document à joindre. Formats acceptés : PDF, JPG, PNG, GIF, WEBP (max 10 Mo).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Zone de sélection de fichier */}
            <div>
              <Label htmlFor="file-upload">Fichier</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                onChange={handleFileSelect}
                className="mt-1.5"
              />
            </div>

            {/* Erreur */}
            {uploadError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}

            {/* Aperçu image */}
            {filePreview && (
              <div className="relative">
                <Label>Aperçu</Label>
                <div className="mt-1.5 border rounded-lg overflow-hidden bg-muted/50 p-2">
                  <img
                    src={filePreview}
                    alt="Aperçu du document"
                    className="max-h-48 mx-auto object-contain rounded"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-6 right-2"
                  onClick={() => {
                    setSelectedFile(null);
                    setFilePreview(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Info fichier PDF */}
            {selectedFile && !filePreview && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <FileImage className="h-8 w-8 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} Ko - {selectedFile.type}
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseUploadDialog}>
              Annuler
            </Button>
            <Button
              onClick={handleConfirmUpload}
              disabled={!selectedFile || isMarking}
            >
              {isMarking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Téléverser
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
