import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, Shield, Eye, Plus, Pencil, CheckCircle, XCircle, RotateCcw, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type CustomRole = {
  id: string;
  code: string;
  label: string;
  color: string | null;
  is_active: boolean | null;
  is_system: boolean | null;
};

type PermissionAction = {
  id: string;
  code: string;
  label: string;
  category: string;
  description: string | null;
  is_active: boolean | null;
};

type RolePermission = {
  id: string;
  role_code: string;
  action_code: string;
  is_granted: boolean | null;
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  voir: <Eye className="h-3 w-3" />,
  creer: <Plus className="h-3 w-3" />,
  modifier: <Pencil className="h-3 w-3" />,
  valider: <CheckCircle className="h-3 w-3" />,
  signer: <Pencil className="h-3 w-3" />,
  rejeter: <XCircle className="h-3 w-3" />,
};

const CATEGORY_LABELS: Record<string, string> = {
  budget: "Budget",
  engagement: "Engagement",
  liquidation: "Liquidation",
  ordonnancement: "Ordonnancement",
  reglement: "Règlement",
  administration: "Administration",
  export: "Export",
};

export default function GestionAutorisations() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [hasChanges, setHasChanges] = useState(false);
  const [localPermissions, setLocalPermissions] = useState<Map<string, boolean>>(new Map());

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["custom-roles-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_roles")
        .select("*")
        .eq("is_active", true)
        .order("label");
      if (error) throw error;
      return data as CustomRole[];
    },
  });

  const { data: actions, isLoading: actionsLoading } = useQuery({
    queryKey: ["permission-actions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permission_actions")
        .select("*")
        .eq("is_active", true)
        .order("category, label");
      if (error) throw error;
      return data as PermissionAction[];
    },
  });

  const { data: permissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ["role-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("*");
      if (error) throw error;
      return data as RolePermission[];
    },
  });

  // Catégories uniques
  const categories = useMemo(() => {
    if (!actions) return [];
    return [...new Set(actions.map((a) => a.category))].sort();
  }, [actions]);

  // Actions groupées par catégorie
  const groupedActions = useMemo(() => {
    if (!actions) return new Map<string, PermissionAction[]>();
    const groups = new Map<string, PermissionAction[]>();
    
    actions.forEach((action) => {
      const cat = action.category || "autre";
      if (!groups.has(cat)) {
        groups.set(cat, []);
      }
      groups.get(cat)!.push(action);
    });
    
    return groups;
  }, [actions]);

  // Actions filtrées
  const filteredActions = useMemo(() => {
    if (!actions) return [];
    if (selectedCategory === "all") return actions;
    return actions.filter((a) => a.category === selectedCategory);
  }, [actions, selectedCategory]);

  // Helper pour vérifier si une permission est accordée
  const isPermissionGranted = (roleCode: string, actionCode: string): boolean => {
    const key = `${roleCode}:${actionCode}`;
    if (localPermissions.has(key)) {
      return localPermissions.get(key)!;
    }
    const perm = permissions?.find(
      (p) => p.role_code === roleCode && p.action_code === actionCode
    );
    return perm?.is_granted ?? false;
  };

  // Vérifier si une permission a été modifiée localement
  const isModified = (roleCode: string, actionCode: string): boolean => {
    return localPermissions.has(`${roleCode}:${actionCode}`);
  };

  // Toggle permission
  const togglePermission = (roleCode: string, actionCode: string) => {
    const key = `${roleCode}:${actionCode}`;
    const current = isPermissionGranted(roleCode, actionCode);
    setLocalPermissions((prev) => new Map(prev).set(key, !current));
    setHasChanges(true);
  };

  // Réinitialiser les modifications
  const resetChanges = () => {
    setLocalPermissions(new Map());
    setHasChanges(false);
  };

  // Mutation pour sauvegarder
  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates: { role_code: string; action_code: string; is_granted: boolean }[] = [];
      
      localPermissions.forEach((isGranted, key) => {
        const [roleCode, actionCode] = key.split(":");
        updates.push({ role_code: roleCode, action_code: actionCode, is_granted: isGranted });
      });

      for (const update of updates) {
        const existing = permissions?.find(
          (p) => p.role_code === update.role_code && p.action_code === update.action_code
        );

        if (existing) {
          const { error } = await supabase
            .from("role_permissions")
            .update({ is_granted: update.is_granted })
            .eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("role_permissions")
            .insert(update);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      toast.success("Autorisations enregistrées");
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
      queryClient.invalidateQueries({ queryKey: ["user-permissions"] });
      setLocalPermissions(new Map());
      setHasChanges(false);
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const isLoading = rolesLoading || actionsLoading || permissionsLoading;

  // Stats
  const stats = useMemo(() => {
    if (!roles || !actions || !permissions) return { total: 0, granted: 0 };
    const total = roles.length * actions.length;
    const granted = permissions.filter(p => p.is_granted).length;
    return { total, granted };
  }, [roles, actions, permissions]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Autorisations d'Accès</h1>
          <p className="text-muted-foreground mt-1">
            Matrice des permissions par rôle ({stats.granted} permissions actives sur {stats.total} possibles)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button variant="outline" onClick={resetChanges}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Annuler
            </Button>
          )}
          <Button 
            onClick={() => saveMutation.mutate()} 
            disabled={!hasChanges || saveMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Matrice des Permissions
              </CardTitle>
              <CardDescription>
                Cochez les cases pour accorder les permissions aux rôles. Les modifications en attente sont surlignées.
              </CardDescription>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrer par module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les modules</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORY_LABELS[cat] || cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <TooltipProvider>
              <ScrollArea className="w-full">
                <div className="min-w-[800px]">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium bg-muted/50 sticky left-0 z-10 min-w-[250px]">
                          Action / Permission
                        </th>
                        {roles?.map((role) => (
                          <th key={role.id} className="text-center p-3 font-medium bg-muted/50 min-w-[100px]">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge 
                                  variant={role.is_system ? "default" : "outline"}
                                  className="cursor-help"
                                  style={{ 
                                    borderColor: role.color || undefined, 
                                    color: role.is_system ? undefined : (role.color || undefined),
                                    backgroundColor: role.is_system ? (role.color || undefined) : undefined
                                  }}
                                >
                                  {role.code}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-medium">{role.label}</p>
                                {role.is_system && <p className="text-xs text-muted-foreground">Rôle système</p>}
                              </TooltipContent>
                            </Tooltip>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCategory === "all" ? (
                        // Afficher groupé par catégorie
                        Array.from(groupedActions.entries()).map(([category, categoryActions]) => (
                          <>
                            <tr key={`header-${category}`} className="bg-muted/30">
                              <td colSpan={(roles?.length || 0) + 1} className="p-2 font-semibold text-sm">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  {CATEGORY_LABELS[category] || category}
                                </div>
                              </td>
                            </tr>
                            {categoryActions.map((action) => (
                              <tr key={action.id} className="border-b hover:bg-muted/20">
                                <td className="p-3 sticky left-0 bg-background z-10">
                                  <div className="flex items-center gap-2">
                                    {ACTION_ICONS[action.code.split("_").pop() || ""] || <Eye className="h-3 w-3 text-muted-foreground" />}
                                    <div>
                                      <p className="font-medium text-sm">{action.label}</p>
                                      <p className="text-xs text-muted-foreground">{action.code}</p>
                                    </div>
                                  </div>
                                </td>
                                {roles?.map((role) => (
                                  <td 
                                    key={role.id} 
                                    className={`text-center p-3 ${isModified(role.code, action.code) ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}
                                  >
                                    <Checkbox
                                      checked={isPermissionGranted(role.code, action.code)}
                                      onCheckedChange={() => togglePermission(role.code, action.code)}
                                    />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </>
                        ))
                      ) : (
                        // Afficher les actions filtrées
                        filteredActions?.map((action) => (
                          <tr key={action.id} className="border-b hover:bg-muted/20">
                            <td className="p-3 sticky left-0 bg-background z-10">
                              <div className="flex items-center gap-2">
                                {ACTION_ICONS[action.code.split("_").pop() || ""] || <Eye className="h-3 w-3 text-muted-foreground" />}
                                <div>
                                  <p className="font-medium text-sm">{action.label}</p>
                                  <p className="text-xs text-muted-foreground">{action.code}</p>
                                </div>
                              </div>
                            </td>
                            {roles?.map((role) => (
                              <td 
                                key={role.id} 
                                className={`text-center p-3 ${isModified(role.code, action.code) ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}
                              >
                                <Checkbox
                                  checked={isPermissionGranted(role.code, action.code)}
                                  onCheckedChange={() => togglePermission(role.code, action.code)}
                                />
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </TooltipProvider>
          )}

          {hasChanges && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center justify-between">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Vous avez {localPermissions.size} modification(s) non enregistrée(s).
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={resetChanges}>
                  Annuler
                </Button>
                <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  Enregistrer
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Légende */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 rounded" />
              <span className="text-muted-foreground">Permission modifiée (non sauvegardée)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default">ROLE</Badge>
              <span className="text-muted-foreground">Rôle système</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">ROLE</Badge>
              <span className="text-muted-foreground">Rôle personnalisé</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
