import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Calendar, RefreshCw, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useExercice } from "@/contexts/ExerciceContext";
import { useNavigate } from "react-router-dom";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ExerciceChangeModal } from "@/components/exercice/ExerciceChangeModal";
import { ExerciceReadOnlyBanner } from "@/components/exercice/ExerciceReadOnlyBanner";
import { Loader2 } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { exercice, exerciceInfo, isReadOnly, isLoading } = useExercice();
  const navigate = useNavigate();
  const [showExerciceModal, setShowExerciceModal] = useState(false);

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
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-card px-4 lg:px-6">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            
            <div className="flex-1" />

            {/* Exercice Badge */}
            <div 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                isReadOnly 
                  ? "bg-warning/10 border border-warning/20 hover:bg-warning/20" 
                  : "bg-primary/10 border border-primary/20 hover:bg-primary/20"
              }`}
              onClick={() => setShowExerciceModal(true)}
            >
              {isReadOnly ? (
                <Lock className="h-4 w-4 text-warning" />
              ) : (
                <Calendar className="h-4 w-4 text-primary" />
              )}
              <span className={`text-sm font-semibold ${isReadOnly ? "text-warning" : "text-primary"}`}>
                Exercice {exercice}
              </span>
              {exerciceInfo?.statut && (
                <Badge 
                  variant="outline" 
                  className={`text-[10px] px-1.5 py-0 ${
                    exerciceInfo.statut === "en_cours" ? "border-success/30 text-success" :
                    exerciceInfo.statut === "ouvert" ? "border-primary/30 text-primary" :
                    exerciceInfo.statut === "cloture" ? "border-warning/30 text-warning" :
                    "border-muted text-muted-foreground"
                  }`}
                >
                  {exerciceInfo.statut === "en_cours" ? "En cours" :
                   exerciceInfo.statut === "ouvert" ? "Ouvert" :
                   exerciceInfo.statut === "cloture" ? "Clôturé" :
                   exerciceInfo.statut === "archive" ? "Archivé" :
                   exerciceInfo.statut}
                </Badge>
              )}
            </div>

            {/* Change Exercice Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExerciceModal(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Changer</span>
            </Button>
            
            {/* Notifications dynamiques */}
            <NotificationBell />

            {/* Institution badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-accent">
              <span className="text-sm font-medium text-accent-foreground">ARTI</span>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-auto p-4 lg:p-6">
            {/* Bannière lecture seule */}
            <ExerciceReadOnlyBanner />
            {children}
          </main>
        </div>
      </div>

      {/* Modal de changement d'exercice */}
      <ExerciceChangeModal 
        open={showExerciceModal} 
        onOpenChange={setShowExerciceModal} 
      />
    </SidebarProvider>
  );
}
