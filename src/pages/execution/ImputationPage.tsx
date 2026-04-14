import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useImputations, type Imputation, type ImputationStatus } from '@/hooks/useImputations';
import { useImputationsExport, type ImputationExportFilters } from '@/hooks/useImputationsExport';
import { useImputation } from '@/hooks/useImputation';
import { usePermissions } from '@/hooks/usePermissions';
import { ImputationForm } from '@/components/imputation/ImputationForm';
import { ImputationDetailSheet } from '@/components/imputation/ImputationDetailSheet';
import { ImputationRejectDialog } from '@/components/imputation/ImputationRejectDialog';
import { ImputationDeferDialog } from '@/components/imputation/ImputationDeferDialog';
import { ImputationValidationDialog } from '@/components/imputation/ImputationValidationDialog';
import { NotesPagination } from '@/components/shared/NotesPagination';
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
import { formatCurrency } from '@/lib/utils';
import { format, differenceInDays, differenceInHours } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Eye,
  Send,
  XCircle,
  Trash2,
  Search,
  MoreHorizontal,
  FolderOpen,
  Loader2,
  Tag,
  ShoppingCart,
  Building2,
  Banknote,
  Download,
  User,
  Shield,
  Filter,
  TrendingUp,
  Wallet,
  Timer,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRBAC } from '@/contexts/RBACContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { WorkflowStepIndicator } from '@/components/workflow/WorkflowStepIndicator';
import { ModuleHelp, MODULE_HELP_CONFIG } from '@/components/help/ModuleHelp';
import { BudgetFormulas } from '@/components/budget/BudgetFormulas';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/** Note AEF source pour le dialog d'imputation */
interface SourceAefNote {
  id: string;
  numero: string | null;
  objet: string;
  montant_estime: number | null;
  statut: string | null;
  priorite: string | null;
  direction?: { id: string; label: string; sigle: string | null } | null;
  created_by_profile?: { id: string; first_name: string | null; last_name: string | null } | null;
}

