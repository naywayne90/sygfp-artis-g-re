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
  Filter,
  GitBranch,
  History,
  LayoutDashboard,
  Loader2,
  ArrowRight,
  User,
  ShieldCheck,
  PauseCircle,
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
        actions={
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Vue d&apos;ensemble</span>
            </TabsTrigger>
            <TabsTrigger value="matrice" className="gap-2">
              <GitBranch className="h-4 w-4" />
              <span className="hidden sm:inline">Circuit Validation</span>
            </TabsTrigger>
            <TabsTrigger value="directions" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Par Direction</span>
            </TabsTrigger>
            <TabsTrigger value="operations" className="gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">En attente</span>
              {stats.totalEnAttente > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                  {stats.totalEnAttente}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="historique" className="gap-2">
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
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs">En attente</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalEnAttente}</div>
            <p className="text-xs text-muted-foreground">opérations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Banknote className="h-4 w-4" />
              <span className="text-xs">Montant</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(stats.montantEnAttente)}</div>
            <p className="text-xs text-muted-foreground">en attente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Timer className="h-4 w-4" />
              <span className="text-xs">Délai moyen</span>
            </div>
            <div className="text-2xl font-bold">{stats.delaiMoyenJours} j</div>
            <p className="text-xs text-muted-foreground">de traitement</p>
          </CardContent>
        </Card>
        <Card className={stats.enRetard > 0 ? 'border-red-200 bg-red-50/50' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <AlertTriangle className={`h-4 w-4 ${stats.enRetard > 0 ? 'text-red-500' : ''}`} />
              <span className="text-xs">En retard</span>
            </div>
            <div className={`text-2xl font-bold ${stats.enRetard > 0 ? 'text-red-600' : ''}`}>
              {stats.enRetard}
            </div>
            <p className="text-xs text-muted-foreground">SLA dépassé (&gt;5j)</p>
          </CardContent>
        </Card>
        <Card className={stats.tauxValidation >= 80 ? 'border-green-200 bg-green-50/50' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs">Taux validation</span>
            </div>
            <div
              className={`text-2xl font-bold ${stats.tauxValidation >= 80 ? 'text-green-600' : ''}`}
            >
              {stats.tauxValidation}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalValideesMois}/{stats.totalTraiteesMois} ce mois
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 urgences */}
      {top5Urgences.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Top 5 opérations les plus urgentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Étape</TableHead>
                  <TableHead>Progression</TableHead>
                  <TableHead>Validateur</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Délai</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {top5Urgences.map((op) => (
                  <TableRow
                    key={op.id}
                    className={`cursor-pointer hover:bg-muted/50 ${op.slaDepasse ? 'bg-red-50/50' : ''}`}
                    onClick={() => navigate(op.entityUrl)}
                  >
                    <TableCell className="font-mono text-sm">{op.reference}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{op.moduleLabel}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{op.directionCode}</TableCell>
                    <TableCell className="text-sm">{op.etapeActuelle}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[80px]">
                        <Progress
                          value={(op.stepActuel / op.stepTotal) * 100}
                          className="h-2 flex-1"
                        />
                        <span className="text-xs text-muted-foreground font-mono">
                          {op.stepActuel}/{op.stepTotal}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{op.validateurRole}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {op.montant ? formatCurrency(op.montant) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          op.delaiJours > 7
                            ? 'bg-red-100 text-red-800'
                            : op.delaiJours > 3
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-green-100 text-green-800'
                        }
                      >
                        {op.delaiJours} j
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(op.entityUrl);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pipeline 9 étapes */}
      {stats.pipeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-primary" />
              Chaîne de Dépense — 9 Étapes
            </CardTitle>
            <CardDescription>Progression en temps réel de chaque étape du pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-3 md:grid-cols-5 lg:grid-cols-9">
              {stats.pipeline.map((step, idx) => (
                <div
                  key={step.etape}
                  className="relative p-3 rounded-lg border hover:shadow-md transition-all cursor-pointer text-center"
                  style={{ backgroundColor: `var(--${step.color}-50, #f8fafc)` }}
                  onClick={() => navigate(step.url)}
                >
                  <div className="text-xs font-semibold text-muted-foreground mb-1">
                    {step.etape}
                  </div>
                  <div className="text-lg font-bold">{step.countTotal}</div>
                  <p className="text-[10px] text-muted-foreground leading-tight mb-2">
                    {step.label}
                  </p>
                  {step.countEnAttente > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 text-[10px] h-5 px-1.5"
                    >
                      {step.countEnAttente}
                    </Badge>
                  )}
                  <Progress value={step.pourcentage} className="h-1.5" />
                  <p className="text-[9px] text-muted-foreground mt-1">
                    {step.pourcentage}% traité
                  </p>
                  {idx < 8 && (
                    <ArrowRight className="hidden lg:block absolute top-1/2 -right-3 -translate-y-1/2 h-4 w-4 text-muted-foreground/30 z-10" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
  // Calculer le nombre max d'étapes
  const maxSteps = Math.max(...matrice.map((m) => m.steps.length), 0);

  return (
    <>
      <Card className="border-blue-200 bg-blue-50/30">
        <CardContent className="pt-4">
          <p className="text-sm text-blue-700">
            Ce tableau montre le circuit de validation pour chaque module : qui doit valider à
            chaque étape, et les personnes actuellement assignées à chaque rôle.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Circuits de Validation
          </CardTitle>
          <CardDescription>Matrice des étapes de validation par module</CardDescription>
        </CardHeader>
        <CardContent>
          {matrice.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun circuit de validation configuré</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[160px]">Module</TableHead>
                    {Array.from({ length: maxSteps }, (_, i) => (
                      <TableHead key={i} className="min-w-[180px] text-center">
                        Étape {i + 1}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matrice.map((row) => (
                    <TableRow key={row.moduleCode}>
                      <TableCell className="font-medium">{row.moduleLabel}</TableCell>
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
                            <div className="space-y-1">
                              <Badge variant="outline" className="font-medium">
                                {roleLabels[step.roleRequired] || step.roleRequired}
                              </Badge>
                              <div className="text-xs text-muted-foreground">{step.label}</div>
                              {step.personnes.length > 0 && (
                                <div className="flex flex-wrap gap-1 justify-center mt-1">
                                  {step.personnes.slice(0, 2).map((nom) => (
                                    <span
                                      key={nom}
                                      className="inline-flex items-center gap-1 text-xs bg-muted px-1.5 py-0.5 rounded"
                                    >
                                      <User className="h-3 w-3" />
                                      {nom}
                                    </span>
                                  ))}
                                  {step.personnes.length > 2 && (
                                    <span className="text-xs text-muted-foreground">
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
  const urgenceColors = {
    vert: 'border-l-green-500',
    orange: 'border-l-orange-500',
    rouge: 'border-l-red-500',
  };
  const urgenceBadge = {
    vert: 'bg-green-100 text-green-800',
    orange: 'bg-orange-100 text-orange-800',
    rouge: 'bg-red-100 text-red-800',
  };

  if (directions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-lg font-medium">Aucune opération en attente</p>
          <p className="text-muted-foreground mt-2">Toutes les directions sont à jour.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {directions.map((dir) => (
        <Card key={dir.directionId} className={`border-l-4 ${urgenceColors[dir.urgence]}`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{dir.directionSigle || dir.directionCode}</CardTitle>
              <Badge className={urgenceBadge[dir.urgence]}>{dir.totalEnAttente} en attente</Badge>
            </div>
            <CardDescription className="truncate">{dir.directionLabel}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dir.responsableNom && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-3 w-3" />
                {dir.responsableNom}
              </div>
            )}
            <div className="text-sm font-medium">{formatCurrency(dir.montantEnAttente)}</div>
            <div className="space-y-1.5">
              {Object.entries(dir.parModule)
                .filter(([, count]) => count > 0)
                .map(([module, count]) => (
                  <div key={module} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{module}</span>
                    <Badge variant="outline" className="font-mono">
                      {count}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      ))}
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
      {/* Filtres */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-48">
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les modules</SelectItem>
                  <SelectItem value="notes_sef">Notes SEF</SelectItem>
                  <SelectItem value="budget_engagements">Engagements</SelectItem>
                  <SelectItem value="budget_liquidations">Liquidations</SelectItem>
                  <SelectItem value="ordonnancements">Ordonnancements</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select value={directionFilter} onValueChange={setDirectionFilter}>
                <SelectTrigger>
                  <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les directions</SelectItem>
                  {uniqueDirections.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
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
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par référence..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            {operations.length} / {allOperations.length} opérations affichées
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {operations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune opération en attente</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Étape actuelle</TableHead>
                  <TableHead>Progression</TableHead>
                  <TableHead>Validateur</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Délai</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operations.map((op) => (
                  <TableRow
                    key={op.id}
                    className={`cursor-pointer hover:bg-muted/50 ${op.slaDepasse ? 'bg-red-50/50' : ''}`}
                    onClick={() => navigate(op.entityUrl)}
                  >
                    <TableCell>
                      <div className="font-mono text-sm">{op.reference}</div>
                      {op.entityTitle && (
                        <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                          {op.entityTitle}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{op.moduleLabel}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{op.directionCode}</TableCell>
                    <TableCell className="text-sm">{op.etapeActuelle}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[80px]">
                        <Progress
                          value={(op.stepActuel / op.stepTotal) * 100}
                          className="h-2 flex-1"
                        />
                        <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                          {op.stepActuel}/{op.stepTotal}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {roleLabels[op.validateurRole] || op.validateurRole}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {op.montant ? formatCurrency(op.montant) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          op.delaiJours > 7
                            ? 'bg-red-100 text-red-800'
                            : op.delaiJours > 3
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-green-100 text-green-800'
                        }
                      >
                        {op.delaiJours} j
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(op.entityUrl);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Voir
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
      <Card>
        <CardContent className="pt-6 text-center">
          <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-lg font-medium">Aucun historique</p>
          <p className="text-muted-foreground mt-2">Les actions de validation apparaîtront ici.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.label} className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {group.label}
          </h3>
          <div className="space-y-2">
            {group.items.map((item) => (
              <Card key={item.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    {getActionIcon(item.action)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`${getActionColor(item.action)} text-xs`}>
                          {item.actionLabel}
                        </Badge>
                        <span className="text-sm font-medium">{item.entityTypeLabel}</span>
                        {item.entityReference && (
                          <span className="text-sm font-mono text-muted-foreground">
                            {item.entityReference}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {item.userName && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
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
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
