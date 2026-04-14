/**
 * BordereauEnvoiDialog — Dialog de génération du bordereau d'envoi au comptable
 *
 * Permet de sélectionner les liquidations validées à transmettre au Trésorier,
 * puis génère un PDF officiel ARTI avec le détail des pièces.
 */

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Download, FileText, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { Liquidation } from '@/hooks/useLiquidations';
import {
  downloadBordereauEnvoiPdf,
  type BordereauLiquidationItem,
} from '@/services/bordereauEnvoiPdfService';

// ============================================================================
// TYPES
// ============================================================================

interface BordereauEnvoiDialogProps {
  liquidations: Liquidation[];
  exercice: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function toLiquidationItem(liq: Liquidation): BordereauLiquidationItem {
  return {
    id: liq.id,
    numero: liq.numero || '-',
    engagement_numero: liq.engagement?.numero || '-',
    objet: liq.engagement?.objet || '-',
    beneficiaire:
      liq.engagement?.marche?.prestataire?.raison_sociale || liq.engagement?.fournisseur || '-',
    montant_ttc: liq.montant || 0,
    net_a_payer: liq.net_a_payer || liq.montant || 0,
    total_retenues: liq.total_retenues || 0,
    date_validation: liq.visa_dg_date || liq.visa_cf_date || liq.validated_at,
    direction_sigle:
      liq.engagement?.budget_line?.direction?.sigle ||
      liq.engagement?.budget_line?.direction?.label ||
      '-',
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

export function BordereauEnvoiDialog({ liquidations, exercice }: BordereauEnvoiDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [numeroBordereau, setNumeroBordereau] = useState(
    `BE-${exercice}-${String(Date.now()).slice(-4)}`
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(liquidations.map((l) => l.id))
  );

  // Régénérer le numéro à l'ouverture
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setNumeroBordereau(`BE-${exercice}-${String(Date.now()).slice(-4)}`);
      setSelectedIds(new Set(liquidations.map((l) => l.id)));
    }
    setDialogOpen(open);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === liquidations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(liquidations.map((l) => l.id)));
    }
  };

  const selectedLiquidations = useMemo(
    () => liquidations.filter((l) => selectedIds.has(l.id)),
    [liquidations, selectedIds]
  );

  const totalNetAPayer = useMemo(
    () => selectedLiquidations.reduce((sum, l) => sum + (l.net_a_payer || l.montant || 0), 0),
    [selectedLiquidations]
  );

  const handleGenerate = async () => {
    if (selectedLiquidations.length === 0) {
      toast.error('Veuillez sélectionner au moins une liquidation');
      return;
    }

    setIsGenerating(true);
    try {
      await downloadBordereauEnvoiPdf({
        liquidations: selectedLiquidations.map(toLiquidationItem),
        numeroBordereau,
        exercice,
      });
      toast.success("Bordereau d'envoi PDF généré avec succès");
      setDialogOpen(false);
    } catch (error) {
      console.error('[BordereauEnvoi] Erreur:', error);
      toast.error('Erreur lors de la génération du bordereau');
    } finally {
      setIsGenerating(false);
    }
  };

  if (liquidations.length === 0) return null;

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Send className="h-4 w-4" />
          Bordereau d'envoi
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Bordereau d'envoi au comptable
          </DialogTitle>
          <DialogDescription>
            Sélectionnez les liquidations validées à transmettre au Trésorier pour paiement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Numéro de bordereau */}
          <div className="flex items-center gap-4">
            <Label htmlFor="num-bordereau-envoi" className="whitespace-nowrap">
              N° Bordereau
            </Label>
            <Input
              id="num-bordereau-envoi"
              value={numeroBordereau}
              onChange={(e) => setNumeroBordereau(e.target.value)}
              className="max-w-xs"
            />
          </div>

          {/* Sélection des liquidations */}
          <div className="rounded-md border max-h-[40vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="p-2 text-left w-10">
                    <Checkbox
                      checked={selectedIds.size === liquidations.length}
                      onCheckedChange={toggleAll}
                    />
                  </th>
                  <th className="p-2 text-left">N° Liquidation</th>
                  <th className="p-2 text-left">Bénéficiaire</th>
                  <th className="p-2 text-left">Direction</th>
                  <th className="p-2 text-right">Net à payer</th>
                </tr>
              </thead>
              <tbody>
                {liquidations.map((liq) => (
                  <tr
                    key={liq.id}
                    className="border-t hover:bg-muted/30 cursor-pointer"
                    onClick={() => toggleSelection(liq.id)}
                  >
                    <td className="p-2">
                      <Checkbox
                        checked={selectedIds.has(liq.id)}
                        onCheckedChange={() => toggleSelection(liq.id)}
                      />
                    </td>
                    <td className="p-2 font-mono text-xs">{liq.numero}</td>
                    <td className="p-2 max-w-[180px] truncate">
                      {liq.engagement?.marche?.prestataire?.raison_sociale ||
                        liq.engagement?.fournisseur ||
                        '-'}
                    </td>
                    <td className="p-2 text-xs">
                      {liq.engagement?.budget_line?.direction?.sigle || '-'}
                    </td>
                    <td className="p-2 text-right font-medium">
                      {formatCurrency(liq.net_a_payer || liq.montant)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Résumé */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">
              {selectedLiquidations.length} liquidation(s) sélectionnée(s)
            </span>
            <span className="text-lg font-bold">{formatCurrency(totalNetAPayer)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || selectedLiquidations.length === 0}
            className="gap-2"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isGenerating ? 'Génération...' : 'Télécharger PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
