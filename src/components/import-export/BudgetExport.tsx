import { useState, useCallback, useEffect } from "react";
import { useExercice } from "@/contexts/ExerciceContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  FileSpreadsheet, 
  Loader2, 
  FileDown, 
  AlertCircle,
  FileWarning,
  LayoutTemplate,
  Database,
  Layers,
  CheckCircle2
} from "lucide-react";
import * as XLSX from "xlsx";

// Template column definitions for budget lines
const BUDGET_COLUMNS = [
  { key: "imputation_code", header: "N° Imputation", width: 22 },
  { key: "os", header: "OS", width: 10 },
  { key: "action", header: "Action", width: 10 },
  { key: "activite", header: "Activité", width: 12 },
  { key: "sous_activite", header: "Sous-Activité", width: 15 },
  { key: "direction", header: "Direction", width: 12 },
  { key: "nature_depense", header: "Nature Dépense", width: 15 },
  { key: "nbe", header: "NBE", width: 12 },
  { key: "montant", header: "Montant", width: 18 },
  { key: "lib_projet", header: "Libellé Projet", width: 40 },
];

// Referential sheets configuration
const REFERENTIAL_SHEETS = {
  os: { name: "OS", columns: ["Code", "Libellé"] },
  actions: { name: "Actions", columns: ["Code", "Libellé", "Code OS"] },
  directions: { name: "Directions", columns: ["Code", "Libellé"] },
  activites: { name: "Activités", columns: ["Code", "Libellé"] },
  sousActivites: { name: "Sous-Activités", columns: ["Code", "Libellé", "Code Activité"] },
  nbe: { name: "NBE", columns: ["Code (6 chiffres)", "Libellé"] },
  natureDepense: { name: "Nature Dépense", columns: ["Code", "Libellé"] },
};

interface ImportRun {
  id: string;
  filename: string;
  created_at: string;
  status: string;
  total_rows: number;
  ok_rows: number;
  error_rows: number;
}

/**
 * Force a cell to be treated as TEXT in Excel to avoid E+17 scientific notation bug
 */
function forceTextCell(value: string | number | null): { t: string; v: string; z: string } {
  const strValue = value?.toString() || "";
  return { t: "s", v: strValue, z: "@" };
}

