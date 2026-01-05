import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import { PieceEngagement } from "./PieceEngagement";
import { Engagement } from "@/hooks/useEngagements";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EngagementPrintDialogProps {
  engagement: Engagement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EngagementPrintDialog({ engagement, open, onOpenChange }: EngagementPrintDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Pièce d'engagement ${engagement?.numero}</title>
            <style>
              body {
                font-family: "Times New Roman", serif;
                margin: 0;
                padding: 20px;
              }
              @media print {
                body { margin: 0; padding: 20mm; }
              }
              table { width: 100%; border-collapse: collapse; }
              td, th { padding: 8px; }
              .border { border: 1px solid black; }
              .border-2 { border: 2px solid black; }
              .border-b { border-bottom: 1px solid black; }
              .border-t { border-top: 1px solid black; }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .font-bold { font-weight: bold; }
              .font-semibold { font-weight: 600; }
              .uppercase { text-transform: uppercase; }
              .text-lg { font-size: 1.125rem; }
              .text-xl { font-size: 1.25rem; }
              .text-sm { font-size: 0.875rem; }
              .text-xs { font-size: 0.75rem; }
              .mb-2 { margin-bottom: 0.5rem; }
              .mb-4 { margin-bottom: 1rem; }
              .mb-6 { margin-bottom: 1.5rem; }
              .mb-8 { margin-bottom: 2rem; }
              .mb-16 { margin-bottom: 4rem; }
              .mt-2 { margin-top: 0.5rem; }
              .mt-8 { margin-top: 2rem; }
              .mt-12 { margin-top: 3rem; }
              .p-4 { padding: 1rem; }
              .p-8 { padding: 2rem; }
              .pt-2 { padding-top: 0.5rem; }
              .pt-4 { padding-top: 1rem; }
              .pt-8 { padding-top: 2rem; }
              .pb-4 { padding-bottom: 1rem; }
              .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
              .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
              .grid { display: grid; }
              .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
              .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
              .gap-4 { gap: 1rem; }
              .gap-6 { gap: 1.5rem; }
              .gap-8 { gap: 2rem; }
              .bg-gray-50 { background-color: #f9fafb; }
              .bg-gray-100 { background-color: #f3f4f6; }
              .text-gray-500 { color: #6b7280; }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
  };

  if (!engagement) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Aperçu de la pièce d'engagement</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] border rounded-lg">
          <PieceEngagement ref={printRef} engagement={engagement} />
        </ScrollArea>

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
