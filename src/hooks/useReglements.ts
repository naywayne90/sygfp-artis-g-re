import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useExercice } from "@/contexts/ExerciceContext";
import { useAuditLog } from "@/hooks/useAuditLog";

export const MODES_PAIEMENT = [
  { value: "virement", label: "Virement bancaire" },
  { value: "cheque", label: "Chèque" },
  { value: "especes", label: "Espèces" },
  { value: "mobile_money", label: "Mobile Money" },
];

// Documents requis pour le règlement
export const DOCUMENTS_REGLEMENT = [
  { type: "preuve_paiement", label: "Preuve de paiement", obligatoire: true },
  { type: "bordereau_virement", label: "Bordereau de virement", obligatoire: false },
  { type: "copie_cheque", label: "Copie du chèque", obligatoire: false },
  { type: "avis_credit", label: "Avis de crédit bancaire", obligatoire: false },
];

export interface CompteBancaire {
  id: string;
  code: string;
  libelle: string;
  banque: string | null;
  numero_compte: string | null;
  iban: string | null;
  solde_actuel: number | null;
  est_actif: boolean | null;
}

export interface ReglementFormData {
  ordonnancement_id: string;
  date_paiement: string;
  mode_paiement: string;
  reference_paiement?: string;
  compte_id?: string;
  compte_bancaire_arti?: string;
  banque_arti?: string;
  montant: number;
  observation?: string;
}

// Fallback comptes bancaires (utilisés si la table est vide)
export const COMPTES_BANCAIRES_ARTI = [
  { value: "SGBCI-001", label: "SGBCI - Compte Principal", banque: "SGBCI" },
  { value: "BICICI-001", label: "BICICI - Compte Courant", banque: "BICICI" },
  { value: "ECOBANK-001", label: "ECOBANK - Compte Opérations", banque: "ECOBANK" },
  { value: "BOA-001", label: "BOA - Compte Trésorerie", banque: "BOA" },
];

