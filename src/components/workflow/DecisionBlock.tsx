import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, User, Calendar, MessageSquare, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface DecisionBlockProps {
  type: 'validation' | 'rejet' | 'differe' | 'imputation';
  acteur?: { 
    first_name?: string | null; 
    last_name?: string | null;
  } | null;
  date?: string | null;
  commentaire?: string | null;
  dateReprise?: string | null;
  condition?: string | null;
  ligneBudgetaire?: {
    code?: string;
    label?: string;
  } | null;
}

export function DecisionBlock({ 
  type, 
  acteur, 
  date, 
  commentaire, 
  dateReprise, 
  condition,
  ligneBudgetaire 
}: DecisionBlockProps) {
  const config = {
    validation: {
      title: "Décision DG : Validée",
      icon: CheckCircle2,
      iconColor: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/30",
      borderColor: "border-green-200 dark:border-green-800",
      badgeVariant: "default" as const,
      badgeClass: "bg-green-600",
    },
    rejet: {
      title: "Décision DG : Rejetée",
      icon: XCircle,
      iconColor: "text-destructive",
      bgColor: "bg-red-50 dark:bg-red-950/30",
      borderColor: "border-red-200 dark:border-red-800",
      badgeVariant: "destructive" as const,
      badgeClass: "",
    },
    differe: {
      title: "Décision DG : Différée",
      icon: Clock,
      iconColor: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/30",
      borderColor: "border-orange-200 dark:border-orange-800",
      badgeVariant: "secondary" as const,
      badgeClass: "bg-orange-500 text-white",
    },
    imputation: {
      title: "Imputation Budgétaire",
      icon: CheckCircle2,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      borderColor: "border-blue-200 dark:border-blue-800",
      badgeVariant: "default" as const,
      badgeClass: "bg-blue-600",
    },
  };

  const { title, icon: Icon, iconColor, bgColor, borderColor, badgeVariant, badgeClass } = config[type];

  const formatActeur = () => {
    if (!acteur) return "Non spécifié";
    const firstName = acteur.first_name || "";
    const lastName = acteur.last_name || "";
    return `${firstName} ${lastName}`.trim() || "Non spécifié";
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Date non disponible";
    try {
      return format(new Date(dateStr), "dd MMMM yyyy 'à' HH:mm", { locale: fr });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card className={`${bgColor} ${borderColor} border-2`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-base">
          <Icon className={`h-5 w-5 ${iconColor}`} />
          {title}
          <Badge variant={badgeVariant} className={badgeClass}>
            {type === 'validation' ? 'Approuvée' : 
             type === 'rejet' ? 'Rejetée' : 
             type === 'differe' ? 'En attente' :
             'Imputée'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Acteur */}
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            {type === 'imputation' ? 'Imputé par' : 'Décision par'}:
          </span>
          <span className="font-medium">{formatActeur()}</span>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Date:</span>
          <span className="font-medium">{formatDate(date)}</span>
        </div>

        {/* Commentaire/Motif */}
        {commentaire && (
          <div className="flex items-start gap-2 text-sm">
            <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <span className="text-muted-foreground block">
                {type === 'rejet' ? 'Motif du rejet' : 
                 type === 'differe' ? 'Motif du différé' : 
                 'Commentaire'}:
              </span>
              <p className="font-medium mt-1 whitespace-pre-wrap">{commentaire}</p>
            </div>
          </div>
        )}

        {/* Date de reprise (pour différé) */}
        {type === 'differe' && dateReprise && (
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <span className="text-muted-foreground">Date limite de correction:</span>
            <span className="font-medium text-orange-600">{formatDate(dateReprise)}</span>
          </div>
        )}

        {/* Condition (pour différé) */}
        {type === 'differe' && condition && (
          <div className="flex items-start gap-2 text-sm border-t pt-2 mt-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <span className="text-muted-foreground block">Condition de reprise:</span>
              <p className="font-medium mt-1">{condition}</p>
            </div>
          </div>
        )}

        {/* Ligne budgétaire (pour imputation) */}
        {type === 'imputation' && ligneBudgetaire && (
          <div className="flex items-start gap-2 text-sm border-t pt-2 mt-2">
            <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5" />
            <div>
              <span className="text-muted-foreground block">Ligne budgétaire:</span>
              <p className="font-medium mt-1">
                {ligneBudgetaire.code} - {ligneBudgetaire.label}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
