import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecentActivitiesEnhanced, type EnhancedActivity, type GroupedActivities } from "@/hooks/useRecentActivitiesEnhanced";
import { 
  Clock, 
  FileText, 
  CreditCard,
  Receipt, 
  FileCheck, 
  ShoppingCart,
  User,
  ArrowRight,
  CheckCircle,
  XCircle,
  Upload,
  RefreshCw,
  Ban,
  Send,
  Plus,
  FileEdit,
  Banknote,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

const getActionIcon = (action: string) => {
  switch (action) {
    case "create": return <Plus className="h-3 w-3" />;
    case "update": return <FileEdit className="h-3 w-3" />;
    case "validate": return <CheckCircle className="h-3 w-3" />;
    case "reject": return <XCircle className="h-3 w-3" />;
    case "submit": return <Send className="h-3 w-3" />;
    case "execute": return <Banknote className="h-3 w-3" />;
    case "cancel": return <Ban className="h-3 w-3" />;
    case "import": return <Upload className="h-3 w-3" />;
    case "sync": return <RefreshCw className="h-3 w-3" />;
    default: return <FileText className="h-3 w-3" />;
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case "note": return <FileText className="h-4 w-4" />;
    case "engagement": return <CreditCard className="h-4 w-4" />;
    case "liquidation": return <Receipt className="h-4 w-4" />;
    case "ordonnancement": return <FileCheck className="h-4 w-4" />;
    case "marche": return <ShoppingCart className="h-4 w-4" />;
    case "prestataire": return <Users className="h-4 w-4" />;
    case "contrat": return <FileText className="h-4 w-4" />;
    case "virement": return <Banknote className="h-4 w-4" />;
    case "user": return <User className="h-4 w-4" />;
    default: return <FileText className="h-4 w-4" />;
  }
};

const getActionColor = (action: string) => {
  switch (action) {
    case "create": return "bg-primary/10 text-primary border-primary/20";
    case "validate": return "bg-success/10 text-success border-success/20";
    case "reject": return "bg-destructive/10 text-destructive border-destructive/20";
    case "submit": return "bg-secondary/10 text-secondary border-secondary/20";
    case "execute": return "bg-success/10 text-success border-success/20";
    case "cancel": return "bg-destructive/10 text-destructive border-destructive/20";
    case "import": return "bg-primary/10 text-primary border-primary/20";
    default: return "bg-muted text-muted-foreground";
  }
};

const getActionLabel = (action: string) => {
  const labels: Record<string, string> = {
    create: "Créé",
    update: "Modifié",
    validate: "Validé",
    reject: "Rejeté",
    submit: "Soumis",
    execute: "Exécuté",
    cancel: "Annulé",
    import: "Importé",
    sync: "Synchronisé",
    pay: "Payé",
  };
  return labels[action] || action;
};

interface RecentActivitiesPanelProps {
  maxItems?: number;
  showHeader?: boolean;
  showViewAll?: boolean;
}

export function RecentActivitiesPanel({ 
  maxItems = 10, 
  showHeader = true,
  showViewAll = true,
}: RecentActivitiesPanelProps) {
  const { data: groupedActivities, isLoading } = useRecentActivitiesEnhanced();

  if (isLoading) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Activités récentes
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasActivities = groupedActivities && Object.values(groupedActivities).some((g: EnhancedActivity[]) => g.length > 0);

  if (!hasActivities) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Activités récentes
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune activité récente</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Flatten and limit
  let count = 0;
  const limitedGroups: Partial<GroupedActivities> = {};
  const groupOrder: (keyof GroupedActivities)[] = ["Aujourd'hui", "Hier", "Cette semaine", "Plus ancien"];
  
  for (const group of groupOrder) {
    if (count >= maxItems) break;
    const activities = groupedActivities?.[group] || [];
    const remaining = maxItems - count;
    const limited = activities.slice(0, remaining);
    if (limited.length > 0) {
      limitedGroups[group] = limited;
      count += limited.length;
    }
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-secondary" />
            Activités récentes
          </CardTitle>
          {showViewAll && (
            <Link to="/admin/audit">
              <Button variant="ghost" size="sm" className="gap-1">
                Voir tout
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </CardHeader>
      )}
      <CardContent>
        <div className="space-y-4">
          {Object.entries(limitedGroups).map(([group, activities]) => (
            <div key={group}>
              <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                {group}
              </h4>
              <div className="space-y-2">
                {activities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityItem({ activity }: { activity: EnhancedActivity }) {
  const content = (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
      <div className="p-2 rounded-full bg-muted shrink-0">
        {getTypeIcon(activity.type)}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium leading-none truncate">
            {activity.title}
          </p>
          <Badge variant="outline" className={`text-xs ${getActionColor(activity.action)}`}>
            <span className="mr-1">{getActionIcon(activity.action)}</span>
            {getActionLabel(activity.action)}
          </Badge>
        </div>
        {activity.resume && (
          <p className="text-xs text-muted-foreground line-clamp-1">{activity.resume}</p>
        )}
        <p className="text-xs text-muted-foreground">{activity.timeAgo}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </div>
  );

  if (activity.link) {
    return <Link to={activity.link}>{content}</Link>;
  }
  return content;
}
