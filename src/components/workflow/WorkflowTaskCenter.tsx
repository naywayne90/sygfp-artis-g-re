import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  useWorkflowTasks, 
  useWorkflowTasksStats, 
  type TaskFilters, 
  type WorkflowTask 
} from "@/hooks/useWorkflowTasks";
import { 
  ClipboardList, 
  FileText, 
  CreditCard, 
  Receipt, 
  FileCheck, 
  Banknote,
  ArrowRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Timer,
  Filter,
  User,
  Building2,
  Users,
  Eye,
  Play,
  Stamp,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow, isPast, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

// ============================================
// HELPERS
// ============================================

const getEntityIcon = (type: string) => {
  switch (type) {
    case "note_sef":
    case "note_aef":
      return FileText;
    case "engagement": return CreditCard;
    case "liquidation": return Receipt;
    case "ordonnancement": return FileCheck;
    case "reglement": return Banknote;
    case "virement": return Banknote;
    default: return FileText;
  }
};

const getTaskTypeIcon = (type: string) => {
  switch (type) {
    case "validation": return CheckCircle2;
    case "signature": return Stamp;
    case "paiement": return Wallet;
    case "approbation": return CheckCircle2;
    default: return ClipboardList;
  }
};

const getEntityRoute = (type: string): string => {
  switch (type) {
    case "note_sef": return "/notes-sef";
    case "note_aef": return "/notes-aef";
    case "engagement": return "/engagements";
    case "liquidation": return "/liquidations";
    case "ordonnancement": return "/ordonnancements";
    case "reglement": return "/reglements";
    case "virement": return "/planification/virements";
    default: return "/";
  }
};

const getEntityLabel = (type: string): string => {
  switch (type) {
    case "note_sef": return "Note SEF";
    case "note_aef": return "Note AEF";
    case "engagement": return "Engagement";
    case "liquidation": return "Liquidation";
    case "ordonnancement": return "Ordonnancement";
    case "reglement": return "Règlement";
    case "virement": return "Virement";
    default: return type;
  }
};

const getTaskTypeLabel = (type: string): string => {
  switch (type) {
    case "validation": return "À valider";
    case "correction": return "À corriger";
    case "signature": return "À signer";
    case "paiement": return "À payer";
    case "imputation": return "À imputer";
    case "approbation": return "À approuver";
    case "verification": return "À vérifier";
    default: return type;
  }
};

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case "urgente":
      return <Badge variant="destructive">Urgente</Badge>;
    case "haute":
      return <Badge className="bg-orange-500 hover:bg-orange-600">Haute</Badge>;
    case "normale":
      return <Badge variant="secondary">Normale</Badge>;
    case "basse":
      return <Badge variant="outline">Basse</Badge>;
    default:
      return <Badge variant="outline">{priority}</Badge>;
  }
};

const getSLABadge = (dueDate: string | null) => {
  if (!dueDate) return null;
  
  const due = new Date(dueDate);
  
  if (isPast(due)) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        En retard
      </Badge>
    );
  }
  
  if (isToday(due)) {
    return (
      <Badge className="bg-amber-500 hover:bg-amber-600 flex items-center gap-1">
        <Timer className="h-3 w-3" />
        Aujourd'hui
      </Badge>
    );
  }
  
  return (
    <Badge variant="outline" className="flex items-center gap-1 text-muted-foreground">
      <Clock className="h-3 w-3" />
      {formatDistanceToNow(due, { addSuffix: true, locale: fr })}
    </Badge>
  );
};

// ============================================
// STATS HEADER
// ============================================

function TaskStatsHeader() {
  const { data: stats, isLoading } = useWorkflowTasksStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Array(4).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card className="bg-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <ClipboardList className="h-8 w-8 text-primary opacity-20" />
          </div>
        </CardContent>
      </Card>
      
      <Card className={cn("bg-card", stats.overdue > 0 && "border-destructive")}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">En retard</p>
              <p className={cn("text-2xl font-bold", stats.overdue > 0 && "text-destructive")}>
                {stats.overdue}
              </p>
            </div>
            <AlertTriangle className={cn("h-8 w-8 opacity-20", stats.overdue > 0 ? "text-destructive" : "text-muted")} />
          </div>
        </CardContent>
      </Card>
      
      <Card className={cn("bg-card", stats.today > 0 && "border-amber-500")}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Aujourd'hui</p>
              <p className={cn("text-2xl font-bold", stats.today > 0 && "text-amber-600")}>
                {stats.today}
              </p>
            </div>
            <Timer className={cn("h-8 w-8 opacity-20", stats.today > 0 ? "text-amber-500" : "text-muted")} />
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Validations</p>
              <p className="text-2xl font-bold">{stats.byType.validation}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-success opacity-20" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// FILTERS BAR
// ============================================

interface FiltersBarProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
}

