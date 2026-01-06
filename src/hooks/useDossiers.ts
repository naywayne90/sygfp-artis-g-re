import { useState, useEffect, useCallback } from "react";
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
  beneficiaire_id: string | null;
  type_dossier: string | null;
  montant_estime: number;
  montant_engage: number;
  montant_liquide: number;
  montant_ordonnance: number;
  statut_global: string;
  statut_paiement: string | null;
  etape_courante: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  direction?: { code: string; label: string; sigle: string | null };
  demandeur?: { full_name: string | null; email: string };
  beneficiaire?: { raison_sociale: string | null };
  creator?: { full_name: string | null };
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
  type_dossier: string;
  date_debut: string;
  date_fin: string;
  montant_min: number | null;
  montant_max: number | null;
  beneficiaire_id: string;
  created_by: string;
  en_retard: boolean;
}

export interface DossierStats {
  total: number;
  en_cours: number;
  termines: number;
  annules: number;
  suspendus: number;
  montant_total: number;
  montant_engage: number;
  montant_liquide: number;
  montant_paye: number;
}

const DEFAULT_FILTERS: DossierFilters = {
  search: "",
  direction_id: "",
  exercice: null,
  statut: "",
  etape: "",
  type_dossier: "",
  date_debut: "",
  date_fin: "",
  montant_min: null,
  montant_max: null,
  beneficiaire_id: "",
  created_by: "",
  en_retard: false,
};

