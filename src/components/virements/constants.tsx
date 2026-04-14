/**
 * Constantes partagées du module Virements & Ajustements.
 *
 * Extrait le 2026-04-08 de `src/pages/planification/Virements.tsx` (1825 lignes)
 * dans le cadre du découpage en sous-composants — voir `docs/modules/MODULE_BUDGET.md`.
 */

import { Clock, CheckCircle, Play, XCircle, type LucideIcon } from 'lucide-react';
import type { ExportColumn } from '@/lib/export/export-service';

/**
 * Formate un montant en FCFA (fr-FR).
 * Ne jamais utiliser un formateur local ailleurs — voir CLAUDE.md §4.
 */
export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';

export interface StatusConfig {
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
}

/**
 * Mapping statut → configuration UI (label + icône + couleurs).
 *
 * Workflow 2 niveaux CB → DG (2026-04-08) :
 *   en_attente → approuve (CB) → execute (DG)
 *             ↘ rejete                ↘ rejete
 *
 * La CHECK constraint DB autorise exactement ces 4 valeurs.
 */
export const STATUS_CONFIG: Record<string, StatusConfig> = {
  en_attente: {
    label: 'En attente CB',
    icon: Clock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    variant: 'outline',
  },
  approuve: {
    label: 'Approuvé CB',
    icon: CheckCircle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    variant: 'default',
  },
  execute: {
    label: 'Exécuté DG',
    icon: Play,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    variant: 'default',
  },
  rejete: {
    label: 'Rejeté',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    variant: 'destructive',
  },
};

/**
 * Colonnes de l'export (CSV / Excel / PDF).
 * Utilise STATUS_CONFIG pour traduire les statuts machine → label humain.
 */
export const EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'code', label: 'Code', type: 'text' },
  { key: 'type_transfer', label: 'Type', type: 'text' },
  {
    key: 'status',
    label: 'Statut',
    type: 'text',
    format: (v) => STATUS_CONFIG[String(v)]?.label || String(v),
  },
  { key: 'from_line.code', label: 'Ligne source', type: 'text' },
  { key: 'to_line.code', label: 'Ligne destination', type: 'text' },
  { key: 'amount', label: 'Montant (FCFA)', type: 'currency' },
  { key: 'motif', label: 'Justification', type: 'text' },
  { key: 'requested_at', label: 'Date de demande', type: 'date' },
  { key: 'requested_by_profile.full_name', label: 'Demandeur', type: 'text' },
  { key: 'approved_by_profile.full_name', label: 'Validateur', type: 'text' },
  { key: 'rejection_reason', label: 'Motif de rejet', type: 'text' },
];
