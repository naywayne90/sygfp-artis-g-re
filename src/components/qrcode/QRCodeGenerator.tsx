/**
 * QRCodeGenerator - Composant de génération de QR code
 * Génère un QR code à partir des données d'un document validé
 */

import { QRCodeSVG } from 'qrcode.react';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { useQRCode, type QRCodeData } from '@/hooks/useQRCode';
import { truncateHash } from '@/lib/qrcode-utils';
import { cn } from '@/lib/utils';

// Tailles en pixels
const SIZES = {
  sm: 80,
  md: 100,
  lg: 150,
  print: 200,
} as const;

type QRCodeSize = keyof typeof SIZES;

interface QRCodeGeneratorProps extends QRCodeData {
  size?: QRCodeSize;
  showHash?: boolean;
  className?: string;
}

export function QRCodeGenerator({
  reference,
  type,
  dateValidation,
  validateur,
  size = 'md',
  showHash = true,
  className,
}: QRCodeGeneratorProps) {
  const { qrCodeUrl, hash, isGenerating, error } = useQRCode({
    reference,
    type,
    dateValidation,
    validateur,
  });

  const pixelSize = SIZES[size];

  if (isGenerating) {
    return (
      <div className={cn('flex flex-col items-center gap-2', className)}>
        <Skeleton
          className="rounded"
          style={{ width: pixelSize, height: pixelSize }}
        />
        {showHash && <Skeleton className="h-4 w-20" />}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-2 text-red-500',
          className
        )}
        style={{ width: pixelSize, height: pixelSize }}
      >
        <AlertCircle className="h-8 w-8" />
        <span className="text-xs text-center">Erreur QR</span>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="bg-white p-2 rounded border">
        <QRCodeSVG
          value={qrCodeUrl}
          size={pixelSize}
          level="M" // Medium error correction
          includeMargin={false}
          bgColor="#FFFFFF"
          fgColor="#000000"
        />
      </div>
      {showHash && (
        <span className="text-xs text-muted-foreground mt-1 font-mono">
          {truncateHash(hash, 8)}
        </span>
      )}
    </div>
  );
}
