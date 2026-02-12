import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BudgetLineWithRelations } from '@/hooks/useBudgetLines';
import { useBudgetLineELOP } from '@/hooks/useBudgetLineELOP';
import { useBudgetLineAudit } from '@/hooks/useBudgetLineAudit';
import { Loader2 } from 'lucide-react';

interface BudgetLineDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgetLine: BudgetLineWithRelations | null;
  defaultTab?: string;
}

const formatMontant = (amount: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusBadge = (status: string | null) => {
  switch (status) {
    case 'brouillon':
      return <Badge variant="secondary">Brouillon</Badge>;
    case 'soumis':
      return (
        <Badge variant="default" className="bg-blue-500">
          Soumis
        </Badge>
      );
    case 'valide':
      return (
        <Badge variant="default" className="bg-green-500">
          Validé
        </Badge>
      );
    case 'rejete':
      return <Badge variant="destructive">Rejeté</Badge>;
    default:
      return <Badge variant="secondary">Brouillon</Badge>;
  }
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-dashed last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%]">{value || '-'}</span>
    </div>
  );
}

function MontantCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="pt-3 pb-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-lg font-bold ${color}`}>{formatMontant(value)}</p>
      </CardContent>
    </Card>
  );
}

// --- Onglet Informations ---
function TabInformations({ line }: { line: BudgetLineWithRelations }) {
  const engage = line.calc_total_engage ?? line.total_engage ?? 0;
  const liquide = line.calc_total_liquide ?? line.total_liquide ?? 0;
  const ordonnance = line.calc_total_ordonnance ?? line.total_ordonnance ?? 0;
  const paye = line.calc_total_paye ?? line.total_paye ?? 0;
  const dotationActuelle =
    line.calc_dotation_actuelle ?? line.dotation_modifiee ?? line.dotation_initiale;
  const disponible = line.calc_disponible ?? line.disponible_calcule ?? dotationActuelle - engage;

  return (
    <ScrollArea className="h-[calc(100vh-180px)]">
      <div className="space-y-4 pr-4">
        {/* Identification */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Identification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow label="Code" value={<span className="font-mono">{line.code}</span>} />
            {line.code_budgetaire_v2 && (
              <InfoRow
                label="Code V2"
                value={<span className="font-mono">{line.code_budgetaire_v2}</span>}
              />
            )}
            <InfoRow label="Libellé" value={line.label} />
            <InfoRow label="Niveau" value={line.level} />
            <InfoRow label="Exercice" value={line.exercice} />
            <InfoRow label="Source" value={line.source_financement} />
            <InfoRow label="Statut" value={getStatusBadge(line.statut)} />
          </CardContent>
        </Card>

        {/* Structure */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Structure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow
              label="Direction"
              value={line.direction ? `${line.direction.code} - ${line.direction.label}` : null}
            />
            <InfoRow
              label="Obj. Stratégique"
              value={
                line.objectif_strategique
                  ? `${line.objectif_strategique.code} - ${line.objectif_strategique.libelle}`
                  : null
              }
            />
            <InfoRow
              label="Mission"
              value={line.mission ? `${line.mission.code} - ${line.mission.libelle}` : null}
            />
            <InfoRow
              label="Action"
              value={line.action ? `${line.action.code} - ${line.action.libelle}` : null}
            />
            <InfoRow
              label="Activité"
              value={line.activite ? `${line.activite.code} - ${line.activite.libelle}` : null}
            />
            <InfoRow
              label="Sous-activité"
              value={
                line.sous_activite
                  ? `${line.sous_activite.code} - ${line.sous_activite.libelle}`
                  : null
              }
            />
          </CardContent>
        </Card>

        {/* Nomenclatures */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Nomenclatures</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow
              label="NBE"
              value={
                line.nomenclature_nbe
                  ? `${line.nomenclature_nbe.code} - ${line.nomenclature_nbe.libelle}`
                  : null
              }
            />
            <InfoRow
              label="SYSCO"
              value={
                line.plan_comptable_sysco
                  ? `${line.plan_comptable_sysco.code} - ${line.plan_comptable_sysco.libelle}`
                  : null
              }
            />
            <InfoRow
              label="NVE"
              value={line.ref_nve ? `${line.ref_nve.code_nve} - ${line.ref_nve.libelle}` : null}
            />
          </CardContent>
        </Card>

        {/* Montants */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Montants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <MontantCard
                label="Dotation initiale"
                value={line.dotation_initiale}
                color="text-foreground"
              />
              <MontantCard
                label="Dotation actuelle"
                value={dotationActuelle}
                color="text-primary"
              />
              <MontantCard label="Engagé" value={engage} color="text-orange-600" />
              <MontantCard label="Liquidé" value={liquide} color="text-blue-600" />
              <MontantCard label="Ordonnancé" value={ordonnance} color="text-indigo-600" />
              <MontantCard label="Payé" value={paye} color="text-green-600" />
            </div>
            <div className="mt-3 p-3 rounded-lg border bg-muted/30">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Disponible</span>
                <span
                  className={`text-lg font-bold ${disponible < 0 ? 'text-red-600' : 'text-emerald-600'}`}
                >
                  {formatMontant(disponible)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow label="Création" value={formatDate(line.created_at)} />
            <InfoRow label="Mise à jour" value={formatDate(line.updated_at)} />
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}

// --- Onglet Consommation ---
function TabConsommation({
  budgetLineId,
  line,
}: {
  budgetLineId: string;
  line: BudgetLineWithRelations;
}) {
  const { engagements, liquidations, ordonnancements, reglements, totals, isLoading } =
    useBudgetLineELOP(budgetLineId);

  const dotationActuelle =
    line.calc_dotation_actuelle ?? line.dotation_modifiee ?? line.dotation_initiale;
  const tauxConsommation =
    dotationActuelle > 0
      ? Math.min(100, Math.round((totals.totalPaye / dotationActuelle) * 100))
      : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span className="text-muted-foreground">Chargement...</span>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-180px)]">
      <div className="space-y-4 pr-4">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-2">
          <MontantCard label="Engagé" value={totals.totalEngage} color="text-orange-600" />
          <MontantCard label="Liquidé" value={totals.totalLiquide} color="text-blue-600" />
          <MontantCard label="Ordonnancé" value={totals.totalOrdonnance} color="text-indigo-600" />
          <MontantCard label="Payé" value={totals.totalPaye} color="text-green-600" />
        </div>

        {/* Taux de consommation */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-muted-foreground">Taux de consommation</span>
              <span className="text-sm font-bold">{tauxConsommation}%</span>
            </div>
            <Progress value={tauxConsommation} className="h-2" />
          </CardContent>
        </Card>

        {/* Tables ELOP */}
        <ELOPTable title="Engagements" records={engagements} />
        <ELOPTable title="Liquidations" records={liquidations} />
        <ELOPTable title="Ordonnancements" records={ordonnancements} />
        <ELOPTable title="Règlements" records={reglements} />
      </div>
    </ScrollArea>
  );
}

function ELOPTable({
  title,
  records,
}: {
  title: string;
  records: {
    id: string;
    numero: string | null;
    objet: string | null;
    reference: string | null;
    montant: number;
    statut: string | null;
    date: string | null;
  }[];
}) {
  if (records.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{title} (0)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-2">Aucun enregistrement</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">
          {title} ({records.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Numéro</TableHead>
              <TableHead className="text-xs">Objet/Réf</TableHead>
              <TableHead className="text-xs text-right">Montant</TableHead>
              <TableHead className="text-xs">Statut</TableHead>
              <TableHead className="text-xs">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs font-mono">{r.numero || '-'}</TableCell>
                <TableCell className="text-xs">{r.objet || r.reference || '-'}</TableCell>
                <TableCell className="text-xs text-right font-mono">
                  {formatMontant(r.montant)}
                </TableCell>
                <TableCell className="text-xs">
                  {r.statut ? (
                    <Badge variant="outline" className="text-[10px]">
                      {r.statut}
                    </Badge>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className="text-xs">
                  {r.date ? new Date(r.date).toLocaleDateString('fr-FR') : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// --- Onglet Historique ---
function TabHistorique({ budgetLineId }: { budgetLineId: string }) {
  const { entries, isLoading } = useBudgetLineAudit(budgetLineId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span className="text-muted-foreground">Chargement...</span>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">Aucun historique disponible</div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-180px)]">
      <div className="pr-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Date</TableHead>
              <TableHead className="text-xs">Utilisateur</TableHead>
              <TableHead className="text-xs">Action</TableHead>
              <TableHead className="text-xs">Champ</TableHead>
              <TableHead className="text-xs">Avant</TableHead>
              <TableHead className="text-xs">Après</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="text-xs whitespace-nowrap">
                  {formatDate(entry.date)}
                </TableCell>
                <TableCell className="text-xs">{entry.user}</TableCell>
                <TableCell className="text-xs">
                  <Badge variant="outline" className="text-[10px]">
                    {entry.action}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs font-mono">{entry.field || '-'}</TableCell>
                <TableCell
                  className="text-xs max-w-[100px] truncate"
                  title={entry.oldValue || undefined}
                >
                  {entry.oldValue || '-'}
                </TableCell>
                <TableCell
                  className="text-xs max-w-[100px] truncate"
                  title={entry.newValue || undefined}
                >
                  {entry.newValue || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </ScrollArea>
  );
}

// --- Main Component ---
export function BudgetLineDetailSheet({
  open,
  onOpenChange,
  budgetLine,
  defaultTab = 'informations',
}: BudgetLineDetailSheetProps) {
  if (!budgetLine) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[550px] md:w-[650px] overflow-y-auto p-0">
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle className="text-base">
            <span className="font-mono">{budgetLine.code}</span>
            <span className="text-muted-foreground font-normal ml-2">{budgetLine.label}</span>
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue={defaultTab} className="px-6 pb-6">
          <TabsList className="w-full">
            <TabsTrigger value="informations" className="flex-1">
              Informations
            </TabsTrigger>
            <TabsTrigger value="consommation" className="flex-1">
              Consommation
            </TabsTrigger>
            <TabsTrigger value="historique" className="flex-1">
              Historique
            </TabsTrigger>
          </TabsList>

          <TabsContent value="informations" className="mt-4">
            <TabInformations line={budgetLine} />
          </TabsContent>

          <TabsContent value="consommation" className="mt-4">
            <TabConsommation budgetLineId={budgetLine.id} line={budgetLine} />
          </TabsContent>

          <TabsContent value="historique" className="mt-4">
            <TabHistorique budgetLineId={budgetLine.id} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
