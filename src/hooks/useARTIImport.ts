import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";

// ARTI Excel column names mapping
const ARTI_COLUMN_NAMES = {
  imputation: ["N° imputation", "N°imputation", "Imputation", "CODE IMPUTATION", "N° IMPUTATION"],
  os: ["OS", "O.S.", "Objectif Stratégique", "OBJECTIF STRATEGIQUE"],
  action: ["Action", "ACTION", "Act"],
  activite: ["ACTIVITE", "Activité", "ACT", "ACTIVITÉ"],
  sousActivite: ["SOUS ACTIVITE", "SOUS-ACTIVITE", "Sous-activité", "Sous activité", "S/ACTIVITE", "SOUS_ACTIVITE"],
  direction: ["DIRECTION", "Direction", "DIR", "Direction charge exécution"],
  natureDepense: ["NATURE DEPENSE", "Nature dépense", "NAT DEPENSE", "NATURE_DEPENSE", "Nature de dépense"],
  nbe: ["NATURE ECO", "Nature éco", "NBE", "NATURE_ECO", "Nature économique", "N.B.E"],
  montant: ["MONTANT", "Montant", "Budget initial", "BUDGET", "Dotation", "DOTATION INITIALE"],
  libelle: ["LIB_PROJET", "Libellé projet", "LIBELLE", "Libellé", "LIB PROJET", "LIBELLE_PROJET"],
};

// Sheets to prioritize (in order)
const PREFERRED_SHEETS = ["Groupé (2)", "Groupe (2)", "Feuil3", "Sheet3", "Données"];

// Sheets to explicitly ignore (may contain #REF errors)
const IGNORED_SHEETS = ["Groupé", "Groupe"];

export interface ARTIRawRow {
  rowIndex: number;
  sheetName: string;
  imputation: string | null;
  os: string | null;
  action: string | null;
  activite: string | null;
  sousActivite: string | null;
  direction: string | null;
  natureDepense: string | null;
  nbe: string | null;
  montant: string | null;
  libelle: string | null;
  rawData: Record<string, unknown>;
}

export interface ARTINormalizedRow {
  code: string;
  label: string;
  dotation_initiale: number;
  os_code: string | null;
  os_id: string | null;
  action_code: string | null;
  action_id: string | null;
  activite_code: string | null;
  activite_id: string | null;
  sous_activite_code: string | null;
  sous_activite_id: string | null;
  direction_code: string | null;
  direction_id: string | null;
  nature_depense: string | null;
  nbe_code: string | null;
  nbe_id: string | null;
  source_financement: string;
  decision: "NEW" | "UPDATE" | "SKIP";
  existing_id: string | null;
}

export interface ARTIParsedRow {
  rowIndex: number;
  sheetName: string;
  raw: ARTIRawRow;
  normalized: ARTINormalizedRow | null;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  decision: "NEW" | "UPDATE" | "SKIP" | "ERROR";
}

export interface ReferenceData {
  objectifsStrategiques: Array<{ id: string; code: string; libelle: string }>;
  directions: Array<{ id: string; code: string; label: string }>;
  activites: Array<{ id: string; code: string; libelle: string }>;
  sousActivites: Array<{ id: string; code: string; libelle: string }>;
  nomenclatureNBE: Array<{ id: string; code: string; libelle: string }>;
  existingLines: Array<{ id: string; code: string; exercice: number }>;
}

