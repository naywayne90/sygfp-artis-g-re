import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Download, FileSpreadsheet, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { toast } from "sonner";

interface BudgetImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ImportResult {
  success: number;
  errors: number;
  details: string[];
}

export function BudgetImport({ open, onOpenChange, onSuccess }: BudgetImportProps) {
  const { exercice } = useExercice();
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const headers = [
      "code",
      "label",
      "level",
      "dotation_initiale",
      "source_financement",
      "direction_code",
      "os_code",
      "mission_code",
      "action_code",
      "nbe_code",
      "sysco_code",
      "commentaire",
    ].join(";");

    const example = [
      "6110001",
      "Fournitures de bureau",
      "ligne",
      "5000000",
      "budget_etat",
      "DAAF",
      "OS1",
      "M1",
      "A1",
      "611",
      "6011",
      "Budget fonctionnement",
    ].join(";");

    const content = `${headers}\n${example}`;
    const blob = new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `modele_budget_${exercice}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success("Modèle téléchargé");
  };

  const parseCSV = (content: string): Record<string, string>[] => {
    const lines = content.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(/[;,]/).map((h) => h.trim().toLowerCase().replace(/"/g, ""));
    const data: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(/[;,]/).map((v) => v.trim().replace(/"/g, ""));
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      data.push(row);
    }

    return data;
  };

  const handleImport = async (file: File) => {
    setIsImporting(true);
    setResult(null);

    const importResult: ImportResult = { success: 0, errors: 0, details: [] };

    try {
      const content = await file.text();
      const rows = parseCSV(content);

      if (rows.length === 0) {
        throw new Error("Fichier vide ou format invalide");
      }

      // Fetch reference data for code lookups
      const [directions, objectifs, missions, actions, nbe, sysco] = await Promise.all([
        supabase.from("directions").select("id, code"),
        supabase.from("objectifs_strategiques").select("id, code"),
        supabase.from("missions").select("id, code"),
        supabase.from("actions").select("id, code"),
        supabase.from("nomenclature_nbe").select("id, code"),
        supabase.from("plan_comptable_sysco").select("id, code"),
      ]);

      const directionMap = new Map(directions.data?.map((d) => [d.code, d.id]) || []);
      const osMap = new Map(objectifs.data?.map((o) => [o.code, o.id]) || []);
      const missionMap = new Map(missions.data?.map((m) => [m.code, m.id]) || []);
      const actionMap = new Map(actions.data?.map((a) => [a.code, a.id]) || []);
      const nbeMap = new Map(nbe.data?.map((n) => [n.code, n.id]) || []);
      const syscoMap = new Map(sysco.data?.map((s) => [s.code, s.id]) || []);

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const lineNum = i + 2;

        // Validate required fields
        if (!row.code || !row.label || !row.level) {
          importResult.errors++;
          importResult.details.push(`Ligne ${lineNum}: Champs obligatoires manquants (code, label, level)`);
          continue;
        }

        // Check for duplicate code
        const { data: existing } = await supabase
          .from("budget_lines")
          .select("id")
          .eq("code", row.code)
          .eq("exercice", exercice || new Date().getFullYear())
          .maybeSingle();

        const budgetLine = {
          code: row.code,
          label: row.label,
          level: row.level,
          dotation_initiale: parseFloat(row.dotation_initiale) || 0,
          source_financement: row.source_financement || "budget_etat",
          direction_id: row.direction_code ? directionMap.get(row.direction_code) : null,
          os_id: row.os_code ? osMap.get(row.os_code) : null,
          mission_id: row.mission_code ? missionMap.get(row.mission_code) : null,
          action_id: row.action_code ? actionMap.get(row.action_code) : null,
          nbe_id: row.nbe_code ? nbeMap.get(row.nbe_code) : null,
          sysco_id: row.sysco_code ? syscoMap.get(row.sysco_code) : null,
          commentaire: row.commentaire || null,
          exercice: exercice || new Date().getFullYear(),
          statut: "brouillon",
        };

        let error;
        if (existing) {
          // Update existing
          const { error: updateError } = await supabase
            .from("budget_lines")
            .update(budgetLine)
            .eq("id", existing.id);
          error = updateError;
        } else {
          // Insert new
          const { error: insertError } = await supabase
            .from("budget_lines")
            .insert(budgetLine);
          error = insertError;
        }

        if (error) {
          importResult.errors++;
          importResult.details.push(`Ligne ${lineNum}: ${error.message}`);
        } else {
          importResult.success++;
        }
      }

      setResult(importResult);

      if (importResult.success > 0) {
        toast.success(`Import terminé: ${importResult.success} ligne(s) importée(s)`);
        onSuccess();
      }
    } catch (error: any) {
      toast.error("Erreur d'import: " + error.message);
      importResult.details.push(error.message);
      setResult(importResult);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import de lignes budgétaires</DialogTitle>
          <DialogDescription>
            Importez vos lignes budgétaires depuis un fichier CSV ou Excel
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button variant="outline" className="w-full" onClick={downloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Télécharger le modèle CSV
          </Button>

          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <FileSpreadsheet className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-3">
              Glissez un fichier CSV ici ou cliquez pour sélectionner
            </p>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImport(file);
              }}
            />
            <Button
              variant="secondary"
              disabled={isImporting}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              {isImporting ? "Import en cours..." : "Sélectionner un fichier"}
            </Button>
          </div>

          {result && (
            <div className="space-y-2">
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>{result.success} succès</span>
                </div>
                {result.errors > 0 && (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-4 w-4" />
                    <span>{result.errors} erreur(s)</span>
                  </div>
                )}
              </div>

              {result.details.length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <ul className="list-disc list-inside text-sm max-h-32 overflow-y-auto">
                      {result.details.slice(0, 10).map((detail, i) => (
                        <li key={i}>{detail}</li>
                      ))}
                      {result.details.length > 10 && (
                        <li>... et {result.details.length - 10} autres erreurs</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}