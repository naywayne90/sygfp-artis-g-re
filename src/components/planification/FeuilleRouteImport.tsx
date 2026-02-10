// @ts-nocheck
/**
 * FeuilleRouteImport - Composant d'import des feuilles de route par direction
 *
 * Interface complète avec:
 * - Upload de fichier (Excel/CSV)
 * - Preview des données
 * - Mapping des colonnes
 * - Détection des doublons
 * - Validation et import batch
 * - Historique et rollback
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCcw,
  Trash2,
  History,
  SkipForward,
  Plus,
  Loader2,
  Info,
  Building2,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useFeuilleRouteImport, RowValidation, ColumnMapping } from "@/hooks/useFeuilleRouteImport";
import { useExercice } from "@/contexts/ExerciceContext";
import { useRoadmapDiff } from "@/hooks/useRoadmapDiff";
import { RoadmapDiffViewer } from "./RoadmapDiffViewer";

// Étapes du wizard
type Step = "upload" | "mapping" | "preview" | "diff" | "import" | "result";

const STEPS: { key: Step; label: string; description: string }[] = [
  { key: "upload", label: "Fichier", description: "Sélectionner le fichier" },
  { key: "mapping", label: "Mapping", description: "Associer les colonnes" },
  { key: "preview", label: "Aperçu", description: "Vérifier les données" },
  { key: "diff", label: "Comparaison", description: "Analyser les changements" },
  { key: "import", label: "Appliquer", description: "Appliquer les changements" },
];

export function FeuilleRouteImport() {
  const { exercice, exerciceId, isReadOnly } = useExercice();
  const [currentStep, setCurrentStep] = useState<Step>("upload");
  const [showHistory, setShowHistory] = useState(false);

  const {
    file,
    rawData,
    headers,
    mapping,
    validatedRows,
    stats,
    currentBatchId,
    selectedDirection,
    directions,
    importHistory,
    parseFile,
    setMapping,
    setSelectedDirection,
    validateRows,
    updateRowAction,
    reset,
    executeImport,
    isImporting,
    rollbackImport,
    isRollingBack,
  } = useFeuilleRouteImport();

  // Hook pour le diff
  const {
    calculateDiff,
    isCalculating,
    stats: _diffStats,
  } = useRoadmapDiff(currentBatchId, selectedDirection || undefined);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    try {
      await parseFile(uploadedFile);
      setCurrentStep("mapping");
    } catch (error) {
      console.error("Parse error:", error);
    }
  };

  const handleMappingComplete = async () => {
    if (!mapping.code_imput || !mapping.libelle) {
      return;
    }
    await validateRows();
    setCurrentStep("preview");
  };

  const handleImport = async () => {
    setCurrentStep("import");
    try {
      await executeImport();
      // Après l'import, calculer le diff
      if (currentBatchId && selectedDirection && exerciceId) {
        try {
          await calculateDiff(currentBatchId, selectedDirection, exerciceId);
          setCurrentStep("diff");
        } catch (diffError) {
          console.error("Erreur calcul diff:", diffError);
          setCurrentStep("result");
        }
      } else {
        setCurrentStep("result");
      }
    } catch {
      setCurrentStep("preview");
    }
  };

  // Handler pour quand l'application des changements est terminée
  const handleDiffApplyComplete = () => {
    setCurrentStep("result");
  };

  const handleReset = () => {
    reset();
    setCurrentStep("upload");
  };

  if (isReadOnly) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Exercice en lecture seule</AlertTitle>
        <AlertDescription>
          L'exercice {exercice?.annee} est clôturé. L'import n'est pas disponible.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Import Feuilles de Route</h2>
          <p className="text-muted-foreground">
            Importez les activités par direction depuis un fichier Excel ou CSV
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowHistory(true)}>
            <History className="h-4 w-4 mr-2" />
            Historique
          </Button>
          {file && (
            <Button variant="outline" onClick={handleReset}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Nouveau
            </Button>
          )}
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                      currentStep === step.key
                        ? "bg-primary text-primary-foreground border-primary"
                        : STEPS.findIndex((s) => s.key === currentStep) > index
                        ? "bg-green-500 text-white border-green-500"
                        : "bg-muted text-muted-foreground border-muted"
                    )}
                  >
                    {STEPS.findIndex((s) => s.key === currentStep) > index ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className="text-sm mt-2 font-medium">{step.label}</span>
                  <span className="text-xs text-muted-foreground">{step.description}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-4",
                      STEPS.findIndex((s) => s.key === currentStep) > index
                        ? "bg-green-500"
                        : "bg-muted"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {currentStep === "upload" && (
        <UploadStep
          directions={directions}
          selectedDirection={selectedDirection}
          onDirectionChange={setSelectedDirection}
          onFileUpload={handleFileUpload}
        />
      )}

      {currentStep === "mapping" && (
        <MappingStep
          headers={headers}
          mapping={mapping}
          onMappingChange={setMapping}
          onNext={handleMappingComplete}
          onBack={() => setCurrentStep("upload")}
          rawDataCount={rawData.length}
        />
      )}

      {currentStep === "preview" && (
        <PreviewStep
          validatedRows={validatedRows}
          stats={stats}
          onRowActionChange={updateRowAction}
          onImport={handleImport}
          onBack={() => setCurrentStep("mapping")}
          isImporting={isImporting}
        />
      )}

      {currentStep === "import" && (
        <ImportingStep stats={stats} isCalculatingDiff={isCalculating} />
      )}

      {currentStep === "diff" && currentBatchId && selectedDirection && (
        <Card>
          <CardHeader>
            <CardTitle>4. Analyser et appliquer les changements</CardTitle>
            <CardDescription>
              Comparez les données importées avec les données existantes et sélectionnez les changements à appliquer.
              Les suppressions désactivent les activités sans les supprimer définitivement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RoadmapDiffViewer
              importBatchId={currentBatchId}
              directionId={selectedDirection}
              onApplyComplete={handleDiffApplyComplete}
            />
          </CardContent>
        </Card>
      )}

      {currentStep === "result" && (
        <ResultStep
          stats={stats}
          batchId={currentBatchId}
          onReset={handleReset}
          onRollback={rollbackImport}
          isRollingBack={isRollingBack}
        />
      )}

      {/* History Dialog */}
      <ImportHistoryDialog
        open={showHistory}
        onOpenChange={setShowHistory}
        history={importHistory}
        onRollback={rollbackImport}
        isRollingBack={isRollingBack}
      />
    </div>
  );
}

