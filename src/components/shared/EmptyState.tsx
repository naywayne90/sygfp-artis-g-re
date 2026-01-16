/**
 * Composant Empty State réutilisable
 * Pour afficher un message quand il n'y a pas de données
 */

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileX2, Plus, Search, Upload, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface EmptyStateProps {
  /** Icône à afficher (par défaut FileX2) */
  icon?: LucideIcon;
  /** Titre principal */
  title: string;
  /** Description optionnelle */
  description?: string;
  /** Texte du bouton d'action */
  actionLabel?: string;
  /** URL du bouton (utilise Link) */
  actionUrl?: string;
  /** Handler onClick du bouton */
  onAction?: () => void;
  /** Icône du bouton d'action */
  actionIcon?: LucideIcon;
  /** Taille de l'empty state */
  size?: 'sm' | 'md' | 'lg';
  /** Classes CSS additionnelles */
  className?: string;
}

const sizeConfig = {
  sm: {
    container: "py-6 px-4",
    icon: "h-8 w-8",
    title: "text-sm font-medium",
    description: "text-xs",
    button: "sm" as const,
  },
  md: {
    container: "py-10 px-6",
    icon: "h-12 w-12",
    title: "text-base font-semibold",
    description: "text-sm",
    button: "default" as const,
  },
  lg: {
    container: "py-16 px-8",
    icon: "h-16 w-16",
    title: "text-lg font-bold",
    description: "text-base",
    button: "lg" as const,
  },
};

export function EmptyState({
  icon: Icon = FileX2,
  title,
  description,
  actionLabel,
  actionUrl,
  onAction,
  actionIcon: ActionIcon = Plus,
  size = 'md',
  className,
}: EmptyStateProps) {
  const config = sizeConfig[size];
  
  const actionButton = actionLabel && (
    <Button
      size={config.button}
      onClick={onAction}
      className="mt-4"
    >
      <ActionIcon className="h-4 w-4 mr-2" />
      {actionLabel}
    </Button>
  );
  
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "bg-muted/30 border border-dashed border-muted-foreground/20 rounded-lg",
        config.container,
        className
      )}
    >
      <div className="rounded-full bg-muted p-3 mb-4">
        <Icon className={cn(config.icon, "text-muted-foreground")} />
      </div>
      
      <h3 className={cn(config.title, "text-foreground mb-1")}>
        {title}
      </h3>
      
      {description && (
        <p className={cn(config.description, "text-muted-foreground max-w-sm")}>
          {description}
        </p>
      )}
      
      {actionLabel && actionUrl ? (
        <Link to={actionUrl}>
          {actionButton}
        </Link>
      ) : (
        actionButton
      )}
    </div>
  );
}

// Variantes pré-configurées pour les cas courants

export function EmptyStateNoResults({ 
  searchTerm,
  onClear,
}: { 
  searchTerm?: string;
  onClear?: () => void;
}) {
  return (
    <EmptyState
      icon={Search}
      title="Aucun résultat trouvé"
      description={searchTerm 
        ? `Aucun élément ne correspond à "${searchTerm}". Essayez avec d'autres critères.`
        : "Aucun élément ne correspond à vos critères de recherche."
      }
      actionLabel={onClear ? "Effacer les filtres" : undefined}
      onAction={onClear}
      actionIcon={Search}
    />
  );
}

export function EmptyStateNoData({ 
  entityName,
  actionLabel,
  actionUrl,
  onAction,
}: { 
  entityName: string;
  actionLabel?: string;
  actionUrl?: string;
  onAction?: () => void;
}) {
  return (
    <EmptyState
      title={`Aucun${entityName.match(/^[aeiouéèêë]/i) ? 'e' : ''} ${entityName}`}
      description={`Il n'y a pas encore de ${entityName.toLowerCase()} enregistré${entityName.match(/^[aeiouéèêë]/i) ? 'e' : ''} pour cet exercice.`}
      actionLabel={actionLabel}
      actionUrl={actionUrl}
      onAction={onAction}
    />
  );
}

export function EmptyStateImport({ 
  entityName,
  actionUrl,
}: { 
  entityName: string;
  actionUrl: string;
}) {
  return (
    <EmptyState
      icon={Upload}
      title={`Aucun${entityName.match(/^[aeiouéèêë]/i) ? 'e' : ''} ${entityName}`}
      description={`Importez vos ${entityName.toLowerCase()} pour commencer.`}
      actionLabel="Importer"
      actionUrl={actionUrl}
      actionIcon={Upload}
    />
  );
}
