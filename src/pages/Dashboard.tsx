import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  FileText, 
  CreditCard, 
  Receipt, 
  FileCheck, 
  ShoppingCart,
  TrendingUp,
  Plus,
  CheckCircle,
  ArrowRight,
  User,
  Building2,
  Banknote,
  CalendarDays,
  AlertTriangle,
  HelpCircle,
  BarChart3,
  FolderOpen,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useExercice } from "@/contexts/ExerciceContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate } from "react-router-dom";

// Composants de dashboard par rôle
import { DashboardDG } from "@/components/dashboard/DashboardDG";
import { DashboardDAF } from "@/components/dashboard/DashboardDAF";
import { DashboardSDPM } from "@/components/dashboard/DashboardSDPM";
import { DashboardTresorerie } from "@/components/dashboard/DashboardTresorerie";
import { AlertsPanelEnhanced } from "@/components/dashboard/AlertsPanelEnhanced";
import { RecentActivitiesPanel } from "@/components/dashboard/RecentActivitiesPanel";
import { PendingTasksPanel } from "@/components/dashboard/PendingTasksPanel";
import { KPICards } from "@/components/dashboard/KPICards";

// Import des constantes centralisées
import { formatMontantCompact, formatMontant, ETAPES_CONFIG, ETAPES_CHAINE_DEPENSE } from "@/lib/config/sygfp-constants";
import { StatutBadge } from "@/components/shared/StatutBadge";

// Helper pour les icônes par type
const getTypeIcon = (type: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    note: <FileText className="h-4 w-4" />,
    note_sef: <FileText className="h-4 w-4" />,
    note_aef: <FileText className="h-4 w-4" />,
    engagement: <CreditCard className="h-4 w-4" />,
    liquidation: <Receipt className="h-4 w-4" />,
    ordonnancement: <FileCheck className="h-4 w-4" />,
    reglement: <Banknote className="h-4 w-4" />,
    marche: <ShoppingCart className="h-4 w-4" />,
    user_role: <User className="h-4 w-4" />,
  };
  return iconMap[type] || <FileText className="h-4 w-4" />;
};

// Tabs de dashboard par rôle
const DASHBOARD_TABS = [
  { id: "general", label: "Vue générale", icon: TrendingUp, roles: [] }, // Accessible à tous
  { id: "dg", label: "DG", icon: User, roles: ["DG", "ADMIN"] },
  { id: "daf", label: "DAF/SDCT", icon: Building2, roles: ["DAF", "SDCT", "CB", "SAF", "ADMIN"] },
  { id: "sdpm", label: "SDPM", icon: ShoppingCart, roles: ["SDPM", "ADMIN"] },
  { id: "tresorerie", label: "Trésorerie", icon: Banknote, roles: ["TRESORERIE", "COMPTABILITE", "ADMIN"] },
];

