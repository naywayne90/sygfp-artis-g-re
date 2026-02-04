/**
 * Page de gestion des intérims
 * Permet aux administrateurs de créer, modifier et terminer des intérims
 */

import { useState } from 'react';
import { format, isPast, isFuture, isToday, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  UserCheck,
  Plus,
  Calendar,
  StopCircle,
  History,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useInterims, type Interim } from '@/hooks/useInterim';
import { InterimForm } from '@/components/interim/InterimForm';
import { InterimBadge } from '@/components/interim/InterimBadge';

// ============================================================================
// TYPES
// ============================================================================

type InterimStatus = 'active' | 'upcoming' | 'expired' | 'terminated';

// ============================================================================
// HELPERS
// ============================================================================

function getInterimStatus(interim: Interim): InterimStatus {
  if (!interim.est_actif) return 'terminated';

  const dateDebut = new Date(interim.date_debut);
  const dateFin = new Date(interim.date_fin);

  if (isPast(dateFin) && !isToday(dateFin)) return 'expired';
  if (isFuture(dateDebut) && !isToday(dateDebut)) return 'upcoming';
  return 'active';
}

function getStatusBadge(status: InterimStatus) {
  const config = {
    active: {
      label: 'Actif',
      variant: 'default' as const,
      icon: CheckCircle,
      className: 'bg-green-500 hover:bg-green-600',
    },
    upcoming: {
      label: 'À venir',
      variant: 'secondary' as const,
      icon: Clock,
      className: 'bg-blue-500 hover:bg-blue-600 text-white',
    },
    expired: {
      label: 'Expiré',
      variant: 'outline' as const,
      icon: AlertTriangle,
      className: 'text-orange-600 border-orange-300',
    },
    terminated: {
      label: 'Terminé',
      variant: 'outline' as const,
      icon: XCircle,
      className: 'text-gray-500 border-gray-300',
    },
  };

  const { label, icon: Icon, className } = config[status];

  return (
    <Badge className={cn('gap-1', className)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function Interims() {
  const [showInactive, setShowInactive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [interimToEnd, setInterimToEnd] = useState<Interim | null>(null);

  const {
    interims,
    isLoading,
    refetch,
    createInterim,
    endInterim,
    isCreating,
    isEnding,
  } = useInterims({ includeInactive: showInactive });

  // Filtrer les intérims
  const filteredInterims = interims.filter((interim) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    const titulaireName = interim.titulaire?.full_name ||
      `${interim.titulaire?.first_name} ${interim.titulaire?.last_name}`;
    const interimaireName = interim.interimaire?.full_name ||
      `${interim.interimaire?.first_name} ${interim.interimaire?.last_name}`;

    return (
      titulaireName?.toLowerCase().includes(searchLower) ||
      interimaireName?.toLowerCase().includes(searchLower) ||
      interim.motif?.toLowerCase().includes(searchLower)
    );
  });

  // Statistiques
  const stats = {
    total: interims.length,
    actifs: interims.filter((i) => getInterimStatus(i) === 'active').length,
    aVenir: interims.filter((i) => getInterimStatus(i) === 'upcoming').length,
    expires: interims.filter((i) => getInterimStatus(i) === 'expired').length,
  };

  const handleCreateInterim = async (data: Parameters<typeof createInterim>[0]) => {
    await createInterim(data);
    setIsCreateDialogOpen(false);
  };

  const handleEndInterim = async () => {
    if (!interimToEnd) return;
    await endInterim(interimToEnd.id);
    setInterimToEnd(null);
  };

  const getUserName = (profile: Interim['titulaire']) => {
    if (!profile) return 'N/A';
    return profile.full_name || `${profile.first_name} ${profile.last_name}`;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <UserCheck className="h-8 w-8" />
            Gestion des Intérims
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez les délégations temporaires de validation
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel intérim
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                <History className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Actifs</p>
                <p className="text-2xl font-bold text-green-600">{stats.actifs}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">À venir</p>
                <p className="text-2xl font-bold text-blue-600">{stats.aVenir}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expirés</p>
                <p className="text-2xl font-bold text-orange-600">{stats.expires}</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou motif..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="show-inactive"
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              <Label htmlFor="show-inactive" className="text-sm">
                Afficher les intérims terminés
              </Label>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des intérims</CardTitle>
          <CardDescription>
            {filteredInterims.length} intérim(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredInterims.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">Aucun intérim trouvé</p>
              <p className="text-sm mt-1">
                {searchTerm
                  ? 'Essayez de modifier vos critères de recherche'
                  : 'Créez un nouvel intérim pour commencer'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Statut</TableHead>
                    <TableHead>Titulaire</TableHead>
                    <TableHead>Intérimaire</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Motif</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInterims.map((interim) => {
                    const status = getInterimStatus(interim);
                    const joursRestants = differenceInDays(
                      new Date(interim.date_fin),
                      new Date()
                    );

                    return (
                      <TableRow key={interim.id} className={cn(
                        status === 'terminated' && 'opacity-60'
                      )}>
                        <TableCell>
                          <div className="space-y-1">
                            {getStatusBadge(status)}
                            {status === 'active' && joursRestants <= 3 && joursRestants >= 0 && (
                              <div className="text-xs text-orange-600">
                                {joursRestants === 0
                                  ? 'Dernier jour'
                                  : `${joursRestants}j restant${joursRestants > 1 ? 's' : ''}`}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{getUserName(interim.titulaire)}</p>
                            <p className="text-xs text-muted-foreground">
                              {interim.titulaire?.role_hierarchique || interim.titulaire?.poste}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-medium">{getUserName(interim.interimaire)}</p>
                              <p className="text-xs text-muted-foreground">
                                {interim.interimaire?.role_hierarchique || interim.interimaire?.poste}
                              </p>
                            </div>
                            {status === 'active' && (
                              <InterimBadge
                                titulaireName={getUserName(interim.titulaire)}
                                dateFin={interim.date_fin}
                                size="sm"
                                variant="subtle"
                              />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>
                              {format(new Date(interim.date_debut), 'dd/MM/yyyy', { locale: fr })}
                            </span>
                            <span className="text-muted-foreground">→</span>
                            <span>
                              {format(new Date(interim.date_fin), 'dd/MM/yyyy', { locale: fr })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p className="max-w-[200px] truncate text-sm">
                                  {interim.motif}
                                </p>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                {interim.motif}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="text-right">
                          {status === 'active' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setInterimToEnd(interim)}
                            >
                              <StopCircle className="h-3.5 w-3.5 mr-1" />
                              Terminer
                            </Button>
                          )}
                          {status === 'upcoming' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setInterimToEnd(interim)}
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              Annuler
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog création */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Créer un intérim
            </DialogTitle>
            <DialogDescription>
              Désignez une personne pour remplacer temporairement un collaborateur.
              L'intérimaire pourra effectuer des validations au nom du titulaire.
            </DialogDescription>
          </DialogHeader>
          <InterimForm
            onSubmit={handleCreateInterim}
            onCancel={() => setIsCreateDialogOpen(false)}
            isLoading={isCreating}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog confirmation fin */}
      <AlertDialog open={!!interimToEnd} onOpenChange={() => setInterimToEnd(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminer cet intérim ?</AlertDialogTitle>
            <AlertDialogDescription>
              {interimToEnd && (
                <>
                  <strong>{getUserName(interimToEnd.interimaire)}</strong> ne pourra plus
                  effectuer de validations au nom de{' '}
                  <strong>{getUserName(interimToEnd.titulaire)}</strong>.
                  <br /><br />
                  Cette action est irréversible.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isEnding}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEndInterim}
              disabled={isEnding}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isEnding ? 'Terminaison...' : 'Terminer l\'intérim'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
