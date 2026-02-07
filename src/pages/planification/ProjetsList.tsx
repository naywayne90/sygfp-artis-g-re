import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePlansTravail } from '@/hooks/usePlansTravail';
import { useExercice } from '@/contexts/ExerciceContext';
import { EmptyStateNoData } from '@/components/shared/EmptyState';
import { FolderKanban, Plus, Search, Eye, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { PlanTravailStatut } from '@/types/roadmap';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';

const STATUT_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  brouillon: 'secondary',
  valide: 'default',
  en_cours: 'default',
  cloture: 'outline',
};

export default function ProjetsList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const directionFilter = searchParams.get('direction') || undefined;

  const { exerciceId } = useExercice();
  const { plans, isLoading, createPlan, updatePlan, deletePlan, isCreating } =
    usePlansTravail(directionFilter);

  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    libelle: '',
    description: '',
    direction_id: '',
    date_debut: '',
    date_fin: '',
    budget_alloue: 0,
    statut: 'brouillon' as PlanTravailStatut,
  });

  const filteredPlans = useMemo(() => {
    let result = plans;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.code.toLowerCase().includes(q) || p.libelle.toLowerCase().includes(q)
      );
    }
    if (statutFilter !== 'all') {
      result = result.filter((p) => p.statut === statutFilter);
    }
    return result;
  }, [plans, search, statutFilter]);

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setFormData({
      code: '',
      libelle: '',
      description: '',
      direction_id: directionFilter || '',
      date_debut: '',
      date_fin: '',
      budget_alloue: 0,
      statut: 'brouillon',
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (plan: (typeof plans)[0]) => {
    setEditingPlan(plan.id);
    setFormData({
      code: plan.code,
      libelle: plan.libelle,
      description: plan.description ?? '',
      direction_id: plan.direction_id,
      date_debut: plan.date_debut ?? '',
      date_fin: plan.date_fin ?? '',
      budget_alloue: plan.budget_alloue,
      statut: plan.statut,
    });
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.code || !formData.libelle || !formData.direction_id) {
      toast.error('Code, libelle et direction sont requis');
      return;
    }
    if (!exerciceId) {
      toast.error('Aucun exercice selectionne');
      return;
    }

    try {
      if (editingPlan) {
        await updatePlan({
          id: editingPlan,
          code: formData.code,
          libelle: formData.libelle,
          description: formData.description || null,
          direction_id: formData.direction_id,
          date_debut: formData.date_debut || null,
          date_fin: formData.date_fin || null,
          budget_alloue: formData.budget_alloue,
          statut: formData.statut,
        });
      } else {
        await createPlan({
          code: formData.code,
          libelle: formData.libelle,
          description: formData.description || null,
          exercice_id: exerciceId,
          direction_id: formData.direction_id,
          date_debut: formData.date_debut || null,
          date_fin: formData.date_fin || null,
          budget_alloue: formData.budget_alloue,
          statut: formData.statut,
        });
      }
      setFormOpen(false);
    } catch {
      // Error is handled by mutation
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce plan de travail ?')) return;
    try {
      await deletePlan(id);
    } catch {
      // Error is handled by mutation
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderKanban className="h-6 w-6" />
            Plans de Travail
          </h1>
          <p className="text-muted-foreground">{plans.length} plan(s) de travail</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Plan
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par code ou libelle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statutFilter} onValueChange={setStatutFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="brouillon">Brouillon</SelectItem>
            <SelectItem value="valide">Valide</SelectItem>
            <SelectItem value="en_cours">En cours</SelectItem>
            <SelectItem value="cloture">Cloture</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filteredPlans.length === 0 ? (
        <EmptyStateNoData message="Aucun plan de travail trouve" />
      ) : (
        <Card>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Libelle</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Budget alloue</TableHead>
                  <TableHead className="text-right">Consomme</TableHead>
                  <TableHead>% Budget</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans.map((plan) => {
                  const pctBudget =
                    plan.budget_alloue > 0
                      ? Math.round((plan.budget_consomme / plan.budget_alloue) * 100)
                      : 0;

                  return (
                    <TableRow key={plan.id}>
                      <TableCell className="font-mono text-sm">{plan.code}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{plan.libelle}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {plan.direction?.code ?? plan.direction_id.slice(0, 8)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUT_COLORS[plan.statut] ?? 'outline'}>
                          {plan.statut}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(plan.budget_alloue)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(plan.budget_consomme)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={pctBudget} className="w-16" />
                          <span className="text-sm">{pctBudget}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {plan.responsable
                          ? `${plan.responsable.prenom} ${plan.responsable.nom}`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {plan.date_debut ?? '-'} / {plan.date_fin ?? '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/planification/projets/${plan.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(plan)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(plan.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? 'Modifier le plan' : 'Nouveau plan de travail'}
            </DialogTitle>
            <DialogDescription>Remplissez les informations du plan de travail.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
                  placeholder="PT-2026-001"
                />
              </div>
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select
                  value={formData.statut}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, statut: val as PlanTravailStatut }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brouillon">Brouillon</SelectItem>
                    <SelectItem value="valide">Valide</SelectItem>
                    <SelectItem value="en_cours">En cours</SelectItem>
                    <SelectItem value="cloture">Cloture</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Libelle *</Label>
              <Input
                value={formData.libelle}
                onChange={(e) => setFormData((prev) => ({ ...prev, libelle: e.target.value }))}
                placeholder="Plan de travail de la direction..."
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Direction ID *</Label>
              <Input
                value={formData.direction_id}
                onChange={(e) => setFormData((prev) => ({ ...prev, direction_id: e.target.value }))}
                placeholder="UUID de la direction"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date debut</Label>
                <Input
                  type="date"
                  value={formData.date_debut}
                  onChange={(e) => setFormData((prev) => ({ ...prev, date_debut: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Date fin</Label>
                <Input
                  type="date"
                  value={formData.date_fin}
                  onChange={(e) => setFormData((prev) => ({ ...prev, date_fin: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Budget alloue (FCFA)</Label>
              <Input
                type="number"
                value={formData.budget_alloue}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, budget_alloue: Number(e.target.value) }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={isCreating}>
              {isCreating ? 'Enregistrement...' : editingPlan ? 'Modifier' : 'Creer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
