/**
 * Page d'import des feuilles de route par direction
 */

import { FeuilleRouteImport } from '@/components/planification/FeuilleRouteImport';

export default function FeuilleRouteImportPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <FeuilleRouteImport />
    </div>
  );
}
