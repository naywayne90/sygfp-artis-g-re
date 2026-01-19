/**
 * GestionAnomalies - Page d'administration des anomalies de cohérence
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  RefreshCw,
  Download,
  Filter,
  ShieldCheck,
  History,
  TrendingUp,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import {
  useCoherenceCheck,
  CoherenceReport,
  Anomaly,
  ANOMALY_TYPE_LABELS,
  ANOMALY_SEVERITY_CONFIG,
  AnomalyType,
  AnomalySeverity,
} from "@/hooks/useCoherenceCheck";
import { CoherenceReportCard } from "@/components/coherence/CoherenceReportCard";
import { useExercice } from "@/contexts/ExerciceContext";

export default function GestionAnomalies() {
  const { exercice } = useExercice();
  const { generateReportAsync, isGenerating, lastReport } = useCoherenceCheck();
  const [currentReport, setCurrentReport] = useState<CoherenceReport | null>(null);
  const [filters, setFilters] = useState<{
    severity?: AnomalySeverity;
    type?: AnomalyType;
  }>({});

  const handleGenerateReport = async () => {
    try {
      const report = await generateReportAsync("manual");
      setCurrentReport(report);
      toast.success("Rapport de cohérence généré");
    } catch (error) {
      toast.error("Erreur lors de la génération du rapport");
    }
  };

  const report = currentReport || lastReport;

  const filteredAnomalies = report?.anomalies.filter((a) => {
    if (filters.severity && a.severity !== filters.severity) return false;
    if (filters.type && a.type !== filters.type) return false;
    return true;
  }) || [];

  const clearFilters = () => setFilters({});
  const hasFilters = Object.values(filters).some(Boolean);

  // Statistiques
  const stats = report
    ? {
        total: report.anomaliesCount,
        errors: report.errorsCount,
        warnings: report.warningsCount,
        infos: report.infosCount,
      }
    : { total: 0, errors: 0, warnings: 0, infos: 0 };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Anomalies</h1>
          <p className="text-muted-foreground">
            Détection et résolution des incohérences de données - Exercice {exercice}
          </p>
        </div>
        <Button onClick={handleGenerateReport} disabled={isGenerating}>
          {isGenerating ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <ShieldCheck className="h-4 w-4 mr-2" />
          )}
          Lancer une vérification
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <AlertTriangle className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total anomalies</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-700">{stats.errors}</p>
                <p className="text-sm text-red-600">Erreurs critiques</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700">{stats.warnings}</p>
                <p className="text-sm text-amber-600">Avertissements</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Info className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{stats.infos}</p>
                <p className="text-sm text-blue-600">Informations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets */}
      <Tabs defaultValue="anomalies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="anomalies" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Anomalies
            {stats.total > 0 && (
              <Badge variant="secondary" className="ml-1">
                {stats.total}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rapport" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Rapport complet
          </TabsTrigger>
          <TabsTrigger value="regles" className="gap-2">
            <Filter className="h-4 w-4" />
            Règles de validation
          </TabsTrigger>
        </TabsList>

        {/* Onglet Anomalies */}
        <TabsContent value="anomalies">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Liste des anomalies</CardTitle>
                  <CardDescription>
                    {report
                      ? `Dernière vérification: ${format(new Date(report.generatedAt), "dd/MM/yyyy HH:mm", { locale: fr })}`
                      : "Aucune vérification effectuée"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {/* Filtres */}
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Sévérité:</Label>
                    <Select
                      value={filters.severity || "all"}
                      onValueChange={(v) =>
                        setFilters({ ...filters, severity: v === "all" ? undefined : (v as AnomalySeverity) })
                      }
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes</SelectItem>
                        <SelectItem value="error">Erreurs</SelectItem>
                        <SelectItem value="warning">Avertissements</SelectItem>
                        <SelectItem value="info">Informations</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Type:</Label>
                    <Select
                      value={filters.type || "all"}
                      onValueChange={(v) =>
                        setFilters({ ...filters, type: v === "all" ? undefined : (v as AnomalyType) })
                      }
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les types</SelectItem>
                        {Object.entries(ANOMALY_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {hasFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-1" />
                      Effacer
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!report ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Aucune vérification effectuée</p>
                  <p className="text-sm">Cliquez sur "Lancer une vérification" pour détecter les anomalies</p>
                </div>
              ) : filteredAnomalies.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p className="font-medium">Aucune anomalie</p>
                  <p className="text-sm">
                    {hasFilters
                      ? "Aucune anomalie ne correspond aux filtres"
                      : "Toutes les vérifications sont passées avec succès"}
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {filteredAnomalies.map((anomaly) => (
                      <AnomalyCard key={anomaly.id} anomaly={anomaly} />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Rapport complet */}
        <TabsContent value="rapport">
          {report ? (
            <CoherenceReportCard
              report={report}
              onRefresh={handleGenerateReport}
              isRefreshing={isGenerating}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun rapport disponible</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Onglet Règles */}
        <TabsContent value="regles">
          <Card>
            <CardHeader>
              <CardTitle>Règles de validation</CardTitle>
              <CardDescription>
                Règles appliquées lors de la vérification de cohérence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <RuleCard
                  title="Activité complète"
                  description="Chaque activité doit être rattachée à un plan programmatique (sous-activité → action → mission → objectif) et à une direction."
                  severity="error"
                />
                <RuleCard
                  title="Référence d'activité valide"
                  description="Toute dépense (Note SEF, imputation) référençant une activité doit pointer vers une activité existante."
                  severity="error"
                />
                <RuleCard
                  title="Respect des crédits"
                  description="Le montant engagé/liquidé ne peut pas dépasser le crédit disponible (AE ou CP) sur une ligne budgétaire."
                  severity="error"
                />
                <RuleCard
                  title="Unicité des codes"
                  description="Les codes d'activités et de lignes budgétaires doivent être uniques au sein d'un exercice."
                  severity="warning"
                />
                <RuleCard
                  title="Montants positifs"
                  description="Les montants budgétaires (AE, CP) ne peuvent pas être négatifs."
                  severity="error"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface AnomalyCardProps {
  anomaly: Anomaly;
}

function AnomalyCard({ anomaly }: AnomalyCardProps) {
  const config = ANOMALY_SEVERITY_CONFIG[anomaly.severity];

  return (
    <div className={`p-4 rounded-lg border ${config.bgColor} border-opacity-50`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {anomaly.severity === "error" && <AlertCircle className="h-4 w-4 text-red-600" />}
            {anomaly.severity === "warning" && <AlertTriangle className="h-4 w-4 text-amber-600" />}
            {anomaly.severity === "info" && <Info className="h-4 w-4 text-blue-600" />}
            <Badge variant="outline" className={config.color}>
              {config.label}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {ANOMALY_TYPE_LABELS[anomaly.type] || anomaly.type}
            </Badge>
            {anomaly.entityRef && (
              <Badge variant="outline" className="font-mono text-xs">
                {anomaly.entityRef}
              </Badge>
            )}
          </div>
          <p className={`font-medium ${config.color}`}>{anomaly.message}</p>
          {anomaly.suggestedAction && (
            <p className="text-sm text-muted-foreground mt-2">
              💡 <strong>Action suggérée:</strong> {anomaly.suggestedAction}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface RuleCardProps {
  title: string;
  description: string;
  severity: AnomalySeverity;
}

function RuleCard({ title, description, severity }: RuleCardProps) {
  const config = ANOMALY_SEVERITY_CONFIG[severity];

  return (
    <div className={`p-4 rounded-lg border ${config.bgColor} border-opacity-30`}>
      <div className="flex items-start gap-3">
        {severity === "error" && <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />}
        {severity === "warning" && <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />}
        {severity === "info" && <Info className="h-5 w-5 text-blue-600 mt-0.5" />}
        <div>
          <h4 className="font-medium">{title}</h4>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
          <Badge variant="outline" className={`mt-2 text-xs ${config.color}`}>
            Niveau: {config.label}
          </Badge>
        </div>
      </div>
    </div>
  );
}
