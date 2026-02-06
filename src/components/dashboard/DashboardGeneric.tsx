/**
 * DashboardGeneric - Template de dashboard pour toutes les directions
 * Utilisé comme fallback pour les directions sans dashboard spécialisé
 */
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  FileText,
  CreditCard,
  Receipt,
  FileCheck,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Building2,
  ChevronRight,
} from "lucide-react";
import { useDirectionDashboard } from "@/hooks/dashboard/useDirectionDashboard";
import { formatMontant } from "@/lib/config/sygfp-constants";
import { cn } from "@/lib/utils";

interface DashboardGenericProps {
  directionId: string;
  directionCode: string;
  directionNom: string;
}

export function DashboardGeneric({
  directionId,
  directionCode,
  directionNom,
}: DashboardGenericProps) {
  const navigate = useNavigate();
  const { kpis, alertes, dossiersRecents, isLoading, refetch } =
    useDirectionDashboard(directionId);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Valeurs par défaut si pas de KPIs
  const safeKpis = kpis || {
    exercice: new Date().getFullYear(),
    notes_sef: { total: 0, brouillon: 0, soumis: 0, valide: 0, rejete: 0 },
    engagements: { total: 0, montant_total: 0, en_cours: 0, valide: 0 },
    liquidations: { total: 0, montant_total: 0, en_cours: 0, valide: 0 },
    ordonnancements: { total: 0, montant_total: 0, en_cours: 0, valide: 0 },
    taux_execution: 0,
    budget: { dotation_initiale: 0, credits_disponibles: 0 },
  };

  const tauxBudget =
    safeKpis.budget.dotation_initiale > 0
      ? Math.round(
          ((safeKpis.budget.dotation_initiale - safeKpis.budget.credits_disponibles) /
            safeKpis.budget.dotation_initiale) *
            100
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard {directionCode}</h1>
            <p className="text-muted-foreground">{directionNom}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-base px-4 py-2">
            Exercice {safeKpis.exercice}
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
              Alertes ({alertes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {alertes.map((alerte, i) => (
                <li
                  key={i}
                  className={cn(
                    "flex items-center gap-2 text-sm p-2 rounded-lg",
                    alerte.niveau === "danger" && "bg-destructive/10 text-destructive",
                    alerte.niveau === "warning" && "bg-warning/10 text-warning",
                    alerte.niveau === "info" && "bg-primary/10 text-primary"
                  )}
                >
                  <span className="font-medium">{alerte.nombre}</span>
                  <span>{alerte.message}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* KPIs Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Notes SEF */}
        <KPICard
          title="Notes SEF"
          icon={FileText}
          value={safeKpis.notes_sef.total}
          onClick={() => navigate("/notes-sef")}
        >
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Badge variant="outline" className="text-xs">
              {safeKpis.notes_sef.brouillon} brouillon
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {safeKpis.notes_sef.soumis} soumis
            </Badge>
            <Badge className="bg-success text-success-foreground text-xs">
              {safeKpis.notes_sef.valide} validé
            </Badge>
            {safeKpis.notes_sef.rejete > 0 && (
              <Badge variant="destructive" className="text-xs">
                {safeKpis.notes_sef.rejete} rejeté
              </Badge>
            )}
          </div>
        </KPICard>

        {/* Engagements */}
        <KPICard
          title="Engagements"
          icon={CreditCard}
          value={formatMontant(safeKpis.engagements.montant_total)}
          onClick={() => navigate("/engagements")}
        >
          <p className="text-xs text-muted-foreground mt-1">
            {safeKpis.engagements.total} dossiers
            {safeKpis.engagements.en_cours > 0 && (
              <span className="text-warning ml-1">
                ({safeKpis.engagements.en_cours} en cours)
              </span>
            )}
          </p>
        </KPICard>

        {/* Liquidations */}
        <KPICard
          title="Liquidations"
          icon={Receipt}
          value={formatMontant(safeKpis.liquidations.montant_total)}
          onClick={() => navigate("/liquidations")}
        >
          <p className="text-xs text-muted-foreground mt-1">
            {safeKpis.liquidations.total} dossiers
            {safeKpis.liquidations.en_cours > 0 && (
              <span className="text-warning ml-1">
                ({safeKpis.liquidations.en_cours} en cours)
              </span>
            )}
          </p>
        </KPICard>

        {/* Ordonnancements */}
        <KPICard
          title="Ordonnancements"
          icon={FileCheck}
          value={formatMontant(safeKpis.ordonnancements.montant_total)}
          onClick={() => navigate("/ordonnancements")}
        >
          <p className="text-xs text-muted-foreground mt-1">
            {safeKpis.ordonnancements.total} dossiers
            {safeKpis.ordonnancements.en_cours > 0 && (
              <span className="text-warning ml-1">
                ({safeKpis.ordonnancements.en_cours} en cours)
              </span>
            )}
          </p>
        </KPICard>
      </div>

      {/* Budget et Taux d'exécution */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Budget */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Budget</CardTitle>
            <CardDescription>Dotation et disponibilité</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Dotation initiale</span>
              <span className="font-semibold">
                {formatMontant(safeKpis.budget.dotation_initiale)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Crédits disponibles</span>
              <span
                className={cn(
                  "font-semibold",
                  safeKpis.budget.credits_disponibles < 0 && "text-destructive"
                )}
              >
                {formatMontant(safeKpis.budget.credits_disponibles)}
              </span>
            </div>
            <Progress value={tauxBudget} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              {tauxBudget}% du budget consommé
            </p>
          </CardContent>
        </Card>

        {/* Taux d'exécution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Taux d'exécution
            </CardTitle>
            <CardDescription>
              Ratio ordonnancements validés / notes SEF créées
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-4">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${safeKpis.taux_execution * 3.52} 352`}
                  className="text-primary transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold">{safeKpis.taux_execution}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dossiers récents */}
      {dossiersRecents.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Dossiers récents</CardTitle>
              <CardDescription>Dernières activités sur vos dossiers</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/recherche")}
              className="gap-1"
            >
              Voir tout
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dossiersRecents.slice(0, 5).map((dossier) => (
                <div
                  key={dossier.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/notes-sef/${dossier.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <EtapeIcon etape={dossier.etape_actuelle} />
                    <div>
                      <p className="font-medium text-sm">{dossier.numero_dossier}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {dossier.objet}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <EtapeBadge etape={dossier.etape_actuelle} />
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => navigate("/notes-sef?action=new")}
            >
              <FileText className="h-4 w-4" />
              Nouvelle Note SEF
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => navigate("/engagements")}
            >
              <CreditCard className="h-4 w-4" />
              Mes Engagements
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => navigate("/workflow-tasks")}
            >
              <Clock className="h-4 w-4" />
              Tâches à traiter
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => navigate("/recherche")}
            >
              <FileCheck className="h-4 w-4" />
              Rechercher un dossier
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Composant KPI Card
interface KPICardProps {
  title: string;
  icon: React.ElementType;
  value: string | number;
  children?: React.ReactNode;
  onClick?: () => void;
}

function KPICard({ title, icon: Icon, value, children, onClick }: KPICardProps) {
  return (
    <Card
      className={cn(
        "transition-colors",
        onClick && "cursor-pointer hover:bg-muted/50"
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {children}
      </CardContent>
    </Card>
  );
}

// Icône selon l'étape
function EtapeIcon({ etape }: { etape: string }) {
  const iconClass = "h-8 w-8 p-1.5 rounded-lg";

  if (etape.includes("rejete")) {
    return (
      <div className={cn(iconClass, "bg-destructive/10 text-destructive")}>
        <XCircle className="h-full w-full" />
      </div>
    );
  }
  if (etape === "ordonnance") {
    return (
      <div className={cn(iconClass, "bg-success/10 text-success")}>
        <CheckCircle2 className="h-full w-full" />
      </div>
    );
  }
  if (etape.includes("en_cours") || etape.includes("soumis")) {
    return (
      <div className={cn(iconClass, "bg-warning/10 text-warning")}>
        <Clock className="h-full w-full" />
      </div>
    );
  }
  return (
    <div className={cn(iconClass, "bg-primary/10 text-primary")}>
      <FileText className="h-full w-full" />
    </div>
  );
}

// Badge selon l'étape
function EtapeBadge({ etape }: { etape: string }) {
  const etapeLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    sef_brouillon: { label: "Brouillon", variant: "outline" },
    sef_soumis: { label: "Soumis", variant: "secondary" },
    sef_valide: { label: "SEF validé", variant: "default" },
    engagement: { label: "Engagement", variant: "secondary" },
    liquidation: { label: "Liquidation", variant: "secondary" },
    ordonnance: { label: "Ordonnancé", variant: "default" },
    sef_rejete: { label: "Rejeté", variant: "destructive" },
  };

  const config = etapeLabels[etape] || { label: etape, variant: "outline" as const };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// Skeleton pour le chargement
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="flex justify-center">
            <Skeleton className="h-32 w-32 rounded-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default DashboardGeneric;
