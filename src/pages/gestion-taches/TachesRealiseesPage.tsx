// @ts-nocheck
/**
 * TachesRealiseesPage - Liste des tâches réalisées
 *
 * Affiche la liste des tâches/activités ayant le statut "realise"
 * avec les colonnes: IMPUT, ID OS, LIBELLE OS, etc. comme dans l'ancien système
 */

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useExercice } from "@/contexts/ExerciceContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  CheckCircle2,
  Search,
  RefreshCw,
  Filter
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TacheRealisee {
  id: string;
  imput: string;
  id_os: string;
  libelle_os: string;
  id_action: string;
  libelle_action: string;
  id_mission: string;
  libelle_mission: string;
  id_direction: string;
  libelle_direction: string;
  id_plan: string;
  libelle_plan: string;
  activites: string;
  taux_avancement: number;
  date_realisation: string | null;
}

export default function TachesRealiseesPage() {
  const { exerciceId, exercice } = useExercice();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDirection, setSelectedDirection] = useState<string>("all");
  const [selectedMission, setSelectedMission] = useState<string>("all");

  // Charger les filtres
  const { data: filterData } = useQuery({
    queryKey: ["taches-filters", exerciceId],
    queryFn: async () => {
      const [directionsRes, missionsRes] = await Promise.all([
        supabase.from("directions").select("id, code, label").order("code"),
        supabase.from("missions").select("id, code, libelle").order("code")
      ]);

      return {
        directions: directionsRes.data || [],
        missions: missionsRes.data || []
      };
    },
    enabled: !!exerciceId
  });

  // Charger les tâches réalisées
  const { data: taches, isLoading, refetch } = useQuery({
    queryKey: ["taches-realisees", exerciceId, selectedDirection, selectedMission],
    queryFn: async () => {
      let query = supabase
        .from("task_executions_view")
        .select("*")
        .eq("exercice_id", exerciceId)
        .eq("status", "realise");

      if (selectedDirection !== "all") {
        query = query.eq("direction_id", selectedDirection);
      }
      if (selectedMission !== "all") {
        query = query.eq("mission_id", selectedMission);
      }

      const { data, error } = await query.order("activite_code");

      if (error) throw error;

      return (data || []).map((task: Record<string, unknown>, index: number) => ({
        id: task.id as string,
        imput: task.activite_code as string || `${index + 1}`,
        id_os: task.os_code as string || "-",
        libelle_os: task.os_libelle as string || "-",
        id_action: task.action_code as string || "-",
        libelle_action: task.action_libelle as string || "-",
        id_mission: task.mission_code as string || "-",
        libelle_mission: task.mission_libelle as string || "-",
        id_direction: task.direction_code as string || "-",
        libelle_direction: task.direction_label as string || "-",
        id_plan: "-",
        libelle_plan: "-",
        activites: task.activite_libelle as string || "-",
        taux_avancement: (task.taux_avancement as number) || 100,
        date_realisation: task.date_fin_reelle as string | null
      })) as TacheRealisee[];
    },
    enabled: !!exerciceId
  });

  // Filtrer par recherche
  const filteredTaches = useMemo(() => {
    if (!taches) return [];
    if (!searchQuery) return taches;

    const query = searchQuery.toLowerCase();
    return taches.filter(t =>
      t.activites.toLowerCase().includes(query) ||
      t.libelle_os.toLowerCase().includes(query) ||
      t.libelle_direction.toLowerCase().includes(query) ||
      t.imput.toLowerCase().includes(query)
    );
  }, [taches, searchQuery]);

  // Export columns
  const exportColumns = [
    { key: "imput", label: "IMPUT", type: "text" as const },
    { key: "id_os", label: "ID OS", type: "text" as const },
    { key: "libelle_os", label: "LIBELLE OS", type: "text" as const },
    { key: "id_action", label: "ID ACTION", type: "text" as const },
    { key: "libelle_action", label: "LIBELLE ACTION", type: "text" as const },
    { key: "id_mission", label: "ID MISSION", type: "text" as const },
    { key: "libelle_mission", label: "LIBELLE MISSION", type: "text" as const },
    { key: "id_direction", label: "ID DIRECTION", type: "text" as const },
    { key: "libelle_direction", label: "LIBELLE DIRECTION", type: "text" as const },
    { key: "id_plan", label: "ID PLAN", type: "text" as const },
    { key: "libelle_plan", label: "LIBELLE PLAN", type: "text" as const },
    { key: "activites", label: "ACTIVITES", type: "text" as const },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            Liste des tâches réalisées
          </h1>
          <p className="text-muted-foreground">
            Exercice {exercice?.annee || "-"} - Tâches avec statut "Réalisé"
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          {filteredTaches.length > 0 && (
            <ExportButtons
              data={filteredTaches as unknown as Record<string, unknown>[]}
              columns={exportColumns}
              filename={`taches-realisees-${exercice?.annee || "export"}`}
              title="Liste des tâches réalisées"
              subtitle={`Exercice ${exercice?.annee || "-"}`}
              showCopy
              showPrint
            />
          )}
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-1 block">Recherche</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
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
          <CardTitle>Tâches réalisées</CardTitle>
          <CardDescription>
            {filteredTaches.length} tâche(s) affichée(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredTaches.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">N°</TableHead>
                    <TableHead>IMPUT</TableHead>
                    <TableHead>ID OS</TableHead>
                    <TableHead className="hidden lg:table-cell">LIBELLE OS</TableHead>
                    <TableHead className="hidden md:table-cell">ID ACTION</TableHead>
                    <TableHead className="hidden xl:table-cell">LIBELLE ACTION</TableHead>
                    <TableHead className="hidden md:table-cell">ID MISSION</TableHead>
                    <TableHead className="hidden xl:table-cell">LIBELLE MISSION</TableHead>
                    <TableHead>ID DIRECTION</TableHead>
                    <TableHead className="hidden lg:table-cell">LIBELLE DIRECTION</TableHead>
                    <TableHead className="hidden 2xl:table-cell">ACTIVITES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTaches.map((tache, index) => (
                    <TableRow key={tache.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono bg-green-100 text-green-800">
                          {tache.imput}
                        </Badge>
                      </TableCell>
                      <TableCell>{tache.id_os}</TableCell>
                      <TableCell className="hidden lg:table-cell max-w-[150px] truncate" title={tache.libelle_os}>
                        {tache.libelle_os}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{tache.id_action}</TableCell>
                      <TableCell className="hidden xl:table-cell max-w-[150px] truncate" title={tache.libelle_action}>
                        {tache.libelle_action}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{tache.id_mission}</TableCell>
                      <TableCell className="hidden xl:table-cell max-w-[120px] truncate" title={tache.libelle_mission}>
                        {tache.libelle_mission}
                      </TableCell>
                      <TableCell>{tache.id_direction}</TableCell>
                      <TableCell className="hidden lg:table-cell">{tache.libelle_direction}</TableCell>
                      <TableCell className="hidden 2xl:table-cell max-w-[200px] truncate" title={tache.activites}>
                        {tache.activites}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune tâche réalisée pour cet exercice</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
