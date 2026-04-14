/**
 * Page de gestion des soumissions de feuilles de route
 * Liste avec filtres, actions de validation/rejet, export, pagination
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Input } from '@/components/ui/input';
import {
  FileCheck,
  FileText,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Loader2,
  Search,
  Building2,
  FileSpreadsheet,
  AlertTriangle,
  Send,
  ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { ExportButtons } from '@/components/etats/ExportButtons';
import { ExportColumn } from '@/lib/export';
import { NotesPagination } from '@/components/shared/NotesPagination';
import {
  useRoadmapSubmissions,
  useSubmissionDirections,
  SubmissionStatus,
} from '@/hooks/useRoadmapSubmissions';
import { RoadmapSubmissionDetailDialog } from '@/components/planification/RoadmapSubmissionDetail';

const STATUS_CONFIG: Record<
  SubmissionStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  brouillon: {
    label: 'Brouillon',
    color: 'bg-muted/50 text-muted-foreground border-muted',
    icon: <FileText className="h-3 w-3" />,
  },
  soumis: {
    label: 'En attente',
    color: 'bg-warning/10 text-warning border-warning/20',
    icon: <Clock className="h-3 w-3" />,
  },
  en_revision: {
    label: 'En révision',
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    icon: <RotateCcw className="h-3 w-3" />,
  },
  valide: {
    label: 'Validé',
    color: 'bg-success/10 text-success border-success/20',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  rejete: {
    label: 'Rejeté',
    color: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: <XCircle className="h-3 w-3" />,
  },
};

export default function RoadmapSubmissionsPage() {
  const [directionFilter, setDirectionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data: directions = [] } = useSubmissionDirections();
  const {
    submissions,
    stats,
    isLoading,
    refetch,
    validate,
    reject,
    requestRevision,
    isValidating,
    isRejecting,
    isRequestingRevision,
  } = useRoadmapSubmissions({
    directionId: directionFilter !== 'all' ? directionFilter : undefined,
    status: statusFilter !== 'all' ? (statusFilter as SubmissionStatus) : undefined,
    search: searchFilter || undefined,
  });

  // Directions actives (pour alerte "non soumises")
  const { data: allDirections = [] } = useQuery({
    queryKey: ['all-active-directions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('directions')
        .select('id, code, label, sigle')
        .eq('est_active', true);
      return data ?? [];
    },
    staleTime: 30_000,
  });

  const submittedDirectionIds = new Set(
    submissions.map((s: { direction_id: string }) => s.direction_id)
  );
  const missingDirections = allDirections.filter(
    (d: { id: string }) => !submittedDirectionIds.has(d.id)
  );
  // Afficher l'alerte seulement si au moins une soumission existe ET qu'il manque des directions
  // Si aucune soumission n'existe, on ne peut pas conclure que des directions sont "en retard"
  const shouldShowAlert = !isLoading && submissions.length > 0 && missingDirections.length > 0;

  const getAgingDays = (submission: { submitted_at: string | null; created_at: string }) => {
    const refDate = submission.submitted_at || submission.created_at;
    return Math.ceil((Date.now() - new Date(refDate).getTime()) / (1000 * 60 * 60 * 24));
  };

  const totalPages = Math.ceil(submissions.length / pageSize);
  const paginatedData = submissions.slice((page - 1) * pageSize, page * pageSize);

  // Export
  const exportColumns: ExportColumn[] = [
    { key: 'direction_code', label: 'Direction', type: 'text' },
    { key: 'libelle', label: 'Libellé', type: 'text' },
    { key: 'nb_activites', label: 'Activités', type: 'text' },
    { key: 'montant_total', label: 'Montant', type: 'currency' },
    { key: 'status', label: 'Statut', type: 'text' },
    { key: 'submitted_at', label: 'Date soumission', type: 'date' },
  ];
  const exportData = submissions.map((s) => {
    const dir = (s as unknown as { direction?: { code?: string; sigle?: string } }).direction;
    return {
      ...s,
      direction_code: dir?.sigle || dir?.code || '',
    };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FileCheck className="h-6 w-6" />
            Soumissions Feuilles de Route
          </h1>
          <p className="page-description">
            Validation et suivi des feuilles de route par direction
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButtons
            data={exportData as unknown as Record<string, unknown>[]}
            columns={exportColumns}
            filename="soumissions_feuilles_route"
            title="Soumissions Feuilles de Route"
            showCopy
            showPrint
          />
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Actualiser
          </Button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className={stats.soumis > 0 ? 'border-warning/30 bg-warning/5' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-warning">{stats.soumis}</p>
              </div>
              <Send className="h-8 w-8 text-warning/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">En révision</p>
            <p className="text-2xl font-bold text-blue-600">{stats.en_revision}</p>
          </CardContent>
        </Card>
        <Card className={stats.valide > 0 ? 'border-success/30' : ''}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Validés</p>
            <p className="text-2xl font-bold text-success">{stats.valide}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Rejetés</p>
            <p className="text-2xl font-bold text-destructive">{stats.rejete}</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerte directions non soumises */}
      {shouldShowAlert && (
        <Card className="border-l-4 border-l-warning">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">
                {missingDirections.length} direction(s) n&apos;ont pas encore soumis de feuille de
                route
              </span>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {missingDirections.map((d: { id: string; sigle: string | null; code: string }) => (
                <Badge key={d.id} variant="outline">
                  {d.sigle || d.code}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par libellé ou direction..."
                value={searchFilter}
                onChange={(e) => {
                  setSearchFilter(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={directionFilter}
              onValueChange={(v) => {
                setDirectionFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
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
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="soumis">En attente</SelectItem>
                <SelectItem value="en_revision">En révision</SelectItem>
                <SelectItem value="valide">Validés</SelectItem>
                <SelectItem value="rejete">Rejetés</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Soumissions
          </CardTitle>
          <CardDescription>
            {submissions.length} soumission(s) — cliquez sur une ligne pour voir les détails
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <FileSpreadsheet className="h-16 w-16 mx-auto mb-6 opacity-30" />
              <p className="text-lg font-medium mb-2">Aucune soumission trouvée</p>
              <p className="text-sm max-w-md mx-auto">
                Les directions soumettent leurs feuilles de route via l'import d'activités ou depuis
                leur espace direction.
              </p>
              <Button
                variant="outline"
                className="mt-6 gap-2"
                onClick={() => window.open('/planification/feuilles-route', '_blank')}
              >
                <ArrowRight className="h-4 w-4" />
                Aller à l'Import Activités
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Direction</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead className="text-right">Activités</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="hidden md:table-cell">Soumis par</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead>Délai</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((submission) => {
                  const statusConfig = STATUS_CONFIG[submission.status as SubmissionStatus];
                  const days = getAgingDays(submission);
                  return (
                    <TableRow
                      key={submission.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedSubmissionId(submission.id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {submission.direction?.sigle || submission.direction?.code || '—'}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 truncate max-w-[150px]">
                          {submission.direction?.label}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="truncate font-medium">{submission.libelle}</div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {submission.nb_activites}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(submission.montant_total)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusConfig.color + ' gap-1'}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {submission.submitted_by_profile?.full_name || '—'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {submission.submitted_at
                          ? format(new Date(submission.submitted_at), 'dd/MM/yyyy', { locale: fr })
                          : format(new Date(submission.created_at), 'dd/MM/yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        {days > 14 ? (
                          <Badge variant="destructive" className="text-xs gap-0.5">
                            <Clock className="h-3 w-3" />
                            {days}j
                          </Badge>
                        ) : days >= 7 ? (
                          <Badge
                            variant="outline"
                            className="bg-warning/10 text-warning border-warning/20 text-xs gap-0.5"
                          >
                            <Clock className="h-3 w-3" />
                            {days}j
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">{days}j</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSubmissionId(submission.id);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Détails
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {submissions.length > 0 && (
        <NotesPagination
          page={page}
          pageSize={pageSize}
          total={submissions.length}
          totalPages={totalPages}
          onPageChange={setPage}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(1);
          }}
        />
      )}

      {/* Dialog de détail */}
      <RoadmapSubmissionDetailDialog
        submissionId={selectedSubmissionId}
        open={!!selectedSubmissionId}
        onOpenChange={(open) => {
          if (!open) setSelectedSubmissionId(null);
        }}
        onValidate={(comment) => {
          if (selectedSubmissionId) validate({ submissionId: selectedSubmissionId, comment });
        }}
        onReject={(reason) => {
          if (selectedSubmissionId) reject({ submissionId: selectedSubmissionId, reason });
        }}
        onRequestRevision={(comment) => {
          if (selectedSubmissionId)
            requestRevision({ submissionId: selectedSubmissionId, comment });
        }}
        isValidating={isValidating}
        isRejecting={isRejecting}
        isRequestingRevision={isRequestingRevision}
      />
    </div>
  );
}