// Step 1: Upload
function UploadStep({
  directions,
  selectedDirection,
  onDirectionChange,
  onFileUpload,
}: {
  directions: Array<{ id: string; code: string; label: string; sigle?: string }>;
  selectedDirection: string | null;
  onDirectionChange: (id: string) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>1. Sélectionner la direction et le fichier</CardTitle>
        <CardDescription>
          Choisissez la direction concernée puis le fichier Excel ou CSV à importer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Direction Selection */}
        <div className="space-y-2">
          <Label>Direction *</Label>
          <Select value={selectedDirection || ""} onValueChange={onDirectionChange}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Sélectionner une direction" />
            </SelectTrigger>
            <SelectContent>
              {directions.map((dir) => (
                <SelectItem key={dir.id} value={dir.id}>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono">{dir.code}</span>
                    <span>-</span>
                    <span>{dir.sigle || dir.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <Label>Fichier à importer *</Label>
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              selectedDirection
                ? "hover:border-primary cursor-pointer"
                : "opacity-50 cursor-not-allowed"
            )}
          >
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={onFileUpload}
              className="hidden"
              id="file-upload"
              disabled={!selectedDirection}
            />
            <label
              htmlFor="file-upload"
              className={cn(
                "flex flex-col items-center gap-4",
                selectedDirection ? "cursor-pointer" : "cursor-not-allowed"
              )}
            >
              <div className="p-4 bg-primary/10 rounded-full">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-medium">Cliquez pour sélectionner un fichier</p>
                <p className="text-sm text-muted-foreground">
                  Formats acceptés: Excel (.xlsx, .xls) ou CSV
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Help */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Format attendu</AlertTitle>
          <AlertDescription>
            Le fichier doit contenir au minimum les colonnes:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Code imputation</strong> - Identifiant unique de l'activité</li>
              <li><strong>Libellé</strong> - Description de l'activité</li>
            </ul>
            Colonnes optionnelles: Action, Montant prévu, Responsable, Dates
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

// Step 2: Mapping
function MappingStep({
  headers,
  mapping,
  onMappingChange,
  onNext,
  onBack,
  rawDataCount,
}: {
  headers: string[];
  mapping: ColumnMapping;
  onMappingChange: (mapping: ColumnMapping) => void;
  onNext: () => void;
  onBack: () => void;
  rawDataCount: number;
}) {
  const FIELDS: Array<{
    key: keyof ColumnMapping;
    label: string;
    required: boolean;
    description: string;
  }> = [
    { key: "code_imput", label: "Code imputation", required: true, description: "Identifiant unique" },
    { key: "libelle", label: "Libellé", required: true, description: "Description de l'activité" },
    { key: "action_code", label: "Code action", required: false, description: "Code de l'action parente" },
    { key: "montant_prevu", label: "Montant prévu", required: false, description: "Budget alloué" },
    { key: "description", label: "Description", required: false, description: "Détails supplémentaires" },
    { key: "responsable", label: "Responsable", required: false, description: "Personne en charge" },
    { key: "date_debut", label: "Date début", required: false, description: "Date de démarrage" },
    { key: "date_fin", label: "Date fin", required: false, description: "Date d'échéance" },
  ];

  const isValid = mapping.code_imput && mapping.libelle;

  return (
    <Card>
      <CardHeader>
        <CardTitle>2. Associer les colonnes</CardTitle>
        <CardDescription>
          Faites correspondre les colonnes du fichier avec les champs de l'application.
          {rawDataCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {rawDataCount} lignes détectées
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {FIELDS.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label className="flex items-center gap-2">
                {field.label}
                {field.required && <span className="text-destructive">*</span>}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>{field.description}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Select
                value={mapping[field.key] || ""}
                onValueChange={(value) =>
                  onMappingChange({ ...mapping, [field.key]: value || null })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une colonne" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">-- Non mappé --</SelectItem>
                  {headers.map((header) => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {mapping[field.key] && (
                <Badge variant="outline" className="text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Mappé
                </Badge>
              )}
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Retour
          </Button>
          <Button onClick={onNext} disabled={!isValid}>
            Continuer
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Step 3: Preview
function PreviewStep({
  validatedRows,
  stats,
  onRowActionChange,
  onImport,
  onBack,
  isImporting,
}: {
  validatedRows: RowValidation[];
  stats: { total: number; toCreate: number; toUpdate: number; toSkip: number; duplicates: number; errors: number; warnings: number } | null;
  onRowActionChange: (rowIndex: number, action: RowValidation["action"]) => void;
  onImport: () => void;
  onBack: () => void;
  isImporting: boolean;
}) {
  const canImport = stats && stats.toCreate > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>3. Vérifier et valider</CardTitle>
        <CardDescription>
          Vérifiez les données avant l'import. Les doublons seront ignorés.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Summary */}
        {stats && (
          <div className="grid grid-cols-5 gap-4">
            <StatCard label="Total" value={stats.total} icon={FileSpreadsheet} />
            <StatCard
              label="À créer"
              value={stats.toCreate}
              icon={Plus}
              variant="success"
            />
            <StatCard
              label="Doublons"
              value={stats.duplicates}
              icon={SkipForward}
              variant="warning"
            />
            <StatCard
              label="Erreurs"
              value={stats.errors}
              icon={XCircle}
              variant="error"
            />
            <StatCard
              label="Avertissements"
              value={stats.warnings}
              icon={AlertTriangle}
              variant="warning"
            />
          </div>
        )}

        {/* Data Table */}
        <ScrollArea className="h-[400px] border rounded-lg">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead className="w-[50px]">Ligne</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {validatedRows.map((row) => (
                <TableRow
                  key={row.rowIndex}
                  className={cn(
                    !row.validation.isValid && "bg-red-50",
                    row.isDuplicate && row.action === "skip" && "bg-yellow-50"
                  )}
                >
                  <TableCell className="font-mono text-sm">{row.rowIndex}</TableCell>
                  <TableCell className="font-mono">{row.code_imput || "-"}</TableCell>
                  <TableCell className="max-w-[300px] truncate">{row.libelle || "-"}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {row.validation.errors.map((err, i) => (
                        <Badge key={i} variant="destructive" className="text-xs">
                          <XCircle className="h-3 w-3 mr-1" />
                          {err}
                        </Badge>
                      ))}
                      {row.validation.warnings.map((warn, i) => (
                        <Badge key={i} variant="outline" className="text-xs text-amber-600 border-amber-200">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {warn}
                        </Badge>
                      ))}
                      {row.validation.isValid && !row.isDuplicate && (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Valide
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={row.action}
                      onValueChange={(value) =>
                        onRowActionChange(row.rowIndex, value as RowValidation["action"])
                      }
                      disabled={!row.validation.isValid}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="create">Créer</SelectItem>
                        <SelectItem value="skip">Ignorer</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>

        {/* Duplicate Warning */}
        {stats && stats.duplicates > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Doublons détectés</AlertTitle>
            <AlertDescription>
              {stats.duplicates} ligne(s) ont été détectées comme doublons et seront ignorées.
              Vous pouvez réimporter ce fichier sans risque de duplication.
            </AlertDescription>
          </Alert>
        )}

        <Separator />

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Retour
          </Button>
          <Button onClick={onImport} disabled={!canImport || isImporting}>
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Import en cours...
              </>
            ) : (
              <>
                Importer {stats?.toCreate || 0} activité(s)
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Step 4: Importing
function ImportingStep({
  stats,
  isCalculatingDiff = false
}: {
  stats: { total: number; toCreate: number } | null;
  isCalculatingDiff?: boolean;
}) {
  return (
    <Card>
      <CardContent className="py-12">
        <div className="flex flex-col items-center gap-6">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="text-center">
            <h3 className="text-lg font-medium">
              {isCalculatingDiff ? "Analyse des changements..." : "Import en cours..."}
            </h3>
            <p className="text-muted-foreground">
              {isCalculatingDiff
                ? "Calcul des différences avec les données existantes"
                : `${stats?.toCreate || 0} activités en cours d'importation`
              }
            </p>
          </div>
          <Progress value={isCalculatingDiff ? 75 : 50} className="w-64" />
        </div>
      </CardContent>
    </Card>
  );
}

// Step 5: Result
function ResultStep({
  stats,
  batchId,
  onReset,
  onRollback,
  isRollingBack,
}: {
  stats: { total: number; toCreate: number; toSkip: number; errors: number } | null;
  batchId: string | null;
  onReset: () => void;
  onRollback: (batchId: string) => void;
  isRollingBack: boolean;
}) {
  return (
    <Card>
      <CardContent className="py-12">
        <div className="flex flex-col items-center gap-6">
          <div className="p-4 bg-green-100 rounded-full">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-medium">Import terminé !</h3>
            <p className="text-muted-foreground">
              {stats?.toCreate || 0} activités importées avec succès
            </p>
            {stats && stats.toSkip > 0 && (
              <p className="text-sm text-amber-600 mt-1">
                {stats.toSkip} doublons ignorés
              </p>
            )}
          </div>

          {batchId && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground">ID Batch: {batchId}</p>
            </div>
          )}

          <div className="flex gap-4">
            <Button onClick={onReset}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvel import
            </Button>
            {batchId && (
              <Button
                variant="outline"
                onClick={() => onRollback(batchId)}
                disabled={isRollingBack}
              >
                {isRollingBack ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Annuler l'import
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  icon: Icon,
  variant = "default",
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  variant?: "default" | "success" | "warning" | "error";
}) {
  const variantStyles = {
    default: "bg-muted",
    success: "bg-green-100 text-green-700",
    warning: "bg-amber-100 text-amber-700",
    error: "bg-red-100 text-red-700",
  };

  return (
    <div className={cn("p-4 rounded-lg text-center", variantStyles[variant])}>
      <Icon className="h-5 w-5 mx-auto mb-2" />
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs">{label}</div>
    </div>
  );
}

// Import History Dialog
function ImportHistoryDialog({
  open,
  onOpenChange,
  history,
  onRollback,
  isRollingBack,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: Array<{
    id: string;
    nom_fichier: string;
    statut: string;
    nb_lignes_total: number;
    nb_lignes_importees: number;
    nb_lignes_erreur: number;
    started_at: string;
    completed_at?: string;
  }>;
  onRollback: (batchId: string) => void;
  isRollingBack: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Historique des imports</DialogTitle>
          <DialogDescription>
            Consultez les imports précédents et annulez si nécessaire
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fichier</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Lignes</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-sm">
                    {item.nom_fichier}
                  </TableCell>
                  <TableCell>
                    {item.started_at && format(new Date(item.started_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="text-green-600">{item.nb_lignes_importees}</span>
                      {" / "}
                      <span>{item.nb_lignes_total}</span>
                      {item.nb_lignes_erreur > 0 && (
                        <span className="text-red-600 ml-1">
                          ({item.nb_lignes_erreur} err)
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.statut === "termine"
                          ? "default"
                          : item.statut === "erreur"
                          ? "destructive"
                          : item.statut === "annule"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {item.statut}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.statut === "termine" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRollback(item.id)}
                        disabled={isRollingBack}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {history.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Aucun import précédent
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default FeuilleRouteImport;
