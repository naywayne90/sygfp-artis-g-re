import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formate un montant en FCFA
 */
export function formatCurrency(
  value: number | null | undefined,
  options?: { showSymbol?: boolean; decimals?: number }
): string {
  const { showSymbol = true, decimals = 0 } = options || {};

  if (value === null || value === undefined) {
    return showSymbol ? '0 FCFA' : '0';
  }

  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

  return showSymbol ? `${formatted} FCFA` : formatted;
}

/**
 * Parse un montant depuis une chaîne
 */
export function parseCurrency(value: string): number {
  if (!value) return 0;
  // Retirer les espaces, FCFA, et remplacer la virgule par un point
  const cleaned = value
    .replace(/\s/g, '')
    .replace(/FCFA/gi, '')
    .replace(/,/g, '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