export function BudgetExport() {
  const { exercice } = useExercice();
  const [selectedExercice, setSelectedExercice] = useState<number>(exercice || new Date().getFullYear());
  const [isExportingTemplate, setIsExportingTemplate] = useState(false);
  const [isExportingBudget, setIsExportingBudget] = useState(false);
  const [isExportingReferentiels, setIsExportingReferentiels] = useState(false);
  const [isExportingErrors, setIsExportingErrors] = useState(false);
  const [importRuns, setImportRuns] = useState<ImportRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [budgetLineCount, setBudgetLineCount] = useState<number>(0);
  const [referentialCounts, setReferentialCounts] = useState<Record<string, number>>({});

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  // Fetch import runs with errors & budget stats
  useEffect(() => {
    const fetchData = async () => {
      // Import runs with errors
      const { data: runs } = await supabase
        .from("import_runs")
        .select("id, filename, created_at, status, total_rows, ok_rows, error_rows")
        .eq("exercice_id", String(selectedExercice))
        .gt("error_rows", 0)
        .order("created_at", { ascending: false })
        .limit(10);

      if (runs) {
        setImportRuns(runs);
        if (runs.length > 0 && !selectedRunId) {
          setSelectedRunId(runs[0].id);
        }
      }

      // Budget line count
      const { count: lineCount } = await supabase
        .from("budget_lines")
        .select("*", { count: "exact", head: true })
        .eq("exercice", selectedExercice);

      setBudgetLineCount(lineCount || 0);

      // Referential counts
      const [osRes, actRes, dirRes, activityRes, sousActRes, nbeRes, nveRes] = await Promise.all([
        supabase.from("objectifs_strategiques").select("id", { count: "exact", head: true }),
        supabase.from("actions").select("id", { count: "exact", head: true }),
        supabase.from("directions").select("id", { count: "exact", head: true }),
        supabase.from("activites").select("id", { count: "exact", head: true }),
        supabase.from("sous_activites").select("id", { count: "exact", head: true }),
        supabase.from("nomenclature_nbe").select("id", { count: "exact", head: true }),
        supabase.from("ref_nve").select("id", { count: "exact", head: true }),
      ]);

      setReferentialCounts({
        os: osRes.count || 0,
        actions: actRes.count || 0,
        directions: dirRes.count || 0,
        activites: activityRes.count || 0,
        sousActivites: sousActRes.count || 0,
        nbe: nbeRes.count || 0,
        natureDepense: nveRes.count || 0,
      });
    };

    fetchData();
  }, [selectedExercice, selectedRunId]);

  // =====================================================
  // EXPORT 1: Template d'import officiel (vide)
  // =====================================================
  const handleExportTemplate = useCallback(async () => {
    setIsExportingTemplate(true);
    
    try {
      const workbook = XLSX.utils.book_new();
      
      // ========== Feuille "Structure Budgétaire" (template vide) ==========
      const budgetHeaders = BUDGET_COLUMNS.map(col => col.header);
      const budgetWs = XLSX.utils.aoa_to_sheet([budgetHeaders]);
      
      // Set column widths and force text format for imputation column
      budgetWs["!cols"] = BUDGET_COLUMNS.map(col => ({ wch: col.width }));
      
      // Add example row with TEXT format for imputation
      const exampleRow = [
        forceTextCell("012345678901234567"), // 18 digits as TEXT
        "01", "02", "001", "01", "01", "1", "671700", 1000000, "Exemple de projet"
      ];
      XLSX.utils.sheet_add_aoa(budgetWs, [exampleRow], { origin: "A2" });
      
      // Force column A (imputation) to text format
      budgetWs["A2"] = forceTextCell("012345678901234567");
      
      XLSX.utils.book_append_sheet(workbook, budgetWs, "Structure Budgétaire");

      // ========== Feuilles référentiels vides ==========
      Object.entries(REFERENTIAL_SHEETS).forEach(([key, config]) => {
        const ws = XLSX.utils.aoa_to_sheet([config.columns]);
        ws["!cols"] = config.columns.map(() => ({ wch: 25 }));
        XLSX.utils.book_append_sheet(workbook, ws, config.name);
      });

      // ========== Feuille Instructions ==========
      const instructions = [
        ["╔══════════════════════════════════════════════════════════════╗"],
        ["║  TEMPLATE D'IMPORT OFFICIEL SYGFP - ARTI                     ║"],
        ["╚══════════════════════════════════════════════════════════════╝"],
        [""],
        ["📋 STRUCTURE DE L'IMPORT"],
        [""],
        ["Ce fichier contient plusieurs feuilles:"],
        ["  • Structure Budgétaire : Les lignes de crédit à importer"],
        ["  • OS, Actions, Directions, etc. : Les référentiels (optionnels)"],
        [""],
        ["══════════════════════════════════════════════════════════════"],
        ["📌 FEUILLE \"Structure Budgétaire\" - COLONNES OBLIGATOIRES"],
        ["══════════════════════════════════════════════════════════════"],
        [""],
        ["N° Imputation (TEXTE, 18 chiffres)"],
        ["  Format: OS(2) + Action(2) + Activité(3) + SousAct(2) + Dir(2) + NatDep(1) + NBE(6)"],
        ["  Exemple: 010200101011671700"],
        ["  ⚠️ IMPORTANT: Formater cette colonne en TEXTE avant saisie!"],
        [""],
        ["Montant (Nombre, ≥ 0)"],
        ["  Dotation initiale en FCFA"],
        [""],
        ["══════════════════════════════════════════════════════════════"],
        ["📌 COLONNES OPTIONNELLES (utilisées si imputation absente)"],
        ["══════════════════════════════════════════════════════════════"],
        [""],
        ["OS (2 chiffres) : Code Objectif Stratégique"],
        ["Action (2 chiffres) : Code Action"],
        ["Activité (3 chiffres) : Code Activité"],
        ["Sous-Activité (2 chiffres) : Code Sous-Activité"],
        ["Direction (2 chiffres) : Code Direction"],
        ["Nature Dépense (1 chiffre) : Code Nature de dépense"],
        ["NBE (6 chiffres) : Code Nature Budgétaire et Économique"],
        ["Libellé Projet (Texte) : Description du projet (optionnel)"],
        [""],
        ["══════════════════════════════════════════════════════════════"],
        ["⚠️ RÈGLES DE VALIDATION"],
        ["══════════════════════════════════════════════════════════════"],
        [""],
        ["✅ L'imputation doit être exactement 18 chiffres"],
        ["✅ Le NBE doit être exactement 6 chiffres"],
        ["✅ Le montant doit être un nombre ≥ 0"],
        ["✅ Les codes peuvent être au format '01 - Libellé' (extraction auto)"],
        [""],
        ["══════════════════════════════════════════════════════════════"],
        ["📦 IMPORT DES RÉFÉRENTIELS (OPTIONNEL)"],
        ["══════════════════════════════════════════════════════════════"],
        [""],
        ["Si vous remplissez les feuilles OS, Actions, Directions, etc.,"],
        ["le système les importera automatiquement en mode UPSERT:"],
        ["  • Les nouveaux codes seront créés"],
        ["  • Les codes existants seront mis à jour"],
        ["  • Aucune donnée existante ne sera supprimée"],
        [""],
      ];
      
      const instructionWs = XLSX.utils.aoa_to_sheet(instructions);
      instructionWs["!cols"] = [{ wch: 70 }];
      XLSX.utils.book_append_sheet(workbook, instructionWs, "Instructions");
      
      const fileName = `Template_Import_SYGFP_${selectedExercice}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast.success(`Template officiel exporté: ${fileName}`);
    } catch (error) {
      console.error("Export template error:", error);
      toast.error("Erreur lors de l'export du template");
    } finally {
      setIsExportingTemplate(false);
    }
  }, [selectedExercice]);

  // =====================================================
  // EXPORT 2: Structure budgétaire (lignes existantes)
  // =====================================================
  const handleExportBudget = useCallback(async () => {
    setIsExportingBudget(true);
    
    try {
      // Fetch budget lines with related data
      const { data: lines, error } = await supabase
        .from("budget_lines")
        .select(`
          code,
          label,
          dotation_initiale,
          direction_id,
          os_id,
          activite_id,
          sous_activite_id,
          nbe_id,
          directions:direction_id(code, label),
          objectifs_strategiques:os_id(code, libelle),
          activites:activite_id(code, libelle),
          sous_activites:sous_activite_id(code, libelle),
          nomenclature_nbe:nbe_id(code, libelle)
        `)
        .eq("exercice", selectedExercice)
        .order("code");

      if (error) throw error;

      if (!lines || lines.length === 0) {
        toast.warning("Aucune ligne budgétaire à exporter pour cet exercice");
        return;
      }

      const workbook = XLSX.utils.book_new();
      
      // Create headers
      const headers = BUDGET_COLUMNS.map(col => col.header);
      const ws = XLSX.utils.aoa_to_sheet([headers]);
      
      // Add data rows with TEXT format for imputation_code
      lines.forEach((line: any, index) => {
        const rowIndex = index + 2; // Row 1 is header
        
        // Parse action from code if available (positions 3-4 in 18-digit code)
        const codeStr = line.code || "";
        const actionCode = codeStr.length >= 4 ? codeStr.substring(2, 4) : "";
        const natureDepenseCode = codeStr.length >= 13 ? codeStr.substring(11, 12) : "";
        
        const rowData = [
          line.code || "", // Will be forced to text
          (line.objectifs_strategiques as any)?.code || "",
          actionCode,
          (line.activites as any)?.code || "",
          (line.sous_activites as any)?.code || "",
          (line.directions as any)?.code || "",
          natureDepenseCode,
          (line.nomenclature_nbe as any)?.code || "",
          line.dotation_initiale || 0,
          line.label || "",
        ];
        
        XLSX.utils.sheet_add_aoa(ws, [rowData], { origin: `A${rowIndex}` });
        
        // Force imputation_code (column A) to TEXT format
        const cellRef = `A${rowIndex}`;
        ws[cellRef] = forceTextCell(line.code);
      });
      
      // Set column widths
      ws["!cols"] = BUDGET_COLUMNS.map(col => ({ wch: col.width }));
      
      XLSX.utils.book_append_sheet(workbook, ws, "Structure Budgétaire");
      
      // Add summary sheet
      const summary = [
        ["Export Structure Budgétaire - SYGFP"],
        [""],
        ["Exercice:", selectedExercice],
        ["Date export:", new Date().toLocaleDateString("fr-FR")],
        ["Nombre de lignes:", lines.length],
        [""],
        ["Ce fichier peut être ré-importé dans SYGFP."],
        ["La colonne 'N° Imputation' est formatée en TEXTE."],
      ];
      const summaryWs = XLSX.utils.aoa_to_sheet(summary);
      summaryWs["!cols"] = [{ wch: 25 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(workbook, summaryWs, "Résumé");
      
      const fileName = `Structure_Budgetaire_${selectedExercice}_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast.success(`Export terminé: ${lines.length} ligne(s)`);
    } catch (error) {
      console.error("Export budget error:", error);
      toast.error("Erreur lors de l'export du budget");
    } finally {
      setIsExportingBudget(false);
    }
  }, [selectedExercice]);

  // =====================================================
  // EXPORT 3: Référentiels complets
  // =====================================================
  const handleExportReferentiels = useCallback(async () => {
    setIsExportingReferentiels(true);
    
    try {
      const workbook = XLSX.utils.book_new();
      
      // Fetch all referential data
      const [osRes, actionsRes, dirsRes, activitesRes, sousActRes, nbeRes, nveRes] = await Promise.all([
        supabase.from("objectifs_strategiques").select("code, libelle").order("code"),
        supabase.from("actions").select("code, libelle, os_id, objectifs_strategiques(code)").order("code"),
        supabase.from("directions").select("code, label").order("code"),
        supabase.from("activites").select("code, libelle").order("code"),
        supabase.from("sous_activites").select("code, libelle, activite_id, activites(code)").order("code"),
        supabase.from("nomenclature_nbe").select("code, libelle").order("code"),
        supabase.from("ref_nve").select("code_nve, libelle").order("code_nve"),
      ]);

      // OS Sheet
      if (osRes.data && osRes.data.length > 0) {
        const osData = [["Code", "Libellé"], ...osRes.data.map((r: any) => [r.code, r.libelle])];
        const osWs = XLSX.utils.aoa_to_sheet(osData);
        osWs["!cols"] = [{ wch: 10 }, { wch: 50 }];
        XLSX.utils.book_append_sheet(workbook, osWs, "OS");
      }

      // Actions Sheet
      if (actionsRes.data && actionsRes.data.length > 0) {
        const actionsData = [["Code", "Libellé", "Code OS"], ...actionsRes.data.map((r: any) => [
          r.code, r.libelle, (r.objectifs_strategiques as any)?.code || ""
        ])];
        const actionsWs = XLSX.utils.aoa_to_sheet(actionsData);
        actionsWs["!cols"] = [{ wch: 10 }, { wch: 50 }, { wch: 10 }];
        XLSX.utils.book_append_sheet(workbook, actionsWs, "Actions");
      }

      // Directions Sheet
      if (dirsRes.data && dirsRes.data.length > 0) {
        const dirsData = [["Code", "Libellé"], ...dirsRes.data.map((r: any) => [r.code, r.label])];
        const dirsWs = XLSX.utils.aoa_to_sheet(dirsData);
        dirsWs["!cols"] = [{ wch: 10 }, { wch: 50 }];
        XLSX.utils.book_append_sheet(workbook, dirsWs, "Directions");
      }

      // Activités Sheet
      if (activitesRes.data && activitesRes.data.length > 0) {
        const activitesData = [["Code", "Libellé"], ...activitesRes.data.map((r: any) => [r.code, r.libelle])];
        const activitesWs = XLSX.utils.aoa_to_sheet(activitesData);
        activitesWs["!cols"] = [{ wch: 10 }, { wch: 50 }];
        XLSX.utils.book_append_sheet(workbook, activitesWs, "Activités");
      }

      // Sous-Activités Sheet
      if (sousActRes.data && sousActRes.data.length > 0) {
        const sousActData = [["Code", "Libellé", "Code Activité"], ...sousActRes.data.map((r: any) => [
          r.code, r.libelle, (r.activites as any)?.code || ""
        ])];
        const sousActWs = XLSX.utils.aoa_to_sheet(sousActData);
        sousActWs["!cols"] = [{ wch: 10 }, { wch: 50 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(workbook, sousActWs, "Sous-Activités");
      }

      // NBE Sheet
      if (nbeRes.data && nbeRes.data.length > 0) {
        const nbeData = [["Code (6 chiffres)", "Libellé"], ...nbeRes.data.map((r: any) => [r.code, r.libelle])];
        const nbeWs = XLSX.utils.aoa_to_sheet(nbeData);
        nbeWs["!cols"] = [{ wch: 18 }, { wch: 50 }];
        XLSX.utils.book_append_sheet(workbook, nbeWs, "NBE");
      }

      // Nature Dépense Sheet
      if (nveRes.data && nveRes.data.length > 0) {
        const nveData = [["Code", "Libellé"], ...nveRes.data.map((r: any) => [r.code_nve, r.libelle])];
        const nveWs = XLSX.utils.aoa_to_sheet(nveData);
        nveWs["!cols"] = [{ wch: 10 }, { wch: 50 }];
        XLSX.utils.book_append_sheet(workbook, nveWs, "Nature Dépense");
      }

      // Summary Sheet
      const summary = [
        ["Export Référentiels SYGFP"],
        [""],
        ["Date export:", new Date().toLocaleDateString("fr-FR")],
        [""],
        ["Contenu:"],
        ["  • OS:", osRes.data?.length || 0],
        ["  • Actions:", actionsRes.data?.length || 0],
        ["  • Directions:", dirsRes.data?.length || 0],
        ["  • Activités:", activitesRes.data?.length || 0],
        ["  • Sous-Activités:", sousActRes.data?.length || 0],
        ["  • NBE:", nbeRes.data?.length || 0],
        ["  • Nature Dépense:", nveRes.data?.length || 0],
        [""],
        ["Ce fichier peut être utilisé pour alimenter les référentiels"],
        ["d'un autre système ou pour sauvegarde."],
      ];
      const summaryWs = XLSX.utils.aoa_to_sheet(summary);
      summaryWs["!cols"] = [{ wch: 25 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(workbook, summaryWs, "Résumé");
      
      const fileName = `Referentiels_SYGFP_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast.success("Référentiels exportés avec succès");
    } catch (error) {
      console.error("Export referentiels error:", error);
      toast.error("Erreur lors de l'export des référentiels");
    } finally {
      setIsExportingReferentiels(false);
    }
  }, []);

  // =====================================================
  // EXPORT 4: Rapport d'erreurs d'import
  // =====================================================
  const handleExportErrors = useCallback(async () => {
    if (!selectedRunId) {
      toast.error("Sélectionnez un import à analyser");
      return;
    }

    setIsExportingErrors(true);
    
    try {
      const { data: stagingData, error } = await supabase
        .from("import_budget_staging")
        .select("*")
        .eq("run_id", selectedRunId)
        .eq("validation_status", "error")
        .order("row_number");

      if (error) throw error;

      if (!stagingData || stagingData.length === 0) {
        toast.info("Aucune erreur trouvée pour cet import");
        return;
      }

      const run = importRuns.find(r => r.id === selectedRunId);
      const workbook = XLSX.utils.book_new();

      // Error details sheet
      const exportData = stagingData.map((row: any) => ({
        "Ligne": row.row_number,
        "Statut": row.validation_status,
        "Erreurs": row.validation_errors || "",
        "Imputation fichier": row.raw_imputation || "",
        "Imputation calculée": row.computed_imputation || "",
        "OS": row.raw_os || "",
        "Action": row.raw_action || "",
        "Activité": row.raw_activite || "",
        "Sous-activité": row.raw_sous_activite || "",
        "Direction": row.raw_direction || "",
        "Nature dépense": row.raw_nature_depense || "",
        "NBE": row.raw_nbe || "",
        "Montant": row.raw_montant || "",
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      ws["!cols"] = [
        { wch: 8 }, { wch: 10 }, { wch: 50 }, { wch: 22 }, { wch: 22 },
        { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 12 },
        { wch: 15 }, { wch: 12 }, { wch: 15 },
      ];
      XLSX.utils.book_append_sheet(workbook, ws, "Erreurs");

      // Summary sheet
      const errorCounts: Record<string, number> = {};
      stagingData.forEach((row: any) => {
        if (row.validation_errors) {
          const errors = row.validation_errors.split(";");
          errors.forEach((err: string) => {
            const cleanErr = err.trim().split(":")[0].trim();
            if (cleanErr) errorCounts[cleanErr] = (errorCounts[cleanErr] || 0) + 1;
          });
        }
      });

      const summary = [
        ["Rapport d'erreurs d'import"],
        [""],
        ["Fichier source:", run?.filename || "Inconnu"],
        ["Date import:", run ? new Date(run.created_at).toLocaleString("fr-FR") : ""],
        [""],
        ["Statistiques:"],
        ["Total lignes:", run?.total_rows || 0],
        ["Lignes valides:", run?.ok_rows || 0],
        ["Lignes en erreur:", run?.error_rows || 0],
        [""],
        ["Erreurs fréquentes:"],
        ...Object.entries(errorCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([err, count]) => [`  - ${err}:`, count]),
      ];

      const summaryWs = XLSX.utils.aoa_to_sheet(summary);
      summaryWs["!cols"] = [{ wch: 40 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(workbook, summaryWs, "Résumé");

      const fileName = `Erreurs_Import_${selectedExercice}_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast.success(`Rapport d'erreurs exporté: ${stagingData.length} erreur(s)`);
    } catch (error) {
      console.error("Export errors error:", error);
      toast.error("Erreur lors de l'export du rapport");
    } finally {
      setIsExportingErrors(false);
    }
  }, [selectedRunId, selectedExercice, importRuns]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Exports Excel</h2>
          <p className="text-sm text-muted-foreground">
            Exporter la structure budgétaire, les référentiels ou télécharger le template officiel
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="export-exercice" className="text-sm">Exercice:</Label>
          <Select
            value={String(selectedExercice)}
            onValueChange={(v) => setSelectedExercice(parseInt(v))}
          >
            <SelectTrigger id="export-exercice" className="w-32">
              <SelectValue />
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
      </div>

      <Tabs defaultValue="structure" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="structure" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Structure
          </TabsTrigger>
          <TabsTrigger value="referentiels" className="gap-2">
            <Database className="h-4 w-4" />
            Référentiels
          </TabsTrigger>
          <TabsTrigger value="template" className="gap-2">
            <LayoutTemplate className="h-4 w-4" />
            Template
          </TabsTrigger>
          <TabsTrigger value="erreurs" className="gap-2">
            <FileWarning className="h-4 w-4" />
            Erreurs
          </TabsTrigger>
        </TabsList>

        {/* Structure Budgétaire */}
        <TabsContent value="structure">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                Export Structure Budgétaire
              </CardTitle>
              <CardDescription>
                Exporter toutes les lignes budgétaires de l'exercice {selectedExercice} au format Excel ré-importable
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="text-base px-3 py-1">
                  {budgetLineCount} ligne(s)
                </Badge>
                <span className="text-sm text-muted-foreground">
                  disponible(s) pour l'exercice {selectedExercice}
                </span>
              </div>

              <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700 dark:text-blue-300">
                  <strong>Format ré-importable:</strong> La colonne <code>N° Imputation</code> est 
                  formatée en <strong>TEXTE</strong> pour éviter le bug Excel E+17.
                </AlertDescription>
              </Alert>

              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>Colonnes exportées:</strong></p>
                <p className="font-mono text-xs">
                  imputation_code, os, action, activite, sous_activite, direction, nature_depense, nbe, montant, lib_projet
                </p>
              </div>

              <Separator />

              <Button
                onClick={handleExportBudget}
                disabled={isExportingBudget || budgetLineCount === 0}
                className="gap-2"
                size="lg"
              >
                {isExportingBudget ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Exporter Structure Budgétaire
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Référentiels */}
        <TabsContent value="referentiels">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Export Référentiels
              </CardTitle>
              <CardDescription>
                Exporter tous les référentiels programmatiques (OS, Actions, Directions, NBE, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">{referentialCounts.os || 0}</Badge>
                  <span>OS</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">{referentialCounts.actions || 0}</Badge>
                  <span>Actions</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">{referentialCounts.directions || 0}</Badge>
                  <span>Directions</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">{referentialCounts.activites || 0}</Badge>
                  <span>Activités</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">{referentialCounts.sousActivites || 0}</Badge>
                  <span>Sous-Activités</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">{referentialCounts.nbe || 0}</Badge>
                  <span>NBE</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">{referentialCounts.natureDepense || 0}</Badge>
                  <span>Nature Dépense</span>
                </div>
              </div>

              <Separator />

              <Button
                onClick={handleExportReferentiels}
                disabled={isExportingReferentiels}
                className="gap-2"
                size="lg"
              >
                {isExportingReferentiels ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Layers className="h-4 w-4" />
                )}
                Exporter Tous les Référentiels
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Template */}
        <TabsContent value="template">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <LayoutTemplate className="h-5 w-5 text-primary" />
                Template d'Import Officiel
              </CardTitle>
              <CardDescription>
                Télécharger un fichier Excel vide avec la structure exacte attendue par l'importateur SYGFP
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700 dark:text-amber-300">
                  <strong>Important:</strong> La colonne <code>N° Imputation</code> doit rester formatée 
                  en <strong>TEXTE</strong> dans Excel. Si Excel la convertit en nombre scientifique (ex: 1.23E+17), 
                  l'import échouera.
                </AlertDescription>
              </Alert>

              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>Ce template contient:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Feuille <strong>"Structure Budgétaire"</strong> avec colonnes normalisées</li>
                  <li>Feuilles <strong>référentiels</strong> vides (OS, Actions, Directions, NBE, etc.)</li>
                  <li>Feuille <strong>"Instructions"</strong> avec les règles de remplissage</li>
                </ul>
              </div>

              <Separator />

              <Button
                onClick={handleExportTemplate}
                disabled={isExportingTemplate}
                variant="outline"
                className="gap-2"
                size="lg"
              >
                {isExportingTemplate ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4" />
                )}
                Télécharger Template Officiel
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Erreurs */}
        <TabsContent value="erreurs">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileWarning className="h-5 w-5 text-destructive" />
                Rapport d'Erreurs d'Import
              </CardTitle>
              <CardDescription>
                Exporter les erreurs d'un import précédent pour correction et ré-import
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {importRuns.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Aucun import avec erreurs trouvé pour l'exercice {selectedExercice}
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="import-run">Import à analyser</Label>
                    <Select
                      value={selectedRunId || ""}
                      onValueChange={setSelectedRunId}
                    >
                      <SelectTrigger id="import-run">
                        <SelectValue placeholder="Sélectionner un import" />
                      </SelectTrigger>
                      <SelectContent>
                        {importRuns.map((run) => (
                          <SelectItem key={run.id} value={run.id}>
                            <div className="flex items-center gap-2">
                              <span className="truncate max-w-[200px]">{run.filename}</span>
                              <Badge variant="destructive" className="text-xs">
                                {run.error_rows} erreur(s)
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedRunId && (
                    <>
                      <div className="text-sm text-muted-foreground">
                        {(() => {
                          const run = importRuns.find(r => r.id === selectedRunId);
                          if (!run) return null;
                          return (
                            <span>
                              {new Date(run.created_at).toLocaleDateString("fr-FR")} — {run.error_rows} erreur(s) sur {run.total_rows} lignes
                            </span>
                          );
                        })()}
                      </div>

                      <Button
                        onClick={handleExportErrors}
                        disabled={isExportingErrors}
                        variant="destructive"
                        className="gap-2"
                      >
                        {isExportingErrors ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileWarning className="h-4 w-4" />
                        )}
                        Exporter Rapport d'Erreurs
                      </Button>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
