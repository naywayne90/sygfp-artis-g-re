/**
 * Suivi Prestataires — Vue de suivi financier des prestataires
 *
 * Tableau de bord consolidé par fournisseur :
 * - KPIs globaux (nombre prestataires, montants engagés/liquidés/payés)
 * - Tableau synthétique par prestataire (engagements, liquidations, contrats)
 * - Détail expandable avec historique des opérations
 * - Alertes documents expirés / statut fiscal
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  TrendingUp,
  CreditCard,
  FileCheck,
  AlertTriangle,
  Search,
  Building,
  FileText,
  Receipt,
  Banknote,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { formatCurrency } from '@/lib/utils';
import { useExercice } from '@/contexts/ExerciceContext';
import { usePrestataires, type Prestataire } from '@/hooks/usePrestataires';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupplierExpiredDocuments } from '@/hooks/useSupplierDocuments';

// ============================================================================
// TYPES
// ============================================================================

interface EngagementAgg {
  id: string;
  numero: string;
  objet: string;
  montant: number;
  date_engagement: string;
  statut: string | null;
  fournisseur: string | null;
}

interface LiquidationAgg {
  id: string;
  numero: string;
  montant: number;
  net_a_payer: number | null;
  date_liquidation: string | null;
  statut: string | null;
  engagement_id: string;
}

interface ContratAgg {
  id: string;
  numero: string;
  objet: string;
  montant_initial: number;
  montant_actuel: number | null;
  date_signature: string | null;
  date_fin: string | null;
  statut: string;
  prestataire_id: string;
}

interface PrestataireSuivi {
  prestataire: Prestataire;
  engagements: EngagementAgg[];
  liquidations: LiquidationAgg[];
  contrats: ContratAgg[];
  totalEngage: number;
  totalLiquide: number;
  totalNetAPayer: number;
  totalContrats: number;
  nbEngagements: number;
  nbLiquidations: number;
  nbContrats: number;
  tauxLiquidation: number;
}

// ============================================================================
// HOOK — Agrégation financière par prestataire
// ============================================================================

function useSuiviPrestatairesData() {
  const { prestataires, isLoading: isLoadingP } = usePrestataires();
  const { exercice } = useExercice();

  // Fetch engagements de l'exercice
  const { data: engagements = [], isLoading: isLoadingE } = useQuery({
    queryKey: ['suivi-prestataires-engagements', exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_engagements')
        .select('id, numero, objet, montant, date_engagement, statut, fournisseur')
        .eq('exercice', exercice)
        .order('date_engagement', { ascending: false });
      if (error) throw error;
      return (data || []) as EngagementAgg[];
    },
  });

  // Fetch liquidations de l'exercice
  const { data: liquidations = [], isLoading: isLoadingL } = useQuery({
    queryKey: ['suivi-prestataires-liquidations', exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_liquidations')
        .select('id, numero, montant, net_a_payer, date_liquidation, statut, engagement_id')
        .eq('exercice', exercice)
        .order('date_liquidation', { ascending: false });
      if (error) throw error;
      return (data || []) as LiquidationAgg[];
    },
  });

  // Fetch contrats de l'exercice
  const { data: contrats = [], isLoading: isLoadingC } = useQuery({
    queryKey: ['suivi-prestataires-contrats', exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contrats')
        .select(
          'id, numero, objet, montant_initial, montant_actuel, date_signature, date_fin, statut, prestataire_id'
        )
        .eq('exercice', exercice)
        .order('date_signature', { ascending: false });
      if (error) throw error;
      return (data || []) as ContratAgg[];
    },
  });

  // Index engagement_id -> fournisseur pour rattacher les liquidations
  const engagementById = useMemo(() => {
    const map = new Map<string, EngagementAgg>();
    engagements.forEach((e) => map.set(e.id, e));
    return map;
  }, [engagements]);

  // Construire les données de suivi par prestataire
  const suiviData = useMemo(() => {
    const result: PrestataireSuivi[] = [];

    for (const p of prestataires) {
      // Engagements rattachés par raison_sociale
      const pEngagements = engagements.filter(
        (e) => e.fournisseur === p.raison_sociale || e.fournisseur === p.code
      );

      // IDs d'engagement liés à ce prestataire
      const engIds = new Set(pEngagements.map((e) => e.id));

      // Liquidations rattachées via engagement_id
      const pLiquidations = liquidations.filter((l) => engIds.has(l.engagement_id));

      // Contrats rattachés par prestataire_id
      const pContrats = contrats.filter((c) => c.prestataire_id === p.id);

      const totalEngage = pEngagements.reduce((s, e) => s + (e.montant || 0), 0);
      const totalLiquide = pLiquidations.reduce((s, l) => s + (l.montant || 0), 0);
      const totalNetAPayer = pLiquidations.reduce(
        (s, l) => s + (l.net_a_payer || l.montant || 0),
        0
      );
      const totalContrats = pContrats.reduce(
        (s, c) => s + (c.montant_actuel || c.montant_initial || 0),
        0
      );

      // Ne garder que les prestataires ayant au moins 1 opération
      if (pEngagements.length > 0 || pContrats.length > 0) {
        result.push({
          prestataire: p,
          engagements: pEngagements,
          liquidations: pLiquidations,
          contrats: pContrats,
          totalEngage,
          totalLiquide,
          totalNetAPayer,
          totalContrats,
          nbEngagements: pEngagements.length,
          nbLiquidations: pLiquidations.length,
          nbContrats: pContrats.length,
          tauxLiquidation: totalEngage > 0 ? Math.round((totalLiquide / totalEngage) * 100) : 0,
        });
      }
    }

    // Trier par montant engagé décroissant
    result.sort((a, b) => b.totalEngage - a.totalEngage);
    return result;
  }, [prestataires, engagements, liquidations, contrats]);

  // KPIs globaux
  const kpis = useMemo(() => {
    const totalEngage = suiviData.reduce((s, d) => s + d.totalEngage, 0);
    const totalLiquide = suiviData.reduce((s, d) => s + d.totalLiquide, 0);
    const totalNetAPayer = suiviData.reduce((s, d) => s + d.totalNetAPayer, 0);
    const totalContrats = suiviData.reduce((s, d) => s + d.totalContrats, 0);
    return {
      nbPrestataires: suiviData.length,
      nbPrestatairesTotal: prestataires.length,
      totalEngage,
      totalLiquide,
      totalNetAPayer,
      totalContrats,
      tauxLiquidationGlobal: totalEngage > 0 ? Math.round((totalLiquide / totalEngage) * 100) : 0,
    };
  }, [suiviData, prestataires]);

  return {
    suiviData,
    kpis,
    isLoading: isLoadingP || isLoadingE || isLoadingL || isLoadingC,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function statutBadge(statut: string | null) {
  if (!statut) return <Badge variant="outline">-</Badge>;
  const s = statut.toLowerCase();
  if (s === 'valide' || s === 'validé' || s === 'signe' || s === 'signé' || s === 'en_cours')
    return <Badge className="bg-green-100 text-green-800">{statut}</Badge>;
  if (s === 'soumis' || s === 'en_negociation')
    return <Badge className="bg-blue-100 text-blue-800">{statut}</Badge>;
  if (s === 'brouillon' || s === 'termine' || s === 'terminé')
    return <Badge variant="outline">{statut}</Badge>;
  if (s === 'rejete' || s === 'rejeté' || s === 'resilie' || s === 'résilié' || s === 'suspendu')
    return <Badge className="bg-red-100 text-red-800">{statut}</Badge>;
  return <Badge variant="secondary">{statut}</Badge>;
}

function prestataireBadge(statut: string | null) {
  switch (statut) {
    case 'ACTIF':
      return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
    case 'SUSPENDU':
      return <Badge className="bg-red-100 text-red-800">Suspendu</Badge>;
    case 'EN_QUALIFICATION':
      return <Badge className="bg-yellow-100 text-yellow-800">En qualification</Badge>;
    case 'INACTIF':
      return <Badge variant="outline">Inactif</Badge>;
    default:
      return <Badge variant="secondary">{statut || '-'}</Badge>;
  }
}

// ============================================================================
// DETAIL SHEET
// ============================================================================

function PrestaireDetailSheet({
  data,
  open,
  onClose,
}: {
  data: PrestataireSuivi | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!data) return null;
  const {
    prestataire: p,
    engagements,
    liquidations,
    contrats,
    totalEngage,
    totalLiquide,
    totalNetAPayer,
    tauxLiquidation,
  } = data;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            {p.raison_sociale}
          </SheetTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {p.code} — {prestataireBadge(p.statut)}
            {p.secteur_activite && <span className="text-xs">• {p.secteur_activite}</span>}
          </div>
        </SheetHeader>

        {/* Résumé financier */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Montant engagé</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(totalEngage)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Montant liquidé</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(totalLiquide)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Net à payer</p>
              <p className="text-lg font-bold">{formatCurrency(totalNetAPayer)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Taux liquidation</p>
              <p className="text-lg font-bold">{tauxLiquidation}%</p>
              <Progress value={tauxLiquidation} className="mt-1 h-1.5" />
            </CardContent>
          </Card>
        </div>

        {/* Tabs détaillées */}
        <Tabs defaultValue="engagements" className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="engagements" className="flex-1">
              Engagements ({engagements.length})
            </TabsTrigger>
            <TabsTrigger value="liquidations" className="flex-1">
              Liquidations ({liquidations.length})
            </TabsTrigger>
            <TabsTrigger value="contrats" className="flex-1">
              Contrats ({contrats.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="engagements">
            {engagements.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucun engagement</p>
            ) : (
              <div className="rounded-md border max-h-[50vh] overflow-y-auto">
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
                    {engagements.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-mono text-xs">{e.numero}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs">{e.objet}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(e.montant)}
                        </TableCell>
                        <TableCell>{statutBadge(e.statut)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="liquidations">
            {liquidations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucune liquidation</p>
            ) : (
              <div className="rounded-md border max-h-[50vh] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N°</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="text-right">Net à payer</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {liquidations.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="font-mono text-xs">{l.numero}</TableCell>
                        <TableCell className="text-right">{formatCurrency(l.montant)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(l.net_a_payer || l.montant)}
                        </TableCell>
                        <TableCell>{statutBadge(l.statut)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="contrats">
            {contrats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucun contrat</p>
            ) : (
              <div className="rounded-md border max-h-[50vh] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N°</TableHead>
                      <TableHead>Objet</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Échéance</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contrats.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-xs">{c.numero}</TableCell>
                        <TableCell className="max-w-[180px] truncate text-xs">{c.objet}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(c.montant_actuel || c.montant_initial)}
                        </TableCell>
                        <TableCell className="text-xs">{c.date_fin || '-'}</TableCell>
                        <TableCell>{statutBadge(c.statut)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Infos prestataire */}
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Informations prestataire</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1">
            {p.adresse && (
              <p>
                <span className="text-muted-foreground">Adresse :</span> {p.adresse}
                {p.ville ? `, ${p.ville}` : ''}
              </p>
            )}
            {p.telephone && (
              <p>
                <span className="text-muted-foreground">Tél :</span> {p.telephone}
              </p>
            )}
            {p.email && (
              <p>
                <span className="text-muted-foreground">Email :</span> {p.email}
              </p>
            )}
            {p.ninea && (
              <p>
                <span className="text-muted-foreground">NINEA :</span> {p.ninea}
              </p>
            )}
            {p.rccm && (
              <p>
                <span className="text-muted-foreground">RCCM :</span> {p.rccm}
              </p>
            )}
            {p.statut_fiscal && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Statut fiscal :</span>{' '}
                <Badge
                  variant={p.statut_fiscal === 'A_JOUR' ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {p.statut_fiscal}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </SheetContent>
    </Sheet>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function SuiviPrestataires() {
  const { exercice } = useExercice();
  const { suiviData, kpis, isLoading } = useSuiviPrestatairesData();
  const { documents: expiredDocs, stats: expiredStats } = useSupplierExpiredDocuments();

  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('tous');
  const [selectedPrestataire, setSelectedPrestataire] = useState<PrestataireSuivi | null>(null);

  // Filtrage
  const filteredData = useMemo(() => {
    let result = suiviData;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.prestataire.raison_sociale.toLowerCase().includes(q) ||
          d.prestataire.code.toLowerCase().includes(q) ||
          (d.prestataire.secteur_activite || '').toLowerCase().includes(q)
      );
    }

    if (filterStatut !== 'tous') {
      result = result.filter((d) => d.prestataire.statut === filterStatut);
    }

    return result;
  }, [suiviData, search, filterStatut]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Suivi Prestataires"
          description="Vue financière consolidée par fournisseur"
        />
        <div className="flex items-center justify-center h-40 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Chargement des données...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suivi Prestataires"
        description={`Vue financière consolidée — Exercice ${exercice}`}
      />

      {/* ═══════ ALERTE DOCUMENTS EXPIRÉS ═══════ */}
      {(expiredStats.expired > 0 || expiredStats.toRenew > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-medium text-orange-800">Documents à vérifier : </span>
              {expiredStats.expired > 0 && (
                <span className="text-red-700 font-semibold">{expiredStats.expired} expiré(s)</span>
              )}
              {expiredStats.expired > 0 && expiredStats.toRenew > 0 && ' — '}
              {expiredStats.toRenew > 0 && (
                <span className="text-orange-700">{expiredStats.toRenew} à renouveler</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════ KPIs ═══════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-sm">Prestataires actifs</span>
            </div>
            <p className="text-2xl font-bold">{kpis.nbPrestataires}</p>
            <p className="text-xs text-muted-foreground">sur {kpis.nbPrestatairesTotal} au total</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Total engagé</span>
            </div>
            <p className="text-2xl font-bold text-primary">{formatCurrency(kpis.totalEngage)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CreditCard className="h-4 w-4" />
              <span className="text-sm">Total liquidé</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(kpis.totalLiquide)}</p>
            <p className="text-xs text-muted-foreground">Taux : {kpis.tauxLiquidationGlobal}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Banknote className="h-4 w-4" />
              <span className="text-sm">Net à payer</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(kpis.totalNetAPayer)}</p>
          </CardContent>
        </Card>
      </div>

      {/* ═══════ FILTRES ═══════ */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un prestataire..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatut} onValueChange={setFilterStatut}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les statuts</SelectItem>
            <SelectItem value="ACTIF">Actif</SelectItem>
            <SelectItem value="SUSPENDU">Suspendu</SelectItem>
            <SelectItem value="EN_QUALIFICATION">En qualification</SelectItem>
            <SelectItem value="INACTIF">Inactif</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground ml-auto">
          {filteredData.length} prestataire(s)
        </p>
      </div>

      {/* ═══════ TABLEAU PRINCIPAL ═══════ */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Synthèse financière par prestataire
          </CardTitle>
          <CardDescription>
            Cliquez sur un prestataire pour voir le détail des opérations
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border-t max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prestataire</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-center">Eng.</TableHead>
                  <TableHead className="text-center">Liq.</TableHead>
                  <TableHead className="text-center">Contrats</TableHead>
                  <TableHead className="text-right">Montant engagé</TableHead>
                  <TableHead className="text-right">Montant liquidé</TableHead>
                  <TableHead className="text-center">Taux</TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Aucun prestataire avec des opérations pour cet exercice
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((d) => (
                    <TableRow
                      key={d.prestataire.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedPrestataire(d)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{d.prestataire.raison_sociale}</p>
                          <p className="text-xs text-muted-foreground">{d.prestataire.code}</p>
                        </div>
                      </TableCell>
                      <TableCell>{prestataireBadge(d.prestataire.statut)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{d.nbEngagements}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{d.nbLiquidations}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{d.nbContrats}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(d.totalEngage)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(d.totalLiquide)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center gap-1.5">
                          <Progress value={d.tauxLiquidation} className="h-1.5 w-12" />
                          <span className="text-xs font-medium">{d.tauxLiquidation}%</span>
                        </div>
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

      {/* ═══════ DETAIL SHEET ═══════ */}
      <PrestaireDetailSheet
        data={selectedPrestataire}
        open={!!selectedPrestataire}
        onClose={() => setSelectedPrestataire(null)}
      />
    </div>
  );
}
