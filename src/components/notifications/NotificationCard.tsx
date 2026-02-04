/**
 * NotificationCard - Carte de notification enrichie
 * Affiche les détails financiers, liens vers les dossiers et priorité
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Bell,
  CheckCheck,
  X,
  FileText,
  Clock,
  AlertTriangle,
  User,
  Banknote,
  CreditCard,
  Receipt,
  FileCheck,
  ArrowRight,
  Eye,
  Trash2,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface NotificationMetadata {
  reference?: string;
  montant?: number;
  montant_net?: number;
  montant_deja_regle?: number;
  montant_restant?: number;
  montant_reglement_courant?: number;
  fournisseur?: string;
  direction?: string;
  objet?: string;
  mode_paiement?: string;
  banque?: string;
  date?: string;
  validateur?: string;
  motif?: string;
  is_partial?: boolean;
}

export interface NotificationData {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  is_urgent: boolean;
  read_at: string | null;
  created_at: string;
  metadata?: NotificationMetadata | null;
}

export interface NotificationCardProps {
  notification: NotificationData;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (notification: NotificationData) => void;
  showActions?: boolean;
  compact?: boolean;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const TYPE_ICONS: Record<string, React.ReactNode> = {
  validation: <Bell className="h-5 w-5 text-primary" />,
  rejet: <X className="h-5 w-5 text-destructive" />,
  differe: <Clock className="h-5 w-5 text-amber-500" />,
  piece_manquante: <FileText className="h-5 w-5 text-orange-500" />,
  alerte: <AlertTriangle className="h-5 w-5 text-amber-500" />,
  info: <Bell className="h-5 w-5 text-muted-foreground" />,
  echeance: <Clock className="h-5 w-5 text-purple-500" />,
  budget_insuffisant: <Banknote className="h-5 w-5 text-destructive" />,
  assignation: <User className="h-5 w-5 text-primary" />,
  ordonnancement: <FileCheck className="h-5 w-5 text-blue-600" />,
  reglement: <CreditCard className="h-5 w-5 text-green-600" />,
  reglement_partiel: <Receipt className="h-5 w-5 text-orange-600" />,
  note_soumise: <FileText className="h-5 w-5 text-indigo-500" />,
  note_validee: <CheckCheck className="h-5 w-5 text-green-500" />,
  note_rejetee: <X className="h-5 w-5 text-destructive" />,
  engagement_cree: <FileText className="h-5 w-5 text-blue-500" />,
  liquidation_validee: <Receipt className="h-5 w-5 text-green-500" />,
  dossier_a_valider: <FileText className="h-5 w-5 text-primary" />,
};

const TYPE_COLORS: Record<string, string> = {
  validation: 'border-l-primary bg-primary/5',
  rejet: 'border-l-destructive bg-destructive/5',
  differe: 'border-l-amber-500 bg-amber-50 dark:bg-amber-900/10',
  piece_manquante: 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/10',
  alerte: 'border-l-amber-500 bg-amber-50 dark:bg-amber-900/10',
  info: 'border-l-muted-foreground bg-muted/30',
  echeance: 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/10',
  budget_insuffisant: 'border-l-destructive bg-destructive/5',
  assignation: 'border-l-primary bg-primary/5',
  ordonnancement: 'border-l-blue-600 bg-blue-50 dark:bg-blue-900/10',
  reglement: 'border-l-green-600 bg-green-50 dark:bg-green-900/10',
  reglement_partiel: 'border-l-orange-600 bg-orange-50 dark:bg-orange-900/10',
  note_soumise: 'border-l-indigo-500 bg-indigo-50 dark:bg-indigo-900/10',
  note_validee: 'border-l-green-500 bg-green-50 dark:bg-green-900/10',
  note_rejetee: 'border-l-destructive bg-destructive/5',
  engagement_cree: 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10',
  liquidation_validee: 'border-l-green-500 bg-green-50 dark:bg-green-900/10',
  dossier_a_valider: 'border-l-primary bg-primary/5',
};

const ENTITY_ROUTES: Record<string, string> = {
  note: '/notes-aef',
  note_aef: '/notes-aef',
  note_sef: '/notes-sef',
  engagement: '/engagements',
  liquidation: '/liquidations',
  ordonnancement: '/ordonnancements',
  reglement: '/reglements',
  marche: '/marches',
  dossier: '/recherche',
};

// ============================================================================
// HELPERS
// ============================================================================

function formatMontant(montant: number | undefined): string {
  if (montant === undefined || montant === null) return 'N/A';
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montant) + ' FCFA';
}

function getEntityRoute(entityType: string | null, entityId: string | null): string | null {
  if (!entityType || !entityId) return null;
  const route = ENTITY_ROUTES[entityType];
  return route ? `${route}/${entityId}` : null;
}

// ============================================================================
// COMPOSANT
// ============================================================================

export function NotificationCard({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
  showActions = true,
  compact = false,
}: NotificationCardProps) {
  const navigate = useNavigate();

  const metadata = notification.metadata;
  const hasFinancialData = metadata && (
    metadata.montant ||
    metadata.montant_net ||
    metadata.montant_deja_regle ||
    metadata.montant_restant ||
    metadata.montant_reglement_courant
  );

  const entityRoute = useMemo(
    () => getEntityRoute(notification.entity_type, notification.entity_id),
    [notification.entity_type, notification.entity_id]
  );

  const isFinancialNotification = ['ordonnancement', 'reglement', 'reglement_partiel'].includes(notification.type);

  const handleClick = () => {
    if (onClick) {
      onClick(notification);
    } else if (entityRoute) {
      if (!notification.is_read && onMarkAsRead) {
        onMarkAsRead(notification.id);
      }
      navigate(entityRoute);
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkAsRead?.(notification.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(notification.id);
  };

  // Version compacte pour les listes
  if (compact) {
    return (
      <div
        className={cn(
          'flex items-start gap-3 p-3 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-sm',
          TYPE_COLORS[notification.type] || 'border-l-muted bg-muted/30',
          !notification.is_read && 'ring-1 ring-primary/20'
        )}
        onClick={handleClick}
      >
        <div className="shrink-0 mt-0.5">
          {TYPE_ICONS[notification.type] || <Bell className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={cn('text-sm', !notification.is_read && 'font-semibold')}>
              {notification.title}
            </p>
            <div className="flex items-center gap-1 shrink-0">
              {!notification.is_read && (
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              )}
              {notification.is_urgent && (
                <Badge variant="destructive" className="text-[9px] px-1 py-0">
                  Urgent
                </Badge>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {notification.message}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: fr })}
          </p>
        </div>
      </div>
    );
  }

  // Version complète
  return (
    <Card
      className={cn(
        'overflow-hidden cursor-pointer transition-all hover:shadow-md border-l-4',
        TYPE_COLORS[notification.type] || 'border-l-muted',
        !notification.is_read && 'ring-2 ring-primary/20'
      )}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="shrink-0 p-2 rounded-lg bg-background shadow-sm">
              {TYPE_ICONS[notification.type] || <Bell className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className={cn('text-sm', !notification.is_read && 'font-semibold')}>
                  {notification.title}
                </h4>
                {!notification.is_read && (
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span>{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: fr })}</span>
                {notification.is_urgent && (
                  <Badge variant="destructive" className="text-[10px]">Urgent</Badge>
                )}
                {metadata?.is_partial && (
                  <Badge variant="outline" className="text-[10px] border-orange-300 text-orange-600">
                    Partiel
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex items-center gap-1 shrink-0">
              {!notification.is_read && onMarkAsRead && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleMarkAsRead}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Marquer comme lu</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {onDelete && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Supprimer</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          )}
        </div>

        {/* Section financière */}
        {isFinancialNotification && hasFinancialData && (
          <div className="mt-4 pt-4 border-t">
            <h5 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Banknote className="h-3 w-3" />
              Détails financiers
            </h5>
            <Table>
              <TableBody>
                {metadata?.reference && (
                  <TableRow className="border-0">
                    <TableCell className="py-1 px-0 text-xs text-muted-foreground">Référence</TableCell>
                    <TableCell className="py-1 px-0 text-xs font-mono text-right">{metadata.reference}</TableCell>
                  </TableRow>
                )}
                {metadata?.montant_net && (
                  <TableRow className="border-0">
                    <TableCell className="py-1 px-0 text-xs text-muted-foreground">Montant net</TableCell>
                    <TableCell className="py-1 px-0 text-xs font-medium text-right">{formatMontant(metadata.montant_net)}</TableCell>
                  </TableRow>
                )}
                {metadata?.montant_reglement_courant && (
                  <TableRow className="border-0">
                    <TableCell className="py-1 px-0 text-xs text-muted-foreground">Règlement courant</TableCell>
                    <TableCell className="py-1 px-0 text-xs font-medium text-green-600 text-right">{formatMontant(metadata.montant_reglement_courant)}</TableCell>
                  </TableRow>
                )}
                {metadata?.montant_deja_regle !== undefined && (
                  <TableRow className="border-0">
                    <TableCell className="py-1 px-0 text-xs text-muted-foreground">Déjà réglé</TableCell>
                    <TableCell className="py-1 px-0 text-xs text-right">{formatMontant(metadata.montant_deja_regle)}</TableCell>
                  </TableRow>
                )}
                {metadata?.montant_restant !== undefined && metadata.montant_restant > 0 && (
                  <TableRow className="border-0">
                    <TableCell className="py-1 px-0 text-xs text-muted-foreground">Reste à payer</TableCell>
                    <TableCell className="py-1 px-0 text-xs font-medium text-orange-600 text-right">{formatMontant(metadata.montant_restant)}</TableCell>
                  </TableRow>
                )}
                {metadata?.fournisseur && (
                  <TableRow className="border-0">
                    <TableCell className="py-1 px-0 text-xs text-muted-foreground">Fournisseur</TableCell>
                    <TableCell className="py-1 px-0 text-xs text-right">{metadata.fournisseur}</TableCell>
                  </TableRow>
                )}
                {metadata?.mode_paiement && (
                  <TableRow className="border-0">
                    <TableCell className="py-1 px-0 text-xs text-muted-foreground">Mode paiement</TableCell>
                    <TableCell className="py-1 px-0 text-xs text-right">{metadata.mode_paiement}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Lien vers le dossier */}
        {entityRoute && (
          <div className="mt-4 pt-3 border-t flex justify-end">
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={(e) => { e.stopPropagation(); navigate(entityRoute); }}>
              Voir le dossier
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default NotificationCard;
