import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { 
  Search, 
  Plus, 
  Wallet, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  CreditCard,
  Lock
} from "lucide-react";
import { useReglements } from "@/hooks/useReglements";
import { useExercice } from "@/contexts/ExerciceContext";
import { useExerciceWriteGuard } from "@/hooks/useExerciceWriteGuard";
import { ExerciceSubtitle } from "@/components/exercice/ExerciceSubtitle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ReglementForm } from "@/components/reglement/ReglementForm";
import { ReglementList } from "@/components/reglement/ReglementList";
import { ReglementDetails } from "@/components/reglement/ReglementDetails";
import { WorkflowStepIndicator } from "@/components/workflow/WorkflowStepIndicator";

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";
};

export default function Reglements() {
  const { exercice } = useExercice();
  const { canWrite, getDisabledMessage } = useExerciceWriteGuard();
  const { reglements, isLoading, stats, ordonnancementsValides } = useReglements();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedReglement, setSelectedReglement] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState("tous");

  // Filtrer les règlements
  const filteredReglements = reglements.filter((reg) => {
    const matchesSearch =
      reg.numero?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.ordonnancement?.numero?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.ordonnancement?.beneficiaire?.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "tous") return matchesSearch;
    if (activeTab === "soldes") {
      const ord = reg.ordonnancement;
      return matchesSearch && ord && (ord.montant_paye || 0) >= (ord.montant || 0);
    }
    if (activeTab === "partiels") {
      const ord = reg.ordonnancement;
      return matchesSearch && ord && (ord.montant_paye || 0) < (ord.montant || 0);
    }
    return matchesSearch;
  });

  // Calculer les stats
  const reglementsPartiels = reglements.filter(r => {
    const ord = r.ordonnancement;
    return ord && (ord.montant_paye || 0) < (ord.montant || 0);
  });

  const reglementsSoldes = reglements.filter(r => {
    const ord = r.ordonnancement;
    return ord && (ord.montant_paye || 0) >= (ord.montant || 0);
  });

  const handleViewDetails = (reglement: any) => {
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

      {/* Page Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <ExerciceSubtitle 
          title="Règlements" 
          description="Enregistrement des paiements effectués (étape 4)" 
        />
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

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro, ordonnancement ou bénéficiaire..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total règlements</p>
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
                <p className="text-sm text-muted-foreground">Montant total payé</p>
                <p className="text-2xl font-bold text-success">{formatMontant(stats.totalMontant)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ordonnancements soldés</p>
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

      {/* Règlements Table with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des règlements</CardTitle>
          <CardDescription>
            {filteredReglements.length} règlement(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="tous" className="gap-2">
                <CreditCard className="h-4 w-4" />
                Tous
                <Badge variant="secondary" className="ml-1">{reglements.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="soldes" className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Soldés
                <Badge variant="secondary" className="ml-1">{reglementsSoldes.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="partiels" className="gap-2">
                <Clock className="h-4 w-4" />
                Partiels en attente
                <Badge variant="secondary" className="ml-1">{reglementsPartiels.length}</Badge>
              </TabsTrigger>
            </TabsList>

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
          />
        </DialogContent>
      </Dialog>

      {/* Details Sheet */}
      <Sheet open={showDetails} onOpenChange={setShowDetails}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Détails du règlement</SheetTitle>
            <SheetDescription>
              Informations complètes sur le règlement
            </SheetDescription>
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
