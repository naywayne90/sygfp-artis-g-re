import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, Receipt, CheckCircle, XCircle, Clock, FileText, Tag, CreditCard, MoreHorizontal, Eye, FileSignature } from "lucide-react";
import { useLiquidations, Liquidation, VALIDATION_STEPS } from "@/hooks/useLiquidations";
import { LiquidationForm } from "@/components/liquidation/LiquidationForm";
import { LiquidationList } from "@/components/liquidation/LiquidationList";
import { LiquidationDetails } from "@/components/liquidation/LiquidationDetails";
import { LiquidationRejectDialog } from "@/components/liquidation/LiquidationRejectDialog";
import { LiquidationDeferDialog } from "@/components/liquidation/LiquidationDeferDialog";
import { LiquidationValidateDialog } from "@/components/liquidation/LiquidationValidateDialog";
import { PermissionGuard, usePermissionCheck } from "@/components/auth/PermissionGuard";
import { WorkflowStepIndicator } from "@/components/workflow/WorkflowStepIndicator";
import { ModuleHelp, MODULE_HELP_CONFIG } from "@/components/help/ModuleHelp";

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
};

export default function Liquidations() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [selectedLiquidation, setSelectedLiquidation] = useState<Liquidation | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDeferDialog, setShowDeferDialog] = useState(false);
  const [showValidateDialog, setShowValidateDialog] = useState(false);
  const [actionLiquidationId, setActionLiquidationId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("a_traiter");

  const {
    liquidations,
    engagementsValides,
    isLoading,
    submitLiquidation,
    validateLiquidation,
    rejectLiquidation,
    deferLiquidation,
    resumeLiquidation,
    isSubmitting,
    isValidating,
    isRejecting,
    isDeferring,
  } = useLiquidations();

  const { canPerform } = usePermissionCheck();

  // Handle sourceEngagement URL parameter
  useEffect(() => {
    const sourceEngId = searchParams.get("sourceEngagement");
    if (sourceEngId) {
      setShowCreateDialog(true);
      searchParams.delete("sourceEngagement");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Filter liquidations
  const filteredLiquidations = liquidations.filter(liq => 
    liq.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
    liq.engagement?.objet?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    liq.engagement?.numero?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const aValider = filteredLiquidations.filter(l => l.statut === "soumis");
  const validees = filteredLiquidations.filter(l => l.statut === "valide");
  const rejetees = filteredLiquidations.filter(l => l.statut === "rejete");
  const differees = filteredLiquidations.filter(l => l.statut === "differe");

  const handleCreateOrdonnancement = (liquidationId: string) => {
    navigate(`/ordonnancements?sourceLiquidation=${liquidationId}`);
  };

  // Stats
  const totalMontant = liquidations.reduce((acc, l) => acc + l.montant, 0);
  const totalValidees = validees.reduce((acc, l) => acc + l.montant, 0);
  const serviceFaitCount = liquidations.filter(l => l.service_fait).length;

  const handleView = (liquidation: Liquidation) => {
    setSelectedLiquidation(liquidation);
    setShowDetailsSheet(true);
  };

  const handleSubmit = (id: string) => {
    submitLiquidation(id);
  };

  const handleValidate = (id: string) => {
    setActionLiquidationId(id);
    setShowValidateDialog(true);
  };

  const handleReject = (id: string) => {
    setActionLiquidationId(id);
    setShowRejectDialog(true);
  };

  const handleDefer = (id: string) => {
    setActionLiquidationId(id);
    setShowDeferDialog(true);
  };

  const handleResume = (id: string) => {
    resumeLiquidation(id);
  };

  const confirmValidate = (comments?: string) => {
    if (actionLiquidationId) {
      validateLiquidation({ id: actionLiquidationId, comments });
      setShowValidateDialog(false);
      setActionLiquidationId(null);
    }
  };

  const confirmReject = (reason: string) => {
    if (actionLiquidationId) {
      rejectLiquidation({ id: actionLiquidationId, reason });
      setShowRejectDialog(false);
      setActionLiquidationId(null);
    }
  };

  const confirmDefer = (motif: string, dateReprise?: string) => {
    if (actionLiquidationId) {
      deferLiquidation({ id: actionLiquidationId, motif, dateReprise });
      setShowDeferDialog(false);
      setActionLiquidationId(null);
    }
  };

  const getCurrentStepLabel = () => {
    const liq = liquidations.find(l => l.id === actionLiquidationId);
    if (!liq) return undefined;
    const step = VALIDATION_STEPS.find(s => s.order === liq.current_step);
    return step?.label;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Indicateur de workflow */}
      <WorkflowStepIndicator currentStep={6} />

      {/* Aide contextuelle */}
      <ModuleHelp {...MODULE_HELP_CONFIG.liquidations} />

      {/* Page Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Liquidations</h1>
          <p className="page-description">
            Gestion des liquidations après constatation du service fait
          </p>
        </div>
        <PermissionGuard permission="liquidation.create" showDelegationBadge>
          <Button className="gap-2" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4" />
            Nouvelle liquidation
          </Button>
        </PermissionGuard>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher par numéro, engagement ou objet..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total liquidations</p>
                <p className="text-2xl font-bold">{liquidations.length}</p>
              </div>
              <Receipt className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Montant total</p>
                <p className="text-2xl font-bold text-primary">
                  {formatMontant(totalMontant)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">À valider</p>
                <p className="text-2xl font-bold text-warning">{aValider.length}</p>
              </div>
              <Clock className="h-8 w-8 text-warning/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Service fait certifié</p>
                <p className="text-2xl font-bold text-success">{serviceFaitCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des liquidations</CardTitle>
          <CardDescription>
            {filteredLiquidations.length} liquidation(s) trouvée(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="a_traiter" className="gap-1">
                <Tag className="h-3 w-3" />
                À traiter ({engagementsValides.length})
              </TabsTrigger>
              <TabsTrigger value="toutes">
                Toutes ({filteredLiquidations.length})
              </TabsTrigger>
              <TabsTrigger value="a_valider" className="text-warning">
                À valider ({aValider.length})
              </TabsTrigger>
              <TabsTrigger value="validees" className="text-success">
                Validées ({validees.length})
              </TabsTrigger>
              <TabsTrigger value="rejetees" className="text-destructive">
                Rejetées ({rejetees.length})
              </TabsTrigger>
              <TabsTrigger value="differees">
                Différées ({differees.length})
              </TabsTrigger>
            </TabsList>

            {/* Onglet À traiter - Engagements validés */}
            <TabsContent value="a_traiter">
              {engagementsValides.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun engagement à liquider</p>
                  <p className="text-sm">Les engagements validés apparaîtront ici</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Réf. Engagement</TableHead>
                      <TableHead>Objet</TableHead>
                      <TableHead>Fournisseur</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {engagementsValides.map((eng: any) => (
                      <TableRow key={eng.id}>
                        <TableCell className="font-mono text-sm">{eng.numero || "-"}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{eng.objet || "-"}</TableCell>
                        <TableCell>{eng.fournisseur || "-"}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatMontant(eng.montant || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                            <Receipt className="mr-2 h-4 w-4" />
                            Liquider
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="toutes">
              <LiquidationList
                liquidations={filteredLiquidations}
                onView={handleView}
                onSubmit={canPerform("liquidation.submit") ? handleSubmit : undefined}
                onValidate={canPerform("liquidation.validate") ? handleValidate : undefined}
                onReject={canPerform("liquidation.reject") ? handleReject : undefined}
                onDefer={canPerform("liquidation.defer") ? handleDefer : undefined}
                onResume={canPerform("liquidation.resume") ? handleResume : undefined}
              />
            </TabsContent>

            <TabsContent value="a_valider">
              <LiquidationList
                liquidations={aValider}
                onView={handleView}
                onValidate={canPerform("liquidation.validate") ? handleValidate : undefined}
                onReject={canPerform("liquidation.reject") ? handleReject : undefined}
                onDefer={canPerform("liquidation.defer") ? handleDefer : undefined}
              />
            </TabsContent>

            {/* Onglet Validées avec action Ordonnancement */}
            <TabsContent value="validees">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numéro</TableHead>
                    <TableHead>Engagement</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="text-right">Net à payer</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Aucune liquidation validée
                      </TableCell>
                    </TableRow>
                  ) : (
                    validees.map((liq) => (
                      <TableRow key={liq.id}>
                        <TableCell className="font-mono text-sm">{liq.numero}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {liq.engagement?.objet || "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatMontant(liq.montant)}
                        </TableCell>
                        <TableCell className="text-right text-success font-medium">
                          {formatMontant(liq.net_a_payer || liq.montant)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover">
                              <DropdownMenuItem onClick={() => handleView(liq)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Voir détails
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleCreateOrdonnancement(liq.id)}
                                className="text-primary"
                              >
                                <FileSignature className="mr-2 h-4 w-4" />
                                Créer ordonnancement
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="rejetees">
              <LiquidationList
                liquidations={rejetees}
                onView={handleView}
              />
            </TabsContent>

            <TabsContent value="differees">
              <LiquidationList
                liquidations={differees}
                onView={handleView}
                onResume={canPerform("liquidation.resume") ? handleResume : undefined}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer une liquidation</DialogTitle>
          </DialogHeader>
          <LiquidationForm
            onSuccess={() => setShowCreateDialog(false)}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Details Sheet */}
      <Sheet open={showDetailsSheet} onOpenChange={setShowDetailsSheet}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Détails de la liquidation</SheetTitle>
          </SheetHeader>
          {selectedLiquidation && (
            <div className="mt-6">
              <LiquidationDetails liquidation={selectedLiquidation} />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Validate Dialog */}
      <LiquidationValidateDialog
        open={showValidateDialog}
        onOpenChange={setShowValidateDialog}
        onConfirm={confirmValidate}
        isLoading={isValidating}
        stepLabel={getCurrentStepLabel()}
      />

      {/* Reject Dialog */}
      <LiquidationRejectDialog
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        onConfirm={confirmReject}
        isLoading={isRejecting}
      />

      {/* Defer Dialog */}
      <LiquidationDeferDialog
        open={showDeferDialog}
        onOpenChange={setShowDeferDialog}
        onConfirm={confirmDefer}
        isLoading={isDeferring}
      />
    </div>
  );
}
