/**
 * Page Scanning - Engagement
 * Interface dédiée au scanning et upload de documents pour les engagements
 */

import { useState, useMemo } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  ScanLine,
  Loader2,
  FileCheck,
  FileX,
  Upload,
  Eye,
  Filter,
  FolderOpen,
  Send,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Building,
  Activity,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useExercice } from '@/contexts/ExerciceContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { EngagementChecklist } from '@/components/engagement/EngagementChecklist';
import { useAuditLog } from '@/hooks/useAuditLog';
import { ExportButtons } from '@/components/etats/ExportButtons';
import { ExportColumn } from '@/lib/export';

// Types
interface ScanningEngagement {
  id: string;
  numero: string;
  objet: string;
  montant: number;
  fournisseur: string | null;
  date_engagement: string;
  statut: string | null;
  direction_id: string | null;
  direction_code: string | null;
  direction_libelle: string | null;
  activite_code: string | null;
  activite_libelle: string | null;
  budget_line_code: string | null;
  dotation_initiale: number;
  cumul_engagements: number;
  disponible: number;
  os_code: string | null;
  documents_count: number;
  documents_provided: number;
  documents_obligatory: number;
  documents_obligatory_provided: number;
}

interface DirectionOption {
  id: string;
  code: string;
  label: string;
}

interface ActiviteOption {
  id: string;
  code: string;
  libelle: string;
}

