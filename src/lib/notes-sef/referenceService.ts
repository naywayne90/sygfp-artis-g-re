/**
 * Service de gestion des références ARTI pivot
 *
 * Nouveau format (14 chars): ARTI + XX(2) + MM(2) + YY(2) + NNNN(4)
 * Exemple: ARTI0002260001 = SEF (00), février 2026, premier document
 *
 * Legacy format (13 chars): ARTI + X(1) + MM(2) + YY(2) + NNNN(4)
 * Exemple: ARTI001260001 = SEF (0), janvier 2026, premier document
 *
 * Règles :
 * - Référence générée à la SOUMISSION via RPC submit_note_sef_with_reference
 * - Les brouillons n'ont PAS de référence (numero = null)
 * - Référence IMMUABLE après génération
 * - Compteur séquentiel par (étape, mois, année) - atomique via UPSERT SQL
 */

import { supabase } from '@/integrations/supabase/client';

// Mapping des étapes de la chaîne de dépense
export const ETAPE_CODES = {
  SEF: 0,
  AEF: 1,
  IMPUTATION: 2,
  EXPRESSION_BESOIN: 3,
  PASSATION_MARCHE: 4,
  ENGAGEMENT: 5,
  LIQUIDATION: 6,
  ORDONNANCEMENT: 7,
  REGLEMENT: 8,
} as const;

export type EtapeCode = keyof typeof ETAPE_CODES;

export const ETAPE_LABELS: Record<number, string> = {
  0: 'Note SEF',
  1: 'Note AEF',
  2: 'Imputation',
  3: 'Expression de besoin',
  4: 'Passation de marché',
  5: 'Engagement',
  6: 'Liquidation',
  7: 'Ordonnancement',
  8: 'Règlement',
};

export interface ARTIReference {
  reference: string;
  etape: number;
  mois: number;
  annee: number;
  numero: number;
  etapeLabel: string;
}

export interface ParsedReference {
  etape: number;
  mois: number;
  annee: number;
  numero: number;
  isValid: boolean;
  etapeLabel?: string;
}

/**
 * Génère une nouvelle référence ARTI (usage manuel si trigger non déclenché)
 */
export async function generateARTIReference(etapeCode: number, date?: Date): Promise<string> {
  const { data, error } = await supabase.rpc('generate_arti_reference', {
    p_etape: etapeCode,
    p_date: date?.toISOString() || new Date().toISOString(),
  });

  if (error) {
    console.error('Erreur génération référence ARTI:', error);
    throw new Error(`Impossible de générer la référence: ${error.message}`);
  }

  return data as string;
}

/**
 * Parse une référence ARTI localement (sans appel DB)
 * Gère les deux formats :
 * - Nouveau (14 chars): ARTI + XX(2) + MM(2) + YY(2) + NNNN(4)
 * - Legacy  (13 chars): ARTI + X(1)  + MM(2) + YY(2) + NNNN(4)
 */
export function parseARTIReferenceLocal(reference: string): ParsedReference {
  if (!reference || !reference.startsWith('ARTI')) {
    return { etape: 0, mois: 0, annee: 0, numero: 0, isValid: false };
  }

  // Nouveau format 14 chars: ARTI + XX(2) + MM(2) + YY(2) + NNNN(4)
  if (reference.length === 14 && /^ARTI[0-9]{10}$/.test(reference)) {
    const etape = parseInt(reference.substring(4, 6), 10);
    const mois = parseInt(reference.substring(6, 8), 10);
    const annee = 2000 + parseInt(reference.substring(8, 10), 10);
    const numero = parseInt(reference.substring(10, 14), 10);
    return { etape, mois, annee, numero, isValid: true, etapeLabel: ETAPE_LABELS[etape] };
  }

  // Legacy format 13 chars: ARTI + X(1) + MM(2) + YY(2) + NNNN(4)
  if (reference.length === 13 && /^ARTI[0-9]{9}$/.test(reference)) {
    const etape = parseInt(reference.substring(4, 5), 10);
    const mois = parseInt(reference.substring(5, 7), 10);
    const annee = 2000 + parseInt(reference.substring(7, 9), 10);
    const numero = parseInt(reference.substring(9, 13), 10);
    return { etape, mois, annee, numero, isValid: true, etapeLabel: ETAPE_LABELS[etape] };
  }

  return { etape: 0, mois: 0, annee: 0, numero: 0, isValid: false };
}

/**
 * Formate une référence pour affichage lisible
 * Nouveau: ARTI0002260001 -> ARTI-00-02/26-0001
 * Legacy:  ARTI001260001  -> ARTI-0-01/26-0001
 */
export function formatARTIReference(reference: string): string {
  const parsed = parseARTIReferenceLocal(reference);
  if (!parsed.isValid) return reference;

  const etapeStr = String(parsed.etape).padStart(2, '0');
  const moisStr = String(parsed.mois).padStart(2, '0');
  const anneeStr = String(parsed.annee % 100).padStart(2, '0');
  const numeroStr = String(parsed.numero).padStart(4, '0');

  return `ARTI-${etapeStr}-${moisStr}/${anneeStr}-${numeroStr}`;
}

/**
 * Génère une représentation courte de la référence
 * ARTI0002260001 -> SEF-02/26-0001
 */
export function formatARTIReferenceShort(reference: string): string {
  const parsed = parseARTIReferenceLocal(reference);
  if (!parsed.isValid) return reference;

  const ETAPE_ABBREVS: Record<number, string> = {
    0: 'SEF',
    1: 'AEF',
    2: 'IMP',
    3: 'EB',
    4: 'PM',
    5: 'ENG',
    6: 'LIQ',
    7: 'ORD',
    8: 'REG',
  };
  const etapeAbbrev = ETAPE_ABBREVS[parsed.etape] || '?';
  const moisStr = String(parsed.mois).padStart(2, '0');
  const anneeStr = String(parsed.annee % 100).padStart(2, '0');
  const numeroStr = String(parsed.numero).padStart(4, '0');

  return `${etapeAbbrev}-${moisStr}/${anneeStr}-${numeroStr}`;
}

/**
 * Vérifie si une référence est valide
 */
export function isValidARTIReference(reference: string): boolean {
  return parseARTIReferenceLocal(reference).isValid;
}

/**
 * Synchronise le compteur après un import (évite les collisions)
 */
export async function syncCounterFromImport(
  etape: number,
  mois: number,
  annee: number,
  maxNumero: number
): Promise<boolean> {
  const { data, error } = await supabase.rpc('sync_arti_counter_from_import', {
    p_etape: etape,
    p_mois: mois,
    p_annee: annee,
    p_max_numero: maxNumero,
  });

  if (error) {
    console.error('Erreur synchronisation compteur:', error);
    return false;
  }

  return data === true;
}

/**
 * Récupère l'état actuel des compteurs
 */
export async function getCountersStatus(): Promise<
  {
    etape: number;
    mois: number;
    annee: number;
    dernierNumero: number;
  }[]
> {
  const { data, error } = await supabase
    .from('arti_reference_counters')
    .select('etape, mois, annee, dernier_numero')
    .order('annee', { ascending: false })
    .order('mois', { ascending: false })
    .order('etape', { ascending: true });

  if (error) {
    console.error('Erreur lecture compteurs:', error);
    return [];
  }

  return data.map((row) => ({
    etape: row.etape,
    mois: row.mois,
    annee: row.annee,
    dernierNumero: row.dernier_numero,
  }));
}
