/**
 * Hook pour la génération et vérification des QR codes SYGFP
 */

import { useState, useEffect, useCallback } from 'react';
import {
  generateVerifyUrl,
  verifyDocument,
  type QRCodeData,
  type QRCodePayload,
  type DocumentType,
} from '@/lib/qrcode-utils';

type UseQRCodeOptions = QRCodeData;

interface UseQRCodeReturn {
  qrCodeUrl: string;
  hash: string;
  isGenerating: boolean;
  error: string | null;
  regenerate: () => Promise<void>;
}

/**
 * Hook pour générer un QR code à partir des données d'un document
 */
export function useQRCode(options: UseQRCodeOptions): UseQRCodeReturn {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [hash, setHash] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateVerifyUrl({
        reference: options.reference,
        type: options.type,
        dateValidation: options.dateValidation,
        validateur: options.validateur,
      });

      setQrCodeUrl(result.url);
      setHash(result.hash);
    } catch (err) {
      setError((err as Error).message || 'Erreur de génération du QR code');
    } finally {
      setIsGenerating(false);
    }
  }, [options.reference, options.type, options.dateValidation, options.validateur]);

  useEffect(() => {
    generate();
  }, [generate]);

  return {
    qrCodeUrl,
    hash,
    isGenerating,
    error,
    regenerate: generate,
  };
}

interface UseVerifyQRCodeReturn {
  isVerifying: boolean;
  isValid: boolean | null;
  data: QRCodePayload | null;
  error: string | null;
  verify: (encodedPayload: string) => Promise<void>;
}

/**
 * Hook pour vérifier un QR code scanné
 */
export function useVerifyQRCode(): UseVerifyQRCodeReturn {
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [data, setData] = useState<QRCodePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verify = useCallback(async (encodedPayload: string) => {
    setIsVerifying(true);
    setError(null);
    setIsValid(null);
    setData(null);

    try {
      const result = await verifyDocument(encodedPayload);

      setIsValid(result.valid);
      setData(result.data);

      if (!result.valid && result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError((err as Error).message || 'Erreur de vérification');
      setIsValid(false);
    } finally {
      setIsVerifying(false);
    }
  }, []);

  return {
    isVerifying,
    isValid,
    data,
    error,
    verify,
  };
}

// Re-export types for convenience
export type { QRCodeData, QRCodePayload, DocumentType };
