import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface PageLoaderProps {
  message?: string;
  variant?: "spinner" | "skeleton";
}

/**
 * Composant de chargement pour les pages lazy-loaded
 * Utilisé comme fallback dans les Suspense boundaries
 */
export function PageLoader({
  message = "Chargement...",
  variant = "skeleton"
}: PageLoaderProps) {
  if (variant === "spinner") {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    );
  }

  // Skeleton variant - simule la structure d'une page typique
  return (
    <div className="space-y-6 animate-pulse p-6">
      {/* Header avec titre et bouton d'action */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Cartes de statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table ou contenu principal */}
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full mb-3" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default PageLoader;
