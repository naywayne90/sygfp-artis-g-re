import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  FileCheck,
  FileSignature,
  Clock,
  XCircle,
  Lock,
  Tag,
  MoreHorizontal,
  Eye,
  Wallet,
  Receipt,
  User,
} from 'lucide-react';
import { BudgetChainExportButton } from '@/components/export/BudgetChainExportButton';
import { useRBAC } from '@/contexts/RBACContext';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { OrdonnancementForm } from '@/components/ordonnancement/OrdonnancementForm';
import { OrdonnancementDetails } from '@/components/ordonnancement/OrdonnancementDetails';
import { OrdonnancementList } from '@/components/ordonnancement/OrdonnancementList';
import { useOrdonnancements } from '@/hooks/useOrdonnancements';
import { useExercice } from '@/contexts/ExerciceContext';
import { useExerciceWriteGuard } from '@/hooks/useExerciceWriteGuard';
import { useCanValidateOrdonnancement } from '@/hooks/useDelegations';
import { usePermissionCheck } from '@/components/auth/PermissionGuard';
import { PageHeader } from '@/components/shared/PageHeader';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { WorkflowStepIndicator } from '@/components/workflow/WorkflowStepIndicator';
import { ModuleHelp, MODULE_HELP_CONFIG } from '@/components/help/ModuleHelp';
import { NotesPagination } from '@/components/shared/NotesPagination';