export function useARTIImport() {
  // Fetch all reference data needed for validation
  const fetchReferenceData = useCallback(async (exercice: number): Promise<ReferenceData> => {
    const [osRes, dirRes, actRes, sousActRes, nbeRes, linesRes] = await Promise.all([
      supabase.from("objectifs_strategiques").select("id, code, libelle"),
      supabase.from("directions").select("id, code, label").eq("est_active", true),
      supabase.from("activites").select("id, code, libelle"),
      supabase.from("sous_activites").select("id, code, libelle"),
      supabase.from("nomenclature_nbe").select("id, code, libelle"),
      supabase.from("budget_lines").select("id, code, exercice").eq("exercice", exercice),
    ]);

    return {
      objectifsStrategiques: osRes.data || [],
      directions: dirRes.data || [],
      activites: actRes.data || [],
      sousActivites: sousActRes.data || [],
      nomenclatureNBE: nbeRes.data || [],
      existingLines: linesRes.data || [],
    };
  }, []);

  // Detect best sheet to use
  const detectBestSheet = useCallback((sheetNames: string[]): { sheet: string; reason: string } => {
    // Filter out ignored sheets
    const validSheets = sheetNames.filter(
      name => !IGNORED_SHEETS.some(ignored => 
        name.toLowerCase().trim() === ignored.toLowerCase().trim()
      )
    );

    // Check for preferred sheets in order
    for (const preferred of PREFERRED_SHEETS) {
      const found = validSheets.find(
        name => name.toLowerCase().trim() === preferred.toLowerCase().trim()
      );
      if (found) {
        return { sheet: found, reason: `Onglet prioritaire "${found}" détecté` };
      }
    }

    // Return first valid sheet
    if (validSheets.length > 0) {
      return { sheet: validSheets[0], reason: `Premier onglet valide "${validSheets[0]}" utilisé` };
    }

    return { sheet: sheetNames[0] || "", reason: "Aucun onglet valide trouvé" };
  }, []);

  // Auto-detect column mapping for ARTI format
  const autoDetectARTIMapping = useCallback((headers: string[]): Record<string, string | null> => {
    const mapping: Record<string, string | null> = {};

    for (const [field, patterns] of Object.entries(ARTI_COLUMN_NAMES)) {
      mapping[field] = null;
      for (const pattern of patterns) {
        const found = headers.find(h => 
          h?.toLowerCase().trim() === pattern.toLowerCase().trim()
        );
        if (found) {
          mapping[field] = found;
          break;
        }
      }
      // If exact match not found, try partial match
      if (!mapping[field]) {
        for (const pattern of patterns) {
          const found = headers.find(h => 
            h?.toLowerCase().includes(pattern.toLowerCase())
          );
          if (found) {
            mapping[field] = found;
            break;
          }
        }
      }
    }

    return mapping;
  }, []);

  // Clean and preserve codes as strings (preserve leading zeros)
  const cleanCode = useCallback((value: unknown): string | null => {
    if (value === null || value === undefined || value === "") return null;
    
    const str = String(value).trim();
    
    // If it's a number like 1.0 or 2.0, convert to integer string
    if (typeof value === "number") {
      const intVal = Math.floor(value);
      return String(intVal);
    }
    
    // Extract leading digits if there's text after (e.g., "2 Biens et services" → "2")
    const match = str.match(/^(\d+)/);
    if (match) {
      return match[1];
    }
    
    return str === "" ? null : str;
  }, []);

  // Clean montant value
  const cleanMontant = useCallback((value: unknown): number | null => {
    if (value === null || value === undefined || value === "") return null;
    
    if (typeof value === "number") return value;
    
    const str = String(value)
      .trim()
      .replace(/\s/g, "") // Remove spaces
      .replace(/\u00A0/g, "") // Remove non-breaking spaces
      .replace(/,/g, "."); // Convert comma to dot
    
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
  }, []);

  // Extract NBE code (6 digits)
  const extractNBECode = useCallback((value: unknown): string | null => {
    if (value === null || value === undefined || value === "") return null;
    
    const str = String(value).trim();
    
    // If it's a number, format it
    if (typeof value === "number") {
      const numStr = String(Math.floor(value));
      return numStr.substring(0, 6).padStart(6, "0");
    }
    
    // Extract digits from string
    const digitsOnly = str.replace(/\D/g, "");
    if (digitsOnly.length >= 6) {
      return digitsOnly.substring(0, 6);
    } else if (digitsOnly.length > 0) {
      return digitsOnly.padStart(6, "0");
    }
    
    return null;
  }, []);

  // Calculate imputation code from components
  const calculateImputation = useCallback((
    osCode: string | null,
    actionCode: string | null,
    activiteCode: string | null,
    sousActiviteCode: string | null,
    directionCode: string | null,
    natureDepenseCode: string | null,
    nbeCode: string | null
  ): string | null => {
    if (!osCode || !activiteCode || !sousActiviteCode || !directionCode || !nbeCode) {
      return null;
    }

    const osPadded = osCode.padStart(2, "0");
    const activitePadded = activiteCode.padStart(3, "0");
    const sousActivitePadded = sousActiviteCode.padStart(3, "0");
    const directionPadded = directionCode.padStart(2, "0");
    const naturePadded = (natureDepenseCode || "0").substring(0, 1);
    const nbePadded = nbeCode.padStart(6, "0");

    if (actionCode) {
      // Format 19 digits
      const actionPadded = actionCode.padStart(2, "0");
      return `${osPadded}${actionPadded}${activitePadded}${sousActivitePadded}${directionPadded}${naturePadded}${nbePadded}`;
    } else {
      // Format 17 digits
      return `${osPadded}${activitePadded}${sousActivitePadded}${directionPadded}${naturePadded}${nbePadded}`;
    }
  }, []);

  // Match reference by code or label
  const findReference = useCallback(<T extends { id: string; code: string }>(
    refs: T[],
    searchValue: string | null,
    labelField?: keyof T
  ): T | null => {
    if (!searchValue) return null;
    
    const cleanSearch = searchValue.trim().toLowerCase();
    
    // Try exact code match first
    const byCode = refs.find(r => r.code?.toLowerCase() === cleanSearch);
    if (byCode) return byCode;
    
    // Try code at start (e.g., "01 Direction Générale" → code "01")
    const codeMatch = searchValue.match(/^(\d+)/);
    if (codeMatch) {
      const codeOnly = codeMatch[1];
      const found = refs.find(r => r.code === codeOnly || r.code === codeOnly.padStart(2, "0"));
      if (found) return found;
    }
    
    // Try label match if provided
    if (labelField) {
      const byLabel = refs.find(r => 
        String(r[labelField] || "").toLowerCase().includes(cleanSearch) ||
        cleanSearch.includes(String(r[labelField] || "").toLowerCase())
      );
      if (byLabel) return byLabel;
    }
    
    return null;
  }, []);

  // Parse Excel file and extract ARTI format data
  const parseARTIExcel = useCallback(async (
    file: File,
    exercice: number
  ): Promise<{
    rows: ARTIParsedRow[];
    sheetUsed: string;
    sheetReason: string;
    mapping: Record<string, string | null>;
    headers: string[];
    allSheets: string[];
    stats: { total: number; ok: number; warning: number; error: number; new: number; update: number };
  }> => {
    // Read Excel file
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { 
      type: "array", 
      cellText: true, 
      cellDates: true,
      raw: false, // Keep as strings to preserve leading zeros
    });

    const allSheets = workbook.SheetNames;
    const { sheet: selectedSheet, reason: sheetReason } = detectBestSheet(allSheets);

    if (!selectedSheet) {
      throw new Error("Aucun onglet valide trouvé dans le fichier");
    }

    // Fetch reference data
    const refData = await fetchReferenceData(exercice);

    // Read selected sheet
    const wsSheet = workbook.Sheets[selectedSheet];
    const jsonData = XLSX.utils.sheet_to_json(wsSheet, {
      header: 1,
      raw: false, // Keep as strings
      defval: "",
    }) as unknown[][];

    if (jsonData.length < 2) {
      throw new Error(`L'onglet "${selectedSheet}" est vide ou ne contient pas de données`);
    }

    // Get headers
    const headers = (jsonData[0] as string[]).map(h => String(h || "").trim());
    
    // Auto-detect mapping
    const mapping = autoDetectARTIMapping(headers);

    const parsedRows: ARTIParsedRow[] = [];
    let statsNew = 0;
    let statsUpdate = 0;

    // Process data rows (skip header)
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i] as unknown[];
      
      // Skip empty rows
      if (!row || row.every(cell => !cell || String(cell).trim() === "")) continue;

      // Build raw data object
      const rawData: Record<string, unknown> = {};
      headers.forEach((header, idx) => {
        if (header) {
          rawData[header] = row[idx];
        }
      });

      // Extract values using mapping
      const getVal = (field: string): unknown => {
        const colName = mapping[field];
        if (!colName) return null;
        const idx = headers.indexOf(colName);
        return idx >= 0 ? row[idx] : null;
      };

      const rawImputation = cleanCode(getVal("imputation"));
      const rawOs = cleanCode(getVal("os"));
      const rawAction = cleanCode(getVal("action"));
      const rawActivite = cleanCode(getVal("activite"));
      const rawSousActivite = cleanCode(getVal("sousActivite"));
      const rawDirection = cleanCode(getVal("direction"));
      const rawNatureDepense = cleanCode(getVal("natureDepense"));
      const rawNbe = extractNBECode(getVal("nbe"));
      const rawMontant = cleanMontant(getVal("montant"));
      const rawLibelle = String(getVal("libelle") || "").trim();

      const errors: string[] = [];
      const warnings: string[] = [];

      // Validate required fields
      if (rawMontant === null || rawMontant <= 0) {
        errors.push("Montant invalide ou manquant");
      }

      // Match references
      const osRef = findReference(refData.objectifsStrategiques, rawOs, "libelle" as any);
      const dirRef = findReference(refData.directions, rawDirection, "label");
      const actRef = findReference(refData.activites, rawActivite, "libelle" as any);
      const sousActRef = findReference(refData.sousActivites, rawSousActivite, "libelle" as any);
      const nbeRef = findReference(refData.nomenclatureNBE, rawNbe, "libelle" as any);

      // Add warnings for missing references (non-blocking)
      if (rawOs && !osRef) {
        warnings.push(`Référentiel manquant: OS "${rawOs}"`);
      }
      if (rawDirection && !dirRef) {
        warnings.push(`Référentiel manquant: Direction "${rawDirection}"`);
      }
      if (rawNbe && !nbeRef) {
        warnings.push(`Référentiel manquant: NBE "${rawNbe}"`);
      }

      // Calculate imputation if not provided
      let finalCode = rawImputation;
      if (!finalCode) {
        finalCode = calculateImputation(
          rawOs,
          rawAction,
          rawActivite,
          rawSousActivite,
          rawDirection,
          rawNatureDepense,
          rawNbe
        );
      }

      if (!finalCode) {
        errors.push("Impossible de déterminer le code imputation");
      }

      // Build label
      let label = rawLibelle;
      if (!label || label.length < 2) {
        // Fallback: concat nature éco + nature dépense
        const parts = [
          rawNbe ? `NBE ${rawNbe}` : null,
          rawNatureDepense ? `Nat. ${rawNatureDepense}` : null,
        ].filter(Boolean);
        label = parts.join(" - ") || `Ligne ${i + 1}`;
        if (!rawLibelle) {
          warnings.push("Libellé projet vide, généré automatiquement");
        }
      }

      // Check for existing line (deduplication)
      let decision: "NEW" | "UPDATE" | "SKIP" | "ERROR" = errors.length > 0 ? "ERROR" : "NEW";
      let normalizedDecision: "NEW" | "UPDATE" | "SKIP" = "NEW";
      let existingId: string | null = null;

      if (finalCode && errors.length === 0) {
        const existing = refData.existingLines.find(l => l.code === finalCode);
        if (existing) {
          decision = "UPDATE";
          normalizedDecision = "UPDATE";
          existingId = existing.id;
          statsUpdate++;
        } else {
          statsNew++;
        }
      }

      // Build raw row
      const rawRow: ARTIRawRow = {
        rowIndex: i + 1,
        sheetName: selectedSheet,
        imputation: rawImputation,
        os: rawOs,
        action: rawAction,
        activite: rawActivite,
        sousActivite: rawSousActivite,
        direction: rawDirection,
        natureDepense: rawNatureDepense,
        nbe: rawNbe,
        montant: rawMontant?.toString() || null,
        libelle: rawLibelle || null,
        rawData,
      };

      // Build normalized row if valid
      const normalized: ARTINormalizedRow | null = errors.length === 0 && finalCode ? {
        code: finalCode,
        label: label.substring(0, 255),
        dotation_initiale: rawMontant || 0,
        os_code: rawOs,
        os_id: osRef?.id || null,
        action_code: rawAction,
        action_id: null,
        activite_code: rawActivite,
        activite_id: actRef?.id || null,
        sous_activite_code: rawSousActivite,
        sous_activite_id: sousActRef?.id || null,
        direction_code: rawDirection,
        direction_id: dirRef?.id || null,
        nature_depense: rawNatureDepense,
        nbe_code: rawNbe,
        nbe_id: nbeRef?.id || null,
        source_financement: "Budget État",
        decision: normalizedDecision,
        existing_id: existingId,
      } : null;

      parsedRows.push({
        rowIndex: i + 1,
        sheetName: selectedSheet,
        raw: rawRow,
        normalized,
        isValid: errors.length === 0,
        errors,
        warnings,
        decision,
      });
    }

    const stats = {
      total: parsedRows.length,
      ok: parsedRows.filter(r => r.isValid && r.warnings.length === 0).length,
      warning: parsedRows.filter(r => r.isValid && r.warnings.length > 0).length,
      error: parsedRows.filter(r => !r.isValid).length,
      new: statsNew,
      update: statsUpdate,
    };

    return {
      rows: parsedRows,
      sheetUsed: selectedSheet,
      sheetReason,
      mapping,
      headers,
      allSheets,
      stats,
    };
  }, [detectBestSheet, fetchReferenceData, autoDetectARTIMapping, cleanCode, cleanMontant, extractNBECode, calculateImputation, findReference]);

  // Execute import to budget_lines table
  const executeARTIImport = useCallback(async (
    rows: ARTIParsedRow[],
    exercice: number,
    jobId?: string
  ): Promise<{ inserted: number; updated: number; errors: number; errorDetails: string[] }> => {
    const validRows = rows.filter(r => r.isValid && r.normalized);
    let inserted = 0;
    let updated = 0;
    let errors = 0;
    const errorDetails: string[] = [];

    for (const row of validRows) {
      try {
        const data = {
          code: row.normalized!.code,
          label: row.normalized!.label,
          dotation_initiale: row.normalized!.dotation_initiale,
          dotation_modifiee: row.normalized!.dotation_initiale,
          disponible_calcule: row.normalized!.dotation_initiale,
          exercice,
          level: "line",
          is_active: true,
          source_financement: row.normalized!.source_financement,
          os_id: row.normalized!.os_id,
          direction_id: row.normalized!.direction_id,
          activite_id: row.normalized!.activite_id,
          sous_activite_id: row.normalized!.sous_activite_id,
          nbe_id: row.normalized!.nbe_id,
          code_budgetaire: row.normalized!.code,
          legacy_import: true,
          import_run_id: jobId || null,
        };

        if (row.normalized!.decision === "UPDATE" && row.normalized!.existing_id) {
          // Update existing line
          const { error } = await supabase
            .from("budget_lines")
            .update({
              label: data.label,
              dotation_initiale: data.dotation_initiale,
              dotation_modifiee: data.dotation_initiale,
              os_id: data.os_id,
              direction_id: data.direction_id,
              activite_id: data.activite_id,
              sous_activite_id: data.sous_activite_id,
              nbe_id: data.nbe_id,
              source_financement: data.source_financement,
              legacy_import: true,
            })
            .eq("id", row.normalized!.existing_id);

          if (error) throw error;
          updated++;
        } else {
          // Insert new line
          const { error } = await supabase
            .from("budget_lines")
            .insert(data);

          if (error) throw error;
          inserted++;
        }
      } catch (err) {
        errors++;
        errorDetails.push(`Ligne ${row.rowIndex}: ${String(err)}`);
      }
    }

    return { inserted, updated, errors, errorDetails };
  }, []);

  return {
    parseARTIExcel,
    executeARTIImport,
    fetchReferenceData,
    detectBestSheet,
  };
}
