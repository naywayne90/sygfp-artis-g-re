import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useExercice } from '@/contexts/ExerciceContext';
import { useContrats } from '@/hooks/useContrats';
import { formatCurrency } from '@/lib/utils';
import { FileSignature, Clock, CheckCircle2, AlertTriangle, Banknote } from 'lucide-react';
import { ContratList } from '@/components/contrats/ContratList';

export default function Contrats() {
  const { exercice } = useExercice();
  const { contrats } = useContrats();
  const isLoading = contrats.isLoading;

  const data = contrats.data || [];
  const actifs = data.filter((c) => c.statut === 'en_cours' || c.statut === 'signe').length;
  const enNegociation = data.filter((c) => c.statut === 'en_negociation').length;
  const montantTotal = data
    .filter((c) => c.statut === 'en_cours' || c.statut === 'signe')
    .reduce((sum, c) => sum + (c.montant_actuel || c.montant_initial), 0);
  const expirentBientot = data.filter((c) => {
    if (!c.date_fin) return false;
    const dateFin = new Date(c.date_fin);
    const dans30j = new Date();
    dans30j.setDate(dans30j.getDate() + 30);
    return dateFin <= dans30j && dateFin >= new Date();
  }).length;
  const expires = data.filter((c) => {
    if (!c.date_fin) return false;
    if (c.statut === 'termine' || c.statut === 'resilie') return false;
    return new Date(c.date_fin) < new Date();
  }).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Gestion des Contrats</h1>
        <p className="page-description">Suivi des contrats et avenants - Exercice {exercice}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contrats actifs
            </CardTitle>
            <FileSignature className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{actifs}</div>
            )}
            <p className="text-xs text-muted-foreground">En vigueur</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Montant total
            </CardTitle>
            <Banknote className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-36" />
            ) : (
              <div className="text-xl font-bold">{formatCurrency(montantTotal)}</div>
            )}
            <p className="text-xs text-muted-foreground">Contrats actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En négociation
            </CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{enNegociation}</div>
            )}
            <p className="text-xs text-muted-foreground">En cours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expirent bientôt
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{expirentBientot}</div>
            )}
            <p className="text-xs text-muted-foreground">Dans 30 jours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expirés</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-destructive">{expires}</div>
            )}
            <p className="text-xs text-muted-foreground">Date fin dépassée</p>
          </CardContent>
        </Card>
      </div>

      <ContratList />
    </div>
  );
}
