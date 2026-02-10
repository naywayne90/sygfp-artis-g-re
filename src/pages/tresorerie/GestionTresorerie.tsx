import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useExercice } from '@/contexts/ExerciceContext';
import { useTresorerie } from '@/hooks/useTresorerie';
import { usePaymentKPIs } from '@/hooks/usePaymentKPIs';
import { Landmark, ArrowUpRight, ArrowDownRight, Wallet, Clock, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { CompteBancaireList } from '@/components/tresorerie/CompteBancaireList';
import { OperationTresorerieList } from '@/components/tresorerie/OperationTresorerieList';
import { PlanTresorerie } from '@/components/tresorerie/PlanTresorerie';
import { PaiementsAVenir } from '@/components/tresorerie/PaiementsAVenir';

export default function GestionTresorerie() {
  const { exercice: _exercice } = useExercice();
  const { stats } = useTresorerie();
  const { positionTresorerie, kpis } = usePaymentKPIs();

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Trésorerie"
        description="Tableau de bord de la trésorerie"
        icon={Landmark}
        backUrl="/"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Solde disponible
            </CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMontant(stats.data?.soldeTotal || 0)}</div>
            <p className="text-xs text-muted-foreground">Trésorerie</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Entrées du mois
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              +{formatMontant(stats.data?.entreeMois || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sorties du mois
            </CardTitle>
            <ArrowDownRight className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              -{formatMontant(stats.data?.sortieMois || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Comptes actifs
            </CardTitle>
            <Landmark className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.data?.comptesActifs || 0}</div>
            <p className="text-xs text-muted-foreground">Comptes</p>
          </CardContent>
        </Card>
      </div>

      {/* KPI Taux de paiement */}
      {kpis.data && (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Taux de paiement (Payé / Ordonnancé)
                </p>
                <p className="text-3xl font-bold">{kpis.data.taux_paiement?.toFixed(1) || 0}%</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Taux d'exécution global</p>
                <p className="text-xl font-medium text-primary">
                  {kpis.data.taux_execution_global?.toFixed(1) || 0}%
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-primary/50" />
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="paiements" className="space-y-4">
        <TabsList>
          <TabsTrigger value="paiements" className="gap-2">
            <Clock className="h-4 w-4" />
            Paiements à venir ({positionTresorerie.data?.nb_ordres_a_payer || 0})
          </TabsTrigger>
          <TabsTrigger value="comptes">Comptes bancaires</TabsTrigger>
          <TabsTrigger value="operations">Opérations</TabsTrigger>
          <TabsTrigger value="plan">Plan de trésorerie</TabsTrigger>
        </TabsList>

        <TabsContent value="paiements">
          <PaiementsAVenir />
        </TabsContent>

        <TabsContent value="comptes">
          <CompteBancaireList />
        </TabsContent>

        <TabsContent value="operations">
          <OperationTresorerieList />
        </TabsContent>

        <TabsContent value="plan">
          <PlanTresorerie />
        </TabsContent>
      </Tabs>
    </div>
  );
}
