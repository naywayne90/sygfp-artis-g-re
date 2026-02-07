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
import { usePlansTravail } from '@/hooks/usePlansTravail';
import { useProjetTaches } from '@/hooks/useProjetTaches';
import { useExercice } from '@/contexts/ExerciceContext';
import { TacheForm } from '@/components/roadmap/TacheForm';
import { EmptyStateNoData } from '@/components/shared/EmptyState';
import { ArrowLeft, Plus, Trash2, ListChecks, Wallet, Users } from 'lucide-react';
import type { TacheInput } from '@/types/roadmap';

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

export default function ProjetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { exercice } = useExercice();
  const { plans, isLoading: plansLoading } = usePlansTravail();
  const {
    taches,
    stats,
    isLoading: tachesLoading,
    createTache,
    deleteTache,
    isCreating,
  } = useProjetTaches();
  const [tacheFormOpen, setTacheFormOpen] = useState(false);

  const plan = plans.find((p) => p.id === id);

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

  const handleCreateTache = async (data: TacheInput) => {
    await createTache(data);
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
            <span>Direction: {plan.direction?.nom ?? '-'}</span>
            <span>
              Responsable:{' '}
              {plan.responsable ? `${plan.responsable.prenom} ${plan.responsable.nom}` : '-'}
            </span>
            <span>
              {plan.date_debut ?? '?'} - {plan.date_fin ?? '?'}
            </span>
          </div>
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
                            <Progress value={tache.avancement} className="w-16" />
                            <span className="text-sm">{tache.avancement}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {tache.date_debut ?? '-'} / {tache.date_fin ?? '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {tache.responsable
                            ? `${tache.responsable.prenom} ${tache.responsable.nom}`
                            : (tache.raci_responsable ?? '-')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTache(tache.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
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
      </Tabs>

      {/* Tache Form Dialog */}
      <TacheForm
        open={tacheFormOpen}
        onOpenChange={setTacheFormOpen}
        onSubmit={handleCreateTache}
        exercice={exercice ?? new Date().getFullYear()}
        isLoading={isCreating}
      />
    </div>
  );
}
