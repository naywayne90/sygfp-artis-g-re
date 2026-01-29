import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDSIDashboardStats, DSIEngagement } from '@/hooks/useDSIDashboardStats';
import {
  Monitor,
  Server,
  ArrowRight,
  TrendingUp,
  FileText,
  Package,
  Wrench,
  Wallet,
  PiggyBank,
  Receipt,
  FolderOpen,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const formatMontant = (montant: number): string => {
  if (montant >= 1_000_000_000) return `${(montant / 1_000_000_000).toFixed(1)} Mds`;
  if (montant >= 1_000_000) return `${(montant / 1_000_000).toFixed(1)} M`;
  if (montant >= 1_000) return `${(montant / 1_000).toFixed(0)} K`;
  return montant.toFixed(0);
};

const formatDate = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
};

const getStatutBadge = (statut: string | null) => {
  switch (statut) {
    case 'valide':
      return <Badge className="bg-success/10 text-success border-success/20">Valide</Badge>;
    case 'soumis':
      return <Badge variant="outline">Soumis</Badge>;
    case 'en_attente':
    case 'brouillon':
      return <Badge variant="secondary">En attente</Badge>;
    case 'rejete':
      return <Badge variant="destructive">Rejete</Badge>;
    case 'differe':
      return <Badge className="bg-warning/10 text-warning border-warning/20">Differe</Badge>;
    default:
      return <Badge variant="outline">{statut || 'N/A'}</Badge>;
  }
};

interface TableauDossiersEnCoursProps {
  engagements: DSIEngagement[];
  isLoading: boolean;
}

function TableauDossiersEnCours({ engagements, isLoading }: TableauDossiersEnCoursProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            Dossiers Techniques en Cours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-primary" />
          Dossiers Techniques en Cours
        </CardTitle>
        <CardDescription>Engagements recents de la DSI</CardDescription>
      </CardHeader>
      <CardContent>
        {engagements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Aucun engagement en cours pour la DSI</p>
            <Link to="/engagements" className="text-primary hover:underline text-sm mt-2 block">
              Voir tous les engagements
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numero</TableHead>
                  <TableHead>Objet</TableHead>
                  <TableHead>Ligne budgetaire</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {engagements.map((eng) => (
                  <TableRow key={eng.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">{eng.numero}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={eng.objet}>
                      {eng.objet}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {eng.budget_line?.code || '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMontant(eng.montant)} FCFA
                    </TableCell>
                    <TableCell>{getStatutBadge(eng.statut)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(eng.date_engagement)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {engagements.length >= 10 && (
              <div className="mt-4 text-center">
                <Link to="/engagements" className="text-primary hover:underline text-sm">
                  Voir tous les engagements DSI
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardDSI() {
  const {
    direction,
    budgetTotal,
    montantEngage,
    resteAFaire,
    tauxEngagement,
    engagements,
    engagementsEnCours,
    isLoading,
  } = useDSIDashboardStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-28" />
                </CardContent>
              </Card>
            ))}
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-16" />
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    );
  }

  const directionLabel = direction?.label || "Direction des Systemes d'Information";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg bg-primary/10">
          <Monitor className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Pilotage des Systemes d'Information</h1>
          <p className="text-muted-foreground">{directionLabel}</p>
        </div>
      </div>

      {/* Chiffres Cles DSI - 3 grandes cartes */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Budget Total */}
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              Budget Total DSI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-3xl font-bold">
                {formatMontant(budgetTotal)}{' '}
                <span className="text-sm font-normal text-muted-foreground">FCFA</span>
              </p>
              <Progress value={100} className="h-2" />
              <p className="text-xs text-muted-foreground">Dotation initiale exercice en cours</p>
            </div>
          </CardContent>
        </Card>

        {/* Montant Engage */}
        <Card className="border-l-4 border-l-warning">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Receipt className="h-4 w-4 text-warning" />
              Montant Engage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-3xl font-bold">
                {formatMontant(montantEngage)}{' '}
                <span className="text-sm font-normal text-muted-foreground">FCFA</span>
              </p>
              <Progress value={tauxEngagement} className="h-2" />
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-warning">{tauxEngagement}%</span> du budget engage
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Reste a Faire */}
        <Card className="border-l-4 border-l-success">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PiggyBank className="h-4 w-4 text-success" />
              Reste a Engager
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-3xl font-bold text-success">
                {formatMontant(resteAFaire)}{' '}
                <span className="text-sm font-normal text-muted-foreground">FCFA</span>
              </p>
              <Progress value={100 - tauxEngagement} className="h-2 [&>div]:bg-success" />
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-success">{100 - tauxEngagement}%</span> disponible
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <div className="grid gap-3 md:grid-cols-4">
        <Link to="/planification/structure">
          <Card className="hover:border-primary/30 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Server className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Structure budgetaire</p>
                <p className="text-xs text-muted-foreground">Voir le budget DSI</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/notes-sef?action=create">
          <Card className="hover:border-primary/30 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <FileText className="h-5 w-5 text-success" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Creer Note SEF</p>
                <p className="text-xs text-muted-foreground">Nouvelle demande</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/approvisionnement">
          <Card className="hover:border-primary/30 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Package className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Approvisionnement</p>
                <p className="text-xs text-muted-foreground">Materiel IT</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/contractualisation/contrats">
          <Card className="hover:border-primary/30 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <Wrench className="h-5 w-5 text-secondary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Contrats</p>
                <p className="text-xs text-muted-foreground">Maintenance & Services</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Tableau Dossiers Techniques en Cours */}
      <TableauDossiersEnCours engagements={engagements} isLoading={isLoading} />

      {/* Stats rapides */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Execution budgetaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Taux d'engagement</span>
                <Badge variant="outline">{tauxEngagement}%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Engagements en cours</span>
                <Badge variant="secondary">{engagementsEnCours.length}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total engagements</span>
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  {engagements.length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acces rapides DSI */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-primary" />
              Acces rapides DSI
            </CardTitle>
            <CardDescription>Modules frequemment utilises</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 grid-cols-2">
              <Link to="/notes-sef" className="block">
                <div className="p-3 rounded-lg border hover:bg-muted/50 transition-colors text-center">
                  <FileText className="h-6 w-6 mx-auto mb-1 text-primary" />
                  <p className="text-sm font-medium">Notes SEF</p>
                </div>
              </Link>
              <Link to="/engagements" className="block">
                <div className="p-3 rounded-lg border hover:bg-muted/50 transition-colors text-center">
                  <TrendingUp className="h-6 w-6 mx-auto mb-1 text-warning" />
                  <p className="text-sm font-medium">Engagements</p>
                </div>
              </Link>
              <Link to="/contractualisation/prestataires" className="block">
                <div className="p-3 rounded-lg border hover:bg-muted/50 transition-colors text-center">
                  <Wrench className="h-6 w-6 mx-auto mb-1 text-secondary" />
                  <p className="text-sm font-medium">Prestataires</p>
                </div>
              </Link>
              <Link to="/etats-execution" className="block">
                <div className="p-3 rounded-lg border hover:bg-muted/50 transition-colors text-center">
                  <Server className="h-6 w-6 mx-auto mb-1 text-success" />
                  <p className="text-sm font-medium">Etats</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
