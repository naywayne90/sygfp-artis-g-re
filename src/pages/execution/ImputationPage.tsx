import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useImputations, Imputation } from '@/hooks/useImputations';
import { useImputation } from '@/hooks/useImputation';
import { usePermissions } from '@/hooks/usePermissions';
import { ImputationForm } from '@/components/imputation/ImputationForm';
import { ImputationDetailSheet } from '@/components/imputation/ImputationDetailSheet';
import { ImputationRejectDialog } from '@/components/imputation/ImputationRejectDialog';
import { ImputationDeferDialog } from '@/components/imputation/ImputationDeferDialog';
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
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Eye,
  Send,
  XCircle,
  Trash2,
  Search,
  MoreHorizontal,
  FolderOpen,
  Loader2,
  Tag,
  ShoppingCart,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
import { WorkflowStepIndicator } from '@/components/workflow/WorkflowStepIndicator';
import { ModuleHelp, MODULE_HELP_CONFIG } from '@/components/help/ModuleHelp';
import { BudgetFormulas } from '@/components/budget/BudgetFormulas';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

/** Note AEF source pour le dialog d'imputation */
interface SourceAefNote {
  id: string;
  numero: string | null;
  objet: string;
  montant_estime: number | null;
  statut: string | null;
  priorite: string | null;
  direction?: { id: string; label: string; sigle: string | null } | null;
  created_by_profile?: { id: string; first_name: string | null; last_name: string | null } | null;
}

const getStatusBadge = (status: string) => {
  const variants: Record<string, { label: string; className: string }> = {
    brouillon: { label: 'Brouillon', className: 'bg-muted text-muted-foreground' },
    a_valider: { label: 'À valider', className: 'bg-warning/10 text-warning border-warning/20' },
    valide: { label: 'Validée', className: 'bg-success/10 text-success border-success/20' },
    rejete: {
      label: 'Rejetée',
      className: 'bg-destructive/10 text-destructive border-destructive/20',
    },
    differe: {
      label: 'Différée',
      className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    },
  };
  const variant = variants[status] || variants.brouillon;
  return (
    <Badge variant="outline" className={variant.className}>
      {variant.label}
    </Badge>
  );
};

