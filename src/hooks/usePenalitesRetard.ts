/**
 * Hook usePenalitesRetard — Pénalités de retard d'exécution
 *
 * Code des Marchés Publics de Côte d'Ivoire (art. 145-147) :
 *   - Pénalité journalière = montant TTC × taux journalier (défaut 1/1000 = 0,1%)
 *   - Courent à partir du lendemain de l'expiration du délai d'exécution
 *   - Plafond : 10% du montant TTC du marché
 *   - Peuvent être déduites d'office lors de la liquidation
 *
 * Calcul automatique :
 *   dateFinPrevue = dateDebutExecution + dureeExecution (jours)
 *   Si service_fait_date > dateFinPrevue → retard = écart en jours
 *   Pénalité = montant × tauxJournalier × joursRetard (plafonné à 10%)
 */

import { useMemo } from 'react';

// Taux par défaut (1/1000 par jour = 0,1%)
const TAUX_JOURNALIER_DEFAUT = 0.1;
// Plafond des pénalités : 10% du montant du marché (art. 147)
const PLAFOND_PENALITES_PCT = 10;

export type PenaliteStatut = 'sans_objet' | 'dans_delai' | 'en_retard' | 'appliquee';

export interface PenaliteRetardInfo {
  /** Statut de la pénalité */
  statut: PenaliteStatut;
  /** Durée d'exécution contractuelle en jours */
  dureeExecutionJours: number | null;
  /** Date de début d'exécution (date engagement ou signature marché) */
  dateDebutExecution: string | null;
  /** Date de fin prévue contractuellement */
  dateFinPrevue: string | null;
  /** Date effective du service fait */
  dateServiceFait: string | null;
  /** Nombre de jours de retard (0 si dans les délais) */
  joursRetard: number;
  /** Taux journalier appliqué (ex: 0.1%) */
  tauxJournalier: number;
  /** Montant de base (montant TTC du marché/engagement) */
  montantBase: number;
  /** Pénalité journalière en FCFA */
  penaliteJournaliere: number;
  /** Montant total des pénalités calculées */
  montantPenalite: number;
  /** Plafond des pénalités (10% du montant) */
  plafond: number;
  /** True si le plafond est atteint */
  plafondAtteint: boolean;
  /** Pourcentage du délai consommé (0-100+) */
  pourcentageDelai: number;
  /** Pénalité déjà enregistrée en base (saisie manuelle dans CalculsFiscaux) */
  penaliteEnregistree: number;
  /** Label court pour affichage */
  label: string;
  /** Couleur CSS */
  couleur: string;
  /** Couleur texte CSS */
  couleurTexte: string;
}

export interface PenaliteRetardStats {
  /** Nombre de liquidations avec retard détecté */
  enRetard: number;
  /** Montant total des pénalités calculées automatiquement */
  totalPenalitesAuto: number;
  /** Montant total des pénalités déjà enregistrées */
  totalPenalitesEnregistrees: number;
  /** Différence (pénalités non encore appliquées) */
  penalitesNonAppliquees: number;
}

/**
 * Calcule les pénalités de retard pour une liquidation
 */