function FiltersBar({ filters, onFiltersChange }: FiltersBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4 p-4 bg-muted/30 rounded-lg">
      <Filter className="h-4 w-4 text-muted-foreground" />
      
      <Select 
        value={filters.scope} 
        onValueChange={(v) => onFiltersChange({ ...filters, scope: v as TaskFilters['scope'] })}
      >
        <SelectTrigger className="w-[160px] bg-background">
          <SelectValue placeholder="Périmètre" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="mine">
            <span className="flex items-center gap-2">
              <User className="h-4 w-4" /> À moi
            </span>
          </SelectItem>
          <SelectItem value="my_role">
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" /> Mon rôle
            </span>
          </SelectItem>
          <SelectItem value="my_direction">
            <span className="flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Ma direction
            </span>
          </SelectItem>
          <SelectItem value="all">
            <span className="flex items-center gap-2">
              <Eye className="h-4 w-4" /> Tout
            </span>
          </SelectItem>
        </SelectContent>
      </Select>

      <Select 
        value={filters.sla || 'all'} 
        onValueChange={(v) => onFiltersChange({ ...filters, sla: v as TaskFilters['sla'] })}
      >
        <SelectTrigger className="w-[140px] bg-background">
          <SelectValue placeholder="Délai" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous délais</SelectItem>
          <SelectItem value="overdue">En retard</SelectItem>
          <SelectItem value="today">Aujourd'hui</SelectItem>
          <SelectItem value="upcoming">À venir</SelectItem>
        </SelectContent>
      </Select>

      <Select 
        value={filters.entity_type || 'all'} 
        onValueChange={(v) => onFiltersChange({ ...filters, entity_type: v })}
      >
        <SelectTrigger className="w-[160px] bg-background">
          <SelectValue placeholder="Type entité" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes entités</SelectItem>
          <SelectItem value="note_sef">Notes SEF</SelectItem>
          <SelectItem value="note_aef">Notes AEF</SelectItem>
          <SelectItem value="engagement">Engagements</SelectItem>
          <SelectItem value="liquidation">Liquidations</SelectItem>
          <SelectItem value="ordonnancement">Ordonnancements</SelectItem>
          <SelectItem value="reglement">Règlements</SelectItem>
          <SelectItem value="virement">Virements</SelectItem>
        </SelectContent>
      </Select>

      <Select 
        value={filters.priority || 'all'} 
        onValueChange={(v) => onFiltersChange({ ...filters, priority: v })}
      >
        <SelectTrigger className="w-[130px] bg-background">
          <SelectValue placeholder="Priorité" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes</SelectItem>
          <SelectItem value="urgente">Urgente</SelectItem>
          <SelectItem value="haute">Haute</SelectItem>
          <SelectItem value="normale">Normale</SelectItem>
          <SelectItem value="basse">Basse</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

// ============================================
// TASK ITEM
// ============================================

interface TaskItemProps {
  task: WorkflowTask;
  onTake: (taskId: string) => void;
  isTaking: boolean;
}

function TaskItem({ task, onTake, isTaking }: TaskItemProps) {
  const EntityIcon = getEntityIcon(task.entity_type);
  const TaskTypeIcon = getTaskTypeIcon(task.task_type);
  const route = getEntityRoute(task.entity_type);

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:shadow-md transition-all group">
      {/* Entity Icon */}
      <div className="p-3 rounded-full bg-primary/10 shrink-0">
        <EntityIcon className="h-5 w-5 text-primary" />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <Badge variant="outline" className="flex items-center gap-1">
            <TaskTypeIcon className="h-3 w-3" />
            {getTaskTypeLabel(task.task_type)}
          </Badge>
          <span className="text-sm font-medium text-muted-foreground">
            {getEntityLabel(task.entity_type)}
          </span>
          <span className="font-semibold">{task.entity_code}</span>
          {getPriorityBadge(task.priority)}
        </div>
        
        {task.entity_title && (
          <p className="text-sm text-muted-foreground truncate mb-1">
            {task.entity_title}
          </p>
        )}
        
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {task.montant && (
            <span className="font-medium text-foreground">
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(task.montant)}
            </span>
          )}
          {task.direction && (
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {task.direction.code}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(task.created_at), { addSuffix: true, locale: fr })}
          </span>
        </div>
      </div>
      
      {/* SLA Badge */}
      <div className="shrink-0">
        {getSLABadge(task.due_date)}
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {task.status === 'open' && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              onTake(task.id);
            }}
            disabled={isTaking}
          >
            <Play className="h-4 w-4 mr-1" />
            Prendre
          </Button>
        )}
        <Link to={`${route}?id=${task.entity_id}`}>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4 mr-1" />
            Ouvrir
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function WorkflowTaskCenter() {
  const [filters, setFilters] = useState<TaskFilters>({
    scope: 'my_role',
    status: 'open',
    sla: 'all',
    entity_type: 'all',
    priority: 'all',
  });

  const { tasks, isLoading, takeTask, isTaking } = useWorkflowTasks(filters);

  return (
    <div className="space-y-6">
      <TaskStatsHeader />
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Centre de travail
            <Badge variant="default">{tasks.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs 
            value={filters.status} 
            onValueChange={(v) => setFilters({ ...filters, status: v as TaskFilters['status'] })}
          >
            <TabsList className="mb-4">
              <TabsTrigger value="open">En cours</TabsTrigger>
              <TabsTrigger value="done">Terminées</TabsTrigger>
              <TabsTrigger value="all">Toutes</TabsTrigger>
            </TabsList>
            
            <FiltersBar filters={filters} onFiltersChange={setFilters} />
            
            <TabsContent value={filters.status} className="mt-0">
              {isLoading ? (
                <div className="space-y-3">
                  {Array(5).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-lg font-medium">Aucune tâche</p>
                  <p className="text-sm">
                    {filters.status === 'open' 
                      ? "Vous êtes à jour ! Aucune tâche en attente."
                      : "Aucune tâche correspondant aux filtres."
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <TaskItem 
                      key={task.id} 
                      task={task} 
                      onTake={takeTask}
                      isTaking={isTaking}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
