import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SheetData } from "./useExcelParser";
import { Json } from "@/integrations/supabase/types";

interface RefItem {
  code: string;
  libelle: string | null;
}

export interface SyncResult {
  success: boolean;
  counts: {
    directions: number;
    objectifs_strategiques: number;
    activites: number;
    sous_activites: number;
    nbe: number;
  };
}

// Patterns to identify reference sheets
const SHEET_PATTERNS: Record<string, RegExp[]> = {
  directions: [/^direction/i, /^dir$/i],
  os: [/^os$/i, /objectif.*strat/i, /^o\.s\.?$/i],
  activites: [/^activit[ée]/i, /fonctionnement/i, /projet.*pip/i],
  sous_activites: [/sous.*activ/i, /s\/activ/i],
  nbe: [/^nbe$/i, /nomenclature/i, /nature.*[ée]co/i],
  nature_depense: [/nature.*d[ée]pense/i],
};

// Extract code from cell value (number or "code : libelle" format)
function extractCodeAndLibelle(value: any): RefItem | null {
  if (value === null || value === undefined || value === "") return null;
  
  const str = String(value).trim();
  
  // If it's a number, just return the code
  if (typeof value === "number") {
    return { code: String(Math.floor(value)), libelle: null };
  }
  
  // Try to parse "code : libelle" or "code - libelle" format
  const match = str.match(/^(\d+)\s*[:–\-]\s*(.+)$/);
  if (match) {
    return { code: match[1], libelle: match[2].trim() };
  }
  
  // Try to extract just a code at the beginning
  const codeMatch = str.match(/^(\d+)/);
  if (codeMatch) {
    const code = codeMatch[1];
    const libelle = str.replace(/^\d+\s*[:–\-]?\s*/, "").trim() || null;
    return { code, libelle };
  }
  
  return null;
}

