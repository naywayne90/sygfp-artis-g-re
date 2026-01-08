import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";

export type DocType = 
  | "ENG" 
  | "LIQ" 
  | "ORD" 
  | "PAY" 
  | "DOSSIER" 
  | "MARCHE" 
  | "CONTRAT"
  | "AEF"
  | "SEF"
  | "EB"
  | "DA"
  | "VIR";

interface SequenceResult {
  prefix: string;
  year: number;
  number_raw: number;
  number_padded: string;
  full_code: string;
}

export const useSequenceGenerator = () => {
  const { exercice } = useExercice();

  const getNextSequence = useCallback(async (
    docType: DocType,
    directionCode?: string,
    scope: "global" | "direction" = "global"
  ): Promise<SequenceResult> => {
    const { data, error } = await supabase.rpc("get_next_sequence", {
      p_doc_type: docType,
      p_exercice: exercice,
      p_direction_code: directionCode || null,
      p_scope: scope,
    });

    if (error) {
      console.error("Error generating sequence:", error);
      throw new Error(`Erreur lors de la génération du code: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error("Aucune séquence générée");
    }

    return data[0] as SequenceResult;
  }, [exercice]);

  const syncSequenceFromImport = useCallback(async (
    docType: DocType,
    importedNumber: number,
    directionCode?: string,
    scope: "global" | "direction" = "global"
  ): Promise<boolean> => {
    const { data, error } = await supabase.rpc("sync_sequence_counter", {
      p_doc_type: docType,
      p_exercice: exercice,
      p_imported_number: importedNumber,
      p_direction_code: directionCode || null,
      p_scope: scope,
    });

    if (error) {
      console.error("Error syncing sequence:", error);
      return false;
    }

    return data === true;
  }, [exercice]);

  const parseExistingCode = useCallback(async (code: string): Promise<{
    prefix: string | null;
    year: number | null;
    number_raw: number | null;
  }> => {
    const { data, error } = await supabase.rpc("parse_sequence_code", {
      p_code: code,
    });

    if (error || !data || data.length === 0) {
      return { prefix: null, year: null, number_raw: null };
    }

    return data[0];
  }, []);

  // Generate code for a specific exercice (useful for imports)
  const getNextSequenceForExercice = useCallback(async (
    docType: DocType,
    targetExercice: number,
    directionCode?: string,
    scope: "global" | "direction" = "global"
  ): Promise<SequenceResult> => {
    const { data, error } = await supabase.rpc("get_next_sequence", {
      p_doc_type: docType,
      p_exercice: targetExercice,
      p_direction_code: directionCode || null,
      p_scope: scope,
    });

    if (error) {
      throw new Error(`Erreur lors de la génération du code: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error("Aucune séquence générée");
    }

    return data[0] as SequenceResult;
  }, []);

  return {
    getNextSequence,
    getNextSequenceForExercice,
    syncSequenceFromImport,
    parseExistingCode,
    currentExercice: exercice,
  };
};

export default useSequenceGenerator;
