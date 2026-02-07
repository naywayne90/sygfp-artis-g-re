/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
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
  Filter,
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
import { OrdonnancementForm } from '@/components/ordonnancement/OrdonnancementForm';
import { OrdonnancementList } from '@/components/ordonnancement/OrdonnancementList';
import { useOrdonnancements } from '@/hooks/useOrdonnancements';
import { useExercice } from '@/contexts/ExerciceContext';
import { useExerciceWriteGuard } from '@/hooks/useExerciceWriteGuard';
import { useCanValidateOrdonnancement } from '@/hooks/useDelegations';
import { usePermissionCheck } from '@/components/auth/PermissionGuard';
import { ExerciceSubtitle } from '@/components/exercice/ExerciceSubtitle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { WorkflowStepIndicator } from '@/components/workflow/WorkflowStepIndicator';
import { ModuleHelp, MODULE_HELP_CONFIG } from '@/components/help/ModuleHelp';

const formatMontant = (montant: number) => new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';

export default function Ordonnancements() {
  const { exercice } = useExercice();
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

  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('a_traiter');

  // Handle sourceLiquidation URL parameter
  useEffect(() => {
    const sourceLiqId = searchParams.get('sourceLiquidation');
    if (sourceLiqId) {
      setShowForm(true);
      // Form will auto-select the liquidation
    }
  }, [searchParams]);

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
    rejetes: ordonnancements.filter((o) => o.statut === 'rejete').length,
    differes: ordonnancements.filter((o) => o.statut === 'differe').length,
  };

  const handleCreateReglement = (ordonnancementId: string) => {
    navigate(`/reglements?sourceOrdonnancement=${ordonnancementId}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Indicateur de workflow */}
      <WorkflowStepIndicator currentStep={7} />

      {/* Aide contextuelle */}
      <ModuleHelp {...MODULE_HELP_CONFIG.ordonnancements} />

      {/* Page Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <ExerciceSubtitle
            title="Ordonnancements"
            description="Ordres de paiement et mandats à transmettre au Trésor"
          />
          {ordonnancementViaDelegation && (
            <Badge variant="outline" className="mt-2 bg-amber-50 text-amber-700 border-amber-200">
              <User className="h-3 w-3 mr-1" />
              Validation par délégation
              {ordonnancementDelegatorInfo ? ` du ${ordonnancementDelegatorInfo.role}` : ''}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <BudgetChainExportButton step="ordonnancement" />
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
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileCheck className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Montant total</p>
              <p className="text-xl font-bold text-primary">{formatMontant(stats.montantTotal)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">À valider</p>
                <p className="text-2xl font-bold text-warning">{stats.aValider}</p>
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
                <p className="text-2xl font-bold text-success">{stats.valides}</p>
              </div>
              <FileSignature className="h-8 w-8 text-success/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejetés</p>
                <p className="text-2xl font-bold text-destructive">{stats.rejetes}</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro, bénéficiaire ou objet..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtres
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs with lists */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des ordonnancements</CardTitle>
          <CardDescription>
            {filteredOrdonnancements.length} ordonnancement(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="a_traiter" className="gap-1">
                <Tag className="h-3 w-3" />À traiter ({liquidationsValidees.length})
              </TabsTrigger>
              <TabsTrigger value="tous">Tous ({stats.total})</TabsTrigger>
              <TabsTrigger value="a_valider">À valider ({stats.aValider})</TabsTrigger>
              <TabsTrigger value="valides">Validés ({stats.valides})</TabsTrigger>
              <TabsTrigger value="rejetes">Rejetés ({stats.rejetes})</TabsTrigger>
              <TabsTrigger value="differes">Différés ({stats.differes})</TabsTrigger>
            </TabsList>

            {/* Onglet À traiter - Liquidations validées */}
            <TabsContent value="a_traiter">
              {liquidationsValidees.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune liquidation à ordonnancer</p>
                  <p className="text-sm">Les liquidations validées apparaîtront ici</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Réf. Liquidation</TableHead>
                      <TableHead>Engagement</TableHead>
                      <TableHead>Fournisseur</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {liquidationsValidees.map((liq: any) => (
                      <TableRow key={liq.id}>
                        <TableCell className="font-mono text-sm">{liq.numero || '-'}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {liq.engagement?.objet || '-'}
                        </TableCell>
                        <TableCell>{liq.engagement?.fournisseur || '-'}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatMontant(liq.montant || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => setShowForm(true)}>
                            <FileSignature className="mr-2 h-4 w-4" />
                            Ordonnancer
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                  {filteredOrdonnancements.filter((o) => o.statut === 'valide').length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Aucun ordonnancement validé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrdonnancements
                      .filter((o) => o.statut === 'valide')
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
                              {formatMontant(ord.montant || 0)}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={isSolde ? 'text-success' : 'text-warning'}>
                                {formatMontant(ord.montant_paye || 0)}
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
                                  <DropdownMenuItem>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Voir détails
                                  </DropdownMenuItem>
                                  {!isSolde && (
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
      <OrdonnancementForm open={showForm} onOpenChange={setShowForm} />
    </div>
  );
}