const getDocumentStatusBadge = (
  provided: number,
  total: number,
  obligatoryProvided: number,
  obligatoryTotal: number
) => {
  if (obligatoryTotal === 0 || obligatoryProvided === obligatoryTotal) {
    return (
      <Badge className="bg-success/10 text-success border-success/20 gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Complet
      </Badge>
    );
  }
  if (obligatoryProvided === 0) {
    return (
      <Badge variant="destructive" className="gap-1">
        <FileX className="h-3 w-3" />
        0/{obligatoryTotal}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 gap-1">
      <AlertTriangle className="h-3 w-3" />
      {obligatoryProvided}/{obligatoryTotal}
    </Badge>
  );
};

export default function ScanningEngagement() {
  const { exercice } = useExercice();
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDirection, setSelectedDirection] = useState<string>('all');
  const [selectedActivite, setSelectedActivite] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedEngagement, setSelectedEngagement] = useState<ScanningEngagement | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [isChecklistComplete, setIsChecklistComplete] = useState(false);
  const [_isChecklistVerified, _setIsChecklistVerified] = useState(false);

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

  // Fetch activités for filter
  const { data: activites = [] } = useQuery({
    queryKey: ['activites-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activites')
        .select('id, code, libelle')
        .order('code');
      if (error) throw error;
      return data as ActiviteOption[];
    },
  });

  // Fetch engagements with document stats
  const {
    data: engagements = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['scanning-engagements', exercice],
    queryFn: async () => {
      // Fetch engagements
      const { data: engData, error: engError } = await supabase
        .from('budget_engagements')
        .select(
          `
          id,
          numero,
          objet,
          montant,
          fournisseur,
          date_engagement,
          statut,
          budget_line:budget_lines(
            id,
            code,
            dotation_initiale,
            direction:directions(id, code, label),
            activite:activites(id, code, libelle),
            os:objectifs_strategiques(id, code, libelle)
          )
        `
        )
        .eq('exercice', exercice)
        .in('statut', ['brouillon', 'soumis'])
        .order('created_at', { ascending: false });

      if (engError) throw engError;
      if (!engData) return [];

      // Fetch document counts for each engagement
      const engIds = engData.map((e) => e.id);
      const { data: docsData } = await supabase
        .from('engagement_documents')
        .select('engagement_id, est_fourni, est_obligatoire')
        .in('engagement_id', engIds);

      // Calculate document stats per engagement
      const docStats: Record<
        string,
        { total: number; provided: number; obligatory: number; obligatoryProvided: number }
      > = {};
      engIds.forEach((id) => {
        docStats[id] = { total: 0, provided: 0, obligatory: 0, obligatoryProvided: 0 };
      });

      docsData?.forEach((doc) => {
        const stats = docStats[doc.engagement_id];
        if (stats) {
          stats.total++;
          if (doc.est_fourni) stats.provided++;
          if (doc.est_obligatoire) {
            stats.obligatory++;
            if (doc.est_fourni) stats.obligatoryProvided++;
          }
        }
      });

      // Map to result type
      return engData.map((eng) => {
        const budgetLine = eng.budget_line as Record<string, unknown>;
        const direction = budgetLine?.direction;
        const activite = budgetLine?.activite;
        const os = budgetLine?.os;
        const stats = docStats[eng.id] || {
          total: 0,
          provided: 0,
          obligatory: 0,
          obligatoryProvided: 0,
        };

        return {
          id: eng.id,
          numero: eng.numero,
          objet: eng.objet,
          montant: eng.montant,
          fournisseur: eng.fournisseur,
          date_engagement: eng.date_engagement,
          statut: eng.statut,
          direction_id: direction?.id || null,
          direction_code: direction?.code || null,
          direction_libelle: direction?.label || null,
          activite_code: activite?.code || null,
          activite_libelle: activite?.libelle || null,
          budget_line_code: budgetLine?.code || null,
          dotation_initiale: budgetLine?.dotation_initiale || 0,
          cumul_engagements: 0, // Could be calculated if needed
          disponible: budgetLine?.dotation_initiale || 0,
          os_code: os?.code || null,
          documents_count: stats.total,
          documents_provided: stats.provided,
          documents_obligatory: stats.obligatory,
          documents_obligatory_provided: stats.obligatoryProvided,
        } as ScanningEngagement;
      });
    },
    enabled: !!exercice,
  });

  // Submit for validation mutation
  const submitMutation = useMutation({
    mutationFn: async (engagementId: string) => {
      const { error } = await supabase
        .from('budget_engagements')
        .update({
          statut: 'soumis',
          workflow_status: 'pending',
          current_step: 1,
        })
        .eq('id', engagementId);

      if (error) throw error;

      await logAction({
        entityType: 'engagement',
        entityId: engagementId,
        action: 'SUBMIT',
        newValues: { statut: 'soumis' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scanning-engagements'] });
      queryClient.invalidateQueries({ queryKey: ['engagements'] });
      toast.success('Engagement soumis pour validation');
      setShowDetailDialog(false);
      setSelectedEngagement(null);
    },
    onError: (error) => {
      toast.error('Erreur lors de la soumission: ' + error.message);
    },
  });

  // Filter engagements
  const filteredEngagements = useMemo(() => {
    return engagements.filter((eng) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !eng.numero.toLowerCase().includes(query) &&
          !eng.objet.toLowerCase().includes(query) &&
          !eng.fournisseur?.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Direction filter
      if (selectedDirection !== 'all' && eng.direction_id !== selectedDirection) {
        return false;
      }

      // Activité filter
      if (selectedActivite !== 'all' && eng.activite_code !== selectedActivite) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'complete') {
          if (
            eng.documents_obligatory > 0 &&
            eng.documents_obligatory_provided < eng.documents_obligatory
          ) {
            return false;
          }
        } else if (selectedStatus === 'incomplete') {
          if (
            eng.documents_obligatory === 0 ||
            eng.documents_obligatory_provided === eng.documents_obligatory
          ) {
            return false;
          }
        }
      }

      return true;
    });
  }, [engagements, searchQuery, selectedDirection, selectedActivite, selectedStatus]);

  // Separate brouillon and soumis
  const brouillonEngagements = filteredEngagements.filter((e) => e.statut === 'brouillon');
  const soumisEngagements = filteredEngagements.filter((e) => e.statut === 'soumis');

  // Stats
  const totalEngagements = filteredEngagements.length;
  const completeEngagements = filteredEngagements.filter(
    (e) =>
      e.documents_obligatory === 0 || e.documents_obligatory_provided === e.documents_obligatory
  ).length;
  const incompleteEngagements = totalEngagements - completeEngagements;
  const completionPercentage =
    totalEngagements > 0 ? Math.round((completeEngagements / totalEngagements) * 100) : 0;

  const handleOpenDetail = (eng: ScanningEngagement) => {
    setSelectedEngagement(eng);
    setShowDetailDialog(true);
  };

  const handleChecklistChange = (isComplete: boolean, isVerified: boolean) => {
    setIsChecklistComplete(isComplete);
    setIsChecklistVerified(isVerified);
  };

  const handleSubmit = () => {
    if (selectedEngagement && isChecklistComplete) {
      submitMutation.mutate(selectedEngagement.id);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedDirection('all');
    setSelectedActivite('all');
    setSelectedStatus('all');
  };

  // Export columns definition
  const exportColumns: ExportColumn[] = [
    { key: 'numero', label: 'Numéro', type: 'text' },
    { key: 'date_engagement', label: 'Date', type: 'date' },
    { key: 'fournisseur', label: 'Fournisseur', type: 'text' },
    { key: 'objet', label: 'Objet', type: 'text' },
    { key: 'montant', label: 'Montant', type: 'currency' },
    { key: 'dotation_initiale', label: 'Dotation', type: 'currency' },
    { key: 'cumul_engagements', label: 'Cumul', type: 'currency' },
    { key: 'disponible', label: 'Disponible', type: 'currency' },
    { key: 'direction_code', label: 'Direction', type: 'text' },
    { key: 'activite_code', label: 'Code Activité', type: 'text' },
    { key: 'os_code', label: 'N° OS', type: 'text' },
    { key: 'statut', label: 'Statut', type: 'text' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <ScanLine className="h-6 w-6" />
            Scanning - Engagement
          </h1>
          <p className="page-description">
            Numérisation et upload des pièces justificatives pour les engagements
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButtons
            data={filteredEngagements as unknown as Record<string, unknown>[]}
            columns={exportColumns}
            filename="scanning_engagements"
            title="Liste des Engagements - Scanning"
            subtitle={`Exercice ${exercice}`}
            showCopy
            showPrint
            showTotals
            totalColumns={['montant', 'dotation_initiale', 'disponible']}
          />
          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total dossiers</p>
                <p className="text-2xl font-bold">{totalEngagements}</p>
              </div>
              <FolderOpen className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dossiers complets</p>
                <p className="text-2xl font-bold text-success">{completeEngagements}</p>
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
                <p className="text-2xl font-bold text-warning">{incompleteEngagements}</p>
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
                placeholder="Rechercher par numéro, objet, fournisseur..."
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

            {/* Activité filter */}
            <Select value={selectedActivite} onValueChange={setSelectedActivite}>
              <SelectTrigger>
                <Activity className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Activité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les activités</SelectItem>
                {activites.map((act) => (
                  <SelectItem key={act.id} value={act.code}>
                    {act.code} - {act.libelle.substring(0, 30)}...
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Document status filter */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
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
            selectedActivite !== 'all' ||
            selectedStatus !== 'all') && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filtres actifs:</span>
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Réinitialiser
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="brouillon" className="space-y-4">
        <TabsList>
          <TabsTrigger value="brouillon" className="gap-1">
            À scanner ({brouillonEngagements.length})
          </TabsTrigger>
          <TabsTrigger value="soumis" className="gap-1">
            Soumis ({soumisEngagements.length})
          </TabsTrigger>
        </TabsList>

        {/* Brouillon tab */}
        <TabsContent value="brouillon">
          <Card>
            <CardHeader>
              <CardTitle>Engagements à numériser</CardTitle>
              <CardDescription>
                {brouillonEngagements.length} engagement(s) en attente de documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : brouillonEngagements.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ScanLine className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun engagement à numériser</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numéro</TableHead>
                      <TableHead>Objet</TableHead>
                      <TableHead>Fournisseur</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead className="text-right">Dotation</TableHead>
                      <TableHead className="text-right hidden lg:table-cell">Cumul</TableHead>
                      <TableHead className="text-right hidden lg:table-cell">Disponible</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="hidden xl:table-cell">Code Act.</TableHead>
                      <TableHead className="hidden xl:table-cell">N° OS</TableHead>
                      <TableHead className="text-center">Documents</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {brouillonEngagements.map((eng) => (
                      <TableRow key={eng.id}>
                        <TableCell>
                          <div>
                            <div className="font-mono text-sm">{eng.numero}</div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(eng.date_engagement), 'dd/MM/yyyy', { locale: fr })}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{eng.objet || '-'}</TableCell>
                        <TableCell>{eng.fournisseur || '-'}</TableCell>
                        <TableCell>
                          {eng.direction_code ? (
                            <Badge variant="outline">{eng.direction_code}</Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(eng.dotation_initiale)}
                        </TableCell>
                        <TableCell className="text-right hidden lg:table-cell text-muted-foreground">
                          {formatCurrency(eng.cumul_engagements)}
                        </TableCell>
                        <TableCell className="text-right hidden lg:table-cell">
                          <span
                            className={
                              eng.disponible < 0
                                ? 'text-destructive font-medium'
                                : 'text-muted-foreground'
                            }
                          >
                            {formatCurrency(eng.disponible)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(eng.montant)}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-muted-foreground">
                          {eng.activite_code || '-'}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-muted-foreground">
                          {eng.os_code || '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          {getDocumentStatusBadge(
                            eng.documents_provided,
                            eng.documents_count,
                            eng.documents_obligatory_provided,
                            eng.documents_obligatory
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => handleOpenDetail(eng)}
                          >
                            <Upload className="h-4 w-4" />
                            Scanner
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Soumis tab */}
        <TabsContent value="soumis">
          <Card>
            <CardHeader>
              <CardTitle>Engagements soumis</CardTitle>
              <CardDescription>
                {soumisEngagements.length} engagement(s) soumis pour validation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : soumisEngagements.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun engagement soumis</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numéro</TableHead>
                      <TableHead>Objet</TableHead>
                      <TableHead>Fournisseur</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead className="text-right">Dotation</TableHead>
                      <TableHead className="text-right hidden lg:table-cell">Cumul</TableHead>
                      <TableHead className="text-right hidden lg:table-cell">Disponible</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="hidden xl:table-cell">Code Act.</TableHead>
                      <TableHead className="hidden xl:table-cell">N° OS</TableHead>
                      <TableHead className="text-center">Documents</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {soumisEngagements.map((eng) => (
                      <TableRow key={eng.id}>
                        <TableCell>
                          <div>
                            <div className="font-mono text-sm">{eng.numero}</div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(eng.date_engagement), 'dd/MM/yyyy', { locale: fr })}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{eng.objet || '-'}</TableCell>
                        <TableCell>{eng.fournisseur || '-'}</TableCell>
                        <TableCell>
                          {eng.direction_code ? (
                            <Badge variant="outline">{eng.direction_code}</Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(eng.dotation_initiale)}
                        </TableCell>
                        <TableCell className="text-right hidden lg:table-cell text-muted-foreground">
                          {formatCurrency(eng.cumul_engagements)}
                        </TableCell>
                        <TableCell className="text-right hidden lg:table-cell">
                          <span
                            className={
                              eng.disponible < 0
                                ? 'text-destructive font-medium'
                                : 'text-muted-foreground'
                            }
                          >
                            {formatCurrency(eng.disponible)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(eng.montant)}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-muted-foreground">
                          {eng.activite_code || '-'}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-muted-foreground">
                          {eng.os_code || '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          {getDocumentStatusBadge(
                            eng.documents_provided,
                            eng.documents_count,
                            eng.documents_obligatory_provided,
                            eng.documents_obligatory
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => handleOpenDetail(eng)}>
                            <Eye className="h-4 w-4" />
                          </Button>
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

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanLine className="h-5 w-5" />
              {selectedEngagement?.numero} - Documents
            </DialogTitle>
            <DialogDescription>{selectedEngagement?.objet}</DialogDescription>
          </DialogHeader>

          {selectedEngagement && (
            <div className="space-y-6">
              {/* Engagement info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Fournisseur</p>
                  <p className="font-medium">{selectedEngagement.fournisseur || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Montant</p>
                  <p className="font-medium">{formatCurrency(selectedEngagement.montant)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Direction</p>
                  <p className="font-medium">{selectedEngagement.direction_libelle || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date engagement</p>
                  <p className="font-medium">
                    {format(new Date(selectedEngagement.date_engagement), 'dd MMMM yyyy', {
                      locale: fr,
                    })}
                  </p>
                </div>
              </div>

              {/* Checklist */}
              <EngagementChecklist
                engagementId={selectedEngagement.id}
                canEdit={selectedEngagement.statut === 'brouillon'}
                showProgress={true}
                onCompletenessChange={handleChecklistChange}
                blockSubmitIfIncomplete={true}
              />
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Fermer
            </Button>
            {selectedEngagement?.statut === 'brouillon' && (
              <Button
                onClick={handleSubmit}
                disabled={!isChecklistComplete || submitMutation.isPending}
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
