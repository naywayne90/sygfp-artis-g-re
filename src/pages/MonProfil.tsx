import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermissions } from "@/hooks/usePermissions";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  User, 
  Shield, 
  Key, 
  Building2, 
  Calendar,
  CheckCircle,
  XCircle,
  Users,
  ArrowRight,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface RolePermission {
  action_code: string;
  module: string;
  description: string;
  is_granted: boolean;
}

export default function MonProfil() {
  const { userId, userRoles, permissions, isAdmin, getAllPermissions } = usePermissions();

  // Récupérer le profil complet
  const { data: profile } = useQuery({
    queryKey: ["my-profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*, direction:directions(code, label)")
        .eq("id", userId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Récupérer les délégations actives (reçues)
  const { data: delegationsRecues = [] } = useQuery({
    queryKey: ["delegations-recues", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("delegations")
        .select("*, delegateur:profiles!delegations_delegateur_id_fkey(full_name, email)")
        .eq("delegataire_id", userId)
        .eq("est_active", true)
        .gte("date_fin", new Date().toISOString().split("T")[0]);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  // Récupérer les permissions détaillées par rôle
  const { data: rolePermissions = [] } = useQuery({
    queryKey: ["role-permissions-detail", userRoles],
    queryFn: async () => {
      if (userRoles.length === 0) return [];
      const { data, error } = await supabase
        .from("role_permissions")
        .select("action_code, module, description, is_granted")
        .in("role_code", userRoles)
        .eq("is_granted", true)
        .order("module")
        .order("action_code");
      if (error) throw error;
      return data || [];
    },
    enabled: userRoles.length > 0,
  });

  // Grouper les permissions par module
  const permissionsByModule = rolePermissions.reduce((acc, perm) => {
    const module = perm.module || "autre";
    if (!acc[module]) acc[module] = [];
    acc[module].push(perm);
    return acc;
  }, {} as Record<string, RolePermission[]>);

  const allPerms = getAllPermissions();
  const delegatedPerms = allPerms.filter(p => p.via_delegation);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <User className="h-6 w-6" />
          Mon profil
        </h1>
        <p className="page-description">
          Informations de votre compte, rôles et permissions
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Infos utilisateur */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Identité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-medium text-lg">{profile?.full_name || "Utilisateur"}</p>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Direction :</span>
                <span>{(profile?.direction as any)?.libelle || "Non assignée"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Key className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Poste :</span>
                <span>{profile?.poste || "Non défini"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rôles */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Rôles actifs
            </CardTitle>
            <CardDescription>
              Vos rôles déterminent vos permissions dans l'application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {userRoles.length === 0 ? (
                <p className="text-muted-foreground text-sm">Aucun rôle assigné</p>
              ) : (
                userRoles.map((role) => (
                  <Badge 
                    key={role} 
                    variant={role === "ADMIN" ? "destructive" : "default"}
                    className="text-sm py-1 px-3"
                  >
                    {role}
                  </Badge>
                ))
              )}
            </div>

            {isAdmin && (
              <div className="mt-4 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="text-sm text-destructive font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Vous avez les droits administrateur complets
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Délégations reçues */}
      {delegationsRecues.length > 0 && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Délégations actives
            </CardTitle>
            <CardDescription>
              Vous agissez pour le compte d'autres utilisateurs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {delegationsRecues.map((del: any) => (
                <div key={del.id} className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">
                        Délégation de {del.delegateur?.full_name || del.delegateur?.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Périmètre : {del.perimetre?.join(", ") || "Tous modules"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="border-primary text-primary">
                      <Clock className="h-3 w-3 mr-1" />
                      Jusqu'au {new Date(del.date_fin).toLocaleDateString("fr-FR")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {delegatedPerms.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium mb-2">Permissions héritées :</p>
                <div className="flex flex-wrap gap-1">
                  {delegatedPerms.slice(0, 10).map((p) => (
                    <Badge key={p.action_code} variant="secondary" className="text-xs">
                      {p.action_code}
                    </Badge>
                  ))}
                  {delegatedPerms.length > 10 && (
                    <Badge variant="outline" className="text-xs">
                      +{delegatedPerms.length - 10} autres
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Permissions détaillées */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Permissions par module
          </CardTitle>
          <CardDescription>
            Liste détaillée de vos autorisations ({rolePermissions.length} permissions)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(permissionsByModule).length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              Aucune permission configurée pour vos rôles
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(permissionsByModule).map(([module, perms]) => (
                <div key={module} className="p-4 rounded-lg border bg-muted/30">
                  <h4 className="font-medium capitalize mb-3 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    {module}
                  </h4>
                  <div className="space-y-1">
                    {perms.map((perm) => (
                      <div key={perm.action_code} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-success" />
                        <span className="text-muted-foreground">
                          {perm.action_code.split(".")[1] || perm.action_code}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
