/**
 * Tests — rgcp-pieces-config
 *
 * Couvre la résolution des pièces justificatives selon le type de dépense
 * (Règlement Général Comptabilité Publique + Code Marchés Publics CI).
 */

import { describe, it, expect } from 'vitest';
import {
  resolveTypeDepense,
  getPiecesObligatoires,
  getAllTypesDepense,
} from '@/lib/config/rgcp-pieces-config';

// ===========================================================================
// resolveTypeDepense
// ===========================================================================

describe('resolveTypeDepense', () => {
  it('Retourne HORS_MARCHE si typeEngagement est null', () => {
    const config = resolveTypeDepense(null, null);
    expect(config.key).toBe('hors_marche');
    expect(config.label).toContain('Hors marché');
  });

  it('Retourne HORS_MARCHE si typeEngagement === "hors_marche"', () => {
    const config = resolveTypeDepense('hors_marche', null);
    expect(config.key).toBe('hors_marche');
  });

  it('Résout marche_fourniture pour type_marche=fourniture', () => {
    const config = resolveTypeDepense('sur_marche', 'fourniture');
    expect(config.key).toBe('marche_fourniture');
    expect(config.icon).toBe('📦');
  });

  it('Résout marche_services pour type_marche=services', () => {
    const config = resolveTypeDepense('sur_marche', 'services');
    expect(config.key).toBe('marche_services');
    expect(config.icon).toBe('🔧');
  });

  it('Résout marche_travaux pour type_marche=travaux', () => {
    const config = resolveTypeDepense('sur_marche', 'travaux');
    expect(config.key).toBe('marche_travaux');
    expect(config.icon).toBe('🏗️');
  });

  it('Résout marche_prestations_intellectuelles', () => {
    const config = resolveTypeDepense('sur_marche', 'prestations_intellectuelles');
    expect(config.key).toBe('marche_prestations_intellectuelles');
    expect(config.icon).toBe('📊');
  });

  it('Fallback sur MARCHE_FOURNITURES si type_marche inconnu', () => {
    const config = resolveTypeDepense('sur_marche', 'type_inexistant');
    expect(config.key).toBe('marche_fourniture');
  });

  it('Fallback sur MARCHE_FOURNITURES si type_marche null', () => {
    const config = resolveTypeDepense('sur_marche', null);
    expect(config.key).toBe('marche_fourniture');
  });
});

// ===========================================================================
// Pièces communes (facture + attestation service fait)
// ===========================================================================

describe('Pièces communes', () => {
  it('Marché fournitures contient facture + attestation service fait', () => {
    const config = resolveTypeDepense('sur_marche', 'fourniture');
    const codes = config.pieces.map((p) => p.code);
    expect(codes).toContain('facture');
    expect(codes).toContain('attestation_service_fait');
  });

  it('Marché services contient facture + attestation service fait', () => {
    const config = resolveTypeDepense('sur_marche', 'services');
    const codes = config.pieces.map((p) => p.code);
    expect(codes).toContain('facture');
    expect(codes).toContain('attestation_service_fait');
  });
});

// ===========================================================================
// Marché Fournitures — Pièces spécifiques
// ===========================================================================

describe('MARCHE_FOURNITURES', () => {
  const config = resolveTypeDepense('sur_marche', 'fourniture');
  const codes = config.pieces.map((p) => p.code);

  it('Contient copie marché, bon commande, bon livraison, PV réception', () => {
    expect(codes).toContain('copie_marche');
    expect(codes).toContain('bon_commande');
    expect(codes).toContain('bon_livraison');
    expect(codes).toContain('pv_reception');
  });

  it('Copie marché est obligatoire', () => {
    const piece = config.pieces.find((p) => p.code === 'copie_marche');
    expect(piece?.obligatoire).toBe(true);
  });

  it('Bordereau de livraison est optionnel', () => {
    const piece = config.pieces.find((p) => p.code === 'bordereau_livraison');
    expect(piece?.obligatoire).toBe(false);
  });
});

// ===========================================================================
// Marché Travaux — Pièces spécifiques
// ===========================================================================

