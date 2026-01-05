import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useExercice } from "@/contexts/ExerciceContext";
import { useExpressionsBesoin } from "@/hooks/useExpressionsBesoin";
import { ExpressionBesoinForm } from "@/components/expression-besoin/ExpressionBesoinForm";
import { ExpressionBesoinList } from "@/components/expression-besoin/ExpressionBesoinList";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  PauseCircle,
  Plus,
  Search,
  Loader2,
} from "lucide-react";

export default function ExpressionBesoin() {
  const { exercice } = useExercice();
  const {
    expressions,
    expressionsAValider,
    expressionsValidees,
    expressionsRejetees,
    expressionsDifferees,
    isLoading,
  } = useExpressionsBesoin();

  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("toutes");

  const filteredExpressions = expressions.filter(
    (e) =>
      e.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.objet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.direction?.label?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFilteredByTab = () => {
    switch (activeTab) {
      case "a_valider":
        return filteredExpressions.filter((e) => e.statut === "soumis");
      case "validees":
        return filteredExpressions.filter((e) => e.statut === "validé");
      case "rejetees":
        return filteredExpressions.filter((e) => e.statut === "rejeté");
      case "differees":
        return filteredExpressions.filter((e) => e.statut === "différé");
      default:
        return filteredExpressions;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="page-title">Expressions de Besoin</h1>
          <p className="page-description">
            Gestion des demandes d'acquisition - Exercice {exercice}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle expression
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expressions.length}</div>
            <p className="text-xs text-muted-foreground">Expressions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              À valider
            </CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expressionsAValider.length}</div>
            <p className="text-xs text-muted-foreground">En attente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Validées
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expressionsValidees.length}</div>
            <p className="text-xs text-muted-foreground">Prêtes pour engagement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rejetées
            </CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expressionsRejetees.length}</div>
            <p className="text-xs text-muted-foreground">Refusées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Différées
            </CardTitle>
            <PauseCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expressionsDifferees.length}</div>
            <p className="text-xs text-muted-foreground">Reportées</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des expressions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Liste des expressions de besoin</CardTitle>
              <CardDescription>
                Créer et suivre les demandes d'acquisition à partir des marchés validés
              </CardDescription>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="toutes">
                Toutes ({filteredExpressions.length})
              </TabsTrigger>
              <TabsTrigger value="a_valider">
                À valider ({expressionsAValider.length})
              </TabsTrigger>
              <TabsTrigger value="validees">
                Validées ({expressionsValidees.length})
              </TabsTrigger>
              <TabsTrigger value="rejetees">
                Rejetées ({expressionsRejetees.length})
              </TabsTrigger>
              <TabsTrigger value="differees">
                Différées ({expressionsDifferees.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              <ExpressionBesoinList expressions={getFilteredByTab()} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Form dialog */}
      <ExpressionBesoinForm open={showForm} onOpenChange={setShowForm} />
    </div>
  );
}
