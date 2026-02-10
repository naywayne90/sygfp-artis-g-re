/**
 * AppLayout V2 - Layout principal unifié
 * TopBar + SidebarV2 + Contenu principal
 *
 * Gère les redirections automatiques :
 * - Vers /auth si l'utilisateur n'est pas authentifié
 * - Vers /no-open-exercice si aucun exercice ouvert
 * - Vers /select-exercice si pas d'exercice sélectionné
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SidebarV2 } from './SidebarV2';
import { TopBar } from './TopBar';
import { ExerciceReadOnlyBanner } from '@/components/exercice/ExerciceReadOnlyBanner';
import { CommandPalette } from '@/components/command-palette/CommandPalette';
import { useExercice } from '@/contexts/ExerciceContext';
import { useRBAC } from '@/contexts/RBACContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { exercice, isReadOnly: _isReadOnly, isLoading: exerciceLoading, hasNoOpenExercice } = useExercice();
  const { isAuthenticated, isLoading: authLoading } = useRBAC();
  const navigate = useNavigate();

  const isLoading = exerciceLoading || authLoading;

  // Rediriger vers /auth si l'utilisateur n'est pas authentifié
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    // Si pas d'exercice et pas en cours de chargement
    if (!exercice && !isLoading && isAuthenticated) {
      // Si aucun exercice ouvert, rediriger vers la page dédiée
      if (hasNoOpenExercice) {
        navigate('/no-open-exercice');
      } else {
        // Sinon, vers la sélection d'exercice
        navigate('/select-exercice');
      }
    }
  }, [exercice, isLoading, isAuthenticated, hasNoOpenExercice, navigate]);

  // Afficher un loader pendant le chargement initial
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">
            {authLoading ? "Vérification de l'authentification..." : "Chargement de l'exercice..."}
          </p>
        </div>
      </div>
    );
  }

  // Ne rien afficher si non authentifié (la redirection est en cours)
  if (!isAuthenticated) {
    return null;
  }

  if (!exercice) {
    return null;
  }

  return (
    <SidebarProvider>
      {/* Command Palette global (Ctrl+K) */}
      <CommandPalette />

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
