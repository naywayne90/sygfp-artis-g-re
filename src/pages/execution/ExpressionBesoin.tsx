import { useState, useEffect } from 'react';
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
import { useExercice } from '@/contexts/ExerciceContext';
import { useExpressionsBesoin } from '@/hooks/useExpressionsBesoin';
import { usePermissions } from '@/hooks/usePermissions';
import { ExpressionBesoinForm } from '@/components/expression-besoin/ExpressionBesoinForm';
import {
  ExpressionBesoinFromImputationForm,
  ImputationValidee,
} from '@/components/expression-besoin/ExpressionBesoinFromImputationForm';
import { ExpressionBesoinList } from '@/components/expression-besoin/ExpressionBesoinList';
import { ExpressionBesoinDetails } from '@/components/expression-besoin/ExpressionBesoinDetails';
import { ExpressionBesoinExportButton } from '@/components/expression-besoin/ExpressionBesoinExportButton';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Briefcase,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  PauseCircle,
  Plus,
  Search,
  Loader2,
  CreditCard,
  Tag,
  Eye,
  ShoppingCart,
  FileSignature,
  ShieldCheck,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { NotesPagination } from '@/components/shared/NotesPagination';
import { formatMontant } from '@/lib/config/sygfp-constants';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

// Tab -> server statut filter mapping
const TAB_STATUT: Record<string, string | undefined> = {
  a_traiter: undefined,
  brouillons: 'brouillon',
  a_verifier: 'soumis',
  a_valider: 'verifie',
  validees: 'valide',
  satisfaites: 'satisfaite',
  rejetees: 'rejete',
  differees: 'differe',
  toutes: undefined,
};

