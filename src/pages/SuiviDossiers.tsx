import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  FolderOpen,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useDossiers, type Dossier } from '@/hooks/useDossiers';
import { ETAPE_LABELS } from '@/hooks/useDossierDetails';

const formatMontant = (montant: number | null | undefined) => {
  if (montant == null) return '0 FCFA';
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
};

const formatDate = (date: string | null | undefined) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR');
};

function getStatutBadge(statut: string | null) {
  switch (statut) {
    case 'en_cours':
      return (
        <Badge variant="default" className="bg-blue-500">
          En cours
        </Badge>
      );
    case 'termine':
      return (
        <Badge variant="default" className="bg-green-600">
          Termine
        </Badge>
      );
    case 'annule':
      return <Badge variant="destructive">Annule</Badge>;
    case 'suspendu':
      return <Badge variant="secondary">Suspendu</Badge>;
    case 'bloque':
      return (
        <Badge variant="destructive" className="bg-orange-500">
          Bloque
        </Badge>
      );
    default:
      return <Badge variant="outline">{statut || 'N/A'}</Badge>;
  }
}

function getEtapeLabel(etape: string | null): string {
  if (!etape) return '-';
  return ETAPE_LABELS[etape] ?? etape;
}

export default function SuiviDossiers() {
  const navigate = useNavigate();
  const { dossiers, loading, directions, stats, pagination, fetchDossiers } = useDossiers();

  const [search, setSearch] = useState('');
  const [directionFilter, setDirectionFilter] = useState('');
  const [statutFilter, setStatutFilter] = useState('');

  const getFilters = () => ({
    search,
    direction_id: directionFilter === 'all' ? '' : directionFilter,
    statut: statutFilter === 'all' ? '' : statutFilter,
  });

  const handleSearch = () => {
    fetchDossiers(getFilters());
  };

  const handlePageChange = (newPage: number) => {
    fetchDossiers(getFilters(), newPage, pagination.pageSize);
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <FolderOpen className="h-6 w-6" />
          Suivi des Dossiers
        </h1>
        <p className="page-description">
          Vue unifiee de tous les dossiers et leur progression dans la chaine de depense
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Briefcase className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En cours</p>
                <p className="text-2xl font-bold text-blue-600">{stats.en_cours}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Termines</p>
                <p className="text-2xl font-bold text-green-600">{stats.termines}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Suspendus</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.suspendus}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Annules</p>
                <p className="text-2xl font-bold text-red-600">{stats.annules}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Montants */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Montant total estime</p>
            <p className="text-lg font-bold text-primary">{formatMontant(stats.montant_total)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Montant engage</p>
            <p className="text-lg font-bold">{formatMontant(stats.montant_engage)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Montant liquide</p>
            <p className="text-lg font-bold">{formatMontant(stats.montant_liquide)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Montant paye</p>
            <p className="text-lg font-bold">{formatMontant(stats.montant_paye)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numero ou objet..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Select value={directionFilter} onValueChange={setDirectionFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les directions</SelectItem>
                {directions.map((dir) => (
                  <SelectItem key={dir.id} value={dir.id}>
                    {dir.sigle || dir.code} - {dir.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statutFilter} onValueChange={setStatutFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="en_cours">En cours</SelectItem>
                <SelectItem value="termine">Termine</SelectItem>
                <SelectItem value="suspendu">Suspendu</SelectItem>
                <SelectItem value="bloque">Bloque</SelectItem>
                <SelectItem value="annule">Annule</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>
              <Search className="mr-2 h-4 w-4" />
              Filtrer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des dossiers</CardTitle>
          <CardDescription>
            {pagination.total} dossier(s) - Page {pagination.page} / {totalPages || 1}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : dossiers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun dossier trouve</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Objet</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Etape actuelle</TableHead>
                    <TableHead className="text-right">Montant estime</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date creation</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dossiers.map((dossier: Dossier) => (
                    <TableRow
                      key={dossier.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/suivi-dossiers/${dossier.id}`)}
                    >
                      <TableCell className="font-mono text-sm font-medium">
                        {dossier.numero}
                      </TableCell>
                      <TableCell className="max-w-[250px] truncate">{dossier.objet}</TableCell>
                      <TableCell>
                        {dossier.direction?.sigle || dossier.direction?.code || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getEtapeLabel(dossier.etape_courante)}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMontant(dossier.montant_estime)}
                      </TableCell>
                      <TableCell>{getStatutBadge(dossier.statut_global)}</TableCell>
                      <TableCell>{formatDate(dossier.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/suivi-dossiers/${dossier.id}`);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Affichage {(pagination.page - 1) * pagination.pageSize + 1} -{' '}
                    {Math.min(pagination.page * pagination.pageSize, pagination.total)} sur{' '}
                    {pagination.total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => handlePageChange(pagination.page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Precedent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= totalPages}
                      onClick={() => handlePageChange(pagination.page + 1)}
                    >
                      Suivant
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
