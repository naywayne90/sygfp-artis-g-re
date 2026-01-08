import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, FileSpreadsheet, Star, RefreshCw, Database, Info } from "lucide-react";
import { SheetData } from "../BudgetImportWizard";

interface DetectedRefSheet {
  name: string;
  type: string;
}

interface StepSheetSelectionProps {
  sheets: SheetData[];
  selectedSheet: string | null;
  onSheetSelect: (sheetName: string) => void;
  syncReferentiels?: boolean;
  onSyncReferentielsChange?: (enabled: boolean) => void;
  detectedRefSheets?: DetectedRefSheet[];
}

const REF_TYPE_LABELS: Record<string, string> = {
  directions: "Directions",
  os: "Objectifs Stratégiques",
  activites: "Activités",
  sous_activites: "Sous-activités",
  nbe: "NBE",
  nature_depense: "Nature de dépense",
};

export function StepSheetSelection({
  sheets,
  selectedSheet,
  onSheetSelect,
  syncReferentiels = false,
  onSyncReferentielsChange,
  detectedRefSheets = [],
}: StepSheetSelectionProps) {
  const isPrioritized = (name: string) => {
    return name.toLowerCase().includes("groupé") || 
           name.includes("Groupe") || 
           name === "Groupé (2)" ||
           name === "Feuil3";
  };

  const isRefSheet = (name: string) => {
    return detectedRefSheets.some(r => r.name === name);
  };

  const getRefType = (name: string) => {
    const ref = detectedRefSheets.find(r => r.name === name);
    return ref ? REF_TYPE_LABELS[ref.type] || ref.type : null;
  };

  return (
    <div className="space-y-6">
      {/* Reference sync option */}
      {detectedRefSheets.length > 0 && onSyncReferentielsChange && (
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-600" />
              Synchroniser les référentiels
            </CardTitle>
            <CardDescription>
              Des onglets de référentiels ont été détectés dans le fichier
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sync-refs" className="text-base">
                  Importer les référentiels avant le budget
                </Label>
                <p className="text-sm text-muted-foreground">
                  Évite les erreurs si des codes ne sont pas encore connus
                </p>
              </div>
              <Switch
                id="sync-refs"
                checked={syncReferentiels}
                onCheckedChange={onSyncReferentielsChange}
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              {detectedRefSheets.map((ref) => (
                <Badge 
                  key={ref.name} 
                  variant="secondary"
                  className="gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                >
                  <Database className="h-3 w-3" />
                  {ref.name} ({REF_TYPE_LABELS[ref.type] || ref.type})
                </Badge>
              ))}
            </div>

            {syncReferentiels && (
              <Alert className="bg-blue-100/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 dark:text-blue-300">
                  Les référentiels seront synchronisés (upsert) sans supprimer les valeurs existantes.
                  Les libellés existants ne seront pas écrasés.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sheet selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Table className="h-5 w-5" />
            Sélection de l'onglet budgétaire
          </CardTitle>
          <CardDescription>
            {sheets.length} onglet(s) détecté(s). Sélectionnez l'onglet contenant les lignes budgétaires.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sheets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun onglet détecté dans le fichier
            </div>
          ) : (
            <RadioGroup
              value={selectedSheet || ""}
              onValueChange={onSheetSelect}
              className="space-y-3"
            >
              {sheets.map((sheet) => (
                <div
                  key={sheet.name}
                  className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                    selectedSheet === sheet.name
                      ? "border-primary bg-primary/5"
                      : isRefSheet(sheet.name)
                      ? "border-blue-200 bg-blue-50/30 dark:border-blue-800 dark:bg-blue-950/10"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => onSheetSelect(sheet.name)}
                >
                  <RadioGroupItem value={sheet.name} id={sheet.name} />
                  <Label
                    htmlFor={sheet.name}
                    className="flex-1 cursor-pointer flex items-center gap-3"
                  >
                    <FileSpreadsheet className={`h-5 w-5 ${isRefSheet(sheet.name) ? "text-blue-600" : "text-green-600"}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{sheet.name}</span>
                        {isPrioritized(sheet.name) && (
                          <Badge variant="secondary" className="gap-1">
                            <Star className="h-3 w-3" />
                            Recommandé
                          </Badge>
                        )}
                        {isRefSheet(sheet.name) && (
                          <Badge variant="outline" className="gap-1 text-blue-600 border-blue-300">
                            <Database className="h-3 w-3" />
                            {getRefType(sheet.name)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {sheet.data.length - 1} lignes · {sheet.headers.length} colonnes
                      </p>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
