import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * ARTI Reference Format: ARTI + ETAPE(1) + MM(2) + YY(2) + NNNN(4)
 * Example: ARTI001260001 = SEF, janvier 2026, premier document
 * 
 * Étapes:
 * 0 = SEF (Notes Sans Effet Financier)
 * 1 = AEF (Notes Avec Effet Financier)
 * 2 = Imputation
 * 3 = Expression Besoin
 * 4 = Passation Marché
 * 5 = Engagement
 * 6 = Liquidation
 * 7 = Ordonnancement
 * 8 = Règlement
 */

export type ARTIEtape = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const ETAPE_LABELS: Record<ARTIEtape, string> = {
  0: "SEF",
  1: "AEF",
  2: "Imputation",
  3: "Expression Besoin",
  4: "Passation Marché",
  5: "Engagement",
  6: "Liquidation",
  7: "Ordonnancement",
  8: "Règlement",
};

export interface ParsedARTIReference {
  etape: number;
  mois: number;
  annee: number;
  numero: number;
  isValid: boolean;
  etapeLabel?: string;
}

export const useARTIReference = () => {
  /**
   * Génère une nouvelle référence ARTI via la fonction SQL
   * Utilise un compteur atomique (safe concurrence)
   */
  const generateReference = useCallback(async (
    etape: ARTIEtape,
    date?: Date
  ): Promise<string> => {
    const { data, error } = await supabase.rpc("generate_arti_reference", {
      p_etape: etape,
      p_date: date?.toISOString() || new Date().toISOString(),
    });

    if (error) {
      console.error("Error generating ARTI reference:", error);
      throw new Error(`Erreur lors de la génération de la référence ARTI: ${error.message}`);
    }

    return data as string;
  }, []);

  /**
   * Parse une référence ARTI existante
   */
  const parseReference = useCallback(async (
    reference: string
  ): Promise<ParsedARTIReference> => {
    const { data, error } = await supabase.rpc("parse_arti_reference", {
      p_reference: reference,
    });

    if (error || !data || data.length === 0) {
      return {
        etape: 0,
        mois: 0,
        annee: 0,
        numero: 0,
        isValid: false,
      };
    }

    const parsed = data[0];
    return {
      etape: parsed.etape,
      mois: parsed.mois,
      annee: parsed.annee,
      numero: parsed.numero,
      isValid: parsed.is_valid,
      etapeLabel: parsed.is_valid ? ETAPE_LABELS[parsed.etape as ARTIEtape] : undefined,
    };
  }, []);

  /**
   * Parse une référence localement (sans appel DB)
   */
  const parseReferenceLocal = useCallback((reference: string): ParsedARTIReference => {
    if (!reference || reference.length !== 13 || !reference.match(/^ARTI[0-9]{9}$/)) {
      return {
        etape: 0,
        mois: 0,
        annee: 0,
        numero: 0,
        isValid: false,
      };
    }

    const etape = parseInt(reference.substring(4, 5), 10);
    const mois = parseInt(reference.substring(5, 7), 10);
    const annee = 2000 + parseInt(reference.substring(7, 9), 10);
    const numero = parseInt(reference.substring(9, 13), 10);

    return {
      etape,
      mois,
      annee,
      numero,
      isValid: true,
      etapeLabel: ETAPE_LABELS[etape as ARTIEtape],
    };
  }, []);

  /**
   * Synchronise le compteur après un import
   */
  const syncCounterFromImport = useCallback(async (
    etape: ARTIEtape,
    mois: number,
    annee: number,
    maxNumero: number
  ): Promise<boolean> => {
    const { data, error } = await supabase.rpc("sync_arti_counter_from_import", {
      p_etape: etape,
      p_mois: mois,
      p_annee: annee,
      p_max_numero: maxNumero,
    });

    if (error) {
      console.error("Error syncing ARTI counter:", error);
      return false;
    }

    return data === true;
  }, []);

  /**
   * Lance le backfill des références manquantes (admin only)
   */
  const backfillReferences = useCallback(async (): Promise<{
    tableName: string;
    recordsUpdated: number;
  }[]> => {
    const { data, error } = await supabase.rpc("backfill_arti_references");

    if (error) {
      console.error("Error backfilling ARTI references:", error);
      throw new Error(`Erreur lors du backfill: ${error.message}`);
    }

    return (data as any[]).map((row: any) => ({
      tableName: row.table_name,
      recordsUpdated: row.records_updated,
    }));
  }, []);

  /**
   * Formate une référence pour l'affichage
   */
  const formatReference = useCallback((reference: string): string => {
    const parsed = parseReferenceLocal(reference);
    if (!parsed.isValid) return reference;

    // Format: ARTI-0-01/26-0001
    return `ARTI-${parsed.etape}-${String(parsed.mois).padStart(2, "0")}/${String(parsed.annee % 100).padStart(2, "0")}-${String(parsed.numero).padStart(4, "0")}`;
  }, [parseReferenceLocal]);

  return {
    generateReference,
    parseReference,
    parseReferenceLocal,
    syncCounterFromImport,
    backfillReferences,
    formatReference,
    ETAPE_LABELS,
  };
};

export default useARTIReference;
