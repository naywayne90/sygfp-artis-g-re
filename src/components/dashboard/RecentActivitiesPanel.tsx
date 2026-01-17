import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRecentActivities, type Activity as EnhancedActivity, type GroupedActivities } from "@/hooks/useRecentActivities";
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
  FolderOpen,
  ClipboardList,
  PenTool,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
    case "impute": return <ClipboardList className="h-3 w-3" />;
    case "sign": return <PenTool className="h-3 w-3" />;
    case "defer": 
    case "differe": return <Clock className="h-3 w-3" />;
    default: return <FileText className="h-3 w-3" />;
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case "note":
    case "note_aef":
    case "note_sef": return <FileText className="h-4 w-4" />;
    case "engagement": return <CreditCard className="h-4 w-4" />;
    case "liquidation": return <Receipt className="h-4 w-4" />;
    case "ordonnancement": return <FileCheck className="h-4 w-4" />;
    case "marche": return <ShoppingCart className="h-4 w-4" />;
    case "prestataire": return <Users className="h-4 w-4" />;
    case "contrat": return <FileText className="h-4 w-4" />;
    case "virement": return <Banknote className="h-4 w-4" />;
    case "user": return <User className="h-4 w-4" />;
    case "dossier": return <FolderOpen className="h-4 w-4" />;
    case "expression_besoin": return <ClipboardList className="h-4 w-4" />;
    case "reglement": return <Banknote className="h-4 w-4" />;
    default: return <FileText className="h-4 w-4" />;
  }
};

const getActionColor = (action: string) => {
  switch (action) {
    case "create": return "bg-primary/10 text-primary border-primary/20";
    case "validate": return "bg-success/10 text-success border-success/20";
    case "reject": return "bg-destructive/10 text-destructive border-destructive/20";
    case "submit": return "bg-secondary/10 text-secondary-foreground border-secondary/20";
    case "execute": return "bg-success/10 text-success border-success/20";
    case "cancel": return "bg-destructive/10 text-destructive border-destructive/20";
    case "import": return "bg-primary/10 text-primary border-primary/20";
    case "defer":
    case "differe": return "bg-warning/10 text-warning border-warning/20";
    case "impute": return "bg-accent/50 text-accent-foreground border-accent/20";
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
    defer: "Différé",
    differe: "Différé",
    impute: "Imputé",
    sign: "Signé",
    archive: "Archivé",
  };
  return labels[action] || action;
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "note_aef": return "bg-blue-500";
    case "note_sef": return "bg-indigo-500";
    case "engagement": return "bg-purple-500";
    case "liquidation": return "bg-teal-500";
    case "ordonnancement": return "bg-orange-500";
    case "reglement": return "bg-green-500";
    case "marche": return "bg-pink-500";
    case "dossier": return "bg-cyan-500";
    default: return "bg-primary";
  }
};

interface RecentActivitiesPanelProps {
  maxItems?: number;
  showHeader?: boolean;
  showViewAll?: boolean;
}

export function RecentActivitiesPanel({ 
  maxItems = 15, 
  showHeader = true,
  showViewAll = true,
}: RecentActivitiesPanelProps) {
  const { data: groupedActivities, isLoading } = useRecentActivities();

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
                <Skeleton className="h-10 w-10 rounded-full" />
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
        <div className="space-y-5">
          {Object.entries(limitedGroups).map(([group, activities]) => (
            <div key={group}>
              <h4 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide flex items-center gap-2">
                <span className="h-px flex-1 bg-border"></span>
                {group}
                <span className="h-px flex-1 bg-border"></span>
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
  const initials = activity.userName 
    ? activity.userName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
    : "??";

  const content = (
    <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group border border-transparent hover:border-border">
      {/* Avatar avec icône du type */}
      <div className="relative">
        <Avatar className="h-9 w-9">
          <AvatarFallback className={`text-xs text-white ${getTypeColor(activity.type)}`}>
            {getTypeIcon(activity.type)}
          </AvatarFallback>
        </Avatar>
        <div className={`absolute -bottom-0.5 -right-0.5 p-0.5 rounded-full ${getActionColor(activity.action)} border border-background`}>
          {getActionIcon(activity.action)}
        </div>
      </div>
      
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium leading-none truncate max-w-[200px]">
            {activity.title}
          </p>
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getActionColor(activity.action)}`}>
            {getActionLabel(activity.action)}
          </Badge>
        </div>
        
        {activity.userName && (
          <p className="text-xs text-muted-foreground">
            par {activity.userName}
          </p>
        )}
        
        {activity.resume && (
          <p className="text-xs text-muted-foreground line-clamp-1 italic">{activity.resume}</p>
        )}
        
        <p className="text-[10px] text-muted-foreground/70">{activity.timeAgo}</p>
      </div>
      
      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
    </div>
  );

  if (activity.link) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link to={activity.link}>{content}</Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>Voir le détail</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  return content;
}
