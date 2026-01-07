import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FolderOpen, FileText, TrendingUp, Clock, CheckCircle, Ban, Pause } from "lucide-react";
import { useDossiers, Dossier, DossierFilters } from "@/hooks/useDossiers";
import { DossierSearch } from "@/components/dossier/DossierSearch";
import { DossierList } from "@/components/dossier/DossierList";
import { DossierForm } from "@/components/dossier/DossierForm";
import { DossierDetailsEnhanced } from "@/components/dossier/DossierDetailsEnhanced";
import { DossierStatusDialog } from "@/components/dossier/DossierStatusDialog";
import { DossierAssignDialog } from "@/components/dossier/DossierAssignDialog";
import { DossierAttachDialog } from "@/components/dossier/DossierAttachDialog";
import { DossierBlockDialog } from "@/components/dossier/DossierBlockDialog";
import { useExercice } from "@/contexts/ExerciceContext";
import { useToast } from "@/hooks/use-toast";

export default function Recherche() {
  const { 
    dossiers, 
    loading, 
    directions, 
    beneficiaires,
    users,
    stats,
    pagination,
    fetchDossiers, 
    createDossier, 
    updateDossier,
    updateDossierStatus,
    addDocument,
    DEFAULT_FILTERS 
  } = useDossiers();
  const { exercice } = useExercice();
  const { toast } = useToast();
  
  const [filters, setFilters] = useState<Partial<DossierFilters>>(DEFAULT_FILTERS);
  const [showForm, setShowForm] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [editingDossier, setEditingDossier] = useState<Dossier | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showAttachDialog, setShowAttachDialog] = useState(false);
  const [sortField, setSortField] = useState<string>("updated_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Générer la liste des exercices disponibles
  const currentYear = new Date().getFullYear();
  const exercices = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Fetch dossiers when filters change
  useEffect(() => {
    fetchDossiers(filters, pagination.page, pagination.pageSize);
  }, [filters]);

  const handleFiltersChange = useCallback((newFilters: Partial<DossierFilters>) => {
    setFilters(newFilters);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    fetchDossiers(filters, page, pagination.pageSize);
  }, [filters, pagination.pageSize, fetchDossiers]);

  const handlePageSizeChange = useCallback((pageSize: number) => {
    fetchDossiers(filters, 1, pageSize);
  }, [filters, fetchDossiers]);

  const handleSort = useCallback((field: string) => {
    const newDirection = sortField === field && sortDirection === "desc" ? "asc" : "desc";
    setSortField(field);
    setSortDirection(newDirection);
    // In a real implementation, we would pass sort params to fetchDossiers
  }, [sortField, sortDirection]);

  const handleCreateDossier = async (data: any) => {
    const result = await createDossier(data);
    if (result) {
      setShowForm(false);
      fetchDossiers(filters);
    }
    return result;
  };

  const handleUpdateDossier = async (data: any) => {
    if (!editingDossier) return null;
    const result = await updateDossier(editingDossier.id, data);
    if (result) {
      setEditingDossier(null);
      fetchDossiers(filters);
    }
    return result;
  };

  const handleViewDossier = (dossier: Dossier) => {
    setSelectedDossier(dossier);
    setShowDetails(true);
  };

  const handleEditDossier = (dossier: Dossier) => {
    setEditingDossier(dossier);
  };

  const handleHistoryDossier = (dossier: Dossier) => {
    // Open details with timeline tab
    setSelectedDossier(dossier);
    setShowDetails(true);
  };

  const handleAttachDossier = (dossier: Dossier) => {
    setSelectedDossier(dossier);
    setShowAttachDialog(true);
  };

  const handleChangeStatusDossier = (dossier: Dossier) => {
    setSelectedDossier(dossier);
    setShowStatusDialog(true);
  };

  const handleAssignDossier = (dossier: Dossier) => {
    setSelectedDossier(dossier);
    setShowAssignDialog(true);
  };

  const handleConfirmStatusChange = async (dossierId: string, newStatus: string, comment?: string) => {
    await updateDossierStatus(dossierId, newStatus);
    fetchDossiers(filters);
  };

  const handleConfirmAssign = async (dossierId: string, userId: string) => {
    await updateDossier(dossierId, { demandeur_id: userId } as any);
    fetchDossiers(filters);
  };

  const handleConfirmAttach = async (dossierId: string, file: File, categorie: string, typeDocument: string) => {
    // In a real implementation, we would upload the file to storage first
    // For now, we'll just create a document record with a placeholder path
    await addDocument({
      dossier_id: dossierId,
      type_document: typeDocument,
      categorie: categorie,
      file_name: file.name,
      file_path: `dossiers/${dossierId}/${file.name}`,
      file_size: file.size,
      file_type: file.type,
    });
    toast({ title: "Document ajouté avec succès" });
  };

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
      notation: "compact",
    }).format(montant);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recherche Dossier</h1>
          <p className="text-muted-foreground">
            Recherchez et gérez tous les dossiers de l'exercice {exercice}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau dossier
        </Button>
      </div>

      {/* KPIs Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
            <p className="text-xs text-muted-foreground">dossiers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.en_cours}</div>
            <p className="text-xs text-muted-foreground">en traitement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terminés</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.termines}</div>
            <p className="text-xs text-muted-foreground">clôturés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspendus</CardTitle>
            <Pause className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.suspendus}</div>
            <p className="text-xs text-muted-foreground">en pause</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMontant(stats.montant_total)}</div>
            <p className="text-xs text-muted-foreground">estimé</p>
          </CardContent>
        </Card>
      </div>

      {/* Recherche et filtres */}
      <Card>
        <CardContent className="pt-6">
          <DossierSearch
            filters={filters}
            onFiltersChange={handleFiltersChange}
            directions={directions}
            beneficiaires={beneficiaires}
            users={users}
            exercices={exercices}
          />
        </CardContent>
      </Card>

      {/* Liste des dossiers */}
      <Card>
        <CardContent className="pt-6">
          <DossierList
            dossiers={dossiers}
            loading={loading}
            pagination={pagination}
            onView={handleViewDossier}
            onEdit={handleEditDossier}
            onHistory={handleHistoryDossier}
            onAttach={handleAttachDossier}
            onChangeStatus={handleChangeStatusDossier}
            onAssign={handleAssignDossier}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onSort={handleSort}
            sortField={sortField}
            sortDirection={sortDirection}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <DossierForm
        open={showForm}
        onOpenChange={setShowForm}
        onSubmit={handleCreateDossier}
      />

      <DossierForm
        open={!!editingDossier}
        onOpenChange={(open) => !open && setEditingDossier(null)}
        onSubmit={handleUpdateDossier}
        initialData={editingDossier}
      />

      <DossierDetailsEnhanced
        dossier={selectedDossier}
        open={showDetails}
        onOpenChange={setShowDetails}
      />

      <DossierStatusDialog
        dossier={selectedDossier}
        open={showStatusDialog}
        onOpenChange={setShowStatusDialog}
        onConfirm={handleConfirmStatusChange}
      />

      <DossierAssignDialog
        dossier={selectedDossier}
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        onConfirm={handleConfirmAssign}
      />

      <DossierAttachDialog
        dossier={selectedDossier}
        open={showAttachDialog}
        onOpenChange={setShowAttachDialog}
        onConfirm={handleConfirmAttach}
      />
    </div>
  );
}
