/**
 * NoteCanvasSidebar - Panneau lateral droit du canvas
 * Proprietes, Metadonnees, Rattachement, Export, Info
 */

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  FileText,
  Download,
  Printer,
  FileDown,
  Settings,
  Info,
  Link2,
  Calendar,
  User,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { TypeNote, StatutNote, PrioriteNote } from '@/hooks/useNotesDirection';

// ============================================
// TYPES
// ============================================

export interface NoteCanvasMetadata {
  reference: string;
  destinataire: string;
  expediteur: string;
  dateNote: string;
  objet: string;
  typeNote: TypeNote;
  priorite: PrioriteNote;
  statut: StatutNote;
  tags: string[];
  objectifStrategique: string;
  action: string;
  budgetPrevisionnel: string;
}

interface NoteCanvasSidebarProps {
  metadata: NoteCanvasMetadata;
  onMetadataChange: (partial: Partial<NoteCanvasMetadata>) => void;
  onExportPdf: () => void;
  onExportWord: () => void;
  onPrint: () => void;
  createdAt?: string;
  updatedAt?: string;
  authorName?: string;
  readOnly?: boolean;
}

// ============================================
// CONSTANTES
// ============================================

const TYPE_NOTE_LABELS: Record<TypeNote, string> = {
  interne: 'Note interne',
  compte_rendu: 'Compte rendu',
  rapport: 'Rapport',
  memo: 'Memo',
  autre: 'Autre',
};

const PRIORITE_LABELS: Record<PrioriteNote, string> = {
  normale: 'Normale',
  haute: 'Haute',
  urgente: 'Urgente',
};

const STATUT_LABELS: Record<StatutNote, string> = {
  brouillon: 'Brouillon',
  publie: 'Publie',
  archive: 'Archive',
};

// ============================================
// COMPOSANT
// ============================================

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <CollapsibleTrigger className="flex w-full items-center gap-2 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900">
      <Icon className="h-4 w-4" />
      {label}
    </CollapsibleTrigger>
  );
}

export function NoteCanvasSidebar({
  metadata,
  onMetadataChange,
  onExportPdf,
  onExportWord,
  onPrint,
  createdAt,
  updatedAt,
  authorName,
  readOnly = false,
}: NoteCanvasSidebarProps) {
  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 p-4">
        {/* Section Proprietes */}
        <Collapsible defaultOpen>
          <SectionHeader icon={Settings} label="Proprietes" />
          <CollapsibleContent className="space-y-3 pb-3">
            <div>
              <label className="text-xs font-medium text-gray-500">Type de note</label>
              <Select
                value={metadata.typeNote}
                onValueChange={(v) => onMetadataChange({ typeNote: v as TypeNote })}
                disabled={readOnly}
              >
                <SelectTrigger className="mt-1 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_NOTE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Priorite</label>
              <Select
                value={metadata.priorite}
                onValueChange={(v) => onMetadataChange({ priorite: v as PrioriteNote })}
                disabled={readOnly}
              >
                <SelectTrigger className="mt-1 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Statut</label>
              <div className="mt-1">
                <Badge variant={metadata.statut === 'publie' ? 'default' : 'outline'}>
                  {STATUT_LABELS[metadata.statut]}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Tags</label>
              <div className="mt-1 flex flex-wrap gap-1">
                {metadata.tags.length > 0 ? (
                  metadata.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-gray-400">Aucun tag</span>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Section Metadonnees */}
        <Collapsible defaultOpen>
          <SectionHeader icon={FileText} label="Metadonnees" />
          <CollapsibleContent className="space-y-3 pb-3">
            <div>
              <label className="text-xs font-medium text-gray-500">Reference</label>
              <Input
                value={metadata.reference}
                onChange={(e) => onMetadataChange({ reference: e.target.value })}
                placeholder="Ex: ND/ARTI/DG/2026/001"
                className="mt-1 h-8 text-xs"
                disabled={readOnly}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Destinataire</label>
              <Input
                value={metadata.destinataire}
                onChange={(e) => onMetadataChange({ destinataire: e.target.value })}
                placeholder="Destinataire"
                className="mt-1 h-8 text-xs"
                disabled={readOnly}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Expediteur</label>
              <Input
                value={metadata.expediteur}
                onChange={(e) => onMetadataChange({ expediteur: e.target.value })}
                placeholder="Expediteur"
                className="mt-1 h-8 text-xs"
                disabled={readOnly}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Date de la note</label>
              <Input
                type="date"
                value={metadata.dateNote}
                onChange={(e) => onMetadataChange({ dateNote: e.target.value })}
                className="mt-1 h-8 text-xs"
                disabled={readOnly}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Objet</label>
              <Input
                value={metadata.objet}
                onChange={(e) => onMetadataChange({ objet: e.target.value })}
                placeholder="Objet de la note"
                className="mt-1 h-8 text-xs"
                disabled={readOnly}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Section Rattachement */}
        <Collapsible>
          <SectionHeader icon={Link2} label="Rattachement" />
          <CollapsibleContent className="space-y-3 pb-3">
            <div>
              <label className="text-xs font-medium text-gray-500">Objectif strategique</label>
              <Input
                value={metadata.objectifStrategique}
                onChange={(e) => onMetadataChange({ objectifStrategique: e.target.value })}
                placeholder="Ex: OS1 - Construire la structure..."
                className="mt-1 h-8 text-xs"
                disabled={readOnly}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Action</label>
              <Input
                value={metadata.action}
                onChange={(e) => onMetadataChange({ action: e.target.value })}
                placeholder="Action operationnelle"
                className="mt-1 h-8 text-xs"
                disabled={readOnly}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Budget previsionnel</label>
              <Input
                value={metadata.budgetPrevisionnel}
                onChange={(e) => onMetadataChange({ budgetPrevisionnel: e.target.value })}
                placeholder="Ex: 17 000 000 FCFA"
                className="mt-1 h-8 text-xs"
                disabled={readOnly}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Section Export */}
        <Collapsible defaultOpen>
          <SectionHeader icon={Download} label="Export" />
          <CollapsibleContent className="space-y-2 pb-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={onExportPdf}
            >
              <FileDown className="mr-2 h-4 w-4 text-red-500" />
              Exporter en PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={onExportWord}
            >
              <FileText className="mr-2 h-4 w-4 text-blue-500" />
              Exporter en Word
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={onPrint}
            >
              <Printer className="mr-2 h-4 w-4 text-gray-500" />
              Imprimer
            </Button>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Section Info */}
        <Collapsible defaultOpen>
          <SectionHeader icon={Info} label="Informations" />
          <CollapsibleContent className="space-y-2 pb-3">
            {createdAt && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  Cree le {format(new Date(createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                </span>
              </div>
            )}
            {updatedAt && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  Modifie le {format(new Date(updatedAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                </span>
              </div>
            )}
            {authorName && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <User className="h-3.5 w-3.5" />
                <span>{authorName}</span>
              </div>
            )}
            {metadata.tags.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Tag className="h-3.5 w-3.5" />
                <span>{metadata.tags.join(', ')}</span>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </ScrollArea>
  );
}
