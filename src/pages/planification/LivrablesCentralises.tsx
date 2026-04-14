/**
 * Page Livrables Centralisés — Refonte complète
 * Vue centralisée pour les validateurs (CB, Chargé de Mission)
 * Onglets À valider / Tous / Validés, filtres avancés, export, état vide guidé
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
import { Textarea } from '@/components/ui/textarea';
import {
  Search,
  FileCheck,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  FileText,
  Send,
  History,
  FolderOpen,
  ArrowRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  PlayCircle,
} from 'lucide-react';
import { useLivrableValidation, TacheLivrable } from '@/hooks/useLivrableValidation';
import { ExportButtons } from '@/components/etats/ExportButtons';
import { ExportColumn } from '@/lib/export';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { NotesPagination } from '@/components/shared/NotesPagination';

const STATUT_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  planifie: {
    label: 'Planifié',
    color: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
    icon: Clock,
  },
  en_cours: {
    label: 'En cours',
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    icon: PlayCircle,
  },
  soumis: { label: 'À valider', color: 'bg-warning/10 text-warning border-warning/20', icon: Send },
  valide: {
    label: 'Validé',
    color: 'bg-success/10 text-success border-success/20',
    icon: CheckCircle2,
  },
  rejete: {
    label: 'Rejeté',
    color: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: XCircle,
  },
  en_retard: {
    label: 'En retard',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: Clock,
  },
};

type SortField = 'nom' | 'date_prevue' | 'statut';
type SortDirection = 'asc' | 'desc';

export default function LivrablesCentralises() {
  const { livrables, isLoading, refetch, validateLivrable, rejectLivrable } =
    useLivrableValidation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatut, setSelectedStatut] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [rejectTarget, setRejectTarget] = useState<TacheLivrable | null>(null);
  const [rejectMotif, setRejectMotif] = useState('');
  const [sortField, setSortField] = useState<SortField>('date_prevue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3 w-3 ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1" />
    );
  };

  // Filter + sort
  const filtered = useMemo(() => {
    const result = livrables.filter((l) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !l.nom.toLowerCase().includes(q) &&
          !l.tache?.libelle?.toLowerCase().includes(q) &&
          !l.tache?.code?.toLowerCase().includes(q)
        )
          return false;
      }
      if (selectedStatut !== 'all' && l.statut !== selectedStatut) return false;
      return true;
    });

    return [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'nom':
          cmp = a.nom.localeCompare(b.nom);
          break;
        case 'date_prevue':
          cmp = (a.date_prevue || '2099-12-31').localeCompare(b.date_prevue || '2099-12-31');
          break;
        case 'statut':
          cmp = a.statut.localeCompare(b.statut);
          break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [livrables, searchQuery, selectedStatut, sortField, sortDirection]);

  // Computed lists
  const aValider = useMemo(() => filtered.filter((l) => l.statut === 'soumis'), [filtered]);
  const valides = useMemo(() => filtered.filter((l) => l.statut === 'valide'), [filtered]);

  // Stats
  const stats = useMemo(
    () => ({
      total: livrables.length,
      planifie: livrables.filter((l) => l.statut === 'planifie').length,
      en_cours: livrables.filter((l) => l.statut === 'en_cours').length,
      soumis: livrables.filter((l) => l.statut === 'soumis').length,
      valide: livrables.filter((l) => l.statut === 'valide').length,
      rejete: livrables.filter((l) => l.statut === 'rejete').length,
    }),
    [livrables]
  );

  const completionPct = stats.total > 0 ? Math.round((stats.valide / stats.total) * 100) : 0;

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleValidate = (livrable: TacheLivrable) => {
    validateLivrable.mutate({ id: livrable.id });
  };

  const handleReject = () => {
    if (!rejectTarget || !rejectMotif.trim()) return;
    rejectLivrable.mutate(
      { id: rejectTarget.id, motif: rejectMotif },
      {
        onSuccess: () => {
          setRejectTarget(null);
          setRejectMotif('');
        },
      }
    );
  };

  // Export columns
  const exportColumns: ExportColumn[] = [
    { key: 'nom', label: 'Livrable', type: 'text' },
    { key: 'description', label: 'Description', type: 'text' },
    { key: 'tache_code', label: 'Code Tâche', type: 'text' },
    { key: 'tache_libelle', label: 'Tâche', type: 'text' },
    { key: 'date_prevue', label: 'Date prévue', type: 'date' },
    { key: 'statut', label: 'Statut', type: 'text' },
    { key: 'motif_rejet', label: 'Motif rejet', type: 'text' },
  ];

  const exportData = filtered.map((l) => ({
    ...l,
    tache_code: l.tache?.code || '',
    tache_libelle: l.tache?.libelle || '',
  }));

  // Render table
  const renderTable = (data: TacheLivrable[], showActions: boolean) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('nom')}>
            <span className="flex items-center">
              Livrable <SortIcon field="nom" />
            </span>
          </TableHead>
          <TableHead>Tâche associée</TableHead>
          <TableHead
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => handleSort('date_prevue')}
          >
            <span className="flex items-center">
              Date prévue <SortIcon field="date_prevue" />
            </span>
          </TableHead>
          <TableHead className="hidden md:table-cell">Soumis le</TableHead>
          <TableHead
            className="text-center cursor-pointer hover:bg-muted/50"
            onClick={() => handleSort('statut')}
          >
            <span className="flex items-center justify-center">
              Statut <SortIcon field="statut" />
            </span>
          </TableHead>
          <TableHead className="hidden lg:table-cell">Pièce jointe</TableHead>
          {showActions && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((l) => {
          const cfg = STATUT_CONFIG[l.statut] || STATUT_CONFIG.planifie;
          const isOverdue =
            l.date_prevue &&
            l.date_prevue < new Date().toISOString().split('T')[0] &&
            l.statut !== 'valide';
          return (
            <TableRow key={l.id} className={isOverdue ? 'bg-destructive/5' : ''}>
              <TableCell>
                <div className="font-medium">{l.nom}</div>
                {l.description && (
                  <div className="text-xs text-muted-foreground truncate max-w-[250px]">
                    {l.description}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <a
                  href={`/planification/projets/${l.tache?.plan_travail_id}`}
                  className="hover:underline text-primary"
                  onClick={(e) => {
                    if (l.tache?.plan_travail_id) {
                      e.preventDefault();
                      window.open(`/planification/projets/${l.tache.plan_travail_id}`, '_blank');
                    }
                  }}
                >
                  <div className="text-sm font-mono">{l.tache?.code || '-'}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {l.tache?.libelle || '-'}
                  </div>
                </a>
              </TableCell>
              <TableCell>
                {l.date_prevue ? (
                  <span
                    className={`text-sm ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}
                  >
                    {format(new Date(l.date_prevue), 'dd/MM/yyyy', { locale: fr })}
                  </span>
                ) : (
                  <span className="text-muted-foreground/50">—</span>
                )}
              </TableCell>
              <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                {l.soumis_at ? format(new Date(l.soumis_at), 'dd/MM/yyyy', { locale: fr }) : '—'}
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="outline" className={cfg.color}>
                  <cfg.icon className="h-3 w-3 mr-1" />
                  {cfg.label}
                </Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {l.piece_jointe_path ? (
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-600 text-xs">
                    <FileText className="h-3 w-3 mr-1" />
                    Fichier
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground/50">—</span>
                )}
              </TableCell>
              {showActions && (
                <TableCell className="text-right">
                  {l.statut === 'soumis' && (
                    <div className="flex gap-1 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-success border-success/30 hover:bg-success/10"
                        onClick={() => handleValidate(l)}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Valider
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => setRejectTarget(l)}
                      >
                        <XCircle className="h-3 w-3" />
                        Rejeter
                      </Button>
                    </div>
                  )}
                  {l.statut === 'rejete' && l.motif_rejet && (
                    <span className="text-xs text-destructive italic">{l.motif_rejet}</span>
                  )}
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  // Empty state with guidance
  const renderEmptyState = (message: string, hint: string) => (
    <div className="text-center py-16 text-muted-foreground">
      <FileCheck className="h-16 w-16 mx-auto mb-6 opacity-30" />
      <p className="text-lg font-medium mb-2">{message}</p>
      <p className="text-sm max-w-md mx-auto">{hint}</p>
      <Button
        variant="outline"
        className="mt-6 gap-2"
        onClick={() => window.open('/planification/projets', '_blank')}
      >
        <ArrowRight className="h-4 w-4" />
        Aller aux Plans de Travail
      </Button>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FileCheck className="h-6 w-6" />
            Livrables
          </h1>
          <p className="page-description">Vue centralisée des livrables de toutes les directions</p>
        </div>
        <div className="flex gap-2">
          <ExportButtons
            data={exportData as unknown as Record<string, unknown>[]}
            columns={exportColumns}
            filename="livrables_centralises"
            title="Liste des Livrables"
            subtitle="Feuille de Route"
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
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FolderOpen className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card className={stats.soumis > 0 ? 'border-warning/30 bg-warning/5' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">À valider</p>
                <p className="text-2xl font-bold text-warning">{stats.soumis}</p>
              </div>
              <Send className="h-8 w-8 text-warning/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">En cours</p>
            <p className="text-2xl font-bold text-blue-600">{stats.en_cours + stats.planifie}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.planifie} planifié(s) + {stats.en_cours} en cours
            </p>
          </CardContent>
        </Card>
        <Card className={stats.valide > 0 ? 'border-success/30' : ''}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Validés</p>
            <p className="text-2xl font-bold text-success">{stats.valide}</p>
            {stats.total > 0 && (
              <div className="mt-2">
                <Progress value={completionPct} className="h-1.5" />
                <p className="text-xs text-muted-foreground mt-1">{completionPct}% validés</p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Rejetés</p>
            <p className="text-2xl font-bold text-destructive">{stats.rejete}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom de livrable, code ou tâche..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select
              value={selectedStatut}
              onValueChange={(v) => {
                setSelectedStatut(v);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {Object.entries(STATUT_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="a_valider" className="space-y-4">
        <TabsList>
          <TabsTrigger value="a_valider" className="gap-1">
            <Send className="h-4 w-4" />À valider ({aValider.length})
          </TabsTrigger>
          <TabsTrigger value="tous" className="gap-1">
            <FolderOpen className="h-4 w-4" />
            Tous ({filtered.length})
          </TabsTrigger>
          <TabsTrigger value="valides" className="gap-1">
            <History className="h-4 w-4" />
            Validés ({valides.length})
          </TabsTrigger>
        </TabsList>

        {/* À valider */}
        <TabsContent value="a_valider">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-warning" />
                Livrables en attente de validation
              </CardTitle>
              <CardDescription>
                {aValider.length} livrable(s) soumis par les directions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : aValider.length === 0 ? (
                renderEmptyState(
                  'Aucun livrable en attente de validation',
                  'Les directions soumettent leurs livrables depuis le détail de chaque plan de travail. Revenez plus tard ou consultez l\'onglet "Tous".'
                )
              ) : (
                renderTable(aValider, true)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tous */}
        <TabsContent value="tous">
          <Card>
            <CardHeader>
              <CardTitle>Tous les livrables</CardTitle>
              <CardDescription>{filtered.length} livrable(s) au total</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filtered.length === 0 ? (
                renderEmptyState(
                  'Aucun livrable dans le système',
                  'Les livrables sont créés dans les plans de travail. Allez dans Projets & Plans, ouvrez un plan et ajoutez des tâches avec des livrables.'
                )
              ) : (
                <>
                  {renderTable(paginatedData, true)}
                  <NotesPagination
                    page={page}
                    pageSize={pageSize}
                    total={filtered.length}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    onPageSizeChange={(s) => {
                      setPageSize(s);
                      setPage(1);
                    }}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Validés */}
        <TabsContent value="valides">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                Livrables validés
              </CardTitle>
              <CardDescription>{valides.length} livrable(s) validé(s)</CardDescription>
            </CardHeader>
            <CardContent>
              {valides.length === 0
                ? renderEmptyState(
                    'Aucun livrable validé pour le moment',
                    'Les livrables validés apparaîtront ici une fois que le CB ou le Chargé de Mission les aura approuvés.'
                  )
                : renderTable(valides, false)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <AlertDialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Rejeter le livrable
            </AlertDialogTitle>
            <AlertDialogDescription>
              Vous allez rejeter le livrable <strong>{rejectTarget?.nom}</strong>
              {rejectTarget?.tache?.libelle && (
                <>
                  {' '}
                  de la tâche <strong>{rejectTarget.tache.code}</strong>
                </>
              )}
              . Le motif sera visible par la direction concernée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Motif du rejet (obligatoire)..."
            value={rejectMotif}
            onChange={(e) => setRejectMotif(e.target.value)}
            rows={3}
          />
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setRejectTarget(null);
                setRejectMotif('');
              }}
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={!rejectMotif.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Rejeter le livrable
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
