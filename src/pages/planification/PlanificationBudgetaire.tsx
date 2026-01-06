import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useExercice } from "@/contexts/ExerciceContext";
import { useBudgetLines, useCreditTransfers, BudgetLineWithRelations, BudgetLineFilters } from "@/hooks/useBudgetLines";
import { BudgetLineTable } from "@/components/budget/BudgetLineTable";
import { BudgetLineForm } from "@/components/budget/BudgetLineForm";
import { BudgetFilters } from "@/components/budget/BudgetFilters";
import { BudgetImportAdvanced } from "@/components/budget/BudgetImportAdvanced";
import { BudgetLineHistory } from "@/components/budget/BudgetLineHistory";
import { BudgetValidation } from "@/components/budget/BudgetValidation";
import { BudgetVersionHistory } from "@/components/budget/BudgetVersionHistory";
import { CreditTransferForm } from "@/components/budget/CreditTransferForm";
import { CreditTransferList } from "@/components/budget/CreditTransferList";
import { 
  Wallet, 
  Plus, 
  Upload, 
  Download, 
  ArrowLeftRight,
  Target,
  FileCheck,
  ShieldCheck,
  History,
  AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + " FCFA";
};

export default function PlanificationBudgetaire() {
  const { exercice } = useExercice();
  const [filters, setFilters] = useState<BudgetLineFilters>({});
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [editingLine, setEditingLine] = useState<BudgetLineWithRelations | null>(null);
  const [selectedLineForHistory, setSelectedLineForHistory] = useState<BudgetLineWithRelations | null>(null);

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
  } = useBudgetLines(filters);

  const {
    transfers,
    isLoading: isLoadingTransfers,
    createTransfer,
    approveTransfer,
    rejectTransfer,
    isCreating: isCreatingTransfer,
  } = useCreditTransfers();

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

  const handleExport = async () => {
    if (!budgetLines || budgetLines.length === 0) {
      toast.error("Aucune donnée à exporter");
      return;
    }

    const headers = [
      "code",
      "label",
      "level",
      "dotation_initiale",
      "source_financement",
      "direction",
      "os",
      "statut",
    ].join(";");

    const rows = budgetLines.map((line) =>
      [
        line.code,
        line.label,
        line.level,
        line.dotation_initiale,
        line.source_financement || "",
        line.direction?.code || "",
        line.objectif_strategique?.code || "",
        line.statut || "brouillon",
      ].join(";")
    );

    const content = [headers, ...rows].join("\n");
    const blob = new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `budget_${exercice}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success(`Export de ${budgetLines.length} lignes réussi`);
  };

  // Calculate stats
  const validatedLines = budgetLines?.filter((l) => l.statut === "valide").length || 0;
  const pendingLines = budgetLines?.filter((l) => l.statut === "soumis").length || 0;
  const brouillonLines = budgetLines?.filter((l) => !l.statut || l.statut === "brouillon").length || 0;
  const pendingTransfers = transfers?.filter((t) => t.status === "en_attente").length || 0;
  const isBudgetValidated = validatedLines === totals.count && totals.count > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Planification Budgétaire</h1>
            <p className="page-description">
              Élaboration et suivi du budget - Exercice {exercice}
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            Exercice {exercice}
          </Badge>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowVersionHistory(true)}>
              <History className="mr-2 h-4 w-4" />
              Historique
            </Button>
            <Button size="sm" onClick={() => setShowValidation(true)}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Valider le budget
            </Button>
          </div>
        </div>
      </div>

      {/* Alert if budget not validated */}
      {totals.count > 0 && !isBudgetValidated && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Budget non validé</AlertTitle>
          <AlertDescription>
            Le budget n'est pas encore validé globalement. Il n'alimentera pas le tableau de bord tant qu'il n'est pas validé.
          </AlertDescription>
        </Alert>
      )}

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Budget Total
            </CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.dotation)}</div>
            <p className="text-xs text-muted-foreground">Dotation initiale</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lignes budgétaires
            </CardTitle>
            <Target className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.count}</div>
            <p className="text-xs text-muted-foreground">
              {validatedLines} validée(s), {pendingLines} en attente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taux validation
            </CardTitle>
            <FileCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totals.count > 0 ? Math.round((validatedLines / totals.count) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Lignes validées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Virements
            </CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTransfers}</div>
            <p className="text-xs text-muted-foreground">En attente d'approbation</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="budget" className="space-y-4">
        <TabsList>
          <TabsTrigger value="budget">Lignes budgétaires</TabsTrigger>
          <TabsTrigger value="transfers">
            Virements de crédits
            {pendingTransfers > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingTransfers}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="budget" className="space-y-4">
          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle ligne
            </Button>
            <Button variant="outline" onClick={() => setShowImport(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Importer CSV
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Exporter CSV
            </Button>
            <Button variant="outline" onClick={() => setShowTransferForm(true)}>
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              Virement de crédits
            </Button>
          </div>

          {/* Filters */}
          <BudgetFilters filters={filters} onFiltersChange={setFilters} />

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>Structure budgétaire</CardTitle>
              <CardDescription>
                {totals.count} ligne(s) - Total: {formatCurrency(totals.dotation)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chargement...
                </div>
              ) : (
                <BudgetLineTable
                  lines={budgetLines || []}
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

        <TabsContent value="transfers" className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={() => setShowTransferForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle demande
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Demandes de virement</CardTitle>
              <CardDescription>
                Transferts de crédits entre lignes budgétaires
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTransfers ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chargement...
                </div>
              ) : (
                <CreditTransferList
                  transfers={transfers || []}
                  onApprove={approveTransfer}
                  onReject={(id, reason) => rejectTransfer({ id, reason })}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
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

      <BudgetImportAdvanced
        open={showImport}
        onOpenChange={setShowImport}
        onSuccess={() => {
          // Refresh handled by react-query
        }}
      />

      <BudgetValidation
        open={showValidation}
        onOpenChange={setShowValidation}
        totalLines={totals.count}
        validatedLines={validatedLines}
        pendingLines={pendingLines}
        totalDotation={totals.dotation}
        onSuccess={() => {
          // Refresh handled by react-query
        }}
      />

      <BudgetVersionHistory
        open={showVersionHistory}
        onOpenChange={setShowVersionHistory}
      />

      <CreditTransferForm
        open={showTransferForm}
        onOpenChange={setShowTransferForm}
        onSubmit={(data) => {
          createTransfer(data);
          setShowTransferForm(false);
        }}
        isLoading={isCreatingTransfer}
      />

      <BudgetLineHistory
        open={showHistory}
        onOpenChange={setShowHistory}
        budgetLine={selectedLineForHistory}
      />
    </div>
  );
}