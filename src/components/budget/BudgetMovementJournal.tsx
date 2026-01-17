import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  Search,
  Download,
  RefreshCw,
  History,
} from "lucide-react";
import { toast } from "sonner";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
};

const EVENT_TYPE_LABELS: Record<string, { label: string; color: string; icon: typeof TrendingUp }> = {
  virement_sortant: { label: "Virement sortant", color: "text-red-600", icon: TrendingDown },
  virement_entrant: { label: "Virement entrant", color: "text-green-600", icon: TrendingUp },
  ajustement_positif: { label: "Ajustement +", color: "text-green-600", icon: TrendingUp },
  ajustement_negatif: { label: "Ajustement -", color: "text-red-600", icon: TrendingDown },
  engagement: { label: "Engagement", color: "text-orange-600", icon: TrendingDown },
  liquidation: { label: "Liquidation", color: "text-blue-600", icon: TrendingDown },
  ordonnancement: { label: "Ordonnancement", color: "text-purple-600", icon: TrendingDown },
  paiement: { label: "Paiement", color: "text-green-600", icon: TrendingDown },
  annulation: { label: "Annulation", color: "text-gray-600", icon: TrendingUp },
  import: { label: "Import", color: "text-primary", icon: TrendingUp },
};

interface BudgetMovement {
  id: string;
  budget_line_id: string;
  event_type: string;
  delta: number;
  dotation_avant: number | null;
  dotation_apres: number | null;
  disponible_avant: number | null;
  disponible_apres: number | null;
  ref_code: string | null;
  ref_id: string | null;
  commentaire: string | null;
  created_by: string | null;
  created_at: string;
  budget_line?: { code: string; label: string };
  created_by_profile?: { full_name: string };
}

export function BudgetMovementJournal() {
  const { exercice } = useExercice();
  const [searchTerm, setSearchTerm] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");

  const { data: movements = [], isLoading, refetch } = useQuery({
    queryKey: ["budget-movements-journal", exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budget_history")
        .select(`
          *,
          budget_line:budget_lines!budget_history_budget_line_id_fkey(code, label),
          created_by_profile:profiles!budget_history_created_by_fkey(full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;
      return data as BudgetMovement[];
    },
    enabled: !!exercice,
  });

  // Filtered movements
  const filteredMovements = movements.filter((m) => {
    const matchesSearch =
      !searchTerm ||
      m.budget_line?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.ref_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.commentaire?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = eventTypeFilter === "all" || m.event_type === eventTypeFilter;

    return matchesSearch && matchesType;
  });

  // Stats
  const stats = {
    total: movements.length,
    virements: movements.filter((m) => m.event_type.includes("virement")).length,
    engagements: movements.filter((m) => m.event_type === "engagement").length,
    ajustements: movements.filter((m) => m.event_type.includes("ajustement")).length,
  };

  const handleExport = () => {
    const headers = [
      "Date",
      "Type",
      "Ligne budgétaire",
      "Delta",
      "Dotation avant",
      "Dotation après",
      "Référence",
      "Commentaire",
      "Utilisateur",
    ].join(";");

    const rows = filteredMovements.map((m) =>
      [
        format(new Date(m.created_at), "dd/MM/yyyy HH:mm"),
        EVENT_TYPE_LABELS[m.event_type]?.label || m.event_type,
        m.budget_line?.code || "-",
        m.delta,
        m.dotation_avant || 0,
        m.dotation_apres || 0,
        m.ref_code || "-",
        m.commentaire || "",
        m.created_by_profile?.full_name || "-",
      ].join(";")
    );

    const content = [headers, ...rows].join("\n");
    const blob = new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `journal_mouvements_${exercice}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success("Export réussi");
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total mouvements</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.virements}</p>
                <p className="text-sm text-muted-foreground">Virements</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.engagements}</p>
                <p className="text-sm text-muted-foreground">Engagements</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.ajustements}</p>
                <p className="text-sm text-muted-foreground">Ajustements</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par code, référence..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="w-48">
              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {Object.entries(EVENT_TYPE_LABELS).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Journal Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Journal des Mouvements
          </CardTitle>
          <CardDescription>
            {filteredMovements.length} mouvement(s) affiché(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Ligne budgétaire</TableHead>
                  <TableHead className="text-right">Delta</TableHead>
                  <TableHead className="text-right">Avant</TableHead>
                  <TableHead className="text-right">Après</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead>Utilisateur</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : filteredMovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Aucun mouvement trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMovements.map((m) => {
                    const typeConfig = EVENT_TYPE_LABELS[m.event_type] || {
                      label: m.event_type,
                      color: "text-muted-foreground",
                      icon: ArrowRightLeft,
                    };
                    const Icon = typeConfig.icon;

                    return (
                      <TableRow key={m.id}>
                        <TableCell className="text-sm">
                          {format(new Date(m.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`gap-1 ${typeConfig.color}`}>
                            <Icon className="h-3 w-3" />
                            {typeConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs">{m.budget_line?.code || "-"}</span>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          <span className={m.delta >= 0 ? "text-green-600" : "text-red-600"}>
                            {m.delta >= 0 ? "+" : ""}
                            {formatCurrency(m.delta)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-muted-foreground">
                          {m.dotation_avant !== null ? formatCurrency(m.dotation_avant) : "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {m.dotation_apres !== null ? formatCurrency(m.dotation_apres) : "-"}
                        </TableCell>
                        <TableCell>
                          {m.ref_code && (
                            <Badge variant="secondary" className="text-xs">
                              {m.ref_code}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {m.created_by_profile?.full_name || "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
