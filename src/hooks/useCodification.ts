import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { toast } from "sonner";

export interface CodificationRule {
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
}

export interface RefSequence {
  id: string;
  objet: string;
  scope_key: string;
  last_value: number;
}

export function useCodification() {
  const queryClient = useQueryClient();
  const { exercice } = useExercice();

  // Fetch all codification rules
  const { data: rules = [], isLoading: loadingRules } = useQuery({
    queryKey: ["codification-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ref_codification_rules")
        .select("*")
        .order("code_type");
      if (error) throw error;
      return data as CodificationRule[];
    },
  });

  // Fetch sequences for current exercise
  const { data: sequences = [], isLoading: loadingSequences } = useQuery({
    queryKey: ["ref-sequences", exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ref_sequences")
        .select("*")
        .ilike("scope_key", `%${exercice}%`)
        .order("objet");
      if (error) throw error;
      return data as RefSequence[];
    },
    enabled: !!exercice,
  });

  // Generate a unique code using the database function
  const generateCode = async (objet: string, options?: { 
    exercice?: number; 
    annee?: number; 
    mois?: number;
  }) => {
    const { data, error } = await supabase.rpc("generate_unique_code", {
      p_objet: objet,
      p_exercice: options?.exercice ?? exercice,
      p_annee: options?.annee,
      p_mois: options?.mois,
    });
    
    if (error) {
      console.error("Error generating code:", error);
      toast.error("Erreur lors de la génération du code");
      throw error;
    }
    
    return data as string;
  };

  // Test a codification rule (preview without incrementing)
  const testRule = async (ruleId: string, testExercice?: number) => {
    const { data, error } = await supabase.rpc("test_codification_rule", {
      p_rule_id: ruleId,
      p_exercice: testExercice ?? exercice,
    });
    
    if (error) throw error;
    return data as string;
  };

  // Check if a prefix is reserved
  const checkPrefixReserved = async (code: string) => {
    const { data, error } = await supabase.rpc("is_prefix_reserved", {
      p_code: code,
    });
    
    if (error) throw error;
    return data?.[0] as { is_reserved: boolean; reserved_for: string } | undefined;
  };

  // Update a rule
  const updateRule = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CodificationRule> & { id: string }) => {
      const { data, error } = await supabase
        .from("ref_codification_rules")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["codification-rules"] });
      toast.success("Règle mise à jour");
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Toggle rule activation
  const toggleRule = useMutation({
    mutationFn: async ({ id, actif }: { id: string; actif: boolean }) => {
      const { data, error } = await supabase
        .from("ref_codification_rules")
        .update({ actif })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["codification-rules"] });
      toast.success(`Règle ${data.actif ? 'activée' : 'désactivée'}`);
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Get rule for a specific object type
  const getRuleForObject = (objet: string) => {
    return rules.find(r => r.objet === objet || r.code_type === objet.toUpperCase());
  };

  // Get current sequence value for an object
  const getCurrentSequence = (objet: string) => {
    const rule = getRuleForObject(objet);
    if (!rule) return null;
    
    let scopeKey = rule.objet;
    if (rule.reset_seq === 'par_exercice' || rule.reset_seq === 'par_annee') {
      scopeKey = `${rule.objet}|${exercice}`;
    }
    
    return sequences.find(s => s.scope_key === scopeKey)?.last_value ?? 0;
  };

  // Preview next code without generating
  const previewNextCode = (objet: string) => {
    const rule = getRuleForObject(objet);
    if (!rule) return null;
    
    const currentSeq = getCurrentSequence(objet);
    const nextSeq = (currentSeq ?? 0) + 1;
    
    const year = exercice;
    const month = new Date().getMonth() + 1;
    
    let code = rule.prefixe + rule.separateur + year + rule.separateur + 
               String(nextSeq).padStart(rule.longueur_seq, '0');
    
    if (rule.champs_contexte?.includes('mois')) {
      code = rule.prefixe + rule.separateur + year + rule.separateur + 
             String(month).padStart(2, '0') + rule.separateur +
             String(nextSeq).padStart(rule.longueur_seq, '0');
    }
    
    if (rule.reset_seq === 'jamais' && !rule.champs_contexte?.includes('annee')) {
      code = rule.prefixe + rule.separateur + String(nextSeq).padStart(rule.longueur_seq, '0');
    }
    
    return code;
  };

  return {
    // Data
    rules,
    sequences,
    
    // Loading states
    loadingRules,
    loadingSequences,
    
    // Functions
    generateCode,
    testRule,
    checkPrefixReserved,
    getRuleForObject,
    getCurrentSequence,
    previewNextCode,
    
    // Mutations
    updateRule,
    toggleRule,
  };
}
