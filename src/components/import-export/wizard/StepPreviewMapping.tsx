import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Columns, Eye } from "lucide-react";
import { SheetData, ColumnMapping } from "../BudgetImportWizard";

interface StepPreviewMappingProps {
  sheet: SheetData;
  mapping: ColumnMapping;
  onMappingChange: (mapping: ColumnMapping) => void;
  missingRequired: (keyof ColumnMapping)[];
}

const COLUMN_LABELS: Record<keyof ColumnMapping, { label: string; required: boolean }> = {
  imputation: { label: "Imputation", required: true },
  os: { label: "Objectif Stratégique (OS)", required: false },
  action: { label: "Action", required: false },
  activite: { label: "Activité", required: false },
  sousActivite: { label: "Sous-activité", required: false },
  direction: { label: "Direction", required: false },
  natureDépense: { label: "Nature dépense", required: false },
  nbe: { label: "NBE", required: false },
  montant: { label: "Montant", required: true },
};

export function StepPreviewMapping({
  sheet,
  mapping,
  onMappingChange,
  missingRequired,
}: StepPreviewMappingProps) {
  const previewRows = sheet.data.slice(1, 21); // First 20 data rows
  const hasBlockingError = missingRequired.length > 0;

  const handleMappingChange = (key: keyof ColumnMapping, value: string) => {
    onMappingChange({
      ...mapping,
      [key]: value === "__none__" ? null : value,
    });
  };

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

      {/* Data preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Aperçu des données
          </CardTitle>
          <CardDescription>
            20 premières lignes du fichier (sur {sheet.data.length - 1} au total)
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}
