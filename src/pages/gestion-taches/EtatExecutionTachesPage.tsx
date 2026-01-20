/**
 * EtatExecutionTachesPage - État d'exécution des tâches
 *
 * Affiche un tableau récapitulatif du taux d'exécution physique
 * par Direction, Mission, Objectif Stratégique ou Activité.
 */

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useExercice } from "@/contexts/ExerciceContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExportButtons } from "@/components/etats/ExportButtons";
import {
  BarChart3,
  Building2,
  Target,
  Layers,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type GroupByOption = "direction" | "mission" | "os" | "activite";

interface ExecutionStat {
  id: string;
  code: string;
  label: string;
  total_activites: number;
  activites_non_demarrees: number;
  activites_en_cours: number;
  activites_realisees: number;
  activites_bloquees: number;
  activites_annulees: number;
  taux_moyen: number;
  montant_total: number;
  montant_realise: number;
}

interface FilterData {
  directions: Array<{ id: string; code: string; label: string }>;
  missions: Array<{ id: string; code: string; libelle: string }>;
  objectifs: Array<{ id: string; code: string; libelle: string }>;
}

export default function EtatExecutionTachesPage() {
  const { exerciceId, exercice } = useExercice();
  const [groupBy, setGroupBy] = useState<GroupByOption>("direction");
  const [selectedDirection, setSelectedDirection] = useState<string>("all");
  const [selectedMission, setSelectedMission] = useState<string>("all");

  // Charger les données de filtres
  const { data: filterData } = useQuery<FilterData>({
    queryKey: ["execution-filters", exerciceId],
    queryFn: async () => {
      const [directionsRes, missionsRes, objectifsRes] = await Promise.all([
        supabase.from("directions").select("id, code, label").order("code"),
        supabase.from("missions").select("id, code, libelle").order("code"),
        supabase.from("objectifs_strategiques").select("id, code, libelle").order("code")
      ]);

      return {
        directions: directionsRes.data || [],
        missions: missionsRes.data || [],
        objectifs: objectifsRes.data || []
      };
    },
    enabled: !!exerciceId
  });

  // Charger les statistiques d'exécution
  const { data: executions, isLoading, refetch } = useQuery({
    queryKey: ["execution-stats", exerciceId, groupBy, selectedDirection, selectedMission],
    queryFn: async () => {
      // Récupérer toutes les tâches d'exécution avec leurs jointures
      let query = supabase
        .from("task_executions_view")
        .select("*")
        .eq("exercice_id", exerciceId);

      if (selectedDirection !== "all") {
        query = query.eq("direction_id", selectedDirection);
      }
      if (selectedMission !== "all") {
        query = query.eq("mission_id", selectedMission);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Agréger par le groupement choisi
      const statsMap = new Map<string, ExecutionStat>();

      (data || []).forEach((task: Record<string, unknown>) => {
        let groupKey: string;
        let groupCode: string;
        let groupLabel: string;

        switch (groupBy) {
          case "direction":
            groupKey = (task.direction_id as string) || "unknown";
            groupCode = (task.direction_code as string) || "?";
            groupLabel = (task.direction_label as string) || "Non assigné";
            break;
          case "mission":
            groupKey = (task.mission_id as string) || "unknown";
            groupCode = (task.mission_code as string) || "?";
            groupLabel = (task.mission_libelle as string) || "Non assigné";
            break;
          case "os":
            groupKey = (task.os_id as string) || "unknown";
            groupCode = (task.os_code as string) || "?";
            groupLabel = (task.os_libelle as string) || "Non assigné";
            break;
          case "activite":
            groupKey = (task.activite_id as string) || "unknown";
            groupCode = (task.activite_code as string) || "?";
            groupLabel = (task.activite_libelle as string) || "Non assigné";
            break;
          default:
            groupKey = "all";
            groupCode = "-";
            groupLabel = "Tout";
        }

        if (!statsMap.has(groupKey)) {
          statsMap.set(groupKey, {
            id: groupKey,
            code: groupCode,
            label: groupLabel,
            total_activites: 0,
            activites_non_demarrees: 0,
            activites_en_cours: 0,
            activites_realisees: 0,
            activites_bloquees: 0,
            activites_annulees: 0,
            taux_moyen: 0,
            montant_total: 0,
            montant_realise: 0
          });
        }

        const stat = statsMap.get(groupKey)!;
        stat.total_activites++;

        const status = task.status as string;
        const taux = (task.taux_avancement as number) || 0;
        const montant = (task.activite_montant as number) || 0;

        switch (status) {
          case "non_demarre":
            stat.activites_non_demarrees++;
            break;
          case "en_cours":
            stat.activites_en_cours++;
            break;
          case "realise":
            stat.activites_realisees++;
            break;
          case "bloque":
            stat.activites_bloquees++;
            break;
          case "annule":
            stat.activites_annulees++;
            break;
        }

        stat.montant_total += montant;
        stat.montant_realise += montant * (taux / 100);
        stat.taux_moyen = (stat.taux_moyen * (stat.total_activites - 1) + taux) / stat.total_activites;
      });

      return Array.from(statsMap.values()).sort((a, b) => a.code.localeCompare(b.code));
    },
    enabled: !!exerciceId
  });

  // Calcul des totaux
  const totals = useMemo(() => {
    if (!executions || executions.length === 0) {
      return {
        total: 0,
        non_demarrees: 0,
        en_cours: 0,
        realisees: 0,
        bloquees: 0,
        annulees: 0,
        taux_global: 0,
        montant_total: 0,
        montant_realise: 0
      };
    }

    const result = executions.reduce((acc, stat) => ({
      total: acc.total + stat.total_activites,
      non_demarrees: acc.non_demarrees + stat.activites_non_demarrees,
      en_cours: acc.en_cours + stat.activites_en_cours,
      realisees: acc.realisees + stat.activites_realisees,
      bloquees: acc.bloquees + stat.activites_bloquees,
      annulees: acc.annulees + stat.activites_annulees,
      montant_total: acc.montant_total + stat.montant_total,
      montant_realise: acc.montant_realise + stat.montant_realise
    }), {
      total: 0,
      non_demarrees: 0,
      en_cours: 0,
      realisees: 0,
      bloquees: 0,
      annulees: 0,
      montant_total: 0,
      montant_realise: 0
    });

    return {
      ...result,
      taux_global: result.total > 0
        ? Math.round((result.realisees / result.total) * 100)
        : 0
    };
  }, [executions]);

  // Colonnes pour l'export
  const exportColumns = [
    { key: "code", label: "Code" },
    { key: "label", label: "Libellé" },
    { key: "total_activites", label: "Total Activités" },
    { key: "activites_non_demarrees", label: "Non démarrées" },
    { key: "activites_en_cours", label: "En cours" },
    { key: "activites_realisees", label: "Réalisées" },
    { key: "activites_bloquees", label: "Bloquées" },
    { key: "taux_moyen", label: "Taux (%)", type: "number" as const },
  ];

  const getGroupByIcon = () => {
    switch (groupBy) {
      case "direction": return <Building2 className="h-4 w-4" />;
      case "mission": return <Target className="h-4 w-4" />;
      case "os": return <ChevronRight className="h-4 w-4" />;
      case "activite": return <Layers className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getTauxColor = (taux: number) => {
    if (taux >= 80) return "text-green-600";
    if (taux >= 50) return "text-yellow-600";
    if (taux >= 20) return "text-orange-600";
    return "text-red-600";
  };

  const getTauxIcon = (taux: number) => {
    if (taux >= 80) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (taux >= 50) return <Minus className="h-4 w-4 text-yellow-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XAF",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            État d'Exécution des Tâches
          </h1>
          <p className="text-muted-foreground">
            Exercice {exercice?.annee || "-"} - Taux d'exécution physique
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          {executions && executions.length > 0 && (
            <ExportButtons
              data={executions}
              columns={exportColumns}
              filename={`etat-execution-${groupBy}-${exercice?.annee || "export"}`}
              title="État d'Exécution des Tâches"
              subtitle={`Par ${groupBy === "direction" ? "Direction" : groupBy === "mission" ? "Mission" : groupBy === "os" ? "Objectif Stratégique" : "Activité"}`}
              showCopy
              showPrint
            />
          )}
        </div>
      </div>

      {/* Cartes KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{totals.total}</div>
            <p className="text-sm text-muted-foreground">Activités totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{totals.realisees}</div>
            <p className="text-sm text-muted-foreground">Réalisées</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">{totals.en_cours}</div>
            <p className="text-sm text-muted-foreground">En cours</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{totals.taux_global}%</div>
            <Progress value={totals.taux_global} className="mt-2 h-2" />
            <p className="text-sm text-muted-foreground mt-1">Taux global</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-48">
              <label className="text-sm font-medium mb-1 block">Grouper par</label>
              <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupByOption)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direction">Direction</SelectItem>
                  <SelectItem value="mission">Mission</SelectItem>
                  <SelectItem value="os">Objectif Stratégique</SelectItem>
                  <SelectItem value="activite">Activité</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-48">
              <label className="text-sm font-medium mb-1 block">Direction</label>
              <Select value={selectedDirection} onValueChange={setSelectedDirection}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les directions</SelectItem>
                  {filterData?.directions.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.code} - {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-48">
              <label className="text-sm font-medium mb-1 block">Mission</label>
              <Select value={selectedMission} onValueChange={setSelectedMission}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les missions</SelectItem>
                  {filterData?.missions.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.code} - {m.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getGroupByIcon()}
            Récapitulatif par {
              groupBy === "direction" ? "Direction" :
              groupBy === "mission" ? "Mission" :
              groupBy === "os" ? "Objectif Stratégique" : "Activité"
            }
          </CardTitle>
          <CardDescription>
            {executions?.length || 0} entrées affichées
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : executions && executions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Code</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead className="text-center hidden md:table-cell">Total</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">Non dém.</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">En cours</TableHead>
                    <TableHead className="text-center hidden md:table-cell">Réalisées</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">Bloquées</TableHead>
                    <TableHead className="text-center">Taux</TableHead>
                    <TableHead className="text-right hidden xl:table-cell">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {executions.map((stat) => (
                    <TableRow key={stat.id}>
                      <TableCell className="font-mono">{stat.code}</TableCell>
                      <TableCell className="max-w-xs truncate" title={stat.label}>
                        {stat.label}
                      </TableCell>
                      <TableCell className="text-center hidden md:table-cell">
                        <Badge variant="outline">{stat.total_activites}</Badge>
                      </TableCell>
                      <TableCell className="text-center hidden lg:table-cell">
                        {stat.activites_non_demarrees > 0 && (
                          <Badge variant="secondary">{stat.activites_non_demarrees}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center hidden lg:table-cell">
                        {stat.activites_en_cours > 0 && (
                          <Badge className="bg-yellow-100 text-yellow-800">{stat.activites_en_cours}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center hidden md:table-cell">
                        {stat.activites_realisees > 0 && (
                          <Badge className="bg-green-100 text-green-800">{stat.activites_realisees}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center hidden lg:table-cell">
                        {stat.activites_bloquees > 0 && (
                          <Badge variant="destructive">{stat.activites_bloquees}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {getTauxIcon(stat.taux_moyen)}
                          <span className={`font-medium ${getTauxColor(stat.taux_moyen)}`}>
                            {Math.round(stat.taux_moyen)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right hidden xl:table-cell font-mono text-sm">
                        {formatMontant(stat.montant_total)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Ligne totaux */}
                  <TableRow className="font-bold bg-muted/50">
                    <TableCell>TOTAL</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell className="text-center hidden md:table-cell">{totals.total}</TableCell>
                    <TableCell className="text-center hidden lg:table-cell">{totals.non_demarrees}</TableCell>
                    <TableCell className="text-center hidden lg:table-cell">{totals.en_cours}</TableCell>
                    <TableCell className="text-center hidden md:table-cell">{totals.realisees}</TableCell>
                    <TableCell className="text-center hidden lg:table-cell">{totals.bloquees}</TableCell>
                    <TableCell className="text-center">
                      <span className={getTauxColor(totals.taux_global)}>
                        {totals.taux_global}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right hidden xl:table-cell font-mono">
                      {formatMontant(totals.montant_total)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune donnée d'exécution pour cet exercice</p>
              <p className="text-sm mt-2">
                Les tâches d'exécution apparaîtront après import des feuilles de route
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
