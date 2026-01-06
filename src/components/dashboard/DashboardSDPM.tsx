import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSDPMDashboard } from "@/hooks/useDashboardByRole";
import { 
  ShoppingCart, 
  FileText, 
  Clock, 
  Users, 
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";

const formatMontant = (montant: number): string => {
  if (montant >= 1_000_000_000) return `${(montant / 1_000_000_000).toFixed(1)} Mds`;
  if (montant >= 1_000_000) return `${(montant / 1_000_000).toFixed(1)} M`;
  if (montant >= 1_000) return `${(montant / 1_000).toFixed(0)} K`;
  return montant.toFixed(0);
};

export function DashboardSDPM() {
  const { data: stats, isLoading } = useSDPMDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-20" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions rapides */}
      <div className="grid gap-3 md:grid-cols-4">
        <Link to="/marches?filter=en_cours">
          <Card className="hover:border-primary/30 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{stats?.marchesEnCours || 0} marchés</p>
                <p className="text-xs text-muted-foreground">En cours d'exécution</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/marches?filter=a_valider">
          <Card className="hover:border-primary/30 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <ShoppingCart className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{stats?.marchesEnValidation || 0} marchés</p>
                <p className="text-xs text-muted-foreground">À valider</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/expression-besoin?filter=a_valider">
          <Card className="hover:border-primary/30 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <FileText className="h-5 w-5 text-secondary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{stats?.expressionsBesoinAValider || 0} EB</p>
                <p className="text-xs text-muted-foreground">À valider</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{stats?.delaiMoyenMarche || 0} jours</p>
              <p className="text-xs text-muted-foreground">Délai moyen marché</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPIs Marchés */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Brouillons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.marchesBrouillon || 0}</div>
            <p className="text-xs text-muted-foreground">En préparation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En validation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats?.marchesEnValidation || 0}</div>
            <p className="text-xs text-muted-foreground">Circuit de validation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Validés/Signés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats?.marchesValides || 0}</div>
            <p className="text-xs text-muted-foreground">Prêts à exécuter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Montant total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMontant(stats?.marchesMontantTotal || 0)}</div>
            <p className="text-xs text-muted-foreground">FCFA</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Expressions de besoin */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Expressions de besoin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-warning/10">
                <span className="text-sm font-medium">À valider</span>
                <Badge variant="outline" className="bg-warning/10 text-warning">
                  {stats?.expressionsBesoinAValider || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <span className="text-sm font-medium">En cours de traitement</span>
                <Badge variant="secondary">{stats?.expressionsBesoinEnCours || 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Fournisseurs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Top Fournisseurs
            </CardTitle>
            <CardDescription>Par montant des marchés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.topFournisseurs.map((fournisseur, index) => (
                <div key={fournisseur.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-4">{index + 1}.</span>
                    <div>
                      <p className="font-medium text-sm truncate max-w-[200px]">{fournisseur.nom}</p>
                      <p className="text-xs text-muted-foreground">{fournisseur.nombreMarches} marché(s)</p>
                    </div>
                  </div>
                  <span className="font-medium">{formatMontant(fournisseur.montantTotal)}</span>
                </div>
              ))}
              {(!stats?.topFournisseurs || stats.topFournisseurs.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun fournisseur</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