export function useReferentielSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  // Detect which sheets contain reference data
  const detectReferenceSheets = useCallback((sheets: SheetData[]): {
    hasReferenceData: boolean;
    detectedSheets: { name: string; type: string }[];
  } => {
    const detectedSheets: { name: string; type: string }[] = [];
    
    sheets.forEach((sheet) => {
      const lowerName = sheet.name.toLowerCase();
      
      for (const [type, patterns] of Object.entries(SHEET_PATTERNS)) {
        if (patterns.some(p => p.test(sheet.name) || p.test(lowerName))) {
          detectedSheets.push({ name: sheet.name, type });
          break;
        }
      }
    });
    
    return {
      hasReferenceData: detectedSheets.length > 0,
      detectedSheets,
    };
  }, []);

  // Extract reference data from sheets
  const extractReferenceData = useCallback((sheets: SheetData[]): {
    directions: RefItem[];
    objectifs_strategiques: RefItem[];
    activites: RefItem[];
    sous_activites: RefItem[];
    nbe: RefItem[];
  } => {
    const result = {
      directions: [] as RefItem[],
      objectifs_strategiques: [] as RefItem[],
      activites: [] as RefItem[],
      sous_activites: [] as RefItem[],
      nbe: [] as RefItem[],
    };

    sheets.forEach((sheet) => {
      const lowerName = sheet.name.toLowerCase();
      let targetArray: RefItem[] | null = null;

      // Determine which reference type this sheet is
      if (SHEET_PATTERNS.directions.some(p => p.test(sheet.name))) {
        targetArray = result.directions;
      } else if (SHEET_PATTERNS.os.some(p => p.test(sheet.name))) {
        targetArray = result.objectifs_strategiques;
      } else if (SHEET_PATTERNS.activites.some(p => p.test(sheet.name))) {
        targetArray = result.activites;
      } else if (SHEET_PATTERNS.sous_activites.some(p => p.test(sheet.name))) {
        targetArray = result.sous_activites;
      } else if (SHEET_PATTERNS.nbe.some(p => p.test(sheet.name))) {
        targetArray = result.nbe;
      }

      if (!targetArray) return;

      // Find code and libelle columns
      const headers = sheet.headers.map(h => h?.toLowerCase() || "");
      let codeColIdx = headers.findIndex(h => 
        h === "code" || h.includes("code") || h === "n°" || h === "numero"
      );
      let libelleColIdx = headers.findIndex(h => 
        h === "libelle" || h === "libellé" || h.includes("libelle") || 
        h === "designation" || h === "désignation" || h === "intitulé" || h === "intitule"
      );

      // If no explicit columns, use first column as combined code:libelle
      if (codeColIdx === -1) {
        codeColIdx = 0;
      }

      // Extract data from rows (skip header)
      sheet.data.slice(1).forEach((row) => {
        if (!row || row.every(cell => cell === null || cell === undefined || cell === "")) {
          return;
        }

        let item: RefItem | null = null;

        // Try to extract from code column
        if (libelleColIdx !== -1 && libelleColIdx !== codeColIdx) {
          // Separate code and libelle columns
          const codeItem = extractCodeAndLibelle(row[codeColIdx]);
          if (codeItem) {
            item = {
              code: codeItem.code,
              libelle: row[libelleColIdx]?.toString().trim() || codeItem.libelle,
            };
          }
        } else {
          // Combined format
          item = extractCodeAndLibelle(row[codeColIdx]);
        }

        if (item && item.code) {
          // Avoid duplicates
          if (!targetArray!.some(existing => existing.code === item!.code)) {
            targetArray!.push(item);
          }
        }
      });
    });

    return result;
  }, []);

  // Convert RefItem array to JSON-compatible format
  const toJsonArray = (items: RefItem[]): Json => {
    return items.map(item => ({
      code: item.code,
      libelle: item.libelle,
    })) as unknown as Json;
  };

  // Sync reference data to database
  const syncReferentiels = useCallback(async (
    filename: string,
    sheets: SheetData[]
  ): Promise<SyncResult> => {
    setIsSyncing(true);
    setSyncResult(null);

    try {
      const refData = extractReferenceData(sheets);

      // Call the RPC function with JSON-compatible arrays
      const { data, error } = await supabase.rpc("sync_referentiels_from_import", {
        p_filename: filename,
        p_directions: toJsonArray(refData.directions),
        p_objectifs_strategiques: toJsonArray(refData.objectifs_strategiques),
        p_activites: toJsonArray(refData.activites),
        p_sous_activites: toJsonArray(refData.sous_activites),
        p_nbe: toJsonArray(refData.nbe),
      });

      if (error) throw error;

      // Parse the result
      const resultData = data as unknown as SyncResult;
      const result: SyncResult = {
        success: resultData?.success ?? false,
        counts: resultData?.counts ?? {
          directions: 0,
          objectifs_strategiques: 0,
          activites: 0,
          sous_activites: 0,
          nbe: 0,
        },
      };
      
      setSyncResult(result);

      const totalSynced = 
        result.counts.directions +
        result.counts.objectifs_strategiques +
        result.counts.activites +
        result.counts.sous_activites +
        result.counts.nbe;

      if (totalSynced > 0) {
        toast.success(`Référentiels synchronisés: ${totalSynced} élément(s)`);
      } else {
        toast.info("Aucun référentiel à synchroniser");
      }

      return result;
    } catch (error) {
      console.error("Error syncing referentiels:", error);
      toast.error("Erreur lors de la synchronisation des référentiels");
      return {
        success: false,
        counts: {
          directions: 0,
          objectifs_strategiques: 0,
          activites: 0,
          sous_activites: 0,
          nbe: 0,
        },
      };
    } finally {
      setIsSyncing(false);
    }
  }, [extractReferenceData]);

  return {
    isSyncing,
    syncResult,
    detectReferenceSheets,
    extractReferenceData,
    syncReferentiels,
  };
}
