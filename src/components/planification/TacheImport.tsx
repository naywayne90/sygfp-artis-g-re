import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useExercice } from "@/contexts/ExerciceContext";

export function TacheImport() {
  const [isOpen, setIsOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { exercice } = useExercice();

  const downloadTemplate = () => {
    const headers = [
      "code",
      "libelle",
      "description",
      "sous_activite_code",
      "date_debut",
      "date_fin",
      "duree_prevue",
      "responsable_email",
      "budget_line_code",
      "budget_prevu",
      "priorite",
      "livrables",
    ];
    const example = [
      "T1.1.1",
      "Rédaction du cahier des charges",
      "Description détaillée de la tâche",
      "SA1.1",
      "2026-01-15",
      "2026-02-15",
      "30",
      "user@example.com",
      "BL001",
      "5000000",
      "normale",
      "Livrable 1; Livrable 2",
    ];

    const csv = [headers.join(","), example.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_taches.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportProgress(0);
    setImportResult(null);

    try {
      const text = await file.text();
      const lines = text.split("\n").filter((line) => line.trim());
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const dataLines = lines.slice(1);

      // Fetch reference data
      const [sousActivitesRes, profilesRes, budgetLinesRes] = await Promise.all([
        supabase.from("sous_activites").select("id, code"),
        supabase.from("profiles").select("id, email"),
        supabase.from("budget_lines").select("id, code"),
      ]);

      const sousActivitesMap = new Map(sousActivitesRes.data?.map((sa) => [sa.code, sa.id]));
      const profilesMap = new Map(profilesRes.data?.map((p) => [p.email.toLowerCase(), p.id]));
      const budgetLinesMap = new Map(budgetLinesRes.data?.map((bl) => [bl.code, bl.id]));

      let successCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < dataLines.length; i++) {
        const values = dataLines[i].split(",").map((v) => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || "";
        });

        setImportProgress(Math.round(((i + 1) / dataLines.length) * 100));

        try {
          // Validate required fields
          if (!row.code || !row.libelle || !row.sous_activite_code) {
            errors.push(`Ligne ${i + 2}: Code, libellé et sous_activite_code sont obligatoires`);
            continue;
          }

          const sousActiviteId = sousActivitesMap.get(row.sous_activite_code);
          if (!sousActiviteId) {
            errors.push(`Ligne ${i + 2}: Sous-activité "${row.sous_activite_code}" non trouvée`);
            continue;
          }

          const tacheData: Record<string, unknown> = {
            code: row.code,
            libelle: row.libelle,
            description: row.description || null,
            sous_activite_id: sousActiviteId,
            exercice,
            statut: "planifie",
            priorite: row.priorite || "normale",
            avancement: 0,
          };

          if (row.date_debut) tacheData.date_debut = row.date_debut;
          if (row.date_fin) tacheData.date_fin = row.date_fin;
          if (row.duree_prevue) tacheData.duree_prevue = parseInt(row.duree_prevue);
          if (row.budget_prevu) tacheData.budget_prevu = parseFloat(row.budget_prevu);

          if (row.responsable_email) {
            const responsableId = profilesMap.get(row.responsable_email.toLowerCase());
            if (responsableId) tacheData.responsable_id = responsableId;
          }

          if (row.budget_line_code) {
            const budgetLineId = budgetLinesMap.get(row.budget_line_code);
            if (budgetLineId) tacheData.budget_line_id = budgetLineId;
          }

          if (row.livrables) {
            tacheData.livrables = row.livrables.split(";").map((l) => l.trim());
          }

          // Check if exists
          const { data: existing } = await supabase
            .from("taches")
            .select("id")
            .eq("code", row.code)
            .eq("exercice", exercice)
            .single();

          if (existing) {
            await supabase.from("taches").update(tacheData as Record<string, unknown>).eq("id", existing.id);
          } else {
            await supabase.from("taches").insert(tacheData as { code: string; libelle: string; sous_activite_id: string; exercice: number; statut: string; priorite: string; avancement: number });
          }

          successCount++;
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          errors.push(`Ligne ${i + 2}: ${errorMessage}`);
        }
      }

      setImportResult({ success: successCount, errors });
      queryClient.invalidateQueries({ queryKey: ["taches-planification"] });

      if (successCount > 0) {
        toast.success(`${successCount} tâche(s) importée(s)`);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error("Erreur lors de l'import: " + errorMessage);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Importer CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importer des tâches</DialogTitle>
          <DialogDescription>
            Importez vos tâches depuis un fichier CSV
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Button variant="outline" onClick={downloadTemplate} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Télécharger le modèle CSV
          </Button>

          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="csv-import"
            />
            <label htmlFor="csv-import" className="cursor-pointer">
              <FileSpreadsheet className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Cliquez pour sélectionner un fichier CSV
              </p>
            </label>
          </div>

          {isImporting && (
            <div className="space-y-2">
              <Progress value={importProgress} />
              <p className="text-sm text-center text-muted-foreground">
                Import en cours... {importProgress}%
              </p>
            </div>
          )}

          {importResult && (
            <div className="space-y-2">
              {importResult.success > 0 && (
                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription>
                    {importResult.success} tâche(s) importée(s) avec succès
                  </AlertDescription>
                </Alert>
              )}
              {importResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium mb-1">{importResult.errors.length} erreur(s):</p>
                    <ul className="text-xs space-y-1 max-h-32 overflow-y-auto">
                      {importResult.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      {importResult.errors.length > 5 && (
                        <li>... et {importResult.errors.length - 5} autres</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
