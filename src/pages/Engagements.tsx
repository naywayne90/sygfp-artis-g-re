import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  Eye,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Lock,
  Tag,
  User,
  ShieldCheck,
  BarChart3,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  Building2,
  TrendingUp,
  Timer,
  PenLine,
  Filter,
  X,
} from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { PageHeader } from '@/components/shared/PageHeader';
import { NotesPagination } from '@/components/shared/NotesPagination';
import { useEngagements, Engagement } from '@/hooks/useEngagements';
import { useEngagementExport } from '@/hooks/useEngagementExport';
import { SuiviBudgetaireEngagements } from '@/components/engagement/SuiviBudgetaireEngagements';
import { EngagementForm } from '@/components/engagement/EngagementForm';
import { EngagementList } from '@/components/engagement/EngagementList';
import { EngagementDetails } from '@/components/engagement/EngagementDetails';
import { EngagementRejectDialog } from '@/components/engagement/EngagementRejectDialog';
import { EngagementDeferDialog } from '@/components/engagement/EngagementDeferDialog';
import { EngagementDegageDialog } from '@/components/engagement/EngagementDegageDialog';
import { EngagementValidateDialog } from '@/components/engagement/EngagementValidateDialog';
import { EngagementPrintDialog } from '@/components/engagement/EngagementPrintDialog';
import { PermissionGuard, usePermissionCheck } from '@/components/auth/PermissionGuard';
import { useRBAC } from '@/contexts/RBACContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useExerciceWriteGuard } from '@/hooks/useExerciceWriteGuard';
import { useExercice } from '@/contexts/ExerciceContext';
import { useCanValidateEngagement } from '@/hooks/useDelegations';
import { WorkflowStepIndicator } from '@/components/workflow/WorkflowStepIndicator';
import { ModuleHelp, MODULE_HELP_CONFIG } from '@/components/help/ModuleHelp';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { getTauxColorClass } from '@/components/engagement/IndicateurBudget';
import { formatCurrency } from '@/lib/utils';

