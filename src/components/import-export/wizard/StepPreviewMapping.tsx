import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Columns, Eye, Code } from "lucide-react";
import { SheetData, ColumnMapping, ParsedRow } from "@/hooks/useExcelParser";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface StepPreviewMappingProps {
  sheet: SheetData;
  mapping: ColumnMapping;
  onMappingChange: (mapping: ColumnMapping) => void;
  missingRequired: (keyof ColumnMapping)[];
  parsedRows?: ParsedRow[];
}

const COLUMN_LABELS: Record<keyof ColumnMapping, { label: string; required: boolean }> = {
  imputation: { label: "Imputation", required: true },
  os: { label: "Objectif Stratégique (OS)", required: false },
  action: { label: "Action", required: false },
  activite: { label: "Activité", required: false },
  sousActivite: { label: "Sous-activité", required: false },
  direction: { label: "Direction", required: false },
  natureDépense: { label: "Nature dépense", required: false },
  nbe: { label: "NBE (Nature éco)", required: false },
  montant: { label: "Montant", required: true },
};

export function StepPreviewMapping({
  sheet,
  mapping,
  onMappingChange,
  missingRequired,
  parsedRows = [],
}: StepPreviewMappingProps) {
  const previewRows = sheet.data.slice(1, 21); // First 20 data rows
  const hasBlockingError = missingRequired.length > 0;

  const handleMappingChange = (key: keyof ColumnMapping, value: string) => {
    onMappingChange({
      ...mapping,
      [key]: value === "__none__" ? null : value,
    });
  };

  // Get first 20 parsed rows for computed preview
  const parsedPreview = parsedRows.slice(0, 20);

  return (
    <div className="space-y-6">
      {/* Blocking error alert */}
      {hasBlockingError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur bloquante</AlertTitle>
          <AlertDescription>
            Les colonnes suivantes sont obligatoires mais non mappées :{" "}
            {missingRequired.map(col => COLUMN_LABELS[col].label).join(", ")}
          </AlertDescription>
        </Alert>
      )}

      {/* Column mapping */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Columns className="h-5 w-5" />
            Mapping des colonnes
          </CardTitle>
          <CardDescription>
            Associez chaque champ requis à une colonne du fichier Excel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(Object.keys(COLUMN_LABELS) as (keyof ColumnMapping)[]).map((key) => (
              <div key={key} className="space-y-1.5">
                <Label className="flex items-center gap-2">
                  {COLUMN_LABELS[key].label}
                  {COLUMN_LABELS[key].required ? (
                    <Badge variant="destructive" className="text-xs">Requis</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">Optionnel</Badge>
                  )}
                </Label>
                <Select
                  value={mapping[key] || "__none__"}
                  onValueChange={(v) => handleMappingChange(key, v)}
                >
                  <SelectTrigger className={
                    COLUMN_LABELS[key].required && !mapping[key]
                      ? "border-destructive"
                      : mapping[key]
                      ? "border-green-500"
                      : ""
                  }>
                    <SelectValue placeholder="Sélectionner une colonne" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      <span className="text-muted-foreground">— Non mappé —</span>
                    </SelectItem>
                    {sheet.headers.filter(h => h).map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {mapping[key] && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    Mappé
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data preview with tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Aperçu des données
          </CardTitle>
          <CardDescription>
            {sheet.data.length - 1} lignes au total (colonnes "Total" ignorées automatiquement)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="raw" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="raw">Données brutes</TabsTrigger>
              <TabsTrigger value="extracted">Codes extraits</TabsTrigger>
            </TabsList>

            {/* Raw data tab */}
            <TabsContent value="raw">
              <div className="border rounded-lg overflow-auto max-h-[400px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead className="w-12 text-center">#</TableHead>
                      {sheet.headers.filter(h => h).map((header, idx) => (
                        <TableHead key={idx} className="min-w-[120px]">
                          <div className="flex items-center gap-1">
                            {header}
                            {Object.entries(mapping).some(([_, v]) => v === header) && (
                              <Badge variant="secondary" className="text-xs ml-1">
                                mappé
                              </Badge>
                            )}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map((row, rowIdx) => (
                      <TableRow key={rowIdx}>
                        <TableCell className="text-center text-muted-foreground text-xs">
                          {rowIdx + 2}
                        </TableCell>
                        {sheet.headers.filter(h => h).map((_, colIdx) => (
                          <TableCell key={colIdx} className="text-sm">
                            {row[colIdx] !== undefined && row[colIdx] !== null
                              ? String(row[colIdx]).substring(0, 50)
                              : <span className="text-muted-foreground italic">vide</span>}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Extracted codes tab */}
            <TabsContent value="extracted">
              <div className="border rounded-lg overflow-auto max-h-[400px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead className="w-12 text-center">#</TableHead>
                      <TableHead>Imputation (fichier)</TableHead>
                      <TableHead>Imputation (calculée)</TableHead>
                      <TableHead className="text-center">Format</TableHead>
                      <TableHead className="text-center">OS</TableHead>
                      <TableHead className="text-center">Act</TableHead>
                      <TableHead className="text-center">Activ</TableHead>
                      <TableHead className="text-center">S/Act</TableHead>
                      <TableHead className="text-center">Dir</TableHead>
                      <TableHead className="text-center">Nat</TableHead>
                      <TableHead>NBE</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="text-center">Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedPreview.map((row) => (
                      <TableRow key={row.rowNumber} className={!row.isValid ? "bg-red-50 dark:bg-red-950/20" : row.warnings.length > 0 ? "bg-yellow-50 dark:bg-yellow-950/20" : ""}>
                        <TableCell className="text-center text-muted-foreground text-xs">
                          {row.rowNumber}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {row.raw.imputation || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {row.computed.calculatedImputation ? (
                            <span className={row.raw.imputation && row.raw.imputation !== row.computed.calculatedImputation ? "text-destructive" : "text-green-600"}>
                              {row.computed.calculatedImputation}
                            </span>
                          ) : (
                            <span className="text-destructive">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.computed.imputationFormat ? (
                            <Badge variant="outline" className="text-xs">
                              {row.computed.imputationFormat}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs">
                          {row.computed.osCode !== null ? String(row.computed.osCode).padStart(2, "0") : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs">
                          {row.computed.actionCode !== null ? String(row.computed.actionCode).padStart(2, "0") : <span className="text-muted-foreground italic">∅</span>}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs">
                          {row.computed.activiteCode !== null ? String(row.computed.activiteCode).padStart(3, "0") : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs">
                          {row.computed.sousActiviteCode !== null ? String(row.computed.sousActiviteCode).padStart(3, "0") : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs">
                          {row.computed.directionCode !== null ? String(row.computed.directionCode).padStart(2, "0") : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs">
                          {row.computed.natureDepenseCode ?? <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {row.computed.nbeCode || <span className="text-destructive">—</span>}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {row.computed.montant !== null 
                            ? row.computed.montant.toLocaleString("fr-FR") 
                            : <span className="text-destructive">—</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.isValid ? (
                            row.warnings.length > 0 ? (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400 text-xs">
                                Alerte
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400 text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                OK
                              </Badge>
                            )
                          ) : (
                            <Badge variant="destructive" className="gap-1 text-xs">
                              <AlertCircle className="h-3 w-3" />
                              Erreur
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {parsedPreview.length > 0 && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Code className="h-4 w-4" />
                    Règles de calcul de l'imputation
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• <strong>Format 17 chiffres</strong> (Action vide) : OS(2) + Activité(3) + SousActivité(3) + Direction(2) + NatureDépense(1) + NBE(6)</li>
                    <li>• <strong>Format 19 chiffres</strong> (Action rempli) : OS(2) + Action(2) + Activité(3) + SousActivité(3) + Direction(2) + NatureDépense(1) + NBE(6)</li>
                    <li>• <strong>Validation croisée</strong> : si l'imputation du fichier diffère de celle calculée → erreur</li>
                    <li>• <strong>NBE</strong> : doit être exactement 6 chiffres</li>
                    <li>• <strong>Montant</strong> : doit être positif (FCFA)</li>
                  </ul>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
