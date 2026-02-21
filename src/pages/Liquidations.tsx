import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  Receipt,
  CheckCircle,
  Clock,
  Tag,
  CreditCard,
  MoreHorizontal,
  Eye,
  FileSignature,
  Flame,
  User,
  Shield,
  Download,
  FileSpreadsheet,
  FileText,
  FileDown,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { NotesPagination } from '@/components/shared/NotesPagination';
import { BudgetChainExportButton } from '@/components/export/BudgetChainExportButton';
import {
  useLiquidations,
  Liquidation,
  VALIDATION_STEPS,
  EngagementPourLiquidation,
  computeEngagementProgress,
} from '@/hooks/useLiquidations';
import { TrancheInfo, LiquidationUserRole } from '@/components/liquidation/LiquidationList';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import { useUrgentLiquidations } from '@/hooks/useUrgentLiquidations';
import { useLiquidationExport } from '@/hooks/useLiquidationExport';
import { usePermissions } from '@/hooks/usePermissions';
import { LiquidationForm } from '@/components/liquidation/LiquidationForm';
import { LiquidationList } from '@/components/liquidation/LiquidationList';
import { LiquidationDetails } from '@/components/liquidation/LiquidationDetails';
import { LiquidationValidationDAAF } from '@/components/liquidation/LiquidationValidationDAAF';
import { LiquidationRejectDialog } from '@/components/liquidation/LiquidationRejectDialog';
import { LiquidationDeferDialog } from '@/components/liquidation/LiquidationDeferDialog';
import { LiquidationValidateDialog } from '@/components/liquidation/LiquidationValidateDialog';
import { UrgentLiquidationList } from '@/components/liquidations/UrgentLiquidationList';
import { PermissionGuard, usePermissionCheck } from '@/components/auth/PermissionGuard';
import { useCanValidateLiquidation } from '@/hooks/useDelegations';
import { useExercice } from '@/contexts/ExerciceContext';
import { WorkflowStepIndicator } from '@/components/workflow/WorkflowStepIndicator';
import { ModuleHelp, MODULE_HELP_CONFIG } from '@/components/help/ModuleHelp';

