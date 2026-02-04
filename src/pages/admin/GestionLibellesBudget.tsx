/**
 * GestionLibellesBudget - Page admin pour l'édition des libellés budgétaires
 * Vue arborescente: OS → Missions → Actions → Activités
 */

import { useState, useMemo } from "react";
import {
  Target,
  Briefcase,
  Layers,
  Activity,
  ChevronDown,
  ChevronRight,
  Search,
  History,
  Pencil,
  FolderTree,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Collapsible components not currently used but may be needed for future enhancements
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  useBudgetLabelEditor,
  type BudgetEntityType,
  type BudgetLabelEntity,
} from "@/hooks/useBudgetLabelEditor";
import { BudgetLabelEditButton } from "@/components/budget/BudgetLabelEditor";
import { BudgetLabelHistoryDialog } from "@/components/budget/BudgetLabelHistory";

// ============================================================================
// TYPES
// ============================================================================

interface TreeNode {
  entity: BudgetLabelEntity;
  entityType: BudgetEntityType;
  children: TreeNode[];
  depth: number;
}

// ============================================================================
// COMPOSANT: En-tête de stats
// ============================================================================

function StatsHeader({
  osCount,
  missionCount,
  actionCount,
  activiteCount,
}: {
  osCount: number;
  missionCount: number;
  actionCount: number;
  activiteCount: number;
}) {
  const stats = [
    { label: "Objectifs Stratégiques", count: osCount, icon: Target, color: "text-blue-600" },
    { label: "Missions", count: missionCount, icon: Briefcase, color: "text-green-600" },
    { label: "Actions", count: actionCount, icon: Layers, color: "text-orange-600" },
    { label: "Activités", count: activiteCount, icon: Activity, color: "text-purple-600" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg bg-muted", stat.color)}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.count}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================================================
// COMPOSANT: Ligne de tableau avec édition
// ============================================================================

interface EntityRowProps {
  entity: BudgetLabelEntity;
  entityType: BudgetEntityType;
  depth: number;
  isExpanded: boolean;
  hasChildren: boolean;
  onToggle: () => void;
  onHistoryClick: () => void;
}

function EntityRow({
  entity,
  entityType,
  depth,
  isExpanded,
  hasChildren,
  onToggle,
  onHistoryClick,
}: EntityRowProps) {
  const typeIcons: Record<BudgetEntityType, typeof Target> = {
    objectifs_strategiques: Target,
    missions: Briefcase,
    actions: Layers,
    activites: Activity,
  };

  const typeColors: Record<BudgetEntityType, string> = {
    objectifs_strategiques: "text-blue-600",
    missions: "text-green-600",
    actions: "text-orange-600",
    activites: "text-purple-600",
  };

  const bgColors: Record<BudgetEntityType, string> = {
    objectifs_strategiques: "bg-blue-50/50 dark:bg-blue-950/20",
    missions: "bg-green-50/50 dark:bg-green-950/20",
    actions: "bg-orange-50/50 dark:bg-orange-950/20",
    activites: "",
  };

  const Icon = typeIcons[entityType];

  return (
    <TableRow className={cn(bgColors[entityType], "hover:bg-muted/50")}>
      <TableCell className="w-[250px]">
        <div
          className="flex items-center gap-2 cursor-pointer"
          style={{ paddingLeft: `${depth * 24}px` }}
          onClick={() => hasChildren && onToggle()}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            )
          ) : (
            <span className="w-4" />
          )}
          <Icon className={cn("h-4 w-4 shrink-0", typeColors[entityType])} />
          <span className="font-mono text-sm">{entity.code}</span>
        </div>
      </TableCell>
      <TableCell>
        <span className="font-medium">{entity.libelle}</span>
      </TableCell>
      <TableCell className="w-[100px]">
        <Badge
          variant="outline"
          className={cn(
            "text-[10px]",
            entityType === "objectifs_strategiques" && "border-blue-200 text-blue-700",
            entityType === "missions" && "border-green-200 text-green-700",
            entityType === "actions" && "border-orange-200 text-orange-700",
            entityType === "activites" && "border-purple-200 text-purple-700"
          )}
        >
          {entityType === "objectifs_strategiques" && "OS"}
          {entityType === "missions" && "Mission"}
          {entityType === "actions" && "Action"}
          {entityType === "activites" && "Activité"}
        </Badge>
      </TableCell>
      <TableCell className="w-[100px]">
        <div className="flex items-center gap-1">
          <BudgetLabelEditButton entityType={entityType} entity={entity} size="sm" />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onHistoryClick}>
                  <History className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Voir l'historique</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ============================================================================
// PAGE PRINCIPALE
// ============================================================================

export default function GestionLibellesBudget() {
  const {
    objectifsStrategiques,
    missions,
    actions,
    activites,
    isLoading,
  } = useBudgetLabelEditor();

  const [searchTerm, setSearchTerm] = useState("");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"tree" | "os" | "missions" | "actions" | "activites">("tree");
  const [historyDialog, setHistoryDialog] = useState<{
    open: boolean;
    entityType: BudgetEntityType;
    entity: BudgetLabelEntity | null;
  }>({
    open: false,
    entityType: "objectifs_strategiques",
    entity: null,
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Construction de l'arbre
  // ──────────────────────────────────────────────────────────────────────────

  const treeData = useMemo(() => {
    const nodes: TreeNode[] = [];

    // Pour chaque OS
    objectifsStrategiques.forEach((os) => {
      const osNode: TreeNode = {
        entity: os,
        entityType: "objectifs_strategiques",
        children: [],
        depth: 0,
      };

      // Missions (pas de lien direct avec OS dans le schéma actuel)
      // On affiche toutes les missions sous chaque OS pour simplifier
      missions.forEach((mission) => {
        const missionNode: TreeNode = {
          entity: mission,
          entityType: "missions",
          children: [],
          depth: 1,
        };

        // Actions liées à cette mission
        const relatedActions = actions.filter((a) => a.mission_id === mission.id);
        relatedActions.forEach((action) => {
          const actionNode: TreeNode = {
            entity: action,
            entityType: "actions",
            children: [],
            depth: 2,
          };

          // Activités liées à cette action
          const relatedActivites = activites.filter((act) => act.action_id === action.id);
          relatedActivites.forEach((activite) => {
            actionNode.children.push({
              entity: activite,
              entityType: "activites",
              children: [],
              depth: 3,
            });
          });

          missionNode.children.push(actionNode);
        });

        osNode.children.push(missionNode);
      });

      nodes.push(osNode);
    });

    return nodes;
  }, [objectifsStrategiques, missions, actions, activites]);

  // ──────────────────────────────────────────────────────────────────────────
  // Filtrage par recherche
  // ──────────────────────────────────────────────────────────────────────────

  const filteredTree = useMemo(() => {
    const filterNodes = (nodes: TreeNode[], term: string): TreeNode[] => {
      if (!term) return nodes;
      const lowerTerm = term.toLowerCase();

      return nodes.reduce<TreeNode[]>((acc, node) => {
        const matches =
          node.entity.code.toLowerCase().includes(lowerTerm) ||
          node.entity.libelle.toLowerCase().includes(lowerTerm);

        const filteredChildren = filterNodes(node.children, term);

        if (matches || filteredChildren.length > 0) {
          acc.push({
            ...node,
            children: filteredChildren,
          });
        }

        return acc;
      }, []);
    };

    return filterNodes(treeData, searchTerm);
  }, [treeData, searchTerm]);

  // ──────────────────────────────────────────────────────────────────────────
  // Aplatir l'arbre pour l'affichage
  // ──────────────────────────────────────────────────────────────────────────

  const flattenedData = useMemo(() => {
    const flattenTree = (
      nodes: TreeNode[],
      parentKey = "",
      parentExpanded = true
    ): Array<TreeNode & { key: string; visible: boolean }> => {
      const result: Array<TreeNode & { key: string; visible: boolean }> = [];

      nodes.forEach((node, index) => {
        const key = parentKey ? `${parentKey}-${index}` : `${index}`;
        const isExpanded = expandedNodes.has(key);

        result.push({
          ...node,
          key,
          visible: parentExpanded,
        });

        if (node.children.length > 0) {
          result.push(...flattenTree(node.children, key, parentExpanded && isExpanded));
        }
      });

      return result;
    };

    return flattenTree(filteredTree).filter((n) => n.visible);
  }, [filteredTree, expandedNodes]);

  // ──────────────────────────────────────────────────────────────────────────
  // Actions
  // ──────────────────────────────────────────────────────────────────────────

  const toggleNode = (key: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allKeys = new Set<string>();
    const addKeys = (nodes: TreeNode[], parentKey = "") => {
      nodes.forEach((node, index) => {
        const key = parentKey ? `${parentKey}-${index}` : `${index}`;
        if (node.children.length > 0) {
          allKeys.add(key);
          addKeys(node.children, key);
        }
      });
    };
    addKeys(filteredTree);
    setExpandedNodes(allKeys);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const openHistoryDialog = (entityType: BudgetEntityType, entity: BudgetLabelEntity) => {
    setHistoryDialog({
      open: true,
      entityType,
      entity,
    });
  };

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER: Loading
  // ──────────────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER: Liste simple par type
  // ──────────────────────────────────────────────────────────────────────────

  const renderSimpleList = (
    entities: BudgetLabelEntity[],
    entityType: BudgetEntityType
  ) => {
    const filtered = searchTerm
      ? entities.filter(
          (e) =>
            e.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.libelle.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : entities;

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">Code</TableHead>
            <TableHead>Libellé</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                Aucun élément trouvé
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((entity) => (
              <TableRow key={entity.id}>
                <TableCell className="font-mono">{entity.code}</TableCell>
                <TableCell>{entity.libelle}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <BudgetLabelEditButton entityType={entityType} entity={entity} size="sm" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openHistoryDialog(entityType, entity)}
                    >
                      <History className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    );
  };

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER PRINCIPAL
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Pencil className="h-6 w-6" />
            Gestion des Libellés Budgétaires
          </h1>
          <p className="text-muted-foreground">
            Modifiez les libellés de la nomenclature budgétaire avec historique des modifications
          </p>
        </div>
      </div>

      {/* Stats */}
      <StatsHeader
        osCount={objectifsStrategiques.length}
        missionCount={missions.length}
        actionCount={actions.length}
        activiteCount={activites.length}
      />

      {/* Contenu principal */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Structure Budgétaire</CardTitle>
              <CardDescription>
                Cliquez sur le crayon pour modifier un libellé
              </CardDescription>
            </div>

            {/* Recherche */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par code ou libellé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="mb-4">
              <TabsTrigger value="tree" className="gap-2">
                <FolderTree className="h-4 w-4" />
                Vue arborescente
              </TabsTrigger>
              <TabsTrigger value="os" className="gap-2">
                <Target className="h-4 w-4" />
                OS ({objectifsStrategiques.length})
              </TabsTrigger>
              <TabsTrigger value="missions" className="gap-2">
                <Briefcase className="h-4 w-4" />
                Missions ({missions.length})
              </TabsTrigger>
              <TabsTrigger value="actions" className="gap-2">
                <Layers className="h-4 w-4" />
                Actions ({actions.length})
              </TabsTrigger>
              <TabsTrigger value="activites" className="gap-2">
                <Activity className="h-4 w-4" />
                Activités ({activites.length})
              </TabsTrigger>
            </TabsList>

            {/* Vue arborescente */}
            <TabsContent value="tree">
              <div className="space-y-4">
                {/* Boutons d'expansion */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={expandAll}>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Tout déplier
                  </Button>
                  <Button variant="outline" size="sm" onClick={collapseAll}>
                    <ChevronRight className="h-4 w-4 mr-1" />
                    Tout replier
                  </Button>
                </div>

                {/* Tableau arborescent */}
                <div className="rounded-md border">
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[250px]">Code</TableHead>
                          <TableHead>Libellé</TableHead>
                          <TableHead className="w-[100px]">Type</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {flattenedData.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              Aucun élément trouvé
                            </TableCell>
                          </TableRow>
                        ) : (
                          flattenedData.map((node) => {
                            const hasChildren = node.children.length > 0;
                            const isExpanded = expandedNodes.has(node.key);

                            return (
                              <EntityRow
                                key={node.key}
                                entity={node.entity}
                                entityType={node.entityType}
                                depth={node.depth}
                                isExpanded={isExpanded}
                                hasChildren={hasChildren}
                                onToggle={() => toggleNode(node.key)}
                                onHistoryClick={() =>
                                  openHistoryDialog(node.entityType, node.entity)
                                }
                              />
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>

            {/* Vues par type */}
            <TabsContent value="os">
              <div className="rounded-md border">
                <ScrollArea className="h-[500px]">
                  {renderSimpleList(objectifsStrategiques, "objectifs_strategiques")}
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="missions">
              <div className="rounded-md border">
                <ScrollArea className="h-[500px]">
                  {renderSimpleList(missions, "missions")}
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="actions">
              <div className="rounded-md border">
                <ScrollArea className="h-[500px]">
                  {renderSimpleList(actions, "actions")}
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="activites">
              <div className="rounded-md border">
                <ScrollArea className="h-[500px]">
                  {renderSimpleList(activites, "activites")}
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog d'historique */}
      {historyDialog.entity && (
        <BudgetLabelHistoryDialog
          entityType={historyDialog.entityType}
          entity={historyDialog.entity}
          open={historyDialog.open}
          onOpenChange={(open) =>
            setHistoryDialog((prev) => ({ ...prev, open }))
          }
        />
      )}
    </div>
  );
}
