/**
 * AppLayout V2 - Layout principal unifié
 * TopBar + SidebarV2 + Contenu principal
 */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SidebarV2 } from "./SidebarV2";
import { TopBar } from "./TopBar";
import { ExerciceReadOnlyBanner } from "@/components/exercice/ExerciceReadOnlyBanner";
import { useExercice } from "@/contexts/ExerciceContext";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { exercice, isReadOnly, isLoading } = useExercice();
  const navigate = useNavigate();

  useEffect(() => {
    // Si pas d'exercice et pas en cours de chargement, rediriger vers la sélection
    if (!exercice && !isLoading) {
      navigate("/select-exercice");
    }
  }, [exercice, isLoading, navigate]);

  // Afficher un loader pendant le chargement initial
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement de l'exercice...</p>
        </div>
      </div>
    );
  }

  if (!exercice) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Sidebar sombre V2 */}
        <SidebarV2 />
        
        {/* Zone principale */}
        <div className="flex flex-1 flex-col">
          {/* TopBar unifiée */}
          <TopBar />

          {/* Contenu principal */}
          <main className="flex-1 overflow-auto p-4 lg:p-6">
            {/* Bannière lecture seule */}
            <ExerciceReadOnlyBanner />
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
