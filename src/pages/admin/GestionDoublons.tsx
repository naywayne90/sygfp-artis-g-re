import { useState, useMemo } from 'react';

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Shield,
  Hash,
  FileText,
  DollarSign,
  Building2,
  CheckCircle,
  XCircle,
  Search,
  AlertTriangle,
  Filter,
  RefreshCw,
} from 'lucide-react';

import { useDoublonsDetection, DoublonGroup } from '@/hooks/useDoublonsDetection';
import { useExercice } from '@/contexts/ExerciceContext';
import { formatCurrency } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

type DoublonType = DoublonGroup['type'];

interface TypeConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  bgClass: string;
}

const TYPE_CONFIG: Record<DoublonType, TypeConfig> = {
  reference: {
    label: 'Références identiques',
    icon: Hash,
    colorClass: 'text-blue-600',
    bgClass: 'bg-blue-50',
  },
  objet: {
    label: 'Objets similaires',
    icon: FileText,
    colorClass: 'text-amber-600',
    bgClass: 'bg-amber-50',
  },
  montant_date: {
    label: 'Montant + Date',
    icon: DollarSign,
    colorClass: 'text-emerald-600',
    bgClass: 'bg-emerald-50',
  },
  prestataire: {
    label: 'Prestataire + Montant',
    icon: Building2,
    colorClass: 'text-purple-600',
    bgClass: 'bg-purple-50',
  },
};

type StatusFilter = 'nouveaux' | 'verifies' | 'ignores' | 'tous';
type TypeFilter = 'tous' | 'reference' | 'objet' | 'montant_date' | 'prestataire';

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------

interface KpiCardProps {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  value: number;
  label: string;
}

