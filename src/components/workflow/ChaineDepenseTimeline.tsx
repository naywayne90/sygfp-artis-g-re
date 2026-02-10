import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  ShoppingCart,
  CreditCard,
  Receipt,
  Wallet,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
} from "lucide-react";

interface EtapeInfo {
  id: string | null;
  numero: string | null;
  statut: string | null;
  montant?: number | null;
  date?: string | null;
}

interface ChaineDepenseTimelineProps {
  note?: EtapeInfo | null;
  expressionBesoin?: EtapeInfo | null;
  marche?: EtapeInfo | null;
  engagement?: EtapeInfo | null;
  liquidation?: EtapeInfo | null;
  ordonnancement?: EtapeInfo | null;
  reglement?: EtapeInfo | null;
  currentEtape?: string;
}

const ETAPES = [
  { key: "note", label: "Note DG", icon: FileText, color: "text-blue-600" },
  { key: "expressionBesoin", label: "Exp. Besoin", icon: FileText, color: "text-indigo-600" },
  { key: "marche", label: "Marché", icon: ShoppingCart, color: "text-purple-600" },
  { key: "engagement", label: "Engagement", icon: CreditCard, color: "text-orange-600" },
  { key: "liquidation", label: "Liquidation", icon: Receipt, color: "text-emerald-600" },
  { key: "ordonnancement", label: "Ordonnancement", icon: Wallet, color: "text-cyan-600" },
  { key: "reglement", label: "Règlement", icon: CheckCircle2, color: "text-green-600" },
];

const getStatutBadge = (statut: string | null | undefined) => {
  if (!statut) return null;
  
  const statusMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
    "validé": { variant: "default", icon: CheckCircle2 },
    "valide": { variant: "default", icon: CheckCircle2 },
    "attribue": { variant: "default", icon: CheckCircle2 },
    "impute": { variant: "default", icon: CheckCircle2 },
    "soumis": { variant: "secondary", icon: Clock },
    "en_attente": { variant: "secondary", icon: Clock },
    "en_preparation": { variant: "outline", icon: Clock },
    "brouillon": { variant: "outline", icon: FileText },
    "rejeté": { variant: "destructive", icon: XCircle },
    "rejete": { variant: "destructive", icon: XCircle },
  };

  const config = statusMap[statut] || { variant: "outline" as const, icon: Clock };
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1 text-xs">
      <Icon className="h-3 w-3" />
      {statut}
    </Badge>
  );
};

const formatMontant = (montant: number | null | undefined) => {
  if (!montant) return "-";
  return new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";
};

export function ChaineDepenseTimeline({
  note,
  expressionBesoin,
  marche,
  engagement,
  liquidation,
  ordonnancement,
  reglement,
  currentEtape,
}: ChaineDepenseTimelineProps) {
  const etapesData: Record<string, EtapeInfo | null | undefined> = {
    note,
    expressionBesoin,
    marche,
    engagement,
    liquidation,
    ordonnancement,
    reglement,
  };

  // Find active step index
  const _activeStepIndex = ETAPES.findIndex(e => e.key === currentEtape);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Chaîne de la dépense
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
          {ETAPES.map((etape, index) => {
            const data = etapesData[etape.key];
            const Icon = etape.icon;
            const isActive = etape.key === currentEtape;
            const isCompleted = data?.id && (
              data.statut === "validé" || 
              data.statut === "valide" || 
              data.statut === "attribue" ||
              data.statut === "impute"
            );
            const isPending = data?.id && !isCompleted;

            return (
              <div key={etape.key} className="flex items-center">
                <div
                  className={`
                    flex flex-col items-center min-w-[80px] p-2 rounded-lg transition-all
                    ${isActive ? "bg-primary/10 ring-2 ring-primary" : ""}
                    ${isCompleted ? "bg-success/10" : ""}
                    ${isPending ? "bg-warning/10" : ""}
                    ${!data?.id ? "opacity-50" : ""}
                  `}
                >
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center mb-1
                      ${isCompleted ? "bg-success text-success-foreground" : ""}
                      ${isPending ? "bg-warning text-warning-foreground" : ""}
                      ${isActive && !isCompleted && !isPending ? "bg-primary text-primary-foreground" : ""}
                      ${!data?.id && !isActive ? "bg-muted text-muted-foreground" : ""}
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-center">{etape.label}</span>
                  {data?.numero && (
                    <span className="text-xs text-muted-foreground font-mono mt-0.5">
                      {data.numero}
                    </span>
                  )}
                  {data?.statut && (
                    <div className="mt-1">
                      {getStatutBadge(data.statut)}
                    </div>
                  )}
                </div>
                {index < ETAPES.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground mx-1 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Summary info */}
        <Separator className="my-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {engagement?.montant && (
            <div>
              <span className="text-muted-foreground">Montant engagé:</span>
              <p className="font-medium">{formatMontant(engagement.montant)}</p>
            </div>
          )}
          {liquidation?.montant && (
            <div>
              <span className="text-muted-foreground">Montant liquidé:</span>
              <p className="font-medium">{formatMontant(liquidation.montant)}</p>
            </div>
          )}
          {ordonnancement?.montant && (
            <div>
              <span className="text-muted-foreground">Montant ordonnancé:</span>
              <p className="font-medium">{formatMontant(ordonnancement.montant)}</p>
            </div>
          )}
          {reglement?.montant && (
            <div>
              <span className="text-muted-foreground">Montant payé:</span>
              <p className="font-medium text-success">{formatMontant(reglement.montant)}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
