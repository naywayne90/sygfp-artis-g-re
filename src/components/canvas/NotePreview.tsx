/**
 * NotePreview - Vue preview plein ecran WYSIWYG
 * Rendu identique a un document Word imprime, format A4 centre
 */

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ARTIHeader } from './ARTIHeader';
import { ARTIFooter } from './ARTIFooter';
import type { NoteCanvasMetadata } from './NoteCanvasSidebar';

interface NotePreviewProps {
  open: boolean;
  onClose: () => void;
  content: string;
  metadata: NoteCanvasMetadata;
  directionLabel?: string;
  signataire?: string;
  signataireTitle?: string;
}

export function NotePreview({
  open,
  onClose,
  content,
  metadata,
  directionLabel,
  signataire,
  signataireTitle,
}: NotePreviewProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/80 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between bg-white px-4 py-2 border-b shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700">Apercu du document</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4 mr-1" />
          Fermer
        </Button>
      </div>

      {/* A4 preview */}
      <ScrollArea className="flex-1">
        <div className="flex justify-center py-8 px-4 bg-gray-500/30 min-h-full">
          <div
            className="bg-white shadow-2xl"
            style={{
              width: '210mm',
              minHeight: '297mm',
              padding: '25mm 20mm 20mm 20mm',
              fontFamily: 'Arial, Helvetica, sans-serif',
              fontSize: '11pt',
              lineHeight: '1.5',
              color: '#1a1a1a',
            }}
          >
            {/* ARTI Header */}
            <ARTIHeader
              reference={metadata.reference}
              dateNote={metadata.dateNote}
              expediteur={metadata.expediteur}
              destinataire={metadata.destinataire}
              objet={metadata.objet}
              directionLabel={directionLabel}
            />

            {/* Body content */}
            <div
              className="mt-6 prose prose-sm max-w-none"
              style={{ fontSize: '11pt', lineHeight: '1.6' }}
              dangerouslySetInnerHTML={{ __html: content }}
            />

            {/* Footer */}
            <ARTIFooter signataire={signataire} titre={signataireTitle} />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
