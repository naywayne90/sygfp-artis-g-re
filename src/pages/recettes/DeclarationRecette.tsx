import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useExercice } from "@/contexts/ExerciceContext";
import { useRecettes } from "@/hooks/useRecettes";
import { Receipt, TrendingUp, FileText, CheckCircle2 } from "lucide-react";
import { RecetteList } from "@/components/recettes/RecetteList";
import { EtatRecettes } from "@/components/recettes/EtatRecettes";

export default function DeclarationRecette() {
  const { exercice } = useExercice();
  const { stats } = useRecettes();

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Déclaration de Recettes</h1>
        <p className="page-description">
          Gestion des recettes budgétaires - Exercice {exercice}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recettes déclarées
            </CardTitle>
            <Receipt className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMontant(stats.data?.totalRecettes || 0)}</div>
            <p className="text-xs text-muted-foreground">{stats.data?.nbRecettes || 0} déclarations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recettes encaissées
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatMontant(stats.data?.totalEncaisse || 0)}</div>
            <p className="text-xs text-muted-foreground">{stats.data?.nbEncaissees || 0} encaissées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taux de recouvrement
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.data?.tauxRecouvrement || 0).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Réalisé</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En attente
            </CardTitle>
            <FileText className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMontant((stats.data?.totalRecettes || 0) - (stats.data?.totalEncaisse || 0))}
            </div>
            <p className="text-xs text-muted-foreground">À encaisser</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="liste" className="space-y-4">
        <TabsList>
          <TabsTrigger value="liste">Déclarations</TabsTrigger>
          <TabsTrigger value="etats">États par période</TabsTrigger>
        </TabsList>

        <TabsContent value="liste">
          <RecetteList />
        </TabsContent>

        <TabsContent value="etats">
          <EtatRecettes />
        </TabsContent>
      </Tabs>
    </div>
  );
}
