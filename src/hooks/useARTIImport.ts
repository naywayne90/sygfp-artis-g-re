import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
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

  /**
   * ============================================================================
   * RÈGLES DE NETTOYAGE ET EXTRACTION DES CODES (ULTRA IMPORTANT)
   * ============================================================================
   * Ces fonctions appliquent les règles métier strictes pour l'import ARTI
   */

  /**
   * Extrait un code numérique entier depuis une valeur brute
   * Exemples:
   *   - "2 Biens et services" → "2"
   *   - "01" → "1" (puis sera paddé)
   *   - 2.0 → "2"
   *   - "01 Direction Générale" → "1"
   */
  const extractIntegerCode = useCallback((value: unknown): number | null => {
    if (value === null || value === undefined || value === "") return null;
    
    // Handle numbers directly
    if (typeof value === "number") {
      return Math.floor(value);
    }
    
    const str = String(value).trim();
    if (str === "") return null;
    
    // Extract leading digits from string (e.g., "2 Biens et services" → "2")
    const match = str.match(/^(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }
    
    return null;
  }, []);

  /**
   * Extrait le code Nature de Dépense (1 chiffre)
   * Règle: Prendre le PREMIER chiffre uniquement
   * Exemples:
   *   - "4 Investissements" → "4"
   *   - "2 Biens et services" → "2"
   *   - 4 → "4"
   */
  const extractNatureDepenseCode = useCallback((value: unknown): string | null => {
    if (value === null || value === undefined || value === "") return null;
    
    if (typeof value === "number") {
      return String(Math.floor(value)).charAt(0);
    }
    
    const str = String(value).trim();
    
    // Extract first digit
    const match = str.match(/(\d)/);
    if (match) {
      return match[1];
    }
    
    return null;
  }, []);

  /**
   * Extrait le code NBE (6 chiffres) depuis Nature éco
   * Règle: Prendre les 6 premiers chiffres AVANT les espaces ou ":"
   * Exemples:
   *   - "221100 : Achats de matériel" → "221100"
   *   - "671700: Services" → "671700"
   *   - 221100 → "221100"
   *   - "22110" → "022110" (padded)
   */
  const extractNBECode = useCallback((value: unknown): string | null => {
    if (value === null || value === undefined || value === "") return null;
    
    const str = String(value).trim();
    
    // If it's a number, format it directly
    if (typeof value === "number") {
      const numStr = String(Math.floor(value));
      // Ensure 6 digits with leading zeros if needed
      return numStr.substring(0, 6).padStart(6, "0");
    }
    
    // Extract part before ":" or " " first, then get digits
    const beforeSeparator = str.split(/[:\s]/)[0].trim();
    const digitsOnly = beforeSeparator.replace(/\D/g, "");
    
    if (digitsOnly.length >= 6) {
      return digitsOnly.substring(0, 6);
    } else if (digitsOnly.length > 0) {
      return digitsOnly.padStart(6, "0");
    }
    
    // Fallback: try to extract any 6 consecutive digits
    const allDigits = str.replace(/\D/g, "");
    if (allDigits.length >= 6) {
      return allDigits.substring(0, 6);
    } else if (allDigits.length > 0) {
      return allDigits.padStart(6, "0");
    }
    
    return null;
  }, []);

  /**
   * Nettoie et valide un montant
   * Retourne null si invalide ou <= 0
   */
  const cleanMontant = useCallback((value: unknown): number | null => {
    if (value === null || value === undefined || value === "") return null;
    
    if (typeof value === "number") {
      return value > 0 ? value : null;
    }
    
    const str = String(value)
      .trim()
      .replace(/\s/g, "") // Remove spaces (thousand separators)
      .replace(/\u00A0/g, "") // Remove non-breaking spaces
      .replace(/,/g, "."); // Convert comma to dot
    
    const num = parseFloat(str);
    return (!isNaN(num) && num > 0) ? num : null;
  }, []);

  /**
   * Vérifie si une ligne est valide pour import (filtrage initial)
   * Règle: Ignorer les lignes où OS, Direction, Montant sont TOUS vides
   */
  const isRowValidForImport = useCallback((
    os: number | null,
    direction: number | null,
    montant: number | null
  ): boolean => {
    // Skip if ALL required fields are empty (pivot/summary rows)
    if (os === null && direction === null && montant === null) {
      return false;
    }
    // Also skip if OS is empty (critical identifier)
    if (os === null) {
      return false;
    }
    return true;
  }, []);

  /**
   * Applique le padding selon les règles métier:
   * - OS: 2 digits
   * - Action: 2 digits
   * - Activité: 3 digits
   * - Sous-Activité: 2 digits
   * - Direction: 2 digits
   * - Nature Dépense: 1 digit
   * - NBE: 6 digits
   */
  const padCode = useCallback((value: number | null, width: number): string => {
    if (value === null) return "0".repeat(width);
    return String(value).padStart(width, "0");
  }, []);

  /**
   * RÈGLE CRITIQUE - SOURCE DE VÉRITÉ
   * Reconstruire TOUJOURS l'imputation à partir des composants pour éviter la perte de précision Excel.
   * Format 18 chiffres: OS(2) + Action(2) + Activité(3) + SousActivité(2) + Direction(2) + NatureDépense(1) + NBE(6) = 18
   * Attention: ne JAMAIS importer l'imputation directement car Excel convertit 18 chiffres en notation scientifique (1.10E+17)
   */
  const calculateImputation = useCallback((
    osCode: string | null,
    actionCode: string | null,
    activiteCode: string | null,
    sousActiviteCode: string | null,
    directionCode: string | null,
    natureDepenseCode: string | null,
    nbeCode: string | null
  ): { code: string | null; format: "18" | "17" | null; missingComponents: string[] } => {
    const missingComponents: string[] = [];
    
    // Validate required components
    if (!osCode) missingComponents.push("OS");
    if (!actionCode) missingComponents.push("Action");
    if (!activiteCode) missingComponents.push("Activité");
    if (!sousActiviteCode) missingComponents.push("Sous-Activité");
    if (!directionCode) missingComponents.push("Direction");
    if (!natureDepenseCode) missingComponents.push("Nature Dépense");
    if (!nbeCode) missingComponents.push("NBE");

    // Build imputation code from components
    const osPadded = (osCode || "0").padStart(2, "0");
    const actionPadded = (actionCode || "0").padStart(2, "0");
    const activitePadded = (activiteCode || "0").padStart(3, "0");
    const sousActivitePadded = (sousActiviteCode || "0").padStart(2, "0"); // 2 digits, not 3
    const directionPadded = (directionCode || "0").padStart(2, "0");
    const naturePadded = (natureDepenseCode || "0").substring(0, 1);
    const nbePadded = (nbeCode || "000000").padStart(6, "0");

    // Format 18 chiffres (avec Action): OS(2) + Action(2) + Activité(3) + SousAct(2) + Dir(2) + Nat(1) + NBE(6) = 18
    const code18 = `${osPadded}${actionPadded}${activitePadded}${sousActivitePadded}${directionPadded}${naturePadded}${nbePadded}`;
    
    if (missingComponents.length > 0) {
      // Return partial code for display but mark as incomplete
      return { code: code18, format: null, missingComponents };
    }
    
    return { code: code18, format: "18", missingComponents: [] };
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

      // ============================================================================
      // EXTRACTION DES CODES AVEC RÈGLES STRICTES
      // ============================================================================
      
      // Extract raw imputation (for comparison only - will be recalculated)
      const rawImputationValue = getVal("imputation");
      const rawImputationStr = rawImputationValue ? String(rawImputationValue).trim() : null;
      
      // Extract codes as integers, then apply padding
      const osInt = extractIntegerCode(getVal("os"));
      const actionInt = extractIntegerCode(getVal("action"));
      const activiteInt = extractIntegerCode(getVal("activite"));
      const sousActiviteInt = extractIntegerCode(getVal("sousActivite"));
      const directionInt = extractIntegerCode(getVal("direction"));
      
      // Nature dépense: extract FIRST digit only (e.g., "4 Investissements" → "4")
      const natureDepenseCode = extractNatureDepenseCode(getVal("natureDepense"));
      
      // NBE: extract 6 digits before space/colon (e.g., "221100 : Achats" → "221100")
      const nbeCode = extractNBECode(getVal("nbe"));
      
      // Montant: clean and validate
      const montant = cleanMontant(getVal("montant"));
      
      // Libellé
      const rawLibelle = String(getVal("libelle") || "").trim();

      // ============================================================================
      // RÈGLE: IGNORER LES LIGNES VIDES/PIVOTS
      // Skip rows where OS, Direction, Montant are ALL empty
      // ============================================================================
      if (!isRowValidForImport(osInt, directionInt, montant)) {
        continue; // Skip this row entirely - it's likely a summary/pivot row
      }

      // Apply padding to codes
      const rawOs = osInt !== null ? padCode(osInt, 2) : null;
      const rawAction = actionInt !== null ? padCode(actionInt, 2) : null;
      const rawActivite = activiteInt !== null ? padCode(activiteInt, 3) : null;
      const rawSousActivite = sousActiviteInt !== null ? padCode(sousActiviteInt, 2) : null;
      const rawDirection = directionInt !== null ? padCode(directionInt, 2) : null;
      const rawNatureDepense = natureDepenseCode;
      const rawNbe = nbeCode;
      const rawMontant = montant;

      const errors: string[] = [];
      const warnings: string[] = [];

      // ============================================================================
      // VALIDATION STRICTE DES DONNÉES
      // ============================================================================

      // 1. Valider montant_initial >= 0
      if (rawMontant === null || rawMontant < 0) {
        errors.push("Montant invalide, manquant ou < 0");
      }

      // 2. Valider NBE = 6 chiffres
      if (!rawNbe) {
        errors.push("NBE absent ou invalide");
      } else if (!/^\d{6}$/.test(rawNbe)) {
        errors.push(`NBE doit être 6 chiffres (reçu: "${rawNbe}")`);
      }

      // 3. Valider composants obligatoires
      if (!rawOs) {
        errors.push("OS absent");
      }
      if (!rawDirection) {
        errors.push("Direction absente");
      }
      if (!rawNatureDepense) {
        errors.push("Nature de dépense absente");
      }

      // 4. Vérifier existence dans référentiels
      const osRef = findReference(refData.objectifsStrategiques, rawOs, "libelle" as any);
      const dirRef = findReference(refData.directions, rawDirection, "label");
      const actRef = findReference(refData.activites, rawActivite, "libelle" as any);
      const sousActRef = findReference(refData.sousActivites, rawSousActivite, "libelle" as any);
      const nbeRef = findReference(refData.nomenclatureNBE, rawNbe, "libelle" as any);

      // Références manquantes - WARNING si peut être créée, ERROR si critique
      if (rawOs && !osRef) {
        warnings.push(`Référentiel manquant: OS "${rawOs}" (sera créé à l'import)`);
      }
      if (rawDirection && !dirRef) {
        warnings.push(`Référentiel manquant: Direction "${rawDirection}" (sera créée à l'import)`);
      }
      if (rawNbe && !nbeRef) {
        warnings.push(`Référentiel manquant: NBE "${rawNbe}" (sera créé à l'import)`);
      }

      /**
       * RÈGLE CRITIQUE: TOUJOURS reconstruire l'imputation à partir des composants
       * Format 18 chiffres: OS(2) + Action(2) + Activité(3) + SousAct(2) + Dir(2) + Nat(1) + NBE(6) = 18
       * Ne jamais faire confiance à la colonne "imputation" du fichier Excel car:
       * - Excel peut convertir 18 chiffres en notation scientifique (1.10E+17)
       * - Les parseurs peuvent perdre des chiffres significatifs
       */
      const imputationResult = calculateImputation(
        rawOs,
        rawAction,
        rawActivite,
        rawSousActivite,
        rawDirection,
        rawNatureDepense,
        rawNbe
      );

      let finalCode = imputationResult.code;
      
      // 5. Valider imputation = 18 chiffres
      if (!finalCode || finalCode.length !== 18) {
        errors.push(`Imputation doit être 18 chiffres (calculée: "${finalCode || 'null'}", longueur: ${finalCode?.length || 0})`);
      } else if (!/^\d{18}$/.test(finalCode)) {
        errors.push(`Imputation doit contenir uniquement des chiffres (reçu: "${finalCode}")`);
      }
      
      // Log composants manquants comme erreurs bloquantes
      if (imputationResult.missingComponents.length > 0) {
        errors.push(`Composants manquants: ${imputationResult.missingComponents.join(", ")}`);
      }

      // Compare with raw imputation for validation (if available and looks valid)
      if (rawImputationStr && rawImputationStr.length >= 17 && finalCode) {
        const normalizedRaw = rawImputationStr.replace(/\D/g, "");
        const normalizedCalc = finalCode.replace(/\D/g, "");
        if (normalizedRaw !== normalizedCalc && normalizedRaw.length >= 17) {
          warnings.push(`Imputation recalculée: "${finalCode}" (fichier: "${rawImputationStr}")`);
        }
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
        imputation: rawImputationStr,
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
  }, [detectBestSheet, fetchReferenceData, autoDetectARTIMapping, extractIntegerCode, extractNatureDepenseCode, extractNBECode, cleanMontant, isRowValidForImport, padCode, calculateImputation, findReference]);

  // Execute import to budget_lines table
  const executeARTIImport = useCallback(async (
    rows: ARTIParsedRow[],
    exercice: number,
    jobId?: string,
    options?: { replaceAmountOnly?: boolean }
  ): Promise<{ inserted: number; updated: number; skipped: number; errors: number; errorDetails: string[] }> => {
    const validRows = rows.filter(r => r.isValid && r.normalized);
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    const errorDetails: string[] = [];
    const replaceAmountOnly = options?.replaceAmountOnly ?? false;

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
          if (replaceAmountOnly) {
            // Advanced mode: Only update the amount (montant)
            const { error } = await supabase
              .from("budget_lines")
              .update({
                dotation_initiale: data.dotation_initiale,
                dotation_modifiee: data.dotation_initiale,
                legacy_import: true,
              })
              .eq("id", row.normalized!.existing_id);

            if (error) throw error;
            updated++;
            
            // Log to import_rows as "updated_amount"
            if (jobId) {
              await supabase.from("import_rows").insert({
                job_id: jobId,
                row_index: row.rowIndex,
                sheet_name: row.sheetName,
                raw: row.raw.rawData as Json,
                normalized: { code: row.normalized!.code, label: row.normalized!.label, montant: row.normalized!.dotation_initiale } as Json,
                status: "updated_amount",
                target_action: "update",
              });
            }
          } else {
            // SAFE mode: Skip existing lines
            skipped++;
            
            // Log to import_rows as "skipped_existing"
            if (jobId) {
              await supabase.from("import_rows").insert({
                job_id: jobId,
                row_index: row.rowIndex,
                sheet_name: row.sheetName,
                raw: row.raw.rawData as Json,
                normalized: { code: row.normalized!.code, label: row.normalized!.label, montant: row.normalized!.dotation_initiale } as Json,
                status: "skipped_existing",
                target_action: "skip",
              });
            }
          }
        } else {
          // Insert new line
          const { error } = await supabase
            .from("budget_lines")
            .insert(data);

          if (error) throw error;
          inserted++;
          
          // Log to import_rows as "inserted"
          if (jobId) {
            await supabase.from("import_rows").insert({
              job_id: jobId,
              row_index: row.rowIndex,
              sheet_name: row.sheetName,
              raw: row.raw.rawData as Json,
              normalized: { code: row.normalized!.code, label: row.normalized!.label, montant: row.normalized!.dotation_initiale } as Json,
              status: "inserted",
              target_action: "insert",
            });
          }
        }
      } catch (err) {
        errors++;
        errorDetails.push(`Ligne ${row.rowIndex}: ${String(err)}`);
        
        // Log to import_rows as "error"
        if (jobId) {
          await supabase.from("import_rows").insert({
            job_id: jobId,
            row_index: row.rowIndex,
            sheet_name: row.sheetName,
            raw: (row.raw.rawData || {}) as Json,
            normalized: row.normalized ? { code: row.normalized.code } as Json : null,
            status: "error",
            error_messages: [String(err)],
            target_action: "error",
          });
        }
      }
    }

    // Update job summary
    if (jobId) {
      await supabase.from("import_jobs").update({
        total_rows: validRows.length,
        new_rows: inserted,
        updated_rows: updated,
        error_rows: errors,
        status: errors === 0 ? "completed" : "completed_with_errors",
        completed_at: new Date().toISOString(),
        notes: `Inserted: ${inserted}, Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}`,
      }).eq("id", jobId);
    }

    return { inserted, updated, skipped, errors, errorDetails };
  }, []);

  return {
    parseARTIExcel,
    executeARTIImport,
    fetchReferenceData,
    detectBestSheet,
  };
}
