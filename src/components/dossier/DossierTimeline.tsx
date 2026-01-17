import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  History,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  User,
  Calendar,
  ArrowRight,
  Upload,
  Edit,
  Eye,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TimelineEvent {
  id: string;
  type: "audit" | "etape" | "document" | "validation";
  timestamp: string;
  action: string;
  entityType: string;
  entityId?: string;
  entityCode?: string;
  user?: { full_name: string | null; email?: string } | null;
  oldValues?: any;
  newValues?: any;
  details?: string;
  status?: "success" | "error" | "warning" | "info" | "pending";
}

interface DossierTimelineProps {
  dossierId: string;
  entityType?: string; // Pour filtrer par type d'entité (engagement, liquidation, etc.)
  entityId?: string;
  maxItems?: number;
  showFilters?: boolean;
  compact?: boolean;
}

const EVENT_ICONS: Record<string, any> = {
  CREATE: FileText,
  UPDATE: Edit,
  DELETE: XCircle,
  VALIDATE: CheckCircle2,
  REJECT: XCircle,
  SUBMIT: ArrowRight,
  DEFER: Clock,
  RESUME: RefreshCw,
  IMPUTE: ArrowRight,
  SIGN: Edit,
  EXECUTE: CheckCircle2,
  UPLOAD: Upload,
  VIEW: Eye,
};

const EVENT_COLORS: Record<string, string> = {
  CREATE: "bg-blue-500",
  UPDATE: "bg-amber-500",
  DELETE: "bg-destructive",
  VALIDATE: "bg-success",
  REJECT: "bg-destructive",
  SUBMIT: "bg-secondary",
  DEFER: "bg-warning",
  RESUME: "bg-blue-500",
  IMPUTE: "bg-purple-500",
  SIGN: "bg-indigo-500",
  EXECUTE: "bg-success",
  UPLOAD: "bg-cyan-500",
};

const ENTITY_LABELS: Record<string, string> = {
  engagement: "Engagement",
  liquidation: "Liquidation",
  ordonnancement: "Ordonnancement",
  reglement: "Règlement",
  note_sef: "Note SEF",
  note_dg: "Note AEF",
  expression_besoin: "Expression de besoin",
  marche: "Marché",
  imputation: "Imputation",
  dossier: "Dossier",
  document: "Document",
};

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Création",
  UPDATE: "Modification",
  DELETE: "Suppression",
  VALIDATE: "Validation",
  REJECT: "Rejet",
  SUBMIT: "Soumission",
  DEFER: "Report",
  RESUME: "Reprise",
  IMPUTE: "Imputation",
  SIGN: "Signature",
  EXECUTE: "Exécution",
  UPLOAD: "Upload document",
  UPDATE_LOCKED_FIELD: "Modification champ verrouillé",
  SERVICE_FAIT: "Certification service fait",
  CONTROLE_SDCT: "Contrôle SDCT",
  VALIDATION_DG: "Validation DG",
};

