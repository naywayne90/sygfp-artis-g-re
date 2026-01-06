import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Plus, Search, Receipt, CheckCircle, XCircle, Clock, FileText } from "lucide-react";
import { useLiquidations, Liquidation, VALIDATION_STEPS } from "@/hooks/useLiquidations";
import { LiquidationForm } from "@/components/liquidation/LiquidationForm";
import { LiquidationList } from "@/components/liquidation/LiquidationList";
import { LiquidationDetails } from "@/components/liquidation/LiquidationDetails";
import { LiquidationRejectDialog } from "@/components/liquidation/LiquidationRejectDialog";
import { LiquidationDeferDialog } from "@/components/liquidation/LiquidationDeferDialog";
import { LiquidationValidateDialog } from "@/components/liquidation/LiquidationValidateDialog";

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
};

export default function Liquidations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [selectedLiquidation, setSelectedLiquidation] = useState<Liquidation | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDeferDialog, setShowDeferDialog] = useState(false);
  const [showValidateDialog, setShowValidateDialog] = useState(false);
  const [actionLiquidationId, setActionLiquidationId] = useState<string | null>(null);

  const {
    liquidations,
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
      {/* Page Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Liquidations</h1>
          <p className="page-description">
            Gestion des liquidations après constatation du service fait
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4" />
          Nouvelle liquidation
        </Button>
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
          <Tabs defaultValue="toutes">
            <TabsList className="mb-4">
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

            <TabsContent value="toutes">
              <LiquidationList
                liquidations={filteredLiquidations}
                onView={handleView}
                onSubmit={handleSubmit}
                onValidate={handleValidate}
                onReject={handleReject}
                onDefer={handleDefer}
                onResume={handleResume}
              />
            </TabsContent>

            <TabsContent value="a_valider">
              <LiquidationList
                liquidations={aValider}
                onView={handleView}
                onValidate={handleValidate}
                onReject={handleReject}
                onDefer={handleDefer}
              />
            </TabsContent>

            <TabsContent value="validees">
              <LiquidationList
                liquidations={validees}
                onView={handleView}
              />
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
                onResume={handleResume}
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
