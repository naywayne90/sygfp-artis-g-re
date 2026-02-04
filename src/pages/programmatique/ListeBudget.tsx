// @ts-nocheck
import { useState, useMemo } from "react";
import { useExercice } from "@/contexts/ExerciceContext";
import { useBudgetLines, BudgetLineWithRelations, getDisplayBudgetCode } from "@/hooks/useBudgetLines";
import { useBudgetHistory } from "@/hooks/useBudgetTransfers";
import { useDirections } from "@/hooks/useDirections";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  List,
  BarChart3,
  History,
  FileSpreadsheet,
  Download,
  Eye,
  TrendingUp,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import * as XLSX from "xlsx";

// Types for grouped view
interface GroupedBudget {
  id: string;
  code: string;
  label: string;
  level: string;
  dotation: number;
  engage: number;
  liquide: number;
  disponible: number;
  children?: GroupedBudget[];
  isExpanded?: boolean;
  lines?: BudgetLineWithRelations[];
}

export default function ListeBudget() {
  const { exercice } = useExercice();
  const [searchTerm, setSearchTerm] = useState("");
  const [directionFilter, setDirectionFilter] = useState<string>("all");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "grouped">("list");
  const [selectedLine, setSelectedLine] = useState<BudgetLineWithRelations | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const { directions } = useDirections();
  const { budgetLines, isLoading, totals } = useBudgetLines({
    direction_id: directionFilter !== "all" ? directionFilter : undefined,
    statut: statutFilter !== "all" ? statutFilter : undefined,
    keyword: searchTerm || undefined,
  });

  // Format currency
  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";
  };

  // Calculate line disponible
  const getLineDisponible = (line: BudgetLineWithRelations) => {
    const dotation = line.dotation_initiale || 0;
    const engage = line.total_engage || 0;
    return dotation - engage;
  };

  // Calculate consumption percentage
  const getConsommationPct = (line: BudgetLineWithRelations) => {
    const dotation = line.dotation_initiale || 0;
    if (dotation === 0) return 0;
    const engage = line.total_engage || 0;
    return Math.round((engage / dotation) * 100);
  };

  // Group lines by direction
  const groupedByDirection = useMemo(() => {
    if (!budgetLines) return [];

    const groups: Record<string, GroupedBudget> = {};

    budgetLines.forEach((line) => {
      const dirKey = line.direction_id || "sans-direction";
      const dirLabel = line.direction?.label || "Sans direction";
      const dirCode = line.direction?.code || "XX";

      if (!groups[dirKey]) {
        groups[dirKey] = {
          id: dirKey,
          code: dirCode,
          label: dirLabel,
          level: "direction",
          dotation: 0,
          engage: 0,
          liquide: 0,
          disponible: 0,
          lines: [],
        };
      }

      groups[dirKey].dotation += line.dotation_initiale || 0;
      groups[dirKey].engage += line.total_engage || 0;
      groups[dirKey].liquide += line.total_liquide || 0;
      groups[dirKey].disponible += getLineDisponible(line);
      groups[dirKey].lines?.push(line);
    });

    return Object.values(groups).sort((a, b) => a.code.localeCompare(b.code));
  }, [budgetLines]);

  // Toggle group expansion
  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  // Export Excel
  const handleExport = () => {
    if (!budgetLines || budgetLines.length === 0) return;

    const exportData = budgetLines.map((line) => ({
      "Code budgétaire": getDisplayBudgetCode(line).code,
      Libellé: line.label,
      Direction: line.direction?.label || "-",
      "Dotation initiale": line.dotation_initiale || 0,
      "Total engagé": line.total_engage || 0,
      "Total liquidé": line.total_liquide || 0,
      "Total ordonnancé": line.total_ordonnance || 0,
      "Total payé": line.total_paye || 0,
      Disponible: getLineDisponible(line),
      "Consommation (%)": getConsommationPct(line),
      Statut: line.statut || "actif",
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Budget");
    XLSX.writeFile(wb, `budget_${exercice}.xlsx`);
  };

  // Stats
  const stats = useMemo(() => {
    if (!budgetLines) return { totalDotation: 0, totalEngage: 0, totalDisponible: 0, lignesCount: 0 };

    return {
      totalDotation: budgetLines.reduce((s, l) => s + (l.dotation_initiale || 0), 0),
      totalEngage: budgetLines.reduce((s, l) => s + (l.total_engage || 0), 0),
      totalDisponible: budgetLines.reduce((s, l) => s + getLineDisponible(l), 0),
      lignesCount: budgetLines.length,
    };
  }, [budgetLines]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <List className="h-6 w-6" />
            Liste Budget - Exercice {exercice}
          </h1>
          <p className="text-muted-foreground">
            Vue complète des lignes budgétaires avec drill-down
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter Excel
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Dotation totale</p>
                <p className="text-lg font-bold">{formatMontant(stats.totalDotation)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total engagé</p>
                <p className="text-lg font-bold">{formatMontant(stats.totalEngage)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Disponible</p>
                <p className="text-lg font-bold">{formatMontant(stats.totalDisponible)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Lignes budgétaires</p>
                <p className="text-lg font-bold">{stats.lignesCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher par code ou libellé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={directionFilter} onValueChange={setDirectionFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Direction" />
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

            <Select value={statutFilter} onValueChange={setStatutFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="actif">Actif</SelectItem>
                <SelectItem value="soumis">Soumis</SelectItem>
                <SelectItem value="valide">Validé</SelectItem>
                <SelectItem value="cloture">Clôturé</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2 border rounded-md p-1">
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grouped" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grouped")}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {viewMode === "list" ? (
        <Card>
          <CardContent className="pt-4">
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code budgétaire</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead className="text-right">Dotation</TableHead>
                    <TableHead className="text-right">Engagé</TableHead>
                    <TableHead className="text-right">Disponible</TableHead>
                    <TableHead className="text-center">Conso.</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  ) : budgetLines?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        Aucune ligne budgétaire trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    budgetLines?.map((line) => {
                      const consoPct = getConsommationPct(line);
                      const disponible = getLineDisponible(line);
                      return (
                        <TableRow key={line.id}>
                          <TableCell className="font-mono text-sm">
                            {getDisplayBudgetCode(line).code}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate" title={line.label}>
                            {line.label}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {line.direction?.code || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatMontant(line.dotation_initiale || 0)}
                          </TableCell>
                          <TableCell className="text-right text-orange-600">
                            {formatMontant(line.total_engage || 0)}
                          </TableCell>
                          <TableCell className={`text-right font-medium ${disponible < 0 ? "text-red-600" : "text-green-600"}`}>
                            {formatMontant(disponible)}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${
                                    consoPct > 90
                                      ? "bg-red-500"
                                      : consoPct > 70
                                      ? "bg-orange-500"
                                      : "bg-green-500"
                                  }`}
                                  style={{ width: `${Math.min(consoPct, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs">{consoPct}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                line.statut === "valide"
                                  ? "default"
                                  : line.statut === "cloture"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {line.statut || "actif"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLine(line)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-4">
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {groupedByDirection.map((group) => (
                  <Collapsible
                    key={group.id}
                    open={expandedGroups.has(group.id)}
                    onOpenChange={() => toggleGroup(group.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80">
                        <div className="flex items-center gap-2">
                          {expandedGroups.has(group.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <Badge variant="secondary">{group.code}</Badge>
                          <span className="font-medium">{group.label}</span>
                          <Badge variant="outline">{group.lines?.length} lignes</Badge>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div>
                            <span className="text-muted-foreground">Dotation: </span>
                            <span className="font-medium">{formatMontant(group.dotation)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Engagé: </span>
                            <span className="font-medium text-orange-600">{formatMontant(group.engage)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Disponible: </span>
                            <span className={`font-medium ${group.disponible < 0 ? "text-red-600" : "text-green-600"}`}>
                              {formatMontant(group.disponible)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="ml-6 mt-2 border-l-2 pl-4 space-y-1">
                        {group.lines?.map((line) => (
                          <div
                            key={line.id}
                            className="flex items-center justify-between py-2 px-3 hover:bg-muted/50 rounded cursor-pointer"
                            onClick={() => setSelectedLine(line)}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm text-muted-foreground">
                                {getDisplayBudgetCode(line).code}
                              </span>
                              <span className="truncate max-w-[300px]">{line.label}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span>{formatMontant(line.dotation_initiale || 0)}</span>
                              <span className="text-orange-600">{formatMontant(line.total_engage || 0)}</span>
                              <span className={getLineDisponible(line) < 0 ? "text-red-600" : "text-green-600"}>
                                {formatMontant(getLineDisponible(line))}
                              </span>
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Detail Sheet */}
      <BudgetLineDetail
        line={selectedLine}
        open={!!selectedLine}
        onClose={() => setSelectedLine(null)}
      />
    </div>
  );
}

// Detail component for drill-down
function BudgetLineDetail({
  line,
  open,
  onClose,
}: {
  line: BudgetLineWithRelations | null;
  open: boolean;
  onClose: () => void;
}) {
  const { history, isLoading: loadingHistory } = useBudgetHistory(line?.id);

  if (!line) return null;

  const disponible = (line.dotation_initiale || 0) - (line.total_engage || 0);
  const consoPct = line.dotation_initiale
    ? Math.round(((line.total_engage || 0) / line.dotation_initiale) * 100)
    : 0;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Détail ligne budgétaire
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="info" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Informations</TabsTrigger>
            <TabsTrigger value="execution">Exécution</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Code budgétaire</p>
                <p className="font-mono font-medium">{getDisplayBudgetCode(line).code}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Version code</p>
                <Badge>{getDisplayBudgetCode(line).version}</Badge>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Libellé</p>
                <p className="font-medium">{line.label}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Direction</p>
                <p>{line.direction?.label || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Niveau</p>
                <Badge variant="outline">{line.level}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Objectif stratégique</p>
                <p>{line.objectif_strategique?.libelle || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mission</p>
                <p>{line.mission?.libelle || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Action</p>
                <p>{line.action?.libelle || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Activité</p>
                <p>{line.activite?.libelle || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Source financement</p>
                <p>{line.source_financement || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Statut</p>
                <Badge>{line.statut || "actif"}</Badge>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="execution" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Situation budgétaire</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Dotation initiale</p>
                    <p className="text-xl font-bold">
                      {new Intl.NumberFormat("fr-FR").format(line.dotation_initiale || 0)} FCFA
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Disponible</p>
                    <p className={`text-xl font-bold ${disponible < 0 ? "text-red-600" : "text-green-600"}`}>
                      {new Intl.NumberFormat("fr-FR").format(disponible)} FCFA
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Consommation</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          consoPct > 90 ? "bg-red-500" : consoPct > 70 ? "bg-orange-500" : "bg-green-500"
                        }`}
                        style={{ width: `${Math.min(consoPct, 100)}%` }}
                      />
                    </div>
                    <span className="font-medium">{consoPct}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Total engagé</p>
                    <p className="font-medium text-orange-600">
                      {new Intl.NumberFormat("fr-FR").format(line.total_engage || 0)} FCFA
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total liquidé</p>
                    <p className="font-medium">
                      {new Intl.NumberFormat("fr-FR").format(line.total_liquide || 0)} FCFA
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total ordonnancé</p>
                    <p className="font-medium">
                      {new Intl.NumberFormat("fr-FR").format(line.total_ordonnance || 0)} FCFA
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total payé</p>
                    <p className="font-medium text-green-600">
                      {new Intl.NumberFormat("fr-FR").format(line.total_paye || 0)} FCFA
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <ScrollArea className="h-[400px]">
              {loadingHistory ? (
                <p className="text-center py-8 text-muted-foreground">Chargement...</p>
              ) : history?.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Aucun historique</p>
              ) : (
                <div className="space-y-3">
                  {history?.map((h) => (
                    <div key={h.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <History className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{h.event_type}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(h.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                          </span>
                        </div>
                        {h.delta !== 0 && (
                          <p className={`text-sm font-medium mt-1 ${h.delta > 0 ? "text-green-600" : "text-red-600"}`}>
                            {h.delta > 0 ? "+" : ""}
                            {new Intl.NumberFormat("fr-FR").format(h.delta)} FCFA
                          </p>
                        )}
                        {h.commentaire && (
                          <p className="text-sm text-muted-foreground mt-1">{h.commentaire}</p>
                        )}
                        {h.created_by_profile && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Par: {h.created_by_profile.full_name}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
