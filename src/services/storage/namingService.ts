/**
 * Service de nommage standardisé des documents
 * Format: REFERENCE_TYPE_DATE.extension
 * Exemple: EB-2026-001_PROFORMA_2026-01-17.pdf
 */

import { format } from "date-fns";

export interface NamingParams {
  reference: string;      // Ex: "EB-2026-001", "ENG-2026-042"
  typePiece: string;      // Ex: "PROFORMA", "FACTURE", "PV_RECEPTION"
  originalFilename: string;
  date?: Date;
}

export interface StandardNameResult {
  standardName: string;
  extension: string;
  sanitizedReference: string;
  sanitizedType: string;
}

/**
 * Types de documents reconnus avec leurs codes standards
 */
export const DOCUMENT_TYPES = {
  // Documents généraux
  PROFORMA: { code: 'PROFORMA', label: 'Proforma', obligatoire: true },
  FACTURE: { code: 'FACTURE', label: 'Facture définitive', obligatoire: true },
  BON_COMMANDE: { code: 'BON_COMMANDE', label: 'Bon de commande', obligatoire: false },
  BON_LIVRAISON: { code: 'BON_LIVRAISON', label: 'Bon de livraison', obligatoire: true },
  
  // Documents de réception
  PV_RECEPTION: { code: 'PV_RECEPTION', label: 'PV de réception', obligatoire: true },
  ATTESTATION_SERVICE_FAIT: { code: 'ATTESTATION_SERVICE_FAIT', label: 'Attestation service fait', obligatoire: true },
  
  // Documents financiers
  FICHE_ENGAGEMENT: { code: 'FICHE_ENGAGEMENT', label: 'Fiche d\'engagement', obligatoire: true },
  FICHE_LIQUIDATION: { code: 'FICHE_LIQUIDATION', label: 'Fiche de liquidation', obligatoire: true },
  ORDRE_PAYER: { code: 'ORDRE_PAYER', label: 'Ordre de payer', obligatoire: true },
  
  // Documents marchés
  CAHIER_CHARGES: { code: 'CAHIER_CHARGES', label: 'Cahier des charges', obligatoire: false },
  OFFRE_TECHNIQUE: { code: 'OFFRE_TECHNIQUE', label: 'Offre technique', obligatoire: false },
  OFFRE_FINANCIERE: { code: 'OFFRE_FINANCIERE', label: 'Offre financière', obligatoire: false },
  PV_OUVERTURE: { code: 'PV_OUVERTURE', label: 'PV d\'ouverture des plis', obligatoire: false },
  PV_ATTRIBUTION: { code: 'PV_ATTRIBUTION', label: 'PV d\'attribution', obligatoire: false },
  CONTRAT: { code: 'CONTRAT', label: 'Contrat signé', obligatoire: true },
  
  // Documents prestataire
  RIB: { code: 'RIB', label: 'RIB bancaire', obligatoire: true },
  RCCM: { code: 'RCCM', label: 'RCCM', obligatoire: false },
  QUITUS_FISCAL: { code: 'QUITUS_FISCAL', label: 'Quitus fiscal', obligatoire: false },
  ATTESTATION_CNSS: { code: 'ATTESTATION_CNSS', label: 'Attestation CNSS', obligatoire: false },
  
  // Autres
  AUTRE: { code: 'AUTRE', label: 'Autre document', obligatoire: false },
  NOTE: { code: 'NOTE', label: 'Note de service', obligatoire: false },
  DEVIS: { code: 'DEVIS', label: 'Devis', obligatoire: false },
} as const;

export type DocumentTypeCode = keyof typeof DOCUMENT_TYPES;

/**
 * Sanitize une chaîne pour un nom de fichier sûr
 */
function sanitizeForFilename(str: string): string {
  return str
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^A-Z0-9-]/g, '_')     // Replace special chars
    .replace(/_+/g, '_')             // Collapse multiple underscores
    .replace(/^_|_$/g, '');          // Trim underscores
}

/**
 * Extrait l'extension d'un nom de fichier
 */
function getExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length < 2) return '';
  return parts[parts.length - 1].toLowerCase();
}

/**
 * Génère un nom de fichier standardisé
 * Format: REFERENCE_TYPE_DATE.extension
 */
export function generateStandardName(params: NamingParams): StandardNameResult {
  const { reference, typePiece, originalFilename, date = new Date() } = params;
  
  const sanitizedReference = sanitizeForFilename(reference);
  const sanitizedType = sanitizeForFilename(typePiece);
  const extension = getExtension(originalFilename);
  const formattedDate = format(date, 'yyyy-MM-dd');
  
  const standardName = `${sanitizedReference}_${sanitizedType}_${formattedDate}.${extension}`;
  
  return {
    standardName,
    extension,
    sanitizedReference,
    sanitizedType,
  };
}

/**
 * Génère un chemin de stockage complet et standardisé
 * Format: {exercice}/{entity_type}/{entity_id}/{standard_name}
 */
export function generateStandardPath(params: {
  exercice: number;
  entityType: string;
  entityId: string;
  reference: string;
  typePiece: string;
  originalFilename: string;
}): string {
  const { exercice, entityType, entityId, reference, typePiece, originalFilename } = params;
  
  const { standardName } = generateStandardName({
    reference,
    typePiece,
    originalFilename,
  });
  
  return `${exercice}/${entityType}/${entityId}/${standardName}`;
}

/**
 * Parse un nom de fichier standardisé pour extraire les composants
 */
export function parseStandardName(standardName: string): {
  reference: string;
  typePiece: string;
  date: string;
  extension: string;
} | null {
  // Format: REFERENCE_TYPE_DATE.ext
  const match = standardName.match(/^(.+)_([A-Z_]+)_(\d{4}-\d{2}-\d{2})\.(\w+)$/);
  
  if (!match) return null;
  
  return {
    reference: match[1],
    typePiece: match[2],
    date: match[3],
    extension: match[4],
  };
}

/**
 * Récupère le label d'un type de document
 */
export function getDocumentTypeLabel(code: string): string {
  const type = DOCUMENT_TYPES[code as DocumentTypeCode];
  return type?.label || code;
}

/**
 * Vérifie si un type de document est obligatoire
 */
export function isDocumentTypeRequired(code: string): boolean {
  const type = DOCUMENT_TYPES[code as DocumentTypeCode];
  return type?.obligatoire ?? false;
}

/**
 * Récupère tous les types de documents comme liste
 */
export function getDocumentTypesList(): Array<{
  code: string;
  label: string;
  obligatoire: boolean;
}> {
  return Object.values(DOCUMENT_TYPES);
}
