/**
 * Tests — useDGP (Délai Global de Paiement)
 *
 * Couvre :
 *   - Seuils DGP selon montant (art. 132/139)
 *   - Calcul intérêts moratoires (art. 142, taux 4.5% annuel)
 *   - Projections +30/+60/+90j
 *   - Statuts dans_delai / alerte / hors_delai
 *   - Dossiers terminés (validé / validé_dg)
 *   - Stats batch et formatage
 */

import { describe, it, expect } from 'vitest';
import {
  computeDGP,
  getDelaiDGP,
  computeDGPStats,
  formatDelaiDGP,
  type DGPInfo,
} from '@/hooks/useDGP';

// ===========================================================================
// HELPERS
// ===========================================================================

/** Retourne une date ISO à N jours dans le passé */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

// ===========================================================================
// getDelaiDGP — Seuils règlementaires
// ===========================================================================

describe('getDelaiDGP — Seuils art. 132/139 CMP CI', () => {
  it('< 30M FCFA → 30 jours', () => {
    expect(getDelaiDGP(0)).toBe(30);
    expect(getDelaiDGP(1_000_000)).toBe(30);
    expect(getDelaiDGP(29_999_999)).toBe(30);
  });

  it('30M ≤ montant ≤ 100M → 60 jours', () => {
    expect(getDelaiDGP(30_000_000)).toBe(60);
    expect(getDelaiDGP(50_000_000)).toBe(60);
    expect(getDelaiDGP(100_000_000)).toBe(60);
  });

  it('> 100M → 90 jours', () => {
    expect(getDelaiDGP(100_000_001)).toBe(90);
    expect(getDelaiDGP(500_000_000)).toBe(90);
    expect(getDelaiDGP(1_000_000_000)).toBe(90);
  });
});

// ===========================================================================
// computeDGP — Cas limites
// ===========================================================================

