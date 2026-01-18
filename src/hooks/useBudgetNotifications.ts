/**
 * useBudgetNotifications - Hook pour gérer les notifications budgétaires
 *
 * Fonctionnalités:
 * - Liste avec filtres et pagination
 * - CRUD complet
 * - Workflow de validation
 * - Gestion des pièces jointes
 * - Export (CSV, Excel, PDF)
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { toast } from "sonner";
import { useCallback } from "react";

// ============================================
// TYPES
// ============================================

export interface BudgetNotification {
  id: string;
  reference: string;
  numero_ordre: number;
  exercice_id: string;
  annee: number;
  objet: string;
  montant: number;
  origine_fonds_id: string | null;
  origine_fonds_code: string | null;
  nature_depense: string | null;
  date_notification: string;
  date_reception: string | null;
  statut: NotificationStatut;
  validated_at: string | null;
  validated_by: string | null;
  rejection_reason: string | null;
  rejected_at: string | null;
  rejected_by: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  commentaire: string | null;
  // Enrichis par la vue
  exercice_libelle?: string;
  origine_fonds_libelle?: string;
  origine_fonds_type?: string;
  created_by_name?: string;
  validated_by_name?: string;
  attachments_count?: number;
}

export type NotificationStatut = "brouillon" | "soumis" | "valide" | "rejete" | "annule";

export interface NotificationFilters {
  statut?: NotificationStatut | "all";
  origine_fonds_id?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateNotificationData {
  objet: string;
  montant: number;
  origine_fonds_id?: string | null;
  origine_fonds_code?: string;
  nature_depense?: string;
  date_notification?: string;
  date_reception?: string;
  commentaire?: string;
}

export interface UpdateNotificationData extends Partial<CreateNotificationData> {
  id: string;
}

export interface EntityAttachment {
  id: string;
  entity_type: string;
  entity_id: string;
  filename: string;
  original_filename: string;
  file_type: string | null;
  file_size: number | null;
  file_url: string;
  checksum: string | null;
  category: string;
  description: string | null;
  uploaded_at: string;
  uploaded_by: string | null;
}

// Statuts avec labels et couleurs
export const NOTIFICATION_STATUTS: {
  value: NotificationStatut;
  label: string;
  color: string;
}[] = [
  { value: "brouillon", label: "Brouillon", color: "bg-gray-100 text-gray-800" },
  { value: "soumis", label: "Soumis", color: "bg-blue-100 text-blue-800" },
  { value: "valide", label: "Validé", color: "bg-green-100 text-green-800" },
  { value: "rejete", label: "Rejeté", color: "bg-red-100 text-red-800" },
  { value: "annule", label: "Annulé", color: "bg-orange-100 text-orange-800" },
];

// ============================================
// HOOK
// ============================================

export function useBudgetNotifications(filters?: NotificationFilters) {
  const { exercice, exerciceId } = useExercice();
  const queryClient = useQueryClient();

  // ============================================
  // QUERIES
  // ============================================

  // Liste des notifications
  const {
    data: notifications,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["budget-notifications", exerciceId, filters],
    queryFn: async () => {
      if (!exerciceId) return [];

      let query = supabase
        .from("budget_notifications")
        .select(`
          *,
          exercice:exercices_budgetaires(libelle),
          origine_fonds:funding_sources(libelle, type),
          created_by_profile:profiles!budget_notifications_created_by_fkey(full_name),
          validated_by_profile:profiles!budget_notifications_validated_by_fkey(full_name)
        `)
        .eq("exercice_id", exerciceId)
        .order("numero_ordre", { ascending: false });

      // Filtre par statut
      if (filters?.statut && filters.statut !== "all") {
        query = query.eq("statut", filters.statut);
      }

      // Filtre par origine
      if (filters?.origine_fonds_id) {
        query = query.eq("origine_fonds_id", filters.origine_fonds_id);
      }

      // Filtre par date
      if (filters?.dateFrom) {
        query = query.gte("date_notification", filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte("date_notification", filters.dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Enrichir et filtrer par recherche
      let result = (data || []).map((n: any) => ({
        ...n,
        exercice_libelle: n.exercice?.libelle,
        origine_fonds_libelle: n.origine_fonds?.libelle,
        origine_fonds_type: n.origine_fonds?.type,
        created_by_name: n.created_by_profile?.full_name,
        validated_by_name: n.validated_by_profile?.full_name,
      })) as BudgetNotification[];

      // Filtre recherche
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        result = result.filter(
          (n) =>
            n.reference.toLowerCase().includes(searchLower) ||
            n.objet.toLowerCase().includes(searchLower) ||
            n.nature_depense?.toLowerCase().includes(searchLower)
        );
      }

      return result;
    },
    enabled: !!exerciceId,
  });

  // Statistiques
  const { data: stats } = useQuery({
    queryKey: ["budget-notifications-stats", exerciceId],
    queryFn: async () => {
      if (!exerciceId) return null;

      const { data, error } = await supabase
        .from("budget_notifications")
        .select("statut, montant")
        .eq("exercice_id", exerciceId);

      if (error) throw error;

      const items = data || [];
      const byStatut: Record<string, { count: number; montant: number }> = {};

      items.forEach((n) => {
        if (!byStatut[n.statut]) {
          byStatut[n.statut] = { count: 0, montant: 0 };
        }
        byStatut[n.statut].count++;
        byStatut[n.statut].montant += n.montant || 0;
      });

      const totalMontant = items.reduce((sum, n) => sum + (n.montant || 0), 0);
      const valideMontant = byStatut["valide"]?.montant || 0;

      return {
        total: items.length,
        byStatut,
        totalMontant,
        valideMontant,
      };
    },
    enabled: !!exerciceId,
  });

  // ============================================
  // MUTATIONS
  // ============================================

  // Créer une notification
  const createNotification = useMutation({
    mutationFn: async (data: CreateNotificationData) => {
      if (!exerciceId || !exercice) {
        throw new Error("Aucun exercice sélectionné");
      }

      const { data: result, error } = await supabase
        .from("budget_notifications")
        .insert({
          exercice_id: exerciceId,
          annee: exercice,
          objet: data.objet.trim(),
          montant: data.montant,
          origine_fonds_id: data.origine_fonds_id || null,
          origine_fonds_code: data.origine_fonds_code || null,
          nature_depense: data.nature_depense?.trim() || null,
          date_notification: data.date_notification || new Date().toISOString().split("T")[0],
          date_reception: data.date_reception || null,
          commentaire: data.commentaire?.trim() || null,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result as BudgetNotification;
    },
    onSuccess: () => {
      toast.success("Notification budgétaire créée");
      queryClient.invalidateQueries({ queryKey: ["budget-notifications"] });
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Mettre à jour une notification
  const updateNotification = useMutation({
    mutationFn: async (data: UpdateNotificationData) => {
      const { id, ...updates } = data;

      const updateData: Record<string, any> = {};
      if (updates.objet) updateData.objet = updates.objet.trim();
      if (updates.montant !== undefined) updateData.montant = updates.montant;
      if (updates.origine_fonds_id !== undefined)
        updateData.origine_fonds_id = updates.origine_fonds_id;
      if (updates.origine_fonds_code !== undefined)
        updateData.origine_fonds_code = updates.origine_fonds_code;
      if (updates.nature_depense !== undefined)
        updateData.nature_depense = updates.nature_depense?.trim() || null;
      if (updates.date_notification)
        updateData.date_notification = updates.date_notification;
      if (updates.date_reception !== undefined)
        updateData.date_reception = updates.date_reception;
      if (updates.commentaire !== undefined)
        updateData.commentaire = updates.commentaire?.trim() || null;

      updateData.updated_by = (await supabase.auth.getUser()).data.user?.id;

      const { data: result, error } = await supabase
        .from("budget_notifications")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result as BudgetNotification;
    },
    onSuccess: () => {
      toast.success("Notification mise à jour");
      queryClient.invalidateQueries({ queryKey: ["budget-notifications"] });
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Soumettre pour validation
  const submitNotification = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("budget_notifications")
        .update({
          statut: "soumis",
          updated_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq("id", id)
        .eq("statut", "brouillon")
        .select()
        .single();

      if (error) throw error;
      return data as BudgetNotification;
    },
    onSuccess: () => {
      toast.success("Notification soumise pour validation");
      queryClient.invalidateQueries({ queryKey: ["budget-notifications"] });
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Valider
  const validateNotification = useMutation({
    mutationFn: async (id: string) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { data, error } = await supabase
        .from("budget_notifications")
        .update({
          statut: "valide",
          validated_at: new Date().toISOString(),
          validated_by: userId,
          updated_by: userId,
        })
        .eq("id", id)
        .eq("statut", "soumis")
        .select()
        .single();

      if (error) throw error;
      return data as BudgetNotification;
    },
    onSuccess: () => {
      toast.success("Notification validée");
      queryClient.invalidateQueries({ queryKey: ["budget-notifications"] });
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Rejeter
  const rejectNotification = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { data, error } = await supabase
        .from("budget_notifications")
        .update({
          statut: "rejete",
          rejection_reason: reason,
          rejected_at: new Date().toISOString(),
          rejected_by: userId,
          updated_by: userId,
        })
        .eq("id", id)
        .eq("statut", "soumis")
        .select()
        .single();

      if (error) throw error;
      return data as BudgetNotification;
    },
    onSuccess: () => {
      toast.success("Notification rejetée");
      queryClient.invalidateQueries({ queryKey: ["budget-notifications"] });
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Supprimer (soft delete via statut annulé)
  const deleteNotification = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("budget_notifications")
        .update({
          statut: "annule",
          updated_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq("id", id)
        .in("statut", ["brouillon", "rejete"]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Notification annulée");
      queryClient.invalidateQueries({ queryKey: ["budget-notifications"] });
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // ============================================
  // ATTACHMENTS
  // ============================================

  // Liste des pièces jointes d'une notification
  const getAttachments = useCallback(async (notificationId: string) => {
    const { data, error } = await supabase
      .from("entity_attachments")
      .select("*")
      .eq("entity_type", "budget_notification")
      .eq("entity_id", notificationId)
      .is("deleted_at", null)
      .order("uploaded_at", { ascending: false });

    if (error) throw error;
    return data as EntityAttachment[];
  }, []);

  // Ajouter une pièce jointe
  const addAttachment = useMutation({
    mutationFn: async ({
      notificationId,
      file,
      category = "document",
      description,
    }: {
      notificationId: string;
      file: File;
      category?: string;
      description?: string;
    }) => {
      // Upload via edge function R2
      const formData = new FormData();
      formData.append("file", file);
      formData.append("entityType", "budget_notification");
      formData.append("entityId", notificationId);

      const { data: uploadResult, error: uploadError } = await supabase.functions.invoke(
        "r2-storage",
        {
          body: formData,
        }
      );

      if (uploadError) throw uploadError;

      // Créer l'enregistrement
      const { data, error } = await supabase
        .from("entity_attachments")
        .insert({
          entity_type: "budget_notification",
          entity_id: notificationId,
          filename: uploadResult.filename,
          original_filename: file.name,
          file_type: file.type,
          file_size: file.size,
          file_url: uploadResult.url,
          checksum: uploadResult.checksum,
          category,
          description,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as EntityAttachment;
    },
    onSuccess: () => {
      toast.success("Pièce jointe ajoutée");
      queryClient.invalidateQueries({ queryKey: ["budget-notifications"] });
    },
    onError: (error: Error) => {
      toast.error("Erreur upload: " + error.message);
    },
  });

  // Supprimer une pièce jointe (soft delete)
  const deleteAttachment = useMutation({
    mutationFn: async (attachmentId: string) => {
      const { error } = await supabase
        .from("entity_attachments")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq("id", attachmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pièce jointe supprimée");
      queryClient.invalidateQueries({ queryKey: ["budget-notifications"] });
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // ============================================
  // HELPERS
  // ============================================

  const getStatutLabel = useCallback((statut: NotificationStatut): string => {
    return NOTIFICATION_STATUTS.find((s) => s.value === statut)?.label || statut;
  }, []);

  const getStatutColor = useCallback((statut: NotificationStatut): string => {
    return (
      NOTIFICATION_STATUTS.find((s) => s.value === statut)?.color ||
      "bg-gray-100 text-gray-800"
    );
  }, []);

  const formatMontant = useCallback((montant: number): string => {
    return new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";
  }, []);

  // Export CSV
  const exportToCSV = useCallback(() => {
    if (!notifications || notifications.length === 0) {
      toast.error("Aucune donnée à exporter");
      return;
    }

    const headers = [
      "Référence",
      "Date",
      "Objet",
      "Montant",
      "Origine des fonds",
      "Nature dépense",
      "Statut",
    ];

    const rows = notifications.map((n) => [
      n.reference,
      n.date_notification,
      n.objet,
      n.montant.toString(),
      n.origine_fonds_libelle || n.origine_fonds_code || "",
      n.nature_depense || "",
      getStatutLabel(n.statut),
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map((r) => r.map((c) => `"${c}"`).join(";")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `notifications_budgetaires_${exercice || ""}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success("Export CSV téléchargé");
  }, [notifications, exercice, getStatutLabel]);

  // ============================================
  // RETURN
  // ============================================

  return {
    // Data
    notifications,
    stats,
    isLoading,

    // Actions
    createNotification: createNotification.mutate,
    createNotificationAsync: createNotification.mutateAsync,
    updateNotification: updateNotification.mutate,
    updateNotificationAsync: updateNotification.mutateAsync,
    submitNotification: submitNotification.mutate,
    validateNotification: validateNotification.mutate,
    rejectNotification: rejectNotification.mutate,
    deleteNotification: deleteNotification.mutate,
    refetch,

    // Attachments
    getAttachments,
    addAttachment: addAttachment.mutate,
    addAttachmentAsync: addAttachment.mutateAsync,
    deleteAttachment: deleteAttachment.mutate,

    // Helpers
    getStatutLabel,
    getStatutColor,
    formatMontant,
    exportToCSV,

    // Loading states
    isCreating: createNotification.isPending,
    isUpdating: updateNotification.isPending,
    isSubmitting: submitNotification.isPending,
    isValidating: validateNotification.isPending,
    isRejecting: rejectNotification.isPending,
    isDeleting: deleteNotification.isPending,
    isUploadingAttachment: addAttachment.isPending,
  };
}

export default useBudgetNotifications;
