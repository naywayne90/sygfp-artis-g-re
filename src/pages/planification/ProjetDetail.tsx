import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePlansTravail } from '@/hooks/usePlansTravail';
import { useProjetTaches } from '@/hooks/useProjetTaches';
import { useLivrableValidation } from '@/hooks/useLivrableValidation';
import { useExercice } from '@/contexts/ExerciceContext';
import { TacheForm } from '@/components/roadmap/TacheForm';
import { EmptyStateNoData } from '@/components/shared/EmptyState';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Check,
  Pencil,
  Plus,
  Package,
  Send,
  Trash2,
  X,
  ListChecks,
  Wallet,
  Users,
} from 'lucide-react';
import type { Tache, TacheInput } from '@/types/roadmap';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';

const STATUT_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  planifie: 'secondary',
  en_cours: 'default',
  termine: 'default',
  en_retard: 'destructive',
  suspendu: 'outline',
  annule: 'outline',
};

const PRIORITE_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  basse: 'outline',
  normale: 'secondary',
  haute: 'default',
  critique: 'destructive',
};

const LIVRABLE_STATUT_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> =
  {
    planifie: 'secondary',
    en_cours: 'secondary',
    soumis: 'default',
    valide: 'default',
    rejete: 'destructive',
    en_retard: 'destructive',
  };

