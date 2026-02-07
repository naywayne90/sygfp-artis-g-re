/**
 * Types pour le module Feuille de Route / Plans de Travail
 * Tables Supabase: plans_travail, taches
 */

export interface PlanTravail {
  id: string;
  code: string;
  libelle: string;
  description: string | null;
  exercice_id: string;
  direction_id: string;
  statut: 'brouillon' | 'valide' | 'en_cours' | 'cloture';
  date_debut: string | null;
  date_fin: string | null;
  budget_alloue: number;
  budget_consomme: number;
  responsable_id: string | null;
  validateur_id: string | null;
  date_validation: string | null;
  est_actif: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  // Jointures
  direction?: { id: string; code: string; nom: string };
  responsable?: { id: string; nom: string; prenom: string };
}

export type PlanTravailStatut = PlanTravail['statut'];

export interface PlanTravailInput {
  code: string;
  libelle: string;
  description?: string | null;
  exercice_id: string;
  direction_id: string;
  statut?: PlanTravailStatut;
  date_debut?: string | null;
  date_fin?: string | null;
  budget_alloue?: number;
  responsable_id?: string | null;
}

export interface Tache {
  id: string;
  code: string;
  libelle: string;
  description: string | null;
  sous_activite_id: string;
  date_debut: string | null;
  date_fin: string | null;
  date_fin_reelle: string | null;
  duree_prevue: number | null;
  raci_responsable: string | null;
  raci_accountable: string | null;
  raci_consulted: string[] | null;
  raci_informed: string[] | null;
  responsable_id: string | null;
  statut: TacheStatut;
  priorite: TachePriorite;
  avancement: number;
  budget_line_id: string | null;
  budget_prevu: number;
  livrables: string[] | null;
  exercice: number;
  est_active: boolean;
  created_at: string;
  updated_at: string;
  // Jointures
  responsable?: { id: string; nom: string; prenom: string };
  sous_activite?: { id: string; code: string; libelle: string };
}

export type TacheStatut = 'planifie' | 'en_cours' | 'termine' | 'en_retard' | 'suspendu' | 'annule';
export type TachePriorite = 'basse' | 'normale' | 'haute' | 'critique';

export interface TacheInput {
  code: string;
  libelle: string;
  description?: string | null;
  sous_activite_id: string;
  date_debut?: string | null;
  date_fin?: string | null;
  duree_prevue?: number | null;
  raci_responsable?: string | null;
  raci_accountable?: string | null;
  raci_consulted?: string[] | null;
  raci_informed?: string[] | null;
  responsable_id?: string | null;
  statut?: TacheStatut;
  priorite?: TachePriorite;
  avancement?: number;
  budget_line_id?: string | null;
  budget_prevu?: number;
  livrables?: string[] | null;
  exercice: number;
}

export interface RoadmapStats {
  totalPlans: number;
  plansEnCours: number;
  totalTaches: number;
  tachesTerminees: number;
  tachesEnRetard: number;
  avancementGlobal: number;
  budgetTotal: number;
  budgetConsomme: number;
}

export interface DirectionRoadmapStats {
  direction_id: string;
  direction_code: string;
  direction_nom: string;
  stats: RoadmapStats;
}