export default function Engagements() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    engagements,
    engagementsAValider,
    engagementsValides,
    engagementsRejetes,
    engagementsDifferes,
    passationsValidees,
    isLoading,
    submitEngagement,
    validateEngagement,
    rejectEngagement,
    deferEngagement,
    resumeEngagement,
    degageEngagement,
    isValidating,
    isDegaging,
  } = useEngagements();

  const { exportExcel, exportCSV, exportPDF, isExporting } = useEngagementExport();
  const { exercice } = useExercice();

  const { canPerform } = usePermissionCheck();
  const { isDAF, isAdmin, user: rbacUser, isDG, isCB, isAuditeur, isTresorerie } = useRBAC();
  const { userRoles: userRoleList } = usePermissions();
  const { isReadOnly, getDisabledMessage } = useExerciceWriteGuard();
  const {
    canValidate: canValidateViaDelegation,
    viaDelegation: engagementViaDelegation,
    delegatorInfo: engagementDelegatorInfo,
  } = useCanValidateEngagement();

  // Combine permission directe et délégation pour la validation
  const canValidateEngagementFinal = canPerform('engagement.validate') || canValidateViaDelegation;
  const canRejectEngagementFinal = canPerform('engagement.reject') || canValidateViaDelegation;
  const canDeferEngagementFinal = canPerform('engagement.defer') || canValidateViaDelegation;

  // Dégagement : DAAF/DAF/DG/ADMIN (profil fonctionnel OU rôle user_roles)
  const canDegageEngagement =
    isDAF || isAdmin || ['DAAF', 'DAF', 'DG', 'ADMIN'].some((r) => userRoleList.includes(r));

  // Rôle principal (codes user_roles) pour filtrage RBAC du menu Actions
  const ROLE_PRIORITY = ['ADMIN', 'DG', 'DAAF', 'DAF', 'CB', 'OPERATEUR'] as const;
  const userRole = ROLE_PRIORITY.find((r) => userRoleList.includes(r)) || userRoleList[0] || null;

  // Filtrage par direction : rôles centraux voient tout, agents voient leur direction
  // Vérifie à la fois profil_fonctionnel (RBAC) et user_roles (table)
  const CENTRAL_ROLES = ['ADMIN', 'DG', 'DAAF', 'DAF', 'CB', 'TRESORERIE', 'AUDITEUR'] as const;
  const isCentralRole =
    isAdmin ||
    isDG ||
    isCB ||
    isDAF ||
    isTresorerie ||
    isAuditeur ||
    CENTRAL_ROLES.some((r) => userRoleList.includes(r));
  const userDirectionId = rbacUser?.directionId ?? null;

  const filterByDirection = (list: Engagement[]) => {
    if (isCentralRole) return list;
    if (!userDirectionId) return list;
    return list.filter(
      (eng) => !eng.budget_line?.direction_id || eng.budget_line.direction_id === userDirectionId
    );
  };

  // Appliquer le filtre direction à toutes les données
  const dirEngagements = filterByDirection(engagements);
  const dirAValider = filterByDirection(engagementsAValider);
  const dirValides = filterByDirection(engagementsValides);
  const dirRejetes = filterByDirection(engagementsRejetes);
  const dirDifferes = filterByDirection(engagementsDifferes);

  // ── DG-specific: engagements au step 4 (visa_daaf) = à signer par le DG ──
  const dgASignerDG = isDG && !isAdmin ? dirAValider.filter((e) => e.statut === 'visa_daaf') : [];
  const dgMontantASigner = dgASignerDG.reduce((sum, e) => sum + e.montant, 0);
  const dgPipeline = isDG && !isAdmin ? dirAValider.filter((e) => e.statut !== 'visa_daaf') : [];
  const dgPipelineMontant = dgPipeline.reduce((sum, e) => sum + e.montant, 0);
  const dgTraites = dirValides.length + dirRejetes.length;

  // DG: urgence — engagements à signer depuis plus de 7 jours
  const dgUrgents = dgASignerDG.filter(
    (e) => differenceInDays(new Date(), new Date(e.created_at)) > 7
  ).length;

  const [activeTab, setActiveTab] = useState(isDG && !isAdmin ? 'a_valider' : 'a_traiter');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // P2 — Filtres avancés
  const [filterDirection, setFilterDirection] = useState<string>('all');
  const [filterStatut, setFilterStatut] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Directions uniques extraites des engagements
  const uniqueDirections = Array.from(
    new Map(
      dirEngagements
        .filter((e) => e.budget_line?.direction?.sigle)
        .map((e) => [e.budget_line!.direction!.sigle!, e.budget_line!.direction!.sigle!])
    ).values()
  ).sort();

  const hasActiveFilters = filterDirection !== 'all' || filterStatut !== 'all';

  // DG : ouvrir directement sur "À valider" (fallback si isDG charge après le mount)
  useEffect(() => {
    if (isDG && !isAdmin) setActiveTab('a_valider');
  }, [isDG, isAdmin]);
  const [preSelectedPMId, setPreSelectedPMId] = useState<string | null>(null);
  const [selectedEngagement, setSelectedEngagement] = useState<Engagement | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showValidateDialog, setShowValidateDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDeferDialog, setShowDeferDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showDegageDialog, setShowDegageDialog] = useState(false);

  // Handle sourcePM URL parameter
  useEffect(() => {
    const sourcePMId = searchParams.get('sourcePM');
    if (sourcePMId) {
      setPreSelectedPMId(sourcePMId);
      setShowCreateForm(true);
      searchParams.delete('sourcePM');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Handle detail URL parameter (chain navigation from Liquidation)
  useEffect(() => {
    const detailId = searchParams.get('detail');
    if (detailId && engagements.length > 0) {
      const found = engagements.find((e) => e.id === detailId);
      if (found) {
        setSelectedEngagement(found);
        setShowDetails(true);
      }
      searchParams.delete('detail');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, engagements]);

  const handleCreateFromPM = (pmId: string) => {
    setPreSelectedPMId(pmId);
    setShowCreateForm(true);
  };

  const handleCreateLiquidation = (engagementId: string) => {
    navigate(`/liquidations?sourceEngagement=${engagementId}`);
  };

  const filterEngagements = (list: Engagement[], applyAdvancedFilters = false) => {
    let filtered = list.filter(
      (eng) =>
        eng.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eng.objet.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eng.fournisseur?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        false
    );

    // Filtres avancés (uniquement sur onglet Tous)
    if (applyAdvancedFilters) {
      if (filterDirection !== 'all') {
        filtered = filtered.filter(
          (eng) => (eng.budget_line?.direction?.sigle || '') === filterDirection
        );
      }
      if (filterStatut !== 'all') {
        filtered = filtered.filter((eng) => eng.statut === filterStatut);
      }
    }

    return filtered;
  };

  const resetFilters = () => {
    setFilterDirection('all');
    setFilterStatut('all');
  };

  // P3 — Raccourcis clavier DG (V = valider, R = rejeter le 1er engagement à signer)
  const handleKeyboardShortcut = useCallback(
    (e: KeyboardEvent) => {
      // Ignorer si un dialog est ouvert, un input est focus, ou pas DG
      if (!(isDG && !isAdmin)) return;
      if (activeTab !== 'a_valider') return;
      if (
        showValidateDialog ||
        showRejectDialog ||
        showDeferDialog ||
        showDetails ||
        showDegageDialog
      )
        return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
        return;

      const firstEngagement = filterEngagements(dgASignerDG)[0];
      if (!firstEngagement) return;

      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        handleValidate(firstEngagement);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleReject(firstEngagement);
      }
    },
    [
      isDG,
      isAdmin,
      activeTab,
      showValidateDialog,
      showRejectDialog,
      showDeferDialog,
      showDetails,
      showDegageDialog,
      dgASignerDG,
      searchQuery,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyboardShortcut);
    return () => window.removeEventListener('keydown', handleKeyboardShortcut);
  }, [handleKeyboardShortcut]);

  // Pagination helper — slice client-side data for current page
  const paginateList = (list: Engagement[]) => {
    const start = (page - 1) * pageSize;
    return list.slice(start, start + pageSize);
  };

  // Reset to page 1 when search query, filters or tab changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, activeTab, filterDirection, filterStatut]);

  const handleView = (engagement: Engagement) => {
    setSelectedEngagement(engagement);
    setShowDetails(true);
  };

  const handleValidate = (engagement: Engagement) => {
    setSelectedEngagement(engagement);
    setShowValidateDialog(true);
  };

  const handleReject = (engagement: Engagement) => {
    setSelectedEngagement(engagement);
    setShowRejectDialog(true);
  };

  const handleDefer = (engagement: Engagement) => {
    setSelectedEngagement(engagement);
    setShowDeferDialog(true);
  };

  const handlePrint = (engagement: Engagement) => {
    setSelectedEngagement(engagement);
    setShowPrintDialog(true);
  };

  const handleDegage = (engagement: Engagement) => {
    setSelectedEngagement(engagement);
    setShowDegageDialog(true);
  };

  const confirmValidate = async (id: string, comments?: string) => {
    await validateEngagement({ id, comments });
    setShowValidateDialog(false);
    setSelectedEngagement(null);
  };

  const confirmReject = async (id: string, reason: string) => {
    await rejectEngagement({ id, reason });
    setShowRejectDialog(false);
    setSelectedEngagement(null);
  };

  const confirmDefer = async (id: string, motif: string, dateReprise?: string) => {
    await deferEngagement({ id, motif, dateReprise });
    setShowDeferDialog(false);
    setSelectedEngagement(null);
  };

  const confirmDegage = async (id: string, montant_degage: number, motif: string) => {
    await degageEngagement({ id, montant: montant_degage, motif });
    setShowDegageDialog(false);
    setSelectedEngagement(null);
  };

  const totalMontant = dirEngagements.reduce((acc, e) => acc + e.montant, 0);

  // Taux moyen de consommation : totalMontant / sum(dotation_initiale unique par budget_line)
  const uniqueBudgetLines = new Map<string, number>();
  for (const eng of dirEngagements) {
    if (
      eng.budget_line?.id &&
      eng.budget_line.dotation_initiale &&
      !uniqueBudgetLines.has(eng.budget_line.id)
    ) {
      uniqueBudgetLines.set(eng.budget_line.id, eng.budget_line.dotation_initiale);
    }
  }
  const totalDotation = Array.from(uniqueBudgetLines.values()).reduce((acc, d) => acc + d, 0);
  const tauxMoyen = totalDotation > 0 ? (totalMontant / totalDotation) * 100 : 0;

  // Alertes budgétaires : nombre de lignes à >80% de consommation
  const budgetLineEngages = new Map<string, number>();
  for (const eng of dirEngagements) {
    if (eng.budget_line?.id && eng.statut !== 'rejete' && eng.statut !== 'annule') {
      budgetLineEngages.set(
        eng.budget_line.id,
        (budgetLineEngages.get(eng.budget_line.id) || 0) + eng.montant
      );
    }
  }
  let lignesEnAlerte = 0;
  for (const [blId, totalEng] of budgetLineEngages) {
    const dotation = uniqueBudgetLines.get(blId);
    if (dotation && dotation > 0 && (totalEng / dotation) * 100 > 80) {
      lignesEnAlerte++;
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Indicateur de workflow */}
      <WorkflowStepIndicator currentStep={5} />

      {/* Aide contextuelle */}
      <ModuleHelp {...MODULE_HELP_CONFIG.engagements} />

      {/* Page Header */}
      <PageHeader
        title="Engagements"
        description="Gestion des engagements budgétaires"
        icon={CreditCard}
        stepNumber={6}
        backUrl="/"
      >
        {engagementViaDelegation && (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <User className="h-3 w-3 mr-1" />
            Validation par délégation
            {engagementDelegatorInfo ? ` du ${engagementDelegatorInfo.role}` : ''}
          </Badge>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2" disabled={isExporting}>
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              Exporter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover">
            <DropdownMenuItem onClick={() => exportExcel(dirEngagements, undefined, exercice)}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel (2 feuilles)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportPDF(dirEngagements, undefined, exercice)}>
              <FileText className="mr-2 h-4 w-4" />
              PDF (rapport)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportCSV(dirEngagements, undefined, exercice)}>
              <FileText className="mr-2 h-4 w-4" />
              CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {(canValidateEngagementFinal || dirAValider.length > 0) && (
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigate('/engagements/approbation')}
          >
            <ShieldCheck className="h-4 w-4" />
            Espace validation
            {dirAValider.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {dirAValider.length}
              </Badge>
            )}
          </Button>
        )}
        <PermissionGuard permission="engagement.create" showDelegationBadge>
          {isReadOnly ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button className="gap-2" disabled>
                  <Lock className="h-4 w-4" />
                  Nouvel engagement
                </Button>
              </TooltipTrigger>
              <TooltipContent>{getDisabledMessage()}</TooltipContent>
            </Tooltip>
          ) : (
            <Button className="gap-2" onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4" />
              Nouvel engagement
            </Button>
          )}
        </PermissionGuard>
      </PageHeader>

      {/* Stats Cards */}
      {isDG && !isAdmin && (
        <div className="grid gap-4 md:grid-cols-4">
          {/* KPI 1 — À signer */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">À signer</p>
                  {isLoading ? (
                    <Skeleton className="h-9 w-16 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold">{dgASignerDG.length}</p>
                  )}
                  {!isLoading && dgASignerDG.length > 0 && (
                    <p className="text-sm text-primary font-medium mt-1">
                      {formatCurrency(dgMontantASigner)}
                    </p>
                  )}
                  {!isLoading && dgUrgents > 0 && (
                    <Badge
                      variant="outline"
                      className="mt-1.5 gap-1 text-red-600 border-red-300 bg-red-50 text-xs"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      {dgUrgents} &gt; 7j
                    </Badge>
                  )}
                </div>
                <PenLine className="h-10 w-10 text-primary/30" />
              </div>
            </CardContent>
          </Card>

          {/* KPI 2 — Pipeline */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pipeline</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold">{dgPipeline.length}</p>
                  )}
                  {!isLoading && dgPipeline.length > 0 ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatCurrency(dgPipelineMontant)}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">Étapes 1-3</p>
                  )}
                </div>
                <Timer className="h-8 w-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>

          {/* KPI 3 — Traités */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Traités</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-success">{dgTraites}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">Validés + Rejetés</p>
                </div>
                <TrendingUp className="h-8 w-8 text-success/30" />
              </div>
            </CardContent>
          </Card>

          {/* KPI 4 — Taux de consommation budgétaire */}
          <Card>
            <CardContent className="pt-6">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Consommation</p>
                  {!isLoading && lignesEnAlerte > 0 && (
                    <Badge
                      variant="outline"
                      className="gap-1 text-orange-600 border-orange-300 bg-orange-50 text-xs"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      {lignesEnAlerte}
                    </Badge>
                  )}
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-20 mt-1" />
                ) : (
                  <>
                    <p className={`text-2xl font-bold mt-1 ${getTauxColorClass(tauxMoyen)}`}>
                      {tauxMoyen.toFixed(1)}%
                    </p>
                    <Progress value={Math.min(tauxMoyen, 100)} className="h-1.5 mt-2" />
                    {lignesEnAlerte > 0 && (
                      <p className="text-xs text-orange-600 mt-1">
                        {lignesEnAlerte} ligne{lignesEnAlerte > 1 ? 's' : ''} &gt;80%
                      </p>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!(isDG && !isAdmin) && (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold">{dirEngagements.length}</p>
                  )}
                </div>
                <CreditCard className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted-foreground">Montant total</p>
                {isLoading ? (
                  <Skeleton className="h-7 w-36" />
                ) : (
                  <p className="text-xl font-bold text-primary">{formatCurrency(totalMontant)}</p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">À valider</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-warning">{dirAValider.length}</p>
                  )}
                </div>
                <Clock className="h-8 w-8 text-warning/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Validés</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-success">{dirValides.length}</p>
                  )}
                </div>
                <CheckCircle className="h-8 w-8 text-success/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rejetés</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-destructive">{dirRejetes.length}</p>
                  )}
                </div>
                <XCircle className="h-8 w-8 text-destructive/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Taux consommation</p>
                  {!isLoading && lignesEnAlerte > 0 && (
                    <Badge
                      variant="outline"
                      className="gap-1 text-orange-600 border-orange-300 bg-orange-50"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      {lignesEnAlerte}
                    </Badge>
                  )}
                </div>
                {isLoading ? (
                  <Skeleton className="h-7 w-20 mt-1" />
                ) : (
                  <>
                    <p className={`text-xl font-bold ${getTauxColorClass(tauxMoyen)}`}>
                      {tauxMoyen.toFixed(1)}%
                    </p>
                    <Progress value={Math.min(tauxMoyen, 100)} className="h-1.5 mt-2" />
                    {lignesEnAlerte > 0 && (
                      <p className="text-xs text-orange-600 mt-1">
                        {lignesEnAlerte} ligne{lignesEnAlerte > 1 ? 's' : ''} &gt;80%
                      </p>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search + Filtres avancés */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro, objet ou fournisseur..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant={showFilters || hasActiveFilters ? 'default' : 'outline'}
              size="sm"
              className="gap-1.5 shrink-0"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              Filtres
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center text-xs">
                  {(filterDirection !== 'all' ? 1 : 0) + (filterStatut !== 'all' ? 1 : 0)}
                </Badge>
              )}
            </Button>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-muted-foreground"
                onClick={resetFilters}
              >
                <X className="h-3.5 w-3.5" />
                Effacer
              </Button>
            )}
          </div>
          {showFilters && (
            <div className="flex items-center gap-3 pt-1 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Direction</span>
                <Select value={filterDirection} onValueChange={setFilterDirection}>
                  <SelectTrigger className="w-[140px] h-8 text-sm">
                    <SelectValue placeholder="Toutes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    {uniqueDirections.map((dir) => (
                      <SelectItem key={dir} value={dir}>
                        {dir}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Statut</span>
                <Select value={filterStatut} onValueChange={setFilterStatut}>
                  <SelectTrigger className="w-[160px] h-8 text-sm">
                    <SelectValue placeholder="Tous" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="soumis">Soumis</SelectItem>
                    <SelectItem value="visa_saf">Visa Sous-Dir DAAF</SelectItem>
                    <SelectItem value="visa_cb">Visa CB</SelectItem>
                    <SelectItem value="visa_daaf">Visa DAAF</SelectItem>
                    <SelectItem value="valide">Validé</SelectItem>
                    <SelectItem value="rejete">Rejeté</SelectItem>
                    <SelectItem value="differe">Différé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          {isDG && !isAdmin ? (
            <>
              <TabsTrigger value="a_valider" className="gap-1">
                <PenLine className="h-3 w-3" />À signer ({dgASignerDG.length})
              </TabsTrigger>
              {dgPipeline.length > 0 && (
                <TabsTrigger value="pipeline" className="gap-1">
                  <Timer className="h-3 w-3" />
                  Pipeline ({dgPipeline.length})
                </TabsTrigger>
              )}
              <TabsTrigger value="tous">Tous ({dirEngagements.length})</TabsTrigger>
              <TabsTrigger value="valides">Validés ({dirValides.length})</TabsTrigger>
              <TabsTrigger value="rejetes">Rejetés ({dirRejetes.length})</TabsTrigger>
              <TabsTrigger value="suivi_budget" className="gap-1">
                <BarChart3 className="h-3 w-3" />
                Suivi budgétaire
              </TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger value="a_traiter" className="gap-1">
                <Tag className="h-3 w-3" />À traiter ({passationsValidees.length})
              </TabsTrigger>
              <TabsTrigger value="tous">Tous ({dirEngagements.length})</TabsTrigger>
              <TabsTrigger value="a_valider">À valider ({dirAValider.length})</TabsTrigger>
              <TabsTrigger value="valides">Validés ({dirValides.length})</TabsTrigger>
              <TabsTrigger value="rejetes">Rejetés ({dirRejetes.length})</TabsTrigger>
              <TabsTrigger value="differes">Différés ({dirDifferes.length})</TabsTrigger>
              <TabsTrigger value="suivi_budget" className="gap-1">
                <BarChart3 className="h-3 w-3" />
                Suivi budgétaire
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="tous" className="animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Tous les engagements
                {hasActiveFilters && (
                  <Badge variant="outline" className="text-xs font-normal gap-1">
                    <Filter className="h-3 w-3" />
                    Filtré
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {filterEngagements(dirEngagements, true).length} engagement(s)
                {hasActiveFilters && ` (sur ${dirEngagements.length} au total)`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EngagementList
                engagements={paginateList(filterEngagements(dirEngagements, true))}
                onView={handleView}
                onValidate={canValidateEngagementFinal ? handleValidate : undefined}
                onReject={canRejectEngagementFinal ? handleReject : undefined}
                onDefer={canDeferEngagementFinal ? handleDefer : undefined}
                onSubmit={canPerform('engagement.submit') ? submitEngagement : undefined}
                onResume={canPerform('engagement.resume') ? resumeEngagement : undefined}
                onDegage={canDegageEngagement ? handleDegage : undefined}
                onPrint={handlePrint}
                userRole={userRole}
                showDirection
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
          {(() => {
            const filtered = filterEngagements(dirEngagements, true);
            const totalPages = Math.ceil(filtered.length / pageSize);
            return (
              <NotesPagination
                page={page}
                pageSize={pageSize}
                total={filtered.length}
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

        {/* Onglet À traiter - PM validées */}
        <TabsContent value="a_traiter" className="animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                Passations de Marché à engager
              </CardTitle>
              <CardDescription>
                {passationsValidees.length} passation(s) validée(s) en attente d'engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Réf. PM</TableHead>
                      <TableHead>Objet (EB)</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Prestataire</TableHead>
                      <TableHead className="text-right">Montant retenu</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-4 w-28" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-48" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-4 w-24 ml-auto" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-8 w-20 ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : passationsValidees.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune passation de marché à traiter</p>
                  <p className="text-sm">Les PM validées apparaîtront ici</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Réf. PM</TableHead>
                      <TableHead>Objet (EB)</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Prestataire</TableHead>
                      <TableHead className="text-right">Montant retenu</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {passationsValidees.map((pm) => (
                      <TableRow key={pm.id}>
                        <TableCell className="font-mono text-sm">{pm.reference || '-'}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {pm.expression_besoin?.objet || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{pm.mode_passation}</Badge>
                        </TableCell>
                        <TableCell>{pm.prestataire_retenu?.raison_sociale || '-'}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(pm.montant_retenu || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          {!isDG && (
                            <Button size="sm" onClick={() => handleCreateFromPM(pm.id)}>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Engager
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="a_valider" className="animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle>
                {isDG && !isAdmin ? 'Engagements à signer' : 'Engagements à valider'}
              </CardTitle>
              <CardDescription className="flex items-center justify-between">
                <span>
                  {isDG && !isAdmin
                    ? `${filterEngagements(dgASignerDG).length} engagement(s) en attente de votre signature`
                    : `${filterEngagements(dirAValider).length} engagement(s) en attente de validation`}
                </span>
                {isDG && !isAdmin && filterEngagements(dgASignerDG).length > 0 && (
                  <span className="hidden md:flex items-center gap-2 text-xs text-muted-foreground/60">
                    <kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px] font-mono">
                      V
                    </kbd>
                    Signer
                    <kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px] font-mono">
                      R
                    </kbd>
                    Rejeter
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isDG && !isAdmin ? (
                filterEngagements(dgASignerDG).length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-success" />
                    <p className="font-medium">Aucun engagement à signer</p>
                    <p className="text-sm mt-1">Tous les engagements ont été traités</p>
                  </div>
                ) : (
                  <TooltipProvider>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Direction</TableHead>
                          <TableHead>Objet</TableHead>
                          <TableHead>Fournisseur</TableHead>
                          <TableHead className="text-right">Montant</TableHead>
                          <TableHead>Ancienneté</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filterEngagements(dgASignerDG).map((engagement) => {
                          const days = differenceInDays(
                            new Date(),
                            new Date(engagement.created_at)
                          );
                          const anciennete =
                            days <= 2
                              ? {
                                  label: 'Récent',
                                  className: 'bg-green-100 text-green-700 border-green-200',
                                }
                              : days <= 5
                                ? {
                                    label: `${days}j`,
                                    className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                                  }
                                : {
                                    label: `${days}j`,
                                    className: 'bg-red-100 text-red-700 border-red-200',
                                  };
                          return (
                            <TableRow key={engagement.id}>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="text-sm">
                                    {engagement.budget_line?.direction?.sigle ||
                                      engagement.budget_line?.direction?.label ||
                                      '-'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="max-w-[200px]">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="truncate block cursor-help">
                                      {engagement.objet}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    {engagement.objet}
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>
                              <TableCell className="text-sm">
                                {engagement.fournisseur || 'N/A'}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(engagement.montant)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={anciennete.className}>
                                  {anciennete.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="gap-1"
                                    onClick={() => handleView(engagement)}
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="gap-1"
                                    onClick={() => handleValidate(engagement)}
                                  >
                                    <CheckCircle className="h-3.5 w-3.5" />
                                    Signer
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1 text-destructive hover:text-destructive"
                                    onClick={() => handleReject(engagement)}
                                  >
                                    <XCircle className="h-3.5 w-3.5" />
                                    Rejeter
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TooltipProvider>
                )
              ) : (
                <EngagementList
                  engagements={filterEngagements(dirAValider)}
                  onView={handleView}
                  onValidate={canValidateEngagementFinal ? handleValidate : undefined}
                  onReject={canRejectEngagementFinal ? handleReject : undefined}
                  onDefer={canDeferEngagementFinal ? handleDefer : undefined}
                  onPrint={handlePrint}
                  userRole={userRole}
                  isLoading={isLoading}
                  emptyMessage="Aucun engagement en attente de validation"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pipeline DG : engagements aux étapes 1-3 */}
        {isDG && !isAdmin && (
          <TabsContent value="pipeline" className="animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5 text-primary" />
                  Pipeline de validation
                </CardTitle>
                <CardDescription>
                  {dgPipeline.length} engagement(s) aux étapes 1-3 avant votre signature
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EngagementList
                  engagements={filterEngagements(dgPipeline)}
                  onView={handleView}
                  onPrint={handlePrint}
                  userRole={userRole}
                  showDirection
                  showStepProgress
                  isLoading={isLoading}
                  emptyMessage="Aucun engagement dans le pipeline"
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Onglet Validés avec action Liquidation */}
        <TabsContent value="valides" className="animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle>Engagements validés</CardTitle>
              <CardDescription>
                {filterEngagements(dirValides).length} engagement(s) validé(s) - prêts pour
                liquidation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EngagementList
                engagements={paginateList(filterEngagements(dirValides))}
                onView={handleView}
                onDegage={canDegageEngagement ? handleDegage : undefined}
                onPrint={handlePrint}
                onCreateLiquidation={handleCreateLiquidation}
                userRole={userRole}
                isLoading={isLoading}
                emptyMessage="Aucun engagement validé"
              />
            </CardContent>
          </Card>
          {(() => {
            const filtered = filterEngagements(dirValides);
            const totalPages = Math.ceil(filtered.length / pageSize);
            return (
              <NotesPagination
                page={page}
                pageSize={pageSize}
                total={filtered.length}
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

        <TabsContent value="rejetes" className="animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle>Engagements rejetés</CardTitle>
              <CardDescription>
                {filterEngagements(dirRejetes).length} engagement(s) rejeté(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EngagementList
                engagements={filterEngagements(dirRejetes)}
                onView={handleView}
                onPrint={handlePrint}
                userRole={userRole}
                isLoading={isLoading}
                emptyMessage="Aucun engagement rejeté"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="differes" className="animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle>Engagements différés</CardTitle>
              <CardDescription>
                {filterEngagements(dirDifferes).length} engagement(s) différé(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EngagementList
                engagements={filterEngagements(dirDifferes)}
                onView={handleView}
                onResume={canPerform('engagement.resume') ? resumeEngagement : undefined}
                onPrint={handlePrint}
                userRole={userRole}
                isLoading={isLoading}
                emptyMessage="Aucun engagement différé"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suivi_budget" className="animate-fade-in">
          <SuiviBudgetaireEngagements engagements={dirEngagements} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <EngagementForm
        open={showCreateForm}
        onOpenChange={(open) => {
          setShowCreateForm(open);
          if (!open) setPreSelectedPMId(null);
        }}
        preSelectedPassationId={preSelectedPMId}
      />

      <EngagementDetails
        engagement={selectedEngagement}
        open={showDetails}
        onOpenChange={setShowDetails}
      />

      <EngagementValidateDialog
        engagement={selectedEngagement}
        open={showValidateDialog}
        onOpenChange={setShowValidateDialog}
        onConfirm={confirmValidate}
        onAutoReject={async (id, reason) => {
          await rejectEngagement({ id, reason });
          setShowValidateDialog(false);
          setSelectedEngagement(null);
        }}
        isLoading={isValidating}
      />

      <EngagementRejectDialog
        engagement={selectedEngagement}
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        onConfirm={confirmReject}
      />

      <EngagementDeferDialog
        engagement={selectedEngagement}
        open={showDeferDialog}
        onOpenChange={setShowDeferDialog}
        onConfirm={confirmDefer}
      />

      <EngagementPrintDialog
        engagement={selectedEngagement}
        open={showPrintDialog}
        onOpenChange={setShowPrintDialog}
      />

      <EngagementDegageDialog
        engagement={selectedEngagement}
        open={showDegageDialog}
        onOpenChange={setShowDegageDialog}
        onConfirm={confirmDegage}
        isLoading={isDegaging}
      />
    </div>
  );
}
