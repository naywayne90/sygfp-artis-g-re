/**
 * Tests — usePenalitesRetard (Pénalités de retard d'exécution)
 *
 * Couvre :
 *   - Calcul pénalités selon Code Marchés Publics CI art. 145-147
 *   - Plafond 10% du montant TTC
 *   - Statuts sans_objet / dans_delai / en_retard / appliquee
 *   - Batch et stats
 */

import { describe, it, expect } from 'vitest';
import {
  computePenaliteRetard,
  computePenaliteStats,
  type PenaliteRetardInfo,
} from '@/hooks/usePenalitesRetard';

// ===========================================================================
// HELPERS
// ===========================================================================

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

// ===========================================================================
// computePenaliteRetard — Cas limites
// ===========================================================================

describe('computePenaliteRetard — Cas limites', () => {
  it('Retourne "sans_objet" si dureeExecution est null', () => {
    const info = computePenaliteRetard(10_000_000, null, daysAgo(10), daysAgo(5), 0);
    expect(info.statut).toBe('sans_objet');
    expect(info.montantPenalite).toBe(0);
    expect(info.dateFinPrevue).toBeNull();
    expect(info.label).toBe('N/A');
  });

  it('Retourne "sans_objet" si dateDebutExecution est null', () => {
    const info = computePenaliteRetard(10_000_000, 30, null, null, 0);
    expect(info.statut).toBe('sans_objet');
    expect(info.joursRetard).toBe(0);
  });
});

// ===========================================================================
// computePenaliteRetard — Dans les délais
// ===========================================================================

describe('computePenaliteRetard — Dans les délais', () => {
  it('Pas de pénalité si service fait avant échéance', () => {
    const info = computePenaliteRetard(
      10_000_000,
      30,
      daysAgo(20),
      daysAgo(5), // 15 jours d'exécution < 30j contractuels
      0
    );
    expect(info.statut).toBe('dans_delai');
    expect(info.joursRetard).toBe(0);
    expect(info.montantPenalite).toBe(0);
  });

  it('Pourcentage délai calculé correctement', () => {
    const info = computePenaliteRetard(10_000_000, 30, daysAgo(15), null, 0);
    expect(info.pourcentageDelai).toBeGreaterThanOrEqual(45);
    expect(info.pourcentageDelai).toBeLessThanOrEqual(55);
  });

  it('Couleur verte si pourcentage < 80%', () => {
    const info = computePenaliteRetard(10_000_000, 30, daysAgo(10), null, 0);
    expect(info.couleur).toContain('green');
  });

  it('Couleur jaune si pourcentage >= 80% mais sans retard', () => {
    const info = computePenaliteRetard(10_000_000, 30, daysAgo(25), null, 0);
    expect(info.statut).toBe('dans_delai');
    expect(info.couleur).toContain('yellow');
  });
});

// ===========================================================================
// computePenaliteRetard — En retard
// ===========================================================================

describe('computePenaliteRetard — En retard', () => {
  it('Calcule les pénalités quand le service fait dépasse le délai', () => {
    // Montant 10M, durée 30j, début il y a 40j, service fait il y a 5j
    // → fin prévue il y a 10j, service fait 5 jours plus tard = 5 jours de retard
    const info = computePenaliteRetard(10_000_000, 30, daysAgo(40), daysAgo(5), 0);
    expect(info.statut).toBe('en_retard');
    expect(info.joursRetard).toBeGreaterThanOrEqual(4);
    expect(info.joursRetard).toBeLessThanOrEqual(6);
    expect(info.montantPenalite).toBeGreaterThan(0);
  });

  it('Formule pénalité = montant × taux × joursRetard', () => {
    // 10M × 0.1% × 5 jours = 50 000 FCFA
    const info = computePenaliteRetard(
      10_000_000,
      30,
      daysAgo(40),
      daysAgo(5),
      0,
      0.1 // taux journalier par défaut
    );
    const joursRetard = info.joursRetard;
    const attendu = Math.round(10_000_000 * (0.1 / 100) * joursRetard);
    expect(info.montantPenalite).toBe(Math.min(attendu, info.plafond));
  });

  it('Label contient le nombre de jours de retard', () => {
    const info = computePenaliteRetard(10_000_000, 30, daysAgo(40), daysAgo(5), 0);
    expect(info.label).toMatch(/^\+\d+j$/);
  });

  it('Couleur ambre en retard', () => {
    const info = computePenaliteRetard(10_000_000, 30, daysAgo(40), daysAgo(5), 0);
    expect(info.couleur).toContain('amber');
  });
});

