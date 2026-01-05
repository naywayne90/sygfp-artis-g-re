import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface CreditTransfer {
  id: string;
  amount: number;
  motif: string;
  status: string | null;
  requested_at: string;
  approved_at: string | null;
  rejection_reason: string | null;
  from_line: { code: string; label: string } | null;
  to_line: { code: string; label: string } | null;
  requested_by_profile: { full_name: string } | null;
  approved_by_profile: { full_name: string } | null;
}

interface CreditTransferListProps {
  transfers: CreditTransfer[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  canValidate?: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
};

const getStatusBadge = (status: string | null) => {
  switch (status) {
    case "en_attente":
      return <Badge variant="secondary">En attente</Badge>;
    case "approuve":
      return <Badge variant="default" className="bg-green-500">Approuvé</Badge>;
    case "rejete":
      return <Badge variant="destructive">Rejeté</Badge>;
    default:
      return <Badge variant="secondary">En attente</Badge>;
  }
};

export function CreditTransferList({
  transfers,
  onApprove,
  onReject,
  canValidate = true,
}: CreditTransferListProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Ligne source</TableHead>
            <TableHead>Ligne destination</TableHead>
            <TableHead className="text-right">Montant</TableHead>
            <TableHead>Motif</TableHead>
            <TableHead>Demandeur</TableHead>
            <TableHead>Statut</TableHead>
            {canValidate && <TableHead className="w-[100px]">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {transfers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={canValidate ? 8 : 7} className="text-center py-8 text-muted-foreground">
                Aucune demande de virement
              </TableCell>
            </TableRow>
          ) : (
            transfers.map((transfer) => (
              <TableRow key={transfer.id}>
                <TableCell className="whitespace-nowrap">
                  {format(new Date(transfer.requested_at), "dd/MM/yyyy", { locale: fr })}
                </TableCell>
                <TableCell>
                  <div className="font-mono text-sm">{transfer.from_line?.code}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                    {transfer.from_line?.label}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-mono text-sm">{transfer.to_line?.code}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                    {transfer.to_line?.label}
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(transfer.amount)}
                </TableCell>
                <TableCell>
                  <div className="max-w-[200px] truncate" title={transfer.motif}>
                    {transfer.motif}
                  </div>
                </TableCell>
                <TableCell>
                  {transfer.requested_by_profile?.full_name || "-"}
                </TableCell>
                <TableCell>
                  {getStatusBadge(transfer.status)}
                  {transfer.rejection_reason && (
                    <div className="text-xs text-red-600 mt-1">
                      {transfer.rejection_reason}
                    </div>
                  )}
                </TableCell>
                {canValidate && (
                  <TableCell>
                    {transfer.status === "en_attente" && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-green-600"
                          onClick={() => onApprove(transfer.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-600"
                          onClick={() => {
                            const reason = prompt("Motif du rejet:");
                            if (reason) onReject(transfer.id, reason);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}