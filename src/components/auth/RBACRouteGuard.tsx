/**
 * Composant de protection de route RBAC
 * Redirige si l'utilisateur n'a pas accès
 */

import React, { useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRBAC } from '@/contexts/RBACContext';
import { Loader2, ShieldAlert, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RBACRouteGuardProps {
  children: ReactNode;
  /**
   * Si true, ne redirige pas mais affiche un message d'accès refusé
   */
  showAccessDenied?: boolean;
  /**
   * Route de fallback si accès refusé (défaut: /)
   */
  fallbackRoute?: string;
  /**
   * Profils requis (si défini, surcharge la matrice)
   */
  requiredProfiles?: string[];
}

/**
 * Garde de route RBAC
 * Protège une route en vérifiant les permissions de l'utilisateur
 */
export function RBACRouteGuard({
  children,
  showAccessDenied = false,
  fallbackRoute = '/',
  requiredProfiles,
}: RBACRouteGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    isLoading,
    isAuthenticated,
    canAccess,
    isAdmin,
    getProfilLabel,
    getProfilColor,
  } = useRBAC();

  // Vérifier l'accès
  const hasAccess = React.useMemo(() => {
    if (!isAuthenticated) return false;
    if (isAdmin) return true;

    // Si des profils requis sont spécifiés
    if (requiredProfiles && requiredProfiles.length > 0) {
      return requiredProfiles.includes(user?.profilFonctionnel || '');
    }

    // Sinon, utiliser la matrice de routes
    return canAccess(location.pathname);
  }, [isAuthenticated, isAdmin, requiredProfiles, user?.profilFonctionnel, canAccess, location.pathname]);

  // Redirection si pas d'accès
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      navigate('/auth', { replace: true });
      return;
    }

    if (!hasAccess && !showAccessDenied) {
      navigate(fallbackRoute, { replace: true });
    }
  }, [isLoading, isAuthenticated, hasAccess, showAccessDenied, fallbackRoute, navigate]);

  // État de chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  // Pas authentifié
  if (!isAuthenticated) {
    return null;
  }

  // Accès refusé avec affichage
  if (!hasAccess && showAccessDenied) {
    return (
      <div className="flex items-center justify-center min-h-[500px] p-8">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-destructive/10 w-fit">
              <ShieldAlert className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle>Accès non autorisé</CardTitle>
            <CardDescription>
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Votre profil :</span>
                <Badge
                  variant="outline"
                  style={{ borderColor: getProfilColor(), color: getProfilColor() }}
                >
                  {getProfilLabel()}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Page demandée :</span>
                <code className="text-xs bg-background px-2 py-1 rounded">
                  {location.pathname}
                </code>
              </div>
              {requiredProfiles && requiredProfiles.length > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Profils requis :</span>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {requiredProfiles.map(p => (
                      <Badge key={p} variant="secondary" className="text-xs">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate(-1)}
              >
                Retour
              </Button>
              <Button
                className="flex-1"
                onClick={() => navigate('/')}
              >
                Tableau de bord
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Accès autorisé
  return <>{children}</>;
}

/**
 * Composant HOC pour protéger une page
 */
export function withRBACGuard<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<RBACRouteGuardProps, 'children'>
) {
  return function ProtectedComponent(props: P) {
    return (
      <RBACRouteGuard {...options}>
        <Component {...props} />
      </RBACRouteGuard>
    );
  };
}

/**
 * Badge de profil utilisateur
 */
export function UserProfileBadge() {
  const { user, getProfilLabel, getProfilColor, getRoleLabel } = useRBAC();

  if (!user) return null;

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant="outline"
        style={{ borderColor: getProfilColor(), color: getProfilColor() }}
        className="text-xs"
      >
        {getProfilLabel()}
      </Badge>
      {user.roleHierarchique && (
        <span className="text-xs text-muted-foreground">
          {getRoleLabel()}
        </span>
      )}
    </div>
  );
}

/**
 * Indicateur d'accès pour le debug
 */
export function RBACDebugIndicator() {
  const { user, accessibleRoutes, isAdmin } = useRBAC();
  const location = useLocation();

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 right-4 p-3 bg-background border rounded-lg shadow-lg text-xs max-w-xs z-50">
      <div className="font-semibold mb-2 flex items-center gap-2">
        <Lock className="h-3 w-3" />
        RBAC Debug
      </div>
      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Profil:</span>
          <span className="font-mono">{user?.profilFonctionnel || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Rôle:</span>
          <span className="font-mono">{user?.roleHierarchique || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Route:</span>
          <span className="font-mono">{location.pathname}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Admin:</span>
          <span>{isAdmin ? '✅' : '❌'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Routes OK:</span>
          <span>{accessibleRoutes.length}</span>
        </div>
      </div>
    </div>
  );
}

export default RBACRouteGuard;
