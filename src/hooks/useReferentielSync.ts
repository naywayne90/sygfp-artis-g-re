import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";

// Text normalization for column matching (remove accents, lowercase, trim)
function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9]/g, "") // Keep only alphanumeric
    .trim();
}

// Sheet name patterns for each referential
const SHEET_PATTERNS: Record<string, string[]> = {
  os: ["os", "objectif", "objectifs", "objectifs strategiques", "obj strat", "o.s."],
  actions: ["action", "actions"],
  directions: ["direction", "directions", "dir"],
  activites: ["activite", "activites", "fonctionnement", "projet pip"],
  sousActivites: ["sous activite", "sous-activite", "sousactivite", "s/activite", "sous activites"],
  nbe: ["nbe", "nature eco", "nature economique", "nomenclature", "nomenclature nbe"],
  natureDepense: ["nature depense", "nature de depense", "nat depense", "naturedepense"],
};

// Column patterns for each referential
const COLUMN_PATTERNS = {
  os: {
    code: ["code os", "code", "codeos", "os code", "n os", "numero os", "n°", "numero"],
    libelle: ["os", "libelle", "libelle os", "designation", "intitule", "objectif"],
  },
  actions: {
    code: ["code action", "code", "codeaction", "action code", "n action", "n°"],
    libelle: ["action", "libelle", "libelle action", "designation", "intitule"],
    osCode: ["code os", "os code", "codeos", "os", "objectif strategique"],
  },
  directions: {
    code: ["code direction", "code", "codedirection", "direction code", "sigle", "acronyme", "code dir"],
    libelle: ["direction", "libelle", "designation", "intitule", "nom direction", "libelle direction"],
  },
  activites: {
    code: ["code activite", "code", "codeactivite", "activite code", "n°"],
    libelle: ["activite", "libelle", "designation", "intitule"],
    actionCode: ["code action", "action code", "action"],
  },
  sousActivites: {
    code: ["code sous activite", "code", "codesousactivite", "sous activite code", "n°"],
    libelle: ["sous activite", "libelle", "designation", "intitule"],
    activiteCode: ["code activite", "activite code", "activite"],
  },
  nbe: {
    code: ["code nature eco", "code nbe", "code", "nbe", "nature eco code", "n°"],
    libelle: ["nature eco", "libelle", "designation", "nbe", "nature economique", "intitule"],
  },
  natureDepense: {
    code: ["code nature", "code", "codenature", "nature code", "type", "n°"],
    libelle: ["nature depense", "nature", "libelle", "designation", "nature de depense"],
  },
};

export interface ReferentielImportResult {
  type: string;
  tableName: string;
  sheetFound: boolean;
  sheetName: string | null;
  total: number;
  inserted: number;
  updated: number;
  errors: number;
  duplicates: string[];
  errorDetails: string[];
}

export interface AllReferentielsResult {
  os: ReferentielImportResult;
  actions: ReferentielImportResult;
  directions: ReferentielImportResult;
  activites: ReferentielImportResult;
  sousActivites: ReferentielImportResult;
  nbe: ReferentielImportResult;
  summary: {
    totalInserted: number;
    totalUpdated: number;
    totalErrors: number;
    sheetsFound: number;
    sheetsMissing: string[];
  };
}

function createEmptyResult(type: string, tableName: string): ReferentielImportResult {
  return {
    type,
    tableName,
    sheetFound: false,
    sheetName: null,
    total: 0,
    inserted: 0,
    updated: 0,
    errors: 0,
    duplicates: [],
    errorDetails: [],
  };
}

