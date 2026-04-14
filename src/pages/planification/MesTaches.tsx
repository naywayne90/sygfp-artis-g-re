/**
 * Page Mes Tâches — Vue globale transversale
 * Affiche toutes les tâches de l'exercice avec filtres, tri, et avancement
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
  Search,
  ListChecks,
  Loader2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Pause,
  XCircle,
  PlayCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useProjetTaches } from '@/hooks/useProjetTaches';
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
  termine: {
    label: 'Terminé',
    color: 'bg-success/10 text-success border-success/20',
    icon: CheckCircle2,
  },
  en_retard: {
    label: 'En retard',
    color: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: AlertTriangle,
  },
  suspendu: {
    label: 'Suspendu',
    color: 'bg-warning/10 text-warning border-warning/20',
    icon: Pause,
  },
  annule: { label: 'Annulé', color: 'bg-muted text-muted-foreground', icon: XCircle },
};

const PRIORITE_CONFIG: Record<string, { label: string; color: string }> = {
  basse: { label: 'Basse', color: 'bg-slate-100 text-slate-600' },
  normale: { label: 'Normale', color: 'bg-blue-100 text-blue-700' },
  haute: { label: 'Haute', color: 'bg-warning/20 text-warning' },
  urgente: { label: 'Urgente', color: 'bg-destructive/20 text-destructive' },
};

type SortField = 'code' | 'libelle' | 'avancement' | 'date_fin' | 'priorite';
type SortDirection = 'asc' | 'desc';

const PRIORITE_ORDER: Record<string, number> = { basse: 0, normale: 1, haute: 2, urgente: 3 };

export default function MesTaches() {
  const { taches, isLoading, refetch, stats } = useProjetTaches();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatut, setSelectedStatut] = useState<string>('all');
  const [selectedPriorite, setSelectedPriorite] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date_fin');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Detect overdue tasks
  const today = new Date().toISOString().split('T')[0];

  // Filter + sort
  const filtered = useMemo(() => {
    const result = taches.filter((t) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !t.code?.toLowerCase().includes(q) &&
          !t.libelle?.toLowerCase().includes(q) &&
          !t.responsable?.full_name?.toLowerCase().includes(q)
        )
          return false;
      }
      if (selectedStatut !== 'all') {
        if (selectedStatut === 'en_retard') {
          if (
            !(t.date_fin && t.date_fin < today && t.statut !== 'termine' && t.statut !== 'annule')
          )
            return false;
        } else if (t.statut !== selectedStatut) return false;
      }
      if (selectedPriorite !== 'all' && t.priorite !== selectedPriorite) return false;
      return true;
    });

    return [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'code':
          cmp = (a.code || '').localeCompare(b.code || '');
          break;
        case 'libelle':
          cmp = (a.libelle || '').localeCompare(b.libelle || '');
          break;
        case 'avancement':
          cmp = a.avancement - b.avancement;
          break;
        case 'date_fin':
          cmp = (a.date_fin || '2099-12-31').localeCompare(b.date_fin || '2099-12-31');
          break;
        case 'priorite':
          cmp = (PRIORITE_ORDER[a.priorite] || 0) - (PRIORITE_ORDER[b.priorite] || 0);
          break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [taches, searchQuery, selectedStatut, selectedPriorite, sortField, sortDirection, today]);

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

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedData = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Count overdue
  const enRetardCount = useMemo(
    () =>
      taches.filter(
        (t) => t.date_fin && t.date_fin < today && t.statut !== 'termine' && t.statut !== 'annule'
      ).length,
    [taches, today]
  );

  const isOverdue = (t: { date_fin: string | null; statut: string }) =>
    t.date_fin && t.date_fin < today && t.statut !== 'termine' && t.statut !== 'annule';

  const getDaysOverdue = (dateFin: string) => {
    const diff = Date.now() - new Date(dateFin).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <ListChecks className="h-6 w-6" />
            Mes Tâches
          </h1>
          <p className="page-description">Vue transversale de toutes les tâches de l'exercice</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      {/* KPI */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total actives</p>
            <p className="text-2xl font-bold">
              {stats.total - stats.annule - (stats.termine || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">En cours</p>
            <p className="text-2xl font-bold text-blue-600">{stats.en_cours}</p>
          </CardContent>
        </Card>
        <Card className={enRetardCount > 0 ? 'border-destructive/30' : ''}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">En retard</p>
            <p className="text-2xl font-bold text-destructive">{enRetardCount}</p>
          </CardContent>
        </Card>
        <Card className="border-success/30">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Terminées</p>
            <p className="text-2xl font-bold text-success">{stats.termine}</p>
            <div className="mt-2">
              <Progress
                value={stats.total > 0 ? Math.round((stats.termine / stats.total) * 100) : 0}
                className="h-1.5"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par code, libellé, responsable..."
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
                <SelectItem value="en_retard">En retard ({enRetardCount})</SelectItem>
                {Object.entries(STATUT_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedPriorite}
              onValueChange={(v) => {
                setSelectedPriorite(v);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes priorités</SelectItem>
                {Object.entries(PRIORITE_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tâches</CardTitle>
          <CardDescription>{filtered.length} tâche(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ListChecks className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune tâche trouvée</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('code')}
                  >
                    <span className="flex items-center">
                      Code <SortIcon field="code" />
                    </span>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('libelle')}
                  >
                    <span className="flex items-center">
                      Tâche <SortIcon field="libelle" />
                    </span>
                  </TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('priorite')}
                  >
                    <span className="flex items-center">
                      Priorité <SortIcon field="priorite" />
                    </span>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 text-center"
                    onClick={() => handleSort('avancement')}
                  >
                    <span className="flex items-center justify-center">
                      Avancement <SortIcon field="avancement" />
                    </span>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('date_fin')}
                  >
                    <span className="flex items-center">
                      Échéance <SortIcon field="date_fin" />
                    </span>
                  </TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((t) => {
                  const statutKey = isOverdue(t) ? 'en_retard' : t.statut;
                  const cfg = STATUT_CONFIG[statutKey] || STATUT_CONFIG.planifie;
                  const prioCfg = PRIORITE_CONFIG[t.priorite] || PRIORITE_CONFIG.normale;
                  const overdue = isOverdue(t);
                  return (
                    <TableRow key={t.id} className={overdue ? 'bg-destructive/5' : ''}>
                      <TableCell className="font-mono text-sm">{t.code}</TableCell>
                      <TableCell>
                        <div className="font-medium max-w-[250px] truncate">{t.libelle}</div>
                        {t.sous_activite && (
                          <div className="text-xs text-muted-foreground truncate max-w-[250px]">
                            {t.sous_activite.code} — {t.sous_activite.libelle}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm font-mono">
                        {t.plan_travail_id ? (
                          <Link
                            to={`/planification/projets/${t.plan_travail_id}`}
                            className="hover:underline text-primary"
                          >
                            {t.plan_travail_id.slice(0, 8)}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {t.responsable?.full_name || t.responsable?.last_name || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={prioCfg.color + ' text-xs'}>
                          {prioCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <Progress value={t.avancement} className="h-2 flex-1" />
                          <span className="text-xs font-medium w-8 text-right">
                            {t.avancement}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {t.date_fin ? (
                          <div className="flex items-center gap-1">
                            <span
                              className={`text-sm ${overdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}
                            >
                              {format(new Date(t.date_fin), 'dd/MM/yyyy', { locale: fr })}
                            </span>
                            {overdue && (
                              <Badge variant="destructive" className="text-xs gap-0.5">
                                <Clock className="h-3 w-3" />
                                {getDaysOverdue(t.date_fin)}j
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={cfg.color}>
                          <cfg.icon className="h-3 w-3 mr-1" />
                          {cfg.label}
                        </Badge>
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
    </div>
  );
}
