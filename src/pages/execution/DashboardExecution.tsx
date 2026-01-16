import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CreditCard, 
  Receipt, 
  FileCheck, 
  Banknote, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  FileEdit
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
  ResponsiveContainer 
} from "recharts";
import { useExecutionDashboard } from "@/hooks/useExecutionDashboard";
import { useExercice } from "@/contexts/ExerciceContext";

import { cn } from "@/lib/utils";

const formatMontant = (value: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(value);
};

const COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  accent: "hsl(var(--accent))",
  muted: "hsl(var(--muted))",
  destructive: "hsl(var(--destructive))",
  success: "#22c55e",
  warning: "#f59e0b",
  info: "#3b82f6",
};

const PIE_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444"];

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
}

function StepCard({ title, icon: Icon, stats, color, validKey, pendingKey }: StepCardProps) {
  const validStats = (stats as any)[validKey] || { count: 0, montant: 0 };
  const pendingStats = (stats as any)[pendingKey] || { count: 0, montant: 0 };
  const totalStats = stats.total;
  
  const progressPercent = totalStats.montant > 0 
    ? Math.round((validStats.montant / totalStats.montant) * 100) 
    : 0;

  return (
    <Card className="relative overflow-hidden">
      <div 
        className="absolute top-0 left-0 w-1 h-full" 
        style={{ backgroundColor: color }}
      />
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">
            {totalStats.count} dossiers
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Montant total */}
        <div>
          <p className="text-2xl font-bold">
            {formatMontant(totalStats.montant)} <span className="text-sm font-normal text-muted-foreground">FCFA</span>
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Validé</span>
            <span className="font-medium">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Stats breakdown */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-warning" />
            <div>
              <p className="text-xs text-muted-foreground">En attente</p>
              <p className="text-sm font-medium">{pendingStats.count}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            <div>
              <p className="text-xs text-muted-foreground">Validé</p>
              <p className="text-sm font-medium">{validStats.count}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardExecution() {
  const { exercice } = useExercice();
  const { data: stats, isLoading, error } = useExecutionDashboard();

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

  // Prepare pie chart data
  const pieData = [
    { name: "Engagements", value: stats.engagements.total.montant, color: "#3b82f6" },
    { name: "Liquidations", value: stats.liquidations.total.montant, color: "#22c55e" },
    { name: "Ordonnancements", value: stats.ordonnancements.total.montant, color: "#f59e0b" },
    { name: "Règlements", value: stats.reglements.total.montant, color: "#8b5cf6" },
  ];

  // Status distribution pie
  const statusPieData = [
    { 
      name: "Validé", 
      value: stats.engagements.valide.count + stats.liquidations.valide.count + 
             (stats.ordonnancements.signe?.count || 0) + stats.reglements.paye.count,
      color: "#22c55e" 
    },
    { 
      name: "En cours", 
      value: stats.engagements.soumis.count + stats.liquidations.soumis.count + 
             (stats.ordonnancements.en_signature?.count || 0) + stats.reglements.en_cours.count,
      color: "#f59e0b" 
    },
    { 
      name: "Brouillon", 
      value: stats.engagements.brouillon.count + stats.liquidations.brouillon.count + 
             stats.ordonnancements.brouillon.count + stats.reglements.en_attente.count,
      color: "#94a3b8" 
    },
    { 
      name: "Rejeté", 
      value: stats.engagements.rejete.count + stats.liquidations.rejete.count + 
             stats.ordonnancements.rejete.count + stats.reglements.annule.count,
      color: "#ef4444" 
    },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tableau de bord Exécution</h1>
            <p className="text-sm text-muted-foreground">Exercice {exercice}</p>
          </div>
        </div>
        <p className="text-muted-foreground">
          Vue d'ensemble de l'exécution budgétaire par étape de la chaîne de la dépense
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StepCard
          title="Engagements"
          icon={CreditCard}
          stats={stats.engagements}
          color="#3b82f6"
          validKey="valide"
          pendingKey="soumis"
        />
        <StepCard
          title="Liquidations"
          icon={Receipt}
          stats={stats.liquidations}
          color="#22c55e"
          validKey="valide"
          pendingKey="soumis"
        />
        <StepCard
          title="Ordonnancements"
          icon={FileCheck}
          stats={stats.ordonnancements}
          color="#f59e0b"
          validKey="signe"
          pendingKey="en_signature"
        />
        <StepCard
          title="Règlements"
          icon={Banknote}
          stats={stats.reglements}
          color="#8b5cf6"
          validKey="paye"
          pendingKey="en_cours"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Pie Chart - Répartition par étape */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Répartition par étape</CardTitle>
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

        {/* Pie Chart - Répartition par statut */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Répartition par statut</CardTitle>
            <CardDescription>Nombre de dossiers par statut</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart - Évolution mensuelle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Évolution mensuelle des validations</CardTitle>
          <CardDescription>Montants validés par mois et par étape (exercice {exercice})</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={stats.evolutionMensuelle}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
              <YAxis 
                tick={{ fontSize: 11 }} 
                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
              />
              <Tooltip 
                formatter={(value: number) => [`${formatMontant(value)} FCFA`, ""]}
                labelStyle={{ fontWeight: "bold" }}
              />
              <Legend />
              <Bar dataKey="engagements" name="Engagements" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              <Bar dataKey="liquidations" name="Liquidations" fill="#22c55e" radius={[2, 2, 0, 0]} />
              <Bar dataKey="ordonnancements" name="Ordonnancements" fill="#f59e0b" radius={[2, 2, 0, 0]} />
              <Bar dataKey="reglements" name="Règlements" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Dossiers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top 10 Dossiers par montant</CardTitle>
          <CardDescription>Dossiers les plus importants et leur progression</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.topDossiers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun dossier enregistré pour cet exercice
            </p>
          ) : (
            <div className="space-y-3">
              {stats.topDossiers.map((dossier, idx) => (
                <div 
                  key={dossier.id} 
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
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
                      <span className="text-xs text-muted-foreground">{dossier.progression}%</span>
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
