/**
 * Rapprochement Marché / Contrat
 *
 * Vue de rapprochement entre les marchés et les contrats :
 * - KPIs : total marchés, contrats, rapprochés, écarts, sans correspondance
 * - Tabs : Tous | Rapprochés | Marchés sans contrat | Contrats sans marché | Écarts
 * - Tableau comparatif avec montants, écarts, prestataires
 * - Détail Sheet avec engagements liés
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileSignature,
  FileText,
  Link2,
  Link2Off,
  AlertTriangle,
  Search,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Loader2,
  Scale,
  Receipt,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { formatCurrency } from '@/lib/utils';
import { useExercice } from '@/contexts/ExerciceContext';
import {
  useRapprochementMarcheContrat,
  type LigneRapprochement,
  type StatutRapprochement,
} from '@/hooks/useRapprochementMarcheContrat';

// ============================================================================
// HELPERS
// ============================================================================

function statutBadge(statut: StatutRapprochement) {
  switch (statut) {
    case 'rapproche':
      return <Badge className="bg-green-100 text-green-800">Rapproché</Badge>;
    case 'marche_sans_contrat':
      return <Badge className="bg-orange-100 text-orange-800">Marché sans contrat</Badge>;
    case 'contrat_sans_marche':
      return <Badge className="bg-blue-100 text-blue-800">Contrat sans marché</Badge>;
    case 'ecart':
      return <Badge className="bg-red-100 text-red-800">Écart</Badge>;
    default:
      return <Badge variant="outline">-</Badge>;
  }
}

function ecartIndicator(ecartPourcent: number) {
  if (ecartPourcent === 0) return <span className="text-muted-foreground">—</span>;
  const isPositive = ecartPourcent > 0;
  const color =
    Math.abs(ecartPourcent) > 5
      ? isPositive
        ? 'text-red-600'
        : 'text-green-600'
      : 'text-muted-foreground';
  const Icon = isPositive ? TrendingUp : TrendingDown;
  return (
    <span className={`flex items-center gap-1 font-medium ${color}`}>
      <Icon className="h-3.5 w-3.5" />
      {isPositive ? '+' : ''}
      {ecartPourcent}%
    </span>
  );
}

function contratStatutBadge(statut: string) {
  if (statut === '-') return <span className="text-muted-foreground">—</span>;
  switch (statut) {
    case 'en_cours':
    case 'signe':
      return (
        <Badge className="bg-green-100 text-green-800">
          {statut === 'signe' ? 'Signé' : 'En cours'}
        </Badge>
      );
    case 'en_negociation':
    case 'soumis':
      return (
        <Badge className="bg-blue-100 text-blue-800">
          {statut === 'soumis' ? 'Soumis' : 'En négociation'}
        </Badge>
      );
    case 'termine':
      return <Badge variant="outline">Terminé</Badge>;
    case 'resilie':
      return <Badge className="bg-red-100 text-red-800">Résilié</Badge>;
    default:
      return <Badge variant="secondary">{statut}</Badge>;
  }
}

function marcheStatutBadge(statut: string | null) {
  if (!statut) return <span className="text-muted-foreground">—</span>;
  switch (statut) {
    case 'valide':
      return <Badge className="bg-green-100 text-green-800">Validé</Badge>;
    case 'en_attente':
      return <Badge className="bg-blue-100 text-blue-800">En attente</Badge>;
    case 'rejete':
      return <Badge className="bg-red-100 text-red-800">Rejeté</Badge>;
    case 'differe':
      return <Badge className="bg-yellow-100 text-yellow-800">Différé</Badge>;
    default:
      return <Badge variant="secondary">{statut}</Badge>;
  }
}

// ============================================================================
// DETAIL SHEET
// ============================================================================

function RapprochementDetailSheet({
  data,
  open,
  onClose,
}: {
  data: LigneRapprochement | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!data) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Détail du rapprochement
          </SheetTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {statutBadge(data.statut)}
          </div>
        </SheetHeader>

        {/* Comparaison côte à côte */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {/* Colonne Marché */}
          <Card className={data.marche ? '' : 'opacity-50'}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-primary" />
                Marché
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1.5">
              <div>
                <span className="text-muted-foreground">Réf :</span>{' '}
                <span className="font-mono">{data.marcheRef}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Objet :</span> {data.marcheObjet}
              </div>
              <div>
                <span className="text-muted-foreground">Montant :</span>{' '}
                <span className="font-bold text-primary">{formatCurrency(data.marcheMontant)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Prestataire :</span>{' '}
                {data.marchePrestataire}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Statut :</span>{' '}
                {marcheStatutBadge(data.marcheStatut)}
              </div>
            </CardContent>
          </Card>

          {/* Colonne Contrat */}
          <Card className={data.contrat ? '' : 'opacity-50'}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <FileSignature className="h-4 w-4 text-green-600" />
                Contrat
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1.5">
              <div>
                <span className="text-muted-foreground">Réf :</span>{' '}
                <span className="font-mono">{data.contratRef}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Objet :</span> {data.contratObjet}
              </div>
              <div>
                <span className="text-muted-foreground">Montant :</span>{' '}
                <span className="font-bold text-green-600">
                  {data.contrat ? formatCurrency(data.contratMontant) : '—'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Prestataire :</span>{' '}
                {data.contratPrestataire}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Statut :</span>{' '}
                {contratStatutBadge(data.contratStatut)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Synthèse écart */}
        {(data.statut === 'rapproche' || data.statut === 'ecart') && (
          <Card className="mt-3">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Écart montant</span>
                <span
                  className={`text-sm font-bold ${Math.abs(data.ecartPourcent) > 5 ? 'text-red-600' : 'text-green-600'}`}
                >
                  {data.ecartMontant > 0 ? '+' : ''}
                  {formatCurrency(data.ecartMontant)} ({data.ecartPourcent > 0 ? '+' : ''}
                  {data.ecartPourcent}%)
                </span>
              </div>
              {Math.abs(data.ecartPourcent) > 5 && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-red-600">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Écart supérieur au seuil de 5% — vérification recommandée
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Engagements liés */}
        {data.engagements.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Receipt className="h-4 w-4" />
              Engagements liés ({data.engagements.length})
            </h4>
            <div className="rounded-md border max-h-[30vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N°</TableHead>
                    <TableHead>Objet</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.engagements.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-mono text-xs">{e.numero}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs">{e.objet}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(e.montant)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {e.statut || '-'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="text-right text-sm font-bold mt-1">
              Total engagé : {formatCurrency(data.totalEngage)}
            </div>
          </div>
        )}

        {/* Dates contrat */}
        {data.contrat && (
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Dates du contrat</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1">
              {data.contrat.date_signature && (
                <div>
                  <span className="text-muted-foreground">Signature :</span>{' '}
                  {data.contrat.date_signature}
                </div>
              )}
              {data.contrat.date_debut && (
                <div>
                  <span className="text-muted-foreground">Début :</span> {data.contrat.date_debut}
                </div>
              )}
              {data.contrat.date_fin && (
                <div>
                  <span className="text-muted-foreground">Fin :</span> {data.contrat.date_fin}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ============================================================================
// PAGE
// ============================================================================

export default function RapprochementMarcheContrat() {
  const { exercice } = useExercice();
  const { lignes, kpis, isLoading } = useRapprochementMarcheContrat();

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('tous');
  const [selected, setSelected] = useState<LigneRapprochement | null>(null);

  // Filtrage
  const filtered = useMemo(() => {
    let result = lignes;

    // Tab
    if (tab === 'rapproches') result = result.filter((l) => l.statut === 'rapproche');
    else if (tab === 'marche_sans_contrat')
      result = result.filter((l) => l.statut === 'marche_sans_contrat');
    else if (tab === 'contrat_sans_marche')
      result = result.filter((l) => l.statut === 'contrat_sans_marche');
    else if (tab === 'ecarts') result = result.filter((l) => l.statut === 'ecart');

    // Recherche
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.marcheRef.toLowerCase().includes(q) ||
          l.marcheObjet.toLowerCase().includes(q) ||
          l.contratRef.toLowerCase().includes(q) ||
          l.contratObjet.toLowerCase().includes(q) ||
          l.marchePrestataire.toLowerCase().includes(q) ||
          l.contratPrestataire.toLowerCase().includes(q)
      );
    }

    return result;
  }, [lignes, tab, search]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Rapprochement Marché / Contrat" description="Contrôle de cohérence" />
        <div className="flex items-center justify-center h-40 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Chargement des données...
        </div>
      </div>
    );
  }

  const tauxRapprochement =
    kpis.totalMarches > 0 ? Math.round((kpis.rapproches / kpis.totalMarches) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rapprochement Marché / Contrat"
        description={`Contrôle de cohérence — Exercice ${exercice}`}
      />

      {/* ═══════ KPIs ═══════ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <FileText className="h-4 w-4" />
              <span className="text-sm">Marchés</span>
            </div>
            <p className="text-2xl font-bold">{kpis.totalMarches}</p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(kpis.montantTotalMarches)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <FileSignature className="h-4 w-4" />
              <span className="text-sm">Contrats</span>
            </div>
            <p className="text-2xl font-bold">{kpis.totalContrats}</p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(kpis.montantTotalContrats)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Link2 className="h-4 w-4 text-green-600" />
              <span className="text-sm">Rapprochés</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{kpis.rapproches}</p>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={tauxRapprochement} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground">{tauxRapprochement}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Link2Off className="h-4 w-4 text-orange-600" />
              <span className="text-sm">Sans correspondance</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">
              {kpis.marchesSansContrat + kpis.contratsSansMarche}
            </p>
            <p className="text-xs text-muted-foreground">
              {kpis.marchesSansContrat} marché(s) + {kpis.contratsSansMarche} contrat(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm">Écarts (&gt;5%)</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{kpis.ecarts}</p>
            <p className="text-xs text-muted-foreground">
              Écart global : {formatCurrency(kpis.ecartGlobal)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ═══════ FILTRES + TABS ═══════ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher marché, contrat, prestataire..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <p className="text-sm text-muted-foreground">{filtered.length} ligne(s)</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="tous">Tous ({lignes.length})</TabsTrigger>
          <TabsTrigger value="rapproches">
            <CheckCircle className="h-3.5 w-3.5 mr-1" />
            Rapprochés ({kpis.rapproches})
          </TabsTrigger>
          <TabsTrigger value="marche_sans_contrat">
            <Link2Off className="h-3.5 w-3.5 mr-1" />
            Marchés seuls ({kpis.marchesSansContrat})
          </TabsTrigger>
          <TabsTrigger value="contrat_sans_marche">
            <FileSignature className="h-3.5 w-3.5 mr-1" />
            Contrats seuls ({kpis.contratsSansMarche})
          </TabsTrigger>
          <TabsTrigger value="ecarts">
            <AlertTriangle className="h-3.5 w-3.5 mr-1" />
            Écarts ({kpis.ecarts})
          </TabsTrigger>
        </TabsList>

        {/* ═══════ TABLEAU ═══════ */}
        <TabsContent value={tab} className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Scale className="h-4 w-4" />
                Rapprochement marché / contrat
              </CardTitle>
              <CardDescription>Cliquez sur une ligne pour voir le détail</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="rounded-md border-t max-h-[60vh] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Statut</TableHead>
                      <TableHead>Marché</TableHead>
                      <TableHead>Prestataire</TableHead>
                      <TableHead className="text-right">Montant marché</TableHead>
                      <TableHead>Contrat</TableHead>
                      <TableHead className="text-right">Montant contrat</TableHead>
                      <TableHead className="text-right">Écart</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Aucune donnée pour ce filtre
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((ligne) => (
                        <TableRow
                          key={ligne.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelected(ligne)}
                        >
                          <TableCell>{statutBadge(ligne.statut)}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-mono text-xs">{ligne.marcheRef}</span>
                              <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                                {ligne.marcheObjet !== '-' ? ligne.marcheObjet : ''}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs max-w-[120px] truncate">
                            {ligne.marchePrestataire !== '-'
                              ? ligne.marchePrestataire
                              : ligne.contratPrestataire}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {ligne.marcheMontant > 0 ? (
                              formatCurrency(ligne.marcheMontant)
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-mono text-xs">{ligne.contratRef}</span>
                              <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                                {ligne.contratObjet !== '-' ? ligne.contratObjet : ''}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {ligne.contratMontant > 0 ? (
                              formatCurrency(ligne.contratMontant)
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {ligne.statut === 'rapproche' || ligne.statut === 'ecart' ? (
                              ecartIndicator(ligne.ecartPourcent)
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Sheet */}
      <RapprochementDetailSheet
        data={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
