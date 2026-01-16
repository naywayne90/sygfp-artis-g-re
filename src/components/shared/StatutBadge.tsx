/**
 * Badge de statut unifié pour toute l'application SYGFP
 * Utilise la configuration centrale pour garantir cohérence visuelle
 */

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getStatutBadge, type BadgeConfig } from "@/lib/config/sygfp-constants";

interface StatutBadgeProps {
  statut: string | null | undefined;
  /** Afficher l'icône à gauche du label */
  showIcon?: boolean;
  /** Taille du badge */
  size?: 'sm' | 'md' | 'lg';
  /** Classes CSS additionnelles */
  className?: string;
  /** Override du label (sinon utilise le label par défaut) */
  customLabel?: string;
}

const sizeClasses = {
  sm: "text-[10px] px-1.5 py-0 h-5",
  md: "text-xs px-2 py-0.5 h-6",
  lg: "text-sm px-3 py-1 h-7",
};

export function StatutBadge({ 
  statut, 
  showIcon = false, 
  size = 'md',
  className,
  customLabel,
}: StatutBadgeProps) {
  const config = getStatutBadge(statut);
  const IconComponent = config.icon;
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        config.className,
        sizeClasses[size],
        "font-medium inline-flex items-center gap-1",
        className
      )}
    >
      {showIcon && IconComponent && (
        <IconComponent className={cn(
          size === 'sm' ? "h-3 w-3" : size === 'lg' ? "h-4 w-4" : "h-3.5 w-3.5"
        )} />
      )}
      <span>{customLabel || config.label}</span>
    </Badge>
  );
}

/**
 * Compteur de statut pour la sidebar et les listes
 */
interface StatutCounterProps {
  count: number;
  category?: BadgeConfig['category'];
  className?: string;
}

export function StatutCounter({ count, category = 'warning', className }: StatutCounterProps) {
  if (count === 0) return null;
  
  const categoryClasses = {
    neutral: "bg-muted text-muted-foreground",
    info: "bg-secondary/20 text-secondary",
    warning: "bg-warning/20 text-warning",
    success: "bg-success/20 text-success",
    error: "bg-destructive/20 text-destructive",
    primary: "bg-primary/20 text-primary",
  };
  
  return (
    <span 
      className={cn(
        "inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-bold",
        categoryClasses[category],
        className
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
