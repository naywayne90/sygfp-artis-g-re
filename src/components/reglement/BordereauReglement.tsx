/**
 * BordereauReglement - Composant d'export PDF des bordereaux de règlement
 *
 * Génère un PDF officiel ARTI contenant:
 * - Numéro de bordereau et date d'émission
 * - Liste des règlements inclus avec détails
 * - Montant total du bordereau
 * - Zones de signatures (Comptable, DAAF, DG)
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, FileText, Loader2, Printer } from 'lucide-react';
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
import logoArti from '@/assets/logo-arti.jpg';
import { MODES_PAIEMENT } from '@/hooks/useReglements';

// ============================================================================
// TYPES
// ============================================================================

interface ReglementItem {
  id: string;
  numero: string;
  date_paiement: string;
  mode_paiement: string;
  reference_paiement?: string | null;
  montant: number;
  banque_arti?: string | null;
  compte_bancaire_arti?: string | null;
  ordonnancement?: {
    numero?: string | null;
    beneficiaire?: string | null;
    objet?: string | null;
  } | null;
}

interface BordereauReglementProps {
  reglements: ReglementItem[];
  exercice: string;
}

// ============================================================================
// PDF CONFIGURATION
// ============================================================================

const PDF_CONFIG = {
  margins: { top: 15, left: 15, right: 15, bottom: 15 },
  colors: {
    primary: [0, 51, 102] as [number, number, number],
    secondary: [100, 100, 100] as [number, number, number],
    text: [30, 30, 30] as [number, number, number],
    lightGray: [248, 248, 248] as [number, number, number],
  },
  fonts: {
    title: 14,
    subtitle: 11,
    body: 9,
    small: 8,
  },
};

// ============================================================================
// HELPERS
// ============================================================================

const formatMontant = (montant: number): string =>
  new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';

const getModePaiementLabel = (mode: string): string =>
  MODES_PAIEMENT.find((m) => m.value === mode)?.label || mode;

async function loadImageAsDataUrl(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg'));
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

// ============================================================================
// PDF GENERATION
// ============================================================================

async function generateBordereauPdf(
  reglements: ReglementItem[],
  exercice: string,
  numeroBordereau: string
): Promise<{ blob: Blob; filename: string }> {
  const { margins, colors, fonts } = PDF_CONFIG;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = margins.top;

  // Load logo
  let logoDataUrl = '';
  try {
    logoDataUrl = await loadImageAsDataUrl(logoArti);
  } catch {
    // Continue without logo
  }

  // ── HEADER ──
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'JPEG', margins.left, yPos, 20, 20);
    } catch {
      // Skip logo on error
    }
  }

  doc.setFontSize(fonts.small);
  doc.setTextColor(...colors.secondary);
  doc.text("REPUBLIQUE DE COTE D'IVOIRE", pageWidth / 2, yPos + 4, { align: 'center' });
  doc.setFontSize(fonts.small - 1);
  doc.text('Union - Discipline - Travail', pageWidth / 2, yPos + 8, { align: 'center' });

  doc.setFontSize(fonts.small);
  doc.setTextColor(...colors.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('AUTORITE DE REGULATION DU', pageWidth / 2, yPos + 14, { align: 'center' });
  doc.text('TRANSPORT INTERIEUR', pageWidth / 2, yPos + 18, { align: 'center' });

  yPos += 24;

  doc.setDrawColor(...colors.primary);
  doc.setLineWidth(0.5);
  doc.line(margins.left, yPos, pageWidth - margins.right, yPos);
  yPos += 8;

  // ── TITLE ──
  doc.setFontSize(fonts.title + 2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.primary);
  doc.text('BORDEREAU DE REGLEMENT', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  // ── BORDEREAU INFO ──
  doc.setFontSize(fonts.body);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.text);

  const dateEmission = format(new Date(), 'dd MMMM yyyy', { locale: fr });

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: [
      ['N\u00b0 Bordereau', numeroBordereau, "Date d'\u00e9mission", dateEmission],
      ['Exercice', exercice, 'Nombre de r\u00e8glements', String(reglements.length)],
    ],
    styles: { fontSize: fonts.body, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35, fillColor: colors.lightGray },
      1: { cellWidth: 60 },
      2: { fontStyle: 'bold', cellWidth: 35, fillColor: colors.lightGray },
      3: { cellWidth: 60 },
    },
    theme: 'grid',
    margin: { left: margins.left, right: margins.right },
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  // ── REGLEMENTS TABLE ──
  const totalMontant = reglements.reduce((sum, r) => sum + (r.montant || 0), 0);

  const tableBody = reglements.map((reg, idx) => [
    String(idx + 1),
    reg.numero || '-',
    reg.ordonnancement?.numero || '-',
    reg.ordonnancement?.beneficiaire || '-',
    reg.date_paiement ? format(new Date(reg.date_paiement), 'dd/MM/yyyy') : '-',
    getModePaiementLabel(reg.mode_paiement),
    reg.reference_paiement || '-',
    formatMontant(reg.montant),
  ]);

  // Add total row
  tableBody.push([
    '',
    '',
    '',
    '',
    '',
    '',
    { content: 'TOTAL', styles: { fontStyle: 'bold' } } as unknown as string,
    {
      content: formatMontant(totalMontant),
      styles: { fontStyle: 'bold' },
    } as unknown as string,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [
      [
        'N\u00b0',
        'R\u00e9f. R\u00e8glement',
        'R\u00e9f. Ordonnancement',
        'B\u00e9n\u00e9ficiaire',
        'Date paiement',
        'Mode',
        'R\u00e9f\u00e9rence',
        'Montant (FCFA)',
      ],
    ],
    body: tableBody,
    styles: { fontSize: fonts.small, cellPadding: 2 },
    headStyles: {
      fillColor: colors.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 28 },
      2: { cellWidth: 28 },
      3: { cellWidth: 50 },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 25 },
      6: { cellWidth: 30 },
      7: { cellWidth: 35, halign: 'right' },
    },
    theme: 'grid',
    margin: { left: margins.left, right: margins.right },
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // ── TOTAL SECTION ──
  doc.setFontSize(fonts.subtitle);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.primary);
  doc.text(`Montant total du bordereau : ${formatMontant(totalMontant)}`, margins.left, yPos);
  yPos += 4;

  doc.setFontSize(fonts.small);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...colors.secondary);
  doc.text(
    `Arr\u00eat\u00e9 le pr\u00e9sent bordereau \u00e0 la somme de ${formatMontant(totalMontant)}`,
    margins.left,
    yPos
  );
  yPos += 12;

  // ── SIGNATURES ──
  const signatureY = Math.max(yPos, pageHeight - 40);
  const sigWidth = (pageWidth - margins.left - margins.right) / 3;

  doc.setFontSize(fonts.body);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.text);

  // Comptable
  doc.setFont('helvetica', 'bold');
  doc.text('Le Comptable', margins.left + sigWidth / 2, signatureY, {
    align: 'center',
  });
  doc.setFont('helvetica', 'normal');
  doc.text('Date : ___/___/______', margins.left + sigWidth / 2, signatureY + 20, {
    align: 'center',
  });

  // DAAF
  doc.setFont('helvetica', 'bold');
  doc.text('Le DAAF', margins.left + sigWidth + sigWidth / 2, signatureY, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Date : ___/___/______', margins.left + sigWidth + sigWidth / 2, signatureY + 20, {
    align: 'center',
  });

  // DG
  doc.setFont('helvetica', 'bold');
  doc.text(
    'Le Directeur G\u00e9n\u00e9ral',
    margins.left + 2 * sigWidth + sigWidth / 2,
    signatureY,
    { align: 'center' }
  );
  doc.setFont('helvetica', 'normal');
  doc.text('Date : ___/___/______', margins.left + 2 * sigWidth + sigWidth / 2, signatureY + 20, {
    align: 'center',
  });

  // ── FOOTER ──
  doc.setFontSize(fonts.small - 1);
  doc.setTextColor(...colors.secondary);
  doc.text(
    'Document g\u00e9n\u00e9r\u00e9 par SYGFP - Syst\u00e8me de Gestion des Finances Publiques ARTI',
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  );

  // Metadata
  doc.setProperties({
    title: `Bordereau de R\u00e8glement - ${numeroBordereau}`,
    subject: `Exercice ${exercice}`,
    author: 'ARTI - SYGFP',
    creator: 'SYGFP - Syst\u00e8me de Gestion des Finances Publiques',
  });

  const blob = doc.output('blob');
  const filename = `ARTI_BORDEREAU_${numeroBordereau.replace(/[^a-zA-Z0-9]/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;

  return { blob, filename };
}

// ============================================================================
// COMPONENT
// ============================================================================

export function BordereauReglement({ reglements, exercice }: BordereauReglementProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [numeroBordereau, setNumeroBordereau] = useState(
    `BRD-${exercice}-${String(Date.now()).slice(-4)}`
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(reglements.map((r) => r.id)));

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
    if (selectedIds.size === reglements.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(reglements.map((r) => r.id)));
    }
  };

  const selectedReglements = reglements.filter((r) => selectedIds.has(r.id));
  const totalMontant = selectedReglements.reduce((sum, r) => sum + (r.montant || 0), 0);

  const handleGenerate = async () => {
    if (selectedReglements.length === 0) {
      toast.error('Veuillez s\u00e9lectionner au moins un r\u00e8glement');
      return;
    }

    setIsGenerating(true);
    try {
      const { blob, filename } = await generateBordereauPdf(
        selectedReglements,
        exercice,
        numeroBordereau
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Bordereau PDF g\u00e9n\u00e9r\u00e9 avec succ\u00e8s');
      setDialogOpen(false);
    } catch (error) {
      console.error('[BordereauReglement] Erreur:', error);
      toast.error('Erreur lors de la g\u00e9n\u00e9ration du PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Printer className="h-4 w-4" />
          Bordereau PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            G\u00e9n\u00e9rer un bordereau de r\u00e8glement
          </DialogTitle>
          <DialogDescription>
            S\u00e9lectionnez les r\u00e8glements \u00e0 inclure dans le bordereau PDF
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Num bordereau */}
          <div className="flex items-center gap-4">
            <Label htmlFor="num-bordereau" className="whitespace-nowrap">
              N\u00b0 Bordereau
            </Label>
            <Input
              id="num-bordereau"
              value={numeroBordereau}
              onChange={(e) => setNumeroBordereau(e.target.value)}
              className="max-w-xs"
            />
          </div>

          {/* Reglements selection */}
          <div className="rounded-md border max-h-[40vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="p-2 text-left w-10">
                    <Checkbox
                      checked={selectedIds.size === reglements.length}
                      onCheckedChange={toggleAll}
                    />
                  </th>
                  <th className="p-2 text-left">N\u00b0 R\u00e8glement</th>
                  <th className="p-2 text-left">B\u00e9n\u00e9ficiaire</th>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {reglements.map((reg) => (
                  <tr
                    key={reg.id}
                    className="border-t hover:bg-muted/30 cursor-pointer"
                    onClick={() => toggleSelection(reg.id)}
                  >
                    <td className="p-2">
                      <Checkbox
                        checked={selectedIds.has(reg.id)}
                        onCheckedChange={() => toggleSelection(reg.id)}
                      />
                    </td>
                    <td className="p-2 font-mono">{reg.numero}</td>
                    <td className="p-2">{reg.ordonnancement?.beneficiaire || '-'}</td>
                    <td className="p-2">
                      {reg.date_paiement ? format(new Date(reg.date_paiement), 'dd/MM/yyyy') : '-'}
                    </td>
                    <td className="p-2 text-right font-medium">{formatMontant(reg.montant)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">
              {selectedReglements.length} r\u00e8glement(s) s\u00e9lectionn\u00e9(s)
            </span>
            <span className="text-lg font-bold">{formatMontant(totalMontant)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || selectedReglements.length === 0}
            className="gap-2"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isGenerating ? 'G\u00e9n\u00e9ration...' : 'T\u00e9l\u00e9charger PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BordereauReglement;
