import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { toast } from "sonner";

export interface DoublonItem {
  id: string;
  type: "reference" | "objet" | "montant_date" | "prestataire";
  entite: string;
  reference: string;
  objet: string;
  montant: number;
  date: string;
  prestataire?: string;
  score: number;
  groupId: string;
  statut: "nouveau" | "ignore" | "verifie" | "fusionne";
}

export interface DoublonGroup {
  groupId: string;
  type: DoublonItem["type"];
  items: DoublonItem[];
  similarityScore: number;
}

// Simple Levenshtein distance for similarity
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

function similarityScore(a: string, b: string): number {
  if (!a || !b) return 0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 100;
  const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase());
  return Math.round((1 - distance / maxLen) * 100);
}

export function useDoublonsDetection() {
  const { exercice } = useExercice();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["doublons-detection", exercice],
    queryFn: async (): Promise<DoublonGroup[]> => {
      const groups: DoublonGroup[] = [];
      
      // 1. Fetch engagements for duplicate detection
      const { data: engagements, error: engError } = await supabase
        .from("budget_engagements")
        .select("id, numero, objet, montant, date_engagement, fournisseur")
        .eq("exercice", exercice);
      
      if (engError) throw engError;

      // 2. Fetch notes for duplicate detection
      const { data: notes, error: notesError } = await supabase
        .from("notes_dg")
        .select("id, numero, objet, montant")
        .eq("exercice", exercice);
      
      if (notesError) throw notesError;

      // 3. Detect duplicates by reference (numero)
      const referenceMap = new Map<string, DoublonItem[]>();
      
      [...(engagements || []), ...(notes || [])].forEach((item: any) => {
        if (!item.numero) return;
        const key = item.numero.toLowerCase().trim();
        if (!referenceMap.has(key)) {
          referenceMap.set(key, []);
        }
        referenceMap.get(key)!.push({
          id: item.id,
          type: "reference",
          entite: item.fournisseur ? "Engagement" : "Note",
          reference: item.numero,
          objet: item.objet || "",
          montant: item.montant || 0,
          date: item.date_engagement || "",
          prestataire: item.fournisseur,
          score: 100,
          groupId: `ref-${key}`,
          statut: "nouveau",
        });
      });

      referenceMap.forEach((items, key) => {
        if (items.length > 1) {
          groups.push({
            groupId: `ref-${key}`,
            type: "reference",
            items,
            similarityScore: 100,
          });
        }
      });

      // 4. Detect duplicates by montant + date
      const montantDateMap = new Map<string, DoublonItem[]>();
      
      (engagements || []).forEach((eng: any) => {
        if (!eng.montant || !eng.date_engagement) return;
        const key = `${eng.montant}-${eng.date_engagement}`;
        if (!montantDateMap.has(key)) {
          montantDateMap.set(key, []);
        }
        montantDateMap.get(key)!.push({
          id: eng.id,
          type: "montant_date",
          entite: "Engagement",
          reference: eng.numero || "",
          objet: eng.objet || "",
          montant: eng.montant,
          date: eng.date_engagement,
          prestataire: eng.fournisseur,
          score: 100,
          groupId: `md-${key}`,
          statut: "nouveau",
        });
      });

      montantDateMap.forEach((items, key) => {
        if (items.length > 1) {
          groups.push({
            groupId: `md-${key}`,
            type: "montant_date",
            items,
            similarityScore: 100,
          });
        }
      });

      // 5. Detect similar objects (using Levenshtein)
      const engList = engagements || [];
      const similarObjectGroups: DoublonItem[][] = [];
      const processed = new Set<string>();

      for (let i = 0; i < engList.length; i++) {
        if (processed.has(engList[i].id)) continue;
        
        const similar: DoublonItem[] = [{
          id: engList[i].id,
          type: "objet",
          entite: "Engagement",
          reference: engList[i].numero || "",
          objet: engList[i].objet || "",
          montant: engList[i].montant || 0,
          date: engList[i].date_engagement || "",
          prestataire: engList[i].fournisseur,
          score: 100,
          groupId: `obj-${engList[i].id}`,
          statut: "nouveau",
        }];

        for (let j = i + 1; j < engList.length; j++) {
          if (processed.has(engList[j].id)) continue;
          
          const score = similarityScore(engList[i].objet || "", engList[j].objet || "");
          if (score >= 80) {
            similar.push({
              id: engList[j].id,
              type: "objet",
              entite: "Engagement",
              reference: engList[j].numero || "",
              objet: engList[j].objet || "",
              montant: engList[j].montant || 0,
              date: engList[j].date_engagement || "",
              prestataire: engList[j].fournisseur,
              score,
              groupId: `obj-${engList[i].id}`,
              statut: "nouveau",
            });
            processed.add(engList[j].id);
          }
        }

        if (similar.length > 1) {
          processed.add(engList[i].id);
          similarObjectGroups.push(similar);
        }
      }

      similarObjectGroups.forEach((items, idx) => {
        const avgScore = Math.round(items.reduce((sum, i) => sum + i.score, 0) / items.length);
        groups.push({
          groupId: `obj-group-${idx}`,
          type: "objet",
          items: items.map(i => ({ ...i, groupId: `obj-group-${idx}` })),
          similarityScore: avgScore,
        });
      });

      // 6. Detect duplicates by prestataire + montant
      const prestataireMap = new Map<string, DoublonItem[]>();
      
      (engagements || []).forEach((eng: any) => {
        if (!eng.fournisseur || !eng.montant) return;
        const key = `${eng.fournisseur.toLowerCase().trim()}-${eng.montant}`;
        if (!prestataireMap.has(key)) {
          prestataireMap.set(key, []);
        }
        prestataireMap.get(key)!.push({
          id: eng.id,
          type: "prestataire",
          entite: "Engagement",
          reference: eng.numero || "",
          objet: eng.objet || "",
          montant: eng.montant,
          date: eng.date_engagement || "",
          prestataire: eng.fournisseur,
          score: 100,
          groupId: `prest-${key}`,
          statut: "nouveau",
        });
      });

      prestataireMap.forEach((items, key) => {
        if (items.length > 1) {
          groups.push({
            groupId: `prest-${key}`,
            type: "prestataire",
            items,
            similarityScore: 100,
          });
        }
      });

      return groups.sort((a, b) => b.similarityScore - a.similarityScore);
    },
    enabled: !!exercice,
  });

  const markAsVerified = useMutation({
    mutationFn: async (groupId: string) => {
      // TODO: save to a doublons_verifies table
      toast.success("Groupe marqué comme vérifié");
      return groupId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doublons-detection", exercice] });
    },
  });

  const ignoreGroup = useMutation({
    mutationFn: async (groupId: string) => {
      // TODO: persist ignored groups
      toast.info("Groupe ignoré");
      return groupId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doublons-detection", exercice] });
    },
  });

  return {
    doublons: data || [],
    isLoading,
    error,
    markAsVerified,
    ignoreGroup,
    stats: {
      total: data?.length || 0,
      byReference: data?.filter(g => g.type === "reference").length || 0,
      byObjet: data?.filter(g => g.type === "objet").length || 0,
      byMontantDate: data?.filter(g => g.type === "montant_date").length || 0,
      byPrestataire: data?.filter(g => g.type === "prestataire").length || 0,
    },
  };
}

export default useDoublonsDetection;
