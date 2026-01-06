import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { 
  FolderOpen, 
  Clock, 
  TrendingUp, 
  Wallet,
  Building2,
  Target
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

  // Disponibilité budgétaire
  const { data: disponibilite } = useQuery({
    queryKey: ["disponibilite-budget", exercice],
    queryFn: async () => {
      const { data: budgetLines } = await supabase
        .from("budget_lines")
        .select("id, dotation_initiale")
        .eq("exercice", exercice);

      const { data: engagements } = await supabase
        .from("budget_engagements")
        .select("montant")
        .eq("exercice", exercice)
        .eq("statut", "valide");

      const dotationTotale = budgetLines?.reduce((sum, bl) => sum + (bl.dotation_initiale || 0), 0) || 0;
      const engageTotal = engagements?.reduce((sum, e) => sum + (e.montant || 0), 0) || 0;
      const disponible = dotationTotale - engageTotal;
      const tauxDisponibilite = dotationTotale > 0 ? Math.round((disponible / dotationTotale) * 100) : 0;

      return { dotationTotale, engageTotal, disponible, tauxDisponibilite };
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

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Disponibilité budgétaire
            </CardTitle>
          </CardHeader>
          <CardContent>
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
            <div className="space-y-2">
              {osStats?.map((os, index) => (
                <div key={os.id} className="flex items-center justify-between text-sm">
                  <span className="truncate max-w-[150px]">{os.code}</span>
                  <span className="font-medium">{formatMontant(os.dotation)}</span>
                </div>
              ))}
              {(!osStats || osStats.length === 0) && (
                <p className="text-xs text-muted-foreground text-center">Aucune donnée</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
