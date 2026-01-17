import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, FileSpreadsheet, Database, Building2, Target, Briefcase } from "lucide-react";
import { BudgetImportWizard } from "@/components/import-export/BudgetImportWizard";
import { BudgetExport } from "@/components/import-export/BudgetExport";
import { BudgetTemplateDownload } from "@/components/budget/BudgetTemplateDownload";
import { useExercice } from "@/contexts/ExerciceContext";
import { toast } from "sonner";

const REFERENTIEL_TEMPLATES = [
  {
    id: "budget",
    label: "Lignes Budgétaires",
    icon: FileSpreadsheet,
    description: "Structure budgétaire avec codes, libellés, dotations",
    columns: ["code", "label", "level", "dotation_initiale", "direction_code", "os_code", "mission_code", "nbe_code", "sysco_code"],
  },
  {
    id: "directions",
    label: "Directions",
    icon: Building2,
    description: "Référentiel des directions et services",
    columns: ["code", "label", "sigle", "responsable", "email"],
  },
  {
    id: "os",
    label: "Objectifs Stratégiques",
    icon: Target,
    description: "Référentiel des OS pour l'imputation",
    columns: ["code", "libelle", "mission_code"],
  },
  {
    id: "missions",
    label: "Missions",
    icon: Briefcase,
    description: "Référentiel des missions budgétaires",
    columns: ["code", "libelle"],
  },
  {
    id: "prestataires",
    label: "Prestataires",
    icon: Database,
    description: "Référentiel des fournisseurs et prestataires",
    columns: ["code", "raison_sociale", "nif", "rccm", "adresse", "telephone", "email", "iban", "banque"],
  },
];

export default function ImportExport() {
  const { exercice } = useExercice();
  const [activeTab, setActiveTab] = useState("import");

  const handleDownloadTemplate = (template: typeof REFERENTIEL_TEMPLATES[0]) => {
    // Create CSV template with headers
    const csvContent = template.columns.join(";") + "\n";
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `template_${template.id}_${exercice}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success(`Template "${template.label}" téléchargé`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6 text-primary" />
          Import / Export
        </h1>
        <p className="text-muted-foreground mt-1">
          Importez ou exportez les données budgétaires et référentiels - Exercice {exercice}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import Budget
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        {/* Tab Import */}
        <TabsContent value="import">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Import de données budgétaires</CardTitle>
                  <CardDescription>
                    Utilisez l'assistant pour importer votre structure budgétaire depuis un fichier Excel
                  </CardDescription>
                </div>
                <BudgetTemplateDownload />
              </div>
            </CardHeader>
            <CardContent>
              <BudgetImportWizard />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Export */}
        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle>Export des données</CardTitle>
              <CardDescription>
                Exportez les données budgétaires et référentiels au format Excel ou CSV
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BudgetExport />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Templates */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Templates d'import
              </CardTitle>
              <CardDescription>
                Téléchargez les modèles de fichiers pour l'import des différents référentiels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {REFERENTIEL_TEMPLATES.map((template) => (
                  <Card key={template.id} className="border-dashed">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-muted">
                          <template.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{template.label}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {template.description}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {template.columns.slice(0, 4).map((col) => (
                              <Badge key={col} variant="secondary" className="text-xs">
                                {col}
                              </Badge>
                            ))}
                            {template.columns.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{template.columns.length - 4}
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 w-full"
                            onClick={() => handleDownloadTemplate(template)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger CSV
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}