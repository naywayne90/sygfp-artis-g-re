import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, FileSpreadsheet, Star } from "lucide-react";
import { SheetData } from "../BudgetImportWizard";

interface StepSheetSelectionProps {
  sheets: SheetData[];
  selectedSheet: string | null;
  onSheetSelect: (sheetName: string) => void;
}

export function StepSheetSelection({
  sheets,
  selectedSheet,
  onSheetSelect,
}: StepSheetSelectionProps) {
  const isPrioritized = (name: string) => {
    return name.toLowerCase().includes("groupé") || 
           name.includes("Groupe") || 
           name === "Groupé (2)" ||
           name === "Feuil3";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Table className="h-5 w-5" />
          Sélection de l'onglet
        </CardTitle>
        <CardDescription>
          {sheets.length} onglet(s) détecté(s) dans le fichier. 
          Les onglets "Groupé (2)" ou "Feuil3" sont prioritaires pour l'import.
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
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => onSheetSelect(sheet.name)}
              >
                <RadioGroupItem value={sheet.name} id={sheet.name} />
                <Label
                  htmlFor={sheet.name}
                  className="flex-1 cursor-pointer flex items-center gap-3"
                >
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{sheet.name}</span>
                      {isPrioritized(sheet.name) && (
                        <Badge variant="secondary" className="gap-1">
                          <Star className="h-3 w-3" />
                          Recommandé
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
  );
}
