/**
 * Page Suivi DG — Tableau de bord de suivi des validations
 * Accessible uniquement au DG et ADMIN
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Clock,
  Banknote,
  Timer,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye,
  Building2,
  Search,
  GitBranch,
  History,
  LayoutDashboard,
  Loader2,
  ArrowRight,
  User,
  ShieldCheck,
  PauseCircle,
  TrendingUp,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PageHeader } from '@/components/shared/PageHeader';
import { useRBAC } from '@/hooks/useRBAC';
import { formatCurrency } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import {
  useSuiviDG,
  type OperationEnAttente,
  type DirectionSuivi,
  type HistoriqueAction,
  type MatriceRow,
} from '@/hooks/useSuiviDG';

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function SuiviDG() {
  const navigate = useNavigate();
  const { hasAnyRole } = useRBAC();
  const { stats, matrice, directions, operations, historique, isLoading, refetch, ROLE_LABELS } =
    useSuiviDG();

  // Filtres opérations
  const [moduleFilter, setModuleFilter] = useState('all');
  const [directionFilter, setDirectionFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');

  // Guard RBAC
  if (!hasAnyRole(['DG', 'ADMIN'])) {
    return (
      <div className="container mx-auto py-12">
        <Card>
          <CardContent className="pt-6 text-center">
            <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium">Accès non autorisé</p>
            <p className="text-muted-foreground mt-2">
              Cette page est réservée au Directeur Général.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/')}>
              Retour au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filtrer les opérations
  const filteredOperations = operations.filter((op: OperationEnAttente) => {
    if (moduleFilter !== 'all' && op.module !== moduleFilter) return false;
    if (directionFilter !== 'all' && op.directionCode !== directionFilter) return false;
    if (roleFilter !== 'all' && op.validateurRole !== roleFilter) return false;
    if (
      searchFilter &&
      !op.reference.toLowerCase().includes(searchFilter.toLowerCase()) &&
      !(op.entityTitle || '').toLowerCase().includes(searchFilter.toLowerCase())
    )
      return false;
    return true;
  });

  // Directions uniques pour le filtre
  const uniqueDirections = [
    ...new Set(operations.map((op: OperationEnAttente) => op.directionCode)),
  ]
    .filter(Boolean)
    .sort();
  const uniqueRoles = [...new Set(operations.map((op: OperationEnAttente) => op.validateurRole))]
    .filter(Boolean)
    .sort();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Suivi des Validations"
        description="Vue d'ensemble des opérations en attente et circuits de validation"
        breadcrumbs={[{ label: 'Tableau de Bord', href: '/' }, { label: 'Suivi DG' }]}
      >
        <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Chargement des données...</p>
        </div>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 h-12 p-1 bg-muted/60">
            <TabsTrigger
              value="overview"
              className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Vue d&apos;ensemble</span>
            </TabsTrigger>
            <TabsTrigger
              value="matrice"
              className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <GitBranch className="h-4 w-4" />
              <span className="hidden sm:inline">Circuit Validation</span>
            </TabsTrigger>
            <TabsTrigger
              value="directions"
              className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Par Direction</span>
            </TabsTrigger>
            <TabsTrigger
              value="operations"
              className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">En attente</span>
              {stats.totalEnAttente > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs rounded-full">
                  {stats.totalEnAttente}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="historique"
              className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Historique</span>
            </TabsTrigger>
          </TabsList>

          {/* ========== ONGLET 1 : VUE D'ENSEMBLE ========== */}
          <TabsContent value="overview" className="space-y-6">
            <OverviewTab stats={stats} operations={operations} navigate={navigate} />
          </TabsContent>

          {/* ========== ONGLET 2 : MATRICE DE VALIDATION ========== */}
          <TabsContent value="matrice" className="space-y-6">
            <MatriceTab matrice={matrice} roleLabels={ROLE_LABELS} />
          </TabsContent>

          {/* ========== ONGLET 3 : PAR DIRECTION ========== */}
          <TabsContent value="directions" className="space-y-6">
            <DirectionsTab directions={directions} />
          </TabsContent>

          {/* ========== ONGLET 4 : OPÉRATIONS EN ATTENTE ========== */}
          <TabsContent value="operations" className="space-y-6">
            <OperationsTab
              operations={filteredOperations}
              allOperations={operations}
              moduleFilter={moduleFilter}
              setModuleFilter={setModuleFilter}
              directionFilter={directionFilter}
              setDirectionFilter={setDirectionFilter}
              roleFilter={roleFilter}
              setRoleFilter={setRoleFilter}
              searchFilter={searchFilter}
              setSearchFilter={setSearchFilter}
              uniqueDirections={uniqueDirections}
              uniqueRoles={uniqueRoles}
              roleLabels={ROLE_LABELS}
              navigate={navigate}
            />
          </TabsContent>

          {/* ========== ONGLET 5 : HISTORIQUE ========== */}
          <TabsContent value="historique" className="space-y-6">
            <HistoriqueTab historique={historique} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// ============================================
