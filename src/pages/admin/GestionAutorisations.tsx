import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, Shield, Eye, Plus, Pencil, CheckCircle, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

type CustomRole = {
  id: string;
  code: string;
  label: string;
  color: string | null;
  is_active: boolean | null;
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
  rejeter: <XCircle className="h-3 w-3" />,
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

  // Toggle permission
  const togglePermission = (roleCode: string, actionCode: string) => {
    const key = `${roleCode}:${actionCode}`;
    const current = isPermissionGranted(roleCode, actionCode);
    setLocalPermissions((prev) => new Map(prev).set(key, !current));
    setHasChanges(true);
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
      setLocalPermissions(new Map());
      setHasChanges(false);
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const isLoading = rolesLoading || actionsLoading || permissionsLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Autorisations d'Accès</h1>
          <p className="text-muted-foreground mt-1">
            Matrice des permissions par rôle (écran × action).
          </p>
        </div>
        <Button 
          onClick={() => saveMutation.mutate()} 
          disabled={!hasChanges || saveMutation.isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? "Enregistrement..." : "Enregistrer"}
        </Button>
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
                Cochez les cases pour accorder les permissions aux rôles.
              </CardDescription>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrer par module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les modules</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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
            <ScrollArea className="w-full">
              <div className="min-w-[800px]">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium bg-muted/50 sticky left-0 z-10 min-w-[200px]">
                        Action / Permission
                      </th>
                      {roles?.map((role) => (
                        <th key={role.id} className="text-center p-3 font-medium bg-muted/50 min-w-[100px]">
                          <Badge 
                            variant="outline" 
                            style={{ borderColor: role.color || undefined, color: role.color || undefined }}
                          >
                            {role.code}
                          </Badge>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActions?.map((action) => (
                      <tr key={action.id} className="border-b hover:bg-muted/30">
                        <td className="p-3 sticky left-0 bg-background z-10">
                          <div className="flex items-center gap-2">
                            {ACTION_ICONS[action.code.split("_").pop() || ""] || <Eye className="h-3 w-3" />}
                            <div>
                              <p className="font-medium text-sm">{action.label}</p>
                              <p className="text-xs text-muted-foreground">{action.category}</p>
                            </div>
                          </div>
                        </td>
                        {roles?.map((role) => (
                          <td key={role.id} className="text-center p-3">
                            <Checkbox
                              checked={isPermissionGranted(role.code, action.code)}
                              onCheckedChange={() => togglePermission(role.code, action.code)}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}

          {hasChanges && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Vous avez des modifications non enregistrées.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
