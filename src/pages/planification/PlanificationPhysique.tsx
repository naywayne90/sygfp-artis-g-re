import { useState, useMemo } from "react";
import { useExercice } from "@/contexts/ExerciceContext";
import { useTaches, type Tache, type TacheFormData } from "@/hooks/useTaches";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import { isPast } from "date-fns";

import { PhysiqueDashboard } from "@/components/planification/PhysiqueDashboard";
import { TacheList } from "@/components/planification/TacheList";
import { TacheFilters } from "@/components/planification/TacheFilters";
import { TacheForm } from "@/components/planification/TacheForm";
import { TacheDetails } from "@/components/planification/TacheDetails";
import { TacheImport } from "@/components/planification/TacheImport";

export default function PlanificationPhysique() {
  const { exercice } = useExercice();
  const { taches, isLoading, createTache, updateTache, updateProgress, deleteTache, isCreating, isUpdating } = useTaches();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTache, setEditingTache] = useState<Tache | null>(null);
  const [viewingTache, setViewingTache] = useState<Tache | null>(null);
  const [filters, setFilters] = useState({
    search: "",
    os: "",
    direction: "",
    statut: "",
    retardOnly: false,
  });

  // Filter taches
  const filteredTaches = useMemo(() => {
    if (!taches) return [];

    return taches.filter((tache) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          tache.code.toLowerCase().includes(searchLower) ||
          tache.libelle.toLowerCase().includes(searchLower) ||
          tache.description?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // OS filter
      if (filters.os) {
        const osId = tache.sous_activite?.activite?.action?.os?.id;
        if (osId !== filters.os) return false;
      }

      // Status filter
      if (filters.statut && tache.statut !== filters.statut) {
        return false;
      }

      // Retard only filter
      if (filters.retardOnly) {
        if (!tache.date_fin || tache.statut === 'termine') return false;
        if (!isPast(new Date(tache.date_fin)) || tache.avancement >= 100) return false;
      }

      return true;
    });
  }, [taches, filters]);

  const handleSubmit = (data: TacheFormData) => {
    if (editingTache) {
      updateTache({ id: editingTache.id, data });
    } else {
      createTache(data);
    }
    setIsFormOpen(false);
    setEditingTache(null);
  };

  const handleEdit = (tache: Tache) => {
    setEditingTache(tache);
    setIsFormOpen(true);
  };

  const handleExportCSV = () => {
    if (!filteredTaches.length) return;

    const headers = [
      "Code",
      "Libellé",
      "Description",
      "Sous-activité",
      "Date début",
      "Date fin",
      "Avancement",
      "Statut",
      "Priorité",
      "Budget prévu",
    ];

    const rows = filteredTaches.map((t) => [
      t.code,
      t.libelle,
      t.description || "",
      t.sous_activite?.code || "",
      t.date_debut || "",
      t.date_fin || "",
      t.avancement.toString(),
      t.statut,
      t.priorite,
      t.budget_prevu.toString(),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `taches_execution_physique_${exercice}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Planification Exécution Physique</h1>
          <p className="page-description">
            Suivi des activités et indicateurs de performance - Exercice {exercice}
          </p>
        </div>
        <div className="flex gap-2">
          <TacheImport />
          <Button variant="outline" onClick={handleExportCSV} disabled={!filteredTaches.length}>
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
          <Button onClick={() => { setEditingTache(null); setIsFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle tâche
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
          <TabsTrigger value="taches">Liste des tâches</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <PhysiqueDashboard taches={taches} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="taches" className="mt-6 space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Filtres</CardTitle>
            </CardHeader>
            <CardContent>
              <TacheFilters filters={filters} onFiltersChange={setFilters} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tâches ({filteredTaches.length})</CardTitle>
              <CardDescription>
                Liste des tâches de planification physique
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TacheList
                taches={filteredTaches}
                isLoading={isLoading}
                onEdit={handleEdit}
                onDelete={deleteTache}
                onUpdateProgress={updateProgress}
                onViewDetails={(tache) => setViewingTache(tache)}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      <TacheForm
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingTache(null); }}
        onSubmit={handleSubmit}
        editingTache={editingTache}
        isSubmitting={isCreating || isUpdating}
      />

      {/* Details Dialog */}
      <TacheDetails
        tache={viewingTache}
        isOpen={!!viewingTache}
        onClose={() => setViewingTache(null)}
      />
    </div>
  );
}