export default function Liquidations() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [selectedLiquidation, setSelectedLiquidation] = useState<Liquidation | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDeferDialog, setShowDeferDialog] = useState(false);
  const [showValidateDialog, setShowValidateDialog] = useState(false);
  const [actionLiquidationId, setActionLiquidationId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('a_traiter');
  const [urgentOnlyFilter, setUrgentOnlyFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const {
    liquidations,
    engagementsValides,
    isLoading,
    submitLiquidation,
    validateLiquidation,
    rejectLiquidation,
    deferLiquidation,
    resumeLiquidation,
    isValidating,
    isRejecting,
    isDeferring,
  } = useLiquidations();

  const { urgentCount } = useUrgentLiquidations();
  const { exercice } = useExercice();
  const { exportExcel, exportCSV, exportPDF, exportAttestation, isExporting } =
    useLiquidationExport();
  const { hasRole, hasAnyRole, isAdmin: isAdminUser } = usePermissions();

  const { canPerform } = usePermissionCheck();
  const {
    canValidate: canValidateViaDelegation,
    viaDelegation: liquidationViaDelegation,
    delegatorInfo: liquidationDelegatorInfo,
  } = useCanValidateLiquidation();

  // Combine permission directe et délégation pour la validation
  const canValidateLiquidationFinal =
    canPerform('liquidation.validate') || canValidateViaDelegation;
  const canRejectLiquidationFinal = canPerform('liquidation.reject') || canValidateViaDelegation;
  const canDeferLiquidationFinal = canPerform('liquidation.defer') || canValidateViaDelegation;

  // Détermine le rôle effectif pour le menu d'actions
  const effectiveUserRole: LiquidationUserRole | undefined = useMemo(() => {
    if (isAdminUser) return 'ADMIN';
    if (hasRole('DG')) return 'DG';
    if (hasAnyRole(['DAAF', 'DAF'])) return 'DAAF';
    if (hasRole('CB')) return 'CB';
    if (hasAnyRole(['TRESORERIE', 'AGENT_COMPTABLE', 'AC'])) return 'TRESORERIE';
    // Agent = tout utilisateur non-valideur
    return 'AGENT';
  }, [isAdminUser, hasRole, hasAnyRole]);

  // Handle sourceEngagement URL parameter
  useEffect(() => {
    const sourceEngId = searchParams.get('sourceEngagement');
    if (sourceEngId) {
      setShowCreateDialog(true);
      searchParams.delete('sourceEngagement');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Filter liquidations
  const filteredLiquidations = liquidations
    .filter((liq) => {
      // Filtre texte
      const matchesSearch =
        !searchQuery ||
        liq.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
        liq.engagement?.objet?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        liq.engagement?.numero?.toLowerCase().includes(searchQuery.toLowerCase());
      // Filtre urgents uniquement
      const matchesUrgent = !urgentOnlyFilter || liq.reglement_urgent === true;
      return matchesSearch && matchesUrgent;
    })
    // Tri : urgents en premier
    .sort((a, b) => {
      const aUrgent = a.reglement_urgent ? 1 : 0;
      const bUrgent = b.reglement_urgent ? 1 : 0;
      return bUrgent - aUrgent;
    });

  // Pagination helper — slice client-side data for current page
  const paginateList = <T,>(list: T[]) => {
    const start = (page - 1) * pageSize;
    return list.slice(start, start + pageSize);
  };

  // Reset to page 1 when search query changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const aValider = filteredLiquidations.filter(
    (l) => l.statut === 'soumis' || l.statut === 'validé_daaf'
  );
  const validees = filteredLiquidations.filter((l) => l.statut === 'validé_dg');
  const rejetees = filteredLiquidations.filter((l) => l.statut === 'rejete');
  const differees = filteredLiquidations.filter((l) => l.statut === 'differe');

  // ── Calcul tranche map pour badges "T1/3" dans la liste ──
  const trancheMap: Map<string, TrancheInfo> = (() => {
    const map = new Map<string, TrancheInfo>();
    // Grouper par engagement_id (hors annulées/rejetées)
    const byEngagement = new Map<string, Liquidation[]>();
    for (const liq of liquidations) {
      if (liq.statut === 'annule' || liq.statut === 'rejete') continue;
      const engId = liq.engagement_id;
      const existing = byEngagement.get(engId);
      if (existing) {
        existing.push(liq);
      } else {
        byEngagement.set(engId, [liq]);
      }
    }
    for (const [, group] of byEngagement) {
      if (group.length <= 1) continue; // Pas de badge pour liquidation unique
      // Trier par date de création
      group.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      group.forEach((liq, idx) => {
        map.set(liq.id, { tranche: idx + 1, total: group.length });
      });
    }
    return map;
  })();

  // ── Progression par engagement pour "À traiter" ──
  const engagementProgressMap: Map<
    string,
    { count: number; total_liquide: number; pourcent: number }
  > = (() => {
    const map = new Map<string, { count: number; total_liquide: number; pourcent: number }>();
    for (const eng of engagementsValides) {
      const progress = computeEngagementProgress(eng.id, eng.montant, liquidations);
      if (progress.count > 0) {
        map.set(eng.id, {
          count: progress.count,
          total_liquide: progress.total_liquide,
          pourcent: progress.pourcent,
        });
      }
    }
    return map;
  })();

  const handleCreateOrdonnancement = (liquidationId: string) => {
    navigate(`/ordonnancements?sourceLiquidation=${liquidationId}`);
  };

  // Handler attestation PDF
  const handleExportAttestation = (liquidation: Liquidation) => {
    exportAttestation(liquidation);
  };

  // Handler "Prêt pour ordonnancement" (Trésorerie)
  const handleMarkReadyForOrdonnancement = (liquidationId: string) => {
    navigate(`/ordonnancements?sourceLiquidation=${liquidationId}`);
  };

  // Handler certifier SF — ouvre le détail sur l'onglet service fait
  const handleCertifySF = (liquidation: Liquidation) => {
    setSelectedLiquidation(liquidation);
    setShowDetailsSheet(true);
  };

  // Handler modifier — ouvre le détail
  const handleEdit = (liquidation: Liquidation) => {
    setSelectedLiquidation(liquidation);
    setShowDetailsSheet(true);
  };

  // Stats
  const totalMontant = liquidations.reduce((acc, l) => acc + l.montant, 0);
  const serviceFaitCount = liquidations.filter((l) => l.service_fait).length;

  const handleView = (liquidation: Liquidation) => {
    setSelectedLiquidation(liquidation);
    setShowDetailsSheet(true);
  };

  const handleSubmit = (id: string) => {
    submitLiquidation(id);
  };

  const handleValidate = (id: string) => {
    setActionLiquidationId(id);
    setShowValidateDialog(true);
  };

  const handleReject = (id: string) => {
    setActionLiquidationId(id);
    setShowRejectDialog(true);
  };

  const handleDefer = (id: string) => {
    setActionLiquidationId(id);
    setShowDeferDialog(true);
  };

  const handleResume = (id: string) => {
    resumeLiquidation(id);
  };

  const confirmValidate = (comments?: string) => {
    if (actionLiquidationId) {
      validateLiquidation({ id: actionLiquidationId, comments });
      setShowValidateDialog(false);
      setActionLiquidationId(null);
    }
  };

  const confirmReject = (reason: string) => {
    if (actionLiquidationId) {
      rejectLiquidation({ id: actionLiquidationId, reason });
      setShowRejectDialog(false);
      setActionLiquidationId(null);
    }
  };

  const confirmDefer = (motif: string, dateReprise?: string) => {
    if (actionLiquidationId) {
      deferLiquidation({ id: actionLiquidationId, motif, dateReprise });
      setShowDeferDialog(false);
      setActionLiquidationId(null);
    }
  };

  const getCurrentStepLabel = () => {
    const liq = liquidations.find((l) => l.id === actionLiquidationId);
    if (!liq) return undefined;
    const step = VALIDATION_STEPS.find((s) => s.order === liq.current_step);
    return step?.label;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Indicateur de workflow */}
      <WorkflowStepIndicator currentStep={6} />

      {/* Aide contextuelle */}
      <ModuleHelp {...MODULE_HELP_CONFIG.liquidations} />

      {/* Page Header */}
      <PageHeader
        title="Liquidations"
        description="Constatation du service fait"
        icon={Receipt}
        stepNumber={7}
        backUrl="/"
      >
        {/* Menu export liquidations */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="gap-2"
              disabled={isExporting || liquidations.length === 0}
            >
              <Download className="h-4 w-4" />
              Exporter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => exportExcel(filteredLiquidations, undefined, exercice)}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel (3 feuilles)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportCSV(filteredLiquidations, undefined, exercice)}>
              <FileText className="mr-2 h-4 w-4" />
              CSV
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => exportPDF(filteredLiquidations, undefined, exercice)}>
              <FileDown className="mr-2 h-4 w-4" />
              PDF synthèse
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <BudgetChainExportButton step="liquidation" />
        <PermissionGuard permission="liquidation.create" showDelegationBadge>
          <Button className="gap-2" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4" />
            Nouvelle liquidation
          </Button>
        </PermissionGuard>
      </PageHeader>
      {liquidationViaDelegation && (
        <Badge variant="outline" className="mt-2 bg-amber-50 text-amber-700 border-amber-200">
          <User className="h-3 w-3 mr-1" />
          Validation par délégation
          {liquidationDelegatorInfo ? ` du ${liquidationDelegatorInfo.role}` : ''}
        </Badge>
      )}

      {/* Search + filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro, engagement ou objet..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Switch
                id="urgent-filter"
                checked={urgentOnlyFilter}
                onCheckedChange={setUrgentOnlyFilter}
                className={urgentOnlyFilter ? 'data-[state=checked]:bg-red-500' : ''}
              />
              <Label
                htmlFor="urgent-filter"
                className={`text-sm cursor-pointer select-none flex items-center gap-1.5 ${
                  urgentOnlyFilter ? 'text-red-600 font-medium' : 'text-muted-foreground'
                }`}
              >
                <Flame
                  className={`h-3.5 w-3.5 ${urgentOnlyFilter ? 'text-red-500 animate-pulse' : ''}`}
                />
                Urgents uniquement
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total liquidations</p>
                <p className="text-2xl font-bold">{liquidations.length}</p>
              </div>
              <Receipt className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Montant total</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(totalMontant)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">À valider</p>
                <p className="text-2xl font-bold text-warning">{aValider.length}</p>
              </div>
              <Clock className="h-8 w-8 text-warning/50" />
            </div>
          </CardContent>
        </Card>
        <Card className={urgentCount > 0 ? 'border-red-300 dark:border-red-800' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Urgentes</p>
                <p
                  className={`text-2xl font-bold ${urgentCount > 0 ? 'text-red-600 animate-pulse' : ''}`}
                >
                  {urgentCount}
                </p>
              </div>
              <Flame
                className={`h-8 w-8 ${urgentCount > 0 ? 'text-red-500/70 animate-pulse' : 'text-muted-foreground/50'}`}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Service fait</p>
                <p className="text-2xl font-bold text-success">{serviceFaitCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des liquidations</CardTitle>
          <CardDescription>{filteredLiquidations.length} liquidation(s) trouvée(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 flex-wrap">
              <TabsTrigger value="a_traiter" className="gap-1">
                <Tag className="h-3 w-3" />À traiter ({engagementsValides.length})
              </TabsTrigger>
              <TabsTrigger value="toutes">Toutes ({filteredLiquidations.length})</TabsTrigger>
              <TabsTrigger value="a_valider" className="text-warning">
                À valider ({aValider.length})
              </TabsTrigger>
              <TabsTrigger value="validation_daaf" className="text-secondary gap-1">
                <Shield className="h-3 w-3" />
                Validation DAAF ({aValider.length})
              </TabsTrigger>
              <TabsTrigger value="urgentes" className={urgentCount > 0 ? 'text-red-600' : ''}>
                <Flame className={`h-3 w-3 mr-1 ${urgentCount > 0 ? 'animate-pulse' : ''}`} />
                Urgentes ({urgentCount})
              </TabsTrigger>
              <TabsTrigger value="validees" className="text-success">
                Validées ({validees.length})
              </TabsTrigger>
              <TabsTrigger value="rejetees" className="text-destructive">
                Rejetées ({rejetees.length})
              </TabsTrigger>
              <TabsTrigger value="differees">Différées ({differees.length})</TabsTrigger>
            </TabsList>

            {/* Onglet À traiter - Engagements validés */}
            <TabsContent value="a_traiter">
              {engagementsValides.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun engagement à liquider</p>
                  <p className="text-sm">Les engagements validés apparaîtront ici</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Réf. Engagement</TableHead>
                        <TableHead>Objet</TableHead>
                        <TableHead>Fournisseur</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead className="hidden md:table-cell">Progression</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginateList(engagementsValides).map((eng: EngagementPourLiquidation) => {
                        const progress = engagementProgressMap.get(eng.id);
                        return (
                          <TableRow key={eng.id}>
                            <TableCell className="font-mono text-sm">{eng.numero || '-'}</TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {eng.objet || '-'}
                            </TableCell>
                            <TableCell>{eng.fournisseur || '-'}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(eng.montant || 0)}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {progress ? (
                                <div className="space-y-1 min-w-[120px]">
                                  <div className="flex items-center justify-between text-xs">
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] h-4 px-1 font-mono"
                                    >
                                      {progress.count} tranche{progress.count > 1 ? 's' : ''}
                                    </Badge>
                                    <span className="text-muted-foreground">
                                      {progress.pourcent.toFixed(0)}%
                                    </span>
                                  </div>
                                  <Progress value={progress.pourcent} className="h-1.5" />
                                  <div className="text-[10px] text-muted-foreground">
                                    {formatCurrency(progress.total_liquide)} /{' '}
                                    {formatCurrency(eng.montant)}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">Aucune</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                                <Receipt className="mr-2 h-4 w-4" />
                                {progress ? 'Nouvelle tranche' : 'Liquider'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  {(() => {
                    const totalPages = Math.ceil(engagementsValides.length / pageSize);
                    return (
                      <NotesPagination
                        page={page}
                        pageSize={pageSize}
                        total={engagementsValides.length}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        onPageSizeChange={(size) => {
                          setPageSize(size);
                          setPage(1);
                        }}
                      />
                    );
                  })()}
                </>
              )}
            </TabsContent>

            <TabsContent value="toutes">
              <LiquidationList
                liquidations={paginateList(filteredLiquidations)}
                onView={handleView}
                onSubmit={canPerform('liquidation.submit') ? handleSubmit : undefined}
                onValidate={canValidateLiquidationFinal ? handleValidate : undefined}
                onReject={canRejectLiquidationFinal ? handleReject : undefined}
                onDefer={canDeferLiquidationFinal ? handleDefer : undefined}
                onResume={canPerform('liquidation.resume') ? handleResume : undefined}
                onEdit={handleEdit}
                onCertifySF={handleCertifySF}
                onExportAttestation={handleExportAttestation}
                onMarkReadyForOrdonnancement={handleMarkReadyForOrdonnancement}
                trancheMap={trancheMap}
                isLoading={isLoading}
                userRole={effectiveUserRole}
              />
              {(() => {
                const totalPages = Math.ceil(filteredLiquidations.length / pageSize);
                return (
                  <NotesPagination
                    page={page}
                    pageSize={pageSize}
                    total={filteredLiquidations.length}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    onPageSizeChange={(size) => {
                      setPageSize(size);
                      setPage(1);
                    }}
                  />
                );
              })()}
            </TabsContent>

            <TabsContent value="a_valider">
              <LiquidationList
                liquidations={aValider}
                onView={handleView}
                onValidate={canValidateLiquidationFinal ? handleValidate : undefined}
                onReject={canRejectLiquidationFinal ? handleReject : undefined}
                onDefer={canDeferLiquidationFinal ? handleDefer : undefined}
                onExportAttestation={handleExportAttestation}
                trancheMap={trancheMap}
                isLoading={isLoading}
                userRole={effectiveUserRole}
              />
            </TabsContent>

            {/* Onglet Validation DAAF */}
            <TabsContent value="validation_daaf">
              <LiquidationValidationDAAF
                liquidations={aValider}
                onView={handleView}
                onValidate={(id, comments) => {
                  if (canValidateLiquidationFinal) {
                    validateLiquidation({ id, comments });
                  }
                }}
                onReject={(id, reason) => {
                  if (canRejectLiquidationFinal) {
                    rejectLiquidation({ id, reason });
                  }
                }}
                isValidating={isValidating}
                isRejecting={isRejecting}
              />
            </TabsContent>

            {/* Onglet Urgentes */}
            <TabsContent value="urgentes">
              <UrgentLiquidationList
                onViewDetail={(liq) => {
                  const liquidation = liquidations.find((l) => l.id === liq.id);
                  if (liquidation) handleView(liquidation);
                }}
                maxHeight={500}
                showStats={true}
              />
            </TabsContent>

            {/* Onglet Validées avec action Ordonnancement */}
            <TabsContent value="validees">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numéro</TableHead>
                    <TableHead>Engagement</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="text-right">Net à payer</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Aucune liquidation validée
                      </TableCell>
                    </TableRow>
                  ) : (
                    validees.map((liq) => (
                      <TableRow key={liq.id}>
                        <TableCell className="font-mono text-sm">{liq.numero}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {liq.engagement?.objet || '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(liq.montant)}
                        </TableCell>
                        <TableCell className="text-right text-success font-medium">
                          {formatCurrency(liq.net_a_payer || liq.montant)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover">
                              <DropdownMenuItem onClick={() => handleView(liq)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Voir détails
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleCreateOrdonnancement(liq.id)}
                                className="text-primary"
                              >
                                <FileSignature className="mr-2 h-4 w-4" />
                                Créer ordonnancement
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="rejetees">
              <LiquidationList
                liquidations={rejetees}
                onView={handleView}
                trancheMap={trancheMap}
                isLoading={isLoading}
                userRole={effectiveUserRole}
              />
            </TabsContent>

            <TabsContent value="differees">
              <LiquidationList
                liquidations={differees}
                onView={handleView}
                onResume={canPerform('liquidation.resume') ? handleResume : undefined}
                trancheMap={trancheMap}
                isLoading={isLoading}
                userRole={effectiveUserRole}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer une liquidation</DialogTitle>
          </DialogHeader>
          <LiquidationForm
            onSuccess={() => setShowCreateDialog(false)}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Details Sheet */}
      <Sheet open={showDetailsSheet} onOpenChange={setShowDetailsSheet}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Détails de la liquidation</SheetTitle>
          </SheetHeader>
          {selectedLiquidation && (
            <div className="mt-6">
              <LiquidationDetails liquidation={selectedLiquidation} />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Validate Dialog */}
      <LiquidationValidateDialog
        open={showValidateDialog}
        onOpenChange={setShowValidateDialog}
        onConfirm={confirmValidate}
        isLoading={isValidating}
        stepLabel={getCurrentStepLabel()}
      />

      {/* Reject Dialog */}
      <LiquidationRejectDialog
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        onConfirm={confirmReject}
        isLoading={isRejecting}
      />

      {/* Defer Dialog */}
      <LiquidationDeferDialog
        open={showDeferDialog}
        onOpenChange={setShowDeferDialog}
        onConfirm={confirmDefer}
        isLoading={isDeferring}
      />
    </div>
  );
}
