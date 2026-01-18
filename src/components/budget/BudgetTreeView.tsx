import { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Edit,
  Send,
  Check,
  X,
  Trash2,
  History,
  Copy,
  ChevronRight,
  ChevronDown,
  FolderTree,
  FileEdit,
  RotateCcw
} from "lucide-react";
import { BudgetLineWithRelations, getDisplayBudgetCode } from "@/hooks/useBudgetLines";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";

interface BudgetTreeViewProps {
  lines: BudgetLineWithRelations[];
  onEdit: (line: BudgetLineWithRelations) => void;
  onDuplicate: (line: BudgetLineWithRelations) => void;
  onSubmit: (id: string) => void;
  onValidate: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onDelete: (id: string) => void;
  onViewHistory: (line: BudgetLineWithRelations) => void;
  onEditWithVersioning?: (line: BudgetLineWithRelations) => void;
  onViewVersionHistory?: (line: BudgetLineWithRelations) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + " FCFA";
};

const getVersionBadge = (version: string) => {
  switch (version) {
    case "V2":
      return <Badge variant="outline" className="text-[10px] px-1 py-0 ml-1 border-primary text-primary">V2</Badge>;
    case "V1":
      return <Badge variant="outline" className="text-[10px] px-1 py-0 ml-1">V1</Badge>;
    default:
      return null;
  }
};

const getStatusBadge = (status: string | null) => {
  switch (status) {
    case "brouillon":
      return <Badge variant="secondary">Brouillon</Badge>;
    case "soumis":
      return <Badge variant="default" className="bg-blue-500">Soumis</Badge>;
    case "valide":
      return <Badge variant="default" className="bg-green-500">Validé</Badge>;
    case "rejete":
      return <Badge variant="destructive">Rejeté</Badge>;
    default:
      return <Badge variant="secondary">Brouillon</Badge>;
  }
};

const getLevelColor = (level: string) => {
  switch (level) {
    case "chapitre":
      return "bg-primary/10 font-semibold";
    case "article":
      return "bg-secondary/10";
    case "paragraphe":
      return "bg-muted/50";
    default:
      return "";
  }
};

const getLevelIndent = (level: string) => {
  switch (level) {
    case "chapitre":
      return 0;
    case "article":
      return 1;
    case "paragraphe":
      return 2;
    case "ligne":
      return 3;
    default:
      return 0;
  }
};

interface TreeNode extends BudgetLineWithRelations {
  children: TreeNode[];
  depth: number;
}

