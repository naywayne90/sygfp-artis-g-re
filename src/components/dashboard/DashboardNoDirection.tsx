/**
 * Dashboard pour les utilisateurs sans direction assignée
 * Affiche des statistiques globales en lecture seule et des raccourcis utiles
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useExercice } from "@/contexts/ExerciceContext";
import {
  MapPin,
  FileText,
  CreditCard,
  Receipt,
  FileCheck,
  Search,
  Mail,
  BookOpen,
  TrendingUp,
  Building2,
  Users,
  ArrowRight,
  Sparkles,
  BarChart3,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";

function formatMontant(montant: number): string {
  if (montant >= 1_000_000_000) return `${(montant / 1_000_000_000).toFixed(1)} Mds`;
  if (montant >= 1_000_000) return `${(montant / 1_000_000).toFixed(1)} M`;
  if (montant >= 1_000) return `${(montant / 1_000).toFixed(0)} K`;
  return montant.toFixed(0);
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}) {
  return (
    <Card className="hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground truncate">{title}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({
  title,
  description,
  icon: Icon,
  to,
  color,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  to: string;
  color: string;
}) {
  return (
    <Link to={to} className="block group">
      <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-primary/30">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${color} transition-transform group-hover:scale-110`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold group-hover:text-primary transition-colors">{title}</h3>
                <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </div>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function DashboardNoDirection() {
  const { exercice } = useExercice();
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header avec message de bienvenue */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border p-8">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-secondary/10 blur-2xl" />

        <div className="relative flex items-start gap-6">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 shadow-lg">
            <Sparkles className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Bienvenue sur SYGFP
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Système de Gestion Financière et de Planification - Exercice {exercice}
            </p>
          </div>
        </div>
      </div>

      {/* Alerte Direction non assignée */}
      <Card className="border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-full bg-amber-100 dark:bg-amber-900/50 animate-pulse">
              <MapPin className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-800 dark:text-amber-200 text-lg">
                Direction non assignée
              </h3>
              <p className="text-amber-700 dark:text-amber-300">
                Votre profil n'est pas encore rattaché à une direction.
                En attendant, vous pouvez consulter les statistiques globales ci-dessous.
              </p>
            </div>
            <Button variant="outline" className="border-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50">
              <Mail className="h-4 w-4 mr-2" />
              Contacter l'admin
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques globales */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Statistiques Globales</h2>
          <Badge variant="secondary" className="ml-2">Lecture seule</Badge>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array(4).fill(0).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Notes SEF"
              value={stats?.notesSEFTotal || 0}
              icon={FileText}
              color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
              subtitle={`${stats?.notesSEFValidees || 0} validées`}
            />
            <StatCard
              title="Engagements"
              value={stats?.engagementsTotal || 0}
              icon={CreditCard}
              color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
              subtitle={`${stats?.engagementsEnCours || 0} en cours`}
            />
            <StatCard
              title="Liquidations"
              value={stats?.liquidationsTotal || 0}
              icon={Receipt}
              color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
              subtitle={`${stats?.liquidationsATraiter || 0} à traiter`}
            />
            <StatCard
              title="Ordonnancements"
              value={stats?.ordonnancements || 0}
              icon={FileCheck}
              color="bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
              subtitle={`${stats?.ordonnancementsEnSignature || 0} en signature`}
            />
          </div>
        )}
      </div>

      {/* Budget global */}
      {stats?.isBudgetLoaded && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-5 w-5 text-primary" />
              Exécution Budgétaire Globale
            </CardTitle>
            <CardDescription>Vue d'ensemble de l'exercice {exercice}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Budget Total</p>
                <p className="text-2xl font-bold">{formatMontant(stats.budgetTotal)} F</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Engagé</span>
                  <span className="font-medium">{stats.tauxEngagement.toFixed(1)}%</span>
                </div>
                <Progress value={stats.tauxEngagement} className="h-2" />
                <p className="text-sm font-medium">{formatMontant(stats.budgetEngage)} F</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Liquidé</span>
                  <span className="font-medium">{stats.tauxLiquidation.toFixed(1)}%</span>
                </div>
                <Progress value={stats.tauxLiquidation} className="h-2 [&>div]:bg-purple-500" />
                <p className="text-sm font-medium">{formatMontant(stats.budgetLiquide)} F</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payé</span>
                  <span className="font-medium">{stats.tauxPaiement.toFixed(1)}%</span>
                </div>
                <Progress value={stats.tauxPaiement} className="h-2 [&>div]:bg-emerald-500" />
                <p className="text-sm font-medium">{formatMontant(stats.budgetPaye)} F</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Raccourcis rapides */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Raccourcis Rapides</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <QuickAction
            title="Recherche Dossier"
            description="Rechercher un dossier par numéro ou référence"
            icon={Search}
            to="/recherche"
            color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          />
          <QuickAction
            title="États d'Exécution"
            description="Consulter les rapports d'exécution budgétaire"
            icon={BarChart3}
            to="/etats-execution"
            color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
          />
          <QuickAction
            title="Liste des Prestataires"
            description="Consulter l'annuaire des fournisseurs"
            icon={Building2}
            to="/contractualisation/prestataires"
            color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
          />
        </div>
      </div>

      {/* Aide */}
      <Card className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 border-slate-200 dark:border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-slate-200 dark:bg-slate-700">
              <BookOpen className="h-6 w-6 text-slate-600 dark:text-slate-300" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Besoin d'aide ?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Consultez la documentation ou contactez le support technique pour toute question.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <BookOpen className="h-4 w-4 mr-2" />
                Documentation
              </Button>
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Support
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
