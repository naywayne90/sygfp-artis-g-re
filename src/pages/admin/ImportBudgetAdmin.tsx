import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  FileSpreadsheet, 
  Upload, 
  History, 
  Shield, 
  AlertTriangle,
  Database,
  RefreshCw,
} from "lucide-react";
import { BudgetImportWizard } from "@/components/import-export/BudgetImportWizard";
import { BudgetTemplateDownload } from "@/components/budget/BudgetTemplateDownload";
import { ImportHistoryPanel } from "@/components/import-export/ImportHistoryPanel";
import { ImportAnomalyReport } from "@/components/import-export/ImportAnomalyReport";
import { useExercice } from "@/contexts/ExerciceContext";
import { RoleGuard } from "@/components/auth";
import logoArti from "@/assets/logo-arti.jpg";

export default function ImportBudgetAdmin() {
  const { exercice } = useExercice();
  const [activeTab, setActiveTab] = useState("import");
  const [lastImportId, setLastImportId] = useState<string | null>(null);

  return (
    <RoleGuard roles={["ADMIN", "DAAF", "DG"]} showDenied>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logoArti} alt="ARTI" className="h-12 w-12 rounded-lg object-cover" />
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Database className="h-6 w-6 text-primary" />
                Administration Import Budget
              </h1>
              <p className="text-muted-foreground">
                Import Excel avec staging, validation et contrôles qualité — Exercice {exercice}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Shield className="h-3 w-3" />
              Accès restreint
            </Badge>
            <BudgetTemplateDownload />
          </div>
        </div>

        {/* Security Alert */}
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Protection des données</AlertTitle>
          <AlertDescription className="text-amber-700">
            Aucune donnée production ne sera écrasée sans confirmation explicite. 
            Les imports sont versionnés par exercice et traçables dans le journal d'audit.
          </AlertDescription>
        </Alert>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import Excel
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Historique & Logs
            </TabsTrigger>
            <TabsTrigger value="anomalies" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Rapport Anomalies
            </TabsTrigger>
          </TabsList>

          {/* Tab Import */}
          <TabsContent value="import">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5" />
                      Import de données budgétaires
                    </CardTitle>
                    <CardDescription>
                      Assistant d'import avec parsing vers staging, contrôles qualité et validation avant commit
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <BudgetImportWizard />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab History */}
          <TabsContent value="history">
            <ImportHistoryPanel exercice={exercice} />
          </TabsContent>

          {/* Tab Anomalies */}
          <TabsContent value="anomalies">
            <ImportAnomalyReport 
              runId={lastImportId} 
              exercice={exercice}
            />
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  );
}
