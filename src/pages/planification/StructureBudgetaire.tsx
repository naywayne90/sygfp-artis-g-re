import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useExercice } from '@/contexts/ExerciceContext';
import { useBudgetLines, BudgetLineWithRelations, BudgetLineFilters } from '@/hooks/useBudgetLines';
import { useBaseReferentiels } from '@/hooks/useBaseReferentiels';
import { BudgetLineTable } from '@/components/budget/BudgetLineTable';
import { BudgetTreeView } from '@/components/budget/BudgetTreeView';
import { BudgetLineForm } from '@/components/budget/BudgetLineForm';
import { BudgetFilters } from '@/components/budget/BudgetFilters';
import { BudgetLineHistory } from '@/components/budget/BudgetLineHistory';
import { BudgetFormulas } from '@/components/budget/BudgetFormulas';
import { EmptyStateNoData } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import {
  exportToCSV,
  exportToExcel,
  exportToPDF,
  type ExportColumn,
  type ExportOptions,
  formatters,
} from '@/lib/export/export-service';
import {
  Wallet,
  Plus,
  TreePine,
  List,
  Search,
  Target,
  Building2,
  Briefcase,
  ShieldCheck,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  ChevronDown,
  FileText,
  Sheet,
} from 'lucide-react';
import { toast } from 'sonner';

const formatCurrency = (amount: number) => {
  return (
    new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' FCFA'
  );
};