export default function ProjetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { exercice } = useExercice();
  const { plans, isLoading: plansLoading, updatePlan, deletePlan } = usePlansTravail();
  const {
    taches,
    stats,
    isLoading: tachesLoading,
    createTache,
    updateTache,
    updateAvancement,
    deleteTache,
    isCreating,
    isUpdating,
  } = useProjetTaches(undefined, id);
  const {
    livrables,
    stats: livrableStats,
    createLivrable,
    submitLivrable,
    validateLivrable,
    rejectLivrable,
  } = useLivrableValidation({ planId: id });
  const [tacheFormOpen, setTacheFormOpen] = useState(false);
  const [editingTache, setEditingTache] = useState<Tache | null>(null);
  const [livrableFormOpen, setLivrableFormOpen] = useState(false);
  const [livrableNom, setLivrableNom] = useState('');
  const [livrableDescription, setLivrableDescription] = useState('');
  const [livrableDatePrevue, setLivrableDatePrevue] = useState('');
  const [livrableTacheId, setLivrableTacheId] = useState('');
  const [rejectingLivrableId, setRejectingLivrableId] = useState<string | null>(null);
  const [motifRejet, setMotifRejet] = useState('');

  const plan = plans.find((p) => p.id === id);

  // Fallback: fetch direction separately if join didn't populate it
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseUntyped = supabase as any;
  const { data: directionData } = useQuery({
    queryKey: ['direction-detail', plan?.direction_id],
    queryFn: async () => {
      if (!plan?.direction_id) return null;
      const { data } = await supabaseUntyped
        .from('directions')
        .select('id, code, label, sigle')
        .eq('id', plan.direction_id)
        .single();
      return data as { id: string; code: string; label: string; sigle: string } | null;
    },
    enabled: !!plan?.direction_id && !plan?.direction?.label,
  });

  // Fallback: fetch responsable separately if join didn't populate it
  const { data: responsableData } = useQuery({
    queryKey: ['responsable-detail', plan?.responsable_id],
    queryFn: async () => {
      if (!plan?.responsable_id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, full_name')
        .eq('id', plan.responsable_id)
        .single();
      return data;
    },
    enabled: !!plan?.responsable_id && !plan?.responsable?.full_name,
  });

  const directionDisplay =
    plan?.direction?.label ||
    plan?.direction?.sigle ||
    directionData?.label ||
    directionData?.sigle ||
    '-';
  const responsableDisplay = plan?.responsable
    ? plan.responsable.full_name ||
      `${plan.responsable.first_name || ''} ${plan.responsable.last_name || ''}`.trim() ||
      '-'
    : responsableData
      ? responsableData.full_name ||
        `${responsableData.first_name || ''} ${responsableData.last_name || ''}`.trim() ||
        '-'
      : '-';

  if (plansLoading || tachesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <EmptyStateNoData entityName="plan de travail" />
      </div>
    );
  }

  const pctBudget =
    plan.budget_alloue > 0 ? Math.round((plan.budget_consomme / plan.budget_alloue) * 100) : 0;

  // Unique responsables from RACI
  const responsables = new Map<string, { responsable: string; accountable: string }>();
  for (const t of taches) {
    if (t.raci_responsable) {
      responsables.set(t.raci_responsable, {
        responsable: t.raci_responsable,
        accountable: t.raci_accountable ?? '-',
      });
    }
  }

  const handleSoumettre = async () => {
    if (!plan) return;
    try {
      await updatePlan({ id: plan.id, statut: 'soumis' });
      toast.success('Plan soumis pour validation');
    } catch {
      toast.error('Erreur lors de la soumission');
    }
  };

  const handleDelete = async () => {
    if (!plan) return;
    try {
      await deletePlan(plan.id);
      navigate('/planification/plan-travail');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleCreateTache = async (data: TacheInput) => {
    if (editingTache) {
      await updateTache({ id: editingTache.id, ...data });
      setEditingTache(null);
    } else {
      await createTache({ ...data, plan_travail_id: id });
    }
  };

  const handleEditTache = (tache: Tache) => {
    setEditingTache(tache);
    setTacheFormOpen(true);
  };

  const handleAvancementChange = async (tacheId: string, value: number[]) => {
    await updateAvancement({ id: tacheId, avancement: value[0] });
  };

  const handleDeleteTache = async (tacheId: string) => {
    if (!confirm('Supprimer cette tache ?')) return;
    await deleteTache(tacheId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{plan.libelle}</h1>
            <Badge variant={plan.statut === 'en_cours' ? 'default' : 'secondary'}>
              {plan.statut}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            <span>Code: {plan.code}</span>
            <span>Direction: {directionDisplay}</span>
            <span>Responsable: {responsableDisplay}</span>
            <span>
              {plan.date_debut ?? '?'} - {plan.date_fin ?? '?'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/planification/plan-travail')}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          {plan.statut === 'brouillon' && (
            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleSoumettre}>
              <Send className="h-4 w-4 mr-2" />
              Soumettre
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer ce plan ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action va desactiver le plan &quot;{plan.libelle}&quot;. Les taches
                  associees seront conservees.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive">
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Budget summary bar */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Budget</span>
            <span className="text-sm">
              {formatCurrency(plan.budget_consomme)} / {formatCurrency(plan.budget_alloue)} (
              {pctBudget}%)
            </span>
          </div>
          <Progress value={pctBudget} />
        </CardContent>
      </Card>

      {/* Audit info */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {plan.created_at && (
          <span>Cree le {new Date(plan.created_at).toLocaleDateString('fr-FR')}</span>
        )}
        {plan.updated_at && (
          <span>Modifie le {new Date(plan.updated_at).toLocaleDateString('fr-FR')}</span>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="taches">
        <TabsList>
          <TabsTrigger value="taches" className="gap-2">
            <ListChecks className="h-4 w-4" />
            Taches ({taches.length})
          </TabsTrigger>
          <TabsTrigger value="budget" className="gap-2">
            <Wallet className="h-4 w-4" />
            Budget
          </TabsTrigger>
          <TabsTrigger value="equipe" className="gap-2">
            <Users className="h-4 w-4" />
            Equipe
          </TabsTrigger>
          <TabsTrigger value="livrables" className="gap-2">
            <Package className="h-4 w-4" />
            Livrables ({livrableStats.total})
          </TabsTrigger>
        </TabsList>

        {/* Tab: Taches */}
        <TabsContent value="taches" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Badge variant="secondary">{stats.planifie} planifie(s)</Badge>
              <Badge variant="default">{stats.en_cours} en cours</Badge>
              <Badge variant="default">{stats.termine} termine(s)</Badge>
              {stats.en_retard > 0 && (
                <Badge variant="destructive">{stats.en_retard} en retard</Badge>
              )}
            </div>
            <Button onClick={() => setTacheFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Tache
            </Button>
          </div>

          {taches.length === 0 ? (
            <EmptyStateNoData entityName="tache" />
          ) : (
            <Card>
              <CardContent className="pt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Libelle</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Priorite</TableHead>
                      <TableHead>Avancement</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Responsable</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taches.map((tache) => (
                      <TableRow key={tache.id}>
                        <TableCell className="font-mono text-sm">{tache.code}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{tache.libelle}</TableCell>
                        <TableCell>
                          <Badge variant={STATUT_COLORS[tache.statut] ?? 'outline'}>
                            {tache.statut}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={PRIORITE_COLORS[tache.priorite] ?? 'outline'}>
                            {tache.priorite}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Slider
                              value={[tache.avancement]}
                              onValueCommit={(val) => handleAvancementChange(tache.id, val)}
                              max={100}
                              step={5}
                              className="w-20"
                            />
                            <span className="text-sm whitespace-nowrap">{tache.avancement}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {tache.date_debut ?? '-'} / {tache.date_fin ?? '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {tache.responsable
                            ? tache.responsable.full_name ||
                              `${tache.responsable.first_name || ''} ${tache.responsable.last_name || ''}`.trim() ||
                              '-'
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditTache(tache)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTache(tache.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Budget */}
        <TabsContent value="budget">
          <Card>
            <CardHeader>
              <CardTitle>Resume budgetaire</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Budget alloue</p>
                  <p className="text-xl font-bold">{formatCurrency(plan.budget_alloue)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Budget consomme</p>
                  <p className="text-xl font-bold">{formatCurrency(plan.budget_consomme)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Disponible</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(plan.budget_alloue - plan.budget_consomme)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Taux de consommation</p>
                  <p className="text-xl font-bold">{pctBudget}%</p>
                  <Progress value={pctBudget} className="mt-1" />
                </div>
              </div>

              {taches.length > 0 && (
                <>
                  <h3 className="text-sm font-semibold mt-6">Budget prevu par tache</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Libelle</TableHead>
                        <TableHead className="text-right">Budget prevu</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {taches
                        .filter((t) => t.budget_prevu > 0)
                        .map((t) => (
                          <TableRow key={t.id}>
                            <TableCell className="font-mono text-sm">{t.code}</TableCell>
                            <TableCell>{t.libelle}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(t.budget_prevu)}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Equipe */}
        <TabsContent value="equipe">
          <Card>
            <CardHeader>
              <CardTitle>Equipe - Matrice RACI</CardTitle>
            </CardHeader>
            <CardContent>
              {responsables.size === 0 ? (
                <EmptyStateNoData entityName="responsable RACI" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Responsable (R)</TableHead>
                      <TableHead>Accountable (A)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from(responsables.values()).map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.responsable}</TableCell>
                        <TableCell>{r.accountable}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Livrables */}
        <TabsContent value="livrables" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Badge variant="secondary">{livrableStats.planifie} planifie(s)</Badge>
              <Badge variant="default">{livrableStats.soumis} soumis</Badge>
              <Badge variant="default">{livrableStats.valide} valide(s)</Badge>
              <Badge variant="destructive">{livrableStats.rejete} rejete(s)</Badge>
              {livrableStats.enRetard > 0 && (
                <Badge variant="destructive">{livrableStats.enRetard} en retard</Badge>
              )}
            </div>
            <Button onClick={() => setLivrableFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter Livrable
            </Button>
          </div>

          {livrables.length === 0 ? (
            <EmptyStateNoData entityName="livrable" />
          ) : (
            <Card>
              <CardContent className="pt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Tache</TableHead>
                      <TableHead>Date prevue</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {livrables.map((livrable) => (
                      <TableRow key={livrable.id}>
                        <TableCell className="font-medium">{livrable.nom}</TableCell>
                        <TableCell className="text-sm">
                          {livrable.tache?.code ? `${livrable.tache.code} - ` : ''}
                          {livrable.tache?.libelle ?? '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {livrable.date_prevue
                            ? new Date(livrable.date_prevue).toLocaleDateString('fr-FR')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={LIVRABLE_STATUT_COLORS[livrable.statut] ?? 'outline'}>
                            {livrable.statut}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {(livrable.statut === 'planifie' || livrable.statut === 'en_cours') && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                onClick={() => submitLivrable.mutate({ id: livrable.id })}
                              >
                                <Send className="h-4 w-4 mr-1" />
                                Soumettre
                              </Button>
                            )}
                            {livrable.statut === 'soumis' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-green-600 border-green-600 hover:bg-green-50"
                                  onClick={() => validateLivrable.mutate({ id: livrable.id })}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Valider
                                </Button>
                                {rejectingLivrableId === livrable.id ? (
                                  <div className="flex items-center gap-1">
                                    <Input
                                      placeholder="Motif de rejet"
                                      value={motifRejet}
                                      onChange={(e) => setMotifRejet(e.target.value)}
                                      className="h-8 w-40"
                                    />
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      disabled={!motifRejet.trim()}
                                      onClick={() => {
                                        rejectLivrable.mutate({
                                          id: livrable.id,
                                          motif: motifRejet,
                                        });
                                        setRejectingLivrableId(null);
                                        setMotifRejet('');
                                      }}
                                    >
                                      Confirmer
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setRejectingLivrableId(null);
                                        setMotifRejet('');
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                    onClick={() => setRejectingLivrableId(livrable.id)}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Rejeter
                                  </Button>
                                )}
                              </>
                            )}
                            {livrable.statut === 'valide' && (
                              <Badge variant="default" className="bg-green-600">
                                <Check className="h-3 w-3 mr-1" />
                                Valide
                              </Badge>
                            )}
                            {livrable.statut === 'rejete' && (
                              <div className="flex items-center gap-2">
                                <Badge variant="destructive">
                                  <X className="h-3 w-3 mr-1" />
                                  Rejete
                                </Badge>
                                {livrable.motif_rejet && (
                                  <span className="text-xs text-muted-foreground italic">
                                    {livrable.motif_rejet}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Livrable Form Dialog */}
      <Dialog open={livrableFormOpen} onOpenChange={setLivrableFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un livrable</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="livrable-nom">Nom</Label>
              <Input
                id="livrable-nom"
                value={livrableNom}
                onChange={(e) => setLivrableNom(e.target.value)}
                placeholder="Nom du livrable"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="livrable-description">Description</Label>
              <Textarea
                id="livrable-description"
                value={livrableDescription}
                onChange={(e) => setLivrableDescription(e.target.value)}
                placeholder="Description du livrable"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="livrable-date">Date prevue</Label>
              <Input
                id="livrable-date"
                type="date"
                value={livrableDatePrevue}
                onChange={(e) => setLivrableDatePrevue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="livrable-tache">Tache</Label>
              <Select value={livrableTacheId} onValueChange={setLivrableTacheId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner une tache" />
                </SelectTrigger>
                <SelectContent>
                  {taches.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.code} - {t.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setLivrableFormOpen(false);
                setLivrableNom('');
                setLivrableDescription('');
                setLivrableDatePrevue('');
                setLivrableTacheId('');
              }}
            >
              Annuler
            </Button>
            <Button
              disabled={!livrableNom.trim() || !livrableTacheId}
              onClick={() => {
                createLivrable.mutate({
                  nom: livrableNom,
                  description: livrableDescription,
                  date_prevue: livrableDatePrevue || undefined,
                  tache_id: livrableTacheId,
                });
                setLivrableFormOpen(false);
                setLivrableNom('');
                setLivrableDescription('');
                setLivrableDatePrevue('');
                setLivrableTacheId('');
              }}
            >
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tache Form Dialog */}
      <TacheForm
        open={tacheFormOpen}
        onOpenChange={(open) => {
          setTacheFormOpen(open);
          if (!open) setEditingTache(null);
        }}
        onSubmit={handleCreateTache}
        defaultValues={editingTache ?? undefined}
        exercice={exercice ?? new Date().getFullYear()}
        isLoading={isCreating || isUpdating}
      />
    </div>
  );
}
