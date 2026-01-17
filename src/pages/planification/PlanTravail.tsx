import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useExercice } from "@/contexts/ExerciceContext";
import { useBudgetLines } from "@/hooks/useBudgetLines";
import { useBaseReferentiels } from "@/hooks/useBaseReferentiels";
import { EmptyStateNoData } from "@/components/shared/EmptyState";
import {
  ClipboardList,
  Search,
  Download,
  Filter,
  Target,
  Building2,
  TrendingUp,
  Wallet,
  BarChart3,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + " FCFA";
};

interface AggregatedData {
  id: string;
  code: string;
  label: string;
  dotation: number;
  engage: number;
  liquide: number;
  paye: number;
  disponible: number;
  tauxExecution: number;
  linesCount: number;
}

export default function PlanTravail() {
  const { exercice } = useExercice();
  const [searchTerm, setSearchTerm] = useState("");
  const [directionFilter, setDirectionFilter] = useState<string>("all");
  const [osFilter, setOsFilter] = useState<string>("all");
  const [activeView, setActiveView] = useState("par-os");

  const { budgetLines, isLoading } = useBudgetLines({});
  const { directions, objectifsStrategiques } = useBaseReferentiels();

  // Aggregate by OS
  const dataByOS = useMemo(() => {
    if (!budgetLines) return [];

    const grouped: Record<string, AggregatedData> = {};

    budgetLines.forEach((line) => {
      const osId = line.os_id || "non_affecte";
      const os = objectifsStrategiques?.find((o) => o.id === line.os_id);

      if (!grouped[osId]) {
        grouped[osId] = {
          id: osId,
          code: os?.code || "-",
          label: os?.libelle || "Non affecté",
          dotation: 0,
          engage: 0,
          liquide: 0,
          paye: 0,
          disponible: 0,
          tauxExecution: 0,
          linesCount: 0,
        };
      }

      grouped[osId].dotation += line.dotation_initiale || 0;
      grouped[osId].engage += line.total_engage || 0;
      grouped[osId].liquide += line.total_liquide || 0;
      grouped[osId].paye += line.total_paye || 0;
      grouped[osId].linesCount += 1;
    });

    return Object.values(grouped).map((item) => ({
      ...item,
      disponible: item.dotation - item.engage,
      tauxExecution: item.dotation > 0 ? (item.paye / item.dotation) * 100 : 0,
    }));
  }, [budgetLines, objectifsStrategiques]);

  // Aggregate by Direction
  const dataByDirection = useMemo(() => {
    if (!budgetLines) return [];

    const grouped: Record<string, AggregatedData> = {};

    budgetLines.forEach((line) => {
      const dirId = line.direction_id || "non_affecte";
      const dir = directions?.find((d) => d.id === line.direction_id);

      if (!grouped[dirId]) {
        grouped[dirId] = {
          id: dirId,
          code: dir?.code || "-",
          label: dir?.label || "Non affecté",
          dotation: 0,
          engage: 0,
          liquide: 0,
          paye: 0,
          disponible: 0,
          tauxExecution: 0,
          linesCount: 0,
        };
      }

      grouped[dirId].dotation += line.dotation_initiale || 0;
      grouped[dirId].engage += line.total_engage || 0;
      grouped[dirId].liquide += line.total_liquide || 0;
      grouped[dirId].paye += line.total_paye || 0;
      grouped[dirId].linesCount += 1;
    });

    return Object.values(grouped).map((item) => ({
      ...item,
      disponible: item.dotation - item.engage,
      tauxExecution: item.dotation > 0 ? (item.paye / item.dotation) * 100 : 0,
    }));
  }, [budgetLines, directions]);

  // Filtered data
  const filteredLines = useMemo(() => {
    if (!budgetLines) return [];

    return budgetLines.filter((line) => {
      const matchesSearch =
        !searchTerm ||
        line.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        line.label.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDirection =
        directionFilter === "all" || line.direction_id === directionFilter;

      const matchesOS = osFilter === "all" || line.os_id === osFilter;

      return matchesSearch && matchesDirection && matchesOS;
    });
  }, [budgetLines, searchTerm, directionFilter, osFilter]);

  // Totals
  const totals = useMemo(() => {
    return filteredLines.reduce(
      (acc, line) => ({
        dotation: acc.dotation + (line.dotation_initiale || 0),
        engage: acc.engage + (line.total_engage || 0),
        liquide: acc.liquide + (line.total_liquide || 0),
        paye: acc.paye + (line.total_paye || 0),
      }),
      { dotation: 0, engage: 0, liquide: 0, paye: 0 }
    );
  }, [filteredLines]);

  const handleExport = (data: AggregatedData[], filename: string) => {
    const headers = ["Code", "Libellé", "Dotation", "Engagé", "Liquidé", "Payé", "Disponible", "Taux Exécution"].join(";");
    const rows = data.map((item) =>
      [
        item.code,
        item.label,
        item.dotation,
        item.engage,
        item.liquide,
        item.paye,
        item.disponible,
        `${item.tauxExecution.toFixed(1)}%`,
      ].join(";")
    );

    const content = [headers, ...rows].join("\n");
    const blob = new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${exercice}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success(`Export réussi`);
  };

  const renderAggregatedTable = (data: AggregatedData[], title: string, filename: string) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {data.length} élément(s) - Total: {formatCurrency(data.reduce((s, d) => s + d.dotation, 0))}
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => handleExport(data, filename)}>
          <Download className="h-4 w-4 mr-2" />
          Exporter
        </Button>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyStateNoData entityName="donnée" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead className="text-right">Dotation</TableHead>
                <TableHead className="text-right">Engagé</TableHead>
                <TableHead className="text-right">Liquidé</TableHead>
                <TableHead className="text-right">Payé</TableHead>
                <TableHead className="text-right">Disponible</TableHead>
                <TableHead className="text-center">Exécution</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Badge variant="outline">{item.code}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{item.label}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(item.dotation)}</TableCell>
                  <TableCell className="text-right font-mono text-orange-600">
                    {formatCurrency(item.engage)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-blue-600">
                    {formatCurrency(item.liquide)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-green-600">
                    {formatCurrency(item.paye)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <span className={item.disponible < 0 ? "text-destructive" : ""}>
                      {formatCurrency(item.disponible)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={item.tauxExecution} className="h-2 w-16" />
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {item.tauxExecution.toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            <h1 className="page-title">Plan de Travail Budgétaire</h1>
          </div>
          <p className="page-description">
            Association budget / actions / projets - Exercice {exercice}
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          Exercice {exercice}
        </Badge>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totals.dotation)}</p>
                <p className="text-sm text-muted-foreground">Dotation totale</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(totals.engage)}</p>
                <p className="text-sm text-muted-foreground">
                  Engagé ({totals.dotation > 0 ? ((totals.engage / totals.dotation) * 100).toFixed(1) : 0}%)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(totals.liquide)}</p>
                <p className="text-sm text-muted-foreground">
                  Liquidé ({totals.engage > 0 ? ((totals.liquide / totals.engage) * 100).toFixed(1) : 0}%)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.paye)}</p>
                <p className="text-sm text-muted-foreground">
                  Payé ({totals.dotation > 0 ? ((totals.paye / totals.dotation) * 100).toFixed(1) : 0}%)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={totals.dotation - totals.engage < 0 ? "border-destructive" : ""}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <div>
                <p className={`text-2xl font-bold ${totals.dotation - totals.engage < 0 ? "text-destructive" : ""}`}>
                  {formatCurrency(totals.dotation - totals.engage)}
                </p>
                <p className="text-sm text-muted-foreground">Disponible</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Search className="h-4 w-4" />
                Recherche
              </label>
              <Input
                placeholder="Code ou libellé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Direction
              </label>
              <Select value={directionFilter} onValueChange={setDirectionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les directions</SelectItem>
                  {directions?.map((dir) => (
                    <SelectItem key={dir.id} value={dir.id}>
                      {dir.code} - {dir.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Objectif Stratégique
              </label>
              <Select value={osFilter} onValueChange={setOsFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les OS</SelectItem>
                  {objectifsStrategiques?.map((os) => (
                    <SelectItem key={os.id} value={os.id}>
                      {os.code} - {os.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setDirectionFilter("all");
                  setOsFilter("all");
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Views */}
      <Tabs value={activeView} onValueChange={setActiveView} className="space-y-4">
        <TabsList>
          <TabsTrigger value="par-os" className="gap-2">
            <Target className="h-4 w-4" />
            Par Objectif Stratégique
          </TabsTrigger>
          <TabsTrigger value="par-direction" className="gap-2">
            <Building2 className="h-4 w-4" />
            Par Direction
          </TabsTrigger>
          <TabsTrigger value="detail" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Détail lignes ({filteredLines.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="par-os">
          {renderAggregatedTable(dataByOS, "Exécution par Objectif Stratégique", "plan_travail_os")}
        </TabsContent>

        <TabsContent value="par-direction">
          {renderAggregatedTable(dataByDirection, "Exécution par Direction", "plan_travail_direction")}
        </TabsContent>

        <TabsContent value="detail">
          <Card>
            <CardHeader>
              <CardTitle>Détail des lignes budgétaires</CardTitle>
              <CardDescription>
                {filteredLines.length} ligne(s) affichée(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Chargement...</div>
              ) : filteredLines.length === 0 ? (
                <EmptyStateNoData entityName="ligne" />
              ) : (
                <div className="max-h-[500px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Libellé</TableHead>
                        <TableHead>Direction</TableHead>
                        <TableHead>OS</TableHead>
                        <TableHead className="text-right">Dotation</TableHead>
                        <TableHead className="text-right">Engagé</TableHead>
                        <TableHead className="text-right">Disponible</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLines.slice(0, 100).map((line) => {
                        const disponible = (line.dotation_initiale || 0) - (line.total_engage || 0);
                        return (
                          <TableRow key={line.id}>
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-xs">
                                {line.code}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">{line.label}</TableCell>
                            <TableCell>
                              <span className="text-xs">{line.direction?.code || "-"}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs">{line.objectif_strategique?.code || "-"}</span>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(line.dotation_initiale || 0)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-orange-600">
                              {formatCurrency(line.total_engage || 0)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              <span className={disponible < 0 ? "text-destructive" : ""}>
                                {formatCurrency(disponible)}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  {filteredLines.length > 100 && (
                    <p className="text-center text-sm text-muted-foreground mt-4">
                      Affichage limité aux 100 premières lignes.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
