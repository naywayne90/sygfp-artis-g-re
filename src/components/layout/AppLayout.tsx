/**
 * AppLayout V2 - Layout principal unifié
 * TopBar + SidebarV2 + Contenu principal
 *
 * Gère les redirections automatiques :
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

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { exercice, isReadOnly: _isReadOnly, isLoading, hasNoOpenExercice } = useExercice();
  const navigate = useNavigate();

  useEffect(() => {
    // Si pas d'exercice et pas en cours de chargement
    if (!exercice && !isLoading) {
      // Si aucun exercice ouvert, rediriger vers la page dédiée
      if (hasNoOpenExercice) {
        navigate('/no-open-exercice');
      } else {
        // Sinon, vers la sélection d'exercice
        navigate('/select-exercice');
      }
    }
  }, [exercice, isLoading, hasNoOpenExercice, navigate]);

  // Show shell immediately; only block content area while exercice loads
  if (!exercice && !isLoading) {
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
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">Chargement de l'exercice...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Bannière lecture seule */}
                <ExerciceReadOnlyBanner />
                {children}
              </>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
