/**
 * Segmentation des codes budgétaires ARTI.
 *
 * Un code budgétaire (ex. `110340313051662110`) est un préfixe numérique
 * concaténé à partir de 5 à 6 champs hiérarchiques :
 *   OS (2) · Mission (2) · Action (3) · Activité (3) · [Sous-Activité (2|3)] · NBE (6)
 *
 * Les longueurs observées au 2026-04-08 (exercice 2026) :
 *   - 16 : OS + Mission + Action + Activité + NBE
 *   - 18 : OS + Mission + Action + Activité + SA(2) + NBE
 *   - 19 : OS + Mission + Action + Activité + SA(3) + NBE
 *
 * Les autres longueurs (codes de test, suffixes custom) sont renvoyées
 * telles quelles dans un unique segment `other`, sans tentative de découpe.
 */

export type BudgetSegmentType =
  | 'os'
  | 'mission'
  | 'action'
  | 'activite'
  | 'sous_activite'
  | 'nbe'
  | 'other';

export interface BudgetCodeSegment {
  type: BudgetSegmentType;
  /** Étiquette courte affichée sous le segment (ex. "OS", "NBE"). */
  label: string;
  /** Tranche du code correspondante. */
  value: string;
}

interface Layout {
  /** Suite de paires [type, longueur]. */
  parts: Array<[BudgetSegmentType, number]>;
}

// Longueur totale → agencement des tranches (dans l'ordre)
const LAYOUTS: Record<number, Layout> = {
  16: {
    parts: [
      ['os', 2],
      ['mission', 2],
      ['action', 3],
      ['activite', 3],
      ['nbe', 6],
    ],
  },
  18: {
    parts: [
      ['os', 2],
      ['mission', 2],
      ['action', 3],
      ['activite', 3],
      ['sous_activite', 2],
      ['nbe', 6],
    ],
  },
  19: {
    parts: [
      ['os', 2],
      ['mission', 2],
      ['action', 3],
      ['activite', 3],
      ['sous_activite', 3],
      ['nbe', 6],
    ],
  },
};

const LABELS: Record<BudgetSegmentType, string> = {
  os: 'OS',
  mission: 'Mission',
  action: 'Action',
  activite: 'Activité',
  sous_activite: 'SA',
  nbe: 'NBE',
  other: 'Code',
};

/**
 * Découpe un code budgétaire en segments typés.
 *
 * Un code purement numérique d'une longueur connue (16/18/19) est découpé
 * selon le layout correspondant. Tout autre code (test, alphanumérique,
 * longueur non gérée) est renvoyé comme un unique segment `other`.
 */
export function segmentBudgetCode(code: string | null | undefined): BudgetCodeSegment[] {
  const clean = (code ?? '').trim();
  if (!clean) return [];

  const layout = LAYOUTS[clean.length];
  const isNumeric = /^\d+$/.test(clean);

  if (!layout || !isNumeric) {
    return [{ type: 'other', label: LABELS.other, value: clean }];
  }

  const segments: BudgetCodeSegment[] = [];
  let cursor = 0;
  for (const [type, len] of layout.parts) {
    segments.push({
      type,
      label: LABELS[type],
      value: clean.substring(cursor, cursor + len),
    });
    cursor += len;
  }
  return segments;
}

/**
 * Libellé court pour un type de segment (utile pour l'accessibilité).
 */
export function getSegmentLabel(type: BudgetSegmentType): string {
  return LABELS[type];
}
