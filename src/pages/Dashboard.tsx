import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  CreditCard, 
  Receipt, 
  FileCheck, 
  Wallet,
  TrendingUp,
  Clock,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const stats = [
  {
    title: "Notes en attente",
    value: "12",
    description: "3 urgentes",
    icon: FileText,
    trend: "+2",
    trendUp: true,
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  {
    title: "Engagements en cours",
    value: "28",
    description: "15 validés ce mois",
    icon: CreditCard,
    trend: "+5",
    trendUp: true,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    title: "Liquidations",
    value: "45",
    description: "8 à traiter",
    icon: Receipt,
    trend: "-3",
    trendUp: false,
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    title: "Ordonnancements",
    value: "67",
    description: "5 en signature",
    icon: FileCheck,
    trend: "+12",
    trendUp: true,
    color: "text-success",
    bgColor: "bg-success/10",
  },
];

const recentActivities = [
  {
    type: "note",
    title: "Note N° 2024-0089",
    action: "soumise pour validation",
    time: "Il y a 10 min",
    status: "en_attente",
  },
  {
    type: "engagement",
    title: "Engagement ENG-2024-0234",
    action: "validé par DAAF",
    time: "Il y a 25 min",
    status: "valide",
  },
  {
    type: "liquidation",
    title: "Liquidation LIQ-2024-0156",
    action: "créée",
    time: "Il y a 1h",
    status: "en_cours",
  },
  {
    type: "ordonnancement",
    title: "Ordonnancement ORD-2024-0098",
    action: "signé par DG",
    time: "Il y a 2h",
    status: "valide",
  },
  {
    type: "note",
    title: "Note N° 2024-0088",
    action: "différée",
    time: "Il y a 3h",
    status: "differe",
  },
];

const getStatusBadge = (status: string) => {
  const variants: Record<string, { label: string; className: string }> = {
    en_attente: { label: "En attente", className: "bg-warning/10 text-warning border-warning/20" },
    valide: { label: "Validé", className: "bg-success/10 text-success border-success/20" },
    en_cours: { label: "En cours", className: "bg-secondary/10 text-secondary border-secondary/20" },
    differe: { label: "Différé", className: "bg-muted text-muted-foreground" },
  };
  const variant = variants[status] || variants.en_attente;
  return <Badge variant="outline" className={variant.className}>{variant.label}</Badge>;
};

export default function Dashboard() {
  const currentYear = new Date().getFullYear();
  const budgetExecute = 65;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Tableau de bord</h1>
        <p className="page-description">
          Vue d'ensemble de la gestion financière - Exercice {currentYear}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{stat.value}</span>
                <span className={`flex items-center text-xs ${stat.trendUp ? 'text-success' : 'text-destructive'}`}>
                  {stat.trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {stat.trend}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Budget Execution */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-secondary" />
              Exécution budgétaire {currentYear}
            </CardTitle>
            <CardDescription>
              Taux d'exécution global du budget
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Progression globale</span>
                <span className="text-sm font-bold text-secondary">{budgetExecute}%</span>
              </div>
              <Progress value={budgetExecute} className="h-3" />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1 p-4 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Budget alloué</p>
                <p className="text-xl font-bold">2.5 Mds</p>
                <p className="text-xs text-muted-foreground">FCFA</p>
              </div>
              <div className="space-y-1 p-4 rounded-lg bg-success/10">
                <p className="text-xs text-muted-foreground">Montant engagé</p>
                <p className="text-xl font-bold text-success">1.8 Mds</p>
                <p className="text-xs text-muted-foreground">FCFA</p>
              </div>
              <div className="space-y-1 p-4 rounded-lg bg-secondary/10">
                <p className="text-xs text-muted-foreground">Montant liquidé</p>
                <p className="text-xl font-bold text-secondary">1.2 Mds</p>
                <p className="text-xs text-muted-foreground">FCFA</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-secondary" />
              Activités récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                  {getStatusBadge(activity.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      <Card className="border-warning/50 bg-warning/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-warning">
            <AlertCircle className="h-5 w-5" />
            Alertes et rappels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-card border">
              <div className="p-2 rounded-full bg-destructive/10">
                <Clock className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium">3 notes en retard</p>
                <p className="text-xs text-muted-foreground">Délai dépassé de validation</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-card border">
              <div className="p-2 rounded-full bg-warning/10">
                <Wallet className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-sm font-medium">Budget ligne 203</p>
                <p className="text-xs text-muted-foreground">85% consommé</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-card border">
              <div className="p-2 rounded-full bg-secondary/10">
                <FileCheck className="h-4 w-4 text-secondary" />
              </div>
              <div>
                <p className="text-sm font-medium">5 ordonnancements</p>
                <p className="text-xs text-muted-foreground">En attente de signature</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
