import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useExercice } from "@/contexts/ExerciceContext";
import { Package, Truck, ClipboardCheck, ArrowRightLeft, FileText, AlertTriangle } from "lucide-react";
import { useApprovisionnement } from "@/hooks/useApprovisionnement";
import { ArticleList } from "@/components/approvisionnement/ArticleList";
import { MouvementList } from "@/components/approvisionnement/MouvementList";
import { DemandeAchatList } from "@/components/approvisionnement/DemandeAchatList";
import { ReceptionList } from "@/components/approvisionnement/ReceptionList";
import { InventaireList } from "@/components/approvisionnement/InventaireList";

export default function Approvisionnement() {
  const { exercice } = useExercice();
  const { stats, _loadingArticles } = useApprovisionnement();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Approvisionnement</h1>
        <p className="page-description">
          Gestion des stocks, demandes d'achat et réceptions - Exercice {exercice}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Articles
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalArticles}</div>
            <p className="text-xs text-muted-foreground">{stats.articlesActifs} actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sous seuil
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.articlesSousSeuil}</div>
            <p className="text-xs text-muted-foreground">Articles à réapprovisionner</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Demandes
            </CardTitle>
            <FileText className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.demandesEnCours}</div>
            <p className="text-xs text-muted-foreground">En attente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Réceptions
            </CardTitle>
            <Truck className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.receptionsEnAttente}</div>
            <p className="text-xs text-muted-foreground">À valider</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mouvements
            </CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mouvementsMois}</div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inventaires
            </CardTitle>
            <ClipboardCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Dernier: -</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="articles" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="articles" className="gap-2">
            <Package className="h-4 w-4" />
            Articles
          </TabsTrigger>
          <TabsTrigger value="demandes" className="gap-2">
            <FileText className="h-4 w-4" />
            Demandes
          </TabsTrigger>
          <TabsTrigger value="receptions" className="gap-2">
            <Truck className="h-4 w-4" />
            Réceptions
          </TabsTrigger>
          <TabsTrigger value="mouvements" className="gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            Mouvements
          </TabsTrigger>
          <TabsTrigger value="inventaires" className="gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Inventaires
          </TabsTrigger>
        </TabsList>

        <TabsContent value="articles">
          <ArticleList />
        </TabsContent>

        <TabsContent value="demandes">
          <DemandeAchatList />
        </TabsContent>

        <TabsContent value="receptions">
          <ReceptionList />
        </TabsContent>

        <TabsContent value="mouvements">
          <MouvementList />
        </TabsContent>

        <TabsContent value="inventaires">
          <InventaireList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
