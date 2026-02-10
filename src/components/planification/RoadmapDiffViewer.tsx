// @ts-nocheck
/**
 * RoadmapDiffViewer - Composant pour visualiser et sélectionner les changements
 *
 * Affiche les différences entre l'import et les données existantes
 * avec cases à cocher pour sélectionner les changements à appliquer.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
} from "@/components/ui/table";
import {
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Minus,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Loader2,
  History,
  Check,
  X,
  FileWarning,
} from "lucide-react";
import { useRoadmapDiff, useRoadmapVersionHistory, PendingChange, DiffField, ChangeType } from "@/hooks/useRoadmapDiff";

// Configuration des types de changement
const CHANGE_TYPE_CONFIG: Record<
  ChangeType,
  { label: string; icon: React.ReactNode; color: string; bgColor: string }
> = {
  add: {
    label: "Nouveau",
    icon: <Plus className="h-4 w-4" />,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  modify: {
    label: "Modifié",
    icon: <Edit2 className="h-4 w-4" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  remove: {
    label: "Supprimé",
    icon: <Minus className="h-4 w-4" />,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
};

interface RoadmapDiffViewerProps {
  importBatchId: string;
  directionId: string;
  onApplyComplete?: () => void;
}

export function RoadmapDiffViewer({
  importBatchId,
  directionId,
  onApplyComplete,
}: RoadmapDiffViewerProps) {
  const {
    changes,
    stats,
    isLoading,
    toggleSelection,
    toggleAll,
    applyChanges,
    isApplying,
    getEffectiveSelection,
    formatDiffField,
  } = useRoadmapDiff(importBatchId, directionId);

  const [activeTab, setActiveTab] = useState<"all" | ChangeType>("all");
  const [expandedChanges, setExpandedChanges] = useState<Set<string>>(new Set());

  // Formatage montant
  const formatMontant = (montant: unknown): string => {
    if (montant === null || montant === undefined) return "—";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      maximumFractionDigits: 0,
    }).format(Number(montant));
  };

  // Filtrer les changements par type
  const filteredChanges =
    activeTab === "all"
      ? changes
      : changes.filter((c) => c.change_type === activeTab);

  // Toggle expansion d'un changement
  const toggleExpand = (changeId: string) => {
    setExpandedChanges((prev) => {
      const next = new Set(prev);
      if (next.has(changeId)) {
        next.delete(changeId);
      } else {
        next.add(changeId);
      }
      return next;
    });
  };

  // Gérer l'application des changements
  const handleApply = async () => {
    await applyChanges(importBatchId);
    onApplyComplete?.();
  };

  // Sélectionner/désélectionner tous les changements d'un type
  const handleToggleAllType = (type: ChangeType, select: boolean) => {
    toggleAll(importBatchId, select, type);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (changes.length === 0) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Aucun changement détecté</AlertTitle>
        <AlertDescription className="text-green-700">
          Les données importées sont identiques aux données existantes.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.additions}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Plus className="h-3 w-3" /> Ajouts
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats.modifications}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Edit2 className="h-3 w-3" /> Modifications
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{stats.removals}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Minus className="h-3 w-3" /> Suppressions
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/20">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-primary">{stats.selected}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Check className="h-3 w-3" /> Sélectionnés
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes */}
      {stats.hierarchyErrors > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erreurs de hiérarchie</AlertTitle>
          <AlertDescription>
            {stats.hierarchyErrors} changement(s) ont des problèmes de hiérarchie
            (action/mission non trouvée). Ces changements ne peuvent pas être appliqués.
          </AlertDescription>
        </Alert>
      )}

      {stats.removals > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <FileWarning className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">Suppressions détectées</AlertTitle>
          <AlertDescription className="text-orange-700">
            {stats.removals} activité(s) absentes du nouvel import. Par défaut, elles
            ne sont pas sélectionnées pour désactivation. Cochez-les si vous souhaitez
            les désactiver.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs et liste des changements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Changements à appliquer</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleAll(importBatchId, true)}
              >
                <Check className="h-4 w-4 mr-1" />
                Tout sélectionner
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleAll(importBatchId, false)}
              >
                <X className="h-4 w-4 mr-1" />
                Tout désélectionner
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Cochez les changements que vous souhaitez appliquer.
            Les suppressions désactivent les activités sans les supprimer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                Tous ({stats.total})
              </TabsTrigger>
              <TabsTrigger value="add" className="text-green-600">
                Ajouts ({stats.additions})
              </TabsTrigger>
              <TabsTrigger value="modify" className="text-blue-600">
                Modifications ({stats.modifications})
              </TabsTrigger>
              <TabsTrigger value="remove" className="text-red-600">
                Suppressions ({stats.removals})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {activeTab !== "all" && (
                <div className="flex justify-end gap-2 mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleAllType(activeTab as ChangeType, true)}
                  >
                    Sélectionner tous les {CHANGE_TYPE_CONFIG[activeTab as ChangeType].label.toLowerCase()}s
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleAllType(activeTab as ChangeType, false)}
                  >
                    Désélectionner
                  </Button>
                </div>
              )}

              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredChanges.map((change) => (
                    <ChangeCard
                      key={change.id}
                      change={change}
                      isSelected={getEffectiveSelection(change)}
                      isExpanded={expandedChanges.has(change.id)}
                      onToggleSelect={(selected) =>
                        toggleSelection(change.id, selected)
                      }
                      onToggleExpand={() => toggleExpand(change.id)}
                      formatMontant={formatMontant}
                      formatDiffField={formatDiffField}
                    />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Bouton d'application */}
      <div className="flex justify-end gap-4">
        <Button
          onClick={handleApply}
          disabled={stats.selected === 0 || isApplying}
          className="min-w-[200px]"
        >
          {isApplying ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Application en cours...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Appliquer {stats.selected} changement(s)
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Composant pour une carte de changement
interface ChangeCardProps {
  change: PendingChange;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleSelect: (selected: boolean) => void;
  onToggleExpand: () => void;
  formatMontant: (value: unknown) => string;
  formatDiffField: (field: DiffField) => string;
}

function ChangeCard({
  change,
  isSelected,
  isExpanded,
  onToggleSelect,
  onToggleExpand,
  formatMontant,
  formatDiffField,
}: ChangeCardProps) {
  const config = CHANGE_TYPE_CONFIG[change.change_type];
  const data = change.new_data || change.old_data;
  const code = data?.code as string;
  const libelle = data?.libelle as string;

  return (
    <div
      className={`border rounded-lg transition-colors ${
        !change.is_hierarchy_valid
          ? "border-red-300 bg-red-50/50"
          : isSelected
          ? "border-primary/50 bg-primary/5"
          : "border-border"
      }`}
    >
      <div className="flex items-center gap-3 p-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={onToggleSelect}
                  disabled={!change.is_hierarchy_valid}
                />
              </div>
            </TooltipTrigger>
            {!change.is_hierarchy_valid && (
              <TooltipContent>
                <p>Non applicable: {change.hierarchy_warning}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        <Badge className={`${config.bgColor} ${config.color} gap-1`}>
          {config.icon}
          {config.label}
        </Badge>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm">{code}</span>
            {!change.is_hierarchy_valid && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Erreur hiérarchie
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground truncate">{libelle}</div>
        </div>

        {/* Montant */}
        <div className="text-right">
          {change.change_type === "modify" && change.old_data && change.new_data ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground line-through">
                {formatMontant(change.old_data.montant_prevu)}
              </span>
              <ArrowRight className="h-3 w-3" />
              <span className="font-medium">
                {formatMontant(change.new_data.montant_prevu)}
              </span>
            </div>
          ) : (
            <span className="font-mono text-sm">
              {formatMontant(data?.montant_prevu)}
            </span>
          )}
        </div>

        {/* Expand button for modifications */}
        {change.change_type === "modify" && change.diff_fields && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpand}
            className="ml-2"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Détail des modifications */}
      {isExpanded && change.diff_fields && (
        <div className="border-t px-3 py-2 bg-muted/30">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Champs modifiés:
          </div>
          <div className="space-y-1">
            {change.diff_fields.map((diff, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 text-sm py-1 px-2 bg-background rounded"
              >
                <span className="font-medium min-w-[100px]">
                  {formatDiffField(diff)}:
                </span>
                <span className="text-muted-foreground line-through">
                  {diff.field === "montant_prevu"
                    ? formatMontant(diff.old)
                    : String(diff.old || "—")}
                </span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">
                  {diff.field === "montant_prevu"
                    ? formatMontant(diff.new)
                    : String(diff.new || "—")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warning hiérarchie */}
      {!change.is_hierarchy_valid && change.hierarchy_warning && (
        <div className="border-t px-3 py-2 bg-red-50">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4" />
            {change.hierarchy_warning}
          </div>
        </div>
      )}
    </div>
  );
}

// Composant pour afficher l'historique des versions
interface VersionHistoryProps {
  directionId: string;
}

export function RoadmapVersionHistory({ directionId }: VersionHistoryProps) {
  const { data: snapshots, isLoading } = useRoadmapVersionHistory(directionId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!snapshots || snapshots.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <History className="h-10 w-10 mx-auto mb-2 opacity-50" />
        <p>Aucun historique de version</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-2">
        {snapshots.map((snapshot: any) => (
          <div
            key={snapshot.id}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <Badge variant="outline">v{snapshot.version_number}</Badge>
              <div>
                <div className="font-medium">
                  {new Date(snapshot.snapshot_date).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                {snapshot.reason && (
                  <div className="text-sm text-muted-foreground">
                    {snapshot.reason}
                  </div>
                )}
              </div>
            </div>
            <div className="text-right text-sm">
              <div>{snapshot.nb_activites} activités</div>
              <div className="text-muted-foreground">
                {new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: "XOF",
                  maximumFractionDigits: 0,
                }).format(snapshot.montant_total)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
