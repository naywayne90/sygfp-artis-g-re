import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAlerts, useDashboardAlertsAggregated, type Alert } from "@/hooks/useAlerts";
import { 
  AlertTriangle, 
  AlertCircle, 
  Search,
  CheckCircle,
  Clock,
  FileWarning,
  TrendingUp,
  Calendar,
  Users,
  FileX,
  Banknote,
  ArrowRight,
  Filter,
  Bell,
} from "lucide-react";
import { Link } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const getAlertIcon = (type: string) => {
  switch (type) {
    case "depassement":
    case "budget_depassement":
      return TrendingUp;
    case "retard":
    case "retard_paiement":
      return Clock;
    case "echeance":
    case "contrat_echeance":
      return Calendar;
    case "piece_manquante":
    case "document_manquant":
      return FileWarning;
    case "document_expire":
      return FileX;
    case "virement_attente":
      return Banknote;
    case "prestataire_expire":
      return Users;
    case "seuil":
    case "budget_seuil":
      return AlertCircle;
    default:
      return AlertTriangle;
  }
};

const getAlertColor = (severity: "critical" | "warning" | "info") => {
  switch (severity) {
    case "critical":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "warning":
      return "bg-warning/10 text-warning border-warning/20";
    case "info":
      return "bg-primary/10 text-primary border-primary/20";
  }
};

const getSeverityBadge = (severity: "critical" | "warning" | "info") => {
  switch (severity) {
    case "critical":
      return <Badge variant="destructive">Critique</Badge>;
    case "warning":
      return <Badge variant="outline" className="border-warning text-warning">Attention</Badge>;
    case "info":
      return <Badge variant="secondary">Info</Badge>;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "open":
      return <Badge variant="outline" className="border-destructive/50 text-destructive">Ouverte</Badge>;
    case "acknowledged":
      return <Badge variant="outline" className="border-warning/50 text-warning">Prise en compte</Badge>;
    case "resolved":
      return <Badge variant="outline" className="border-success/50 text-success">Résolue</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getAlertLink = (alert: Alert): string | undefined => {
  switch (alert.entity_table) {
    case "budget_lines":
      return `/planification/budget`;
    case "budget_engagements":
      return `/engagements`;
    case "budget_liquidations":
      return `/liquidations`;
    case "ordonnancements":
      return `/ordonnancements`;
    case "credit_transfers":
      return `/planification/virements`;
    case "supplier_documents":
    case "prestataires":
      return `/contractualisation/prestataires`;
    case "contrats":
      return `/contractualisation/contrats`;
    default:
      return undefined;
  }
};

export default function Alertes() {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [resolveComment, setResolveComment] = useState("");

  const { data: alerts, isLoading } = useDashboardAlertsAggregated();
  const { resolveAlert, acknowledgeAlert, isResolving, stats } = useAlerts();

  // Filter alerts
  const filteredAlerts = alerts?.filter((alert) => {
    if (search) {
      const searchLower = search.toLowerCase();
      if (!alert.title.toLowerCase().includes(searchLower) &&
          !alert.description?.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    if (severityFilter !== "all" && alert.severity !== severityFilter) {
      return false;
    }
    if (statusFilter !== "all" && alert.status !== statusFilter) {
      return false;
    }
    return true;
  }) || [];

  const handleResolve = () => {
    if (selectedAlert) {
      resolveAlert({ alertId: selectedAlert.id, comment: resolveComment });
      setResolveDialogOpen(false);
      setSelectedAlert(null);
      setResolveComment("");
    }
  };

  const openResolveDialog = (alert: Alert) => {
    setSelectedAlert(alert);
    setResolveDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Bell className="h-6 w-6" />
          Centre d'alertes
        </h1>
        <p className="page-description">
          Suivi des alertes et anomalies détectées dans le système
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className={stats.critical > 0 ? "border-destructive/50" : ""}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.critical}</p>
                <p className="text-sm text-muted-foreground">Critiques</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={stats.warning > 0 ? "border-warning/50" : ""}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-warning/10">
                <AlertCircle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.warning}</p>
                <p className="text-sm text-muted-foreground">Attention</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.open}</p>
                <p className="text-sm text-muted-foreground">Ouvertes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-success/10">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total - stats.open}</p>
                <p className="text-sm text-muted-foreground">Résolues</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sévérité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="critical">Critique</SelectItem>
                <SelectItem value="warning">Attention</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="open">Ouverte</SelectItem>
                <SelectItem value="acknowledged">Prise en compte</SelectItem>
                <SelectItem value="resolved">Résolue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Alertes ({filteredAlerts.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success opacity-50" />
              <p>Aucune alerte correspondante</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => {
                const Icon = getAlertIcon(alert.type);
                const link = getAlertLink(alert);
                
                return (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border ${getAlertColor(alert.severity)}`}
                  >
                    <div className="p-2 rounded-full bg-background/50 shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-medium">{alert.title}</p>
                        {getSeverityBadge(alert.severity)}
                        {getStatusBadge(alert.status)}
                      </div>
                      {alert.description && (
                        <p className="text-sm opacity-80 mb-2">{alert.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: fr })}
                        </span>
                        {alert.owner_role && (
                          <span>Responsable : {alert.owner_role}</span>
                        )}
                        {alert.module && (
                          <span>Module : {alert.module}</span>
                        )}
                      </div>
                      {alert.resolution_comment && (
                        <div className="mt-2 p-2 bg-success/5 rounded text-sm">
                          <strong>Résolution :</strong> {alert.resolution_comment}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      {link && (
                        <Link to={link}>
                          <Button variant="outline" size="sm" className="gap-1">
                            Voir
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                      {alert.status === "open" && !alert.auto_generated && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => acknowledgeAlert(alert.id)}
                          >
                            Prendre en compte
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => openResolveDialog(alert)}
                          >
                            Résoudre
                          </Button>
                        </>
                      )}
                      {alert.status === "acknowledged" && !alert.auto_generated && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => openResolveDialog(alert)}
                        >
                          Résoudre
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Résoudre l'alerte</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              {selectedAlert?.title}
            </p>
            <Textarea
              placeholder="Commentaire de résolution (optionnel)..."
              value={resolveComment}
              onChange={(e) => setResolveComment(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleResolve} disabled={isResolving}>
              {isResolving ? "Résolution..." : "Marquer comme résolu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
