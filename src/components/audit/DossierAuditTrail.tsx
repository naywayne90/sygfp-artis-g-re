/**
 * DossierAuditTrail - Composant pour reconstruire l'historique complet d'un dossier
 *
 * Affiche la traçabilité complète avec:
 * - Timeline des événements
 * - Preuves de validation avec QR
 * - Filtres par type d'action
 * - Export de l'historique
 */

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  History,
  Shield,
  Filter,
  Download,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  ArrowRight,
  QrCode,
  User,
  Calendar,
  Fingerprint,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { ValidationProof, DossierHistoryTimeline } from "./ValidationProof";
import { ValidationSignature, WorkflowStep, AuditEventStandard } from "@/hooks/useAuditTrail";

// ============================================
// TYPES
// ============================================

interface DossierAuditTrailProps {
  dossierId: string;
  dossierRef: string;
  className?: string;
}

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  userName: string;
  userRole: string;
  timestamp: string;
  step?: WorkflowStep;
  dossierRef?: string;
  reason?: string;
  justification?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  signatureData?: ValidationSignature;
}

// ============================================
// CONSTANTS
// ============================================

const ACTION_FILTERS = [
  { value: "all", label: "Toutes les actions" },
  { value: "CREATE", label: "Créations" },
  { value: "UPDATE", label: "Modifications" },
  { value: "SUBMIT", label: "Soumissions" },
  { value: "VALIDATE", label: "Validations" },
  { value: "REJECT", label: "Rejets" },
  { value: "SIGN", label: "Signatures" },
  { value: "RENVOI", label: "Renvois" },
];

const STEP_LABELS: Record<string, string> = {
  creation: "Création",
  note_sef: "Note SEF",
  note_aef: "Note AEF",
  imputation: "Imputation",
  expression_besoin: "Expression de Besoin",
  passation_marche: "Passation Marché",
  engagement: "Engagement",
  liquidation: "Liquidation",
  ordonnancement: "Ordonnancement",
  reglement: "Règlement",
  cloture: "Clôture",
};

// ============================================
// MAIN COMPONENT
// ============================================

