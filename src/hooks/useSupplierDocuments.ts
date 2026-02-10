import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SupplierDocument {
  id: string;
  supplier_id: string;
  type_document: string;
  numero: string | null;
  date_delivrance: string | null;
  date_expiration: string | null;
  fichier_path: string | null;
  fichier_nom: string | null;
  statut: "valide" | "a_renouveler" | "expire" | "manquant";
  rappel_jours: number;
  notes: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupplierBankAccount {
  id: string;
  supplier_id: string;
  banque: string;
  code_banque: string | null;
  code_guichet: string | null;
  numero_compte: string;
  cle_rib: string | null;
  iban: string | null;
  bic_swift: string | null;
  titulaire: string | null;
  est_principal: boolean;
  est_actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface RequiredDocumentType {
  id: string;
  code: string;
  libelle: string;
  description: string | null;
  est_obligatoire: boolean;
  a_date_expiration: boolean;
  rappel_jours_defaut: number;
  ordre_affichage: number;
  est_actif: boolean;
}

export function useSupplierDocuments(supplierId?: string) {
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery({
    queryKey: ["supplier-documents", supplierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplier_documents")
        .select("*")
        .eq("supplier_id", supplierId!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SupplierDocument[];
    },
    enabled: !!supplierId,
  });

  // Stats
  const stats = {
    total: documents?.length || 0,
    valide: documents?.filter((d) => d.statut === "valide").length || 0,
    aRenouveler: documents?.filter((d) => d.statut === "a_renouveler").length || 0,
    expire: documents?.filter((d) => d.statut === "expire").length || 0,
  };

  // Add document
  const addDocument = useMutation({
    mutationFn: async (data: { type_document: string; numero?: string; date_delivrance?: string; date_expiration?: string; statut?: string; notes?: string }) => {
      const { error } = await supabase.from("supplier_documents").insert({
        supplier_id: supplierId!,
        type_document: data.type_document,
        numero: data.numero,
        date_delivrance: data.date_delivrance,
        date_expiration: data.date_expiration,
        statut: data.statut || "valide",
        notes: data.notes,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-documents", supplierId] });
      toast.success("Document ajouté");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Update document
  const updateDocument = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SupplierDocument> }) => {
      const { error } = await supabase.from("supplier_documents").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-documents", supplierId] });
      toast.success("Document modifié");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Delete document
  const deleteDocument = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("supplier_documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-documents", supplierId] });
      toast.success("Document supprimé");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    documents,
    isLoading,
    stats,
    addDocument: addDocument.mutate,
    updateDocument: updateDocument.mutate,
    deleteDocument: deleteDocument.mutate,
  };
}

export function useSupplierBankAccounts(supplierId?: string) {
  const queryClient = useQueryClient();

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["supplier-bank-accounts", supplierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplier_bank_accounts")
        .select("*")
        .eq("supplier_id", supplierId!)
        .order("est_principal", { ascending: false });

      if (error) throw error;
      return data as SupplierBankAccount[];
    },
    enabled: !!supplierId,
  });

  const primaryAccount = accounts?.find((a) => a.est_principal);

  // Add account
  const addAccount = useMutation({
    mutationFn: async (data: { banque: string; numero_compte: string; cle_rib?: string; titulaire?: string; est_principal?: boolean }) => {
      const { error } = await supabase.from("supplier_bank_accounts").insert({
        supplier_id: supplierId!,
        banque: data.banque,
        numero_compte: data.numero_compte,
        cle_rib: data.cle_rib,
        titulaire: data.titulaire,
        est_principal: data.est_principal || false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-bank-accounts", supplierId] });
      toast.success("Compte bancaire ajouté");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Set as primary
  const setAsPrimary = useMutation({
    mutationFn: async (accountId: string) => {
      // Unset all as primary
      await supabase
        .from("supplier_bank_accounts")
        .update({ est_principal: false })
        .eq("supplier_id", supplierId!);

      // Set this one as primary
      const { error } = await supabase
        .from("supplier_bank_accounts")
        .update({ est_principal: true })
        .eq("id", accountId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-bank-accounts", supplierId] });
      toast.success("Compte principal défini");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Delete account
  const deleteAccount = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("supplier_bank_accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-bank-accounts", supplierId] });
      toast.success("Compte supprimé");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    accounts,
    primaryAccount,
    isLoading,
    addAccount: addAccount.mutate,
    setAsPrimary: setAsPrimary.mutate,
    deleteAccount: deleteAccount.mutate,
  };
}

export function useRequiredDocumentTypes() {
  const queryClient = useQueryClient();

  const { data: types, isLoading } = useQuery({
    queryKey: ["required-document-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplier_required_documents")
        .select("*")
        .order("ordre_affichage");

      if (error) throw error;
      return data as RequiredDocumentType[];
    },
  });

  // Update type
  const updateType = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<RequiredDocumentType> }) => {
      const { error } = await supabase.from("supplier_required_documents").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["required-document-types"] });
      toast.success("Type de document modifié");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    types,
    isLoading,
    updateType: updateType.mutate,
  };
}

export function useSupplierQualification(supplierId?: string) {
  // Check if supplier can be qualified
  const { data: qualification, isLoading, refetch } = useQuery({
    queryKey: ["supplier-qualification", supplierId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("can_qualify_supplier", {
        p_supplier_id: supplierId!,
      });

      if (error) throw error;
      return data as { can_qualify: boolean; missing_documents: string[]; expired_documents: string[] };
    },
    enabled: !!supplierId,
  });

  return {
    canQualify: qualification?.can_qualify ?? false,
    missingDocuments: qualification?.missing_documents ?? [],
    expiredDocuments: qualification?.expired_documents ?? [],
    isLoading,
    refetch,
  };
}

export function useSupplierExpiredDocuments() {
  // Get all expired/soon-to-expire documents across all suppliers
  const { data, isLoading } = useQuery({
    queryKey: ["supplier-expired-documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplier_documents")
        .select(`
          *,
          prestataires!inner(id, code, raison_sociale, statut)
        `)
        .in("statut", ["expire", "a_renouveler"])
        .order("date_expiration");

      if (error) throw error;
      return data;
    },
  });

  const stats = {
    expired: data?.filter((d) => d.statut === "expire").length || 0,
    toRenew: data?.filter((d) => d.statut === "a_renouveler").length || 0,
  };

  return { documents: data, stats, isLoading };
}

export function useSupplierFinancials(supplierId?: string) {
  // Get all financial operations linked to this supplier
  const { data, isLoading } = useQuery({
    queryKey: ["supplier-financials", supplierId],
    queryFn: async () => {
      const [engagements, _liquidations, ordonnancements] = await Promise.all([
        supabase
          .from("budget_engagements")
          .select("id, numero, montant, date_engagement, statut")
          .eq("fournisseur", supplierId!),
        supabase
          .from("budget_liquidations")
          .select("id, numero, montant, date_liquidation, statut, engagement_id")
          .eq("engagement_id", supplierId!), // This won't work directly, needs join
        supabase
          .from("contrats")
          .select("id, numero, montant_initial, montant_actuel, statut")
          .eq("prestataire_id", supplierId!),
      ]);

      return {
        engagements: engagements.data || [],
        contrats: ordonnancements.data || [],
        totalEngagements: engagements.data?.reduce((sum, e) => sum + (e.montant || 0), 0) || 0,
        totalContrats: ordonnancements.data?.reduce((sum, c) => sum + (c.montant_actuel || c.montant_initial || 0), 0) || 0,
      };
    },
    enabled: !!supplierId,
  });

  return { financials: data, isLoading };
}
