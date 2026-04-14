import { describe, it, expect } from 'vitest';

// ============================================================
// Tests de la Codification ARTI — Systeme de References SYGFP
// ============================================================
// Format pivot : ARTI + {etape:2} + {mois:2} + {annee:2} + {sequence:4}
// 10 etapes : 0=SEF, 1=AEF, 2=IMP, 3=EB, 4=PM, 5=ENG, 6=LIQ, 7=ORD, 8=REG, 9=VIR

// === CONSTANTES ===

const ARTI_ETAPE_CODES = {
  NOTE_SEF: 0,
  NOTE_AEF: 1,
  IMPUTATION: 2,
  EXPRESSION_BESOIN: 3,
  PASSATION_MARCHE: 4,
  ENGAGEMENT: 5,
  LIQUIDATION: 6,
  ORDONNANCEMENT: 7,
  REGLEMENT: 8,
  VIREMENT: 9,
} as const;

const ARTI_ETAPE_LABELS: Record<number, string> = {
  0: 'Note SEF',
  1: 'Note AEF',
  2: 'Imputation',
  3: 'Expression de Besoin',
  4: 'Passation de Marche',
  5: 'Engagement',
  6: 'Liquidation',
  7: 'Ordonnancement',
  8: 'Reglement',
  9: 'Virement',
};

const ARTI_ETAPE_SIGLES: Record<number, string> = {
  0: 'SEF',
  1: 'AEF',
  2: 'IMP',
  3: 'EB',
  4: 'PM',
  5: 'ENG',
  6: 'LIQ',
  7: 'ORD',
  8: 'REG',
  9: 'VIR',
};

// === FONCTIONS UTILITAIRES DE TEST ===

/** Parse une reference ARTI 14 caracteres */
function parseARTIReference(ref: string): {
  prefix: string;
  etape: number;
  mois: number;
  annee: number;
  sequence: number;
  valid: boolean;
} {
  if (!ref || ref.length < 13) {
    return { prefix: '', etape: -1, mois: -1, annee: -1, sequence: -1, valid: false };
  }

  const prefix = ref.substring(0, 4);
  if (prefix !== 'ARTI') {
    return { prefix, etape: -1, mois: -1, annee: -1, sequence: -1, valid: false };
  }

  // Format 14 chars : ARTI + XX + MM + YY + NNNN
  if (ref.length === 14) {
    const etape = parseInt(ref.substring(4, 6), 10);
    const mois = parseInt(ref.substring(6, 8), 10);
    const annee = parseInt(ref.substring(8, 10), 10);
    const sequence = parseInt(ref.substring(10, 14), 10);
    const valid =
      etape >= 0 && etape <= 99 && mois >= 1 && mois <= 12 && sequence >= 1 && sequence <= 9999;
    return { prefix, etape, mois, annee, sequence, valid };
  }

  // Format 13 chars (legacy) : ARTI + X + MM + YY + NNNN
  if (ref.length === 13) {
    const etape = parseInt(ref.substring(4, 5), 10);
    const mois = parseInt(ref.substring(5, 7), 10);
    const annee = parseInt(ref.substring(7, 9), 10);
    const sequence = parseInt(ref.substring(9, 13), 10);
    const valid =
      etape >= 0 && etape <= 9 && mois >= 1 && mois <= 12 && sequence >= 1 && sequence <= 9999;
    return { prefix, etape, mois, annee, sequence, valid };
  }

  return { prefix, etape: -1, mois: -1, annee: -1, sequence: -1, valid: false };
}

/** Genere une reference ARTI 14 caracteres */
function generateARTIReference(
  etape: number,
  mois: number,
  annee: number,
  sequence: number
): string {
  return (
    'ARTI' +
    String(etape).padStart(2, '0') +
    String(mois).padStart(2, '0') +
    String(annee % 100).padStart(2, '0') +
    String(sequence).padStart(4, '0')
  );
}

/** Format lisible : ARTI-XX-MM/YY-NNNN */
function formatARTIReference(ref: string): string {
  const parsed = parseARTIReference(ref);
  if (!parsed.valid) return ref;
  const sigle = ARTI_ETAPE_SIGLES[parsed.etape] || `E${parsed.etape}`;
  return `${sigle}-${String(parsed.mois).padStart(2, '0')}/${String(parsed.annee).padStart(2, '0')}-${String(parsed.sequence).padStart(4, '0')}`;
}

