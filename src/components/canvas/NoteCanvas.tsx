/**
 * NoteCanvas - Composant principal du canvas de notes ARTI
 * Assemble: Header ARTI + Toolbar + Editor + Footer dans le panneau principal, Sidebar a droite
 * Layout avec react-resizable-panels
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Send, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Editor } from '@tiptap/react';

import { ARTIHeader } from './ARTIHeader';
import { ARTIFooter } from './ARTIFooter';
import { NoteCanvasToolbar } from './NoteCanvasToolbar';
import { NoteCanvasEditor } from './NoteCanvasEditor';
import { NoteCanvasSidebar, type NoteCanvasMetadata } from './NoteCanvasSidebar';
import { NotePreview } from './NotePreview';
import { useNoteExportActions } from './NoteExportActions';
import type { NoteDirection } from '@/hooks/useNotesDirection';

// ============================================
// TYPES
// ============================================

interface NoteCanvasProps {
  note?: NoteDirection | null;
  directionLabel?: string;
  initialContent?: string;
  metadata: NoteCanvasMetadata;
  onMetadataChange: (partial: Partial<NoteCanvasMetadata>) => void;
  onSave: (content: string, metadata: NoteCanvasMetadata) => Promise<void>;
  onPublish: (content: string, metadata: NoteCanvasMetadata) => Promise<void>;
  isSaving?: boolean;
  isDirty?: boolean;
  lastSaved?: Date | null;
  readOnly?: boolean;
  authorName?: string;
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export function NoteCanvas({
  note,
  directionLabel,
  initialContent = '',
  metadata,
  onMetadataChange,
  onSave,
  onPublish,
  isSaving = false,
  isDirty = false,
  lastSaved,
  readOnly = false,
  authorName,
}: NoteCanvasProps) {
  const navigate = useNavigate();
  const [editor, setEditor] = useState<Editor | null>(null);
  const [editorContent, setEditorContent] = useState(initialContent);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Export actions
  const { handleExportPdf, handleExportWord, handlePrint } = useNoteExportActions({
    content: editorContent,
    metadata,
    directionLabel,
  });

  const handleEditorUpdate = useCallback((html: string) => {
    setEditorContent(html);
  }, []);

  const handleEditorReady = useCallback((ed: Editor) => {
    setEditor(ed);
  }, []);

  const handleSave = useCallback(async () => {
    await onSave(editorContent, metadata);
  }, [editorContent, metadata, onSave]);

  const handlePublish = useCallback(async () => {
    await onPublish(editorContent, metadata);
  }, [editorContent, metadata, onPublish]);

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col">
      {/* Top bar: navigation + save status */}
      <div className="flex items-center justify-between border-b bg-white px-4 py-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/espace-direction')}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Retour
          </Button>
          <div className="h-5 w-px bg-gray-200" />
          <span className="text-sm font-medium text-gray-700 truncate max-w-[400px]">
            {metadata.objet || note?.titre || 'Nouvelle note'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Save status indicator */}
          <div className="flex items-center gap-1.5 text-xs">
            {isSaving ? (
              <>
                <div className="h-2 w-2 animate-pulse rounded-full bg-orange-400" />
                <span className="text-orange-600">Enregistrement...</span>
              </>
            ) : isDirty ? (
              <>
                <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
                <span className="text-orange-600">Non sauvegarde</span>
              </>
            ) : lastSaved ? (
              <>
                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                <span className="text-green-600">Enregistre</span>
              </>
            ) : null}
          </div>

          {/* Preview button */}
          <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
            <Eye className="mr-1.5 h-4 w-4" />
            Apercu
          </Button>

          {!readOnly && (
            <>
              <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
                <Save className="mr-1.5 h-4 w-4" />
                Sauvegarder
              </Button>
              <Button size="sm" onClick={handlePublish} disabled={isSaving}>
                <Send className="mr-1.5 h-4 w-4" />
                Publier
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main content: Editor + Sidebar */}
      <PanelGroup direction="horizontal" className="flex-1">
        {/* Left panel: Editor */}
        <Panel defaultSize={75} minSize={50}>
          <ScrollArea className="h-full">
            <div className="min-h-full bg-gray-100 p-6">
              {/* Page A4 */}
              <div
                className="mx-auto max-w-[210mm] bg-white shadow-lg"
                style={{
                  minHeight: '297mm',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
                }}
              >
                {/* ARTI Header */}
                <div className="px-6 pt-6">
                  <ARTIHeader
                    reference={metadata.reference}
                    dateNote={metadata.dateNote}
                    expediteur={metadata.expediteur}
                    destinataire={metadata.destinataire}
                    objet={metadata.objet}
                    directionLabel={directionLabel}
                  />
                </div>

                {/* Toolbar */}
                {!readOnly && (
                  <div className="px-6 pt-4">
                    <NoteCanvasToolbar editor={editor} />
                  </div>
                )}

                {/* Editor */}
                <div className="px-6">
                  <NoteCanvasEditor
                    content={initialContent}
                    onUpdate={handleEditorUpdate}
                    onEditorReady={handleEditorReady}
                    readOnly={readOnly}
                  />
                </div>

                {/* ARTI Footer */}
                <div className="px-6 pb-8">
                  <ARTIFooter signataire={metadata.expediteur} />
                </div>
              </div>
            </div>
          </ScrollArea>
        </Panel>

        {/* Resize handle */}
        <PanelResizeHandle className="w-1.5 bg-gray-200 hover:bg-blue-300 transition-colors" />

        {/* Right panel: Sidebar */}
        <Panel defaultSize={25} minSize={15} maxSize={40}>
          <div className="h-full border-l bg-white">
            <NoteCanvasSidebar
              metadata={metadata}
              onMetadataChange={onMetadataChange}
              onExportPdf={handleExportPdf}
              onExportWord={handleExportWord}
              onPrint={handlePrint}
              createdAt={note?.created_at}
              updatedAt={note?.updated_at}
              authorName={authorName}
              readOnly={readOnly}
            />
          </div>
        </Panel>
      </PanelGroup>

      {/* Full-screen preview */}
      <NotePreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        content={editorContent}
        metadata={metadata}
        directionLabel={directionLabel}
        signataire={metadata.expediteur}
      />
    </div>
  );
}