describe('computeDGP — Cas limites', () => {
  it('Retourne une valeur par défaut si dateDebut est null', () => {
    const info = computeDGP(5_000_000, null, 'soumis');
    expect(info.delaiMaxJours).toBe(30);
    expect(info.joursEcoules).toBe(0);
    expect(info.joursRestants).toBe(30);
    expect(info.statut).toBe('dans_delai');
    expect(info.interetsMoratoires).toBe(0);
    expect(info.dateDebut).toBeNull();
    expect(info.dateLimite).toBeNull();
  });

  it('Calcule correctement joursEcoules et joursRestants', () => {
    const info = computeDGP(5_000_000, daysAgo(10), 'soumis');
    expect(info.delaiMaxJours).toBe(30);
    expect(info.joursEcoules).toBeGreaterThanOrEqual(9);
    expect(info.joursEcoules).toBeLessThanOrEqual(10);
    expect(info.joursRestants).toBeGreaterThanOrEqual(20);
    expect(info.joursRestants).toBeLessThanOrEqual(21);
  });

  it('Génère une dateLimite cohérente', () => {
    const info = computeDGP(5_000_000, daysAgo(5), 'soumis');
    expect(info.dateLimite).not.toBeNull();
    const limite = new Date(info.dateLimite!);
    const debut = new Date(info.dateDebut!);
    const diffJ = Math.round((limite.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffJ).toBe(30);
  });
});

// ===========================================================================
// computeDGP — Statuts
// ===========================================================================

describe('computeDGP — Statuts', () => {
  it('Dans le délai (pourcentage < 70%)', () => {
    const info = computeDGP(5_000_000, daysAgo(5), 'soumis');
    // 5/30 ≈ 17%
    expect(info.statut).toBe('dans_delai');
    expect(info.label).toMatch(/^J-\d+$/);
    expect(info.couleur).toContain('green');
  });

  it('En alerte (pourcentage >= 70% et <= 100%)', () => {
    // 22/30 ≈ 73%
    const info = computeDGP(5_000_000, daysAgo(22), 'soumis');
    expect(info.statut).toBe('alerte');
    expect(info.label).toMatch(/^J-\d+$/);
    expect(info.couleur).toContain('orange');
  });

  it('Hors délai (joursRestants < 0)', () => {
    // 40/30 > 100%
    const info = computeDGP(5_000_000, daysAgo(40), 'soumis');
    expect(info.statut).toBe('hors_delai');
    expect(info.label).toMatch(/^J\+\d+$/);
    expect(info.couleur).toContain('red');
    expect(info.interetsMoratoires).toBeGreaterThan(0);
  });

  it('Dossier terminé dans les délais → statut dans_delai avec label en jours', () => {
    const info = computeDGP(5_000_000, daysAgo(15), 'valide');
    expect(info.estTermine).toBe(true);
    expect(info.statut).toBe('dans_delai');
    expect(info.label).toMatch(/^\d+j$/);
    expect(info.interetsMoratoires).toBe(0);
  });

  it('Dossier terminé hors délai → statut hors_delai mais pas de nouveaux intérêts', () => {
    const info = computeDGP(5_000_000, daysAgo(50), 'validé');
    expect(info.estTermine).toBe(true);
    expect(info.statut).toBe('hors_delai');
    // Les intérêts moratoires ne s'accumulent plus sur dossier terminé
    expect(info.interetsMoratoires).toBe(0);
  });
});

// ===========================================================================
// computeDGP — Intérêts moratoires (art. 142)
// ===========================================================================

describe('computeDGP — Intérêts moratoires', () => {
  it("Aucun intérêt tant que le DGP n'est pas dépassé", () => {
    const info = computeDGP(10_000_000, daysAgo(25), 'soumis');
    expect(info.interetsMoratoires).toBe(0);
    expect(info.interetsDetail.joursRetard).toBe(0);
    expect(info.interetsDetail.dateDebutInterets).toBeNull();
  });

  it("Calcule les intérêts à partir du lendemain de l'expiration", () => {
    // Montant 10M, soumis il y a 40 jours, DGP 30j → 10 jours de retard
    const info = computeDGP(10_000_000, daysAgo(40), 'soumis');
    expect(info.interetsMoratoires).toBeGreaterThan(0);
    expect(info.interetsDetail.joursRetard).toBeGreaterThanOrEqual(9);
    expect(info.interetsDetail.joursRetard).toBeLessThanOrEqual(10);
    expect(info.interetsDetail.dateDebutInterets).not.toBeNull();
  });

  it('Formule intérêts = montant × 4.5% × (joursRetard / 365)', () => {
    const montant = 10_000_000;
    const info = computeDGP(montant, daysAgo(40), 'soumis'); // ~10 jours retard
    const joursRetard = info.interetsDetail.joursRetard;
    const attendu = Math.round(montant * 0.045 * (joursRetard / 365));
    expect(info.interetsMoratoires).toBe(attendu);
  });

  it('Taux annuel exposé = 4.5% (taux légal 3.5% + majoration 1%)', () => {
    const info = computeDGP(5_000_000, daysAgo(5), 'soumis');
    expect(info.interetsDetail.tauxAnnuel).toBeCloseTo(4.5, 5);
    expect(info.interetsDetail.tauxLegal).toBe(3.5);
    expect(info.interetsDetail.majoration).toBe(1);
  });

  it('Projections +30/+60/+90j croissantes', () => {
    const info = computeDGP(10_000_000, daysAgo(5), 'soumis');
    expect(info.interetsDetail.projectionPlus30j).toBeGreaterThan(0);
    expect(info.interetsDetail.projectionPlus60j).toBeGreaterThan(
      info.interetsDetail.projectionPlus30j
    );
    expect(info.interetsDetail.projectionPlus90j).toBeGreaterThan(
      info.interetsDetail.projectionPlus60j
    );
  });

  it('Montant journalier = montant × 4.5% / 365', () => {
    const info = computeDGP(10_000_000, daysAgo(5), 'soumis');
    const attendu = Math.round((10_000_000 * 0.045) / 365);
    expect(info.interetsDetail.montantJournalier).toBe(attendu);
  });
});

// ===========================================================================
// computeDGPStats — Statistiques batch
// ===========================================================================

describe('computeDGPStats', () => {
  it('Retourne tout à 0 pour une map vide', () => {
    const stats = computeDGPStats(new Map());
    expect(stats.total).toBe(0);
    expect(stats.dansDelai).toBe(0);
    expect(stats.enAlerte).toBe(0);
    expect(stats.horsDelai).toBe(0);
    expect(stats.delaiMoyen).toBe(0);
    expect(stats.totalInteretsMoratoires).toBe(0);
  });

  it('Aggregate correctement les 3 statuts', () => {
    const map = new Map<string, DGPInfo>();
    map.set('a', computeDGP(5_000_000, daysAgo(5), 'soumis')); // dans_delai
    map.set('b', computeDGP(5_000_000, daysAgo(25), 'soumis')); // alerte
    map.set('c', computeDGP(5_000_000, daysAgo(50), 'soumis')); // hors_delai
    const stats = computeDGPStats(map);
    expect(stats.total).toBe(3);
    expect(stats.dansDelai).toBe(1);
    expect(stats.enAlerte).toBe(1);
    expect(stats.horsDelai).toBe(1);
    expect(stats.totalInteretsMoratoires).toBeGreaterThan(0);
    expect(stats.expositionJournaliere).toBeGreaterThan(0);
  });

  it('Ignore les dossiers sans date de début', () => {
    const map = new Map<string, DGPInfo>();
    map.set('a', computeDGP(5_000_000, null, 'soumis'));
    map.set('b', computeDGP(5_000_000, daysAgo(5), 'soumis'));
    const stats = computeDGPStats(map);
    expect(stats.total).toBe(1);
  });

  it("N'accumule pas l'exposition pour les dossiers terminés", () => {
    const map = new Map<string, DGPInfo>();
    map.set('a', computeDGP(5_000_000, daysAgo(50), 'validé_dg')); // hors délai mais terminé
    const stats = computeDGPStats(map);
    expect(stats.horsDelai).toBe(1);
    expect(stats.expositionJournaliere).toBe(0);
    expect(stats.projectionPlus30j).toBe(0);
  });
});

// ===========================================================================
// formatDelaiDGP
// ===========================================================================

describe('formatDelaiDGP', () => {
  it('Formate selon les seuils', () => {
    expect(formatDelaiDGP(5_000_000)).toBe('30j (<30M)');
    expect(formatDelaiDGP(50_000_000)).toBe('60j (30-100M)');
    expect(formatDelaiDGP(200_000_000)).toBe('90j (>100M)');
  });
});
