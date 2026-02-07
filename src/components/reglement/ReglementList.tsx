import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MoreHorizontal, Eye, Trash2, FileText, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useReglements, MODES_PAIEMENT, type ReglementWithRelations } from '@/hooks/useReglements';
import { ReglementReceiptDialog } from './ReglementReceipt';

interface ReglementListProps {
  reglements: ReglementWithRelations[];
  onViewDetails?: (reglement: ReglementWithRelations) => void;
}

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
};

const getModePaiementLabel = (mode: string) => {
  return MODES_PAIEMENT.find((m) => m.value === mode)?.label || mode;
};

const getStatutBadge = (reglement: ReglementWithRelations) => {
  const ord = reglement.ordonnancement;
  const isFullyPaid = ord && (ord.montant_paye || 0) >= (ord.montant || 0);

  if (isFullyPaid) {
    return (
      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
        Soldé
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
      Partiel
    </Badge>
  );
};

export function ReglementList({ reglements, onViewDetails }: ReglementListProps) {
  const { deleteReglement } = useReglements();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedReglement, setSelectedReglement] = useState<ReglementWithRelations | null>(null);
  const [receiptReglement, setReceiptReglement] = useState<ReglementWithRelations | null>(null);

  const handleDelete = async () => {
    if (selectedReglement) {
      await deleteReglement.mutateAsync(selectedReglement.id);
      setDeleteDialogOpen(false);
      setSelectedReglement(null);
    }
  };

  if (reglements.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Aucun règlement enregistré</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>N° Règlement</TableHead>
            <TableHead>N° Ordonnancement</TableHead>
            <TableHead>Bénéficiaire</TableHead>
            <TableHead>Date paiement</TableHead>
            <TableHead>Mode</TableHead>
            <TableHead className="text-right">Montant</TableHead>
            <TableHead>Référence</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {reglements.map((reglement) => (
            <TableRow key={reglement.id}>
              <TableCell className="font-medium font-mono">{reglement.numero}</TableCell>
              <TableCell className="font-mono text-sm">
                {reglement.ordonnancement?.numero || '-'}
              </TableCell>
              <TableCell>{reglement.ordonnancement?.beneficiaire || '-'}</TableCell>
              <TableCell>
                {reglement.date_paiement
                  ? format(new Date(reglement.date_paiement), 'dd/MM/yyyy', { locale: fr })
                  : '-'}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{getModePaiementLabel(reglement.mode_paiement)}</Badge>
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatMontant(reglement.montant)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {reglement.reference_paiement || '-'}
              </TableCell>
              <TableCell>{getStatutBadge(reglement)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewDetails?.(reglement)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Voir détails
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setReceiptReglement(reglement)}>
                      <Printer className="mr-2 h-4 w-4" />
                      Imprimer recu
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => {
                        setSelectedReglement(reglement);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Annuler règlement
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler ce reglement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action va annuler le reglement {selectedReglement?.numero} et recalculer le
              montant restant a payer sur l'ordonnancement associe. Cette action peut etre
              irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmer l'annulation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ReglementReceiptDialog
        reglement={receiptReglement}
        open={!!receiptReglement}
        onOpenChange={(open) => {
          if (!open) setReceiptReglement(null);
        }}
      />
    </>
  );
}
