import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, CreditCard, CheckCircle, XCircle, Clock, Loader2, Lock, Tag, MoreHorizontal, Eye, Send, FolderOpen, Receipt } from "lucide-react";
import { BudgetChainExportButton } from "@/components/export/BudgetChainExportButton";
import { useEngagements, Engagement } from "@/hooks/useEngagements";
import { EngagementForm } from "@/components/engagement/EngagementForm";
import { EngagementFromPMForm } from "@/components/engagement/EngagementFromPMForm";
import { EngagementList } from "@/components/engagement/EngagementList";
import { EngagementDetails } from "@/components/engagement/EngagementDetails";
import { EngagementRejectDialog } from "@/components/engagement/EngagementRejectDialog";
import { EngagementDeferDialog } from "@/components/engagement/EngagementDeferDialog";
import { EngagementValidateDialog } from "@/components/engagement/EngagementValidateDialog";
import { EngagementPrintDialog } from "@/components/engagement/EngagementPrintDialog";
import { PermissionGuard, usePermissionCheck } from "@/components/auth/PermissionGuard";
import { useExerciceWriteGuard } from "@/hooks/useExerciceWriteGuard";
import { WorkflowStepIndicator } from "@/components/workflow/WorkflowStepIndicator";
import { ModuleHelp, MODULE_HELP_CONFIG } from "@/components/help/ModuleHelp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
};

