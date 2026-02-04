import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  RefreshCw,
  AlertTriangle,
  BarChart3,
  Building2,
  FileText,
  Settings,
  Clock,
} from 'lucide-react';
import { useDMGDashboard, type DMGAlerte } from '@/hooks/useDMGDashboard';
import { DMGKPICards } from '@/components/dmg/DMGKPICards';
import { DMGAlertList } from '@/components/dmg/DMGAlertCard';
import { useToast } from '@/hooks/use-toast';

export default function DashboardDMG() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data, isLoading, isError, refetch, isFetching } = useDMGDashboard();
  const [activeTab, setActiveTab] = useState('overview');

  const handleRefresh = () => {
    refetch();
    toast({
      title: 'Actualisation',
      description: 'Les données du dashboard sont en cours de mise à jour.',
    });
  };

  const handleAlertAction = (alerteId: string, action: 'view' | 'resolve' | 'dismiss') => {
    if (action === 'view') {
      // Naviguer vers la liquidation ou l'engagement
      navigate(`/execution/liquidations/${alerteId}`);
    } else if (action === 'resolve') {
      toast({
        title: 'Action en cours',
        description: 'Ouverture du formulaire de traitement...',
      });
      navigate(`/execution/liquidations/${alerteId}/traiter`);
    }
  };

  const lastUpdated = data?.generated_at
    ? new Date(data.generated_at).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '--:--';

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard DMG</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble des liquidations et alertes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Mis à jour à {lastUpdated}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Paramètres
          </Button>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-medium text-red-800">Erreur de chargement</p>
              <p className="text-sm text-red-600">
                Impossible de charger les données du dashboard. Veuillez réessayer.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-auto">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <DMGKPICards kpis={data?.kpis} isLoading={isLoading} />

      {/* Main content tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Vue d'ensemble</span>
          </TabsTrigger>
          <TabsTrigger value="alertes" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Alertes</span>
            {data?.alertes_critical_count ? (
              <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {data.alertes_critical_count}
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="fournisseurs" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Fournisseurs</span>
          </TabsTrigger>
          <TabsTrigger value="liquidations" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Liquidations</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Alertes résumé */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Alertes actives
                </CardTitle>
                <CardDescription>
                  {data?.alertes_count ?? 0} alerte(s) nécessitant une attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : (
                  <DMGAlertList
                    alertes={data?.alertes ?? []}
                    onAction={handleAlertAction}
                    maxItems={3}
                  />
                )}
              </CardContent>
            </Card>

            {/* Top Fournisseurs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-500" />
                  Top Fournisseurs
                </CardTitle>
                <CardDescription>
                  Par montant d'engagements en cours
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data?.top_fournisseurs?.map((fournisseur, index) => (
                      <div
                        key={fournisseur.fournisseur}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium text-sm truncate max-w-[180px]">
                              {fournisseur.fournisseur}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {fournisseur.nb_engagements} engagement(s)
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">
                            {fournisseur.montant_formate}
                          </p>
                          <p className="text-xs text-muted-foreground">FCFA</p>
                        </div>
                      </div>
                    ))}
                    {(!data?.top_fournisseurs || data.top_fournisseurs.length === 0) && (
                      <p className="text-center text-muted-foreground py-4">
                        Aucun fournisseur avec des engagements en cours
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Évolution 30 jours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-500" />
                Évolution sur 30 jours
              </CardTitle>
              <CardDescription>
                Liquidations traitées par jour
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : data?.evolution_30j && data.evolution_30j.length > 0 ? (
                <div className="h-48 flex items-end gap-1">
                  {data.evolution_30j.map((jour, index) => {
                    const maxCount = Math.max(...data.evolution_30j.map(j => j.count));
                    const height = maxCount > 0 ? (jour.count / maxCount) * 100 : 0;
                    return (
                      <div
                        key={jour.date}
                        className="flex-1 bg-primary/20 hover:bg-primary/40 transition-colors rounded-t cursor-pointer group relative"
                        style={{ height: `${Math.max(height, 5)}%` }}
                        title={`${jour.date}: ${jour.count} liquidation(s)`}
                      >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                          {new Date(jour.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                          <br />
                          {jour.count} liquidation(s)
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground">
                  Aucune donnée disponible pour les 30 derniers jours
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alertes Tab */}
        <TabsContent value="alertes">
          <Card>
            <CardHeader>
              <CardTitle>Toutes les alertes</CardTitle>
              <CardDescription>
                Liste complète des alertes actives triées par sévérité
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : (
                <DMGAlertList
                  alertes={data?.alertes ?? []}
                  onAction={handleAlertAction}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fournisseurs Tab */}
        <TabsContent value="fournisseurs">
          <Card>
            <CardHeader>
              <CardTitle>Fournisseurs en attente</CardTitle>
              <CardDescription>
                Fournisseurs avec des engagements non liquidés
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {data?.top_fournisseurs?.map((fournisseur, index) => (
                    <div
                      key={fournisseur.fournisseur}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-semibold">{fournisseur.fournisseur}</p>
                          <p className="text-sm text-muted-foreground">
                            {fournisseur.nb_engagements} engagement(s) en cours
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">
                          {fournisseur.montant_formate}
                        </p>
                        <p className="text-xs text-muted-foreground">FCFA</p>
                      </div>
                    </div>
                  ))}
                  {(!data?.top_fournisseurs || data.top_fournisseurs.length === 0) && (
                    <p className="text-center text-muted-foreground py-8">
                      Aucun fournisseur avec des engagements en attente
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Liquidations Tab */}
        <TabsContent value="liquidations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Liquidations urgentes</CardTitle>
                <CardDescription>
                  Liquidations marquées comme nécessitant un traitement prioritaire
                </CardDescription>
              </div>
              <Button onClick={() => navigate('/execution/liquidations')}>
                Voir toutes les liquidations
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                {data?.kpis?.liquidations_urgentes?.count ?? 0} liquidation(s) urgente(s)
                <br />
                <Button variant="link" onClick={() => navigate('/execution/liquidations?urgent=true')}>
                  Afficher la liste complète
                </Button>
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
