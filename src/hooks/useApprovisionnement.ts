import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { useAuditLog } from "@/hooks/useAuditLog";
import { toast } from "sonner";

// Types
export interface Article {
  id: string;
  code: string;
  libelle: string;
  description?: string;
  unite: string;
  categorie?: string;
  seuil_mini: number;
  stock_actuel: number;
  prix_unitaire_moyen?: number;
  emplacement?: string;
  est_actif: boolean;
  created_at: string;
}

export interface DemandeAchat {
  id: string;
  numero: string;
  date_demande: string;
  objet: string;
  justification?: string;
  urgence: string;
  statut: string;
  dossier_id?: string;
  engagement_id?: string;
  direction_id?: string;
  montant_estime?: number;
  exercice: number;
  created_at: string;
  direction?: { label: string; code: string };
  lignes?: DemandeAchatLigne[];
}

export interface DemandeAchatLigne {
  id: string;
  demande_id: string;
  article_id?: string;
  designation: string;
  quantite: number;
  unite: string;
  prix_unitaire_estime?: number;
  article?: Article;
}

export interface Reception {
  id: string;
  numero: string;
  date_reception: string;
  demande_id?: string;
  fournisseur?: string;
  numero_bl?: string;
  numero_facture?: string;
  observations?: string;
  statut: string;
  exercice: number;
  created_at: string;
  demande?: DemandeAchat;
  lignes?: ReceptionLigne[];
}

export interface ReceptionLigne {
  id: string;
  reception_id: string;
  article_id: string;
  quantite_commandee: number;
  quantite_recue: number;
  quantite_acceptee?: number;
  ecart: number;
  motif_ecart?: string;
  prix_unitaire?: number;
  article?: Article;
}

export interface MouvementStock {
  id: string;
  numero: string;
  date_mouvement: string;
  type_mouvement: "entree" | "sortie" | "transfert" | "ajustement";
  article_id: string;
  quantite: number;
  stock_avant: number;
  stock_apres: number;
  motif: string;
  reference_document?: string;
  reception_id?: string;
  demande_id?: string;
  destination?: string;
  beneficiaire?: string;
  exercice: number;
  created_at: string;
  created_by?: string;
  article?: Article;
  creator?: { full_name: string };
}

export interface Inventaire {
  id: string;
  numero: string;
  date_inventaire: string;
  libelle: string;
  observations?: string;
  statut: string;
  exercice: number;
  created_at: string;
  cloture_at?: string;
  lignes?: InventaireLigne[];
}

export interface InventaireLigne {
  id: string;
  inventaire_id: string;
  article_id: string;
  stock_theorique: number;
  stock_physique?: number;
  ecart: number;
  justification?: string;
  ajustement_effectue: boolean;
  article?: Article;
}

// Constantes
export const UNITES = [
  "unité",
  "pièce",
  "kg",
  "litre",
  "mètre",
  "m²",
  "m³",
  "carton",
  "paquet",
  "boîte",
  "ramette",
  "lot",
];

export const CATEGORIES_ARTICLES = [
  "Fournitures de bureau",
  "Consommables informatiques",
  "Matériel informatique",
  "Mobilier",
  "Produits d'entretien",
  "Matériel électrique",
  "Outillage",
  "Pièces détachées",
  "Autres",
];

export const TYPES_MOUVEMENTS = [
  { value: "entree", label: "Entrée", color: "text-green-600" },
  { value: "sortie", label: "Sortie", color: "text-red-600" },
  { value: "transfert", label: "Transfert", color: "text-blue-600" },
  { value: "ajustement", label: "Ajustement", color: "text-orange-600" },
];