// ONGLET 1 : VUE D'ENSEMBLE
// ============================================

function OverviewTab({
  stats,
  operations,
  navigate,
}: {
  stats: ReturnType<typeof useSuiviDG>['stats'];
  operations: OperationEnAttente[];
  navigate: ReturnType<typeof useNavigate>;
}) {
  const top5Urgences = operations.slice(0, 5);

  return (
    <>
      {/* KPIs — Design moderne avec icônes colorées */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* En attente */}
        <Card className="relative overflow-hidden border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100/50 rounded-bl-[60px]" />
          <CardContent className="pt-5 pb-4 relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-blue-700">{stats.totalEnAttente}</div>
            <p className="text-xs text-blue-600/70 mt-1 font-medium">En attente</p>
          </CardContent>
        </Card>

        {/* Montant */}
        <Card className="relative overflow-hidden border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-white">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-100/50 rounded-bl-[60px]" />
          <CardContent className="pt-5 pb-4 relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <Banknote className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-700">
              {formatCurrency(stats.montantEnAttente)}
            </div>
            <p className="text-xs text-emerald-600/70 mt-1 font-medium">Montant en jeu</p>
          </CardContent>
        </Card>

        {/* Délai moyen */}
        <Card className="relative overflow-hidden border-0 shadow-sm bg-gradient-to-br from-violet-50 to-white">
          <div className="absolute top-0 right-0 w-20 h-20 bg-violet-100/50 rounded-bl-[60px]" />
          <CardContent className="pt-5 pb-4 relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-violet-100">
                <Timer className="h-4 w-4 text-violet-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-violet-700">
              {stats.delaiMoyenJours} <span className="text-lg">j</span>
            </div>
            <p className="text-xs text-violet-600/70 mt-1 font-medium">Délai moyen</p>
          </CardContent>
        </Card>

        {/* En retard */}
        <Card
          className={`relative overflow-hidden border-0 shadow-sm ${stats.enRetard > 0 ? 'bg-gradient-to-br from-red-50 to-white' : 'bg-gradient-to-br from-gray-50 to-white'}`}
        >
          <div
            className={`absolute top-0 right-0 w-20 h-20 rounded-bl-[60px] ${stats.enRetard > 0 ? 'bg-red-100/50' : 'bg-gray-100/50'}`}
          />
          <CardContent className="pt-5 pb-4 relative">
            <div className="flex items-center gap-2 mb-3">
              <div
                className={`p-2 rounded-lg ${stats.enRetard > 0 ? 'bg-red-100' : 'bg-gray-100'}`}
              >
                <AlertTriangle
                  className={`h-4 w-4 ${stats.enRetard > 0 ? 'text-red-600' : 'text-gray-500'}`}
                />
              </div>
            </div>
            <div
              className={`text-3xl font-bold ${stats.enRetard > 0 ? 'text-red-700' : 'text-gray-500'}`}
            >
              {stats.enRetard}
            </div>
            <p
              className={`text-xs mt-1 font-medium ${stats.enRetard > 0 ? 'text-red-600/70' : 'text-gray-400'}`}
            >
              En retard (&gt;7j)
            </p>
          </CardContent>
        </Card>

        {/* Taux validation */}
        <Card
          className={`relative overflow-hidden border-0 shadow-sm ${stats.tauxValidation >= 80 ? 'bg-gradient-to-br from-green-50 to-white' : 'bg-gradient-to-br from-amber-50 to-white'}`}
        >
          <div
            className={`absolute top-0 right-0 w-20 h-20 rounded-bl-[60px] ${stats.tauxValidation >= 80 ? 'bg-green-100/50' : 'bg-amber-100/50'}`}
          />
          <CardContent className="pt-5 pb-4 relative">
            <div className="flex items-center gap-2 mb-3">
              <div
                className={`p-2 rounded-lg ${stats.tauxValidation >= 80 ? 'bg-green-100' : 'bg-amber-100'}`}
              >
                <TrendingUp
                  className={`h-4 w-4 ${stats.tauxValidation >= 80 ? 'text-green-600' : 'text-amber-600'}`}
                />
              </div>
            </div>
            <div
              className={`text-3xl font-bold ${stats.tauxValidation >= 80 ? 'text-green-700' : 'text-amber-700'}`}
            >
              {stats.tauxValidation}
              <span className="text-lg">%</span>
            </div>
            <p
              className={`text-xs mt-1 font-medium ${stats.tauxValidation >= 80 ? 'text-green-600/70' : 'text-amber-600/70'}`}
            >
              {stats.totalValideesMois}/{stats.totalTraiteesMois} ce mois
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline 9 étapes — Stepper visuel */}
      {stats.pipeline.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary/10">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Chaîne de Dépense</CardTitle>
                <CardDescription>Pipeline en 9 étapes — cliquez pour naviguer</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-6 pt-2">
            <div className="grid grid-cols-9 gap-1">
              {stats.pipeline.map((step, idx) => {
                const hasItems = step.countEnAttente > 0;
                const isComplete = step.pourcentage === 100;
                return (
                  <div
                    key={step.etape}
                    className="flex flex-col items-center text-center cursor-pointer group pt-3"
                    onClick={() => navigate(step.url)}
                  >
                    {/* Cercle numéroté + connecteur */}
                    <div className="relative flex items-center w-full justify-center mb-2">
                      {idx > 0 && (
                        <div
                          className={`absolute right-1/2 top-1/2 -translate-y-1/2 w-full h-0.5 ${
                            isComplete ? 'bg-green-400' : hasItems ? 'bg-orange-300' : 'bg-gray-200'
                          }`}
                        />
                      )}
                      <div
                        className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all group-hover:scale-110 group-hover:shadow-md ${
                          isComplete
                            ? 'bg-green-500 text-white shadow-green-200 shadow-sm'
                            : hasItems
                              ? 'bg-orange-500 text-white shadow-orange-200 shadow-sm'
                              : 'bg-gray-100 text-gray-500 border-2 border-gray-200'
                        }`}
                      >
                        {isComplete ? <CheckCircle2 className="h-3.5 w-3.5" /> : step.etape}
                      </div>
                      {hasItems && (
                        <span className="absolute -top-2 left-1/2 translate-x-1 z-20 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white px-1 min-w-[18px]">
                          {step.countEnAttente}
                        </span>
                      )}
                    </div>
                    {/* Label */}
                    <span className="text-[10px] font-medium text-gray-600 leading-tight group-hover:text-primary transition-colors">
                      {step.label}
                    </span>
                    {/* Mini barre de progression */}
                    <div className="w-full mt-1.5 px-1">
                      <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isComplete ? 'bg-green-400' : hasItems ? 'bg-orange-400' : 'bg-gray-300'
                          }`}
                          style={{ width: `${step.pourcentage}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-gray-400 mt-0.5 block">
                        {step.pourcentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top 5 urgences — Cards compactes */}
      {top5Urgences.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-700">Opérations prioritaires</h3>
            <Badge variant="outline" className="text-xs font-normal">
              Top 5
            </Badge>
          </div>
          <div className="grid gap-2">
            {top5Urgences.map((op) => (
              <Card
                key={op.id}
                className={`border-0 shadow-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-px ${
                  op.slaDepasse
                    ? 'border-l-4 border-l-red-400 bg-red-50/30'
                    : 'border-l-4 border-l-transparent hover:border-l-primary/40'
                }`}
                onClick={() => navigate(op.entityUrl)}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-4">
                    {/* Référence + Module */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-medium text-gray-900">
                          {op.reference}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 h-5 font-normal"
                        >
                          {op.moduleLabel}
                        </Badge>
                      </div>
                      {op.entityTitle && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {op.entityTitle}
                        </p>
                      )}
                    </div>

                    {/* Direction */}
                    <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-500 min-w-[60px]">
                      <Building2 className="h-3 w-3" />
                      <span>{op.directionCode}</span>
                    </div>

                    {/* Étape */}
                    <div className="hidden lg:block text-xs text-gray-500 min-w-[120px]">
                      {op.etapeActuelle}
                    </div>

                    {/* Progression mini */}
                    <div className="hidden sm:flex items-center gap-1.5 min-w-[70px]">
                      <Progress
                        value={(op.stepActuel / op.stepTotal) * 100}
                        className="h-1.5 flex-1"
                      />
                      <span className="text-[10px] text-gray-400 font-mono">
                        {op.stepActuel}/{op.stepTotal}
                      </span>
                    </div>

                    {/* Validateur */}
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] hidden md:inline-flex">
                      {op.validateurRole}
                    </Badge>

                    {/* Montant */}
                    <div className="text-sm font-mono text-gray-700 text-right min-w-[90px] hidden lg:block">
                      {op.montant ? formatCurrency(op.montant) : '—'}
                    </div>

                    {/* Délai */}
                    <Badge
                      className={`min-w-[42px] justify-center text-xs font-semibold ${
                        op.delaiJours > 7
                          ? 'bg-red-100 text-red-700 border-red-200'
                          : op.delaiJours > 3
                            ? 'bg-orange-100 text-orange-700 border-orange-200'
                            : 'bg-green-100 text-green-700 border-green-200'
                      }`}
                    >
                      {op.delaiJours}j
                    </Badge>

                    {/* Action */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(op.entityUrl);
                      }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ============================================
// ONGLET 2 : MATRICE DE VALIDATION
// ============================================

function MatriceTab({
  matrice,
  roleLabels,
}: {
  matrice: MatriceRow[];
  roleLabels: Record<string, string>;
}) {
  const maxSteps = Math.max(...matrice.map((m) => m.steps.length), 0);

  return (
    <>
      <div className="rounded-lg bg-blue-50/60 border border-blue-100 px-4 py-3">
        <p className="text-sm text-blue-700">
          Ce tableau montre le circuit de validation pour chaque module : qui doit valider à chaque
          étape, et les personnes actuellement assignées.
        </p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <GitBranch className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Circuits de Validation</CardTitle>
              <CardDescription>Matrice des étapes par module</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {matrice.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">Aucun circuit configuré</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2">
                    <TableHead className="min-w-[160px] font-semibold">Module</TableHead>
                    {Array.from({ length: maxSteps }, (_, i) => (
                      <TableHead key={i} className="min-w-[180px] text-center">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                            {i + 1}
                          </span>
                          Étape {i + 1}
                        </span>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matrice.map((row) => (
                    <TableRow key={row.moduleCode} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{row.moduleLabel}</span>
                          {row.totalPending > 0 && (
                            <Badge
                              variant="destructive"
                              className="h-5 px-1.5 text-[10px] rounded-full"
                            >
                              {row.totalPending}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      {Array.from({ length: maxSteps }, (_, i) => {
                        const step = row.steps.find((s) => s.stepOrder === i + 1);
                        if (!step) {
                          return (
                            <TableCell key={i} className="text-center text-muted-foreground">
                              —
                            </TableCell>
                          );
                        }
                        return (
                          <TableCell key={i} className="text-center">
                            <div className="space-y-1.5">
                              <Badge variant="outline" className="font-medium bg-white">
                                {roleLabels[step.roleRequired] || step.roleRequired}
                              </Badge>
                              <div className="text-xs text-muted-foreground">{step.label}</div>
                              {step.personnes.length > 0 && (
                                <div className="flex flex-wrap gap-1 justify-center mt-1">
                                  {step.personnes.slice(0, 2).map((nom) => (
                                    <span
                                      key={nom}
                                      className="inline-flex items-center gap-1 text-[10px] bg-gray-100 px-1.5 py-0.5 rounded-full"
                                    >
                                      <User className="h-2.5 w-2.5" />
                                      {nom}
                                    </span>
                                  ))}
                                  {step.personnes.length > 2 && (
                                    <span className="text-[10px] text-muted-foreground">
                                      +{step.personnes.length - 2}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// ============================================
// ONGLET 3 : PAR DIRECTION
// ============================================

function DirectionsTab({ directions }: { directions: DirectionSuivi[] }) {
  const urgenceStyles = {
    vert: {
      border: 'border-l-green-400',
      bg: 'bg-green-50/40',
      badge: 'bg-green-100 text-green-700',
      icon: 'text-green-500',
    },
    orange: {
      border: 'border-l-orange-400',
      bg: 'bg-orange-50/40',
      badge: 'bg-orange-100 text-orange-700',
      icon: 'text-orange-500',
    },
    rouge: {
      border: 'border-l-red-400',
      bg: 'bg-red-50/40',
      badge: 'bg-red-100 text-red-700',
      icon: 'text-red-500',
    },
  };

  if (directions.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="p-3 rounded-full bg-green-50 w-fit mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-400" />
          </div>
          <p className="text-lg font-medium">Toutes les directions sont à jour</p>
          <p className="text-muted-foreground mt-1 text-sm">Aucune opération en attente.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {directions.map((dir) => {
        const style = urgenceStyles[dir.urgence];
        return (
          <Card
            key={dir.directionId}
            className={`border-0 shadow-sm border-l-4 ${style.border} ${style.bg} hover:shadow-md transition-shadow`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-white/80 shadow-sm">
                    <Building2 className={`h-4 w-4 ${style.icon}`} />
                  </div>
                  <CardTitle className="text-base">
                    {dir.directionSigle || dir.directionCode}
                  </CardTitle>
                </div>
                <Badge className={`${style.badge} text-xs font-semibold`}>
                  {dir.totalEnAttente}
                </Badge>
              </div>
              <CardDescription className="truncate pl-9">{dir.directionLabel}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {dir.responsableNom && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground pl-1">
                  <User className="h-3 w-3" />
                  {dir.responsableNom}
                </div>
              )}
              <div className="text-sm font-semibold text-gray-800 pl-1">
                {formatCurrency(dir.montantEnAttente)}
              </div>
              <div className="space-y-1">
                {Object.entries(dir.parModule)
                  .filter(([, count]) => count > 0)
                  .map(([module, count]) => (
                    <div
                      key={module}
                      className="flex items-center justify-between text-xs py-1 px-2 rounded bg-white/60"
                    >
                      <span className="text-gray-600">{module}</span>
                      <span className="font-mono font-medium text-gray-800">{count}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ============================================
// ONGLET 4 : OPÉRATIONS EN ATTENTE
// ============================================

function OperationsTab({
  operations,
  allOperations,
  moduleFilter,
  setModuleFilter,
  directionFilter,
  setDirectionFilter,
  roleFilter,
  setRoleFilter,
  searchFilter,
  setSearchFilter,
  uniqueDirections,
  uniqueRoles,
  roleLabels,
  navigate,
}: {
  operations: OperationEnAttente[];
  allOperations: OperationEnAttente[];
  moduleFilter: string;
  setModuleFilter: (v: string) => void;
  directionFilter: string;
  setDirectionFilter: (v: string) => void;
  roleFilter: string;
  setRoleFilter: (v: string) => void;
  searchFilter: string;
  setSearchFilter: (v: string) => void;
  uniqueDirections: string[];
  uniqueRoles: string[];
  roleLabels: Record<string, string>;
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <>
      {/* Filtres inline — sans wrapper Card lourd */}
      <div className="flex flex-wrap items-center gap-3 bg-white/80 rounded-lg border px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Search className="h-4 w-4" />
          <span className="font-medium">
            {operations.length}/{allOperations.length}
          </span>
        </div>
        <div className="h-5 w-px bg-gray-200" />
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="w-[160px] h-8 text-xs bg-white">
            <SelectValue placeholder="Module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les modules</SelectItem>
            <SelectItem value="notes_sef">Notes SEF</SelectItem>
            <SelectItem value="notes_dg">Notes AEF</SelectItem>
            <SelectItem value="imputations">Imputations</SelectItem>
            <SelectItem value="expressions_besoin">Expressions Besoin</SelectItem>
            <SelectItem value="passation_marche">Passation Marché</SelectItem>
            <SelectItem value="budget_engagements">Engagements</SelectItem>
            <SelectItem value="budget_liquidations">Liquidations</SelectItem>
            <SelectItem value="ordonnancements">Ordonnancements</SelectItem>
            <SelectItem value="reglements">Règlements</SelectItem>
          </SelectContent>
        </Select>
        <Select value={directionFilter} onValueChange={setDirectionFilter}>
          <SelectTrigger className="w-[160px] h-8 text-xs bg-white">
            <Building2 className="h-3 w-3 mr-1 text-muted-foreground" />
            <SelectValue placeholder="Direction" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes directions</SelectItem>
            {uniqueDirections.map((code) => (
              <SelectItem key={code} value={code}>
                {code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[160px] h-8 text-xs bg-white">
            <SelectValue placeholder="Validateur" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            {uniqueRoles.map((role) => (
              <SelectItem key={role} value={role}>
                {roleLabels[role] || role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex-1 min-w-[180px]">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Rechercher par référence..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-8 h-8 text-xs bg-white"
            />
          </div>
        </div>
      </div>

      {/* Table épurée */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-0 px-0">
          {operations.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <div className="p-3 rounded-full bg-green-50 w-fit mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>
              <p className="font-medium">Aucune opération en attente</p>
              <p className="text-sm mt-1">Tout est à jour !</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 border-b-2 hover:bg-gray-50/80">
                  <TableHead className="font-semibold pl-6">Référence</TableHead>
                  <TableHead className="font-semibold">Module</TableHead>
                  <TableHead className="font-semibold">Direction</TableHead>
                  <TableHead className="font-semibold">Étape</TableHead>
                  <TableHead className="font-semibold">Progression</TableHead>
                  <TableHead className="font-semibold">Validateur</TableHead>
                  <TableHead className="font-semibold text-right">Montant</TableHead>
                  <TableHead className="font-semibold text-center">Délai</TableHead>
                  <TableHead className="font-semibold text-right pr-6" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {operations.map((op) => (
                  <TableRow
                    key={op.id}
                    className={`cursor-pointer transition-colors ${op.slaDepasse ? 'bg-red-50/40 hover:bg-red-50/70' : 'hover:bg-muted/40'}`}
                    onClick={() => navigate(op.entityUrl)}
                  >
                    <TableCell className="pl-6">
                      <div className="font-mono text-sm font-medium">{op.reference}</div>
                      {op.entityTitle && (
                        <div className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                          {op.entityTitle}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] font-normal">
                        {op.moduleLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-sm">{op.directionCode}</TableCell>
                    <TableCell className="text-xs text-gray-600">{op.etapeActuelle}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 min-w-[70px]">
                        <Progress
                          value={(op.stepActuel / op.stepTotal) * 100}
                          className="h-1.5 flex-1"
                        />
                        <span className="text-[10px] text-gray-400 font-mono">
                          {op.stepActuel}/{op.stepTotal}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                        {roleLabels[op.validateurRole] || op.validateurRole}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {op.montant ? formatCurrency(op.montant) : '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={`min-w-[40px] justify-center text-xs font-semibold ${
                          op.delaiJours > 7
                            ? 'bg-red-100 text-red-700 border-red-200'
                            : op.delaiJours > 3
                              ? 'bg-orange-100 text-orange-700 border-orange-200'
                              : 'bg-green-100 text-green-700 border-green-200'
                        }`}
                      >
                        {op.delaiJours}j
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(op.entityUrl);
                        }}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// ============================================
// ONGLET 5 : HISTORIQUE
// ============================================

function HistoriqueTab({ historique }: { historique: HistoriqueAction[] }) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'VALIDATE':
      case 'APPROVE':
      case 'SIGN':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'REJECT':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'DEFER':
        return <PauseCircle className="h-4 w-4 text-orange-600" />;
      case 'SUBMIT':
        return <ArrowRight className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'VALIDATE':
      case 'APPROVE':
      case 'SIGN':
        return 'bg-green-100 text-green-800';
      case 'REJECT':
        return 'bg-red-100 text-red-800';
      case 'DEFER':
        return 'bg-orange-100 text-orange-800';
      case 'SUBMIT':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionDot = (action: string) => {
    switch (action) {
      case 'VALIDATE':
      case 'APPROVE':
      case 'SIGN':
        return 'bg-green-500';
      case 'REJECT':
        return 'bg-red-500';
      case 'DEFER':
        return 'bg-orange-500';
      case 'SUBMIT':
        return 'bg-blue-500';
      default:
        return 'bg-gray-400';
    }
  };

  // Grouper par date
  const groups: { label: string; items: HistoriqueAction[] }[] = [];
  let currentLabel = '';

  for (const item of historique) {
    const date = new Date(item.createdAt);
    let label: string;
    if (isToday(date)) label = "Aujourd'hui";
    else if (isYesterday(date)) label = 'Hier';
    else label = format(date, 'EEEE d MMMM', { locale: fr });

    if (label !== currentLabel) {
      currentLabel = label;
      groups.push({ label, items: [] });
    }
    groups[groups.length - 1].items.push(item);
  }

  if (historique.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="p-3 rounded-full bg-gray-50 w-fit mx-auto mb-4">
            <History className="h-8 w-8 text-gray-300" />
          </div>
          <p className="text-lg font-medium">Aucun historique</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Les actions de validation apparaîtront ici.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.label} className="space-y-0">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
            {group.label}
          </h3>
          {/* Timeline verticale */}
          <div className="relative pl-6">
            {/* Ligne verticale */}
            <div className="absolute left-[9px] top-2 bottom-2 w-px bg-gray-200" />
            <div className="space-y-1">
              {group.items.map((item) => (
                <div key={item.id} className="relative flex items-start gap-3 py-2 group">
                  {/* Dot sur la timeline */}
                  <div
                    className={`absolute left-[-18px] top-3.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${getActionDot(item.action)}`}
                  />
                  {/* Contenu */}
                  <div className="flex-1 bg-white rounded-lg border border-transparent hover:border-gray-100 hover:shadow-sm transition-all px-3 py-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getActionIcon(item.action)}
                      <Badge className={`${getActionColor(item.action)} text-[10px] px-1.5`}>
                        {item.actionLabel}
                      </Badge>
                      <span className="text-sm font-medium text-gray-700">
                        {item.entityTypeLabel}
                      </span>
                      {item.entityReference && (
                        <span className="text-xs font-mono text-gray-400">
                          {item.entityReference}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                      {item.userName && (
                        <span className="flex items-center gap-1">
                          <User className="h-2.5 w-2.5" />
                          {item.userName}
                        </span>
                      )}
                      <span>
                        {formatDistanceToNow(new Date(item.createdAt), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
