import { useRef, forwardRef } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import { Printer } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQRCode } from '@/hooks/useQRCode';
import {
  MODES_PAIEMENT,
  COMPTES_BANCAIRES_ARTI,
  type ReglementWithRelations,
} from '@/hooks/useReglements';

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
};

const getModePaiementLabel = (mode: string) => {
  return MODES_PAIEMENT.find((m) => m.value === mode)?.label || mode;
};

const getCompteLabel = (compte: string) => {
  return COMPTES_BANCAIRES_ARTI.find((c) => c.value === compte)?.label || compte;
};

interface ReglementReceiptContentProps {
  reglement: ReglementWithRelations;
}

const ReglementReceiptContent = forwardRef<HTMLDivElement, ReglementReceiptContentProps>(
  function ReglementReceiptContent({ reglement }, ref) {
    const ordonnancement = reglement.ordonnancement;
    const engagement = ordonnancement?.liquidation?.engagement;

    const { qrCodeUrl, isGenerating } = useQRCode({
      reference: reglement.numero,
      type: 'REGLEMENT',
      dateValidation: reglement.date_paiement,
      validateur: 'SYGFP',
    });

    return (
      <div
        ref={ref}
        style={{
          fontFamily: '"Times New Roman", serif',
          padding: '2rem',
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
        {/* En-tete officiel */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '1rem',
            }}
          >
            <div style={{ textAlign: 'left', fontSize: '0.75rem', lineHeight: 1.4 }}>
              <div style={{ fontWeight: 'bold' }}>REPUBLIQUE DE COTE D'IVOIRE</div>
              <div>Union - Discipline - Travail</div>
              <div style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>AUTORITE DE REGULATION</div>
              <div style={{ fontWeight: 'bold' }}>DU TRANSPORT</div>
              <div style={{ fontWeight: 'bold' }}>INTERIEUR (ARTI)</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '2px' }}>
                ARTI
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.75rem', lineHeight: 1.4 }}>
              <div>Direction Administrative</div>
              <div>et Financiere</div>
              <div style={{ marginTop: '0.5rem' }}>Service de la Comptabilite</div>
            </div>
          </div>
          <div
            style={{
              border: '2px solid black',
              padding: '0.5rem 1rem',
              display: 'inline-block',
              marginTop: '0.5rem',
            }}
          >
            <div
              style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              Recu de Paiement
            </div>
          </div>
        </div>

        {/* Numero et date */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
          }}
        >
          <div>
            <strong>N&#176; :</strong> {reglement.numero}
          </div>
          <div>
            <strong>Date :</strong>{' '}
            {format(new Date(reglement.date_paiement), 'dd MMMM yyyy', { locale: fr })}
          </div>
        </div>

        {/* Informations beneficiaire */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
          <tbody>
            <tr>
              <td
                style={{
                  border: '1px solid black',
                  padding: '8px',
                  width: '35%',
                  backgroundColor: '#f3f4f6',
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                }}
              >
                Beneficiaire
              </td>
              <td style={{ border: '1px solid black', padding: '8px', fontSize: '0.875rem' }}>
                {ordonnancement?.beneficiaire || '-'}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  border: '1px solid black',
                  padding: '8px',
                  backgroundColor: '#f3f4f6',
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                }}
              >
                Objet
              </td>
              <td style={{ border: '1px solid black', padding: '8px', fontSize: '0.875rem' }}>
                {ordonnancement?.objet || engagement?.objet || '-'}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  border: '1px solid black',
                  padding: '8px',
                  backgroundColor: '#f3f4f6',
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                }}
              >
                N&#176; Ordonnancement
              </td>
              <td
                style={{
                  border: '1px solid black',
                  padding: '8px',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                }}
              >
                {ordonnancement?.numero || '-'}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  border: '1px solid black',
                  padding: '8px',
                  backgroundColor: '#f3f4f6',
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                }}
              >
                N&#176; Engagement
              </td>
              <td
                style={{
                  border: '1px solid black',
                  padding: '8px',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                }}
              >
                {engagement?.numero || '-'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Details du paiement */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
          <thead>
            <tr>
              <th
                colSpan={2}
                style={{
                  border: '2px solid black',
                  padding: '10px',
                  backgroundColor: '#e5e7eb',
                  textAlign: 'center',
                  fontSize: '1rem',
                  textTransform: 'uppercase',
                }}
              >
                Details du Paiement
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                style={{
                  border: '1px solid black',
                  padding: '8px',
                  width: '35%',
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                }}
              >
                Montant paye
              </td>
              <td
                style={{
                  border: '1px solid black',
                  padding: '8px',
                  fontSize: '1.125rem',
                  fontWeight: 'bold',
                  textAlign: 'right',
                }}
              >
                {formatMontant(reglement.montant)}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  border: '1px solid black',
                  padding: '8px',
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                }}
              >
                Mode de paiement
              </td>
              <td style={{ border: '1px solid black', padding: '8px', fontSize: '0.875rem' }}>
                {getModePaiementLabel(reglement.mode_paiement)}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  border: '1px solid black',
                  padding: '8px',
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                }}
              >
                Reference
              </td>
              <td
                style={{
                  border: '1px solid black',
                  padding: '8px',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                }}
              >
                {reglement.reference_paiement || '-'}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  border: '1px solid black',
                  padding: '8px',
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                }}
              >
                Compte bancaire
              </td>
              <td style={{ border: '1px solid black', padding: '8px', fontSize: '0.875rem' }}>
                {reglement.compte_bancaire_arti
                  ? getCompteLabel(reglement.compte_bancaire_arti)
                  : '-'}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  border: '1px solid black',
                  padding: '8px',
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                }}
              >
                Banque
              </td>
              <td style={{ border: '1px solid black', padding: '8px', fontSize: '0.875rem' }}>
                {reglement.banque_arti || '-'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Montant ordonnance et solde */}
        {ordonnancement && (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
            <thead>
              <tr>
                <th
                  colSpan={2}
                  style={{
                    border: '2px solid black',
                    padding: '10px',
                    backgroundColor: '#e5e7eb',
                    textAlign: 'center',
                    fontSize: '1rem',
                    textTransform: 'uppercase',
                  }}
                >
                  Situation de l'Ordonnancement
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  style={{
                    border: '1px solid black',
                    padding: '8px',
                    width: '50%',
                    fontWeight: 'bold',
                    fontSize: '0.875rem',
                  }}
                >
                  Montant ordonnance
                </td>
                <td
                  style={{
                    border: '1px solid black',
                    padding: '8px',
                    textAlign: 'right',
                    fontSize: '0.875rem',
                  }}
                >
                  {formatMontant(ordonnancement.montant || 0)}
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    border: '1px solid black',
                    padding: '8px',
                    fontWeight: 'bold',
                    fontSize: '0.875rem',
                  }}
                >
                  Total paye
                </td>
                <td
                  style={{
                    border: '1px solid black',
                    padding: '8px',
                    textAlign: 'right',
                    fontSize: '0.875rem',
                  }}
                >
                  {formatMontant(ordonnancement.montant_paye || 0)}
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    border: '1px solid black',
                    padding: '8px',
                    fontWeight: 'bold',
                    fontSize: '0.875rem',
                  }}
                >
                  Restant a payer
                </td>
                <td
                  style={{
                    border: '1px solid black',
                    padding: '8px',
                    textAlign: 'right',
                    fontWeight: 'bold',
                    fontSize: '0.875rem',
                  }}
                >
                  {formatMontant(
                    Math.max(0, (ordonnancement.montant || 0) - (ordonnancement.montant_paye || 0))
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        )}

        {/* Observation */}
        {reglement.observation && (
          <div style={{ marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            <strong>Observation :</strong> {reglement.observation}
          </div>
        )}

        {/* Signatures et QR Code */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginTop: '2rem',
          }}
        >
          {/* Signature gauche */}
          <div style={{ textAlign: 'center', width: '35%' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '3rem' }}>
              Le Comptable
            </div>
            <div
              style={{ borderTop: '1px solid black', paddingTop: '0.25rem', fontSize: '0.75rem' }}
            >
              Signature et cachet
            </div>
          </div>

          {/* QR Code */}
          <div style={{ textAlign: 'center' }}>
            {!isGenerating && qrCodeUrl && (
              <div
                style={{ border: '1px solid black', padding: '0.5rem', display: 'inline-block' }}
              >
                <QRCodeSVG
                  value={qrCodeUrl}
                  size={120}
                  level="H"
                  includeMargin={false}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                />
              </div>
            )}
            <div style={{ fontSize: '0.625rem', marginTop: '0.25rem', color: '#6b7280' }}>
              Scannez pour verifier
            </div>
          </div>

          {/* Signature droite */}
          <div style={{ textAlign: 'center', width: '35%' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '3rem' }}>
              Le Directeur Administratif
              <br />
              et Financier
            </div>
            <div
              style={{ borderTop: '1px solid black', paddingTop: '0.25rem', fontSize: '0.75rem' }}
            >
              Signature et cachet
            </div>
          </div>
        </div>

        {/* Pied de page */}
        <div
          style={{
            marginTop: '2rem',
            paddingTop: '0.5rem',
            borderTop: '1px solid #d1d5db',
            textAlign: 'center',
            fontSize: '0.625rem',
            color: '#6b7280',
          }}
        >
          ARTI - Autorite de Regulation du Transport Interieur | SYGFP - Systeme de Gestion des
          Finances Publiques
          <br />
          Document genere le {format(new Date(), "dd/MM/yyyy 'a' HH:mm", { locale: fr })} | Ref:{' '}
          {reglement.numero}
        </div>
      </div>
    );
  }
);

// --- Dialog wrapper ---

interface ReglementReceiptDialogProps {
  reglement: ReglementWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReglementReceiptDialog({
  reglement,
  open,
  onOpenChange,
}: ReglementReceiptDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Recu de paiement ${reglement?.numero ?? ''}</title>
          <style>
            body {
              font-family: "Times New Roman", serif;
              margin: 0;
              padding: 20px;
              color: #000;
            }
            @media print {
              body { margin: 0; padding: 15mm; }
            }
            table { width: 100%; border-collapse: collapse; }
            td, th { padding: 8px; }
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
  };

  if (!reglement) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Apercu du recu de paiement</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] border rounded-lg bg-white">
          <ReglementReceiptContent ref={printRef} reglement={reglement} />
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
