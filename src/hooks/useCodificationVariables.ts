import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface CodifVariable {
  id: string;
  key: string;
  label: string;
  description: string | null;
  source_table: string | null;
  source_field: string | null;
  format_type: string;
  pad_length: number;
  pad_char: string;
  pad_side: string;
  default_value: string | null;
  transform: string | null;
  is_system: boolean;
  est_active: boolean;
}

export interface PatternSegment {
  var_key: string;
  length?: number;
  required?: boolean;
  separator_after?: string;
}

export interface CodificationRuleExtended {
  id: string;
  code_type: string;
  objet: string;
  prefixe: string;
  format: string;
  format_numero: string;
  separateur: string;
  longueur_seq: number;
  reset_seq: 'par_exercice' | 'par_annee' | 'jamais';
  champs_contexte: string[];
  exemple: string;
  description: string;
  actif: boolean;
  pattern: PatternSegment[] | null;
  example_input: Record<string, string> | null;
  example_output: string | null;
  module: string | null;
  notes: string | null;
  version: number | null;
}

export function useCodificationVariables() {
  const queryClient = useQueryClient();
  const { exercice } = useExercice();

  const { data: variables = [], isLoading: loadingVariables } = useQuery({
    queryKey: ["codif-variables"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("codif_variables")
        .select("*")
        .order("key");
      if (error) throw error;
      return data as unknown as CodifVariable[];
    },
  });

  const { data: rules = [], isLoading: loadingRules } = useQuery({
    queryKey: ["codification-rules-extended"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ref_codification_rules")
        .select("*")
        .order("code_type");
      if (error) throw error;
      return (data || []).map(rule => ({
        ...rule,
        pattern: rule.pattern as unknown as PatternSegment[] | null,
        example_input: rule.example_input as unknown as Record<string, string> | null,
      })) as CodificationRuleExtended[];
    },
  });

  // Get active variables only
  const activeVariables = variables.filter(v => v.est_active);

  // Get rule for a module
  const getRuleForModule = (module: string) => {
    return rules.find(r => r.module === module && r.actif);
  };

  // Generate code from pattern using values
  const generateCodeFromValues = (
    pattern: PatternSegment[],
    values: Record<string, string>,
    currentExercice?: number
  ): { code: string; isValid: boolean; warnings: string[] } => {
    let code = '';
    const warnings: string[] = [];
    let isValid = true;

    for (const segment of pattern) {
      const variable = variables.find(v => v.key === segment.var_key);
      let value = values[segment.var_key] || '';

      // Handle special variables
      if (!value) {
        if (segment.var_key === 'EXERCICE') {
          value = String(currentExercice || exercice || new Date().getFullYear());
        } else if (segment.var_key === 'ANNEE') {
          value = String(new Date().getFullYear());
        } else if (segment.var_key === 'MOIS') {
          value = String(new Date().getMonth() + 1).padStart(2, '0');
        } else if (segment.required) {
          warnings.push(`Segment manquant: ${segment.var_key}`);
          isValid = false;
          value = '0'.repeat(segment.length || variable?.pad_length || 2);
        }
      }

      // Apply padding
      const padLength = segment.length || variable?.pad_length || 0;
      if (padLength > 0) {
        const padChar = variable?.pad_char || '0';
        if (variable?.pad_side === 'right') {
          value = value.padEnd(padLength, padChar);
        } else {
          value = value.padStart(padLength, padChar);
        }
      }

      code += value;

      // Add separator if defined
      if (segment.separator_after) {
        code += segment.separator_after;
      }
    }

    return { code, isValid, warnings };
  };

  // Test pattern with database function
  const testPatternWithDB = async (
    pattern: PatternSegment[],
    values: Record<string, string>,
    testExercice?: number
  ) => {
    const { data, error } = await supabase.rpc("test_codification_pattern", {
      p_pattern: pattern,
      p_values: values,
      p_exercice: testExercice || exercice,
    });

    if (error) throw error;
    return data?.[0] as { code: string; is_valid: boolean; segments: any[] } | null;
  };

  // Generate code using a rule ID
  const generateCodeFromRule = async (
    ruleId: string,
    values: Record<string, string>,
    currentExercice?: number
  ) => {
    const { data, error } = await supabase.rpc("generate_code_from_pattern", {
      p_rule_id: ruleId,
      p_values: values as unknown as Json,
      p_exercice: currentExercice || exercice,
    });

    if (error) throw error;
    return data?.[0] as { code: string; is_valid: boolean; warnings: string[] } | null;
  };

  // Update a variable
  const updateVariable = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CodifVariable> & { id: string }) => {
      const { data, error } = await supabase
        .from("codif_variables")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["codif-variables"] });
      toast.success("Variable mise à jour");
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Create a variable
  const createVariable = useMutation({
    mutationFn: async (variable: Omit<CodifVariable, 'id'>) => {
      const { data, error } = await supabase
        .from("codif_variables")
        .insert(variable)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["codif-variables"] });
      toast.success("Variable créée");
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Toggle variable activation
  const toggleVariable = useMutation({
    mutationFn: async ({ id, est_active }: { id: string; est_active: boolean }) => {
      const { data, error } = await supabase
        .from("codif_variables")
        .update({ est_active })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["codif-variables"] });
      toast.success(`Variable ${data.est_active ? 'activée' : 'désactivée'}`);
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Update rule pattern
  const updateRulePattern = useMutation({
    mutationFn: async ({ 
      id, 
      pattern, 
      example_input, 
      example_output, 
      notes 
    }: { 
      id: string; 
      pattern: PatternSegment[];
      example_input?: Record<string, string>;
      example_output?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("ref_codification_rules")
        .update({ 
          pattern: pattern as unknown as Json, 
          example_input: example_input as unknown as Json, 
          example_output, 
          notes,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["codification-rules-extended"] });
      queryClient.invalidateQueries({ queryKey: ["codification-rules"] });
      toast.success("Pattern mis à jour");
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  return {
    // Data
    variables,
    activeVariables,
    rules,

    // Loading states
    loadingVariables,
    loadingRules,

    // Functions
    getRuleForModule,
    generateCodeFromValues,
    generateCodeFromRule,
    testPatternWithDB,

    // Mutations
    updateVariable,
    createVariable,
    toggleVariable,
    updateRulePattern,
  };
}
