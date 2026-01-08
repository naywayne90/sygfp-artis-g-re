import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, Download, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface PrestatairesImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedRow {
  code?: string;
  raison_sociale?: string;
  sigle?: string;
  ninea?: string;
  nif?: string;
  ifu?: string;
  rccm?: string;
  cc?: string;
  adresse?: string;
  ville?: string;
  telephone?: string;
  email?: string;
  contact_nom?: string;
  contact_telephone?: string;
  contact_email?: string;
  secteur_activite?: string;
  type_prestataire?: string;
  statut?: string;
}

interface ImportResult {
  success: number;
  errors: number;
  warnings: { row: number; message: string }[];
  error_details: { row: number; code: string; message: string }[];
}

const COLUMN_MAPPINGS: Record<string, string> = {
  code: "code",
  "raison sociale": "raison_sociale",
  "raison_sociale": "raison_sociale",
  nom: "raison_sociale",
  sigle: "sigle",
  ninea: "ninea",
  nif: "nif",
  ifu: "ifu",
  rccm: "rccm",
  cc: "cc",
  "compte contribuable": "cc",
  adresse: "adresse",
  ville: "ville",
  telephone: "telephone",
  téléphone: "telephone",
  tel: "telephone",
  email: "email",
  mail: "email",
  "contact nom": "contact_nom",
  "contact_nom": "contact_nom",
  "nom contact": "contact_nom",
  "contact telephone": "contact_telephone",
  "contact_telephone": "contact_telephone",
  "contact email": "contact_email",
  "contact_email": "contact_email",
  secteur: "secteur_activite",
  "secteur activite": "secteur_activite",
  "secteur_activite": "secteur_activite",
  type: "type_prestataire",
  "type prestataire": "type_prestataire",
  "type_prestataire": "type_prestataire",
  statut: "statut",
  status: "statut",
};

