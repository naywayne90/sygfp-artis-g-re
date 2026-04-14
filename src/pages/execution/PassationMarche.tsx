import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useExercice } from '@/contexts/ExerciceContext';
import {
  usePassationsMarche,
  PassationMarche,
  MODES_PASSATION,
  STATUTS,
  EBValidee,
  LotMarche,
} from '@/hooks/usePassationsMarche';
import { PassationMarcheForm, PassationDetails } from '@/components/passation-marche';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';
import { WorkflowStepIndicator } from '@/components/workflow/WorkflowStepIndicator';
import { usePermissions } from '@/hooks/usePermissions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  FileText,
  Search,
  Loader2,
  ShoppingCart,
  Tag,
  Eye,
  Send,
  MoreHorizontal,
  FolderOpen,
  Trash2,
  Gavel,
  Lock,
  ClipboardCheck,
  Award,
  ShieldCheck,
  FileSignature,
  Pencil,
  XCircle,
  Download,
  FileDown,
  FileSpreadsheet,
  Timer,
  Building2,
  Banknote,
  TrendingUp,
  ArrowRight,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3,
} from 'lucide-react';
import { exportPassationPDF } from '@/services/passationExportService';
import { usePassationExport } from '@/hooks/usePassationExport';
import { NotesPagination } from '@/components/shared/NotesPagination';

const getStatusBadge = (statut: string) => {
  const config = STATUTS[statut as keyof typeof STATUTS] || STATUTS.soumis;
  return <Badge className={config.color}>{config.label}</Badge>;
};

const getModeName = (value: string) => {
  return MODES_PASSATION.find((m) => m.value === value)?.label || value;
};