export function DossierAuditTrail({
  dossierId,
  dossierRef,
  className,
}: DossierAuditTrailProps) {
  const [actionFilter, setActionFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all audit entries for this dossier
  const { data: auditEntries = [], isLoading } = useQuery({
    queryKey: ["dossier-audit-trail", dossierId, dossierRef],
    queryFn: async () => {
      const entries: AuditEntry[] = [];

      // 1. Get dossier direct logs
      const { data: dossierLogs } = await supabase
        .from("audit_logs")
        .select(`
          *,
          user:profiles!audit_logs_user_id_fkey(full_name, profil_fonctionnel, role_hierarchique)
        `)
        .eq("entity_type", "dossier")
        .eq("entity_id", dossierId)
        .order("created_at", { ascending: true });

      // 2. Get logs with dossier_ref in new_values
      const { data: refLogs } = await supabase
        .from("audit_logs")
        .select(`
          *,
          user:profiles!audit_logs_user_id_fkey(full_name, profil_fonctionnel, role_hierarchique)
        `)
        .or(`new_values->>dossier_ref.eq.${dossierRef},new_values->_audit_standard->>dossierRef.eq.${dossierRef}`)
        .order("created_at", { ascending: true });

      // 3. Get related entity logs (notes_sef, engagements, liquidations, etc.)
      const relatedEntities = [
        "note_sef", "note_aef", "imputation", "expression_besoin",
        "engagement", "liquidation", "ordonnancement", "reglement"
      ];

      for (const entityType of relatedEntities) {
        const { data: entityLogs } = await supabase
          .from("audit_logs")
          .select(`
            *,
            user:profiles!audit_logs_user_id_fkey(full_name, profil_fonctionnel, role_hierarchique)
          `)
          .eq("entity_type", entityType)
          .order("created_at", { ascending: true });

        // Filter by dossier relationship
        const relatedLogs = (entityLogs || []).filter(log => {
          const newValues = log.new_values as Record<string, unknown> | null;
          return newValues?.dossier_id === dossierId ||
                 newValues?.dossier_ref === dossierRef ||
                 (newValues?._audit_standard as any)?.dossierRef === dossierRef;
        });

        entries.push(...relatedLogs.map(parseLogEntry));
      }

      // Combine and deduplicate
      const allLogs = [...(dossierLogs || []), ...(refLogs || [])];
      const uniqueIds = new Set<string>();
      const uniqueEntries: AuditEntry[] = [];

      for (const log of allLogs) {
        if (!uniqueIds.has(log.id)) {
          uniqueIds.add(log.id);
          uniqueEntries.push(parseLogEntry(log));
        }
      }

      // Add related entries
      for (const entry of entries) {
        if (!uniqueIds.has(entry.id)) {
          uniqueIds.add(entry.id);
          uniqueEntries.push(entry);
        }
      }

      // Sort by timestamp
      return uniqueEntries.sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    },
    enabled: !!dossierId || !!dossierRef,
  });

  // Parse log entry to standard format
  function parseLogEntry(log: any): AuditEntry {
    const newValues = log.new_values as Record<string, unknown> | null;
    const auditStandard = newValues?._audit_standard as AuditEventStandard | undefined;

    return {
      id: log.id,
      action: log.action,
      entityType: log.entity_type,
      entityId: log.entity_id || "",
      userId: log.user_id || "",
      userName: auditStandard?.userName || (log.user as any)?.full_name || "Système",
      userRole: auditStandard?.userRole || (log.user as any)?.profil_fonctionnel || "User",
      timestamp: log.created_at,
      step: auditStandard?.step || newValues?.step as WorkflowStep | undefined,
      dossierRef: auditStandard?.dossierRef || newValues?.dossier_ref as string | undefined,
      reason: auditStandard?.reason || newValues?.reason as string | undefined,
      justification: auditStandard?.justification || newValues?.justification as string | undefined,
      oldValues: log.old_values as Record<string, unknown> | undefined,
      newValues: newValues as Record<string, unknown> | undefined,
      signatureData: auditStandard?.signatureData,
    };
  }

  // Extract validation signatures
  const validationSignatures = useMemo(() => {
    return auditEntries
      .filter(e => e.signatureData)
      .map(e => e.signatureData!)
      .filter((sig, index, self) =>
        self.findIndex(s => s.hash === sig.hash) === index
      );
  }, [auditEntries]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return auditEntries.filter(entry => {
      // Action filter
      if (actionFilter !== "all" && entry.action !== actionFilter) {
        return false;
      }

      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          entry.userName.toLowerCase().includes(search) ||
          entry.action.toLowerCase().includes(search) ||
          entry.entityType.toLowerCase().includes(search) ||
          (entry.step && STEP_LABELS[entry.step]?.toLowerCase().includes(search))
        );
      }

      return true;
    });
  }, [auditEntries, actionFilter, searchTerm]);

  // Export history to CSV
  const exportHistory = () => {
    const headers = ["Date", "Action", "Étape", "Utilisateur", "Rôle", "Détails"];
    const rows = filteredEntries.map(entry => [
      format(new Date(entry.timestamp), "dd/MM/yyyy HH:mm:ss"),
      entry.action,
      entry.step ? STEP_LABELS[entry.step] || entry.step : "-",
      entry.userName,
      entry.userRole,
      entry.reason || entry.justification || "-",
    ]);

    const csv = [headers, ...rows].map(row => row.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `audit_${dossierRef}_${format(new Date(), "yyyyMMdd")}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="py-8 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timeline" className="gap-2">
            <History className="h-4 w-4" />
            Historique
          </TabsTrigger>
          <TabsTrigger value="validations" className="gap-2">
            <Shield className="h-4 w-4" />
            Validations ({validationSignatures.length})
          </TabsTrigger>
          <TabsTrigger value="signatures" className="gap-2">
            <QrCode className="h-4 w-4" />
            Preuves QR
          </TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTION_FILTERS.map(filter => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportHistory}>
              <Download className="mr-2 h-4 w-4" />
              Exporter
            </Button>
          </div>

          {/* Timeline */}
          <DossierHistoryTimeline
            dossierRef={dossierRef}
            history={filteredEntries.map(e => ({
              action: e.action,
              entityType: e.entityType,
              userName: e.userName,
              userRole: e.userRole,
              timestamp: e.timestamp,
              step: e.step,
              signatureData: e.signatureData,
              reason: e.reason,
              justification: e.justification,
            }))}
          />

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{auditEntries.length}</p>
                <p className="text-xs text-muted-foreground">Total événements</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {auditEntries.filter(e => e.action === "VALIDATE").length}
                </p>
                <p className="text-xs text-muted-foreground">Validations</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {validationSignatures.length}
                </p>
                <p className="text-xs text-muted-foreground">Signatures QR</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {auditEntries.filter(e => e.action === "REJECT" || e.action === "RENVOI").length}
                </p>
                <p className="text-xs text-muted-foreground">Rejets/Renvois</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Validations Tab */}
        <TabsContent value="validations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Chaîne de validations
              </CardTitle>
              <CardDescription>
                Toutes les validations enregistrées pour ce dossier
              </CardDescription>
            </CardHeader>
            <CardContent>
              {validationSignatures.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Aucune validation signée enregistrée</p>
                </div>
              ) : (
                <ValidationProof
                  signatures={validationSignatures}
                  dossierRef={dossierRef}
                  title=""
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* QR Signatures Tab */}
        <TabsContent value="signatures">
          <ValidationProof
            signatures={validationSignatures}
            dossierRef={dossierRef}
            title="Preuves de validation avec QR Code"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default DossierAuditTrail;
