/**
 * DashboardMissions - Dashboard spécialisé Chargé de Mission (CM)
 * Focalisé sur: Missions transversales, Projets spéciaux, Coordination
 */
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase,
  Target,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  MapPin,
  Users,
  RefreshCw,
  Plane,
  Building2,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { useDirectionDashboard } from "@/hooks/dashboard/useDirectionDashboard";
import { formatMontant } from "@/lib/config/sygfp-constants";
import { cn } from "@/lib/utils";

interface DashboardMissionsProps {
  directionId: string;
  directionCode: string;
  directionNom: string;
}

export function DashboardMissions({
  directionId,
  directionCode,
  directionNom,
}: DashboardMissionsProps) {
  const navigate = useNavigate();
  const { kpis, alertes, dossiersRecents, isLoading, refetch } =
    useDirectionDashboard(directionId);

  if (isLoading) {
    return <DashboardMissionsSkeleton />;
  }

  // Données simulées pour les missions (à remplacer par vraies données)
  const missionStats = {
    missionsActives: 5,
    missionsTerminees: 12,
    missionsEnPreparation: 3,
    budgetMissions: 75000000,
    budgetUtilise: 42000000,
    prochaineMission: {
      titre: "Audit des procédures DAAF",
      date: "15 Fév 2026",
      lieu: "Libreville",
      statut: "en_preparation",
    },
    missionsParType: [
      { type: "Audit", count: 6, color: "bg-purple-500" },
      { type: "Formation", count: 4, color: "bg-blue-500" },
      { type: "Inspection", count: 5, color: "bg-orange-500" },
      { type: "Conseil", count: 5, color: "bg-green-500" },
    ],
    projetsSpeciaux: [
      { nom: "Digitalisation procédures", avancement: 75, priorite: "haute" },
      { nom: "Formation agents terrain", avancement: 45, priorite: "moyenne" },
      { nom: "Audit conformité 2026", avancement: 20, priorite: "haute" },
    ],
  };

  const tauxBudgetMission = Math.round(
    (missionStats.budgetUtilise / missionStats.budgetMissions) * 100
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10">
            <Briefcase className="h-6 w-6 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard Missions</h1>
            <p className="text-muted-foreground">{directionNom}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-base px-4 py-2">
            {directionCode}
          </Badge>
          <Button variant="ghost" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Alertes */}
      {alertes.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-warning flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5" />
              Points d'Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {alertes.map((alerte, i) => (
                <li key={i} className="text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-warning" />
                  {alerte.message} ({alerte.nombre})
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* KPIs Missions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Missions Actives */}
        <Card className="border-orange-500/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Missions Actives</CardTitle>
            <Target className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">
              {missionStats.missionsActives}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              En cours d'exécution
            </p>
          </CardContent>
        </Card>

        {/* Missions Terminées */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Terminées</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">
              {missionStats.missionsTerminees}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Cette année
            </p>
          </CardContent>
        </Card>

        {/* En Préparation */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">En Préparation</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">
              {missionStats.missionsEnPreparation}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              À venir
            </p>
          </CardContent>
        </Card>

        {/* Budget Missions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Budget Missions</CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {formatMontant(missionStats.budgetUtilise)}
            </div>
            <Progress value={tauxBudgetMission} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {tauxBudgetMission}% sur {formatMontant(missionStats.budgetMissions)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Prochaine Mission + Répartition */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Prochaine Mission */}
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-500" />
              Prochaine Mission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">
                {missionStats.prochaineMission.titre}
              </h3>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {missionStats.prochaineMission.date}
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {missionStats.prochaineMission.lieu}
                </div>
              </div>
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                En préparation
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Répartition par Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-orange-500" />
              Missions par Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {missionStats.missionsParType.map((type) => (
                <div key={type.type} className="flex items-center gap-3">
                  <div className={cn("w-3 h-3 rounded-full", type.color)} />
                  <span className="flex-1 text-sm">{type.type}</span>
                  <Badge variant="secondary">{type.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projets Spéciaux */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            Projets Spéciaux en Cours
          </CardTitle>
          <CardDescription>Suivi des projets transversaux</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {missionStats.projetsSpeciaux.map((projet) => (
              <div key={projet.nom} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{projet.nom}</span>
                  <Badge
                    variant={projet.priorite === "haute" ? "destructive" : "outline"}
                    className="text-xs"
                  >
                    Priorité {projet.priorite}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={projet.avancement} className="h-2 flex-1" />
                  <span className="text-sm font-medium w-12 text-right">
                    {projet.avancement}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dossiers financiers */}
      {kpis && (
        <Card>
          <CardHeader>
            <CardTitle>Dossiers Financiers</CardTitle>
            <CardDescription>Suivi des dossiers de la mission</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">{kpis.notes_sef.total}</div>
                <p className="text-xs text-muted-foreground">Notes SEF</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">
                  {formatMontant(kpis.engagements.montant_total)}
                </div>
                <p className="text-xs text-muted-foreground">Engagés</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">{kpis.liquidations.total}</div>
                <p className="text-xs text-muted-foreground">Liquidations</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">{kpis.taux_execution}%</div>
                <p className="text-xs text-muted-foreground">Exécution</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actions Missions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => navigate("/notes-sef?action=new")}
            >
              <FileText className="h-4 w-4" />
              Nouvelle Demande
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => navigate("/engagements")}
            >
              <Briefcase className="h-4 w-4" />
              Mes Engagements
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => navigate("/etats-execution")}
            >
              <TrendingUp className="h-4 w-4" />
              Rapports
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => navigate("/workflow-tasks")}
            >
              <Clock className="h-4 w-4" />
              Tâches
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardMissionsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default DashboardMissions;