export default function Ordonnancements() {
  const { exercice: _exercice } = useExercice();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canWrite, getDisabledMessage } = useExerciceWriteGuard();
  const { ordonnancements, liquidationsValidees, isLoading } = useOrdonnancements();
  const {
    canValidate: canValidateViaDelegation,
    viaDelegation: ordonnancementViaDelegation,
    delegatorInfo: ordonnancementDelegatorInfo,
  } = useCanValidateOrdonnancement();
  const { canPerform } = usePermissionCheck();

  // Combine permission directe et délégation pour la validation
  const canValidateOrdonnancementFinal =
    canPerform('ordonnancement.validate') || canValidateViaDelegation;

  // RBAC: seul le DG (ordonnateur) et ADMIN peuvent créer des ordonnancements
  const { canCreate: canCreateRBAC, isDG } = useRBAC();
  const canCreateOrdonnancement = canWrite && canCreateRBAC('ordonnancement');

  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState(isDG ? 'en_signature' : 'a_traiter');

  // DG : ouvrir directement sur "En signature" (fallback si isDG charge après le mount)
  useEffect(() => {
    if (isDG) setActiveTab('en_signature');
  }, [isDG]);
  const [preselectedLiqId, setPreselectedLiqId] = useState<string>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedOrdForDetails, setSelectedOrdForDetails] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Pagination "À traiter"
  const [aTraiterPage, setATraiterPage] = useState(1);
  const [aTraiterPageSize, setATraiterPageSize] = useState(20);
  // Pagination "Validés"
  const [validesPage, setValidesPage] = useState(1);
  const [validesPageSize, setValidesPageSize] = useState(20);

  // Handle sourceLiquidation URL parameter — RBAC guard
  useEffect(() => {
    const sourceLiqId = searchParams.get('sourceLiquidation');
    if (sourceLiqId) {
      if (!canCreateOrdonnancement) {
        toast.error("Vous n'avez pas les droits pour créer un ordonnancement.");
        searchParams.delete('sourceLiquidation');
        setSearchParams(searchParams, { replace: true });
        return;
      }
      setShowForm(true);
      // Form will auto-select the liquidation
    }
  }, [searchParams, setSearchParams, canCreateOrdonnancement]);

  // Filtrer par recherche
  const filteredOrdonnancements = ordonnancements.filter(
    (ord) =>
      (ord.numero?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (ord.beneficiaire?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (ord.objet?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  // Stats
  const stats = {
    total: ordonnancements.length,
    montantTotal: ordonnancements.reduce((sum, ord) => sum + (ord.montant || 0), 0),
    aValider: ordonnancements.filter(
      (o) => o.statut === 'soumis' || o.workflow_status === 'en_validation'
    ).length,
    valides: ordonnancements.filter((o) => o.statut === 'valide').length,
    enSignature: ordonnancements.filter((o) => o.statut === 'en_signature').length,
    ordonnances: ordonnancements.filter((o) => o.statut === 'ordonnance').length,
    rejetes: ordonnancements.filter((o) => o.statut === 'rejete').length,
    differes: ordonnancements.filter((o) => o.statut === 'differe').length,
  };

  const handleCreateReglement = (ordonnancementId: string) => {
    navigate(`/reglements?sourceOrdonnancement=${ordonnancementId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Indicateur de workflow */}
      <WorkflowStepIndicator currentStep={7} />

      {/* Aide contextuelle */}
      <ModuleHelp {...MODULE_HELP_CONFIG.ordonnancements} />

      {/* Page Header */}
      <PageHeader
        title="Ordonnancements"
        description="Ordres de paiement"
        icon={FileCheck}
        stepNumber={8}
        backUrl="/"
      >
        {ordonnancementViaDelegation && (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <User className="h-3 w-3 mr-1" />
            Validation par délégation
            {ordonnancementDelegatorInfo ? ` du ${ordonnancementDelegatorInfo.role}` : ''}
          </Badge>
        )}
        <BudgetChainExportButton step="ordonnancement" />
        {canCreateOrdonnancement ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button className="gap-2" onClick={() => setShowForm(true)} disabled={!canWrite}>
                    {!canWrite ? <Lock className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    Nouvel ordonnancement
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
        ) : null}
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileCheck className="h-6 w-6 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Montant total</p>
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(stats.montantTotal)}
                </p>
              </div>
              <Wallet className="h-6 w-6 text-primary/40" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">À valider</p>
                <p className="text-2xl font-bold text-warning">{stats.aValider}</p>
              </div>
              <Clock className="h-6 w-6 text-warning/40" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Validés</p>
                <p className="text-2xl font-bold text-success">{stats.valides}</p>
              </div>
              <FileSignature className="h-6 w-6 text-success/40" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">En signature</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.enSignature}</p>
              </div>
              <FileSignature className="h-6 w-6 text-indigo-500/40" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Ordonnancés</p>
                <p className="text-2xl font-bold text-green-600">{stats.ordonnances}</p>
              </div>
              <FileCheck className="h-6 w-6 text-green-500/40" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Rejetés</p>
                <p className="text-2xl font-bold text-destructive">{stats.rejetes}</p>
              </div>
              <XCircle className="h-6 w-6 text-destructive/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs with lists */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle>Liste des ordonnancements</CardTitle>
              <CardDescription>
                {filteredOrdonnancements.length} ordonnancement(s) trouvé(s)
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 flex-wrap h-auto gap-1">
              <TabsTrigger value="a_traiter" className="gap-1">
                <Tag className="h-3 w-3" />
                Liquidations à ordonnancer ({liquidationsValidees.length})
              </TabsTrigger>
              <TabsTrigger value="tous">Tous ({stats.total})</TabsTrigger>
              <TabsTrigger value="a_valider">À valider ({stats.aValider})</TabsTrigger>
              <TabsTrigger value="valides">Validés ({stats.valides})</TabsTrigger>
              <TabsTrigger value="en_signature">En signature ({stats.enSignature})</TabsTrigger>
              <TabsTrigger value="ordonnances">Ordonnancés ({stats.ordonnances})</TabsTrigger>
              <TabsTrigger value="rejetes">Rejetés ({stats.rejetes})</TabsTrigger>
              <TabsTrigger value="differes">Différés ({stats.differes})</TabsTrigger>
            </TabsList>

            {/* Onglet À traiter - Liquidations validées */}
            <TabsContent value="a_traiter">
              {liquidationsValidees.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Aucune liquidation à ordonnancer</p>
                  <p className="text-sm mt-1">Les liquidations validées apparaîtront ici</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Réf. Liquidation</TableHead>
                        <TableHead className="hidden sm:table-cell">Fournisseur / Objet</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {}
                      {liquidationsValidees
                        .slice(
                          (aTraiterPage - 1) * aTraiterPageSize,
                          aTraiterPage * aTraiterPageSize
                        )
                        .map((liq: any) => (
                          <TableRow key={liq.id}>
                            <TableCell>
                              <div>
                                <span className="font-mono text-sm font-medium">
                                  {liq.numero || '-'}
                                </span>
                                <p className="text-xs text-muted-foreground mt-0.5 sm:hidden">
                                  {liq.engagement?.fournisseur || liq.engagement?.objet || '-'}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <div>
                                {liq.engagement?.fournisseur && (
                                  <span className="font-medium text-sm">
                                    {liq.engagement.fournisseur}
                                  </span>
                                )}
                                <p
                                  className="text-xs text-muted-foreground truncate max-w-[250px]"
                                  title={liq.engagement?.objet}
                                >
                                  {liq.engagement?.objet || '-'}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-semibold whitespace-nowrap">
                              {formatCurrency(liq.montant || 0)}
                            </TableCell>
                            <TableCell className="text-right">
                              {canCreateOrdonnancement && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setPreselectedLiqId(liq.id);
                                    setShowForm(true);
                                  }}
                                >
                                  <FileSignature className="mr-2 h-4 w-4" />
                                  <span className="hidden sm:inline">Ordonnancer</span>
                                  <span className="sm:hidden">Ordo.</span>
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                  <NotesPagination
                    page={aTraiterPage}
                    pageSize={aTraiterPageSize}
                    total={liquidationsValidees.length}
                    totalPages={Math.ceil(liquidationsValidees.length / aTraiterPageSize)}
                    onPageChange={setATraiterPage}
                    onPageSizeChange={(size) => {
                      setATraiterPageSize(size);
                      setATraiterPage(1);
                    }}
                  />
                </>
              )}
            </TabsContent>

            <TabsContent value="tous">
              <OrdonnancementList
                ordonnancements={filteredOrdonnancements}
                filter="tous"
                canValidate={canValidateOrdonnancementFinal}
              />
            </TabsContent>
            <TabsContent value="a_valider">
              <OrdonnancementList
                ordonnancements={filteredOrdonnancements}
                filter="a_valider"
                canValidate={canValidateOrdonnancementFinal}
              />
            </TabsContent>

            {/* Onglet Validés avec action Règlement */}
            <TabsContent value="valides">
              {(() => {
                const validesFiltered = filteredOrdonnancements.filter(
                  (o) => o.statut === 'valide'
                );
                return (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Numéro</TableHead>
                          <TableHead>Bénéficiaire</TableHead>
                          <TableHead>Mode paiement</TableHead>
                          <TableHead className="text-right">Montant</TableHead>
                          <TableHead className="text-right">Payé</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validesFiltered.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center py-8 text-muted-foreground"
                            >
                              Aucun ordonnancement validé
                            </TableCell>
                          </TableRow>
                        ) : (
                          validesFiltered
                            .slice(
                              (validesPage - 1) * validesPageSize,
                              validesPage * validesPageSize
                            )
                            .map((ord) => {
                              const restant = (ord.montant || 0) - (ord.montant_paye || 0);
                              const isSolde = restant <= 0;
                              return (
                                <TableRow key={ord.id}>
                                  <TableCell className="font-mono text-sm">{ord.numero}</TableCell>
                                  <TableCell>{ord.beneficiaire || '-'}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{ord.mode_paiement || '-'}</Badge>
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {formatCurrency(ord.montant || 0)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <span className={isSolde ? 'text-success' : 'text-warning'}>
                                      {formatCurrency(ord.montant_paye || 0)}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="bg-popover">
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setSelectedOrdForDetails(ord);
                                            setShowDetails(true);
                                          }}
                                        >
                                          <Eye className="mr-2 h-4 w-4" />
                                          Voir détails
                                        </DropdownMenuItem>
                                        {!isSolde && canCreateRBAC('reglement') && (
                                          <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                              onClick={() => handleCreateReglement(ord.id)}
                                              className="text-primary"
                                            >
                                              <Wallet className="mr-2 h-4 w-4" />
                                              Enregistrer règlement
                                            </DropdownMenuItem>
                                          </>
                                        )}
                                        {isSolde && (
                                          <DropdownMenuItem disabled>
                                            <FileCheck className="mr-2 h-4 w-4 text-success" />
                                            Soldé
                                          </DropdownMenuItem>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                        )}
                      </TableBody>
                    </Table>
                    {validesFiltered.length > validesPageSize && (
                      <NotesPagination
                        page={validesPage}
                        pageSize={validesPageSize}
                        total={validesFiltered.length}
                        totalPages={Math.ceil(validesFiltered.length / validesPageSize)}
                        onPageChange={setValidesPage}
                        onPageSizeChange={(size) => {
                          setValidesPageSize(size);
                          setValidesPage(1);
                        }}
                      />
                    )}
                  </>
                );
              })()}
            </TabsContent>

            <TabsContent value="en_signature">
              <OrdonnancementList
                ordonnancements={filteredOrdonnancements}
                filter="en_signature"
                canValidate={canValidateOrdonnancementFinal}
              />
            </TabsContent>
            <TabsContent value="ordonnances">
              <OrdonnancementList
                ordonnancements={filteredOrdonnancements}
                filter="ordonnances"
                canValidate={false}
              />
            </TabsContent>
            <TabsContent value="rejetes">
              <OrdonnancementList
                ordonnancements={filteredOrdonnancements}
                filter="rejetes"
                canValidate={canValidateOrdonnancementFinal}
              />
            </TabsContent>
            <TabsContent value="differes">
              <OrdonnancementList
                ordonnancements={filteredOrdonnancements}
                filter="differes"
                canValidate={canValidateOrdonnancementFinal}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <OrdonnancementForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setPreselectedLiqId(undefined);
        }}
        preselectedLiquidationId={preselectedLiqId}
      />

      {/* Details Dialog */}
      {selectedOrdForDetails && (
        <OrdonnancementDetails
          ordonnancement={selectedOrdForDetails}
          open={showDetails}
          onOpenChange={setShowDetails}
        />
      )}
    </div>
  );
}