export default function ExpressionBesoin() {
  const { exercice: _exercice } = useExercice();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canVerifyEB, canValidateEB } = usePermissions();

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('a_traiter');

  // Reset page on tab or search change
  useEffect(() => {
    setPage(1);
  }, [activeTab, searchTerm]);

  // Server filter based on active tab
  const serverStatut = TAB_STATUT[activeTab];

  const {
    expressions,
    totalCount,
    totalPages,
    counts,
    imputationsValidees,
    isLoading,
    // Mutations
    submitExpression,
    verifyExpression,
    validateExpression,
    rejectExpression,
    deferExpression,
    resumeExpression,
    deleteExpression,
    isSubmitting,
  } = useExpressionsBesoin({
    statut: serverStatut,
    search: searchTerm || undefined,
    page,
    pageSize,
  });

  const [showForm, setShowForm] = useState(false);
  const [showImputationForm, setShowImputationForm] = useState(false);
  const [sourceImputation, setSourceImputation] = useState<ImputationValidee | null>(null);
  const [isLoadingSource, setIsLoadingSource] = useState(false);
  const [viewExpressionId, setViewExpressionId] = useState<string | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);

  // Gérer le paramètre ?view= pour ouvrir le détail (lazy-loaded by ID)
  useEffect(() => {
    const viewId = searchParams.get('view');
    if (viewId) {
      setViewExpressionId(viewId);
      setShowViewDialog(true);
    }
  }, [searchParams]);

  // Gérer le paramètre sourceImputation depuis l'URL
  useEffect(() => {
    const sourceImputationId = searchParams.get('sourceImputation');
    if (sourceImputationId) {
      setIsLoadingSource(true);
      supabase
        .from('imputations')
        .select(
          `
          id, reference, objet, montant, code_imputation, direction_id, dossier_id,
          direction:directions(id, label, sigle),
          budget_line:budget_lines(id, code, label)
        `
        )
        .eq('id', sourceImputationId)
        .single()
        .then(({ data, error }) => {
          setIsLoadingSource(false);
          if (error) {
            toast.error("Impossible de charger l'imputation source");
            searchParams.delete('sourceImputation');
            setSearchParams(searchParams, { replace: true });
          } else if (data) {
            setSourceImputation(data as unknown as ImputationValidee);
            setShowImputationForm(true);
          }
        });
    }
  }, [searchParams, setSearchParams]);

  const handleCloseImputationForm = () => {
    setShowImputationForm(false);
    setSourceImputation(null);
    searchParams.delete('sourceImputation');
    setSearchParams(searchParams, { replace: true });
  };

  const formatMontantOrDash = (montant: number | null) => (montant ? formatMontant(montant) : '-');

  if (isLoadingSource) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Expressions de Besoin"
        description="Formalisation des besoins"
        icon={Briefcase}
        stepNumber={4}
        backUrl="/"
      >
        <ExpressionBesoinExportButton
          filters={{ statut: serverStatut, search: searchTerm || undefined }}
        />
        <Button variant="outline" onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Depuis marché
        </Button>
        <Button onClick={() => setShowImputationForm(true)}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Nouvelle EB
        </Button>
      </PageHeader>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">À traiter</CardTitle>
            <Tag className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{imputationsValidees.length}</div>
            <p className="text-xs text-muted-foreground">Imputations validées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Brouillons</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.brouillon}</div>
            <p className="text-xs text-muted-foreground">En cours</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">
              À vérifier
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {counts.soumis}
            </div>
            <p className="text-xs text-blue-600/70 dark:text-blue-400/70">CB (couverture budget)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">À valider</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.verifie}</div>
            <p className="text-xs text-muted-foreground">DG/DAAF</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Validées</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.valide}</div>
            <p className="text-xs text-muted-foreground">Prêtes passation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Satisfaites</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.satisfaite}</div>
            <p className="text-xs text-muted-foreground">Passation créée</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejetées</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.rejete}</div>
            <p className="text-xs text-muted-foreground">Refusées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Différées</CardTitle>
            <PauseCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.differe}</div>
            <p className="text-xs text-muted-foreground">Reportées</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerte si aucune imputation validée */}
      {imputationsValidees.length === 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800 dark:text-amber-300">
                  Imputation budgétaire requise
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  Pour créer une Expression de Besoin, vous devez d'abord disposer d'au moins une
                  imputation validée. Rendez-vous sur la page{' '}
                  <a href="/execution/imputation" className="underline font-medium">
                    Imputation
                  </a>{' '}
                  pour imputer une Note AEF validée.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des expressions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Expressions de besoin</CardTitle>
              <CardDescription>Créer des EB depuis les imputations validées</CardDescription>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 flex flex-wrap gap-1 h-auto">
              <TabsTrigger value="a_traiter" className="gap-1">
                <Tag className="h-3 w-3" />À traiter
                <Badge variant="secondary" className="ml-1 text-xs">
                  {imputationsValidees.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="brouillons">Brouillons ({counts.brouillon})</TabsTrigger>
              {canVerifyEB() && (
                <TabsTrigger value="a_verifier" className="gap-1">
                  <ShieldCheck className="h-3 w-3" />À vérifier
                  <Badge variant="secondary" className="ml-1 text-xs bg-blue-100 text-blue-700">
                    {counts.soumis}
                  </Badge>
                </TabsTrigger>
              )}
              {canValidateEB() && (
                <TabsTrigger value="a_valider">À valider ({counts.verifie})</TabsTrigger>
              )}
              <TabsTrigger value="validees">Validées ({counts.valide})</TabsTrigger>
              <TabsTrigger value="satisfaites">Satisfaites ({counts.satisfaite})</TabsTrigger>
              <TabsTrigger value="rejetees">Rejetées ({counts.rejete})</TabsTrigger>
              <TabsTrigger value="differees">Différées ({counts.differe})</TabsTrigger>
              <TabsTrigger value="toutes">Toutes ({counts.total})</TabsTrigger>
            </TabsList>

            {/* Onglet Imputations à traiter */}
            <TabsContent value="a_traiter">
              {imputationsValidees.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune imputation validée à traiter</p>
                  <p className="text-sm mt-1">Les imputations validées apparaîtront ici</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Référence</TableHead>
                        <TableHead>Objet</TableHead>
                        <TableHead>Direction</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {imputationsValidees.map((imp) => (
                        <TableRow key={imp.id}>
                          <TableCell className="font-mono text-sm">
                            {imp.reference || '-'}
                          </TableCell>
                          <TableCell className="max-w-[250px] truncate">{imp.objet}</TableCell>
                          <TableCell>
                            {imp.direction?.sigle || imp.direction?.label || '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatMontantOrDash(imp.montant)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/execution/imputation?view=${imp.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSourceImputation(imp);
                                  setShowImputationForm(true);
                                }}
                              >
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                Créer EB
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Onglet validées avec action passation */}
            <TabsContent value="validees">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Référence</TableHead>
                        <TableHead>Objet</TableHead>
                        <TableHead>Direction</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expressions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Aucune expression de besoin validée
                          </TableCell>
                        </TableRow>
                      ) : (
                        expressions.map((eb) => (
                          <TableRow key={eb.id}>
                            <TableCell className="font-mono text-sm">{eb.numero || '-'}</TableCell>
                            <TableCell className="max-w-[250px] truncate">{eb.objet}</TableCell>
                            <TableCell>
                              {eb.direction?.sigle || eb.direction?.label || '-'}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatMontantOrDash(eb.montant_estime)}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      navigate(`/execution/expression-besoin?view=${eb.id}`)
                                    }
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    Voir détails
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      navigate(`/execution/passation-marche?sourceEB=${eb.id}`)
                                    }
                                    className="text-primary"
                                  >
                                    <FileSignature className="mr-2 h-4 w-4" />
                                    Créer passation marché
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Autres onglets — server-filtered data from the hook */}
            {[
              'toutes',
              'brouillons',
              'a_verifier',
              'a_valider',
              'satisfaites',
              'rejetees',
              'differees',
            ].map((tab) => (
              <TabsContent key={tab} value={tab}>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <ExpressionBesoinList
                    expressions={expressions}
                    onSubmit={submitExpression}
                    onDelete={deleteExpression}
                    onVerify={verifyExpression}
                    onValidate={validateExpression}
                    onReject={rejectExpression}
                    onDefer={deferExpression}
                    onResume={resumeExpression}
                    isSubmitting={isSubmitting}
                  />
                )}
              </TabsContent>
            ))}
          </Tabs>

          {/* Pagination */}
          <NotesPagination
            page={page}
            pageSize={pageSize}
            total={totalCount}
            totalPages={totalPages}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </CardContent>
      </Card>

      {/* Form dialog depuis marché */}
      <ExpressionBesoinForm open={showForm} onOpenChange={setShowForm} />

      {/* Detail dialog via ?view= (lazy loaded by ID) */}
      <ExpressionBesoinDetails
        expressionId={viewExpressionId ?? undefined}
        open={showViewDialog}
        onOpenChange={(open) => {
          setShowViewDialog(open);
          if (!open) {
            setViewExpressionId(null);
            searchParams.delete('view');
            setSearchParams(searchParams, { replace: true });
          }
        }}
      />

      {/* Form dialog depuis imputation */}
      <ExpressionBesoinFromImputationForm
        open={showImputationForm}
        onOpenChange={handleCloseImputationForm}
        sourceImputation={sourceImputation}
        imputationsValidees={imputationsValidees}
        onSuccess={() => setActiveTab('toutes')}
      />
    </div>
  );
}
