import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useExercice } from '@/contexts/ExerciceContext';
import { useAuditLog } from '@/hooks/useAuditLog';
import { checkValidationPermission } from '@/hooks/useCheckValidationPermission';
import { generateARTIReference, ETAPE_CODES } from '@/lib/notes-sef/referenceService';

export type TypeEngagement = 'sur_marche' | 'hors_marche';

// Extended budget_line with additional physical columns (for detail view)
export interface BudgetLineDetail {
  id: string;
  code: string;
  label: string;
  dotation_initiale: number;
  dotation_modifiee: number | null;
  total_engage: number | null;
  disponible_calcule: number | null;
  direction?: { id: string; label: string; sigle: string | null } | null;
  objectif_strategique?: { code: string; libelle: string } | null;
  mission?: { code: string; libelle: string } | null;
  action?: { code: string; libelle: string } | null;
  activite?: { code: string; libelle: string } | null;
  nomenclature_nbe?: { code: string; libelle: string } | null;
  plan_comptable_sysco?: { code: string; libelle: string } | null;
}

// Budget line movement (from RPC get_budget_line_movements)
export interface BudgetLineMovement {
  id: string;
  numero: string;
  objet: string;
  montant: number;
  fournisseur: string | null;
  statut: string;
  type_engagement: string;
  date_engagement: string;
  created_at: string;
  created_by_name: string | null;
  visa_saf_date: string | null;
  visa_cb_date: string | null;
  visa_daaf_date: string | null;
  visa_dg_date: string | null;
}

export interface Engagement {
  id: string;
  numero: string;
  objet: string;
  montant: number;
  montant_ht: number | null;
  tva: number | null;
  fournisseur: string | null;
  date_engagement: string;
  statut: string | null;
  workflow_status: string | null;
  current_step: number | null;
  budget_line_id: string;
  expression_besoin_id: string | null;
  marche_id: string | null;
  passation_marche_id: string | null;
  dossier_id: string | null;
  type_engagement: TypeEngagement;
  note_id: string | null;
  exercice: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  date_differe: string | null;
  motif_differe: string | null;
  differe_by: string | null;
  deadline_correction: string | null;
  required_documents: string[] | null;
  // Colonnes visa (remplies par trigger fn_audit_engagement_visa)
  visa_saf_user_id: string | null;
  visa_saf_date: string | null;
  visa_saf_commentaire: string | null;
  visa_cb_user_id: string | null;
  visa_cb_date: string | null;
  visa_cb_commentaire: string | null;
  visa_daaf_user_id: string | null;
  visa_daaf_date: string | null;
  visa_daaf_commentaire: string | null;
  visa_dg_user_id: string | null;
  visa_dg_date: string | null;
  visa_dg_commentaire: string | null;
  motif_rejet: string | null;
  // Colonnes dégagement (Prompt 8)
  montant_degage: number | null;
  motif_degage: string | null;
  degage_by: string | null;
  degage_at: string | null;
  // Joined data
  budget_line?: {
    id: string;
    code: string;
    label: string;
    dotation_initiale: number;
    direction?: { label: string; sigle: string | null } | null;
    objectif_strategique?: { code: string; libelle: string } | null;
    mission?: { code: string; libelle: string } | null;
    action?: { code: string; libelle: string } | null;
    activite?: { code: string; libelle: string } | null;
    nomenclature_nbe?: { code: string; libelle: string } | null;
    plan_comptable_sysco?: { code: string; libelle: string } | null;
  } | null;
  expression_besoin?: {
    id: string;
    numero: string | null;
    objet: string;
    marche?: {
      id: string;
      numero: string | null;
      prestataire?: {
        id: string;
        raison_sociale: string;
        rccm: string | null;
        adresse: string | null;
      } | null;
    } | null;
  } | null;
  marche?: {
    id: string;
    numero: string | null;
    objet: string;
    montant: number;
    prestataire?: {
      id: string;
      raison_sociale: string;
      rccm: string | null;
      adresse: string | null;
    } | null;
  } | null;
  creator?: { id: string; full_name: string | null } | null;
}

// Extended Engagement with validator profiles and full budget_line (for detail + PDF)
export interface EngagementDetail extends Engagement {
  budget_line?: BudgetLineDetail | null;
  prestataire_detail?: {
    id: string;
    raison_sociale: string;
    rccm: string | null;
    adresse: string | null;
    email: string | null;
    telephone: string | null;
  } | null;
  visa_saf_user?: { id: string; full_name: string | null } | null;
  visa_cb_user?: { id: string; full_name: string | null } | null;
  visa_daaf_user?: { id: string; full_name: string | null } | null;
  visa_dg_user?: { id: string; full_name: string | null } | null;
}

export interface BudgetAvailability {
  dotation_initiale: number;
  virements_recus: number;
  virements_emis: number;
  dotation_actuelle: number;
  engagements_anterieurs: number;
  engagement_actuel: number;
  cumul: number;
  disponible: number;
  is_sufficient: boolean;
}

