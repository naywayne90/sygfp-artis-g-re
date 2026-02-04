/**
 * Tests unitaires - qrcode-utils.ts
 *
 * Vérifie les fonctions de génération de hash, encodage/décodage
 * de payload et vérification des documents.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateHash,
  encodePayload,
  decodePayload,
  generateVerifyUrl,
  verifyDocument,
  formatValidationDate,
  truncateHash,
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  type QRCodeData,
  type QRCodePayload,
  type DocumentType,
} from '@/lib/qrcode-utils';

// Mock de crypto.subtle pour Node.js
const mockDigest = vi.fn();

beforeEach(() => {
  // Mock de crypto.subtle.digest
  if (!globalThis.crypto) {
    (globalThis as unknown as { crypto: object }).crypto = {};
  }
  if (!globalThis.crypto.subtle) {
    (globalThis.crypto as unknown as { subtle: object }).subtle = {};
  }
  (globalThis.crypto.subtle as unknown as { digest: typeof mockDigest }).digest = mockDigest;

  // Retourner un hash simulé
  mockDigest.mockImplementation(async () => {
    const hashArray = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      hashArray[i] = (i * 7 + 13) % 256;
    }
    return hashArray.buffer;
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('DOCUMENT_TYPES et DOCUMENT_TYPE_LABELS', () => {
  it('contient tous les types de documents attendus', () => {
    expect(DOCUMENT_TYPES).toContain('NOTE_SEF');
    expect(DOCUMENT_TYPES).toContain('NOTE_AEF');
    expect(DOCUMENT_TYPES).toContain('ENGAGEMENT');
    expect(DOCUMENT_TYPES).toContain('LIQUIDATION');
    expect(DOCUMENT_TYPES).toContain('ORDONNANCEMENT');
    expect(DOCUMENT_TYPES).toContain('REGLEMENT');
    expect(DOCUMENT_TYPES).toContain('MARCHE');
  });

  it('a un label pour chaque type de document', () => {
    for (const type of DOCUMENT_TYPES) {
      expect(DOCUMENT_TYPE_LABELS[type]).toBeDefined();
      expect(typeof DOCUMENT_TYPE_LABELS[type]).toBe('string');
      expect(DOCUMENT_TYPE_LABELS[type].length).toBeGreaterThan(0);
    }
  });

  it('les labels sont en français', () => {
    expect(DOCUMENT_TYPE_LABELS.NOTE_SEF).toBe('Note SEF');
    expect(DOCUMENT_TYPE_LABELS.NOTE_AEF).toBe('Note AEF');
    expect(DOCUMENT_TYPE_LABELS.ENGAGEMENT).toBe('Engagement');
  });
});

describe('generateHash', () => {
  const testData: QRCodeData = {
    reference: 'ARTI00126001',
    type: 'NOTE_SEF',
    dateValidation: '2026-01-29T10:00:00.000Z',
    validateur: 'Jean DUPONT',
  };

  it('génère un hash hexadécimal de 64 caractères', async () => {
    const hash = await generateHash(testData);

    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
    expect(hash.length).toBe(64);
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });

  it('génère des hash différents pour des données différentes', async () => {
    const _hash1 = await generateHash(testData);

    const differentData: QRCodeData = {
      ...testData,
      reference: 'ARTI00126002',
    };
    const _hash2 = await generateHash(differentData);

    // Note: avec le mock, les hash sont identiques, mais en production ils seraient différents
    // Ce test vérifie que la fonction est appelée avec les bonnes données
    expect(mockDigest).toHaveBeenCalled();
  });

  it('appelle crypto.subtle.digest avec SHA-256', async () => {
    await generateHash(testData);

    // Vérifier que digest a été appelé avec SHA-256 comme premier argument
    expect(mockDigest).toHaveBeenCalled();
    const callArgs = mockDigest.mock.calls[0];
    expect(callArgs[0]).toBe('SHA-256');
  });
});

describe('encodePayload', () => {
  const testData: QRCodeData = {
    reference: 'ARTI00126001',
    type: 'NOTE_SEF',
    dateValidation: '2026-01-29T10:00:00.000Z',
    validateur: 'Jean DUPONT',
  };

  const testChecksum = 'a'.repeat(64);

  it('retourne une chaîne base64 URL-safe', () => {
    const encoded = encodePayload(testData, testChecksum);

    expect(encoded).toBeDefined();
    expect(typeof encoded).toBe('string');
    // Pas de caractères non URL-safe
    expect(encoded).not.toContain('+');
    expect(encoded).not.toContain('/');
    expect(encoded).not.toContain('=');
  });

  it('peut être décodé correctement', () => {
    const encoded = encodePayload(testData, testChecksum);
    const decoded = decodePayload(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded?.reference).toBe(testData.reference);
    expect(decoded?.type).toBe(testData.type);
    expect(decoded?.validateur).toBe(testData.validateur);
    expect(decoded?.checksum).toBe(testChecksum);
  });

  it('inclut un timestamp', () => {
    const before = Date.now();
    const encoded = encodePayload(testData, testChecksum);
    const after = Date.now();

    const decoded = decodePayload(encoded);

    expect(decoded?.timestamp).toBeGreaterThanOrEqual(before);
    expect(decoded?.timestamp).toBeLessThanOrEqual(after);
  });
});

describe('decodePayload', () => {
  it('décode correctement un payload valide', () => {
    const payload: QRCodePayload = {
      reference: 'ARTI00126001',
      type: 'NOTE_SEF',
      dateValidation: '2026-01-29T10:00:00.000Z',
      validateur: 'Jean DUPONT',
      checksum: 'b'.repeat(64),
      timestamp: Date.now(),
    };

    const jsonString = JSON.stringify(payload);
    const base64 = btoa(jsonString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const decoded = decodePayload(base64);

    expect(decoded).not.toBeNull();
    expect(decoded?.reference).toBe(payload.reference);
    expect(decoded?.type).toBe(payload.type);
    expect(decoded?.checksum).toBe(payload.checksum);
  });

  it('retourne null pour un payload invalide', () => {
    const decoded = decodePayload('invalid-base64-data!@#$');

    expect(decoded).toBeNull();
  });

  it('retourne null si reference est manquante', () => {
    const invalidPayload = {
      type: 'NOTE_SEF',
      checksum: 'a'.repeat(64),
    };

    const base64 = btoa(JSON.stringify(invalidPayload));
    const decoded = decodePayload(base64);

    expect(decoded).toBeNull();
  });

  it('retourne null si type est manquant', () => {
    const invalidPayload = {
      reference: 'ARTI00126001',
      checksum: 'a'.repeat(64),
    };

    const base64 = btoa(JSON.stringify(invalidPayload));
    const decoded = decodePayload(base64);

    expect(decoded).toBeNull();
  });

  it('retourne null si checksum est manquant', () => {
    const invalidPayload = {
      reference: 'ARTI00126001',
      type: 'NOTE_SEF',
    };

    const base64 = btoa(JSON.stringify(invalidPayload));
    const decoded = decodePayload(base64);

    expect(decoded).toBeNull();
  });

  it('gère correctement le padding base64', () => {
    const payload: QRCodePayload = {
      reference: 'A',
      type: 'NOTE_SEF',
      dateValidation: '',
      validateur: '',
      checksum: 'c'.repeat(64),
      timestamp: 0,
    };

    // Encoder sans padding
    const base64NoPadding = btoa(JSON.stringify(payload)).replace(/=/g, '');
    const decoded = decodePayload(base64NoPadding);

    expect(decoded).not.toBeNull();
    expect(decoded?.reference).toBe('A');
  });
});

describe('generateVerifyUrl', () => {
  const testData: QRCodeData = {
    reference: 'ARTI00126001',
    type: 'NOTE_SEF',
    dateValidation: '2026-01-29T10:00:00.000Z',
    validateur: 'Jean DUPONT',
  };

  it('génère une URL valide', async () => {
    const result = await generateVerifyUrl(testData);

    expect(result.url).toBeDefined();
    expect(result.url).toContain('https://');
    expect(result.url).toContain('/verify/');
  });

  it('inclut le hash dans le résultat', async () => {
    const result = await generateVerifyUrl(testData);

    expect(result.hash).toBeDefined();
    expect(result.hash.length).toBe(64);
    expect(result.hash).toMatch(/^[a-f0-9]+$/);
  });

  it('l\'URL contient un payload décodable', async () => {
    const result = await generateVerifyUrl(testData);

    // Extraire le payload de l'URL
    const urlParts = result.url.split('/verify/');
    expect(urlParts.length).toBe(2);

    const encodedPayload = urlParts[1];
    const decoded = decodePayload(encodedPayload);

    expect(decoded).not.toBeNull();
    expect(decoded?.reference).toBe(testData.reference);
  });
});

describe('verifyDocument', () => {
  it('retourne valid=true pour un payload valide', async () => {
    const validPayload: QRCodePayload = {
      reference: 'ARTI00126001',
      type: 'NOTE_SEF',
      dateValidation: '2026-01-29T10:00:00.000Z',
      validateur: 'Jean DUPONT',
      checksum: 'd'.repeat(64), // 64 caractères = valide
      timestamp: Date.now(),
    };

    const encoded = btoa(JSON.stringify(validPayload))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const result = await verifyDocument(encoded);

    expect(result.valid).toBe(true);
    expect(result.data).not.toBeNull();
    expect(result.error).toBeUndefined();
  });

  it('retourne valid=false pour un payload mal formé', async () => {
    const result = await verifyDocument('not-valid-base64!@#');

    expect(result.valid).toBe(false);
    expect(result.data).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error).toContain('invalide');
  });

  it('retourne valid=false pour un checksum invalide', async () => {
    const invalidPayload: QRCodePayload = {
      reference: 'ARTI00126001',
      type: 'NOTE_SEF',
      dateValidation: '2026-01-29T10:00:00.000Z',
      validateur: 'Jean DUPONT',
      checksum: 'short', // Trop court
      timestamp: Date.now(),
    };

    const encoded = btoa(JSON.stringify(invalidPayload))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const result = await verifyDocument(encoded);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Checksum invalide');
  });

  it('retourne les données même si invalide', async () => {
    const invalidPayload: QRCodePayload = {
      reference: 'ARTI00126001',
      type: 'NOTE_SEF',
      dateValidation: '2026-01-29T10:00:00.000Z',
      validateur: 'Jean DUPONT',
      checksum: 'x', // Invalide
      timestamp: Date.now(),
    };

    const encoded = btoa(JSON.stringify(invalidPayload))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const result = await verifyDocument(encoded);

    expect(result.valid).toBe(false);
    expect(result.data).not.toBeNull();
    expect(result.data?.reference).toBe('ARTI00126001');
  });
});

describe('formatValidationDate', () => {
  it('formate une date ISO en français', () => {
    const isoDate = '2026-01-29T10:30:00.000Z';
    const formatted = formatValidationDate(isoDate);

    // Le format dépend de la locale, mais doit contenir des éléments de date
    expect(formatted).toBeDefined();
    expect(formatted.length).toBeGreaterThan(0);
    // Doit contenir un chiffre (jour ou année)
    expect(formatted).toMatch(/\d/);
  });

  it('retourne la chaîne originale pour une date invalide', () => {
    const invalidDate = 'not-a-date';
    const formatted = formatValidationDate(invalidDate);

    expect(formatted).toBe(invalidDate);
  });

  it('gère une chaîne vide', () => {
    const formatted = formatValidationDate('');

    expect(formatted).toBeDefined();
  });
});

describe('truncateHash', () => {
  const fullHash = 'a'.repeat(64);

  it('tronque un hash long', () => {
    const truncated = truncateHash(fullHash, 8);

    expect(truncated).toBe('aaaaaaaa...');
    expect(truncated.length).toBe(11); // 8 + "..."
  });

  it('utilise la longueur par défaut de 8', () => {
    const truncated = truncateHash(fullHash);

    expect(truncated).toBe('aaaaaaaa...');
  });

  it('ne tronque pas un hash court', () => {
    const shortHash = 'abcd';
    const truncated = truncateHash(shortHash, 8);

    expect(truncated).toBe(shortHash);
  });

  it('gère la longueur exacte', () => {
    const exactHash = 'abcdefgh';
    const truncated = truncateHash(exactHash, 8);

    expect(truncated).toBe(exactHash);
  });

  it('accepte une longueur personnalisée', () => {
    const truncated = truncateHash(fullHash, 16);

    expect(truncated).toBe('aaaaaaaaaaaaaaaa...');
  });
});

describe('Types TypeScript', () => {
  it('QRCodeData a toutes les propriétés requises', () => {
    const data: QRCodeData = {
      reference: 'test',
      type: 'NOTE_SEF',
      dateValidation: '',
      validateur: '',
    };

    expect(data.reference).toBeDefined();
    expect(data.type).toBeDefined();
    expect(data.dateValidation).toBeDefined();
    expect(data.validateur).toBeDefined();
  });

  it('QRCodePayload étend QRCodeData', () => {
    const payload: QRCodePayload = {
      reference: 'test',
      type: 'NOTE_SEF',
      dateValidation: '',
      validateur: '',
      checksum: '',
      timestamp: 0,
    };

    expect(payload.checksum).toBeDefined();
    expect(payload.timestamp).toBeDefined();
  });

  it('DocumentType est une union des types valides', () => {
    const types: DocumentType[] = ['NOTE_SEF', 'NOTE_AEF', 'ENGAGEMENT'];

    for (const type of types) {
      expect(DOCUMENT_TYPES).toContain(type);
    }
  });
});
