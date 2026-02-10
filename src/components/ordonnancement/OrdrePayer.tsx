import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Printer } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MODES_PAIEMENT } from "@/hooks/useOrdonnancements";

interface OrdrePayerProps {
  ordonnancement: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatMontant = (montant: number) =>
  new Intl.NumberFormat("fr-FR").format(montant);

const numberToWords = (num: number): string => {
  const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
  const teens = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
  const tens = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingt", "quatre-vingt-dix"];
  
  if (num === 0) return "zéro";
  if (num < 0) return "moins " + numberToWords(-num);
  
  if (num < 10) return units[num];
  if (num < 20) return teens[num - 10];
  if (num < 100) {
    const ten = Math.floor(num / 10);
    const unit = num % 10;
    if (ten === 7 || ten === 9) {
      return tens[ten - 1] + "-" + teens[unit + (ten === 7 ? 0 : 0)];
    }
    return tens[ten] + (unit ? "-" + units[unit] : "");
  }
  if (num < 1000) {
    const hundred = Math.floor(num / 100);
    const rest = num % 100;
    return (hundred === 1 ? "cent" : units[hundred] + " cent") + (rest ? " " + numberToWords(rest) : "");
  }
  if (num < 1000000) {
    const thousand = Math.floor(num / 1000);
    const rest = num % 1000;
    return (thousand === 1 ? "mille" : numberToWords(thousand) + " mille") + (rest ? " " + numberToWords(rest) : "");
  }
  if (num < 1000000000) {
    const million = Math.floor(num / 1000000);
    const rest = num % 1000000;
    return numberToWords(million) + " million" + (million > 1 ? "s" : "") + (rest ? " " + numberToWords(rest) : "");
  }
  return num.toString();
};

export function OrdrePayer({ ordonnancement, open, onOpenChange }: OrdrePayerProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const engagement = ordonnancement?.liquidation?.engagement;
  const liquidation = ordonnancement?.liquidation;
  const modePaiementLabel = MODES_PAIEMENT.find(
    (m) => m.value === ordonnancement?.mode_paiement
  )?.label;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ordre de Payer - ${ordonnancement?.numero}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Times New Roman', Times, serif; 
              font-size: 12pt;
              line-height: 1.5;
              padding: 20mm;
            }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 14pt; font-weight: bold; }
            .title { 
              font-size: 18pt; 
              font-weight: bold; 
              text-transform: uppercase;
              margin: 20px 0;
              padding: 10px;
              border: 2px solid #000;
              display: inline-block;
            }
            .numero { font-size: 14pt; margin-bottom: 20px; }
            .section { margin-bottom: 20px; }
            .section-title { 
              font-weight: bold; 
              text-decoration: underline;
              margin-bottom: 10px;
            }
            .row { display: flex; margin-bottom: 5px; }
            .label { width: 200px; font-weight: bold; }
            .value { flex: 1; }
            .montant-box {
              border: 2px solid #000;
              padding: 15px;
              margin: 20px 0;
              text-align: center;
            }
            .montant-chiffres { font-size: 20pt; font-weight: bold; }
            .montant-lettres { font-style: italic; margin-top: 5px; }
            .signatures {
              display: flex;
              justify-content: space-between;
              margin-top: 60px;
            }
            .signature-box {
              width: 45%;
              text-align: center;
            }
            .signature-line {
              border-bottom: 1px solid #000;
              height: 60px;
              margin-bottom: 5px;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 10pt;
              color: #666;
            }
            @media print {
              body { padding: 15mm; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Ordre de Payer
          </DialogTitle>
        </DialogHeader>

        {/* Aperçu du document */}
        <div className="border rounded-lg p-8 bg-white" ref={printRef}>
          {/* En-tête */}
          <div className="text-center mb-8">
            <p className="font-bold text-lg">RÉPUBLIQUE DE CÔTE D'IVOIRE</p>
            <p className="text-sm">Union - Discipline - Travail</p>
            <p className="text-sm mt-2">————————</p>
            <p className="font-bold mt-2">[NOM DE L'INSTITUTION]</p>
            
            <div className="mt-6 inline-block border-2 border-black px-8 py-2">
              <p className="font-bold text-xl">ORDRE DE PAYER</p>
            </div>
            
            <p className="mt-4 font-bold text-lg">{ordonnancement?.numero}</p>
            <p className="text-sm">Exercice {ordonnancement?.exercice || new Date().getFullYear()}</p>
          </div>

          <Separator className="my-6" />

          {/* Informations principales */}
          <div className="space-y-6">
            {/* Bénéficiaire */}
            <div>
              <h3 className="font-bold underline mb-2">BÉNÉFICIAIRE</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex">
                  <span className="font-semibold w-32">Nom:</span>
                  <span>{ordonnancement?.beneficiaire}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-32">Banque:</span>
                  <span>{ordonnancement?.banque || "—"}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-32">RIB/Compte:</span>
                  <span>{ordonnancement?.rib || "—"}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-32">Mode de paiement:</span>
                  <span>{modePaiementLabel}</span>
                </div>
              </div>
            </div>

            {/* Objet */}
            <div>
              <h3 className="font-bold underline mb-2">OBJET</h3>
              <p className="text-sm">{ordonnancement?.objet}</p>
            </div>

            {/* Références */}
            <div>
              <h3 className="font-bold underline mb-2">RÉFÉRENCES</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex">
                  <span className="font-semibold w-40">N° Engagement:</span>
                  <span>{engagement?.numero || "—"}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-40">N° Liquidation:</span>
                  <span>{liquidation?.numero || "—"}</span>
                </div>
                <div className="flex col-span-2">
                  <span className="font-semibold w-40">Imputation:</span>
                  <span>{engagement?.budget_line?.code} - {engagement?.budget_line?.label}</span>
                </div>
              </div>
            </div>

            {/* Montant */}
            <div className="border-2 border-black p-6 text-center">
              <p className="text-sm mb-2">MONTANT À PAYER</p>
              <p className="text-3xl font-bold">{formatMontant(ordonnancement?.montant || 0)} FCFA</p>
              <p className="text-sm italic mt-2">
                Arrêté à la somme de: {numberToWords(Math.floor(ordonnancement?.montant || 0))} francs CFA
              </p>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 mt-12">
              <div className="text-center">
                <p className="font-semibold mb-2">Le Directeur Administratif et Financier</p>
                <div className="h-20 border-b border-black mb-2" />
                <p className="text-sm">Date: ____/____/________</p>
              </div>
              <div className="text-center">
                <p className="font-semibold mb-2">Le Directeur Général</p>
                <div className="h-20 border-b border-black mb-2" />
                <p className="text-sm">Date: ____/____/________</p>
              </div>
            </div>

            {/* Pied de page */}
            <div className="text-center mt-8 text-xs text-muted-foreground">
              <p>Document généré le {format(new Date(), "dd MMMM yyyy à HH:mm", { locale: fr })}</p>
              <p>Référence: {ordonnancement?.numero}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Imprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
