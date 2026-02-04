/**
 * DashboardKPICards - Cartes KPI pour le dashboard principal
 * Affiche les indicateurs clés avec tendances et animations
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Wallet,
  FolderOpen,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardKPIs } from '@/hooks/useDashboardData';

// ============================================================================
// TYPES
// ============================================================================

export interface DashboardKPICardsProps {
  /** Données KPI */
  data: DashboardKPIs | null;
  /** En chargement */
  isLoading?: boolean;
  /** Classe CSS */
  className?: string;
}

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  progress?: {
    value: number;
    label: string;
  };
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  isLoading?: boolean;
}

// ============================================================================
// COMPOSANT CARTE KPI
// ============================================================================

function KPICard({
  title,
  value,
  subtitle,
  icon,
  trend,
  progress,
  color = 'blue',
  isLoading,
}: KPICardProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    orange: 'text-orange-600 bg-orange-100',
    red: 'text-red-600 bg-red-100',
    purple: 'text-purple-600 bg-purple-100',
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-8 w-24 mt-4" />
          <Skeleton className="h-4 w-32 mt-2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className={cn('p-2.5 rounded-lg', colorClasses[color])}>
            {icon}
          </div>
          {trend && (
            <Badge
              variant="outline"
              className={cn(
                'flex items-center gap-1',
                trend.value > 0
                  ? 'text-green-600 border-green-200 bg-green-50'
                  : trend.value < 0
                  ? 'text-red-600 border-red-200 bg-red-50'
                  : 'text-gray-600 border-gray-200'
              )}
            >
              {trend.value > 0 ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : trend.value < 0 ? (
                <ArrowDownRight className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              {Math.abs(trend.value)}%
            </Badge>
          )}
        </div>

        <div className="mt-4">
          <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
          <p className="text-sm text-muted-foreground">{title}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>

        {progress && (
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">{progress.label}</span>
              <span className="font-medium">{progress.value}%</span>
            </div>
            <Progress value={progress.value} className="h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function DashboardKPICards({
  data,
  isLoading,
  className,
}: DashboardKPICardsProps) {
  // Calculer les tendances (comparaison avec période précédente - simulé ici)
  const notesTotal = data?.notesSEF.total || 0;
  const dossiersTotal = data?.dossiers.total || 0;
  const budgetTotal = data?.budget.total || 0;
  const tauxExecution = data?.budget.tauxExecution || 0;

  // Formatage des montants
  const formatMontant = (montant: number): string => {
    if (montant >= 1_000_000_000) return `${(montant / 1_000_000_000).toFixed(1)} Mds`;
    if (montant >= 1_000_000) return `${(montant / 1_000_000).toFixed(1)} M`;
    if (montant >= 1_000) return `${(montant / 1_000).toFixed(0)} K`;
    return montant.toFixed(0);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Ligne 1: KPIs principaux */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Notes SEF */}
        <KPICard
          title="Notes SEF"
          value={notesTotal}
          subtitle={`${data?.notesSEF.aValider || 0} à valider`}
          icon={<FileText className="h-5 w-5" />}
          trend={{ value: 12, label: 'vs mois dernier' }}
          color="blue"
          isLoading={isLoading}
        />

        {/* Dossiers */}
        <KPICard
          title="Dossiers"
          value={dossiersTotal}
          subtitle={`${data?.dossiers.enCours || 0} en cours`}
          icon={<FolderOpen className="h-5 w-5" />}
          trend={{ value: 8, label: 'vs mois dernier' }}
          color="purple"
          isLoading={isLoading}
        />

        {/* Budget */}
        <KPICard
          title="Budget total"
          value={`${formatMontant(budgetTotal)} FCFA`}
          subtitle={`${formatMontant(data?.budget.paye || 0)} FCFA payé`}
          icon={<Wallet className="h-5 w-5" />}
          progress={{ value: tauxExecution, label: "Taux d'exécution" }}
          color="green"
          isLoading={isLoading}
        />

        {/* Délai moyen */}
        <KPICard
          title="Délai validation"
          value={`${data?.delais.moyenValidation || 0} j`}
          subtitle="Délai moyen de validation"
          icon={<Clock className="h-5 w-5" />}
          trend={{ value: -5, label: 'vs mois dernier' }}
          color="orange"
          isLoading={isLoading}
        />
      </div>

      {/* Ligne 2: KPIs secondaires */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Activité récente */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Activité récente (7j)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Notes créées</span>
                  <span className="font-semibold text-blue-600">
                    {data?.activiteRecente.notesCreees || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Notes validées</span>
                  <span className="font-semibold text-green-600">
                    {data?.activiteRecente.notesValidees || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Dossiers traités</span>
                  <span className="font-semibold text-purple-600">
                    {data?.activiteRecente.dossiersTraites || 0}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statuts des notes */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Statuts des notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm flex-1">Validées</span>
                  <span className="font-medium">{data?.notesSEF.valide || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm flex-1">Soumises</span>
                  <span className="font-medium">{data?.notesSEF.soumis || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-sm flex-1">Différées</span>
                  <span className="font-medium">{data?.notesSEF.differe || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm flex-1">Rejetées</span>
                  <span className="font-medium">{data?.notesSEF.rejete || 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alertes */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              Points d'attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : (
              <div className="space-y-2">
                {(data?.notesSEF.aValider || 0) > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-orange-50 rounded text-sm">
                    <Clock className="h-4 w-4 text-orange-600 flex-shrink-0" />
                    <span>
                      <strong>{data?.notesSEF.aValider}</strong> note(s) en attente de validation
                    </span>
                  </div>
                )}
                {(data?.dossiers.bloque || 0) > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-red-50 rounded text-sm">
                    <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                    <span>
                      <strong>{data?.dossiers.bloque}</strong> dossier(s) bloqué(s)
                    </span>
                  </div>
                )}
                {(data?.notesSEF.aValider || 0) === 0 && (data?.dossiers.bloque || 0) === 0 && (
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Aucun point d'attention</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default DashboardKPICards;