export function PrestatairesImportDialog({ open, onOpenChange }: PrestatairesImportDialogProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
  const [fileName, setFileName] = useState("");
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const resetDialog = () => {
    setStep("upload");
    setFileName("");
    setParsedData([]);
    setValidationErrors([]);
    setImportResult(null);
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  const parseExcel = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { raw: false });

        if (jsonData.length === 0) {
          setValidationErrors(["Le fichier est vide ou ne contient pas de données valides."]);
          return;
        }

        // Map columns
        const mapped: ParsedRow[] = jsonData.map((row) => {
          const mappedRow: ParsedRow = {};
          Object.entries(row).forEach(([key, value]) => {
            const normalizedKey = key.toLowerCase().trim();
            const mappedKey = COLUMN_MAPPINGS[normalizedKey];
            if (mappedKey && value !== undefined && value !== null) {
              (mappedRow as Record<string, string>)[mappedKey] = String(value).trim();
            }
          });
          return mappedRow;
        });

        // Validate
        const errors: string[] = [];
        const validRows = mapped.filter((row, index) => {
          if (!row.raison_sociale && !row.code) {
            errors.push(`Ligne ${index + 2}: Raison sociale manquante`);
            return false;
          }
          return true;
        });

        if (validRows.length === 0) {
          setValidationErrors(["Aucune ligne valide trouvée. Vérifiez les colonnes du fichier."]);
          return;
        }

        setParsedData(validRows);
        setValidationErrors(errors);
        setFileName(file.name);
        setStep("preview");
      } catch (err) {
        console.error("Erreur parsing Excel:", err);
        setValidationErrors(["Erreur lors de la lecture du fichier. Vérifiez le format."]);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseExcel(file);
    }
  };

  const importMutation = useMutation({
    mutationFn: async (rows: ParsedRow[]) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase.rpc("import_prestataires", {
        p_rows: JSON.parse(JSON.stringify(rows)),
        p_user_id: userData.user?.id,
      });
      if (error) throw error;
      return data as unknown as ImportResult;
    },
    onSuccess: (result) => {
      setImportResult(result);
      setStep("result");
      queryClient.invalidateQueries({ queryKey: ["prestataires"] });
      if (result.errors === 0) {
        toast.success(`${result.success} prestataires importés avec succès`);
      } else {
        toast.warning(`${result.success} importés, ${result.errors} erreurs`);
      }
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de l'import: " + error.message);
    },
  });

  const downloadTemplate = () => {
    const template = [
      {
        code: "PREST-0001",
        raison_sociale: "Exemple SARL",
        sigle: "EX",
        ninea: "123456789",
        nif: "NIF123",
        ifu: "IFU123",
        rccm: "RCCM-2024-001",
        cc: "CC123",
        adresse: "123 Rue Exemple",
        ville: "Dakar",
        telephone: "+221 77 123 4567",
        email: "contact@exemple.sn",
        contact_nom: "Mamadou DIOP",
        contact_telephone: "+221 77 987 6543",
        contact_email: "mamadou@exemple.sn",
        secteur_activite: "BTP",
        type_prestataire: "Fournisseur",
        statut: "ACTIF",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Prestataires");
    XLSX.writeFile(wb, "modele_import_prestataires.xlsx");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Excel - Prestataires
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && "Sélectionnez un fichier Excel contenant les prestataires à importer"}
            {step === "preview" && `${parsedData.length} lignes détectées - Vérifiez avant import`}
            {step === "result" && "Résultat de l'import"}
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-6 py-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-primary font-medium">Cliquez pour sélectionner</span>
                <span className="text-muted-foreground"> ou glissez un fichier</span>
              </Label>
              <Input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Formats acceptés: .xlsx, .xls
              </p>
            </div>

            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside">
                    {validationErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between items-center text-sm">
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Télécharger le modèle
              </Button>
              <p className="text-muted-foreground">
                Colonnes reconnues: code, raison_sociale, ninea, email, telephone...
              </p>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="outline">{fileName}</Badge>
              <Button variant="ghost" size="sm" onClick={resetDialog}>
                <X className="h-4 w-4 mr-1" />
                Changer de fichier
              </Button>
            </div>

            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {validationErrors.length} ligne(s) ignorée(s) car invalide(s)
                </AlertDescription>
              </Alert>
            )}

            <ScrollArea className="h-[300px] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Raison sociale</TableHead>
                    <TableHead>NINEA</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 50).map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {row.code || <span className="text-orange-500 italic">À générer</span>}
                      </TableCell>
                      <TableCell className="font-medium">{row.raison_sociale}</TableCell>
                      <TableCell className="font-mono text-xs">{row.ninea || "-"}</TableCell>
                      <TableCell className="text-sm">{row.email || "-"}</TableCell>
                      <TableCell className="text-sm">{row.telephone || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={row.statut?.toUpperCase() === "ACTIF" ? "default" : "secondary"}>
                          {row.statut || "ACTIF"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            {parsedData.length > 50 && (
              <p className="text-sm text-muted-foreground text-center">
                ... et {parsedData.length - 50} autres lignes
              </p>
            )}
          </div>
        )}

        {step === "result" && importResult && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Succès</span>
                </div>
                <p className="text-2xl font-bold text-green-800 dark:text-green-200 mt-1">
                  {importResult.success}
                </p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">Erreurs</span>
                </div>
                <p className="text-2xl font-bold text-red-800 dark:text-red-200 mt-1">
                  {importResult.errors}
                </p>
              </div>
            </div>

            {importResult.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-2">Avertissements:</p>
                  <ScrollArea className="h-[100px]">
                    <ul className="list-disc list-inside text-sm">
                      {importResult.warnings.map((w, i) => (
                        <li key={i}>Ligne {w.row}: {w.message}</li>
                      ))}
                    </ul>
                  </ScrollArea>
                </AlertDescription>
              </Alert>
            )}

            {importResult.error_details.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-2">Détails des erreurs:</p>
                  <ScrollArea className="h-[100px]">
                    <ul className="list-disc list-inside text-sm">
                      {importResult.error_details.map((e, i) => (
                        <li key={i}>Ligne {e.row} ({e.code}): {e.message}</li>
                      ))}
                    </ul>
                  </ScrollArea>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {step === "result" ? "Fermer" : "Annuler"}
          </Button>
          {step === "preview" && (
            <Button
              onClick={() => importMutation.mutate(parsedData)}
              disabled={importMutation.isPending}
            >
              {importMutation.isPending ? (
                <>
                  <Progress value={50} className="w-20 h-2 mr-2" />
                  Import en cours...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Importer {parsedData.length} prestataires
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
