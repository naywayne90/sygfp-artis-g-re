/**
 * Page Scanning - Liquidation
 * Interface dédiée au scanning et upload de documents pour les liquidations
 * RÈGLE: Pas de liquidation sans engagement validé
 */

import { useState, useMemo, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Search,
  ScanLine,
  Loader2,
  FileCheck,
  FileX,
  Upload,
  Filter,
  Send,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Building,
  Receipt,
  ShieldAlert,
  Link2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Clock,
  X,
  History,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useExercice } from '@/contexts/ExerciceContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { LiquidationChecklist } from '@/components/liquidation/LiquidationChecklist';
import { useAuditLog } from '@/hooks/useAuditLog';
import { ExportButtons } from '@/components/etats/ExportButtons';
import { NotesPagination } from '@/components/shared/NotesPagination';
import { ExportColumn } from '@/lib/export';

type SortField = 'numero' | 'montant' | 'dotation_initiale' | 'disponible' | 'engagement_numero';
type SortDirection = 'asc' | 'desc';

// Types
interface ScanningLiquidation {
  id: string;
  numero: string;
  montant: number;
  net_a_payer: number | null;
  date_liquidation: string;
  reference_facture: string | null;
  service_fait: boolean | null;
  statut: string | null;
  // Engagement lié
  engagement_id: string;
  engagement_numero: string | null;
  engagement_objet: string | null;
  engagement_fournisseur: string | null;
  engagement_statut: string | null;
  engagement_montant: number | null;
  // Direction (via budget line de l'engagement)
  direction_id: string | null;
  direction_code: string | null;
  direction_libelle: string | null;
  // Budget line info
  dotation_initiale: number;
  cumul_engagements: number;
  disponible: number;
  activite_code: string | null;
  os_code: string | null;
  // Document stats
  documents_count: number;
  documents_provided: number;
  documents_required: number;
  documents_required_provided: number;
}

interface DirectionOption {
  id: string;
  code: string;
  label: string;
}

