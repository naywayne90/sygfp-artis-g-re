import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  FileText,
  CreditCard,
  Receipt,
  FileCheck,
  Banknote,
  Clock,
  CheckCircle,
  Filter,
  RefreshCw,
} from "lucide-react";
import { useExercice } from "@/contexts/ExerciceContext";

interface ExecutionKPIDashboardProps {
  compact?: boolean;
}

const MOIS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

const COLORS = {
  engagement: "hsl(var(--chart-1))",
  liquidation: "hsl(var(--chart-2))",
  ordonnancement: "hsl(var(--chart-3))",
  reglement: "hsl(var(--chart-4))",
};

const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#6b7280"];

const formatMontant = (montant: number) =>
  new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";

const formatMontantCompact = (montant: number) => {
  if (montant >= 1_000_000_000) {
    return (montant / 1_000_000_000).toFixed(1) + " Mrd";
  }
  if (montant >= 1_000_000) {
    return (montant / 1_000_000).toFixed(1) + " M";
  }
  return new Intl.NumberFormat("fr-FR").format(montant);
};

interface FilterState {
  directionId: string;
  periode: "ytd" | "q1" | "q2" | "q3" | "q4" | "last3" | "last6";
}

export function ExecutionKPIDashboard({ compact = false }: ExecutionKPIDashboardProps) {
  const { exercice } = useExercice();
  const [filters, setFilters] = useState<FilterState>({
    directionId: "all",
    periode: "ytd",
  });

  // Fetch directions
  const { data: directions = [] } = useQuery({
    queryKey: ["directions-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("directions")
        .select("id, code, sigle, label")
        .order("sigle");
      return data || [];
    },
  });

  // Fetch KPIs data
  const { data: kpiData, isLoading, refetch } = useQuery({
    queryKey: ["execution-kpis", exercice, filters],
    queryFn: async () => {
      // Déterminer la période
      let dateStart: string | null = null;
      let dateEnd = new Date().toISOString();
      
      const now = new Date();
      switch (filters.periode) {
        case "q1":
          dateStart = `${exercice}-01-01`;
          dateEnd = `${exercice}-03-31`;
          break;
        case "q2":
          dateStart = `${exercice}-04-01`;
          dateEnd = `${exercice}-06-30`;
          break;
        case "q3":
          dateStart = `${exercice}-07-01`;
          dateEnd = `${exercice}-09-30`;
          break;
        case "q4":
          dateStart = `${exercice}-10-01`;
          _dateEnd = `${exercice}-12-31`;
          break;
        case "last3":
          dateStart = format(subMonths(now, 3), "yyyy-MM-dd");
          break;
        case "last6":
          dateStart = format(subMonths(now, 6), "yyyy-MM-dd");
          break;
        default: // ytd
          _dateStart = `${exercice}-01-01`;
      }

      // Fetch all data in parallel
      const [engagementsRes, liquidationsRes, ordonnancementsRes, reglementsRes, dossiersRes, budgetRes] = await Promise.all([
        supabase
          .from("budget_engagements")
          .select("id, numero, statut, montant, date_engagement, dossier_id, budget_line_id")
          .eq("exercice", exercice),
        supabase
          .from("budget_liquidations")
          .select("id, numero, statut, montant, date_liquidation, engagement_id")
          .eq("exercice", exercice),
        supabase
          .from("ordonnancements")
          .select("id, numero, statut, montant, montant_paye, created_at, dossier_id")
          .eq("exercice", exercice),
        supabase
          .from("reglements")
          .select("id, numero, statut, montant, date_paiement, ordonnancement_id")
          .eq("exercice", exercice),
        supabase
          .from("dossiers")
          .select("id, numero, objet, statut_global, montant_estime, etape_courante, direction_id")
          .eq("exercice", exercice),
        supabase
          .from("budget_lines")
          .select("id, dotation_initiale, dotation_modifiee, total_engage, disponible_calcule, direction_id")
          .eq("exercice", exercice)
          .eq("is_active", true),
      ]);

      const engagements = engagementsRes.data || [];
      const liquidations = liquidationsRes.data || [];
      const ordonnancements = ordonnancementsRes.data || [];
      const reglements = reglementsRes.data || [];
      const dossiers = dossiersRes.data || [];
      const budgetLines = budgetRes.data || [];

      // Filtrer par direction si nécessaire
      let filteredDossiers = dossiers;
      let filteredBudgetLines = budgetLines;
      if (filters.directionId !== "all") {
        filteredDossiers = dossiers.filter(d => d.direction_id === filters.directionId);
        filteredBudgetLines = budgetLines.filter(b => b.direction_id === filters.directionId);
      }

      // Calculs KPIs
      const engValides = engagements.filter(e => e.statut === "valide");
      const engEnAttente = engagements.filter(e => ["soumis", "en_attente", "differe"].includes(e.statut || ""));
      const liqValides = liquidations.filter(l => l.statut === "valide");
      const liqEnAttente = liquidations.filter(l => ["soumis", "en_attente", "differe"].includes(l.statut || ""));
      const ordValides = ordonnancements.filter(o => o.statut === "valide" || o.statut === "signe");
      const ordEnSignature = ordonnancements.filter(o => o.statut === "en_signature" || o.statut === "soumis");
      const regPaies = reglements.filter(r => r.statut === "paye" || r.statut === "valide");

      const totalEngage = engValides.reduce((sum, e) => sum + (e.montant || 0), 0);
      const totalLiquide = liqValides.reduce((sum, l) => sum + (l.montant || 0), 0);
      const totalOrdonnance = ordValides.reduce((sum, o) => sum + (o.montant || 0), 0);
      const totalPaye = regPaies.reduce((sum, r) => sum + (r.montant || 0), 0);
      const totalDotation = filteredBudgetLines.reduce((sum, b) => sum + (b.dotation_modifiee || b.dotation_initiale || 0), 0);
      const totalDisponible = filteredBudgetLines.reduce((sum, b) => sum + (b.disponible_calcule || 0), 0);

      // Taux
      const tauxEngagement = totalDotation > 0 ? (totalEngage / totalDotation) * 100 : 0;
      const tauxLiquidation = totalEngage > 0 ? (totalLiquide / totalEngage) * 100 : 0;
      const tauxOrdonnancement = totalLiquide > 0 ? (totalOrdonnance / totalLiquide) * 100 : 0;
      const tauxPaiement = totalOrdonnance > 0 ? (totalPaye / totalOrdonnance) * 100 : 0;

      // Evolution mensuelle
      const evolutionMensuelle = MOIS.map((mois, index) => {
        const monthStart = new Date(exercice, index, 1);
        const monthEnd = new Date(exercice, index + 1, 0);

        const filterByMonth = (items: any[], dateField: string) => {
          return items.filter(item => {
            if (!item[dateField]) return false;
            const date = new Date(item[dateField]);
            return date >= monthStart && date <= monthEnd;
          });
        };

        return {
          mois,
          engagements: filterByMonth(engValides, "date_engagement")
            .reduce((sum, e) => sum + (e.montant || 0), 0),
          liquidations: filterByMonth(liqValides, "date_liquidation")
            .reduce((sum, l) => sum + (l.montant || 0), 0),
          ordonnancements: filterByMonth(ordValides, "created_at")
            .reduce((sum, o) => sum + (o.montant || 0), 0),
          reglements: filterByMonth(regPaies, "date_paiement")
            .reduce((sum, r) => sum + (r.montant || 0), 0),
        };
      });

      // Top dossiers en attente
      const dossiersEnAttente = filteredDossiers
        .filter(d => !["solde", "cloture", "annule"].includes(d.statut_global || ""))
        .sort((a, b) => (b.montant_estime || 0) - (a.montant_estime || 0))
        .slice(0, 10);

      // Répartition par statut
      const repartitionEngagements = [
        { name: "Validés", value: engValides.length, color: PIE_COLORS[0] },
        { name: "En attente", value: engEnAttente.length, color: PIE_COLORS[1] },
        { name: "Rejetés", value: engagements.filter(e => e.statut === "rejete").length, color: PIE_COLORS[2] },
        { name: "Brouillons", value: engagements.filter(e => e.statut === "brouillon").length, color: PIE_COLORS[3] },
      ];

      return {
        kpis: {
          engagements: {
            total: engagements.length,
            valides: engValides.length,
            enAttente: engEnAttente.length,
            montantTotal: totalEngage,
            taux: tauxEngagement,
          },
          liquidations: {
            total: liquidations.length,
            valides: liqValides.length,
            enAttente: liqEnAttente.length,
            montantTotal: totalLiquide,
            taux: tauxLiquidation,
          },
          ordonnancements: {
            total: ordonnancements.length,
            valides: ordValides.length,
            enSignature: ordEnSignature.length,
            montantTotal: totalOrdonnance,
            taux: tauxOrdonnancement,
          },
          reglements: {
            total: reglements.length,
            payes: regPaies.length,
            montantTotal: totalPaye,
            taux: tauxPaiement,
          },
          budget: {
            dotation: totalDotation,
            engage: totalEngage,
            disponible: totalDisponible,
            tauxExecution: tauxEngagement,
          },
        },
        evolutionMensuelle,
        dossiersEnAttente,
        repartitionEngagements,
      };
    },
    enabled: !!exercice,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const { kpis, evolutionMensuelle, dossiersEnAttente, repartitionEngagements } = kpiData || {
    kpis: null,
    evolutionMensuelle: [],
    dossiersEnAttente: [],
    repartitionEngagements: [],
  };

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtres :</span>
            </div>
            
            <Select
              value={filters.directionId}
              onValueChange={(value) => setFilters(prev => ({ ...prev, directionId: value }))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Toutes les directions" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">Toutes les directions</SelectItem>
                {directions.map((dir) => (
                  <SelectItem key={dir.id} value={dir.id}>
                    {dir.sigle} - {dir.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.periode}
              onValueChange={(value) => setFilters(prev => ({ ...prev, periode: value as FilterState["periode"] }))}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="ytd">Année en cours</SelectItem>
                <SelectItem value="q1">T1 (Jan-Mar)</SelectItem>
                <SelectItem value="q2">T2 (Avr-Jun)</SelectItem>
                <SelectItem value="q3">T3 (Jul-Sep)</SelectItem>
                <SelectItem value="q4">T4 (Oct-Déc)</SelectItem>
                <SelectItem value="last3">3 derniers mois</SelectItem>
                <SelectItem value="last6">6 derniers mois</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Engagements */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Engagements
            </CardTitle>
            <CreditCard className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMontantCompact(kpis?.engagements.montantTotal || 0)}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="bg-success/10 text-success">
                <CheckCircle className="h-3 w-3 mr-1" />
                {kpis?.engagements.valides || 0} validés
              </Badge>
              {(kpis?.engagements.enAttente || 0) > 0 && (
                <Badge variant="outline" className="bg-warning/10 text-warning">
                  <Clock className="h-3 w-3 mr-1" />
                  {kpis?.engagements.enAttente} en attente
                </Badge>
              )}
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Taux d'engagement</span>
                <span className="font-medium">{(kpis?.engagements.taux || 0).toFixed(1)}%</span>
              </div>
              <Progress value={kpis?.engagements.taux || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Liquidations */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-secondary/10 to-transparent rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Liquidations
            </CardTitle>
            <Receipt className="h-5 w-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMontantCompact(kpis?.liquidations.montantTotal || 0)}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="bg-success/10 text-success">
                <CheckCircle className="h-3 w-3 mr-1" />
                {kpis?.liquidations.valides || 0} validées
              </Badge>
              {(kpis?.liquidations.enAttente || 0) > 0 && (
                <Badge variant="outline" className="bg-warning/10 text-warning">
                  <Clock className="h-3 w-3 mr-1" />
                  {kpis?.liquidations.enAttente} en attente
                </Badge>
              )}
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Taux de liquidation</span>
                <span className="font-medium">{(kpis?.liquidations.taux || 0).toFixed(1)}%</span>
              </div>
              <Progress value={kpis?.liquidations.taux || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Ordonnancements */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ordonnancements
            </CardTitle>
            <FileCheck className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMontantCompact(kpis?.ordonnancements.montantTotal || 0)}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="bg-success/10 text-success">
                <CheckCircle className="h-3 w-3 mr-1" />
                {kpis?.ordonnancements.valides || 0} validés
              </Badge>
              {(kpis?.ordonnancements.enSignature || 0) > 0 && (
                <Badge variant="outline" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  <FileText className="h-3 w-3 mr-1" />
                  {kpis?.ordonnancements.enSignature} en signature
                </Badge>
              )}
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Taux d'ordonnancement</span>
                <span className="font-medium">{(kpis?.ordonnancements.taux || 0).toFixed(1)}%</span>
              </div>
              <Progress value={kpis?.ordonnancements.taux || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Règlements */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Règlements
            </CardTitle>
            <Banknote className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatMontantCompact(kpis?.reglements.montantTotal || 0)}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="bg-success/10 text-success">
                <CheckCircle className="h-3 w-3 mr-1" />
                {kpis?.reglements.payes || 0} payés
              </Badge>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Taux de paiement</span>
                <span className="font-medium">{(kpis?.reglements.taux || 0).toFixed(1)}%</span>
              </div>
              <Progress value={kpis?.reglements.taux || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {!compact && (
        <Tabs defaultValue="evolution" className="space-y-4">
          <TabsList>
            <TabsTrigger value="evolution">Évolution mensuelle</TabsTrigger>
            <TabsTrigger value="repartition">Répartition</TabsTrigger>
            <TabsTrigger value="dossiers">Dossiers en attente</TabsTrigger>
          </TabsList>

          <TabsContent value="evolution">
            <Card>
              <CardHeader>
                <CardTitle>Évolution mensuelle de l'exécution budgétaire</CardTitle>
                <CardDescription>
                  Montants validés par mois - Exercice {exercice}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={evolutionMensuelle}>
                      <defs>
                        <linearGradient id="colorEng" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.engagement} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={COLORS.engagement} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorLiq" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.liquidation} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={COLORS.liquidation} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorOrd" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.ordonnancement} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={COLORS.ordonnancement} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.reglement} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={COLORS.reglement} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="mois" />
                      <YAxis tickFormatter={(val) => formatMontantCompact(val)} />
                      <Tooltip
                        formatter={(value: number) => formatMontant(value)}
                        labelFormatter={(label) => `Mois: ${label}`}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="engagements"
                        name="Engagements"
                        stroke={COLORS.engagement}
                        fill="url(#colorEng)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="liquidations"
                        name="Liquidations"
                        stroke={COLORS.liquidation}
                        fill="url(#colorLiq)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="ordonnancements"
                        name="Ordonnancements"
                        stroke={COLORS.ordonnancement}
                        fill="url(#colorOrd)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="reglements"
                        name="Règlements"
                        stroke={COLORS.reglement}
                        fill="url(#colorReg)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="repartition">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Répartition des engagements</CardTitle>
                  <CardDescription>Par statut de traitement</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={repartitionEngagements}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {repartitionEngagements.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Synthèse budgétaire</CardTitle>
                  <CardDescription>État d'exécution du budget</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Dotation totale</span>
                        <span className="font-bold">{formatMontant(kpis?.budget.dotation || 0)}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-muted-foreground">Montant engagé</span>
                        <span className="font-medium">{formatMontant(kpis?.budget.engage || 0)}</span>
                      </div>
                      <Progress value={kpis?.budget.tauxExecution || 0} className="h-3" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {(kpis?.budget.tauxExecution || 0).toFixed(1)}% du budget engagé
                      </p>
                    </div>
                    <div className="pt-4 border-t">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Disponible</span>
                        <span className="font-bold text-success">
                          {formatMontant(kpis?.budget.disponible || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="dossiers">
            <Card>
              <CardHeader>
                <CardTitle>Top 10 dossiers en attente</CardTitle>
                <CardDescription>
                  Dossiers non soldés triés par montant décroissant
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dossiersEnAttente.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success" />
                    <p>Aucun dossier en attente</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N° Dossier</TableHead>
                        <TableHead>Objet</TableHead>
                        <TableHead>Étape</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dossiersEnAttente.map((dossier) => (
                        <TableRow key={dossier.id}>
                          <TableCell className="font-mono">{dossier.numero || "-"}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {dossier.objet || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{dossier.etape_courante || "-"}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                dossier.statut_global === "en_cours"
                                  ? "bg-warning/10 text-warning"
                                  : "bg-muted"
                              }
                            >
                              {dossier.statut_global || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {formatMontant(dossier.montant_estime || 0)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