export function computePenaliteRetard(
  montant: number,
  dureeExecution: number | null,
  dateDebutExecution: string | null,
  serviceFaitDate: string | null,
  penaliteEnregistree: number,
  tauxJournalier: number = TAUX_JOURNALIER_DEFAUT
): PenaliteRetardInfo {
  const plafond = Math.round((montant * PLAFOND_PENALITES_PCT) / 100);
  const penaliteJournaliere = Math.round(montant * (tauxJournalier / 100));

  // Pas de durée d'exécution → on ne peut pas calculer
  if (!dureeExecution || !dateDebutExecution) {
    return {
      statut: 'sans_objet',
      dureeExecutionJours: dureeExecution,
      dateDebutExecution,
      dateFinPrevue: null,
      dateServiceFait: serviceFaitDate,
      joursRetard: 0,
      tauxJournalier,
      montantBase: montant,
      penaliteJournaliere,
      montantPenalite: 0,
      plafond,
      plafondAtteint: false,
      pourcentageDelai: 0,
      penaliteEnregistree,
      label: 'N/A',
      couleur: 'bg-muted',
      couleurTexte: 'text-muted-foreground',
    };
  }

  // Date de fin prévue
  const debut = new Date(dateDebutExecution);
  const finPrevue = new Date(debut);
  finPrevue.setDate(finPrevue.getDate() + dureeExecution);
  const dateFinPrevue = finPrevue.toISOString();

  // Date de référence : service fait si disponible, sinon aujourd'hui
  const dateRef = serviceFaitDate ? new Date(serviceFaitDate) : new Date();
  const diffMs = dateRef.getTime() - debut.getTime();
  const joursEcoules = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const pourcentageDelai =
    dureeExecution > 0 ? Math.round((joursEcoules / dureeExecution) * 100) : 0;

  // Retard
  const diffRetardMs = dateRef.getTime() - finPrevue.getTime();
  const joursRetard = Math.max(0, Math.floor(diffRetardMs / (1000 * 60 * 60 * 24)));

  // Montant pénalité (plafonné)
  const penaliteBrute = Math.round(montant * (tauxJournalier / 100) * joursRetard);
  const montantPenalite = Math.min(penaliteBrute, plafond);
  const plafondAtteint = penaliteBrute >= plafond;

  // Statut et couleurs
  let statut: PenaliteStatut;
  let label: string;
  let couleur: string;
  let couleurTexte: string;

  if (penaliteEnregistree > 0) {
    statut = 'appliquee';
    label = formatPenaliteLabel(penaliteEnregistree);
    couleur = 'bg-purple-100 border-purple-300';
    couleurTexte = 'text-purple-700';
  } else if (joursRetard > 0) {
    statut = 'en_retard';
    label = `+${joursRetard}j`;
    couleur = 'bg-amber-100 border-amber-300';
    couleurTexte = 'text-amber-700 font-semibold';
  } else if (pourcentageDelai >= 80) {
    statut = 'dans_delai';
    label = `${joursEcoules}/${dureeExecution}j`;
    couleur = 'bg-yellow-50 border-yellow-200';
    couleurTexte = 'text-yellow-700';
  } else {
    statut = 'dans_delai';
    label = `${joursEcoules}/${dureeExecution}j`;
    couleur = 'bg-green-50 border-green-200';
    couleurTexte = 'text-green-700';
  }

  return {
    statut,
    dureeExecutionJours: dureeExecution,
    dateDebutExecution,
    dateFinPrevue,
    dateServiceFait: serviceFaitDate,
    joursRetard,
    tauxJournalier,
    montantBase: montant,
    penaliteJournaliere,
    montantPenalite,
    plafond,
    plafondAtteint,
    pourcentageDelai,
    penaliteEnregistree,
    label,
    couleur,
    couleurTexte,
  };
}

function formatPenaliteLabel(montant: number): string {
  if (montant >= 1_000_000) return `${(montant / 1_000_000).toFixed(1)}M`;
  if (montant >= 1_000) return `${Math.round(montant / 1_000)}K`;
  return `${montant}`;
}

/**
 * Hook pour calculer les pénalités d'une seule liquidation
 */
export function usePenaliteRetard(
  montant: number,
  dureeExecution: number | null,
  dateDebutExecution: string | null,
  serviceFaitDate: string | null,
  penaliteEnregistree: number,
  tauxJournalier?: number
): PenaliteRetardInfo {
  return useMemo(
    () =>
      computePenaliteRetard(
        montant,
        dureeExecution,
        dateDebutExecution,
        serviceFaitDate,
        penaliteEnregistree,
        tauxJournalier
      ),
    [
      montant,
      dureeExecution,
      dateDebutExecution,
      serviceFaitDate,
      penaliteEnregistree,
      tauxJournalier,
    ]
  );
}

/**
 * Hook batch pour calculer les pénalités de plusieurs liquidations
 */
export function usePenaliteRetardBatch(
  liquidations: Array<{
    id: string;
    montant: number;
    duree_execution: number | null;
    date_debut_execution: string | null;
    service_fait_date: string | null;
    penalites_montant: number | null;
    penalites_taux_journalier: number | null;
  }>
): Map<string, PenaliteRetardInfo> {
  return useMemo(() => {
    const map = new Map<string, PenaliteRetardInfo>();
    for (const liq of liquidations) {
      map.set(
        liq.id,
        computePenaliteRetard(
          liq.montant,
          liq.duree_execution,
          liq.date_debut_execution,
          liq.service_fait_date,
          liq.penalites_montant ?? 0,
          liq.penalites_taux_journalier ?? TAUX_JOURNALIER_DEFAUT
        )
      );
    }
    return map;
  }, [liquidations]);
}

/**
 * Statistiques pénalités pour un ensemble de liquidations
 */
export function computePenaliteStats(penMap: Map<string, PenaliteRetardInfo>): PenaliteRetardStats {
  let enRetard = 0;
  let totalPenalitesAuto = 0;
  let totalPenalitesEnregistrees = 0;

  penMap.forEach((info) => {
    if (info.statut === 'en_retard' || info.statut === 'appliquee') {
      enRetard++;
      totalPenalitesAuto += info.montantPenalite;
      totalPenalitesEnregistrees += info.penaliteEnregistree;
    }
  });

  return {
    enRetard,
    totalPenalitesAuto,
    totalPenalitesEnregistrees,
    penalitesNonAppliquees: Math.max(0, totalPenalitesAuto - totalPenalitesEnregistrees),
  };
}