export default function ImputationPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { hasAnyRole } = usePermissions();
  const canValidate = hasAnyRole(['ADMIN', 'DG', 'DAAF', 'SDPM']);

  // States
  const [activeTab, setActiveTab] = useState('a_imputer');
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceAefNote, setSourceAefNote] = useState<SourceAefNote | null>(null);
  const [viewingImputation, setViewingImputation] = useState<Imputation | null>(null);
  const [rejectingImputation, setRejectingImputation] = useState<Imputation | null>(null);
  const [deferringImputation, setDeferringImputation] = useState<Imputation | null>(null);

  // Hooks
  const { notesAImputer, loadingNotes } = useImputation();
  const {
    imputations,
    counts,
    isLoading: loadingImputations,
    refetch,
    submitImputation,
    validateImputation,
    rejectImputation,
    deferImputation,
    deleteImputation,
  } = useImputations({ search: searchQuery });

  // Gérer le paramètre sourceAef depuis l'URL
  useEffect(() => {
    const sourceAefId = searchParams.get('sourceAef');
    if (sourceAefId) {
      supabase
        .from('notes_dg')
        .select(
          `
          *,
          direction:directions(id, label, sigle),
          created_by_profile:profiles!notes_dg_created_by_fkey(id, first_name, last_name)
        `
        )
        .eq('id', sourceAefId)
        .single()
        .then(({ data, error }) => {
          if (error) {
            toast({
              title: 'Erreur',
              description: 'Impossible de charger la note AEF source',
              variant: 'destructive',
            });
            searchParams.delete('sourceAef');
            setSearchParams(searchParams, { replace: true });
          } else if (data) {
            if (data.statut !== 'a_imputer') {
              toast({
                title: 'Note non imputable',
                description: `Cette note est en statut "${data.statut}" et ne peut pas être imputée.`,
                variant: 'destructive',
              });
              searchParams.delete('sourceAef');
              setSearchParams(searchParams, { replace: true });
            } else {
              setSourceAefNote(data);
            }
          }
        });
    }
  }, [searchParams, setSearchParams, toast]);

  const handleCloseImputationDialog = () => {
    setSourceAefNote(null);
    searchParams.delete('sourceAef');
    setSearchParams(searchParams, { replace: true });
  };

  const handleImputationSuccess = () => {
    handleCloseImputationDialog();
    setActiveTab('imputees');
    refetch();
    toast({
      title: 'Imputation créée',
      description: "L'imputation a été créée avec succès.",
    });
  };

  const handleReject = async (motif: string) => {
    if (rejectingImputation) {
      await rejectImputation({ id: rejectingImputation.id, motif });
      setRejectingImputation(null);
    }
  };

  const handleDefer = async (motif: string, dateReprise?: string) => {
    if (deferringImputation) {
      await deferImputation({ id: deferringImputation.id, motif, dateReprise });
      setDeferringImputation(null);
    }
  };

  const handleGoToDossier = (dossierId: string) => {
    navigate(`/recherche?dossier=${dossierId}`);
  };

  const formatMontant = (montant: number | null) =>
    montant ? new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA' : '-';

  // Filtrer les imputations par onglet
  const imputationsByTab = useMemo(
    () => ({
      a_valider: imputations.filter((i) => i.statut === 'a_valider'),
      brouillons: imputations.filter((i) => i.statut === 'brouillon'),
      imputees: imputations.filter((i) => i.statut === 'valide'),
      differees: imputations.filter((i) => i.statut === 'differe'),
      rejetees: imputations.filter((i) => i.statut === 'rejete'),
    }),
    [imputations]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Indicateur de workflow */}
      <WorkflowStepIndicator currentStep={2} />

      <PageHeader
        title="Imputation"
        description="Imputation budgétaire"
        icon={Tag}
        stepNumber={3}
        backUrl="/"
      >
        <ModuleHelp {...MODULE_HELP_CONFIG.imputation} />
      </PageHeader>

      {/* Formules de référence */}
      <BudgetFormulas compact />

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Notes à imputer</p>
                <p className="text-2xl font-bold">{notesAImputer?.length || 0}</p>
              </div>
              <Tag className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">À valider</p>
                <p className="text-2xl font-bold">{counts.a_valider}</p>
              </div>
              <Clock className="h-8 w-8 text-warning opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Validées</p>
                <p className="text-2xl font-bold">{counts.valide}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-success opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Différées</p>
                <p className="text-2xl font-bold">{counts.differe}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejetées</p>
                <p className="text-2xl font-bold">{counts.rejete}</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par référence, objet, direction..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="a_imputer" className="gap-2">
            <Tag className="h-4 w-4" />À imputer
            <Badge variant="secondary" className="ml-1">
              {notesAImputer?.length || 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="a_valider" className="gap-2">
            <Clock className="h-4 w-4" />À valider
            <Badge variant="secondary" className="ml-1">
              {counts.a_valider}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="imputees" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Validées
            <Badge variant="secondary" className="ml-1">
              {counts.valide}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="differees" className="gap-2">
            <AlertCircle className="h-4 w-4" />
            Différées
            <Badge variant="secondary" className="ml-1">
              {counts.differe}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="rejetees" className="gap-2">
            <XCircle className="h-4 w-4" />
            Rejetées
            <Badge variant="secondary" className="ml-1">
              {counts.rejete}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Onglet: Notes à imputer */}
        <TabsContent value="a_imputer" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {loadingNotes ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !notesAImputer?.length ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune note AEF à imputer</p>
                  <p className="text-sm mt-1">Les notes AEF validées apparaîtront ici</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Numéro</TableHead>
                        <TableHead>Objet</TableHead>
                        <TableHead>Direction</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead>Priorité</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notesAImputer.map((note) => (
                        <TableRow key={note.id}>
                          <TableCell className="font-mono text-sm">{note.numero || '-'}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{note.objet}</TableCell>
                          <TableCell>
                            {note.direction?.sigle || note.direction?.label || '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatMontant(note.montant_estime)}
                          </TableCell>
                          <TableCell>
                            {note.priorite === 'urgente' && (
                              <Badge variant="destructive">Urgente</Badge>
                            )}
                            {note.priorite === 'haute' && (
                              <Badge className="bg-orange-500">Haute</Badge>
                            )}
                            {note.priorite === 'normale' && (
                              <Badge variant="secondary">Normale</Badge>
                            )}
                            {(!note.priorite || note.priorite === 'basse') && (
                              <Badge variant="outline">Basse</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/notes-aef/${note.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" onClick={() => setSourceAefNote(note)}>
                                <CreditCard className="mr-2 h-4 w-4" />
                                Imputer
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglets imputations (a_valider, imputees, differees, rejetees) */}
        {['a_valider', 'imputees', 'differees', 'rejetees'].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <Card>
              <CardContent className="pt-6">
                {loadingImputations ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : !imputationsByTab[tab as keyof typeof imputationsByTab]?.length ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune imputation dans cet onglet</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Référence</TableHead>
                          <TableHead>Objet</TableHead>
                          <TableHead>Direction</TableHead>
                          <TableHead>Code imputation</TableHead>
                          <TableHead className="text-right">Montant</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Créée le</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {imputationsByTab[tab as keyof typeof imputationsByTab].map((imp) => (
                          <TableRow key={imp.id}>
                            <TableCell className="font-mono text-sm">
                              {imp.reference || '-'}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">{imp.objet}</TableCell>
                            <TableCell>
                              {imp.direction?.sigle || imp.direction?.label || '-'}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {imp.code_imputation || '-'}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatMontant(imp.montant)}
                            </TableCell>
                            <TableCell>{getStatusBadge(imp.statut)}</TableCell>
                            <TableCell>
                              {format(new Date(imp.created_at), 'dd MMM yyyy', { locale: fr })}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-popover">
                                  <DropdownMenuItem onClick={() => setViewingImputation(imp)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Voir détails
                                  </DropdownMenuItem>

                                  {imp.dossier_id && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        imp.dossier_id && handleGoToDossier(imp.dossier_id)
                                      }
                                    >
                                      <FolderOpen className="mr-2 h-4 w-4" />
                                      Voir le dossier
                                    </DropdownMenuItem>
                                  )}

                                  {imp.statut === 'brouillon' && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => submitImputation(imp.id)}>
                                        <Send className="mr-2 h-4 w-4" />
                                        Soumettre
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => deleteImputation(imp.id)}
                                        className="text-destructive"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Supprimer
                                      </DropdownMenuItem>
                                    </>
                                  )}

                                  {imp.statut === 'a_valider' && canValidate && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => validateImputation(imp.id)}>
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Valider
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => setDeferringImputation(imp)}>
                                        <Clock className="mr-2 h-4 w-4" />
                                        Différer
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => setRejectingImputation(imp)}
                                        className="text-destructive"
                                      >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Rejeter
                                      </DropdownMenuItem>
                                    </>
                                  )}

                                  {imp.statut === 'valide' && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() =>
                                          navigate(
                                            `/execution/expression-besoin?sourceImputation=${imp.id}`
                                          )
                                        }
                                      >
                                        <ShoppingCart className="mr-2 h-4 w-4" />
                                        Créer expression de besoin
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Dialog d'imputation depuis AEF source */}
      <Dialog
        open={!!sourceAefNote}
        onOpenChange={(open) => !open && handleCloseImputationDialog()}
      >
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Créer une imputation
            </DialogTitle>
          </DialogHeader>
          <ImputationForm
            note={
              sourceAefNote
                ? {
                    id: sourceAefNote.id,
                    numero: sourceAefNote.numero,
                    objet: sourceAefNote.objet,
                    montant_estime: sourceAefNote.montant_estime,
                    direction: sourceAefNote.direction,
                    created_by_profile: sourceAefNote.created_by_profile,
                  }
                : undefined
            }
            onSuccess={handleImputationSuccess}
            onCancel={handleCloseImputationDialog}
          />
        </DialogContent>
      </Dialog>

      {/* Sheet détail imputation */}
      <ImputationDetailSheet
        open={!!viewingImputation}
        onOpenChange={(open) => !open && setViewingImputation(null)}
        imputation={viewingImputation}
        onRefresh={refetch}
      />

      {/* Dialogs de rejet et report */}
      <ImputationRejectDialog
        open={!!rejectingImputation}
        onOpenChange={(open) => !open && setRejectingImputation(null)}
        imputationReference={rejectingImputation?.reference || null}
        onConfirm={handleReject}
      />

      <ImputationDeferDialog
        open={!!deferringImputation}
        onOpenChange={(open) => !open && setDeferringImputation(null)}
        imputationReference={deferringImputation?.reference || null}
        onConfirm={handleDefer}
      />
    </div>
  );
}
