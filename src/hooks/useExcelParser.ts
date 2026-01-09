import { useCallback } from "react";
import * as XLSX from "xlsx";

export interface SheetData {
  name: string;
  data: any[][];
  headers: string[];
}

export interface ParsedRow {
  rowNumber: number;
  raw: {
    imputation: string | null;
    os: string | null;
    action: string | null;
    activite: string | null;
    sousActivite: string | null;
    direction: string | null;
    natureDepense: string | null;
    nbe: string | null;
    montant: string | null;
  };
  computed: {
    imputation: string | null;
    calculatedImputation: string | null;
    imputationFormat: "17" | "18" | null;
    osCode: number | null;
    actionCode: number | null;
    activiteCode: number | null;
    sousActiviteCode: number | null;
    directionCode: number | null;
    natureDepenseCode: number | null;
    nbeCode: string | null;
    montant: number | null;
  };
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ColumnMapping {
  imputation: string | null;
  os: string | null;
  action: string | null;
  activite: string | null;
  sousActivite: string | null;
  direction: string | null;
  natureDépense: string | null;
  nbe: string | null;
  montant: string | null;
}

// Patterns to detect total columns (to ignore)
const TOTAL_COLUMN_PATTERNS = [
  /^total/i,
  /^somme/i,
  /^sum/i,
  /^sous[- ]?total/i,
  /^cumul/i,
  /\btotal\b/i,
];

// Check if a header looks like a total column
function isTotalColumn(header: string): boolean {
  if (!header) return false;
  return TOTAL_COLUMN_PATTERNS.some(pattern => pattern.test(header.trim()));
}

// Extract numeric code from beginning of string
// e.g., "2 Biens et services" → 2
function extractNumericCode(value: any): number | null {
  if (value === null || value === undefined || value === "") return null;
  
  const str = String(value).trim();
  
  // If already a number, return it
  if (typeof value === "number") {
    return Math.floor(value);
  }
  
  // Extract number at the beginning
  const match = str.match(/^(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  
  return null;
}

// Extract NBE code (first 6 digits)
// e.g., "671700 : Achats de matériel" → "671700"
function extractNBECode(value: any): string | null {
  if (value === null || value === undefined || value === "") return null;
  
  const str = String(value).trim();
  
  // If it's a number, format it
  if (typeof value === "number") {
    const numStr = String(Math.floor(value));
    return numStr.substring(0, 6).padStart(6, "0");
  }
  
  // Extract first 6 digits from string
  const digitsOnly = str.replace(/\D/g, "");
  if (digitsOnly.length >= 6) {
    return digitsOnly.substring(0, 6);
  } else if (digitsOnly.length > 0) {
    return digitsOnly.padStart(6, "0");
  }
  
  return null;
}

// Parse numeric string to integer, preserving leading zeros as string when needed
function parseToIntegerCode(value: any): { raw: string | null; code: number | null } {
  if (value === null || value === undefined || value === "") {
    return { raw: null, code: null };
  }
  
  const str = String(value).trim();
  
  // If it's a number
  if (typeof value === "number") {
    return { raw: str, code: Math.floor(value) };
  }
  
  // Extract numeric part
  const numMatch = str.match(/^(\d+)/);
  if (numMatch) {
    return { raw: numMatch[1], code: parseInt(numMatch[1], 10) };
  }
  
  return { raw: str, code: null };
}

// Parse montant (amount) - handles various number formats
function parseMontant(value: any): number | null {
  if (value === null || value === undefined || value === "") return null;
  
  if (typeof value === "number") {
    return value;
  }
  
  const str = String(value)
    .trim()
    .replace(/\s/g, "") // Remove spaces (thousand separators)
    .replace(/\u00A0/g, "") // Remove non-breaking spaces
    .replace(/,/g, "."); // Convert comma to dot for decimals
  
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

// Clean and normalize string value
function cleanString(value: any): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str === "" ? null : str;
}

// Pad a number to a fixed width with leading zeros
function padCode(value: number | null, width: number): string | null {
  if (value === null || value === undefined) return null;
  return String(value).padStart(width, "0");
}

/**
 * RÈGLE CRITIQUE - SOURCE DE VÉRITÉ
 * Reconstruire TOUJOURS l'imputation à partir des composants pour éviter la perte de précision Excel.
 * 
 * Format 18 chiffres (standard avec Action):
 *   OS(2) + Action(2) + Activité(3) + SousActivité(2) + Direction(2) + NatureDépense(1) + NBE(6) = 18
 * 
 * Format 17 chiffres (sans Action):
 *   OS(2) + Activité(3) + SousActivité(2) + Direction(2) + NatureDépense(1) + NBE(6) = 16 → Non, avec Activité(3)+SousAct(3) = 17
 * 
 * Attention: ne JAMAIS importer l'imputation comme nombre car Excel convertit 18 chiffres en 1.10E+17
 */
function calculateImputation(
  osCode: number | null,
  actionCode: number | null,
  activiteCode: number | null,
  sousActiviteCode: number | null,
  directionCode: number | null,
  natureDepenseCode: number | null,
  nbeCode: string | null
): { imputation: string | null; format: "17" | "18" | null; errors: string[] } {
  const errors: string[] = [];
  
  // NBE is required and must be 6 digits
  if (!nbeCode) {
    errors.push("NBE absent ou invalide (6 chiffres requis)");
  } else if (nbeCode.length !== 6 || !/^\d{6}$/.test(nbeCode)) {
    errors.push(`NBE invalide: "${nbeCode}" (doit être 6 chiffres)`);
  }
  
  // OS is required
  if (osCode === null) {
    errors.push("OS manquant pour le calcul de l'imputation");
  }
  
  // Activité is required
  if (activiteCode === null) {
    errors.push("Activité manquante pour le calcul de l'imputation");
  }
  
  // Sous-activité is required
  if (sousActiviteCode === null) {
    errors.push("Sous-activité manquante pour le calcul de l'imputation");
  }
  
  // Direction is required
  if (directionCode === null) {
    errors.push("Direction manquante pour le calcul de l'imputation");
  }
  
  // Nature dépense is required
  if (natureDepenseCode === null) {
    errors.push("Nature dépense manquante pour le calcul de l'imputation");
  }
  
  // If there are errors, we can't calculate
  if (errors.length > 0) {
    return { imputation: null, format: null, errors };
  }
  
  // Build the imputation code
  const osPadded = padCode(osCode, 2)!;
  const activitePadded = padCode(activiteCode, 3)!;
  const sousActivitePadded = padCode(sousActiviteCode, 2)!; // 2 digits as per ARTI format
  const directionPadded = padCode(directionCode, 2)!;
  const naturePadded = padCode(natureDepenseCode, 1)!;
  const nbePadded = nbeCode!;
  
  if (actionCode !== null) {
    // Format 18 chiffres: OS(2) + Action(2) + Activité(3) + SousAct(2) + Direction(2) + Nature(1) + NBE(6) = 18
    const actionPadded = padCode(actionCode, 2)!;
    const imputation = `${osPadded}${actionPadded}${activitePadded}${sousActivitePadded}${directionPadded}${naturePadded}${nbePadded}`;
    return { imputation, format: "18", errors: [] };
  } else {
    // Format 16 chiffres (sans Action): OS(2) + Activité(3) + SousAct(2) + Direction(2) + Nature(1) + NBE(6) = 16
    const imputation = `${osPadded}${activitePadded}${sousActivitePadded}${directionPadded}${naturePadded}${nbePadded}`;
    return { imputation, format: "17", errors: [] };
  }
}

// Normalize imputation for comparison (remove spaces, dashes, leading zeros variations)
function normalizeImputation(imputation: string | null): string | null {
  if (!imputation) return null;
  // Remove all non-digit characters and trim
  return imputation.replace(/\D/g, "");
}

export function useExcelParser() {
  // Parse Excel file with merged cell support
  const parseExcelFile = useCallback(async (file: File): Promise<SheetData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { 
            type: "array",
            cellDates: true,
            cellNF: false,
            cellText: false,
          });
          
          const sheetsData: SheetData[] = workbook.SheetNames.map((name) => {
            const sheet = workbook.Sheets[name];
            
            // Handle merged cells by filling them
            if (sheet["!merges"]) {
              for (const merge of sheet["!merges"]) {
                const topLeftCell = XLSX.utils.encode_cell({ r: merge.s.r, c: merge.s.c });
                const topLeftValue = sheet[topLeftCell]?.v;
                
                // Fill all cells in the merged range
                for (let row = merge.s.r; row <= merge.e.r; row++) {
                  for (let col = merge.s.c; col <= merge.e.c; col++) {
                    const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
                    if (!sheet[cellRef]) {
                      sheet[cellRef] = { v: topLeftValue, t: sheet[topLeftCell]?.t || "s" };
                    }
                  }
                }
              }
            }
            
            const jsonData = XLSX.utils.sheet_to_json(sheet, { 
              header: 1,
              defval: null,
              blankrows: false,
            }) as any[][];
            
            // First row as headers
            let headers = (jsonData[0] || []).map((h: any) => {
              if (h === null || h === undefined) return "";
              return String(h).trim();
            });
            
            // Filter out total columns
            const nonTotalIndices: number[] = [];
            headers = headers.filter((h, idx) => {
              if (isTotalColumn(h)) {
                return false;
              }
              nonTotalIndices.push(idx);
              return true;
            });
            
            // Filter data to exclude total columns
            const filteredData = jsonData.map((row, rowIdx) => {
              if (rowIdx === 0) return headers;
              return nonTotalIndices.map(idx => row[idx]);
            });
            
            return {
              name,
              data: filteredData,
              headers,
            };
          });
          
          resolve(sheetsData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Erreur de lecture du fichier"));
      reader.readAsArrayBuffer(file);
    });
  }, []);