export function DossierTimeline({
  dossierId,
  entityType,
  entityId,
  maxItems = 50,
  showFilters = true,
  compact = false,
}: DossierTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    loadTimeline();
  }, [dossierId, entityType, entityId, filterType, filterAction]);

  const loadTimeline = async () => {
    setLoading(true);
    try {
      // Charger les événements d'audit liés au dossier
      let query = supabase
        .from("audit_logs")
        .select(`
          id,
          action,
          entity_type,
          entity_id,
          old_values,
          new_values,
          created_at,
          user:profiles!audit_logs_user_id_fkey(full_name, email)
        `)
        .order("created_at", { ascending: false })
        .limit(maxItems);

      // Filtrer par dossier - on cherche dans les entités liées
      // On va d'abord chercher les IDs des entités liées au dossier
      const { data: etapes } = await supabase
        .from("dossier_etapes")
        .select("id, type_etape, statut, montant, created_at")
        .eq("dossier_id", dossierId);

      const entityIds = [dossierId];
      entityIds.push(dossierId); // Ajouter le dossier lui-même

      if (entityType && entityId) {
        query = query.eq("entity_type", entityType).eq("entity_id", entityId);
      } else if (entityIds.length > 0) {
        query = query.in("entity_id", entityIds);
      }

      if (filterType !== "all") {
        query = query.eq("entity_type", filterType);
      }

      if (filterAction !== "all") {
        query = query.eq("action", filterAction);
      }

      const { data: auditData, error } = await query;

      if (error) throw error;

      // Transformer en événements timeline
      const timelineEvents: TimelineEvent[] = (auditData || []).map((log) => ({
        id: log.id,
        type: "audit",
        timestamp: log.created_at,
        action: log.action,
        entityType: log.entity_type,
        entityId: log.entity_id,
        user: log.user,
        oldValues: log.old_values,
        newValues: log.new_values,
        status: getStatusFromAction(log.action),
      }));

      // Ajouter les étapes du dossier
      if (!entityType && etapes) {
        for (const etape of etapes) {
          timelineEvents.push({
            id: `etape-${etape.id}`,
            type: "etape",
            timestamp: etape.created_at,
            action: "CREATE",
            entityType: etape.type_etape,
            entityId: etape.id,
            details: `Statut: ${etape.statut}`,
            status: getStatusFromStatut(etape.statut || ""),
          });
        }
      }

      // Trier par date décroissante
      timelineEvents.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // Dédupliquer
      const uniqueEvents = timelineEvents.filter(
        (event, index, self) =>
          index === self.findIndex((e) => e.id === event.id)
      );

      setEvents(uniqueEvents.slice(0, maxItems));
    } catch (error) {
      console.error("Erreur chargement timeline:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTableFromType = (type: string): string | null => {
    const tables: Record<string, string> = {
      engagement: "budget_engagements",
      liquidation: "budget_liquidations",
      ordonnancement: "ordonnancements",
      reglement: "reglements",
      note_sef: "notes_sef",
      note_dg: "notes_dg",
      expression_besoin: "expressions_besoin",
      marche: "marches",
    };
    return tables[type] || null;
  };

  const getStatusFromAction = (action: string): TimelineEvent["status"] => {
    if (["VALIDATE", "EXECUTE", "SIGN"].includes(action)) return "success";
    if (["REJECT", "DELETE"].includes(action)) return "error";
    if (["DEFER"].includes(action)) return "warning";
    if (["SUBMIT"].includes(action)) return "info";
    return "pending";
  };

  const getStatusFromStatut = (statut: string): TimelineEvent["status"] => {
    if (["valide", "termine", "execute"].includes(statut)) return "success";
    if (["rejete", "annule"].includes(statut)) return "error";
    if (["differe", "suspendu"].includes(statut)) return "warning";
    if (["soumis", "en_validation"].includes(statut)) return "info";
    return "pending";
  };

  const getEventIcon = (action: string) => {
    const Icon = EVENT_ICONS[action] || AlertCircle;
    return Icon;
  };

  const getEventColor = (action: string, status?: TimelineEvent["status"]) => {
    if (status === "success") return "bg-success";
    if (status === "error") return "bg-destructive";
    if (status === "warning") return "bg-warning";
    if (status === "info") return "bg-secondary";
    return EVENT_COLORS[action] || "bg-muted-foreground";
  };

  const formatChanges = (oldValues: any, newValues: any) => {
    if (!oldValues && !newValues) return null;
    
    const changes: string[] = [];
    const newVals = typeof newValues === 'object' ? newValues : {};
    const oldVals = typeof oldValues === 'object' ? oldValues : {};

    // Exclure les champs internes
    const excludeFields = ['_timestamp', '_action_type', 'updated_at'];

    for (const key of Object.keys(newVals)) {
      if (excludeFields.includes(key)) continue;
      if (oldVals[key] !== undefined && oldVals[key] !== newVals[key]) {
        changes.push(`${key}: ${oldVals[key]} → ${newVals[key]}`);
      } else if (oldVals[key] === undefined && newVals[key] !== undefined) {
        changes.push(`${key}: ${newVals[key]}`);
      }
    }

    return changes.length > 0 ? changes : null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="h-4 w-4" />
            Timeline du dossier
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2 flex-1">
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

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle 
            className="text-sm flex items-center gap-2 cursor-pointer"
            onClick={() => setExpanded(!expanded)}
          >
            <History className="h-4 w-4" />
            Timeline du dossier
            <Badge variant="outline" className="ml-2">{events.length}</Badge>
            {compact && (
              expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
            )}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={loadTimeline}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {showFilters && expanded && (
          <div className="flex gap-2 mt-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="engagement">Engagement</SelectItem>
                <SelectItem value="liquidation">Liquidation</SelectItem>
                <SelectItem value="ordonnancement">Ordonnancement</SelectItem>
                <SelectItem value="reglement">Règlement</SelectItem>
                <SelectItem value="document">Document</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes actions</SelectItem>
                <SelectItem value="CREATE">Création</SelectItem>
                <SelectItem value="VALIDATE">Validation</SelectItem>
                <SelectItem value="REJECT">Rejet</SelectItem>
                <SelectItem value="SUBMIT">Soumission</SelectItem>
                <SelectItem value="UPDATE">Modification</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardHeader>

      {expanded && (
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucun événement trouvé</p>
            </div>
          ) : (
            <ScrollArea className={compact ? "h-[200px]" : "h-[400px]"}>
              <div className="relative pl-6 space-y-4">
                {/* Ligne verticale */}
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />

                {events.map((event, index) => {
                  const Icon = getEventIcon(event.action);
                  const color = getEventColor(event.action, event.status);
                  const changes = formatChanges(event.oldValues, event.newValues);

                  return (
                    <div key={event.id} className="relative flex gap-3">
                      {/* Point sur la timeline */}
                      <div className={cn(
                        "absolute -left-6 w-6 h-6 rounded-full flex items-center justify-center",
                        color
                      )}>
                        <Icon className="h-3 w-3 text-white" />
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0 pb-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {ENTITY_LABELS[event.entityType] || event.entityType}
                              </Badge>
                              <span className="font-medium text-sm">
                                {ACTION_LABELS[event.action] || event.action}
                              </span>
                              {event.entityCode && (
                                <span className="text-xs font-mono text-muted-foreground">
                                  {event.entityCode}
                                </span>
                              )}
                            </div>

                            {event.user && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <User className="h-3 w-3" />
                                {event.user.full_name || event.user.email || "Utilisateur"}
                              </div>
                            )}

                            {event.details && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {event.details}
                              </p>
                            )}

                            {changes && !compact && (
                              <div className="mt-2 p-2 bg-muted rounded text-xs space-y-1">
                                {changes.slice(0, 3).map((change, i) => (
                                  <div key={i} className="text-muted-foreground">
                                    {change}
                                  </div>
                                ))}
                                {changes.length > 3 && (
                                  <div className="text-muted-foreground italic">
                                    +{changes.length - 3} autres modifications
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(event.timestamp), "dd/MM HH:mm", { locale: fr })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      )}
    </Card>
  );
}