// Type for expressions de besoin validated, with nested direction/marche relations
export interface ExpressionValidee {
  id: string;
  numero: string | null;
  objet: string;
  montant_estime: number | null;
  direction_id: string | null;
  dossier_id: string | null;
  direction: { id: string; label: string } | null;
  marche: {
    id: string;
    numero: string | null;
    objet: string;
    montant: number;
    mode_passation: string;
    prestataire: { id: string; raison_sociale: string; adresse: string | null } | null;
  } | null;
}

export const VALIDATION_STEPS = [
  {
    order: 1,
    role: 'SAF',
    label: 'Service Administratif et Financier',
    visaStatut: 'visa_saf',
    visaPrefix: 'visa_saf',
  },
  {
    order: 2,
    role: 'CB',
    label: 'Contrôleur Budgétaire',
    visaStatut: 'visa_cb',
    visaPrefix: 'visa_cb',
  },
  {
    order: 3,
    role: 'DAF',
    label: 'Directeur Administratif et Financier',
    visaStatut: 'visa_daaf',
    visaPrefix: 'visa_daaf',
  },
  { order: 4, role: 'DG', label: 'Directeur Général', visaStatut: 'valide', visaPrefix: 'visa_dg' },
];

// Statuts intermédiaires de validation (avant 'valide')
export const VALIDATION_STATUTS = ['soumis', 'visa_saf', 'visa_cb', 'visa_daaf'] as const;

// Détermine l'étape courante à partir du statut
export function getStepFromStatut(statut: string | null): number {
  switch (statut) {
    case 'soumis':
      return 1;
    case 'visa_saf':
      return 2;
    case 'visa_cb':
      return 3;
    case 'visa_daaf':
      return 4;
    default:
      return 0;
  }
}

// Vérifie la complétude des données obligatoires d'un engagement
export function checkEngagementCompleteness(engagement: Partial<Engagement>): {
  isComplete: boolean;
  missingFields: string[];
} {
  const missingFields: string[] = [];
  if (!engagement.objet) missingFields.push('Objet');
  if (!engagement.montant || engagement.montant <= 0) missingFields.push('Montant');
  if (!engagement.fournisseur) missingFields.push('Fournisseur');
  if (!engagement.budget_line_id) missingFields.push('Ligne budgétaire');
  return { isComplete: missingFields.length === 0, missingFields };
}

