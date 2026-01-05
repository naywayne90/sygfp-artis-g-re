import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClipboardList, Activity, CheckCircle2, AlertTriangle, Target, Building2 } from "lucide-react";
import { format, isPast } from "date-fns";
import { fr } from "date-fns/locale";
import { type Tache } from "@/hooks/useTaches";

interface PhysiqueDashboardProps {
  taches: Tache[] | undefined;
  isLoading: boolean;
}

export function PhysiqueDashboard({ taches, isLoading }: PhysiqueDashboardProps) {
  // Calculate stats
  const stats = useMemo(() => {
    if (!taches) return null;

    const total = taches.length;
    const enCours = taches.filter(t => t.statut === 'en_cours').length;
    const terminees = taches.filter(t => t.statut === 'termine').length;
    
    const enRetard = taches.filter(t => {
      if (!t.date_fin || t.statut === 'termine') return false;
      return isPast(new Date(t.date_fin)) && t.avancement < 100;
    });

    const avancementGlobal = total > 0 
      ? Math.round(taches.reduce((acc, t) => acc + t.avancement, 0) / total) 
      : 0;

    // By OS
    const byOS = new Map<string, { code: string; libelle: string; taches: number; avancement: number }>();
    taches.forEach(t => {
      const os = t.sous_activite?.activite?.action?.os;
      if (os) {
        const existing = byOS.get(os.id) || { code: os.code, libelle: os.libelle, taches: 0, avancement: 0 };
        existing.taches++;
        existing.avancement += t.avancement;
        byOS.set(os.id, existing);
      }
    });
    const osStats = Array.from(byOS.values()).map(os => ({
      ...os,
      avancement: os.taches > 0 ? Math.round(os.avancement / os.taches) : 0
    })).sort((a, b) => b.avancement - a.avancement);

    // By Direction (via budget line)
    const byDirection = new Map<string, { code: string; label: string; taches: number; avancement: number }>();
    taches.forEach(t => {
      const directionId = t.budget_line?.direction_id;
      if (directionId) {
        // We'd need direction info - for now use direction_id as key
        const existing = byDirection.get(directionId) || { code: directionId.slice(0, 8), label: "Direction", taches: 0, avancement: 0 };
        existing.taches++;
        existing.avancement += t.avancement;
        byDirection.set(directionId, existing);
      }
    });

    return {
      total,
      enCours,
      terminees,
      enRetard,
      avancementGlobal,
      osStats,
    };
  }, [taches]);

  if (isLoading || !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 w-24 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tâches planifiées
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En cours
            </CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.enCours}</div>
            <p className="text-xs text-muted-foreground">Tâches actives</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Terminées
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.terminees}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.terminees / stats.total) * 100) : 0}% du total
            </p>
          </CardContent>
        </Card>

        <Card className={stats.enRetard.length > 0 ? "border-red-200 dark:border-red-800" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En retard
            </CardTitle>
            <AlertTriangle className={`h-4 w-4 ${stats.enRetard.length > 0 ? "text-red-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.enRetard.length > 0 ? "text-red-500" : ""}`}>
              {stats.enRetard.length}
            </div>
            <p className="text-xs text-muted-foreground">À traiter</p>
          </CardContent>
        </Card>
      </div>

      {/* Global Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Avancement global
          </CardTitle>
          <CardDescription>Taux d'exécution physique de l'exercice</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progression globale</span>
              <span className="font-bold">{stats.avancementGlobal}%</span>
            </div>
            <Progress value={stats.avancementGlobal} className="h-4" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* By OS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" />
              Avancement par Objectif Stratégique
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.osStats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune donnée disponible
              </p>
            ) : (
              <div className="space-y-4">
                {stats.osStats.slice(0, 5).map((os) => (
                  <div key={os.code} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{os.code}</span>
                      <span className="text-muted-foreground">{os.taches} tâches</span>
                      <span className="font-bold">{os.avancement}%</span>
                    </div>
                    <Progress value={os.avancement} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks in delay */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Tâches en retard
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.enRetard.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <p className="text-sm text-muted-foreground">Aucune tâche en retard</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Libellé</TableHead>
                      <TableHead>Date fin</TableHead>
                      <TableHead>Avt.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.enRetard.slice(0, 5).map((tache) => (
                      <TableRow key={tache.id}>
                        <TableCell className="font-mono text-xs">{tache.code}</TableCell>
                        <TableCell className="text-xs truncate max-w-[120px]">{tache.libelle}</TableCell>
                        <TableCell className="text-xs text-red-500">
                          {tache.date_fin && format(new Date(tache.date_fin), "dd/MM/yy", { locale: fr })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{tache.avancement}%</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
