/**
 * En-tête de page unifié pour toutes les pages de liste
 * Garantit une cohérence visuelle dans toute l'application
 */

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface PageHeaderProps {
  /** Titre de la page */
  title: string;
  /** Description sous le titre */
  description?: string;
  /** Texte du bouton d'action principal */
  actionLabel?: string;
  /** URL du bouton d'action */
  actionUrl?: string;
  /** Handler onClick du bouton */
  onAction?: () => void;
  /** Icône du bouton (défaut: Plus) */
  actionIcon?: LucideIcon;
  /** Éléments additionnels à droite */
  children?: React.ReactNode;
  /** Classes additionnelles */
  className?: string;
}

export function PageHeader({
  title,
  description,
  actionLabel,
  actionUrl,
  onAction,
  actionIcon: ActionIcon = Plus,
  children,
  className,
}: PageHeaderProps) {
  const actionButton = actionLabel && (
    <Button onClick={onAction}>
      <ActionIcon className="h-4 w-4 mr-2" />
      {actionLabel}
    </Button>
  );

  return (
    <div className={cn("page-header flex items-center justify-between gap-4", className)}>
      <div className="min-w-0 flex-1">
        <h1 className="page-title truncate">{title}</h1>
        {description && (
          <p className="page-description">{description}</p>
        )}
      </div>
      
      <div className="flex items-center gap-2 shrink-0">
        {children}
        {actionLabel && actionUrl ? (
          <Link to={actionUrl}>
            {actionButton}
          </Link>
        ) : (
          actionButton
        )}
      </div>
    </div>
  );
}