export function useEngagements() {
  const queryClient = useQueryClient();
  const { exercice } = useExercice();
  const { logAction } = useAuditLog();

  // Fetch all engagements
  const {
    data: engagements = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['engagements', exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_engagements')
        .select(
          `
          *,
          budget_line:budget_lines(
            id, code, label, dotation_initiale,
            direction:directions(label, sigle),
            objectif_strategique:objectifs_strategiques(code, libelle),
            mission:missions(code, libelle),
            action:actions(code, libelle),
            activite:activites(code, libelle),
            nomenclature_nbe(code, libelle),
            plan_comptable_sysco(code, libelle)
          ),
          expression_besoin:expressions_besoin(
            id, numero, objet,
            marche:marches!expressions_besoin_marche_id_fkey(
              id, numero,
              prestataire:prestataires(id, raison_sociale, rccm, adresse)
            )
          ),
          marche:marches(
            id, numero, objet, montant,
            prestataire:prestataires(id, raison_sociale, rccm, adresse)
          ),
          creator:profiles!budget_engagements_created_by_fkey(id, full_name)
        `
        )
        .eq('exercice', exercice)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as Engagement[];
    },
    enabled: !!exercice,
  });

  // Fetch validated passations de marché for creating engagements
  const { data: passationsValidees = [] } = useQuery({
    queryKey: ['passations-validees-pour-engagement', exercice],
    queryFn: async () => {
      const { data: pms, error } = await supabase
        .from('passation_marche')
        .select(
          `
          id, reference, mode_passation, montant_retenu, prestataire_retenu_id, dossier_id,
          expression_besoin:expressions_besoin(
            id, numero, objet, montant_estime, direction_id,
            direction:directions(id, label, sigle)
          ),
          prestataire_retenu:prestataires!passation_marche_prestataire_retenu_id_fkey(id, raison_sociale, adresse)
        `
        )
        .in('statut', ['approuve', 'signe'])
        .eq('exercice', exercice)
        .order('validated_at', { ascending: false });

      if (error) throw error;

      // Exclure celles déjà utilisées
      const { data: usedPMs } = await supabase
        .from('budget_engagements')
        .select('passation_marche_id')
        .not('passation_marche_id', 'is', null)
        .eq('exercice', exercice);

      const usedIds = new Set(usedPMs?.map((e) => e.passation_marche_id) || []);
      return pms?.filter((pm) => !usedIds.has(pm.id)) || [];
    },
    enabled: !!exercice,
  });

  // Fetch marchés signés/approuvés (passation_marche) for "sur_marche" engagements
  const { data: passationsSignees = [] } = useQuery({
    queryKey: ['passations-signees-pour-engagement', exercice],
    queryFn: async () => {
      const { data: pms, error } = await supabase
        .from('passation_marche')
        .select(
          `
          id, reference, mode_passation, montant_retenu, prestataire_retenu_id, dossier_id,
          statut, ligne_budgetaire_id,
          expression_besoin:expressions_besoin(
            id, numero, objet, montant_estime, direction_id,
            direction:directions(id, label, sigle)
          ),
          prestataire_retenu:prestataires!passation_marche_prestataire_retenu_id_fkey(
            id, raison_sociale, adresse
          )
        `
        )
        .in('statut', ['approuve', 'signe'])
        .eq('exercice', exercice)
        .order('signe_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      // Exclure celles déjà utilisées pour un engagement
      const { data: usedPMs } = await supabase
        .from('budget_engagements')
        .select('passation_marche_id')
        .not('passation_marche_id', 'is', null)
        .eq('exercice', exercice);

      const usedIds = new Set(usedPMs?.map((e) => e.passation_marche_id) || []);
      return pms?.filter((pm) => !usedIds.has(pm.id)) || [];
    },
    enabled: !!exercice,
  });

  // Fetch validated expressions de besoin for creating engagements (legacy)
  const { data: expressionsValidees = [] } = useQuery({
    queryKey: ['expressions-validees-pour-engagement', exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expressions_besoin')
        .select(
          `
          id, numero, objet, montant_estime, direction_id, dossier_id,
          direction:directions(id, label),
          marche:marches!expressions_besoin_marche_id_fkey(
            id, numero, objet, montant, mode_passation,
            prestataire:prestataires(id, raison_sociale, adresse)
          )
        `
        )
        .eq('statut', 'valide')
        .eq('exercice', exercice)
        .order('validated_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as ExpressionValidee[];
    },
    enabled: !!exercice,
  });

  // Calculate budget availability
  // Formula: Disponible = Dotation_initiale + Virements_recus - Virements_emis - Engages
  const calculateAvailability = useCallback(
    async (
      budgetLineId: string,
      currentAmount: number,
      excludeEngagementId?: string
    ): Promise<BudgetAvailability> => {
      // Get budget line dotation
      const { data: line, error: lineError } = await supabase
        .from('budget_lines')
        .select('dotation_initiale')
        .eq('id', budgetLineId)
        .single();

      if (lineError) throw lineError;

      const dotation_initiale = line?.dotation_initiale || 0;

      // Get executed credit transfers received (virements recus)
      const { data: recus, error: recusError } = await supabase
        .from('credit_transfers')
        .select('amount')
        .eq('to_budget_line_id', budgetLineId)
        .eq('status', 'execute');

      if (recusError) throw recusError;

      const virements_recus = recus?.reduce((sum, ct) => sum + (ct.amount || 0), 0) || 0;

      // Get executed credit transfers sent (virements emis)
      const { data: emis, error: emisError } = await supabase
        .from('credit_transfers')
        .select('amount')
        .eq('from_budget_line_id', budgetLineId)
        .eq('status', 'execute');

      if (emisError) throw emisError;

      const virements_emis = emis?.reduce((sum, ct) => sum + (ct.amount || 0), 0) || 0;

      // Dotation actuelle = initiale + recus - emis
      const dotation_actuelle = dotation_initiale + virements_recus - virements_emis;

      // Get previous engagements (exclude annule AND rejete from cumul)
      let query = supabase
        .from('budget_engagements')
        .select('id, montant')
        .eq('budget_line_id', budgetLineId)
        .eq('exercice', exercice || new Date().getFullYear())
        .neq('statut', 'annule')
        .neq('statut', 'rejete');

      if (excludeEngagementId) {
        query = query.neq('id', excludeEngagementId);
      }

      const { data: prevEngagements, error: engError } = await query;
      if (engError) throw engError;

      const engagements_anterieurs =
        prevEngagements?.reduce((sum, e) => sum + (e.montant || 0), 0) || 0;
      const cumul = engagements_anterieurs + currentAmount;
      const disponible = dotation_actuelle - cumul;

      return {
        dotation_initiale,
        virements_recus,
        virements_emis,
        dotation_actuelle,
        engagements_anterieurs,
        engagement_actuel: currentAmount,
        cumul,
        disponible,
        is_sufficient: disponible >= 0,
      };
    },
    [exercice]
  );

  // Generate engagement number using ARTI reference system
  // Format: ARTI05MMYYNNNN (code étape 05 = Engagement)
  const generateNumero = async (): Promise<string> => {
    return generateARTIReference(ETAPE_CODES.ENGAGEMENT);
  };

  // Create engagement
  const createMutation = useMutation({
    mutationFn: async (data: {
      type_engagement: TypeEngagement;
      expression_besoin_id: string;
      budget_line_id: string;
      objet: string;
      montant: number;
      montant_ht?: number;
      tva?: number;
      fournisseur: string;
      marche_id?: string;
      passation_marche_id?: string;
      dossier_id?: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Vérifier la disponibilité budgétaire avant création
      const availability = await calculateAvailability(data.budget_line_id, data.montant);
      if (!availability.is_sufficient) {
        throw new Error(
          `Disponible insuffisant : ${new Intl.NumberFormat('fr-FR').format(availability.disponible)} FCFA disponibles, ${new Intl.NumberFormat('fr-FR').format(data.montant)} FCFA demandés`
        );
      }

      const numero = await generateNumero();

      // Récupérer le dossier_id depuis l'expression de besoin si non fourni
      let dossierId = data.dossier_id;
      if (!dossierId && data.expression_besoin_id) {
        const { data: expr } = await supabase
          .from('expressions_besoin')
          .select('dossier_id')
          .eq('id', data.expression_besoin_id)
          .single();
        dossierId = expr?.dossier_id;
      }

      const { data: engagement, error } = await supabase
        .from('budget_engagements')
        .insert({
          numero,
          type_engagement: data.type_engagement,
          objet: data.objet,
          montant: data.montant,
          montant_ht: data.montant_ht || null,
          tva: data.tva || null,
          fournisseur: data.fournisseur,
          date_engagement: new Date().toISOString().split('T')[0],
          budget_line_id: data.budget_line_id,
          expression_besoin_id: data.expression_besoin_id,
          marche_id: data.marche_id || null,
          // NOTE: Les 2805 engagements legacy importés ont passation_marche_id=NULL
          // car il n'existait pas de mapping PM→Engagement dans l'ancien système.
          // Seuls les nouveaux engagements (2026+) auront cette FK renseignée.
          passation_marche_id: data.passation_marche_id || null,
          dossier_id: dossierId || null,
          exercice,
          statut: 'brouillon',
          workflow_status: 'en_attente',
          current_step: 0,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // NOTE: Les records engagement_validations sont créés automatiquement
      // par le trigger AFTER fn_audit_engagement_visa à chaque changement de statut.

      // Si lié à un dossier, créer une entrée dans dossier_etapes
      if (dossierId) {
        await supabase.from('dossier_etapes').insert({
          dossier_id: dossierId,
          type_etape: 'engagement',
          entity_id: engagement.id,
          montant: data.montant,
          statut: 'en_cours',
        });

        // Mettre à jour l'étape courante du dossier et le montant engagé
        await supabase
          .from('dossiers')
          .update({
            etape_courante: 'engagement',
            montant_engage: data.montant,
          })
          .eq('id', dossierId);
      }

      // NOTE: total_engage is NOT updated here at creation (brouillon).
      // It is updated by the SQL trigger fn_update_engagement_rate
      // only when the engagement reaches statut='valide' after workflow validation.

      await logAction({
        entityType: 'engagement',
        entityId: engagement.id,
        action: 'create',
        newValues: { numero, objet: data.objet, montant: data.montant },
      });

      return engagement;
    },
    onSuccess: (engagement) => {
      queryClient.invalidateQueries({ queryKey: ['engagements'] });
      queryClient.invalidateQueries({ queryKey: ['expressions-validees-pour-engagement'] });
      queryClient.invalidateQueries({ queryKey: ['passations-signees-pour-engagement'] });
      queryClient.invalidateQueries({ queryKey: ['passations-validees-pour-engagement'] });
      toast.success(`Engagement ${engagement.numero} créé`);
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de la creation de l'engagement", {
        description: error.message,
      });
    },
  });

  // Submit engagement for validation
  const submitMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('budget_engagements')
        .update({
          statut: 'soumis',
          workflow_status: 'en_validation',
          current_step: 1,
        })
        .eq('id', id);

      if (error) throw error;

      await logAction({
        entityType: 'engagement',
        entityId: id,
        action: 'submit',
      });

      // Notifier les validateurs SAF (étape 1)
      const { data: submittedEng } = await supabase
        .from('budget_engagements')
        .select('numero')
        .eq('id', id)
        .single();

      const { data: safUsers } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'SAF');

      if (safUsers?.length && submittedEng) {
        await supabase.from('notifications').insert(
          safUsers.map((u) => ({
            user_id: u.user_id,
            type: 'soumission',
            title: 'Engagement à valider',
            message: `L'engagement ${submittedEng.numero} a été soumis pour validation`,
            entity_type: 'engagement',
            entity_id: id,
          }))
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagements'] });
      toast.success('Engagement soumis pour validation');
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de la soumission de l'engagement", {
        description: error.message,
      });
    },
  });

  // Validate engagement step — aligned with trigger fn_validate_engagement_workflow
  const validateMutation = useMutation({
    mutationFn: async ({ id, comments }: { id: string; comments?: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Get current engagement with statut
      const { data: engagement, error: fetchError } = await supabase
        .from('budget_engagements')
        .select('statut, current_step, numero, created_by, budget_line_id, montant')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Déterminer l'étape depuis le statut (pas current_step)
      const stepNumber = getStepFromStatut(engagement?.statut);
      if (stepNumber === 0)
        throw new Error(`Statut "${engagement?.statut}" ne permet pas de validation`);

      const stepInfo = VALIDATION_STEPS[stepNumber - 1];
      if (!stepInfo) throw new Error(`Étape de validation ${stepNumber} invalide`);

      const isLastStep = stepNumber >= VALIDATION_STEPS.length;

      // Vérifier la permission via RPC unifiée
      const permCheck = await checkValidationPermission(user.id, 'engagements', stepInfo.role);
      if (!permCheck.isAllowed) {
        throw new Error(
          `Permission insuffisante pour l'étape ${stepInfo.role}. Vous devez avoir le rôle ${stepInfo.role}, une délégation active ou un intérim actif.`
        );
      }

      // Étape CB : contrôle des crédits
      if (stepInfo.role === 'CB' && engagement?.budget_line_id && engagement?.montant) {
        const availability = await calculateAvailability(
          engagement.budget_line_id,
          engagement.montant,
          id
        );
        if (!availability.is_sufficient) {
          throw new Error(
            `Crédits insuffisants : ${new Intl.NumberFormat('fr-FR').format(availability.disponible)} FCFA disponibles.`
          );
        }
      }

      // Construire les colonnes visa dynamiquement
      const now = new Date().toISOString();
      const visaColumns: Record<string, unknown> = {
        [`${stepInfo.visaPrefix}_user_id`]: user.id,
        [`${stepInfo.visaPrefix}_date`]: now,
        [`${stepInfo.visaPrefix}_commentaire`]: comments || null,
      };

      // Update engagement — le trigger impose la transition de statut
      const { error } = await supabase
        .from('budget_engagements')
        .update({
          statut: stepInfo.visaStatut,
          current_step: isLastStep ? stepNumber : stepNumber + 1,
          workflow_status: isLastStep ? 'termine' : 'en_validation',
          ...visaColumns,
        })
        .eq('id', id);

      if (error) throw error;

      // NOTE: Le trigger AFTER fn_audit_engagement_visa crée automatiquement
      // le record engagement_validations + audit_logs. Pas besoin de le faire ici.

      await logAction({
        entityType: 'engagement',
        entityId: id,
        action: 'validate',
        newValues: { step: stepNumber, role: stepInfo.role, comments },
      });

      // Notifications
      const valNotifs: Array<{
        user_id: string;
        type: string;
        title: string;
        message: string;
        entity_type: string;
        entity_id: string;
      }> = [];

      // Notifier le créateur
      if (engagement?.created_by) {
        valNotifs.push({
          user_id: engagement.created_by,
          type: 'validation',
          title: isLastStep ? 'Engagement validé' : `Visa ${stepInfo.role} accordé`,
          message: isLastStep
            ? `L'engagement ${engagement.numero} a été entièrement validé`
            : `Le visa ${stepInfo.role} de l'engagement ${engagement.numero} a été accordé`,
          entity_type: 'engagement',
          entity_id: id,
        });
      }

      // Notifier les validateurs de l'étape suivante
      if (!isLastStep) {
        const nextRole = VALIDATION_STEPS[stepNumber]?.role;
        if (nextRole) {
          const { data: nextUsers } = await supabase
            .from('user_roles')
            .select('user_id')
            .eq('role', nextRole);
          if (nextUsers?.length) {
            valNotifs.push(
              ...nextUsers.map((u) => ({
                user_id: u.user_id,
                type: 'validation',
                title: 'Engagement à valider',
                message: `L'engagement ${engagement?.numero} est en attente de visa ${nextRole}`,
                entity_type: 'engagement',
                entity_id: id,
              }))
            );
          }
        }
      }

      // Validation DG → notifier aussi les agents de la direction
      if (isLastStep && engagement?.budget_line_id) {
        const { data: blDir } = await supabase
          .from('budget_lines')
          .select('direction_id')
          .eq('id', engagement.budget_line_id)
          .single();
        if (blDir?.direction_id) {
          const { data: dirUsers } = await supabase
            .from('profiles')
            .select('id')
            .eq('direction_id', blDir.direction_id)
            .neq('id', engagement.created_by || '');
          if (dirUsers?.length) {
            valNotifs.push(
              ...dirUsers.map((u) => ({
                user_id: u.id,
                type: 'validation',
                title: 'Engagement validé',
                message: `L'engagement ${engagement.numero} de votre direction a été validé`,
                entity_type: 'engagement',
                entity_id: id,
              }))
            );
          }
        }
      }

      if (valNotifs.length > 0) {
        await supabase.from('notifications').insert(valNotifs);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagements'] });
      toast.success('Visa accordé');
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de la validation de l'engagement", {
        description: error.message,
      });
    },
  });

  // Reject engagement — aligned with trigger (tout statut → rejete)
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Get current engagement
      const { data: engagement } = await supabase
        .from('budget_engagements')
        .select('statut, current_step, numero, created_by, budget_line_id')
        .eq('id', id)
        .single();

      const stepNumber = getStepFromStatut(engagement?.statut);
      if (stepNumber === 0)
        throw new Error(`Statut "${engagement?.statut}" ne permet pas de rejet`);

      const stepInfo = VALIDATION_STEPS[stepNumber - 1];
      if (!stepInfo) throw new Error(`Étape de validation ${stepNumber} invalide`);

      // Vérifier la permission
      const permCheck = await checkValidationPermission(user.id, 'engagements', stepInfo.role);
      if (!permCheck.isAllowed) {
        throw new Error(`Permission insuffisante pour rejeter à l'étape ${stepInfo.role}.`);
      }

      // Update engagement — le trigger exige motif_rejet pour la transition vers rejete
      const { error } = await supabase
        .from('budget_engagements')
        .update({
          statut: 'rejete',
          workflow_status: 'rejete',
          motif_rejet: reason,
        })
        .eq('id', id);

      if (error) throw error;

      // NOTE: Le trigger AFTER fn_audit_engagement_visa crée automatiquement
      // le record engagement_validations. Pas besoin de le faire ici.

      await logAction({
        entityType: 'engagement',
        entityId: id,
        action: 'reject',
        newValues: { reason, step: stepNumber, role: stepInfo.role },
      });

      // Notifier le créateur + direction du rejet
      const rejectNotifs: Array<{
        user_id: string;
        type: string;
        title: string;
        message: string;
        entity_type: string;
        entity_id: string;
      }> = [];

      if (engagement?.created_by) {
        rejectNotifs.push({
          user_id: engagement.created_by,
          type: 'rejet',
          title: 'Engagement rejeté',
          message: `L'engagement ${engagement.numero} a été rejeté à l'étape ${stepInfo.role} : ${reason}`,
          entity_type: 'engagement',
          entity_id: id,
        });
      }

      // Notifier les agents de la direction
      if (engagement?.budget_line_id) {
        const { data: blDir } = await supabase
          .from('budget_lines')
          .select('direction_id')
          .eq('id', engagement.budget_line_id)
          .single();
        if (blDir?.direction_id) {
          const { data: dirUsers } = await supabase
            .from('profiles')
            .select('id')
            .eq('direction_id', blDir.direction_id)
            .neq('id', engagement.created_by || '');
          if (dirUsers?.length) {
            rejectNotifs.push(
              ...dirUsers.map((u) => ({
                user_id: u.id,
                type: 'rejet',
                title: 'Engagement rejeté',
                message: `L'engagement ${engagement.numero} de votre direction a été rejeté : ${reason}`,
                entity_type: 'engagement',
                entity_id: id,
              }))
            );
          }
        }
      }

      if (rejectNotifs.length > 0) {
        await supabase.from('notifications').insert(rejectNotifs);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagements'] });
      toast.success('Engagement rejeté');
    },
    onError: (error: Error) => {
      toast.error("Erreur lors du rejet de l'engagement", {
        description: error.message,
      });
    },
  });

  // Defer engagement
  const deferMutation = useMutation({
    mutationFn: async ({
      id,
      motif,
      dateReprise,
    }: {
      id: string;
      motif: string;
      dateReprise?: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Get current step pour déterminer le rôle requis
      const { data: engagement } = await supabase
        .from('budget_engagements')
        .select('current_step, numero, created_by')
        .eq('id', id)
        .single();

      const currentStep = engagement?.current_step || 1;
      const requiredRole = VALIDATION_STEPS[currentStep - 1]?.role;
      if (!requiredRole) throw new Error(`Étape de validation ${currentStep} invalide`);

      // Vérifier la permission via RPC unifiée
      const permCheck = await checkValidationPermission(user.id, 'engagements', requiredRole);
      if (!permCheck.isAllowed) {
        throw new Error(`Permission insuffisante pour différer à l'étape ${requiredRole}.`);
      }

      const { error } = await supabase
        .from('budget_engagements')
        .update({
          statut: 'differe',
          workflow_status: 'differe',
          motif_differe: motif,
          date_differe: new Date().toISOString(),
          deadline_correction: dateReprise || null,
          differe_by: user.id,
        })
        .eq('id', id);

      if (error) throw error;

      await logAction({
        entityType: 'engagement',
        entityId: id,
        action: 'defer',
        newValues: { motif, dateReprise },
      });

      // Notifier le créateur du report
      if (engagement?.created_by) {
        await supabase.from('notifications').insert({
          user_id: engagement.created_by,
          type: 'differe',
          title: 'Engagement différé',
          message: `L'engagement ${engagement.numero} a été différé : ${motif}`,
          entity_type: 'engagement',
          entity_id: id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagements'] });
      toast.success('Engagement différé');
    },
    onError: (error: Error) => {
      toast.error("Erreur lors du report de l'engagement", {
        description: error.message,
      });
    },
  });

  // Resume deferred engagement
  const resumeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('budget_engagements')
        .update({
          statut: 'soumis',
          workflow_status: 'en_validation',
          date_differe: null,
          motif_differe: null,
          deadline_correction: null,
          differe_by: null,
        })
        .eq('id', id);

      if (error) throw error;

      await logAction({
        entityType: 'engagement',
        entityId: id,
        action: 'resume',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagements'] });
      toast.success('Engagement repris');
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de la reprise de l'engagement", {
        description: error.message,
      });
    },
  });

  // Dégagement (total ou partiel) — DAAF/ADMIN uniquement (Prompt 8)
  const degageMutation = useMutation({
    mutationFn: async ({ id, montant, motif }: { id: string; montant: number; motif: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Récupérer l'engagement
      const { data: engagement, error: fetchError } = await supabase
        .from('budget_engagements')
        .select('statut, montant, montant_degage, budget_line_id, numero, created_by')
        .eq('id', id)
        .single();

      if (fetchError || !engagement) throw new Error('Engagement introuvable');

      if (engagement.statut !== 'valide')
        throw new Error('Seuls les engagements validés peuvent être dégagés');

      const montantRestant = engagement.montant - (engagement.montant_degage || 0);
      if (montant <= 0) throw new Error('Le montant à dégager doit être supérieur à 0');
      if (montant > montantRestant)
        throw new Error(
          `Le montant à dégager (${montant.toLocaleString('fr-FR')} FCFA) dépasse le montant restant (${montantRestant.toLocaleString('fr-FR')} FCFA)`
        );

      const nouveauMontantDegage = (engagement.montant_degage || 0) + montant;

      // Mettre à jour l'engagement — statut reste 'valide'
      const { error: updateError } = await supabase
        .from('budget_engagements')
        .update({
          montant_degage: nouveauMontantDegage,
          motif_degage: motif,
          degage_by: user.id,
          degage_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Restituer les crédits sur la ligne budgétaire
      if (engagement.budget_line_id) {
        const { data: budgetLine } = await supabase
          .from('budget_lines')
          .select('total_engage')
          .eq('id', engagement.budget_line_id)
          .single();

        if (budgetLine) {
          const newTotalEngage = Math.max(0, (budgetLine.total_engage || 0) - montant);
          await supabase
            .from('budget_lines')
            .update({ total_engage: newTotalEngage })
            .eq('id', engagement.budget_line_id);
        }
      }

      await logAction({
        entityType: 'engagement',
        entityId: id,
        action: 'degage',
        newValues: { montant, motif, total: nouveauMontantDegage >= engagement.montant },
      });

      // Notifier le créateur
      if (engagement.created_by) {
        const isTotal = nouveauMontantDegage >= engagement.montant;
        await supabase.from('notifications').insert({
          user_id: engagement.created_by,
          type: 'degagement',
          title: isTotal ? 'Dégagement total' : 'Dégagement partiel',
          message: `L'engagement ${engagement.numero} a été ${isTotal ? 'totalement dégagé' : `partiellement dégagé (${montant.toLocaleString('fr-FR')} FCFA)`} : ${motif}`,
          entity_type: 'engagement',
          entity_id: id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagements'] });
      queryClient.invalidateQueries({ queryKey: ['budget-lines'] });
      toast.success('Dégagement effectué avec succès');
    },
    onError: (error: Error) => {
      toast.error('Erreur lors du dégagement', {
        description: error.message,
      });
    },
  });

  // Update engagement (for locked fields with justification)
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
      justification,
    }: {
      id: string;
      data: Partial<Engagement>;
      justification?: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Get old values for audit
      const { data: oldEngagement } = await supabase
        .from('budget_engagements')
        .select('montant, fournisseur, budget_line_id')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('budget_engagements')
        .update(data as Record<string, unknown>)
        .eq('id', id);

      if (error) throw error;

      await logAction({
        entityType: 'engagement',
        entityId: id,
        action: 'update_locked_field',
        oldValues: oldEngagement,
        newValues: { ...data, justification },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagements'] });
      toast.success('Engagement mis à jour');
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de la mise a jour de l'engagement", {
        description: error.message,
      });
    },
  });

  // Get validation steps for an engagement
  const getValidationSteps = async (engagementId: string) => {
    const { data, error } = await supabase
      .from('engagement_validations')
      .select(
        `
        *,
        validator:profiles!engagement_validations_validated_by_fkey(full_name)
      `
      )
      .eq('engagement_id', engagementId)
      .order('step_order');

    if (error) throw error;
    return data;
  };

  // Filter helpers — inclut tous les statuts visa intermédiaires
  const engagementsAValider = engagements.filter((e) =>
    (VALIDATION_STATUTS as readonly string[]).includes(e.statut || '')
  );
  const engagementsValides = engagements.filter((e) => e.statut === 'valide');
  const engagementsRejetes = engagements.filter((e) => e.statut === 'rejete');
  const engagementsDifferes = engagements.filter((e) => e.statut === 'differe');

  return {
    engagements,
    engagementsAValider,
    engagementsValides,
    engagementsRejetes,
    engagementsDifferes,
    expressionsValidees,
    passationsValidees,
    passationsSignees,
    isLoading,
    error,
    calculateAvailability,
    generateNumero,
    getValidationSteps,
    createEngagement: createMutation.mutateAsync,
    submitEngagement: submitMutation.mutateAsync,
    validateEngagement: validateMutation.mutateAsync,
    rejectEngagement: rejectMutation.mutateAsync,
    deferEngagement: deferMutation.mutateAsync,
    resumeEngagement: resumeMutation.mutateAsync,
    updateEngagement: updateMutation.mutateAsync,
    degageEngagement: degageMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isSubmitting: submitMutation.isPending,
    isValidating: validateMutation.isPending,
    isDegaging: degageMutation.isPending,
  };
}

// ============================================================================
// Hook: Engagement detail with validator profiles (Prompt 7)
// JOINs: budget_lines(+direction+OS+mission+action), marches(+prestataire),
//         prestataire_detail, creator, visa_saf/cb/daaf/dg_user profiles
// ============================================================================
export function useEngagementDetail(engagementId: string | null) {
  return useQuery({
    queryKey: ['engagement-detail', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_engagements')
        .select(
          `
          *,
          budget_line:budget_lines(
            id, code, label, dotation_initiale, dotation_modifiee, total_engage, disponible_calcule,
            direction:directions(id, label, sigle),
            objectif_strategique:objectifs_strategiques(code, libelle),
            mission:missions(code, libelle),
            action:actions(code, libelle),
            activite:activites(code, libelle),
            nomenclature_nbe(code, libelle),
            plan_comptable_sysco(code, libelle)
          ),
          expression_besoin:expressions_besoin(
            id, numero, objet
          ),
          marche:marches(
            id, numero, objet, montant,
            prestataire:prestataires(id, raison_sociale, rccm, adresse)
          ),
          prestataire_detail:prestataires!budget_engagements_prestataire_id_fkey(
            id, raison_sociale, rccm, adresse, email, telephone
          ),
          creator:profiles!budget_engagements_created_by_fkey(id, full_name),
          visa_saf_user:profiles!budget_engagements_visa_saf_user_id_fkey(id, full_name),
          visa_cb_user:profiles!budget_engagements_visa_cb_user_id_fkey(id, full_name),
          visa_daaf_user:profiles!budget_engagements_visa_daaf_user_id_fkey(id, full_name),
          visa_dg_user:profiles!budget_engagements_visa_dg_user_id_fkey(id, full_name)
        `
        )
        .eq('id', engagementId as string)
        .single();

      if (error) throw error;
      return data as unknown as EngagementDetail;
    },
    enabled: !!engagementId,
  });
}

// ============================================================================
// Hook: Budget line movement history (Prompt 7)
// Uses RPC get_budget_line_movements(UUID, INT)
// ============================================================================
export function useBudgetLineMovements(budgetLineId: string | null, exercice?: number) {
  return useQuery({
    queryKey: ['budget-line-movements', budgetLineId, exercice],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_budget_line_movements', {
        p_budget_line_id: budgetLineId as string,
        p_exercice: exercice ?? null,
      });

      if (error) throw error;
      return (data || []) as unknown as BudgetLineMovement[];
    },
    enabled: !!budgetLineId,
  });
}

