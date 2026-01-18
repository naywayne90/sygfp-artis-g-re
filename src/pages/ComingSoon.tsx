/**
 * Page générique "Coming Soon" pour les modules en développement
 *
 * Cette page s'affiche pour tous les modules avec status='todo' dans le registre.
 * Elle est stable et ne provoque pas de crash.
 */

import { useLocation, Link } from "react-router-dom";
import { Construction, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MODULES_REGISTRY, getModuleByRoute } from "@/config/modules.registry";

const ComingSoon = () => {
  const location = useLocation();
  const currentModule = getModuleByRoute(location.pathname);

  // Trouver le module parent si existe
  const parentModule = currentModule?.parent
    ? MODULES_REGISTRY.find(m => m.id === currentModule.parent)
    : null;

  const moduleName = currentModule?.name || "Module";
  const moduleDescription = currentModule?.description || "Ce module est en cours de développement.";

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-6">
      <Card className="w-full max-w-lg text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <Construction className="h-8 w-8 text-amber-600" />
          </div>
          <CardTitle className="text-2xl">{moduleName}</CardTitle>
          <CardDescription className="text-base">
            Module en cours de développement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            {moduleDescription}
          </p>

          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              Cette fonctionnalité sera bientôt disponible.
              Nous travaillons activement pour vous offrir la meilleure expérience possible.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            {parentModule?.route && (
              <Button variant="outline" asChild>
                <Link to={parentModule.route}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour à {parentModule.name}
                </Link>
              </Button>
            )}
            <Button asChild>
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Accueil
              </Link>
            </Button>
          </div>

          {currentModule?.step && (
            <p className="text-xs text-muted-foreground">
              Étape {currentModule.step} de la chaîne de dépense
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ComingSoon;