export function useReferentielSync() {
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);

  // Find matching sheet name
  const findSheet = useCallback((sheetNames: string[], patterns: string[]): string | null => {
    for (const sheetName of sheetNames) {
      const normalized = normalizeText(sheetName);
      for (const pattern of patterns) {
        const normalizedPattern = normalizeText(pattern);
        if (normalized === normalizedPattern || normalized.includes(normalizedPattern)) {
          return sheetName;
        }
      }
    }
    return null;
  }, []);

  // Find matching column in headers
  const findColumn = useCallback((headers: string[], patterns: string[]): string | null => {
    for (const header of headers) {
      if (!header) continue;
      const normalized = normalizeText(header);
      for (const pattern of patterns) {
        const normalizedPattern = normalizeText(pattern);
        if (normalized === normalizedPattern || normalized.includes(normalizedPattern)) {
          return header;
        }
      }
    }
    return null;
  }, []);

  // Parse sheet data
  const parseSheetData = useCallback((
    workbook: XLSX.WorkBook,
    sheetName: string
  ): { headers: string[]; rows: Record<string, unknown>[] } => {
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
      defval: "",
    }) as unknown[][];

    if (jsonData.length < 2) {
      return { headers: [], rows: [] };
    }

    const headers = (jsonData[0] as string[]).map(h => String(h || "").trim());
    const rows: Record<string, unknown>[] = [];

    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i] as unknown[];
      if (!row || row.every(cell => !cell || String(cell).trim() === "")) continue;

      const rowData: Record<string, unknown> = {};
      headers.forEach((header, idx) => {
        if (header) {
          rowData[header] = row[idx];
        }
      });
      rows.push(rowData);
    }

    return { headers, rows };
  }, []);

  // Clean code value (preserve as string)
  const cleanCode = useCallback((value: unknown): string | null => {
    if (value === null || value === undefined || value === "") return null;
    const str = String(value).trim();
    if (typeof value === "number") {
      return String(Math.floor(value));
    }
    // Extract leading digits if mixed with text
    const match = str.match(/^(\d+)/);
    if (match) return match[1];
    return str === "" ? null : str;
  }, []);

  // Import OS referential
  const importOS = useCallback(async (
    workbook: XLSX.WorkBook,
    sheetNames: string[]
  ): Promise<ReferentielImportResult> => {
    const result = createEmptyResult("Objectifs Stratégiques", "objectifs_strategiques");

    const sheetName = findSheet(sheetNames, SHEET_PATTERNS.os);
    if (!sheetName) return result;

    result.sheetFound = true;
    result.sheetName = sheetName;

    const { headers, rows } = parseSheetData(workbook, sheetName);
    const codeCol = findColumn(headers, COLUMN_PATTERNS.os.code);
    const libelleCol = findColumn(headers, COLUMN_PATTERNS.os.libelle);

    if (!codeCol) {
      result.errorDetails.push(`Colonne code non trouvée dans "${sheetName}"`);
      return result;
    }

    const seenCodes = new Set<string>();
    result.total = rows.length;

    for (const row of rows) {
      const code = cleanCode(row[codeCol]);
      const libelle = libelleCol ? String(row[libelleCol] || "").trim() : `OS ${code}`;

      if (!code) {
        result.errors++;
        continue;
      }

      if (seenCodes.has(code)) {
        result.duplicates.push(code);
        continue;
      }
      seenCodes.add(code);

      try {
        const { data: existing } = await supabase
          .from("objectifs_strategiques")
          .select("id")
          .eq("code", code)
          .maybeSingle();

        const currentYear = new Date().getFullYear();

        if (existing) {
          await supabase
            .from("objectifs_strategiques")
            .update({ libelle, last_sync_at: new Date().toISOString() })
            .eq("id", existing.id);
          result.updated++;
        } else {
          await supabase
            .from("objectifs_strategiques")
            .insert({ 
              code, 
              libelle, 
              est_actif: true,
              annee_debut: currentYear,
              annee_fin: currentYear + 5,
            });
          result.inserted++;
        }
      } catch (err) {
        result.errors++;
        result.errorDetails.push(`OS ${code}: ${String(err)}`);
      }
    }

    return result;
  }, [findSheet, findColumn, parseSheetData, cleanCode]);

  // Import Actions referential
  const importActions = useCallback(async (
    workbook: XLSX.WorkBook,
    sheetNames: string[]
  ): Promise<ReferentielImportResult> => {
    const result = createEmptyResult("Actions", "actions");

    const sheetName = findSheet(sheetNames, SHEET_PATTERNS.actions);
    if (!sheetName) return result;

    result.sheetFound = true;
    result.sheetName = sheetName;

    const { headers, rows } = parseSheetData(workbook, sheetName);
    const codeCol = findColumn(headers, COLUMN_PATTERNS.actions.code);
    const libelleCol = findColumn(headers, COLUMN_PATTERNS.actions.libelle);
    const osCodeCol = findColumn(headers, COLUMN_PATTERNS.actions.osCode);

    if (!codeCol) {
      result.errorDetails.push(`Colonne code non trouvée dans "${sheetName}"`);
      return result;
    }

    // Get OS mapping
    const { data: allOS } = await supabase.from("objectifs_strategiques").select("id, code");
    const osMap = new Map((allOS || []).map(os => [os.code, os.id]));

    const seenCodes = new Set<string>();
    result.total = rows.length;

    for (const row of rows) {
      const code = cleanCode(row[codeCol]);
      const libelle = libelleCol ? String(row[libelleCol] || "").trim() : `Action ${code}`;
      const osCode = osCodeCol ? cleanCode(row[osCodeCol]) : null;

      if (!code) {
        result.errors++;
        continue;
      }

      if (seenCodes.has(code)) {
        result.duplicates.push(code);
        continue;
      }
      seenCodes.add(code);

      const osId = osCode ? osMap.get(osCode) : null;

      try {
        const { data: existing } = await supabase
          .from("actions")
          .select("id")
          .eq("code", code)
          .maybeSingle();

        if (existing) {
          const updateData: Record<string, unknown> = { libelle, last_sync_at: new Date().toISOString() };
          if (osId) updateData.os_id = osId;
          await supabase.from("actions").update(updateData).eq("id", existing.id);
          result.updated++;
        } else {
          // Skip insert if os_id or mission_id is missing (required by DB)
          if (!osId) {
            result.errors++;
            result.errorDetails.push(`Action ${code}: os_id requis pour l'insertion`);
            continue;
          }
          // Use a placeholder mission_id for now
          const { data: missions } = await supabase.from("missions").select("id").limit(1);
          const missionId = missions?.[0]?.id;
          if (!missionId) {
            result.errors++;
            result.errorDetails.push(`Action ${code}: mission_id requis`);
            continue;
          }
          await supabase.from("actions").insert({ code, libelle, os_id: osId, mission_id: missionId, est_active: true });
          result.inserted++;
        }
      } catch (err) {
        result.errors++;
        result.errorDetails.push(`Action ${code}: ${String(err)}`);
      }
    }

    return result;
  }, [findSheet, findColumn, parseSheetData, cleanCode]);

  // Import Directions referential
  const importDirections = useCallback(async (
    workbook: XLSX.WorkBook,
    sheetNames: string[]
  ): Promise<ReferentielImportResult> => {
    const result = createEmptyResult("Directions", "directions");

    const sheetName = findSheet(sheetNames, SHEET_PATTERNS.directions);
    if (!sheetName) return result;

    result.sheetFound = true;
    result.sheetName = sheetName;

    const { headers, rows } = parseSheetData(workbook, sheetName);
    const codeCol = findColumn(headers, COLUMN_PATTERNS.directions.code);
    const libelleCol = findColumn(headers, COLUMN_PATTERNS.directions.libelle);

    if (!codeCol) {
      result.errorDetails.push(`Colonne code non trouvée dans "${sheetName}"`);
      return result;
    }

    const seenCodes = new Set<string>();
    result.total = rows.length;

    for (const row of rows) {
      const code = cleanCode(row[codeCol]);
      const label = libelleCol ? String(row[libelleCol] || "").trim() : `Direction ${code}`;

      if (!code) {
        result.errors++;
        continue;
      }

      if (seenCodes.has(code)) {
        result.duplicates.push(code);
        continue;
      }
      seenCodes.add(code);

      try {
        const { data: existing } = await supabase
          .from("directions")
          .select("id")
          .eq("code", code)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("directions")
            .update({ label, last_sync_at: new Date().toISOString() })
            .eq("id", existing.id);
          result.updated++;
        } else {
          await supabase
            .from("directions")
            .insert({ code, label, est_active: true });
          result.inserted++;
        }
      } catch (err) {
        result.errors++;
        result.errorDetails.push(`Direction ${code}: ${String(err)}`);
      }
    }

    return result;
  }, [findSheet, findColumn, parseSheetData, cleanCode]);

  // Import Activites referential
  const importActivites = useCallback(async (
    workbook: XLSX.WorkBook,
    sheetNames: string[]
  ): Promise<ReferentielImportResult> => {
    const result = createEmptyResult("Activités", "activites");

    const sheetName = findSheet(sheetNames, SHEET_PATTERNS.activites);
    if (!sheetName) return result;

    result.sheetFound = true;
    result.sheetName = sheetName;

    const { headers, rows } = parseSheetData(workbook, sheetName);
    const codeCol = findColumn(headers, COLUMN_PATTERNS.activites.code);
    const libelleCol = findColumn(headers, COLUMN_PATTERNS.activites.libelle);
    const actionCodeCol = findColumn(headers, COLUMN_PATTERNS.activites.actionCode);

    if (!codeCol) {
      result.errorDetails.push(`Colonne code non trouvée dans "${sheetName}"`);
      return result;
    }

    // Get Action mapping
    const { data: allActions } = await supabase.from("actions").select("id, code");
    const actionMap = new Map((allActions || []).map(a => [a.code, a.id]));

    const seenCodes = new Set<string>();
    result.total = rows.length;

    for (const row of rows) {
      const code = cleanCode(row[codeCol]);
      const libelle = libelleCol ? String(row[libelleCol] || "").trim() : `Activité ${code}`;
      const actionCode = actionCodeCol ? cleanCode(row[actionCodeCol]) : null;

      if (!code) {
        result.errors++;
        continue;
      }

      if (seenCodes.has(code)) {
        result.duplicates.push(code);
        continue;
      }
      seenCodes.add(code);

      const actionId = actionCode ? actionMap.get(actionCode) : null;

      try {
        const { data: existing } = await supabase
          .from("activites")
          .select("id")
          .eq("code", code)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("activites")
            .update({ libelle, action_id: actionId, last_sync_at: new Date().toISOString() })
            .eq("id", existing.id);
          result.updated++;
        } else {
          await supabase
            .from("activites")
            .insert({ code, libelle, action_id: actionId, est_active: true });
          result.inserted++;
        }
      } catch (err) {
        result.errors++;
        result.errorDetails.push(`Activité ${code}: ${String(err)}`);
      }
    }

    return result;
  }, [findSheet, findColumn, parseSheetData, cleanCode]);

  // Import Sous-Activites referential
  const importSousActivites = useCallback(async (
    workbook: XLSX.WorkBook,
    sheetNames: string[]
  ): Promise<ReferentielImportResult> => {
    const result = createEmptyResult("Sous-Activités", "sous_activites");

    const sheetName = findSheet(sheetNames, SHEET_PATTERNS.sousActivites);
    if (!sheetName) return result;

    result.sheetFound = true;
    result.sheetName = sheetName;

    const { headers, rows } = parseSheetData(workbook, sheetName);
    const codeCol = findColumn(headers, COLUMN_PATTERNS.sousActivites.code);
    const libelleCol = findColumn(headers, COLUMN_PATTERNS.sousActivites.libelle);
    const activiteCodeCol = findColumn(headers, COLUMN_PATTERNS.sousActivites.activiteCode);

    if (!codeCol) {
      result.errorDetails.push(`Colonne code non trouvée dans "${sheetName}"`);
      return result;
    }

    // Get Activite mapping
    const { data: allActivites } = await supabase.from("activites").select("id, code");
    const activiteMap = new Map((allActivites || []).map(a => [a.code, a.id]));

    const seenCodes = new Set<string>();
    result.total = rows.length;

    for (const row of rows) {
      const code = cleanCode(row[codeCol]);
      const libelle = libelleCol ? String(row[libelleCol] || "").trim() : `Sous-Activité ${code}`;
      const activiteCode = activiteCodeCol ? cleanCode(row[activiteCodeCol]) : null;

      if (!code) {
        result.errors++;
        continue;
      }

      if (seenCodes.has(code)) {
        result.duplicates.push(code);
        continue;
      }
      seenCodes.add(code);

      const activiteId = activiteCode ? activiteMap.get(activiteCode) : null;

      try {
        const { data: existing } = await supabase
          .from("sous_activites")
          .select("id")
          .eq("code", code)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("sous_activites")
            .update({ libelle, activite_id: activiteId, last_sync_at: new Date().toISOString() })
            .eq("id", existing.id);
          result.updated++;
        } else {
          await supabase
            .from("sous_activites")
            .insert({ code, libelle, activite_id: activiteId, est_active: true });
          result.inserted++;
        }
      } catch (err) {
        result.errors++;
        result.errorDetails.push(`Sous-Activité ${code}: ${String(err)}`);
      }
    }

    return result;
  }, [findSheet, findColumn, parseSheetData, cleanCode]);

  // Import NBE referential
  const importNBE = useCallback(async (
    workbook: XLSX.WorkBook,
    sheetNames: string[]
  ): Promise<ReferentielImportResult> => {
    const result = createEmptyResult("Nomenclature NBE", "nomenclature_nbe");

    const sheetName = findSheet(sheetNames, SHEET_PATTERNS.nbe);
    if (!sheetName) return result;

    result.sheetFound = true;
    result.sheetName = sheetName;

    const { headers, rows } = parseSheetData(workbook, sheetName);
    const codeCol = findColumn(headers, COLUMN_PATTERNS.nbe.code);
    const libelleCol = findColumn(headers, COLUMN_PATTERNS.nbe.libelle);

    if (!codeCol) {
      result.errorDetails.push(`Colonne code non trouvée dans "${sheetName}"`);
      return result;
    }

    const seenCodes = new Set<string>();
    result.total = rows.length;

    for (const row of rows) {
      let code = cleanCode(row[codeCol]);
      const libelle = libelleCol ? String(row[libelleCol] || "").trim() : `NBE ${code}`;

      if (!code) {
        result.errors++;
        continue;
      }

      // Ensure 6 digits for NBE
      if (code.length < 6 && /^\d+$/.test(code)) {
        code = code.padStart(6, "0");
      }

      if (seenCodes.has(code)) {
        result.duplicates.push(code);
        continue;
      }
      seenCodes.add(code);

      try {
        const { data: existing } = await supabase
          .from("nomenclature_nbe")
          .select("id")
          .eq("code", code)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("nomenclature_nbe")
            .update({ libelle, last_sync_at: new Date().toISOString() })
            .eq("id", existing.id);
          result.updated++;
        } else {
          await supabase
            .from("nomenclature_nbe")
            .insert({ code, libelle, est_active: true });
          result.inserted++;
        }
      } catch (err) {
        result.errors++;
        result.errorDetails.push(`NBE ${code}: ${String(err)}`);
      }
    }

    return result;
  }, [findSheet, findColumn, parseSheetData, cleanCode]);

  // Import all referentials from Excel file
  const importAllReferentiels = useCallback(async (
    file: File
  ): Promise<AllReferentielsResult> => {
    setIsSyncing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, {
        type: "array",
        cellText: true,
        raw: false,
      });

      const sheetNames = workbook.SheetNames;

      // Import all referentials sequentially (to maintain FK relationships)
      // OS first, then Actions (which reference OS), then Activites, etc.
      const osResult = await importOS(workbook, sheetNames);
      const actionsResult = await importActions(workbook, sheetNames);
      const activitesResult = await importActivites(workbook, sheetNames);
      const sousActivitesResult = await importSousActivites(workbook, sheetNames);
      const directionsResult = await importDirections(workbook, sheetNames);
      const nbeResult = await importNBE(workbook, sheetNames);

      const allResults = [osResult, actionsResult, activitesResult, sousActivitesResult, directionsResult, nbeResult];
      const sheetsFound = allResults.filter(r => r.sheetFound).length;
      const sheetsMissing: string[] = [];
      
      if (!osResult.sheetFound) sheetsMissing.push("OS");
      if (!actionsResult.sheetFound) sheetsMissing.push("Actions");
      if (!activitesResult.sheetFound) sheetsMissing.push("Activités");
      if (!sousActivitesResult.sheetFound) sheetsMissing.push("Sous-Activités");
      if (!directionsResult.sheetFound) sheetsMissing.push("Directions");
      if (!nbeResult.sheetFound) sheetsMissing.push("NBE");

      const result: AllReferentielsResult = {
        os: osResult,
        actions: actionsResult,
        directions: directionsResult,
        activites: activitesResult,
        sousActivites: sousActivitesResult,
        nbe: nbeResult,
        summary: {
          totalInserted: allResults.reduce((sum, r) => sum + r.inserted, 0),
          totalUpdated: allResults.reduce((sum, r) => sum + r.updated, 0),
          totalErrors: allResults.reduce((sum, r) => sum + r.errors, 0),
          sheetsFound,
          sheetsMissing,
        },
      };

      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [importOS, importActions, importActivites, importSousActivites, importDirections, importNBE]);

  // Refresh all dropdown caches
  const refreshDropdowns = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["objectifs-strategiques"] });
    queryClient.invalidateQueries({ queryKey: ["actions"] });
    queryClient.invalidateQueries({ queryKey: ["activites"] });
    queryClient.invalidateQueries({ queryKey: ["sous-activites"] });
    queryClient.invalidateQueries({ queryKey: ["directions"] });
    queryClient.invalidateQueries({ queryKey: ["nomenclature-nbe"] });
    queryClient.invalidateQueries({ queryKey: ["ref-data"] });
  }, [queryClient]);

  // Auto-create missing reference
  const createMissingReference = useCallback(async (
    type: "os" | "direction" | "nbe" | "activite" | "sous_activite",
    code: string,
    libelle?: string
  ): Promise<string | null> => {
    try {
      const currentYear = new Date().getFullYear();
      switch (type) {
        case "os": {
          const { data, error } = await supabase
            .from("objectifs_strategiques")
            .insert({ code, libelle: libelle || `OS ${code}`, est_actif: true, annee_debut: currentYear, annee_fin: currentYear + 5 })
            .select("id")
            .single();
          if (error) throw error;
          return data.id;
        }
        case "direction": {
          const { data, error } = await supabase
            .from("directions")
            .insert({ code, label: libelle || `Direction ${code}`, est_active: true })
            .select("id")
            .single();
          if (error) throw error;
          return data.id;
        }
        case "nbe": {
          const { data, error } = await supabase
            .from("nomenclature_nbe")
            .insert({ code: code.padStart(6, "0"), libelle: libelle || `NBE ${code}`, est_active: true })
            .select("id")
            .single();
          if (error) throw error;
          return data.id;
        }
        case "activite":
        case "sous_activite":
          // Skip - requires FK that may not exist
          console.warn(`Cannot auto-create ${type} without parent reference`);
          return null;
        default:
          return null;
      }
    } catch (err) {
      console.error(`Failed to create ${type} ${code}:`, err);
      return null;
    }
  }, []);

  // Detect which sheets contain reference data
  const detectReferenceSheets = useCallback((sheetNames: string[]): {
    hasReferenceData: boolean;
    detectedSheets: { name: string; type: string }[];
  } => {
    const detectedSheets: { name: string; type: string }[] = [];
    
    for (const [type, patterns] of Object.entries(SHEET_PATTERNS)) {
      const found = findSheet(sheetNames, patterns);
      if (found) {
        detectedSheets.push({ name: found, type });
      }
    }
    
    return {
      hasReferenceData: detectedSheets.length > 0,
      detectedSheets,
    };
  }, [findSheet]);

  return {
    isSyncing,
    importAllReferentiels,
    refreshDropdowns,
    createMissingReference,
    detectReferenceSheets,
    findSheet,
    findColumn,
  };
}
