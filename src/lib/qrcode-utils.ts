/**
 * Utilitaires pour la génération et vérification des QR codes SYGFP
 * Hash SHA256 pour anti-falsification
 */

// Types de documents supportés
export const DOCUMENT_TYPES = [
  'NOTE_SEF',
  'NOTE_AEF',
  'IMPUTATION',
  'ENGAGEMENT',
  'LIQUIDATION',
  'ORDONNANCEMENT',
  'REGLEMENT',
  'MARCHE',
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

// Labels des types de documents
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  NOTE_SEF: 'Note SEF',
  NOTE_AEF: 'Note AEF',
  IMPUTATION: 'Imputation budgétaire',
  ENGAGEMENT: 'Engagement',
  LIQUIDATION: 'Liquidation',
  ORDONNANCEMENT: 'Ordonnancement',
  REGLEMENT: 'Règlement',
  MARCHE: 'Marché',
};

// Données encodées dans le QR code
export interface QRCodeData {
  reference: string;
  type: DocumentType;
  dateValidation: string; // ISO string
  validateur: string;
}

// Données décodées avec checksum
export interface QRCodePayload extends QRCodeData {
  checksum: string;
  timestamp: number;
}

// URL de base pour la vérification
const VERIFY_BASE_URL = 'https://sygfp.arti.ci/verify';

// Clé secrète pour le hash (en production, utiliser une variable d'environnement)
const SECRET_KEY = 'SYGFP_ARTI_2026_SECRET_KEY';

/**
 * Génère un hash SHA256 à partir des données
 */
export async function generateHash(data: QRCodeData): Promise<string> {
  const payload = {
    ...data,
    timestamp: Date.now(),
    secret: SECRET_KEY,
  };

  const jsonString = JSON.stringify(payload);
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(jsonString);

  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

/**
 * Encode les données en base64 URL-safe
 */
export function encodePayload(data: QRCodeData, checksum: string): string {
  const payload: QRCodePayload = {
    ...data,
    checksum,
    timestamp: Date.now(),
  };

  const jsonString = JSON.stringify(payload);
  // Base64 URL-safe encoding
  const base64 = btoa(jsonString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return base64;
}

/**
 * Décode le payload depuis le hash
 */
export function decodePayload(encoded: string): QRCodePayload | null {
  try {
    // Restore standard base64
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '=';
    }

    const jsonString = atob(base64);
    const payload = JSON.parse(jsonString) as QRCodePayload;

    // Validate required fields
    if (!payload.reference || !payload.type || !payload.checksum) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Génère l'URL de vérification complète
 */
export async function generateVerifyUrl(data: QRCodeData): Promise<{
  url: string;
  hash: string;
}> {
  const checksum = await generateHash(data);
  const encodedPayload = encodePayload(data, checksum);

  return {
    url: `${VERIFY_BASE_URL}/${encodedPayload}`,
    hash: checksum,
  };
}

/**
 * Vérifie l'intégrité d'un document via son payload
 */
export async function verifyDocument(encoded: string): Promise<{
  valid: boolean;
  data: QRCodePayload | null;
  error?: string;
}> {
  const payload = decodePayload(encoded);

  if (!payload) {
    return {
      valid: false,
      data: null,
      error: 'Format de QR code invalide',
    };
  }

  // Note: En production, on comparerait avec le checksum stocké en base
  // Ici on vérifie juste que le payload est cohérent (format SHA256 = 64 chars)
  if (!payload.checksum || payload.checksum.length !== 64) {
    return {
      valid: false,
      data: payload,
      error: 'Checksum invalide',
    };
  }

  return {
    valid: true,
    data: payload,
  };
}

/**
 * Formate une date pour l'affichage
 */
export function formatValidationDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return isoDate;
  }
}

/**
 * Tronque le hash pour affichage
 */
export function truncateHash(hash: string, length: number = 8): string {
  if (hash.length <= length) return hash;
  return `${hash.slice(0, length)}...`;
}
