/**
 * DashboardAICB - Dashboard spécialisé Audit Interne et Contrôle Budgétaire
 * Focalisé sur: Contrôles de conformité, Anomalies, Rapports d'audit
 */
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileSearch,
  TrendingUp,
  TrendingDown,
  AlertOctagon,
  ClipboardCheck,
  FileWarning,
  RefreshCw,
  Building2,
  ArrowUpRight,
  BarChart3,
} from "lucide-react";
import { useDirectionDashboard } from "@/hooks/dashboard/useDirectionDashboard";
import { useControleurDashboard } from "@/hooks/useDashboardByRole";
import { formatMontant } from "@/lib/config/sygfp-constants";
import { cn } from "@/lib/utils";

interface DashboardAICBProps {
  directionId: string;
  directionCode: string;
  directionNom: string;
}

export function DashboardAICB({
  directionId,
  directionCode,
  directionNom,
}: DashboardAICBProps) {
  const navigate = useNavigate();
  const { kpis, isLoading: isLoadingDirection, refetch } = useDirectionDashboard(directionId);
  const { data: controleurStats, isLoading: isLoadingControleur } = useControleurDashboard();

  const isLoading = isLoadingDirection || isLoadingControleur;

  if (isLoading) {
    return <DashboardAICBSkeleton />;
  }

  const stats = controleurStats || {
    lignesCritiques: 0,
    lignesAlertes: 0,
    lignesSaines: 0,
    totalLignes: 0,
    engagementsAViser: 0,
    anomaliesDetectees: 0,
    montantEngage: 0,
    montantDisponible: 0,
    tauxConsommationGlobal: 0,
    lignesCritiquesDetails: [],
    anomaliesDetails: [],
  };

  const conformiteGlobale = stats.totalLignes > 0
    ? Math.round((stats.lignesSaines / stats.totalLignes) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
            <Shield className="h-6 w-6 text-purple-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard Audit & Contrôle</h1>
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

      {/* Résumé Conformité */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Score de conformité */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-purple-500" />
              Indice de Conformité Globale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${conformiteGlobale * 2.51} 251`}
                    className={cn(
                      "transition-all duration-500",
                      conformiteGlobale >= 80 ? "text-success" :
                      conformiteGlobale >= 60 ? "text-warning" : "text-destructive"
                    )}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold">{conformiteGlobale}%</span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-success" />
                    Lignes saines
                  </span>
                  <span className="font-medium">{stats.lignesSaines}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-warning" />
                    Lignes en alerte
                  </span>
                  <span className="font-medium">{stats.lignesAlertes}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-destructive" />
                    Lignes critiques
                  </span>
                  <span className="font-medium">{stats.lignesCritiques}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Anomalies */}
        <Card className={cn(
          stats.anomaliesDetectees > 0 && "border-destructive/50 bg-destructive/5"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertOctagon className="h-4 w-4 text-destructive" />
              Anomalies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              {stats.anomaliesDetectees}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.anomaliesDetectees === 0 ? "Aucune anomalie détectée" : "À investiguer"}
            </p>
          </CardContent>
        </Card>

        {/* Engagements à viser */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileSearch className="h-4 w-4" />
              À Viser
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.engagementsAViser}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Engagements en attente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Budget Engagé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMontant(stats.montantEngage)}</div>
            <Progress value={stats.tauxConsommationGlobal} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.tauxConsommationGlobal}% consommé
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Crédits Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              stats.montantDisponible < 0 && "text-destructive"
            )}>
              {formatMontant(stats.montantDisponible)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Reste à engager
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Lignes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLignes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Lignes budgétaires actives
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Anomalies détaillées */}
      {stats.anomaliesDetails && stats.anomaliesDetails.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <FileWarning className="h-5 w-5" />
              Anomalies Détectées
            </CardTitle>
            <CardDescription>
              Liste des anomalies nécessitant une investigation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.anomaliesDetails.map((anomalie, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border",
                    anomalie.severity === "critical" && "border-destructive/50 bg-destructive/5",
                    anomalie.severity === "warning" && "border-warning/50 bg-warning/5",
                    anomalie.severity === "info" && "border-primary/50 bg-primary/5"
                  )}
                >
                  {anomalie.severity === "critical" ? (
                    <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  ) : anomalie.severity === "warning" ? (
                    <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{anomalie.type}</p>
                    <p className="text-sm text-muted-foreground">{anomalie.description}</p>
                  </div>
                  <Badge
                    variant={
                      anomalie.severity === "critical" ? "destructive" :
                      anomalie.severity === "warning" ? "outline" : "secondary"
                    }
                  >
                    {anomalie.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lignes critiques */}
      {stats.lignesCritiquesDetails && stats.lignesCritiquesDetails.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-destructive" />
              Lignes Budgétaires Critiques
            </CardTitle>
            <CardDescription>
              Lignes avec taux de consommation supérieur à 90%
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead className="text-right">Dotation</TableHead>
                  <TableHead className="text-right">Engagé</TableHead>
                  <TableHead className="text-right">Taux</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.lignesCritiquesDetails.slice(0, 5).map((ligne) => (
                  <TableRow key={ligne.id}>
                    <TableCell className="font-mono text-sm">{ligne.code}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{ligne.label}</TableCell>
                    <TableCell className="text-right">
                      {formatMontant(ligne.dotation)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMontant(ligne.engage)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={ligne.tauxConsommation >= 100 ? "destructive" : "outline"}>
                        {ligne.tauxConsommation}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actions de Contrôle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => navigate("/admin/journal-audit")}
            >
              <ClipboardCheck className="h-4 w-4" />
              Journal d'Audit
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => navigate("/etats-execution")}
            >
              <BarChart3 className="h-4 w-4" />
              États d'Exécution
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => navigate("/engagements")}
            >
              <FileSearch className="h-4 w-4" />
              Engagements à Viser
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => navigate("/planification/structure")}
            >
              <Building2 className="h-4 w-4" />
              Structure Budgétaire
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardAICBSkeleton() {
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
        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default DashboardAICB;
