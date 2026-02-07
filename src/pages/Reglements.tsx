import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import {
  Search,
  Plus,
  Wallet,
  CheckCircle,
  Clock,
  TrendingUp,
  CreditCard,
  Lock,
  Tag,
  FolderCheck,
  Filter,
  X,
  CalendarIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { BudgetChainExportButton } from '@/components/export/BudgetChainExportButton';
import { useReglements, MODES_PAIEMENT, type ReglementWithRelations } from '@/hooks/useReglements';
import { useExercice } from '@/contexts/ExerciceContext';
import { useExerciceWriteGuard } from '@/hooks/useExerciceWriteGuard';
import { ExerciceSubtitle } from '@/components/exercice/ExerciceSubtitle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ReglementForm } from '@/components/reglement/ReglementForm';
import { ReglementList } from '@/components/reglement/ReglementList';
import { ReglementDetails } from '@/components/reglement/ReglementDetails';
import { BordereauReglement } from '@/components/reglement/BordereauReglement';
import { WorkflowStepIndicator } from '@/components/workflow/WorkflowStepIndicator';
import { ModuleHelp, MODULE_HELP_CONFIG } from '@/components/help/ModuleHelp';

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
};

export default function Reglements() {
  const { exercice } = useExercice();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canWrite, getDisabledMessage } = useExerciceWriteGuard();
  const { reglements, stats, ordonnancementsValides } = useReglements();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedReglement, setSelectedReglement] = useState<ReglementWithRelations | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('a_traiter');
  const [preselectedOrdId, setPreselectedOrdId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Advanced filters state
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [montantMin, setMontantMin] = useState<string>('');
  const [montantMax, setMontantMax] = useState<string>('');
  const [filterStatut, setFilterStatut] = useState<string>('all');
  const [filterModePaiement, setFilterModePaiement] = useState<string>('all');
  const [filterBeneficiaire, setFilterBeneficiaire] = useState<string>('all');

  // Handle sourceOrdonnancement URL parameter
  useEffect(() => {
    const sourceOrdId = searchParams.get('sourceOrdonnancement');
    if (sourceOrdId) {
      setPreselectedOrdId(sourceOrdId);
      setShowCreateDialog(true);
      searchParams.delete('sourceOrdonnancement');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Extract unique beneficiaires for filter
  const uniqueBeneficiaires = useMemo(() => {
    const set = new Set<string>();
    reglements.forEach((r) => {
      const b = r.ordonnancement?.beneficiaire;
      if (b) set.add(b);
    });
    return Array.from(set).sort();
  }, [reglements]);

  // Count active filters
  const activeFiltersCount = [
    dateFrom,
    dateTo,
    montantMin,
    montantMax,
    filterStatut !== 'all' ? filterStatut : null,
    filterModePaiement !== 'all' ? filterModePaiement : null,
    filterBeneficiaire !== 'all' ? filterBeneficiaire : null,
  ].filter(Boolean).length;

  const resetFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setMontantMin('');
    setMontantMax('');
    setFilterStatut('all');
    setFilterModePaiement('all');
    setFilterBeneficiaire('all');
  };

  // Filtrer les reglements with advanced filters
  const filteredReglements = useMemo(() => {
    return reglements.filter((reg) => {
      // Text search
      const matchesSearch =
        !searchQuery ||
        reg.numero?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reg.ordonnancement?.numero?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reg.ordonnancement?.beneficiaire?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Period filter
      if (dateFrom && reg.date_paiement) {
        const regDate = new Date(reg.date_paiement);
        if (regDate < dateFrom) return false;
      }
      if (dateTo && reg.date_paiement) {
        const regDate = new Date(reg.date_paiement);
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (regDate > endOfDay) return false;
      }

      // Amount range filter
      if (montantMin && reg.montant < parseFloat(montantMin)) return false;
      if (montantMax && reg.montant > parseFloat(montantMax)) return false;

      // Status filter
      if (filterStatut !== 'all') {
        const ord = reg.ordonnancement;
        const isFullyPaid = ord && (ord.montant_paye || 0) >= (ord.montant || 0);
        if (filterStatut === 'solde' && !isFullyPaid) return false;
        if (filterStatut === 'partiel' && isFullyPaid) return false;
        if (filterStatut === 'rejete' && reg.statut !== 'rejete') return false;
      }

      // Mode paiement filter
      if (filterModePaiement !== 'all' && reg.mode_paiement !== filterModePaiement) {
        return false;
      }

      // Beneficiaire filter
      if (filterBeneficiaire !== 'all' && reg.ordonnancement?.beneficiaire !== filterBeneficiaire) {
        return false;
      }

      // Tab filter
      if (activeTab === 'soldes') {
        const ord = reg.ordonnancement;
        return ord && (ord.montant_paye || 0) >= (ord.montant || 0);
      }
      if (activeTab === 'partiels') {
        const ord = reg.ordonnancement;
        return ord && (ord.montant_paye || 0) < (ord.montant || 0);
      }

      return true; // "tous" or "a_traiter" tab
    });
  }, [
    reglements,
    searchQuery,
    dateFrom,
    dateTo,
    montantMin,
    montantMax,
    filterStatut,
    filterModePaiement,
    filterBeneficiaire,
    activeTab,
  ]);

  // Calculer les stats
  const reglementsPartiels = reglements.filter((r) => {
    const ord = r.ordonnancement;
    return ord && (ord.montant_paye || 0) < (ord.montant || 0);
  });

  const reglementsSoldes = reglements.filter((r) => {
    const ord = r.ordonnancement;
    return ord && (ord.montant_paye || 0) >= (ord.montant || 0);
  });

  // Payment mode distribution
  const modeDistribution = useMemo(() => {
    const totalAmount = reglements.reduce((s, r) => s + (r.montant || 0), 0);
    const byMode = new Map<string, { count: number; total: number }>();

    for (const r of reglements) {
      const mode = r.mode_paiement || 'autre';
      const existing = byMode.get(mode) || { count: 0, total: 0 };
      existing.count += 1;
      existing.total += r.montant || 0;
      byMode.set(mode, existing);
    }

    return MODES_PAIEMENT.map((m) => {
      const data = byMode.get(m.value) || { count: 0, total: 0 };
      return {
        mode: m.value,
        label: m.label,
        count: data.count,
        total: data.total,
        percentage: totalAmount > 0 ? (data.total / totalAmount) * 100 : 0,
      };
    }).filter((item) => item.count > 0);
  }, [reglements]);

  const handleViewDetails = (reglement: ReglementWithRelations) => {
    setSelectedReglement(reglement);
    setShowDetails(true);
  };

  const handleCreateSuccess = () => {
    setShowCreateDialog(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Indicateur de workflow */}
      <WorkflowStepIndicator currentStep={8} />

      {/* Aide contextuelle */}
      <ModuleHelp {...MODULE_HELP_CONFIG.reglements} />

      {/* Page Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <ExerciceSubtitle
          title="Règlements"
          description="Enregistrement des paiements effectués (étape 4)"
        />
        <div className="flex gap-2">
          <BordereauReglement reglements={reglements} exercice={exercice} />
          <BudgetChainExportButton step="reglement" />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    className="gap-2"
                    onClick={() => setShowCreateDialog(true)}
                    disabled={!canWrite || ordonnancementsValides.length === 0}
                  >
                    {!canWrite ? <Lock className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    Enregistrer un règlement
                  </Button>
                </span>
              </TooltipTrigger>
              {!canWrite && (
                <TooltipContent>
                  <p>{getDisabledMessage()}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par numero, ordonnancement ou beneficiaire..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                variant={showFilters ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filtres
                {activeFiltersCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1">
                  <X className="h-4 w-4" />
                  Reinitialiser
                </Button>
              )}
            </div>

            {/* Advanced filters panel */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t">
                {/* Period: date from */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Date debut</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !dateFrom && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? format(dateFrom, 'dd/MM/yyyy') : 'Depuis...'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Period: date to */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Date fin</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !dateTo && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateTo ? format(dateTo, 'dd/MM/yyyy') : "Jusqu'a..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={dateTo} onSelect={setDateTo} locale={fr} />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Amount range: min */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Montant min (FCFA)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={montantMin}
                    onChange={(e) => setMontantMin(e.target.value)}
                    className="h-9"
                  />
                </div>

                {/* Amount range: max */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Montant max (FCFA)</Label>
                  <Input
                    type="number"
                    placeholder="Illimite"
                    value={montantMax}
                    onChange={(e) => setMontantMax(e.target.value)}
                    className="h-9"
                  />
                </div>

                {/* Status filter */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Statut</Label>
                  <Select value={filterStatut} onValueChange={setFilterStatut}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="solde">Solde</SelectItem>
                      <SelectItem value="partiel">Partiel</SelectItem>
                      <SelectItem value="rejete">Rejete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Mode paiement filter */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Mode de paiement</Label>
                  <Select value={filterModePaiement} onValueChange={setFilterModePaiement}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Tous les modes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les modes</SelectItem>
                      {MODES_PAIEMENT.map((mode) => (
                        <SelectItem key={mode.value} value={mode.value}>
                          {mode.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Beneficiaire filter */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs text-muted-foreground">
                    Beneficiaire / Fournisseur
                  </Label>
                  <Select value={filterBeneficiaire} onValueChange={setFilterBeneficiaire}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Tous les beneficiaires" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les beneficiaires</SelectItem>
                      {uniqueBeneficiaires.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total reglements</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Wallet className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Montant total paye</p>
                <p className="text-2xl font-bold text-success">
                  {formatMontant(stats.totalMontant)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-success/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ordonnancements soldes</p>
                <p className="text-2xl font-bold text-primary">{reglementsSoldes.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente (partiels)</p>
                <p className="text-2xl font-bold text-warning">{ordonnancementsValides.length}</p>
              </div>
              <Clock className="h-8 w-8 text-warning/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment mode distribution */}
      {reglements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Repartition par mode de paiement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {modeDistribution.map((item) => (
                <div
                  key={item.mode}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.count} reglement(s)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatMontant(item.total)}</p>
                    <p className="text-xs text-muted-foreground">{item.percentage.toFixed(0)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Règlements Table with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des règlements</CardTitle>
          <CardDescription>{filteredReglements.length} règlement(s) trouvé(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="a_traiter" className="gap-1">
                <Tag className="h-3 w-3" />À payer ({ordonnancementsValides.length})
              </TabsTrigger>
              <TabsTrigger value="tous" className="gap-2">
                <CreditCard className="h-4 w-4" />
                Tous
                <Badge variant="secondary" className="ml-1">
                  {reglements.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="soldes" className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Soldés
                <Badge variant="secondary" className="ml-1">
                  {reglementsSoldes.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="partiels" className="gap-2">
                <Clock className="h-4 w-4" />
                Partiels
                <Badge variant="secondary" className="ml-1">
                  {reglementsPartiels.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            {/* Onglet À traiter - Ordonnancements à payer */}
            <TabsContent value="a_traiter">
              {ordonnancementsValides.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FolderCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun ordonnancement en attente de paiement</p>
                  <p className="text-sm">Les ordonnancements validés apparaîtront ici</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Réf. Ordonnancement</TableHead>
                      <TableHead>Bénéficiaire</TableHead>
                      <TableHead>Mode paiement</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="text-right">Restant</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordonnancementsValides.map((ord) => {
                      const restant = (ord.montant || 0) - (ord.montant_paye || 0);
                      return (
                        <TableRow key={ord.id}>
                          <TableCell className="font-mono text-sm">{ord.numero || '-'}</TableCell>
                          <TableCell>{ord.beneficiaire || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{ord.mode_paiement || '-'}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatMontant(ord.montant || 0)}
                          </TableCell>
                          <TableCell className="text-right text-warning font-medium">
                            {formatMontant(restant)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => {
                                setPreselectedOrdId(ord.id);
                                setShowCreateDialog(true);
                              }}
                            >
                              <Wallet className="mr-2 h-4 w-4" />
                              Payer
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="tous">
              <ReglementList reglements={filteredReglements} onViewDetails={handleViewDetails} />
            </TabsContent>
            <TabsContent value="soldes">
              <ReglementList reglements={filteredReglements} onViewDetails={handleViewDetails} />
            </TabsContent>
            <TabsContent value="partiels">
              <ReglementList reglements={filteredReglements} onViewDetails={handleViewDetails} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enregistrer un règlement</DialogTitle>
            <DialogDescription>
              Enregistrez un paiement pour un ordonnancement validé
            </DialogDescription>
          </DialogHeader>
          <ReglementForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setShowCreateDialog(false)}
            preselectedOrdonnancementId={preselectedOrdId}
          />
        </DialogContent>
      </Dialog>

      {/* Details Sheet */}
      <Sheet open={showDetails} onOpenChange={setShowDetails}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Détails du règlement</SheetTitle>
            <SheetDescription>Informations complètes sur le règlement</SheetDescription>
          </SheetHeader>
          {selectedReglement && (
            <div className="mt-6">
              <ReglementDetails reglement={selectedReglement} />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
