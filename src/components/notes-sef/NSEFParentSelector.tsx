/**
 * NSEFParentSelector - Sélecteur de NSEF parente
 * Permet de rattacher optionnellement une NAEF à une NSEF existante
 */

import { useState, useEffect, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link2, X, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface NSEFItem {
  id: string;
  numero: string | null;
  reference_pivot: string | null;
  objet: string;
  statut: string | null;
}

export interface NSEFParentSelectorProps {
  /** ID de la NSEF parente sélectionnée */
  value: string | null;
  /** Callback de changement */
  onChange: (value: string | null) => void;
  /** Désactiver le sélecteur */
  disabled?: boolean;
  /** Exercice pour filtrer les NSEF */
  exercice?: number;
  /** Classe CSS additionnelle */
  className?: string;
}

// ============================================================================
// COMPOSANT
// ============================================================================

export function NSEFParentSelector({
  value,
  onChange,
  disabled = false,
  exercice,
  className,
}: NSEFParentSelectorProps) {
  const [nsefList, setNsefList] = useState<NSEFItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fonction de chargement avec useCallback
  const loadNSEFList = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Exécuter la requête avec filtres conditionnels
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const query = supabase.from('notes_sef').select('id, numero, reference_pivot, objet, statut') as any;
      const { data, error: fetchError } = await query
        .eq('type_note', 'NSEF')
        .neq('statut', 'rejete')
        .eq('exercice', exercice || 0)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      setNsefList((data as NSEFItem[]) || []);
    } catch (err) {
      console.error('[NSEFParentSelector] Erreur chargement:', err);
      setError('Impossible de charger les NSEF disponibles');
      setNsefList([]);
    } finally {
      setIsLoading(false);
    }
  }, [exercice]);

  // Charger la liste au montage et quand l'exercice change
  useEffect(() => {
    loadNSEFList();
  }, [loadNSEFList]);

  // Obtenir la référence affichable d'une NSEF
  const getReference = (nsef: NSEFItem): string => {
    return nsef.numero || nsef.reference_pivot || 'Brouillon';
  };

  // Trouver la NSEF sélectionnée
  const selectedNSEF = value
    ? nsefList.find((n) => n.id === value)
    : null;

  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-sm text-gray-600 flex items-center gap-2">
        <Link2 className="h-4 w-4 text-green-600" />
        Rattacher à une NSEF (optionnel)
      </Label>

      {error ? (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
          <AlertCircle className="h-4 w-4" />
          {error}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={loadNSEFList}
            className="ml-auto"
          >
            Réessayer
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Select
            value={value || 'none'}
            onValueChange={(v) => onChange(v === 'none' ? null : v)}
            disabled={disabled || isLoading}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Aucune - Note indépendante" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <span className="text-gray-500">Aucune - Note indépendante</span>
              </SelectItem>

              {nsefList.length === 0 ? (
                <div className="px-2 py-4 text-center text-sm text-gray-500">
                  Aucune NSEF disponible
                </div>
              ) : (
                nsefList.map((nsef) => (
                  <SelectItem key={nsef.id} value={nsef.id}>
                    <div className="flex items-center gap-2">
                      <Link2 className="h-3 w-3 text-green-600 flex-shrink-0" />
                      <span className="font-medium">{getReference(nsef)}</span>
                      <span className="text-gray-400 text-xs truncate max-w-[200px]">
                        - {nsef.objet}
                      </span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          {value && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onChange(null)}
              title="Retirer le lien"
              disabled={disabled}
            >
              <X className="h-4 w-4 text-gray-400" />
            </Button>
          )}
        </div>
      )}

      {/* Informations sur la NSEF sélectionnée */}
      {selectedNSEF && (
        <div className="bg-green-50 border border-green-200 rounded p-2 text-sm">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-green-600" />
            <span className="font-medium text-green-800">
              Rattachée à : {getReference(selectedNSEF)}
            </span>
          </div>
          <p className="text-green-700 text-xs mt-1 truncate">
            {selectedNSEF.objet}
          </p>
        </div>
      )}

      <p className="text-xs text-gray-400">
        Optionnel : Vous pouvez rattacher cette NAEF à une NSEF existante pour
        les activités complexes impliquant plusieurs dépenses.
      </p>
    </div>
  );
}

export default NSEFParentSelector;
