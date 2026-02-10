/**
 * NoteFormFields - Formulaire des metadonnees de la note
 * Numero auto (format NOTE/ARTI/DG/{DIRECTION}/N{SEQ}/{ANNEE})
 * Type de note, Objet, Destinataire(s), Priorite
 */

import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TypeNote, PrioriteNote } from '@/hooks/useNotesDirection';
import type { NoteCanvasMetadata } from './NoteCanvasSidebar';

// ============================================
// TYPES
// ============================================

interface NoteFormFieldsProps {
  metadata: NoteCanvasMetadata;
  onMetadataChange: (partial: Partial<NoteCanvasMetadata>) => void;
  directionSigle?: string;
  sequenceNumber?: number;
  readOnly?: boolean;
}

// ============================================
// CONSTANTES
// ============================================

const TYPE_NOTE_OPTIONS: { value: TypeNote; label: string }[] = [
  { value: 'interne', label: 'Note interne' },
  { value: 'compte_rendu', label: 'Compte rendu' },
  { value: 'rapport', label: 'Rapport' },
  { value: 'memo', label: 'Memo' },
  { value: 'autre', label: 'Autre' },
];

const PRIORITE_OPTIONS: { value: PrioriteNote; label: string; color: string }[] = [
  { value: 'normale', label: 'Normale', color: 'bg-gray-100 text-gray-800' },
  { value: 'haute', label: 'Haute', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgente', label: 'Urgente', color: 'bg-red-100 text-red-800' },
];

// ============================================
// COMPOSANT
// ============================================

export function NoteFormFields({
  metadata,
  onMetadataChange,
  directionSigle,
  sequenceNumber,
  readOnly = false,
}: NoteFormFieldsProps) {
  // Generate auto reference
  const generateReference = useCallback(() => {
    const year = new Date().getFullYear();
    const seq = sequenceNumber || 1;
    const seqStr = String(seq).padStart(3, '0');
    const dir = directionSigle || 'DIR';
    const ref = `NOTE/ARTI/DG/${dir}/N${seqStr}/${year}`;
    onMetadataChange({ reference: ref });
  }, [directionSigle, sequenceNumber, onMetadataChange]);

  return (
    <div className="space-y-4">
      {/* Reference */}
      <div>
        <label className="text-sm font-medium text-gray-700">Reference</label>
        <div className="mt-1 flex gap-2">
          <Input
            value={metadata.reference}
            onChange={(e) => onMetadataChange({ reference: e.target.value })}
            placeholder="NOTE/ARTI/DG/DSI/N001/2026"
            className="flex-1"
            disabled={readOnly}
          />
          {!readOnly && (
            <Button
              variant="outline"
              size="icon"
              onClick={generateReference}
              title="Generer automatiquement"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Format: NOTE/ARTI/DG/{'{DIRECTION}'}/N{'{SEQ}'}/{'{ANNEE}'}
        </p>
      </div>

      {/* Type de note */}
      <div>
        <label className="text-sm font-medium text-gray-700">Type de note</label>
        <Select
          value={metadata.typeNote}
          onValueChange={(v) => onMetadataChange({ typeNote: v as TypeNote })}
          disabled={readOnly}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_NOTE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Objet */}
      <div>
        <label className="text-sm font-medium text-gray-700">Objet *</label>
        <Textarea
          value={metadata.objet}
          onChange={(e) => onMetadataChange({ objet: e.target.value })}
          placeholder="Objet de la note..."
          className="mt-1"
          rows={2}
          disabled={readOnly}
        />
      </div>

      {/* Destinataire */}
      <div>
        <label className="text-sm font-medium text-gray-700">Destinataire(s)</label>
        <Input
          value={metadata.destinataire}
          onChange={(e) => onMetadataChange({ destinataire: e.target.value })}
          placeholder="Ex: Monsieur le Directeur General"
          className="mt-1"
          disabled={readOnly}
        />
      </div>

      {/* Expediteur */}
      <div>
        <label className="text-sm font-medium text-gray-700">De (Expediteur)</label>
        <Input
          value={metadata.expediteur}
          onChange={(e) => onMetadataChange({ expediteur: e.target.value })}
          placeholder="Ex: Le Directeur des Systemes d'Information"
          className="mt-1"
          disabled={readOnly}
        />
      </div>

      {/* Date */}
      <div>
        <label className="text-sm font-medium text-gray-700">Date</label>
        <Input
          type="date"
          value={metadata.dateNote}
          onChange={(e) => onMetadataChange({ dateNote: e.target.value })}
          className="mt-1"
          disabled={readOnly}
        />
      </div>

      {/* Priorite */}
      <div>
        <label className="text-sm font-medium text-gray-700">Priorite</label>
        <div className="mt-1.5 flex gap-2">
          {PRIORITE_OPTIONS.map((opt) => (
            <Badge
              key={opt.value}
              variant="outline"
              className={`cursor-pointer px-3 py-1 transition-colors ${
                metadata.priorite === opt.value
                  ? opt.color + ' border-current font-semibold'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => !readOnly && onMetadataChange({ priorite: opt.value })}
            >
              {opt.label}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
