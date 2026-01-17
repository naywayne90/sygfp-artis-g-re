import { Button } from "@/components/ui/button";
import { 
  FolderOpen, 
  Plus, 
  Search, 
  Filter,
  RefreshCw,
  FileQuestion
} from "lucide-react";

interface DossierEmptyStateProps {
  hasFilters?: boolean;
  searchTerm?: string;
  onReset?: () => void;
  onCreate?: () => void;
}

export function DossierEmptyState({ 
  hasFilters = false, 
  searchTerm = "",
  onReset,
  onCreate 
}: DossierEmptyStateProps) {
  // Si une recherche est active mais aucun résultat
  if (searchTerm) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-muted rounded-full blur-xl opacity-50" />
          <div className="relative bg-muted rounded-full p-6">
            <Search className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Aucun résultat pour "{searchTerm}"
        </h3>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          Aucun dossier ne correspond à votre recherche. 
          Essayez avec des termes différents ou vérifiez l'orthographe.
        </p>
        <div className="flex gap-3">
          {onReset && (
            <Button variant="outline" onClick={onReset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Si des filtres sont actifs mais aucun résultat
  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-amber-100 dark:bg-amber-900/30 rounded-full blur-xl opacity-50" />
          <div className="relative bg-amber-100 dark:bg-amber-900/30 rounded-full p-6">
            <Filter className="h-12 w-12 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Aucun dossier avec ces critères
        </h3>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          Les filtres appliqués ne retournent aucun résultat. 
          Modifiez ou réinitialisez les filtres pour voir d'autres dossiers.
        </p>
        <div className="flex gap-3">
          {onReset && (
            <Button variant="outline" onClick={onReset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Réinitialiser les filtres
            </Button>
          )}
        </div>
      </div>
    );
  }

  // État vide par défaut - aucun dossier créé
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl opacity-50" />
        <div className="relative bg-primary/10 rounded-full p-6">
          <FolderOpen className="h-12 w-12 text-primary" />
        </div>
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        Aucun dossier pour cet exercice
      </h3>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        Commencez par créer un nouveau dossier pour initier une opération de dépense.
        Chaque dossier suivra la chaîne complète : Note → Engagement → Liquidation → Règlement.
      </p>
      {onCreate && (
        <Button onClick={onCreate} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Créer un dossier
        </Button>
      )}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground max-w-2xl">
        <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
          <FileQuestion className="h-5 w-5 mt-0.5 text-primary" />
          <div>
            <p className="font-medium text-foreground">Type AEF</p>
            <p>Achat de biens et fournitures</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
          <FileQuestion className="h-5 w-5 mt-0.5 text-primary" />
          <div>
            <p className="font-medium text-foreground">Type SEF</p>
            <p>Prestations de services</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
          <FileQuestion className="h-5 w-5 mt-0.5 text-primary" />
          <div>
            <p className="font-medium text-foreground">Type Marché</p>
            <p>Marchés publics</p>
          </div>
        </div>
      </div>
    </div>
  );
}
