import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FolderOpen, FileText, TrendingUp, Clock } from "lucide-react";
import { useDossiers, Dossier, DossierFilters } from "@/hooks/useDossiers";
import { DossierSearch } from "@/components/dossier/DossierSearch";
import { DossierList } from "@/components/dossier/DossierList";
import { DossierForm } from "@/components/dossier/DossierForm";
import { DossierDetails } from "@/components/dossier/DossierDetails";
import { useExercice } from "@/contexts/ExerciceContext";

export default function Recherche() {
  const { dossiers, loading, directions, fetchDossiers, createDossier, updateDossier } = useDossiers();
  const { exercice } = useExercice();
  const [filters, setFilters] = useState<DossierFilters>({
    search: "",
    direction_id: "",
    exercice: null,
    statut: "",
    etape: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [editingDossier, setEditingDossier] = useState<Dossier | null>(null);

  // Générer la liste des exercices disponibles
  const currentYear = new Date().getFullYear();
  const exercices = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    fetchDossiers(filters);
  }, [filters]);

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

  // Statistiques
  const stats = {
    total: dossiers.length,
    enCours: dossiers.filter((d) => d.statut_global === "en_cours").length,
    termines: dossiers.filter((d) => d.statut_global === "termine").length,
    montantTotal: dossiers.reduce((sum, d) => sum + (d.montant_estime || 0), 0),
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

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total dossiers</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.enCours}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terminés</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.termines}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMontant(stats.montantTotal)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche et filtres */}
      <Card>
        <CardContent className="pt-6">
          <DossierSearch
            filters={filters}
            onFiltersChange={setFilters}
            directions={directions}
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
            onView={handleViewDossier}
            onEdit={handleEditDossier}
          />
        </CardContent>
      </Card>

      {/* Formulaires et modales */}
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

      <DossierDetails
        dossier={selectedDossier}
        open={showDetails}
        onOpenChange={setShowDetails}
      />
    </div>
  );
}
