/**
 * Dashboard - Aiguilleur intelligent basé sur le rôle et la direction
 *
 * Logique d'aiguillage (ordre de priorité) :
 * 1. Loading → Skeleton
 * 2. Admin → AdminDashboardFallback (mode debug avec tous les onglets)
 * 3. DG → DashboardDG
 * 4. DAF/SDCT → DashboardDAF
 * 5. TRESORERIE/AC → DashboardTresorerie
 * 6. Direction DSI → DashboardDSI
 * 7. Direction DMG → DashboardMoyensGen
 * 8. Autres → DashboardDirectionPage (lazy loaded)
 */
import { lazy, Suspense } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useUserDirection } from '@/hooks/useDashboardStats';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

// Dashboards par rôle
import { DashboardDG } from '@/components/dashboard/DashboardDG';
import { DashboardDAF } from '@/components/dashboard/DashboardDAF';
import { DashboardTresorerie } from '@/components/dashboard/DashboardTresorerie';
import { DashboardCB } from '@/components/dashboard/DashboardCB';
import { DashboardDSI } from '@/components/dashboard/DashboardDSI';
import { DashboardMoyensGen } from '@/components/dashboard/DashboardMoyensGen';
import { DashboardHR } from '@/components/dashboard/DashboardHR';
import { DashboardAICB } from '@/components/dashboard/DashboardAICB';

// Dashboard générique pour les directions (lazy loaded pour éviter le double import)
const DashboardDirectionPage = lazy(() => import('@/pages/execution/DashboardDirectionPage'));

// Fallback Admin (dashboard complet avec tous les onglets)
import { AdminDashboardFallback } from './AdminDashboardFallback';

/**
 * Composant Skeleton pour le chargement
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Cards skeleton */}
      <div className="grid gap-4 md:grid-cols-4">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Content skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { hasAnyRole, isAdmin, isLoading: permLoading } = usePermissions();
  const { data: userDir, isLoading: dirLoading } = useUserDirection();

  const isLoading = permLoading || dirLoading;

  // 1. État de chargement
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // 2. Admin → Dashboard complet avec tous les onglets (mode debug)
  if (isAdmin) {
    return <AdminDashboardFallback />;
  }

  // 3. DG → Dashboard DG
  if (hasAnyRole(['DG'])) {
    return <DashboardDG />;
  }

  // 4. DAF / SDCT → Dashboard DAF
  if (hasAnyRole(['DAF', 'SDCT'])) {
    return <DashboardDAF />;
  }

  // 4.5 CB → Dashboard Contrôle Budgétaire
  if (hasAnyRole(['CB'])) {
    return <DashboardCB />;
  }

  // 5. Trésorerie / AC → Dashboard Trésorerie
  if (hasAnyRole(['TRESORERIE', 'AC'])) {
    return <DashboardTresorerie />;
  }

  // 6-7. Aiguillage par code de direction
  const directionCode = userDir?.directions?.code;

  // Direction DSI (Systèmes d'Information)
  if (directionCode === 'DSI') {
    return <DashboardDSI />;
  }

  // Direction SDMG / DMG (Moyens Généraux)
  if (directionCode === 'SDMG' || directionCode === 'DMG') {
    return <DashboardMoyensGen />;
  }

  // Direction DGPECRP (Ressources Humaines)
  if (directionCode === 'DGPECRP') {
    return (
      <DashboardHR
        directionId={userDir?.direction_id || ''}
        directionCode={directionCode || ''}
        directionNom={userDir?.directions?.label || 'Ressources Humaines'}
      />
    );
  }

  // Direction AICB (Auditeur Interne / Contrôleur Budgétaire)
  if (directionCode === 'AICB') {
    return (
      <DashboardAICB
        directionId={userDir?.direction_id || ''}
        directionCode={directionCode || ''}
        directionNom={userDir?.directions?.label || 'Audit Interne'}
      />
    );
  }

  // 8. Fallback → Dashboard générique par direction (lazy loaded)
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardDirectionPage />
    </Suspense>
  );
}
