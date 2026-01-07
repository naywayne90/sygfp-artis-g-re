import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, CreditCard, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { useEngagements, Engagement } from "@/hooks/useEngagements";
import { EngagementForm } from "@/components/engagement/EngagementForm";
import { EngagementList } from "@/components/engagement/EngagementList";
import { EngagementDetails } from "@/components/engagement/EngagementDetails";
import { EngagementRejectDialog } from "@/components/engagement/EngagementRejectDialog";
import { EngagementDeferDialog } from "@/components/engagement/EngagementDeferDialog";
import { EngagementValidateDialog } from "@/components/engagement/EngagementValidateDialog";
import { EngagementPrintDialog } from "@/components/engagement/EngagementPrintDialog";
import { PermissionGuard, usePermissionCheck } from "@/components/auth/PermissionGuard";

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
};

export default function Engagements() {
  const {
    engagements,
    engagementsAValider,
    engagementsValides,
    engagementsRejetes,
    engagementsDifferes,
    isLoading,
    submitEngagement,
    validateEngagement,
    rejectEngagement,
    deferEngagement,
    resumeEngagement,
    isValidating,
  } = useEngagements();

  const { canPerform } = usePermissionCheck();

  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedEngagement, setSelectedEngagement] = useState<Engagement | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showValidateDialog, setShowValidateDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDeferDialog, setShowDeferDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);

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
      {/* Page Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Engagements</h1>
          <p className="page-description">
            Gestion des engagements budgétaires
          </p>
        </div>
        <PermissionGuard permission="engagement.create" showDelegationBadge>
          <Button className="gap-2" onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4" />
            Nouvel engagement
          </Button>
        </PermissionGuard>
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
      <Tabs defaultValue="tous" className="space-y-4">
        <TabsList>
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

        <TabsContent value="valides">
          <Card>
            <CardHeader>
              <CardTitle>Engagements validés</CardTitle>
              <CardDescription>
                {filterEngagements(engagementsValides).length} engagement(s) validé(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EngagementList
                engagements={filterEngagements(engagementsValides)}
                onView={handleView}
                onPrint={handlePrint}
              />
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
