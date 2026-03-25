import { useState, useCallback, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  FileCheck,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Shield,
  FileText,
  Upload,
  X,
  FileImage,
  Lock,
  AlertCircle,
} from 'lucide-react';
import { InlineDocumentUpload } from '@/components/scanning/InlineDocumentUpload';
import {
  useEngagementDocuments,
  TYPES_DOCUMENTS_ENGAGEMENT,
  ACCEPTED_FILE_TYPES,
  MAX_FILE_SIZE,
} from '@/hooks/useEngagementDocuments';

interface EngagementChecklistProps {
  engagementId: string;
  canEdit?: boolean;
  showProgress?: boolean;
  /** Callback when completeness changes */
  onCompletenessChange?: (isComplete: boolean, isVerified: boolean) => void;
  /** Block submission if incomplete */
  blockSubmitIfIncomplete?: boolean;
}

export function EngagementChecklist({
  engagementId,
  canEdit = true,
  showProgress = true,
  onCompletenessChange,
  blockSubmitIfIncomplete = true,
}: EngagementChecklistProps) {
  const {
    documents,
    isLoading,
    checklistStatus,
    markProvided,
    addDocument,
    verifyDocument,
    isMarking,
    isAdding,
    isVerifying,
  } = useEngagementDocuments(engagementId);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newDoc, setNewDoc] = useState({ type_document: '', libelle: '', est_obligatoire: false });

  // Upload dialog state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Notify parent of completeness changes
  useEffect(() => {
    if (onCompletenessChange) {
      onCompletenessChange(checklistStatus.isComplete, checklistStatus.isFullyVerified);
    }
  }, [checklistStatus.isComplete, checklistStatus.isFullyVerified, onCompletenessChange]);

  // Handle file selection with preview
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);

    if (!file) {
      setSelectedFile(null);
      setFilePreview(null);
      return;
    }

    // Validate file type
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      setUploadError('Type de fichier non accepté. Utilisez PDF, JPG, PNG, GIF ou WEBP.');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('Fichier trop volumineux (max 10 Mo).');
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  }, []);

  // Open upload dialog for a document
  const openUploadDialog = (docId: string) => {
    setSelectedDocumentId(docId);
    setSelectedFile(null);
    setFilePreview(null);
    setUploadError(null);
    setUploadDialogOpen(true);
  };

  // Confirm upload
  const handleConfirmUpload = async () => {
    if (!selectedDocumentId || !selectedFile) return;

    const filePath = `engagements/${engagementId}/${Date.now()}_${selectedFile.name}`;

    await markProvided({
      documentId: selectedDocumentId,
      provided: true,
      filePath,
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      fileType: selectedFile.type,
    });

    handleCloseUploadDialog();
  };

  // Close upload dialog
  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
    setSelectedDocumentId(null);
    setSelectedFile(null);
    setFilePreview(null);
    setUploadError(null);
  };

  const handleMarkProvided = async (docId: string, provided: boolean) => {
    if (!provided) {
      // If unchecking, just update
      await markProvided({ documentId: docId, provided: false });
    } else {
      // If checking, open upload dialog
      openUploadDialog(docId);
    }
  };

  const handleAddDocument = async () => {
    if (!newDoc.type_document || !newDoc.libelle) return;
    await addDocument(newDoc);
    setNewDoc({ type_document: '', libelle: '', est_obligatoire: false });
    setShowAddDialog(false);
  };

  const getTypeLabel = (type: string) => {
    return TYPES_DOCUMENTS_ENGAGEMENT.find((t) => t.value === type)?.label || type;
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Pièces justificatives
            </CardTitle>
            <CardDescription>Documents requis pour la validation de l'engagement</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {checklistStatus.isComplete ? (
              <Badge className="bg-green-100 text-green-700 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Complet
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {checklistStatus.provided}/{checklistStatus.total}
              </Badge>
            )}
            {canEdit && (
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1">
                    <Plus className="h-4 w-4" />
                    Ajouter
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajouter un document à la checklist</DialogTitle>
                    <DialogDescription>
                      Ajoutez un document supplémentaire à fournir pour cet engagement.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Type de document</Label>
                      <Select
                        value={newDoc.type_document}
                        onValueChange={(v) => setNewDoc((prev) => ({ ...prev, type_document: v }))}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          {TYPES_DOCUMENTS_ENGAGEMENT.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Libellé</Label>
                      <Input
                        value={newDoc.libelle}
                        onChange={(e) =>
                          setNewDoc((prev) => ({ ...prev, libelle: e.target.value }))
                        }
                        className="mt-1.5"
                        placeholder="Description du document"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="obligatoire"
                        checked={newDoc.est_obligatoire}
                        onCheckedChange={(checked) =>
                          setNewDoc((prev) => ({ ...prev, est_obligatoire: checked === true }))
                        }
                      />
                      <Label htmlFor="obligatoire" className="text-sm font-normal">
                        Document obligatoire
                      </Label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                        Annuler
                      </Button>
                      <Button onClick={handleAddDocument} disabled={isAdding}>
                        {isAdding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Ajouter
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showProgress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-medium">{checklistStatus.percentage}%</span>
            </div>
            <Progress
              value={checklistStatus.percentage}
              className={checklistStatus.isComplete ? 'bg-green-100' : ''}
            />
          </div>
        )}

        {documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun document requis</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <InlineDocumentUpload
                key={doc.id}
                documentId={doc.id}
                engagementId={engagementId}
                label={doc.libelle}
                isObligatoire={doc.est_obligatoire}
                isFourni={doc.est_fourni}
                fileName={doc.file_name}
                uploadedAt={doc.uploaded_at}
                disabled={!canEdit}
                onUploadSuccess={(docId, filePath, fileName, fileSize, fileType) => {
                  markProvided({
                    documentId: docId,
                    provided: true,
                    filePath,
                    fileName,
                    fileSize,
                    fileType,
                  });
                }}
                onRemove={(docId) => {
                  markProvided({ documentId: docId, provided: false });
                }}
              />
            ))}
          </div>
        )}

        {/* Missing documents warning */}
        {!checklistStatus.isComplete && checklistStatus.missingLabels.length > 0 && (
          <Alert variant="destructive" className="border-warning bg-warning/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="text-warning">Documents manquants</AlertTitle>
            <AlertDescription className="text-muted-foreground">
              {checklistStatus.missingLabels.join(', ')}
              {blockSubmitIfIncomplete && (
                <span className="block mt-2 text-sm font-medium text-destructive">
                  <Lock className="h-3 w-3 inline mr-1" />
                  La soumission est bloquée tant que tous les documents obligatoires ne sont pas
                  fournis.
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Verification pending notice */}
        {checklistStatus.isComplete && !checklistStatus.isFullyVerified && (
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-700">Vérification en attente</AlertTitle>
            <AlertDescription className="text-muted-foreground">
              {checklistStatus.providedAll - checklistStatus.verified} document(s) fourni(s) mais
              non encore vérifié(s).
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      {/* Footer with blocking status */}
      {blockSubmitIfIncomplete && !canEdit === false && (
        <CardFooter className="bg-muted/30 border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {checklistStatus.isComplete ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-success" />
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
            <Badge variant={checklistStatus.isComplete ? 'default' : 'destructive'}>
              {checklistStatus.provided}/{checklistStatus.total} obligatoires
            </Badge>
          </div>
        </CardFooter>
      )}

      {/* Dialog d'upload supprimé — remplacé par InlineDocumentUpload avec drag-drop */}
    </Card>
  );
}
