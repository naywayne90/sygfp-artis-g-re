import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useExercice } from "@/contexts/ExerciceContext";
import { useAuditLog } from "@/hooks/useAuditLog";

export interface Dossier {
  id: string;
  numero: string;
  exercice: number;
  direction_id: string | null;
  objet: string;
  demandeur_id: string | null;
  montant_estime: number;
  montant_engage: number;
  montant_liquide: number;
  montant_ordonnance: number;
  statut_global: string;
  etape_courante: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  direction?: { code: string; label: string; sigle: string | null };
  demandeur?: { full_name: string | null; email: string };
}

export interface DossierEtape {
  id: string;
  dossier_id: string;
  type_etape: string;
  entity_id: string | null;
  statut: string;
  montant: number;
  commentaire: string | null;
  created_by: string | null;
  created_at: string;
  creator?: { full_name: string | null };
}

export interface DossierDocument {
  id: string;
  dossier_id: string;
  etape_id: string | null;
  type_document: string;
  categorie: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  uploaded_by: string | null;
  created_at: string;
  uploader?: { full_name: string | null };
}

export interface DossierFilters {
  search: string;
  direction_id: string;
  exercice: number | null;
  statut: string;
  etape: string;
}

export function useDossiers() {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [directions, setDirections] = useState<{ id: string; code: string; label: string; sigle: string | null }[]>([]);
  const { toast } = useToast();
  const { exercice } = useExercice();
  const { logAction } = useAuditLog();

  const fetchDossiers = async (filters?: DossierFilters) => {
    setLoading(true);
    try {
      let query = supabase
        .from("dossiers")
        .select(`
          *,
          direction:directions(code, label, sigle),
          demandeur:profiles!dossiers_demandeur_id_fkey(full_name, email)
        `)
        .order("created_at", { ascending: false });

      if (filters?.exercice) {
        query = query.eq("exercice", filters.exercice);
      } else if (exercice) {
        query = query.eq("exercice", exercice);
      }

      if (filters?.direction_id) {
        query = query.eq("direction_id", filters.direction_id);
      }

      if (filters?.statut) {
        query = query.eq("statut_global", filters.statut);
      }

      if (filters?.etape) {
        query = query.eq("etape_courante", filters.etape);
      }

      if (filters?.search) {
        query = query.or(`numero.ilike.%${filters.search}%,objet.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDossiers(data || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDirections = async () => {
    const { data } = await supabase
      .from("directions")
      .select("id, code, label, sigle")
      .eq("est_active", true)
      .order("label");
    setDirections(data || []);
  };

  const createDossier = async (dossier: {
    objet: string;
    direction_id?: string;
    demandeur_id?: string;
    montant_estime?: number;
  }) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      // Le numéro est généré automatiquement par le trigger
      const { data, error } = await supabase
        .from("dossiers")
        .insert({
          objet: dossier.objet,
          direction_id: dossier.direction_id || null,
          demandeur_id: dossier.demandeur_id || null,
          montant_estime: dossier.montant_estime || 0,
          exercice: exercice || new Date().getFullYear(),
          created_by: userData.user?.id,
        } as any)
        .select(`
          *,
          direction:directions(code, label, sigle),
          demandeur:profiles!dossiers_demandeur_id_fkey(full_name, email)
        `)
        .single();

      if (error) throw error;

      await logAction({
        entityType: "dossier",
        entityId: data.id,
        action: "create",
        newValues: { objet: data.objet, numero: data.numero } as any,
      });

      // Créer l'étape initiale (note)
      await supabase.from("dossier_etapes").insert({
        dossier_id: data.id,
        type_etape: "note",
        statut: "en_attente",
        created_by: userData.user?.id,
      } as any);

      toast({
        title: "Dossier créé",
        description: `Numéro: ${data.numero}`,
      });

      setDossiers((prev) => [data, ...prev]);
      return data;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateDossier = async (id: string, updates: Partial<Dossier>) => {
    try {
      const oldDossier = dossiers.find((d) => d.id === id);

      const { data, error } = await supabase
        .from("dossiers")
        .update(updates)
        .eq("id", id)
        .select(`
          *,
          direction:directions(code, label, sigle),
          demandeur:profiles!dossiers_demandeur_id_fkey(full_name, email)
        `)
        .single();

      if (error) throw error;

      await logAction({
        entityType: "dossier",
        entityId: id,
        action: "update",
        oldValues: oldDossier ? { objet: oldDossier.objet } as any : null,
        newValues: { objet: data.objet } as any,
      });

      setDossiers((prev) => prev.map((d) => (d.id === id ? data : d)));
      toast({ title: "Dossier mis à jour" });
      return data;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const getDossierById = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("dossiers")
        .select(`
          *,
          direction:directions(code, label, sigle),
          demandeur:profiles!dossiers_demandeur_id_fkey(full_name, email)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const getDossierEtapes = async (dossierId: string) => {
    try {
      const { data, error } = await supabase
        .from("dossier_etapes")
        .select(`
          *,
          creator:profiles!dossier_etapes_created_by_fkey(full_name)
        `)
        .eq("dossier_id", dossierId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return [];
    }
  };

  const addEtape = async (etape: {
    dossier_id: string;
    type_etape: string;
    entity_id?: string;
    statut?: string;
    montant?: number;
    commentaire?: string;
  }) => {
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("dossier_etapes")
        .insert([{
          ...etape,
          created_by: userData.user?.id,
        }])
        .select()
        .single();

      if (error) throw error;

      // Mettre à jour l'étape courante du dossier
      await supabase
        .from("dossiers")
        .update({ etape_courante: etape.type_etape })
        .eq("id", etape.dossier_id);

      await logAction({
        entityType: "dossier_etape",
        entityId: data.id,
        action: "create",
        newValues: data,
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const getDossierDocuments = async (dossierId: string) => {
    try {
      const { data, error } = await supabase
        .from("dossier_documents")
        .select(`
          *,
          uploader:profiles!dossier_documents_uploaded_by_fkey(full_name)
        `)
        .eq("dossier_id", dossierId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return [];
    }
  };

  const addDocument = async (doc: {
    dossier_id: string;
    etape_id?: string;
    type_document: string;
    categorie: string;
    file_name: string;
    file_path: string;
    file_size?: number;
    file_type?: string;
  }) => {
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("dossier_documents")
        .insert([{
          ...doc,
          uploaded_by: userData.user?.id,
        }])
        .select()
        .single();

      if (error) throw error;

      await logAction({
        entityType: "dossier_document",
        entityId: data.id,
        action: "create",
        newValues: { file_name: doc.file_name, categorie: doc.categorie },
      });

      toast({ title: "Document ajouté" });
      return data;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      const { error } = await supabase
        .from("dossier_documents")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await logAction({
        entityType: "dossier_document",
        entityId: id,
        action: "delete",
      });

      toast({ title: "Document supprimé" });
      return true;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchDossiers();
    fetchDirections();
  }, [exercice]);

  return {
    dossiers,
    loading,
    directions,
    fetchDossiers,
    createDossier,
    updateDossier,
    getDossierById,
    getDossierEtapes,
    addEtape,
    getDossierDocuments,
    addDocument,
    deleteDocument,
  };
}