export function useReglements() {
  const queryClient = useQueryClient();
  const { exercice } = useExercice();
  const { logAction } = useAuditLog();

  // Récupérer les comptes bancaires actifs
  const { data: comptesBancaires = [] } = useQuery({
    queryKey: ["comptes-bancaires"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comptes_bancaires")
        .select("*")
        .eq("est_actif", true)
        .order("libelle", { ascending: true });

      if (error) throw error;
      return data as CompteBancaire[];
    },
  });

  // Récupérer les règlements
  const {
    data: reglements = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["reglements", exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reglements")
        .select(`
          *,
          ordonnancement:ordonnancements(
            id,
            numero,
            montant,
            beneficiaire,
            banque,
            rib,
            mode_paiement,
            objet,
            montant_paye,
            is_locked,
            liquidation:budget_liquidations(
              id,
              numero,
              montant,
              engagement:budget_engagements(
                id,
                numero,
                objet,
                fournisseur,
                montant,
                budget_line:budget_lines(
                  id,
                  code,
                  label
                )
              )
            )
          ),
          created_by_profile:profiles!reglements_created_by_fkey(
            id,
            first_name,
            last_name,
            full_name
          )
        `)
        .eq("exercice", exercice)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!exercice,
  });

  // Récupérer les ordonnancements validés disponibles pour règlement
  const { data: ordonnancementsValides = [] } = useQuery({
    queryKey: ["ordonnancements-valides-pour-reglement", exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ordonnancements")
        .select(`
          id,
          numero,
          montant,
          montant_paye,
          is_locked,
          beneficiaire,
          banque,
          rib,
          mode_paiement,
          objet,
          liquidation:budget_liquidations(
            id,
            numero,
            engagement:budget_engagements(
              id,
              numero,
              objet,
              fournisseur,
              budget_line:budget_lines(
                id,
                code,
                label
              )
            )
          )
        `)
        .eq("statut", "valide")
        .eq("exercice", exercice)
        .order("created_at", { ascending: false });

      if (error) throw error;
      // Filtrer pour ne garder que ceux qui ont un restant à payer > 0
      return (data || []).filter(ord => {
        const restant = (ord.montant || 0) - (ord.montant_paye || 0);
        return restant > 0;
      });
    },
    enabled: !!exercice,
  });

  // Calculer le restant à payer pour un ordonnancement
  const calculateReglementAvailability = async (ordonnancementId: string, currentReglementId?: string) => {
    // Récupérer l'ordonnancement
    const { data: ordonnancement, error: ordError } = await supabase
      .from("ordonnancements")
      .select("montant, montant_paye")
      .eq("id", ordonnancementId)
      .single();

    if (ordError) throw ordError;

    // Récupérer les règlements existants pour cet ordonnancement (sauf le courant si édition)
    let query = supabase
      .from("reglements")
      .select("id, montant")
      .eq("ordonnancement_id", ordonnancementId);

    if (currentReglementId) {
      query = query.not("id", "eq", currentReglementId);
    }

    const { data: existingReglements, error: regError } = await query;
    if (regError) throw regError;

    const totalPaye = (existingReglements || []).reduce(
      (sum, reg) => sum + (reg.montant || 0),
      0
    );

    return {
      montantOrdonnance: ordonnancement?.montant || 0,
      reglementsAnterieurs: totalPaye,
      restantAPayer: (ordonnancement?.montant || 0) - totalPaye,
    };
  };

  // Créer un règlement
  const createReglement = useMutation({
    mutationFn: async (data: ReglementFormData) => {
      // Vérifier la disponibilité
      const availability = await calculateReglementAvailability(data.ordonnancement_id);
      if (data.montant > availability.restantAPayer) {
        throw new Error(
          `Montant trop élevé. Restant à payer: ${availability.restantAPayer.toLocaleString("fr-FR")} FCFA`
        );
      }

      // Créer le règlement
      const { data: reglement, error } = await supabase
        .from("reglements")
        .insert({
          numero: "", // Auto-généré par trigger
          ordonnancement_id: data.ordonnancement_id,
          date_paiement: data.date_paiement,
          mode_paiement: data.mode_paiement,
          reference_paiement: data.reference_paiement || null,
          compte_bancaire_arti: data.compte_bancaire_arti,
          banque_arti: data.banque_arti,
          montant: data.montant,
          observation: data.observation || null,
          statut: "enregistre",
          exercice: exercice,
        })
        .select()
        .single();

      if (error) throw error;

      // Mettre à jour le montant_paye de l'ordonnancement
      const newMontantPaye = availability.reglementsAnterieurs + data.montant;
      const { data: ordonnancement } = await supabase
        .from("ordonnancements")
        .select("montant")
        .eq("id", data.ordonnancement_id)
        .single();

      const isFullyPaid = newMontantPaye >= (ordonnancement?.montant || 0);

      await supabase
        .from("ordonnancements")
        .update({
          montant_paye: newMontantPaye,
          is_locked: true, // Verrouiller dès le premier paiement partiel
        })
        .eq("id", data.ordonnancement_id);

      // Si complètement payé, marquer le dossier comme soldé (si lié)
      if (isFullyPaid) {
        // Récupérer l'ordonnancement avec sa chaîne
        const { data: ordData } = await supabase
          .from("ordonnancements")
          .select(`
            liquidation:budget_liquidations(
              engagement:budget_engagements(
                expression_besoin:expressions_besoin(
                  dossier_id
                )
              )
            )
          `)
          .eq("id", data.ordonnancement_id)
          .single();

        const dossierId = ordData?.liquidation?.engagement?.expression_besoin?.dossier_id;
        
        if (dossierId) {
          await supabase
            .from("dossiers")
            .update({
              statut_global: "solde",
              statut_paiement: "solde",
            })
            .eq("id", dossierId);
        }
      }

      return reglement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reglements"] });
      queryClient.invalidateQueries({ queryKey: ["ordonnancements"] });
      queryClient.invalidateQueries({ queryKey: ["ordonnancements-valides-pour-reglement"] });
      queryClient.invalidateQueries({ queryKey: ["dossiers"] });
      toast.success("Règlement enregistré avec succès");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de l'enregistrement");
    },
  });

  // Supprimer un règlement (annuler)
  const deleteReglement = useMutation({
    mutationFn: async (id: string) => {
      // Récupérer le règlement pour mettre à jour l'ordonnancement
      const { data: reglement, error: fetchError } = await supabase
        .from("reglements")
        .select("ordonnancement_id, montant")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      // Supprimer le règlement
      const { error } = await supabase
        .from("reglements")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Recalculer le montant_paye de l'ordonnancement
      const { data: remainingReglements } = await supabase
        .from("reglements")
        .select("montant")
        .eq("ordonnancement_id", reglement.ordonnancement_id);

      const newMontantPaye = (remainingReglements || []).reduce(
        (sum, reg) => sum + (reg.montant || 0),
        0
      );

      await supabase
        .from("ordonnancements")
        .update({
          montant_paye: newMontantPaye,
          is_locked: newMontantPaye > 0,
        })
        .eq("id", reglement.ordonnancement_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reglements"] });
      queryClient.invalidateQueries({ queryKey: ["ordonnancements"] });
      queryClient.invalidateQueries({ queryKey: ["ordonnancements-valides-pour-reglement"] });
      toast.success("Règlement annulé");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de l'annulation");
    },
  });

  // Récupérer les pièces jointes d'un règlement
  const getAttachments = async (reglementId: string) => {
    const { data, error } = await supabase
      .from("reglement_attachments")
      .select("*")
      .eq("reglement_id", reglementId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  };

  // Ajouter une pièce jointe
  const addAttachment = useMutation({
    mutationFn: async ({
      reglementId,
      file,
      documentType,
    }: {
      reglementId: string;
      file: File;
      documentType: string;
    }) => {
      // Upload du fichier
      const filePath = `reglements/${reglementId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Enregistrer dans la base
      const { error } = await supabase
        .from("reglement_attachments")
        .insert({
          reglement_id: reglementId,
          document_type: documentType,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reglements"] });
      toast.success("Pièce jointe ajoutée");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de l'upload");
    },
  });

  // Statistiques
  const stats = {
    total: reglements.length,
    totalMontant: reglements.reduce((sum, r) => sum + (r.montant || 0), 0),
    partiels: reglements.filter(r => {
      const ord = r.ordonnancement;
      return ord && (ord.montant_paye || 0) < (ord.montant || 0);
    }).length,
  };

  return {
    reglements,
    isLoading,
    error,
    ordonnancementsValides,
    comptesBancaires,
    createReglement,
    deleteReglement,
    calculateReglementAvailability,
    getAttachments,
    addAttachment,
    stats,
  };
}