function KpiCard({ icon: Icon, iconColor, value, label }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-5 pb-4">
        <div className="rounded-lg bg-muted p-2.5">
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground truncate">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// DoublonGroupCard
// ---------------------------------------------------------------------------

interface DoublonGroupCardProps {
  group: DoublonGroup;
  onVerify: (groupId: string) => void;
  onIgnore: (groupId: string) => void;
  isVerifyPending: boolean;
  isIgnorePending: boolean;
  reviewInfo?: { action: string; reviewed_at: string } | null;
}

function DoublonGroupCard({
  group,
  onVerify,
  onIgnore,
  isVerifyPending,
  isIgnorePending,
  reviewInfo,
}: DoublonGroupCardProps) {
  const config = TYPE_CONFIG[group.type];
  const Icon = config.icon;
  const isReviewed = !!reviewInfo;

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${config.bgClass}`}>
              <Icon className={`h-4 w-4 ${config.colorClass}`} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight">{config.label}</p>
              <p className="text-xs text-muted-foreground">
                {group.items.length} {group.items.length > 1 ? 'elements' : 'element'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isReviewed && (
              <Badge
                variant={reviewInfo.action === 'verified' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {reviewInfo.action === 'verified' ? 'Verifie' : 'Ignore'}
              </Badge>
            )}
            <Badge
              variant={group.similarityScore >= 95 ? 'destructive' : 'outline'}
              className="text-xs tabular-nums"
            >
              {group.similarityScore}%
            </Badge>
          </div>
        </div>
      </CardHeader>

      {/* Body — item list */}
      <CardContent className="pt-0">
        <div className="divide-y rounded-md border">
          {group.items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-1 gap-x-4 gap-y-1 px-3 py-2.5 text-sm sm:grid-cols-[auto_1fr_auto] sm:items-center md:grid-cols-[80px_120px_1fr_auto_100px_auto]"
            >
              {/* Entity badge */}
              <Badge variant="outline" className="w-fit text-[11px] shrink-0">
                {item.entite}
              </Badge>

              {/* Reference */}
              <span className="font-mono text-xs text-muted-foreground truncate">
                {item.reference || '-'}
              </span>

              {/* Objet */}
              <span className="truncate" title={item.objet}>
                {item.objet || '-'}
              </span>

              {/* Montant */}
              <span className="font-medium tabular-nums whitespace-nowrap">
                {formatCurrency(item.montant)}
              </span>

              {/* Date */}
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {item.date
                  ? new Date(item.date).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })
                  : '-'}
              </span>

              {/* Prestataire — always rendered for layout consistency */}
              <span className="text-xs truncate">{item.prestataire || ''}</span>
            </div>
          ))}
        </div>
      </CardContent>

      {/* Footer — actions */}
      <CardFooter className="justify-end gap-2 border-t bg-muted/30 px-4 py-3">
        {isReviewed ? (
          <p className="text-xs text-muted-foreground">
            {reviewInfo.action === 'verified' ? 'Marque verifie' : 'Ignore'} le{' '}
            {new Date(reviewInfo.reviewed_at).toLocaleDateString('fr-FR')}
          </p>
        ) : (
          <>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={isIgnorePending}>
                  <XCircle className="mr-1.5 h-4 w-4" />
                  Ignorer
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Ignorer ce groupe de doublons ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ce groupe sera marque comme ignore et ne s'affichera plus dans les resultats par
                    defaut. Vous pourrez toujours le retrouver via le filtre &laquo; Ignores
                    &raquo;.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onIgnore(group.groupId)}>
                    Confirmer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              size="sm"
              variant="default"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={isVerifyPending}
              onClick={() => onVerify(group.groupId)}
            >
              <CheckCircle className="mr-1.5 h-4 w-4" />
              Marquer verifie
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* KPI skeletons */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[76px] rounded-lg" />
        ))}
      </div>

      {/* Filter bar skeleton */}
      <div className="flex gap-3">
        <Skeleton className="h-9 flex-1 max-w-sm" />
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-9 w-36" />
      </div>

      {/* Card skeletons */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-52 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-20">
        <div className="rounded-full bg-emerald-50 p-4 mb-4">
          <Shield className="h-12 w-12 text-emerald-500" />
        </div>
        <h3 className="text-lg font-semibold mb-1">Aucun doublon detecte</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          {hasSearch
            ? "Aucun resultat ne correspond a vos criteres de recherche. Essayez d'elargir vos filtres."
            : "Felicitations ! Aucun doublon potentiel n'a ete detecte pour l'exercice en cours."}
        </p>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function GestionDoublons() {
  const { exercice } = useExercice();
  const { doublons, isLoading, stats, markAsVerified, ignoreGroup, reviewedGroups } =
    useDoublonsDetection();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('tous');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('nouveaux');

  // Use reviewedGroups from hook (persisted in doublon_reviews table)
  const reviewedMap = reviewedGroups;

  // Filtering
  const filteredDoublons = useMemo(() => {
    return doublons.filter((group) => {
      // Type filter
      if (typeFilter !== 'tous' && group.type !== typeFilter) return false;

      // Status filter
      const review = reviewedMap.get(group.groupId);
      if (statusFilter === 'nouveaux' && review) return false;
      if (statusFilter === 'verifies' && review?.action !== 'verified') return false;
      if (statusFilter === 'ignores' && review?.action !== 'ignored') return false;

      // Search
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return group.items.some(
          (item) =>
            item.reference.toLowerCase().includes(q) ||
            item.objet.toLowerCase().includes(q) ||
            (item.prestataire && item.prestataire.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [doublons, typeFilter, statusFilter, searchTerm, reviewedMap]);

  // ---------- Loading state ----------
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // ---------- Render ----------
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* ---- Page Header ---- */}
      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-destructive/10 p-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Controle des Doublons</h1>
            <p className="text-sm text-muted-foreground">
              Exercice {exercice} — Detection automatique sur les engagements et notes
            </p>
          </div>
        </div>
      </div>

      {/* ---- KPI Grid ---- */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          icon={AlertTriangle}
          iconColor="text-amber-500"
          value={stats.total}
          label="Total groupes"
        />
        <KpiCard
          icon={Hash}
          iconColor="text-blue-500"
          value={stats.byReference}
          label="Par reference"
        />
        <KpiCard
          icon={FileText}
          iconColor="text-amber-500"
          value={stats.byObjet}
          label="Par objet"
        />
        <KpiCard
          icon={DollarSign}
          iconColor="text-emerald-500"
          value={stats.byMontantDate}
          label="Montant + Date"
        />
        <KpiCard
          icon={Building2}
          iconColor="text-purple-500"
          value={stats.byPrestataire}
          label="Par prestataire"
        />
      </div>

      {/* ---- Filter bar ---- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher reference, objet, prestataire..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Type de doublon" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les types</SelectItem>
              <SelectItem value="reference">References</SelectItem>
              <SelectItem value="objet">Objets similaires</SelectItem>
              <SelectItem value="montant_date">Montant + Date</SelectItem>
              <SelectItem value="prestataire">Prestataire</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status filter */}
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nouveaux">Nouveaux</SelectItem>
            <SelectItem value="verifies">Verifies</SelectItem>
            <SelectItem value="ignores">Ignores</SelectItem>
            <SelectItem value="tous">Tous</SelectItem>
          </SelectContent>
        </Select>

        {/* Refresh */}
        <Button
          variant="outline"
          size="icon"
          className="shrink-0"
          onClick={() => window.location.reload()}
          title="Rafraichir la detection"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* ---- Results ---- */}
      {filteredDoublons.length === 0 ? (
        <EmptyState
          hasSearch={!!searchTerm || typeFilter !== 'tous' || statusFilter !== 'nouveaux'}
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {filteredDoublons.length}{' '}
            {filteredDoublons.length > 1 ? 'groupes trouves' : 'groupe trouve'}
          </p>

          <div className="space-y-4">
            {filteredDoublons.map((group) => (
              <DoublonGroupCard
                key={group.groupId}
                group={group}
                onVerify={(id) => markAsVerified.mutate({ groupId: id, type: group.type })}
                onIgnore={(id) => ignoreGroup.mutate({ groupId: id, type: group.type })}
                isVerifyPending={markAsVerified.isPending}
                isIgnorePending={ignoreGroup.isPending}
                reviewInfo={reviewedMap.get(group.groupId) ?? null}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
