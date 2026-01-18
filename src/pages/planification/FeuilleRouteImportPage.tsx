/**
 * Page d'import des feuilles de route par direction
 */

import { PageHeader } from "@/components/shared/PageHeader";
import { FeuilleRouteImport } from "@/components/planification/FeuilleRouteImport";

export default function FeuilleRouteImportPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Import Feuilles de Route"
        description="Chargement des activités par direction depuis un fichier Excel ou CSV"
        breadcrumbs={[
          { label: "Planification", href: "/planification/budget" },
          { label: "Import Feuilles de Route" },
        ]}
      />

      <FeuilleRouteImport />
    </div>
  );
}
