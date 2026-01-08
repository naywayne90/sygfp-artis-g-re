import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, FileSpreadsheet } from "lucide-react";
import { BudgetImportWizard } from "@/components/import-export/BudgetImportWizard";
import { BudgetExport } from "@/components/import-export/BudgetExport";
import { BudgetTemplateDownload } from "@/components/budget/BudgetTemplateDownload";

export default function ImportExport() {
  const [activeTab, setActiveTab] = useState("import");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6 text-primary" />
          Import / Export
        </h1>
        <p className="text-muted-foreground mt-1">
          Importez ou exportez les données budgétaires au format Excel
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestion des données budgétaires</CardTitle>
              <CardDescription>
                Utilisez l'assistant pour importer votre structure budgétaire depuis un fichier Excel, 
                ou exportez les données existantes.
              </CardDescription>
            </div>
            <BudgetTemplateDownload />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="import" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Importer Budget (Excel)
              </TabsTrigger>
              <TabsTrigger value="export" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Exporter (Excel)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="import" className="mt-6">
              <BudgetImportWizard />
            </TabsContent>

            <TabsContent value="export" className="mt-6">
              <BudgetExport />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
