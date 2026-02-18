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
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';
import { WorkflowStepIndicator } from '@/components/workflow/WorkflowStepIndicator';
import { usePermissions } from '@/hooks/usePermissions';
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
} from 'lucide-react';
import { exportPassationPDF } from '@/services/passationExportService';
import { usePassationExport } from '@/hooks/usePassationExport';
import { NotesPagination } from '@/components/shared/NotesPagination';

const getStatusBadge = (statut: string) => {
  const config = STATUTS[statut as keyof typeof STATUTS] || STATUTS.brouillon;
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
  const [activeTab, setActiveTab] = useState('a_traiter');
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

  const formatMontant = (montant: number | null) => (montant ? formatCurrency(montant) : '-');

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
      <WorkflowStepIndicator currentStep={3} />

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

      {/* KPIs — 8 lifecycle cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-8" data-testid="kpi-cards">
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
          onClick={() => handleTabChange('brouillon')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">Brouillons</CardTitle>
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3 px-3">
            <div className="text-xl font-bold">{counts.brouillon}</div>
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

      {/* Alerte si aucune EB validée */}
      {directionEBs.length === 0 && (
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
              <TabsTrigger value="a_traiter" className="gap-1 text-xs px-2">
                <Tag className="h-3 w-3" />
                EB
                <Badge variant="secondary" className="ml-0.5 text-[10px] h-4 px-1">
                  {directionEBs.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="brouillon" className="text-xs px-2">
                Brouillons ({counts.brouillon})
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
                Attribués ({counts.attribue})
              </TabsTrigger>
              <TabsTrigger value="approuve" className="text-xs px-2">
                Approuvés ({counts.approuve})
              </TabsTrigger>
              <TabsTrigger value="signe" className="text-xs px-2">
                Signés ({counts.signe})
              </TabsTrigger>
            </TabsList>

            {/* Onglet EB à traiter */}
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
                            {formatMontant(eb.montant_estime)}
                          </TableCell>
                          <TableCell className="text-right">
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
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </TabsContent>

            {/* Lifecycle tabs — server-paginated */}
            {[
              'brouillon',
              'publie',
              'cloture',
              'en_evaluation',
              'attribue',
              'approuve',
              'signe',
            ].map((tab) => (
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
                              {formatMontant(pm.montant_retenu)}
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

                                  {/* DAAF: Modifier (brouillon) */}
                                  {canManageWorkflow && pm.statut === 'brouillon' && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => handleViewDetails(pm)}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Modifier
                                      </DropdownMenuItem>
                                    </>
                                  )}

                                  {/* DAAF: Publier (brouillon) */}
                                  {canManageWorkflow && pm.statut === 'brouillon' && (
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

                                  {/* DAAF: Supprimer (brouillon uniquement) */}
                                  {canManageWorkflow && pm.statut === 'brouillon' && (
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
        onSuccess={() => setActiveTab('brouillon')}
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
