import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Eye,
  BarChart3,
  History,
  Download,
  Edit,
  FileEdit,
  RotateCcw,
  Copy,
  Send,
  Check,
  X,
  Trash2,
} from 'lucide-react';
import { BudgetLineWithRelations } from '@/hooks/useBudgetLines';
import { useRBAC } from '@/contexts/RBACContext';
import { BudgetLineRejectDialog } from './BudgetLineRejectDialog';
import { BudgetLineDeleteDialog } from './BudgetLineDeleteDialog';

interface BudgetLineActionsMenuProps {
  line: BudgetLineWithRelations;
  onEdit: (line: BudgetLineWithRelations) => void;
  onSubmit: (id: string) => void;
  onValidate: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onDelete: (id: string) => void;
  onViewHistory: (line: BudgetLineWithRelations) => void;
  onEditWithVersioning?: (line: BudgetLineWithRelations) => void;
  onViewVersionHistory?: (line: BudgetLineWithRelations) => void;
  onDuplicate?: (line: BudgetLineWithRelations) => void;
  onViewDetail?: (line: BudgetLineWithRelations, tab?: string) => void;
  onExportLine?: (line: BudgetLineWithRelations) => void;
}

export function BudgetLineActionsMenu({
  line,
  onEdit,
  onSubmit,
  onValidate,
  onReject,
  onDelete,
  onViewHistory,
  onEditWithVersioning,
  onViewVersionHistory,
  onDuplicate,
  onViewDetail,
  onExportLine,
}: BudgetLineActionsMenuProps) {
  const { isAdmin, isDG, isCB, isDAF, isOperateur } = useRBAC();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const statut = line.statut || 'brouillon';

  // RBAC checks
  const canEdit =
    (statut === 'brouillon' || statut === 'rejete') &&
    (isAdmin || isOperateur || isDG || isDAF || isCB);

  const canDuplicate = isAdmin || isOperateur || isDAF || isCB;

  const canSubmit = statut === 'brouillon' && (isAdmin || isOperateur || isDAF || isCB);

  const canValidate = statut === 'soumis' && (isAdmin || isDG || isCB);

  const canReject = statut === 'soumis' && (isAdmin || isDG || isCB);

  const canDelete = statut === 'brouillon' && (isAdmin || isOperateur);

  const showModificationGroup = canEdit || (canDuplicate && onDuplicate) || onEditWithVersioning;
  const showWorkflowGroup = canSubmit || canValidate || canReject;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {/* Groupe Consultation */}
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Consultation
          </DropdownMenuLabel>
          <DropdownMenuGroup>
            {onViewDetail && (
              <DropdownMenuItem onClick={() => onViewDetail(line)}>
                <Eye className="mr-2 h-4 w-4" />
                Voir détail
              </DropdownMenuItem>
            )}
            {onViewDetail && (
              <DropdownMenuItem onClick={() => onViewDetail(line, 'consommation')}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Consommation
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => {
                if (onViewDetail) {
                  onViewDetail(line, 'historique');
                } else {
                  onViewHistory(line);
                }
              }}
            >
              <History className="mr-2 h-4 w-4" />
              Historique
            </DropdownMenuItem>
            {onViewVersionHistory && (
              <DropdownMenuItem onClick={() => onViewVersionHistory(line)}>
                <RotateCcw className="mr-2 h-4 w-4 text-purple-600" />
                Historique versions
              </DropdownMenuItem>
            )}
            {onExportLine && (
              <DropdownMenuItem onClick={() => onExportLine(line)}>
                <Download className="mr-2 h-4 w-4" />
                Exporter
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>

          {/* Groupe Modification */}
          {showModificationGroup && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Modification
              </DropdownMenuLabel>
              <DropdownMenuGroup>
                {canEdit && (
                  <DropdownMenuItem onClick={() => onEdit(line)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Modifier
                  </DropdownMenuItem>
                )}
                {canEdit && onEditWithVersioning && (
                  <DropdownMenuItem onClick={() => onEditWithVersioning(line)}>
                    <FileEdit className="mr-2 h-4 w-4 text-blue-600" />
                    Modifier (versioning)
                  </DropdownMenuItem>
                )}
                {canDuplicate && onDuplicate && (
                  <DropdownMenuItem onClick={() => onDuplicate(line)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Dupliquer
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
            </>
          )}

          {/* Groupe Workflow */}
          {showWorkflowGroup && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Workflow
              </DropdownMenuLabel>
              <DropdownMenuGroup>
                {canSubmit && (
                  <DropdownMenuItem onClick={() => onSubmit(line.id)}>
                    <Send className="mr-2 h-4 w-4" />
                    Soumettre
                  </DropdownMenuItem>
                )}
                {canValidate && (
                  <DropdownMenuItem onClick={() => onValidate(line.id)}>
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    Valider
                  </DropdownMenuItem>
                )}
                {canReject && (
                  <DropdownMenuItem onClick={() => setRejectOpen(true)}>
                    <X className="mr-2 h-4 w-4 text-red-600" />
                    Rejeter
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
            </>
          )}

          {/* Groupe Danger */}
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <BudgetLineRejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        budgetLine={line}
        onConfirm={onReject}
      />

      <BudgetLineDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        budgetLine={line}
        onConfirm={onDelete}
      />
    </>
  );
}