export function useApprovisionnement() {
  const { exercice } = useExercice();
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();

  // ==================== ARTICLES ====================
  const { data: articles = [], isLoading: loadingArticles } = useQuery({
    queryKey: ["articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("code");
      if (error) throw error;
      return data as Article[];
    },
  });

  const createArticle = useMutation({
    mutationFn: async (article: { code: string; libelle: string; description?: string; unite?: string; categorie?: string; seuil_mini?: number; emplacement?: string }) => {
      const { data, error } = await supabase
        .from("articles")
        .insert([{ ...article, unite: article.unite || "unité" }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      logAction({
        entityType: "article",
        entityId: data.id,
        action: "create",
        newValues: data,
      });
      toast.success("Article créé avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateArticle = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Article> & { id: string }) => {
      const { data, error } = await supabase
        .from("articles")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast.success("Article mis à jour");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // ==================== DEMANDES D'ACHAT ====================
  const { data: demandesAchat = [], isLoading: loadingDemandes } = useQuery({
    queryKey: ["demandes-achat", exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("demandes_achat")
        .select(`
          *,
          direction:directions(label, code),
          lignes:demande_achat_lignes(*, article:articles(*))
        `)
        .eq("exercice", exercice)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DemandeAchat[];
    },
  });

  const createDemandeAchat = useMutation({
    mutationFn: async ({
      demande,
      lignes,
    }: {
      demande: { objet: string; justification?: string; urgence?: string; direction_id?: string | null; montant_estime?: number };
      lignes: { designation: string; quantite?: number; unite?: string; article_id?: string | null; prix_unitaire_estime?: number | null }[];
    }) => {
      const { data: newDemande, error: demandeError } = await supabase
        .from("demandes_achat")
        .insert([{ objet: demande.objet, justification: demande.justification, urgence: demande.urgence || "normale", direction_id: demande.direction_id, montant_estime: demande.montant_estime, exercice } as never])
        .select()
        .single();
      if (demandeError) throw demandeError;

      if (lignes.length > 0) {
        const lignesWithDemande = lignes.map((l) => ({
          demande_id: newDemande.id,
          designation: l.designation,
          quantite: l.quantite || 1,
          unite: l.unite || "unité",
          article_id: l.article_id || null,
          prix_unitaire_estime: l.prix_unitaire_estime || null,
        }));
        const { error: lignesError } = await supabase
          .from("demande_achat_lignes")
          .insert(lignesWithDemande);
        if (lignesError) throw lignesError;
      }

      return newDemande;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["demandes-achat"] });
      logAction({
        entityType: "demande_achat",
        entityId: data.id,
        action: "create",
        newValues: data,
      });
      toast.success(`Demande ${data.numero} créée`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateDemandeStatut = useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: string }) => {
      const updates: Record<string, unknown> = { statut, updated_at: new Date().toISOString() };
      if (statut === "validee") {
        updates.validated_at = new Date().toISOString();
      }
      const { data, error } = await supabase
        .from("demandes_achat")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demandes-achat"] });
      toast.success("Statut mis à jour");
    },
  });

  // ==================== RECEPTIONS ====================
  const { data: receptions = [], isLoading: loadingReceptions } = useQuery({
    queryKey: ["receptions", exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receptions")
        .select(`
          *,
          lignes:reception_lignes(*, article:articles(*))
        `)
        .eq("exercice", exercice)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Reception[];
    },
  });

  const createReception = useMutation({
    mutationFn: async ({
      reception,
      lignes,
    }: {
      reception: { fournisseur?: string; numero_bl?: string; numero_facture?: string; observations?: string };
      lignes: { article_id: string; quantite_recue: number; quantite_acceptee?: number; prix_unitaire?: number | null }[];
    }) => {
      const { data: newReception, error: recError } = await supabase
        .from("receptions")
        .insert([{ fournisseur: reception.fournisseur, numero_bl: reception.numero_bl, numero_facture: reception.numero_facture, observations: reception.observations, exercice } as never])
        .select()
        .single();
      if (recError) throw recError;

      if (lignes.length > 0) {
        const lignesWithReception = lignes.map((l) => ({
          reception_id: newReception.id,
          article_id: l.article_id,
          quantite_recue: l.quantite_recue,
          quantite_acceptee: l.quantite_acceptee || l.quantite_recue,
          prix_unitaire: l.prix_unitaire || null,
        }));
        const { error: lignesError } = await supabase
          .from("reception_lignes")
          .insert(lignesWithReception);
        if (lignesError) throw lignesError;
      }

      return newReception;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["receptions"] });
      logAction({
        entityType: "reception",
        entityId: data.id,
        action: "create",
        newValues: data,
      });
      toast.success(`Réception ${data.numero} créée`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const validateReception = useMutation({
    mutationFn: async (receptionId: string) => {
      // Get reception with lines
      const { data: reception, error: fetchError } = await supabase
        .from("receptions")
        .select(`*, lignes:reception_lignes(*)`)
        .eq("id", receptionId)
        .single();
      if (fetchError) throw fetchError;

      // Create stock movements for each line
      for (const ligne of reception.lignes || []) {
        const { data: article } = await supabase
          .from("articles")
          .select("stock_actuel")
          .eq("id", ligne.article_id)
          .single();

        const stockAvant = article?.stock_actuel || 0;
        const quantiteAcceptee = ligne.quantite_acceptee || ligne.quantite_recue;

        await supabase.from("mouvements_stock").insert([{
          type_mouvement: "entree",
          article_id: ligne.article_id,
          quantite: quantiteAcceptee,
          stock_avant: stockAvant,
          stock_apres: stockAvant + quantiteAcceptee,
          motif: `Réception ${reception.numero}`,
          reception_id: receptionId,
          reference_document: reception.numero_bl || reception.numero,
          exercice,
        } as never]);
      }

      // Update reception status
      const { data, error } = await supabase
        .from("receptions")
        .update({
          statut: "validee",
          validated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", receptionId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receptions"] });
      queryClient.invalidateQueries({ queryKey: ["mouvements-stock"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast.success("Réception validée et stock mis à jour");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // ==================== MOUVEMENTS STOCK ====================
  const { data: mouvements = [], isLoading: loadingMouvements } = useQuery({
    queryKey: ["mouvements-stock", exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mouvements_stock")
        .select(`
          *,
          article:articles(code, libelle, unite),
          creator:profiles!mouvements_stock_created_by_fkey(full_name)
        `)
        .eq("exercice", exercice)
        .order("date_mouvement", { ascending: false });
      if (error) throw error;
      return data as MouvementStock[];
    },
  });

  const createMouvement = useMutation({
    mutationFn: async (mouvement: {
      type_mouvement: "entree" | "sortie" | "transfert" | "ajustement";
      article_id: string;
      quantite: number;
      motif: string;
      reference_document?: string;
      destination?: string;
      beneficiaire?: string;
    }) => {
      // Get current stock
      const { data: article, error: articleError } = await supabase
        .from("articles")
        .select("stock_actuel")
        .eq("id", mouvement.article_id)
        .single();
      if (articleError) throw articleError;

      const stockAvant = article.stock_actuel || 0;
      let stockApres = stockAvant;

      if (mouvement.type_mouvement === "entree") {
        stockApres = stockAvant + mouvement.quantite;
      } else if (mouvement.type_mouvement === "sortie") {
        if (mouvement.quantite > stockAvant) {
          throw new Error("Stock insuffisant pour cette sortie");
        }
        stockApres = stockAvant - mouvement.quantite;
      } else if (mouvement.type_mouvement === "ajustement") {
        stockApres = mouvement.quantite; // quantite = nouveau stock
      }

      const { data, error } = await supabase
        .from("mouvements_stock")
        .insert([
          {
            ...mouvement,
            stock_avant: stockAvant,
            stock_apres: stockApres,
            exercice,
          } as never,
        ])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["mouvements-stock"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      logAction({
        entityType: "mouvement_stock",
        entityId: data.id,
        action: "create",
        newValues: data,
      });
      toast.success(`Mouvement ${data.numero} enregistré`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // ==================== INVENTAIRES ====================
  const { data: inventaires = [], isLoading: loadingInventaires } = useQuery({
    queryKey: ["inventaires", exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventaires")
        .select(`
          *,
          lignes:inventaire_lignes(*, article:articles(*))
        `)
        .eq("exercice", exercice)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Inventaire[];
    },
  });

  const createInventaire = useMutation({
    mutationFn: async (inventaire: { libelle: string; observations?: string }) => {
      // Create inventaire
      const { data: newInv, error: invError } = await supabase
        .from("inventaires")
        .insert([{ ...inventaire, exercice } as never])
        .select()
        .single();
      if (invError) throw invError;

      // Get all active articles and create lines
      const { data: allArticles } = await supabase
        .from("articles")
        .select("id, stock_actuel")
        .eq("est_actif", true);

      if (allArticles && allArticles.length > 0) {
        const lignes = allArticles.map((art) => ({
          inventaire_id: newInv.id,
          article_id: art.id,
          stock_theorique: art.stock_actuel || 0,
        }));
        await supabase.from("inventaire_lignes").insert(lignes);
      }

      return newInv;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["inventaires"] });
      toast.success(`Inventaire ${data.numero} créé avec ${articles.length} articles`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateInventaireLigne = useMutation({
    mutationFn: async ({
      id,
      stock_physique,
      justification,
    }: {
      id: string;
      stock_physique: number;
      justification?: string;
    }) => {
      const { data, error } = await supabase
        .from("inventaire_lignes")
        .update({ stock_physique, justification, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventaires"] });
    },
  });

  const applyInventaireAdjustments = useMutation({
    mutationFn: async (inventaireId: string) => {
      const { data: inventaire, error: fetchError } = await supabase
        .from("inventaires")
        .select(`*, lignes:inventaire_lignes(*)`)
        .eq("id", inventaireId)
        .single();
      if (fetchError) throw fetchError;

      // Apply adjustments for lines with differences
      for (const ligne of inventaire.lignes || []) {
        if (ligne.stock_physique !== null && ligne.ecart !== 0 && !ligne.ajustement_effectue) {
          const { data: article } = await supabase
            .from("articles")
            .select("stock_actuel")
            .eq("id", ligne.article_id)
            .single();

          await supabase.from("mouvements_stock").insert([
            {
              type_mouvement: "ajustement",
              article_id: ligne.article_id,
              quantite: ligne.stock_physique,
              stock_avant: article?.stock_actuel || 0,
              stock_apres: ligne.stock_physique,
              motif: `Ajustement inventaire ${inventaire.numero}${ligne.justification ? `: ${ligne.justification}` : ""}`,
              reference_document: inventaire.numero,
              exercice,
            } as never,
          ]);

          await supabase
            .from("inventaire_lignes")
            .update({ ajustement_effectue: true })
            .eq("id", ligne.id);
        }
      }

      // Close inventaire
      const { data, error } = await supabase
        .from("inventaires")
        .update({
          statut: "cloture",
          cloture_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", inventaireId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventaires"] });
      queryClient.invalidateQueries({ queryKey: ["mouvements-stock"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast.success("Ajustements appliqués et inventaire clôturé");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Stats
  const stats = {
    totalArticles: articles.length,
    articlesActifs: articles.filter((a) => a.est_actif).length,
    articlesSousSeuil: articles.filter((a) => a.stock_actuel <= a.seuil_mini).length,
    demandesEnCours: demandesAchat.filter((d) => d.statut === "soumise").length,
    receptionsEnAttente: receptions.filter((r) => r.statut === "brouillon").length,
    mouvementsMois: mouvements.filter((m) => {
      const date = new Date(m.date_mouvement);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length,
  };

  return {
    // Articles
    articles,
    loadingArticles,
    createArticle,
    updateArticle,
    // Demandes
    demandesAchat,
    loadingDemandes,
    createDemandeAchat,
    updateDemandeStatut,
    // Receptions
    receptions,
    loadingReceptions,
    createReception,
    validateReception,
    // Mouvements
    mouvements,
    loadingMouvements,
    createMouvement,
    // Inventaires
    inventaires,
    loadingInventaires,
    createInventaire,
    updateInventaireLigne,
    applyInventaireAdjustments,
    // Stats
    stats,
  };
}
