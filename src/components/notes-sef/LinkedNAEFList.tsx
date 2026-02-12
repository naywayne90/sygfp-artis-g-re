/**
 * LinkedNAEFList - Liste des NAEF rattachées à une NSEF
 * Affiche les NAEF liées avec leur montant et calcule le total
 */

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link2, Wallet, AlertCircle, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

// ============================================================================
// TYPES
// ============================================================================

interface LinkedNAEF {
  id: string;
  numero: string | null;
  reference_pivot: string | null;
  objet: string;
  statut: string | null;
  montant_estime: number | null;
  created_at: string;
}

export interface LinkedNAEFListProps {
  /** ID de la NSEF parente */
  nsefId: string;
  /** Afficher en mode compact */
  compact?: boolean;
  /** Classe CSS additionnelle */
  className?: string;
}

// ============================================================================
// LABELS DE STATUT
// ============================================================================

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  brouillon: 'secondary',
  soumis: 'outline',
  a_valider: 'default',
  valide: 'default',
  validé: 'default',
  differe: 'secondary',
  différé: 'secondary',
  rejete: 'destructive',
  rejeté: 'destructive',
};

const STATUS_LABELS: Record<string, string> = {
  brouillon: 'Brouillon',
  soumis: 'Soumis',
  a_valider: 'À valider',
  valide: 'Validé',
  validé: 'Validé',
  differe: 'Différé',
  différé: 'Différé',
  rejete: 'Rejeté',
  rejeté: 'Rejeté',
};

// ============================================================================
// COMPOSANT
// ============================================================================

export function LinkedNAEFList({ nsefId, compact = false, className }: LinkedNAEFListProps) {
  // Requête pour récupérer les NAEF liées
  const {
    data: linkedNAEF,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['linked-naef', nsefId],
    queryFn: async (): Promise<LinkedNAEF[]> => {
      // Récupère les Notes AEF (table notes_dg) liées à cette Note SEF
      const { data, error } = await supabase
        .from('notes_dg')
        .select('id, numero, reference_pivot, objet, statut, montant_estime, created_at')
        .eq('note_sef_id', nsefId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as LinkedNAEF[];
    },
    enabled: !!nsefId,
  });

  // Calculer le total des montants
  const totalMontant = linkedNAEF?.reduce((sum, naef) => sum + (naef.montant_estime || 0), 0) || 0;

  // Obtenir la référence affichable
  const getReference = (naef: LinkedNAEF): string => {
    return naef.numero || naef.reference_pivot || 'Brouillon';
  };

  // Obtenir le label de statut
  const getStatusLabel = (status: string | null): string => {
    if (!status) return '-';
    return STATUS_LABELS[status.toLowerCase()] || status;
  };

  // Obtenir la variante de badge
  const getStatusVariant = (status: string | null) => {
    if (!status) return 'secondary' as const;
    return STATUS_VARIANTS[status.toLowerCase()] || ('secondary' as const);
  };

  // État de chargement
  if (isLoading) {
    return (
      <Card className={cn('bg-gray-50', className)}>
        <CardHeader className="py-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="py-2 space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Erreur
  if (error) {
    return (
      <Card className={cn('bg-red-50 border-red-200', className)}>
        <CardContent className="py-4 text-center text-red-600 text-sm">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          Erreur lors du chargement des NAEF liées.
        </CardContent>
      </Card>
    );
  }

  // Aucune NAEF liée
  if (!linkedNAEF || linkedNAEF.length === 0) {
    return (
      <Card className={cn('bg-gray-50', className)}>
        <CardContent className="py-4 text-center text-gray-500 text-sm">
          <Link2 className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          Aucune NAEF rattachée à cette NSEF.
          <p className="text-xs mt-1">Les NAEF peuvent être rattachées lors de leur création.</p>
        </CardContent>
      </Card>
    );
  }

  // Affichage compact
  if (compact) {
    return (
      <div className={cn('space-y-1', className)}>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 text-gray-600">
            <Link2 className="h-3 w-3 text-green-600" />
            {linkedNAEF.length} NAEF rattachée(s)
          </span>
          <span className="font-semibold text-blue-600">{formatCurrency(totalMontant)}</span>
        </div>
      </div>
    );
  }

  // Affichage complet
  return (
    <Card className={className}>
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Link2 className="h-4 w-4 text-green-600" />
          NAEF rattachées ({linkedNAEF.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2">
        <div className="space-y-2">
          {linkedNAEF.map((naef) => (
            <div
              key={naef.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Wallet className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <Link
                  to={`/notes-sef/${naef.id}`}
                  className="font-medium hover:text-blue-600 hover:underline flex items-center gap-1"
                >
                  {getReference(naef)}
                  <ExternalLink className="h-3 w-3" />
                </Link>
                <span className="text-gray-500 truncate">{naef.objet}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant={getStatusVariant(naef.statut)} className="text-xs">
                  {getStatusLabel(naef.statut)}
                </Badge>
                <span className="font-semibold text-blue-600 min-w-[100px] text-right">
                  {formatCurrency(naef.montant_estime || 0)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        {linkedNAEF.length > 0 && (
          <div className="mt-3 pt-3 border-t flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Total des NAEF :</span>
            <span className="text-lg font-bold text-blue-600">{formatCurrency(totalMontant)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default LinkedNAEFList;
