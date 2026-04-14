import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
import {
  FolderKanban,
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Download,
  TrendingUp,
  PlayCircle,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import type { PlanTravailStatut } from '@/types/roadmap';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';

const STATUT_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  soumis: 'secondary',
  valide: 'default',
  en_cours: 'default',
  cloture: 'outline',
};

const PRIORITE_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  basse: 'outline',
  normale: 'secondary',
  haute: 'default',
  urgente: 'destructive',
};

export default function ProjetsList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const directionFilter = searchParams.get('direction') || undefined;

  const { exerciceId, exercice } = useExercice();
  const { plans, isLoading, createPlan, updatePlan, deletePlan, isCreating } =
    usePlansTravail(directionFilter);

  const { data: directions = [] } = useQuery({
    queryKey: ['directions-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('directions')
        .select('id, code, label, sigle')
        .eq('est_active', true)
        .order('code');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseUntyped = supabase as any;

  const { data: objectifs = [] } = useQuery({
    queryKey: ['objectifs-strategiques-active'],
    queryFn: async () => {
      const { data, error } = await supabaseUntyped
        .from('objectifs_strategiques')
        .select('id, code, libelle')
        .eq('est_actif', true)
        .order('code');
      if (error) throw error;
      return (data ?? []) as { id: string; code: string; libelle: string }[];
    },
    staleTime: 30_000,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['profiles-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, first_name, last_name')
        .eq('is_active', true)
        .order('full_name');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });

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
    os_id: '',
    responsable_id: '',
    priorite: 'normale' as 'basse' | 'normale' | 'haute' | 'urgente',
    date_debut: '',
    date_fin: '',
    budget_alloue: 0,
    statut: 'soumis' as PlanTravailStatut,
  });

  const stats = useMemo(
    () => ({
      total: plans.length,
      enCours: plans.filter((p) => p.statut === 'en_cours').length,
      budgetTotal: plans.reduce((s, p) => s + (p.budget_alloue || 0), 0),
      budgetConsomme: plans.reduce((s, p) => s + (p.budget_consomme || 0), 0),
    }),
    [plans]
  );

  const tauxExecution =
    stats.budgetTotal > 0 ? Math.round((stats.budgetConsomme / stats.budgetTotal) * 100) : 0;

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

  const handleExport = () => {
    const headers = [
      'Code',
      'Libelle',
      'Direction',
      'Statut',
      'Budget Alloue',
      'Budget Consomme',
      'Date Debut',
      'Date Fin',
    ];
    const rows = filteredPlans.map((p) => [
      p.code,
      p.libelle,
      p.direction?.code ?? p.direction_id.slice(0, 8),
      p.statut,
      String(p.budget_alloue),
      String(p.budget_consomme),
      p.date_debut ?? '',
      p.date_fin ?? '',
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plans_travail.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export CSV genere avec succes');
  };

  const handleOpenCreate = () => {
    setEditingPlan(null);
    const nextNum = String(plans.length + 1).padStart(3, '0');
    const autoCode = `PT-${exercice || 2026}-${nextNum}`;
    setFormData({
      code: autoCode,
      libelle: '',
      description: '',
      direction_id: directionFilter || '',
      os_id: '',
      responsable_id: '',
      priorite: 'normale',
      date_debut: '',
      date_fin: '',
      budget_alloue: 0,
      statut: 'soumis',
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
      os_id: plan.os_id ?? '',
      responsable_id: plan.responsable_id ?? '',
      priorite: plan.priorite ?? 'normale',
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
    if (formData.date_debut && formData.date_fin && formData.date_fin < formData.date_debut) {
      toast.error('La date de fin doit etre posterieure a la date de debut');
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
          os_id: formData.os_id || null,
          responsable_id: formData.responsable_id || null,
          priorite: formData.priorite,
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
          os_id: formData.os_id || null,
          responsable_id: formData.responsable_id || null,
          priorite: formData.priorite,
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
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Plan
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total plans</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FolderKanban className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En cours</p>
                <p className="text-2xl font-bold">{stats.enCours}</p>
              </div>
              <PlayCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Budget total</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.budgetTotal)}</p>
              </div>
              <Wallet className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux d'execution</p>
                <p className="text-2xl font-bold">{tauxExecution}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
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
            <SelectItem value="soumis">Soumis</SelectItem>
            <SelectItem value="valide">Valide</SelectItem>
            <SelectItem value="en_cours">En cours</SelectItem>
            <SelectItem value="cloture">Cloture</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filteredPlans.length === 0 ? (
        <EmptyStateNoData entityName="plan de travail" />
      ) : (
        <Card>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Libelle</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>OS</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Priorite</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Budget alloue</TableHead>
                  <TableHead className="text-right">Consomme</TableHead>
                  <TableHead>% Budget</TableHead>
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
                      <TableCell className="text-sm">
                        {plan.objectif_strategique ? plan.objectif_strategique.code : '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {plan.responsable
                          ? plan.responsable.full_name ||
                            `${plan.responsable.first_name ?? ''} ${plan.responsable.last_name ?? ''}`.trim() ||
                            '-'
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={PRIORITE_COLORS[plan.priorite] ?? 'outline'}>
                          {plan.priorite ?? 'normale'}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? 'Modifier le plan' : 'Nouveau plan de travail'}
            </DialogTitle>
            <DialogDescription>
              Remplissez les informations du plan de travail.
              {exercice && (
                <Badge variant="outline" className="ml-2">
                  Exercice {exercice}
                </Badge>
              )}
            </DialogDescription>
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
                    <SelectItem value="soumis">Soumis</SelectItem>
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
              <Label>Direction *</Label>
              <Select
                value={formData.direction_id}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, direction_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner une direction" />
                </SelectTrigger>
                <SelectContent>
                  {directions.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.sigle || d.code} — {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Objectif Strategique</Label>
              <Select
                value={formData.os_id}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, os_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner un objectif strategique" />
                </SelectTrigger>
                <SelectContent>
                  {objectifs.map((os) => (
                    <SelectItem key={os.id} value={os.id}>
                      {os.code} — {os.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Responsable</Label>
                <Select
                  value={formData.responsable_id}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, responsable_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionner un responsable" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.full_name ||
                          `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() ||
                          u.id.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priorite</Label>
                <Select
                  value={formData.priorite}
                  onValueChange={(v) =>
                    setFormData((prev) => ({
                      ...prev,
                      priorite: v as 'basse' | 'normale' | 'haute' | 'urgente',
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basse">Basse</SelectItem>
                    <SelectItem value="normale">Normale</SelectItem>
                    <SelectItem value="haute">Haute</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