const getStatusBadge = (status: string) => {
  const variants: Record<string, { label: string; className: string }> = {
    soumis: {
      label: 'Soumise',
      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    vise: {
      label: 'Visée CB',
      className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    },
    valide: { label: 'Validée DG', className: 'bg-success/10 text-success border-success/20' },
    rejete: {
      label: 'Rejetée',
      className: 'bg-destructive/10 text-destructive border-destructive/20',
    },
    differe: {
      label: 'Différée',
      className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    },
  };
  const variant = variants[status] || variants.soumis;
  return (
    <Badge variant="outline" className={variant.className}>
      {variant.label}
    </Badge>
  );
};

export default function ImputationPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { hasAnyRole } = usePermissions();
  const { isDG } = useRBAC();
  // Séparation des pouvoirs : CB vise, DG valide
  const canVisa = hasAnyRole(['CB', 'ADMIN']);
  const canValidate = hasAnyRole(['DG', 'ADMIN']);
  const canCreate = hasAnyRole(['DAAF', 'ADMIN']);

  // States — DG ouvre directement sur "Visées" (en attente validation DG)
  const [activeTab, setActiveTab] = useState(isDG ? 'visees' : 'a_imputer');
  useEffect(() => {
    if (isDG) setActiveTab('visees');
  }, [isDG]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sourceAefNote, setSourceAefNote] = useState<SourceAefNote | null>(null);
  const [viewingImputation, setViewingImputation] = useState<Imputation | null>(null);
  const [rejectingImputation, setRejectingImputation] = useState<Imputation | null>(null);
  const [deferringImputation, setDeferringImputation] = useState<Imputation | null>(null);
  const [validatingImputation, setValidatingImputation] = useState<Imputation | null>(null);

  // Mapping onglet → filtre statut serveur
  const tabStatutFilter = useMemo(
    (): Record<string, ImputationStatus | undefined> => ({
      a_imputer: undefined,
      soumises: 'soumis',
      visees: 'vise',
      validees: 'valide',
      differees: 'differe',
      rejetees: 'rejete',
    }),
    []
  );

  // Reset page quand on change d'onglet ou de recherche
  useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery]);

  // Hooks
  const { notesAImputer, loadingNotes } = useImputation();
  const {
    imputations,
    counts,
    totalCount,
    totalPages,
    isLoading: loadingImputations,
    refetch,
    viserImputation,
    validateImputation,
    rejectImputation,
    deferImputation,
    deleteImputation,
    isVisaing,
    isValidating,
  } = useImputations({
    search: searchQuery,
    statut: tabStatutFilter[activeTab],
    page,
    pageSize,
  });
  const { exportExcel, exportCSV, exportPDF, isExporting } = useImputationsExport();

  // Gérer le paramètre sourceAef depuis l'URL
  useEffect(() => {
    const sourceAefId = searchParams.get('sourceAef');
    if (sourceAefId) {
      supabase
        .from('notes_dg')
        .select(
          `
          *,
          direction:directions(id, label, sigle),
          created_by_profile:profiles!notes_dg_created_by_fkey(id, first_name, last_name)
        `
        )
        .eq('id', sourceAefId)
        .single()
        .then(({ data, error }) => {
          if (error) {
            toast({
              title: 'Erreur',
              description: 'Impossible de charger la note AEF source',
              variant: 'destructive',
            });
            searchParams.delete('sourceAef');
            setSearchParams(searchParams, { replace: true });
          } else if (data) {
            if (data.statut !== 'a_imputer') {
              toast({
                title: 'Note non imputable',
                description: `Cette note est en statut "${data.statut}" et ne peut pas être imputée.`,
                variant: 'destructive',
              });
              searchParams.delete('sourceAef');
              setSearchParams(searchParams, { replace: true });
            } else {
              setSourceAefNote(data);
            }
          }
        });
    }
  }, [searchParams, setSearchParams, toast]);

  const handleCloseImputationDialog = () => {
    setSourceAefNote(null);
    searchParams.delete('sourceAef');
    setSearchParams(searchParams, { replace: true });
  };

  const handleImputationSuccess = () => {
    handleCloseImputationDialog();
    setActiveTab('soumises');
    refetch();
    toast({
      title: 'Imputation créée',
      description: "L'imputation a été créée avec succès.",
    });
  };

  const handleReject = async (motif: string) => {
    if (rejectingImputation) {
      await rejectImputation({ id: rejectingImputation.id, motif });
      setRejectingImputation(null);
    }
  };

  const handleDefer = async (motif: string, dateReprise?: string) => {
    if (deferringImputation) {
      await deferImputation({ id: deferringImputation.id, motif, dateReprise });
      setDeferringImputation(null);
    }
  };

  const handleGoToDossier = (dossierId: string) => {
    navigate(`/recherche?dossier=${dossierId}`);
  };

  // KPIs pour l'onglet visa CB (soumises)
  const visaKpis = useMemo(() => {
    if (activeTab !== 'soumises') return { total: counts.soumis, montantTotal: 0, directions: 0 };
    return {
      total: totalCount,
      montantTotal: imputations.reduce((sum, i) => sum + (i.montant || 0), 0),
      directions: new Set(imputations.map((i) => i.direction_id).filter(Boolean)).size,
    };
  }, [activeTab, counts.soumis, totalCount, imputations]);

  // KPIs pour l'onglet validation DG (visées)
  const validationKpis = useMemo(() => {
    if (activeTab !== 'visees') return { total: counts.vise, montantTotal: 0, directions: 0 };
    return {
      total: totalCount,
      montantTotal: imputations.reduce((sum, i) => sum + (i.montant || 0), 0),
      directions: new Set(imputations.map((i) => i.direction_id).filter(Boolean)).size,
    };
  }, [activeTab, counts.vise, totalCount, imputations]);

  // Filtres d'export pour l'onglet actif
  const currentExportFilters = useMemo(
    (): ImputationExportFilters => ({
      statut: tabStatutFilter[activeTab],
      search: searchQuery || undefined,
    }),
    [activeTab, searchQuery, tabStatutFilter]
  );

  /** Color class for budget availability ratio */
  const getDisponibleColor = (ratio: number) => {
    if (ratio >= 90) return 'text-destructive font-bold';
    if (ratio >= 50) return 'text-orange-600 font-medium';
    return 'text-green-600 font-medium';
  };

  /** Format profile name for display */
  const getPersonName = (
    profile: { first_name: string | null; last_name: string | null } | null | undefined
  ) => {
    if (!profile) return null;
    const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    return name || null;
  };

  /** Ancienneté badge — depuis combien de temps le dossier attend */
  const getAncienneteBadge = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const days = differenceInDays(now, date);
    const hours = differenceInHours(now, date);
    if (days >= 7)
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200 text-xs whitespace-nowrap"
        >
          <Timer className="h-3 w-3 mr-1" />
          {days}j — Urgent
        </Badge>
      );
    if (days >= 3)
      return (
        <Badge
          variant="outline"
          className="bg-orange-50 text-orange-700 border-orange-200 text-xs whitespace-nowrap"
        >
          <Timer className="h-3 w-3 mr-1" />
          Depuis {days}j
        </Badge>
      );
    if (days >= 1)
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200 text-xs whitespace-nowrap"
        >
          Depuis {days}j
        </Badge>
      );
    return (
      <Badge
        variant="outline"
        className="bg-green-50 text-green-700 border-green-200 text-xs whitespace-nowrap"
      >
        {hours}h
      </Badge>
    );
  };

  /** Budget disponible badge — vert/orange/rouge selon couverture */
  const getBudgetBadge = (imp: Imputation) => {
    const bl = imp.budget_line;
    if (!bl) return <span className="text-xs text-muted-foreground">—</span>;
    const dotation = Math.max(bl.dotation_modifiee || 0, bl.dotation_initiale || 0);
    const disponible = dotation - (bl.total_engage || 0) - (bl.montant_reserve || 0);
    const apresImputation = disponible - imp.montant;
    const ratio = dotation > 0 ? ((bl.total_engage || 0) / dotation) * 100 : 0;

    if (apresImputation < 0)
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className="bg-red-50 text-red-700 border-red-200 text-xs cursor-help whitespace-nowrap"
            >
              Insuffisant
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="font-medium text-destructive">Budget insuffisant</p>
            <p>Disponible : {formatCurrency(Math.max(0, disponible))}</p>
            <p>Montant imputation : {formatCurrency(imp.montant)}</p>
            <p>Manque : {formatCurrency(Math.abs(apresImputation))}</p>
          </TooltipContent>
        </Tooltip>
      );
    if (ratio >= 80)
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className="bg-orange-50 text-orange-700 border-orange-200 text-xs cursor-help whitespace-nowrap"
            >
              {formatCurrency(apresImputation)}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="font-medium text-orange-600">
              Ligne tendue ({Math.round(ratio)}% engagé)
            </p>
            <p>Dotation : {formatCurrency(dotation)}</p>
            <p>Engagé : {formatCurrency(bl.total_engage || 0)}</p>
            <p>Disponible après : {formatCurrency(apresImputation)}</p>
          </TooltipContent>
        </Tooltip>
      );
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200 text-xs cursor-help whitespace-nowrap"
          >
            {formatCurrency(apresImputation)}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-medium text-green-600">
            Budget suffisant ({Math.round(ratio)}% engagé)
          </p>
          <p>Dotation : {formatCurrency(dotation)}</p>
          <p>Engagé : {formatCurrency(bl.total_engage || 0)}</p>
          <p>Disponible après : {formatCurrency(apresImputation)}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  // State filtre direction
  const [directionFilter, setDirectionFilter] = useState<string>('all');

  // Liste unique des directions (extraites des données)
  const uniqueDirections = useMemo(() => {
    const dirs = imputations
      .map((i) => i.direction)
      .filter((d): d is NonNullable<typeof d> => !!d)
      .reduce(
        (acc, d) => {
          if (!acc.find((x) => x.id === d.id)) acc.push(d);
          return acc;
        },
        [] as { id: string; label: string; sigle: string | null }[]
      );
    return dirs.sort((a, b) => (a.sigle || a.label).localeCompare(b.sigle || b.label));
  }, [imputations]);

  // Imputations filtrées par direction
  const filteredImputations = useMemo(() => {
    if (directionFilter === 'all') return imputations;
    return imputations.filter((i) => i.direction_id === directionFilter);
  }, [imputations, directionFilter]);

  // KPIs globaux DG — montants totaux par statut (calculés sur toutes les imputations de la page active)
  const globalKpis = useMemo(() => {
    const montantVise = imputations.reduce((sum, i) => sum + (i.montant || 0), 0);
    return { montantVise };
  }, [imputations]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6 animate-fade-in">
        {/* Indicateur de workflow */}
        <WorkflowStepIndicator currentStep={2} />

        <PageHeader
          title="Imputation"
          description="Imputation budgétaire"
          icon={Tag}
          stepNumber={3}
          backUrl="/"
        >
          <ModuleHelp {...MODULE_HELP_CONFIG.imputation} />
        </PageHeader>

        {/* Formules de référence */}
        <BudgetFormulas compact />

        {/* KPIs — adaptés au profil */}
        {isDG ? (
          /* === KPIs DG : focus sur ce qui attend sa décision === */
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Card principale : À valider par le DG */}
            <Card className="border-indigo-200 bg-indigo-50/30 lg:col-span-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-indigo-600">À valider par vous</p>
                    <div className="flex items-baseline gap-3 mt-1">
                      <p className="text-3xl font-bold text-indigo-700">{counts.vise}</p>
                      <span className="text-sm text-muted-foreground">
                        imputation{counts.vise > 1 ? 's' : ''}
                      </span>
                    </div>
                    {activeTab === 'visees' && validationKpis.montantTotal > 0 && (
                      <p className="text-lg font-semibold text-indigo-600 mt-1">
                        {formatCurrency(validationKpis.montantTotal)}
                      </p>
                    )}
                  </div>
                  <div className="h-14 w-14 rounded-full bg-indigo-100 flex items-center justify-center">
                    <FileText className="h-7 w-7 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pipeline : en attente visa CB */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">En attente visa CB</p>
                    <p className="text-2xl font-bold">{counts.soumis}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(notesAImputer?.length || 0) > 0 && `+ ${notesAImputer?.length} à imputer`}
                    </p>
                  </div>
                  <Clock className="h-7 w-7 text-blue-500 opacity-80" />
                </div>
              </CardContent>
            </Card>

            {/* Synthèse : validées + traitées */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Traitées</p>
                    <p className="text-2xl font-bold text-green-600">{counts.valide}</p>
                    <div className="flex gap-2 mt-0.5">
                      {counts.differe > 0 && (
                        <span className="text-xs text-orange-600">
                          {counts.differe} différée{counts.differe > 1 ? 's' : ''}
                        </span>
                      )}
                      {counts.rejete > 0 && (
                        <span className="text-xs text-destructive">
                          {counts.rejete} rejetée{counts.rejete > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <CheckCircle2 className="h-7 w-7 text-success opacity-80" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* === KPIs standard (non-DG) === */
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">À imputer</p>
                    <p className="text-2xl font-bold">{notesAImputer?.length || 0}</p>
                  </div>
                  <Tag className="h-8 w-8 text-primary opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">En attente visa CB</p>
                    <p className="text-2xl font-bold">{counts.soumis}</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500 opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">En attente validation DG</p>
                    <p className="text-2xl font-bold">{counts.vise}</p>
                  </div>
                  <FileText className="h-8 w-8 text-indigo-500 opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Validées</p>
                    <p className="text-2xl font-bold">{counts.valide}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-success opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Différées</p>
                    <p className="text-2xl font-bold">{counts.differe}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-orange-500 opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Rejetées</p>
                    <p className="text-2xl font-bold">{counts.rejete}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-destructive opacity-80" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recherche + Filtre direction + Exports */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-md min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par référence, objet, direction..."
              className="pl-9"
            />
          </div>

          {/* Filtre direction */}
          {uniqueDirections.length > 1 && (
            <Select value={directionFilter} onValueChange={setDirectionFilter}>
              <SelectTrigger className="w-[180px] gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les directions</SelectItem>
                {uniqueDirections.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.sigle || d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isExporting} className="gap-2">
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Exporter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              <DropdownMenuItem onClick={() => exportExcel(currentExportFilters, activeTab)}>
                Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportCSV(currentExportFilters, activeTab)}>
                CSV (.csv)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportPDF(currentExportFilters, activeTab)}>
                PDF (.pdf)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="a_imputer" className="gap-1 text-xs">
              <Tag className="h-4 w-4" />À imputer
              <Badge variant="secondary" className="ml-1">
                {notesAImputer?.length || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="soumises" className="gap-1 text-xs">
              <Clock className="h-4 w-4" />
              En attente CB
              <Badge variant="secondary" className="ml-1">
                {counts.soumis}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="visees" className="gap-1 text-xs">
              <FileText className="h-4 w-4" />
              {isDG ? 'À valider' : 'Visées par CB'}
              <Badge variant="secondary" className="ml-1">
                {counts.vise}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="validees" className="gap-1 text-xs">
              <CheckCircle2 className="h-4 w-4" />
              Validées
              <Badge variant="secondary" className="ml-1">
                {counts.valide}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="differees" className="gap-1 text-xs">
              <AlertCircle className="h-4 w-4" />
              Différées
              <Badge variant="secondary" className="ml-1">
                {counts.differe}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="rejetees" className="gap-1 text-xs">
              <XCircle className="h-4 w-4" />
              Rejetées
              <Badge variant="secondary" className="ml-1">
                {counts.rejete}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Onglet: Notes à imputer */}
          <TabsContent value="a_imputer" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                {loadingNotes ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : !notesAImputer?.length ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune note AEF à imputer</p>
                    <p className="text-sm mt-1">Les notes AEF validées apparaîtront ici</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Numéro</TableHead>
                          <TableHead>Objet</TableHead>
                          <TableHead>Direction</TableHead>
                          <TableHead className="text-right">Montant</TableHead>
                          <TableHead>Priorité</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {notesAImputer.map((note) => (
                          <TableRow key={note.id}>
                            <TableCell className="font-mono text-sm">
                              {note.numero || '-'}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">{note.objet}</TableCell>
                            <TableCell>
                              {note.direction?.sigle || note.direction?.label || '-'}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(note.montant_estime ?? 0)}
                            </TableCell>
                            <TableCell>
                              {note.priorite === 'urgente' && (
                                <Badge variant="destructive">Urgente</Badge>
                              )}
                              {note.priorite === 'haute' && (
                                <Badge className="bg-orange-500">Haute</Badge>
                              )}
                              {note.priorite === 'normale' && (
                                <Badge variant="secondary">Normale</Badge>
                              )}
                              {(!note.priorite || note.priorite === 'basse') && (
                                <Badge variant="outline">Basse</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/notes-aef/${note.id}`)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {canCreate && (
                                  <Button size="sm" onClick={() => setSourceAefNote(note)}>
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    Imputer
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet: Soumises — en attente du visa CB */}
          <TabsContent value="soumises" className="mt-4 space-y-4">
            {/* KPIs visa CB */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">En attente visa CB</p>
                      <p className="text-xl font-bold">{visaKpis.total}</p>
                    </div>
                    <Clock className="h-6 w-6 text-blue-500 opacity-80" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Montant total</p>
                      <p className="text-xl font-bold">{formatCurrency(visaKpis.montantTotal)}</p>
                    </div>
                    <Banknote className="h-6 w-6 text-primary opacity-80" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Directions</p>
                      <p className="text-xl font-bold">{visaKpis.directions}</p>
                    </div>
                    <Building2 className="h-6 w-6 text-muted-foreground opacity-80" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="pt-6">
                {loadingImputations ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : !imputations.length ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune imputation en attente de visa</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Référence</TableHead>
                          <TableHead>Objet</TableHead>
                          <TableHead>Imputé par</TableHead>
                          <TableHead>Direction</TableHead>
                          <TableHead className="text-right">Montant (FCFA)</TableHead>
                          <TableHead>Ligne budget</TableHead>
                          <TableHead className="text-right">Disponible</TableHead>
                          <TableHead>Créée le</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {imputations.map((imp) => {
                          const bl = imp.budget_line;
                          const dotation = bl
                            ? Math.max(bl.dotation_modifiee || 0, bl.dotation_initiale || 0)
                            : 0;
                          const disponible = bl
                            ? dotation - (bl.total_engage || 0) - imp.montant
                            : null;
                          const ratio =
                            bl && dotation > 0
                              ? (((bl.total_engage || 0) + imp.montant) / dotation) * 100
                              : 0;

                          return (
                            <TableRow key={imp.id}>
                              <TableCell className="font-mono text-sm">
                                {imp.reference || '-'}
                              </TableCell>
                              <TableCell className="max-w-[160px] truncate">{imp.objet}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                  <span className="text-sm truncate max-w-[120px]">
                                    {getPersonName(imp.created_by_profile) || '-'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {imp.direction?.sigle || imp.direction?.label || '-'}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(imp.montant)}
                              </TableCell>
                              <TableCell className="font-mono text-xs">{bl?.code || '-'}</TableCell>
                              <TableCell className="text-right">
                                {disponible !== null ? (
                                  <span
                                    className={`font-mono text-xs ${getDisponibleColor(ratio)}`}
                                  >
                                    {formatCurrency(disponible)}
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {format(new Date(imp.created_at), 'dd MMM yyyy', { locale: fr })}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setViewingImputation(imp)}
                                    title="Voir détails"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {canVisa && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-indigo-600 hover:text-indigo-700"
                                        onClick={() => viserImputation(imp.id)}
                                        title="Accorder le visa"
                                      >
                                        <CheckCircle2 className="h-4 w-4" />
                                      </Button>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm">
                                            <MoreHorizontal className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-popover">
                                          <DropdownMenuItem
                                            onClick={() => setRejectingImputation(imp)}
                                            className="text-destructive"
                                          >
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Refuser le visa
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </>
                                  )}
                                </div>
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
            <NotesPagination
              page={page}
              pageSize={pageSize}
              total={totalCount}
              totalPages={totalPages}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </TabsContent>

          {/* Onglet: Visées — visa CB OK, en attente validation DG */}
          <TabsContent value="visees" className="mt-4 space-y-4">
            {/* KPIs validation DG */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">En attente validation DG</p>
                      <p className="text-xl font-bold">{validationKpis.total}</p>
                    </div>
                    <FileText className="h-6 w-6 text-indigo-500 opacity-80" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Montant total</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(validationKpis.montantTotal)}
                      </p>
                    </div>
                    <Banknote className="h-6 w-6 text-primary opacity-80" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Directions</p>
                      <p className="text-xl font-bold">{validationKpis.directions}</p>
                    </div>
                    <Building2 className="h-6 w-6 text-muted-foreground opacity-80" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="pt-6">
                {loadingImputations ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : !filteredImputations.length ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune imputation visée en attente de validation DG</p>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap">Référence</TableHead>
                          <TableHead>Objet</TableHead>
                          <TableHead className="whitespace-nowrap">Imputé par</TableHead>
                          <TableHead>Direction</TableHead>
                          <TableHead className="text-right whitespace-nowrap">Montant</TableHead>
                          <TableHead className="whitespace-nowrap">Dispo. budget</TableHead>
                          <TableHead className="whitespace-nowrap">Visé par (CB)</TableHead>
                          <TableHead className="whitespace-nowrap">Créée le</TableHead>
                          <TableHead className="whitespace-nowrap">Ancienneté</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredImputations.map((imp) => (
                          <TableRow key={imp.id} className="group">
                            <TableCell className="font-mono text-xs whitespace-nowrap">
                              {imp.reference || '-'}
                            </TableCell>
                            <TableCell className="max-w-[200px]">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="block truncate cursor-help">{imp.objet}</span>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="max-w-sm">
                                  <p className="font-medium">{imp.objet}</p>
                                  {imp.budget_line?.code && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Ligne : {imp.budget_line.code} — {imp.budget_line.label}
                                    </p>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1.5 cursor-help">
                                    <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                    <span className="text-sm truncate max-w-[100px]">
                                      {getPersonName(imp.created_by_profile) || '-'}
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{getPersonName(imp.created_by_profile) || 'Non renseigné'}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {imp.direction?.label || ''}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {imp.direction?.sigle || imp.direction?.label || '-'}
                            </TableCell>
                            <TableCell className="text-right font-semibold whitespace-nowrap">
                              {formatCurrency(imp.montant)}
                            </TableCell>
                            <TableCell>{getBudgetBadge(imp)}</TableCell>
                            <TableCell>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1.5 cursor-help">
                                    <Shield className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
                                    <span className="text-sm truncate max-w-[100px]">
                                      {getPersonName(imp.vise_by_profile) || '-'}
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="font-medium">
                                    {getPersonName(imp.vise_by_profile) || 'Non renseigné'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Visa CB le{' '}
                                    {imp.vise_at
                                      ? format(new Date(imp.vise_at), "dd MMM yyyy 'à' HH:mm", {
                                          locale: fr,
                                        })
                                      : '-'}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {format(new Date(imp.created_at), 'dd/MM/yyyy', { locale: fr })}
                            </TableCell>
                            <TableCell>{getAncienneteBadge(imp.created_at)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setViewingImputation(imp)}
                                  title="Voir détails"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {canValidate && (
                                  <>
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700 text-white gap-1"
                                      onClick={() => setValidatingImputation(imp)}
                                    >
                                      <CheckCircle2 className="h-4 w-4" />
                                      Valider
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-1"
                                      onClick={() => setDeferringImputation(imp)}
                                    >
                                      <Clock className="h-4 w-4" />
                                      Différer
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                                      onClick={() => setRejectingImputation(imp)}
                                    >
                                      <XCircle className="h-4 w-4" />
                                      Rejeter
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
            <NotesPagination
              page={page}
              pageSize={pageSize}
              total={totalCount}
              totalPages={totalPages}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </TabsContent>

          {/* Onglets génériques (validees, differees, rejetees) */}
          {['validees', 'differees', 'rejetees'].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {loadingImputations ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : !filteredImputations.length ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucune imputation dans cet onglet</p>
                    </div>
                  ) : (
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Référence</TableHead>
                            <TableHead>Objet</TableHead>
                            <TableHead>Imputé par</TableHead>
                            <TableHead>Direction</TableHead>
                            <TableHead className="text-right">Montant</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="whitespace-nowrap">Créée le</TableHead>
                            <TableHead className="whitespace-nowrap">
                              {tab === 'validees'
                                ? 'Validée le'
                                : tab === 'rejetees'
                                  ? 'Rejetée le'
                                  : 'Différée le'}
                            </TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredImputations.map((imp) => {
                            const actionDate =
                              imp.statut === 'valide'
                                ? imp.validated_at
                                : imp.statut === 'rejete'
                                  ? imp.rejected_at
                                  : imp.statut === 'differe'
                                    ? imp.differed_at
                                    : imp.created_at;

                            return (
                              <TableRow key={imp.id}>
                                <TableCell className="font-mono text-xs whitespace-nowrap">
                                  {imp.reference || '-'}
                                </TableCell>
                                <TableCell className="max-w-[200px]">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="block truncate cursor-help">
                                        {imp.objet}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="max-w-sm">
                                      <p>{imp.objet}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TableCell>
                                <TableCell>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center gap-1.5 cursor-help">
                                        <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                        <span className="text-sm truncate max-w-[100px]">
                                          {getPersonName(imp.created_by_profile) || '-'}
                                        </span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>
                                        {getPersonName(imp.created_by_profile) || 'Non renseigné'}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  {imp.direction?.sigle || imp.direction?.label || '-'}
                                </TableCell>
                                <TableCell className="text-right font-medium whitespace-nowrap">
                                  {formatCurrency(imp.montant)}
                                </TableCell>
                                <TableCell>{getStatusBadge(imp.statut)}</TableCell>
                                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                  {format(new Date(imp.created_at), 'dd/MM/yyyy', { locale: fr })}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  {actionDate
                                    ? format(new Date(actionDate), 'dd MMM yyyy', { locale: fr })
                                    : '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-popover">
                                      <DropdownMenuItem onClick={() => setViewingImputation(imp)}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        Voir détails
                                      </DropdownMenuItem>

                                      {imp.dossier_id && (
                                        <DropdownMenuItem
                                          onClick={() =>
                                            imp.dossier_id && handleGoToDossier(imp.dossier_id)
                                          }
                                        >
                                          <FolderOpen className="mr-2 h-4 w-4" />
                                          Voir le dossier
                                        </DropdownMenuItem>
                                      )}

                                      {canCreate && imp.statut === 'valide' && (
                                        <>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            onClick={() =>
                                              navigate(
                                                `/execution/expression-besoin?sourceImputation=${imp.id}`
                                              )
                                            }
                                          >
                                            <ShoppingCart className="mr-2 h-4 w-4" />
                                            Créer expression de besoin
                                          </DropdownMenuItem>
                                        </>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
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
              <NotesPagination
                page={page}
                pageSize={pageSize}
                total={totalCount}
                totalPages={totalPages}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            </TabsContent>
          ))}
        </Tabs>

        {/* Dialog d'imputation depuis AEF source */}
        <Dialog
          open={!!sourceAefNote}
          onOpenChange={(open) => !open && handleCloseImputationDialog()}
        >
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Créer une imputation
              </DialogTitle>
            </DialogHeader>
            <ImputationForm
              note={
                sourceAefNote
                  ? {
                      id: sourceAefNote.id,
                      numero: sourceAefNote.numero,
                      objet: sourceAefNote.objet,
                      montant_estime: sourceAefNote.montant_estime,
                      direction: sourceAefNote.direction,
                      created_by_profile: sourceAefNote.created_by_profile,
                    }
                  : undefined
              }
              onSuccess={handleImputationSuccess}
              onCancel={handleCloseImputationDialog}
            />
          </DialogContent>
        </Dialog>

        {/* Sheet détail imputation */}
        <ImputationDetailSheet
          open={!!viewingImputation}
          onOpenChange={(open) => !open && setViewingImputation(null)}
          imputation={viewingImputation}
          onRefresh={refetch}
        />

        {/* Dialogs de rejet et report */}
        <ImputationRejectDialog
          open={!!rejectingImputation}
          onOpenChange={(open) => !open && setRejectingImputation(null)}
          imputationReference={rejectingImputation?.reference || null}
          onConfirm={handleReject}
        />

        <ImputationDeferDialog
          open={!!deferringImputation}
          onOpenChange={(open) => !open && setDeferringImputation(null)}
          imputationReference={deferringImputation?.reference || null}
          onConfirm={handleDefer}
        />

        <ImputationValidationDialog
          open={!!validatingImputation}
          onOpenChange={(open) => !open && setValidatingImputation(null)}
          imputation={validatingImputation}
          onConfirm={async () => {
            if (validatingImputation) {
              await validateImputation(validatingImputation.id);
              setValidatingImputation(null);
            }
          }}
          isLoading={isValidating}
        />
      </div>
    </TooltipProvider>
  );
}
