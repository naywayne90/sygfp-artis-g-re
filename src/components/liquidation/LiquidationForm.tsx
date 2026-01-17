import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLiquidations, DOCUMENTS_REQUIS, LiquidationAvailability } from "@/hooks/useLiquidations";
import { Upload, AlertCircle, CheckCircle, X, FileText, Eye, FileImage, Lock, AlertTriangle, Loader2 } from "lucide-react";

const formSchema = z.object({
  engagement_id: z.string().min(1, "Engagement requis"),
  montant: z.number().min(0.01, "Montant requis"),
  montant_ht: z.number().optional(),
  tva_taux: z.number().optional(),
  reference_facture: z.string().optional(),
  observation: z.string().optional(),
  service_fait_date: z.string().min(1, "Date service fait requise"),
  regime_fiscal: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface LiquidationFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  dossierId?: string;
}

interface FileUpload {
  document_type: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  file_type?: string;
  file?: File;
  previewUrl?: string; // URL de preview pour les images
}

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
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

// Formater la taille de fichier
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + " o";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " Ko";
  return (bytes / (1024 * 1024)).toFixed(1) + " Mo";
};

export function LiquidationForm({ onSuccess, onCancel, dossierId }: LiquidationFormProps) {
  const { engagementsValides, createLiquidation, calculateAvailability, isCreating } = useLiquidations();
  const [selectedEngagement, setSelectedEngagement] = useState<typeof engagementsValides[0] | null>(null);
  const [availability, setAvailability] = useState<LiquidationAvailability | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<FileUpload[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileUpload | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      engagement_id: "",
      montant: 0,
      montant_ht: 0,
      tva_taux: 18,
      reference_facture: "",
      observation: "",
      service_fait_date: new Date().toISOString().split("T")[0],
      regime_fiscal: "reel_normal",
    },
  });

  const montant = form.watch("montant");
  const montantHT = form.watch("montant_ht");
  const tvaTaux = form.watch("tva_taux");

  // Calculate TVA and net
  useEffect(() => {
    if (montantHT && tvaTaux) {
      const tvaAmount = (montantHT * tvaTaux) / 100;
      form.setValue("montant", montantHT + tvaAmount);
    }
  }, [montantHT, tvaTaux, form]);

  // Calculate availability when engagement or amount changes
  useEffect(() => {
    const updateAvailability = async () => {
      if (selectedEngagement && montant > 0) {
        try {
          const avail = await calculateAvailability(selectedEngagement.id, montant);
          setAvailability(avail);
        } catch (err) {
          console.error("Error calculating availability:", err);
        }
      }
    };
    updateAvailability();
  }, [selectedEngagement, montant, calculateAvailability]);

  const handleEngagementSelect = (engagementId: string) => {
    const engagement = engagementsValides.find(e => e.id === engagementId);
    setSelectedEngagement(engagement || null);
    form.setValue("engagement_id", engagementId);
    if (engagement) {
      form.setValue("montant", engagement.montant);
    }
  };

  const handleFileUpload = useCallback((documentType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);

    // Vérifier le type MIME
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      setFileError(`Type de fichier "${file.type}" non accepté. Utilisez PDF, JPG, PNG, GIF ou WEBP.`);
      return;
    }

    // Vérifier la taille
    if (file.size > MAX_FILE_SIZE) {
      setFileError(`Fichier trop volumineux (${formatFileSize(file.size)}). Maximum autorisé : 10 Mo.`);
      return;
    }

    // Remove existing file of same type (clean up preview URL)
    const oldFile = uploadedFiles.find(f => f.document_type === documentType);
    if (oldFile?.previewUrl) {
      URL.revokeObjectURL(oldFile.previewUrl);
    }
    const filtered = uploadedFiles.filter(f => f.document_type !== documentType);

    // Create preview URL for images
    let previewUrl: string | undefined;
    if (file.type.startsWith("image/")) {
      previewUrl = URL.createObjectURL(file);
    }

    const newUpload: FileUpload = {
      document_type: documentType,
      file_name: file.name,
      file_path: `liquidations/${Date.now()}_${file.name}`,
      file_size: file.size,
      file_type: file.type,
      file: file,
      previewUrl,
    };

    setUploadedFiles([...filtered, newUpload]);
  }, [uploadedFiles]);

  // Ouvrir la preview d'un fichier
  const openPreview = (file: FileUpload) => {
    setPreviewFile(file);
    setPreviewDialogOpen(true);
  };

  // Fermer la preview
  const closePreview = () => {
    setPreviewDialogOpen(false);
    setPreviewFile(null);
  };

  const removeFile = (documentType: string) => {
    const fileToRemove = uploadedFiles.find(f => f.document_type === documentType);
    if (fileToRemove?.previewUrl) {
      URL.revokeObjectURL(fileToRemove.previewUrl);
    }
    setUploadedFiles(uploadedFiles.filter(f => f.document_type !== documentType));
  };

  const getUploadedFile = (documentType: string) => {
    return uploadedFiles.find(f => f.document_type === documentType);
  };

  const checkRequiredDocuments = () => {
    const requiredDocs = DOCUMENTS_REQUIS.filter(d => d.obligatoire).map(d => d.code);
    const providedDocs = uploadedFiles.map(f => f.document_type);
    const missingDocs = requiredDocs.filter(d => !providedDocs.includes(d));
    return missingDocs.length === 0;
  };

  const onSubmit = async (data: FormData) => {
    if (!checkRequiredDocuments()) {
      setFileError("Veuillez téléverser tous les documents obligatoires (Facture, PV de réception, Bon de livraison)");
      return;
    }

    if (availability && !availability.is_valid) {
      setFileError("Le montant dépasse le restant à liquider");
      return;
    }

    const attachments = uploadedFiles.map(({ document_type, file_name, file_path, file_size, file_type }) => ({
      document_type,
      file_name,
      file_path,
      file_size,
      file_type,
    }));

    createLiquidation({
      engagement_id: data.engagement_id,
      montant: data.montant,
      montant_ht: data.montant_ht,
      tva_taux: data.tva_taux,
      tva_montant: (data.montant_ht || 0) * ((data.tva_taux || 0) / 100),
      reference_facture: data.reference_facture,
      observation: data.observation,
      service_fait_date: data.service_fait_date,
      regime_fiscal: data.regime_fiscal,
      attachments,
    }, {
      onSuccess: () => {
        onSuccess();
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {dossierId && (
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm">
            Lié au dossier <code className="bg-muted px-1 rounded text-xs">{dossierId.slice(0, 8)}...</code>
          </div>
        )}
        
        {/* Sélection de l'engagement */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Engagement source</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="engagement_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Engagement validé *</FormLabel>
                  <Select onValueChange={handleEngagementSelect} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un engagement" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {engagementsValides.map((eng) => (
                        <SelectItem key={eng.id} value={eng.id}>
                          {eng.numero} - {eng.objet} ({formatMontant(eng.montant)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedEngagement && (
              <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Numéro:</span>
                    <span className="ml-2 font-medium">{selectedEngagement.numero}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fournisseur:</span>
                    <span className="ml-2 font-medium">
                      {selectedEngagement.marche?.prestataire?.raison_sociale || selectedEngagement.fournisseur || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Montant engagé:</span>
                    <span className="ml-2 font-medium">{formatMontant(selectedEngagement.montant)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Ligne budgétaire:</span>
                    <span className="ml-2 font-medium">{selectedEngagement.budget_line?.code || "N/A"}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calcul disponibilité */}
        {availability && (
          <Card className={availability.is_valid ? "border-success/50" : "border-destructive/50"}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {availability.is_valid ? (
                  <CheckCircle className="h-5 w-5 text-success" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                )}
                Calcul du restant à liquider
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div className="p-3 bg-muted rounded-lg text-center">
                  <div className="text-muted-foreground text-xs">Montant engagé</div>
                  <div className="font-bold text-primary">{formatMontant(availability.montant_engage)}</div>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <div className="text-muted-foreground text-xs">Liquidations ant.</div>
                  <div className="font-bold">{formatMontant(availability.liquidations_anterieures)}</div>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <div className="text-muted-foreground text-xs">Liquidation actuelle</div>
                  <div className="font-bold text-secondary">{formatMontant(availability.liquidation_actuelle)}</div>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <div className="text-muted-foreground text-xs">Cumul</div>
                  <div className="font-bold">{formatMontant(availability.cumul)}</div>
                </div>
                <div className={`p-3 rounded-lg text-center ${availability.is_valid ? "bg-success/10" : "bg-destructive/10"}`}>
                  <div className="text-muted-foreground text-xs">Restant à liquider</div>
                  <div className={`font-bold ${availability.is_valid ? "text-success" : "text-destructive"}`}>
                    {formatMontant(availability.restant_a_liquider)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Montants */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Montants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="montant_ht"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant HT</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tva_taux"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TVA (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="montant"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant TTC *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="service_fait_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date service fait *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reference_facture"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Référence facture</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="N° de facture" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="observation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observation</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Observations éventuelles..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Documents obligatoires */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Pièces justificatives (scanning obligatoire)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fileError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{fileError}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DOCUMENTS_REQUIS.map((doc) => {
                const uploadedFile = getUploadedFile(doc.code);
                return (
                  <div
                    key={doc.code}
                    className={`p-4 border rounded-lg transition-colors ${
                      uploadedFile
                        ? "bg-success/5 border-success/30"
                        : doc.obligatoire
                          ? "border-primary/50 bg-muted/30"
                          : "border-muted"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Label className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {doc.label}
                        {doc.obligatoire && (
                          <Badge variant="outline" className="text-xs bg-primary/10">
                            Obligatoire
                          </Badge>
                        )}
                      </Label>
                      {uploadedFile && (
                        <div className="flex items-center gap-1">
                          {uploadedFile.previewUrl && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => openPreview(uploadedFile)}
                              title="Voir l'aperçu"
                            >
                              <Eye className="h-4 w-4 text-primary" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(doc.code)}
                            title="Supprimer"
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {uploadedFile ? (
                      <div className="space-y-2">
                        {/* Thumbnail preview for images */}
                        {uploadedFile.previewUrl && (
                          <div
                            className="relative h-20 w-full bg-muted rounded overflow-hidden cursor-pointer"
                            onClick={() => openPreview(uploadedFile)}
                          >
                            <img
                              src={uploadedFile.previewUrl}
                              alt={uploadedFile.file_name}
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                              <Eye className="h-6 w-6 text-white opacity-0 hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-success">
                          <CheckCircle className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{uploadedFile.file_name}</span>
                        </div>
                        {uploadedFile.file_size && (
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(uploadedFile.file_size)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                          onChange={(e) => handleFileUpload(doc.code, e)}
                          className="text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          PDF, JPG, PNG, GIF, WEBP (max 10 Mo)
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Completeness blocking notice */}
            {!checkRequiredDocuments() && (
              <Alert variant="destructive" className="mt-4">
                <Lock className="h-4 w-4" />
                <AlertTitle>Documents obligatoires manquants</AlertTitle>
                <AlertDescription>
                  Vous devez téléverser tous les documents obligatoires (Facture, PV de réception, Bon de livraison)
                  avant de pouvoir créer la liquidation.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={isCreating || !checkRequiredDocuments() || (availability && !availability.is_valid)}
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Création...
              </>
            ) : (
              "Créer la liquidation"
            )}
          </Button>
        </div>
      </form>

      {/* Dialog de preview d'image */}
      <Dialog open={previewDialogOpen} onOpenChange={closePreview}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5" />
              Aperçu du document
            </DialogTitle>
            {previewFile && (
              <DialogDescription>
                {previewFile.file_name}
                {previewFile.file_size && ` - ${formatFileSize(previewFile.file_size)}`}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="py-4">
            {previewFile?.previewUrl && (
              <div className="border rounded-lg overflow-hidden bg-muted/50 p-2">
                <img
                  src={previewFile.previewUrl}
                  alt={previewFile.file_name}
                  className="max-h-[60vh] mx-auto object-contain rounded"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closePreview}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Form>
  );
}