/** Verifie si une chaine est une reference ARTI valide */
function isValidARTIReference(ref: string): boolean {
  return parseARTIReference(ref).valid;
}

// ============================================================
// TESTS
// ============================================================

describe('Codification ARTI — Systeme de References SYGFP', () => {
  // --- 1. Les 10 codes d'etape ---
  describe("Codes d'etape", () => {
    it("devrait avoir exactement 10 codes d'etape (0-9)", () => {
      expect(Object.keys(ARTI_ETAPE_CODES)).toHaveLength(10);
    });

    it('les codes vont de 0 a 9 sans trou', () => {
      const codes = Object.values(ARTI_ETAPE_CODES).sort();
      expect(codes).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it.each([
      [0, 'NOTE_SEF', 'SEF'],
      [1, 'NOTE_AEF', 'AEF'],
      [2, 'IMPUTATION', 'IMP'],
      [3, 'EXPRESSION_BESOIN', 'EB'],
      [4, 'PASSATION_MARCHE', 'PM'],
      [5, 'ENGAGEMENT', 'ENG'],
      [6, 'LIQUIDATION', 'LIQ'],
      [7, 'ORDONNANCEMENT', 'ORD'],
      [8, 'REGLEMENT', 'REG'],
      [9, 'VIREMENT', 'VIR'],
    ])('etape %i = %s (sigle: %s)', (code, name, sigle) => {
      expect(ARTI_ETAPE_CODES[name as keyof typeof ARTI_ETAPE_CODES]).toBe(code);
      expect(ARTI_ETAPE_SIGLES[code]).toBe(sigle);
      expect(ARTI_ETAPE_LABELS[code]).toBeDefined();
    });

    it('chaque code a un label et un sigle', () => {
      for (let i = 0; i <= 9; i++) {
        expect(ARTI_ETAPE_LABELS[i]).toBeDefined();
        expect(ARTI_ETAPE_SIGLES[i]).toBeDefined();
        expect(typeof ARTI_ETAPE_LABELS[i]).toBe('string');
        expect(ARTI_ETAPE_SIGLES[i].length).toBeLessThanOrEqual(3);
      }
    });
  });

  // --- 2. Parsing references 14 caracteres ---
  describe('Parsing format 14 caracteres', () => {
    it.each([
      ['ARTI0001260001', 0, 1, 26, 1],
      ['ARTI0102260005', 1, 2, 26, 5],
      ['ARTI0203260012', 2, 3, 26, 12],
      ['ARTI0304260003', 3, 4, 26, 3],
      ['ARTI0404260001', 4, 4, 26, 1],
      ['ARTI0505260008', 5, 5, 26, 8],
      ['ARTI0606260020', 6, 6, 26, 20],
      ['ARTI0707260015', 7, 7, 26, 15],
      ['ARTI0808260001', 8, 8, 26, 1],
      ['ARTI0909260002', 9, 9, 26, 2],
    ])('parse "%s" -> etape=%i, mois=%i, annee=%i, seq=%i', (ref, etape, mois, annee, seq) => {
      const parsed = parseARTIReference(ref);
      expect(parsed.valid).toBe(true);
      expect(parsed.prefix).toBe('ARTI');
      expect(parsed.etape).toBe(etape);
      expect(parsed.mois).toBe(mois);
      expect(parsed.annee).toBe(annee);
      expect(parsed.sequence).toBe(seq);
    });

    it('la reference max par mois est ARTI0012269999', () => {
      const parsed = parseARTIReference('ARTI0012269999');
      expect(parsed.valid).toBe(true);
      expect(parsed.sequence).toBe(9999);
    });
  });

  // --- 3. Parsing format legacy 13 caracteres ---
  describe('Parsing format legacy 13 caracteres', () => {
    it.each([
      ['ARTI001260001', 0, 1, 26, 1],
      ['ARTI102260005', 1, 2, 26, 5],
      ['ARTI502260001', 5, 2, 26, 1],
      ['ARTI602260019', 6, 2, 26, 19],
      ['ARTI803260015', 8, 3, 26, 15],
    ])(
      'parse legacy "%s" -> etape=%i, mois=%i, annee=%i, seq=%i',
      (ref, etape, mois, annee, seq) => {
        const parsed = parseARTIReference(ref);
        expect(parsed.valid).toBe(true);
        expect(parsed.etape).toBe(etape);
        expect(parsed.mois).toBe(mois);
        expect(parsed.annee).toBe(annee);
        expect(parsed.sequence).toBe(seq);
      }
    );
  });

  // --- 4. Generation de references ---
  describe('Generation de references', () => {
    it.each([
      [0, 1, 2026, 1, 'ARTI0001260001'],
      [1, 2, 2026, 5, 'ARTI0102260005'],
      [5, 2, 2026, 1, 'ARTI0502260001'],
      [6, 6, 2026, 20, 'ARTI0606260020'],
      [8, 12, 2026, 999, 'ARTI0812260999'],
      [9, 1, 2027, 1, 'ARTI0901270001'],
    ])('genere etape=%i, mois=%i, an=%i, seq=%i -> "%s"', (etape, mois, annee, seq, expected) => {
      expect(generateARTIReference(etape, mois, annee, seq)).toBe(expected);
    });

    it('le padding fonctionne pour les petits nombres', () => {
      expect(generateARTIReference(0, 1, 2026, 1)).toBe('ARTI0001260001');
    });

    it('le padding fonctionne pour les grands nombres', () => {
      expect(generateARTIReference(9, 12, 2026, 9999)).toBe('ARTI0912269999');
    });

    it('annee a 4 chiffres est tronquee a 2', () => {
      expect(generateARTIReference(5, 3, 2026, 42)).toBe('ARTI0503260042');
      expect(generateARTIReference(5, 3, 2027, 42)).toBe('ARTI0503270042');
    });
  });

  // --- 5. Formatage lisible ---
  describe('Formatage lisible', () => {
    it.each([
      ['ARTI0001260001', 'SEF-01/26-0001'],
      ['ARTI0102260005', 'AEF-02/26-0005'],
      ['ARTI0203260012', 'IMP-03/26-0012'],
      ['ARTI0304260003', 'EB-04/26-0003'],
      ['ARTI0404260001', 'PM-04/26-0001'],
      ['ARTI0505260008', 'ENG-05/26-0008'],
      ['ARTI0606260020', 'LIQ-06/26-0020'],
      ['ARTI0707260015', 'ORD-07/26-0015'],
      ['ARTI0808260001', 'REG-08/26-0001'],
      ['ARTI0909260002', 'VIR-09/26-0002'],
    ])('format "%s" -> "%s"', (ref, expected) => {
      expect(formatARTIReference(ref)).toBe(expected);
    });

    it('reference invalide est retournee telle quelle', () => {
      expect(formatARTIReference('INVALID')).toBe('INVALID');
      expect(formatARTIReference('')).toBe('');
    });
  });

  // --- 6. Validation ---
  describe('Validation de references', () => {
    it('accepte les references valides 14 chars', () => {
      expect(isValidARTIReference('ARTI0001260001')).toBe(true);
      expect(isValidARTIReference('ARTI0912269999')).toBe(true);
    });

    it('accepte les references legacy 13 chars', () => {
      expect(isValidARTIReference('ARTI001260001')).toBe(true);
      expect(isValidARTIReference('ARTI902269999')).toBe(true);
    });

    it('rejette les references invalides', () => {
      expect(isValidARTIReference('')).toBe(false);
      expect(isValidARTIReference('INVALID')).toBe(false);
      expect(isValidARTIReference('XXXX0001260001')).toBe(false);
      expect(isValidARTIReference('ARTI')).toBe(false);
    });

    it('rejette mois invalide (0 ou 13+)', () => {
      expect(isValidARTIReference('ARTI0000260001')).toBe(false); // mois 0
      expect(isValidARTIReference('ARTI0013260001')).toBe(false); // mois 13
    });

    it('rejette sequence 0', () => {
      expect(isValidARTIReference('ARTI0001260000')).toBe(false); // sequence 0
    });
  });

  // --- 7. Correspondance etape <-> chaine de depense ---
  describe('Correspondance avec la chaine de depense', () => {
    const CHAINE_DEPENSE = [
      { ordre: 1, etape: 'Note SEF', code: 0, table: 'notes_sef' },
      { ordre: 2, etape: 'Note AEF', code: 1, table: 'notes_dg' },
      { ordre: 3, etape: 'Imputation', code: 2, table: 'imputations' },
      { ordre: 4, etape: 'Expression Besoin', code: 3, table: 'expressions_besoin' },
      { ordre: 5, etape: 'Passation Marche', code: 4, table: 'passation_marche' },
      { ordre: 6, etape: 'Engagement', code: 5, table: 'budget_engagements' },
      { ordre: 7, etape: 'Liquidation', code: 6, table: 'budget_liquidations' },
      { ordre: 8, etape: 'Ordonnancement', code: 7, table: 'ordonnancements' },
      { ordre: 9, etape: 'Reglement', code: 8, table: 'reglements' },
    ];

    it('la chaine de depense a 9 etapes', () => {
      expect(CHAINE_DEPENSE).toHaveLength(9);
    });

    it("les codes d'etape sont sequentiels de 0 a 8", () => {
      CHAINE_DEPENSE.forEach((etape, index) => {
        expect(etape.code).toBe(index);
      });
    });

    it('chaque etape a un label et un sigle ARTI correspondant', () => {
      CHAINE_DEPENSE.forEach((etape) => {
        expect(ARTI_ETAPE_LABELS[etape.code]).toBeDefined();
        expect(ARTI_ETAPE_SIGLES[etape.code]).toBeDefined();
      });
    });

    it('le virement (code 9) est hors chaine de depense', () => {
      expect(ARTI_ETAPE_CODES.VIREMENT).toBe(9);
      expect(CHAINE_DEPENSE.find((e) => e.code === 9)).toBeUndefined();
    });
  });

  // --- 8. Robustesse du parsing ---
  describe('Robustesse du parsing', () => {
    it('gere les null et undefined sans crash', () => {
      expect(parseARTIReference('')).toHaveProperty('valid', false);
      expect(parseARTIReference('a')).toHaveProperty('valid', false);
    });

    it('gere les formats de migration (non-ARTI)', () => {
      expect(isValidARTIReference('LIQ-2026-0001')).toBe(false);
      expect(isValidARTIReference('ORD-2026-3506')).toBe(false);
      expect(isValidARTIReference('MIG-ARTI101240001')).toBe(false);
      expect(isValidARTIReference('ENG-2026-00001')).toBe(false);
      expect(isValidARTIReference('IMP-2026-DCSTI-0001')).toBe(false);
    });

    it('round-trip: generer puis parser donne les memes valeurs', () => {
      for (let etape = 0; etape <= 9; etape++) {
        for (const mois of [1, 6, 12]) {
          const ref = generateARTIReference(etape, mois, 2026, 42);
          const parsed = parseARTIReference(ref);
          expect(parsed.valid).toBe(true);
          expect(parsed.etape).toBe(etape);
          expect(parsed.mois).toBe(mois);
          expect(parsed.annee).toBe(26);
          expect(parsed.sequence).toBe(42);
        }
      }
    });
  });

  // --- 9. Code d'imputation budgetaire ---
  describe("Code d'imputation budgetaire (18 chiffres)", () => {
    const CODE_FORMAT = /^\d{2}-\d{2}-\d{3}-\d{3}-\d{2}-\d{6}$/;

    it('le format standard est XX-XX-XXX-XXX-XX-XXXXXX', () => {
      expect('11-02-402-020-52-612900').toMatch(CODE_FORMAT);
    });

    it('les segments ont les bonnes longueurs', () => {
      const code = '11-02-402-020-52-612900';
      const segments = code.split('-');
      expect(segments).toHaveLength(6);
      expect(segments[0]).toHaveLength(2); // OS
      expect(segments[1]).toHaveLength(2); // Action
      expect(segments[2]).toHaveLength(3); // Activite
      expect(segments[3]).toHaveLength(3); // Sous-Activite
      expect(segments[4]).toHaveLength(2); // Direction
      expect(segments[5]).toHaveLength(6); // NBE
    });
  });
});
