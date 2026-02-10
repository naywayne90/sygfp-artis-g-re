import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { usePendingTasks, usePendingTasksStats } from "@/hooks/usePendingTasks";
import { 
  ClipboardList, 
  FileText, 
  CreditCard, 
  Receipt, 
  FileCheck, 
  Banknote,
  ArrowRight,
  Clock,
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const getEntityIcon = (type: string) => {
  switch (type) {
    case "note": return FileText;
    case "engagement": return CreditCard;
    case "liquidation": return Receipt;
    case "ordonnancement": return FileCheck;
    case "virement": return Banknote;
    default: return FileText;
  }
};

const getEntityRoute = (type: string) => {
  switch (type) {
    case "note": return "/notes-aef";
    case "engagement": return "/engagements";
    case "liquidation": return "/liquidations";
    case "ordonnancement": return "/ordonnancements";
    case "virement": return "/planification/virements";
    default: return "/";
  }
};

const getEntityLabel = (type: string) => {
  switch (type) {
    case "note": return "Note";
    case "engagement": return "Engagement";
    case "liquidation": return "Liquidation";
    case "ordonnancement": return "Ordonnancement";
    case "virement": return "Virement";
    default: return type;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "soumis":
      return <Badge variant="outline" className="border-warning text-warning">À valider</Badge>;
    case "brouillon":
      return <Badge variant="outline" className="border-muted-foreground text-muted-foreground">Brouillon</Badge>;
    case "en_signature":
      return <Badge variant="outline" className="border-primary text-primary">En signature</Badge>;
    case "signe":
      return <Badge variant="outline" className="border-success text-success">Signé</Badge>;
    case "pending":
      return <Badge variant="outline" className="border-warning text-warning">En attente</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

interface PendingTasksPanelProps {
  maxItems?: number;
  showHeader?: boolean;
}

export function PendingTasksPanel({ maxItems = 10, showHeader = true }: PendingTasksPanelProps) {
  const { data: tasks, isLoading } = usePendingTasks();
  const { stats } = usePendingTasksStats();

  if (isLoading) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Tâches à traiter
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayedTasks = (tasks || []).slice(0, maxItems);

  if (displayedTasks.length === 0) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Tâches à traiter
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune tâche en attente</p>
            <p className="text-xs mt-1">Vous êtes à jour !</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Tâches à traiter
              <Badge variant="default">{stats.total}</Badge>
            </span>
            <div className="flex gap-1">
              {stats.notes > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {stats.notes} notes
                </Badge>
              )}
              {stats.engagements > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {stats.engagements} eng.
                </Badge>
              )}
              {stats.virements > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {stats.virements} vir.
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="space-y-2">
          {displayedTasks.map((task) => {
            const Icon = getEntityIcon(task.entity_type);
            const route = getEntityRoute(task.entity_type);
            
            return (
              <Link 
                key={`${task.entity_type}-${task.entity_id}`} 
                to={`${route}?id=${task.entity_id}`}
              >
                <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group">
                  <div className="p-2 rounded-full bg-primary/10 shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        {getEntityLabel(task.entity_type)}
                      </span>
                      <span className="text-sm font-medium truncate">
                        {task.entity_code}
                      </span>
                      {getStatusBadge(task.status)}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(task.created_at), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