export default function StructureBudgetaire() {
  const { exercice } = useExercice();
  const [activeTab, setActiveTab] = useState('lignes');
  const [filters, setFilters] = useState<BudgetLineFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editingLine, setEditingLine] = useState<BudgetLineWithRelations | null>(null);
  const [selectedLineForHistory, setSelectedLineForHistory] =
    useState<BudgetLineWithRelations | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'tree'>('table');

  const {
    budgetLines,
    isLoading,
    totals,
    createBudgetLine,
    updateBudgetLine,
    submitBudgetLine,
    validateBudgetLine,
    rejectBudgetLine,
    deleteBudgetLine,
    isCreating,
    isUpdating,
  } = useBudgetLines({ ...filters, keyword: searchTerm || undefined });

  const { directions, objectifsStrategiques, missions } = useBaseReferentiels();

  // Stats
  const validatedLines = budgetLines?.filter((l) => l.statut === 'valide').length || 0;
  const pendingLines = budgetLines?.filter((l) => l.statut === 'soumis').length || 0;
  const draftLines = budgetLines?.filter((l) => !l.statut || l.statut === 'brouillon').length || 0;

  const handleFormSubmit = (data: Partial<BudgetLineWithRelations>) => {
    if (editingLine) {
      updateBudgetLine({ id: editingLine.id, data });
    } else {
      createBudgetLine(data);
    }
    setShowForm(false);
    setEditingLine(null);
  };

  const handleEdit = (line: BudgetLineWithRelations) => {
    setEditingLine(line);
    setShowForm(true);
  };

  const handleViewHistory = (line: BudgetLineWithRelations) => {
    setSelectedLineForHistory(line);
    setShowHistory(true);
  };

  // --- Export columns definition ---
  const exportColumns: ExportColumn[] = [
    { key: 'code', label: 'Code Imputation', type: 'text', width: 22 },
    { key: 'label', label: 'Libellé', type: 'text', width: 40 },
    { key: 'level', label: 'Niveau', type: 'text', width: 12 },
    { key: 'direction.code', label: 'Dir. Code', type: 'text', width: 8 },
    { key: 'direction.label', label: 'Direction', type: 'text', width: 25 },
    { key: 'objectif_strategique.code', label: 'OS Code', type: 'text', width: 8 },
    { key: 'objectif_strategique.libelle', label: 'Objectif Stratégique', type: 'text', width: 30 },
    { key: 'source_financement', label: 'Source Financement', type: 'text', width: 18 },
    { key: 'dotation_initiale', label: 'Dotation Initiale', type: 'currency', width: 18 },
    { key: 'dotation_modifiee', label: 'Dotation Modifiée', type: 'currency', width: 18 },
    { key: 'total_engage', label: 'Engagé', type: 'currency', width: 15 },
    { key: 'total_liquide', label: 'Liquidé', type: 'currency', width: 15 },
    { key: 'total_ordonnance', label: 'Ordonnancé', type: 'currency', width: 15 },
    { key: 'total_paye', label: 'Payé', type: 'currency', width: 15 },
    { key: 'disponible_calcule', label: 'Disponible', type: 'currency', width: 15 },
    {
      key: 'statut',
      label: 'Statut',
      type: 'text',
      width: 12,
      format: (v) => formatters.status(v),
    },
  ];

  const getExportOptions = (): ExportOptions => ({
    title: 'Structure Budgétaire',
    subtitle: `Exercice ${exercice} - ${totals.count} ligne(s)`,
    filename: `structure_budgetaire_${exercice}`,
    exercice: exercice || undefined,
    showTotals: true,
    totalColumns: [
      'dotation_initiale',
      'dotation_modifiee',
      'total_engage',
      'total_liquide',
      'total_ordonnance',
      'total_paye',
      'disponible_calcule',
    ],
    orientation: 'landscape',
  });

  const handleExportCSV = () => {
    if (!budgetLines || budgetLines.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }
    const result = exportToCSV(
      budgetLines as unknown as Record<string, unknown>[],
      exportColumns,
      getExportOptions()
    );
    if (result.success) {
      toast.success(`Export CSV de ${result.rowCount} lignes réussi`);
    } else {
      toast.error(result.error || "Erreur lors de l'export CSV");
    }
  };

  const handleExportExcel = () => {
    if (!budgetLines || budgetLines.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }
    const result = exportToExcel(
      budgetLines as unknown as Record<string, unknown>[],
      exportColumns,
      getExportOptions()
    );
    if (result.success) {
      toast.success(`Export Excel de ${result.rowCount} lignes réussi`);
    } else {
      toast.error(result.error || "Erreur lors de l'export Excel");
    }
  };

  const handleExportPDF = () => {
    if (!budgetLines || budgetLines.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }
    const result = exportToPDF(
      budgetLines as unknown as Record<string, unknown>[],
      exportColumns,
      getExportOptions()
    );
    if (result.success) {
      toast.success(`Export PDF de ${result.rowCount} lignes préparé`);
    } else {
      toast.error(result.error || "Erreur lors de l'export PDF");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Structure Budgétaire"
        description="Organisation et nomenclature du budget"
        icon={Wallet}
        backUrl="/"
      >
        <Badge variant="outline" className="text-lg px-4 py-2">
          Exercice {exercice}
        </Badge>
      </PageHeader>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totals.count}</p>
                <p className="text-sm text-muted-foreground">Lignes budgétaires</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totals.dotation)}</p>
                <p className="text-sm text-muted-foreground">Budget total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{validatedLines}</p>
                <p className="text-sm text-muted-foreground">Validées</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">{pendingLines}</p>
                <p className="text-sm text-muted-foreground">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{draftLines}</p>
                <p className="text-sm text-muted-foreground">Brouillons</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="lignes" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Lignes budgétaires
          </TabsTrigger>
          <TabsTrigger value="os" className="gap-2">
            <Target className="h-4 w-4" />
            Objectifs Stratégiques ({objectifsStrategiques?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="directions" className="gap-2">
            <Building2 className="h-4 w-4" />
            Directions ({directions?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="missions" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Missions ({missions?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Tab: Lignes budgétaires */}
        <TabsContent value="lignes" className="space-y-4">
          {/* Actions */}
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle ligne
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Exporter
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={handleExportCSV}>
                    <FileText className="mr-2 h-4 w-4" />
                    Export CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportExcel}>
                    <Sheet className="mr-2 h-4 w-4" />
                    Export Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportPDF}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex gap-2 items-center">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <div className="flex gap-1 border rounded-md p-1">
                <Button
                  variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'tree' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('tree')}
                >
                  <TreePine className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <BudgetFilters filters={filters} onFiltersChange={setFilters} />

          {/* Formulas */}
          <BudgetFormulas />

          {/* Table/Tree */}
          <Card>
            <CardHeader>
              <CardTitle>Structure budgétaire</CardTitle>
              <CardDescription>
                {totals.count} ligne(s) - Total: {formatCurrency(totals.dotation)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Chargement...</div>
              ) : !budgetLines || budgetLines.length === 0 ? (
                <EmptyStateNoData
                  entityName="ligne budgétaire"
                  actionLabel="Nouvelle ligne"
                  onAction={() => setShowForm(true)}
                />
              ) : viewMode === 'tree' ? (
                <BudgetTreeView
                  lines={budgetLines}
                  onEdit={handleEdit}
                  onDuplicate={() => {}}
                  onSubmit={submitBudgetLine}
                  onValidate={validateBudgetLine}
                  onReject={(id, reason) => rejectBudgetLine({ id, reason })}
                  onDelete={deleteBudgetLine}
                  onViewHistory={handleViewHistory}
                />
              ) : (
                <BudgetLineTable
                  lines={budgetLines}
                  exercice={exercice || new Date().getFullYear()}
                  onEdit={handleEdit}
                  onSubmit={submitBudgetLine}
                  onValidate={validateBudgetLine}
                  onReject={(id, reason) => rejectBudgetLine({ id, reason })}
                  onDelete={deleteBudgetLine}
                  onViewHistory={handleViewHistory}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: OS */}
        <TabsContent value="os">
          <Card>
            <CardHeader>
              <CardTitle>Objectifs Stratégiques</CardTitle>
              <CardDescription>
                Référentiel des objectifs stratégiques utilisés pour l'imputation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {objectifsStrategiques && objectifsStrategiques.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {objectifsStrategiques.map((os) => (
                    <div key={os.id} className="p-4 border rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{os.code}</Badge>
                        <Badge variant="default" className="bg-green-500">
                          Actif
                        </Badge>
                      </div>
                      <p className="mt-2 font-medium">{os.libelle}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyStateNoData entityName="objectif stratégique" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Directions */}
        <TabsContent value="directions">
          <Card>
            <CardHeader>
              <CardTitle>Directions</CardTitle>
              <CardDescription>
                Référentiel des directions pour l'affectation des lignes budgétaires
              </CardDescription>
            </CardHeader>
            <CardContent>
              {directions && directions.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {directions.map((dir) => (
                    <div key={dir.id} className="p-4 border rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{dir.code}</Badge>
                        {dir.sigle && (
                          <span className="text-sm text-muted-foreground">{dir.sigle}</span>
                        )}
                      </div>
                      <p className="mt-2 font-medium">{dir.label}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyStateNoData entityName="direction" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Missions */}
        <TabsContent value="missions">
          <Card>
            <CardHeader>
              <CardTitle>Missions</CardTitle>
              <CardDescription>Référentiel des missions budgétaires</CardDescription>
            </CardHeader>
            <CardContent>
              {missions && missions.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {missions.map((mission) => (
                    <div key={mission.id} className="p-4 border rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{mission.code}</Badge>
                        <Badge variant="default" className="bg-green-500">
                          Actif
                        </Badge>
                      </div>
                      <p className="mt-2 font-medium">{mission.libelle}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyStateNoData entityName="mission" />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Form */}
      <BudgetLineForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingLine(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingLine}
        isLoading={isCreating || isUpdating}
      />

      {/* Dialog: History */}
      <BudgetLineHistory
        open={showHistory}
        onOpenChange={setShowHistory}
        budgetLine={selectedLineForHistory}
      />
    </div>
  );
}