export default function Engagements() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const {
    engagements,
    engagementsAValider,
    engagementsValides,
    engagementsRejetes,
    engagementsDifferes,
    passationsValidees,
    isLoading,
    submitEngagement,
    validateEngagement,
    rejectEngagement,
    deferEngagement,
    resumeEngagement,
    isValidating,
  } = useEngagements();

  const { canPerform } = usePermissionCheck();
  const { isReadOnly, getDisabledMessage, checkCanWrite } = useExerciceWriteGuard();

  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCreateFromPM, setShowCreateFromPM] = useState(false);
  const [selectedPM, setSelectedPM] = useState<any>(null);
  const [selectedEngagement, setSelectedEngagement] = useState<Engagement | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showValidateDialog, setShowValidateDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDeferDialog, setShowDeferDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);

  // Handle sourcePM URL parameter
  useEffect(() => {
    const sourcePMId = searchParams.get("sourcePM");
    if (sourcePMId && passationsValidees.length > 0) {
      const pm = passationsValidees.find((p: any) => p.id === sourcePMId);
      if (pm) {
        setSelectedPM(pm);
        setShowCreateFromPM(true);
        searchParams.delete("sourcePM");
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [searchParams, passationsValidees, setSearchParams]);

  const handleCreateFromPM = (pm: any) => {
    setSelectedPM(pm);
    setShowCreateFromPM(true);
  };

  const handleCreateLiquidation = (engagementId: string) => {
    navigate(`/liquidations?sourceEngagement=${engagementId}`);
  };

  const filterEngagements = (list: Engagement[]) => {
    return list.filter(eng =>
      eng.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eng.objet.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (eng.fournisseur?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
    );
  };

  const handleView = (engagement: Engagement) => {
    setSelectedEngagement(engagement);
    setShowDetails(true);
  };

  const handleValidate = (engagement: Engagement) => {
    setSelectedEngagement(engagement);
    setShowValidateDialog(true);
  };

  const handleReject = (engagement: Engagement) => {
    setSelectedEngagement(engagement);
    setShowRejectDialog(true);
  };

  const handleDefer = (engagement: Engagement) => {
    setSelectedEngagement(engagement);
    setShowDeferDialog(true);
  };

  const handlePrint = (engagement: Engagement) => {
    setSelectedEngagement(engagement);
    setShowPrintDialog(true);
  };

  const confirmValidate = async (id: string, comments?: string) => {
    await validateEngagement({ id, comments });
    setShowValidateDialog(false);
    setSelectedEngagement(null);
  };

  const confirmReject = async (id: string, reason: string) => {
    await rejectEngagement({ id, reason });
    setShowRejectDialog(false);
    setSelectedEngagement(null);
  };

  const confirmDefer = async (id: string, motif: string, dateReprise?: string) => {
    await deferEngagement({ id, motif, dateReprise });
    setShowDeferDialog(false);
    setSelectedEngagement(null);
  };

  const totalMontant = engagements.reduce((acc, e) => acc + e.montant, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Indicateur de workflow */}
      <WorkflowStepIndicator currentStep={5} />

      {/* Aide contextuelle */}
      <ModuleHelp {...MODULE_HELP_CONFIG.engagements} />

      {/* Page Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Engagements</h1>
          <p className="page-description">
            Gestion des engagements budgétaires
          </p>
        </div>
        <div className="flex gap-2">
          <BudgetChainExportButton step="engagement" />
          <PermissionGuard permission="engagement.create" showDelegationBadge>
            {isReadOnly ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button className="gap-2" disabled>
                    <Lock className="h-4 w-4" />
                    Nouvel engagement
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{getDisabledMessage()}</TooltipContent>
              </Tooltip>
            ) : (
              <Button className="gap-2" onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4" />
                Nouvel engagement
              </Button>
            )}
          </PermissionGuard>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{engagements.length}</p>
              </div>
              <CreditCard className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Montant total</p>
              <p className="text-xl font-bold text-primary">{formatMontant(totalMontant)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">À valider</p>
                <p className="text-2xl font-bold text-warning">{engagementsAValider.length}</p>
              </div>
              <Clock className="h-8 w-8 text-warning/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Validés</p>
                <p className="text-2xl font-bold text-success">{engagementsValides.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejetés</p>
                <p className="text-2xl font-bold text-destructive">{engagementsRejetes.length}</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par numéro, objet ou fournisseur..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="a_traiter" className="space-y-4">
        <TabsList>
          <TabsTrigger value="a_traiter" className="gap-1">
            <Tag className="h-3 w-3" />
            À traiter ({passationsValidees.length})
          </TabsTrigger>
          <TabsTrigger value="tous">Tous ({engagements.length})</TabsTrigger>
          <TabsTrigger value="a_valider">À valider ({engagementsAValider.length})</TabsTrigger>
          <TabsTrigger value="valides">Validés ({engagementsValides.length})</TabsTrigger>
          <TabsTrigger value="rejetes">Rejetés ({engagementsRejetes.length})</TabsTrigger>
          <TabsTrigger value="differes">Différés ({engagementsDifferes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="tous">
          <Card>
            <CardHeader>
              <CardTitle>Tous les engagements</CardTitle>
              <CardDescription>
                {filterEngagements(engagements).length} engagement(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <EngagementList
                  engagements={filterEngagements(engagements)}
                  onView={handleView}
                  onValidate={canPerform("engagement.validate") ? handleValidate : undefined}
                  onReject={canPerform("engagement.reject") ? handleReject : undefined}
                  onDefer={canPerform("engagement.defer") ? handleDefer : undefined}
                  onSubmit={canPerform("engagement.submit") ? submitEngagement : undefined}
                  onResume={canPerform("engagement.resume") ? resumeEngagement : undefined}
                  onPrint={handlePrint}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet À traiter - PM validées */}
        <TabsContent value="a_traiter">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                Passations de Marché à engager
              </CardTitle>
              <CardDescription>
                {passationsValidees.length} passation(s) validée(s) en attente d'engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {passationsValidees.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune passation de marché à traiter</p>
                  <p className="text-sm">Les PM validées apparaîtront ici</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Réf. PM</TableHead>
                      <TableHead>Objet (EB)</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Prestataire</TableHead>
                      <TableHead className="text-right">Montant retenu</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {passationsValidees.map((pm: any) => (
                      <TableRow key={pm.id}>
                        <TableCell className="font-mono text-sm">{pm.reference || "-"}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {pm.expression_besoin?.objet || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{pm.mode_passation}</Badge>
                        </TableCell>
                        <TableCell>
                          {pm.prestataire_retenu?.raison_sociale || "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatMontant(pm.montant_retenu || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => handleCreateFromPM(pm)}>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Engager
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="a_valider">
          <Card>
            <CardHeader>
              <CardTitle>Engagements à valider</CardTitle>
              <CardDescription>
                {filterEngagements(engagementsAValider).length} engagement(s) en attente de validation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EngagementList
                engagements={filterEngagements(engagementsAValider)}
                onView={handleView}
                onValidate={canPerform("engagement.validate") ? handleValidate : undefined}
                onReject={canPerform("engagement.reject") ? handleReject : undefined}
                onDefer={canPerform("engagement.defer") ? handleDefer : undefined}
                onPrint={handlePrint}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Validés avec action Liquidation */}
        <TabsContent value="valides">
          <Card>
            <CardHeader>
              <CardTitle>Engagements validés</CardTitle>
              <CardDescription>
                {filterEngagements(engagementsValides).length} engagement(s) validé(s) - prêts pour liquidation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numéro</TableHead>
                    <TableHead>Objet</TableHead>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filterEngagements(engagementsValides).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Aucun engagement validé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filterEngagements(engagementsValides).map((eng) => (
                      <TableRow key={eng.id}>
                        <TableCell className="font-mono text-sm">{eng.numero}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{eng.objet}</TableCell>
                        <TableCell>{eng.fournisseur || "-"}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatMontant(eng.montant)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover">
                              <DropdownMenuItem onClick={() => handleView(eng)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Voir détails
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleCreateLiquidation(eng.id)}
                                className="text-primary"
                              >
                                <Receipt className="mr-2 h-4 w-4" />
                                Créer liquidation
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejetes">
          <Card>
            <CardHeader>
              <CardTitle>Engagements rejetés</CardTitle>
              <CardDescription>
                {filterEngagements(engagementsRejetes).length} engagement(s) rejeté(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EngagementList
                engagements={filterEngagements(engagementsRejetes)}
                onView={handleView}
                onPrint={handlePrint}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="differes">
          <Card>
            <CardHeader>
              <CardTitle>Engagements différés</CardTitle>
              <CardDescription>
                {filterEngagements(engagementsDifferes).length} engagement(s) différé(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EngagementList
                engagements={filterEngagements(engagementsDifferes)}
                onView={handleView}
                onResume={canPerform("engagement.resume") ? resumeEngagement : undefined}
                onPrint={handlePrint}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <EngagementForm open={showCreateForm} onOpenChange={setShowCreateForm} />
      
      <EngagementFromPMForm
        open={showCreateFromPM}
        onOpenChange={setShowCreateFromPM}
        passation={selectedPM}
        onSuccess={() => setSelectedPM(null)}
      />
      
      <EngagementDetails
        engagement={selectedEngagement}
        open={showDetails}
        onOpenChange={setShowDetails}
      />

      <EngagementValidateDialog
        engagement={selectedEngagement}
        open={showValidateDialog}
        onOpenChange={setShowValidateDialog}
        onConfirm={confirmValidate}
        isLoading={isValidating}
      />

      <EngagementRejectDialog
        engagement={selectedEngagement}
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        onConfirm={confirmReject}
      />

      <EngagementDeferDialog
        engagement={selectedEngagement}
        open={showDeferDialog}
        onOpenChange={setShowDeferDialog}
        onConfirm={confirmDefer}
      />

      <EngagementPrintDialog
        engagement={selectedEngagement}
        open={showPrintDialog}
        onOpenChange={setShowPrintDialog}
      />
    </div>
  );
}