// ============================================================================
// Hook: Degagement (Prompt 8)
// Permet de degager partiellement ou totalement un engagement valide
// ============================================================================
export interface DegagementInput {
  engagementId: string;
  montant_degage: number;
  motif_degagement: string;
}

export function useDegagement() {
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();

  const degagementMutation = useMutation({
    mutationFn: async ({ engagementId, montant_degage, motif_degagement }: DegagementInput) => {
      // Fetch current engagement to validate
      const { data: current, error: fetchError } = await supabase
        .from('budget_engagements')
        .select('id, numero, montant, montant_degage, statut, budget_line_id')
        .eq('id', engagementId)
        .single();

      if (fetchError) throw fetchError;
      if (!current) throw new Error('Engagement introuvable');

      if (current.statut !== 'valide') {
        throw new Error('Seuls les engagements valides peuvent etre degages');
      }

      if (montant_degage <= 0) {
        throw new Error('Le montant de degagement doit etre superieur a 0');
      }

      if (montant_degage > current.montant) {
        throw new Error(
          `Le montant de degagement (${montant_degage}) ne peut pas depasser le montant de l'engagement (${current.montant})`
        );
      }

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifie');

      // Update engagement with degagement
      const { data, error } = await supabase
        .from('budget_engagements')
        .update({
          montant_degage,
          motif_degagement,
          date_degagement: new Date().toISOString(),
          degagement_user_id: user.id,
        })
        .eq('id', engagementId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['engagements'] });
      queryClient.invalidateQueries({ queryKey: ['engagement-detail', data.id] });
      queryClient.invalidateQueries({ queryKey: ['budget-indicators'] });
      queryClient.invalidateQueries({ queryKey: ['budget-line-movements'] });
      logAction(
        'engagement_degagement',
        'budget_engagements',
        data.id,
        { montant_degage: 0 },
        { montant_degage: data.montant_degage, motif_degagement: data.motif_degagement }
      );
      toast.success(
        `Degagement de ${new Intl.NumberFormat('fr-FR').format(data.montant_degage || 0)} FCFA enregistre`
      );
    },
    onError: (error: Error) => {
      toast.error(`Erreur degagement: ${error.message}`);
    },
  });

  return {
    degager: degagementMutation.mutate,
    degagerAsync: degagementMutation.mutateAsync,
    isDegaging: degagementMutation.isPending,
  };
}