export default function Dashboard() {
  const [showHelp, setShowHelp] = useState(false);
  const { exercice } = useExercice();
  const navigate = useNavigate();
  const { userRoles, hasAnyRole } = usePermissions();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  // Utiliser le tauxEngagement précalculé depuis le hook
  const budgetExecute = stats?.tauxEngagement || 0;
  const budgetDisponible = stats?.budgetDisponible || 0;

  // Déterminer les tabs accessibles selon les rôles
  const accessibleTabs = DASHBOARD_TABS.filter(tab => 
    tab.roles.length === 0 || hasAnyRole(tab.roles)
  );

  // Déterminer le tab par défaut selon le rôle principal
  const getDefaultTab = () => {
    if (hasAnyRole(["DG"])) return "dg";
    if (hasAnyRole(["DAF", "SDCT", "CB", "SAF"])) return "daf";
    if (hasAnyRole(["SDPM"])) return "sdpm";
    if (hasAnyRole(["TRESORERIE", "COMPTABILITE"])) return "tresorerie";
    return "general";
  };

  // Raccourcis rapides
  const quickActions = [
    { 
      title: "Créer Note AEF", 
      description: "Nouvelle autorisation d'engagement", 
      icon: Plus, 
      url: "/notes-aef?action=create",
      color: "bg-primary/10 text-primary"
    },
    { 
      title: "Créer Note SEF", 
      description: "Nouvelle dépense sans engagement", 
      icon: Plus, 
      url: "/notes-sef?action=create",
      color: "bg-secondary/10 text-secondary"
    },
    { 
      title: "Notes à valider", 
      description: "Notes en attente de validation", 
      icon: CheckCircle, 
      url: "/notes-aef?filter=en_attente",
      color: "bg-warning/10 text-warning"
    },
    { 
      title: "Engagements à valider", 
      description: "Engagements en attente", 
      icon: CreditCard, 
      url: "/engagements?filter=en_attente",
      color: "bg-success/10 text-success"
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-description">
            Vue d'ensemble de la gestion financière - Exercice {exercice}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowHelp(!showHelp)}>
            <HelpCircle className="h-4 w-4 mr-2" />
            Aide
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/select-exercice")}>
            <CalendarDays className="h-4 w-4 mr-2" />
            Changer d'exercice
          </Button>
        </div>
      </div>

      {/* Section d'aide */}
      <Collapsible open={showHelp} onOpenChange={setShowHelp}>
        <CollapsibleContent>
          <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <HelpCircle className="h-5 w-5" />
                Bienvenue sur SYGFP - Système de Gestion Financière et Programmatique
              </CardTitle>
              <CardDescription className="text-blue-600 dark:text-blue-400">
                Guide d'utilisation du tableau de bord
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold text-foreground mb-2">📊 Qu'est-ce que ce tableau de bord ?</h4>
                <p className="text-muted-foreground">
                  Le <strong>tableau de bord</strong> est votre point d'entrée central dans SYGFP. Il vous offre une 
                  vue synthétique de l'exécution budgétaire de l'ARTI, avec des indicateurs clés, des raccourcis 
                  vers les actions fréquentes et un suivi en temps réel de la chaîne de dépense.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    Les indicateurs (KPIs)
                  </h4>
                  <ul className="text-muted-foreground space-y-1 ml-6 list-disc">
                    <li><strong>Notes</strong> : Demandes d'autorisation de dépense en attente</li>
                    <li><strong>Marchés</strong> : Procédures de passation en cours</li>
                    <li><strong>Engagements</strong> : Réservations budgétaires actives</li>
                    <li><strong>Liquidations</strong> : Factures à traiter après service fait</li>
                    <li><strong>Ordonnancements</strong> : Ordres de paiement en signature</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <Plus className="h-4 w-4 text-green-500" />
                    Raccourcis rapides
                  </h4>
                  <ul className="text-muted-foreground space-y-1 ml-6 list-disc">
                    <li><strong>Note AEF</strong> : Créer une autorisation d'engagement financier</li>
                    <li><strong>Note SEF</strong> : Créer une dépense sans engagement préalable</li>
                    <li><strong>Notes à valider</strong> : Accéder aux notes en attente de visa</li>
                    <li><strong>Engagements à valider</strong> : Traiter les engagements soumis</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                    Exécution budgétaire
                  </h4>
                  <ul className="text-muted-foreground space-y-1 ml-6 list-disc">
                    <li><strong>Taux d'engagement</strong> : % du budget réservé pour des dépenses</li>
                    <li><strong>Taux de liquidation</strong> : % des engagements facturés</li>
                    <li><strong>Taux de paiement</strong> : % des liquidations payées</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-orange-500" />
                    Recherche Dossier
                  </h4>
                  <ul className="text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Accédez au module <strong>Recherche Dossier</strong> dans le menu</li>
                    <li>Suivez l'avancement complet de chaque opération de dépense</li>
                    <li>Visualisez la timeline de la chaîne de dépense</li>
                  </ul>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <h4 className="font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  La chaîne de dépense
                </h4>
                <p className="text-amber-600 dark:text-amber-400 text-sm">
                  Chaque dépense suit un processus réglementaire : <strong>Note (autorisation) → Engagement (réservation budget) → Liquidation (constat service fait) → Ordonnancement (ordre de payer) → Règlement (paiement effectif)</strong>.
                  Ce tableau de bord vous permet de suivre l'avancement à chaque étape.
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <h4 className="font-semibold text-green-700 dark:text-green-300 flex items-center gap-2 mb-1">
                  <User className="h-4 w-4" />
                  Vues par rôle
                </h4>
                <p className="text-green-600 dark:text-green-400 text-sm">
                  Les onglets ci-dessous s'adaptent à votre profil. Chaque rôle (DG, DAF, SDPM, Trésorerie) 
                  dispose d'une vue personnalisée avec les indicateurs et actions qui lui sont propres.
                </p>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Tabs par rôle */}
      <Tabs defaultValue={getDefaultTab()} className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1 bg-muted/50 p-1">
          {accessibleTabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Vue générale */}
        <TabsContent value="general" className="space-y-6">
          {/* Alertes d'incohérence budgétaire */}
          {!statsLoading && stats?.hasInconsistency && (
            <Alert 
              variant={stats.inconsistencyType === 'overspent' ? "destructive" : "default"} 
              className={
                stats.inconsistencyType === 'overspent' 
                  ? "border-destructive/50 bg-destructive/10" 
                  : "border-warning/50 bg-warning/10"
              }
            >
              <AlertTriangle className={`h-4 w-4 ${stats.inconsistencyType === 'overspent' ? 'text-destructive' : 'text-warning'}`} />
              <AlertDescription className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {stats.inconsistencyType === 'budget_not_loaded' && '⚠️ Dotation non chargée'}
                    {stats.inconsistencyType === 'overspent' && '🚨 Dépassement budgétaire'}
                    {stats.inconsistencyType === 'data_mismatch' && '⚠️ Incohérence de données'}
                  </span>
                  <Link to="/planification/budget">
                    <Button variant="outline" size="sm">
                      Gérer le budget
                    </Button>
                  </Link>
                </div>
                <span className="text-sm">{stats.inconsistencyMessage}</span>
                
                {/* Top lignes en dépassement */}
                {stats.topLignesDepassement.length > 0 && (
                  <div className="mt-2 p-2 bg-background/50 rounded">
                    <p className="text-xs font-medium mb-1">Lignes en dépassement :</p>
                    <div className="space-y-1">
                      {stats.topLignesDepassement.slice(0, 3).map(ligne => (
                        <div key={ligne.id} className="flex justify-between text-xs">
                          <span className="truncate max-w-[200px]">{ligne.code}</span>
                          <span className="text-destructive font-medium">
                            +{formatMontant(ligne.depassement)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Alerte simple si budget non chargé (sans incohérence) */}
          {!statsLoading && stats && !stats.isBudgetLoaded && !stats.hasInconsistency && (
            <Alert variant="default" className="border-warning/50 bg-warning/10">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="flex items-center justify-between">
                <span>
                  Budget non chargé pour l'exercice {exercice}. Les indicateurs financiers affichent 0.
                </span>
                <Link to="/planification/budget">
                  <Button variant="outline" size="sm" className="ml-4">
                    Importer le budget
                  </Button>
                </Link>
              </AlertDescription>
            </Alert>
          )}

          {/* Raccourcis rapides */}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Link key={action.title} to={action.url}>
                <Card className="hover:shadow-md transition-all hover:border-primary/30 cursor-pointer h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${action.color}`}>
                        <action.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm">{action.title}</h3>
                        <p className="text-xs text-muted-foreground truncate">{action.description}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {statsLoading ? (
              Array(5).fill(0).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-20 mt-2" />
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                <Card className="relative overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Notes
                    </CardTitle>
                    <div className="p-2 rounded-lg bg-secondary/10">
                      <FileText className="h-4 w-4 text-secondary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">{stats?.notesEnAttente || 0}</span>
                      <span className="text-sm text-muted-foreground">en attente</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats?.notesTotal || 0} notes au total
                    </p>
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Marchés
                    </CardTitle>
                    <div className="p-2 rounded-lg bg-primary/10">
                      <ShoppingCart className="h-4 w-4 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">{stats?.marchesEnCours || 0}</span>
                      <span className="text-sm text-muted-foreground">en cours</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats?.marchesTotal || 0} marchés au total
                    </p>
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Engagements
                    </CardTitle>
                    <div className="p-2 rounded-lg bg-primary/10">
                      <CreditCard className="h-4 w-4 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">{stats?.engagementsEnCours || 0}</span>
                      <span className="text-sm text-muted-foreground">en cours</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats?.engagementsTotal || 0} engagements au total
                    </p>
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Liquidations
                    </CardTitle>
                    <div className="p-2 rounded-lg bg-warning/10">
                      <Receipt className="h-4 w-4 text-warning" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">{stats?.liquidationsATraiter || 0}</span>
                      <span className="text-sm text-muted-foreground">à traiter</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats?.liquidationsTotal || 0} liquidations au total
                    </p>
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Ordonnancements
                    </CardTitle>
                    <div className="p-2 rounded-lg bg-success/10">
                      <FileCheck className="h-4 w-4 text-success" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">{stats?.ordonnancementsEnSignature || 0}</span>
                      <span className="text-sm text-muted-foreground">en signature</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats?.ordonnancements || 0} ordonnancements au total
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Budget Execution */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-secondary" />
                  Exécution budgétaire {exercice}
                </CardTitle>
                <CardDescription>
                  Taux d'exécution global du budget
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {statsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <div className="grid gap-4 md:grid-cols-4">
                      {Array(4).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-20" />
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Barre des taux */}
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Taux d'engagement</span>
                          <span className="text-sm font-bold text-primary">{stats?.tauxEngagement || 0}%</span>
                        </div>
                        <Progress value={stats?.tauxEngagement || 0} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Taux de liquidation</span>
                          <span className="text-sm font-bold text-secondary">{stats?.tauxLiquidation || 0}%</span>
                        </div>
                        <Progress value={stats?.tauxLiquidation || 0} className="h-2 [&>div]:bg-secondary" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Taux de paiement</span>
                          <span className="text-sm font-bold text-success">{stats?.tauxPaiement || 0}%</span>
                        </div>
                        <Progress value={stats?.tauxPaiement || 0} className="h-2 [&>div]:bg-success" />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-5">
                      <div className="space-y-1 p-4 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Budget alloué</p>
                        <p className="text-xl font-bold">{formatMontant(stats?.budgetTotal || 0)}</p>
                        <p className="text-xs text-muted-foreground">FCFA</p>
                      </div>
                      <div className="space-y-1 p-4 rounded-lg bg-primary/10">
                        <p className="text-xs text-muted-foreground">Engagé (validé)</p>
                        <p className="text-xl font-bold text-primary">{formatMontant(stats?.budgetEngage || 0)}</p>
                        <p className="text-xs text-primary/60">{stats?.tauxEngagement || 0}%</p>
                      </div>
                      <div className="space-y-1 p-4 rounded-lg bg-secondary/10">
                        <p className="text-xs text-muted-foreground">Liquidé</p>
                        <p className="text-xl font-bold text-secondary">{formatMontant(stats?.budgetLiquide || 0)}</p>
                        <p className="text-xs text-secondary/60">{stats?.tauxLiquidation || 0}% de l'engagé</p>
                      </div>
                      <div className="space-y-1 p-4 rounded-lg bg-success/10">
                        <p className="text-xs text-muted-foreground">Payé</p>
                        <p className="text-xl font-bold text-success">{formatMontant(stats?.budgetPaye || 0)}</p>
                        <p className="text-xs text-success/60">{stats?.tauxPaiement || 0}% du liquidé</p>
                      </div>
                      <div className={`space-y-1 p-4 rounded-lg ${
                        (stats?.budgetTotal || 0) > 0 && budgetDisponible === 0 
                          ? "bg-destructive/10" 
                          : "bg-warning/10"
                      }`}>
                        <p className="text-xs text-muted-foreground">Disponible</p>
                        <p className={`text-xl font-bold ${
                          (stats?.budgetTotal || 0) > 0 && budgetDisponible === 0 
                            ? "text-destructive" 
                            : "text-warning"
                        }`}>{formatMontant(budgetDisponible)}</p>
                        <p className="text-xs text-muted-foreground">FCFA</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <RecentActivitiesPanel maxItems={8} showViewAll={true} />
          </div>

          {/* Tâches à traiter + Alertes */}
          <div className="grid gap-6 lg:grid-cols-2">
            <PendingTasksPanel maxItems={8} />
            <AlertsPanelEnhanced maxItems={5} />
          </div>

          {/* KPIs */}
          <KPICards />
        </TabsContent>

        {/* Dashboard DG */}
        <TabsContent value="dg">
          <DashboardDG />
        </TabsContent>

        {/* Dashboard DAF/SDCT */}
        <TabsContent value="daf">
          <DashboardDAF />
        </TabsContent>

        {/* Dashboard SDPM */}
        <TabsContent value="sdpm">
          <DashboardSDPM />
        </TabsContent>

        {/* Dashboard Trésorerie */}
        <TabsContent value="tresorerie">
          <DashboardTresorerie />
        </TabsContent>
      </Tabs>
    </div>
  );
}
