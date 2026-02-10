/**
 * NoteCanvasEditor - Editeur Tiptap avec style document A4
 * Configuration: StarterKit + extensions + style ProseMirror
 */

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Table as TipTapTable } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { useEffect, useCallback, useRef } from 'react';
import type { Editor } from '@tiptap/react';

interface NoteCanvasEditorProps {
  content: string;
  onUpdate: (html: string) => void;
  onEditorReady?: (editor: Editor) => void;
  readOnly?: boolean;
}

export function NoteCanvasEditor({
  content,
  onUpdate,
  onEditorReady,
  readOnly = false,
}: NoteCanvasEditorProps) {
  const initialContentRef = useRef(content);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TipTapTable.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: 'Commencez a rediger le contenu de votre note...',
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextStyle,
      Color,
    ],
    content: initialContentRef.current,
    editable: !readOnly,
    onUpdate: ({ editor: ed }) => {
      onUpdate(ed.getHTML());
    },
  });

  // Notify parent when editor is ready
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // Update editable state when readOnly changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [editor, readOnly]);

  // Update content from outside only when the content source changes (e.g. loading from DB)
  const setContent = useCallback(
    (newContent: string) => {
      if (editor && newContent !== editor.getHTML()) {
        editor.commands.setContent(newContent, false);
      }
    },
    [editor]
  );

  // When the parent provides new initial content (e.g. after loading a note), update
  useEffect(() => {
    if (content !== initialContentRef.current) {
      initialContentRef.current = content;
      setContent(content);
    }
  }, [content, setContent]);

  return (
    <div className="note-canvas-editor">
      <EditorContent editor={editor} />
      <style>{`
        .note-canvas-editor .ProseMirror {
          min-height: 600px;
          padding: 2rem;
          outline: none;
          font-size: 11pt;
          line-height: 1.6;
          color: #1a1a1a;
        }
        .note-canvas-editor .ProseMirror p {
          margin-bottom: 0.5em;
        }
        .note-canvas-editor .ProseMirror h1 {
          font-size: 1.5em;
          font-weight: 700;
          margin-bottom: 0.5em;
          margin-top: 1em;
          color: #1F4E79;
        }
        .note-canvas-editor .ProseMirror h2 {
          font-size: 1.25em;
          font-weight: 600;
          margin-bottom: 0.4em;
          margin-top: 0.8em;
          color: #1F4E79;
        }
        .note-canvas-editor .ProseMirror h3 {
          font-size: 1.1em;
          font-weight: 600;
          margin-bottom: 0.3em;
          margin-top: 0.6em;
          color: #333;
        }
        .note-canvas-editor .ProseMirror ul,
        .note-canvas-editor .ProseMirror ol {
          padding-left: 1.5em;
          margin-bottom: 0.5em;
        }
        .note-canvas-editor .ProseMirror ul { list-style-type: disc; }
        .note-canvas-editor .ProseMirror ol { list-style-type: decimal; }
        .note-canvas-editor .ProseMirror li { margin-bottom: 0.2em; }
        .note-canvas-editor .ProseMirror blockquote {
          border-left: 3px solid #1F4E79;
          padding-left: 1em;
          margin-left: 0;
          color: #555;
          font-style: italic;
        }
        .note-canvas-editor .ProseMirror table {
          border-collapse: collapse;
          width: 100%;
          margin: 0.8em 0;
        }
        .note-canvas-editor .ProseMirror th,
        .note-canvas-editor .ProseMirror td {
          border: 1px solid #ccc;
          padding: 0.4em 0.6em;
          vertical-align: top;
          min-width: 60px;
        }
        .note-canvas-editor .ProseMirror th {
          background-color: #D6E3F0;
          font-weight: 600;
          color: #1F4E79;
        }
        .note-canvas-editor .ProseMirror .is-empty::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
          font-style: italic;
        }
        .note-canvas-editor .ProseMirror mark {
          background-color: #fef08a;
          padding: 0.1em 0.2em;
          border-radius: 2px;
        }
        .note-canvas-editor .ProseMirror .selectedCell {
          background-color: rgba(31, 78, 121, 0.1);
        }
      `}</style>
    </div>
  );
}