export default function PassationMarchePage() {
  const { exercice } = useExercice();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { hasAnyRole, isAdmin, userDirectionId } = usePermissions();
  const isDAAF = isAdmin || hasAnyRole(['DAAF']);
  const isDG = isAdmin || hasAnyRole(['DG']);
  const canManageWorkflow = isDAAF; // DAAF gère le workflow opérationnel
  const canApprove = isDG; // DG approuve/rejette les attributions
  const isDirectionAgent = !isDAAF && !isDG && !isAdmin;

  const {
    passations,
    ebValidees,
    counts,
    isLoading,
    error: loadError,
    refetch,
    deletePassation,
    publishPassation,
    closePassation,
    startEvaluationPassation,
    proposeAttributionPassation,
    approvePassation,
    rejectAttributionPassation,
    signPassation,
    // Pagination serveur
    page,
    setPage,
    pageSize,
    setPageSize,
    total,
    totalPages,
    statutFilter: _statutFilter,
    setStatutFilter,
  } = usePassationsMarche();

  const { exportExcel, exportPDF, exportCSV, isExporting } = usePassationExport();

  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(isDG && !isAdmin ? 'attribue' : 'a_traiter');

  // DG : ouvrir directement sur "Attribués" (fallback si isDG charge après le mount)
  useEffect(() => {
    if (isDG && !isAdmin) {
      setActiveTab('attribue');
      setStatutFilter('attribue');
    }
  }, [isDG, isAdmin, setStatutFilter]);
  const [sourceEB, setSourceEB] = useState<EBValidee | null>(null);
  const [isLoadingSource, setIsLoadingSource] = useState(false);

  // Dialogs
  const [selectedPassation, setSelectedPassation] = useState<PassationMarche | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectMotif, setRejectMotif] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Gérer sourceEB depuis l'URL
  useEffect(() => {
    const sourceEBId = searchParams.get('sourceEB');
    if (sourceEBId) {
      setIsLoadingSource(true);
      supabase
        .from('expressions_besoin')
        .select(
          `
          id, numero, objet, montant_estime, dossier_id, direction_id,
          direction:directions(id, label, sigle)
        `
        )
        .eq('id', sourceEBId)
        .single()
        .then(({ data, error }) => {
          setIsLoadingSource(false);
          if (error) {
            toast.error("Impossible de charger l'EB source");
            searchParams.delete('sourceEB');
            setSearchParams(searchParams, { replace: true });
          } else if (data) {
            setSourceEB(data as unknown as EBValidee);
            setShowForm(true);
          }
        });
    }
  }, [searchParams, setSearchParams]);

  const handleCloseForm = () => {
    setShowForm(false);
    setSourceEB(null);
    searchParams.delete('sourceEB');
    setSearchParams(searchParams, { replace: true });
  };

  const handleViewDetails = (pm: PassationMarche) => {
    setSelectedPassation(pm);
    setDetailsOpen(true);
  };

  const handleGoToDossier = (dossierId: string) => {
    navigate(`/recherche?dossier=${dossierId}`);
  };

  const handleRejectAttribution = async () => {
    if (!selectedPassation || !rejectMotif.trim()) return;
    setIsRejecting(true);
    try {
      await rejectAttributionPassation({ id: selectedPassation.id, motif: rejectMotif.trim() });
      setRejectDialogOpen(false);
      setRejectMotif('');
      refetch();
    } catch {
      // handled by mutation onError
    } finally {
      setIsRejecting(false);
    }
  };

  const handleTransition = async (action: string, pm?: PassationMarche) => {
    const target = pm || selectedPassation;
    if (!target) return;
    try {
      switch (action) {
        case 'publish':
          await publishPassation({ id: target.id });
          break;
        case 'close':
          await closePassation(target.id);
          break;
        case 'startEvaluation':
          await startEvaluationPassation(target.id);
          break;
        case 'award':
          await proposeAttributionPassation(target.id);
          break;
        case 'approve':
          await approvePassation(target.id);
          break;
        case 'sign':
          await signPassation({ id: target.id, contratUrl: target.contrat_url || '' });
          break;
      }
      setDetailsOpen(false);
      refetch();
    } catch {
      // errors handled by mutation onError
    }
  };

  // Direction filtering for EB list (client-side, small dataset)
  const directionEBs =
    isDirectionAgent && userDirectionId
      ? ebValidees.filter((eb) => eb.direction_id === userDirectionId)
      : ebValidees;

  // Direction filtering for lifecycle tabs (client-side)
  const directionPassations =
    isDirectionAgent && userDirectionId
      ? passations.filter((p) => p.expression_besoin?.direction_id === userDirectionId)
      : passations;

  // Client-side search on direction-filtered results
  const filteredPassations = searchTerm
    ? directionPassations.filter(
        (p) =>
          p.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.expression_besoin?.objet?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : directionPassations;

  // Handle tab change: set server filter + reset page
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'a_traiter') {
      setStatutFilter(null);
    } else {
      setStatutFilter(tab);
    }
  };

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm, setPage]);

  // DG KPIs : montant total des attribués en attente d'approbation
  const dgAttribues = isDG && !isAdmin ? passations.filter((p) => p.statut === 'attribue') : [];
  const dgMontantAttribues = dgAttribues.reduce(
    (sum, p) => sum + (p.montant_retenu || p.expression_besoin?.montant_estime || 0),
    0
  );
  const dgPipeline =
    (counts.soumis || 0) +
    (counts.publie || 0) +
    (counts.cloture || 0) +
    (counts.en_evaluation || 0);
  const dgRejetees = counts.rejete || 0;

  // Helper : badge ancienneté pour DG
  const getAncienneteBadge = (dateStr: string) => {
    const days = differenceInDays(new Date(), new Date(dateStr));
    if (days <= 1)
      return <Badge className="bg-green-100 text-green-700 border-green-200">Récent</Badge>;
    if (days <= 3)
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200">{days}j</Badge>;
    if (days <= 7)
      return <Badge className="bg-orange-100 text-orange-700 border-orange-200">{days}j</Badge>;
    return <Badge className="bg-red-100 text-red-700 border-red-200">{days}j</Badge>;
  };

  if (isLoading || isLoadingSource) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Skeleton KPI cards */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-1 pt-3 px-3">
                <Skeleton className="h-3 w-16" />
              </CardHeader>
              <CardContent className="pb-3 px-3">
                <Skeleton className="h-7 w-10" />
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Skeleton table rows */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Skeleton className="h-9 w-full" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-destructive">Erreur lors du chargement des passations</p>
        <p className="text-sm text-muted-foreground">{(loadError as Error).message}</p>
        <Button variant="outline" onClick={() => refetch()}>
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <WorkflowStepIndicator currentStep={4} />

      <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="page-title">Passation de Marché</h1>
          <p className="page-description">
            Gestion des procédures de passation depuis les EB validées - Exercice {exercice}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isExporting}
                data-testid="export-dropdown-btn"
              >
                {isExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Exporter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              <DropdownMenuItem onClick={() => exportExcel()}>
                <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                Excel complet (4 feuilles)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportPDF()}>
                <FileText className="mr-2 h-4 w-4 text-red-600" />
                PDF rapport
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => exportCSV()}>
                <FileDown className="mr-2 h-4 w-4 text-blue-600" />
                CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {canApprove && counts.attribue > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/execution/passation-marche/approbation')}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Approbation DG ({counts.attribue})
            </Button>
          )}
          {canManageWorkflow && (
            <Button onClick={() => setShowForm(true)}>
              <Gavel className="mr-2 h-4 w-4" />
              Nouvelle passation
            </Button>
          )}
        </div>
      </div>

      {/* KPIs — DG: 4 cartes focalisées / Standard: 8 lifecycle cards */}
      {isDG && !isAdmin ? (
        <>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-4" data-testid="kpi-cards">
            {/* Carte principale : À approuver */}
            <Card
              className="cursor-pointer hover:ring-2 ring-primary/50 md:col-span-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background"
              onClick={() => handleTabChange('attribue')}
            >
              <CardContent className="pt-6 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">À approuver</p>
                    <p className="text-3xl font-bold mt-1">{counts.attribue}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      passation{counts.attribue > 1 ? 's' : ''} en attente d'approbation
                    </p>
                    {dgMontantAttribues > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        <Banknote className="h-3.5 w-3.5 text-purple-500" />
                        <span className="text-sm font-semibold text-purple-700">
                          {formatCurrency(dgMontantAttribues)}
                        </span>
                      </div>
                    )}
                  </div>
                  <Award className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            {/* Pipeline en cours */}
            <Card
              className="cursor-pointer hover:ring-2 ring-primary/50"
              onClick={() => handleTabChange('soumis')}
            >
              <CardContent className="pt-6 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-600">Pipeline en cours</p>
                    <p className="text-2xl font-bold mt-1">{dgPipeline}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {counts.soumis > 0 && `${counts.soumis} soumis`}
                      {counts.soumis > 0 &&
                        (counts.publie > 0 || counts.cloture > 0 || counts.en_evaluation > 0) &&
                        ' · '}
                      {counts.publie > 0 && `${counts.publie} publiés`}
                      {counts.publie > 0 &&
                        (counts.cloture > 0 || counts.en_evaluation > 0) &&
                        ' · '}
                      {counts.cloture > 0 && `${counts.cloture} clôturés`}
                      {counts.cloture > 0 && counts.en_evaluation > 0 && ' · '}
                      {counts.en_evaluation > 0 && `${counts.en_evaluation} en éval.`}
                      {dgPipeline === 0 && 'Aucune en cours'}
                    </p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-amber-400" />
                </div>
              </CardContent>
            </Card>

            {/* Approuvées + Signées */}
            <Card
              className="cursor-pointer hover:ring-2 ring-primary/50"
              onClick={() => handleTabChange('approuve')}
            >
              <CardContent className="pt-6 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Traitées</p>
                    <p className="text-2xl font-bold mt-1 text-green-600">
                      {(counts.approuve || 0) + (counts.signe || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {counts.approuve > 0 && `${counts.approuve} approuvées`}
                      {counts.approuve > 0 && counts.signe > 0 && ' · '}
                      {counts.signe > 0 && `${counts.signe} signées`}
                      {(counts.approuve || 0) + (counts.signe || 0) === 0 && 'Aucune traitée'}
                    </p>
                  </div>
                  <ShieldCheck className="h-6 w-6 text-green-400" />
                </div>
              </CardContent>
            </Card>

            {/* Rejetées (visible uniquement si > 0) */}
            {dgRejetees > 0 && (
              <Card
                className="cursor-pointer hover:ring-2 ring-primary/50 border-red-200"
                onClick={() => handleTabChange('rejete')}
              >
                <CardContent className="pt-6 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-600">Rejetées</p>
                      <p className="text-2xl font-bold mt-1 text-red-600">{dgRejetees}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        attribution(s) rejetée(s)
                      </p>
                    </div>
                    <XCircle className="h-6 w-6 text-red-400" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Pipeline DG : progression visuelle des passations vers l'approbation */}
          <Card className="border-dashed">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Progression du pipeline
                </span>
              </div>
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {[
                  { key: 'soumis', label: 'Soumis', count: counts.soumis || 0, icon: FileText },
                  { key: 'publie', label: 'Publiés', count: counts.publie || 0, icon: Send },
                  { key: 'cloture', label: 'Clôturés', count: counts.cloture || 0, icon: Lock },
                  {
                    key: 'en_evaluation',
                    label: 'Évaluation',
                    count: counts.en_evaluation || 0,
                    icon: ClipboardCheck,
                  },
                  {
                    key: 'attribue',
                    label: 'Attribution',
                    count: counts.attribue || 0,
                    icon: Award,
                  },
                  {
                    key: 'approuve',
                    label: 'Approuvé DG',
                    count: counts.approuve || 0,
                    icon: ShieldCheck,
                  },
                  { key: 'signe', label: 'Signé', count: counts.signe || 0, icon: FileSignature },
                ].map((step, i, arr) => {
                  const Icon = step.icon;
                  const isActive = step.count > 0;
                  const isDGStep = step.key === 'attribue';
                  return (
                    <div key={step.key} className="flex items-center">
                      <button
                        onClick={() => handleTabChange(step.key)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap
                        ${
                          isDGStep
                            ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-300 dark:bg-purple-900/30 dark:text-purple-300'
                            : isActive
                              ? 'bg-primary/10 text-primary hover:bg-primary/20'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        <Icon className="h-3 w-3" />
                        {step.label}
                        {step.count > 0 && (
                          <span
                            className={`inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold px-1
                          ${isDGStep ? 'bg-purple-600 text-white' : 'bg-primary text-primary-foreground'}`}
                          >
                            {step.count}
                          </span>
                        )}
                      </button>
                      {i < arr.length - 1 && (
                        <ChevronRight
                          className={`h-3.5 w-3.5 mx-0.5 flex-shrink-0 ${
                            isActive ? 'text-primary/50' : 'text-muted-foreground/30'
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <div
          className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-8"
          data-testid="kpi-cards"
        >
          <Card
            className="cursor-pointer hover:ring-2 ring-primary/50"
            onClick={() => handleTabChange('a_traiter')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
              <CardTitle className="text-xs font-medium text-muted-foreground">À traiter</CardTitle>
              <Tag className="h-3.5 w-3.5 text-primary" />
            </CardHeader>
            <CardContent className="pb-3 px-3">
              <div className="text-xl font-bold">{directionEBs.length}</div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:ring-2 ring-primary/50"
            onClick={() => handleTabChange('soumis')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
              <CardTitle className="text-xs font-medium text-muted-foreground">Soumis</CardTitle>
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pb-3 px-3">
              <div className="text-xl font-bold">{counts.soumis}</div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:ring-2 ring-primary/50"
            onClick={() => handleTabChange('publie')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
              <CardTitle className="text-xs font-medium text-cyan-600">Publiés</CardTitle>
              <Send className="h-3.5 w-3.5 text-cyan-500" />
            </CardHeader>
            <CardContent className="pb-3 px-3">
              <div className="text-xl font-bold">{counts.publie}</div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:ring-2 ring-primary/50"
            onClick={() => handleTabChange('cloture')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
              <CardTitle className="text-xs font-medium text-indigo-600">Clôturés</CardTitle>
              <Lock className="h-3.5 w-3.5 text-indigo-500" />
            </CardHeader>
            <CardContent className="pb-3 px-3">
              <div className="text-xl font-bold">{counts.cloture}</div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:ring-2 ring-primary/50"
            onClick={() => handleTabChange('en_evaluation')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
              <CardTitle className="text-xs font-medium text-amber-600">En éval.</CardTitle>
              <ClipboardCheck className="h-3.5 w-3.5 text-amber-500" />
            </CardHeader>
            <CardContent className="pb-3 px-3">
              <div className="text-xl font-bold">{counts.en_evaluation}</div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:ring-2 ring-primary/50"
            onClick={() => handleTabChange('attribue')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
              <CardTitle className="text-xs font-medium text-purple-600">Attribués</CardTitle>
              <Award className="h-3.5 w-3.5 text-purple-500" />
            </CardHeader>
            <CardContent className="pb-3 px-3">
              <div className="text-xl font-bold">{counts.attribue}</div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:ring-2 ring-primary/50"
            onClick={() => handleTabChange('approuve')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
              <CardTitle className="text-xs font-medium text-green-600">Approuvés</CardTitle>
              <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
            </CardHeader>
            <CardContent className="pb-3 px-3">
              <div className="text-xl font-bold">{counts.approuve}</div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:ring-2 ring-primary/50"
            onClick={() => handleTabChange('signe')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
              <CardTitle className="text-xs font-medium text-emerald-600">Signés</CardTitle>
              <FileSignature className="h-3.5 w-3.5 text-emerald-500" />
            </CardHeader>
            <CardContent className="pb-3 px-3">
              <div className="text-xl font-bold">{counts.signe}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerte si aucune EB validée (masquée pour DG) */}
      {!isDG && directionEBs.length === 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <ShoppingCart className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800 dark:text-amber-300">
                  Expression de Besoin validée requise
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  Pour créer une Passation de Marché, vous devez d'abord disposer d'au moins une
                  Expression de Besoin validée. Rendez-vous sur la page{' '}
                  <a href="/execution/expression-besoin" className="underline font-medium">
                    Expression de Besoin
                  </a>{' '}
                  pour en créer ou valider une.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recherche */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par référence ou objet..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="flex w-full overflow-x-auto">
              {/* Onglet EB masqué pour DG */}
              {!(isDG && !isAdmin) && (
                <TabsTrigger value="a_traiter" className="gap-1 text-xs px-2">
                  <Tag className="h-3 w-3" />
                  EB
                  <Badge variant="secondary" className="ml-0.5 text-[10px] h-4 px-1">
                    {directionEBs.length}
                  </Badge>
                </TabsTrigger>
              )}
              <TabsTrigger value="soumis" className="text-xs px-2">
                Soumis ({counts.soumis})
              </TabsTrigger>
              <TabsTrigger value="publie" className="text-xs px-2">
                Publiés ({counts.publie})
              </TabsTrigger>
              <TabsTrigger value="cloture" className="text-xs px-2">
                Clôturés ({counts.cloture})
              </TabsTrigger>
              <TabsTrigger value="en_evaluation" className="text-xs px-2">
                Éval. ({counts.en_evaluation})
              </TabsTrigger>
              <TabsTrigger value="attribue" className="text-xs px-2">
                {isDG && !isAdmin ? (
                  <>
                    <Award className="h-3 w-3" />À approuver
                  </>
                ) : (
                  'Attribués'
                )}{' '}
                ({counts.attribue})
              </TabsTrigger>
              <TabsTrigger value="approuve" className="text-xs px-2">
                Approuvés ({counts.approuve})
              </TabsTrigger>
              <TabsTrigger value="signe" className="text-xs px-2">
                Signés ({counts.signe})
              </TabsTrigger>
            </TabsList>

            {/* Onglet EB à traiter (masqué pour DG) */}
            {!(isDG && !isAdmin) && (
              <TabsContent value="a_traiter" className="mt-4">
                {directionEBs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune expression de besoin à traiter</p>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Référence</TableHead>
                          <TableHead>Objet</TableHead>
                          <TableHead>Direction</TableHead>
                          <TableHead className="text-right">Montant estimé</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {directionEBs.map((eb) => (
                          <TableRow key={eb.id}>
                            <TableCell className="font-mono text-sm">{eb.numero || '-'}</TableCell>
                            <TableCell className="max-w-[250px] truncate">{eb.objet}</TableCell>
                            <TableCell>{eb.direction?.sigle || '-'}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(eb.montant_estime)}
                            </TableCell>
                            <TableCell className="text-right">
                              {canManageWorkflow && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSourceEB(eb as unknown as EBValidee);
                                    setShowForm(true);
                                  }}
                                >
                                  <Gavel className="mr-2 h-4 w-4" />
                                  Passation
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </TabsContent>
            )}

            {/* DG: table enrichie pour "À approuver" (attribue) */}
            {isDG && !isAdmin && (
              <TabsContent value="attribue" className="mt-4">
                {activeTab === 'attribue' && filteredPassations.length === 0 ? (
                  dgPipeline > 0 ? (
                    /* Empty state enrichi : pipeline en cours mais rien à approuver */
                    <div className="py-8">
                      <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-3">
                          <Clock className="h-7 w-7 text-purple-500" />
                        </div>
                        <p className="font-semibold text-lg">
                          Aucune passation en attente d'approbation
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {dgPipeline} passation{dgPipeline > 1 ? 's' : ''} en cours dans le
                          pipeline
                        </p>
                      </div>

                      {/* Mini-funnel : où en sont les passations */}
                      <div className="max-w-lg mx-auto">
                        <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-3 justify-center">
                          <BarChart3 className="h-3.5 w-3.5" />
                          Progression vers votre approbation
                        </div>
                        <div className="space-y-2">
                          {[
                            {
                              key: 'soumis',
                              label: 'Soumis',
                              count: counts.soumis || 0,
                              color: 'bg-slate-400',
                              desc: 'En attente de publication',
                            },
                            {
                              key: 'publie',
                              label: 'Publiés',
                              count: counts.publie || 0,
                              color: 'bg-cyan-500',
                              desc: "Appel d'offres ouvert",
                            },
                            {
                              key: 'cloture',
                              label: 'Clôturés',
                              count: counts.cloture || 0,
                              color: 'bg-indigo-500',
                              desc: 'Réception terminée',
                            },
                            {
                              key: 'en_evaluation',
                              label: 'En évaluation',
                              count: counts.en_evaluation || 0,
                              color: 'bg-amber-500',
                              desc: 'Analyse des offres',
                            },
                          ]
                            .filter((s) => s.count > 0)
                            .map((step) => (
                              <button
                                key={step.key}
                                onClick={() => handleTabChange(step.key)}
                                className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left group"
                              >
                                <div className={`w-2 h-8 rounded-full ${step.color}`} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-sm">{step.label}</span>
                                    <Badge variant="secondary" className="font-mono">
                                      {step.count}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                            ))}
                          {/* Destination : DG */}
                          <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/10">
                            <div className="w-2 h-8 rounded-full bg-purple-500" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-purple-700 dark:text-purple-300">
                                  Approbation DG
                                </span>
                                <ArrowRight className="h-3.5 w-3.5 text-purple-400" />
                                <span className="text-xs text-purple-500">Vous</span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Les passations attribuées arriveront ici
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Empty state standard : rien du tout dans le pipeline */
                    <div className="text-center py-12 text-muted-foreground">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-400" />
                      <p className="font-medium text-green-700 dark:text-green-400">
                        Tout est à jour
                      </p>
                      <p className="text-sm mt-1">Aucune passation en cours dans le pipeline</p>
                    </div>
                  )
                ) : (
                  <TooltipProvider>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Référence</TableHead>
                          <TableHead>Objet</TableHead>
                          <TableHead>Direction</TableHead>
                          <TableHead>Mode</TableHead>
                          <TableHead className="text-right">Montant</TableHead>
                          <TableHead>Prestataire</TableHead>
                          <TableHead>Ancienneté</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPassations.map((pm) => (
                          <TableRow key={pm.id}>
                            <TableCell className="font-mono text-sm">
                              {pm.reference || '-'}
                            </TableCell>
                            <TableCell className="max-w-[200px]">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="truncate block cursor-help">
                                    {pm.expression_besoin?.objet || '-'}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="max-w-sm">
                                  <p className="text-xs font-medium">
                                    EB : {pm.expression_besoin?.numero || '-'}
                                  </p>
                                  <p className="text-xs mt-1">{pm.expression_besoin?.objet}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                {pm.expression_besoin?.direction?.sigle || '-'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {getModeName(pm.mode_passation)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(
                                pm.montant_retenu || pm.expression_besoin?.montant_estime
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {pm.prestataire_retenu?.raison_sociale || '-'}
                            </TableCell>
                            <TableCell>
                              {pm.attribue_at && getAncienneteBadge(pm.attribue_at)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => handleViewDetails(pm)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Voir détails</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                      onClick={() => handleTransition('approve', pm)}
                                    >
                                      <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                                      Approuver
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Approuver cette attribution</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-destructive border-destructive/30 hover:bg-destructive/10"
                                      onClick={() => {
                                        setSelectedPassation(pm);
                                        setRejectDialogOpen(true);
                                      }}
                                    >
                                      <XCircle className="mr-1 h-3.5 w-3.5" />
                                      Rejeter
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Rejeter cette attribution</TooltipContent>
                                </Tooltip>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TooltipProvider>
                )}
                {activeTab === 'attribue' && totalPages > 1 && (
                  <div className="mt-4" data-testid="pagination">
                    <NotesPagination
                      page={page}
                      pageSize={pageSize}
                      total={total}
                      totalPages={totalPages}
                      onPageChange={setPage}
                      onPageSizeChange={setPageSize}
                      pageSizeOptions={[10, 20, 50]}
                    />
                  </div>
                )}
              </TabsContent>
            )}

            {/* Lifecycle tabs — server-paginated (standard, skip attribue for DG) */}
            {(isDG && !isAdmin
              ? ['soumis', 'publie', 'cloture', 'en_evaluation', 'approuve', 'signe']
              : ['soumis', 'publie', 'cloture', 'en_evaluation', 'attribue', 'approuve', 'signe']
            ).map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-4">
                {activeTab === tab && filteredPassations.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Gavel className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune passation dans cet onglet</p>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Référence</TableHead>
                          <TableHead>EB Source</TableHead>
                          <TableHead>Mode</TableHead>
                          <TableHead className="text-center">Nb lots</TableHead>
                          <TableHead className="text-right">Montant retenu</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Créé le</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPassations.map((pm) => (
                          <TableRow key={pm.id}>
                            <TableCell className="font-mono text-sm">
                              {pm.reference || '-'}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {pm.expression_besoin?.numero || pm.expression_besoin?.objet || '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{getModeName(pm.mode_passation)}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="font-mono">
                                {pm.allotissement && ((pm.lots as LotMarche[]) || []).length > 0
                                  ? (pm.lots as LotMarche[]).length
                                  : 1}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(pm.montant_retenu)}
                            </TableCell>
                            <TableCell>{getStatusBadge(pm.statut)}</TableCell>
                            <TableCell>
                              {format(new Date(pm.created_at), 'dd MMM yyyy', { locale: fr })}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-popover">
                                  {/* Tout le monde peut voir les détails */}
                                  <DropdownMenuItem onClick={() => handleViewDetails(pm)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Voir détails
                                  </DropdownMenuItem>

                                  <DropdownMenuItem onClick={() => exportPassationPDF(pm)}>
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Exporter PDF
                                  </DropdownMenuItem>

                                  {pm.dossier_id && (
                                    <DropdownMenuItem
                                      onClick={() => handleGoToDossier(pm.dossier_id as string)}
                                    >
                                      <FolderOpen className="mr-2 h-4 w-4" />
                                      Voir le dossier
                                    </DropdownMenuItem>
                                  )}

                                  {/* DAAF: Modifier (soumis) */}
                                  {canManageWorkflow && pm.statut === 'soumis' && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => handleViewDetails(pm)}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Modifier
                                      </DropdownMenuItem>
                                    </>
                                  )}

                                  {/* DAAF: Publier (soumis) */}
                                  {canManageWorkflow && pm.statut === 'soumis' && (
                                    <DropdownMenuItem
                                      onClick={() => handleTransition('publish', pm)}
                                    >
                                      <Send className="mr-2 h-4 w-4" />
                                      Publier
                                    </DropdownMenuItem>
                                  )}

                                  {/* DAAF: Clôturer (publié) */}
                                  {canManageWorkflow && pm.statut === 'publie' && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => handleTransition('close', pm)}
                                      >
                                        <Lock className="mr-2 h-4 w-4" />
                                        Clôturer
                                      </DropdownMenuItem>
                                    </>
                                  )}

                                  {/* DAAF: Lancer évaluation (clôturé) */}
                                  {canManageWorkflow && pm.statut === 'cloture' && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => handleTransition('startEvaluation', pm)}
                                      >
                                        <ClipboardCheck className="mr-2 h-4 w-4" />
                                        Lancer l'évaluation
                                      </DropdownMenuItem>
                                    </>
                                  )}

                                  {/* DAAF: Attribuer (en_evaluation) */}
                                  {canManageWorkflow && pm.statut === 'en_evaluation' && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => handleTransition('award', pm)}
                                      >
                                        <Award className="mr-2 h-4 w-4" />
                                        Attribuer
                                      </DropdownMenuItem>
                                    </>
                                  )}

                                  {/* DG: Approuver / Rejeter (attribué) */}
                                  {canApprove && pm.statut === 'attribue' && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => handleTransition('approve', pm)}
                                      >
                                        <ShieldCheck className="mr-2 h-4 w-4" />
                                        Approuver
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedPassation(pm);
                                          setRejectDialogOpen(true);
                                        }}
                                        className="text-destructive"
                                      >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Rejeter l'attribution
                                      </DropdownMenuItem>
                                    </>
                                  )}

                                  {/* DAAF: Signer le contrat (approuvé) */}
                                  {canManageWorkflow && pm.statut === 'approuve' && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => handleTransition('sign', pm)}
                                      >
                                        <FileSignature className="mr-2 h-4 w-4" />
                                        Signer le contrat
                                      </DropdownMenuItem>
                                    </>
                                  )}

                                  {/* DAAF/DG: Créer engagement (signé) */}
                                  {(canManageWorkflow || canApprove) && pm.statut === 'signe' && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => navigate(`/engagements?sourcePM=${pm.id}`)}
                                      >
                                        <FileText className="mr-2 h-4 w-4" />
                                        Créer engagement
                                      </DropdownMenuItem>
                                    </>
                                  )}

                                  {/* DAAF: Supprimer (soumis uniquement) */}
                                  {canManageWorkflow && pm.statut === 'soumis' && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => deletePassation(pm.id)}
                                        className="text-destructive"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Supprimer
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {activeTab === tab && totalPages > 1 && (
                      <div className="mt-4" data-testid="pagination">
                        <NotesPagination
                          page={page}
                          pageSize={pageSize}
                          total={total}
                          totalPages={totalPages}
                          onPageChange={setPage}
                          onPageSizeChange={setPageSize}
                          pageSizeOptions={[10, 20, 50]}
                        />
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Form dialog */}
      <PassationMarcheForm
        open={showForm}
        onOpenChange={handleCloseForm}
        sourceEB={sourceEB}
        onSuccess={() => setActiveTab('soumis')}
      />

      {/* Details dialog */}
      {selectedPassation && (
        <PassationDetails
          passation={selectedPassation}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          onTransition={(action) => handleTransition(action)}
        />
      )}

      {/* Reject attribution dialog */}
      <Dialog
        open={rejectDialogOpen}
        onOpenChange={(open) => {
          setRejectDialogOpen(open);
          if (!open) setRejectMotif('');
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter l'attribution</DialogTitle>
            <DialogDescription>
              Passation {selectedPassation?.reference} — Indiquez le motif du rejet.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Motif du rejet de l'attribution..."
            value={rejectMotif}
            onChange={(e) => setRejectMotif(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectAttribution}
              disabled={!rejectMotif.trim() || isRejecting}
            >
              {isRejecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Rejeter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
