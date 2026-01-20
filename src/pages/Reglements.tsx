import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  Lock,
  Tag,
  FileSignature,
  FolderCheck,
} from "lucide-react";
import { BudgetChainExportButton } from "@/components/export/BudgetChainExportButton";
import { useReglements } from "@/hooks/useReglements";
import { useExercice } from "@/contexts/ExerciceContext";
import { useExerciceWriteGuard } from "@/hooks/useExerciceWriteGuard";
import { ExerciceSubtitle } from "@/components/exercice/ExerciceSubtitle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ReglementForm } from "@/components/reglement/ReglementForm";
import { ReglementList } from "@/components/reglement/ReglementList";
import { ReglementDetails } from "@/components/reglement/ReglementDetails";
import { WorkflowStepIndicator } from "@/components/workflow/WorkflowStepIndicator";
import { ModuleHelp, MODULE_HELP_CONFIG } from "@/components/help/ModuleHelp";

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";
};

export default function Reglements() {
  const { exercice } = useExercice();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canWrite, getDisabledMessage } = useExerciceWriteGuard();
  const { reglements, isLoading, stats, ordonnancementsValides } = useReglements();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedReglement, setSelectedReglement] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState("a_traiter");
  const [preselectedOrdId, setPreselectedOrdId] = useState<string | null>(null);

  // Handle sourceOrdonnancement URL parameter
  useEffect(() => {
    const sourceOrdId = searchParams.get("sourceOrdonnancement");
    if (sourceOrdId) {
      setPreselectedOrdId(sourceOrdId);
      setShowCreateDialog(true);
      searchParams.delete("sourceOrdonnancement");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

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

      {/* Aide contextuelle */}
      <ModuleHelp {...MODULE_HELP_CONFIG.reglements} />

      {/* Page Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <ExerciceSubtitle
          title="Règlements"
          description="Enregistrement des paiements effectués (étape 4)"
        />
        <div className="flex gap-2">
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
              <TabsTrigger value="a_traiter" className="gap-1">
                <Tag className="h-3 w-3" />
                À payer ({ordonnancementsValides.length})
              </TabsTrigger>
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
                Partiels
                <Badge variant="secondary" className="ml-1">{reglementsPartiels.length}</Badge>
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
                    {ordonnancementsValides.map((ord: any) => {
                      const restant = (ord.montant || 0) - (ord.montant_paye || 0);
                      return (
                        <TableRow key={ord.id}>
                          <TableCell className="font-mono text-sm">{ord.numero || "-"}</TableCell>
                          <TableCell>{ord.beneficiaire || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{ord.mode_paiement || "-"}</Badge>
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