export function useDossiers() {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [directions, setDirections] = useState<{ id: string; code: string; label: string; sigle: string | null }[]>([]);
  const [beneficiaires, setBeneficiaires] = useState<{ id: string; raison_sociale: string | null }[]>([]);
  const [users, setUsers] = useState<{ id: string; full_name: string | null; email: string }[]>([]);
  const [stats, setStats] = useState<DossierStats>({
    total: 0,
    en_cours: 0,
    termines: 0,
    annules: 0,
    suspendus: 0,
    montant_total: 0,
    montant_engage: 0,
    montant_liquide: 0,
    montant_paye: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
  });
  const { toast } = useToast();
  const { exercice } = useExercice();
  const { logAction } = useAuditLog();

  const fetchDossiers = useCallback(async (filters?: Partial<DossierFilters>, page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const appliedFilters = { ...DEFAULT_FILTERS, ...filters };
      
      let query = supabase
        .from("dossiers")
        .select(`
          *,
          direction:directions(code, label, sigle),
          demandeur:profiles!dossiers_demandeur_id_fkey(full_name, email),
          beneficiaire:prestataires!dossiers_beneficiaire_id_fkey(raison_sociale),
          creator:profiles!dossiers_created_by_fkey(full_name)
        `, { count: "exact" })
        .order("updated_at", { ascending: false });

      // Filtre exercice (priorité: filtre explicite > exercice courant)
      if (appliedFilters.exercice) {
        query = query.eq("exercice", appliedFilters.exercice);
      } else if (exercice) {
        query = query.eq("exercice", exercice);
      }

      // Direction
      if (appliedFilters.direction_id) {
        query = query.eq("direction_id", appliedFilters.direction_id);
      }

      // Statut
      if (appliedFilters.statut) {
        query = query.eq("statut_global", appliedFilters.statut);
      }

      // Étape
      if (appliedFilters.etape) {
        query = query.eq("etape_courante", appliedFilters.etape);
      }

      // Type dossier
      if (appliedFilters.type_dossier) {
        query = query.eq("type_dossier", appliedFilters.type_dossier);
      }

      // Bénéficiaire
      if (appliedFilters.beneficiaire_id) {
        query = query.eq("beneficiaire_id", appliedFilters.beneficiaire_id);
      }

      // Créateur
      if (appliedFilters.created_by) {
        query = query.eq("created_by", appliedFilters.created_by);
      }

      // Plage de dates
      if (appliedFilters.date_debut) {
        query = query.gte("created_at", appliedFilters.date_debut);
      }
      if (appliedFilters.date_fin) {
        query = query.lte("created_at", appliedFilters.date_fin + "T23:59:59");
      }

      // Fourchette de montant
      if (appliedFilters.montant_min !== null) {
        query = query.gte("montant_estime", appliedFilters.montant_min);
      }
      if (appliedFilters.montant_max !== null) {
        query = query.lte("montant_estime", appliedFilters.montant_max);
      }

      // Recherche globale (numéro, objet)
      if (appliedFilters.search) {
        const searchTerm = appliedFilters.search.toLowerCase();
        query = query.or(`numero.ilike.%${searchTerm}%,objet.ilike.%${searchTerm}%`);
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;
      
      setDossiers(data || []);
      setPagination({
        page,
        pageSize,
        total: count || 0,
      });

      // Calculer les stats
      calculateStats(data || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [exercice, toast]);

  const calculateStats = (data: Dossier[]) => {
    const newStats: DossierStats = {
      total: data.length,
      en_cours: data.filter((d) => d.statut_global === "en_cours").length,
      termines: data.filter((d) => d.statut_global === "termine").length,
      annules: data.filter((d) => d.statut_global === "annule").length,
      suspendus: data.filter((d) => d.statut_global === "suspendu").length,
      montant_total: data.reduce((sum, d) => sum + (d.montant_estime || 0), 0),
      montant_engage: data.reduce((sum, d) => sum + (d.montant_engage || 0), 0),
      montant_liquide: data.reduce((sum, d) => sum + (d.montant_liquide || 0), 0),
      montant_paye: data.reduce((sum, d) => sum + (d.montant_ordonnance || 0), 0),
    };
    setStats(newStats);
  };

  const fetchDirections = async () => {
    const { data } = await supabase
      .from("directions")
      .select("id, code, label, sigle")
      .eq("est_active", true)
      .order("label");
    setDirections(data || []);
  };

  const fetchBeneficiaires = async () => {
    const { data } = await supabase
      .from("prestataires")
      .select("id, raison_sociale")
      .eq("est_actif", true)
      .order("raison_sociale");
    setBeneficiaires(data || []);
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .order("full_name");
    setUsers(data || []);
  };

  const createDossier = async (dossier: {
    objet: string;
    direction_id?: string;
    demandeur_id?: string;
    beneficiaire_id?: string;
    type_dossier?: string;
    montant_estime?: number;
  }) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("dossiers")
        .insert({
          objet: dossier.objet,
          direction_id: dossier.direction_id || null,
          demandeur_id: dossier.demandeur_id || null,
          beneficiaire_id: dossier.beneficiaire_id || null,
          type_dossier: dossier.type_dossier || "AEF",
          montant_estime: dossier.montant_estime || 0,
          exercice: exercice || new Date().getFullYear(),
          created_by: userData.user?.id,
        } as any)
        .select(`
          *,
          direction:directions(code, label, sigle),
          demandeur:profiles!dossiers_demandeur_id_fkey(full_name, email),
          beneficiaire:prestataires!dossiers_beneficiaire_id_fkey(raison_sociale),
          creator:profiles!dossiers_created_by_fkey(full_name)
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
          demandeur:profiles!dossiers_demandeur_id_fkey(full_name, email),
          beneficiaire:prestataires!dossiers_beneficiaire_id_fkey(raison_sociale),
          creator:profiles!dossiers_created_by_fkey(full_name)
        `)
        .single();

      if (error) throw error;

      await logAction({
        entityType: "dossier",
        entityId: id,
        action: "update",
        oldValues: oldDossier ? { objet: oldDossier.objet, statut: oldDossier.statut_global } as any : null,
        newValues: { objet: data.objet, statut: data.statut_global } as any,
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

  const updateDossierStatus = async (id: string, statut: string) => {
    return updateDossier(id, { statut_global: statut } as any);
  };

  const getDossierById = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("dossiers")
        .select(`
          *,
          direction:directions(code, label, sigle),
          demandeur:profiles!dossiers_demandeur_id_fkey(full_name, email),
          beneficiaire:prestataires!dossiers_beneficiaire_id_fkey(raison_sociale),
          creator:profiles!dossiers_created_by_fkey(full_name)
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
    fetchBeneficiaires();
    fetchUsers();
  }, [exercice, fetchDossiers]);

  return {
    dossiers,
    loading,
    directions,
    beneficiaires,
    users,
    stats,
    pagination,
    fetchDossiers,
    createDossier,
    updateDossier,
    updateDossierStatus,
    getDossierById,
    getDossierEtapes,
    addEtape,
    getDossierDocuments,
    addDocument,
    deleteDocument,
    DEFAULT_FILTERS,
  };
}