export function BudgetTreeView({
  lines,
  onEdit,
  onDuplicate,
  onSubmit,
  onValidate,
  onReject,
  onDelete,
  onViewHistory,
  onEditWithVersioning,
  onViewVersionHistory,
}: BudgetTreeViewProps) {
  const { exercice } = useExercice();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [engagements, setEngagements] = useState<Record<string, number>>({});

  // Fetch engagements for all lines
  useEffect(() => {
    const fetchEngagements = async () => {
      if (!lines.length || !exercice) return;

      const lineIds = lines.map(l => l.id);
      const { data } = await supabase
        .from("budget_engagements")
        .select("budget_line_id, montant")
        .in("budget_line_id", lineIds)
        .eq("exercice", exercice)
        .eq("statut", "valide");

      const engMap: Record<string, number> = {};
      lineIds.forEach(id => { engMap[id] = 0; });
      data?.forEach(e => {
        if (e.budget_line_id) {
          engMap[e.budget_line_id] = (engMap[e.budget_line_id] || 0) + (e.montant || 0);
        }
      });
      setEngagements(engMap);
    };

    fetchEngagements();
  }, [lines, exercice]);

  // Build tree structure from flat list
  const treeData = useMemo(() => {
    const nodeMap = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    // First pass: create nodes
    lines.forEach(line => {
      nodeMap.set(line.id, { ...line, children: [], depth: 0 });
    });

    // Second pass: build tree
    lines.forEach(line => {
      const node = nodeMap.get(line.id)!;
      if (line.parent_id && nodeMap.has(line.parent_id)) {
        const parent = nodeMap.get(line.parent_id)!;
        node.depth = parent.depth + 1;
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    // Sort children by code
    const sortNodes = (nodes: TreeNode[]) => {
      nodes.sort((a, b) => a.code.localeCompare(b.code));
      nodes.forEach(node => sortNodes(node.children));
    };
    sortNodes(roots);

    return roots;
  }, [lines]);

  // Flatten tree for display with visibility based on expansion state
  const flattenTree = (nodes: TreeNode[], depth = 0, parentExpanded = true): (TreeNode & { visible: boolean })[] => {
    let result: (TreeNode & { visible: boolean })[] = [];
    nodes.forEach(node => {
      result.push({ ...node, depth, visible: parentExpanded });
      if (node.children.length > 0) {
        const isExpanded = expandedNodes.has(node.id);
        result = result.concat(flattenTree(node.children, depth + 1, parentExpanded && isExpanded));
      }
    });
    return result;
  };

  const flattenedData = useMemo(() => {
    return flattenTree(treeData).filter(n => n.visible);
  }, [treeData, expandedNodes]);

  const toggleExpand = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allIds = new Set(lines.filter(l => lines.some(c => c.parent_id === l.id)).map(l => l.id));
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  // Calculate aggregated totals for parent nodes
  const getAggregatedTotal = (node: TreeNode): number => {
    if (node.children.length === 0) {
      return node.dotation_initiale;
    }
    return node.children.reduce((sum, child) => sum + getAggregatedTotal(child as TreeNode), 0);
  };

  const getAggregatedEngaged = (node: TreeNode): number => {
    if (node.children.length === 0) {
      return engagements[node.id] || 0;
    }
    return node.children.reduce((sum, child) => sum + getAggregatedEngaged(child as TreeNode), 0);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={expandAll}>
          <FolderTree className="h-4 w-4 mr-1" />
          Tout déplier
        </Button>
        <Button variant="outline" size="sm" onClick={collapseAll}>
          Tout replier
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Code</TableHead>
              <TableHead>Libellé</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead className="text-right">Dotation</TableHead>
              <TableHead className="text-right">Engagé</TableHead>
              <TableHead className="text-right">Disponible</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flattenedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Aucune ligne budgétaire trouvée
                </TableCell>
              </TableRow>
            ) : (
              flattenedData.map((line) => {
                const hasChildren = lines.some(l => l.parent_id === line.id);
                const isExpanded = expandedNodes.has(line.id);
                const dotation = hasChildren ? getAggregatedTotal(line as TreeNode) : line.dotation_initiale;
                const engaged = hasChildren ? getAggregatedEngaged(line as TreeNode) : (engagements[line.id] || 0);
                const available = dotation - engaged;
                const displayCode = getDisplayBudgetCode(line);

                return (
                  <TableRow 
                    key={line.id} 
                    className={getLevelColor(line.level)}
                  >
                    <TableCell className="font-mono text-sm">
                      <div 
                        className="flex items-center cursor-pointer"
                        style={{ paddingLeft: `${line.depth * 20}px` }}
                        onClick={() => hasChildren && toggleExpand(line.id)}
                      >
                        {hasChildren ? (
                          isExpanded ? (
                            <ChevronDown className="h-4 w-4 mr-1 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 mr-1 text-muted-foreground" />
                          )
                        ) : (
                          <span className="w-5" />
                        )}
                        <span>{displayCode.code}</span>
                        {getVersionBadge(displayCode.version)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{line.label}</div>
                      {line.nomenclature_nbe && (
                        <div className="text-xs text-muted-foreground">
                          NBE: {line.nomenclature_nbe.code}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {line.direction?.code || "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(dotation)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-orange-600">
                      {formatCurrency(engaged)}
                    </TableCell>
                    <TableCell className={`text-right font-mono ${available < 0 ? "text-red-600" : "text-green-600"}`}>
                      {formatCurrency(available)}
                    </TableCell>
                    <TableCell>{getStatusBadge(line.statut)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(line)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier (formulaire)
                          </DropdownMenuItem>
                          {onEditWithVersioning && (
                            <DropdownMenuItem onClick={() => onEditWithVersioning(line)}>
                              <FileEdit className="mr-2 h-4 w-4 text-blue-600" />
                              Modifier (avec versioning)
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => onDuplicate(line)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Dupliquer
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onViewHistory(line)}>
                            <History className="mr-2 h-4 w-4" />
                            Historique champs
                          </DropdownMenuItem>
                          {onViewVersionHistory && (
                            <DropdownMenuItem onClick={() => onViewVersionHistory(line)}>
                              <RotateCcw className="mr-2 h-4 w-4 text-purple-600" />
                              Historique versions
                            </DropdownMenuItem>
                          )}
                          {line.statut === "brouillon" && (
                            <DropdownMenuItem onClick={() => onSubmit(line.id)}>
                              <Send className="mr-2 h-4 w-4" />
                              Soumettre
                            </DropdownMenuItem>
                          )}
                          {line.statut === "soumis" && (
                            <>
                              <DropdownMenuItem onClick={() => onValidate(line.id)}>
                                <Check className="mr-2 h-4 w-4 text-green-600" />
                                Valider
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  const reason = prompt("Motif du rejet:");
                                  if (reason) onReject(line.id, reason);
                                }}
                              >
                                <X className="mr-2 h-4 w-4 text-red-600" />
                                Rejeter
                              </DropdownMenuItem>
                            </>
                          )}
                          {line.statut === "brouillon" && (
                            <DropdownMenuItem 
                              onClick={() => {
                                if (confirm("Supprimer cette ligne ?")) onDelete(line.id);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
