/**
 * TypeNoteSelector - Sélecteur du type de note (NSEF ou NAEF)
 * Permet de choisir entre une Note Sans Effet Financier et une Note À Effet Financier
 */

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FileText, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export type TypeNote = 'NSEF' | 'NAEF';

export interface TypeNoteSelectorProps {
  /** Valeur actuelle */
  value: TypeNote;
  /** Callback de changement */
  onChange: (value: TypeNote) => void;
  /** Désactiver le sélecteur */
  disabled?: boolean;
  /** Classe CSS additionnelle */
  className?: string;
}

// ============================================================================
// COMPOSANT
// ============================================================================

export function TypeNoteSelector({
  value,
  onChange,
  disabled = false,
  className,
}: TypeNoteSelectorProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <Label className="text-base font-semibold">Type de note *</Label>

      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as TypeNote)}
        disabled={disabled}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* Option NAEF */}
        <label
          htmlFor="naef"
          className={cn(
            'relative flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all',
            value === 'NAEF'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <RadioGroupItem value="NAEF" id="naef" className="mt-1" />
          <div className="flex-1">
            <span className="font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4 text-blue-600" />
              Note À Effet Financier (NAEF)
            </span>
            <p className="text-sm text-gray-500 mt-1">
              Note impliquant une dépense à régler. Comporte un montant et peut
              être imputée budgétairement.
            </p>
          </div>
        </label>

        {/* Option NSEF */}
        <label
          htmlFor="nsef"
          className={cn(
            'relative flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all',
            value === 'NSEF'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:border-gray-300',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <RadioGroupItem value="NSEF" id="nsef" className="mt-1" />
          <div className="flex-1">
            <span className="font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-green-600" />
              Note Sans Effet Financier (NSEF)
            </span>
            <p className="text-sm text-gray-500 mt-1">
              Note d'information ou de coordination. Pas de montant direct. Peut
              optionnellement regrouper des NAEF.
            </p>
          </div>
        </label>
      </RadioGroup>

      {/* Indicateur du type sélectionné */}
      <div className="text-xs text-gray-500 mt-2">
        {value === 'NAEF' ? (
          <span className="flex items-center gap-1">
            <Wallet className="h-3 w-3 text-blue-500" />
            Le champ montant sera requis pour cette note.
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3 text-green-500" />
            Cette note ne comportera pas de montant propre.
          </span>
        )}
      </div>
    </div>
  );
}

export default TypeNoteSelector;
