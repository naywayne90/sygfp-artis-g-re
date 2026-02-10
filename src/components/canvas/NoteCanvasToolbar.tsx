/**
 * NoteCanvasToolbar - Barre d'outils Tiptap professionnelle
 * Gras, Italique, Souligne, Surligne, Titres, Alignement, Listes, Tableaux, Undo/Redo
 */

import type { Editor } from '@tiptap/react';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Underline,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Table,
  Undo,
  Redo,
  Plus,
  Minus,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface NoteCanvasToolbarProps {
  editor: Editor | null;
}

function ToolbarToggle({
  pressed,
  onPressedChange,
  tooltip,
  children,
}: {
  pressed: boolean;
  onPressedChange: () => void;
  tooltip: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle size="sm" pressed={pressed} onPressedChange={onPressedChange}>
          {children}
        </Toggle>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

export function NoteCanvasToolbar({ editor }: NoteCanvasToolbarProps) {
  if (!editor) return null;

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 rounded-md border bg-white p-1.5 shadow-sm">
      {/* Texte */}
      <ToolbarToggle
        pressed={editor.isActive('bold')}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        tooltip="Gras (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </ToolbarToggle>
      <ToolbarToggle
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        tooltip="Italique (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </ToolbarToggle>
      <ToolbarToggle
        pressed={editor.isActive('underline')}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
        tooltip="Souligne (Ctrl+U)"
      >
        <Underline className="h-4 w-4" />
      </ToolbarToggle>
      <ToolbarToggle
        pressed={editor.isActive('highlight')}
        onPressedChange={() => editor.chain().focus().toggleHighlight().run()}
        tooltip="Surligner"
      >
        <Highlighter className="h-4 w-4" />
      </ToolbarToggle>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Titres */}
      <ToolbarToggle
        pressed={editor.isActive('heading', { level: 1 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        tooltip="Titre 1"
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarToggle>
      <ToolbarToggle
        pressed={editor.isActive('heading', { level: 2 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        tooltip="Titre 2"
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarToggle>
      <ToolbarToggle
        pressed={editor.isActive('heading', { level: 3 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        tooltip="Titre 3"
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarToggle>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Alignement */}
      <ToolbarToggle
        pressed={editor.isActive({ textAlign: 'left' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
        tooltip="Aligner a gauche"
      >
        <AlignLeft className="h-4 w-4" />
      </ToolbarToggle>
      <ToolbarToggle
        pressed={editor.isActive({ textAlign: 'center' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
        tooltip="Centrer"
      >
        <AlignCenter className="h-4 w-4" />
      </ToolbarToggle>
      <ToolbarToggle
        pressed={editor.isActive({ textAlign: 'right' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
        tooltip="Aligner a droite"
      >
        <AlignRight className="h-4 w-4" />
      </ToolbarToggle>
      <ToolbarToggle
        pressed={editor.isActive({ textAlign: 'justify' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('justify').run()}
        tooltip="Justifier"
      >
        <AlignJustify className="h-4 w-4" />
      </ToolbarToggle>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Listes */}
      <ToolbarToggle
        pressed={editor.isActive('bulletList')}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        tooltip="Liste a puces"
      >
        <List className="h-4 w-4" />
      </ToolbarToggle>
      <ToolbarToggle
        pressed={editor.isActive('orderedList')}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        tooltip="Liste numerotee"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarToggle>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Tableaux */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 px-2.5">
                <Table className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Tableau
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onClick={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Inserer un tableau (3x3)
          </DropdownMenuItem>
          {editor.isActive('table') && (
            <>
              <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une ligne
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une colonne
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().deleteRow().run()}>
                <Minus className="mr-2 h-4 w-4" />
                Supprimer la ligne
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().deleteColumn().run()}>
                <Minus className="mr-2 h-4 w-4" />
                Supprimer la colonne
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().deleteTable().run()}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer le tableau
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Undo / Redo */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-2.5"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Annuler (Ctrl+Z)
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-2.5"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Refaire (Ctrl+Y)
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
