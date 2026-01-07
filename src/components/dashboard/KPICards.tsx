import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { 
  FolderOpen, 
  Clock, 
  TrendingUp, 
  Wallet,
  Building2,
  Target,
  AlertTriangle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";

const formatMontant = (montant: number): string => {
  if (montant >= 1_000_000_000) return `${(montant / 1_000_000_000).toFixed(1)} Mds`;
  if (montant >= 1_000_000) return `${(montant / 1_000_000).toFixed(1)} M`;
  if (montant >= 1_000) return `${(montant / 1_000).toFixed(0)} K`;
  return montant.toFixed(0);
};

export function KPICards() {
  const { exercice } = useExercice();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  // Dossiers par statut
  const { data: dossierStats } = useQuery({
    queryKey: ["dossier-stats", exercice],
    queryFn: async () => {
      const { data } = await supabase
        .from("dossiers")
        .select("id, statut_global")
        .eq("exercice", exercice);
      
      return {
        total: data?.length || 0,
        enCours: data?.filter(d => d.statut_global === "en_cours").length || 0,
        valides: data?.filter(d => d.statut_global === "valide").length || 0,
        soldes: data?.filter(d => d.statut_global === "solde").length || 0,
        bloques: data?.filter(d => d.statut_global === "differe" || d.statut_global === "rejete").length || 0,
      };
    },
    enabled: !!exercice,
  });

  // Délais moyens par étape
  const { data: delaisStats } = useQuery({
    queryKey: ["delais-stats", exercice],
    queryFn: async () => {
      // Délai engagement (création -> validation)
      const { data: engagements } = await supabase
        .from("budget_engagements")
        .select("created_at, date_engagement")
        .eq("exercice", exercice)
        .eq("statut", "valide");

      let delaiEngagement = 0;
      if (engagements?.length) {
        const totalDays = engagements.reduce((sum, e) => {
          const created = new Date(e.created_at);
          const validated = new Date(e.date_engagement);
          return sum + Math.max(0, Math.floor((validated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)));
        }, 0);
        delaiEngagement = Math.round(totalDays / engagements.length);
      }

      // Délai liquidation
      const { data: liquidations } = await supabase
        .from("budget_liquidations")
        .select("created_at, date_liquidation")
        .eq("exercice", exercice)
        .eq("statut", "valide");

      let delaiLiquidation = 0;
      if (liquidations?.length) {
        const totalDays = liquidations.reduce((sum, l) => {
          const created = new Date(l.created_at);
          const validated = new Date(l.date_liquidation);
          return sum + Math.max(0, Math.floor((validated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)));
        }, 0);
        delaiLiquidation = Math.round(totalDays / liquidations.length);
      }

      return { delaiEngagement, delaiLiquidation };
    },
    enabled: !!exercice,
  });

  // Montants par OS
  const { data: osStats } = useQuery({
    queryKey: ["os-stats", exercice],
    queryFn: async () => {
      const { data: budgetLines } = await supabase
        .from("budget_lines")
        .select(`
          id, dotation_initiale, os_id,
          objectifs_strategiques(id, code, libelle)
        `)
        .eq("exercice", exercice);

      const osMap = new Map<string, { code: string; label: string; dotation: number }>();
      
      budgetLines?.forEach(bl => {
        if (bl.os_id && bl.objectifs_strategiques) {
          const os = bl.objectifs_strategiques as any;
          const existing = osMap.get(bl.os_id) || { code: os.code, label: os.libelle, dotation: 0 };
          existing.dotation += bl.dotation_initiale || 0;
          osMap.set(bl.os_id, existing);
        }
      });

      return Array.from(osMap.entries())
        .map(([id, stats]) => ({ id, ...stats }))
        .sort((a, b) => b.dotation - a.dotation)
        .slice(0, 5);
    },
    enabled: !!exercice,
  });

  // Disponibilité budgétaire - CORRIGÉ: utilise uniquement engagements validés
  const { data: disponibilite } = useQuery({
    queryKey: ["disponibilite-budget", exercice],
    queryFn: async () => {
      const { data: budgetLines } = await supabase
        .from("budget_lines")
        .select("id, dotation_initiale")
        .eq("exercice", exercice);

      const { data: engagements } = await supabase
        .from("budget_engagements")
        .select("montant, statut")
        .eq("exercice", exercice);

      const dotationTotale = budgetLines?.reduce((sum, bl) => sum + (bl.dotation_initiale || 0), 0) || 0;
      // CORRECTION: Ne compter que les engagements validés
      const engageTotal = engagements
        ?.filter(e => e.statut === "valide")
        .reduce((sum, e) => sum + (e.montant || 0), 0) || 0;
      
      // Disponible brut (peut être négatif pour dépassement)
      const disponibleRaw = dotationTotale - engageTotal;
      // Disponible affiché (min 0 pour le progrès)
      const disponible = disponibleRaw;
      const tauxDisponibilite = dotationTotale > 0 ? Math.round((Math.max(0, disponibleRaw) / dotationTotale) * 100) : 0;
      const isBudgetLoaded = dotationTotale > 0;
      const hasOverspent = disponibleRaw < 0;

      return { dotationTotale, engageTotal, disponible, tauxDisponibilite, isBudgetLoaded, hasOverspent };
    },
    enabled: !!exercice,
  });

  if (statsLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dossiers par statut */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total dossiers</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dossierStats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En cours</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{dossierStats?.enCours || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Validés</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{dossierStats?.valides || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Soldés</CardTitle>
            <Wallet className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{dossierStats?.soldes || 0}</div>
          </CardContent>
        </Card>

        <Card className={dossierStats?.bloques ? "border-destructive/30" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bloqués</CardTitle>
            <Clock className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{dossierStats?.bloques || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Délais moyens et disponibilité */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Délais moyens par étape
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Engagement</span>
                <span className="font-medium">{delaisStats?.delaiEngagement || 0} jours</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Liquidation</span>
                <span className="font-medium">{delaisStats?.delaiLiquidation || 0} jours</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={
          !disponibilite?.isBudgetLoaded 
            ? "border-warning/50" 
            : (disponibilite?.tauxDisponibilite || 0) < 20 
              ? "border-destructive/50"
              : ""
        }>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Disponibilité budgétaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!disponibilite?.isBudgetLoaded ? (
              <div className="text-center py-2">
                <AlertTriangle className="h-5 w-5 text-warning mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Budget non chargé</p>
                {(disponibilite?.engageTotal || 0) > 0 && (
                  <p className="text-xs text-destructive mt-1">
                    ⚠️ {formatMontant(disponibilite?.engageTotal || 0)} engagé sans dotation
                  </p>
                )}
              </div>
            ) : disponibilite?.disponible < 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-destructive font-medium">Dépassement</span>
                  <span className="font-bold text-destructive">-{formatMontant(Math.abs(disponibilite?.disponible || 0))}</span>
                </div>
                <Progress value={100} className="h-2 bg-destructive/20" />
                <p className="text-xs text-destructive text-center">
                  ⚠️ Budget dépassé - Vérifiez les lignes
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Disponible</span>
                  <span className="font-medium">{formatMontant(disponibilite?.disponible || 0)}</span>
                </div>
                <Progress value={disponibilite?.tauxDisponibilite || 0} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  {disponibilite?.tauxDisponibilite || 0}% du budget disponible
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Top OS par dotation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!osStats || osStats.length === 0) ? (
              <div className="text-center py-2">
                <Building2 className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Structure de planification à charger</p>
                <Button variant="link" size="sm" className="text-xs p-0 h-auto mt-1" asChild>
                  <a href="/planification/budget">→ Importer la structure</a>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {osStats?.map((os, index) => (
                  <div key={os.id} className="flex items-center justify-between text-sm">
                    <span className="truncate max-w-[150px]">{os.code}</span>
                    <span className="font-medium">{formatMontant(os.dotation)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
