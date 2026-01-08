import { useState, useCallback } from "react";
import { useExercice } from "@/contexts/ExerciceContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";

type ExportType = "budget_lines" | "engagements" | "liquidations" | "ordonnancements" | "reglements";

interface ExportOption {
  id: ExportType;
  label: string;
  description: string;
}

const EXPORT_OPTIONS: ExportOption[] = [
  { id: "budget_lines", label: "Lignes budgétaires", description: "Structure et dotations du budget" },
  { id: "engagements", label: "Engagements", description: "Liste des engagements budgétaires" },
  { id: "liquidations", label: "Liquidations", description: "Liste des liquidations" },
  { id: "ordonnancements", label: "Ordonnancements", description: "Liste des ordonnancements" },
  { id: "reglements", label: "Règlements", description: "Liste des règlements effectués" },
];

export function BudgetExport() {
  const { exercice } = useExercice();
  const [selectedExercice, setSelectedExercice] = useState<number>(exercice || new Date().getFullYear());
  const [selectedExports, setSelectedExports] = useState<ExportType[]>(["budget_lines"]);
  const [isExporting, setIsExporting] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const toggleExport = useCallback((id: ExportType) => {
    setSelectedExports(prev =>
      prev.includes(id)
        ? prev.filter(e => e !== id)
        : [...prev, id]
    );
  }, []);

  const fetchData = useCallback(async (type: ExportType): Promise<any[]> => {
    switch (type) {
      case "budget_lines": {
        const { data, error } = await supabase
          .from("budget_lines")
          .select("*")
          .eq("exercice", selectedExercice)
          .order("code");
        if (error) throw error;
        return data || [];
      }
      case "engagements": {
        const { data, error } = await supabase
          .from("budget_engagements")
          .select("*")
          .eq("exercice", selectedExercice)
          .order("numero");
        if (error) throw error;
        return data || [];
      }
      case "liquidations": {
        const { data, error } = await supabase
          .from("budget_liquidations")
          .select("*")
          .eq("exercice", selectedExercice)
          .order("numero");
        if (error) throw error;
        return data || [];
      }
      case "ordonnancements": {
        const { data, error } = await supabase
          .from("ordonnancements")
          .select("*")
          .eq("exercice", selectedExercice)
          .order("numero");
        if (error) throw error;
        return data || [];
      }
      case "reglements": {
        const { data, error } = await supabase
          .from("reglements")
          .select("*")
          .eq("exercice", selectedExercice)
          .order("numero");
        if (error) throw error;
        return data || [];
      }
      default:
        return [];
    }
  }, [selectedExercice]);

  const handleExport = useCallback(async () => {
    if (selectedExports.length === 0) {
      toast.error("Sélectionnez au moins un type de données à exporter");
      return;
    }

    setIsExporting(true);
    
    try {
      const workbook = XLSX.utils.book_new();

      for (const exportType of selectedExports) {
        const data = await fetchData(exportType);
        const option = EXPORT_OPTIONS.find(o => o.id === exportType);
        
        if (data.length > 0) {
          const worksheet = XLSX.utils.json_to_sheet(data);
          XLSX.utils.book_append_sheet(workbook, worksheet, option?.label || exportType);
        }
      }

      const fileName = `SYGFP_Export_${selectedExercice}_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast.success(`Export réussi: ${fileName}`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Erreur lors de l'export");
    } finally {
      setIsExporting(false);
    }
  }, [selectedExports, selectedExercice, fetchData]);

  return (
    <div className="space-y-6">
      {/* Exercice selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Exercice budgétaire</CardTitle>
          <CardDescription>
            Sélectionnez l'exercice à exporter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs">
            <Label htmlFor="export-exercice">Exercice</Label>
            <Select
              value={String(selectedExercice)}
              onValueChange={(v) => setSelectedExercice(parseInt(v))}
            >
              <SelectTrigger id="export-exercice" className="mt-1.5">
                <SelectValue placeholder="Sélectionner l'exercice" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year} {year === currentYear && "(actif)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Export options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Données à exporter
          </CardTitle>
          <CardDescription>
            Sélectionnez les types de données à inclure dans le fichier Excel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {EXPORT_OPTIONS.map((option) => (
              <div
                key={option.id}
                className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                  selectedExports.includes(option.id)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => toggleExport(option.id)}
              >
                <Checkbox
                  id={option.id}
                  checked={selectedExports.includes(option.id)}
                  onCheckedChange={() => toggleExport(option.id)}
                />
                <div className="flex-1">
                  <Label htmlFor={option.id} className="cursor-pointer font-medium">
                    {option.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleExport}
          disabled={isExporting || selectedExports.length === 0}
          className="gap-2"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Export en cours...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Exporter ({selectedExports.length} onglet{selectedExports.length > 1 ? "s" : ""})
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