describe('MARCHE_TRAVAUX', () => {
  const config = resolveTypeDepense('sur_marche', 'travaux');
  const codes = config.pieces.map((p) => p.code);

  it('Contient décompte + attachements + PV réception', () => {
    expect(codes).toContain('decompte');
    expect(codes).toContain('attachements');
    expect(codes).toContain('pv_reception');
  });

  it('Caution bonne exécution est optionnelle', () => {
    const piece = config.pieces.find((p) => p.code === 'caution_bonne_execution');
    expect(piece).toBeDefined();
    expect(piece?.obligatoire).toBe(false);
  });

  it('Plan de récolement est optionnel', () => {
    const piece = config.pieces.find((p) => p.code === 'plan_recolement');
    expect(piece?.obligatoire).toBe(false);
  });
});

// ===========================================================================
// Marché Prestations Intellectuelles
// ===========================================================================

describe('MARCHE_PRESTATIONS_INTELLECTUELLES', () => {
  const config = resolveTypeDepense('sur_marche', 'prestations_intellectuelles');
  const codes = config.pieces.map((p) => p.code);

  it('Contient note honoraires + rapport étude + PV validation', () => {
    expect(codes).toContain('note_honoraires');
    expect(codes).toContain('rapport_etude');
    expect(codes).toContain('pv_validation_livrables');
  });

  it('Termes de référence est optionnel', () => {
    const piece = config.pieces.find((p) => p.code === 'termes_reference');
    expect(piece?.obligatoire).toBe(false);
  });
});

// ===========================================================================
// Hors Marché
// ===========================================================================

describe('HORS_MARCHE', () => {
  const config = resolveTypeDepense('hors_marche', null);
  const codes = config.pieces.map((p) => p.code);

  it('Contient facture + bon de commande + bon de livraison', () => {
    expect(codes).toContain('facture');
    expect(codes).toContain('bon_commande');
    expect(codes).toContain('bon_livraison');
  });

  it('PV de réception est optionnel (selon seuil)', () => {
    const piece = config.pieces.find((p) => p.code === 'pv_reception');
    expect(piece?.obligatoire).toBe(false);
  });

  it('Attestation service fait est optionnelle', () => {
    const piece = config.pieces.find((p) => p.code === 'attestation_service_fait');
    expect(piece?.obligatoire).toBe(false);
  });
});

// ===========================================================================
// Références RGCP
// ===========================================================================

describe('Références RGCP / CMP', () => {
  it('Toutes les pièces obligatoires des marchés ont une référence RGCP ou CMP', () => {
    const types = ['fourniture', 'services', 'travaux', 'prestations_intellectuelles'];
    for (const t of types) {
      const config = resolveTypeDepense('sur_marche', t);
      const obligatoires = config.pieces.filter((p) => p.obligatoire);
      for (const piece of obligatoires) {
        expect(piece.ref_rgcp, `${config.key} / ${piece.code}`).toBeTruthy();
      }
    }
  });
});

// ===========================================================================
// getPiecesObligatoires
// ===========================================================================

describe('getPiecesObligatoires', () => {
  it('Retourne uniquement les pièces obligatoires', () => {
    const pieces = getPiecesObligatoires('sur_marche', 'fourniture');
    expect(pieces.length).toBeGreaterThan(0);
    expect(pieces.every((p) => p.obligatoire)).toBe(true);
  });

  it("Hors marché a moins de pièces obligatoires qu'un marché travaux", () => {
    const horsMarche = getPiecesObligatoires(null, null);
    const travaux = getPiecesObligatoires('sur_marche', 'travaux');
    expect(horsMarche.length).toBeLessThan(travaux.length);
  });
});

// ===========================================================================
// getAllTypesDepense
// ===========================================================================

describe('getAllTypesDepense', () => {
  it('Retourne les 5 types de dépense', () => {
    const all = getAllTypesDepense();
    expect(all.length).toBe(5);
    const keys = all.map((c) => c.key);
    expect(keys).toContain('marche_fourniture');
    expect(keys).toContain('marche_services');
    expect(keys).toContain('marche_travaux');
    expect(keys).toContain('marche_prestations_intellectuelles');
    expect(keys).toContain('hors_marche');
  });

  it('Chaque type a un label, icône et couleur', () => {
    const all = getAllTypesDepense();
    for (const config of all) {
      expect(config.label).toBeTruthy();
      expect(config.icon).toBeTruthy();
      expect(config.couleur).toBeTruthy();
      expect(config.pieces.length).toBeGreaterThan(0);
    }
  });
});
