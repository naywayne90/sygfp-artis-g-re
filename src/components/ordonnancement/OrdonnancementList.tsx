/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MoreHorizontal,
  Eye,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Printer,
  Play,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { OrdonnancementDetails } from './OrdonnancementDetails';
import { OrdonnancementValidateDialog } from './OrdonnancementValidateDialog';
import { OrdonnancementRejectDialog } from './OrdonnancementRejectDialog';
import { OrdonnancementDeferDialog } from './OrdonnancementDeferDialog';
import { OrdrePayer } from './OrdrePayer';
import { useOrdonnancements, VALIDATION_STEPS } from '@/hooks/useOrdonnancements';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface OrdonnancementListProps {
  ordonnancements: any[];
  filter?: string;
  canValidate?: boolean;
}

const getStatusBadge = (status: string) => {
  const variants: Record<string, { label: string; className: string }> = {
    brouillon: { label: 'Brouillon', className: 'bg-muted text-muted-foreground' },
    soumis: { label: 'Soumis', className: 'bg-secondary/10 text-secondary border-secondary/20' },
    en_validation: {
      label: 'En validation',
      className: 'bg-warning/10 text-warning border-warning/20',
    },
    valide: { label: 'Validé', className: 'bg-success/10 text-success border-success/20' },
    rejete: {
      label: 'Rejeté',
      className: 'bg-destructive/10 text-destructive border-destructive/20',
    },
    differe: { label: 'Différé', className: 'bg-orange-100 text-orange-700 border-orange-200' },
    transmis: { label: 'Transmis', className: 'bg-primary/10 text-primary border-primary/20' },
  };
  const variant = variants[status] || variants.brouillon;
  return (
    <Badge variant="outline" className={variant.className}>
      {variant.label}
    </Badge>
  );
};

const formatMontant = (montant: number) => new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';

export function OrdonnancementList({
  ordonnancements,
  filter,
  canValidate = true,
}: OrdonnancementListProps) {
  const { submitOrdonnancement, validateStep, deleteOrdonnancement, resumeOrdonnancement } =
    useOrdonnancements();

  const [selectedOrdonnancement, setSelectedOrdonnancement] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showValidateDialog, setShowValidateDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDeferDialog, setShowDeferDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Filtrer selon le filtre
  const filteredOrdonnancements = ordonnancements.filter((ord) => {
    if (!filter || filter === 'tous') return true;
    if (filter === 'a_valider')
      return ord.statut === 'soumis' || ord.workflow_status === 'en_validation';
    if (filter === 'valides') return ord.statut === 'valide';
    if (filter === 'rejetes') return ord.statut === 'rejete';
    if (filter === 'differes') return ord.statut === 'differe';
    return true;
  });

  const handleSubmit = async (id: string) => {
    await submitOrdonnancement.mutateAsync(id);
  };

  const handleDelete = async () => {
    if (selectedOrdonnancement) {
      await deleteOrdonnancement.mutateAsync(selectedOrdonnancement.id);
      setShowDeleteConfirm(false);
      setSelectedOrdonnancement(null);
    }
  };

  const handleResume = async (id: string) => {
    await resumeOrdonnancement.mutateAsync(id);
  };

  const getCurrentStep = (ord: any) => {
    const currentStep = ord.current_step || 1;
    return VALIDATION_STEPS.find((s) => s.order === currentStep);
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Numéro</TableHead>
            <TableHead>Bénéficiaire</TableHead>
            <TableHead className="hidden md:table-cell">Objet</TableHead>
            <TableHead className="text-right">Montant</TableHead>
            <TableHead>Mode</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredOrdonnancements.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                Aucun ordonnancement trouvé
              </TableCell>
            </TableRow>
          ) : (
            filteredOrdonnancements.map((ord) => (
              <TableRow key={ord.id}>
                <TableCell className="font-medium">{ord.numero || '—'}</TableCell>
                <TableCell>{ord.beneficiaire}</TableCell>
                <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                  {ord.objet}
                </TableCell>
                <TableCell className="text-right">{formatMontant(ord.montant)}</TableCell>
                <TableCell className="capitalize">{ord.mode_paiement}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {getStatusBadge(ord.statut || ord.workflow_status)}
                    {ord.workflow_status === 'en_validation' && (
                      <span className="text-xs text-muted-foreground">
                        Étape: {getCurrentStep(ord)?.label}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedOrdonnancement(ord);
                          setShowDetails(true);
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Voir détails
                      </DropdownMenuItem>

                      {ord.statut === 'valide' && (
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedOrdonnancement(ord);
                            setShowPrintDialog(true);
                          }}
                        >
                          <Printer className="mr-2 h-4 w-4" />
                          Ordre de payer
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />

                      {ord.statut === 'brouillon' && (
                        <>
                          <DropdownMenuItem onClick={() => handleSubmit(ord.id)}>
                            <Send className="mr-2 h-4 w-4" />
                            Soumettre
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedOrdonnancement(ord);
                              setShowDeleteConfirm(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </>
                      )}

                      {canValidate &&
                        (ord.statut === 'soumis' || ord.workflow_status === 'en_validation') && (
                          <>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedOrdonnancement(ord);
                                setShowValidateDialog(true);
                              }}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Valider l'étape
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedOrdonnancement(ord);
                                setShowRejectDialog(true);
                              }}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Rejeter
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedOrdonnancement(ord);
                                setShowDeferDialog(true);
                              }}
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              Différer
                            </DropdownMenuItem>
                          </>
                        )}

                      {ord.statut === 'differe' && (
                        <DropdownMenuItem onClick={() => handleResume(ord.id)}>
                          <Play className="mr-2 h-4 w-4" />
                          Reprendre
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Dialogs */}
      {selectedOrdonnancement && (
        <>
          <OrdonnancementDetails
            ordonnancement={selectedOrdonnancement}
            open={showDetails}
            onOpenChange={setShowDetails}
          />

          <OrdonnancementValidateDialog
            ordonnancement={selectedOrdonnancement}
            open={showValidateDialog}
            onOpenChange={setShowValidateDialog}
          />

          <OrdonnancementRejectDialog
            ordonnancement={selectedOrdonnancement}
            open={showRejectDialog}
            onOpenChange={setShowRejectDialog}
          />

          <OrdonnancementDeferDialog
            ordonnancement={selectedOrdonnancement}
            open={showDeferDialog}
            onOpenChange={setShowDeferDialog}
          />

          <OrdrePayer
            ordonnancement={selectedOrdonnancement}
            open={showPrintDialog}
            onOpenChange={setShowPrintDialog}
          />
        </>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cet ordonnancement ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
