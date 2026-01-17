import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FolderOpen, FileText, TrendingUp, Clock, CheckCircle, Ban, Pause, Lock, AlertTriangle, HelpCircle, ChevronDown, ChevronUp, Search, Filter, Eye, Edit, Paperclip, UserPlus } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useDossiers, Dossier, DossierFilters } from "@/hooks/useDossiers";
import { DossierSearch } from "@/components/dossier/DossierSearch";
import { DossierList } from "@/components/dossier/DossierList";
import { DossierQuickFilters } from "@/components/dossier/DossierQuickFilters";
import { DossierForm } from "@/components/dossier/DossierForm";
import { DossierDetailsEnhanced } from "@/components/dossier/DossierDetailsEnhanced";
import { DossierStatusDialog } from "@/components/dossier/DossierStatusDialog";
import { DossierAssignDialog } from "@/components/dossier/DossierAssignDialog";
import { DossierAttachDialog } from "@/components/dossier/DossierAttachDialog";
import { DossierBlockDialog } from "@/components/dossier/DossierBlockDialog";
import { ChaineDepenseVisuel } from "@/components/workflow/ChaineDepenseVisuel";
import { useExercice } from "@/contexts/ExerciceContext";
import { useToast } from "@/hooks/use-toast";

export default function Recherche() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
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
    bloquerDossier,
    debloquerDossier,
    getDossierById,
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
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [blockMode, setBlockMode] = useState<"block" | "unblock">("block");
  const [sortField, setSortField] = useState<string>("updated_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showHelp, setShowHelp] = useState(false);

  // Générer la liste des exercices disponibles
  const currentYear = new Date().getFullYear();
  const exercices = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Fetch dossiers when filters change
  useEffect(() => {
    fetchDossiers(filters, pagination.page, pagination.pageSize);
  }, [filters]);

  // Gérer le paramètre URL ?dossier=xxx pour ouvrir directement les détails
  useEffect(() => {
    const dossierId = searchParams.get("dossier");
    if (dossierId) {
      // Récupérer le dossier et ouvrir les détails
      getDossierById(dossierId).then((dossier) => {
        if (dossier) {
          setSelectedDossier(dossier);
          setShowDetails(true);
        } else {
          toast({
            title: "Dossier introuvable",
            description: "Le dossier demandé n'existe pas ou a été supprimé.",
            variant: "destructive",
          });
        }
        // Nettoyer l'URL après chargement
        setSearchParams({}, { replace: true });
      });
    }
  }, [searchParams]);

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

  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    fetchDossiers(DEFAULT_FILTERS, 1, pagination.pageSize);
  }, [fetchDossiers, pagination.pageSize]);

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

  const handleBlockDossier = (dossier: Dossier) => {
    setSelectedDossier(dossier);
    setBlockMode("block");
    setShowBlockDialog(true);
  };

  const handleUnblockDossier = (dossier: Dossier) => {
    setSelectedDossier(dossier);
    setBlockMode("unblock");
    setShowBlockDialog(true);
  };

  const handleConfirmBlock = async (dossierId: string, motif: string) => {
    if (blockMode === "block") {
      await bloquerDossier(dossierId, motif);
    } else {
      await debloquerDossier(dossierId, motif);
    }
    fetchDossiers(filters);
  };

  const handleCreateStep = (type: string, dossierId: string) => {
    // Navigate to the appropriate creation page with dossier_id
    switch (type) {
      case "note":
        navigate("/notes-aef", { state: { dossierId } });
        break;
      case "engagement":
        navigate("/engagements", { state: { dossierId } });
        break;
      case "liquidation":
        navigate("/liquidations", { state: { dossierId } });
        break;
      case "ordonnancement":
        navigate("/ordonnancements", { state: { dossierId } });
        break;
      case "reglement":
        navigate("/reglements", { state: { dossierId } });
        break;
      default:
        break;
    }
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
            Point d'entrée principal - Exercice {exercice}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowHelp(!showHelp)}>
            <HelpCircle className="h-4 w-4 mr-2" />
            Aide
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau dossier
          </Button>
        </div>
      </div>

      {/* Schéma visuel de la chaîne de dépense */}
      <ChaineDepenseVisuel />

      {/* Section d'aide */}
      <Collapsible open={showHelp} onOpenChange={setShowHelp}>
        <CollapsibleContent>
          <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <HelpCircle className="h-5 w-5" />
                À quoi sert ce module ?
              </CardTitle>
              <CardDescription className="text-blue-600 dark:text-blue-400">
                Guide d'utilisation du module Recherche Dossier
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold text-foreground mb-2">📁 Qu'est-ce qu'un dossier ?</h4>
                <p className="text-muted-foreground">
                  Un <strong>dossier</strong> représente une opération de dépense complète dans SYGFP. Il regroupe 
                  toutes les étapes de la chaîne de dépense : de l'expression de besoin jusqu'au règlement final.
                  C'est le fil conducteur qui permet de suivre l'avancement d'une dépense de bout en bout.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <Search className="h-4 w-4 text-blue-500" />
                    Rechercher un dossier
                  </h4>
                  <ul className="text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Utilisez la barre de recherche pour trouver par numéro, objet ou bénéficiaire</li>
                    <li>Cliquez sur "Filtres" pour affiner par statut, direction, période ou montant</li>
                    <li>Les KPIs en haut affichent les statistiques globales</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <Plus className="h-4 w-4 text-green-500" />
                    Créer un nouveau dossier
                  </h4>
                  <p className="text-muted-foreground text-xs mb-2">
                    <strong>Pourquoi créer un dossier ?</strong> Chaque dépense que l'ARTI souhaite effectuer 
                    doit être formalisée dans un dossier. C'est le point de départ obligatoire qui permet de 
                    tracer, valider et exécuter la dépense de manière structurée.
                  </p>
                  <ul className="text-muted-foreground space-y-1 ml-6 list-disc text-xs">
                    <li><strong>AEF (Achat/Engagement/Facture)</strong> : Pour l'achat de biens, fournitures et équipements</li>
                    <li><strong>SEF (Service/Engagement/Facture)</strong> : Pour les prestations de services (consultants, entretien...)</li>
                    <li><strong>Marché</strong> : Pour les procédures de passation de marchés publics</li>
                  </ul>
                  <p className="text-muted-foreground text-xs mt-2">
                    Une fois créé, le dossier suivra automatiquement la chaîne de dépense avec toutes ses étapes de validation.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <Eye className="h-4 w-4 text-purple-500" />
                    Consulter un dossier
                  </h4>
                  <ul className="text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Cliquez sur l'icône œil pour voir les détails complets</li>
                    <li>Visualisez la timeline des étapes (note, engagement, liquidation...)</li>
                    <li>Consultez les documents attachés et l'historique</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <Edit className="h-4 w-4 text-orange-500" />
                    Actions possibles
                  </h4>
                  <ul className="text-muted-foreground space-y-1 ml-6 list-disc">
                    <li><strong>Modifier</strong> : Mettre à jour les informations du dossier</li>
                    <li><strong>Attacher</strong> : Joindre des documents justificatifs</li>
                    <li><strong>Assigner</strong> : Affecter le dossier à un agent</li>
                    <li><strong>Bloquer/Débloquer</strong> : Suspendre ou reprendre le traitement</li>
                  </ul>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <h4 className="font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  Bon à savoir
                </h4>
                <p className="text-amber-600 dark:text-amber-400 text-sm">
                  Chaque dossier suit automatiquement la chaîne de dépense : <strong>Note → Engagement → Liquidation → Ordonnancement → Règlement</strong>. 
                  Les étapes se débloquent au fur et à mesure de la validation des précédentes.
                </p>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

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

      {/* Filtres rapides par statut */}
      <DossierQuickFilters
        currentStatut={filters.statut || ""}
        onStatutChange={(statut) => handleFiltersChange({ ...filters, statut })}
        counts={{
          en_cours: stats.en_cours,
          termine: stats.termines,
          suspendu: stats.suspendus,
        }}
      />

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
            hasFilters={!!filters.statut || !!filters.direction_id || !!filters.etape || !!filters.type_dossier}
            searchTerm={filters.search || ""}
            onReset={handleReset}
            onCreate={() => setShowForm(true)}
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
        onCreateStep={handleCreateStep}
        onBlock={(id) => {
          const d = dossiers.find(x => x.id === id);
          if (d) handleBlockDossier(d);
        }}
        onUnblock={(id) => {
          const d = dossiers.find(x => x.id === id);
          if (d) handleUnblockDossier(d);
        }}
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

      <DossierBlockDialog
        dossier={selectedDossier}
        open={showBlockDialog}
        onOpenChange={setShowBlockDialog}
        onConfirm={handleConfirmBlock}
        mode={blockMode}
      />
    </div>
  );
}