const getDocumentStatusBadge = (providedRequired: number, totalRequired: number) => {
  if (totalRequired === 0 || providedRequired === totalRequired) {
    return (
      <Badge className="bg-success/10 text-success border-success/20 gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Complet
      </Badge>
    );
  }
  if (providedRequired === 0) {
    return (
      <Badge variant="destructive" className="gap-1">
        <FileX className="h-3 w-3" />
        0/{totalRequired}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 gap-1">
      <AlertTriangle className="h-3 w-3" />
      {providedRequired}/{totalRequired}
    </Badge>
  );
};

const getEngagementStatusBadge = (statut: string | null) => {
  if (statut === 'valide') {
    return (
      <Badge className="bg-success/10 text-success border-success/20 text-xs">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Validé
      </Badge>
    );
  }
  if (statut === 'soumis') {
    return (
      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-xs">
        En cours
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-xs text-muted-foreground">
      {statut || 'N/A'}
    </Badge>
  );
};

export default function ScanningLiquidation() {
  const { exercice } = useExercice();
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDirection, setSelectedDirection] = useState<string>('all');
  const [selectedDocStatus, setSelectedDocStatus] = useState<string>('all');
  const [selectedLiquidation, setSelectedLiquidation] = useState<ScanningLiquidation | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [isChecklistComplete, setIsChecklistComplete] = useState(false);
  const [_isChecklistVerified, setIsChecklistVerified] = useState(false);
  const [sortField, setSortField] = useState<SortField>('numero');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedFournisseur, setSelectedFournisseur] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Fetch directions for filter
  const { data: directions = [] } = useQuery({
    queryKey: ['directions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('directions')
        .select('id, code, label')
        .order('code');
      if (error) throw error;
      return data as DirectionOption[];
    },
  });

  // Fetch liquidations with engagement and document stats
  const {
    data: liquidations = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['scanning-liquidations', exercice],
    queryFn: async () => {
      // Fetch liquidations with engagement details
      const { data: liqData, error: liqError } = await supabase
        .from('budget_liquidations')
        .select(
          `
          id,
          numero,
          montant,
          net_a_payer,
          date_liquidation,
          reference_facture,
          service_fait,
          statut,
          engagement:budget_engagements(
            id,
            numero,
            objet,
            montant,
            fournisseur,
            statut,
            budget_line:budget_lines(
              id,
              dotation_initiale,
              total_engage,
              direction:directions(id, code, label),
              activite:activites(id, code, libelle),
              os:objectifs_strategiques(id, code, libelle)
            )
          )
        `
        )
        .eq('exercice', exercice)
        .in('statut', ['soumis', 'certifié_sf'])
        .order('created_at', { ascending: false });

      if (liqError) throw liqError;
      if (!liqData) return [];

      // Fetch document counts for each liquidation
      const liqIds = liqData.map((l) => l.id);

      // Try to get from liquidation_documents table
      interface LiquidationDoc {
        liquidation_id: string;
        is_provided: boolean;
        is_required: boolean;
      }
      let docsData: LiquidationDoc[] = [];
      try {
        const { data } = await (supabase
          .from('liquidation_documents' as never)
          .select('liquidation_id, is_provided, is_required')
          .in('liquidation_id', liqIds) as unknown as { data: LiquidationDoc[] | null });
        docsData = data || [];
      } catch {
        // Table may not exist yet
        docsData = [];
      }

      // Calculate document stats per liquidation
      const docStats: Record<
        string,
        { total: number; provided: number; required: number; requiredProvided: number }
      > = {};
      liqIds.forEach((id) => {
        docStats[id] = { total: 0, provided: 0, required: 0, requiredProvided: 0 };
      });

      docsData?.forEach((doc: LiquidationDoc) => {
        const stats = docStats[doc.liquidation_id];
        if (stats) {
          stats.total++;
          if (doc.is_provided) stats.provided++;
          if (doc.is_required) {
            stats.required++;
            if (doc.is_provided) stats.requiredProvided++;
          }
        }
      });

      // Map to result type
      return liqData.map((liq) => {
        const engagement = liq.engagement as Record<string, unknown> | null;
        const budgetLine = engagement?.budget_line as Record<string, unknown> | undefined;
        const direction = budgetLine?.direction as Record<string, unknown> | undefined;
        const activite = budgetLine?.activite as Record<string, unknown> | undefined;
        const os = budgetLine?.os as Record<string, unknown> | undefined;
        const stats = docStats[liq.id] || {
          total: 0,
          provided: 0,
          required: 0,
          requiredProvided: 0,
        };

        return {
          id: liq.id,
          numero: liq.numero,
          montant: liq.montant,
          net_a_payer: liq.net_a_payer,
          date_liquidation: liq.date_liquidation,
          reference_facture: liq.reference_facture,
          service_fait: liq.service_fait,
          statut: liq.statut,
          engagement_id: engagement?.id || null,
          engagement_numero: engagement?.numero || null,
          engagement_objet: engagement?.objet || null,
          engagement_fournisseur: engagement?.fournisseur || null,
          engagement_statut: engagement?.statut || null,
          engagement_montant: engagement?.montant || null,
          direction_id: direction?.id || null,
          direction_code: direction?.code || null,
          direction_libelle: direction?.label || null,
          dotation_initiale: budgetLine?.dotation_initiale || 0,
          cumul_engagements: budgetLine?.total_engage || 0,
          disponible:
            Number(budgetLine?.dotation_initiale || 0) - Number(budgetLine?.total_engage || 0),
          activite_code: activite?.code || null,
          os_code: os?.code || null,
          documents_count: stats.total,
          documents_provided: stats.provided,
          documents_required: stats.required,
          documents_required_provided: stats.requiredProvided,
        } as ScanningLiquidation;
      });
    },
    enabled: !!exercice,
  });

  // Submit for validation mutation
  const submitMutation = useMutation({
    mutationFn: async (liquidationId: string) => {
      // Vérifier que l'engagement est validé
      const liq = liquidations.find((l) => l.id === liquidationId);
      if (!liq) throw new Error('Liquidation non trouvée');

      if (liq.engagement_statut !== 'valide') {
        throw new Error("L'engagement associé doit être validé avant de soumettre la liquidation");
      }

      const { error } = await supabase
        .from('budget_liquidations')
        .update({
          statut: 'certifié_sf',
          workflow_status: 'en_validation',
          current_step: 1,
          submitted_at: new Date().toISOString(),
          documents_complets: true,
        })
        .eq('id', liquidationId);

      if (error) throw error;

      await logAction({
        entityType: 'liquidation',
        entityId: liquidationId,
        action: 'SUBMIT_SCANNING',
        newValues: {
          statut: 'certifié_sf',
          documents_complets: true,
          engagement_id: liq.engagement_id,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scanning-liquidations'] });
      queryClient.invalidateQueries({ queryKey: ['liquidations'] });
      toast.success('Documents validés — liquidation transmise pour certification SF');
      setShowDetailDialog(false);
      setSelectedLiquidation(null);
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  // Filter liquidations
  const filteredLiquidations = useMemo(() => {
    return liquidations.filter((liq) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !liq.numero.toLowerCase().includes(query) &&
          !liq.engagement_objet?.toLowerCase().includes(query) &&
          !liq.engagement_fournisseur?.toLowerCase().includes(query) &&
          !liq.reference_facture?.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Direction filter
      if (selectedDirection !== 'all' && liq.direction_id !== selectedDirection) {
        return false;
      }

      // Fournisseur filter
      if (selectedFournisseur !== 'all' && liq.engagement_fournisseur !== selectedFournisseur) {
        return false;
      }

      // Document status filter
      if (selectedDocStatus !== 'all') {
        if (selectedDocStatus === 'complete') {
          if (
            liq.documents_required > 0 &&
            liq.documents_required_provided < liq.documents_required
          ) {
            return false;
          }
        } else if (selectedDocStatus === 'incomplete') {
          if (
            liq.documents_required === 0 ||
            liq.documents_required_provided === liq.documents_required
          ) {
            return false;
          }
        }
      }

      return true;
    });
  }, [liquidations, searchQuery, selectedDirection, selectedDocStatus, selectedFournisseur]);

  // Filter soumis liquidations + tri
  const soumisLiquidations = useMemo(() => {
    const filtered = filteredLiquidations.filter((l) => l.statut === 'soumis');
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'numero':
          comparison = a.numero.localeCompare(b.numero);
          break;
        case 'engagement_numero':
          comparison = (a.engagement_numero || '').localeCompare(b.engagement_numero || '');
          break;
        case 'montant':
          comparison = a.montant - b.montant;
          break;
        case 'dotation_initiale':
          comparison = a.dotation_initiale - b.dotation_initiale;
          break;
        case 'disponible':
          comparison = a.disponible - b.disponible;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredLiquidations, sortField, sortDirection]);

  // Sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Sort icon
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3 w-3 ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1" />
    );
  };

  // #1 — Historique (liquidations numérisées)
  const historiqueLiquidations = useMemo(() => {
    return filteredLiquidations.filter((l) => l.statut === 'certifié_sf');
  }, [filteredLiquidations]);

  // #7 — Liste des fournisseurs uniques
  const fournisseurs = useMemo(() => {
    const set = new Set<string>();
    liquidations.forEach((l) => {
      if (l.engagement_fournisseur) set.add(l.engagement_fournisseur);
    });
    return Array.from(set).sort();
  }, [liquidations]);

  // #2 — Calcul ancienneté (jours depuis date_liquidation)
  const getDaysAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  // #3 — Sélection multiple
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAllSelection = () => {
    const pageItems = soumisLiquidations.slice((page - 1) * pageSize, page * pageSize);
    const allSelected = pageItems.every((l) => selectedIds.has(l.id));
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pageItems.forEach((l) => next.delete(l.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pageItems.forEach((l) => next.add(l.id));
        return next;
      });
    }
  };

  // Stats
  const totalLiquidations = filteredLiquidations.filter((l) => l.statut === 'soumis').length;
  const completeLiquidations = soumisLiquidations.filter(
    (l) => l.documents_required === 0 || l.documents_required_provided === l.documents_required
  ).length;
  const incompleteLiquidations = totalLiquidations - completeLiquidations;
  const completionPercentage =
    totalLiquidations > 0 ? Math.round((completeLiquidations / totalLiquidations) * 100) : 0;

  // Liquidations with unvalidated engagements
  const withUnvalidatedEngagement = soumisLiquidations.filter(
    (l) => l.engagement_statut !== 'valide'
  ).length;

  const handleOpenDetail = (liq: ScanningLiquidation) => {
    setSelectedLiquidation(liq);
    setShowDetailDialog(true);
  };

  const handleCloseDetail = () => {
    setShowDetailDialog(false);
    setSelectedLiquidation(null);
    queryClient.invalidateQueries({ queryKey: ['scanning-liquidations'] });
  };

  const handleChecklistChange = (isComplete: boolean, isVerified: boolean) => {
    setIsChecklistComplete(isComplete);
    setIsChecklistVerified(isVerified);
  };

  const handleSubmit = () => {
    if (selectedLiquidation && isChecklistComplete) {
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmSubmit = () => {
    if (selectedLiquidation) {
      submitMutation.mutate(selectedLiquidation.id);
      setShowConfirmDialog(false);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedDirection('all');
    setSelectedDocStatus('all');
    setSelectedFournisseur('all');
    setPage(1);
  };

  // Export columns definition
  const exportColumns: ExportColumn[] = [
    { key: 'numero', label: 'N° Liquidation', type: 'text' },
    { key: 'date_liquidation', label: 'Date', type: 'date' },
    { key: 'engagement_numero', label: 'N° Engagement', type: 'text' },
    { key: 'engagement_fournisseur', label: 'Fournisseur', type: 'text' },
    { key: 'montant', label: 'Montant', type: 'currency' },
    { key: 'net_a_payer', label: 'Net à payer', type: 'currency' },
    { key: 'dotation_initiale', label: 'Dotation', type: 'currency' },
    { key: 'cumul_engagements', label: 'Cumul', type: 'currency' },
    { key: 'disponible', label: 'Disponible', type: 'currency' },
    { key: 'direction_code', label: 'Direction', type: 'text' },
    { key: 'statut', label: 'Statut', type: 'text' },
  ];

  // Check if submit is allowed
  const canSubmit = useMemo(() => {
    if (!selectedLiquidation) return false;
    if (!isChecklistComplete) return false;
    if (selectedLiquidation.engagement_statut !== 'valide') return false;
    return true;
  }, [selectedLiquidation, isChecklistComplete]);

  // #10 — Raccourci clavier Ctrl+Enter pour soumettre
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && showDetailDialog && canSubmit) {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDetailDialog, canSubmit]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <ScanLine className="h-6 w-6" />
            Scanning - Liquidation
          </h1>
          <p className="page-description">
            Numérisation et upload des pièces justificatives pour les liquidations
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButtons
            data={filteredLiquidations as unknown as Record<string, unknown>[]}
            columns={exportColumns}
            filename="scanning_liquidations"
            title="Liste des Liquidations - Scanning"
            subtitle={`Exercice ${exercice}`}
            showCopy
            showPrint
            showTotals
            totalColumns={['montant', 'net_a_payer', 'dotation_initiale', 'disponible']}
          />
          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Warning: unvalidated engagements */}
      {withUnvalidatedEngagement > 0 && (
        <Alert variant="destructive" className="border-warning bg-warning/10">
          <ShieldAlert className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning">Engagements non validés</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            {withUnvalidatedEngagement} liquidation(s) ont un engagement non encore validé. Ces
            liquidations ne peuvent pas être soumises tant que l'engagement n'est pas validé.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards — #4 responsive 2x2 */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total dossiers</p>
                <p className="text-2xl font-bold">{totalLiquidations}</p>
              </div>
              <Receipt className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dossiers complets</p>
                <p className="text-2xl font-bold text-success">{completeLiquidations}</p>
              </div>
              <FileCheck className="h-8 w-8 text-success/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dossiers incomplets</p>
                <p className="text-2xl font-bold text-warning">{incompleteLiquidations}</p>
              </div>
              <FileX className="h-8 w-8 text-warning/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Complétion</span>
                <span className="font-medium">{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-5">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro, objet, fournisseur, facture..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Direction filter */}
            <Select value={selectedDirection} onValueChange={setSelectedDirection}>
              <SelectTrigger>
                <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les directions</SelectItem>
                {directions.map((dir) => (
                  <SelectItem key={dir.id} value={dir.id}>
                    {dir.code} - {dir.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* #7 — Fournisseur filter */}
            <Select value={selectedFournisseur} onValueChange={setSelectedFournisseur}>
              <SelectTrigger>
                <Receipt className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Fournisseur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les fournisseurs</SelectItem>
                {fournisseurs.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Document status filter */}
            <Select value={selectedDocStatus} onValueChange={setSelectedDocStatus}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Statut documents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="complete">Complets</SelectItem>
                <SelectItem value="incomplete">Incomplets</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active filters indicator */}
          {(searchQuery ||
            selectedDirection !== 'all' ||
            selectedDocStatus !== 'all' ||
            selectedFournisseur !== 'all') && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filtres actifs:</span>
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Réinitialiser
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* #3 — Actions groupées */}
      {selectedIds.size > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedIds.size} liquidation(s) sélectionnée(s)
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
                  <X className="h-3 w-3 mr-1" />
                  Désélectionner
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs — #1 onglet historique */}
      <Tabs defaultValue="soumis" className="space-y-4">
        <TabsList>
          <TabsTrigger value="soumis" className="gap-1">
            <ScanLine className="h-4 w-4" />À scanner ({soumisLiquidations.length})
          </TabsTrigger>
          <TabsTrigger value="historique" className="gap-1">
            <History className="h-4 w-4" />
            Numérisés ({historiqueLiquidations.length})
          </TabsTrigger>
        </TabsList>

        {/* Soumis tab */}
        <TabsContent value="soumis">
          <Card>
            <CardHeader>
              <CardTitle>Liquidations à numériser</CardTitle>
              <CardDescription>
                {soumisLiquidations.length} liquidation(s) en attente de documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : soumisLiquidations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ScanLine className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune liquidation à numériser</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {/* #3 — Checkbox sélection */}
                        <TableHead className="w-[40px]">
                          <Checkbox
                            checked={
                              soumisLiquidations.slice((page - 1) * pageSize, page * pageSize)
                                .length > 0 &&
                              soumisLiquidations
                                .slice((page - 1) * pageSize, page * pageSize)
                                .every((l) => selectedIds.has(l.id))
                            }
                            onCheckedChange={toggleAllSelection}
                          />
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('numero')}
                        >
                          <span className="flex items-center">
                            N° Liquidation <SortIcon field="numero" />
                          </span>
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('engagement_numero')}
                        >
                          <span className="flex items-center">
                            Engagement <SortIcon field="engagement_numero" />
                          </span>
                        </TableHead>
                        <TableHead>Fournisseur</TableHead>
                        <TableHead>Direction</TableHead>
                        <TableHead
                          className="text-right cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort('montant')}
                        >
                          <span className="flex items-center justify-end">
                            Montant <SortIcon field="montant" />
                          </span>
                        </TableHead>
                        <TableHead className="text-right hidden md:table-cell">
                          Net à payer
                        </TableHead>
                        <TableHead className="hidden lg:table-cell">Réf. Facture</TableHead>
                        <TableHead className="text-center hidden md:table-cell">SF</TableHead>
                        <TableHead className="text-center">Ancienneté</TableHead>
                        {withUnvalidatedEngagement > 0 && (
                          <TableHead className="text-center">Eng. Validé</TableHead>
                        )}
                        <TableHead className="text-center">Documents</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {soumisLiquidations
                        .slice((page - 1) * pageSize, page * pageSize)
                        .map((liq) => {
                          const daysAgo = getDaysAgo(liq.date_liquidation);
                          return (
                            <TableRow
                              key={liq.id}
                              className={selectedIds.has(liq.id) ? 'bg-primary/5' : ''}
                            >
                              {/* #3 — Checkbox */}
                              <TableCell>
                                <Checkbox
                                  checked={selectedIds.has(liq.id)}
                                  onCheckedChange={() => toggleSelection(liq.id)}
                                />
                              </TableCell>
                              {/* #5 — Numéro cliquable */}
                              <TableCell>
                                <button
                                  className="text-left hover:underline text-primary cursor-pointer"
                                  onClick={() => handleOpenDetail(liq)}
                                >
                                  <div className="font-mono text-sm">{liq.numero}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {format(new Date(liq.date_liquidation), 'dd/MM/yyyy', {
                                      locale: fr,
                                    })}
                                  </div>
                                </button>
                              </TableCell>
                              <TableCell>
                                <a
                                  href={`/engagements?detail=${liq.engagement_id}`}
                                  className="hover:underline text-primary"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    window.open(
                                      `/engagements?detail=${liq.engagement_id}`,
                                      '_blank'
                                    );
                                  }}
                                >
                                  <div className="font-mono text-sm">
                                    {liq.engagement_numero || '-'}
                                  </div>
                                  <div className="text-xs text-muted-foreground max-w-[150px] truncate">
                                    {liq.engagement_objet || '-'}
                                  </div>
                                </a>
                              </TableCell>
                              <TableCell>{liq.engagement_fournisseur || '-'}</TableCell>
                              <TableCell>
                                {liq.direction_code ? (
                                  <Badge variant="outline">{liq.direction_code}</Badge>
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {liq.montant === 0 ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-warning/10 text-warning border-warning/20"
                                  >
                                    <AlertTriangle className="h-3 w-3 mr-1" />0 FCFA
                                  </Badge>
                                ) : (
                                  <span className="font-medium">{formatCurrency(liq.montant)}</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right hidden md:table-cell font-medium text-primary">
                                {formatCurrency(liq.net_a_payer)}
                              </TableCell>
                              {/* #8 — Réf. Facture */}
                              <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                                {liq.reference_facture || (
                                  <span className="text-muted-foreground/50 italic">—</span>
                                )}
                              </TableCell>
                              {/* #9 — Badge Service fait */}
                              <TableCell className="text-center hidden md:table-cell">
                                {liq.service_fait ? (
                                  <Badge className="bg-success/10 text-success border-success/20 text-xs">
                                    SF ✓
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="text-xs text-muted-foreground"
                                  >
                                    SF ✗
                                  </Badge>
                                )}
                              </TableCell>
                              {/* #2 — Ancienneté */}
                              <TableCell className="text-center">
                                {daysAgo > 10 ? (
                                  <Badge variant="destructive" className="gap-1 text-xs">
                                    <Clock className="h-3 w-3" />
                                    {daysAgo}j
                                  </Badge>
                                ) : daysAgo > 5 ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-warning/10 text-warning border-warning/20 gap-1 text-xs"
                                  >
                                    <Clock className="h-3 w-3" />
                                    {daysAgo}j
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-muted-foreground">{daysAgo}j</span>
                                )}
                              </TableCell>
                              {withUnvalidatedEngagement > 0 && (
                                <TableCell className="text-center">
                                  {getEngagementStatusBadge(liq.engagement_statut)}
                                </TableCell>
                              )}
                              <TableCell className="text-center">
                                {getDocumentStatusBadge(
                                  liq.documents_required_provided,
                                  liq.documents_required
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1"
                                  onClick={() => handleOpenDetail(liq)}
                                >
                                  <Upload className="h-4 w-4" />
                                  Scanner
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>

                  {/* Total montants */}
                  <div className="flex items-center justify-end gap-6 pt-4 border-t mt-4 text-sm">
                    <div className="text-muted-foreground">
                      Total Montant :{' '}
                      <span className="font-semibold text-foreground">
                        {formatCurrency(soumisLiquidations.reduce((sum, l) => sum + l.montant, 0))}
                      </span>
                    </div>
                    <div className="text-muted-foreground">
                      Total Net à payer :{' '}
                      <span className="font-semibold text-primary">
                        {formatCurrency(
                          soumisLiquidations.reduce((sum, l) => sum + (l.net_a_payer || 0), 0)
                        )}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {soumisLiquidations.length > 0 && (
            <NotesPagination
              page={page}
              pageSize={pageSize}
              total={soumisLiquidations.length}
              totalPages={Math.ceil(soumisLiquidations.length / pageSize)}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          )}
        </TabsContent>

        {/* #1 — Onglet Historique (numérisés) */}
        <TabsContent value="historique">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Liquidations numérisées
              </CardTitle>
              <CardDescription>
                {historiqueLiquidations.length} liquidation(s) dont les documents ont été validés
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historiqueLiquidations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune liquidation numérisée pour le moment</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Liquidation</TableHead>
                      <TableHead>Engagement</TableHead>
                      <TableHead>Fournisseur</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="text-right hidden md:table-cell">Net à payer</TableHead>
                      <TableHead className="text-center">Documents</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historiqueLiquidations.map((liq) => (
                      <TableRow key={liq.id}>
                        <TableCell>
                          <div className="font-mono text-sm">{liq.numero}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(liq.date_liquidation), 'dd/MM/yyyy', { locale: fr })}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {liq.engagement_numero || '-'}
                        </TableCell>
                        <TableCell>{liq.engagement_fournisseur || '-'}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(liq.montant)}
                        </TableCell>
                        <TableCell className="text-right hidden md:table-cell font-medium text-primary">
                          {formatCurrency(liq.net_a_payer)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-success/10 text-success border-success/20 gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Validé
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* #6 — Detail Panel custom (sans Dialog/Portal pour react-dropzone) */}
      {showDetailDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={handleCloseDetail} />
          <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-background border rounded-lg shadow-xl p-6 mx-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <ScanLine className="h-5 w-5" />
                  {selectedLiquidation?.numero} - Documents
                </h2>
                <p className="text-sm text-muted-foreground">
                  Liquidation liée à l'engagement {selectedLiquidation?.engagement_numero}
                  <span className="ml-2 text-xs">(Ctrl+Entrée pour soumettre)</span>
                </p>
              </div>
              <button
                onClick={handleCloseDetail}
                className="rounded-sm opacity-70 hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {selectedLiquidation && (
              <div className="space-y-6">
                {/* Warning if engagement not validated */}
                {selectedLiquidation.engagement_statut !== 'valide' && (
                  <Alert variant="destructive">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>Engagement non validé</AlertTitle>
                    <AlertDescription>
                      L'engagement associé ({selectedLiquidation.engagement_numero}) n'est pas
                      encore validé.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Liquidation info */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Fournisseur</p>
                    <p className="font-medium">
                      {selectedLiquidation.engagement_fournisseur || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Montant</p>
                    <p className="font-medium">{formatCurrency(selectedLiquidation.montant)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Net à payer</p>
                    <p className="font-medium text-primary">
                      {formatCurrency(selectedLiquidation.net_a_payer)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Réf. Facture</p>
                    <p className="font-medium">{selectedLiquidation.reference_facture || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Direction</p>
                    <p className="font-medium">{selectedLiquidation.direction_libelle || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date liquidation</p>
                    <p className="font-medium">
                      {format(new Date(selectedLiquidation.date_liquidation), 'dd MMMM yyyy', {
                        locale: fr,
                      })}
                    </p>
                  </div>
                </div>

                {/* Engagement link */}
                <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <Link2 className="h-4 w-4 text-primary" />
                  <span className="text-sm">
                    Engagement lié: <strong>{selectedLiquidation.engagement_numero}</strong>
                  </span>
                  {getEngagementStatusBadge(selectedLiquidation.engagement_statut)}
                  <span className="text-sm text-muted-foreground ml-auto">
                    Montant: {formatCurrency(selectedLiquidation.engagement_montant)}
                  </span>
                </div>

                {/* Checklist */}
                <LiquidationChecklist
                  liquidationId={selectedLiquidation.id}
                  readOnly={selectedLiquidation.statut !== 'soumis'}
                  onCompletenessChange={handleChecklistChange}
                  blockSubmitIfIncomplete={true}
                />
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
              <Button variant="outline" onClick={handleCloseDetail}>
                Fermer
              </Button>
              {selectedLiquidation?.statut === 'soumis' && (
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit || submitMutation.isPending}
                  className="gap-2"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Soumission...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Soumettre pour validation
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation de soumission */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Confirmer la soumission
            </AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de transmettre la liquidation{' '}
              <strong>{selectedLiquidation?.numero}</strong> pour certification SF. Tous les
              documents obligatoires sont fournis et l'engagement est validé. Cette action sera
              enregistrée dans l'historique.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit} disabled={submitMutation.isPending}>
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Soumission...
                </>
              ) : (
                'Confirmer la soumission'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