// ===========================================================================
// computePenaliteRetard — Plafond 10%
// ===========================================================================

describe('computePenaliteRetard — Plafond 10%', () => {
  it('Plafond = 10% du montant', () => {
    const info = computePenaliteRetard(10_000_000, 30, daysAgo(200), daysAgo(10), 0);
    expect(info.plafond).toBe(1_000_000);
  });

  it('Pénalité plafonnée à 10% même avec un gros retard', () => {
    // Montant 10M, durée 10j, début il y a 365j → ~355 jours de retard
    // Pénalité brute = 10M × 0.1% × 355 = 35.5M (> plafond)
    const info = computePenaliteRetard(10_000_000, 10, daysAgo(365), daysAgo(1), 0);
    expect(info.plafondAtteint).toBe(true);
    expect(info.montantPenalite).toBe(1_000_000);
  });

  it('Plafond NON atteint si retard limité', () => {
    const info = computePenaliteRetard(10_000_000, 30, daysAgo(35), daysAgo(1), 0);
    expect(info.plafondAtteint).toBe(false);
    expect(info.montantPenalite).toBeLessThan(info.plafond);
  });
});

// ===========================================================================
// computePenaliteRetard — Pénalité déjà appliquée
// ===========================================================================

describe('computePenaliteRetard — Déjà appliquée', () => {
  it('Statut "appliquee" si penaliteEnregistree > 0', () => {
    const info = computePenaliteRetard(
      10_000_000,
      30,
      daysAgo(40),
      daysAgo(5),
      500_000 // déjà enregistrée
    );
    expect(info.statut).toBe('appliquee');
    expect(info.couleur).toContain('purple');
    expect(info.penaliteEnregistree).toBe(500_000);
  });

  it('Label pour pénalité enregistrée en millions', () => {
    const info = computePenaliteRetard(100_000_000, 30, daysAgo(40), daysAgo(5), 2_500_000);
    expect(info.label).toMatch(/2\.5M/);
  });

  it('Label pour pénalité enregistrée en milliers', () => {
    const info = computePenaliteRetard(10_000_000, 30, daysAgo(40), daysAgo(5), 450_000);
    expect(info.label).toMatch(/450K/);
  });
});

// ===========================================================================
// computePenaliteStats
// ===========================================================================

describe('computePenaliteStats', () => {
  it('Retourne tout à 0 pour une map vide', () => {
    const stats = computePenaliteStats(new Map());
    expect(stats.enRetard).toBe(0);
    expect(stats.totalPenalitesAuto).toBe(0);
    expect(stats.totalPenalitesEnregistrees).toBe(0);
    expect(stats.penalitesNonAppliquees).toBe(0);
  });

  it('Compte seulement les dossiers en_retard ou appliquee', () => {
    const map = new Map<string, PenaliteRetardInfo>();
    map.set('a', computePenaliteRetard(10_000_000, 30, daysAgo(10), null, 0)); // dans_delai
    map.set('b', computePenaliteRetard(10_000_000, 30, daysAgo(40), daysAgo(5), 0)); // en_retard
    map.set('c', computePenaliteRetard(10_000_000, 30, daysAgo(40), daysAgo(5), 500_000)); // appliquee
    map.set('d', computePenaliteRetard(10_000_000, null, null, null, 0)); // sans_objet

    const stats = computePenaliteStats(map);
    expect(stats.enRetard).toBe(2);
    expect(stats.totalPenalitesAuto).toBeGreaterThan(0);
    expect(stats.totalPenalitesEnregistrees).toBe(500_000);
  });

  it('penalitesNonAppliquees = totalAuto - totalEnregistrees (min 0)', () => {
    const map = new Map<string, PenaliteRetardInfo>();
    map.set('b', computePenaliteRetard(10_000_000, 30, daysAgo(40), daysAgo(5), 0));
    const stats = computePenaliteStats(map);
    expect(stats.penalitesNonAppliquees).toBe(stats.totalPenalitesAuto);
  });

  it('penalitesNonAppliquees clampée à 0 si enregistré > auto', () => {
    const map = new Map<string, PenaliteRetardInfo>();
    // Pénalité enregistrée > auto calculé
    map.set('a', computePenaliteRetard(10_000_000, 30, daysAgo(40), daysAgo(5), 10_000_000));
    const stats = computePenaliteStats(map);
    expect(stats.penalitesNonAppliquees).toBe(0);
  });
});
