import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  FileCheck, 
  Loader2, 
  Upload,
  PartyPopper,
  Database,
  FileSpreadsheet
} from "lucide-react";
import { ValidationError } from "../BudgetImportWizard";
import { ParsedRow } from "@/hooks/useExcelParser";

interface StepValidationImportProps {
  validationErrors: ValidationError[];
  isValidating: boolean;
  isImporting: boolean;
  importComplete: boolean;
  importStats: { success: number; errors: number } | null;
  onValidate: () => Promise<boolean>;
  onImport: () => Promise<void>;
  parsedRows?: ParsedRow[];
}

export function StepValidationImport({
  validationErrors,
  isValidating,
  isImporting,
  importComplete,
  importStats,
  onValidate,
  onImport,
  parsedRows = [],
}: StepValidationImportProps) {
  const errorCount = validationErrors.filter(e => e.severity === "error").length;
  const warningCount = validationErrors.filter(e => e.severity === "warning").length;
  const validRowsCount = parsedRows.filter(r => r.isValid).length;
  const canImport = errorCount === 0 && !isImporting && !importComplete;

  if (importComplete && importStats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <PartyPopper className="h-16 w-16 mx-auto text-green-600 mb-4" />
            <h3 className="text-2xl font-bold text-foreground mb-2">Import terminé !</h3>
            <p className="text-muted-foreground mb-6">
              Les données ont été importées dans la base de données.
            </p>
            <div className="flex justify-center gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <p className="text-3xl font-bold text-green-600">{importStats.success}</p>
                <p className="text-sm text-muted-foreground">Lignes importées</p>
              </div>
              {importStats.errors > 0 && (
                <div className="text-center p-4 bg-red-50 dark:bg-red-950/30 rounded-lg">
                  <p className="text-3xl font-bold text-red-600">{importStats.errors}</p>
                  <p className="text-sm text-muted-foreground">Erreurs</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{parsedRows.length}</p>
                <p className="text-xs text-muted-foreground">Lignes totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{validRowsCount}</p>
                <p className="text-xs text-muted-foreground">Lignes valides</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold text-destructive">{errorCount}</p>
                <p className="text-xs text-muted-foreground">Erreurs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">{warningCount}</p>
                <p className="text-xs text-muted-foreground">Avertissements</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Validation status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Validation des données
          </CardTitle>
          <CardDescription>
            Vérification des données avant import dans la zone de staging
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isValidating ? (
            <div className="flex items-center gap-3 py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Validation et chargement dans la zone de staging...</span>
            </div>
          ) : validationErrors.length === 0 ? (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950/30">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-600">Validation réussie</AlertTitle>
              <AlertDescription>
                Aucune erreur détectée. Les données ont été chargées dans la zone de staging. 
                Vous pouvez procéder à l'import final.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex gap-4">
                {errorCount > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errorCount} erreur(s) bloquante(s)
                  </Badge>
                )}
                {warningCount > 0 && (
                  <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500">
                    <AlertTriangle className="h-3 w-3" />
                    {warningCount} avertissement(s)
                  </Badge>
                )}
              </div>

              {/* Errors table */}
              <div className="border rounded-lg overflow-auto max-h-[300px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead className="w-20">Ligne</TableHead>
                      <TableHead className="w-32">Colonne</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead className="w-24">Sévérité</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validationErrors.slice(0, 50).map((error, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono">{error.row}</TableCell>
                        <TableCell>{error.column}</TableCell>
                        <TableCell>{error.message}</TableCell>
                        <TableCell>
                          {error.severity === "error" ? (
                            <Badge variant="destructive" className="gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Erreur
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500">
                              <AlertTriangle className="h-3 w-3" />
                              Alerte
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {validationErrors.length > 50 && (
                <p className="text-sm text-muted-foreground text-center">
                  Affichage limité aux 50 premières erreurs ({validationErrors.length} au total)
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import action */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-5 w-5" />
            Importer les données
          </CardTitle>
          <CardDescription>
            {canImport
              ? "Les données sont en zone de staging. Cliquez pour finaliser l'import vers les lignes budgétaires."
              : errorCount > 0
              ? "Corrigez les erreurs avant de pouvoir importer"
              : "Import en cours..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onValidate}
              disabled={isValidating || isImporting}
            >
              {isValidating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Validation...
                </>
              ) : (
                <>
                  <FileCheck className="h-4 w-4 mr-2" />
                  Re-valider
                </>
              )}
            </Button>
            <Button
              onClick={onImport}
              disabled={!canImport}
              className="gap-2"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Import en cours...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Importer ({validRowsCount} lignes)
                </>
              )}
            </Button>
          </div>

          {isImporting && (
            <div className="mt-4">
              <Progress value={undefined} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                Import des lignes budgétaires en cours depuis la zone de staging...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
