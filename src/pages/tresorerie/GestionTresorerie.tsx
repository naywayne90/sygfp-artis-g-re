import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useExercice } from "@/contexts/ExerciceContext";
import { useTresorerie } from "@/hooks/useTresorerie";
import { Landmark, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";
import { CompteBancaireList } from "@/components/tresorerie/CompteBancaireList";
import { OperationTresorerieList } from "@/components/tresorerie/OperationTresorerieList";
import { PlanTresorerie } from "@/components/tresorerie/PlanTresorerie";

export default function GestionTresorerie() {
  const { exercice } = useExercice();
  const { stats } = useTresorerie();

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Gestion de la Trésorerie</h1>
        <p className="page-description">
          Suivi des flux financiers - Exercice {exercice}
        </p>
      </div>

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
            <div className="text-2xl font-bold text-success">+{formatMontant(stats.data?.entreeMois || 0)}</div>
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
            <div className="text-2xl font-bold text-destructive">-{formatMontant(stats.data?.sortieMois || 0)}</div>
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

      <Tabs defaultValue="comptes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="comptes">Comptes bancaires</TabsTrigger>
          <TabsTrigger value="operations">Opérations</TabsTrigger>
          <TabsTrigger value="plan">Plan de trésorerie</TabsTrigger>
        </TabsList>

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
