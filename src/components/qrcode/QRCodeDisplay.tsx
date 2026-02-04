/**
 * QRCodeDisplay - Affichage du QR code pour les documents validés
 * Version pour affichage à l'écran
 */

import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { useQRCode } from '@/hooks/useQRCode';
import {
  truncateHash,
  formatValidationDate,
  DOCUMENT_TYPE_LABELS,
  type DocumentType,
} from '@/lib/qrcode-utils';
import { cn } from '@/lib/utils';

// Tailles d'affichage
const SIZES = {
  sm: 80,
  md: 100,
  lg: 150,
} as const;

type DisplaySize = keyof typeof SIZES;

interface QRCodeDisplayProps {
  reference: string;
  type: DocumentType;
  dateValidation: string;
  validateur: string;
  size?: DisplaySize;
  showDetails?: boolean;
  className?: string;
}

export function QRCodeDisplay({
  reference,
  type,
  dateValidation,
  validateur,
  size = 'md',
  showDetails = false,
  className,
}: QRCodeDisplayProps) {
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
        <Skeleton className="h-4 w-20" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4',
          className
        )}
      >
        <AlertCircle className="h-8 w-8 text-red-500" />
        <span className="text-sm text-red-600">Erreur de génération</span>
      </div>
    );
  }

  if (showDetails) {
    return (
      <Card className={cn('w-fit', className)}>
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* QR Code */}
            <div className="flex flex-col items-center">
              <div className="bg-white p-2 rounded border">
                <QRCodeSVG
                  value={qrCodeUrl}
                  size={pixelSize}
                  level="M"
                  includeMargin={false}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                />
              </div>
              <span className="text-xs text-muted-foreground mt-1 font-mono">
                {truncateHash(hash, 8)}
              </span>
            </div>

            {/* Détails */}
            <div className="flex flex-col justify-center gap-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="font-medium">Document vérifié</span>
              </div>
              <div>
                <span className="text-muted-foreground">Référence : </span>
                <Badge variant="outline" className="font-mono">
                  {reference}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Type : </span>
                <span>{DOCUMENT_TYPE_LABELS[type]}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Validé le : </span>
                <span>{formatValidationDate(dateValidation)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Par : </span>
                <span>{validateur}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Version compacte
  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="bg-white p-2 rounded border shadow-sm">
        <QRCodeSVG
          value={qrCodeUrl}
          size={pixelSize}
          level="M"
          includeMargin={false}
          bgColor="#FFFFFF"
          fgColor="#000000"
        />
      </div>
      <span className="text-xs text-muted-foreground mt-1 font-mono">
        {truncateHash(hash, 8)}
      </span>
    </div>
  );
}
