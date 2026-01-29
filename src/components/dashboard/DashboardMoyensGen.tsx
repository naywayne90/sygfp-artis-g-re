import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useUserDirection } from '@/hooks/useDashboardStats';
import {
  Package,
  Truck,
  Warehouse,
  ArrowRight,
  TrendingUp,
  FileText,
  ClipboardList,
  ShoppingCart,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const formatMontant = (montant: number): string => {
  if (montant >= 1_000_000_000) return `${(montant / 1_000_000_000).toFixed(1)} Mds`;
  if (montant >= 1_000_000) return `${(montant / 1_000_000).toFixed(1)} M`;
  if (montant >= 1_000) return `${(montant / 1_000).toFixed(0)} K`;
  return montant.toFixed(0);
};

export function DashboardMoyensGen() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: userDir, isLoading: dirLoading } = useUserDirection();

  const isLoading = statsLoading || dirLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-20" />
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    );
  }

  const directionLabel = userDir?.directions?.label || 'Direction des Moyens Généraux';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg bg-warning/10">
          <Package className="h-6 w-6 text-warning" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Gestion Logistique & Maintenance</h1>
          <p className="text-muted-foreground">{directionLabel}</p>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="grid gap-3 md:grid-cols-4">
        <Link to="/approvisionnement">
          <Card className="hover:border-primary/30 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Approvisionnement</p>
                <p className="text-xs text-muted-foreground">Gestion des achats</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/contractualisation/comptabilite-matiere">
          <Card className="hover:border-primary/30 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Warehouse className="h-5 w-5 text-success" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Comptabilité Matière</p>
                <p className="text-xs text-muted-foreground">Gestion des stocks</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/notes-sef?action=create">
          <Card className="hover:border-primary/30 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <FileText className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Créer Note SEF</p>
                <p className="text-xs text-muted-foreground">Nouvelle demande</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/contractualisation/prestataires">
          <Card className="hover:border-primary/30 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <Truck className="h-5 w-5 text-secondary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Fournisseurs</p>
                <p className="text-xs text-muted-foreground">Liste des prestataires</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Exécution budgétaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Taux d'engagement</span>
                <Badge variant="outline">{stats?.tauxEngagement || 0}%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Taux de liquidation</span>
                <Badge variant="secondary">{stats?.tauxLiquidation || 0}%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Taux de paiement</span>
                <Badge className="bg-success/10 text-success border-success/20">
                  {stats?.tauxPaiement || 0}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Budget Direction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Budget alloué</span>
                <span className="font-medium">{formatMontant(stats?.budgetTotal || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Engagé</span>
                <span className="font-medium">{formatMontant(stats?.montantEngage || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Disponible</span>
                <span className="font-medium text-success">
                  {formatMontant(stats?.budgetDisponible || 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Dossiers en cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Engagements</span>
                <Badge variant="outline">{stats?.engagementsEnCours || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Liquidations</span>
                <Badge variant="secondary">{stats?.liquidationsATraiter || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Ordonnancements</span>
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  {stats?.ordonnancementsEnSignature || 0}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liens rapides Moyens Généraux */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-warning" />
            Accès rapides Moyens Généraux
          </CardTitle>
          <CardDescription>Modules fréquemment utilisés</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <Link to="/approvisionnement" className="block">
              <div className="p-4 rounded-lg border hover:bg-muted/50 transition-colors text-center">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="font-medium">Approvisionnement</p>
                <p className="text-xs text-muted-foreground">Demandes d'achat</p>
              </div>
            </Link>
            <Link to="/contractualisation/comptabilite-matiere" className="block">
              <div className="p-4 rounded-lg border hover:bg-muted/50 transition-colors text-center">
                <Warehouse className="h-8 w-8 mx-auto mb-2 text-success" />
                <p className="font-medium">Stocks</p>
                <p className="text-xs text-muted-foreground">Comptabilité matière</p>
              </div>
            </Link>
            <Link to="/marches" className="block">
              <div className="p-4 rounded-lg border hover:bg-muted/50 transition-colors text-center">
                <FileText className="h-8 w-8 mx-auto mb-2 text-warning" />
                <p className="font-medium">Marchés</p>
                <p className="text-xs text-muted-foreground">Passation</p>
              </div>
            </Link>
            <Link to="/etats-execution" className="block">
              <div className="p-4 rounded-lg border hover:bg-muted/50 transition-colors text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-secondary" />
                <p className="font-medium">États d'exécution</p>
                <p className="text-xs text-muted-foreground">Rapports</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
