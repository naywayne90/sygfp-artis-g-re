import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  CreditCard, 
  Receipt, 
  FileCheck, 
  Banknote, 
  TrendingUp,
  ArrowUpRight,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
  Target,
  BarChart3,
  PieChartIcon,
  Calendar,
  AlertTriangle,
  FolderOpen,
  ArrowDownRight
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Line
} from "recharts";
import { useExecutionDashboard } from "@/hooks/useExecutionDashboard";
import { useExercice } from "@/contexts/ExerciceContext";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const formatMontant = (value: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatMontantCompact = (value: number) => {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}Md`;
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toString();
};

const _PIE_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6"];

interface StepCardProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  stats: {
    brouillon?: { count: number; montant: number };
    soumis?: { count: number; montant: number };
    valide?: { count: number; montant: number };
    signe?: { count: number; montant: number };
    en_signature?: { count: number; montant: number };
    en_attente?: { count: number; montant: number };
    en_cours?: { count: number; montant: number };
    paye?: { count: number; montant: number };
    rejete?: { count: number; montant: number };
    annule?: { count: number; montant: number };
    total: { count: number; montant: number };
  };
  color: string;
  validKey: string;
  pendingKey: string;
  href: string;
}

function StepCard({ title, icon: Icon, stats, color, validKey, pendingKey, href }: StepCardProps) {
  const validStats = (stats as any)[validKey] || { count: 0, montant: 0 };
  const pendingStats = (stats as any)[pendingKey] || { count: 0, montant: 0 };
  const rejectedStats = stats.rejete || stats.annule || { count: 0, montant: 0 };
  const totalStats = stats.total;
  
  const progressPercent = totalStats.montant > 0 
    ? Math.round((validStats.montant / totalStats.montant) * 100) 
    : 0;

  return (
    <Card className="relative overflow-hidden hover:shadow-md transition-shadow group">
      <div 
        className="absolute top-0 left-0 w-1.5 h-full transition-all group-hover:w-2" 
        style={{ backgroundColor: color }}
      />
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
              <Icon className={cn("h-5 w-5", 
                color === "#3b82f6" && "text-blue-500",
                color === "#22c55e" && "text-green-500",
                color === "#f59e0b" && "text-amber-500",
                color === "#8b5cf6" && "text-purple-500"
              )} />
            </div>
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <Link to={href}>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Montant total */}
        <div>
          <p className="text-2xl font-bold">
            {formatMontant(totalStats.montant)} <span className="text-sm font-normal text-muted-foreground">FCFA</span>
          </p>
          <p className="text-xs text-muted-foreground">{totalStats.count} dossier(s)</p>
        </div>

        {/* Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Taux de validation</span>
            <span className={cn("font-semibold",
              color === "#3b82f6" && "text-blue-500",
              color === "#22c55e" && "text-green-500",
              color === "#f59e0b" && "text-amber-500",
              color === "#8b5cf6" && "text-purple-500"
            )}>{progressPercent}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all" 
              style={{ width: `${progressPercent}%`, backgroundColor: color }}
            />
          </div>
        </div>

        {/* Stats breakdown */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          <div className="flex flex-col items-center p-2 rounded-lg bg-muted/30">
            <Clock className="h-3.5 w-3.5 text-amber-500 mb-1" />
            <p className="text-xs text-muted-foreground">En attente</p>
            <p className="text-sm font-semibold">{pendingStats.count}</p>
          </div>
          <div className="flex flex-col items-center p-2 rounded-lg bg-muted/30">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mb-1" />
            <p className="text-xs text-muted-foreground">Validé</p>
            <p className="text-sm font-semibold text-green-600">{validStats.count}</p>
          </div>
          <div className="flex flex-col items-center p-2 rounded-lg bg-muted/30">
            <XCircle className="h-3.5 w-3.5 text-red-500 mb-1" />
            <p className="text-xs text-muted-foreground">Rejeté</p>
            <p className="text-sm font-semibold text-red-600">{rejectedStats.count}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Mini KPI card for the top row
interface MiniKPIProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down" | "neutral";
  color?: string;
}

function MiniKPI({ label, value, subValue, icon: Icon, trend, color = "primary" }: MiniKPIProps) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-card border">
      <div className={cn(
        "p-2.5 rounded-lg",
        color === "primary" && "bg-primary/10 text-primary",
        color === "success" && "bg-green-500/10 text-green-600",
        color === "warning" && "bg-amber-500/10 text-amber-600",
        color === "danger" && "bg-red-500/10 text-red-600",
        color === "info" && "bg-blue-500/10 text-blue-600",
      )}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <div className="flex items-center gap-2">
          <p className="text-xl font-bold">{value}</p>
          {trend && (
            <span className={cn(
              "flex items-center text-xs",
              trend === "up" && "text-green-600",
              trend === "down" && "text-red-600",
            )}>
              {trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            </span>
          )}
        </div>
        {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
      </div>
    </div>
  );
}

export default function DashboardExecution() {
  const { exercice } = useExercice();
  const { data: stats, isLoading, error } = useExecutionDashboard();
  const [chartView, setChartView] = useState<"bar" | "area">("bar");

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Erreur lors du chargement des données</p>
      </div>
    );
  }

  if (!stats) return null;

  // Calculate totals
  const totalEngage = stats.engagements.total.montant;
  const totalLiquide = stats.liquidations.total.montant;
  const totalOrdonnance = stats.ordonnancements.total.montant;
  const totalPaye = stats.reglements.total.montant;

  // Taux d'exécution global
  const tauxExecution = totalEngage > 0 ? Math.round((totalPaye / totalEngage) * 100) : 0;
  const tauxLiquidation = totalEngage > 0 ? Math.round((totalLiquide / totalEngage) * 100) : 0;
  const tauxOrdonnancement = totalLiquide > 0 ? Math.round((totalOrdonnance / totalLiquide) * 100) : 0;

  // Dossiers en attente
  const dossiersEnAttente = 
    stats.engagements.soumis.count + 
    stats.liquidations.soumis.count + 
    (stats.ordonnancements.en_signature?.count || 0) + 
    stats.reglements.en_cours.count;

  // Prepare pie chart data
  const pieData = [
    { name: "Engagements", value: stats.engagements.total.montant, color: "#3b82f6" },
    { name: "Liquidations", value: stats.liquidations.total.montant, color: "#22c55e" },
    { name: "Ordonnancements", value: stats.ordonnancements.total.montant, color: "#f59e0b" },
    { name: "Règlements", value: stats.reglements.total.montant, color: "#8b5cf6" },
  ];

  // Status distribution for funnel visualization
  const funnelData = [
    { name: "Engagé", value: totalEngage, color: "#3b82f6" },
    { name: "Liquidé", value: totalLiquide, color: "#22c55e" },
    { name: "Ordonnancé", value: totalOrdonnance, color: "#f59e0b" },
    { name: "Payé", value: totalPaye, color: "#8b5cf6" },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10">
            <TrendingUp className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tableau de bord Exécution</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              Exercice {exercice}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm py-1 px-3">
            <Activity className="h-3.5 w-3.5 mr-1.5" />
            En temps réel
          </Badge>
        </div>
      </div>

      {/* Mini KPIs Row */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        <MiniKPI
          label="Taux d'exécution"
          value={`${tauxExecution}%`}
          subValue="Payé / Engagé"
          icon={Target}
          color={tauxExecution >= 75 ? "success" : tauxExecution >= 50 ? "warning" : "danger"}
        />
        <MiniKPI
          label="Total engagé"
          value={formatMontantCompact(totalEngage)}
          subValue="FCFA"
          icon={CreditCard}
          color="info"
        />
        <MiniKPI
          label="Total payé"
          value={formatMontantCompact(totalPaye)}
          subValue="FCFA"
          icon={Banknote}
          color="success"
        />
        <MiniKPI
          label="En attente"
          value={dossiersEnAttente}
          subValue="dossiers"
          icon={Clock}
          color="warning"
        />
        <MiniKPI
          label="Top Dossiers"
          value={stats.topDossiers.length}
          subValue="en cours"
          icon={FolderOpen}
          color="primary"
        />
      </div>

      {/* Main KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StepCard
          title="Engagements"
          icon={CreditCard}
          stats={stats.engagements}
          color="#3b82f6"
          validKey="valide"
          pendingKey="soumis"
          href="/engagements"
        />
        <StepCard
          title="Liquidations"
          icon={Receipt}
          stats={stats.liquidations}
          color="#22c55e"
          validKey="valide"
          pendingKey="soumis"
          href="/liquidations"
        />
        <StepCard
          title="Ordonnancements"
          icon={FileCheck}
          stats={stats.ordonnancements}
          color="#f59e0b"
          validKey="signe"
          pendingKey="en_signature"
          href="/ordonnancements"
        />
        <StepCard
          title="Règlements"
          icon={Banknote}
          stats={stats.reglements}
          color="#8b5cf6"
          validKey="paye"
          pendingKey="en_cours"
          href="/reglements"
        />
      </div>

      {/* Funnel visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Entonnoir de la chaîne de dépense
          </CardTitle>
          <CardDescription>Progression des montants à travers les étapes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {funnelData.map((step, index) => {
              const prevValue = index > 0 ? funnelData[index - 1].value : step.value;
              const conversionRate = prevValue > 0 ? Math.round((step.value / prevValue) * 100) : 0;
              const widthPercent = funnelData[0].value > 0 
                ? Math.max(40, Math.round((step.value / funnelData[0].value) * 100)) 
                : 100;
              
              return (
                <div key={step.name} className="flex flex-col items-center gap-2">
                  <div 
                    className="h-24 rounded-lg flex flex-col items-center justify-center transition-all hover:scale-105"
                    style={{ 
                      backgroundColor: `${step.color}20`,
                      borderLeft: `4px solid ${step.color}`,
                      width: `${widthPercent}%`,
                      minWidth: '80px'
                    }}
                  >
                    <p className="text-lg font-bold" style={{ color: step.color }}>
                      {formatMontantCompact(step.value)}
                    </p>
                    <p className="text-xs text-muted-foreground">FCFA</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{step.name}</p>
                    {index > 0 && (
                      <Badge variant="outline" className="text-[10px] mt-1">
                        {conversionRate}%
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Pie Chart - Répartition par étape */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-primary" />
              Répartition par étape
            </CardTitle>
            <CardDescription>Montants par étape de la chaîne de dépense</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${formatMontant(value)} FCFA`, ""]}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Taux de conversion */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Taux de conversion
            </CardTitle>
            <CardDescription>Performance de chaque étape</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm">Engagé → Liquidé</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${tauxLiquidation}%` }} />
                  </div>
                  <span className="text-sm font-semibold w-12 text-right">{tauxLiquidation}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm">Liquidé → Ordonnancé</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${tauxOrdonnancement}%` }} />
                  </div>
                  <span className="text-sm font-semibold w-12 text-right">{tauxOrdonnancement}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="text-sm">Ordonnancé → Payé</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 rounded-full" 
                      style={{ width: `${totalOrdonnance > 0 ? Math.round((totalPaye / totalOrdonnance) * 100) : 0}%` }} 
                    />
                  </div>
                  <span className="text-sm font-semibold w-12 text-right">
                    {totalOrdonnance > 0 ? Math.round((totalPaye / totalOrdonnance) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <span className="font-medium">Taux d'exécution global</span>
                </div>
                <span className="text-2xl font-bold text-primary">{tauxExecution}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart - Évolution mensuelle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Évolution mensuelle des validations</CardTitle>
              <CardDescription>Montants validés par mois et par étape (exercice {exercice})</CardDescription>
            </div>
            <div className="flex gap-1">
              <Button 
                variant={chartView === "bar" ? "default" : "outline"} 
                size="sm"
                onClick={() => setChartView("bar")}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button 
                variant={chartView === "area" ? "default" : "outline"} 
                size="sm"
                onClick={() => setChartView("area")}
              >
                <Activity className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            {chartView === "bar" ? (
              <BarChart data={stats.evolutionMensuelle}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                <YAxis 
                  tick={{ fontSize: 11 }} 
                  tickFormatter={(value) => formatMontantCompact(value)}
                />
                <Tooltip 
                  formatter={(value: number) => [`${formatMontant(value)} FCFA`, ""]}
                  labelStyle={{ fontWeight: "bold" }}
                />
                <Legend />
                <Bar dataKey="engagements" name="Engagements" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="liquidations" name="Liquidations" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ordonnancements" name="Ordonnancements" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="reglements" name="Règlements" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <AreaChart data={stats.evolutionMensuelle}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                <YAxis 
                  tick={{ fontSize: 11 }} 
                  tickFormatter={(value) => formatMontantCompact(value)}
                />
                <Tooltip 
                  formatter={(value: number) => [`${formatMontant(value)} FCFA`, ""]}
                  labelStyle={{ fontWeight: "bold" }}
                />
                <Legend />
                <Area type="monotone" dataKey="engagements" name="Engagements" fill="#3b82f6" fillOpacity={0.3} stroke="#3b82f6" />
                <Area type="monotone" dataKey="liquidations" name="Liquidations" fill="#22c55e" fillOpacity={0.3} stroke="#22c55e" />
                <Area type="monotone" dataKey="ordonnancements" name="Ordonnancements" fill="#f59e0b" fillOpacity={0.3} stroke="#f59e0b" />
                <Area type="monotone" dataKey="reglements" name="Règlements" fill="#8b5cf6" fillOpacity={0.3} stroke="#8b5cf6" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Dossiers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Top 10 Dossiers par montant</CardTitle>
              <CardDescription>Dossiers les plus importants et leur progression</CardDescription>
            </div>
            <Link to="/recherche">
              <Button variant="outline" size="sm">
                Voir tous les dossiers
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {stats.topDossiers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FolderOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Aucun dossier enregistré</p>
              <p className="text-sm">Les dossiers de l'exercice {exercice} apparaîtront ici</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.topDossiers.map((dossier, idx) => (
                <div 
                  key={dossier.id} 
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm",
                    idx < 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-muted-foreground">{dossier.code}</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {dossier.etape.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="text-sm truncate">{dossier.objet}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatMontant(dossier.montant)} FCFA</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={dossier.progression} className="w-20 h-1.5" />
                      <span className="text-xs text-muted-foreground w-8">{dossier.progression}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
