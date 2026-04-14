/**
 * Hook useDGP — Délai Global de Paiement (DGP)
 *
 * Basé sur le Code des Marchés Publics de Côte d'Ivoire (art. 132/139) :
 *   - Montant < 30 000 000 FCFA  → DGP = 30 jours
 *   - 30 000 000 ≤ montant ≤ 100 000 000 FCFA → DGP = 60 jours
 *   - Montant > 100 000 000 FCFA → DGP = 90 jours
 *
 * Intérêts moratoires (art. 142) :
 *   Taux = taux légal + 1 point (ex: 3,5% + 1% = 4,5%)
 *   Courent à partir du jour suivant l'expiration du DGP
 */

import { useMemo } from 'react';

// Seuils DGP selon le Code des Marchés Publics CI (art. 132/139)
const DGP_SEUIL_30J = 30_000_000; // < 30M → 30 jours
const DGP_SEUIL_60J = 100_000_000; // 30M-100M → 60 jours
// > 100M → 90 jours

// Taux légal CI + 1 point pour intérêts moratoires (art. 142)
const TAUX_LEGAL = 3.5;
const MAJORATION = 1;
const TAUX_MORATOIRE = (TAUX_LEGAL + MAJORATION) / 100; // 4.5%

export type DGPStatut = 'dans_delai' | 'alerte' | 'hors_delai';

/** Détail du calcul des intérêts moratoires (art. 142) */
export interface InteretsMoratoiresDetail {
  /** Montant des intérêts moratoires en FCFA */
  montant: number;
  /** Montant journalier des intérêts (montant × taux / 365) */
  montantJournalier: number;
  /** Nombre de jours de retard */
  joursRetard: number;
  /** Date de début des intérêts (lendemain de l'expiration du DGP) */
  dateDebutInterets: string | null;
  /** Taux annuel appliqué (ex: 4.5%) */
  tauxAnnuel: number;
  /** Taux légal de base (ex: 3.5%) */
  tauxLegal: number;
  /** Majoration appliquée (ex: 1%) */
  majoration: number;
  /** Montant de base (principal) sur lequel les intérêts sont calculés */
  montantBase: number;
  /** Projection : intérêts si retard atteint 30j supplémentaires */
  projectionPlus30j: number;
  /** Projection : intérêts si retard atteint 60j supplémentaires */
  projectionPlus60j: number;
  /** Projection : intérêts si retard atteint 90j supplémentaires */
  projectionPlus90j: number;
}

export interface DGPInfo {
  /** Délai maximum autorisé en jours */
  delaiMaxJours: number;
  /** Nombre de jours écoulés depuis la soumission */
  joursEcoules: number;
  /** Nombre de jours restants (négatif si dépassé) */
  joursRestants: number;
  /** Pourcentage de consommation du délai (0-100+) */
  pourcentage: number;
  /** Statut : dans_delai (<70%), alerte (70-100%), hors_delai (>100%) */
  statut: DGPStatut;
  /** Label court pour affichage ("J-5", "J+3", etc.) */
  label: string;
  /** Couleur CSS Tailwind pour le badge */
  couleur: string;
  /** Couleur CSS Tailwind pour le texte */
  couleurTexte: string;
  /** Intérêts moratoires en FCFA (0 si dans les délais) */
  interetsMoratoires: number;
  /** Détail complet du calcul des intérêts moratoires */
  interetsDetail: InteretsMoratoiresDetail;
  /** Date de début du DGP (date de soumission) */
  dateDebut: string | null;
  /** Date limite de paiement */
  dateLimite: string | null;
  /** Le dossier est-il déjà payé/validé ? */
  estTermine: boolean;
}

/**
 * Calcule le délai DGP autorisé selon le montant
 */
export function getDelaiDGP(montant: number): number {
  if (montant < DGP_SEUIL_30J) return 30;
  if (montant <= DGP_SEUIL_60J) return 60;
  return 90;
}

/**
 * Calcule les infos DGP pour une liquidation
 */