  // Auto-detect column mapping based on headers
  const autoDetectMapping = useCallback((headers: string[]): ColumnMapping => {
    const newMapping: ColumnMapping = {
      imputation: null,
      os: null,
      action: null,
      activite: null,
      sousActivite: null,
      direction: null,
      natureDépense: null,
      nbe: null,
      montant: null,
    };

    const mappingRules: { key: keyof ColumnMapping; patterns: RegExp[] }[] = [
      { key: "imputation", patterns: [/imputation/i, /code.*budg/i, /^ligne$/i, /code.*ligne/i] },
      { key: "os", patterns: [/^os$/i, /objectif.*strat/i, /o\.s\./i, /^os\s*\d*/i] },
      { key: "action", patterns: [/^action$/i, /^act$/i, /^action\s*\d*/i] },
      { key: "activite", patterns: [/^activit[ée]$/i, /^activ$/i, /^activit[ée]\s*\d*/i] },
      { key: "sousActivite", patterns: [/sous.*activ/i, /s\/activ/i, /sous-activ/i] },
      { key: "direction", patterns: [/^direction$/i, /^dir$/i, /^direction\s*\d*/i] },
      { key: "natureDépense", patterns: [/nature.*d[ée]pense/i, /^nature$/i, /type.*d[ée]pense/i] },
      { key: "nbe", patterns: [/^nbe$/i, /nomenclature/i, /nature.*[ée]co/i, /^n\.?b\.?e\.?$/i] },
      { key: "montant", patterns: [/montant/i, /dotation/i, /^budget$/i, /pr[ée]vision/i, /cr[ée]dit/i, /allocation/i] },
    ];

    headers.forEach((header) => {
      if (!header) return;
      for (const rule of mappingRules) {
        if (newMapping[rule.key] === null) {
          for (const pattern of rule.patterns) {
            if (pattern.test(header)) {
              newMapping[rule.key] = header;
              break;
            }
          }
        }
      }
    });

    return newMapping;
  }, []);

