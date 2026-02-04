/**
 * QRCodePrint - Version impression du QR code
 * Optimisé pour l'impression N&B avec taille 200x200px
 */

import { QRCodeSVG } from 'qrcode.react';
import { useQRCode } from '@/hooks/useQRCode';
import {
  truncateHash,
  formatValidationDate,
  DOCUMENT_TYPE_LABELS,
  type DocumentType,
} from '@/lib/qrcode-utils';
import { cn } from '@/lib/utils';

// Taille impression : 200x200 pixels
const PRINT_SIZE = 200;

interface QRCodePrintProps {
  reference: string;
  type: DocumentType;
  dateValidation: string;
  validateur: string;
  showDetails?: boolean;
  className?: string;
}

export function QRCodePrint({
  reference,
  type,
  dateValidation,
  validateur,
  showDetails = true,
  className,
}: QRCodePrintProps) {
  const { qrCodeUrl, hash, isGenerating, error } = useQRCode({
    reference,
    type,
    dateValidation,
    validateur,
  });

  if (isGenerating || error) {
    return null;
  }

  return (
    <div
      className={cn(
        'print:block flex flex-col items-center p-4 bg-white',
        className
      )}
      style={{ pageBreakInside: 'avoid' }}
    >
      {/* QR Code principal */}
      <div className="border-2 border-black p-2">
        <QRCodeSVG
          value={qrCodeUrl}
          size={PRINT_SIZE}
          level="H" // High error correction for print
          includeMargin={false}
          bgColor="#FFFFFF"
          fgColor="#000000"
        />
      </div>

      {/* Informations du document */}
      {showDetails && (
        <div className="mt-3 text-center text-black" style={{ fontSize: '10px' }}>
          <div className="font-bold text-sm mb-1">{reference}</div>
          <div>{DOCUMENT_TYPE_LABELS[type]}</div>
          <div>Validé le {formatValidationDate(dateValidation)}</div>
          <div>Par {validateur}</div>
          <div className="mt-1 font-mono text-xs text-gray-600">
            Code: {truncateHash(hash, 12)}
          </div>
        </div>
      )}

      {/* Instructions de vérification */}
      <div
        className="mt-2 text-center text-gray-500 border-t pt-2"
        style={{ fontSize: '8px' }}
      >
        Scannez ce QR code pour vérifier l'authenticité du document
        <br />
        ou visitez sygfp.arti.ci/verify
      </div>
    </div>
  );
}

/**
 * Composant pour impression d'un bloc QR code avec cadre
 */
interface QRCodePrintBlockProps extends QRCodePrintProps {
  title?: string;
}

export function QRCodePrintBlock({
  title = 'Cachet électronique',
  ...props
}: QRCodePrintBlockProps) {
  return (
    <div className="border border-gray-300 rounded p-3 bg-white print:border-black">
      <div className="text-center text-xs font-semibold text-gray-600 mb-2 print:text-black">
        {title}
      </div>
      <QRCodePrint {...props} showDetails={false} />
      <div className="text-center mt-2">
        <span className="text-xs font-mono text-gray-500 print:text-black">
          {props.reference}
        </span>
      </div>
    </div>
  );
}