export function computeDGP(
  montant: number,
  dateDebut: string | null,
  statut: string | null
): DGPInfo {
  const delaiMaxJours = getDelaiDGP(montant);
  const estTermine = ['valide', 'validé', 'validé_dg'].includes(statut ?? '');

  const interetsDetailVide: InteretsMoratoiresDetail = {
    montant: 0,
    montantJournalier: Math.round((montant * TAUX_MORATOIRE) / 365),
    joursRetard: 0,
    dateDebutInterets: null,
    tauxAnnuel: TAUX_MORATOIRE * 100,
    tauxLegal: TAUX_LEGAL,
    majoration: MAJORATION,
    montantBase: montant,
    projectionPlus30j: Math.round(montant * TAUX_MORATOIRE * (30 / 365)),
    projectionPlus60j: Math.round(montant * TAUX_MORATOIRE * (60 / 365)),
    projectionPlus90j: Math.round(montant * TAUX_MORATOIRE * (90 / 365)),
  };

  // Si pas de date de soumission, on ne peut pas calculer
  if (!dateDebut) {
    return {
      delaiMaxJours,
      joursEcoules: 0,
      joursRestants: delaiMaxJours,
      pourcentage: 0,
      statut: 'dans_delai',
      label: `${delaiMaxJours}j`,
      couleur: 'bg-muted',
      couleurTexte: 'text-muted-foreground',
      interetsMoratoires: 0,
      interetsDetail: interetsDetailVide,
      dateDebut: null,
      dateLimite: null,
      estTermine,
    };
  }

  const debut = new Date(dateDebut);
  const maintenant = new Date();
  const diffMs = maintenant.getTime() - debut.getTime();
  const joursEcoules = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const joursRestants = delaiMaxJours - joursEcoules;
  const pourcentage = Math.round((joursEcoules / delaiMaxJours) * 100);

  // Date limite
  const dateLimiteObj = new Date(debut);
  dateLimiteObj.setDate(dateLimiteObj.getDate() + delaiMaxJours);
  const dateLimite = dateLimiteObj.toISOString();

  // Intérêts moratoires (art. 142) — courent à partir du lendemain de l'expiration du DGP
  const montantJournalier = Math.round((montant * TAUX_MORATOIRE) / 365);
  let interetsMoratoires = 0;
  let joursRetard = 0;
  let dateDebutInterets: string | null = null;

  if (joursRestants < 0) {
    joursRetard = Math.abs(joursRestants);
    // Date de début des intérêts = lendemain de la date limite
    const debutInteretsObj = new Date(dateLimiteObj);
    debutInteretsObj.setDate(debutInteretsObj.getDate() + 1);
    dateDebutInterets = debutInteretsObj.toISOString();

    if (!estTermine) {
      // Intérêts = montant × taux annuel × (jours retard / 365)
      interetsMoratoires = Math.round(montant * TAUX_MORATOIRE * (joursRetard / 365));
    }
  }

  const interetsDetail: InteretsMoratoiresDetail = {
    montant: interetsMoratoires,
    montantJournalier,
    joursRetard,
    dateDebutInterets,
    tauxAnnuel: TAUX_MORATOIRE * 100,
    tauxLegal: TAUX_LEGAL,
    majoration: MAJORATION,
    montantBase: montant,
    // Projections : intérêts si le retard augmente de +30/60/90j
    projectionPlus30j: Math.round(montant * TAUX_MORATOIRE * ((joursRetard + 30) / 365)),
    projectionPlus60j: Math.round(montant * TAUX_MORATOIRE * ((joursRetard + 60) / 365)),
    projectionPlus90j: Math.round(montant * TAUX_MORATOIRE * ((joursRetard + 90) / 365)),
  };

  // Statut et couleurs
  let statut_dgp: DGPStatut;
  let label: string;
  let couleur: string;
  let couleurTexte: string;

  if (estTermine) {
    // Dossier terminé — afficher le temps qu'il a fallu
    statut_dgp = joursEcoules <= delaiMaxJours ? 'dans_delai' : 'hors_delai';
    label = `${joursEcoules}j`;
    couleur = joursEcoules <= delaiMaxJours ? 'bg-green-100' : 'bg-red-100';
    couleurTexte = joursEcoules <= delaiMaxJours ? 'text-green-700' : 'text-red-700';
  } else if (joursRestants < 0) {
    // Hors délai
    statut_dgp = 'hors_delai';
    label = `J+${Math.abs(joursRestants)}`;
    couleur = 'bg-red-100 border-red-300';
    couleurTexte = 'text-red-700 font-semibold';
  } else if (pourcentage >= 70) {
    // Alerte — approche de la limite
    statut_dgp = 'alerte';
    label = `J-${joursRestants}`;
    couleur = 'bg-orange-100 border-orange-300';
    couleurTexte = 'text-orange-700 font-medium';
  } else {
    // Dans les délais
    statut_dgp = 'dans_delai';
    label = `J-${joursRestants}`;
    couleur = 'bg-green-50 border-green-200';
    couleurTexte = 'text-green-700';
  }

  return {
    delaiMaxJours,
    joursEcoules,
    joursRestants,
    pourcentage,
    statut: statut_dgp,
    label,
    couleur,
    couleurTexte,
    interetsMoratoires,
    interetsDetail,
    dateDebut,
    dateLimite,
    estTermine,
  };
}

