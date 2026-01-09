import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  CreditCard, 
  Receipt, 
  FileCheck, 
  Wallet,
  ArrowRight,
  TrendingUp,
  AlertTriangle
} from "lucide-react";
import { Link } from "react-router-dom";

interface ChaineDepenseKPIsProps {
  stats: {
    notes: { total: number; aValider: number; montant: number };
    engagements: { total: number; aValider: number; montant: number };
    liquidations: { total: number; aValider: number; montant: number };
    ordonnancements: { total: number; aValider: number; montant: number };
    reglements: { total: number; montant: number };
  };
  budgetGlobal: number;
}

const formatMontant = (montant: number): string => {
  if (montant >= 1_000_000_000) return `${(montant / 1_000_000_000).toFixed(1)} Mds`;
  if (montant >= 1_000_000) return `${(montant / 1_000_000).toFixed(1)} M`;
  if (montant >= 1_000) return `${(montant / 1_000).toFixed(0)} K`;
  return montant.toFixed(0);
};

const ETAPES = [
  { 
    key: "notes", 
    label: "Notes", 
    icon: FileText, 
    href: "/notes-aef",
    color: "bg-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/30"
  },
  { 
    key: "engagements", 
    label: "Engagements", 
    icon: CreditCard, 
    href: "/engagements",
    color: "bg-emerald-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30"
  },
  { 
    key: "liquidations", 
    label: "Liquidations", 
    icon: Receipt, 
    href: "/liquidations",
    color: "bg-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/30"
  },
  { 
    key: "ordonnancements", 
    label: "Ordonnancements", 
    icon: FileCheck, 
    href: "/ordonnancements",
    color: "bg-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/30"
  },
  { 
    key: "reglements", 
    label: "Règlements", 
    icon: Wallet, 
    href: "/reglements",
    color: "bg-green-500",
    bgColor: "bg-green-50 dark:bg-green-950/30"
  },
];

export function ChaineDepenseKPIs({ stats, budgetGlobal }: ChaineDepenseKPIsProps) {
  // Calculer les taux d'exécution
  const tauxEngagement = budgetGlobal > 0 ? (stats.engagements.montant / budgetGlobal) * 100 : 0;
  const tauxLiquidation = stats.engagements.montant > 0 ? (stats.liquidations.montant / stats.engagements.montant) * 100 : 0;
  const tauxOrdonnancement = stats.liquidations.montant > 0 ? (stats.ordonnancements.montant / stats.liquidations.montant) * 100 : 0;
  const tauxPaiement = stats.ordonnancements.montant > 0 ? (stats.reglements.montant / stats.ordonnancements.montant) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Pipeline visuel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Pipeline Chaîne de Dépense
          </CardTitle>
          <CardDescription>
            Vue d'ensemble de l'exécution budgétaire par étape
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {ETAPES.map((etape, index) => {
              const etapeStats = stats[etape.key as keyof typeof stats];
              const montant = 'montant' in etapeStats ? etapeStats.montant : 0;
              const aValider = 'aValider' in etapeStats ? etapeStats.aValider : 0;
              
              return (
                <div key={etape.key} className="relative">
                  <Link to={etape.href}>
                    <div className={`p-4 rounded-lg ${etape.bgColor} hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-primary/20`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-lg ${etape.color}`}>
                          <etape.icon className="h-4 w-4 text-white" />
                        </div>
                        {aValider > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {aValider}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{etape.label}</p>
                      <p className="text-lg font-bold">{formatMontant(montant)}</p>
                    </div>
                  </Link>
                  {index < ETAPES.length - 1 && (
                    <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Taux d'exécution */}
      <Card>
        <CardHeader>
          <CardTitle>Taux d'Exécution</CardTitle>
          <CardDescription>Progression à chaque étape de la chaîne</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Engagement</span>
                <span className="text-sm font-medium">{tauxEngagement.toFixed(1)}%</span>
              </div>
              <Progress value={tauxEngagement} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {formatMontant(stats.engagements.montant)} / {formatMontant(budgetGlobal)}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Liquidation</span>
                <span className="text-sm font-medium">{tauxLiquidation.toFixed(1)}%</span>
              </div>
              <Progress value={tauxLiquidation} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {formatMontant(stats.liquidations.montant)} / {formatMontant(stats.engagements.montant)}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ordonnancement</span>
                <span className="text-sm font-medium">{tauxOrdonnancement.toFixed(1)}%</span>
              </div>
              <Progress value={tauxOrdonnancement} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {formatMontant(stats.ordonnancements.montant)} / {formatMontant(stats.liquidations.montant)}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Paiement</span>
                <span className="text-sm font-medium">{tauxPaiement.toFixed(1)}%</span>
              </div>
              <Progress value={tauxPaiement} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {formatMontant(stats.reglements.montant)} / {formatMontant(stats.ordonnancements.montant)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertes Pipeline */}
      {(stats.notes.aValider > 5 || stats.engagements.aValider > 3 || stats.liquidations.aValider > 3) && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-warning">Accumulation détectée dans le pipeline</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {stats.notes.aValider > 5 && `${stats.notes.aValider} notes en attente de validation. `}
                  {stats.engagements.aValider > 3 && `${stats.engagements.aValider} engagements à valider. `}
                  {stats.liquidations.aValider > 3 && `${stats.liquidations.aValider} liquidations en attente.`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
