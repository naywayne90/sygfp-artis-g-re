/**
 * PageHeader - En-tête de page unifié avec breadcrumbs et bouton retour
 *
 * Garantit une cohérence visuelle et de navigation dans toute l'application.
 * Inclut :
 * - Fil d'Ariane (breadcrumbs) auto-généré ou manuel
 * - Bouton retour optionnel
 * - Icône de page optionnelle
 * - Titre + description
 * - Zone d'actions (boutons, filtres)
 */

import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { cn } from '@/lib/utils';
import { ArrowLeft, Plus, type LucideIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  useBreadcrumbs,
  useParentRoute,
  type BreadcrumbItem as BreadcrumbItemType,
} from '@/hooks/useBreadcrumbs';
import React from 'react';

interface PageHeaderProps {
  /** Titre de la page */
  title: string;
  /** Description sous le titre */
  description?: string;
  /** Icône affichée à gauche du titre */
  icon?: LucideIcon;
  /** Afficher le bouton retour (défaut: true) */
  showBackButton?: boolean;
  /** URL personnalisée pour le bouton retour */
  backUrl?: string;
  /** Handler personnalisé pour le bouton retour */
  onBack?: () => void;
  /** Breadcrumbs manuels (remplace l'auto-génération) */
  breadcrumbs?: BreadcrumbItemType[];
  /** Masquer les breadcrumbs */
  hideBreadcrumbs?: boolean;
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
  /** Badge ou numéro d'étape affiché sur l'icône */
  stepNumber?: number;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  showBackButton = true,
  backUrl,
  onBack,
  breadcrumbs: manualBreadcrumbs,
  hideBreadcrumbs = false,
  actionLabel,
  actionUrl,
  onAction,
  actionIcon: ActionIcon = Plus,
  children,
  className,
  stepNumber,
}: PageHeaderProps) {
  const navigate = useNavigate();
  const autoBreadcrumbs = useBreadcrumbs(manualBreadcrumbs);
  const parentRoute = useParentRoute();

  const breadcrumbItems = hideBreadcrumbs ? [] : autoBreadcrumbs;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backUrl) {
      navigate(backUrl);
    } else {
      navigate(parentRoute);
    }
  };

  const actionButton = actionLabel && (
    <Button onClick={onAction} size="sm">
      <ActionIcon className="h-4 w-4 mr-2" />
      {actionLabel}
    </Button>
  );

  return (
    <div className={cn('space-y-3', className)}>
      {/* Breadcrumbs */}
      {breadcrumbItems.length > 1 && (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbItems.map((item, index) => (
              <React.Fragment key={index}>
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {item.href ? (
                    <BreadcrumbLink asChild>
                      <Link to={item.href}>{item.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      {/* Header principal */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Bouton retour */}
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="shrink-0 h-9 w-9"
              title="Retour"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}

          {/* Icône de page */}
          {Icon && (
            <div className="relative shrink-0">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              {stepNumber !== undefined && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                  {stepNumber}
                </span>
              )}
            </div>
          )}

          {/* Titre + description */}
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight truncate">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5 truncate">{description}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {children}
          {actionLabel && actionUrl ? <Link to={actionUrl}>{actionButton}</Link> : actionButton}
        </div>
      </div>
    </div>
  );
}