/**
 * Hook pour calculer le DGP d'une seule liquidation
 */
export function useDGP(montant: number, dateDebut: string | null, statut: string | null): DGPInfo {
  return useMemo(() => computeDGP(montant, dateDebut, statut), [montant, dateDebut, statut]);
}

/**
 * Hook pour calculer le DGP de plusieurs liquidations (batch)
 * Retourne une Map<id, DGPInfo>
 */
export function useDGPBatch(
  liquidations: Array<{
    id: string;
    montant: number;
    submitted_at: string | null;
    created_at: string;
    statut: string | null;
  }>
): Map<string, DGPInfo> {
  return useMemo(() => {
    const map = new Map<string, DGPInfo>();
    for (const liq of liquidations) {
      // On utilise submitted_at (date de soumission) comme début du DGP
      // Si pas soumis, on utilise created_at comme fallback
      const dateDebut = liq.submitted_at ?? liq.created_at;
      map.set(liq.id, computeDGP(liq.montant, dateDebut, liq.statut));
    }
    return map;
  }, [liquidations]);
}

/**
 * Statistiques DGP pour un ensemble de liquidations
 */
export interface DGPStats {
  total: number;
  dansDelai: number;
  enAlerte: number;
  horsDelai: number;
  delaiMoyen: number;
  totalInteretsMoratoires: number;
  /** Montant journalier total des intérêts (exposition quotidienne) */
  expositionJournaliere: number;
  /** Projection des intérêts si rien n'est payé dans les 30 prochains jours */
  projectionPlus30j: number;
}

export function computeDGPStats(dgpMap: Map<string, DGPInfo>): DGPStats {
  let dansDelai = 0;
  let enAlerte = 0;
  let horsDelai = 0;
  let totalJours = 0;
  let totalInterets = 0;
  let expositionJournaliere = 0;
  let projectionPlus30j = 0;
  let count = 0;

  dgpMap.forEach((info) => {
    if (info.dateDebut) {
      count++;
      totalJours += info.joursEcoules;
      totalInterets += info.interetsMoratoires;

      // Accumule l'exposition quotidienne pour les dossiers hors délai non terminés
      if (info.statut === 'hors_delai' && !info.estTermine) {
        expositionJournaliere += info.interetsDetail.montantJournalier;
        projectionPlus30j += info.interetsDetail.projectionPlus30j;
      }

      switch (info.statut) {
        case 'dans_delai':
          dansDelai++;
          break;
        case 'alerte':
          enAlerte++;
          break;
        case 'hors_delai':
          horsDelai++;
          break;
      }
    }
  });

  return {
    total: count,
    dansDelai,
    enAlerte,
    horsDelai,
    delaiMoyen: count > 0 ? Math.round(totalJours / count) : 0,
    totalInteretsMoratoires: totalInterets,
    expositionJournaliere,
    projectionPlus30j,
  };
}

/**
 * Formate le délai DGP pour affichage
 */
export function formatDelaiDGP(montant: number): string {
  const delai = getDelaiDGP(montant);
  if (montant < DGP_SEUIL_30J) return `30j (<30M)`;
  if (montant <= DGP_SEUIL_60J) return `60j (30-100M)`;
  return `90j (>100M)`;
}