  // Extract and clean data from a row based on mapping
  const extractRowData = useCallback((
    row: any[],
    headers: string[],
    mapping: ColumnMapping,
    rowNumber: number
  ): ParsedRow => {
    const getColIndex = (mappedValue: string | null): number => 
      mappedValue ? headers.indexOf(mappedValue) : -1;

    const getCellValue = (colName: string | null): any => {
      const idx = getColIndex(colName);
      return idx >= 0 ? row[idx] : null;
    };

    const errors: string[] = [];
    const warnings: string[] = [];

    // Extract raw values
    const rawImputation = cleanString(getCellValue(mapping.imputation));
    const rawOs = cleanString(getCellValue(mapping.os));
    const rawAction = cleanString(getCellValue(mapping.action));
    const rawActivite = cleanString(getCellValue(mapping.activite));
    const rawSousActivite = cleanString(getCellValue(mapping.sousActivite));
    const rawDirection = cleanString(getCellValue(mapping.direction));
    const rawNatureDepense = cleanString(getCellValue(mapping.natureDépense));
    const rawNbe = cleanString(getCellValue(mapping.nbe));
    const rawMontant = cleanString(getCellValue(mapping.montant));

    // Compute cleaned values
    const osResult = parseToIntegerCode(rawOs);
    const actionResult = parseToIntegerCode(rawAction);
    const activiteResult = parseToIntegerCode(rawActivite);
    const sousActiviteResult = parseToIntegerCode(rawSousActivite);
    const directionResult = parseToIntegerCode(rawDirection);
    const natureDepenseCode = extractNumericCode(rawNatureDepense);
    const nbeCode = extractNBECode(rawNbe);
    const montant = parseMontant(rawMontant);

    // Calculate the imputation based on business rules
    const imputationCalc = calculateImputation(
      osResult.code,
      actionResult.code,
      activiteResult.code,
      sousActiviteResult.code,
      directionResult.code,
      natureDepenseCode,
      nbeCode
    );

    // Add imputation calculation errors
    imputationCalc.errors.forEach(err => errors.push(err));

    // Validate montant
    if (rawMontant !== null && montant === null) {
      errors.push(`Montant invalide: "${rawMontant}"`);
    }

    if (montant !== null && montant < 0) {
      errors.push(`Montant négatif: ${montant} FCFA`);
    }

    // Cross-validation: compare raw imputation with calculated imputation
    let finalImputation = imputationCalc.imputation;
    
    if (rawImputation && imputationCalc.imputation) {
      const normalizedRaw = normalizeImputation(rawImputation);
      const normalizedCalc = normalizeImputation(imputationCalc.imputation);
      
      if (normalizedRaw !== normalizedCalc) {
        errors.push(`Imputation mismatch: fichier="${rawImputation}" vs calculée="${imputationCalc.imputation}"`);
      }
      // Use raw imputation if provided (as reference)
      finalImputation = rawImputation;
    } else if (rawImputation && !imputationCalc.imputation) {
      // Use raw imputation if we couldn't calculate
      finalImputation = rawImputation;
      warnings.push("Imputation calculée impossible - utilisation de la valeur du fichier");
    } else if (!rawImputation && !imputationCalc.imputation) {
      errors.push("Aucune imputation disponible (fichier ou calculée)");
    }

    return {
      rowNumber,
      raw: {
        imputation: rawImputation,
        os: rawOs,
        action: rawAction,
        activite: rawActivite,
        sousActivite: rawSousActivite,
        direction: rawDirection,
        natureDepense: rawNatureDepense,
        nbe: rawNbe,
        montant: rawMontant,
      },
      computed: {
        imputation: finalImputation,
        calculatedImputation: imputationCalc.imputation,
        imputationFormat: imputationCalc.format,
        osCode: osResult.code,
        actionCode: actionResult.code,
        activiteCode: activiteResult.code,
        sousActiviteCode: sousActiviteResult.code,
        directionCode: directionResult.code,
        natureDepenseCode,
        nbeCode,
        montant,
      },
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }, []);

  // Parse all rows from a sheet
  const parseSheetData = useCallback((
    sheet: SheetData,
    mapping: ColumnMapping
  ): ParsedRow[] => {
    const dataRows = sheet.data.slice(1); // Skip header row
    
    return dataRows
      .map((row, idx) => {
        // Skip completely empty rows
        if (!row || row.every(cell => cell === null || cell === undefined || cell === "")) {
          return null;
        }
        return extractRowData(row, sheet.headers, mapping, idx + 2); // +2 for 1-based index + header
      })
      .filter((row): row is ParsedRow => row !== null);
  }, [extractRowData]);

  return {
    parseExcelFile,
    autoDetectMapping,
    extractRowData,
    parseSheetData,
    isTotalColumn,
    calculateImputation,
  };
}
